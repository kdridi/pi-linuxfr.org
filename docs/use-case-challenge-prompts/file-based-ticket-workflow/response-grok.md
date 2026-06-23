**1. Executive recommendation**

Introduce a minimal, purely file-based ticket system using plain Markdown files inside a top-level `tickets/` directory. State is expressed by which subdirectory the file lives in (`backlog/`, `planned/`, `active/`, `completed/`, `rejected/`). There is deliberately no database, no YAML config file, no external service, and no custom Pi extension for tickets at this stage.

This is the right level of structure right now because:
- The project is still early-MVP with a small number of candidate directions. Anything heavier (GitHub Projects, a dedicated Pi skill, org-mode, or even a simple SQLite script) would add friction and maintenance that the “small MVP steps” principle explicitly rejects.
- It directly satisfies every stated constraint: ideas are captured durably, planned work is clear for the next agent session, exactly one implementation ticket is active at a time, each ticket maps to an atomic change, everything is visible in `git log` and `ls`, and a new session can resume by reading files only.
- The workflow is Pi-native: an agent already knows `read_file`, `edit_file`, `bash`, `mv`, and `git`. No new mental model or permission system is required.
- It will remain usable for years because it contains no milestone-specific language and can be extended (or collapsed) later without breaking existing tickets.

**2. Directory layout**

```
tickets/
├── README.md          # The complete workflow guide (this design + agent instructions)
├── TEMPLATE.md        # Fresh copy of the ticket template (cp to create new tickets)
├── backlog/
├── planned/
├── active/            # Contains 0 or 1 file at all times
├── completed/
└── rejected/
```

- `backlog/`: Raw ideas and feature requests. Vague or incomplete is acceptable here. This is the capture bucket so nothing is lost across sessions.
- `planned/`: Tickets that have been reviewed and are now clear enough for another agent session to implement without extra clarification. This is the “ready queue”.
- `active/`: The single ticket currently being implemented. Enforces focus and makes handoff trivial (`ls tickets/active/` tells you instantly what is in progress).
- `completed/`: Finished work with summary and commit reference. Provides history and traceability.
- `rejected/`: Deliberately discarded ideas with rationale. Prevents re-discussion of the same topic later.

`archive/` is deliberately excluded for now. `completed/` + `rejected/` already give a complete historical record. Adding another state would require periodic manual migration and extra transition rules; it can be introduced later (e.g. when >50 completed tickets exist) without changing any existing tickets.
`roadmap/` (or a top-level `ROADMAP.md`) is also excluded from the ticket state machine. Strategic direction belongs in a single root-level document that changes infrequently; mixing it with atomic tickets would dilute focus.

**3. Ticket lifecycle semantics**

Tickets are moved between directories with `git mv`. The filename (`T-042.md`) never changes; only its parent directory does. All metadata lives inside the file.

**backlog → planned**
Must be true: the ticket passes the “ready for planned” checklist (see template). All known dependencies are listed. No open “clarify X” questions remain.
Files/fields updated: edit the ticket (fill gaps, set `updated:` date, add a one-line note in Notes).
If information is missing: the agent must either fill it (from code, docs, or a quick experiment) or leave a precise blocker note and keep the ticket in `backlog/`.
Dependencies: list them explicitly. If a hard dependency does not yet exist, create it first (or note why the current ticket can proceed without it).
When to split instead: if the ticket contains two or more independent, testable changes that could each stand alone.

**planned → active** (the most important transition)
Must be true: `tickets/active/` is empty, the ticket passes the ready checklist, and every hard dependency is already in `completed/`.
Files/fields updated: `git mv …/planned/T-042.md …/active/`, then edit to set `updated:` and append “Activated 2026-06-23 – ready for implementation.”
If information is missing: do not move. Improve the ticket or split first.
Dependencies: verify each one by checking its directory. If a dependency is still planned, either activate the dependency instead or document why it is non-blocking.
When to split instead: the ticket would require more than one focused session or would produce a diff larger than ~300 lines.

**active → completed**
Must be true: every acceptance criterion is demonstrably met (agent shows the verification commands/output in the Completion Summary), code is clean, and no scope was added beyond the criteria.
Files/fields updated: fill Completion Summary + `commit:` field, then perform the git dance described in section 5 so the final commit records its own SHA inside the ticket.
Dependencies: none can be open.
When to split instead: never at completion time; split earlier if scope grew.

**Any state → rejected**
Must be true: a clear, written reason exists (“duplicate of T-038”, “out of scope for v1”, “performance cost too high”).
Files/fields updated: move with `git mv`, add rejection note with date and rationale.
Use this freely for backlog items that will never be worth the effort.

Terminal states (`completed/`, `rejected/`) are not normally moved again. A regression would spawn a new ticket that references the old one.

**4. Ticket template**

```markdown
---
id: T-042
title: Short descriptive title
status: planned
created: 2026-06-23
updated: 2026-06-23
dependencies: T-038
commit:
---

# T-042: Short descriptive title

## Summary
One sentence that a future agent can read and immediately understand the intent.

## Description
Context, motivation, and any relevant background from the LinuxFr or Pi side. Keep under one screen.

## Acceptance Criteria
- [ ] Concrete, verifiable outcome 1 (e.g. “linuxfr_collect_pages now writes a .jsonl file for every URL and the file passes `jq` validation”)
- [ ] Concrete, verifiable outcome 2

## Dependencies
- T-038: must be completed first because the new collection logic reuses its URL normaliser.

## Notes / Progress
- 2026-06-23: created from discussion of V2 directions.
- (During active work: append dated bullet points with commands tried, decisions, partial results.)

## Completion Summary
(Only filled when moving to completed/)
What was changed, exact verification steps performed, any follow-up tickets created, and the commit that delivered it.
```

**Vagueness rules**
- `backlog/`: Summary and Description may be short or sketchy; Acceptance Criteria may be empty or high-level.
- `planned/` and `active/`: Summary must be one clear sentence, Acceptance Criteria must contain at least two concrete bullets, Dependencies section must be present (even if “none”), and there must be no open clarification questions.

**5. Agent workflow**

**Start of every session**
1. `ls tickets/active/` — if one file exists, read it and resume from the last Progress note. Do not create new tickets unless they are strictly required by the active work.
2. If `active/` is empty, `ls tickets/planned/`, read the 2–3 most relevant tickets (by ID or by reading their Summary), and choose the one whose dependencies are satisfied and that logically follows recent completed work.
3. Activate it (`git mv` + edit `updated:` and add activation note).
4. If no planned tickets exist, spend a few minutes reviewing the oldest items in `backlog/`, refine the most promising one, and move it to `planned/` (or directly to `active/` if you are ready to implement immediately).

**Refining backlog tickets**
Pick an old ticket, improve its Summary/Description/Acceptance Criteria until it meets the “ready for planned” bar, then move it. If it remains vague after 10 minutes of work, either reject it with a reason or split the unclear part into a new ticket.

**Activating one planned ticket**
Only when `active/` is empty and the checklist passes. Never have more than one active ticket.

**Implementing and verifying (while in active/)**
Work normally with `read_file`/`edit_file`/`bash`. After every significant change or decision, append a dated line to the Progress section (commands run, output observed, design choice made). This is the handoff contract for the next session. Verify against the Acceptance Criteria using the actual Pi tools or direct inspection of files.

**Completing the ticket and preparing handoff**
When all criteria are met:
1. Fill Completion Summary.
2. `git mv tickets/active/T-042.md tickets/completed/T-042.md`.
3. `git add` every changed file + the moved ticket.
4. `git commit -m "feat(linuxfr): … (T-042)"`.
5. `SHA=$(git rev-parse HEAD)`, edit the ticket to set `commit: $SHA`, `git add` the ticket again, then `git commit --amend --no-edit`.
The single commit now contains both the feature and a ticket that records its own SHA. Future sessions see a clean, self-describing artifact in `completed/`.

**6. Guardrails**

- **Ticket size**: If a ticket would produce >~300 lines of diff or clearly requires more than one focused session, split before activating (or as soon as scope becomes visible during implementation).
- **Hidden dependencies**: The Dependencies section is mandatory on every move out of `backlog/`. Before activating, the agent must actually check the state of each listed dependency. Use `grep` across the codebase to surface implicit ones.
- **Vague tickets entering planned/**: The agent must mentally (or literally) run the checklist in section 4 before the `mv`. If any item fails, improve or split instead of moving.
- **Scope drift**: Acceptance Criteria are the contract. Anything new discovered during implementation goes into a fresh `backlog/` ticket, never silently added to the current one. Reference the new ticket from the active ticket’s Progress section.
- **Atomic commits**: One ticket ⇒ one final commit (the amend technique above). Intermediate “wip(T-042): …” commits are allowed on a throwaway branch if the work is long, but the final deliverable must be a single clean commit.

**7. Dependency and split procedure**

**Resolving dependencies**
1. Read the Dependencies list.
2. For each `T-YYY`, check which directory it is in.
3. If every hard dependency is in `completed/`, proceed.
4. If a dependency is still in `planned/`, activate that dependency first (serial work) or document why it is non-blocking.
5. If a dependency does not exist yet, create the minimal ticket for it, move the current ticket back to `planned/`, and activate the new dependency.

**Splitting a large ticket**
1. In the original ticket’s Notes, list the independent sub-tasks.
2. For each sub-task, `cp TEMPLATE.md T-0XX.md` (use next available ID), fill it with a tight scope copied from the parent, and place it in `planned/` (or `backlog/` if not yet ready).
3. Edit the original ticket: add “Split into T-0A3, T-0A4, T-0A5 because …”. Update Summary/Description to the high-level goal if needed.
4. Move the original ticket to `completed/` with Completion Summary: “Split into child tickets; actual implementation tracked there. This meta-ticket is complete.”
5. The children now carry the real work and each will have its own atomic commit. The parent remains as a clean historical record of the split decision.

**8. Commit and git conventions**

Ticket ID convention: `T-XXX` where `XXX` is a zero-padded three-digit number assigned globally and sequentially. To obtain the next ID:
`find tickets -name 'T-*.md' | sed 's/.*T-0*\([0-9]*\).*/\1/' | sort -n | tail -1` then add 1.

Filename: always `T-042.md` (stable for git history). Human-readable title lives inside the file.

Commit message convention (Conventional Commits + ticket):
`feat(linuxfr): add JSONL output mode to collect_pages (T-042)`
`fix(wiki): preserve original URL in citation (T-019)`
`docs(tickets): clarify split procedure (T-007)`

The ticket file (after `git mv` and edit) is included in the same commit via the amend technique so that `git show <sha>` contains both the code change and the final state of its own ticket.

**9. Minimal automation wishlist**

Only add these after the manual workflow has been used for at least 5–10 real tickets and real friction has been observed:

1. `scripts/ticket-next-id.sh` — prints the next available `T-XXX`. Worth adding because ID assignment is frequent and error-prone; still trivial enough that it can stay manual for the first many tickets.
2. `scripts/ticket-status.sh` — prints a one-screen dashboard (“Active: T-042 …”, “Planned (4): …”, warning if `active/` has ≠1 file). High leverage for session startup; can be added early because it reinforces correct usage without changing any workflow rules.
3. Later (only if manual `mv` + edit becomes annoying): a tiny Pi extension tool `ticket-activate`, `ticket-complete` that performs the directory move, edits the required fields, and runs the checklist. Do not build this until the file-based pattern has proven useful; the whole point of starting manual is to discover what is actually worth automating.

Everything else (pre-commit hooks, kanban renderer, priority sorting, etc.) is deliberately left out for now.

**10. Critique your own design**

**Most likely failure modes**
- Backlog becomes a growing graveyard of half-baked ideas that are never refined or rejected.
- An agent (or human) finishes implementation but leaves the ticket in `active/` or forgets the amend step, so the next session sees stale state.
- Two sessions accidentally create `T-042` at the same time (rare but possible if work is not strictly sequential).
- Scope creep happens because the agent is “helpful” and implements nice-to-haves not listed in Acceptance Criteria.

**Overkill parts**
The `commit:` field + amend dance is elegant but slightly fiddly. 80 % of the value would still exist if we only relied on the commit message containing `(T-042)` and `git log --grep`. I kept it because perfect self-contained traceability inside the ticket file is worth the minor ceremony for a long-lived repository.

**Missing parts that I consciously omitted**
- Any form of priority or ordering inside `planned/`. For a project this size, an agent reading two or three Summaries can decide correctly; adding priority fields or numeric prefixes would complicate moves without enough benefit.
- Git branches per ticket. Would make parallel work safer but adds checkout/merge overhead that contradicts “minimal terminal coding harness”.

**What I would simplify further if forced**
Drop `rejected/` and just delete unwanted tickets (or move them to `backlog/icebox/`). The rationale for keeping rejected/ is that “why we decided against X” has long-term value in a public-ish project; if that value never materialises after 20 tickets, collapsing rejected into a subdir of backlog would be a trivial simplification.

This design is intentionally the smallest thing that still satisfies every explicit requirement while remaining pleasant for both a human developer and a Pi coding agent across many disconnected sessions. It can be adopted today by creating the directories and committing the README + TEMPLATE, with zero external dependencies.