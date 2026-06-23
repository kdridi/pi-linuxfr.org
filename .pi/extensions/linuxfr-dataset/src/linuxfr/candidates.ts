import { classifyLinuxFrUrl, isDetailType, type LinuxFrSourceType, type RawFormat } from "./classify-url";

const LINUXFR_HOST = "linuxfr.org";
const SNIPPET_LENGTH = 220;

export type CandidateSource = {
  url: string;
  canonicalUrl: string;
  localPath: string;
  type: LinuxFrSourceType;
  format: RawFormat;
  title?: string;
};

export type ExtractCandidateOptions = {
  query?: string;
  includeUnknown?: boolean;
};

export type LinuxFrCandidate = {
  candidateUrl: string;
  canonicalUrl: string;
  dedupeKey: string;
  candidateType: LinuxFrSourceType;
  sourcePath: string;
  sourceUrl: string;
  sourceTitle?: string;
  sourcePaths: string[];
  sourceUrls: string[];
  sourceCount: number;
  titleOrAnchor?: string;
  snippet?: string;
  publishedAt?: string;
  matchedTerms: string[];
  score: number;
  reason: string;
};

type CandidateContext = {
  href: string;
  titleOrAnchor?: string;
  snippet?: string;
  publishedAt?: string;
};

export function parseQueryTerms(query: string | undefined): string[] {
  return Array.from(
    new Set(
      (query ?? "")
        .split(/[\s,;]+/)
        .map((term) => term.trim())
        .filter(Boolean),
    ),
  );
}

export function extractCandidatesFromRawSource(source: CandidateSource, rawText: string, options: ExtractCandidateOptions = {}): LinuxFrCandidate[] {
  const terms = parseQueryTerms(options.query);
  const occurrences = source.format === "atom" ? extractAtomCandidates(source, rawText, terms, options) : extractTextCandidates(source, rawText, terms, options);
  return dedupeAndRankCandidates(occurrences, occurrences.length);
}

export function dedupeAndRankCandidates(candidates: LinuxFrCandidate[], limit: number): LinuxFrCandidate[] {
  const byKey = new Map<string, LinuxFrCandidate>();

  for (const candidate of candidates) {
    const existing = byKey.get(candidate.dedupeKey);
    if (!existing) {
      byKey.set(candidate.dedupeKey, {
        ...candidate,
        sourcePaths: uniqueStrings(candidate.sourcePaths.length ? candidate.sourcePaths : [candidate.sourcePath]),
        sourceUrls: uniqueStrings(candidate.sourceUrls.length ? candidate.sourceUrls : [candidate.sourceUrl]),
        sourceCount: 1,
      });
      continue;
    }

    existing.sourcePaths = uniqueStrings([...existing.sourcePaths, candidate.sourcePath, ...candidate.sourcePaths]);
    existing.sourceUrls = uniqueStrings([...existing.sourceUrls, candidate.sourceUrl, ...candidate.sourceUrls]);
    existing.sourceCount = existing.sourcePaths.length;
    existing.matchedTerms = uniqueStrings([...existing.matchedTerms, ...candidate.matchedTerms]);
    if (!existing.titleOrAnchor && candidate.titleOrAnchor) existing.titleOrAnchor = candidate.titleOrAnchor;
    if (!existing.snippet && candidate.snippet) existing.snippet = candidate.snippet;
    if (!existing.publishedAt && candidate.publishedAt) existing.publishedAt = candidate.publishedAt;
    if (candidate.score > existing.score) {
      existing.score = candidate.score;
      existing.sourcePath = candidate.sourcePath;
      existing.sourceUrl = candidate.sourceUrl;
      existing.sourceTitle = candidate.sourceTitle;
    }
  }

  return Array.from(byKey.values())
    .map((candidate) => ({ ...candidate, reason: candidateReason(candidate) }))
    .sort(compareCandidates)
    .slice(0, Math.max(0, Math.trunc(limit)));
}

function extractAtomCandidates(source: CandidateSource, rawText: string, terms: string[], options: ExtractCandidateOptions): LinuxFrCandidate[] {
  const candidates: LinuxFrCandidate[] = [];
  const entryPattern = /<entry\b[\s\S]*?<\/entry>/gi;
  let match: RegExpExecArray | null;

  while ((match = entryPattern.exec(rawText))) {
    const entry = match[0];
    const href = extractAlternateLinkHref(entry) ?? extractFirstLinuxFrUrl(entry);
    if (!href) continue;

    const context: CandidateContext = {
      href,
      titleOrAnchor: cleanSnippet(firstMatch(entry, /<title[^>]*>([\s\S]*?)<\/title>/i)),
      snippet: cleanSnippet(firstMatch(entry, /<(?:summary|content)[^>]*>([\s\S]*?)<\/(?:summary|content)>/i)),
      publishedAt: cleanSnippet(firstMatch(entry, /<published[^>]*>([\s\S]*?)<\/published>/i)),
    };
    const candidate = candidateFromContext(source, context, terms, options);
    if (candidate) candidates.push(candidate);
  }

  return candidates;
}

function extractTextCandidates(source: CandidateSource, rawText: string, terms: string[], options: ExtractCandidateOptions): LinuxFrCandidate[] {
  return [...extractAnchorCandidates(source, rawText, terms, options), ...extractMarkdownLinkCandidates(source, rawText, terms, options), ...extractBareUrlCandidates(source, rawText, terms, options)];
}

function extractAnchorCandidates(source: CandidateSource, rawText: string, terms: string[], options: ExtractCandidateOptions): LinuxFrCandidate[] {
  const candidates: LinuxFrCandidate[] = [];
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(rawText))) {
    const href = extractAttribute(match[1], "href");
    if (!href) continue;
    const candidate = candidateFromContext(
      source,
      {
        href,
        titleOrAnchor: cleanSnippet(match[2]),
        snippet: contextSnippet(rawText, match.index),
      },
      terms,
      options,
    );
    if (candidate) candidates.push(candidate);
  }

  return candidates;
}

function extractMarkdownLinkCandidates(source: CandidateSource, rawText: string, terms: string[], options: ExtractCandidateOptions): LinuxFrCandidate[] {
  const candidates: LinuxFrCandidate[] = [];
  const markdownPattern = /\[([^\]]{1,500})\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match: RegExpExecArray | null;

  while ((match = markdownPattern.exec(rawText))) {
    const candidate = candidateFromContext(
      source,
      {
        href: match[2],
        titleOrAnchor: cleanSnippet(match[1]),
        snippet: contextSnippet(rawText, match.index),
      },
      terms,
      options,
    );
    if (candidate) candidates.push(candidate);
  }

  return candidates;
}

function extractBareUrlCandidates(source: CandidateSource, rawText: string, terms: string[], options: ExtractCandidateOptions): LinuxFrCandidate[] {
  const candidates: LinuxFrCandidate[] = [];
  const urlPattern = /https?:\/\/linuxfr\.org\/[^\s<>"')\]]+/gi;
  let match: RegExpExecArray | null;

  while ((match = urlPattern.exec(rawText))) {
    const candidate = candidateFromContext(
      source,
      {
        href: match[0],
        snippet: contextSnippet(rawText, match.index),
      },
      terms,
      options,
    );
    if (candidate) candidates.push(candidate);
  }

  return candidates;
}

function candidateFromContext(source: CandidateSource, context: CandidateContext, terms: string[], options: ExtractCandidateOptions): LinuxFrCandidate | undefined {
  const resolvedUrl = resolveLinuxFrUrl(context.href, source.canonicalUrl || source.url);
  if (!resolvedUrl) return undefined;

  let classified: ReturnType<typeof classifyLinuxFrUrl>;
  try {
    classified = classifyLinuxFrUrl(resolvedUrl);
  } catch {
    return undefined;
  }

  if (!isDetailType(classified.sourceType) && !(options.includeUnknown && classified.sourceType === "unknown")) return undefined;

  const searchable = [classified.canonicalUrl, classified.sourceType, context.titleOrAnchor, context.snippet, context.publishedAt].filter((value): value is string => Boolean(value));
  const matchedTerms = findMatchedTerms(searchable, terms);
  const score = scoreCandidate(classified.sourceType, context, matchedTerms);

  return {
    candidateUrl: classified.canonicalUrl,
    canonicalUrl: classified.canonicalUrl,
    dedupeKey: classified.canonicalUrl,
    candidateType: classified.sourceType,
    sourcePath: source.localPath,
    sourceUrl: source.canonicalUrl || source.url,
    sourceTitle: source.title,
    sourcePaths: [source.localPath],
    sourceUrls: [source.canonicalUrl || source.url],
    sourceCount: 1,
    titleOrAnchor: context.titleOrAnchor,
    snippet: context.snippet,
    publishedAt: context.publishedAt,
    matchedTerms,
    score,
    reason: "",
  };
}

function scoreCandidate(candidateType: LinuxFrSourceType, context: CandidateContext, matchedTerms: string[]): number {
  let score = isDetailType(candidateType) ? 5 : 1;
  if (context.titleOrAnchor) score += 2;
  if (context.snippet) score += 1;
  if (context.publishedAt) score += 1;
  if (matchedTerms.length > 0) score += 10 + matchedTerms.length * 2;
  return score;
}

function candidateReason(candidate: LinuxFrCandidate): string {
  const parts = [`classified as ${candidate.candidateType}`];
  if (candidate.matchedTerms.length > 0) parts.push(`matched ${candidate.matchedTerms.join(", ")}`);
  if (candidate.sourceCount > 1) parts.push(`found in ${candidate.sourceCount} sources`);
  if (candidate.titleOrAnchor) parts.push("has title or anchor text");
  return parts.join("; ");
}

function compareCandidates(left: LinuxFrCandidate, right: LinuxFrCandidate): number {
  const score = right.score - left.score;
  if (score !== 0) return score;
  const type = left.candidateType.localeCompare(right.candidateType);
  if (type !== 0) return type;
  return left.canonicalUrl.localeCompare(right.canonicalUrl);
}

function resolveLinuxFrUrl(rawHref: string, baseUrl: string): string | undefined {
  const href = decodeBasicEntities(rawHref).trim();
  if (!href || href.startsWith("#") || /^(mailto|javascript):/i.test(href)) return undefined;

  try {
    const url = new URL(href, baseUrl);
    if (url.hostname !== LINUXFR_HOST) return undefined;
    url.protocol = "https:";
    url.hash = "";
    return url.href;
  } catch {
    return undefined;
  }
}

function extractAlternateLinkHref(entry: string): string | undefined {
  const linkPattern = /<link\b([^>]*)>/gi;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(entry))) {
    const rel = extractAttribute(match[1], "rel");
    const href = extractAttribute(match[1], "href");
    if (href && (!rel || rel === "alternate")) return href;
  }
  return undefined;
}

function extractFirstLinuxFrUrl(value: string): string | undefined {
  return /https?:\/\/linuxfr\.org\/[^\s<>"')\]]+/i.exec(value)?.[0];
}

function extractAttribute(attributes: string, name: string): string | undefined {
  const pattern = new RegExp(`${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i");
  const match = pattern.exec(attributes);
  return match ? decodeBasicEntities(match[2]) : undefined;
}

function firstMatch(value: string, pattern: RegExp): string | undefined {
  return pattern.exec(value)?.[1];
}

function findMatchedTerms(values: string[], terms: string[]): string[] {
  const haystack = normalizeForSearch(values.join(" "));
  const tokens = haystack.split(/[^a-z0-9]+/).filter(Boolean);
  return terms.filter((term) => termMatches(haystack, tokens, normalizeForSearch(term)));
}

function termMatches(haystack: string, tokens: string[], normalizedTerm: string): boolean {
  if (!normalizedTerm) return false;
  if (normalizedTerm.length <= 3 && /^[a-z0-9]+$/.test(normalizedTerm)) return tokens.includes(normalizedTerm);
  return haystack.includes(normalizedTerm);
}

function normalizeForSearch(value: string): string {
  return decodeBasicEntities(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}

function contextSnippet(rawText: string, index: number): string | undefined {
  const start = Math.max(0, index - Math.floor(SNIPPET_LENGTH / 2));
  const end = Math.min(rawText.length, index + Math.floor(SNIPPET_LENGTH / 2));
  return cleanSnippet(rawText.slice(start, end));
}

function cleanSnippet(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = compactWhitespace(stripHtmlTags(decodeBasicEntities(value)));
  if (!cleaned) return undefined;
  return cleaned.length > SNIPPET_LENGTH ? `${cleaned.slice(0, SNIPPET_LENGTH - 3).trim()}...` : cleaned;
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ");
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
