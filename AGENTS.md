# AGENTS.md

## Project

This repository is `pi-linuxfr.org`.

The goal is to build a minimal Pi extension that helps create a local, agent-friendly dataset from public linuxfr.org pages.

The first MVP should provide only a few tools:

1. collect raw LinuxFr pages into local files;
2. query what has already been collected;
3. compile or update a lightweight Markdown wiki from selected raw sources.

The broader motivation is to learn how to build useful input datasets for agents with Pi. LinuxFr is the first website use case.

## Language policy

Everything committed to this repository must be written in English:

- code;
- comments;
- filenames;
- directory names;
- documentation;
- tool names;
- tool descriptions;
- tests.

User conversations may happen in French, but repository artifacts must stay in English.

## MVP mindset

Prefer the smallest useful implementation.

Do not build a platform before the basic loop works:

```text
question or intent
  -> collect relevant raw pages
  -> store them locally
  -> inspect collected sources
  -> update a small Markdown wiki
  -> answer or continue collecting
```

Avoid premature complexity:

- no full crawler;
- no authentication;
- no vector database at first;
- no complex taxonomy;
- no scheduled background jobs;
- no personal strategy automation in the MVP.

## Initial tools

### `linuxfr_collect_pages`

Downloads a small bounded set of LinuxFr pages and stores raw data locally.

Expected outputs:

- local raw file paths;
- source URLs;
- fetch metadata;
- cache hit information.

### `linuxfr_query_raw`

Inspects the local raw dataset.

Expected outputs:

- collected source list;
- simple matching results;
- local paths and URLs;
- enough context for the agent to decide whether more collection is needed.

### `linuxfr_update_wiki`

Creates or updates lightweight Markdown notes from selected raw sources.

Expected outputs:

- updated wiki files;
- cited source URLs;
- cited local raw paths;
- short summary of what changed.

## Data layout

Start with:

```text
data/
  raw/
    pages/
    metadata.jsonl
  wiki/
    index.md
    notes/
```

Add `data/extracted/` or `data/index/` only when the MVP clearly needs them.

## Raw sources and wiki

Follow the simple version of the LLM Wiki idea:

- raw downloaded pages are source material;
- the Markdown wiki is generated knowledge;
- the wiki must cite source URLs or local raw files;
- generated wiki text must not replace raw sources.

## Pi extension guidance

Pi extensions are TypeScript modules. Project-local extensions should live under `.pi/extensions/` so Pi can auto-discover them after the project is trusted.

Follow the Pi extension API:

- export a default function receiving `ExtensionAPI`;
- register tools with `pi.registerTool()`;
- define schemas with `typebox`;
- keep Playwright/browser resources scoped and cleaned up;
- keep tool implementation small and easy to inspect.

## Website access policy

Use public anonymous content only.

This is human-directed collection, not bulk crawling:

- keep page counts bounded;
- avoid repeated downloads of the same URL;
- prefer local cached raw files;
- do not bypass access controls or technical protections.

## Change discipline

Before adding anything new, ask:

1. Does the three-tool MVP need this?
2. Can it be done more simply?
3. Can it wait?

If the answer is yes, prefer waiting.

## Session handoff

When the user asks whether the conversation can be reset, follow the end-of-conversation ritual in `RHYTHM.md`: check the repository state, explain pending commits or confirm the clean handoff point, and provide a readable restart prompt for the next conversation. Show that prompt to the user and, when possible, copy it to the clipboard with `pbcopy`.
