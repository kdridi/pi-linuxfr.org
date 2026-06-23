# LinuxFr V2 System Roadmap

## System thesis

Pi is the general agentic harness. The LinuxFr extension should provide reliable, bounded, public-read-only capabilities that turn LinuxFr into an agent-friendly local dataset.

The goal is not to crawl LinuxFr blindly. The goal is to support repeatable research runs:

```text
user intent
  -> seed discovery
  -> candidate extraction
  -> candidate ranking
  -> detail collection
  -> comment collection
  -> local structuring
  -> coverage review
  -> cited synthesis
  -> next leads
```

## System flow

```text
[User intent]
   |
   v
[Seed sources]
feeds, tags, listings, explicit URLs
   |
   v
[Candidate extraction]
internal LinuxFr URLs found in seeds
   |
   v
[Candidate ranking]
score by topic, type, date, tags, title, snippet
   |
   v
[Detail collection]
collect selected news, journals, links, forums, polls
   |
   v
[Discussion collection]
collect public comments for selected high-value pages
   |
   v
[Structured local dataset]
metadata, source cards, comments, run manifest
   |
   v
[Coverage review]
what is strong, weak, missing, biased
   |
   v
[Cited report / wiki]
agent-readable synthesis with sources
```

## Feature justification table

| Stage | Feature | Mode | What it adds to the system | Why it is needed | What breaks without it |
|---|---|---|---|---|---|
| Acquisition | Explicit URL collection | TypeScript | Brings known public LinuxFr pages into the local dataset. | Basic trusted ingestion primitive. | No raw material exists locally. |
| Acquisition | Atom feed parsing | TypeScript | Turns feeds into structured entries: title, URL, date, author, tags, snippet. | Feeds are the safest recent-entry seeds. | The agent must parse XML ad hoc and may miss entries. |
| Discovery | Tag/listing parsing | TypeScript | Extracts LinuxFr detail URLs from tag and listing pages. | Tags/listings are the main topical discovery surface. | The agent only sees manually supplied URLs or recent feeds. |
| Discovery | Candidate URL extraction | TypeScript | Produces a deduplicated list of candidate LinuxFr detail pages from collected seeds. | This is the bridge from seeds to real evidence. | Discovery depends on LLM improvisation and is not repeatable. |
| Discovery | Candidate ranking | Hybrid | Scores candidates by matched terms, title, tags, type, date, and source context; LLM can make final choices. | The agent needs an inspectable shortlist, not a raw link dump. | Important pages may be missed; irrelevant pages may be collected. |
| Acquisition | Candidate detail collection | TypeScript | Collects selected candidate pages as Markdown or HTML fallback. | Reports need actual page content, not only feed summaries. | Analysis remains shallow and feed-dependent. |
| Depth | Public comment collection | TypeScript | Collects public comments for selected detail pages. | LinuxFr's main value is often in the discussion, not the post. | The system misses objections, corrections, consensus, and community knowledge. |
| Depth | Comment parsing | TypeScript | Structures comments by author, date, score, parent/depth, text, links. | Comments need to become queryable evidence. | The LLM receives noisy discussion blobs and cannot reason reliably. |
| Local structure | Run manifest | TypeScript | Records seeds, candidates, selected pages, comments, failures, timestamps. | Research runs must be auditable and reproducible. | The cumulative dataset becomes ambiguous and hard to review. |
| Local structure | Source cards | Hybrid | Creates one normalized card per important source: claim, type, metadata, relevance, citations. | Helps Pi reuse evidence across prompts. | Reports repeatedly re-interpret raw sources from scratch. |
| Local query | Better raw query | TypeScript | Multi-term search, type/date filters, snippets, matched fields. | The agent needs precise local retrieval. | Search remains noisy and hard to trust. |
| Quality | Coverage report | Hybrid | Shows source balance, weak topics, missing tags, overused source types. | Prevents overconfident reports from weak corpora. | The agent may treat a biased corpus as representative. |
| Synthesis | Topic report templates | Prompt / LLM | Standardizes outputs: radar, reaction map, contradiction atlas, pain ledger. | Repeatable prompts need consistent structure. | Each run invents its own format and quality varies. |
| Synthesis | Comment synthesis | LLM | Extracts consensus, objections, corrections, alternatives, and high-score insights. | This turns LinuxFr discussion into useful intelligence. | Comments are collected but not transformed into insight. |
| Knowledge | Wiki update | Hybrid | Persists cited findings in Markdown. | Allows incremental local memory. | Each run is isolated and knowledge does not compound. |

## Minimal V2 workflow

A useful V2 does not need every feature. The smallest coherent V2 is:

1. parse Atom feeds;
2. parse tag/listing pages;
3. extract and rank candidate detail URLs;
4. collect selected details;
5. collect and parse comments for the top selected pages;
6. write a run manifest;
7. generate a cited report.

## Priority roadmap

| Priority | Capability | Reason |
|---:|---|---|
| 1 | Candidate extraction from feeds/tags/listings | Enables bounded topical discovery. |
| 2 | Candidate ranking and shortlist output | Makes discovery inspectable and repeatable. |
| 3 | Run manifest | Makes each research run auditable. |
| 4 | Public comment collection | Unlocks LinuxFr's real community value. |
| 5 | Comment parsing | Makes discussions usable as evidence. |
| 6 | Coverage report | Prevents overconfident synthesis. |
| 7 | Topic report templates | Makes repeatable product workflows. |

## Core design principle

TypeScript should produce reliable tables and structured evidence.

The LLM should choose, interpret, compare, and synthesize.

```text
TypeScript = deterministic data operations
LLM = semantic orchestration and explanation
Pi = the agentic runtime connecting both
```
