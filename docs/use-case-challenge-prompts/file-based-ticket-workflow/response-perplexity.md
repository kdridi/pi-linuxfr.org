Below is a minimal, durable ticket workflow I’d recommend for this repository: a small Markdown-based board with **backlog → planned → active → done/rejected**, plus an archive for old records. It is just enough structure for separate Pi sessions to resume from files, while staying manual-first and atomic per ticket. [pi](https://pi.dev)

## 1. Executive recommendation

I would introduce a file-based ticket system centered on one active implementation ticket at a time, with a small set of Markdown files and a few clearly named states. The core idea is: every idea starts as a backlog note, gets refined into a planned ticket only when it is implementable, becomes the single active ticket when work starts, and is then moved to done, rejected, or archived after completion. [pi](https://pi.dev/docs/latest/sessions)

This is the right level of structure because Pi is intentionally minimal and session-oriented, with project-local extensions available but not required, and sessions already support resumability and branching. That means the repository should supply durable file handoff, not a heavy workflow system, and the workflow should fit a single developer plus AI sessions rather than a team platform. [badlogic-pi-mono.mintlify](https://badlogic-pi-mono.mintlify.app/coding-agent/extensions)

## 2. Directory layout

I would use this tree:

```text
tickets/
  backlog/
  planned/
  active/
  done/
  rejected/
  archive/
  _templates/
  index.md
```

The states I would include are backlog, planned, active, done, rejected, and archive. I would **exclude** roadmap as a state directory, because roadmap is better expressed as a lightweight `tickets/index.md` or a short `ROADMAP.md`, not as a mutable workflow state; I would also exclude “review,” “testing,” or “blocked” as separate states because they add complexity without improving the one-active-ticket discipline.

### State meanings

- `backlog/` contains raw ideas, rough opportunities, and partial tickets that are not yet fully specified.
- `planned/` contains tickets that are ready to implement next, with enough detail to start without guessing.
- `active/` contains exactly one ticket, the current implementation focus.
- `done/` contains completed tickets with final outcome and commit reference.
- `rejected/` contains tickets that were intentionally not pursued.
- `archive/` contains old closed tickets that you want to keep out of the main working set, usually after a project milestone or when done/rejected becomes noisy.
- `_templates/` contains the reusable ticket template and maybe a short checklist.
- `index.md` is the human-readable navigation file: current active ticket, next planned ticket, and links to important backlog items.

### Why these states and not more

Backlog is essential because the project explicitly has many possible next directions and needs idea capture without loss. Planned is essential because the workflow needs a gate between vague ideas and executable work. Active is essential because only one implementation ticket should be live at once. Done and rejected are essential because they preserve decisions durably. Archive is optional but useful once done/rejected accumulates enough history to slow down browsing; it is not a workflow state, just storage.

## 3. Ticket lifecycle semantics

A ticket should move only by renaming or copying the file between directories, plus updating a small state line inside the file. The file itself remains the durable record, so the session can resume from the repository alone. I would make state transitions explicit and reversible only when that is genuinely safe.

### Backlog → Planned

Before moving, the ticket must answer: what is the change, why does it matter, what is the smallest atomic outcome, and what is the likely implementation path. If any of those are missing, the agent should keep it in backlog and refine it rather than promote it. Required updates: fill in scope, acceptance criteria, dependencies, and a rough implementation note; if still uncertain, mark open questions explicitly.

If information is missing, the agent should either research the repository, inspect adjacent tickets, or split the idea into smaller backlog tickets. Dependencies should be listed in the ticket body, and if a dependency is another ticket, link it by ID. A ticket should be split instead of planned if it has more than one independently valuable outcome or would not fit in one focused commit.

### Planned → Active

Before activation, the ticket must be specific enough that an agent can start coding without inventing scope. There should be no unresolved dependency that blocks implementation, or the dependency must already be in done. Required updates: move the file to `active/`, set `Status: Active`, and add a start timestamp or session note if useful.

If information is missing at this point, the agent should not activate the ticket. It should either refine the ticket in planned, split it, or move it back to backlog. Dependencies should be rechecked before activation, and the active ticket should be the only file in `active/`.

### Active → Done

Before completion, the code should be implemented, tested, and the commit should be made. Required updates: move the file to `done/`, record the final commit hash, record verification performed, and note any follow-up tickets if there are leftovers. If the implementation diverged materially from the plan, the ticket should explain the divergence.

If required information is missing at completion, the agent should not call it done; it should either finish the missing work or split off follow-up work. Dependencies should be marked resolved in the ticket body if they mattered. If the ticket grew too large, the better move is to close the current ticket as a partial deliverable and create a new backlog ticket for the remainder.

### Active or Planned → Rejected

Use rejected only when the idea is not worth doing, is redundant, or conflicts with project direction. Required updates: record the reason, the deciding constraint, and whether the idea should be revisited later. If the ticket is merely underspecified, it does **not** belong in rejected; it belongs back in backlog or planned.

### Done/Rejcted → Archive

Archive is for reducing noise, not for changing meaning. Move tickets there when closed history becomes too large or when you want to keep the working directories small. No semantic changes should happen in archive except metadata cleanup or index updates.

## 4. Ticket template

I would keep the template deliberately small:

```markdown
---
id: TICKET-YYYYMMDD-NNN
status: backlog
title: Short descriptive title
type: feature|fix|docs|cleanup|research
priority: low|medium|high
created: 2026-06-23
updated: 2026-06-23
related:
dependencies:
commit:
---

# Goal

One sentence describing the atomic outcome.

# Context

Why this matters for pi-linuxfr.org and what prompted it.

# Scope

What is included.
What is explicitly out of scope.

# Acceptance criteria

- Criterion 1.
- Criterion 2.
- Criterion 3.

# Implementation notes

- Likely files to touch.
- Any constraints or preferred approach.
- Any open questions.

# Verification

- Command or check to run.
- Expected result.

# Handoff

- Current blockers.
- Follow-up tickets.
- Final commit or merge reference.
```

For backlog tickets, `Goal`, `Scope`, and `Implementation notes` may be vague, but `title`, `type`, and a short `Context` should still exist. Before a ticket can be planned or active, `Scope`, `Acceptance criteria`, `Verification`, and `dependencies` must be concrete enough that another session can execute the work without guessing.

## 5. Agent workflow

At the start of a session, the agent should read `tickets/index.md`, then inspect `active/` and `planned/`, and finally review any related repository files such as AGENTS.md or the implementation area. The goal is to reconstruct the current work from files, not from chat history. If no active ticket exists, the agent should choose the best planned ticket or refine a backlog candidate.

When refining backlog tickets, the agent should tighten the problem statement, remove duplicates, record dependencies, and split oversized ideas. A good refinement session ends with backlog tickets that are small, specific, and ready to be promoted later. If a ticket still has unknowns, those unknowns should be written down as explicit questions, not left implicit.

To activate one planned ticket, the agent should first verify that no ticket is already active. Then it should re-read the planned ticket, confirm dependencies are satisfied, move it to `active/`, and update its status and timestamps. The active ticket should be the only implementation target until it is done or intentionally aborted.

While implementing and verifying an active ticket, the agent should work only within the ticket’s scope and keep changes small. It should update the ticket as reality changes, especially if the implementation reveals a narrower or broader shape than expected. Verification should be explicit and reproducible, usually a command, a test, or a manual check.

When completing the ticket, the agent should record the final commit hash, summarize what changed, note verification, and call out any leftovers as new backlog items. Then it should move the ticket to `done/`, update `tickets/index.md`, and make sure the repository is left in a resumable state for the next session.

## 6. Guardrails

To prevent tickets from becoming too large, enforce a simple rule: one ticket should normally map to one focused commit and one observable outcome. If a ticket would require separate commits to remain clear, it is too large and should be split. If the ticket needs “and then” language in the goal, that is usually a sign it contains multiple tasks.

To prevent hidden dependencies, require every nontrivial ticket to list explicit dependencies in the front matter and mention any prerequisite files, data, or prior tickets in the body. The agent should never assume a hidden dependency just because the codebase already “probably has it.” If a dependency is uncertain, it should be made explicit before planning.

To prevent vague tickets from entering planned, require acceptance criteria and verification to be complete enough that another session could judge success without interpretation. A planned ticket should not contain phrases like “improve,” “clean up,” or “make better” without a measurable target. If that happens, it stays in backlog.

To prevent scope drift during implementation, the active ticket should define an explicit out-of-scope list and the agent should treat any new idea as future work unless it is strictly required for the acceptance criteria. If implementation reveals a useful extra change, it should be parked as a follow-up ticket rather than absorbed silently. The active ticket should remain the contract.

To keep commits atomic, the ticket should be written so that the code changes, verification, and commit all align with one small outcome. The agent should avoid bundling unrelated refactors, documentation cleanups, and feature work in one ticket. If the implementation naturally spans multiple logical changes, split the ticket before coding.

## 7. Dependency and split procedure

For dependencies, I would use a simple rule: a ticket can depend only on tickets that are already done or on a clearly defined external condition. If Ticket B depends on Ticket A, B stays in backlog or planned until A is done. The dependency should be listed by ticket ID in the header and explained in one sentence in the body.

For a large ticket split, the agent should first identify the smallest independently valuable slice that can be done and verified. Then it should create one ticket for that slice and move the remaining work into one or more new backlog tickets. The original ticket should either be reduced to the first slice or closed as rejected if it was only a bundle of ideas and no longer represents a useful atomic unit.

After a split, the original ticket should not silently remain as-is. It should be rewritten to reflect the remaining slice or marked as superseded with links to the replacement tickets. That makes the handoff durable for a later session.

## 8. Commit and git conventions

I would use ticket IDs like `T20260623-001`, where the date gives ordering and the sequence avoids collisions. The format is easy to read in file names and commit messages, and it does not depend on any external tracker. Keep the ID stable from backlog through done.

For commits, I would use a conventional but lightweight format such as:

```text
ticket-id: short imperative summary
```

Example:

```text
T20260623-001: add LinuxFr raw source selection guard
```

The ticket should record the final commit in the `commit:` field and again in the handoff section if useful. If multiple commits are unavoidable, the ticket should explain why and note the last commit that closes the ticket, but that should be the exception.

## 9. Minimal automation wishlist

The smallest useful automation would be:

- A script to list all tickets by state and flag missing required fields in planned/active.
- A script to ensure there is at most one active ticket.
- A script to validate ticket IDs, dependencies, and front matter syntax.
- A script to generate or refresh `tickets/index.md`.

These are worth adding because they enforce the workflow without turning it into a platform. I would keep ticket creation, splitting, and state transitions manual for now because those are judgment-heavy and the repository is still small. A commit hook could eventually check that active tickets are singular and planned tickets are complete, but that should remain optional until the workflow proves stable.

## 10. Critique your own design

The most likely failure mode is that the system becomes “Markdown bureaucracy” if tickets are too verbose or if the index is not kept current. Another likely failure mode is that people treat planned as a wish list instead of a strict readiness gate. A third failure mode is that dependency links stay informal and hidden work sneaks in.

The most overkill part is the archive state; it is useful, but only once there is enough history to justify it. The front matter may also be more than the minimum needed for very small tasks, so in practice the template should stay terse. The biggest possible gap is that this design does not define an automated board view, but that is intentional because manual-first fits Pi’s minimal extension model and resumable sessions better. [pi](https://pi.dev/docs/latest/compaction)

The simplest version I would actually ship is: `backlog/`, `planned/`, `active/`, `done/`, one `index.md`, and one template. Everything else can wait until the workflow is proven useful.