import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { LinuxFrMetadataEntry } from "../linuxfr/metadata";
import { datasetPaths, readMetadataEntries } from "../linuxfr/storage";

const DEFAULT_LIMIT = 20;
const HARD_LIMIT = 100;
const SNIPPET_LENGTH = 220;

const paramsSchema = Type.Object({
  type: Type.Optional(Type.String({ description: "Optional raw source type filter" })),
  query: Type.Optional(Type.String({ description: "Optional metadata query" })),
  url: Type.Optional(Type.String({ description: "Optional source URL filter" })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: HARD_LIMIT, description: "Maximum result count" })),
});

type QueryRawParams = {
  type?: string;
  query?: string;
  url?: string;
  limit?: number;
};

type QueryRawResult = {
  url: string;
  canonicalUrl: string;
  localPath: string;
  type: string;
  format: string;
  title?: string;
  authors?: string[];
  tags?: string[];
  fetchedAt: string;
  snippet?: string;
};

export function registerQueryRawTool(pi: ExtensionAPI) {
  pi.registerTool({
    name: "linuxfr_query_raw",
    label: "LinuxFr Query Raw",
    description: "Inspect collected LinuxFr raw sources from data/raw/metadata.jsonl with simple local filters.",
    promptSnippet: "Inspect collected LinuxFr raw sources",
    parameters: paramsSchema,
    async execute(_toolCallId, params: QueryRawParams, _signal, _onUpdate, ctx) {
      const paths = datasetPaths(ctx.cwd);
      const entries = await readMetadataEntries(paths.metadataPath);
      const uniqueEntries = latestEntriesBySource(entries);
      const limit = clampInteger(params.limit ?? DEFAULT_LIMIT, 1, HARD_LIMIT);
      const filtered = await filterEntries(ctx.cwd, uniqueEntries, params);
      const results = filtered.slice(0, limit);

      return {
        content: [
          {
            type: "text",
            text: renderSummary(entries.length, uniqueEntries.length, filtered.length, results, params, limit),
          },
        ],
        details: {
          filters: {
            type: params.type,
            url: params.url,
            query: params.query,
            limit,
          },
          counts: {
            metadataEntries: entries.length,
            uniqueSources: uniqueEntries.length,
            matchedSources: filtered.length,
            returnedSources: results.length,
          },
          results,
        },
      };
    },
  });
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

async function filterEntries(cwd: string, entries: LinuxFrMetadataEntry[], params: QueryRawParams): Promise<QueryRawResult[]> {
  const typeFilter = normalize(params.type);
  const urlFilter = normalize(params.url);
  const queryFilter = normalize(params.query);
  const results: QueryRawResult[] = [];

  for (const entry of entries) {
    if (typeFilter && normalize(entry.type) !== typeFilter) continue;
    if (urlFilter && !contains(urlFields(entry), urlFilter)) continue;

    let snippet: string | undefined;
    if (queryFilter) {
      if (!contains(metadataFields(entry), queryFilter)) {
        const rawText = await readRawText(cwd, entry.localPath);
        const rawMatch = findSnippet(rawText, queryFilter);
        if (!rawMatch) continue;
        snippet = rawMatch;
      }
    }

    results.push({
      url: entry.url,
      canonicalUrl: entry.canonicalUrl,
      localPath: entry.localPath,
      type: entry.type,
      format: entry.format,
      title: entry.title,
      authors: entry.authors,
      tags: entry.tags,
      fetchedAt: entry.fetchedAt,
      snippet,
    });
  }

  return results;
}

function metadataFields(entry: LinuxFrMetadataEntry): string[] {
  return [
    entry.title,
    entry.url,
    entry.canonicalUrl,
    entry.localPath,
    entry.type,
    entry.format,
    ...(entry.authors ?? []),
    ...(entry.tags ?? []),
  ].filter((value): value is string => Boolean(value));
}

function urlFields(entry: LinuxFrMetadataEntry): string[] {
  return [entry.url, entry.canonicalUrl, entry.localPath];
}

async function readRawText(cwd: string, localPath: string): Promise<string> {
  if (!localPath) return "";
  try {
    return await readFile(join(cwd, localPath), "utf8");
  } catch {
    return "";
  }
}

function findSnippet(text: string, normalizedNeedle: string): string | undefined {
  if (!text) return undefined;
  const normalizedText = normalize(text);
  const index = normalizedText.indexOf(normalizedNeedle);
  if (index < 0) return undefined;

  const start = Math.max(0, index - Math.floor(SNIPPET_LENGTH / 2));
  const end = Math.min(text.length, index + normalizedNeedle.length + Math.floor(SNIPPET_LENGTH / 2));
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return `${prefix}${cleanSnippet(text.slice(start, end))}${suffix}`;
}

function cleanSnippet(value: string): string {
  return compactWhitespace(stripHtmlTags(stripPartialHtmlFragments(decodeBasicHtmlEntities(value))));
}

function decodeBasicHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ");
}

function stripPartialHtmlFragments(value: string): string {
  let cleaned = value;
  const firstTagEnd = cleaned.indexOf(">");
  const firstTagStart = cleaned.indexOf("<");
  if (firstTagEnd >= 0 && (firstTagStart < 0 || firstTagEnd < firstTagStart)) cleaned = cleaned.slice(firstTagEnd + 1);

  const lastTagStart = cleaned.lastIndexOf("<");
  const lastTagEnd = cleaned.lastIndexOf(">");
  if (lastTagStart > lastTagEnd) cleaned = cleaned.slice(0, lastTagStart);

  return cleaned;
}

function contains(values: string[], normalizedNeedle: string): boolean {
  return values.some((value) => normalize(value).includes(normalizedNeedle));
}

function normalize(value: string | undefined): string {
  return (value ?? "").toLocaleLowerCase().trim();
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function renderSummary(totalEntries: number, uniqueSources: number, matchedSources: number, results: QueryRawResult[], params: QueryRawParams, limit: number): string {
  const filters = [params.type ? `type=${params.type}` : undefined, params.url ? `url=${params.url}` : undefined, params.query ? `query=${params.query}` : undefined]
    .filter(Boolean)
    .join(", ");
  const header = `LinuxFr raw dataset: ${totalEntries} metadata entr${totalEntries === 1 ? "y" : "ies"}, ${uniqueSources} unique source(s), ${matchedSources} match(es), ${results.length} returned (limit ${limit})${filters ? ` for ${filters}` : ""}.`;
  if (results.length === 0) return `${header}\nNo collected raw source matched the filters.`;
  return [header, ...results.map(renderResultLine)].join("\n");
}

function renderResultLine(result: QueryRawResult): string {
  const title = result.title ? ` — ${result.title}` : "";
  const sourceUrl = result.url !== result.canonicalUrl ? `\n  source: ${result.url}` : "";
  const snippet = result.snippet ? `\n  excerpt: ${result.snippet}` : "";
  return `- ${result.type}/${result.format}: ${result.localPath}${title}\n  url: ${result.canonicalUrl}${sourceUrl}${snippet}`;
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}
