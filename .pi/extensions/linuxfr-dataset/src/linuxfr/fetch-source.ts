import type { RawFormat } from "./classify-url";

export type FetchSourceResult = {
  url: string;
  finalUrl: string;
  format: RawFormat;
  httpStatus: number;
  contentType: string;
  body: string;
};

export async function fetchSource(url: string, format: RawFormat, signal?: AbortSignal): Promise<FetchSourceResult> {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    signal,
    headers: {
      "User-Agent": "pi-linuxfr-dataset/0.1 (+public anonymous raw collection)",
      Accept: acceptHeader(format),
    },
  });

  const body = await response.text();
  return {
    url,
    finalUrl: response.url || url,
    format,
    httpStatus: response.status,
    contentType: response.headers.get("content-type") ?? "",
    body,
  };
}

export function isSuccessfulFetch(result: FetchSourceResult): boolean {
  return result.httpStatus >= 200 && result.httpStatus < 300;
}

function acceptHeader(format: RawFormat): string {
  if (format === "markdown") return "text/markdown,text/x-markdown,text/plain;q=0.8,*/*;q=0.2";
  if (format === "atom") return "application/atom+xml,application/xml,text/xml;q=0.8,*/*;q=0.2";
  return "text/html,application/xhtml+xml;q=0.8,*/*;q=0.2";
}
