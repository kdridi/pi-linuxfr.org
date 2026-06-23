# Prompt: Review the Chosen File-Based Ticket Workflow

```text
We are working on a repository named pi-linuxfr.org.

Project context:
- The project builds a minimal Pi extension around public LinuxFr.org pages.
- The current technical MVP has three Pi tools:
  1. linuxfr_collect_pages: collect explicit public LinuxFr URLs into local raw files.
  2. linuxfr_query_raw: inspect the local raw dataset.
  3. linuxfr_update_wiki: create lightweight cited Markdown wiki notes from selected raw sources.
- The broader goal is to use Pi as a general agentic harness and LinuxFr as a first public-read-only dataset provider.
- The project intentionally follows small MVP steps.
- No full crawler, no authentication, no private data, no vector database, no heavy automation unless clearly justified.
- Work often happens across separate AI-agent sessions, so handoff and resumability matter.
- Repository artifacts must be written in English.

About Pi:
- Official website and documentation entry point: https://pi.dev
- Pi is a minimal terminal coding harness for AI-assisted software work.
- We use Pi both to build this repository and as the runtime for the LinuxFr extension we are building.
- By default, Pi gives the model coding tools such as read, write, edit, and bash.
- Pi loads repository guidance from files such as AGENTS.md.
- Pi sessions can be resumed, forked, branched, compacted, and exported, but separate work sessions still need durable file-based handoff.
- Pi is intentionally minimal: it does not impose built-in to-dos, plan mode, sub-agents, or a project-management workflow.
- Pi can be extended with TypeScript extensions, skills, prompt templates, themes, and packages.
- Project-local extensions live under .pi/extensions/ after project trust and can register custom tools via pi.registerTool().
- The existing LinuxFr tools are implemented as Pi extension tools.

Task:
We have now chosen a first version of a lightweight file-based ticket workflow. I want you to review and challenge it from the perspective of an AI coding agent that will actually have to use it across many separate Pi sessions.

Important output constraint:
- Return your entire answer as one single Markdown response block.
- Do not create or reference additional downloadable files.
- Do not say "see attached file" or "I created files".
- If you want to propose examples, include them inline in your answer.
- The response must be copy-pasteable as one Markdown document into a single response file.

Please review the chosen organization below.

Chosen directory layout:

```text
tickets/
  README.md
  TEMPLATE.md
  backlog/
    .gitkeep
  planned/
    .gitkeep
    PLF-001.md
  ongoing/
    .gitkeep
  completed/
    .gitkeep
  rejected/
    .gitkeep
```

Chosen `tickets/README.md`:

```markdown
# Lightweight Ticket Workflow

This directory contains the minimal file-based ticket workflow for `pi-linuxfr.org`.

The goal is not to create a project-management platform. The goal is to keep Pi-assisted work small, inspectable, and easy to resume across conversations.

## Principles

- One ticket should describe one atomic feature or change.
- One ticket should normally map to one focused commit.
- Only one ticket may be in `ongoing/` at a time.
- Tickets are Markdown files; git is the audit trail.
- The workflow is intentionally manual until automation is clearly needed.
- Repository artifacts must stay in English.
- Bootstrap changes may happen without an existing ticket only when creating or repairing the ticket workflow itself.

## Directory states

```text
tickets/
  backlog/     Raw ideas, rough notes, and unscheduled work.
  planned/     Refined tickets ready for implementation.
  ongoing/     The single active ticket being implemented.
  completed/   Tickets whose work has been implemented, verified, and committed.
  rejected/    Tickets intentionally not implemented as written.
```

The ticket state is the directory that contains the ticket file. Avoid extra pointer files or indexes until the directory layout becomes insufficient.

## State meanings

### `backlog/`

Use this as the project inbox. A backlog ticket may be incomplete or exploratory. It captures ideas that should not be lost, such as unscheduled capabilities, prompt experiments, cleanup tasks, or research questions.

A backlog ticket is not a commitment to implement the work.

### `planned/`

A planned ticket is ready for implementation. It must be self-contained enough for another Pi session to implement it without guessing the intent, scope, dependencies, expected artifacts, or verification method. It should be small enough to complete as one focused commit.

### `ongoing/`

Only one ticket belongs here. Moving a ticket to `ongoing/` means the next code, documentation, or data-shaping change should serve that ticket.

### `completed/`

Move a ticket here after the change is implemented, verified, and committed. Record the final commit identifier when practical. The commit message is the primary durable link between git history and the ticket.

### `rejected/`

Move a ticket here when it should not be implemented as written. Use this for obsolete tickets, duplicates, unsafe ideas, out-of-scope work, or oversized tickets superseded by smaller split tickets.

Rejected tickets are historical records. They should explain why the work was rejected or what replaced it.

## State transitions

Moving a ticket between directories is a state transition. It changes what the ticket means and what another agent is allowed to assume about it.

For every transition:

- update the `status` field so it matches the directory;
- update the `updated` timestamp using the `date` command;
- append a short entry to the ticket log;
- keep the ticket ID stable.

### `backlog/` -> `planned/`

This is a refinement step. The goal is to turn a captured idea into work that is ready to implement.

Before moving a ticket to `planned/`, it must satisfy the definition of ready:

- [ ] The objective is clear.
- [ ] The scope says what is in and out.
- [ ] Acceptance criteria are concrete and verifiable.
- [ ] Expected artifacts or affected files are identified when possible.
- [ ] Dependencies are explicit and resolved enough to choose an implementation order.
- [ ] The ticket is small enough for one focused implementation pass.
- [ ] The verification method is described.
- [ ] A fresh Pi session could implement the ticket from the ticket content and cited project documents.

If the ticket is not ready:

- ask framing questions when the objective, scope, artifacts, or acceptance criteria are unclear;
- inspect relevant project files and documents when feasibility or architecture is uncertain;
- identify missing dependencies and either reference completed tickets or propose prerequisite tickets;
- propose a split when the ticket is too broad, risky, cross-cutting, or hard to verify in one pass;
- keep the original ticket in `backlog/` until the user validates the refined ticket or split proposal.

Do not move a ticket to `planned/` if implementation still depends on hidden assumptions.

### `planned/` -> `ongoing/`

This is an activation step. The goal is to start exactly one implementation session for exactly one ticket.

Before moving a ticket to `ongoing/`:

- [ ] `tickets/ongoing/` is empty except for `.gitkeep`.
- [ ] All required dependencies are completed, or the user explicitly accepts working on this ticket before them.
- [ ] The ticket can be implemented from its own content and cited project documents.
- [ ] The next session can start from a prompt that names this ticket and asks the agent to implement only it.

If activation is not ready:

- if another ticket is already ongoing, finish, pause, or move that ticket before activating a new one;
- if dependencies are missing, complete them first or ask the user whether to change the order;
- if the implementation prompt cannot be written from the ticket content, move the ticket back to `planned/` and refine it;
- if the ticket became too large, move it back to `backlog/` or split it into smaller planned tickets.

Once a ticket is in `ongoing/`, avoid changing its scope. If the scope is wrong, move it back to `planned/`, update it, or split it before implementing.

### `ongoing/` -> `completed/`

This is a completion step. The goal is to record that the requested change was implemented, verified, and committed.

Before moving a ticket to `completed/`:

- [ ] Acceptance criteria are satisfied.
- [ ] Tests or manual verification were run where applicable.
- [ ] Files changed are listed in the ticket.
- [ ] Important decisions are recorded.
- [ ] The commit message includes the ticket ID.
- [ ] The final commit identifier is recorded when practical.
- [ ] `tickets/ongoing/` is empty again except for `.gitkeep` after the move.

If completion is not ready:

- if verification fails, keep the ticket in `ongoing/`, record the failure, and fix only in-scope issues;
- if the implementation revealed missing scope, ask whether to expand the ticket, split a follow-up ticket, or move the ticket back to `planned/`;
- if unrelated work was discovered, create or update a backlog ticket instead of adding it to the ongoing ticket;
- if the commit is not clean or focused, reorganize the work before completing the ticket.

### Any state -> `rejected/`

This is a decision step. The goal is to preserve the reason why a ticket should not be implemented as written.

Move a ticket to `rejected/` when:

- it is a duplicate;
- it is obsolete;
- it conflicts with project constraints;
- it is too broad and has been replaced by smaller tickets;
- it was explored and intentionally abandoned.

Before moving a ticket to `rejected/`:

- [ ] The reason is written in `Resolution` or `Notes`.
- [ ] Replacement tickets are linked when they exist.
- [ ] Useful context is preserved.

If the idea is merely vague, keep it in `backlog/` instead of rejecting it.

## Dependency procedure

Dependencies must be explicit before a ticket enters `planned/`.

When a dependency is discovered:

1. Add it to the ticket's `Dependencies` section and frontmatter if useful.
2. Check whether the dependency is already completed.
3. If it is completed, reference the ticket or commit.
4. If it exists in `backlog/`, refine and schedule it before the dependent ticket.
5. If it does not exist, propose a new prerequisite ticket.
6. If dependency order is unclear, keep the dependent ticket in `backlog/` and ask for clarification.

A planned ticket may depend on another planned ticket, but the dependency must be explicit and the dependency should be implemented first.

## Split procedure

Split a ticket when it is too broad, risky, cross-cutting, hard to verify in one pass, or likely to require multiple unrelated commits.

A split proposal should:

1. Identify the smallest independently valuable outcomes.
2. Create one ticket per outcome.
3. Give each child ticket its own objective, scope, acceptance criteria, dependencies, and verification method.
4. Add dependency links between child tickets when order matters.
5. Ask the user to approve the split before moving child tickets to `planned/`.
6. Move the original ticket to `rejected/` with `Resolution: superseded by <ticket ids>` when the child tickets replace it.

The original ticket is not `completed` unless it was actually implemented. A superseded parent belongs in `rejected/` because it should not be implemented as written.

## Manual session workflow

At the start of a Pi session that uses tickets:

1. Read `tickets/README.md`.
2. Inspect `tickets/ongoing/`.
3. If one ticket is ongoing, continue only that ticket.
4. If more than one ticket is ongoing, stop and report workflow corruption.
5. If no ticket is ongoing, inspect `tickets/planned/`.
6. If a planned ticket is selected, verify the definition of ready and dependencies before activating it.
7. If no planned ticket is ready, refine or create tickets in `tickets/backlog/`.

During implementation:

- treat the ongoing ticket as the scope contract;
- append useful handoff notes to the ticket log as work progresses;
- turn unrelated discoveries into backlog tickets;
- do not silently expand the ticket scope.

When work stops mid-ticket, leave the ticket in `ongoing/` and add a log entry explaining the current state, what was tried, and what should happen next.

## Ticket ID convention

Use the `PLF` prefix for this repository:

```text
PLF-001
PLF-002
PLF-003
```

Assign the next number by scanning all ticket directories and incrementing the highest existing ID.

## Commit convention

Use this form:

```text
PLF-001: Add bounded candidate extraction
```

The commit message is the primary durable link from git history to the ticket. Record the final commit identifier in the ticket when practical, but do not create awkward self-referential commit amendments only to force the hash into the same commit.

Keep commits focused. If a ticket naturally wants multiple unrelated commits, the ticket is probably too large and should be split.

## Ticket quality guardrails

A ticket may be vague in `backlog/`, but it must not be vague in `planned/` or `ongoing/`.

A planned or ongoing ticket should answer these questions:

- What exact outcome should exist after the work?
- Why does the outcome matter?
- What is explicitly in scope?
- What is explicitly out of scope?
- What dependencies must exist first?
- Which files, directories, tools, prompts, or documents are likely to change?
- How will the result be verified?
- What artifacts should be produced or updated?

If these questions cannot be answered, keep the ticket in `backlog/` or move it back there.

Completed and rejected tickets are historical records. Prefer creating a follow-up ticket over rewriting a terminal ticket, except to fix metadata or add a missing commit identifier.

## When to add automation

Do not add scripts, validation hooks, worktrees, or Pi tools for the ticket workflow until the manual process becomes painful. The primary goal is discipline and resumability, not automation.

If automation becomes useful, start with checks that preserve the manual workflow:

- at most one ticket in `ongoing/`;
- required sections present in `planned/` and `ongoing/` tickets;
- dependencies in `planned/` and `ongoing/` are explicit;
- ticket IDs are unique.

```

Chosen `tickets/TEMPLATE.md`:

```markdown
---
id: PLF-XXX
title: "Short imperative title"
status: backlog
priority: P0 | P1 | P2
type: feature | bugfix | refactor | docs | research | infrastructure
created: YYYY-MM-DD HH:MM:SS
updated: YYYY-MM-DD HH:MM:SS
dependencies: []
estimated_complexity: small | medium | large
---

# PLF-XXX: Short imperative title

## Objective

Describe the one outcome this ticket should accomplish.

## Context

Explain why this matters and what prior documents, prompts, commits, or tickets motivated it.

## Scope

In scope:

- Item 1.
- Item 2.

Out of scope:

- Item 1.
- Item 2.

## Acceptance Criteria

- [ ] Criterion 1.
- [ ] Criterion 2.
- [ ] Criterion 3.

## Dependencies

- None.

## Implementation Notes

List likely files, design constraints, or manual steps. Keep this lightweight.

## Verification

Describe how the change should be checked before commit.

## Files Changed

To be filled before completion.

## Decisions

Record notable design decisions made while working on the ticket.

## Notes

Open questions, risks, or follow-up ideas.

## Resolution

To be filled when the ticket reaches `completed/` or `rejected/`.

For `completed/`, include the final commit identifier when practical and summarize the shipped outcome.

For `rejected/`, explain why the ticket should not be implemented as written and link replacement tickets when applicable.

## Log

Append-only handoff log. Add dated entries when the ticket is created, moved between states, paused, verified, completed, rejected, or materially clarified.

- YYYY-MM-DD HH:MM:SS: Ticket created.

```

Current `AGENTS.md`:

```markdown
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

## Ticket workflow

When work is driven by local tickets, read `tickets/README.md` before changing files.

Use the ticket directories as workflow state:

- `tickets/backlog/` for rough ideas;
- `tickets/planned/` for implementation-ready tickets;
- `tickets/ongoing/` for the single active ticket;
- `tickets/completed/` for implemented and verified tickets;
- `tickets/rejected/` for tickets intentionally not implemented as written.

At the start of ticketed work, inspect `tickets/ongoing/` first. If a ticket is ongoing, continue only that ticket unless the user explicitly changes direction.

## Change discipline

Before adding anything new, ask:

1. Does the three-tool MVP need this?
2. Can it be done more simply?
3. Can it wait?

If the answer is yes, prefer waiting.

## Session handoff

When the user asks whether the conversation can be reset, follow the end-of-conversation ritual in `RHYTHM.md`: check the repository state, explain pending commits or confirm the clean handoff point, and provide a readable restart prompt for the next conversation. Show that prompt to the user and, when possible, copy it to the clipboard with `pbcopy`.

```

Your review should answer the following questions:

1. Agent usability verdict
   - If you were the AI coding agent dropped into this repository in a fresh Pi session, could you use this workflow reliably?
   - What would be immediately clear?
   - What would still be ambiguous?

2. Fit to Pi
   - Does this workflow fit Pi's file-based, minimal, extensible philosophy?
   - Does it make good use of the fact that Pi agents can read files, edit files, run shell commands, and resume/fork sessions?
   - Does it avoid assuming features Pi does not provide by default?

3. Directory structure review
   - Is the chosen state model (`backlog`, `planned`, `ongoing`, `completed`, `rejected`) the right one?
   - Is any directory missing?
   - Is any directory unnecessary?
   - Are the directory names optimal for an AI agent and a human maintainer?

4. README review
   - Is the README durable over time?
   - Are the state transition rules clear enough?
   - Does it explain what to do when a rule fails?
   - Is the dependency procedure operational enough?
   - Is the split procedure operational enough?
   - Is the session workflow precise enough for a cold AI session?
   - What is too verbose, too vague, or missing?

5. Template review
   - Is the ticket template minimal but sufficient?
   - Which fields are useful?
   - Which fields are redundant?
   - Which required fields or sections are missing?
   - Does it support backlog vagueness while enforcing planned/ongoing readiness?
   - Does it support good handoff if a session stops mid-ticket?

6. AGENTS.md review
   - Is the ticket guidance in AGENTS.md enough?
   - Should AGENTS.md say more or less about tickets?
   - Is there any conflict between the ticket workflow and the existing MVP/change-discipline instructions?

7. Optimization proposal
   - If you would change the system, propose the smallest concrete changes.
   - Separate must-change recommendations from nice-to-have recommendations.
   - Do not propose heavy automation unless you can justify why the manual workflow would fail without it.
   - If you propose edits, describe them concretely enough that another agent could apply them.

8. Can you work with this?
   - State explicitly whether you, as an AI coding agent, could follow this workflow as-is.
   - If not, what exact missing information would block you?
   - If yes, what mistakes would you still be likely to make?

9. Pre-mortem
   Imagine this ticket workflow has become counterproductive six months from now.
   - What probably went wrong?
   - Which rule was ignored first?
   - Which directory became noisy or misleading?
   - Which part became ceremony without value?
   - Which ambiguity caused repeated agent mistakes?
   - What early warning signs should the maintainer watch for?
   - What minimal guardrails would prevent those failures?

10. Final recommendation
   - Keep as-is, adjust lightly, or redesign?
   - Give your final recommended version in concise form.
   - If you recommend changes, rank them by urgency.

Be direct and critical. The goal is not to praise the workflow. The goal is to find the smallest improvements that would make it more reliable for Pi-assisted, session-by-session development without turning it into a project-management platform.
```
