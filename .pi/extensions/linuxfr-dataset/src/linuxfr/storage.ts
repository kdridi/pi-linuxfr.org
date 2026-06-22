import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile, appendFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import type { LinuxFrSourceType, RawFormat } from "./classify-url";
import { formatExtension } from "./classify-url";
import type { LinuxFrMetadataEntry } from "./metadata";
import { parseMetadataJsonl } from "./metadata";

export type DatasetPaths = {
  rawPagesDir: string;
  metadataPath: string;
  wikiIndexPath: string;
  wikiNotesDir: string;
};

export function datasetPaths(cwd: string): DatasetPaths {
  return {
    rawPagesDir: join(cwd, "data", "raw", "pages"),
    metadataPath: join(cwd, "data", "raw", "metadata.jsonl"),
    wikiIndexPath: join(cwd, "data", "wiki", "index.md"),
    wikiNotesDir: join(cwd, "data", "wiki", "notes"),
  };
}

export async function ensureDatasetLayout(paths: DatasetPaths): Promise<void> {
  await mkdir(paths.rawPagesDir, { recursive: true });
  await mkdir(dirname(paths.metadataPath), { recursive: true });
  await mkdir(paths.wikiNotesDir, { recursive: true });
  try {
    await stat(paths.metadataPath);
  } catch {
    await writeFile(paths.metadataPath, "", "utf8");
  }
  try {
    await stat(paths.wikiIndexPath);
  } catch {
    await writeFile(paths.wikiIndexPath, "# LinuxFr Dataset Wiki\n\n## Notes\n\n", "utf8");
  }
}

export async function readMetadataEntries(metadataPath: string): Promise<LinuxFrMetadataEntry[]> {
  try {
    return parseMetadataJsonl(await readFile(metadataPath, "utf8"));
  } catch (error: any) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

export async function writeRawSource(cwd: string, paths: DatasetPaths, sourceType: LinuxFrSourceType, canonicalUrl: string, format: RawFormat, body: string): Promise<string> {
  const hash = createHash("sha256").update(`${canonicalUrl}\n${format}`).digest("hex").slice(0, 10);
  const fileName = `${safeTypeName(sourceType)}-${hash}.${formatExtension(format)}`;
  const absolutePath = join(paths.rawPagesDir, fileName);
  await writeFile(absolutePath, body, "utf8");
  return relative(cwd, absolutePath);
}

export async function appendMetadataEntry(metadataPath: string, entry: LinuxFrMetadataEntry): Promise<void> {
  await appendFile(metadataPath, `${JSON.stringify(entry)}\n`, "utf8");
}

export function toRelativePath(cwd: string, absoluteOrRelativePath: string): string {
  if (!absoluteOrRelativePath.startsWith("/")) return absoluteOrRelativePath;
  return relative(cwd, absoluteOrRelativePath);
}

function safeTypeName(sourceType: LinuxFrSourceType): string {
  return sourceType.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
}
