export type LinuxFrSourceType =
  | "news"
  | "journal"
  | "link"
  | "forum-post"
  | "poll"
  | "comments"
  | "feed"
  | "user"
  | "tag"
  | "section"
  | "listing"
  | "unknown";

export type RawFormat = "markdown" | "atom" | "html";

export type ClassifiedUrl = {
  requestedUrl: string;
  canonicalUrl: string;
  sourceType: LinuxFrSourceType;
  requestedFormat?: RawFormat;
  markdownUrl?: string;
};

const LINUXFR_HOST = "linuxfr.org";

export function classifyLinuxFrUrl(input: string): ClassifiedUrl {
  const url = normalizeLinuxFrUrl(input);
  const requestedFormat = detectRequestedFormat(url.pathname);
  const path = stripTrailingSlash(url.pathname);
  const canonicalPath = stripKnownRawSuffix(path);
  const canonical = new URL(url.href);
  canonical.pathname = canonicalPath || "/";
  canonical.search = "";
  canonical.hash = "";

  const sourceType = classifyPath(canonical.pathname, requestedFormat);
  const markdownUrl = markdownVariantUrl(canonical, sourceType);

  return {
    requestedUrl: url.href,
    canonicalUrl: canonical.href,
    sourceType,
    requestedFormat,
    markdownUrl,
  };
}

export function normalizeLinuxFrUrl(input: string): URL {
  const url = new URL(input);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`Unsupported URL protocol: ${url.protocol}`);
  }
  if (url.hostname !== LINUXFR_HOST) {
    throw new Error(`Only ${LINUXFR_HOST} URLs are supported: ${url.href}`);
  }
  url.protocol = "https:";
  url.hash = "";
  if (url.pathname === "") url.pathname = "/";
  return url;
}

export function formatExtension(format: RawFormat): string {
  if (format === "markdown") return "md";
  if (format === "atom") return "atom";
  return "html";
}

export function isDetailType(sourceType: LinuxFrSourceType): boolean {
  return sourceType === "news" || sourceType === "journal" || sourceType === "forum-post" || sourceType === "poll" || sourceType === "link";
}

function detectRequestedFormat(pathname: string): RawFormat | undefined {
  if (pathname.endsWith(".md")) return "markdown";
  if (pathname.endsWith(".atom")) return "atom";
  if (pathname.endsWith(".html")) return "html";
  return undefined;
}

function stripKnownRawSuffix(pathname: string): string {
  return pathname.replace(/\.(md|epub|html)$/i, "");
}

function stripTrailingSlash(pathname: string): string {
  if (pathname.length > 1) return pathname.replace(/\/+$/, "");
  return pathname;
}

function classifyPath(pathname: string, requestedFormat?: RawFormat): LinuxFrSourceType {
  if (requestedFormat === "atom") {
    if (/^\/nodes\/\d+\/comments\.atom$/.test(pathname)) return "comments";
    return "feed";
  }
  if (/^\/news\/[^/]+$/.test(pathname)) return "news";
  if (/^\/users\/[^/]+\/journaux\/[^/]+$/.test(pathname)) return "journal";
  if (/^\/users\/[^/]+\/liens\/[^/]+$/.test(pathname)) return "link";
  if (/^\/forums\/[^/]+\/posts\/[^/]+$/.test(pathname)) return "forum-post";
  if (/^\/sondages\/[^/]+$/.test(pathname)) return "poll";
  if (/^\/users\/[^/]+$/.test(pathname)) return "user";
  if (/^\/tags\/[^/]+\/public$/.test(pathname)) return "tag";
  if (/^\/sections\/[^/]+$/.test(pathname)) return "section";
  if (/^\/(news|journaux|liens|forums|sondages)$/.test(pathname)) return "listing";
  return "unknown";
}

function markdownVariantUrl(canonical: URL, sourceType: LinuxFrSourceType): string | undefined {
  if (!isDetailType(sourceType)) return undefined;
  const url = new URL(canonical.href);
  url.pathname = `${url.pathname}.md`;
  return url.href;
}
