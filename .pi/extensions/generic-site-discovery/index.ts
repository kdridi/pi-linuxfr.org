import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { DEFAULT_MAX_BYTES, truncateHead, withFileMutationQueue } from "@earendil-works/pi-coding-agent";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Type } from "typebox";
import { chromium, type Page } from "playwright";

const DEFAULT_MAX_PAGES = 20;
const DEFAULT_MAX_DEPTH = 2;
const HARD_MAX_PAGES = 100;
const HARD_MAX_DEPTH = 5;
const NAVIGATION_TIMEOUT_MS = 15_000;
const MAX_SKIPPED_EXAMPLES = 200;
const MAX_LINKS_PER_PAGE = 200;
const BINARY_EXTENSIONS = new Set([
  ".7z",
  ".avi",
  ".bin",
  ".bmp",
  ".bz2",
  ".css",
  ".dmg",
  ".doc",
  ".docx",
  ".eot",
  ".exe",
  ".gif",
  ".gz",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".m4a",
  ".m4v",
  ".mov",
  ".mp3",
  ".mp4",
  ".ogg",
  ".otf",
  ".pdf",
  ".png",
  ".ppt",
  ".pptx",
  ".rar",
  ".svg",
  ".tar",
  ".tgz",
  ".ttf",
  ".wav",
  ".webm",
  ".webp",
  ".woff",
  ".woff2",
  ".xls",
  ".xlsx",
  ".xml",
  ".zip",
]);

const paramsSchema = Type.Object({
  rootUrl: Type.String({ description: "Root URL to explore, for example https://example.org" }),
  outputPath: Type.String({ description: "Markdown report path, relative to the project unless absolute" }),
  maxPages: Type.Optional(Type.Integer({ minimum: 1, maximum: HARD_MAX_PAGES, description: "Maximum pages to visit" })),
  maxDepth: Type.Optional(Type.Integer({ minimum: 0, maximum: HARD_MAX_DEPTH, description: "Maximum link depth from the root URL" })),
});

type LinkObservation = {
  href: string;
  text: string;
  rel?: string;
  area: string;
};

type FormObservation = {
  action: string;
  method: string;
  inputs: Array<{ name: string; type: string; placeholder: string; label: string }>;
  buttons: string[];
};

type AlternateObservation = {
  href: string;
  rel: string;
  type: string;
  title: string;
};

type PageObservation = {
  url: string;
  finalUrl: string;
  depth: number;
  title: string;
  metaDescription: string;
  headings: Record<"h1" | "h2" | "h3", string[]>;
  landmarks: string[];
  navLinks: LinkObservation[];
  links: LinkObservation[];
  forms: FormObservation[];
  alternates: AlternateObservation[];
  paginationHints: string[];
  contentSignals: string[];
  textLength: number;
  pageType: string;
  error?: string;
};

type SkippedUrl = {
  url: string;
  reason: string;
  from?: string;
};

type PatternGroup = {
  pattern: string;
  count: number;
  examples: string[];
};

type DiscoveryDetails = {
  reportPath: string;
  rootUrl: string;
  visitedCount: number;
  skippedCount: number;
  discoveredInternalLinks: number;
  patterns: PatternGroup[];
};

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "generic_site_discover",
    label: "Generic Site Discover",
    description:
      `Explore a public website with Playwright within strict page/depth limits and write a Markdown discovery report. ` +
      `The tool does not submit forms or perform authenticated actions. Tool result output is compact; full report is written to disk.`,
    promptSnippet: "Explore a bounded set of public website pages and write a Markdown discovery report",
    promptGuidelines: [
      "Use generic_site_discover when the user asks to map or understand a public website before designing site-specific collection tools.",
      "When using generic_site_discover, choose small maxPages and maxDepth values unless the user explicitly asks for broader exploration.",
    ],
    parameters: paramsSchema,

    async execute(_toolCallId, params, signal, onUpdate, ctx) {
      const root = normalizeRootUrl(params.rootUrl);
      const maxPages = clampInteger(params.maxPages ?? DEFAULT_MAX_PAGES, 1, HARD_MAX_PAGES);
      const maxDepth = clampInteger(params.maxDepth ?? DEFAULT_MAX_DEPTH, 0, HARD_MAX_DEPTH);
      const outputPath = resolve(ctx.cwd, stripAtPrefix(params.outputPath));
      const allowedHost = root.hostname;

      onUpdate?.({ content: [{ type: "text", text: `Starting bounded discovery of ${root.href}` }], details: {} });

      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({ ignoreHTTPSErrors: false });
      const page = await context.newPage();
      page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
      page.setDefaultTimeout(NAVIGATION_TIMEOUT_MS);

      const queue: Array<{ url: string; depth: number; from?: string }> = [{ url: root.href, depth: 0 }];
      const queued = new Set<string>([root.href]);
      const visited = new Set<string>();
      const pages: PageObservation[] = [];
      const skipped: SkippedUrl[] = [];
      const discoveredInternalLinks = new Set<string>();

      try {
        while (queue.length > 0 && pages.length < maxPages) {
          if (signal?.aborted) throw new Error("Discovery cancelled");

          const next = queue.shift()!;
          if (visited.has(next.url)) {
            addSkipped(skipped, { url: next.url, reason: "duplicate", from: next.from });
            continue;
          }

          visited.add(next.url);
          onUpdate?.({ content: [{ type: "text", text: `Visiting ${pages.length + 1}/${maxPages}: ${next.url}` }], details: {} });

          let observation: PageObservation;
          try {
            const response = await page.goto(next.url, { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT_MS });
            await page.waitForLoadState("networkidle", { timeout: 3_000 }).catch(() => undefined);
            observation = await observePage(page, page.url(), next.url, next.depth, response?.status());
          } catch (error) {
            observation = emptyPageObservation(next.url, next.depth, error instanceof Error ? error.message : String(error));
          }

          observation.pageType = guessPageType(observation, root.href);
          pages.push(observation);

          for (const link of observation.links) {
            const normalized = normalizeCandidateUrl(link.href, root.href);
            if (!normalized.ok) {
              addSkipped(skipped, { url: link.href, reason: normalized.reason, from: observation.finalUrl });
              continue;
            }

            const candidate = normalized.url;
            if (candidate.hostname !== allowedHost) {
              addSkipped(skipped, { url: candidate.href, reason: "external-host", from: observation.finalUrl });
              continue;
            }
            if (looksBinary(candidate)) {
              addSkipped(skipped, { url: candidate.href, reason: "binary-or-asset-url", from: observation.finalUrl });
              continue;
            }

            discoveredInternalLinks.add(candidate.href);

            if (visited.has(candidate.href) || queued.has(candidate.href)) {
              addSkipped(skipped, { url: candidate.href, reason: "duplicate", from: observation.finalUrl });
              continue;
            }
            if (next.depth + 1 > maxDepth) {
              addSkipped(skipped, { url: candidate.href, reason: "depth-exceeded", from: observation.finalUrl });
              continue;
            }

            queued.add(candidate.href);
            queue.push({ url: candidate.href, depth: next.depth + 1, from: observation.finalUrl });
          }
        }
      } finally {
        await context.close().catch(() => undefined);
        await browser.close().catch(() => undefined);
      }

      if (queue.length > 0) {
        for (const item of queue.slice(0, MAX_SKIPPED_EXAMPLES - skipped.length)) {
          addSkipped(skipped, { url: item.url, reason: "page-limit-reached", from: item.from });
        }
      }

      const patterns = groupUrlPatterns(pages.map((page) => page.finalUrl));
      const report = buildMarkdownReport({
        rootUrl: root.href,
        allowedHost,
        maxPages,
        maxDepth,
        generatedAt: new Date().toISOString(),
        pages,
        skipped,
        discoveredInternalLinks: [...discoveredInternalLinks].sort(),
        patterns,
      });

      await withFileMutationQueue(outputPath, async () => {
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, report, "utf8");
      });

      const summary = [
        `Discovery report written: ${outputPath}`,
        `Visited pages: ${pages.length}`,
        `Discovered internal links: ${discoveredInternalLinks.size}`,
        `Skipped URL examples: ${skipped.length}`,
        `Top URL patterns: ${patterns.slice(0, 5).map((pattern) => `${pattern.pattern} (${pattern.count})`).join(", ") || "none"}`,
      ].join("\n");

      const truncatedSummary = truncateHead(summary, { maxBytes: DEFAULT_MAX_BYTES, maxLines: 200 });

      return {
        content: [{ type: "text", text: truncatedSummary.content }],
        details: {
          reportPath: outputPath,
          rootUrl: root.href,
          visitedCount: pages.length,
          skippedCount: skipped.length,
          discoveredInternalLinks: discoveredInternalLinks.size,
          patterns: patterns.slice(0, 20),
        } satisfies DiscoveryDetails,
      };
    },
  });
}

async function observePage(page: Page, finalUrl: string, requestedUrl: string, depth: number, status?: number): Promise<PageObservation> {
  const observation = await page.evaluate(() => {
    const clean = (value: string | null | undefined) => (value ?? "").replace(/\s+/g, " ").trim();
    const attr = (element: Element, name: string) => clean(element.getAttribute(name));
    const absoluteHref = (value: string | null | undefined) => {
      if (!value) return "";
      try {
        return new URL(value, document.baseURI).href;
      } catch {
        return value;
      }
    };
    const areaFor = (element: Element) => {
      if (element.closest("nav")) return "nav";
      if (element.closest("header")) return "header";
      if (element.closest("footer")) return "footer";
      if (element.closest("main")) return "main";
      if (element.closest("aside")) return "aside";
      return "body";
    };
    const linkFor = (anchor: HTMLAnchorElement) => ({
      href: absoluteHref(anchor.getAttribute("href")),
      text: clean(anchor.innerText || anchor.getAttribute("aria-label") || anchor.getAttribute("title") || anchor.href).slice(0, 160),
      rel: attr(anchor, "rel") || undefined,
      area: areaFor(anchor),
    });

    const headings = {
      h1: [...document.querySelectorAll("h1")].map((element) => clean((element as HTMLElement).innerText)).filter(Boolean).slice(0, 20),
      h2: [...document.querySelectorAll("h2")].map((element) => clean((element as HTMLElement).innerText)).filter(Boolean).slice(0, 50),
      h3: [...document.querySelectorAll("h3")].map((element) => clean((element as HTMLElement).innerText)).filter(Boolean).slice(0, 50),
    };

    const landmarks = [...document.querySelectorAll("header, nav, main, aside, footer, [role]")]
      .map((element) => element.tagName.toLowerCase() + (attr(element, "role") ? `[role=${attr(element, "role")}]` : ""))
      .slice(0, 80);

    const links = [...document.querySelectorAll<HTMLAnchorElement>("a[href]")].map(linkFor).filter((link) => link.href);
    const navLinks = [...document.querySelectorAll<HTMLAnchorElement>("nav a[href], header a[href], [role='navigation'] a[href]")]
      .map(linkFor)
      .filter((link) => link.href)
      .slice(0, 80);

    const forms = [...document.querySelectorAll<HTMLFormElement>("form")].slice(0, 30).map((form) => {
      const labelsByFor = new Map<string, string>();
      for (const label of [...form.querySelectorAll<HTMLLabelElement>("label")]) {
        const htmlFor = label.htmlFor;
        if (htmlFor) labelsByFor.set(htmlFor, clean(label.innerText));
      }
      const inputs = [...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select")]
        .slice(0, 80)
        .map((input) => ({
          name: clean(input.getAttribute("name") || input.id),
          type: clean(input.getAttribute("type") || input.tagName.toLowerCase()).toLowerCase(),
          placeholder: clean(input.getAttribute("placeholder")),
          label: input.id ? labelsByFor.get(input.id) ?? "" : "",
        }));
      const buttons = [...form.querySelectorAll<HTMLButtonElement | HTMLInputElement>("button, input[type='submit'], input[type='button']")]
        .map((button) => clean((button as HTMLButtonElement).innerText || button.getAttribute("value") || button.getAttribute("aria-label")))
        .filter(Boolean)
        .slice(0, 20);
      return {
        action: absoluteHref(form.getAttribute("action")) || document.location.href,
        method: clean(form.getAttribute("method") || "get").toLowerCase(),
        inputs,
        buttons,
      };
    });

    const alternates = [...document.querySelectorAll<HTMLLinkElement>("link[rel~='alternate'], link[type*='rss'], link[type*='atom'], link[type*='json']")]
      .map((link) => ({ href: absoluteHref(link.getAttribute("href")), rel: attr(link, "rel"), type: attr(link, "type"), title: attr(link, "title") }))
      .filter((link) => link.href)
      .slice(0, 50);

    const paginationHints = [
      ...[...document.querySelectorAll<HTMLLinkElement>("link[rel='next'], link[rel='prev']")].map((link) => `${attr(link, "rel")}: ${absoluteHref(link.getAttribute("href"))}`),
      ...links
        .filter((link) => /\b(next|previous|prev|older|newer|suivant|précédent|precedent)\b/i.test(link.text) || /\bnext|prev\b/i.test(link.rel ?? ""))
        .slice(0, 20)
        .map((link) => `${link.text || link.rel}: ${link.href}`),
    ];

    const contentSignals = new Set<string>();
    if (document.querySelector("article")) contentSignals.add("article-element");
    if (document.querySelector("main")) contentSignals.add("main-element");
    if (document.querySelector("[class*='comment' i], [id*='comment' i]")) contentSignals.add("comments-like-area");
    if (document.querySelector("time, [datetime]")) contentSignals.add("date-or-time-metadata");
    if (document.querySelector("[rel='author'], [class*='author' i]")) contentSignals.add("author-like-metadata");
    if (forms.length > 0) contentSignals.add("forms-present");
    if (paginationHints.length > 0) contentSignals.add("pagination-present");

    return {
      title: clean(document.title),
      metaDescription: clean(document.querySelector<HTMLMetaElement>("meta[name='description'], meta[property='og:description']")?.content),
      headings,
      landmarks,
      navLinks,
      links,
      forms,
      alternates,
      paginationHints,
      contentSignals: [...contentSignals],
      textLength: clean(document.body?.innerText).length,
    };
  });

  return {
    url: requestedUrl,
    finalUrl,
    depth,
    title: observation.title,
    metaDescription: observation.metaDescription,
    headings: observation.headings,
    landmarks: observation.landmarks,
    navLinks: observation.navLinks,
    links: observation.links.slice(0, MAX_LINKS_PER_PAGE),
    forms: observation.forms,
    alternates: observation.alternates,
    paginationHints: status ? [`HTTP status: ${status}`, ...observation.paginationHints] : observation.paginationHints,
    contentSignals: observation.contentSignals,
    textLength: observation.textLength,
    pageType: "unknown",
  };
}

function emptyPageObservation(url: string, depth: number, error: string): PageObservation {
  return {
    url,
    finalUrl: url,
    depth,
    title: "",
    metaDescription: "",
    headings: { h1: [], h2: [], h3: [] },
    landmarks: [],
    navLinks: [],
    links: [],
    forms: [],
    alternates: [],
    paginationHints: [],
    contentSignals: [],
    textLength: 0,
    pageType: "error",
    error,
  };
}

function normalizeRootUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Unsupported root URL protocol: ${url.protocol}`);
  }
  url.hash = "";
  if (url.pathname === "") url.pathname = "/";
  return url;
}

function normalizeCandidateUrl(href: string, base: string): { ok: true; url: URL } | { ok: false; reason: string } {
  if (!href.trim()) return { ok: false, reason: "empty-url" };
  let url: URL;
  try {
    url = new URL(href, base);
  } catch {
    return { ok: false, reason: "invalid-url" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "unsupported-protocol" };
  }
  url.hash = "";
  url.searchParams.sort();
  return { ok: true, url };
}

function looksBinary(url: URL): boolean {
  const pathname = url.pathname.toLowerCase();
  for (const extension of BINARY_EXTENSIONS) {
    if (pathname.endsWith(extension)) return true;
  }
  return false;
}

function stripAtPrefix(path: string): string {
  return path.startsWith("@") ? path.slice(1) : path;
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function addSkipped(skipped: SkippedUrl[], item: SkippedUrl) {
  if (skipped.length < MAX_SKIPPED_EXAMPLES) skipped.push(item);
}

function guessPageType(page: PageObservation, rootUrl: string): string {
  if (page.error) return "error";
  if (sameUrlWithoutTrailingSlash(page.finalUrl, rootUrl)) return "home";
  const hasSearchForm = page.forms.some((form) =>
    form.method === "get" && form.inputs.some((input) => /search|query|q/i.test(`${input.name} ${input.placeholder} ${input.label}`)),
  );
  if (hasSearchForm) return "search-or-filter";
  const hasLoginForm = page.forms.some((form) => form.inputs.some((input) => input.type === "password"));
  if (hasLoginForm) return "login-or-auth-boundary";
  if (page.paginationHints.length > 0) return "listing";
  if (page.contentSignals.includes("article-element") || (page.headings.h1.length === 1 && page.textLength > 1500)) return "detail";
  if (page.links.length >= 30) return "listing";
  return "unknown";
}

function sameUrlWithoutTrailingSlash(left: string, right: string): boolean {
  return left.replace(/\/$/, "") === right.replace(/\/$/, "");
}

function groupUrlPatterns(urls: string[]): PatternGroup[] {
  const groups = new Map<string, string[]>();
  for (const raw of urls) {
    const url = new URL(raw);
    const pattern = url.pathname
      .split("/")
      .map((segment) => {
        if (!segment) return segment;
        if (/^\d+$/.test(segment)) return ":number";
        if (/^[0-9a-f]{8,}$/i.test(segment)) return ":id";
        if (segment.length > 24 || /^[a-z0-9]+(?:-[a-z0-9]+){2,}$/i.test(segment)) return ":slug";
        return segment;
      })
      .join("/") || "/";
    const key = url.search ? `${pattern}?query` : pattern;
    const examples = groups.get(key) ?? [];
    examples.push(raw);
    groups.set(key, examples);
  }

  return [...groups.entries()]
    .map(([pattern, examples]) => ({ pattern, count: examples.length, examples: examples.slice(0, 5) }))
    .sort((a, b) => b.count - a.count || a.pattern.localeCompare(b.pattern));
}

function buildMarkdownReport(input: {
  rootUrl: string;
  allowedHost: string;
  maxPages: number;
  maxDepth: number;
  generatedAt: string;
  pages: PageObservation[];
  skipped: SkippedUrl[];
  discoveredInternalLinks: string[];
  patterns: PatternGroup[];
}): string {
  const sections = groupSections(input.discoveredInternalLinks);
  const navLinks = uniqueLinks(input.pages.flatMap((page) => page.navLinks));
  const pageTypes = groupPagesByType(input.pages);
  const forms = input.pages.flatMap((page) => page.forms.map((form) => ({ page: page.finalUrl, form })));
  const alternates = input.pages.flatMap((page) => page.alternates.map((alternate) => ({ page: page.finalUrl, alternate })));

  return [
    `# Website Discovery Report: ${input.allowedHost}`,
    "",
    "## Summary",
    "",
    `This report was generated by a bounded Playwright exploration starting from ${input.rootUrl}.`,
    `It visited ${input.pages.length} page(s), discovered ${input.discoveredInternalLinks.length} internal link(s), and recorded ${input.skipped.length} skipped URL example(s).`,
    "",
    "## Exploration settings",
    "",
    `- Root URL: ${input.rootUrl}`,
    `- Allowed hostname: ${input.allowedHost}`,
    `- Max pages: ${input.maxPages}`,
    `- Max depth: ${input.maxDepth}`,
    `- Date: ${input.generatedAt}`,
    `- Forms submitted: no`,
    "",
    "## Main navigation",
    "",
    navLinks.length > 0 ? renderLinkList(navLinks.slice(0, 50)) : "No main navigation links were detected.",
    "",
    "## Discovered sections",
    "",
    sections.length > 0 ? sections.map((section) => `- ${section.name}: ${section.count} link(s), examples: ${section.examples.join(", ")}`).join("\n") : "No sections were detected.",
    "",
    "## URL patterns",
    "",
    input.patterns.length > 0 ? input.patterns.map((pattern) => `- \`${pattern.pattern}\`: ${pattern.count} page(s); examples: ${pattern.examples.join(", ")}`).join("\n") : "No URL patterns were detected.",
    "",
    "## Page types",
    "",
    renderPageTypes(pageTypes),
    "",
    "## Forms and interactions",
    "",
    forms.length > 0 ? renderForms(forms) : "No forms were detected on visited pages.",
    "",
    "## Feeds and alternative formats",
    "",
    alternates.length > 0 ? renderAlternates(alternates) : "No alternate feeds or formats were detected on visited pages.",
    "",
    "## Candidate future tools",
    "",
    renderCandidateTools(pageTypes, forms, alternates),
    "",
    "## Risks and unknowns",
    "",
    "- This is a bounded sample, not an exhaustive crawl.",
    "- Selectors and page type guesses are heuristic.",
    "- Dynamic content loaded after the short wait budget may be missing.",
    "- Authentication boundaries were not crossed and forms were not submitted.",
    "",
    "## Raw observations",
    "",
    renderRawObservations(input.pages, input.skipped),
    "",
  ].join("\n");
}

function groupSections(urls: string[]) {
  const groups = new Map<string, string[]>();
  for (const raw of urls) {
    const url = new URL(raw);
    const firstSegment = url.pathname.split("/").filter(Boolean)[0] ?? "/";
    const examples = groups.get(firstSegment) ?? [];
    examples.push(raw);
    groups.set(firstSegment, examples);
  }
  return [...groups.entries()]
    .map(([name, examples]) => ({ name, count: examples.length, examples: examples.slice(0, 5) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function uniqueLinks(links: LinkObservation[]): LinkObservation[] {
  const seen = new Set<string>();
  const result: LinkObservation[] = [];
  for (const link of links) {
    const key = `${link.href}\n${link.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(link);
  }
  return result;
}

function groupPagesByType(pages: PageObservation[]) {
  const groups = new Map<string, PageObservation[]>();
  for (const page of pages) {
    const list = groups.get(page.pageType) ?? [];
    list.push(page);
    groups.set(page.pageType, list);
  }
  return [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
}

function renderLinkList(links: LinkObservation[]): string {
  return links.map((link) => `- [${escapeMarkdown(link.text || link.href)}](${link.href})${link.area ? ` (${link.area})` : ""}`).join("\n");
}

function renderPageTypes(pageTypes: Array<[string, PageObservation[]]>): string {
  if (pageTypes.length === 0) return "No page types were detected.";
  return pageTypes
    .map(([type, pages]) => {
      const examples = pages.slice(0, 5).map((page) => `  - ${page.finalUrl}`).join("\n");
      const commonHeadings = topValues(pages.flatMap((page) => [...page.headings.h1, ...page.headings.h2]), 8);
      const signals = topValues(pages.flatMap((page) => page.contentSignals), 8);
      return [
        `### Page type: ${type}`,
        "",
        `- Count: ${pages.length}`,
        `- Example URLs:`,
        examples || "  - None",
        `- Common headings/signals: ${[...commonHeadings, ...signals].join(", ") || "none"}`,
        `- Pagination: ${pages.some((page) => page.paginationHints.length > 0) ? "detected on at least one page" : "not detected"}`,
      ].join("\n");
    })
    .join("\n\n");
}

function renderForms(forms: Array<{ page: string; form: FormObservation }>): string {
  return forms
    .map(({ page, form }) => {
      const inputs = form.inputs.map((input) => `${input.name || "(unnamed)"}:${input.type}`).join(", ") || "none";
      const buttons = form.buttons.join(", ") || "none";
      return [`- Page: ${page}`, `  - Method: ${form.method}`, `  - Action: ${form.action || "(same page)"}`, `  - Inputs: ${inputs}`, `  - Buttons: ${buttons}`].join("\n");
    })
    .join("\n");
}

function renderAlternates(alternates: Array<{ page: string; alternate: AlternateObservation }>): string {
  return alternates
    .map(({ page, alternate }) => `- Page: ${page}\n  - ${alternate.rel || "alternate"} ${alternate.type || ""} ${alternate.title || ""}: ${alternate.href}`)
    .join("\n");
}

function renderCandidateTools(pageTypes: Array<[string, PageObservation[]]>, forms: Array<{ page: string; form: FormObservation }>, alternates: Array<{ page: string; alternate: AlternateObservation }>): string {
  const lines = [
    "- Generic page collector: download selected discovered URLs and store raw HTML with metadata.",
    "- Raw dataset query tool: list collected pages and search titles, headings, and URLs.",
    "- Markdown wiki updater: summarize selected raw pages into cited notes.",
  ];
  if (pageTypes.some(([type]) => type === "listing")) {
    lines.push("- Listing collector: collect listing pages and extract links to detail pages.");
  }
  if (pageTypes.some(([type]) => type === "detail")) {
    lines.push("- Detail extractor: extract title, metadata, main content, comments, and source URL from detail pages.");
  }
  if (forms.length > 0) {
    lines.push("- Form-aware discovery helper: inspect search/filter forms without submitting unsafe actions.");
  }
  if (alternates.length > 0) {
    lines.push("- Feed collector: collect RSS/Atom or alternate formats discovered in page metadata.");
  }
  return lines.join("\n");
}

function renderRawObservations(pages: PageObservation[], skipped: SkippedUrl[]): string {
  const visited = pages
    .map((page) => {
      const headings = [...page.headings.h1, ...page.headings.h2].slice(0, 8).join("; ") || "none";
      const forms = page.forms.length;
      const links = page.links.length;
      const error = page.error ? `\n  - Error: ${page.error}` : "";
      return [`### ${page.finalUrl}`, "", `- Requested URL: ${page.url}`, `- Depth: ${page.depth}`, `- Type guess: ${page.pageType}`, `- Title: ${page.title || "(none)"}`, `- Headings: ${headings}`, `- Links observed: ${links}`, `- Forms observed: ${forms}`, `- Landmarks: ${page.landmarks.join(", ") || "none"}${error}`].join("\n");
    })
    .join("\n\n");

  const skippedText = skipped.length > 0 ? skipped.map((item) => `- ${item.url} (${item.reason}${item.from ? `, from ${item.from}` : ""})`).join("\n") : "No skipped URL examples were recorded.";
  return `${visited}\n\n### Skipped URL examples\n\n${skippedText}`;
}

function topValues(values: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const value of values.map((item) => item.trim()).filter(Boolean)) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value]) => value);
}

function escapeMarkdown(value: string): string {
  return value.replace(/[\[\]]/g, "\\$&");
}
