# Sub-Pi Ticket Workflow Orchestration

## 1. Executive recommendation

Build **a small project-local Pi extension first**, backed by a few deterministic filesystem checks and a few prompt templates for advisory child sessions.

Pi already supports project-local TypeScript extensions, project-local skills, prompt templates, and slash commands; extension commands can be registered with `pi.registerCommand`, and project extensions live under `.pi/extensions/*.ts`. That makes a local command layer the most Pi-native place to encode ticket rituals without turning the repository into a separate project-management product. ([Pi][1])

The first useful slice should be:

1. `/ticket-status`
2. `/ticket-readiness <ticket-id-or-path>`
3. `/ticket-plan <ticket-id-or-path>`
4. `/ticket-verify`

These should **not implement features** yet. They should reduce repeated inspection, readiness analysis, planning, and verification rituals by producing durable Markdown briefs.

Keep manual for now:

* moving tickets between state directories;
* deciding whether a ticket is ready;
* accepting split/refinement proposals;
* approving activation;
* committing;
* deciding whether verification is sufficient.

Explicitly do **not** automate yet:

* automatic `backlog/` → `planned/`;
* automatic `planned/` → `ongoing/`;
* automatic `ongoing/` → `completed/`;
* automatic commits;
* automatic ticket splitting;
* automatic broad code edits by child sessions;
* recursive sub-agent spawning.

The key principle: **commands may prepare evidence; the human performs meaningful state transitions**.

The architecture should feel like this:

```text
Human
  ↓
Main Pi session = orchestrator, reviewer, final reasoning surface
  ↓
Project-local ticket commands
  ↓
Deterministic repository checks + optional read-only child Pi sessions
  ↓
Markdown advisory artifacts under tickets/.artifacts/
  ↓
Human + orchestrator decide what to do
```

The ticket directories remain the source of truth. Artifacts are supporting evidence, not state.

---

## 2. Workflow architecture

### Recommended relationship between orchestrator and child sessions

The main Pi session should remain the only human-facing session.

It should:

* understand the human’s intent;
* call ticket commands;
* inspect produced briefs;
* ask the human for approval when needed;
* perform or supervise actual edits;
* update tickets and logs;
* keep the work aligned with one ticket and one commit.

Child Pi sessions should be treated like **bounded reviewers**, not autonomous workers.

They should usually be:

* read-only;
* single-purpose;
* given one ticket and one task;
* forbidden from spawning more children;
* forbidden from moving tickets;
* forbidden from committing;
* forbidden from editing code unless explicitly launched through a later, guarded write-capable command;
* required to emit one structured Markdown artifact.

Child sessions are useful for:

* readiness analysis;
* split/refinement proposals;
* implementation planning;
* verification reviews;
* stale-artifact detection;
* final completion briefs.

They are less useful for actual implementation in the first version because uncontrolled child edits create exactly the hidden-state problem this workflow is trying to remove.

### Comparison of viable approaches

| Approach                         | Pros                                                                                                                                                                                                                                              | Cons                                                                                                                                                                     | Recommendation                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Prompt-template-only workflow    | Smallest possible. Easy to add. Good for standardizing language.                                                                                                                                                                                  | Does not enforce invariants. Does not scan ticket directories. Does not prevent multiple ongoing tickets. Still depends heavily on the orchestrator remembering rituals. | Useful as supporting material, not enough as the command system.                |
| Skills                           | Good for reusable instructions. Pi skills can package workflow docs, helper scripts, references, and instructions. ([Pi][2])                                                                                                                      | Skills guide the agent but do not by themselves enforce repository invariants.                                                                                           | Add later or alongside commands as documentation for child prompts.             |
| CLI child process using `pi -p`  | Simple. Scriptable. Good for one-shot advisory child runs. Pi supports non-interactive `pi -p`; JSON mode is available for event streams. ([Pi][3])                                                                                               | Capturing reliable structured output needs care. Child tool permissions need guardrails.                                                                                 |                                                                                 |
| JSON mode                        | Easier to capture events than plain text. Useful for logs and diagnostics.                                                                                                                                                                        | Still a one-shot subprocess pattern. Requires event filtering.                                                                                                           | Good second step after `pi -p`, or first if implementation comfort is high.     |
| RPC mode                         | Most controllable subprocess integration. Pi’s RPC mode exposes a JSON protocol over stdin/stdout and streams events. ([Pi][4])                                                                                                                   | More code, more lifecycle management, more surface area.                                                                                                                 | Too much for the first slice unless you already need persistent child sessions. |
| SDK                              | Strongest programmatic control. Pi’s SDK is meant for embedding agent capabilities, custom tools, automated workflows, and sub-agents. ([Pi][5])                                                                                                  | Highest implementation cost. You are now building a mini orchestration product.                                                                                          | Good ambitious path, not first implementation.                                  |
| Project-local extension commands | Native UX. Deterministic checks can run before agent reasoning. Commands can use UI confirmations, status widgets, shell execution, and registered slash commands. Pi docs show extension commands and project-local extension loading. ([Pi][1]) | Requires learning Pi extension APIs. Project trust needs to be understood for non-interactive modes. ([Pi][6])                                                           | Best first path.                                                                |

### Recommended first implementation path

Build a **project-local extension**:

```text
.pi/
  extensions/
    ticket-workflow.ts
  prompts/
    ticket-readiness.md
    ticket-plan.md
    ticket-verify.md
```

Add deterministic helper code inside the extension or in small scripts:

```text
scripts/
  ticket-workflow/
    scan-state.ts
    parse-ticket.ts
    artifact.ts
```

The first version should:

* register slash commands;
* scan `tickets/`;
* enforce simple invariants;
* create advisory artifact filenames;
* optionally launch child Pi in non-interactive mode;
* never move tickets automatically;
* never commit;
* never edit project code.

This gives immediate value while preserving the existing workflow.

---

## 3. Command design

Use explicit command names rather than clever natural language. The orchestrator can call them quickly, and humans can learn them.

Recommended lifecycle:

```text
/ticket-status
/ticket-readiness <backlog-ticket>
/ticket-refine <backlog-ticket>
/ticket-plan <planned-ticket>
/ticket-activate-check <planned-ticket>
/ticket-verify
/ticket-completion-brief
/ticket-doctor
```

For the first implementation pass, build only:

```text
/ticket-status
/ticket-readiness
/ticket-plan
/ticket-verify
```

### `/ticket-status`

Purpose:

* Show the current ticket state.
* Detect workflow invariant violations.
* Tell the orchestrator what commands are valid next.

Input arguments:

```text
/ticket-status
```

Preconditions:

* Repository root can be detected.
* `tickets/` directory exists.

Read/write permissions:

* Read-only.

May spawn child Pi:

* No.

Expected artifact:

* None by default.
* Optional command log entry later.

Reports to orchestrator:

```text
Ticket state:
- backlog: N
- planned: N
- ongoing: 0 or 1
- completed: N
- rejected: N

Active ticket:
- none
or
- tickets/ongoing/<ticket-id>.md

Invariant status:
- OK
or
- ERROR: multiple ongoing tickets
- ERROR: missing required ticket directories
- WARNING: planned ticket has unresolved dependency marker
```

Failure modes:

* `tickets/` missing.
* unknown ticket state directory.
* more than one ongoing ticket.
* malformed ticket filenames.
* unreadable files.

Opinionated behavior:

* This command should be deterministic.
* It should never ask an LLM to reason.
* It should be safe to run constantly.

---

### `/ticket-readiness <ticket-id-or-path>`

Purpose:

* Analyze whether a `backlog/` ticket is ready to become `planned/`.
* Identify missing objective, scope, acceptance criteria, dependencies, expected artifacts, and verification.
* Recommend one of:

  * ready as-is;
  * refine in place;
  * split;
  * reject/defer.

Input arguments:

```text
/ticket-readiness tickets/backlog/012-add-command-logs.md
/ticket-readiness 012-add-command-logs
```

Preconditions:

* Ticket exists.
* Ticket is in `tickets/backlog/`.
* Ticket file is readable.
* No mutation required.

Read/write permissions:

* Reads ticket.
* Reads workflow docs.
* May read repository structure.
* Writes only an advisory artifact.

May spawn child Pi:

* Yes, read-only advisory child.
* First implementation can do deterministic skeleton checks only, then add child Pi.

Expected artifact:

```text
tickets/.artifacts/readiness/012-add-command-logs.readiness.md
```

Reports to orchestrator:

```text
Readiness: not-ready
Reason: acceptance criteria and verification are incomplete.
Artifact: tickets/.artifacts/readiness/012-add-command-logs.readiness.md
Recommended next action: refine ticket before planning.
```

Failure modes:

* ticket not found;
* ticket is not in backlog;
* artifact already exists for an older ticket hash and needs superseding;
* child Pi failed;
* child output missing required sections.

Opinionated behavior:

* The command should not move the ticket.
* The artifact should say “advisory”.
* The artifact should include the source ticket hash so staleness is detectable.

---

### `/ticket-refine <ticket-id-or-path>`

Purpose:

* Produce a concrete refinement proposal or split proposal for a backlog ticket.

Input arguments:

```text
/ticket-refine tickets/backlog/012-add-command-logs.md
/ticket-refine 012-add-command-logs --split
```

Preconditions:

* Ticket is in backlog.
* A readiness brief exists or the command runs readiness first.
* The ticket is not already ready as-is.

Read/write permissions:

* Default: read-only plus advisory artifact.
* Later optional guarded mode: write proposed ticket drafts under `tickets/backlog/proposed/` or `tickets/.artifacts/refinements/`.

May spawn child Pi:

* Yes, read-only.

Expected artifact:

```text
tickets/.artifacts/refinements/012-add-command-logs.refinement.md
```

Reports to orchestrator:

```text
Recommendation: split into 2 tickets.
Proposed tickets:
1. Add deterministic command log writer.
2. Add command log viewer.
Requires human approval before creating or editing ticket files.
```

Failure modes:

* readiness brief is stale;
* proposed split creates non-atomic tickets;
* proposal lacks acceptance criteria;
* child produces final ticket contents but not rationale.

Opinionated behavior:

* Do not build this in the first pass unless readiness shows repeated pain.
* Refinement is valuable, but it is closer to changing project intent.

---

### `/ticket-plan <ticket-id-or-path>`

Purpose:

* Produce an implementation plan for a `planned/` ticket.
* Confirm the ticket is implementable without hidden assumptions.
* Identify likely files, risks, verification commands, and stop conditions.

Input arguments:

```text
/ticket-plan tickets/planned/013-add-ticket-status-command.md
/ticket-plan 013-add-ticket-status-command
```

Preconditions:

* Ticket exists.
* Ticket is in `tickets/planned/`.
* Ticket has objective, scope, acceptance criteria, dependencies, expected artifacts, and verification.
* Dependencies are resolved or explicitly accepted.

Read/write permissions:

* Reads ticket.
* Reads relevant repository files.
* Writes advisory implementation plan.

May spawn child Pi:

* Yes, read-only advisory child.

Expected artifact:

```text
tickets/.artifacts/plans/013-add-ticket-status-command.plan.md
```

Reports to orchestrator:

```text
Plan status: usable
Likely files:
- .pi/extensions/ticket-workflow.ts
- docs/ticket-workflow.md
Verification:
- npm test, or project-specific command
- manual command run: /ticket-status
Scope warning:
- Do not implement child Pi spawning in this ticket.
```

Failure modes:

* ticket too broad;
* unclear expected artifacts;
* no verification command;
* plan discovers dependency not listed in ticket;
* child cannot identify relevant files.

Opinionated behavior:

* The plan must include **non-goals** and **stop conditions**.
* The plan should explicitly say what not to edit.

---

### `/ticket-activate-check <ticket-id-or-path>`

Purpose:

* Check whether a planned ticket may be moved to ongoing.
* Do not move it automatically in v1.

Input arguments:

```text
/ticket-activate-check tickets/planned/013-add-ticket-status-command.md
```

Preconditions:

* Ticket is in planned.
* `tickets/ongoing/` is empty.
* Implementation plan exists and is not stale.
* Dependencies are resolved or explicitly accepted.

Read/write permissions:

* Read-only.

May spawn child Pi:

* No.

Expected artifact:

* None.

Reports to orchestrator:

```text
Activation check: pass
Human action required:
mv tickets/planned/013-add-ticket-status-command.md tickets/ongoing/
```

Failure modes:

* ongoing not empty;
* plan missing;
* plan stale;
* dependency unresolved;
* dirty working tree contains unrelated changes.

Opinionated behavior:

* This should remain manual until the workflow is boringly reliable.

---

### `/ticket-implement`

Purpose:

* Assist implementation of the single active ongoing ticket.

Input arguments:

```text
/ticket-implement
/ticket-implement --dry-run
```

Preconditions:

* Exactly one ticket in `tickets/ongoing/`.
* Working tree is clean or contains only accepted changes for this ticket.
* Implementation plan exists or human explicitly accepts no plan.

Read/write permissions:

* Write-capable, but only in the main orchestrator session.
* Child implementation should not exist in v1.

May spawn child Pi:

* No in v1.
* Later: maybe spawn read-only “scope sentinel” or “reviewer” child, not writer.

Expected artifact:

```text
tickets/.artifacts/implementation/<ticket-id>.implementation-log.md
```

Reports to orchestrator:

```text
Active ticket: ...
Plan: ...
Allowed files: ...
Forbidden scope: ...
Suggested next edits: ...
```

Failure modes:

* no ongoing ticket;
* multiple ongoing tickets;
* changed files outside likely scope;
* acceptance criteria impossible;
* verification unavailable.

Opinionated behavior:

* This command may summarize, constrain, and guide.
* It should not be the first command implemented.
* Real code edits are better handled by the main Pi session using normal tools.

---

### `/ticket-verify`

Purpose:

* Verify the current implementation against the active ongoing ticket and implementation plan.

Input arguments:

```text
/ticket-verify
/ticket-verify --ticket tickets/ongoing/013-add-ticket-status-command.md
```

Preconditions:

* Exactly one ongoing ticket, unless `--ticket` is given.
* Relevant changes exist.
* Implementation plan may exist but should not be mandatory.

Read/write permissions:

* Reads ticket, plan, changed files, test results.
* May run verification commands.
* Writes advisory verification brief.

May spawn child Pi:

* Yes, read-only child reviewer.
* The child should inspect diffs and logs, not edit.

Expected artifact:

```text
tickets/.artifacts/verification/013-add-ticket-status-command.verify.md
```

Reports to orchestrator:

```text
Verification: pass-with-notes
Satisfied acceptance criteria:
- ...
Open concerns:
- ...
Changed files:
- ...
Recommended completion: yes/no
```

Failure modes:

* tests fail;
* verification command unavailable;
* diff includes unrelated changes;
* acceptance criteria not traceable;
* child review inconclusive;
* artifact stale after more edits.

Opinionated behavior:

* This is one of the highest-value commands.
* It turns “did we finish?” into an inspectable brief.

---

### `/ticket-completion-brief`

Purpose:

* Prepare completion notes before the human commits and moves the ticket.

Input arguments:

```text
/ticket-completion-brief
```

Preconditions:

* Exactly one ongoing ticket.
* Verification brief exists and passes or explains accepted risks.
* Changed files are known.
* Commit not yet made, or commit hash can be supplied.

Read/write permissions:

* Reads ticket, plan, verification brief, git diff.
* Writes completion brief.
* Does not commit.

May spawn child Pi:

* Optional read-only.

Expected artifact:

```text
tickets/.artifacts/completion/013-add-ticket-status-command.completion.md
```

Reports to orchestrator:

```text
Suggested commit message:
013-add-ticket-status-command: add ticket status command

Completion checklist:
- acceptance criteria satisfied
- verification recorded
- changed files documented
- decisions documented
- ticket ID included in commit message
```

Failure modes:

* verification missing;
* changed files include unrelated work;
* commit message lacks ticket ID;
* completion notes contradict verification brief.

Opinionated behavior:

* Useful later.
* Not needed for first slice.

---

### `/ticket-doctor`

Purpose:

* Audit the whole workflow state.

Input arguments:

```text
/ticket-doctor
```

Preconditions:

* `tickets/` exists.

Read/write permissions:

* Read-only.

May spawn child Pi:

* No by default.

Expected artifact:

* Optional:

```text
tickets/.artifacts/doctor/YYYY-MM-DD-HHMMSS.ticket-doctor.md
```

Reports to orchestrator:

```text
Errors:
- multiple ongoing tickets

Warnings:
- stale plan for ticket 013
- completed ticket missing verification section
- planned ticket has unresolved dependency marker

Suggested repairs:
- ...
```

Failure modes:

* huge repository slows scan;
* false positives from informal ticket text;
* artifact directory missing.

Opinionated behavior:

* Add after the first few commands.
* This becomes the “am I still sane?” command.

---

## 4. Artifact design

### Where advisory artifacts should live

Use a hidden-but-versioned directory under `tickets/`:

```text
tickets/
  .artifacts/
    readiness/
    refinements/
    plans/
    verification/
    completion/
    logs/
```

Why this location:

* It keeps workflow evidence near tickets.
* It avoids polluting ticket state directories.
* It makes artifacts easy to commit when useful.
* It makes clear that artifacts are subordinate to the ticket workflow.

Alternative:

```text
tickets/_artifacts/
```

This is more visible and less likely to be missed by tools that ignore dot-directories. My preference is `tickets/.artifacts/` because these files are not ticket state.

### Authoritative vs advisory files

Authoritative:

```text
tickets/backlog/*.md
tickets/planned/*.md
tickets/ongoing/*.md
tickets/completed/*.md
tickets/rejected/*.md
```

Advisory:

```text
tickets/.artifacts/**/*.md
```

Repository implementation truth:

```text
git history
git diff
source files
tests
```

Artifacts should never redefine ticket state. They should say things like:

```text
This brief is advisory. The ticket file and its directory remain authoritative.
```

### Staleness strategy

Every artifact should include:

* source ticket path;
* ticket ID;
* ticket content hash;
* command name;
* command version;
* generated timestamp;
* git commit hash or `dirty`;
* relevant diff hash for verification artifacts.

Example hash fields:

```yaml
ticket_sha256: "..."
git_head: "abc1234"
git_dirty: true
diff_sha256: "..."
command_version: "0.1.0"
```

A command should treat an artifact as stale when:

* the ticket content hash changed;
* the ticket moved state;
* the command version changed in a breaking way;
* the git diff changed after a verification brief;
* the implementation plan references files that no longer exist.

### Readiness brief schema

```markdown
---
artifact_type: readiness_brief
schema_version: 1
command: ticket-readiness
command_version: 0.1.0
ticket_id: "012-add-command-logs"
ticket_path: "tickets/backlog/012-add-command-logs.md"
ticket_state_at_generation: backlog
ticket_sha256: "<sha256>"
git_head: "<commit-or-null>"
git_dirty: true
generated_at: "2026-06-24T14:30:00+02:00"
advisory: true
---

# Readiness Brief: 012-add-command-logs

## Verdict

One of:

- ready
- not-ready
- split-recommended
- reject-or-defer

## Summary

Brief human-readable conclusion.

## Required Fields Check

| Field | Status | Notes |
|---|---:|---|
| Objective | pass/fail | ... |
| Scope | pass/fail | ... |
| Acceptance criteria | pass/fail | ... |
| Dependencies | pass/fail | ... |
| Expected artifacts | pass/fail | ... |
| Verification | pass/fail | ... |

## Atomicity Assessment

Explain whether this maps to one focused commit.

## Hidden Assumptions

List assumptions that would block a fresh Pi session.

## Split Recommendation

Only if needed.

## Questions for Human

Concrete questions, not vague concerns.

## Recommended Next Action

One of:

- move to planned after human review
- refine in backlog
- split into separate tickets
- reject/defer
```

### Implementation plan schema

````markdown
---
artifact_type: implementation_plan
schema_version: 1
command: ticket-plan
command_version: 0.1.0
ticket_id: "013-add-ticket-status-command"
ticket_path: "tickets/planned/013-add-ticket-status-command.md"
ticket_state_at_generation: planned
ticket_sha256: "<sha256>"
git_head: "<commit-or-null>"
git_dirty: false
generated_at: "2026-06-24T14:45:00+02:00"
advisory: true
---

# Implementation Plan: 013-add-ticket-status-command

## Plan Verdict

One of:

- usable
- usable-with-risks
- not-implementable-yet
- split-recommended

## Ticket Objective

Restate objective in one paragraph.

## Scope

### In Scope

- ...

### Out of Scope

- ...

## Expected Files

| File | Reason | Expected Change |
|---|---|---|
| `.pi/extensions/ticket-workflow.ts` | command registration | add `/ticket-status` |

## Implementation Steps

1. ...
2. ...
3. ...

## Verification Plan

Commands or manual checks:

```text
...
````

## Acceptance Criteria Mapping

| Acceptance Criterion | Planned Verification |
| -------------------- | -------------------- |
| ...                  | ...                  |

## Risks

* ...

## Stop Conditions

Stop and ask the human if:

* ...

````

### Verification brief schema

```markdown
---
artifact_type: verification_brief
schema_version: 1
command: ticket-verify
command_version: 0.1.0
ticket_id: "013-add-ticket-status-command"
ticket_path: "tickets/ongoing/013-add-ticket-status-command.md"
ticket_state_at_generation: ongoing
ticket_sha256: "<sha256>"
plan_path: "tickets/.artifacts/plans/013-add-ticket-status-command.plan.md"
plan_sha256: "<sha256-or-null>"
git_head: "<commit-or-null>"
git_dirty: true
diff_sha256: "<sha256>"
generated_at: "2026-06-24T16:10:00+02:00"
advisory: true
---

# Verification Brief: 013-add-ticket-status-command

## Verdict

One of:

- pass
- pass-with-notes
- fail
- inconclusive

## Changed Files

| File | Status | Notes |
|---|---|---|
| `.pi/extensions/ticket-workflow.ts` | modified | added status command |

## Verification Commands Run

```text
npm test
pi ...
````

## Results

Summarize command results.

## Acceptance Criteria Review

| Criterion |    Status | Evidence |
| --------- | --------: | -------- |
| ...       | pass/fail | ...      |

## Scope Review

State whether changes stayed within ticket scope.

## Open Concerns

* ...

## Completion Recommendation

One of:

* ready for human completion
* needs fixes
* needs human decision

````

### Command log schema

Command logs are useful only if they stay small. Do not build a full event store.

```markdown
---
artifact_type: command_log
schema_version: 1
command: ticket-readiness
command_version: 0.1.0
ticket_id: "012-add-command-logs"
started_at: "2026-06-24T14:29:00+02:00"
ended_at: "2026-06-24T14:30:00+02:00"
status: success
child_session: true
advisory: true
---

# Command Log

## Inputs

```text
/ticket-readiness tickets/backlog/012-add-command-logs.md
````

## Preconditions

* ...

## Outputs

* `tickets/.artifacts/readiness/012-add-command-logs.readiness.md`

## Warnings

* ...

## Errors

None.

````

My recommendation: add command logs only after you have the first three commands working. The artifact itself is already a useful log.

---

## 5. Guardrails and safety

### Keep child sessions from mutating the project accidentally

Use layered defenses:

1. **Prompt-level defense**

Child prompt says:

```text
You are read-only. Do not edit files. Do not move tickets. Do not commit. Do not run commands that modify files. Produce exactly one Markdown brief.
````

2. **Tool-level defense**

When launching child Pi, restrict tools as much as Pi allows in the current setup. At minimum, child command wrappers should avoid exposing write/edit/bash mutation paths. Pi’s extension system includes event interception and examples for protected paths, permission gates, and active tool management, so a later version can enforce this inside Pi rather than only by instruction. ([Pi][1])

3. **Filesystem-level defense**

Run child sessions against a read-only checkout or a temporary copy where writes are discarded.

The practical v1 option:

```text
- child reads current repo
- child writes its final brief only through the parent command wrapper
- parent command captures stdout and writes the artifact
```

Do not let the child decide artifact paths.

4. **Git-level detection**

Before and after child run:

```text
git status --porcelain
```

If child changed anything, fail the command and report:

```text
ERROR: child session mutated repository. Review git diff before continuing.
```

### Prevent recursive command spawning

Add an environment variable to child runs:

```text
PI_TICKET_CHILD=1
```

Then extension commands should refuse to spawn children when this is present:

```text
if (process.env.PI_TICKET_CHILD === "1") {
  throw new Error("ticket workflow child sessions may not spawn child sessions");
}
```

Also include prompt instruction:

```text
Do not invoke ticket commands. Do not spawn child Pi sessions.
```

### Enforce only one ticket in `ongoing/`

Make this deterministic.

Every command that touches active work should call the same invariant check:

```text
count(tickets/ongoing/*.md) must be exactly 0 or 1
```

Rules:

* `/ticket-status`: report error if more than one.
* `/ticket-activate-check`: fail if not zero.
* `/ticket-implement`: require exactly one.
* `/ticket-verify`: require exactly one unless explicit ticket path is supplied.
* `/ticket-completion-brief`: require exactly one.

Do not rely on the LLM to count files.

### Prevent implementation from exceeding ticket scope

Use three layers:

1. Ticket must include explicit scope and non-goals before planned.
2. Plan must list expected files and forbidden areas.
3. Verification brief must compare actual changed files with expected files.

During implementation, the orchestrator should keep a live scope summary:

```text
Active ticket:
- id
- objective
- in scope
- out of scope
- expected files
- stop conditions
```

When the diff exceeds expected files, the orchestrator should stop and ask for a human decision.

Good failure message:

```text
Scope warning:
The current diff modifies docs/architecture.md, which was not listed in the plan.
Decision required:
1. Revert that change.
2. Update the ticket scope before continuing.
3. Split this into a new ticket.
```

### Keep commits atomic

Enforce by convention and by checks:

* one ongoing ticket;
* diff reviewed before completion;
* changed files listed in verification brief;
* commit message must include ticket ID;
* unrelated changes are either reverted or split.

Suggested commit message format:

```text
013-add-ticket-status-command: add ticket status command
```

Or:

```text
ticket-013: add ticket status command
```

Completion command should never commit in v1. It should only prepare:

```text
Suggested commit message:
...
Changed files:
...
Completion notes:
...
```

### Handle failed or partial child-session runs

A failed child run should produce either no artifact or a clearly marked failure artifact.

Failure artifact example:

```markdown
---
artifact_type: readiness_brief
status: failed
advisory: true
---

# Failed Readiness Brief

## Failure

Child Pi exited with code 1.

## Safe State

No ticket files were moved.
No repository mutation was expected.

## Next Action

Run `/ticket-status`, inspect `git status`, and retry after fixing the cause.
```

Never treat a partial child output as authoritative.

The parent command should validate:

* required frontmatter exists;
* required sections exist;
* ticket hash matches;
* artifact type matches command;
* verdict is one of allowed values.

---

## 6. Child-session prompt design

### General child prompt pattern

Every child prompt should have the same spine:

```text
You are a bounded advisory child Pi session for repository pi-linuxfr.org.

Your task:
<one task only>

Hard constraints:
- Read-only.
- Do not edit files.
- Do not move tickets.
- Do not commit.
- Do not spawn child sessions.
- Do not invoke ticket workflow commands.
- Do not implement code.
- Produce exactly one Markdown brief matching the requested schema.
- Repository artifacts and proposed text must be in English.

Authoritative truth:
- Ticket state is determined only by the ticket file location under tickets/.
- Advisory artifacts are not authoritative.
- The human remains the final decision-maker.

Input ticket:
- Path: ...
- State: ...
- SHA-256: ...

Workflow rules:
<embed the minimal relevant rules, not the entire world>

What to inspect:
- the ticket file;
- ticket workflow docs;
- relevant repository files needed to answer this specific task.

Output:
- Markdown only.
- Include the exact frontmatter schema.
- Include a clear verdict.
- Include concrete questions for the human when blocked.
```

### What context should be embedded directly

Embed:

* the specific task;
* the ticket path;
* ticket hash;
* current ticket state;
* relevant workflow rules;
* expected output schema;
* hard constraints;
* command version;
* current git head and dirty state;
* whether the artifact should be advisory.

Do not embed the entire repository or every ticket. Let the child inspect only what it needs.

### What child sessions should discover through read-only inspection

Let child sessions discover:

* repository layout;
* existing workflow docs;
* relevant source files;
* test commands;
* nearby examples;
* existing artifact conventions;
* actual acceptance criteria in the ticket.

This prevents prompt bloat and keeps the child grounded in current files.

### How structured should output be

Very structured.

For readiness, plan, and verification, output should be Markdown with YAML frontmatter and fixed headings. Free-form prose is acceptable inside sections, but the top-level verdict must be machine-checkable.

Bad:

```text
Looks good overall, maybe do it.
```

Good:

```yaml
verdict: usable-with-risks
```

And:

```markdown
## Stop Conditions

- Stop if implementation requires changing ticket state transitions.
- Stop if command registration API differs from current Pi docs.
```

---

## 7. Human-in-the-loop checkpoints

### Human must explicitly approve

The human must approve:

* moving backlog ticket to planned;
* splitting a ticket;
* rejecting a ticket;
* activating a planned ticket;
* accepting unresolved dependencies;
* expanding scope;
* editing ticket objective or acceptance criteria;
* completing a ticket;
* committing;
* any write-capable child automation;
* any command that mutates files outside `tickets/.artifacts/`.

### Orchestrator should never decide alone

The orchestrator should never independently decide:

* “This ticket is now planned.”
* “This ticket is now completed.”
* “This dependency can be ignored.”
* “This broader implementation is close enough.”
* “This unrelated cleanup belongs in the same commit.”
* “This generated split is now the new truth.”
* “This failed verification is acceptable.”

The orchestrator may recommend. The human decides.

### How to surface questions when a ticket is not ready

Questions should be concrete and answerable.

Bad:

```text
Please clarify the scope.
```

Good:

```text
This ticket mentions “command logs”, but it is unclear whether logs are:
1. one Markdown artifact per command run,
2. appended to a single log file,
3. only displayed in Pi UI.

Choose one before moving this ticket to planned.
```

A readiness brief should end with:

```markdown
## Questions for Human

1. Should this ticket create only `/ticket-status`, or also `/ticket-doctor`?
2. Should command output be displayed only, or also written under `tickets/.artifacts/logs/`?
3. What verification command should be considered sufficient for this repository?
```

---

## 8. Incremental implementation plan

Below are tickets suitable for the existing workflow. Keep them as English repository artifacts.

### Ticket 1: Add deterministic ticket status command

Objective:

* Add a project-local Pi extension command that reports ticket workflow state and invariant errors.

Scope:

* Create `.pi/extensions/ticket-workflow.ts`.
* Register `/ticket-status`.
* Scan `tickets/backlog`, `tickets/planned`, `tickets/ongoing`, `tickets/completed`, `tickets/rejected`.
* Report counts.
* Report active ongoing ticket.
* Detect missing directories.
* Detect more than one ongoing ticket.
* Do not spawn child Pi.
* Do not write artifacts.

Acceptance criteria:

* Running `/ticket-status` reports counts per ticket state.
* Running `/ticket-status` reports the single active ticket when exactly one exists.
* Running `/ticket-status` reports “no active ticket” when ongoing is empty.
* Running `/ticket-status` reports an error when more than one Markdown ticket exists in `tickets/ongoing/`.
* The command does not modify repository files.
* Repository artifact text is English.

Likely files:

```text
.pi/extensions/ticket-workflow.ts
docs/ticket-workflow-commands.md
```

Dependencies:

* Existing `tickets/` directory.
* Pi project trust for project-local extension loading. Pi project settings and resources require trust behavior, especially in non-interactive modes. ([Pi][6])

Verification:

```text
# Manual
Start Pi in the repository.
Run /ticket-status.

# Filesystem scenarios
- ongoing empty
- ongoing has one ticket
- ongoing has two temporary test tickets

# Git check
git status --porcelain
```

This is the best first ticket because it has no LLM orchestration risk and immediately reduces repeated ritual.

---

### Ticket 2: Add ticket artifact directory and artifact naming helper

Objective:

* Introduce a consistent advisory artifact location and deterministic artifact naming helper.

Scope:

* Create `tickets/.artifacts/` subdirectories.
* Add helper logic to compute ticket ID from path.
* Add helper logic to compute ticket SHA-256.
* Add docs explaining advisory vs authoritative files.
* Do not launch child Pi.
* Do not create readiness/plan/verification content yet.

Acceptance criteria:

* Artifact directories are documented.
* Helper can produce paths like `tickets/.artifacts/plans/<ticket-id>.plan.md`.
* Helper records ticket hash and git head values.
* Documentation states that ticket directories remain authoritative.
* No ticket state transitions are automated.

Likely files:

```text
.pi/extensions/ticket-workflow.ts
docs/ticket-workflow-commands.md
tickets/.artifacts/.gitkeep
tickets/.artifacts/readiness/.gitkeep
tickets/.artifacts/plans/.gitkeep
tickets/.artifacts/verification/.gitkeep
```

Dependencies:

* Ticket 1.

Verification:

```text
Run /ticket-status.
Run any helper command added for dry-run artifact path preview, or unit-test the helper if the repo has tests.
Confirm git diff contains only expected files.
```

---

### Ticket 3: Add readiness brief command without child Pi

Objective:

* Add `/ticket-readiness <ticket>` using deterministic checks only.

Scope:

* Validate that the ticket exists in `tickets/backlog/`.
* Check for required headings or fields:

  * objective;
  * scope;
  * acceptance criteria;
  * dependencies;
  * expected artifacts;
  * verification.
* Write a readiness brief under `tickets/.artifacts/readiness/`.
* Do not move the ticket.
* Do not spawn child Pi.

Acceptance criteria:

* Command fails clearly for non-backlog tickets.
* Command writes a readiness brief with frontmatter.
* Brief includes ticket hash.
* Brief includes pass/fail for required readiness fields.
* Brief says it is advisory.
* Command does not modify ticket state.

Likely files:

```text
.pi/extensions/ticket-workflow.ts
docs/ticket-workflow-commands.md
tickets/.artifacts/readiness/
```

Dependencies:

* Ticket 2.

Verification:

```text
/ticket-readiness tickets/backlog/<ticket>.md
cat tickets/.artifacts/readiness/<ticket-id>.readiness.md
git status --porcelain
```

---

### Ticket 4: Add implementation plan command with read-only child Pi

Objective:

* Add `/ticket-plan <planned-ticket>` that launches a bounded read-only child Pi session and writes an implementation plan artifact.

Scope:

* Validate ticket is in `tickets/planned/`.
* Validate ongoing invariant.
* Build child prompt from template.
* Launch child Pi using the simplest available non-interactive mode.
* Capture output.
* Validate required artifact sections.
* Write plan under `tickets/.artifacts/plans/`.
* Detect stale plan by ticket hash on future runs.
* Do not activate ticket.
* Do not edit source files.

Acceptance criteria:

* Command refuses backlog/ongoing/completed tickets.
* Command creates a plan artifact with required frontmatter.
* Child prompt forbids mutation and recursive spawning.
* Parent command checks `git status` before and after child run.
* Command fails if child mutates repository.
* Plan includes scope, likely files, verification, acceptance criteria mapping, risks, and stop conditions.

Likely files:

```text
.pi/extensions/ticket-workflow.ts
.pi/prompts/ticket-plan.md
docs/ticket-workflow-commands.md
tickets/.artifacts/plans/
```

Dependencies:

* Ticket 2.
* Ticket 3 helpful but not mandatory.
* Pi non-interactive command usage. Pi supports one-shot prompts via `pi -p`, plus JSON/RPC modes for integration. ([Pi][3])

Verification:

```text
/ticket-plan tickets/planned/<ticket>.md
cat tickets/.artifacts/plans/<ticket-id>.plan.md
git status --porcelain
```

---

### Ticket 5: Add verification brief command

Objective:

* Add `/ticket-verify` for the single active ongoing ticket.

Scope:

* Require exactly one ongoing ticket.
* Read ticket.
* Read latest non-stale plan if present.
* Inspect git diff.
* Run configured verification commands if documented.
* Optionally spawn read-only child reviewer.
* Write verification brief.
* Do not complete ticket.
* Do not commit.

Acceptance criteria:

* Command refuses zero or multiple ongoing tickets.
* Command records changed files.
* Command maps acceptance criteria to evidence.
* Command records verification commands and results.
* Command flags changed files outside expected plan.
* Command produces pass/fail/inconclusive verdict.
* Command does not move ticket or commit.

Likely files:

```text
.pi/extensions/ticket-workflow.ts
.pi/prompts/ticket-verify.md
docs/ticket-workflow-commands.md
tickets/.artifacts/verification/
```

Dependencies:

* Ticket 2.
* Ticket 4 if plan integration is required.

Verification:

```text
/ticket-verify
cat tickets/.artifacts/verification/<ticket-id>.verify.md
git diff --name-only
git status --porcelain
```

---

### Ticket 6: Add activation check command

Objective:

* Add `/ticket-activate-check <planned-ticket>`.

Scope:

* Validate planned ticket.
* Validate ongoing empty.
* Validate plan exists and is not stale, or report missing plan.
* Report exact manual move command.
* Do not move files.

Acceptance criteria:

* Passes only when ongoing is empty and ticket is planned.
* Fails when ongoing contains a ticket.
* Warns when plan missing or stale.
* Prints a clear human action.
* Does not mutate files.

Likely files:

```text
.pi/extensions/ticket-workflow.ts
docs/ticket-workflow-commands.md
```

Dependencies:

* Ticket 4.

Verification:

```text
/ticket-activate-check tickets/planned/<ticket>.md
```

---

### Ticket 7: Add completion brief command

Objective:

* Add `/ticket-completion-brief`.

Scope:

* Require exactly one ongoing ticket.
* Require verification brief or explicit human override.
* Summarize changed files, decisions, verification, and suggested commit message.
* Do not commit.
* Do not move ticket.

Acceptance criteria:

* Completion brief includes ticket ID.
* Completion brief includes suggested commit message.
* Completion brief lists changed files.
* Completion brief summarizes verification.
* Completion brief identifies missing completion requirements.
* No automatic commit or move occurs.

Likely files:

```text
.pi/extensions/ticket-workflow.ts
docs/ticket-workflow-commands.md
tickets/.artifacts/completion/
```

Dependencies:

* Ticket 5.

Verification:

```text
/ticket-completion-brief
cat tickets/.artifacts/completion/<ticket-id>.completion.md
```

---

### Ticket 8: Add workflow doctor

Objective:

* Add `/ticket-doctor` to audit workflow consistency.

Scope:

* Scan all ticket states.
* Detect multiple ongoing tickets.
* Detect stale artifacts.
* Detect planned tickets missing readiness or plan artifacts.
* Detect ongoing ticket missing plan.
* Detect completed tickets missing completion notes, if that becomes a convention.
* Do not mutate files.

Acceptance criteria:

* Doctor reports errors and warnings separately.
* Doctor detects stale artifacts using ticket hash.
* Doctor does not treat artifacts as authoritative.
* Doctor exits cleanly when no problems are found.

Likely files:

```text
.pi/extensions/ticket-workflow.ts
docs/ticket-workflow-commands.md
```

Dependencies:

* Tickets 2–7.

Verification:

```text
/ticket-doctor
```

---

## 9. Premortem

Assume this failed after a month. Likely causes:

### 1. Too much automation too early

Symptoms:

* tickets move without clear human memory of why;
* commits include unrelated changes;
* child sessions make edits;
* artifacts contradict ticket files;
* human starts distrusting the workflow.

Risk reducer:

* v1 commands are advisory and mostly read-only.
* state transitions stay manual.
* no auto-commit.

### 2. Artifacts become stale but still trusted

Symptoms:

* implementation follows an old plan;
* verification passes against old acceptance criteria;
* plans reference deleted files;
* orchestrator quotes briefs without checking ticket hash.

Risk reducer:

* every artifact includes ticket hash and git/diff hash.
* commands warn when stale.
* artifacts say advisory.

### 3. The command system becomes heavier than the tickets

Symptoms:

* more time spent maintaining `.pi/extensions/ticket-workflow.ts` than implementing LinuxFr features;
* many schemas nobody reads;
* every tiny ticket requires three artifacts.

Risk reducer:

* first ticket only adds `/ticket-status`.
* readiness/plan/verify artifacts are used when valuable, not as bureaucracy.
* no generic project-management model.

### 4. Child sessions produce verbose, weak advice

Symptoms:

* briefs are long but not actionable;
* every verdict is “usable with risks”;
* questions are vague;
* plans restate the ticket without inspecting code.

Risk reducer:

* fixed output schemas;
* concrete verdict enums;
* acceptance criteria mapping;
* required stop conditions;
* child prompts tell the agent what to inspect.

### 5. Scope creep enters through “helpful” implementation

Symptoms:

* active ticket says “add status command” but implementation adds readiness, plan, doctor, UI widgets, and commit automation;
* commit is no longer atomic.

Risk reducer:

* implementation plan includes out-of-scope section.
* verification checks changed files against expected files.
* orchestrator stops on unplanned files.

### 6. Pi integration details change or are misunderstood

Symptoms:

* commands work interactively but fail in non-interactive mode;
* project trust prevents extension loading;
* child runs do not load expected resources.

Risk reducer:

* start with extension commands that run in the main session.
* document project trust and non-interactive behavior.
* add child Pi only after deterministic commands work. Pi docs explicitly distinguish project trust behavior between interactive and non-interactive modes, so this should be tested rather than assumed. ([Pi][6])

---

## 10. Critique and alternatives

### Critique of this proposal

The proposal may be over-engineered in three places:

1. **Artifact schemas**

   * YAML frontmatter and hashes are useful, but they add friction.
   * For a one-person repo, plain Markdown may be enough at first.

2. **Child Pi sessions**

   * They sound attractive, but they introduce process complexity.
   * The first two commands should not use them.

3. **Many commands**

   * A full command suite risks becoming a parallel workflow language.
   * The actual MVP should start with four commands, not eight.

The proposal may be too weak in two places:

1. **No automatic state transitions**

   * Manual `mv` commands are safe but repetitive.
   * Once the workflow is stable, guarded commands could move files after explicit confirmation.

2. **No write-capable child implementation**

   * This leaves implementation burden in the main session.
   * Later, a sandboxed write-capable child could be useful for tiny isolated edits.

### Simpler alternative

Use no extension at first.

Create only:

```text
.pi/prompts/ticket-readiness.md
.pi/prompts/ticket-plan.md
.pi/prompts/ticket-verify.md
docs/ticket-workflow.md
```

The orchestrator manually invokes prompt templates and writes artifacts.

Pros:

* extremely small;
* no TypeScript extension work;
* immediate standardization.

Cons:

* no deterministic invariant checks;
* no one-ongoing enforcement;
* no stale hash detection;
* still relies on the main agent remembering too much.

This is acceptable only if extension work would distract from the real LinuxFr MVP.

### More ambitious alternative

Build a full `ticket` extension with:

* slash commands;
* TUI ticket picker;
* autocomplete for ticket IDs;
* read-only child Pi through RPC;
* protected-path enforcement;
* artifact validation;
* explicit human confirmation dialogs;
* optional safe state transitions;
* Git diff scope gate;
* commit message generator;
* session naming per ticket.

Pros:

* excellent UX;
* less repetitive speech-to-text;
* stronger guardrails;
* reusable across Pi repositories.

Cons:

* now you are building a workflow product;
* higher chance of debugging the harness instead of shipping LinuxFr features;
* likely too much for a small MVP.

The right path is between the two: **one extension, deterministic status first, advisory child sessions later**.

---

## 11. Agent behavior recommendations

### As the orchestrator Pi session

I would use the commands like this:

1. Start every work session with:

```text
/ticket-status
```

2. When the human points to a backlog idea:

```text
/ticket-readiness tickets/backlog/<ticket>.md
```

Then I would summarize the verdict and ask for a human decision only if the next step changes state or intent.

3. Before implementation:

```text
/ticket-plan tickets/planned/<ticket>.md
```

Then I would keep the plan visible as a scope contract.

4. During implementation:

* edit only for the active ticket;
* check diffs frequently;
* stop when a change exceeds scope;
* avoid opportunistic cleanup.

5. Before completion:

```text
/ticket-verify
```

Then I would compare:

* ticket acceptance criteria;
* plan;
* actual diff;
* test output;
* verification brief.

6. For completion, I would prepare a concise commit message and completion note, but leave commit and move-to-completed as human-approved actions.

### As a child Pi session

I would constrain myself hard:

* one task only;
* read-only;
* no implementation;
* no ticket moves;
* no commits;
* no recursive commands;
* inspect only relevant files;
* output exactly the requested Markdown schema;
* use verdict enums;
* ask concrete questions;
* state uncertainty directly.

A child session should behave less like a developer and more like a careful reviewer.

### Information that would make agents fast, reliable, and useful

Add these to ticket files consistently:

````markdown
# Ticket: <id> <title>

## Objective

...

## Scope

### In Scope

...

### Out of Scope

...

## Acceptance Criteria

- [ ] ...
- [ ] ...

## Dependencies

- None
or
- ...

## Expected Artifacts

- ...

## Verification

```text
...
````

## Notes

...

````

Add this to workflow docs:

```markdown
## Ticket State Rules

- The ticket directory is authoritative.
- Only one ongoing ticket is allowed.
- Artifacts under tickets/.artifacts are advisory.
- Human approval is required for state transitions.
- One ticket should normally map to one focused commit.
````

Add this to implementation plans:

```markdown
## Stop Conditions

Stop if:
- a dependency is missing;
- the implementation requires unrelated cleanup;
- changed files exceed the expected file list;
- acceptance criteria need reinterpretation;
- verification cannot be run.
```

Final opinion: **do not start with sub-agents**. Start with deterministic command support. Then add read-only child sessions for planning and verification. The first real win is not “AI delegation”; it is making the existing file workflow inspectable, repeatable, and hard to accidentally violate.

[1]: https://pi.dev/docs/latest/extensions "Extensions · Docs · Pi"
[2]: https://pi.dev/docs/latest/skills "Skills · Docs · Pi"
[3]: https://pi.dev/docs/latest/quickstart "Quickstart · Docs · Pi"
[4]: https://pi.dev/docs/latest/rpc "RPC Mode · Docs · Pi"
[5]: https://pi.dev/docs/latest/sdk "SDK · Docs · Pi"
[6]: https://pi.dev/docs/latest/settings "Settings · Docs · Pi"
