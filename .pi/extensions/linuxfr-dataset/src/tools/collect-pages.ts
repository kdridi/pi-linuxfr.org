import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { classifyLinuxFrUrl, isDetailType, type RawFormat } from "../linuxfr/classify-url";
import { fetchSource, isSuccessfulFetch } from "../linuxfr/fetch-source";
import type { LinuxFrMetadataEntry } from "../linuxfr/metadata";
import { findCachedEntry } from "../linuxfr/metadata";
import { appendMetadataEntry, datasetPaths, ensureDatasetLayout, readMetadataEntries, writeRawSource } from "../linuxfr/storage";
import { parseLinuxFrMarkdownMetadata } from "../linuxfr/formats/markdown";

const HARD_MAX_ITEMS = 20;

const paramsSchema = Type.Object({
  urls: Type.Array(Type.String({ description: "Explicit public linuxfr.org URL to collect" }), {
    minItems: 1,
    maxItems: HARD_MAX_ITEMS,
    description: "Explicit public linuxfr.org URLs to collect",
  }),
  includeComments: Type.Optional(Type.Boolean({ description: "Reserved for later; comments are not followed by the first MVP implementation" })),
  preferredFormat: Type.Optional(
    Type.Union([Type.Literal("auto"), Type.Literal("markdown"), Type.Literal("atom"), Type.Literal("html")], {
      description: "Preferred raw format. Auto prefers Markdown for detail pages, Atom for .atom URLs, then HTML fallback.",
    }),
  ),
  maxItems: Type.Optional(Type.Integer({ minimum: 1, maximum: HARD_MAX_ITEMS, description: "Maximum number of provided URLs to collect" })),
  forceRefresh: Type.Optional(Type.Boolean({ description: "Fetch again even when a matching local raw source already exists" })),
});

type CollectParams = {
  urls: string[];
  includeComments?: boolean;
  preferredFormat?: "auto" | RawFormat;
  maxItems?: number;
  forceRefresh?: boolean;
};

type CollectResult = LinuxFrMetadataEntry & {
  requestedUrl: string;
  fetchedUrl?: string;
  error?: string;
};

type LightweightMetadata = {
  canonicalUrl?: string;
  title?: string;
  authors?: string[];
  publishedAt?: string;
  license?: string;
  tags?: string[];
  score?: number;
};

export function registerCollectPagesTool(pi: ExtensionAPI) {
  pi.registerTool({
    name: "linuxfr_collect_pages",
    label: "LinuxFr Collect Pages",
    description: "Collect explicit public linuxfr.org URLs into data/raw/pages and append fetch metadata to data/raw/metadata.jsonl.",
    promptSnippet: "Collect explicit public LinuxFr URLs as raw local sources",
    promptGuidelines: [
      "Use only explicit public linuxfr.org URLs requested by the user.",
      "Do not use this tool as a general crawler and keep maxItems small.",
      "Prefer Markdown and Atom sources over HTML when available.",
    ],
    parameters: paramsSchema,

    async execute(_toolCallId, params: CollectParams, signal, onUpdate, ctx) {
      const paths = datasetPaths(ctx.cwd);
      await ensureDatasetLayout(paths);

      const maxItems = clampInteger(params.maxItems ?? params.urls.length, 1, HARD_MAX_ITEMS);
      const urls = params.urls.slice(0, maxItems);
      const results: CollectResult[] = [];

      for (const inputUrl of urls) {
        if (signal?.aborted) throw new Error("Collection cancelled");
        onUpdate?.({ content: [{ type: "text", text: `Collecting ${inputUrl}` }] });
        try {
          const result = await collectOne(ctx.cwd, paths, inputUrl, params.preferredFormat ?? "auto", Boolean(params.forceRefresh), signal);
          results.push(result);
        } catch (error) {
          results.push(errorResult(inputUrl, error));
        }
      }

      const collected = results.filter((result) => !result.error);
      const cacheHits = collected.filter((result) => result.cacheHit).length;
      const errors = results.filter((result) => result.error).length;
      const summary = [
        `LinuxFr collection finished: ${collected.length} collected result(s), ${cacheHits} cache hit(s), ${errors} error(s).`,
        ...results.map((result) => renderResultLine(result)),
      ].join("\n");

      return {
        content: [{ type: "text", text: summary }],
        details: { results },
      };
    },
  });
}

async function collectOne(
  cwd: string,
  paths: ReturnType<typeof datasetPaths>,
  inputUrl: string,
  preferredFormat: "auto" | RawFormat,
  forceRefresh: boolean,
  signal?: AbortSignal,
): Promise<CollectResult> {
  const classified = classifyLinuxFrUrl(inputUrl);
  const candidates = candidateFetches(classified, preferredFormat);
  const entries = await readMetadataEntries(paths.metadataPath);

  for (const candidate of candidates) {
    if (!forceRefresh) {
      const cached = findCachedEntry(entries, classified.canonicalUrl, candidate.format);
      if (cached) {
        return {
          ...cached,
          requestedUrl: inputUrl,
          cacheHit: true,
          fetchedUrl: cached.url,
        };
      }
    }

    const fetched = await fetchSource(candidate.url, candidate.format, signal);
    if (!isSuccessfulFetch(fetched)) {
      if (candidate.allowFallback) continue;
      throw new Error(`Fetch failed for ${candidate.url}: HTTP ${fetched.httpStatus}`);
    }

    const localPath = await writeRawSource(cwd, paths, classified.sourceType, classified.canonicalUrl, candidate.format, fetched.body);
    const extracted = extractLightweightMetadata(candidate.format, fetched.body);
    const entry: LinuxFrMetadataEntry = {
      url: fetched.finalUrl,
      canonicalUrl: extracted.canonicalUrl ?? classified.canonicalUrl,
      type: classified.sourceType,
      format: candidate.format,
      localPath,
      fetchedAt: new Date().toISOString(),
      cacheHit: false,
      httpStatus: fetched.httpStatus,
      contentType: fetched.contentType,
      title: extracted.title,
      authors: extracted.authors,
      publishedAt: extracted.publishedAt,
      license: extracted.license,
      tags: extracted.tags,
      score: extracted.score,
    };
    await appendMetadataEntry(paths.metadataPath, entry);
    return { ...entry, requestedUrl: inputUrl, fetchedUrl: candidate.url };
  }

  throw new Error(`No supported source could be collected for ${inputUrl}`);
}

function candidateFetches(classified: ReturnType<typeof classifyLinuxFrUrl>, preferredFormat: "auto" | RawFormat): Array<{ url: string; format: RawFormat; allowFallback: boolean }> {
  if (classified.requestedFormat) {
    return [{ url: classified.requestedUrl, format: classified.requestedFormat, allowFallback: false }];
  }

  if (preferredFormat === "html") return [{ url: classified.canonicalUrl, format: "html", allowFallback: false }];
  if (preferredFormat === "atom") return [{ url: atomVariantUrl(classified.canonicalUrl), format: "atom", allowFallback: false }];
  if (preferredFormat === "markdown") {
    if (!classified.markdownUrl) throw new Error(`No Markdown variant is known for ${classified.requestedUrl}`);
    return [{ url: classified.markdownUrl, format: "markdown", allowFallback: false }];
  }

  if (classified.markdownUrl && isDetailType(classified.sourceType)) {
    return [
      { url: classified.markdownUrl, format: "markdown", allowFallback: true },
      { url: classified.canonicalUrl, format: "html", allowFallback: false },
    ];
  }

  return [{ url: classified.canonicalUrl, format: "html", allowFallback: false }];
}

function atomVariantUrl(canonicalUrl: string): string {
  const url = new URL(canonicalUrl);
  if (!url.pathname.endsWith(".atom")) url.pathname = `${url.pathname.replace(/\/$/, "")}.atom`;
  return url.href;
}

function extractLightweightMetadata(format: RawFormat, body: string): LightweightMetadata {
  if (format === "markdown") return parseLinuxFrMarkdownMetadata(body);
  const title = extractTitle(body, format);
  return title ? { title } : {};
}

function extractTitle(body: string, format: RawFormat): string | undefined {
  if (format === "atom") return firstMatch(body, /<title[^>]*>([\s\S]*?)<\/title>/i);
  return firstMatch(body, /<title[^>]*>([\s\S]*?)<\/title>/i);
}

function firstMatch(body: string, pattern: RegExp): string | undefined {
  const match = pattern.exec(body);
  if (!match) return undefined;
  return decodeBasicEntities(match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
}

function decodeBasicEntities(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function errorResult(inputUrl: string, error: unknown): CollectResult {
  return {
    requestedUrl: inputUrl,
    url: inputUrl,
    canonicalUrl: inputUrl,
    type: "unknown",
    format: "html",
    localPath: "",
    fetchedAt: new Date().toISOString(),
    cacheHit: false,
    error: error instanceof Error ? error.message : String(error),
  };
}

function renderResultLine(result: CollectResult): string {
  if (result.error) return `- ERROR ${result.requestedUrl}: ${result.error}`;
  return `- ${result.cacheHit ? "CACHE" : "FETCH"} ${result.format} ${result.type}: ${result.localPath} (${result.canonicalUrl})`;
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}
