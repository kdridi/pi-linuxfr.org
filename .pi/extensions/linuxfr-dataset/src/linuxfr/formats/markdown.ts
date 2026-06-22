export type MarkdownMetadata = {
  canonicalUrl?: string;
  title?: string;
  authors?: string[];
  publishedAt?: string;
  license?: string;
  tags?: string[];
  score?: number;
};

export function parseLinuxFrMarkdownMetadata(content: string): MarkdownMetadata {
  const metadata: MarkdownMetadata = {};
  let foundHeader = false;

  for (const line of content.split(/\r?\n/).slice(0, 50)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = /^(URL|Title|Authors|Date|License|Tags|Score):\s*(.*)$/.exec(line);
    if (!match) {
      if (foundHeader) break;
      continue;
    }

    foundHeader = true;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (key === "url") metadata.canonicalUrl = value;
    if (key === "title") metadata.title = value;
    if (key === "authors") metadata.authors = splitList(value);
    if (key === "date") metadata.publishedAt = value;
    if (key === "license") metadata.license = value;
    if (key === "tags") metadata.tags = splitTags(value);
    if (key === "score") {
      const score = Number.parseInt(value, 10);
      if (Number.isFinite(score)) metadata.score = score;
    }
  }
  return metadata;
}

function splitList(value: string): string[] {
  return value
    .split(/,|\bet\b/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitTags(value: string): string[] {
  return splitList(value);
}
