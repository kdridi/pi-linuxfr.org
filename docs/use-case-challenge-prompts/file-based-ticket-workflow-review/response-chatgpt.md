# Review: Lightweight File-Based Ticket Workflow for `pi-linuxfr.org`

## 0. Executive verdict

**Recommendation: adjust lightly, do not redesign.**

This workflow is usable as-is by an AI coding agent in a fresh Pi session. It fits the project: small, file-based, inspectable, manual, git-backed, and compatible with Pi’s minimal tooling model.

The main risks are not structural. The directory model is good. The README is mostly good. The template is mostly sufficient.

The weak points are:

1. **The workflow says “only one ongoing ticket,” but does not define how to safely pause or preempt one.**
2. **The template has too much always-visible ceremony for backlog tickets.**
3. **Ticket activation and completion rely on manual discipline, but the exact shell commands / checks are not written down.**
4. **The meaning of `estimated_complexity: large` conflicts with “one focused commit.”**
5. **There is no explicit rule for what an agent should do when the user asks for work that bypasses the ticket system.**
6. **The ticket ID allocation rule is vulnerable to agent mistakes unless the scan command is made explicit.**
7. **`completed/` can become a graveyard that agents waste time reading unless the README says when to ignore it.**

This is not a reason to add automation yet. The smallest improvement is to make the manual workflow more operational.

---

# 1. Agent usability verdict

## Could I use this workflow reliably in a fresh Pi session?

**Yes.**

As an AI coding agent dropped into the repository, I would know the important things:

* read `AGENTS.md`;
* if ticketed work is involved, read `tickets/README.md`;
* inspect `tickets/ongoing/`;
* continue the active ticket if one exists;
* otherwise inspect `tickets/planned/`;
* move one ticket at a time through `planned/ -> ongoing/ -> completed/`;
* keep tickets as Markdown files;
* use git history as the audit trail;
* avoid expanding scope silently.

That is enough to operate.

## What is immediately clear?

The following are strong:

* **Directory-as-state is clear.** An agent can infer ticket state without parsing an index.
* **One active ticket is clear.** `ongoing/` is a simple concurrency guard.
* **Manual-first is clear.** No fake project-management system is being invented.
* **The lifecycle is mostly clear.** Backlog, planned, ongoing, completed, rejected are understandable.
* **The “fresh session” use case is well represented.** The README explicitly addresses cold starts and handoff.
* **The template supports durable context.** Objective, scope, acceptance criteria, verification, decisions, resolution, and log are all useful.

## What is still ambiguous?

The ambiguities that would likely cause real agent mistakes are:

### 1. What does an agent do when the user asks for direct work without naming a ticket?

`AGENTS.md` says “when work is driven by local tickets,” but not when it must be ticketed.

An agent may wonder:

* Should every code change require a ticket?
* Can small fixes happen without a ticket?
* Can the user explicitly bypass tickets?
* Should the agent create a backlog ticket first?
* Are documentation-only changes exempt?

The README mentions bootstrap exceptions, but not everyday small exceptions.

### 2. What does “pause” mean?

The README says:

> if another ticket is already ongoing, finish, pause, or move that ticket before activating a new one

But there is no `paused/` directory and no pause protocol.

This is dangerous because agents may invent inconsistent behavior:

* leave it in `ongoing/`;
* move it back to `planned/`;
* create a `paused/` directory;
* rename it;
* add an ad-hoc status;
* put notes somewhere else.

You need one explicit answer.

### 3. What is allowed to change in an ongoing ticket?

The README says avoid changing scope, but it also says update log and record decisions. That is fine, but it should explicitly distinguish:

* allowed: implementation notes, decisions, files changed, verification notes, log;
* not allowed without user approval: objective, acceptance criteria, scope expansion, dependency changes that alter order.

### 4. What exactly counts as “verified”?

The template has a `Verification` section, but the README does not say what to record when verification is manual, skipped, impossible, or not applicable.

Agents are likely to write vague entries like “tested manually” without enough detail.

### 5. How should ticket IDs be allocated?

“Scan all ticket directories and increment the highest existing ID” is conceptually clear, but agents make mistakes here. Give them a command.

Example:

```sh
find tickets -type f -name 'PLF-*.md' | sed -E 's/.*PLF-([0-9]+)\.md/\1/' | sort -n | tail -1
```

Even if the command is not perfect forever, having a canonical manual check reduces duplicate IDs.

### 6. What does `estimated_complexity: large` mean?

If tickets should normally map to one focused commit, `large` is suspicious.

A `large` planned ticket should probably not exist. It should either stay in `backlog/` or be split.

### 7. Does `priority` matter?

The template includes `priority`, but the README does not say how priority affects selection.

If priority does not drive behavior, agents may overfit to it or waste time debating it.

---

# 2. Fit to Pi

## Does the workflow fit Pi’s file-based, minimal, extensible philosophy?

**Yes. Very well.**

This is the right shape for Pi:

```text
Markdown files + directories + git + shell commands
```

It does not require:

* a database;
* a server;
* a project-management API;
* a background daemon;
* an issue tracker;
* sub-agents;
* plan mode;
* built-in todo features;
* hidden state outside the repository.

This is exactly the kind of workflow a minimal terminal coding harness can use well.

## Does it make good use of Pi’s capabilities?

Yes.

Pi agents can:

* read `AGENTS.md`;
* read `tickets/README.md`;
* inspect directories;
* move files;
* edit Markdown;
* run tests;
* inspect git status;
* commit focused changes;
* leave durable handoff notes;
* resume from files instead of relying on conversation memory.

The workflow correctly assumes that file state is more durable than chat state.

## Does it avoid assuming features Pi does not provide by default?

Mostly yes.

The workflow does **not** assume:

* built-in issue tracking;
* task queues;
* labels;
* assignees;
* branch management;
* worktrees;
* scheduled jobs;
* agent memory;
* automatic validation.

Good.

The only small weakness is wording like “pause” and “finish, pause, or move” without defining what “pause” means in this file-based model.

---

# 3. Directory structure review

Current structure:

```text
tickets/
  README.md
  TEMPLATE.md
  backlog/
  planned/
  ongoing/
  completed/
  rejected/
```

## Is the chosen state model right?

**Yes.**

This is the minimum state model I would keep.

Each state has a distinct useful meaning:

| State        | Value                                          |
| ------------ | ---------------------------------------------- |
| `backlog/`   | Captures unrefined ideas without commitment.   |
| `planned/`   | Holds ready-to-implement work.                 |
| `ongoing/`   | Provides single-ticket focus and resumability. |
| `completed/` | Preserves implemented history.                 |
| `rejected/`  | Preserves why something was not done.          |

This is better than a single `tickets/` directory with frontmatter-only status because the state is visible from the filesystem.

## Is any directory missing?

**No mandatory directory is missing.**

I would **not** add `paused/` yet.

A `paused/` directory sounds useful, but it creates another semi-active state. It will become a dumping ground unless the project genuinely needs multiple interrupted streams.

Instead, define pause behavior this way:

> A paused ticket remains in `ongoing/` unless the user explicitly decides to deactivate it. If deactivated, move it back to `planned/` with a log entry explaining the current state and next step.

That preserves the “only one active thread” rule.

## Is any directory unnecessary?

No.

`rejected/` is worth keeping. Without it, superseded tickets will either pollute `backlog/` or get deleted, losing rationale.

`completed/` is also worth keeping, but agents should be told not to scan it routinely except for dependency/history checks.

## Are the directory names optimal?

Mostly yes.

I would keep:

```text
backlog/
planned/
ongoing/
completed/
rejected/
```

Potential alternatives like `ready/`, `active/`, `done/`, `wontdo/` are not clearly better.

`planned/` is slightly less precise than `ready/`, but the README defines it well. Keep it.

---

# 4. README review

## Is the README durable over time?

Mostly yes, but it is slightly too long for something every cold session must read.

The content is good. The risk is that future agents skim it and miss the operational parts.

I would keep the full README, but add a short **“Cold session checklist”** near the top.

Example:

```markdown
## Cold session checklist

For ticketed work:

1. Read `AGENTS.md` and this file.
2. Run `find tickets/ongoing -type f -name 'PLF-*.md'`.
3. If exactly one ticket is ongoing, continue only that ticket.
4. If more than one ticket is ongoing, stop and report workflow corruption.
5. If none is ongoing, select at most one ticket from `tickets/planned/`.
6. Before editing code, move the selected ticket to `ongoing/`, update `status`, `updated`, and `Log`.
7. Before completion, run verification, update `Files Changed`, `Decisions`, `Resolution`, and `Log`.
8. Commit with the ticket ID in the message.
9. Move the ticket to `completed/` only after the commit exists.
```

This gives agents a fast operational path.

## Are the state transition rules clear enough?

Conceptually yes. Operationally almost.

The strongest parts are:

* each transition has a purpose;
* readiness is defined;
* completion requires verification and commit;
* rejection is not deletion;
* splitting is described.

The missing operational pieces are:

* exact pause/deactivation behavior;
* exact expected handling when user bypasses tickets;
* exact commands for inspecting ongoing tickets and assigning IDs;
* what to do if verification is not applicable;
* what fields may be edited after terminal states.

## Does it explain what to do when a rule fails?

Yes, better than most lightweight workflows.

Examples:

* if not ready, keep in backlog;
* if dependencies are missing, complete or ask;
* if more than one ongoing ticket, stop and report corruption;
* if verification fails, keep ongoing;
* if ticket is too large, split.

The one bad exception is again “pause,” because it names an action without defining it.

## Is the dependency procedure operational enough?

Mostly.

It tells the agent to:

1. add the dependency;
2. check whether completed;
3. reference completed ticket or commit;
4. refine/schedule if in backlog;
5. propose a new prerequisite if missing;
6. keep dependent ticket in backlog if order unclear.

That is good.

What is missing is a convention for dependency syntax.

Right now frontmatter has:

```yaml
dependencies: []
```

And the body has:

```markdown
## Dependencies

- None.
```

But there is no canonical form.

I would add:

```markdown
Use ticket IDs in dependencies when possible:

Frontmatter:

dependencies: ["PLF-001"]

Body:

- `PLF-001` — required because ...
```

Also specify that external dependencies should be written plainly:

```markdown
- External: Pi extension API behavior from `AGENTS.md`.
- External: existing `linuxfr_collect_pages` implementation.
```

## Is the split procedure operational enough?

Yes.

The split procedure is one of the better parts of the README.

The only thing I would change: do not require user approval for every split if the user has already asked the agent to organize tickets. In a coding session, stopping for approval can be too much friction.

Better wording:

```markdown
Ask the user to approve the split unless the user explicitly delegated ticket organization to the agent.
```

But if your preferred mode is strict user control, the current wording is acceptable.

## Is the session workflow precise enough for a cold AI session?

Almost.

It needs the concrete commands and the bypass rule.

Suggested addition:

````markdown
Useful manual checks:

```sh
find tickets/ongoing -type f -name 'PLF-*.md' | sort
find tickets -type f -name 'PLF-*.md' | sort
git status --short
````

````

This is not automation. It is documentation of manual inspection.

## What is too verbose?

The README repeats the same idea in several places:

- planned tickets must be clear;
- tickets should be small;
- avoid hidden assumptions;
- split if too large;
- one focused commit.

This repetition is not fatal. For agents, repetition can actually help. But if you want to reduce it later, compress the repeated “ready” language into one canonical definition and reference it elsewhere.

## What is too vague or missing?

Must-fix vague/missing items:

1. pause/deactivation rule;
2. ticket bypass rule;
3. dependency syntax;
4. canonical ID allocation command;
5. verification recording rule;
6. meaning of `large`;
7. when to inspect `completed/`.

---

# 5. Template review

Current template is solid but slightly heavier than necessary.

## Is it minimal but sufficient?

For `planned/` and `ongoing/`: **yes**.

For `backlog/`: **too much ceremony**.

Backlog tickets may be rough. A full template with acceptance criteria, verification, decisions, files changed, resolution, and log can discourage quick capture.

You have two options:

### Option A: Keep one template, but explicitly allow partial backlog tickets

This is the smallest change.

Add near the top of `TEMPLATE.md`:

```markdown
Backlog tickets may leave sections incomplete. Before a ticket moves to `planned/`, all readiness-relevant sections must be filled: Objective, Context, Scope, Acceptance Criteria, Dependencies, Implementation Notes, and Verification.
````

### Option B: Add a second `BACKLOG_TEMPLATE.md`

I would not do this yet. It is a small project and two templates add choice overhead.

Keep one template.

## Useful fields

These are useful and should stay:

```yaml
id
title
status
type
created
updated
dependencies
```

These sections should stay:

```markdown
Objective
Context
Scope
Acceptance Criteria
Dependencies
Implementation Notes
Verification
Files Changed
Decisions
Notes
Resolution
Log
```

Especially important for handoff:

* `Objective`
* `Scope`
* `Acceptance Criteria`
* `Verification`
* `Decisions`
* `Log`

## Redundant or questionable fields

### `priority`

Useful only if the project will actually use it to choose from `planned/`.

If not, it becomes fake metadata.

I would either remove it or define it.

Recommended definition:

```markdown
priority:
  P0: blocks the MVP or repair of the workflow
  P1: important next step
  P2: useful but deferrable
```

### `estimated_complexity`

This is useful, but the values should be changed.

Current:

```yaml
estimated_complexity: small | medium | large
```

Problem: `large` conflicts with the one-ticket/one-commit discipline.

Recommended:

```yaml
estimated_complexity: small | medium
```

And add:

```markdown
If a ticket seems large, keep it in `backlog/` and split it before planning.
```

Alternative:

```yaml
estimated_complexity: small | medium | split-required
```

I prefer `small | medium`.

## Missing required fields or sections

I would add one field:

```yaml
supersedes: []
```

Optional, not required.

But you can also avoid it and use `Resolution`.

I would not add many more fields.

Possible useful addition:

```yaml
blocked_by: []
```

But that duplicates `dependencies`.

Do not add it.

## Does it support backlog vagueness while enforcing planned readiness?

Not explicitly enough.

The README says backlog may be incomplete, but the template itself looks strict.

Add this line to the template:

```markdown
Backlog tickets may be incomplete. Planned and ongoing tickets must be complete enough for a fresh session to implement without hidden assumptions.
```

## Does it support mid-ticket handoff?

Yes.

The `Log`, `Decisions`, `Files Changed`, and `Notes` sections are enough.

I would add one small convention to `Log`:

```markdown
Use log entries like:

- YYYY-MM-DD HH:MM:SS: Started implementation. Current focus: ...
- YYYY-MM-DD HH:MM:SS: Paused. Done: ... Next: ... Risk: ...
- YYYY-MM-DD HH:MM:SS: Verification failed. Command: ... Result: ...
- YYYY-MM-DD HH:MM:SS: Completed. Commit: ...
```

This helps agents leave useful handoff instead of vague notes.

---

# 6. `AGENTS.md` review

## Is the ticket guidance enough?

Almost.

The current ticket section is good:

```markdown
When work is driven by local tickets, read `tickets/README.md` before changing files.
```

It also correctly says:

```markdown
At the start of ticketed work, inspect `tickets/ongoing/` first.
```

This is enough to route the agent into the ticket workflow.

## Should `AGENTS.md` say more or less?

A little more, but not much.

`AGENTS.md` should not duplicate the full ticket workflow. It should only answer the routing question:

* when should tickets be used?
* what must happen before file changes?
* what happens if user asks for non-ticketed work?

Suggested replacement for the ticket section:

```markdown
## Ticket workflow

Use local tickets for non-trivial repository changes, multi-step work, or work that should be resumable across sessions.

For trivial typo fixes, bootstrap repairs, or user-explicit one-off changes, a ticket is optional. If no ticket is used, keep the change small and explain why.

When work is ticketed, read `tickets/README.md` before changing files.

At the start of ticketed work:

1. Inspect `tickets/ongoing/`.
2. If exactly one ticket is ongoing, continue only that ticket unless the user explicitly changes direction.
3. If more than one ticket is ongoing, stop and report workflow corruption.
4. If no ticket is ongoing, select or create one ticket according to `tickets/README.md`.

Do not silently expand an ongoing ticket. Put unrelated discoveries into `tickets/backlog/`.
```

This gives agents a decision boundary.

## Any conflict with MVP/change discipline?

No real conflict.

The ticket workflow reinforces the MVP discipline:

* atomic changes;
* one focused commit;
* explicit scope;
* split oversized work;
* backlog unrelated discoveries;
* manual before automation.

Potential soft conflict:

`AGENTS.md` says “Before adding anything new, ask: Can it wait?”

The ticket workflow may encourage creating many tickets for future ideas. That is okay if backlog remains an inbox, not a commitment.

Add this idea somewhere:

```markdown
Creating a backlog ticket is not approval to implement it.
```

The README already says this. Good.

---

# 7. Optimization proposal

## Must-change recommendations

### 1. Define pause/deactivation behavior

Add to `tickets/README.md` under `ongoing/` or state transitions:

```markdown
## Pausing or deactivating work

There is no separate `paused/` state.

If work stops temporarily but remains the active focus, leave the ticket in `ongoing/` and add a log entry with:

- what is done;
- what is not done;
- what was tried;
- the next recommended step;
- any failing verification command or error.

If the user explicitly chooses to stop working on the ticket and activate another one, move the ticket back to `planned/`, update `status`, `updated`, and `Log`, and make clear what remains before it can be resumed.

Do not create a `paused/` directory without an explicit workflow change.
```

### 2. Add a non-ticketed work rule to `AGENTS.md`

Add:

```markdown
Use local tickets for non-trivial repository changes, multi-step work, or work that should be resumable across sessions.

For trivial typo fixes, bootstrap repairs, or user-explicit one-off changes, a ticket is optional. If no ticket is used, keep the change small and explain why.
```

This prevents every tiny change from becoming process-heavy while still preserving discipline.

### 3. Make ID allocation operational

Add to README:

````markdown
To find the next ticket number:

```sh
find tickets -type f -name 'PLF-*.md' | sed -E 's/.*PLF-([0-9]+)\.md/\1/' | sort -n | tail -1
````

Use the next integer after the highest number found. Preserve zero padding.

````

### 4. Define dependency syntax

Add:

```markdown
Use ticket IDs for internal dependencies.

Frontmatter:

```yaml
dependencies: ["PLF-001"]
````

Body:

```markdown
- `PLF-001` — reason this must be completed first.
```

Use plain text for external dependencies, such as project files, Pi behavior, or LinuxFr constraints.

````

### 5. Remove or redefine `large`

Change:

```yaml
estimated_complexity: small | medium | large
````

To:

```yaml
estimated_complexity: small | medium
```

And add:

```markdown
If a ticket appears large, keep it in `backlog/` and split it before moving it to `planned/`.
```

This aligns the template with the one-ticket/one-commit rule.

### 6. Add a backlog incompleteness note to the template

Add near the top:

```markdown
Backlog tickets may be incomplete. Before moving to `planned/`, fill the readiness-relevant sections enough for a fresh session to implement without hidden assumptions.
```

### 7. Define verification recording

Add to README or template:

```markdown
When recording verification, include the command or manual check performed and the result. If verification is not applicable, write why.
```

Example:

```markdown
## Verification

- `npm test` passes.
- Manual check: `linuxfr_query_raw` returns the newly collected source.
- Not applicable: documentation-only change, reviewed rendered Markdown.
```

## Nice-to-have recommendations

### 1. Add a cold session checklist near the top of README

This is not strictly required, but it will reduce agent mistakes.

### 2. Define priority semantics

Either remove `priority` or define it.

Recommended:

```markdown
P0: blocks MVP, data safety, or workflow repair.
P1: important next implementation step.
P2: useful but deferrable.
```

### 3. Tell agents when to ignore `completed/`

Add:

```markdown
Do not scan `completed/` during normal ticket selection. Inspect it only for dependency checks, historical context, or duplicate detection.
```

This prevents completed tickets from becoming noise.

### 4. Add transition log examples

Agents produce better logs when examples exist.

Example:

```markdown
- 2026-06-23 14:10:22: Moved from `planned/` to `ongoing/`; dependencies checked.
- 2026-06-23 15:02:41: Paused after implementing parser changes. Next: update tests for malformed URLs.
- 2026-06-23 15:44:03: Verification passed with `npm test`.
- 2026-06-23 15:49:12: Completed in commit `abc1234`.
```

### 5. Add a corruption recovery rule

You already say to stop and report if more than one ongoing ticket exists. Good.

Add:

```markdown
Do not fix workflow corruption silently unless the user explicitly asks. Report the conflicting tickets and suggest the smallest repair.
```

---

# 8. Can I work with this?

## Could I follow this workflow as-is?

**Yes.**

I could use it today.

I would:

1. read `AGENTS.md`;
2. read `tickets/README.md`;
3. inspect `tickets/ongoing/`;
4. continue the active ticket or activate one planned ticket;
5. keep scope constrained;
6. update ticket metadata and log;
7. run verification;
8. commit with `PLF-XXX:` in the message;
9. move the ticket to `completed/`.

## What missing information would block me?

Nothing blocks me completely.

But these missing details would slow me down or cause inconsistent behavior:

* whether every repository change needs a ticket;
* how to pause or preempt an ongoing ticket;
* whether `large` tickets can enter `planned/`;
* how exactly to allocate the next ticket ID;
* how to format dependencies;
* how much verification detail is enough;
* whether priority affects ticket selection.

## What mistakes would I still be likely to make?

The likely mistakes are:

1. **Over-editing a ticket while it is ongoing**, especially acceptance criteria after discovering implementation details.
2. **Treating `priority` as meaningful even though selection rules do not define it.**
3. **Letting `backlog/` become a pile of vague ideas with full templates half-filled.**
4. **Writing weak log entries**, such as “updated ticket” instead of useful handoff notes.
5. **Completing a ticket without a commit hash**, even when practical.
6. **Forgetting to update `status` after moving files.**
7. **Accidentally choosing the wrong next ticket ID.**
8. **Expanding scope to include “while I’m here” cleanup.**

Most of these are solved by explicit README wording, not automation.

---

# 9. Pre-mortem

Imagine this workflow becomes counterproductive six months from now.

## What probably went wrong?

The workflow probably failed because it became a ritual instead of a focusing device.

Likely failure mode:

```text
backlog fills with vague ideas
planned contains tickets that are not actually ready
ongoing becomes stale
completed becomes noisy history
agents spend time maintaining tickets instead of shipping focused MVP changes
```

## Which rule was ignored first?

The first ignored rule will probably be:

> One ticket should normally map to one focused commit.

Once agents start accepting oversized tickets, the rest degrades:

* acceptance criteria become vague;
* verification becomes partial;
* commits become mixed;
* handoff becomes unreliable;
* tickets stop being trustworthy.

The second ignored rule will be:

> Do not silently expand the ticket scope.

Agents love “while I’m here” changes. This workflow must fight that.

## Which directory became noisy or misleading?

### Most likely: `backlog/`

It will become a junk drawer if every thought becomes a ticket.

Symptoms:

* many tickets with no objective;
* duplicate ideas;
* old research prompts;
* abandoned “maybe later” thoughts;
* no clear next action.

### Second most likely: `planned/`

This is more dangerous.

If `planned/` contains tickets that are not truly ready, agents will trust them and implement based on hidden assumptions.

A noisy `backlog/` is annoying.

A misleading `planned/` is harmful.

## Which part became ceremony without value?

Likely:

* `priority`, if not used for selection;
* `estimated_complexity`, if every ticket says `medium`;
* `Files Changed`, if agents fill it with vague summaries;
* `Log`, if it says only “updated” / “continued” / “done”;
* `Resolution`, if it duplicates the commit message without useful outcome.

The solution is not to delete these sections immediately. The solution is to give examples of useful entries.

## Which ambiguity caused repeated agent mistakes?

The biggest ambiguity is:

> Is this ticket workflow mandatory or optional for this change?

Without a clear rule, agents will either:

* create tickets for trivial edits and slow everything down;
* skip tickets for meaningful changes and destroy resumability.

The second biggest ambiguity is:

> What do I do with an ongoing ticket if the user changes direction?

Without a pause/deactivation rule, agents will corrupt the state model.

## Early warning signs

Watch for these:

* more than one ticket in `ongoing/`;
* tickets in `planned/` with empty acceptance criteria;
* tickets in `planned/` with unresolved questions;
* `estimated_complexity: large` in planned tickets;
* commits without ticket IDs;
* ticket IDs skipped or duplicated accidentally;
* `backlog/` full of stale vague tickets;
* completed tickets without verification notes;
* repeated edits to completed tickets;
* agents scanning all completed tickets before every task;
* users asking “what is actually in progress?” and the answer is unclear;
* agents creating automation before the manual workflow has real pain.

## Minimal guardrails to prevent failure

Do not add hooks yet.

Add these textual guardrails first:

1. A cold-session checklist.
2. A pause/deactivation rule.
3. A non-ticketed work rule.
4. Dependency syntax.
5. ID allocation command.
6. Verification recording examples.
7. “No `large` planned tickets” rule.
8. “Do not inspect `completed/` unless needed” rule.

If the workflow still fails after real use, then add one tiny script later:

```text
tickets/check.sh
```

It should only check:

* duplicate IDs;
* more than one ongoing ticket;
* planned/ongoing tickets missing required sections;
* `status` mismatch with directory;
* `large` tickets in `planned/` or `ongoing/`.

But do not add this now unless manual mistakes already happen repeatedly.

---

# 10. Final recommendation

## Keep as-is, adjust lightly, or redesign?

**Adjust lightly.**

The chosen design is fundamentally good.

Do not redesign.

Do not add a project-management layer.

Do not add automation yet.

Do not add more states.

Do not add an index file.

Do not add worktrees.

Do not add labels.

Do not add a database.

The smallest useful change is to make the current manual workflow harder to misuse.

---

# Final recommended version, concise

## Directory layout

Keep:

```text
tickets/
  README.md
  TEMPLATE.md
  backlog/
  planned/
  ongoing/
  completed/
  rejected/
```

Do not add directories yet.

## State model

Keep:

```text
backlog   = idea inbox
planned   = ready to implement
ongoing   = exactly one active ticket
completed = implemented, verified, committed
rejected  = not implemented as written
```

Add:

```text
No paused directory.
Paused-but-active work stays in ongoing.
Deactivated work moves back to planned with a clear log entry.
```

## Template

Change:

```yaml
estimated_complexity: small | medium | large
```

To:

```yaml
estimated_complexity: small | medium
```

Add note:

```markdown
Backlog tickets may be incomplete. Planned and ongoing tickets must be complete enough for a fresh session to implement without hidden assumptions.
```

Keep the rest.

## README

Add:

1. cold session checklist;
2. pause/deactivation rule;
3. dependency syntax;
4. ID allocation command;
5. verification recording rule;
6. rule that `completed/` is not scanned during normal ticket selection;
7. rule that `large` work must be split before planning.

## `AGENTS.md`

Add a short routing rule:

```markdown
Use local tickets for non-trivial repository changes, multi-step work, or work that should be resumable across sessions.

For trivial typo fixes, bootstrap repairs, or user-explicit one-off changes, a ticket is optional. If no ticket is used, keep the change small and explain why.
```

---

# Changes ranked by urgency

## Must change now

1. Define pause/deactivation behavior.
2. Define when ticketing is mandatory vs optional.
3. Remove or redefine `estimated_complexity: large`.
4. Add dependency syntax.
5. Add ticket ID allocation command.
6. Add verification recording expectations.

## Should change soon

7. Add cold session checklist.
8. Define priority semantics.
9. Add examples of useful log entries.
10. Tell agents not to scan `completed/` during normal selection.

## Do not change yet

11. Do not add `paused/`.
12. Do not add `blocked/`.
13. Do not add an index file.
14. Do not add automation.
15. Do not add a ticket Pi extension.
16. Do not introduce labels, assignees, milestones, or branches into the workflow.

---

# Bottom line

Yes, I could work with this workflow as an AI coding agent.

The design is good because it uses the repository itself as durable state. The main problem is not missing structure; it is a few undefined manual operations that agents will otherwise improvise.

Fix those with small README and template edits, and this becomes a reliable lightweight workflow for Pi-assisted, session-by-session development.
