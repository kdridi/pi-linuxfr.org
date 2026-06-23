# pi-linuxfr.org

`pi-linuxfr.org` is a minimal project-local Pi extension for building a small, local, agent-friendly dataset from public LinuxFr.org pages.

The MVP is intentionally narrow: collect a few explicit public LinuxFr sources, inspect what has been collected, and generate lightweight cited Markdown notes from the local raw files.

## What this project provides

The LinuxFr dataset extension lives in:

```text
.pi/extensions/linuxfr-dataset/
```

It registers small, single-purpose Pi tools:

- `linuxfr_collect_pages`: collect explicit public `linuxfr.org` URLs into local raw files.
- `linuxfr_query_raw`: inspect collected raw sources with simple local filters.
- `linuxfr_extract_candidates`: extract deduplicated LinuxFr detail URL candidates from already collected local seed sources.
- `linuxfr_update_wiki`: create or update cited Markdown notes from selected raw sources.

The tools are designed for human-directed collection, not crawling.

## Local data layout

Generated data is stored under `data/` and ignored by Git:

```text
data/
  raw/
    pages/
    metadata.jsonl
  wiki/
    index.md
    notes/
```

Raw sources remain the source material. Wiki notes are generated knowledge and must cite source URLs or local raw paths.

## Typical usage loop

1. Collect a small set of explicit public LinuxFr URLs:

   ```json
   {
     "urls": [
       "https://linuxfr.org/news.atom",
       "https://linuxfr.org/news/example"
     ],
     "preferredFormat": "auto",
     "maxItems": 2
   }
   ```

2. Inspect the local dataset:

   ```json
   {
     "limit": 20
   }
   ```

3. Extract candidate detail URLs from already collected seed sources when selection should be reproducible:

   ```json
   {
     "sourceType": "tag",
     "query": "agent llm",
     "limit": 10
   }
   ```

4. Create a cited wiki note from selected paths or URLs returned by `linuxfr_query_raw`:

   ```json
   {
     "sourcePaths": [
       "data/raw/pages/news-examplehash.md"
     ],
     "topic": "LinuxFr example note",
     "notePath": "example-note.md"
   }
   ```

5. Use the generated note under `data/wiki/notes/` and the cited raw files as local context.

## Supported MVP sources

The collector accepts explicit public LinuxFr URLs and currently supports the MVP formats needed for validation:

- Atom feeds, such as `/news.atom`, `/journaux.atom`, `/forums.atom`, `/sondages.atom`, and `/liens.atom`.
- Markdown detail pages when LinuxFr exposes a `.md` variant, including news, journals, forum posts, and polls.
- HTML fallback for detail pages where Markdown is unavailable, notably some link pages.

In `auto` mode, detail pages prefer Markdown and fall back to HTML when needed. Atom URLs are collected as Atom.

## Validation

A reproducible manual MVP validation procedure is documented in:

```text
docs/validation.md
```

It validates the full loop:

```text
collect raw public LinuxFr sources
  -> query the local raw dataset
  -> create a cited Markdown wiki note
  -> inspect generated outputs
```

The validation uses a small representative sample of public LinuxFr feeds and detail pages. Generated `data/` files should not be committed.

## Intentional limits

This MVP does not implement:

- a crawler;
- authentication;
- form submission, voting, posting, or account actions;
- full comments support;
- automatic collection from extracted candidates;
- a vector database;
- scheduled jobs;
- a complex taxonomy;
- exhaustive Atom or HTML extraction.

Those capabilities may be considered later, after the small collect/query/wiki loop remains useful and easy to inspect.
