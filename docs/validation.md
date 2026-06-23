# LinuxFr MVP Validation

## Purpose

This document defines a small reproducible validation procedure for the LinuxFr dataset MVP.

The goal is to verify the complete local loop without expanding the platform:

```text
collect raw public LinuxFr sources
  -> query the local raw dataset
  -> create a cited Markdown wiki note
  -> inspect the generated outputs
```

This validation intentionally uses explicit public URLs only. It is not a crawler, does not require authentication, and does not submit forms.

## Preconditions

- The project is trusted by Pi so the project-local extension is loaded.
- The `linuxfr-dataset` extension exposes these tools:
  - `linuxfr_collect_pages`
  - `linuxfr_query_raw`
  - `linuxfr_update_wiki`
- `data/` is treated as a local generated dataset and is ignored by Git.

## Validation source set

Use a small representative sample. The exact detail URLs may be refreshed over time, but the sample should cover the same source types.

Validated on 2026-06-23 with:

| Type | URL | Expected raw format |
| --- | --- | --- |
| News feed | `https://linuxfr.org/news.atom` | Atom |
| Journals feed | `https://linuxfr.org/journaux.atom` | Atom |
| Forums feed | `https://linuxfr.org/forums.atom` | Atom |
| Polls feed | `https://linuxfr.org/sondages.atom` | Atom |
| Links feed | `https://linuxfr.org/liens.atom` | Atom |
| News detail | `https://linuxfr.org/news/revue-de-presse-de-l-april-pour-la-semaine-25-de-l-annee-2026` | Markdown |
| Journal detail | `https://linuxfr.org/users/tkr/journaux/l-appli-gratuite-nouvelle-telecommande-obligatoire-du-pauvre` | Markdown |
| Forum post detail | `https://linuxfr.org/forums/linux-general/posts/logiciels-adaptes-aux-seniors` | Markdown |
| Poll detail | `https://linuxfr.org/sondages/la-tete-dans-le-nuage` | Markdown |
| Link detail | `https://linuxfr.org/users/thoasm/liens/bien-choisir-son-moment-c-est-important` | HTML fallback |

## Step 1: collect feeds

Call `linuxfr_collect_pages` with:

```json
{
  "urls": [
    "https://linuxfr.org/news.atom",
    "https://linuxfr.org/journaux.atom",
    "https://linuxfr.org/forums.atom",
    "https://linuxfr.org/sondages.atom",
    "https://linuxfr.org/liens.atom"
  ],
  "preferredFormat": "auto",
  "maxItems": 5
}
```

Expected result:

- the tool reports five collected results or cache hits;
- each result has type `feed` and format `atom`;
- raw files are written under `data/raw/pages/`;
- metadata is appended to `data/raw/metadata.jsonl`.

## Step 2: collect representative detail pages

Call `linuxfr_collect_pages` with:

```json
{
  "urls": [
    "https://linuxfr.org/news/revue-de-presse-de-l-april-pour-la-semaine-25-de-l-annee-2026",
    "https://linuxfr.org/users/tkr/journaux/l-appli-gratuite-nouvelle-telecommande-obligatoire-du-pauvre",
    "https://linuxfr.org/forums/linux-general/posts/logiciels-adaptes-aux-seniors",
    "https://linuxfr.org/sondages/la-tete-dans-le-nuage",
    "https://linuxfr.org/users/thoasm/liens/bien-choisir-son-moment-c-est-important"
  ],
  "preferredFormat": "auto",
  "maxItems": 5
}
```

Expected result:

- news, journal, forum post, and poll details are collected as Markdown when available;
- the link detail may fall back to HTML;
- the tool reports local paths, canonical URLs, formats, source types, and cache hits.

## Step 3: query the local dataset

Call `linuxfr_query_raw` with:

```json
{
  "limit": 20
}
```

Expected result:

- collected feeds and detail pages are listed;
- each result includes at least type, format, local path, canonical URL, and fetched timestamp;
- Markdown entries include extracted titles and, when present, authors, tags, dates, license, and score.

Optional focused checks:

```json
{ "type": "feed", "limit": 10 }
```

```json
{ "query": "April", "limit": 5 }
```

## Step 4: create a validation wiki note

Use paths returned by `linuxfr_query_raw`, then call `linuxfr_update_wiki` with a small selected set. Example:

```json
{
  "sourcePaths": [
    "data/raw/pages/news-7604c0f743.md",
    "data/raw/pages/journal-85f73f6be3.md",
    "data/raw/pages/forum-post-785b7b0116.md",
    "data/raw/pages/poll-0d3721545b.md",
    "data/raw/pages/link-484ed8ae1b.html",
    "data/raw/pages/feed-ae6c4d98ad.atom"
  ],
  "topic": "LinuxFr MVP validation sample",
  "notePath": "validation-sample.md"
}
```

The exact hash-based filenames depend on the selected URLs and formats. Prefer copying the paths from `linuxfr_query_raw` instead of hard-coding them.

Expected result:

- `data/wiki/notes/validation-sample.md` is created or replaced;
- `data/wiki/index.md` links to the note;
- the note contains a `Sources` section with source URLs and local raw paths;
- observations cite both the source URL and raw local path.

## Step 5: inspect outputs

Inspect:

```text
data/raw/metadata.jsonl
data/raw/pages/
data/wiki/index.md
data/wiki/notes/validation-sample.md
```

Expected result:

- raw sources remain separate from wiki notes;
- wiki notes cite raw source URLs or local paths;
- no generated dataset file needs to be committed because `data/` is ignored.

## Current validation result

The procedure above was run successfully on 2026-06-23.

Observed behavior:

- Atom feeds were collected as `feed/atom`.
- News, journal, forum post, and poll detail pages were collected as Markdown.
- The tested link detail page fell back to HTML, which matches the current architecture caveat.
- `linuxfr_query_raw` found the collected sources.
- `linuxfr_update_wiki` created a cited note and updated the wiki index.
- Git remained clean because `data/` is ignored.

## Non-blocking follow-ups

These are useful but not required before considering the MVP loop validated:

- improve Atom extraction so feed entry titles and alternate URLs become structured metadata;
- improve HTML cleanup for link pages, because fallback notes currently include navigation text;
- add automated tests after this manual validation procedure stabilizes;
- optionally support comments collection once node IDs are extracted reliably.

Do not implement broader crawling, authentication, scheduled jobs, vector indexes, or a complex taxonomy as part of this validation step.
