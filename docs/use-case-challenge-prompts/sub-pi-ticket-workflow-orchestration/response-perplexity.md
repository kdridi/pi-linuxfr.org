## 1. Executive recommendation

**What should be built first:**  
Start with **three core extension commands** in the Pi repository: `ticket-readiness`, `ticket-plan`, and `ticket-verify`. These commands analyze backlog tickets, create implementation plans for planned tickets, and verify completed work against acceptance criteria. Each command spawns a **read-only child Pi session** that produces a durable Markdown artifact (readiness brief, implementation plan, or verification brief) under `tickets/artifacts/` .

**What should remain manual:**  
- **State transitions** (`backlog` → `planned`, `planned` → `ongoing`, `ongoing` → `completed`) must remain human-driven. The orchestrator never auto-moves tickets.
- **Ticket refinement/splitting decisions** require human judgment. Commands can propose splits but not execute them.
- **Commit creation** stays manual. Commands report what changed, but the human commits with the ticket ID.

**What should explicitly not be automated yet:**  
- **Auto-activation** of tickets (moving `planned` → `ongoing`) is too risky.
- **Scope enforcement** during implementation (preventing feature creep) requires human oversight.
- **Recursive child spawning** for complex workflows should wait until the base commands are stable.

***

## 2. Workflow architecture

### Orchestrator vs. child Pi relationship

The **main orchestrator Pi session** is the human-facing CLI entry point. It:
- Accepts command invocations from the human
- Spawns child Pi sessions for bounded analysis tasks
- Collects and presents Markdown artifacts
- Waits for human approval before state transitions
- Never mutates `tickets/` directly

**Child Pi sessions** are:
- Read-only by default (no file write permissions)
- Advisory (produce artifacts, not decisions)
- Bounded (single task, timeout enforced)
- Durable (output Markdown artifacts, not ephemeral stdout)

### Viable approaches comparison

| Approach | Pros | Cons | First-implement viability |
|----------|------|------|---------------------------|
| **CLI child process** | Simple, no new dependencies, Pi-native | Sequential, limited introspection | ✅ High – easiest to prototype |
| **JSON mode** | Structured output, parseable | Requires Pi JSON support, less human-readable | ⚠️ Medium – good for automation, bad for review |
| **RPC mode** | Bidirectional, real-time | Complex setup, network dependencies | ❌ Low – overkill for read-only tasks |
| **SDK** | Full programmatic control | Requires external SDK, breaks Pi-native feel | ❌ Low – adds complexity |
| **Extension commands** | Pi-native, reusable, versioned | Requires TypeScript setup | ✅ High – best for long-term |
| **Prompt-template-only** | Zero setup | No reusability, hard to maintain | ⚠️ Medium – too fragile |

### Recommended path for first implementation

**Use CLI child processes wrapped in TypeScript extension commands.**  
This combines:
- **Extension commands** for reusability and versioning (stored in `pi-extensions/`)
- **CLI child spawning** for simplicity (using `child_process.spawnSync`)
- **Read-only file inspection** via `fs.readFile` in child processes
- **Markdown artifact output** written by the orchestrator (not the child)

**Why:** Extension commands are Pi-native and reusable. CLI spawning avoids RPC/SDK complexity. Read-only children prevent accidental mutations. Markdown artifacts are human-readable for review.

***

## 3. Command design

### Command lifecycle

All commands follow this pattern:
1. Human invokes command: `pi ticket-readiness tickets/backlog/T001.md`
2. Orchestrator validates preconditions
3. Orchestrator spawns read-only child Pi with bounded prompt
4. Child Pi reads ticket + workflow docs, outputs JSON analysis
5. Orchestrator transforms JSON → Markdown artifact
6. Orchestrator writes artifact to `tickets/artifacts/`
7. Orchestrator presents artifact + prompts for human approval
8. Human decides: proceed, refine, or reject

### Proposed commands

#### `ticket-readiness`

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Analyze if a backlog ticket is ready for `planned/` |
| **Input arguments** | `ticket-path` (e.g., `tickets/backlog/T001.md`) |
| **Preconditions** | Ticket exists in `backlog/`; `ongoing/` is empty or irrelevant |
| **Read/write permissions** | Read-only (reads ticket, workflow docs) |
| **Spawns child Pi?** | Yes (read-only advisory child) |
| **Expected artifact** | `tickets/artifacts/readiness-T001.md` (readiness brief) |
| **Reports to orchestrator** | JSON: `{ready: bool, missing: [criteria], suggestions: [text]}` |
| **Failure modes** | Ticket not found; child timeout; missing acceptance criteria in ticket |

#### `ticket-plan`

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Create implementation plan for a `planned/` ticket |
| **Input arguments** | `ticket-path` (e.g., `tickets/planned/T002.md`) |
| **Preconditions** | Ticket exists in `planned/`; `ongoing/` is empty; dependencies resolved |
| **Read/write permissions** | Read-only (reads ticket, codebase, docs) |
| **Spawns child Pi?** | Yes (read-only advisory child) |
| **Expected artifact** | `tickets/artifacts/plan-T002.md` (implementation plan) |
| **Reports to orchestrator** | JSON: `{steps: [{desc, files}], estimated: str, risks: [text]}` |
| **Failure modes** | Ticket not in `planned/`; dependencies missing; child timeout |

#### `ticket-verify`

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Verify implementation matches ticket + plan |
| **Input arguments** | `ticket-path` (e.g., `tickets/ongoing/T002.md`); `commit-hash` (optional) |
| **Preconditions** | Ticket in `ongoing/` or `completed/`; implementation done; commit exists (if provided) |
| **Read/write permissions** | Read-only (reads ticket, plan, changed files, git diff) |
| **Spawns child Pi?** | Yes (read-only advisory child) |
| **Expected artifact** | `tickets/artifacts/verify-T002.md` (verification brief) |
| **Reports to orchestrator** | JSON: `{passed: bool, failures: [{criteria, status}], evidence: [text]}` |
| **Failure modes** | No implementation; commit missing; acceptance criteria unmet; child timeout |

#### `ticket-activate` (human-guarded)

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Move ticket from `planned/` to `ongoing/` (human approval required) |
| **Input arguments** | `ticket-path` |
| **Preconditions** | Ticket in `planned/`; `ongoing/` empty; readiness brief exists; plan exists |
| **Read/write permissions** | **Write** (moves ticket file) – but requires human confirmation |
| **Spawns child Pi?** | No (orchestrator-only) |
| **Expected artifact** | `tickets/artifacts/activate-T002.md` (activation log) |
| **Reports to orchestrator** | Success/failure message |
| **Failure modes** | `ongoing/` not empty; plan missing; human declines |

#### `ticket-complete` (human-guarded)

| Attribute | Specification |
|-----------|---------------|
| **Purpose** | Move ticket from `ongoing/` to `completed/` (human approval required) |
| **Input arguments** | `ticket-path`; `commit-hash` |
| **Preconditions** | Ticket in `ongoing/`; implementation done; commit exists; verification passed |
| **Read/write permissions** | **Write** (moves ticket file) – but requires human confirmation |
| **Spawns child Pi?** | No (orchestrator-only) |
| **Expected artifact** | `tickets/artifacts/complete-T002.md` (completion log) |
| **Reports to orchestrator** | Success/failure message |
| **Failure modes** | Commit missing; verification failed; human declines |

***

## 4. Artifact design

### Artifact location

Advisory artifacts live under:
```
tickets/artifacts/
  readiness-T001.md
  plan-T002.md
  verify-T002.md
  activate-T002.md
  complete-T002.md
  command-log-2026-06-24.md
```

### Markdown/frontmatter schemas

#### Readiness brief (`readiness-<ID>.md`)

```markdown
---
ticket_id: T001
ticket_path: tickets/backlog/T001.md
created_at: 2026-06-24T14:00:00Z
command: ticket-readiness
status: ready | not_ready | needs_refinement
---

# Readiness Assessment for {{T001}}

## Summary
{{Human-readable summary: "Ticket is ready for planned/" or "Missing acceptance criteria"}}

## Missing Criteria
- {{criterion_1}}: {{missing_detail}}
- {{criterion_2}}: {{missing_detail}}

## Suggestions
1. {{suggestion_1}}
2. {{suggestion_2}}

## Decision
- **Recommendation**: {{ready/not_ready}}
- **Human action required**: {{refine ticket / proceed to planned / reject}}
```

#### Implementation plan (`plan-<ID>.md`)

```markdown
---
ticket_id: T002
ticket_path: tickets/planned/T002.md
created_at: 2026-06-24T14:30:00Z
command: ticket-plan
depends_on: [readiness-T001.md]
estimated_duration: {{2h | 1d | 3d}}
risks: [{{risk_1}}, {{risk_2}}]
---

# Implementation Plan for {{T002}}

## Overview
{{Brief description of what will be built}}

## Steps
1. **Step 1**: {{desc}}
   - Files: `{{src/file.ts}}`, `{{test/file.test.ts}}`
   - Expected change: {{add function / modify config}}
2. **Step 2**: {{desc}}
   - Files: `{{config.yaml}}`
   - Expected change: {{update setting}}

## Estimated Duration
{{2h | 1d | 3d}}

## Risks
- {{risk_1}}: {{mitigation}}
- {{risk_2}}: {{mitigation}}

## Decision
- **Ready to implement?**: {{yes/no}}
- **Human action required**: {{activate ticket / refine plan / reject}}
```

#### Verification brief (`verify-<ID>.md`)

```markdown
---
ticket_id: T002
ticket_path: tickets/ongoing/T002.md
created_at: 2026-06-24T16:00:00Z
command: ticket-verify
commit_hash: {{abc123}}
depends_on: [plan-T002.md]
status: passed | failed | partial
---

# Verification Brief for {{T002}}

## Overview
{{Brief summary: "Implementation matches plan" or "2 criteria unmet"}}

## Acceptance Criteria Check
| Criteria | Status | Evidence |
|----------|--------|----------|
| {{criteria_1}} | ✅ passed | {{file change / test output}} |
| {{criteria_2}} | ❌ failed | {{missing function}} |

## Failures
- {{criteria_2}}: {{detail}}

## Evidence
- {{commit diff snippet}}
- {{test run output}}

## Decision
- **Verification passed?**: {{yes/no}}
- **Human action required**: {{complete ticket / fix issues / reject}}
```

#### Command log (`command-log-<DATE>.md`)

```markdown
---
date: 2026-06-24
commands_run: [ticket-readiness, ticket-plan, ticket-verify]
---

# Command Log for {{2026-06-24}}

## ticket-readiness T001
- **Time**: 14:00
- **Result**: ready
- **Artifact**: readiness-T001.md

## ticket-plan T002
- **Time**: 14:30
- **Result**: success
- **Artifact**: plan-T002.md

## ticket-verify T002
- **Time**: 16:00
- **Result**: passed
- **Artifact**: verify-T002.md
```

### Advisory vs. authoritative artifacts

| Artifact type | Advisory? | Authoritative source |
|---------------|-----------|----------------------|
| Readiness brief | ✅ Yes | Ticket file in `backlog/` or `planned/` |
| Implementation plan | ✅ Yes | Ticket file in `planned/` |
| Verification brief | ✅ Yes | Ticket file + commit |
| Activation log | ✅ Yes | Ticket file in `ongoing/` |
| Completion log | ✅ Yes | Ticket file in `completed/` |
| Command log | ✅ Yes | Git history + ticket state |

**Authoritative sources:**
- Ticket state: `tickets/{backlog,planned,ongoing,completed,rejected}/<ID>.md`
- Implementation: Git commits with ticket ID
- Workflow rules: `tickets/WORKFLOW.md` (if exists) or inline docs

### Avoiding stale artifact trust

**Strategy:** Embed `ticket_path` and `created_at` in artifact frontmatter. Before using an artifact:
1. Check if ticket file exists at `ticket_path`
2. Compare artifact `created_at` with ticket last-modified (if git-tracked)
3. If ticket changed after artifact creation, **regenerate artifact**

**Orchestrator check:** Before `ticket-activate`, verify `plan-<ID>.md` exists and `ticket_path` matches current ticket location. If mismatch, refuse activation and prompt for regeneration.

***

## 5. Guardrails and safety

### Prevent accidental child mutations

**Strategy:** Spawn child Pi with **read-only file permissions**:
```typescript
// In extension command
const child = spawnSync('pi', [
  '--json',
  '--allow-write=false',  // Read-only mode
  '--prompt', childPrompt
], { encoding: 'utf8' });
```

Child Pi cannot write to `tickets/`, `src/`, or config files. Only stdout (JSON) is returned.

### Prevent recursive command spawning

**Strategy:** Add `SPAWN_DEPTH=0` to child prompt context:
```
You are a read-only child Pi session.
SPAWN_DEPTH: 0 (you CANNOT spawn child sessions)
Task: Analyze ticket T001 and output JSON readiness assessment.
```

Orchestrator enforces: if `SPAWN_DEPTH > 0` in child prompt, reject with error.

### Enforce single ticket in `ongoing/`

**Strategy:** Before `ticket-activate`:
```typescript
const ongoing = fs.readdirSync('tickets/ongoing/');
if (ongoing.length > 0) {
  throw new Error(`ongoing/ is not empty: ${ongoing.join(', ')}`);
}
```

Orchestrator refuses activation until human clears `ongoing/`.

### Prevent scope creep during implementation

**Strategy:** This is **not automated**. Instead:
- Implementation plan (`plan-<ID>.md`) lists exact files/steps
- Human compares implementation to plan before `ticket-complete`
- `ticket-verify` checks if changed files match plan's `files:` list
- If unexpected files changed, verification fails with "scope creep" warning

**Human role:** Human decides if scope creep is acceptable before completing ticket.

### Keep commits atomic

**Strategy:** Enforce via checklist in `ticket-complete`:
1. Verify only files from plan's `files:` list are in commit
2. Verify commit message includes ticket ID: `feat: T002 - add function X`
3. Verify no unrelated changes (config updates, whitespace fixes)

Orchestrator reports: "Commit contains unexpected files: `config.yaml`" → human must fix or accept.

### Handle failed/partial child runs

**Strategy:**
- If child timeout/error: orchestrator retries once, then fails with "child session failed"
- If child outputs invalid JSON: orchestrator rejects with "malformed child output"
- If verification fails partially: artifact shows `status: partial` and lists failures
- Human decides: fix issues, accept partial, or reject ticket

**No auto-recovery:** Orchestrator never auto-retries indefinitely. Human must intervene.

***

## 6. Child-session prompt design

### Prompt patterns for child Pi

**Template (for `ticket-readiness` child):**
```
You are a read-only child Pi session analyzing ticket readiness.
SPAWN_DEPTH: 0 (you CANNOT spawn child sessions)
ALLOW_WRITE: false (you CANNOT mutate files)

Task:
Analyze whether {{ticket_path}} is ready to move from backlog/ to planned/.

Context embedded in prompt:
- Ticket ID: {{ticket_id}}
- Expected acceptance criteria: {{criteria_from_ticket}}
- Workflow requirement: "Before backlog→planned, objective, scope, acceptance criteria, dependencies, expected artifacts, and verification must be clear."

Read-only file inspection:
1. Read {{ticket_path}} and extract:
   - objective
   - scope
   - acceptance_criteria
   - dependencies
   - expected_artifacts
   - verification_method
2. Check if any of these are missing or vague.

Output format (JSON only):
{
  "ready": true | false,
  "missing": ["criteria_1", "criteria_2"],
  "suggestions": ["suggestion_1", "suggestion_2"]
}
```

### Context embedded directly in prompts

**Must embed:**
- Ticket ID and path
- Specific workflow requirement being checked (e.g., "before backlog→planned, acceptance criteria must be clear")
- Expected criteria list (if known from ticket)
- `SPAWN_DEPTH: 0` and `ALLOW_WRITE: false` constraints

**Child discovers via read-only inspection:**
- Full ticket content (objective, scope, criteria)
- Workflow documentation (if exists)
- Codebase structure (for `ticket-plan` to identify files)
- Git diff (for `ticket-verify` to check changes)

### Output structure

**Child output must be:**
- **JSON only** (no markdown, no prose)
- **Schema-validated** (orchestrator checks for required fields)
- **Bounded** (max 500 chars to prevent timeout)

**Example valid output:**
```json
{"ready": false, "missing": ["acceptance_criteria", "verification_method"], "suggestions": ["Add explicit acceptance criteria", "Specify how to verify implementation"]}
```

**Example invalid output (rejected):**
```
The ticket is missing acceptance criteria. Please add them.
```

***

## 7. Human-in-the-loop checkpoints

### Mandatory human approvals

| Checkpoint | Human must approve | Orchestrator never decides alone |
|------------|-------------------|----------------------------------|
| `backlog` → `planned` | Readiness brief = "ready" + human confirms | Never auto-moves ticket |
| `planned` → `ongoing` | Plan exists + human confirms activation | Never auto-activates |
| `ongoing` → `completed` | Verification = "passed" + human confirms completion | Never auto-completes |
| Scope creep acceptance | Unexpected files changed + human accepts | Never auto-accepts creep |
| Partial verification | Verification = "partial" + human accepts | Never auto-completes partial |

### Decisions orchestrator never makes alone

1. **State transitions** (moving ticket files)
2. **Scope creep acceptance** (allowing unexpected changes)
3. **Partial completion** (accepting failed criteria)
4. **Ticket rejection** (moving to `rejected/`)
5. **Dependency resolution** (accepting unresolved dependencies)

### Surfacing questions for unready tickets

**Strategy:** When `ticket-readiness` returns `ready: false`:
1. Orchestrator prints artifact with `missing:` list
2. Orchestrator asks: "Ticket T001 is not ready. Missing: {{criteria}}. What should you do?"
3. Options presented:
   - `refine`: Edit ticket to add missing criteria
   - `split`: Propose splitting into smaller tickets
   - `reject`: Move to `rejected/`
   - `abort`: Stop, no action

**Orchestrator response:**
```
❌ Ticket T001 is not ready for planned/.

Missing criteria:
- acceptance_criteria
- verification_method

Suggestions:
1. Add explicit acceptance criteria (e.g., "Function X must return Y")
2. Specify verification method (e.g., "Run test T001.test.ts")

What should you do?
> refine | split | reject | abort
```

Human must select an option before proceeding.

***

## 8. Incremental implementation plan

### Ticket 1: Core extension command scaffolding

| Attribute | Specification |
|-----------|---------------|
| **Objective** | Create TypeScript extension command scaffolding for Pi |
| **Scope** | Add `pi-extensions/ticket-readiness.ts` with CLI child spawning, JSON parsing, artifact writing |
| **Acceptance criteria** | 1. Command exists at `pi-extensions/ticket-readiness.ts`<br>2. Command accepts `ticket-path` argument<br>3. Command spawns read-only child Pi<br>4. Command outputs JSON to orchestrator<br>5. Command writes artifact to `tickets/artifacts/readiness-<ID>.md`<br>6. Command fails gracefully if ticket not found |
| **Likely files** | `pi-extensions/ticket-readiness.ts`, `tickets/WORKFLOW.md` (if needed), `tickets/artifacts/` |
| **Dependencies** | Pi TypeScript extension support; `tickets/backlog/` with at least one ticket |
| **Verification** | Run `pi ticket-readiness tickets/backlog/T001.md`; check artifact exists; check JSON output valid |

### Ticket 2: `ticket-readiness` command full implementation

| Attribute | Specification |
|-----------|---------------|
| **Objective** | Implement full `ticket-readiness` logic (parse ticket, check criteria, generate artifact) |
| **Scope** | Add ticket parsing, criteria validation, readiness brief generation |
| **Acceptance criteria** | 1. Command extracts objective/scope/criteria from ticket<br>2. Command checks for missing criteria<br>3. Command generates `readiness-<ID>.md` with frontmatter<br>4. Command returns `ready: true/false` + `missing:` list<br>5. Command suggests refinements for missing criteria |
| **Likely files** | `pi-extensions/ticket-readiness.ts`, `tickets/artifacts/readiness-<ID>.md` |
| **Dependencies** | Ticket 1 complete |
| **Verification** | Run on 3 backlog tickets; verify artifacts show correct `ready` status and missing criteria |

### Ticket 3: `ticket-plan` command

| Attribute | Specification |
|-----------|---------------|
| **Objective** | Implement `ticket-plan` command for implementation planning |
| **Scope** | Add codebase inspection, step generation, plan artifact |
| **Acceptance criteria** | 1. Command reads ticket from `planned/`<br>2. Command identifies relevant files/steps<br>3. Command generates `plan-<ID>.md` with steps/files/risks<br>4. Command returns JSON with `steps:` and `estimated:`<br>5. Command fails if ticket not in `planned/` |
| **Likely files** | `pi-extensions/ticket-plan.ts`, `tickets/artifacts/plan-<ID>.md` |
| **Dependencies** | Ticket 1 complete |
| **Verification** | Run on 2 planned tickets; verify plans list correct steps and files |

### Ticket 4: `ticket-verify` command

| Attribute | Specification |
|-----------|---------------|
| **Objective** | Implement `ticket-verify` command for implementation verification |
| **Scope** | Add git diff inspection, criteria checking, verification artifact |
| **Acceptance criteria** | 1. Command reads ticket from `ongoing/` or `completed/`<br>2. Command checks git diff against plan's files<br>3. Command validates acceptance criteria<br>4. Command generates `verify-<ID>.md` with criteria table<br>5. Command returns `passed: true/false` + `failures:` list |
| **Likely files** | `pi-extensions/ticket-verify.ts`, `tickets/artifacts/verify-<ID>.md` |
| **Dependencies** | Tickets 1–3 complete; at least one completed ticket with commit |
| **Verification** | Run on 2 completed tickets; verify artifacts show correct pass/fail status |

### Ticket 5: `ticket-activate` and `ticket-complete` (human-guarded)

| Attribute | Specification |
|-----------|---------------|
| **Objective** | Implement state transition commands with human confirmation |
| **Scope** | Add `ticket-activate` (planned→ongoing) and `ticket-complete` (ongoing→completed) |
| **Acceptance criteria** | 1. `ticket-activate` checks `ongoing/` empty + plan exists<br>2. `ticket-activate` requires human confirmation before moving ticket<br>3. `ticket-complete` checks verification passed + commit exists<br>4. `ticket-complete` requires human confirmation before moving ticket<br>5. Both commands generate activation/completion logs |
| **Likely files** | `pi-extensions/ticket-activate.ts`, `pi-extensions/ticket-complete.ts`, `tickets/artifacts/activate-<ID>.md`, `tickets/artifacts/complete-<ID>.md` |
| **Dependencies** | Tickets 1–4 complete |
| **Verification** | Run activate on 1 planned ticket (human confirms); run complete on 1 ongoing ticket (human confirms); verify tickets moved correctly |

### Ticket 6: Command logging and artifact staleness checks

| Attribute | Specification |
|-----------|---------------|
| **Objective** | Add command logging and artifact staleness detection |
| **Scope** | Add command log generation; add ticket-path validation before using artifacts |
| **Acceptance criteria** | 1. Each command appends to `command-log-<DATE>.md`<br>2. `ticket-activate` checks plan's `ticket_path` matches current ticket location<br>3. If mismatch, command refuses activation and prompts for regeneration<br>4. Command logs show timestamp, command, result, artifact |
| **Likely files** | `pi-extensions/command-log.ts`, `pi-extensions/ticket-activate.ts` (updated) |
| **Dependencies** | Tickets 1–5 complete |
| **Verification** | Run 3 commands; verify command log exists with correct entries; test artifact staleness by moving ticket and re-running activate |

***

## 9. Premortem

### Assume failure after one month. What likely went wrong?

1. **Child sessions timed out frequently** due to complex prompts or large codebase inspection → users stopped using commands.
2. **Artifacts became stale** after ticket edits → humans trusted wrong readiness/plan info → implementation failed.
3. **State transitions blocked** because `ongoing/` not cleared → workflow stalled.
4. **Command scaffolding too complex** (TypeScript setup) → human didn't implement beyond Ticket 1.
5. **Verification too strict** (failed on whitespace changes) → humans bypassed commands.
6. **No error recovery** (child failure = permanent stop) → frustrating UX.

### Early warning signs

- **Week 1:** Child timeout errors > 20% of runs
- **Week 2:** Humans manually moving tickets instead of using commands
- **Week 3:** Artifact mismatches (ticket moved, plan not regenerated)
- **Week 4:** Commands skipped for "ritual" tasks (readiness checked manually)

### Design choices reducing risks

1. **Bounded prompts** (max 500 chars) prevent timeout.
2. **Frontmatter `ticket_path` + `created_at`** enables staleness detection.
3. **Explicit `ongoing/` check** prevents blocking.
4. **CLI child spawning** (no SDK/RPC) keeps setup simple.
5. **Lenient verification** (flag whitespace as "warning" not "fail") reduces friction.
6. **One retry on child failure** before failing permanently.

***

## 10. Critique and alternatives

### Critique of my proposal

**Over-engineered:**
- **TypeScript extension commands** require Pi TypeScript support + build setup. May be too heavy for a single-developer repo.
- **Five commands** (`readiness`, `plan`, `verify`, `activate`, `complete`) may be more than needed initially.
- **JSON parsing + Markdown transformation** adds complexity; could just output Markdown directly from child.

**Too weak:**
- **No auto-scope enforcement**: Implementation can still creep; relies on human comparison.
- **No dependency resolution automation**: Human must manually check dependencies before `planned→ongoing`.
- **Single retry on child failure**: May not be enough for flaky children.

### Simpler alternative

**Prompt-template-only workflow (no extension commands):**
- Create `pi-prompts/ticket-readiness.md`, `pi-prompts/ticket-plan.md`, etc.
- Human runs: `pi --prompt-file pi-prompts/ticket-readiness.md tickets/backlog/T001.md`
- Child outputs Markdown directly (no JSON parsing)
- Human saves artifact manually

**Pros:** Zero TypeScript setup; instant to prototype.  
**Cons:** No reusability; hard to maintain; no argument validation.

**When to use:** If extension command setup is too complex or Pi TypeScript unsupported.

### More ambitious alternative

**Full SDK + RPC orchestration:**
- Use Pi SDK (Python/Node) to spawn child sessions via RPC
- Bidirectional communication (orchestrator can send updates to child)
- Auto-retry with backoff on child failure
- Dependency graph tracking (auto-block `planned→ongoing` if dependencies unresolved)
- Web UI for artifact review + human approval

**Pros:** Full automation; robust error handling; visual workflow.  
**Cons:** Heavy setup; breaks Pi-native feel; requires external SDK.

**When to use:** If multi-developer team or complex dependency workflows emerge.

***

## 11. Agent behavior recommendations

### If I were the AI in the orchestrator Pi session

**How I'd use commands:**
1. Human says: "Is T001 ready for planned?"
2. I run: `pi ticket-readiness tickets/backlog/T001.md`
3. I wait for child output + artifact generation
4. I present artifact: "T001 is not ready. Missing: acceptance_criteria, verification_method."
5. I ask: "What should you do? refine | split | reject | abort"
6. Human chooses `refine` → I wait for human to edit ticket
7. Human says: "T001 edited. Re-check readiness."
8. I re-run `ticket-readiness`; if now ready, I prompt: "Ready to move to planned/. Confirm?"

**Constraints:**
- I never auto-move tickets without human confirmation.
- I never skip precondition checks (e.g., `ongoing/` empty).
- I always present artifacts before asking for decisions.

### If I were the AI in a child Pi session

**How I'd constrain myself:**
1. **Read-only**: I never write files (enforced by `ALLOW_WRITE: false`).
2. **No spawning**: I never spawn child sessions (`SPAWN_DEPTH: 0`).
3. **Bounded output**: I output JSON ≤ 500 chars.
4. **Task-focused**: I only answer the embedded task (e.g., "check readiness").
5. **No assumptions**: I only use data from read-only file inspection.

**Information making me fast/reliable:**
- **Embedded context**: Ticket ID, expected criteria, workflow requirement in prompt.
- **Read-only file paths**: Explicit paths to ticket + workflow docs.
- **Output schema**: JSON schema I must follow (prevents malformed output).
- **Timeout warning**: "Max 500 chars" prevents timeout.

### Information that would make me useful

**For orchestrator AI:**
- **Artifact templates**: Predefined Markdown schemas for readiness/plan/verify.
- **Precondition rules**: Explicit list (e.g., "`planned→ongoing` requires `ongoing/` empty + plan exists").
- **Error messages**: Standard phrases for failures ("Ticket not in planned/", "Verification failed").
- **Human options**: Menu of choices when ticket not ready (`refine | split | reject | abort`).

**For child AI:**
- **Ticket content**: Full ticket text (objective, scope, criteria) embedded or read via `fs.readFile`.
- **Workflow requirement**: Exact text from `tickets/WORKFLOW.md` about readiness.
- **Codebase structure**: File list for `ticket-plan` to identify relevant files.
- **Git diff**: Changed files for `ticket-verify` to check against plan.

***

**Final note:** This proposal prioritizes **minimal, inspectable, human-directed workflows** over automation. Commands reduce ritual repetition but never replace human judgment. The file-based ticket workflow remains the source of truth; artifacts are advisory only.