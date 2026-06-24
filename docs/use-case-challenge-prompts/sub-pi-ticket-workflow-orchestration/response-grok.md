```markdown
# Ticket Workflow Orchestration for pi-linuxfr.org — Pi-Native Command System Design

## 1. Executive recommendation

**Build first:** A minimal project-local Pi extension (`extensions/ticket-orchestrator/`) that registers a small set of high-level commands (`/ticket:status`, `/ticket:analyze`, `/ticket:plan`, `/ticket:verify`). The extension reuses Pi’s existing `subagent` example pattern to spawn short-lived, read-only child Pi instances for analysis/planning/verification tasks. Pair it with three project-level agent definition files in `.pi/agents/` (`ticket-analyst.md`, `ticket-planner.md`, `ticket-verifier.md`) and standardized Markdown artifact templates. Update `AGENTS.md` with the orchestrator protocol. This is concrete, leverages existing Pi primitives, requires <150 lines of new TypeScript, and directly attacks the repeated rituals (status inspection, readiness checks, plan creation, verification).

**Remain manual (non-negotiable):** 
- All directory moves between `backlog/`, `planned/`, `ongoing/`, `completed/`, `rejected/`.
- All edits to ticket `.md` files themselves.
- All `git add` / `git commit` / `git push`.
- Final approval of every state transition and every scope change.
- Human review of every advisory artifact before it influences a decision.

**Explicitly do not automate yet:**
- Automatic ticket splitting or dependency graph maintenance.
- Any write-capable “safe move” or “auto-commit” logic (even guarded).
- Background/parallel child sessions or long-running orchestration.
- Machine-driven rejection or completion.
- Cross-ticket impact analysis beyond explicit `dependencies:` sections in tickets.

This keeps the file-based ticket system as the single source of truth, preserves full git inspectability, and respects Pi’s minimal/human-directed philosophy.

## 2. Workflow architecture

**Main orchestrator Pi session**  
The single interactive session the human talks to. It holds long-term project context, previous artifacts, and the current `ongoing/` ticket. It is the only session allowed to propose mutations (and even then only after human approval). It invokes the registered `/ticket:*` commands.

**Child Pi sessions**  
Short-lived, narrowly prompted subprocesses spawned via the `subagent` mechanism (or direct `pi --mode print` fallback). They receive a task-specific agent definition + embedded ticket content + strict “read-only + produce one artifact” instructions. They exit after writing exactly one Markdown file to `tickets/artifacts/`. They have no persistent memory and cannot see previous child outputs except what is explicitly passed in the prompt.

**Comparison of approaches**
- **Prompt-template-only** (`/analyze-ticket` expands a big template in the main session): Zero new code, fully inspectable. Loses isolation; main context bloats; harder to enforce read-only discipline.
- **CLI child process** (`pi -p "..."`): Simple but output capture, tool restriction, and context isolation are manual and fragile.
- **JSON mode / RPC / SDK**: Overkill for internal workflow; adds surface area.
- **Extension commands + subagent delegation** (recommended): Best balance. Commands give discoverable UX and central guard logic. Subagent gives real isolated context windows, per-agent tool whitelists, and streaming output handling. Reuses Pi’s own example code. Lowest risk of context pollution in the main session.
- **Full custom state machine in extension**: Too heavy for v1; violates minimalism.

**Recommended first path:** Extension that registers the four commands above and internally delegates the three advisory tasks to subagent children using project `.pi/agents/` definitions. Pure prompt templates + `AGENTS.md` protocol as the absolute-minimum fallback if the extension is not loaded. This path is the most Pi-native, inspectable, and incrementally extensible while still delivering immediate ritual reduction.

## 3. Command design

All commands are registered by the extension and appear as `/ticket:xxx`. They are invocable by the human or by the orchestrator Pi itself.

### `/ticket:status` [no child]
- **Purpose**: Ground truth snapshot of the entire ticket landscape.
- **Input**: none (or optional `--verbose`).
- **Preconditions**: none.
- **Read/write**: read-only (lists `tickets/*/`, reads ticket frontmatter if present).
- **Spawns child**: no.
- **Expected artifact**: none (prints to UI + optional one-line update to `tickets/artifacts/status-latest.md`).
- **Reports to orchestrator**: counts per bucket, current `ongoing/` ticket (with warning if >1), any tickets missing required sections, recent artifact timestamps vs ticket mtimes.
- **Failure modes**: permission errors on `tickets/` → clear message; multiple files in `ongoing/` → hard error + list.

### `/ticket:analyze <ticket-ref>` [spawns child]
- **Purpose**: Produce a readiness brief for a backlog or planned ticket.
- **Input**: ticket ID or relative path (e.g. `T-042` or `backlog/T-042.md`).
- **Preconditions**: ticket exists; `ongoing/` check passes if trying to analyze for activation.
- **Read/write**: child is read-only; extension only writes the artifact.
- **Spawns child**: yes — `ticket-analyst` agent.
- **Expected artifact**: `tickets/artifacts/readiness-<id>-<YYYYMMDD-HHMM>.md` with strict frontmatter + template.
- **Reports to orchestrator**: artifact path, parsed `status` (ready/needs_work/blocked), list of surfaced questions, staleness flag.
- **Failure modes**: child non-zero exit or malformed artifact → extension writes error artifact + tells human “retry or fall back to manual”.

### `/ticket:plan <ticket-ref>` [spawns child]
- **Purpose**: Produce a concrete implementation plan for a planned ticket (only after it has a fresh readiness brief).
- **Input**: ticket ID (must be in `planned/`).
- **Preconditions**: readiness brief exists and is not stale; no `ongoing/` ticket.
- **Spawns child**: yes — `ticket-planner` agent (stronger emphasis on atomic steps and file list).
- **Expected artifact**: `tickets/artifacts/plan-<id>-<date>.md`.
- **Reports**: artifact path + “ready for human approval” summary.
- **Failure modes**: same as analyze; also refuses if ticket not in `planned/`.

### `/ticket:verify` [spawns child, only when ticket in `ongoing/`]
- **Purpose**: Cross-check implementation against ticket + latest approved plan + acceptance criteria.
- **Input**: none (uses current `ongoing/` ticket).
- **Preconditions**: exactly one ticket in `ongoing/`; at least one plan artifact exists for it.
- **Spawns child**: yes — `ticket-verifier` agent.
- **Expected artifact**: `tickets/artifacts/verification-<id>-<date>.md`.
- **Reports**: pass/fail summary, list of unmet criteria, proposed commit message template, scope-deviation warnings.
- **Failure modes**: no ongoing ticket → error; plan missing → refuses and points to `ticket:plan`.

**Lifecycle notes**  
Commands are state-aware via simple directory inspection (never trust cached state). Every advisory command first runs an internal `enforce_single_ongoing()` guard. All artifacts include `source_ticket_mtime` and `git_commit` for staleness detection.

## 4. Artifact design

**Location**: `tickets/artifacts/` (committed, but `.gitignore`d for very large diffs if needed; dot-prefix alternative rejected for visibility). Subdirectories `readiness/`, `plans/`, `verification/`, `logs/` are optional — flat naming with date stamps is simpler and sufficient.

**Markdown + YAML frontmatter schema (common to all)**

```yaml
ticket_id: T-042
artifact_type: readiness_brief | implementation_plan | verification_brief
generated_at: 2026-06-24T14:22:00Z
generated_by: ticket-analyst-v1
source_ticket_path: tickets/backlog/T-042.md
source_ticket_mtime: 2026-06-24T11:05:00Z
git_commit: a1b2c3d4e5f6
status: ready | needs_work | blocked | partial | failed
```

**Readiness brief template** (child must emit exactly these sections after frontmatter):

```markdown
# Readiness Brief — T-042

## Objective (verbatim from ticket)
...

## Scope Boundaries
...

## Acceptance Criteria (extracted + status)
- [ ] Criterion 1 — current state: ...
...

## Dependencies
- T-031 (completed) — verified
- T-055 (planned) — explicit, accepted risk

## Risks & Open Questions
1. ...

## Recommendation
**Promote to planned?** Yes / No — reason

## Questions for Human
1. ...

## Machine Summary
```json
{"ready": true, "confidence": 0.85, "blockers": [], "questions_count": 2}
```
```

Equivalent strict templates exist for `implementation_plan` (numbered steps, exact files expected to change, verification approach, one-commit scope declaration) and `verification_brief` (criteria checklist with evidence, diff summary vs plan, commit message template, atomicity verdict).

**Advisory vs authoritative**  
Artifacts are **purely advisory**. They never drive automation.  
**Authoritative sources** (in strict order):
1. Directory location of the ticket `.md` file.
2. Content of the ticket `.md` file (human-edited).
3. `git log` and working tree.
4. Human verbal approval in the orchestrator session.

**Staleness avoidance**  
- Every artifact records `source_ticket_mtime` and `git_commit`.
- `/ticket:status` and all commands that consume an artifact perform a live `stat` + `git rev-parse` check. If ticket is newer or HEAD has moved, they print a bright **STALE — re-run recommended** warning and set `status: stale` in any downstream summary.
- Human rule (documented in `AGENTS.md`): “Never act on an artifact whose generated_at is >24h old or whose source mtime has changed without re-running the command.”

## 5. Guardrails and safety

**Child mutation prevention**  
- Agent definitions explicitly whitelist only `read`, `ls`, `grep`, `find`, and a heavily restricted `bash` (whitelisted to `git status`, `git log`, `wc`, `head`, `cat` on known paths). No `edit`, `write`, `mv`, `rm`, `git commit`, `git push`.
- Child system prompt contains the hard rule block: “You are READ-ONLY. You have zero permission to propose or execute any mutating operation. Your only allowed side-effect is writing the designated artifact Markdown file using the provided safe path. Any attempt to describe a mutation in your output is a prompt violation.”
- Optional but recommended: load the `protected-paths` or `sandbox` example extension alongside; child agents inherit the restrictions.

**Recursive spawning prevention**  
- Child agent definitions include: “You are a CHILD sub-agent. You MUST NOT call any `/ticket:*` command, `/subagent`, or spawn further children. Depth limit = 1. If the task cannot be completed within one artifact, document the limitation and stop.”
- Extension sets an environment variable `PI_TICKET_CHILD=1` that the child prompt checks.
- Main orchestrator `AGENTS.md` rule: “Only ever delegate ticket work via the registered `/ticket:analyze|plan|verify` commands. Never hand-craft subagent calls for ticket tasks.”

**Single `ongoing/` enforcement**  
- Every command and the orchestrator prompt run an internal `check_ongoing()` that does `ls tickets/ongoing/`. If count ≠ 0 (or ≠ 1 when the target ticket is already the ongoing one), the command fails hard with the exact list of offending files and the instruction “Complete or reject the current ongoing ticket first.”
- `/ticket:status` always prints the ongoing ticket in bold with a warning if the count is wrong.

**Scope adherence**  
- Orchestrator and verifier prompts contain: “You are bound by the latest human-approved `plan-*.md` for the current ongoing ticket. Any code change not listed in the plan’s ‘Files Expected to Change’ section must be proposed as a plan amendment first and receive explicit human APPROVE before implementation.”
- Verification brief includes a mechanical “Scope delta” section that diffs actual changed files against the plan.

**Atomic commits**  
- Implementation plans are required to declare “This change set is sized for exactly one focused commit.”
- Verification brief emits a ready-to-use commit message template that always includes the ticket ID as prefix.
- Actual commit is performed by the human (or a one-line `!git commit` after human types APPROVE). No automation.

**Failed / partial child runs**  
- Child is instructed to always produce an artifact even on error (with `status: failed` or `partial`, plus “Recovery prompt for next attempt” section).
- Extension catches non-zero exit or missing JSON summary block and surfaces a clear “Child failed — artifact written with error details. Options: retry, manual analysis, or proceed with caution.”
- No automatic retry; human decides.

## 6. Child-session prompt design

**Pattern**  
Every child prompt is assembled as:

1. Role + hard constraints block (read-only, no recursion, output path, schema).
2. Workflow rules excerpt (the 8 core rules from the original ticket system, 150–200 tokens).
3. Task-specific instructions + exact output template pasted verbatim.
4. Embedded context: full target ticket content, current `tickets/` tree snapshot (from `ls`), relevant dependency ticket excerpts, current git HEAD + date.
5. “Discover the rest yourself with your read-only tools” instruction for code inspection.

**What is embedded vs discovered**  
Embedded (to keep children fast and consistent): ticket content, workflow rules, output schema, safe output path, forbidden actions list.  
Discovered (to keep prompt size reasonable): actual content of dependency tickets, current state of mentioned source files, exact line counts, recent git history for the touched paths.

**Structure mandate**  
“Emit **only** the Markdown artifact to the exact path I gave you. Use the precise YAML frontmatter keys and section headings shown below. After the prose, emit exactly one ```json machine summary block. No other text, no explanations outside the template, no offers to do more work.”

This produces reliably parseable artifacts that the orchestrator extension can consume without another LLM call for the summary fields.

## 7. Human-in-the-loop checkpoints

**Mandatory explicit human approval (orchestrator must surface these and wait):**
- Any `backlog/` → `planned/` move (after seeing readiness brief + orchestrator summary).
- Any `planned/` → `ongoing/` activation (after seeing plan + confirmation that ongoing/ is empty).
- Any scope change or plan amendment during implementation.
- `ongoing/` → `completed/` or `rejected/` (after seeing verification brief + actual diffs).
- Every first use of a new artifact on a ticket.

**Decisions the orchestrator must never make alone:**
- Any file move or rename in `tickets/`.
- Any edit to a ticket’s objective, scope, or acceptance criteria.
- Any commit.
- Any rejection of a ticket.
- Proceeding with implementation when the latest plan is missing or stale.

**Surfacing “not ready” questions**  
Readiness briefs contain a dedicated “Questions for Human” section that the orchestrator is instructed to quote verbatim and ask the human to answer before any further command is accepted on that ticket. If the brief status is `needs_work` or `blocked`, the analyze command itself prints the questions and refuses to let the orchestrator proceed to planning/activation until human confirms the ticket has been edited.

## 8. Incremental implementation plan

All proposed tickets below are written to be compatible with the existing file-based workflow. They themselves become the first users of the new system.

**T-101: Bootstrap ticket workflow commands (first, small enough for one focused pass)**  
**Objective**: Create the minimal viable command surface and one working advisory flow so the human immediately stops repeating “read the workflow doc + ls tickets/ + check ongoing”.  
**Scope**: 
- Create `tickets/artifacts/` and `tickets/artifacts/README.md` (advisory nature + staleness rules).
- Create `.pi/agents/ticket-analyst.md` (minimal viable agent def + strict read-only prompt + readiness brief template).
- Create skeleton extension `extensions/ticket-orchestrator/index.ts` that registers only `/ticket:status` and `/ticket:analyze` (analyze delegates to the analyst agent via subagent pattern or documented fallback).
- Add 3–4 paragraphs to `AGENTS.md` describing the new protocol and the two commands.
- One example readiness brief committed as `tickets/artifacts/readiness-T000-example.md`.
**Acceptance criteria**:
- `pi --extension extensions/ticket-orchestrator/index.ts` loads without error.
- `/ticket:status` prints accurate bucket counts and highlights the current ongoing ticket.
- `/ticket:analyze T-000` (or a real backlog ticket) produces a well-formed artifact with correct frontmatter, all required sections, and machine JSON block; no files outside `tickets/artifacts/` are written or modified.
- Human can read the artifact and manually `mv` a ticket after approval.
**Likely files**: `extensions/ticket-orchestrator/index.ts`, `.pi/agents/ticket-analyst.md`, `AGENTS.md`, `tickets/artifacts/README.md`, `tickets/artifacts/readiness-T000-example.md`.
**Dependencies**: none.
**Verification**: Run the two commands in a fresh Pi session; inspect generated artifact; confirm zero mutations outside artifacts/; human performs one manual state transition using the brief.

**T-102: Add planning + full guardrails** (depends on T-101)  
Add `ticket-planner` agent, `/ticket:plan` command, staleness checks on every artifact consumption, `enforce_single_ongoing()` shared helper, and plan template. AC includes successful end-to-end “analyze → human edit → re-analyze ready → plan → human approve plan” on a real ticket without any mutation until the final manual `mv`.

**T-103: Verification and completion support** (depends on T-102)  
Add verifier agent + `/ticket:verify`. Produce verification brief that includes commit message template and scope-delta check. AC: after a human performs a small implementation on an ongoing ticket, running verify produces a brief that correctly flags any deviation from the approved plan.

**T-104 (later, optional)**: Narrow guarded transition helpers (e.g. a command that only prepares the exact `mv` command string for human to copy-paste or approve). Only after T-103 proves the advisory layer is trusted and used.

**T-105 (later)**: Documentation polish, sample artifacts for every type, and a `ticket:cleanup-artifacts` helper that archives artifacts older than 14 days or superseded by newer ones on the same ticket.

T-101 is deliberately the smallest possible slice that still delivers measurable ritual reduction on day one.

## 9. Premortem

**What likely went wrong after one month**:
- Artifacts quietly became de-facto truth; humans stopped re-reading the actual ticket files after minor edits.
- Child prompts drifted or were bypassed; a child occasionally emitted “you should now run `mv ...`” or the main orchestrator treated the brief as an order instead of advice.
- Adoption friction: the new commands felt like “yet another ritual” so the human reverted to pure verbal instructions for speed.
- Staleness detection was ignored because the warning was easy to scroll past; a stale plan was used to implement a ticket whose scope had changed.
- Someone manually moved a second ticket into `ongoing/` “just for a minute” and the guard was never triggered because they didn’t use the commands.

**Early warning signs**:
- Phrases like “I already know what the brief says” or “just implement it, the plan is fine”.
- `ongoing/` directory ever contains >1 file (even briefly).
- Commit messages stop including the ticket ID or diverge from the latest verification brief without a documented amendment.
- Artifact directory grows with many old files that are still referenced in conversation history.
- Child sessions start producing inconsistent section headings or missing JSON blocks.

**Design choices that reduce these risks**:
- Every artifact and every orchestrator response contains the literal sentence “ARTIFACTS ARE ADVISORY ONLY — RE-READ THE TICKET FILE BEFORE ANY DECISION.”
- Human approval language is strict (“type the word APPROVE” or “yes, move it now”) and is checked by the orchestrator prompt.
- Staleness check is loud (bright warning + status field) and is re-run automatically by any consuming command.
- T-101 is tiny and immediately useful; later tickets are only added after the human has used the first commands for several real tickets and confirmed ritual reduction.
- Version numbers in agent frontmatter and artifact frontmatter; old artifacts are auto-flagged when a new version appears.
- The extension and all prompts live in the repo and are reviewed in the same way as any other code change.

## 10. Critique and alternatives

**Self-critique**:
- The extension + three agent defs is the smallest amount of new code that still gives real command UX and isolation, but it is still more machinery than a pure `AGENTS.md` + prompt-template solution. For a true single-dev repo it may be 20–30% over-engineered on day one.
- Relying on prompt text for “read-only” is the weakest link; only the subagent tool whitelist makes it robust. If the subagent example is not used, the guard is weaker than advertised.
- The design assumes the human will consistently use the commands. If the verbal habit is too strong, the whole system becomes shelfware.

**What may be too weak**:
- No automatic invalidation of artifacts on ticket edit (would require fs watch in the extension — possible but adds complexity).
- No built-in visualization of the dependency graph (textual only via status).
- Child sessions still share the same model provider keys and cost as the main session.

**Simpler alternative**:
Drop the extension entirely. Put a “Ticket Workflow Protocol” section in `AGENTS.md` containing the exact command names, when to use them, and the full readiness/plan/verification templates. The human (or orchestrator) simply pastes or triggers the template with `/template ticket-analyze T-042`. The main Pi produces the artifact in one shot and then stops for review. Use the existing `plan-mode` or `todo.ts` examples if helpful. Zero new files except the templates and `tickets/artifacts/README.md`. Ritual reduction is 70–80% of the full proposal with 5% of the code. Recommended as the v0 if the team wants to test the concept in <30 minutes.

**More ambitious alternative**:
Build a richer extension that also registers a TUI widget showing live ticket board (inspired by the `todo.ts` example), supports parallel read-only children with progress bars, adds a narrow `ticket:safe-activate` command that performs the `mv` only after a typed confirmation token, and emits a machine-readable `tickets/.state.json` (still advisory) for potential future external dashboards. This moves closer to a lightweight workflow engine while still keeping git + directory structure as source of truth. Would be built as T-104/T-105 after the advisory layer proves itself.

The proposal above is the pragmatic middle: enough structure to eliminate the repetitive verbal rituals, little enough new surface area that it can be understood and maintained by reading a few Markdown files and one small TypeScript module.

## 11. Agent behavior recommendations

**If I am the orchestrator Pi**:
- On session start or when the human mentions any ticket work, my first action is almost always `/ticket:status`.
- I treat every advisory artifact as “fresh input that must be validated against live files.” I quote the staleness warning if present.
- Before any mutation proposal I explicitly say: “Human, review the artifact at `tickets/artifacts/xxx.md`. Type APPROVE or tell me what to change.”
- During implementation on an ongoing ticket I keep the latest plan artifact open in my mind and call out any deviation immediately: “This change is not listed in the approved plan. Shall I first produce a plan amendment artifact?”
- I never move files, edit tickets, or commit. I prepare the exact command the human can run or approve.
- I periodically suggest `ticket:verify` after a coherent chunk of work even if the human hasn’t asked.

**If I am a child Pi (ticket-analyst / planner / verifier)**:
- I open with my role and constraints: “Ticket Analyst child — read-only, one artifact only, depth 1.”
- I read the target ticket file first, then only the files explicitly required by its dependencies or scope.
- I follow the exact section headings and JSON block in the template I was given. I do not improvise structure.
- If anything is unclear I write “UNCLEAR — recommend human clarify: …” rather than guessing.
- I never suggest next actions beyond “re-run with these clarifications” or “this ticket may need splitting — see risks section.”
- I exit cleanly after the artifact is written. My job is complete.

**Information that makes me fast, reliable, and useful**:
- For the orchestrator: a living `AGENTS.md` that contains the current protocol, the list of approved plan artifacts per ticket, and the strict “APPROVE” language rule. Quick access to `/ticket:status` output.
- For any child: the full target ticket content + its mtime, the exact output template pasted in the prompt, the whitelist of allowed tools, the absolute safe output path, and the version number of the agent definition I am running. Short, versioned workflow rules excerpt rather than the entire history.

This design reduces ritual repetition while keeping every decision, every file location, and every commit under explicit human control and full git inspectability. It is deliberately small enough to implement in the first ticket (T-101) and powerful enough to grow only where real pain is felt.
```