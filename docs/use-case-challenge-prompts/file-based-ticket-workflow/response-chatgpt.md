## 1. Executive recommendation

Introduce a **minimal Markdown ticket system under `tickets/`** with exactly five workflow states:

```text
backlog -> planned -> active -> done
                       ↘
                        rejected
```

The core rule is:

> **Only one ticket may exist in `tickets/active/` at any time.**

This is the right level of structure because `pi-linuxfr.org` is still an MVP-style repository: the project needs memory, handoff, and atomic implementation units, not a project-management platform. Pi’s public docs describe it as a minimal terminal coding harness extended through TypeScript extensions, skills, prompt templates, themes, and packages, and project instructions can already live in repo files such as `AGENTS.md`. That strongly favors durable repo-local Markdown over an external tracker. ([Pi Dev][1]) ([Pi Dev][2])

Pi extensions can register custom tools with `pi.registerTool()`, but that should come later only if the manual workflow proves useful. The first version should be readable and editable with ordinary file tools. ([Pi Dev][3])

---

## 2. Directory layout

I would add this:

```text
tickets/
  README.md
  TEMPLATE.md

  backlog/
    PLF-0001-candidate-extraction.md
    PLF-0002-run-manifests.md

  planned/
    PLF-0003-record-collection-run-metadata.md

  active/
    PLF-0004-add-query-filter-for-source-format.md

  done/
    PLF-0005-document-current-linuxfr-tools.md

  rejected/
    PLF-0006-public-comment-crawler.md
```

### `tickets/README.md`

The workflow manual. It explains:

* one active ticket maximum;
* what each state means;
* ticket readiness rules;
* split procedure;
* commit convention;
* session start checklist.

This file matters more than automation because every new Pi session can read it.

### `tickets/TEMPLATE.md`

The canonical ticket shape. Agents copy it when creating new tickets.

### `tickets/backlog/`

Loose ideas, candidate work, rough observations, future directions.

Backlog tickets may be incomplete. They are allowed to say “unclear”, “needs investigation”, or “possible V2 idea”. This is the idea-capture space.

Examples:

* candidate extraction;
* candidate ranking;
* public comment collection;
* prompt experiments;
* workflow documentation;
* run manifests;
* small tool ergonomics.

### `tickets/planned/`

Ready-to-implement tickets.

A ticket in `planned/` must be atomic enough for one focused commit and complete enough that another session can implement it without needing conversation history.

This is the most important quality gate.

### `tickets/active/`

The one ticket currently being implemented.

There should be **zero or one files** here. If there is already a ticket here, no other ticket should be activated.

### `tickets/done/`

Implemented and verified tickets.

A ticket reaches `done/` only after:

* code/docs were changed;
* verification was run or explicitly marked unavailable;
* the commit hash is recorded;
* the ticket has a short handoff summary.

### `tickets/rejected/`

Tickets that should not be implemented as written.

This includes:

* bad ideas;
* obsolete tickets;
* duplicates;
* tickets superseded by smaller split tickets;
* ideas that violate project constraints, for example full crawling, authentication, private data, or heavyweight infrastructure.

I would include `rejected/` because agents need to know not only what to do, but also what was consciously avoided.

### States I would exclude for now

I would **not** add `archive/`. `done/` and `rejected/` are already archives.

I would **not** add `ideas/` separately. `backlog/` is the idea inbox.

I would **not** add `roadmap/` as a state. If needed, add `tickets/ROADMAP.md` later as a narrative priority note, but do not make roadmap another workflow state.

I would **not** add `blocked/` initially. A blocked ticket should usually move back to `backlog/` or be split into dependencies. `blocked/` tends to become a graveyard.

---

## 3. Ticket lifecycle semantics

### `backlog/` → `planned/`

Meaning: “This idea is now shaped enough to implement.”

Before the move:

* the problem is clear;
* the expected change is concrete;
* the scope is small;
* dependencies are listed;
* acceptance checks are written;
* likely touched files are identified;
* the ticket can plausibly map to one focused commit.

Files or fields to update:

* `Status: planned`;
* `Scope`;
* `Non-goals`;
* `Acceptance checks`;
* `Dependencies`;
* `Expected files`;
* `Verification`.

If required information is missing:

* do not move it;
* refine the ticket in `backlog/`;
* add explicit questions under `Open questions`;
* create dependency tickets if the missing information is itself work.

Dependencies:

* a planned ticket may depend only on tickets that are already `done/`, or on very small preconditions that are explicitly stated;
* if the dependency requires implementation, create a separate ticket and keep the current ticket in `backlog/`.

Split instead of moving forward when:

* the ticket changes more than one tool;
* the ticket combines code and broad documentation;
* the ticket has multiple acceptance groups;
* the ticket contains “and then”;
* the likely commit message would need two verbs.

Example bad planned ticket:

> Add candidate extraction, ranking, run manifests, and docs.

Split into:

* add raw candidate extraction;
* record collect run manifests;
* document candidate extraction workflow;
* add candidate ranking experiment.

---

### `planned/` → `active/`

Meaning: “This is the only ticket being implemented now.”

Before the move:

* `tickets/active/` is empty;
* the ticket is complete enough to implement;
* dependencies are satisfied;
* the working tree is clean or intentionally prepared;
* the agent understands the acceptance checks.

Files or fields to update:

* move the file from `planned/` to `active/`;
* set `Status: active`;
* add `Started: YYYY-MM-DD`;
* optionally add `Session notes`.

If required information is missing:

* do not activate it;
* move it back to `backlog/` if it was prematurely planned;
* or edit it in `planned/` until it is ready.

Dependencies:

* if a dependency is discovered at activation time, stop activation;
* create or update dependency tickets;
* keep the original ticket in `planned/` only if it remains otherwise ready;
* otherwise move it back to `backlog/`.

Split instead of activating when:

* the agent cannot describe the intended diff in one sentence;
* the ticket requires unrelated verification commands;
* the ticket would produce multiple commits;
* the ticket has optional features inside it.

---

### `active/` → `done/`

Meaning: “The implementation is complete, verified, committed, and resumable.”

Before the move:

* implementation satisfies the acceptance checks;
* relevant tests or checks were run;
* changed files are reviewed;
* the commit was created;
* no unrelated changes are included;
* the ticket records the final commit hash.

Files or fields to update:

* `Status: done`;
* `Completed: YYYY-MM-DD`;
* `Commit: <hash>`;
* `Changed files`;
* `Verification result`;
* `Handoff notes`;
* move the file to `tickets/done/`.

If required information is missing:

* keep it in `active/`;
* add a `Remaining work` section;
* do not claim completion;
* if the original ticket is now too large, split off the remaining work and complete only the finished atomic part if the commit is valid.

Dependencies:

* no unresolved implementation dependency should remain;
* follow-up ideas become new backlog tickets, not extra scope.

Split instead of completing when:

* only part of the ticket was implemented;
* implementation revealed a second independent change;
* verification requires a separate infrastructure change.

---

### Any state → `rejected/`

Meaning: “This ticket should not be implemented as written.”

Before the move:

* there is a clear reason;
* duplicates or replacement tickets are linked;
* useful context is preserved.

Files or fields to update:

* `Status: rejected`;
* `Resolution: rejected | duplicate | superseded | obsolete | unsafe | too large`;
* `Reason`;
* `Superseded by`, if applicable.

If required information is missing:

* prefer keeping it in `backlog/`;
* use `rejected/` only when the decision is intentional.

Dependencies:

* if rejected because dependencies are missing, consider whether those dependencies deserve backlog tickets.

Split instead of rejecting when:

* the core idea is good but too broad;
* part of the ticket is implementable;
* the rejected part is only one subfeature.

---

## 4. Ticket template

````markdown
# PLF-0000 Short imperative title

Status: backlog
Created: YYYY-MM-DD
Started:
Completed:
Commit:

## Summary

One or two sentences describing the desired change.

## Problem

What pain, missing capability, or project risk does this address?

## Scope

This ticket will:

- ...

## Non-goals

This ticket will not:

- ...

## Acceptance checks

- [ ] ...
- [ ] ...
- [ ] ...

## Expected files

Likely files or directories to inspect or modify:

- ...

## Verification

Commands or manual checks expected:

```sh
# example
npm test
````

If no automated verification exists, describe the manual verification.

## Dependencies

* None

Or:

* Depends on PLF-0000 because ...

## Open questions

* None

Or:

* ...

## Implementation notes

Notes for the implementing agent. Keep this practical, not speculative.

## Handoff notes

Filled when work stops or completes.

## Final changed files

Filled at completion.

## Resolution

Filled only when done or rejected.

````

### Fields that may be vague in `backlog/`

These may be rough:

- `Summary`;
- `Problem`;
- `Implementation notes`;
- `Open questions`;
- `Expected files`.

A backlog ticket can be half-formed as long as it captures the idea.

### Fields that must be complete before `planned/`

These must be concrete:

- `Scope`;
- `Non-goals`;
- `Acceptance checks`;
- `Verification`;
- `Dependencies`.

Before `planned/`, the ticket should answer:

> “Could a fresh Pi session implement this without reading the original conversation?”

If not, it stays in `backlog/`.

### Fields that must be complete before `active/`

Before activation:

- `Status` must become `active`;
- `Started` must be filled;
- `Dependencies` must be satisfied;
- `Acceptance checks` must be actionable;
- `tickets/active/` must be empty.

### Fields that must be complete before `done/`

Before completion:

- `Completed`;
- `Commit`;
- `Verification`;
- `Handoff notes`;
- `Final changed files`;
- `Resolution`.

---

## 5. Agent workflow

### At the start of a session

The agent should read, in this order:

```text
AGENTS.md
tickets/README.md
tickets/active/
tickets/planned/
tickets/backlog/
````

Then:

1. If `tickets/active/` contains one ticket, continue that ticket.
2. If `tickets/active/` contains more than one ticket, stop and report workflow corruption.
3. If `tickets/active/` is empty, inspect `planned/`.
4. If the user asked for a specific change, match it to an existing ticket or create a backlog ticket.
5. If no ticket exists, create one in `backlog/` first, then refine it.

This fits Pi because Pi already centers work around repo files, terminal commands, and project instructions rather than a built-in project-management workflow. Pi’s public materials explicitly emphasize minimal primitives and extensibility instead of baked-in sub-agents or plan mode. ([Pi Dev][4])

### Refining backlog tickets

The agent should turn vague ideas into implementation-ready tickets by asking:

* What is the smallest useful outcome?
* What files are likely touched?
* What is explicitly out of scope?
* What proves the ticket is done?
* Does this require another ticket first?
* Can this become one focused commit?

A refined backlog ticket can move to `planned/` only when those questions are answered in the file.

### Activating one planned ticket

The agent should:

1. Confirm `tickets/active/` is empty.
2. Pick one planned ticket.
3. Check dependencies.
4. Move the file to `tickets/active/`.
5. Change `Status: active`.
6. Fill `Started`.
7. Restate the intended diff in the session before editing code.

If another ticket is already active, the agent should not activate a new one.

### Implementing and verifying an active ticket

The agent should:

1. Read the active ticket.
2. Inspect expected files.
3. Make the smallest code or doc change that satisfies the acceptance checks.
4. Avoid opportunistic improvements.
5. Run the verification command.
6. Update the ticket if implementation reveals better acceptance wording.
7. Create follow-up backlog tickets for extra ideas.

The active ticket is the contract. Conversation suggestions do not automatically expand scope unless the ticket is updated first.

### Completing the ticket and preparing handoff

The agent should:

1. Review the diff.
2. Ensure the diff matches the ticket.
3. Commit using the ticket ID.
4. Record the commit hash.
5. Fill final changed files.
6. Fill verification results.
7. Add handoff notes.
8. Move the ticket to `done/`.

A good handoff note is short:

```markdown
## Handoff notes

Implemented the raw-source format filter in linuxfr_query_raw.
Verification passed with `npm test`.
Follow-up idea: add filter examples to the README; captured as PLF-0018.
```

---

## 6. Guardrails

### Prevent tickets from becoming too large

Use these hard rules:

* one ticket = one focused commit;
* one ticket = one user-visible capability or one internal refactor;
* no ticket title with “and”;
* no ticket whose scope needs more than five bullets;
* no ticket whose acceptance checks describe unrelated behaviors;
* no ticket that changes collection, querying, wiki writing, and documentation together.

### Prevent hidden dependencies

Every ticket has a `Dependencies` section.

Allowed:

```markdown
## Dependencies

- None
```

Or:

```markdown
## Dependencies

- Depends on PLF-0012 because run manifests need stable raw-source metadata.
```

Not allowed:

```markdown
## Dependencies

- TBD
```

If it is `TBD`, the ticket is not planned.

### Prevent vague tickets from entering `planned/`

A planned ticket must have:

* concrete scope;
* concrete non-goals;
* acceptance checks;
* verification method;
* dependency status;
* expected files.

If any of those are missing, it stays in `backlog/`.

### Prevent scope drift during implementation

When a new idea appears during implementation:

1. Do not implement it immediately.
2. Add it to `Implementation notes` or create a new backlog ticket.
3. Continue the active ticket.
4. Only modify scope if the new work is necessary to satisfy acceptance checks.

### Keep commits atomic

Before committing, the agent should check:

```sh
git status
git diff
```

Then ask:

> “Would this commit message honestly describe all changed files?”

If not, split the changes or revert unrelated edits.

---

## 7. Dependency and split procedure

### Dependency procedure

When a dependency is discovered:

1. Add it to the current ticket’s `Dependencies`.
2. Decide whether it is already satisfied.
3. If not satisfied, create a new backlog ticket.
4. If the dependency blocks implementation, move the current ticket out of `active/`.
5. Promote the dependency ticket only when it is ready.
6. Resume the original ticket after dependency completion.

Example:

```markdown
## Dependencies

- Depends on PLF-0021 because candidate ranking needs candidate extraction output.
```

The dependent ticket should not be active until `PLF-0021` is done.

### Split procedure

When a ticket is too large:

1. Keep the original file open.
2. Identify the smallest independent outcomes.
3. Create one new ticket per outcome.
4. Give each child ticket its own acceptance checks.
5. Add dependency links if order matters.
6. Move the original ticket to `rejected/`.
7. Set `Resolution: superseded`.
8. Link the replacement tickets.

Example:

```markdown
## Resolution

Superseded by split tickets:

- PLF-0024-add-run-manifest-file
- PLF-0025-record-collect-command-inputs
- PLF-0026-document-run-manifest-format

Reason: original ticket combined data format, tool behavior, and documentation.
```

The original ticket is not “done” because it was not implemented. It is `rejected/` because it should not be implemented as written.

---

## 8. Commit and git conventions

### Ticket ID convention

Use:

```text
PLF-0001
PLF-0002
PLF-0003
```

Where `PLF` means `pi-linuxfr`.

Filename format:

```text
PLF-0001-short-kebab-title.md
```

Examples:

```text
PLF-0011-add-collect-run-manifest.md
PLF-0012-query-raw-by-source-format.md
PLF-0013-document-ticket-workflow.md
```

Keep the ID stable even if the title changes.

### Commit message convention

Use:

```text
PLF-0011: add collect run manifest
```

For docs:

```text
PLF-0013: document ticket workflow
```

For fixes:

```text
PLF-0014: fix raw query limit handling
```

Avoid multi-topic commit messages.

### Recording the final commit

At completion:

```markdown
Commit: abc1234

## Final changed files

- src/extensions/linuxfr.ts
- tests/linuxfr-query-raw.test.ts

## Resolution

Done in abc1234.
```

If the ticket required multiple commits despite the rule, record all commits and explain why. But this should be rare.

---

## 9. Minimal automation wishlist

I would keep automation out of V1. Later, add only these small checks.

### `scripts/tickets-check`

Worth adding once the workflow is used regularly.

Checks:

* at most one file in `tickets/active/`;
* every ticket filename starts with `PLF-`;
* planned tickets have required sections;
* active ticket has `Started`;
* done tickets have `Commit`;
* no `TBD` in planned or active tickets.

This is valuable because it enforces the workflow without becoming a workflow engine.

### `scripts/tickets-new`

Maybe useful later.

Creates a ticket from `TEMPLATE.md` with the next ID.

Keep manual for now because ID allocation is not yet painful.

### `scripts/tickets-list`

Optional.

Prints:

```text
ACTIVE
  PLF-0014 ...

PLANNED
  PLF-0015 ...
  PLF-0016 ...

BACKLOG
  PLF-0017 ...
```

Useful but not necessary because directories are already readable.

### Pi extension tool later

Only after scripts prove useful, add a project-local Pi extension under `.pi/extensions/` with tools like:

* `linuxfr_ticket_new`;
* `linuxfr_ticket_activate`;
* `linuxfr_ticket_check`.

This fits Pi’s extension model, where TypeScript extensions can register custom tools callable by the model, but it should not be required for the workflow. ([Pi Dev][3])

Do **not** start with extension automation. The manual Markdown workflow is the product test.

---

## 10. Critique of this design

### Most likely failure modes

The biggest risk is that `backlog/` becomes a junk drawer. That is acceptable if `planned/` stays clean.

The second risk is agents moving vague tickets into `planned/` too early. The defense is strict planned-readiness rules.

The third risk is scope drift: while implementing candidate extraction, the agent may also add ranking, manifests, and docs. The defense is the active ticket contract plus atomic commit convention.

The fourth risk is stale tickets. That is tolerable. Stale backlog is less dangerous than lost context.

### Parts that may be overkill

`rejected/` may feel heavy early on. But I would keep it because “superseded by split tickets” is important historical information for agent sessions.

The template may also feel slightly verbose. If it becomes annoying, remove `Expected files` before removing `Acceptance checks` or `Non-goals`.

### Parts that may be missing

There is no explicit priority system. I think that is good for now. Priority can be expressed by moving tickets into `planned/`.

There is no owner field. For a single developer plus AI sessions, that is unnecessary.

There is no estimate field. Estimates invite fake precision and do not help atomic commits.

There is no `blocked/` state. That is intentional, but if many tickets genuinely block on external facts, add a `Blocked reason` field before adding a new directory.

### What I would simplify further

If even this feels too heavy, reduce it to:

```text
tickets/
  README.md
  TEMPLATE.md
  backlog/
  active/
  done/
```

But my actual recommendation is to keep `planned/`. The distinction between “idea captured” and “ready for a fresh agent session” is exactly the problem this repository now has.

[1]: https://pi.dev/docs/latest "Pi Documentation · Docs · Pi"
[2]: https://pi.dev/ "Pi Coding Agent"
[3]: https://pi.dev/docs/latest/extensions "Extensions · Docs · Pi"
[4]: https://pi.dev/press-kit "Press Kit · Pi"
