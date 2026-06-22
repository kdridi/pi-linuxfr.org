# Roadmap

## Goal

Build a minimal Pi extension that helps create a local, agent-friendly dataset from linuxfr.org.

The MVP is intentionally small: collect relevant raw pages, inspect/query what was collected, and compile a lightweight Markdown wiki from those sources.

This project should become a repeatable pattern for future website-specific datasets, but LinuxFr is the first use case.

## Principles

- Less is more.
- Public anonymous LinuxFr content only.
- Start with a few useful tools, not a large platform.
- Keep raw downloaded data on disk.
- Keep generated knowledge separate from raw sources.
- Use Playwright first to understand the website structure.
- Build only what is needed for the next useful loop.
- Everything in this repository is written in English.

## MVP tools

### 1. `linuxfr_collect_pages`

Download LinuxFr pages relevant to a user request and store them as raw local files.

Initial behavior:

- accept explicit URLs and/or a simple search query;
- download a small bounded number of pages;
- store HTML and metadata under `data/raw/`;
- avoid downloading the same URL repeatedly when already cached.

### 2. `linuxfr_query_raw`

Inspect the local raw dataset and return relevant collected sources.

Initial behavior:

- list collected pages;
- search metadata and extracted plain text if available;
- return source paths and URLs;
- help the agent decide whether more collection is needed.

### 3. `linuxfr_update_wiki`

Compile or update a small Markdown wiki from selected raw pages.

Initial behavior:

- read selected raw pages;
- extract readable content;
- create or update Markdown notes under `data/wiki/`;
- cite source URLs and local raw files;
- keep the wiki lightweight and human-readable.

## Minimal data layout

```text
data/
  raw/
    pages/
    metadata.jsonl
  wiki/
    index.md
    notes/
```

Later, if needed:

```text
data/
  extracted/
  index/
```

Do not add these until the MVP needs them.

## Phase 0 — Project skeleton

- Create the Pi extension skeleton.
- Add the minimal dependencies.
- Confirm the extension loads in Pi.
- Add one diagnostic command or tool.

## Phase 1 — Playwright discovery

- Use Playwright to inspect LinuxFr manually.
- Identify how to search, open entries, read comments, and find useful links.
- Document only the selectors and URL patterns needed for the MVP tools.

## Phase 2 — Raw collection MVP

- Implement `linuxfr_collect_pages`.
- Store raw HTML and metadata locally.
- Add basic duplicate detection by URL.
- Keep request counts bounded.

## Phase 3 — Local query MVP

- Implement `linuxfr_query_raw`.
- Allow the agent to inspect what has already been collected.
- Return concise source references.

## Phase 4 — Wiki MVP

- Implement `linuxfr_update_wiki`.
- Generate simple Markdown notes from selected sources.
- Cite original URLs and local raw files.

## Not now

Do not implement these yet:

- full crawler;
- authentication;
- vector database;
- complex RAG;
- large taxonomy;
- automated scheduled collection;
- advanced trend analysis;
- personal branding workflows;
- project recommendation engine.

These may come later, after the three-tool MVP works well.
