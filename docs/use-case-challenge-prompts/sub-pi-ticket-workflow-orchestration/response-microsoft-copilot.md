### 1. Executive recommendation

**What should be built first?**

Build a **minimal Pi-native command layer** around three core activities:

- **`pi-ticket:readiness`** — analyze a backlog ticket for readiness and produce a readiness brief.
- **`pi-ticket:plan`** — generate an implementation plan for a planned ticket.
- **`pi-ticket:verify`** — verify an implemented ticket against acceptance criteria and produce a verification brief.

All three should:

- Run as **read-only child sessions**.
- Emit **Markdown artifacts** under a predictable directory.
- Be invoked by a **single orchestrator session** via simple extension commands.

**What should remain manual?**

- Moving ticket files between `backlog/`, `planned/`, `ongoing/`, `completed/`, `rejected/`.
- Deciding when to split or reject tickets.
- Deciding when to start implementation and when to commit.
- Writing commit messages and actually running `git commit` (though the system can suggest a message).

**What should explicitly not be automated yet?**

- Any **write-capable child session** that edits code or tickets.
- Automatic ticket state transitions (no auto-move between directories).
- Automatic splitting of tickets into multiple files.
- Automatic `git` operations (staging, committing, rebasing, etc.).
- Recursive orchestration (child sessions spawning further children).

Start with **advisory-only automation** that reduces repeated thinking and context setup, while keeping all state transitions and code changes human-driven.

---

### 2. Workflow architecture

#### Relationship between orchestrator and child sessions

- **Orchestrator session**
  - Long-lived, human-facing.
  - Knows the ticket workflow and command semantics.
  - Invokes **Pi extension commands** that:
    - Optionally spawn **read-only child Pi sessions**.
    - Collect their Markdown outputs.
    - Present summaries and questions to the human.
  - Never edits code or tickets automatically; it may propose edits, but the human executes them.

- **Child sessions**
  - Short-lived, task-specific.
  - Run with **read-only access** to the repo (except writing their own artifact file via the extension).
  - Receive a **tight prompt**: ticket path, workflow rules, and expected output schema.
  - Produce a **single Markdown artifact** and exit.

#### Comparison of approaches

- **CLI child process**  
  - Pros: Simple to reason about, easy to script.  
  - Cons: Harder to enforce read-only behavior; more shell glue; less Pi-native.

- **JSON mode**  
  - Pros: Structured outputs; good for machine parsing.  
  - Cons: You still need a wrapper to write artifacts; more brittle if prompts drift.

- **RPC mode / SDK**  
  - Pros: Strong control, can enforce read-only tools, good for future expansion.  
  - Cons: More setup, more code, heavier than needed for a small repo.

- **Extension commands (Pi-native)**  
  - Pros: Natural fit; can define commands that:
    - Restrict tools (read-only).
    - Write artifacts in controlled locations.
    - Encapsulate prompts and behavior.
  - Cons: Requires some TypeScript extension work, but that’s aligned with Pi’s design.

- **Prompt-template-only workflow**  
  - Pros: Zero code; just conventions.  
  - Cons: Repetition remains high; no durable command semantics; easy to drift.

#### Recommended first implementation

Use **Pi extension commands** as the primary mechanism:

- They are **Pi-native**, minimal, and inspectable.
- They can **enforce read-only child sessions** by restricting tools.
- They can **centralize prompts and schemas** so you don’t repeat them verbally.
- They keep the orchestrator session simple: “run command X on ticket Y”.

If needed later, you can wrap these commands with CLI scripts, but the core should live as **Pi extensions**.

---

### 3. Command design

I’ll propose a small, opinionated set of commands. You can add more later, but this is a good minimal core.

#### 3.1 `pi-ticket:readiness`

- **Purpose:**  
  Analyze a `backlog/` ticket for readiness to move to `planned/`. Produce a **readiness brief**.

- **Input arguments:**  
  - **`ticketPath`**: relative path to the ticket file (e.g. `tickets/backlog/123-add-foo.md`).

- **Preconditions:**  
  - File exists under `tickets/backlog/`.
  - No assumptions about other tickets.

- **Read/write permissions:**  
  - **Read:** entire repo.  
  - **Write:** only to `tickets/meta/readiness/` (artifact file).

- **May spawn child Pi?**  
  - Yes: one **read-only child session** that:
    - Reads the ticket.
    - Optionally inspects related files.
    - Writes a readiness brief via the extension.

- **Expected artifact:**  
  - `tickets/meta/readiness/<ticket-id>.md` (schema in section 4).

- **Reports to orchestrator:**  
  - Path to the artifact.
  - A short summary: “Ready / Not ready / Ready with risks”.
  - List of **blocking questions** or missing details.

- **Failure modes:**  
  - Ticket missing or malformed → command returns an error summary.
  - Child session fails to produce valid Markdown → command marks artifact as invalid and reports to human.
  - If repo changed during analysis, the artifact notes “ticket content hash” so staleness can be detected.

---

#### 3.2 `pi-ticket:refine`

- **Purpose:**  
  Suggest refinements or splits for a `backlog/` ticket that is not ready.

- **Input arguments:**  
  - **`ticketPath`**: path to backlog ticket.

- **Preconditions:**  
  - Ticket exists.
  - Typically run after `pi-ticket:readiness` indicates “not ready” or “too broad”.

- **Read/write permissions:**  
  - **Read:** entire repo.  
  - **Write:** `tickets/meta/refinement/<ticket-id>.md` (advisory).

- **May spawn child Pi?**  
  - Yes: read-only child session.

- **Expected artifact:**  
  - Refinement brief with:
    - Suggested edits to the ticket.
    - Suggested splits into smaller tickets (with proposed filenames and titles).
    - Open questions for the human.

- **Reports to orchestrator:**  
  - Summary of suggested splits.
  - Key questions to resolve.

- **Failure modes:**  
  - Overly aggressive splitting → human ignores suggestions.
  - Ticket changed since analysis → artifact marked stale via hash.

---

#### 3.3 `pi-ticket:plan`

- **Purpose:**  
  For a `planned/` ticket, generate an **implementation plan** that a fresh Pi session can follow.

- **Input arguments:**  
  - **`ticketPath`**: path under `tickets/planned/`.

- **Preconditions:**  
  - Ticket exists in `planned/`.
  - Dependencies listed in the ticket (if any).

- **Read/write permissions:**  
  - **Read:** entire repo.  
  - **Write:** `tickets/meta/plans/<ticket-id>.md`.

- **May spawn child Pi?**  
  - Yes: read-only child session.

- **Expected artifact:**  
  - Implementation plan with:
    - Steps.
    - Expected files to touch.
    - Risks.
    - Verification strategy.

- **Reports to orchestrator:**  
  - Short summary of steps.
  - Risk level (low/medium/high).
  - Whether dependencies appear satisfied (advisory).

- **Failure modes:**  
  - Plan too broad or vague → human revises or re-runs.
  - Repo changes after plan → plan marked stale.

---

#### 3.4 `pi-ticket:activate`

- **Purpose:**  
  Assist the human in moving a ticket from `planned/` to `ongoing/` while enforcing the “only one ongoing” rule.

- **Input arguments:**  
  - **`ticketPath`**: path under `tickets/planned/`.

- **Preconditions:**  
  - `tickets/ongoing/` is empty (or human explicitly overrides).
  - Ticket has a plan artifact (optional but recommended).

- **Read/write permissions:**  
  - **Read:** `tickets/` and meta artifacts.  
  - **Write:** **none** by default (no automatic move).

- **May spawn child Pi?**  
  - No; this is a lightweight check.

- **Expected artifact:**  
  - Optional: log entry in `tickets/meta/logs/activation.md` (append-only).

- **Reports to orchestrator:**  
  - Whether `ongoing/` is empty.
  - Whether plan exists and is fresh.
  - A suggested shell command for the human to run, e.g.:  
    `mv tickets/planned/123-add-foo.md tickets/ongoing/`

- **Failure modes:**  
  - `ongoing/` not empty → command refuses to suggest activation.
  - Ticket missing → error.

---

#### 3.5 `pi-ticket:implement-scope-check`

- **Purpose:**  
  Before or during implementation, check that the proposed changes stay within ticket scope.

- **Input arguments:**  
  - **`ticketPath`**: path under `tickets/ongoing/`.  
  - **`diffContext`** (optional): a patch or list of files the human plans to change.

- **Preconditions:**  
  - Ticket exists in `ongoing/`.

- **Read/write permissions:**  
  - **Read:** repo, ticket, plan, `git diff` (via read-only command output).  
  - **Write:** `tickets/meta/scope/<ticket-id>.md`.

- **May spawn child Pi?**  
  - Yes: read-only child session.

- **Expected artifact:**  
  - Scope brief:
    - Files and changes that are clearly in scope.
    - Items that look out-of-scope.
    - Suggestions to split or defer.

- **Reports to orchestrator:**  
  - “Scope OK / borderline / exceeded”.
  - List of suspicious changes.

- **Failure modes:**  
  - Diff too large → child session returns “too broad” and suggests splitting.

---

#### 3.6 `pi-ticket:verify`

- **Purpose:**  
  After implementation, verify that acceptance criteria are met and produce a **verification brief**.

- **Input arguments:**  
  - **`ticketPath`**: path under `tickets/ongoing/`.  
  - Optional: `diffContext` or `commitHash` for focused inspection.

- **Preconditions:**  
  - Ticket exists in `ongoing/`.
  - Implementation is believed to be complete.

- **Read/write permissions:**  
  - **Read:** repo, tests, ticket, plan, `git diff` or commit.  
  - **Write:** `tickets/meta/verification/<ticket-id>.md`.

- **May spawn child Pi?**  
  - Yes: read-only child session.

- **Expected artifact:**  
  - Verification brief:
    - Checklist of acceptance criteria.
    - Evidence (tests run, manual checks).
    - Remaining concerns or regressions.

- **Reports to orchestrator:**  
  - “Pass / Partial / Fail”.
  - Suggested follow-up actions.

- **Failure modes:**  
  - Tests fail or cannot be run → brief records this; human decides.

---

#### 3.7 `pi-ticket:complete-check`

- **Purpose:**  
  Help the human decide whether to move a ticket from `ongoing/` to `completed/`.

- **Input arguments:**  
  - **`ticketPath`**: path under `tickets/ongoing/`.

- **Preconditions:**  
  - Ticket exists.
  - Verification brief exists (recommended).

- **Read/write permissions:**  
  - **Read:** tickets, meta artifacts, `git status`.  
  - **Write:** optional log in `tickets/meta/logs/completion.md`.

- **May spawn child Pi?**  
  - No; simple checks.

- **Expected artifact:**  
  - None required; optional log entry.

- **Reports to orchestrator:**  
  - Whether verification brief exists and is fresh.
  - Whether working tree is clean or only contains expected changes.
  - Suggested commit message including ticket ID.
  - Suggested shell commands:
    - `git commit -am "ticket-123: Add foo"`  
    - `mv tickets/ongoing/123-add-foo.md tickets/completed/`

- **Failure modes:**  
  - Working tree dirty with unrelated changes → warns human.

---

### 4. Artifact design

#### Where advisory artifacts should live

Use a **parallel meta tree**:

```text
tickets/
  backlog/
  planned/
  ongoing/
  completed/
  rejected/
  meta/
    readiness/
    refinement/
    plans/
    scope/
    verification/
    logs/
```

Each artifact is named by **ticket ID**, which you can derive from the filename (e.g. `123-add-foo.md` → `123-add-foo`).

#### Readiness brief schema

`tickets/meta/readiness/<ticket-id>.md`:

```markdown
---
ticket: tickets/backlog/123-add-foo.md
ticket_id: 123-add-foo
ticket_hash: "<sha256-of-file>"
status: ready | not_ready | ready_with_risks
created_at: 2026-06-24T14:30:00Z
pi_command: pi-ticket:readiness
---

## Summary

Short paragraph summarizing the ticket and its intent.

## Readiness assessment

- **Objective clarity:** clear / unclear
- **Scope:** narrow / broad / unclear
- **Acceptance criteria:** clear / missing / partial
- **Dependencies:** listed / missing / unclear
- **Verification strategy:** clear / missing / partial

## Blocking issues

- Bullet list of blocking questions or missing details.

## Non-blocking concerns

- Optional list of risks or ambiguities.

## Suggested next steps

- Concrete suggestions for refinement or confirmation.
```

#### Implementation plan schema

`tickets/meta/plans/<ticket-id>.md`:

```markdown
---
ticket: tickets/planned/123-add-foo.md
ticket_id: 123-add-foo
ticket_hash: "<sha256-of-file>"
status: draft | approved
created_at: 2026-06-24T15:00:00Z
pi_command: pi-ticket:plan
---

## Overview

Short description of the planned change.

## Assumptions

- List of assumptions about the environment, existing behavior, or constraints.

## Steps

1. **Step name:** description, including files to touch.
2. **Step name:** ...

## Files likely to change

- path/to/file1.ts
- path/to/file2.md

## Risks

- Potential pitfalls or regressions.

## Verification plan

- Tests to run.
- Manual checks.
- Observability/logging considerations.
```

The human can manually flip `status: draft` → `approved` after review.

#### Verification brief schema

`tickets/meta/verification/<ticket-id>.md`:

```markdown
---
ticket: tickets/ongoing/123-add-foo.md
ticket_id: 123-add-foo
ticket_hash: "<sha256-of-file>"
plan: tickets/meta/plans/123-add-foo.md
plan_hash: "<sha256-of-plan-file>"
status: pass | partial | fail
created_at: 2026-06-24T16:30:00Z
pi_command: pi-ticket:verify
---

## Summary

Short summary of verification outcome.

## Acceptance criteria checklist

- [x] Criterion 1
- [ ] Criterion 2
- [x] Criterion 3

## Evidence

- Commands run (e.g. `npm test`, `pytest`).
- Screenshots or logs (described, not embedded).

## Issues found

- Any regressions or incomplete behavior.

## Recommendations

- Whether to proceed to completion, or what to fix first.
```

#### Command logs (optional)

`tickets/meta/logs/activation.md` and `completion.md` can be simple append-only logs:

```markdown
## 2026-06-24T15:10:00Z

- **Command:** pi-ticket:activate
- **Ticket:** tickets/planned/123-add-foo.md
- **Ongoing empty:** yes
- **Plan present:** yes
- **Suggested action:** mv tickets/planned/123-add-foo.md tickets/ongoing/
- **Human decision:** accepted (manual note)
```

#### Advisory vs authoritative

- **Authoritative:**
  - Ticket files under `tickets/` and their directory location.
  - Git history and working tree.

- **Advisory:**
  - All artifacts under `tickets/meta/`.
  - Command logs.

Artifacts are **never the source of truth** for ticket state; they are just structured notes.

#### Avoiding stale artifacts

- Each artifact includes:
  - `ticket_hash` (hash of ticket content).
  - For verification, `plan_hash`.

The orchestrator commands:

- Recompute the current ticket hash.
- Compare with the artifact’s `ticket_hash`.
- If mismatch, mark artifact as **stale** and warn the human:
  - “Readiness brief is stale; ticket changed since analysis. Consider re-running `pi-ticket:readiness`.”

---

### 5. Guardrails and safety

#### Prevent child sessions from mutating the project

- All child sessions are invoked with:
  - **Read-only tool set** (no file writes, no shell commands that modify state).
- The only writes happen via the **extension command code**, which:
  - Writes artifacts to `tickets/meta/` only.
  - Never edits tickets or source files.

#### Prevent recursive command spawning

- Extension commands include a **flag** in the child prompt:  
  “You are a child Pi session. Do not invoke any project commands or spawn further sessions.”
- The orchestrator never exposes command invocation tools to child sessions.
- If Pi supports tool whitelisting, child sessions get only:
  - File read.
  - Maybe `git diff` read.
  - No “run command” or “invoke extension” tools.

#### Enforce only one ticket in `ongoing/`

- `pi-ticket:activate` and `pi-ticket:complete-check` always:
  - List files in `tickets/ongoing/`.
  - If more than one ticket is present, they:
    - Warn the human.
    - Refuse to suggest activation of another ticket.

You still **could** manually violate this rule, but the system will keep reminding you.

#### Prevent implementation from exceeding ticket scope

- Use `pi-ticket:implement-scope-check`:
  - Before committing, run it with `git diff` context.
  - It flags:
    - Unrelated files.
    - Large refactors.
    - Changes not mentioned in the ticket or plan.
- The orchestrator surfaces these warnings and suggests:
  - Splitting into a new ticket.
  - Deferring some changes.

#### Keep commits atomic

- `pi-ticket:complete-check`:
  - Checks `git status` for unrelated changes.
  - Suggests:
    - Staging only relevant files.
    - Or splitting changes into multiple commits.
  - Suggests a **single commit message** referencing the ticket ID.

#### Handle failed or partial child-session runs

- If a child session fails or produces invalid output:
  - The extension:
    - Writes a minimal artifact with `status: error`.
    - Includes the error message.
  - The orchestrator:
    - Surfaces the error.
    - Suggests re-running or simplifying the ticket.

No state transitions depend solely on child success; the human always decides.

---

### 6. Child-session prompt design

#### Prompt patterns

Each child session gets a **structured prompt** like:

> You are a read-only assistant working on repository `pi-linuxfr.org`.  
> You must not modify any files or run any commands that change state.  
> Your task: **[task description, e.g. readiness analysis]**  
>  
> **Ticket file:** `tickets/backlog/123-add-foo.md`  
>  
> **Workflow rules:**  
> - One ticket per atomic change.  
> - Tickets move between `backlog/`, `planned/`, `ongoing/`, `completed/`, `rejected/`.  
> - Artifacts under `tickets/meta/` are advisory only.  
>  
> **Output format:**  
> Produce a single Markdown document matching this schema:  
> [schema pasted here]  
>  
> Do not include any other commentary outside the schema.

#### What context is embedded directly?

- Ticket workflow rules (short version).
- The specific schema for the artifact.
- The ticket path and its contents (or a summary if large).
- Any relevant meta artifacts (e.g. existing plan for verification).

#### What should child sessions discover via read-only inspection?

- Existing code structure and relevant files.
- Existing tests.
- Existing meta artifacts (e.g. previous plans or verification briefs).
- `git diff` or commit contents (if provided via read-only command).

#### How structured should their output be?

- **Strictly structured**:
  - Must follow the Markdown schema exactly.
  - Use headings and frontmatter as specified.
- This makes it easy for the orchestrator to:
  - Parse key fields (status, hashes).
  - Summarize for the human.

---

### 7. Human-in-the-loop checkpoints

#### Where must the human explicitly approve?

- Moving tickets between directories:
  - `backlog/` → `planned/`
  - `planned/` → `ongoing/`
  - `ongoing/` → `completed/` or `rejected/`
- Approving implementation plans (`status: draft` → `approved`).
- Deciding whether scope violations are acceptable.
- Deciding whether verification is sufficient to complete.

#### Decisions the orchestrator should never make alone

- Creating or deleting ticket files.
- Splitting tickets into multiple new files.
- Running `git commit`, `git push`, or destructive commands.
- Overriding the “one ongoing ticket” rule.

#### Surfacing questions when a ticket is not ready

- `pi-ticket:readiness` and `pi-ticket:refine`:
  - Always include a **“Blocking issues”** section.
  - Orchestrator:
    - Summarizes these as a checklist.
    - Asks the human:
      - “Do you want to update the ticket now?”
      - “Should we split this into multiple tickets?”
  - No automatic changes; just clear questions.

---

### 8. Incremental implementation plan

Each item below is itself a ticket candidate.

#### Ticket 1: Add minimal meta directory and readiness command

- **Objective:**  
  Introduce `tickets/meta/` structure and implement `pi-ticket:readiness` as a Pi extension command.

- **Scope:**  
  - Create `tickets/meta/` and `tickets/meta/readiness/`.
  - Implement `pi-ticket:readiness` extension:
    - Read-only child session.
    - Read ticket.
    - Produce readiness brief per schema.
  - Add brief documentation to `README` or `docs/tickets.md`.

- **Acceptance criteria:**  
  - Running `pi-ticket:readiness tickets/backlog/123-add-foo.md` creates `tickets/meta/readiness/123-add-foo.md`.
  - Artifact includes `ticket_hash` and `status`.
  - Command does not modify any other files.
  - Documentation explains how to use it.

- **Likely files:**  
  - `pi.config.ts` or equivalent extension registration.
  - `src/extensions/pi-ticket-readiness.ts` (or similar).
  - `tickets/meta/` directories.
  - `docs/tickets.md`.

- **Dependencies:**  
  - Existing ticket workflow in place.

- **Verification:**  
  - Create a sample backlog ticket.
  - Run the command.
  - Inspect artifact for correctness and structure.

---

#### Ticket 2: Implement implementation plan command

- **Objective:**  
  Add `pi-ticket:plan` to generate implementation plans for planned tickets.

- **Scope:**  
  - Create `tickets/meta/plans/`.
  - Implement `pi-ticket:plan` extension:
    - Read-only child session.
    - Uses plan schema.
  - Update docs.

- **Acceptance criteria:**  
  - Running `pi-ticket:plan tickets/planned/123-add-foo.md` creates a plan artifact.
  - Artifact includes `ticket_hash` and `status: draft`.
  - No other files modified.

- **Likely files:**  
  - New extension file.
  - Docs update.

- **Dependencies:**  
  - Ticket 1 (meta structure and patterns).

- **Verification:**  
  - Use a real planned ticket.
  - Check that steps and files list are reasonable.

---

#### Ticket 3: Implement verification command

- **Objective:**  
  Add `pi-ticket:verify` to produce verification briefs.

- **Scope:**  
  - Create `tickets/meta/verification/`.
  - Implement `pi-ticket:verify`:
    - Read-only child session.
    - Uses verification schema.
  - Optionally read `git diff` or a commit hash.

- **Acceptance criteria:**  
  - Running `pi-ticket:verify tickets/ongoing/123-add-foo.md` creates a verification artifact.
  - Artifact includes acceptance criteria checklist and `status`.
  - No other files modified.

- **Likely files:**  
  - New extension file.
  - Docs update.

- **Dependencies:**  
  - Ticket 2 (plan schema) if you want to reference plan hashes.

- **Verification:**  
  - Implement a small change.
  - Run tests manually.
  - Run the command and confirm the brief reflects reality.

---

#### Ticket 4: Add activation and completion helper commands

- **Objective:**  
  Provide `pi-ticket:activate` and `pi-ticket:complete-check` to enforce one ongoing ticket and suggest commands.

- **Scope:**  
  - Implement both commands without child sessions.
  - Add `tickets/meta/logs/` and simple log append.
  - Enforce “only one ongoing” check.

- **Acceptance criteria:**  
  - `pi-ticket:activate` warns if `ongoing/` is not empty.
  - `pi-ticket:complete-check` warns if working tree has unrelated changes.
  - Both suggest shell commands but do not execute them.

- **Likely files:**  
  - Extension files.
  - Logs directory.
  - Docs update.

- **Dependencies:**  
  - Ticket 1 (meta structure).

- **Verification:**  
  - Simulate multiple ongoing tickets and confirm warnings.
  - Simulate dirty working tree and confirm warnings.

---

#### Ticket 5: Implement scope-check command

- **Objective:**  
  Add `pi-ticket:implement-scope-check` to flag out-of-scope changes.

- **Scope:**  
  - Create `tickets/meta/scope/`.
  - Implement command with read-only child session.
  - Use `git diff` or provided patch.

- **Acceptance criteria:**  
  - Command produces a scope brief.
  - Brief lists in-scope and out-of-scope changes.
  - No code modifications.

- **Likely files:**  
  - Extension file.
  - Docs update.

- **Dependencies:**  
  - Ticket 2 (plan) for better context.

- **Verification:**  
  - Make a change that clearly exceeds ticket scope.
  - Run command and confirm it flags the extra changes.

---

### 9. Premortem

#### If the system failed after a month, what likely went wrong?

- **Too much friction:**  
  Commands felt heavier than just talking to Pi directly; the developer stopped using them.
- **Schemas drifted:**  
  Child outputs didn’t match expected schemas; parsing and summaries broke.
- **Artifacts became stale:**  
  Tickets changed frequently; artifacts were often stale and ignored.
- **Overhead vs benefit mismatch:**  
  For small tickets, running commands felt like overkill.

#### Early warning signs

- Artifacts not being opened or referenced in recent commits.
- Tickets moving between directories without corresponding meta artifacts.
- The developer frequently bypassing commands and reverting to ad-hoc prompts.
- Increasing number of stale artifacts (hash mismatches) without re-runs.

#### Design choices that reduce risks

- **Keep commands optional and lightweight:**  
  They should feel like shortcuts, not obligations.
- **Make artifacts genuinely useful:**  
  For example, plans that are actually helpful to follow, not generic fluff.
- **Hash-based staleness detection:**  
  Clear signals when artifacts are outdated.
- **Small, focused commands:**  
  Each command does one thing; no monolithic “do everything” command.

---

### 10. Critique and alternatives

#### What may be over-engineered

- Multiple artifact types and directories (`readiness`, `refinement`, `scope`, etc.) might be more than you need initially.
- Hash tracking and status fields could be simplified at first.
- Logs for activation/completion might be unnecessary overhead.

#### What may be too weak

- No automation for moving tickets or committing might feel conservative once trust is built.
- No write-capable child sessions means you still manually edit tickets and code.

#### Simpler alternative

- **Single “ticket brief” command**:
  - One command `pi-ticket:brief` that:
    - Reads a ticket (any state).
    - Produces a single Markdown brief with:
      - Readiness assessment.
      - Plan.
      - Verification notes (if applicable).
  - No separate directories; just `tickets/meta/briefs/<ticket-id>.md`.
  - No activation/completion helpers.
- This reduces complexity but also reduces explicit lifecycle support.

#### More ambitious alternative

- **Semi-automated lifecycle manager**:
  - Commands that:
    - Move tickets between directories after human confirmation.
    - Create new tickets from split suggestions.
    - Stage and commit changes with generated messages.
  - Child sessions with **limited write** capabilities:
    - Can edit tickets and some docs under strict constraints.
  - Stronger integration with `git` (e.g. tagging commits with ticket IDs automatically).
- This increases power but risks losing the minimal, inspectable feel.

---

### 11. Agent behavior recommendations

#### As the AI in the orchestrator session

- **Use commands as structured tools**, not as black boxes:
  - When the human says “Is this backlog ticket ready?”, run `pi-ticket:readiness` and summarize the artifact.
  - When they say “Help me plan this”, run `pi-ticket:plan`.
- **Always show your work**:
  - Link to the artifact path.
  - Quote key sections (summary, blocking issues, steps).
- **Ask focused questions**:
  - “Do you want to move this ticket to `planned/` now?”
  - “Do you accept this risk, or should we split the ticket?”
- **Respect guardrails**:
  - Never move files or run `git` commands without explicit human request.
  - Never spawn child sessions directly; always go through the defined commands.

#### As the AI in a child session

- **Constrain yourself tightly**:
  - Treat the prompt schema as a contract.
  - Do not chat; just produce the requested Markdown.
  - Do not suggest actions that require write access; focus on analysis and structure.
- **Be concrete and specific**:
  - Name files.
  - Propose clear steps.
  - Highlight ambiguities explicitly.

#### Information that makes you fast, reliable, and useful

- **Ticket path and contents**.
- **Current state** (backlog/planned/ongoing).
- **Existing artifacts** (plan, readiness, verification) and their hashes.
- **Relevant diffs or commits** when checking scope or verification.
- **Short, stable workflow rules** embedded in prompts so you don’t have to rediscover them.

If you wire this up, you’ll still be the one steering—but the rituals become repeatable, inspectable, and much lighter on your brain.