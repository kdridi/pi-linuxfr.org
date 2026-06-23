# Lightweight Ticket Workflow

This directory contains the minimal file-based ticket workflow for `pi-linuxfr.org`.

The goal is not to create a project-management platform. The goal is to keep Pi-assisted work small, inspectable, and easy to resume across conversations.

## Cold session checklist

For ticketed work:

1. Read `tickets/README.md`.
2. Inspect `tickets/ongoing/` and ignore `.gitkeep`.
3. If exactly one ticket is ongoing, continue only that ticket.
4. If more than one ticket is ongoing, stop and report workflow corruption.
5. If no ticket is ongoing, inspect `tickets/planned/`.
6. If several planned tickets could be next, ask the user to choose instead of guessing.
7. Activate only one selected ticket, then implement only that ticket's scope.
8. Record useful log entries while working, especially before stopping.

Useful manual checks:

```bash
find tickets/ongoing -type f -name 'PLF-*.md' | sort
find tickets -type f -name 'PLF-*.md' | sort
git status --short
```

## Principles

- One ticket should describe one atomic feature or change.
- One ticket should normally map to one focused commit.
- Only one ticket may be in `ongoing/` at a time.
- The ticket state is determined by the directory containing the ticket file.
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

The directory is the single source of truth for state. Do not add pointer files, indexes, or extra state fields until the directory layout becomes insufficient.

Preserve `.gitkeep` files in empty state directories.

## State meanings

### `backlog/`

Use this as the project inbox. A backlog ticket may be incomplete or exploratory. It captures ideas that should not be lost, such as unscheduled capabilities, prompt experiments, cleanup tasks, or research questions.

A backlog ticket is not a commitment to implement the work.

### `planned/`

A planned ticket is ready for implementation. It must be self-contained enough for another Pi session to implement it without guessing the intent, scope, dependencies, expected artifacts, or verification method. It should be small enough to complete as one focused commit.

### `ongoing/`

Only one ticket belongs here. Moving a ticket to `ongoing/` means the next code, documentation, or data-shaping change should serve that ticket.

If work stops temporarily but remains the active focus, keep the ticket in `ongoing/` and add a log entry explaining the current state and next action.

### `completed/`

Move a ticket here after the change is implemented, verified, and committed. Record the final commit identifier when practical. The commit message is the primary durable link between git history and the ticket.

Do not scan `completed/` during normal ticket selection. Inspect it only for dependency checks, historical context, or duplicate detection.

### `rejected/`

Move a ticket here when it should not be implemented as written. Use this for obsolete tickets, duplicates, unsafe ideas, out-of-scope work, or oversized tickets superseded by smaller split tickets.

Rejected tickets are historical records. They should explain why the work was rejected or what replaced it.

## State transitions

Moving a ticket between directories is a state transition. It changes what the ticket means and what another agent is allowed to assume about it.

For every transition:

- move tickets with `git mv` so history follows the file;
- add a dated entry to the ticket log;
- keep the ticket ID stable.

Generate log timestamps with:

```bash
date '+%Y-%m-%d %H:%M:%S'
```

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

When the workflow says to ask the user, output the question and wait. Do not assume an answer.

Do not move a ticket to `planned/` if implementation still depends on hidden assumptions.

### `planned/` -> `ongoing/`

This is an activation step. The goal is to start exactly one implementation session for exactly one ticket.

Before moving a ticket to `ongoing/`:

- [ ] `tickets/ongoing/` contains no ticket file.
- [ ] All required dependencies are completed, or the user explicitly accepts working on this ticket before them.
- [ ] The ticket can be implemented from its own content and cited project documents.
- [ ] The next session can start from a prompt that names this ticket and asks the agent to implement only it.

If activation is not ready:

- if another ticket is already ongoing, finish it, leave it ongoing with a clear pause log, or move it back to `planned/` before activating a new one;
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
- [ ] `tickets/ongoing/` contains no ticket file after the move.

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

## Pausing or deactivating work

There is no separate `paused/` state.

If work stops temporarily but remains the active focus, leave the ticket in `ongoing/` and add a log entry with:

- what changed;
- current state;
- blockers, if any;
- next action.

If the user explicitly chooses to stop working on the ticket and activate another one, move the ticket back to `planned/` with a log entry explaining what remains before it can be resumed.

Do not create a `paused/` directory without an explicit workflow change.

## Dependency procedure

Dependencies must be explicit before a ticket enters `planned/`.

The frontmatter `dependencies` list is the machine-readable source. Use ticket IDs there when possible:

```yaml
dependencies: ["PLF-001"]
```

Use the `Dependencies` body section for human-readable reasons:

```markdown
- `PLF-001` — required because candidate ranking needs candidate extraction output.
```

Use plain text for external dependencies, such as project files, Pi behavior, or LinuxFr constraints.

When a dependency is discovered:

1. Add it to the ticket's frontmatter and explain it in the `Dependencies` section.
2. Check whether the dependency is already completed by confirming its ticket file exists in `tickets/completed/` or by referencing the relevant completed commit.
3. If it is completed, reference the ticket or commit.
4. If it exists in `backlog/`, refine and schedule it before the dependent ticket.
5. If it does not exist, propose a new prerequisite ticket in `backlog/`.
6. If dependency order is unclear, keep the dependent ticket in `backlog/` and ask for clarification.

A planned ticket may depend on another planned ticket, but the dependency must be explicit and the dependency should be implemented first.

## Split procedure

Split a ticket when it is too broad, risky, cross-cutting, hard to verify in one pass, or likely to require multiple unrelated commits.

A split proposal should:

1. Identify the smallest independently valuable outcomes.
2. Create one ticket per outcome.
3. Give each child ticket its own objective, scope, acceptance criteria, dependencies, and verification method.
4. Add dependency links between child tickets when order matters.
5. Ask the user to approve the split before moving child tickets to `planned/`, unless the user explicitly delegated ticket organization.
6. Move the original ticket to `rejected/` with `Resolution: superseded by <ticket ids>` when the child tickets replace it.

The original ticket is not `completed` unless it was actually implemented. A superseded parent belongs in `rejected/` because it should not be implemented as written.

## Manual session workflow

At the start of a Pi session that uses tickets:

1. Read `tickets/README.md`.
2. Inspect `tickets/ongoing/`.
3. If one ticket is ongoing, continue only that ticket.
4. If more than one ticket is ongoing, stop and report workflow corruption. Do not fix it silently unless the user explicitly asks.
5. If no ticket is ongoing, inspect `tickets/planned/`.
6. If several planned tickets could be next, ask the user to choose. Do not auto-activate ambiguous work.
7. If a planned ticket is selected, verify the definition of ready and dependencies before activating it.
8. If no planned ticket is ready, refine or create tickets in `tickets/backlog/`.

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

Ticket filenames should be exactly `<ID>.md`, for example `PLF-001.md`.

To find the next ticket ID:

```bash
max=$(find tickets -type f -name 'PLF-*.md' | sed -E 's/.*PLF-([0-9]+)\.md/\1/' | sort -n | tail -1)
printf 'PLF-%03d\n' "$((10#${max:-0} + 1))"
```

Use the next ID for both the ticket `id` and filename.

## Commit convention

Use this form:

```text
PLF-001: Add bounded candidate extraction
```

The commit message is the primary durable link from git history to the ticket. To find commits for a ticket, run:

```bash
git log --grep='PLF-001'
```

Record the final commit identifier in the ticket when practical, but do not create awkward self-referential commit amendments only to force the hash into the same commit.

Keep commits focused. If a ticket naturally wants multiple unrelated commits, the ticket is probably too large and should be split.

## Verification records

When recording verification, include the command or manual check performed and the result. If verification is not applicable, write why.

Examples:

```markdown
- `npm test` passed.
- Manual check: `linuxfr_query_raw` returned the expected source path and URL.
- Not applicable: documentation-only change; reviewed Markdown diff manually.
```

## Log quality

The `Log` section is append-only. Do not rewrite or reorder existing entries except to fix obvious formatting damage.

Use concise entries. Summarize raw output instead of pasting large command logs, stack traces, or diffs.

A useful pause or handoff entry should include:

- what changed;
- current state;
- blockers, if any;
- next action.

Example:

```markdown
- 2026-06-23 15:02:41: Paused after implementing parser changes. Current state: tests not added yet. Blocker: none. Next action: add malformed URL tests and run `npm test`.
```

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
