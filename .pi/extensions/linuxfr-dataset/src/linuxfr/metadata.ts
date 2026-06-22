import type { LinuxFrSourceType, RawFormat } from "./classify-url";

export type LinuxFrMetadataEntry = {
  url: string;
  canonicalUrl: string;
  type: LinuxFrSourceType;
  format: RawFormat;
  localPath: string;
  fetchedAt: string;
  cacheHit: boolean;
  httpStatus?: number;
  contentType?: string;
  title?: string;
  authors?: string[];
  publishedAt?: string;
  license?: string;
  tags?: string[];
  score?: number;
  nodeId?: number;
  relatedUrls?: string[];
};

export function parseMetadataJsonl(content: string): LinuxFrMetadataEntry[] {
  const entries: LinuxFrMetadataEntry[] = [];
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      entries.push(JSON.parse(trimmed) as LinuxFrMetadataEntry);
    } catch {
      // Ignore malformed historical entries so one bad line does not block collection.
    }
  }
  return entries;
}

export function findCachedEntry(entries: LinuxFrMetadataEntry[], canonicalUrl: string, format: RawFormat): LinuxFrMetadataEntry | undefined {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (entry.canonicalUrl === canonicalUrl && entry.format === format && !entry.cacheHit) return entry;
  }
  return undefined;
}
