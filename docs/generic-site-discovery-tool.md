# Generic Site Discovery Tool Specification

## Purpose

Build a generic Playwright-powered tool that explores a website from a root URL and produces a structured discovery document.

This tool is an upstream step before building website-specific Pi extensions. Its job is to understand how a website is organized so that later agents can design targeted tools for collecting, querying, and transforming site content.

The first target website will be <https://linuxfr.org>, but the tool must be generic enough to reuse on other websites later.

## Core idea

Given a root URL, for example:

```text
https://linuxfr.org
```

the tool should browse the website, inspect its pages, and generate a Markdown report describing:

- the main website sections;
- discovered navigation paths;
- page types and templates;
- URL patterns;
- visible features;
- forms and inputs;
- listing pages;
- detail pages;
- pagination patterns;
- comment or discussion areas;
- feeds or alternative formats if discovered;
- important links;
- metadata exposed by pages;
- what information each page type contains;
- candidate future tools that could be built for this website.

The output should help a developer or agent understand what specific tools should be implemented later.

## Non-goals

This first tool is not meant to:

- scrape an entire website exhaustively;
- bypass authentication or access controls;
- run as a background crawler;
- build a RAG index;
- extract perfect structured data;
- implement LinuxFr-specific business logic;
- answer community intelligence questions directly.

It is a discovery and mapping tool, not the final website-specific extension.

## Expected workflow

1. The user provides a root URL.
2. The tool launches Playwright.
3. The tool explores the site within explicit limits.
4. The tool records pages, links, forms, visible features, and recurring page structures.
5. The tool groups similar pages into likely templates or page types.
6. The tool writes a Markdown discovery report.
7. The report is used to design a later website-specific Pi extension.

## Exploration constraints

The exploration must be bounded and respectful.

Initial configurable limits should include:

- maximum number of pages;
- maximum depth from the root URL;
- allowed hostnames;
- excluded URL patterns;
- maximum time budget;
- optional delay between navigations;
- whether to follow query-string URLs;
- whether to inspect forms without submitting them.

The tool should not submit destructive forms or perform authenticated actions.

## First MVP behavior

The MVP can be simple.

Inputs:

- `rootUrl`: website root URL to explore;
- `maxPages`: maximum pages to visit;
- `maxDepth`: maximum link depth;
- `outputPath`: Markdown report path.

MVP output:

- visited URLs;
- skipped URLs with reasons;
- discovered internal links;
- top navigation links;
- forms found on pages;
- headings and landmarks;
- repeated URL patterns;
- rough page type guesses;
- candidate future extraction targets;
- open questions.

## Suggested report structure

```markdown
# Website Discovery Report: example.org

## Summary

High-level overview of the explored website.

## Exploration settings

- Root URL:
- Max pages:
- Max depth:
- Date:

## Main navigation

List of main navigation links and labels.

## Discovered sections

Grouped sections with URLs.

## URL patterns

Observed URL patterns and examples.

## Page types

### Page type: listing page

- Example URLs:
- Common selectors:
- Content found:
- Links to detail pages:
- Pagination:

### Page type: detail page

- Example URLs:
- Common selectors:
- Content found:
- Comments or discussion:

## Forms and interactions

- Search forms;
- login forms;
- comment forms;
- filters;
- other inputs.

## Feeds and alternative formats

RSS, Atom, JSON, print pages, APIs, or other discovered formats.

## Candidate future tools

- Tool name idea;
- purpose;
- required URLs or page types;
- expected output.

## Risks and unknowns

Fragile selectors, dynamic behavior, missing coverage, authentication boundaries.

## Raw observations

Visited URLs and brief notes.
```

## Relationship to `pi-linuxfr.org`

This repository currently targets LinuxFr, but this first step should produce a generic discovery capability.

After the discovery report for LinuxFr exists, the next session can use it to design the minimal LinuxFr-specific dataset tools:

1. `linuxfr_collect_pages`
2. `linuxfr_query_raw`
3. `linuxfr_update_wiki`

## Implementation direction

The implementation should be a Pi extension or tool implemented in TypeScript.

Before implementation, read the relevant Pi documentation for extensions and tools, then propose a plan.

Expected project-local location:

```text
.pi/extensions/
```

The tool should use Playwright for browsing.

Keep the first version small and inspectable.

## Validation criteria

The feature is acceptable when:

- a user can provide a root URL;
- Playwright explores a bounded set of pages;
- a Markdown discovery report is generated;
- the report is useful enough to design website-specific tools;
- the implementation is generic, not hard-coded only for LinuxFr;
- limits prevent accidental broad crawling.
