Here is the proposed architecture and design for the Pi-native ticket workflow orchestration system.

### 1. Executive Recommendation

To respect the repository's philosophy of minimal, inspectable, and human-directed workflows, we must optimize the *analysis* and *planning* phases while leaving *execution* and *state mutations* strictly in human hands (or human-approved main session actions).

* **Build first:** Read-only advisory commands (`ticket-plan` and `ticket-verify`). These yield the highest ROI by offloading context-heavy context gathering and reasoning to child sessions without risking project corruption.
* **Remain manual:** The actual code implementation, Git operations (staging/committing), and conflict resolution. The main orchestrator Pi session handles these under direct human supervision.
* **Do not automate yet:** Automated state transitions triggered by child sessions. A child session should never move a file from `planned/` to `ongoing/` on its own. State transitions must remain explicit commands invoked by the human via the orchestrator.

### 2. Workflow Architecture

**Recommendation: TypeScript Extension Commands executing CLI Child Processes.**

The main orchestrator Pi session will load a local TypeScript extension (e.g., `extensions/ticket-workflow/`). This extension defines custom slash-commands or tool calls. When an advisory task is needed, the extension spawns a child Pi session via a standard Node `child_process.exec()` calling the Pi CLI (e.g., `pi run --read-only --prompt-file ...`).

**Why this path?**

* **Isolation:** The CLI boundary enforces strict `--read-only` flags on child sessions at the OS level, eliminating accidental writes.
* **Context Management:** Child sessions start with a blank context window. They only load what is strictly necessary to plan or verify a specific ticket, preventing context contamination in the main orchestrator session.
* **Inspectability:** The CLI invocation and its resulting Markdown artifact are completely transparent to the human.

*Alternatives considered:*

* *Prompt-template-only:* Too weak. Pollutes the main session's context window with heavy planning tokens.
* *SDK / JSON mode:* Viable, but slightly more opaque than a standard CLI sub-process that mimics how a human would run a background Pi task.
* *RPC mode:* Over-engineered for a simple single-developer workflow.

### 3. Command Design

I propose a lifecycle of four explicit commands added to the main Pi orchestrator via a local extension.

#### `ticket-assess <ticket-id>`

* **Purpose:** Evaluates a ticket in `backlog/` for readiness or proposes splits.
* **Input arguments:** Ticket ID.
* **Preconditions:** Ticket must exist in `backlog/`.
* **Permissions:** Spawns a read-only child Pi.
* **Expected artifact:** `tickets/artifacts/<id>-assessment.md`.
* **Reports to orchestrator:** Summary of missing acceptance criteria or a "Ready" boolean.
* **Failure modes:** Ticket is empty; child session hallucinates dependencies.

#### `ticket-plan <ticket-id>`

* **Purpose:** Creates a step-by-step implementation plan for a ticket in `planned/`.
* **Input arguments:** Ticket ID.
* **Preconditions:** Ticket must exist in `planned/`.
* **Permissions:** Spawns a read-only child Pi.
* **Expected artifact:** `tickets/artifacts/<id>-plan.md`.
* **Reports to orchestrator:** Path to the generated plan and a brief summary of touched files.
* **Failure modes:** Plan contradicts existing architecture; plan is too generic.

#### `ticket-activate <ticket-id>`

* **Purpose:** Safely transitions a ticket to active status.
* **Input arguments:** Ticket ID.
* **Preconditions:** `ongoing/` must be entirely empty. Ticket must exist in `planned/`.
* **Permissions:** Main session execution (No child Pi). Write permission to filesystem (moves file).
* **Expected artifact:** Ticket file moved to `ongoing/<id>.md`.
* **Reports to orchestrator:** "Ticket  is now active. Implement according to the plan."
* **Failure modes:** `ongoing/` is not empty (command aborts).

#### `ticket-verify <ticket-id>`

* **Purpose:** Checks the current git diff against the ticket and plan.
* **Input arguments:** Ticket ID.
* **Preconditions:** Ticket must be in `ongoing/`.
* **Permissions:** Spawns a read-only child Pi with access to `git diff`.
* **Expected artifact:** `tickets/artifacts/<id>-verification.md`.
* **Reports to orchestrator:** Pass/Fail status and list of missed acceptance criteria.
* **Failure modes:** Diff is too large for child context; false positives on scope creep.

*(Note: Moving from `ongoing/` to `completed/` remains a manual git commit and file move to ensure atomic human intent).*

### 4. Artifact Design

Advisory artifacts should live in `tickets/artifacts/`. They are ephemeral, tracked in Git, but strictly advisory. The ticket file in `tickets/{state}/` remains the sole source of truth.

To avoid trusting stale artifacts after a ticket is updated, every generated artifact must include frontmatter with an MD5 hash of the ticket content at the time of generation.

**Schema Example: `<id>-plan.md**`

```markdown
---
ticket_id: feature-123
ticket_hash: a1b2c3d4e5f6...
type: implementation-plan
status: advisory
---

## Objective Alignment
(Brief statement confirming understanding of the goal)

## Scope Boundaries
- **In Scope:** (List files/functions)
- **Out of Scope:** (Explicitly list what NOT to touch)

## Implementation Steps
1. (Step 1)
2. (Step 2)

## Verification Strategy
(How to test this once done)

```

The orchestrator extension can easily compute the hash of the current ticket and compare it to `ticket_hash`. If they mismatch, the orchestrator warns: "The ticket has changed since this plan was generated. Run ticket-plan again."

### 5. Guardrails and Safety

* **Preventing accidental mutations:** Child sessions are spawned using `pi run --read-only`. They literally lack the filesystem write tools.
* **Preventing recursive spawning:** The custom TypeScript extension providing these commands is *not* loaded into the child sessions. The child has no `ticket-*` commands available.
* **Enforcing one `ongoing/` ticket:** The `ticket-activate` command uses synchronous Node `fs.readdirSync('tickets/ongoing')`. If `.length > 0`, it throws a hard error and refuses to move the file.
* **Preventing scope creep:** The `ticket-verify` prompt specifically instructs the child Pi to flag any changed files in the `git diff` that were not mentioned in the ticket's scope.
* **Handling failed child runs:** If the child CLI exits with a non-zero code, or fails to write the valid Markdown artifact, the orchestrator reports: "Advisory task failed. Proceed manually or retry."

### 6. Child-Session Prompt Design

Child sessions need highly constrained system prompts. Context should be passed via CLI arguments or injected into a temporary prompt file.

**Pattern for Verification Child Session:**

```text
You are a strict, read-only QA auditor.
Your job is to verify an implementation against its ticket.

CONTEXT:
Ticket Content:
{TICKET_CONTENT}

Implementation Plan:
{PLAN_CONTENT}

Current Git Diff:
{GIT_DIFF}

INSTRUCTIONS:
1. Compare the diff against the ticket's Acceptance Criteria.
2. Identify any files modified that seem unrelated to the ticket objective (Scope Creep).
3. Output exactly ONE Markdown document matching the Verification Schema. Do not output conversational filler.

```

* **Embedded context:** The ticket text, the plan text, and the git diff are injected directly into the prompt to save the child from having to navigate the filesystem.
* **Output structure:** Strict Markdown with predefined headings.

### 7. Human-in-the-loop Checkpoints

* **Never automated:** The transition from `backlog/` to `planned/` (requires human judgment on prioritization).
* **Never automated:** The final `git commit` and transition to `completed/`.
* **Explicit approval:** The human must read the generated `<id>-plan.md` and explicitly say "Looks good, implement this" to the orchestrator.
* **Surfacing questions:** If `ticket-assess` determines a backlog ticket is too vague, its artifact ends with a "Questions for the Human" section. The orchestrator reads this and asks the human to update the ticket file.

### 8. Incremental Implementation Plan

**Ticket 1: Artifact Infrastructure & Read-Only Constraints**

* **Objective:** Set up the `tickets/artifacts/` directory and ensure we can spawn isolated, read-only Pi sessions from a TS script.
* **Scope:** Create a basic Node script that takes a prompt, spawns `pi run --read-only`, and saves the output.
* **Acceptance Criteria:** Script successfully captures Pi output; script fails gracefully if Pi tries to write a file.
* **Likely Files:** `scripts/spawn-advisory-pi.ts`

**Ticket 2: Assessment and Planning Commands**

* **Objective:** Implement `ticket-assess` and `ticket-plan` logic.
* **Scope:** Write the prompt templates for assessment and planning. Implement the artifact frontmatter generation (with hashing).
* **Acceptance Criteria:** Running the command on a planned ticket produces a formatted `<id>-plan.md` with a valid hash.
* **Likely Files:** `extensions/ticket-workflow/index.ts`, `extensions/ticket-workflow/prompts.ts`.

**Ticket 3: Orchestration and State Commands**

* **Objective:** Implement `ticket-activate` and `ticket-verify`.
* **Scope:** Add filesystem checks for the `ongoing/` directory constraint. Add git diff extraction for the verification child session.
* **Acceptance Criteria:** `ticket-activate` fails if `ongoing/` is full. `ticket-verify` accurately flags a missed requirement based on a mock diff.
* **Likely Files:** `extensions/ticket-workflow/index.ts`, `extensions/ticket-workflow/git-utils.ts`.

### 9. Premortem

* **What went wrong:** The workflow became too noisy. The child sessions generated 800-word plans for 10-line code changes, causing the human to stop reading the artifacts, ultimately making the system a slow, ignored ritual.
* **Early warning signs:** The human frequently says to the orchestrator: "Ignore the plan, just do X." Artifacts accumulate without being read.
* **Design choices to reduce risk:** Enforce extreme brevity in the child prompts ("Use bullet points. Max 50 words per section. Omit boilerplate."). Allow the human to bypass the planning step for trivial tickets.

### 10. Critique and Alternatives

* **Critique of this proposal:** Booting a new CLI Pi session for every command might be slow (2-5 seconds overhead depending on the environment). The use of MD5 hashing might feel a bit heavy-handed for local development.
* **Over-engineered:** The artifact frontmatter hashing. Relying on git timestamps might be simpler.
* **Too weak:** The system doesn't natively handle ticket *splitting*. It only suggests splits but leaves the human to manually create the new files.
* **Simpler Alternative (Prompt-only):** No child sessions. Just standard markdown templates (`docs/plan-template.md`). The human pastes the template into the chat, and the main Pi fills it out. *Drawback: Pollutes context window.*
* **Ambitious Alternative (Background Daemon):** A persistent background Pi agent that monitors the `tickets/` directory using file watchers. When a file drops into `planned/`, it silently generates the plan in the background so it's instantly ready when the human wants it.

### 11. Agent Behavior Recommendations

* **As the Orchestrator AI:** I would treat the file system as the absolute source of truth. If the human asks "What should we do next?", I will list `planned/`. If the human asks me to implement something, I will immediately check if `tickets/artifacts/<id>-plan.md` exists and use it as my strict blueprint. If it doesn't exist, I will advise the human to run `ticket-plan` first.
* **As the Child AI:** I would act like a ruthless, pedantic technical editor. I would not write code. I would write constraints. My goal is to make the orchestrator's job boring and predictable by removing ambiguity before code is ever written.
* **Information needed for speed:** I need the exact current state of the repository architecture. Passing a concise `.pi-context` or `ARCHITECTURE.md` file into my prompt alongside the ticket will prevent me from recommending implementation plans that violate repository patterns.