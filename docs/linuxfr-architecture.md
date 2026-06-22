# LinuxFr Dataset Architecture

## Purpose

This document describes the LinuxFr-specific collection architecture inferred from the generated discovery reports and manual checks performed during the project.

It focuses on parsing, extraction, download formats, local storage, and the intended internal architecture for the MVP tools.

## Discovery inputs

The architecture is based on these local discovery reports:

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

The reports show that LinuxFr exposes public content through HTML pages, Markdown variants, and Atom feeds.

## High-level architecture

The public Pi tool surface should remain small:

```text
linuxfr_collect_pages
linuxfr_query_raw
linuxfr_update_wiki
```

Internally, `linuxfr_collect_pages` should dispatch to specialized collectors and extractors by detected source type and format.

```text
URL or feed input
  -> normalize URL
  -> classify LinuxFr source type
  -> choose preferred raw format
  -> fetch raw source
  -> parse lightweight metadata
  -> store raw file
  -> append metadata entry
```

Generated wiki notes are a separate layer:

```text
raw source files + metadata
  -> selected by user or query tool
  -> summarized/transformed by linuxfr_update_wiki
  -> stored in data/wiki/
```

## Local data layout

MVP layout:

```text
data/
  raw/
    pages/
    metadata.jsonl
  wiki/
    index.md
    notes/
```

Possible later additions, only when needed:

```text
data/
  extracted/
  index/
```

## Raw source formats

### Markdown

LinuxFr detail pages often expose a `.md` variant.

Observed working patterns:

```text
/news/<slug>.md
/users/<login>/journaux/<slug>.md
/forums/<forum>/posts/<slug>.md
/sondages/<slug>.md
```

Observed Markdown response type:

```text
text/x-markdown; charset=utf-8
```

Observed Markdown structure:

```text
URL:     https://linuxfr.org/news/example
Title:   Example title
Authors: example
Date:    2026-06-22T09:52:39+02:00
License: CC By-SA
Tags:    tag1, tag2 et tag3
Score:   4

Body text...
```

Markdown should be the preferred format for detail pages because it is clean, public, compact, and already includes useful metadata.

### Atom

LinuxFr exposes Atom feeds for listings, entities, and comments.

Observed section feeds:

```text
/news.atom
/journaux.atom
/liens.atom
/forums.atom
/sondages.atom
```

Observed specific feeds:

```text
/forums/<forum>.atom
/users/<login>.atom
/tags/<tag>/public.atom
/sections/<section>.atom
/nodes/<id>/comments.atom
```

Observed Atom response structure includes:

```xml
<feed>
  <id>...</id>
  <link rel="alternate" type="text/html" href="..."/>
  <link rel="self" type="application/atom+xml" href="..."/>
  <title>...</title>
  <updated>...</updated>
  <entry>
    <id>...</id>
    <published>...</published>
    <updated>...</updated>
    <link rel="alternate" type="text/html" href="..."/>
    <title>...</title>
    <content type="html">...</content>
  </entry>
</feed>
```

Atom should be the preferred discovery format for recent items and comments.

### HTML

HTML remains useful for:

- finding alternate links;
- finding `nodes/<id>/comments.atom` links;
- fallback collection when Markdown or Atom is unavailable;
- discovering forms and authentication boundaries;
- validating page type assumptions.

HTML should not be the first parsing target when Markdown or Atom is available.

### EPUB

LinuxFr detail pages often link `.epub` variants.

EPUB is not needed for the MVP because Markdown is easier to parse and store. EPUB support should be deferred.

## URL type classification

The collector should classify LinuxFr URLs with deterministic rules.

### News detail

Pattern:

```text
/news/<slug>
/news/<slug>.md
```

Detected fields from Markdown:

- URL;
- title;
- authors;
- date;
- license;
- tags;
- score;
- body.

Related resources:

- `/news.atom` for recent news;
- `/nodes/<id>/comments.atom` for comments when discovered.

### Journal detail

Pattern:

```text
/users/<login>/journaux/<slug>
/users/<login>/journaux/<slug>.md
```

Detected fields from Markdown:

- URL;
- title;
- authors;
- date;
- license;
- tags;
- score;
- body.

Related resources:

- `/journaux.atom`;
- `/users/<login>.atom`;
- `/nodes/<id>/comments.atom` when discovered.

### Link detail

Pattern:

```text
/users/<login>/liens/<slug>
```

The initial discovery found link detail pages, but a tested `.md` URL for one link returned `406`.

Architecture implication:

- do not assume every link detail has a Markdown variant;
- try Markdown only in `auto` mode and fall back to HTML if unavailable;
- parse external target URLs from HTML or Atom content when needed later.

### Forum post detail

Pattern:

```text
/forums/<forum>/posts/<slug>
/forums/<forum>/posts/<slug>.md
```

Observed Markdown variant works.

Related resources:

- `/forums.atom`;
- `/forums/<forum>.atom`;
- `/nodes/<id>/comments.atom`.

### Poll detail

Pattern:

```text
/sondages/<slug>
/sondages/<slug>.md
```

Observed Markdown variant works.

Poll pages also contain voting forms in HTML. The collector must never submit them.

Related resources:

- `/sondages.atom`;
- `/nodes/<id>/comments.atom`.

### Comments feed

Pattern:

```text
/nodes/<id>/comments.atom
```

Comments are tied to a numeric LinuxFr node ID, not directly to the visible content slug.

Architecture implication:

- store `nodeId` whenever discovered;
- comments should be fetched from Atom feeds;
- comments should be optional via `includeComments`.

### Listing pages

Patterns:

```text
/news
/journaux
/liens
/forums
/sondages
```

These pages expose navigation, pagination, item links, and Atom alternatives.

Architecture implication:

- use listing pages mainly for discovery diagnostics;
- use Atom feeds for actual bounded collection of recent items.

### Forum category pages

Pattern:

```text
/forums/<forum>
```

Discovered examples include:

```text
/forums/linux-general
/forums/linux-debian-ubuntu
/forums/linux-debutant
/forums/general-cherche-logiciel
/forums/general-hors-sujets
/forums/programmation-c
```

Each forum category may expose:

```text
/forums/<forum>.atom
```

### User pages

Pattern:

```text
/users/<login>
/users/<login>.atom
```

User pages list recent public content by a user. They are useful for discovery, not required for the first collection MVP.

### Tag pages

Pattern:

```text
/tags/<tag>/public
/tags/<tag>/public.atom
```

Tag pages list public content for a tag. They are useful for topic-oriented collection.

### Section pages

Pattern:

```text
/sections/<section>
/sections/<section>.atom
```

Section pages list public news by section. They are useful for topic-oriented collection.

## Forms and interaction boundaries

Discovery found these forms repeatedly:

- site search form: safe to inspect, not necessary to submit in MVP;
- login form: must not submit;
- signup form: must not submit;
- poll voting form: must not submit;
- content proposal or editorial forms: must not submit.

The MVP is read-only and anonymous.

## Format selection algorithm

For a user-provided URL:

1. Normalize and validate hostname is `linuxfr.org`.
2. Classify source type from the pathname.
3. If the URL is already `.atom`, fetch Atom.
4. If the URL is already `.md`, fetch Markdown.
5. If it is a known detail page and `preferredFormat` is `auto` or `markdown`, try the `.md` variant.
6. If Markdown is unavailable or unsupported, fetch HTML.
7. If `includeComments` is true and a `nodeId` or comments feed is discovered, fetch `/nodes/<id>/comments.atom`.

## Metadata model

Each collected raw source should append a JSON object to `data/raw/metadata.jsonl`.

Recommended fields:

```json
{
  "url": "https://linuxfr.org/news/example.md",
  "canonicalUrl": "https://linuxfr.org/news/example",
  "type": "news",
  "format": "markdown",
  "localPath": "data/raw/pages/news-example.md",
  "fetchedAt": "2026-06-22T00:00:00.000Z",
  "cacheHit": false,
  "httpStatus": 200,
  "contentType": "text/x-markdown; charset=utf-8",
  "title": "Example title",
  "authors": ["example"],
  "publishedAt": "2026-06-22T09:52:39+02:00",
  "license": "CC By-SA",
  "tags": ["tag1", "tag2"],
  "score": 4,
  "nodeId": 123456,
  "relatedUrls": ["https://linuxfr.org/nodes/123456/comments.atom"]
}
```

Not all fields will be available for every source.

## File naming

Raw files should use safe deterministic names derived from canonical URLs.

Recommended pattern:

```text
data/raw/pages/<type>-<short-hash>.<format-extension>
```

Examples:

```text
data/raw/pages/news-a1b2c3d4.md
data/raw/pages/feed-news-a1b2c3d4.atom
data/raw/pages/comments-144386-a1b2c3d4.atom
data/raw/pages/link-a1b2c3d4.html
```

A hash-based suffix avoids path length issues and collisions.

## Internal module structure

Suggested minimal implementation structure:

```text
.pi/extensions/linuxfr-dataset/
  index.ts
  package.json
  src/
    tools/
      collect-pages.ts
      query-raw.ts
      update-wiki.ts
    linuxfr/
      classify-url.ts
      fetch-source.ts
      metadata.ts
      storage.ts
      formats/
        markdown.ts
        atom.ts
        html.ts
      extractors/
        news.ts
        journal.ts
        link.ts
        forum-post.ts
        poll.ts
        comments.ts
        feed.ts
        user.ts
        tag.ts
        section.ts
```

The extractors should be internal helpers. The initial public tool surface should remain the three MVP tools.

## Parsing strategy

### Markdown parser

Parse the leading LinuxFr metadata block line by line until the first blank line after the known headers.

Expected headers:

```text
URL:
Title:
Authors:
Date:
License:
Tags:
Score:
```

The remaining content is the body.

Tags may use French natural-language joining such as:

```text
tag1, tag2 et tag3
```

The parser should split on commas and the final ` et `.

### Atom parser

Parse enough XML to extract:

- feed ID;
- feed title;
- feed updated timestamp;
- self URL;
- alternate HTML URL;
- entry IDs;
- entry titles;
- entry published and updated timestamps;
- entry alternate HTML URLs;
- entry HTML content when needed.

A small XML parser dependency is acceptable if it keeps implementation simple.

### HTML parser

HTML parsing should be fallback-oriented.

Initial useful selectors:

- `link[rel~="alternate"]` for Atom feeds;
- `a[href$=".md"]` for Markdown variants;
- links matching `/nodes/<id>/comments.atom` for comments;
- headings and title as fallback metadata;
- canonical links if present.

Avoid brittle extraction from visual layout unless Markdown and Atom are insufficient.

## Caching and duplicate detection

Canonical URL should be the main deduplication key.

Rules:

- Strip `.md` and `.epub` suffixes when deriving canonical detail URLs.
- Keep `.atom` URLs canonical as feeds.
- Store both requested URL and canonical URL.
- If a canonical URL and preferred format already exist locally, return a cache hit unless `forceRefresh` is true.

## Collection boundaries

The LinuxFr MVP must not:

- crawl the whole website;
- follow pagination indefinitely;
- submit forms;
- log in;
- vote;
- post content;
- collect private or authenticated pages;
- bypass technical protections.

Collection should be bounded by explicit user inputs such as URL lists, feed URLs, known section names, and `maxItems`.

## Known caveats from discovery

- The generic discovery heuristic classified many pages as `search-or-filter` because the global search form appears on most pages.
- Link detail pages may not support `.md` consistently.
- The generic discovery report followed at least one external final URL during detail-page discovery; LinuxFr-specific collection should strictly enforce the `linuxfr.org` hostname except for storing external target URLs as metadata.
- EPUB links are visible but should be deferred.
- Comments feeds can be empty.

## Validation targets

A good MVP validation sample should include:

- one news Markdown page;
- one journal Markdown page;
- one forum post Markdown page;
- one poll Markdown page;
- one section Atom feed;
- one comments Atom feed;
- one link detail page, likely via HTML fallback.

The validation should prove that raw sources are collected, queryable, and usable as cited inputs for wiki notes.
