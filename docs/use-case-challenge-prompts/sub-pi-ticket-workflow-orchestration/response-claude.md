I'll ground this in Pi's actual capabilities before designing against them. Let me check the docs.Good — Pi is real (Earendil Inc.). Let me read the actual reference docs for the orchestration primitives so the design is genuinely Pi-native.I read Pi's actual docs (pi.dev) so this is grounded in its real primitives rather than an imagined API. The key facts that shape everything below: prompt templates are `.pi/prompts/*.md` files that expand `/name` into a prompt *inside the current session* (they have no execution power of their own — they're saved instructions to the agent); child sessions are spawned with `pi -p`/`--mode json`; tools are allowlistable with `--tools read,grep,find,ls` (built-ins are `read, bash, edit, write, grep, find, ls`); `--no-approve` makes a non-interactive child ignore project-local extensions/prompts; and `AGENTS.md` loads even in untrusted/non-interactive runs. The single most important consequence: a read-only child with no `bash` tool **cannot spawn anything and cannot write anything**, which makes most of your guardrails free.

---

# Sub-Pi Ticket Workflow — Architecture

## 1. Executive recommendation

**Build first:** a tiny set of *read-only advisory* prompt templates plus one shared "spawn a read-only child" convention and one `_briefs/` directory. Concretely, four commands — `/ticket-status`, `/ticket-readiness`, `/ticket-plan`, `/ticket-verify` — where the three context-heavy ones (`readiness`, `plan`, `verify`) delegate the heavy file-reading to a throwaway read-only child Pi process and return a one-page Markdown brief. This directly attacks the stated pain ("repetition consumes context"): the heavy reading burns a child's context, not the orchestrator's.

**Keep manual (orchestrator + human, codified as a checklist, not automated):** every *state transition* and every *git operation* — `backlog→planned`, `planned→ongoing` activation, the commit, `ongoing→completed`, and `→rejected`. These are cheap to do, rare per session, and dangerous to get wrong. Codify them as a documented procedure the orchestrator follows with an explicit human "yes," not as automation.

**Do not automate yet:** (a) ticket *file moves* between state directories from inside a child session; (b) committing; (c) any write performed by a child; (d) splitting/refining tickets without showing the human the proposed new ticket text first; (e) a TypeScript extension. Extensions are the right long-term home for one hard invariant (single-ongoing) but they're code you must maintain — earn that complexity only after the zero-code version visibly fails.

Rationale in one line: **the win is context isolation, not autonomy.** Children exist to keep the orchestrator's context window clean, not to make decisions.

---

## 2. Workflow architecture

**Orchestrator ↔ child relationship.** One long-lived interactive Pi session is the human's cockpit. It holds the workflow rules, the current ticket map, and the conversation. When a task requires reading a lot of files to produce a small judgement (is this backlog ticket ready? what's the plan? did the diff satisfy the acceptance criteria?), the orchestrator shells out — via its `bash` tool — to a **fresh, ephemeral, read-only child** `pi -p`. The child reads what it needs, prints a structured Markdown brief to stdout, and exits. The orchestrator captures that stdout, stamps it with provenance, writes it under `tickets/_briefs/`, and surfaces only the verdict + open questions to the human. The child never touches the orchestrator's context window directly; only the distilled brief crosses back.

**Comparison of viable Pi mechanisms:**

- **Prompt-template-only (no child).** Cheapest. `/name` expands to instructions the orchestrator executes itself. Perfect for `/ticket-status` (pure reasoning over a directory listing). Weakness: the heavy reads happen *in the orchestrator's context*, so it doesn't solve the context-bloat problem for readiness/plan/verify.
- **CLI child process (`pi -p`, read-only).** The orchestrator's `bash` tool runs `pi -p --tools read,grep,find,ls ...`. Simple, inspectable, naturally sandboxed (no bash ⇒ no recursion, no writes), and you can read the exact command in the transcript. Plain text out, exit code in. This is the sweet spot.
- **`--mode json` child.** Same spawn, but the child emits a JSON event stream so the orchestrator can reliably distinguish "finished with a result" from "errored mid-run" and extract the final message programmatically. Use this as the hardening upgrade once plain `-p` parsing proves flaky.
- **RPC mode (`--mode rpc`).** A persistent JSONL server over stdin/stdout. Overkill here — it shines for long-lived non-Node integrations, not for one-shot advisory briefs.
- **SDK.** Embed Pi in a Node program. Most powerful, most code, most maintenance. Reserve for if this ever grows into a real tool you run outside Pi.
- **Extension commands (TypeScript).** Register first-class `/commands`, hook tool/permission events, enforce invariants in code. The only mechanism that can *reliably* block an action (e.g., refuse any `git mv` into a non-empty `ongoing/`). Worth it later for exactly one or two hard invariants.

**Recommended first path: prompt templates that orchestrate read-only `pi -p` children.** It needs zero compiled code, every action is visible in the transcript and in git, the read-only toolset gives you sandboxing and recursion-prevention for free, and it maps cleanly onto Pi's "primitives, not features" philosophy. You can graduate individual commands to `--mode json` or to an extension without rewriting the model.

---

## 3. Command design

Naming convention: all commands are `/tk-<verb>` (short, namespaced, autocompletes together). Files live at `.pi/prompts/tk-<verb>.md`. Shared child-spawn flags are defined once in `AGENTS.md` (see §5) and referenced by every template.

Lifecycle order: `status → readiness → refine → plan → activate → implement → verify → complete` (with `reject` available from any pre-completion state).

For each command: **purpose / args / preconditions / R-W / spawns child? / artifact / reports / failure modes.**

**`/tk-status`**
- Purpose: one-screen snapshot of all ticket dirs + invariant checks.
- Args: none.
- Preconditions: none.
- Permissions: read-only.
- Spawns child: no (cheap; orchestrator reads dir listings directly).
- Artifact: none (ephemeral console output).
- Reports: per-state counts, the name of the single `ongoing/` ticket (or a flag if 0 or >1), and any backlog ticket already marked READY by a fresh brief.
- Failure modes: stale if the human moved files outside Pi — always derived live, never cached.

**`/tk-readiness <id>`**
- Purpose: judge a `backlog/` ticket against the `backlog→planned` checklist (objective, scope, acceptance criteria, dependencies, expected artifacts, verification).
- Args: `<id>` (required).
- Preconditions: `tickets/backlog/<id>.md` exists.
- Permissions: read-only orchestrator action; **spawns read-only child**.
- Spawns child: yes.
- Artifact: `tickets/_briefs/<id>.readiness.md` (verdict READY / NOT-READY, gap list, split suggestion).
- Reports: verdict + the specific missing fields + any open questions for the human. Never moves the ticket.
- Failure modes: child times out / errors (orchestrator reports failure, writes no brief); ticket references code that doesn't exist (surfaced as a gap, not an error).

**`/tk-refine <id> [split]`**
- Purpose: propose refined ticket text, or a split into N atomic tickets.
- Args: `<id>` required; optional `split` hint.
- Preconditions: a readiness brief exists and is non-stale (else it tells you to run `/tk-readiness` first).
- Permissions: **write-capable but human-gated** — confined to `tickets/backlog|planned/`.
- Spawns child: optional (read-only analysis child to draft).
- Artifact: proposed ticket file contents shown **inline for approval**; written to disk only after explicit human "yes."
- Reports: the diff/new-files it intends to create; waits.
- Failure modes: over-eager splitting — mitigated by requiring human confirmation before any write.

**`/tk-plan <id>`**
- Purpose: produce an implementation plan for a `planned/` (or refined) ticket.
- Args: `<id>`.
- Preconditions: ticket is in `planned/` (or readiness verdict = READY).
- Permissions: read-only; **spawns read-only child**.
- Spawns child: yes.
- Artifact: `tickets/_briefs/<id>.plan.md` (ordered steps, files-to-touch list, explicit out-of-scope list, risks, verification steps).
- Reports: step count, files-to-touch list, called-out risks/ambiguities for the human.
- Failure modes: plan invents files/APIs — the read-only child is instructed to only cite files it actually read; orchestrator spot-checks the files-to-touch list exists.

**`/tk-activate <id>`**
- Purpose: move exactly one ticket `planned/ → ongoing/`.
- Args: `<id>`.
- Preconditions (all enforced before any write): `ongoing/` is empty; dependencies resolved or explicitly accepted by the human; a non-stale plan brief exists.
- Permissions: **write (git mv), strongly guarded, human-gated**.
- Spawns child: no.
- Artifact: the move itself; no brief.
- Reports: the precondition check results, then asks for explicit confirmation, then performs `git mv`.
- Failure modes: race with a stale `/tk-status` — re-checks `ongoing/` emptiness immediately before the move, not from memory.

**`/tk-implement`**
- Purpose: implement the single active ticket, within scope.
- Args: none (operates on whatever is in `ongoing/`).
- Preconditions: exactly one ticket in `ongoing/`; a non-stale plan brief exists.
- Permissions: **full write** (`edit, write, bash`) — this is the orchestrator itself (or a dedicated foreground session), not an advisory child.
- Spawns child: no.
- Artifact: code changes + an appended implementation log on the ticket.
- Reports: files changed vs. the plan's files-to-touch list (early scope-creep signal).
- Failure modes: scope creep, multi-concern drift — bounded by loading *only* the active ticket + its plan as the task spec and by the verify step.

**`/tk-verify`**
- Purpose: check the working changes against the active ticket's acceptance criteria and plan.
- Args: none.
- Preconditions: one ticket in `ongoing/`; uncommitted changes exist.
- Permissions: read-only; **spawns read-only child**. (Orchestrator first runs `git diff > tickets/_briefs/<id>.diff` so the read-only child can read the diff without needing `bash`.)
- Spawns child: yes.
- Artifact: `tickets/_briefs/<id>.verify.md` — each acceptance criterion marked PASS / FAIL / UNCERTAIN, plus a **scope-creep list** (changed files not in the plan).
- Reports: pass/fail summary + scope-creep flags. Gates the commit.
- Failure modes: criteria not mechanically checkable — child marks UNCERTAIN and asks the human rather than guessing PASS.

**`/tk-complete <id>`**
- Purpose: finalize a verified ticket.
- Args: `<id>`.
- Preconditions: verify brief shows all criteria PASS (UNCERTAINs resolved by human); human approves.
- Permissions: **write + commit, human-gated**.
- Spawns child: no.
- Artifact: verification + log merged into the ticket; `git mv ongoing/ → completed/`; one commit whose message includes the ticket ID.
- Reports: the exact commit it will make; waits for "yes."
- Failure modes: non-atomic commit — enforced by committing exactly once, only the ticket's files + the staged changes, with the ID in the subject.

**`/tk-reject <id> "<reason>"`**
- Purpose: record an intentional non-implementation.
- Args: `<id>`, `<reason>`.
- Preconditions: human-initiated.
- Permissions: write, human-gated.
- Spawns child: no.
- Artifact: ticket moved to `rejected/` with the reason appended.
- Reports: confirmation.
- Failure modes: none significant.

---

## 4. Artifact design

**Location.** Authoritative ticket files stay exactly where they are: `tickets/<state>/<id>.md` — the directory is the state, unchanged. Advisory briefs live in `tickets/_briefs/<id>.<kind>.md`. The leading underscore keeps the briefs directory visibly *outside* the five state directories, so a brief can never be mistaken for a ticket-in-a-state. The workflow rules live in `tickets/WORKFLOW.md` (or `docs/`), and a condensed guardrail copy lives in `AGENTS.md` so every Pi session (orchestrator *and* child) loads it automatically.

**What's authoritative vs. advisory.** The ticket file and its directory are the single source of truth — always. Briefs are *regenerable advice*. Rule of thumb: if deleting the file would lose a human decision, it's authoritative; if deleting it just means re-running a command, it's advisory. Therefore readiness briefs and plan briefs are advisory/regenerable (safe to gitignore). The **verification brief and the plan, at completion time, get merged into the ticket itself** — because the workflow already requires that "verification must be recorded" and "decisions must be documented." That mapping is deliberate: the durable record the workflow wants *is* the distilled brief content, living inside the completed ticket where git is the truth.

**Schemas (all inline frontmatter; `ticket_sha` is the staleness key):**

Readiness brief:
```markdown
---
kind: readiness
ticket_id: T-0142
ticket_sha: 9f2a...        # git hash-object of the ticket at generation time
generated_at: 2026-06-24T10:30:00Z
generated_by: pi -p (read-only child)
model: anthropic/claude-...
verdict: NOT-READY          # READY | NOT-READY
---
## Gaps
- acceptance criteria: absent
- dependencies: ticket assumes module X exists; not found in repo
## Suggested split
- none
## Open questions for human
- Is X in scope or a prerequisite ticket?
```

Implementation plan:
```markdown
---
kind: plan
ticket_id: T-0142
ticket_sha: 9f2a...
generated_at: ...
verdict: PLANNED
---
## Steps
1. ...
## Files to touch
- src/foo.ts (modify)
- test/foo.test.ts (add)
## Out of scope (do NOT touch)
- src/unrelated/*
## Risks / ambiguities
- ...
## Verification steps
- run `npm test`; assert ...
```

Verification brief:
```markdown
---
kind: verify
ticket_id: T-0142
ticket_sha: 9f2a...
diff_sha: 4c1e...           # hash of the diff that was reviewed
generated_at: ...
result: FAIL                # PASS | FAIL | UNCERTAIN
---
## Acceptance criteria
- [PASS] criterion 1 — evidence: test/foo.test.ts:22
- [FAIL] criterion 2 — not implemented
## Scope-creep (changed files not in plan)
- src/unrelated/bar.ts   <-- investigate
```

Optional command log: a single append-only `tickets/_briefs/_log.md` line per command run (`timestamp · command · ticket · child? · verdict · brief path`). Useful for the premortem's early-warning signals; skip it in v1 if you want zero extra moving parts.

**Avoiding stale artifacts.** Every brief records `ticket_sha` (the `git hash-object` of the ticket at generation time). Before *any* command relies on a brief, the orchestrator recomputes `git hash-object tickets/<state>/<id>.md` and compares. Mismatch ⇒ the ticket changed since the brief ⇒ the brief is stale ⇒ the orchestrator refuses to use it and re-runs the analysis. The verify brief additionally pins `diff_sha`, so editing code after verification invalidates the verification automatically. This is fully inspectable: a human can run the same `git hash-object` and see for themselves.

---

## 5. Guardrails and safety

**Children can't mutate the project — structurally, not by politeness.** Every advisory child is spawned read-only:
```bash
pi -p --no-session --no-approve \
   --tools read,grep,find,ls \
   --append-system-prompt "Read-only advisory analyst. Emit only the requested Markdown brief. You have no write or shell tools." \
   @tickets/WORKFLOW.md @tickets/<state>/<id>.md \
   "<task + required output schema>"
```
No `write`/`edit`/`bash` tool means there is no code path by which the child can change a file. This is the load-bearing guarantee.

**No recursive spawning — three independent stops.** (1) Read-only children have no `bash`, so they can't run `pi` at all. (2) `--no-approve` makes them ignore project-local prompt templates and extensions, so they don't even *have* the `/tk-*` commands. (3) Defense-in-depth for any future child that *does* get `bash`: the orchestrator exports `PI_TK_CHILD=1` before spawning, and every `/tk-*` template's first instruction is "if `$PI_TK_CHILD` is set, refuse and exit." Any one of these suffices; together they're robust.

**Only one ticket in `ongoing/`.** v1: `/tk-activate` and `/tk-implement` run `test "$(ls tickets/ongoing | wc -l)" -eq 0` (activate) / `-eq 1` (implement) as a precondition *immediately before acting*, never from a remembered state. If this invariant is ever actually violated in practice, that's the single best candidate to harden into a TypeScript extension that hooks the write/bash-permission event and hard-refuses any `git mv` targeting `ongoing/` when it's non-empty (Pi ships example `permission-gate` and `protected-paths` extensions to copy from).

**Implementation can't exceed scope.** The implement step loads *only* `tickets/ongoing/<id>.md` + its plan as the spec, and the plan carries an explicit "Out of scope — do NOT touch" list. Verify then diffs changed files against the plan's files-to-touch list and flags extras as scope-creep. Two-sided: scope is declared up front and audited after.

**Atomic commits.** Exactly one commit per ticket, made only by `/tk-complete`, only after a PASS verification, with the ticket ID in the subject line. The template stages the intended files and shows the human the precise commit before running it. One ticket → one focused commit is preserved because nothing else commits.

**Failed/partial child runs.** Children are ephemeral (`--no-session`) and produce no side effects, so a failed child leaves the repo untouched — the orchestrator simply reports the failure and writes no brief (or marks the brief `verdict: ERROR`). Because the brief is the *only* output and it's written by the orchestrator after the child exits cleanly, a half-finished child can never leave a half-written brief that looks authoritative. For `/tk-implement` (the one write-heavy step that isn't a child): if it dies mid-way, the changes are uncommitted working-tree edits — `git diff` shows exactly what happened and `git checkout` reverts. Nothing is committed until `/tk-complete`.

---

## 6. Child-session prompt design

**Pattern: pinned context in, structured Markdown out, nothing else.** Each child prompt has four parts — (1) a one-line role lock ("read-only advisory analyst, emit only the brief"), (2) the task, (3) the *exact* output schema it must fill (the frontmatter + sections from §4), (4) the inputs.

**Embed directly in the prompt (via `@file` and inline text):** the workflow rules (`@tickets/WORKFLOW.md`), the specific ticket (`@tickets/<state>/<id>.md`), and — for verify — the pre-generated diff (`@tickets/_briefs/<id>.diff`). Embedding these guarantees the child judges against the real, current text and isn't reconstructing it from memory.

**Let the child discover via read-only inspection:** whether referenced files/modules/APIs actually exist, what the surrounding code looks like, whether tests are present. This is exactly what `read/grep/find/ls` are for, and it's why the child gets those tools rather than having everything pre-stuffed — pre-stuffing the whole repo would defeat the context-savings goal.

**Output structure: highly structured, schema-locked.** The child must return the frontmatter block plus the named sections, and nothing before or after. Constrain verdicts to a closed vocabulary (`READY|NOT-READY`, `PASS|FAIL|UNCERTAIN`). Forbid prose preambles. This makes the orchestrator's parsing trivial and the brief diffable. Critically, instruct the child that **UNCERTAIN is a valid, encouraged answer** — a child that can't mechanically confirm a criterion should say so and raise a question, never guess PASS. That single instruction prevents most false-confidence failures.

---

## 7. Human-in-the-loop checkpoints

**The human must explicitly approve:** every state transition (`backlog→planned`, `planned→ongoing`, `ongoing→completed`, `→rejected`), every write that creates or rewrites a ticket (refine/split), and the commit. The pattern is always "orchestrator proposes the exact action + shows preconditions → human says yes → orchestrator acts."

**The orchestrator must never decide alone:** whether a ticket is *truly* ready (it can recommend READY; the human ratifies the move), whether to accept an unresolved dependency, whether an UNCERTAIN acceptance criterion counts as met, whether to split a ticket, and when to commit. The orchestrator's authority ends at "analyze, propose, and report"; mutation authority is the human's.

**Surfacing not-ready states.** When a brief comes back NOT-READY or with UNCERTAINs, the orchestrator doesn't silently loop or auto-fix — it presents the specific gaps and the open-questions list and stops, asking the human to answer or to authorize `/tk-refine`. Questions are surfaced as a short explicit list ("2 blockers before this can be planned: …"), never buried. The default on ambiguity is *stop and ask*, because the failure mode you most want to avoid is confident wrong automation.

---

## 8. Incremental implementation plan

Each of these is sized for the existing workflow. The first is deliberately tiny.

**Ticket 1 — Workflow guardrails + briefs scaffold (foundation).**
- Objective: establish the substrate every command depends on.
- Scope: add `tickets/WORKFLOW.md` (the rules, in English); add condensed guardrails to `AGENTS.md` (read-only child spawn flags, single-ongoing invariant, "children emit briefs only"); create `tickets/_briefs/.gitkeep`; gitignore `tickets/_briefs/*.readiness.md`, `*.plan.md`, `*.diff`.
- Acceptance criteria: `WORKFLOW.md` documents the five states and all transition rules; `AGENTS.md` contains the canonical child-spawn command and the `PI_TK_CHILD` recursion stop; `_briefs/` exists and ephemeral briefs are gitignored.
- Likely files: `tickets/WORKFLOW.md`, `AGENTS.md`, `.gitignore`, `tickets/_briefs/.gitkeep`.
- Dependencies: none.
- Verification: open the files; confirm a fresh Pi session loads `AGENTS.md` and shows the guardrails at startup.

**Ticket 2 — `/tk-status` (no child).**
- Objective: live state snapshot + invariant check.
- Scope: `.pi/prompts/tk-status.md` that lists each state dir, names the `ongoing/` ticket, flags 0/>1 in ongoing.
- Acceptance: running `/tk-status` prints counts per state and a clear flag if the single-ongoing invariant is broken.
- Files: `.pi/prompts/tk-status.md`.
- Dependencies: Ticket 1.
- Verification: create a temp second file in `ongoing/`; `/tk-status` flags it; remove it.

**Ticket 3 — `/tk-readiness <id>` (first read-only child + provenance).**
- Objective: prove the child-spawn + brief + staleness pattern end-to-end.
- Scope: `.pi/prompts/tk-readiness.md`; spawns the read-only child; orchestrator writes `tickets/_briefs/<id>.readiness.md` with `ticket_sha`; staleness re-check helper documented in `AGENTS.md`.
- Acceptance: on a sample backlog ticket, produces a schema-valid readiness brief with a verdict; editing the ticket and re-checking detects the brief as stale.
- Files: `.pi/prompts/tk-readiness.md`, (brief output).
- Dependencies: Tickets 1–2.
- Verification: run on a deliberately incomplete ticket → NOT-READY with correct gaps; confirm child had no write/bash tools (inspect the spawned command).

**Ticket 4 — `/tk-plan <id>`.** Same child pattern; emits plan brief with files-to-touch + out-of-scope. Depends on Ticket 3. Verify: plan only cites files that exist.

**Ticket 5 — `/tk-verify`.** Orchestrator generates the diff to a file, read-only child grades acceptance criteria + flags scope-creep. Depends on Tickets 1, 4. Verify: a diff that misses a criterion yields FAIL; an out-of-plan file edit is flagged.

**Ticket 6 — Transition checklists (`/tk-activate`, `/tk-complete`, `/tk-reject`) as guarded, human-gated templates.** Each embeds its precondition shell check and an explicit confirmation gate before any `git mv`/commit. Depends on Tickets 1, 5. Verify: activate refuses when `ongoing/` non-empty; complete refuses without a PASS verify brief; commit message contains the ticket ID.

(Refine/split and any extension-hardening of single-ongoing come *after* these prove out.)

---

## 9. Premortem

**Assume it's a month later and the system was quietly abandoned. The most likely causes:**

- **Briefs went stale and got trusted anyway.** Someone edited a ticket, skipped the `ticket_sha` recheck, and implemented against an old plan. Early warning: briefs whose `ticket_sha` no longer matches their ticket; verification FAILs that trace back to an outdated plan. Mitigation already in design: mandatory hash recheck before any brief is used, and `diff_sha` pinning on verify.
- **The orchestrator started skipping the human gates** because confirming every move felt like friction, so it began auto-moving tickets — until it auto-activated the wrong one or committed mid-task. Early warning: commits that don't correspond to a `/tk-complete`, or `ongoing/` containing two tickets. Mitigation: keep the gates in `AGENTS.md` as hard "never" rules, and harden single-ongoing into an extension at the first violation.
- **Children gave confident-but-wrong PASS verdicts**, eroding trust until the human stopped reading briefs. Early warning: a verify brief said PASS but the human found the criterion unmet. Mitigation: the UNCERTAIN-is-encouraged instruction, and requiring evidence (file:line) for each PASS.
- **Template sprawl.** The four commands became fifteen, each slightly different, and nobody remembered which to run. Early warning: prompt templates duplicating each other; commands no one invokes (visible in the optional `_log.md`). Mitigation: cap the command set; delete unused templates; keep the child-spawn logic in *one* place (`AGENTS.md`), not copied per template.
- **The child harness cost more context than it saved** — spawning, capturing, writing, and re-reading briefs added overhead for tickets small enough to just do inline. Early warning: the human bypassing commands and working directly. Mitigation: only `readiness`/`plan`/`verify` spawn children; everything trivial stays inline (`/tk-status` needs none).

---

## 10. Critique and alternatives

**Self-critique.** The biggest weakness is that prompt templates are *just text expansion* — they can't enforce anything. Every precondition ("ongoing is empty," "brief isn't stale") is enforced only insofar as the orchestrator agent faithfully runs the embedded shell check and obeys the instruction. That's inspectable but not *guaranteed*; a sufficiently distracted model could skip a check. The honest mitigation is that the only truly dangerous actions (writes, commits, moves) are also human-gated, so a skipped check still hits a human stop — but I'd flag single-ongoing as the one invariant that deserves real code enforcement sooner rather than later.

**Possibly over-engineered:** the command-log file, the readiness *and* refine *and* plan separation (readiness and plan could be one `/tk-assess` for a solo dev), `--mode json` child parsing (plain `-p` exit codes are probably fine for a long time), and per-kind brief schemas (one generic brief schema with a `kind` field would do). The `_briefs/` provenance machinery is worth keeping; the rest can be collapsed.

**Possibly too weak:** single-ongoing enforcement (text, not code), and scope-creep detection (a heuristic file-list diff, not a real guarantee — a model can still edit an in-scope file in an out-of-scope way). Verification of "acceptance criteria met" is fundamentally only as good as how mechanically checkable the criteria are; vague criteria yield vague verdicts.

**One simpler alternative.** Drop child sessions entirely for v1. Ship just `tickets/WORKFLOW.md` + `AGENTS.md` guardrails + a handful of plain prompt templates that the *orchestrator itself* executes (read the ticket, assess, plan, verify — all inline). You lose the context-isolation benefit but gain radical simplicity, and you learn which rituals actually repeat before investing in the child harness. For a single developer this might genuinely be enough.

**One more ambitious alternative.** A real TypeScript extension that registers `/tk-*` as first-class commands, enforces single-ongoing and protected-path invariants by hooking Pi's permission/tool events (so violations are *impossible*, not just discouraged), spawns advisory children via the SDK with structured `--mode json` parsing, and writes briefs with guaranteed provenance. Bundle it as a Pi package so it's installable and shareable. This is where you'd go if the workflow outgrows one repo — but it's months of maintenance you shouldn't sign up for until the cheap version has proven the design.

---

## 11. Agent behavior recommendations

**As the orchestrator AI:** I'd treat myself as a dispatcher and recordkeeper, not an autonomous operator. Concretely: run `/tk-status` at the top of any workflow session to ground myself in live state rather than memory; never act on a brief without rechecking its `ticket_sha`; delegate every context-heavy read to a read-only child so my own window stays lean and focused on the conversation and the decisions; show the human the *exact* command or `git mv`/commit before doing it and wait for a real "yes"; and when a brief returns NOT-READY or UNCERTAIN, stop and surface the specific questions instead of trying to resolve them myself. I'd keep my context budget for *judgement and dialogue*, and push *reading* outward.

**As a child AI:** I'd constrain myself hard. I have read-only tools and one job — produce the requested brief in the exact schema, and nothing else. No prose preamble, no offers to do more, no attempts to fix what I find. I only cite files I actually read, with file:line evidence. When I can't mechanically confirm something, I mark it UNCERTAIN and raise a question rather than guessing — a wrong PASS is far more harmful than an honest UNCERTAIN. I assume my output will be parsed by a machine and read by a human who will *act* on it, so precision and calibrated confidence matter more than sounding decisive.

**What would make either role fast, reliable, and useful:** the workflow rules and guardrails always present in `AGENTS.md` (so every session, parent and child, starts aligned); the ticket itself passed in directly rather than reconstructed from memory; a closed output vocabulary so verdicts are unambiguous; provenance hashes so staleness is detectable instead of assumed; and a small, stable command set whose write actions are all human-gated — so the system can be trusted precisely *because* its automation is narrow, inspectable, and reversible, with git as the final source of truth.