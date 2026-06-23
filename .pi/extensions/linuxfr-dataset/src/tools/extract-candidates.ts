import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { dedupeAndRankCandidates, extractCandidatesFromRawSource, type CandidateSource, type LinuxFrCandidate } from "../linuxfr/candidates";
import type { LinuxFrMetadataEntry } from "../linuxfr/metadata";
import { datasetPaths, readMetadataEntries, toRelativePath } from "../linuxfr/storage";

const DEFAULT_LIMIT = 30;
const HARD_LIMIT = 100;
const DEFAULT_MAX_SOURCES = 20;
const HARD_MAX_SOURCES = 50;
const DEFAULT_SEED_TYPES = new Set(["feed", "tag", "listing"]);

const paramsSchema = Type.Object({
  sourcePaths: Type.Optional(
    Type.Array(Type.String({ description: "Local raw source path to inspect, for example data/raw/pages/tag-example.html" }), {
      maxItems: HARD_MAX_SOURCES,
      description: "Optional selected local raw source paths. If omitted with sourceUrls and sourceType, latest feed/tag/listing sources are used.",
    }),
  ),
  sourceUrls: Type.Optional(
    Type.Array(Type.String({ description: "Collected LinuxFr source URL to inspect" }), {
      maxItems: HARD_MAX_SOURCES,
      description: "Optional selected source URLs matching collected metadata entries.",
    }),
  ),
  sourceType: Type.Optional(Type.String({ description: "Optional collected raw source type filter, such as feed, tag, listing, news, journal, link, forum-post, or poll" })),
  query: Type.Optional(Type.String({ description: "Optional query terms used to fill matchedTerms and boost scores" })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: HARD_LIMIT, description: "Maximum candidate count to return" })),
  maxSources: Type.Optional(Type.Integer({ minimum: 1, maximum: HARD_MAX_SOURCES, description: "Maximum local source files to inspect" })),
  includeUnknown: Type.Optional(Type.Boolean({ description: "Include LinuxFr URLs whose path cannot be classified as a known detail type" })),
});

type ExtractCandidatesParams = {
  sourcePaths?: string[];
  sourceUrls?: string[];
  sourceType?: string;
  query?: string;
  limit?: number;
  maxSources?: number;
  includeUnknown?: boolean;
};

type ReadSource = CandidateSource & {
  text: string;
};

export function registerExtractCandidatesTool(pi: ExtensionAPI) {
  pi.registerTool({
    name: "linuxfr_extract_candidates",
    label: "LinuxFr Extract Candidates",
    description: "Extract deduplicated LinuxFr detail URL candidates from already collected local raw seed sources without fetching new pages.",
    promptSnippet: "Extract candidate LinuxFr detail URLs from local raw sources",
    promptGuidelines: [
      "Use this tool after collecting feed, tag, listing, or other seed sources locally.",
      "This tool only reads data/raw files and does not fetch or crawl LinuxFr.",
      "Use the returned candidate URLs as explicit inputs to linuxfr_collect_pages only after the user or agent selects them.",
    ],
    parameters: paramsSchema,

    async execute(_toolCallId, params: ExtractCandidatesParams, _signal, _onUpdate, ctx) {
      const limit = clampInteger(params.limit ?? DEFAULT_LIMIT, 1, HARD_LIMIT);
      const maxSources = clampInteger(params.maxSources ?? DEFAULT_MAX_SOURCES, 1, HARD_MAX_SOURCES);
      const paths = datasetPaths(ctx.cwd);
      const entries = latestEntriesByLocalPath(await readMetadataEntries(paths.metadataPath));
      const selectedEntries = selectSourceEntries(ctx.cwd, entries, params).slice(0, maxSources);
      const sources = await readSources(ctx.cwd, selectedEntries);
      const occurrences = sources.flatMap((source) => extractCandidatesFromRawSource(source, source.text, { query: params.query, includeUnknown: params.includeUnknown }));
      const candidates = dedupeAndRankCandidates(occurrences, limit);

      return {
        content: [
          {
            type: "text",
            text: renderSummary(entries.length, selectedEntries.length, sources.length, occurrences.length, candidates, params, limit, maxSources),
          },
        ],
        details: {
          filters: {
            sourcePaths: params.sourcePaths,
            sourceUrls: params.sourceUrls,
            sourceType: params.sourceType,
            query: params.query,
            includeUnknown: Boolean(params.includeUnknown),
            limit,
            maxSources,
          },
          counts: {
            uniqueSources: entries.length,
            selectedSources: selectedEntries.length,
            readableSources: sources.length,
            candidateOccurrences: occurrences.length,
            returnedCandidates: candidates.length,
          },
          sources: sources.map((source) => ({ localPath: source.localPath, url: source.canonicalUrl || source.url, type: source.type, format: source.format, title: source.title })),
          candidates,
        },
      };
    },
  });
}

function latestEntriesByLocalPath(entries: LinuxFrMetadataEntry[]): LinuxFrMetadataEntry[] {
  const byPath = new Map<string, LinuxFrMetadataEntry>();
  for (const entry of entries) {
    const previous = byPath.get(entry.localPath);
    if (!previous || entry.fetchedAt >= previous.fetchedAt) byPath.set(entry.localPath, entry);
  }
  return Array.from(byPath.values()).sort((left, right) => right.fetchedAt.localeCompare(left.fetchedAt));
}

function selectSourceEntries(cwd: string, entries: LinuxFrMetadataEntry[], params: ExtractCandidatesParams): LinuxFrMetadataEntry[] {
  const sourcePathSet = new Set((params.sourcePaths ?? []).map((path) => toRelativePath(cwd, path)));
  const sourceUrlSet = new Set(params.sourceUrls ?? []);
  const hasExplicitSources = sourcePathSet.size > 0 || sourceUrlSet.size > 0;
  const normalizedSourceType = normalize(params.sourceType);

  return entries.filter((entry) => {
    if (normalizedSourceType && normalize(entry.type) !== normalizedSourceType) return false;
    if (hasExplicitSources) return sourcePathSet.has(entry.localPath) || sourceUrlSet.has(entry.url) || sourceUrlSet.has(entry.canonicalUrl);
    if (!params.sourceType) return DEFAULT_SEED_TYPES.has(entry.type);
    return true;
  });
}

async function readSources(cwd: string, entries: LinuxFrMetadataEntry[]): Promise<ReadSource[]> {
  const sources: ReadSource[] = [];
  for (const entry of entries) {
    try {
      sources.push({
        url: entry.url,
        canonicalUrl: entry.canonicalUrl,
        localPath: entry.localPath,
        type: entry.type,
        format: entry.format,
        title: entry.title,
        text: await readFile(join(cwd, entry.localPath), "utf8"),
      });
    } catch {
      // Ignore missing local files so stale metadata does not block extraction from readable sources.
    }
  }
  return sources;
}

function renderSummary(
  uniqueSources: number,
  selectedSources: number,
  readableSources: number,
  candidateOccurrences: number,
  candidates: LinuxFrCandidate[],
  params: ExtractCandidatesParams,
  limit: number,
  maxSources: number,
): string {
  const filters = [
    params.sourceType ? `sourceType=${params.sourceType}` : undefined,
    params.query ? `query=${params.query}` : undefined,
    params.sourcePaths?.length ? `${params.sourcePaths.length} sourcePath(s)` : undefined,
    params.sourceUrls?.length ? `${params.sourceUrls.length} sourceUrl(s)` : undefined,
  ]
    .filter(Boolean)
    .join(", ");
  const header = `LinuxFr candidate extraction: ${uniqueSources} unique local source(s), ${selectedSources} selected, ${readableSources} readable (maxSources ${maxSources}), ${candidateOccurrences} candidate occurrence(s), ${candidates.length} returned (limit ${limit})${filters ? ` for ${filters}` : ""}.`;
  if (candidates.length === 0) return `${header}\nNo candidate detail URL was found in the selected local raw sources.`;
  return [header, ...candidates.map(renderCandidateLine)].join("\n");
}

function renderCandidateLine(candidate: LinuxFrCandidate): string {
  const title = candidate.titleOrAnchor ? ` — ${candidate.titleOrAnchor}` : "";
  const matchedTerms = candidate.matchedTerms.length ? `\n  matched: ${candidate.matchedTerms.join(", ")}` : "";
  const publishedAt = candidate.publishedAt ? `\n  published: ${candidate.publishedAt}` : "";
  const snippet = candidate.snippet ? `\n  excerpt: ${candidate.snippet}` : "";
  const sourceCount = candidate.sourceCount > 1 ? ` (${candidate.sourceCount} sources)` : "";
  return `- score ${candidate.score} ${candidate.candidateType}: ${candidate.canonicalUrl}${title}\n  source: ${candidate.sourcePath}${sourceCount}\n  reason: ${candidate.reason}${matchedTerms}${publishedAt}${snippet}`;
}

function normalize(value: string | undefined): string {
  return (value ?? "").toLocaleLowerCase().trim();
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}
