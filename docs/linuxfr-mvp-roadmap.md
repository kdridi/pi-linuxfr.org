# LinuxFr MVP Roadmap

## Purpose

This roadmap defines the smallest useful path from the current generic discovery capability to a LinuxFr-specific Pi extension that can build a local, agent-friendly dataset from public LinuxFr content.

The MVP loop is:

```text
collect raw public LinuxFr sources
  -> inspect local raw sources
  -> generate cited Markdown wiki notes
  -> decide whether more collection is needed
```

## Current status

### Implemented: generic website discovery

A project-local Pi extension exists at:

```text
.pi/extensions/generic-site-discovery/
```

It registers:

```text
generic_site_discover
```

Current behavior:

- explores a public website with Playwright;
- enforces `maxPages` and `maxDepth` limits;
- writes Markdown discovery reports;
- does not submit forms;
- is generic, not LinuxFr-specific.

Discovery reports already generated for LinuxFr:

```text
data/discovery/linuxfr-discovery.md
data/discovery/linuxfr-news-discovery.md
data/discovery/linuxfr-journaux-discovery.md
data/discovery/linuxfr-liens-discovery.md
data/discovery/linuxfr-forums-discovery.md
data/discovery/linuxfr-sondages-discovery.md
data/discovery/linuxfr-detail-news-discovery.md
data/discovery/linuxfr-detail-forum-post-discovery.md
```

## Roadmap principles

- Keep the public Pi tool surface small.
- Prefer explicit user-directed collection over crawling.
- Prefer LinuxFr Markdown and Atom formats over HTML parsing when available.
- Store raw sources before generating wiki text.
- Cite source URLs and local raw paths in every generated wiki note.
- Add specialized extractors internally, not necessarily separate public Pi tools.
- Avoid authentication, form submission, voting, posting, or account-specific actions.

## Phase 1: LinuxFr extension skeleton

### Goal

Create the LinuxFr-specific project-local extension without implementing a crawler.

### Deliverables

```text
.pi/extensions/linuxfr-dataset/
  index.ts
  package.json
  src/
```

Register the three MVP tools:

```text
linuxfr_collect_pages
linuxfr_query_raw
linuxfr_update_wiki
```

### Acceptance criteria

- Pi loads the extension without errors.
- The three tools are visible to the agent.
- Tool implementations may initially return clear placeholder errors or minimal diagnostic output.

## Phase 2: Raw storage foundation

### Goal

Create a reliable local raw data store.

### Deliverables

```text
data/
  raw/
    pages/
    metadata.jsonl
  wiki/
    index.md
    notes/
```

Metadata entries should support at least:

```json
{
  "url": "https://linuxfr.org/news/example",
  "canonicalUrl": "https://linuxfr.org/news/example",
  "type": "news",
  "format": "markdown",
  "localPath": "data/raw/pages/example.md",
  "fetchedAt": "2026-06-22T00:00:00.000Z",
  "cacheHit": false,
  "title": "Example title",
  "authors": ["example"],
  "tags": ["linux"],
  "nodeId": 123456
}
```

### Acceptance criteria

- Raw files are written under `data/raw/pages/`.
- `metadata.jsonl` is append-only for new fetches.
- Re-fetching the same canonical URL can return a cache hit.
- Generated wiki files remain separate from raw files.

## Phase 3: `linuxfr_collect_pages` MVP

### Goal

Collect explicit public LinuxFr URLs and store raw source files locally.

### Initial inputs

Support a minimal schema equivalent to:

```text
urls: string[]
includeComments?: boolean
preferredFormat?: "auto" | "markdown" | "atom" | "html"
maxItems?: number
forceRefresh?: boolean
```

### URL handling

The tool should classify URLs into known LinuxFr source types:

- `news`: `/news/<slug>`
- `journal`: `/users/<login>/journaux/<slug>`
- `link`: `/users/<login>/liens/<slug>`
- `forum-post`: `/forums/<forum>/posts/<slug>`
- `poll`: `/sondages/<slug>`
- `comments`: `/nodes/<id>/comments.atom`
- `feed`: any supported `.atom` URL
- `user`: `/users/<login>`
- `tag`: `/tags/<tag>/public`
- `section`: `/sections/<section>`
- `listing`: `/news`, `/journaux`, `/liens`, `/forums`, `/sondages`

### Format priority

For detail pages, use this order:

1. `.md` variant when available;
2. Atom feed when collecting a feed or comments;
3. HTML fallback only when Markdown or Atom is unavailable.

### Acceptance criteria

- Collecting a known `.md`-compatible detail URL stores Markdown raw content.
- Collecting a supported `.atom` URL stores Atom XML raw content.
- The tool reports local paths, source URLs, detected types, formats, and cache hits.
- Collection is bounded by `maxItems`.
- The tool does not follow arbitrary links unless explicitly supported by the selected mode.

## Phase 4: Atom feed collection

### Goal

Use LinuxFr Atom feeds as the primary discovery mechanism for recent content.

### Supported feeds

Initial feeds:

```text
/news.atom
/journaux.atom
/liens.atom
/forums.atom
/sondages.atom
```

Additional discovered feeds:

```text
/forums/<forum>.atom
/users/<login>.atom
/tags/<tag>/public.atom
/sections/<section>.atom
/nodes/<id>/comments.atom
```

### Behavior

- Store the feed XML as raw data.
- Parse feed entries enough to discover canonical item URLs.
- Optionally collect the first `maxItems` entry URLs using the normal detail-page collection path.

### Acceptance criteria

- Collecting `/news.atom` records feed metadata and item URLs.
- The tool can collect a bounded number of items from a feed.
- Duplicate item URLs are not downloaded repeatedly unless `forceRefresh` is true.

## Phase 5: Specialized internal extractors

### Goal

Add one internal extractor per LinuxFr source type while keeping the public tool surface minimal.

### Initial extractor modules

```text
src/extractors/markdown.ts
src/extractors/atom.ts
src/extractors/html.ts
src/extractors/news.ts
src/extractors/journal.ts
src/extractors/link.ts
src/extractors/forum-post.ts
src/extractors/poll.ts
src/extractors/comments.ts
src/extractors/user.ts
src/extractors/tag.ts
src/extractors/section.ts
```

### Extracted fields

Common fields:

- canonical URL;
- title;
- authors;
- date;
- license;
- tags;
- score;
- detected source type;
- raw format;
- local raw path.

Type-specific fields may be added only when needed.

### Acceptance criteria

- Markdown metadata headers from LinuxFr `.md` files are parsed.
- Atom feed entries expose item URLs, titles, dates, and entry IDs.
- `nodeId` is detected when available from comments feed links or HTML alternate links.

## Phase 6: `linuxfr_query_raw` MVP

### Goal

Let the agent inspect the local raw dataset before collecting more.

### Initial inputs

Support simple filters:

```text
type?: string
query?: string
url?: string
limit?: number
```

### Behavior

- Read `data/raw/metadata.jsonl`.
- List collected sources.
- Search metadata fields and optionally raw text.
- Return concise results with URLs and local paths.

### Acceptance criteria

- The agent can answer what has already been collected.
- Results include enough context to decide whether more collection is needed.
- Output is bounded and concise.

### Later query improvements

These are intentionally deferred until the basic three-tool MVP works end to end:

- add optional snippets even when a query matches metadata only;
- add simple relevance ordering, for example metadata matches before raw-text matches;
- improve Atom and HTML text cleanup beyond the current lightweight snippet normalization.

## Phase 7: `linuxfr_update_wiki` MVP

### Goal

Generate or update lightweight Markdown notes from selected raw sources.

### Initial inputs

Support:

```text
sourcePaths?: string[]
sourceUrls?: string[]
notePath?: string
topic?: string
```

### Behavior

- Read selected raw files.
- Create or update Markdown notes under `data/wiki/notes/`.
- Update `data/wiki/index.md`.
- Cite source URLs and local raw file paths.

### Acceptance criteria

- Every generated note has a `Sources` section.
- Raw source text is not overwritten or replaced by generated wiki text.
- Notes are short enough to be useful as agent context.

## Phase 8: Validation dataset

### Goal

Validate the full MVP loop with a small representative dataset.

### Status

A lightweight manual validation procedure is documented in [`validation.md`](validation.md). It validates the collect/query/wiki loop with explicit public LinuxFr URLs and keeps generated `data/` files out of Git.

### Suggested validation set

Collect a bounded sample from:

- one news item;
- one journal;
- one forum post;
- one poll;
- one Atom feed;
- one comments feed when comments exist.

### Acceptance criteria

- Raw files exist for all selected sources.
- `linuxfr_query_raw` can find them.
- `linuxfr_update_wiki` can create cited notes from them.
- The agent can use the notes and raw references to explain what was collected.

## Deferred work

Do not implement during the MVP:

- full-site crawler;
- authenticated collection;
- form submission;
- voting, posting, or account actions;
- scheduled background jobs;
- vector database;
- advanced ranking;
- large taxonomy;
- browser automation for pages already available as Markdown or Atom;
- exhaustive historical archive download.
