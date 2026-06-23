import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { LinuxFrMetadataEntry } from "../linuxfr/metadata";
import { datasetPaths, ensureDatasetLayout, readMetadataEntries, toRelativePath } from "../linuxfr/storage";

const EXCERPT_LENGTH = 700;

const paramsSchema = Type.Object({
  sourcePaths: Type.Optional(Type.Array(Type.String({ description: "Local raw source paths to use" }))),
  sourceUrls: Type.Optional(Type.Array(Type.String({ description: "Source URLs to use" }))),
  notePath: Type.Optional(Type.String({ description: "Target note path under data/wiki/notes or explicit relative path" })),
  topic: Type.Optional(Type.String({ description: "Wiki note topic" })),
});

type UpdateWikiParams = {
  sourcePaths?: string[];
  sourceUrls?: string[];
  notePath?: string;
  topic?: string;
};

type SelectedSource = {
  entry: LinuxFrMetadataEntry;
  excerpt: string;
};

export function registerUpdateWikiTool(pi: ExtensionAPI) {
  pi.registerTool({
    name: "linuxfr_update_wiki",
    label: "LinuxFr Update Wiki",
    description: "Create or update lightweight cited Markdown notes from collected raw sources.",
    promptSnippet: "Update the local LinuxFr Markdown wiki from raw sources",
    parameters: paramsSchema,
    async execute(_toolCallId, params: UpdateWikiParams, _signal, _onUpdate, ctx) {
      const paths = datasetPaths(ctx.cwd);
      await ensureDatasetLayout(paths);

      if (!hasSelections(params)) {
        return {
          content: [
            {
              type: "text",
              text: "No raw source selected. Use linuxfr_query_raw to find collected sources, then call linuxfr_update_wiki with sourcePaths or sourceUrls.",
            },
          ],
          details: { updated: false, reason: "no-source-selection" },
        };
      }

      const entries = latestEntriesBySource(await readMetadataEntries(paths.metadataPath));
      const selectedEntries = selectEntries(ctx.cwd, entries, params);
      if (selectedEntries.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No collected raw source matched the provided sourcePaths or sourceUrls. Use linuxfr_query_raw to inspect available sources.",
            },
          ],
          details: { updated: false, reason: "no-matching-sources", filters: { sourcePaths: params.sourcePaths, sourceUrls: params.sourceUrls } },
        };
      }

      const selectedSources = await readSelectedSources(ctx.cwd, selectedEntries);
      const title = noteTitle(params, selectedSources);
      const notePath = resolveNotePath(ctx.cwd, paths.wikiNotesDir, params.notePath, title);
      const relativeNotePath = toRelativePath(ctx.cwd, notePath);
      const content = renderNote(title, selectedSources);
      await mkdir(dirname(notePath), { recursive: true });
      await writeFile(notePath, content, "utf8");

      await updateIndex(paths.wikiIndexPath, relative(dirname(paths.wikiIndexPath), notePath), title, selectedSources.length);

      const sourceRefs = selectedSources.map((source) => ({
        url: source.entry.canonicalUrl || source.entry.url,
        sourceUrl: source.entry.url,
        localPath: source.entry.localPath,
        title: source.entry.title,
        type: source.entry.type,
        format: source.entry.format,
      }));

      return {
        content: [
          {
            type: "text",
            text: `Updated LinuxFr wiki note ${relativeNotePath} from ${selectedSources.length} raw source(s). Updated index data/wiki/index.md.`,
          },
        ],
        details: {
          updated: true,
          notePath: relativeNotePath,
          indexPath: "data/wiki/index.md",
          sources: sourceRefs,
        },
      };
    },
  });
}

function hasSelections(params: UpdateWikiParams): boolean {
  return Boolean(params.sourcePaths?.length || params.sourceUrls?.length);
}

function latestEntriesBySource(entries: LinuxFrMetadataEntry[]): LinuxFrMetadataEntry[] {
  const byKey = new Map<string, LinuxFrMetadataEntry>();
  for (const entry of entries) {
    const key = `${entry.canonicalUrl}\n${entry.format}`;
    const previous = byKey.get(key);
    if (!previous || entry.fetchedAt >= previous.fetchedAt) byKey.set(key, entry);
  }
  return Array.from(byKey.values()).sort((left, right) => right.fetchedAt.localeCompare(left.fetchedAt));
}

function selectEntries(cwd: string, entries: LinuxFrMetadataEntry[], params: UpdateWikiParams): LinuxFrMetadataEntry[] {
  const sourcePaths = new Set((params.sourcePaths ?? []).map((path) => normalizePath(toRelativePath(cwd, path))));
  const sourceUrls = new Set((params.sourceUrls ?? []).map(normalizeUrl));
  const selected: LinuxFrMetadataEntry[] = [];

  for (const entry of entries) {
    const pathMatches = sourcePaths.has(normalizePath(entry.localPath));
    const urlMatches = sourceUrls.has(normalizeUrl(entry.url)) || sourceUrls.has(normalizeUrl(entry.canonicalUrl));
    if (pathMatches || urlMatches) selected.push(entry);
  }

  return selected;
}

async function readSelectedSources(cwd: string, entries: LinuxFrMetadataEntry[]): Promise<SelectedSource[]> {
  const sources: SelectedSource[] = [];
  for (const entry of entries) {
    const rawText = await readFile(join(cwd, entry.localPath), "utf8");
    sources.push({ entry, excerpt: excerptFor(entry, rawText) });
  }
  return sources;
}

function noteTitle(params: UpdateWikiParams, sources: SelectedSource[]): string {
  if (params.topic?.trim()) return params.topic.trim();
  const firstTitle = sources[0]?.entry.title?.trim();
  if (firstTitle) return firstTitle;
  return "LinuxFr collected sources";
}

function resolveNotePath(cwd: string, wikiNotesDir: string, requestedPath: string | undefined, title: string): string {
  const fileName = requestedPath?.trim() || `${slugify(title)}.md`;
  const withExtension = fileName.endsWith(".md") ? fileName : `${fileName}.md`;
  if (withExtension.startsWith("/") || withExtension.split(/[\\/]+/).includes("..")) throw new Error(`Unsafe note path: ${requestedPath}`);
  if (withExtension.startsWith("data/wiki/")) return join(cwd, withExtension);
  if (withExtension.includes("/") || withExtension.includes("\\")) return join(cwd, withExtension);
  return join(wikiNotesDir, withExtension);
}

function renderNote(title: string, sources: SelectedSource[]): string {
  return [
    `# ${title}`,
    "",
    "## Summary",
    "",
    renderSummary(sources),
    "",
    "## Sources",
    "",
    ...sources.flatMap(renderSourceLines),
    "",
    "## Observations",
    "",
    ...sources.map(renderObservation),
    "",
    "## Open questions",
    "",
    "- Check whether related comments or newer sources should be collected for more context.",
    "",
  ].join("\n");
}

function renderSummary(sources: SelectedSource[]): string {
  if (sources.length === 1) {
    const source = sources[0];
    return `This note summarizes one collected LinuxFr ${source.entry.type} source: ${source.entry.title ?? source.entry.canonicalUrl}.`;
  }
  return `This note summarizes ${sources.length} collected LinuxFr raw sources selected for the same topic.`;
}

function renderSourceLines(source: SelectedSource): string[] {
  const lines = [`- Source URL: ${source.entry.canonicalUrl || source.entry.url}`, `  Local path: ${source.entry.localPath}`];
  if (source.entry.url !== source.entry.canonicalUrl) lines.splice(1, 0, `  Fetched URL: ${source.entry.url}`);
  return lines;
}

function renderObservation(source: SelectedSource): string {
  const parts = [
    source.entry.title ? `**${source.entry.title}**` : `Collected ${source.entry.type} source`,
    metadataSummary(source.entry),
    source.excerpt,
  ].filter(Boolean);
  return `- ${parts.join(" — ")} [Source: ${source.entry.canonicalUrl || source.entry.url}; raw: ${source.entry.localPath}]`;
}

function metadataSummary(entry: LinuxFrMetadataEntry): string | undefined {
  const details = [
    entry.authors?.length ? `by ${entry.authors.join(", ")}` : undefined,
    entry.publishedAt ? `published ${entry.publishedAt}` : undefined,
    entry.tags?.length ? `tags: ${entry.tags.join(", ")}` : undefined,
    entry.license ? `license: ${entry.license}` : undefined,
    typeof entry.score === "number" ? `score: ${entry.score}` : undefined,
  ].filter(Boolean);
  return details.length ? details.join("; ") : undefined;
}

function excerptFor(entry: LinuxFrMetadataEntry, rawText: string): string {
  if (entry.format === "markdown") return truncate(cleanMarkdownBody(rawText), EXCERPT_LENGTH);
  if (entry.format === "atom") return truncate(cleanXmlText(rawText), EXCERPT_LENGTH);
  return truncate(cleanHtmlText(rawText), EXCERPT_LENGTH);
}

function cleanMarkdownBody(rawText: string): string {
  const lines = rawText.split(/\r?\n/);
  let start = 0;
  let foundHeader = false;
  for (let index = 0; index < Math.min(lines.length, 80); index += 1) {
    if (/^(URL|Title|Authors|Date|License|Tags|Score):\s*/.test(lines[index])) {
      foundHeader = true;
      start = index + 1;
      continue;
    }
    if (foundHeader && lines[index].trim() === "") {
      start = index + 1;
      continue;
    }
    if (foundHeader) break;
  }
  return compactWhitespace(lines.slice(start).join("\n").replace(/^#+\s*/gm, "").replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1"));
}

function cleanXmlText(rawText: string): string {
  return cleanHtmlText(decodeBasicEntities(rawText));
}

function cleanHtmlText(rawText: string): string {
  const relevantHtml = firstHtmlSection(rawText, "article") ?? firstHtmlSection(rawText, "main") ?? rawText;
  const withoutNoisyBlocks = relevantHtml
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, " ")
    .replace(/<form\b[^>]*>[\s\S]*?<\/form>/gi, " ");
  return compactWhitespace(decodeBasicEntities(withoutNoisyBlocks).replace(/<[^>]+>/g, " "));
}

function firstHtmlSection(rawText: string, tagName: "main" | "article"): string | undefined {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  return pattern.exec(rawText)?.[1];
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/ /g, " ");
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

async function updateIndex(indexPath: string, noteHref: string, title: string, sourceCount: number): Promise<void> {
  let current = "# LinuxFr Dataset Wiki\n\n## Notes\n\n";
  try {
    current = await readFile(indexPath, "utf8");
  } catch {
    // The dataset layout normally creates this file; keep a fallback for direct tests.
  }

  if (!/## Notes\s*(\n|$)/.test(current)) current = `${current.trim()}\n\n## Notes\n\n`;
  const normalizedHref = normalizePath(noteHref);
  const noteLine = `- [${title}](${normalizedHref}) — ${sourceCount} source(s)`;
  const lines = current.split(/\r?\n/).filter((line) => !line.includes(`](${normalizedHref})`));
  const notesIndex = lines.findIndex((line) => line.trim() === "## Notes");
  lines.splice(notesIndex + 1, 0, noteLine);
  await writeFile(indexPath, `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`, "utf8");
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/#.*$/, "").replace(/\/$/, "");
}

function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "linuxfr-note";
}
