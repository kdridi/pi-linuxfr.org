```markdown
You can use this workflow reliably, but not quite **safely** as-is. It is close to a good Pi-native MVP, yet it still leaves a few operational ambiguities that will cause repeated agent mistakes across cold sessions, especially around ticket selection, readiness, and mid-ticket interruption handling. [page:1][page:2]

## Agent verdict

As a fresh Pi coding agent, I would immediately understand the core model: tickets are plain Markdown files, directory location is the workflow state, only one ticket may be active, and the ticket file itself is the durable handoff artifact between separate sessions. [page:1] I would also understand why this exists in Pi specifically: Pi persists sessions and supports resume, fork, clone, compaction, and export, but it intentionally keeps workflow management minimal and pushes project behavior into files and extensions rather than built-in planning features. [page:1][page:2]

What remains ambiguous is not the philosophy but the operating edge cases. I still do not know who is allowed to choose the next planned ticket when several exist, what to do when `planned/` contains multiple equally ready items, whether priority has any decision power, whether a ticket can be moved to `ongoing/` before code changes but after initial investigation, and how much rewriting of a ticket is acceptable once implementation has started. [page:1][page:2]

## Fit to Pi

This workflow fits Pi well because it assumes only capabilities Pi already has by default or by simple project practice: reading files, editing files, shell commands, local git history, and file-based project instructions via `AGENTS.md`. [page:1] It also matches Pi's stated design principle that the core stays small and workflow-specific behavior should live in extensions, skills, prompt templates, packages, and project files rather than in mandatory built-in task management. [page:1]

It also makes good use of Pi's weak spots. Pi sessions are automatically saved and can be resumed, forked, cloned, compacted, and exported, but those are session mechanisms rather than project-state mechanisms, so durable file-based tickets are a sensible complement for cross-session continuity. [page:1][page:2] The chosen workflow correctly avoids assuming built-in to-dos, plan mode, sub-agents, permission popups, or background workflow orchestration, which Pi explicitly does not provide by default. [page:1]

## Directory model

The state model is mostly right. `backlog`, `planned`, `ongoing`, `completed`, and `rejected` are enough for a minimal manual workflow, and I would not add more states yet because extra directories would likely create false precision instead of clarity. [page:1]

The only directory I would seriously consider adding later is `blocked/`, but not now. Right now, keeping blocked work inside `ongoing/` with a clear log entry is acceptable; however, if six months from now tickets sit half-done for days, `ongoing/` will become misleading because “currently active” and “currently stuck” are different operational realities. [page:2] For the current MVP, no directory is clearly unnecessary, though `rejected/` will only stay useful if superseded and obsolete tickets are documented tersely instead of becoming a graveyard of abandoned prose. [page:1]

The names are mostly good for both humans and agents. `planned` is slightly weaker than `ready` for an AI because “planned” can still sound unspecific, whereas the README defines it as implementation-ready, but this is a naming nit, not a design flaw. [page:1]

## README review

The README is strong on principles and better than average on transition semantics. It clearly explains that directory location is state, that transitions require metadata updates and log entries, and that each state changes what the next session is allowed to assume. [page:1]

Its main problem is that it is a little too long in the wrong places and still under-specified in a few practical ones. The “why” and “state meaning” sections are durable, but the cold-session operational rules should be even more explicit than the philosophy because Pi agents read `AGENTS.md` and local files at startup and then act from that context under time pressure. [page:1]

### What is clear

- One active ticket maximum. [page:1]
- `backlog/` can stay vague. [page:1]
- `planned/` must satisfy a real definition of ready. [page:1]
- `completed/` requires implementation, verification, and commit linkage. [page:1]
- Superseded parent tickets belong in `rejected/`, not `completed/`. [page:1]

### What is still weak

- Ticket selection is underspecified: the workflow says inspect `planned/`, but not how to choose among multiple ready tickets without user direction. [page:1]
- Priority is present in the template but not operationalized in the README, so agents will either ignore it or over-trust it. [page:1]
- “Record the final commit identifier when practical” is reasonable, but “when practical” is fuzzy enough that different sessions will apply it differently. [page:1]
- “Append useful handoff notes as work progresses” is correct but vague; agents need a minimum standard for what counts as a useful handoff note. [page:1]
- The dependency procedure is conceptually sound but still light on exact linking format, so references may drift into inconsistent prose. [page:1]

### What is missing

- A deterministic activation rule, for example: “Do not pick a planned ticket yourself unless the user names it or there is exactly one planned ticket at the highest priority with all dependencies completed.” This single rule would prevent a lot of accidental autonomy.
- A pause rule. Right now “leave the ticket in ongoing if work stops mid-ticket” is good, but there is no explicit distinction between paused, blocked, and actively in progress. That will make `ongoing/` semantically noisy over time.
- A corruption repair rule beyond “stop and report corruption.” There should be a minimum recovery action, such as listing the conflicting files and proposing the smallest safe fix without moving anything automatically.
- A filename convention statement. The ID convention exists, but you should say the ticket filename must be exactly `<ID>.md` so agents do not invent variants like `PLF-001-short-title.md`.

## Template review

The template is close to minimal-sufficient, but a few fields are carrying more promise than the workflow actually uses. The strongest fields are `id`, `title`, `status`, `created`, `updated`, `dependencies`, `Objective`, `Scope`, `Acceptance Criteria`, `Verification`, `Resolution`, and `Log` because they directly support cold-session implementation and resumability. [page:1]

The weak point is mismatch between field strictness and state strictness. The template is one-size-fits-all, while the workflow allows vagueness in backlog and requires precision in planned and ongoing, so the template should say which fields may stay skeletal in `backlog/` and which become mandatory before `planned/`. [page:1]

### Useful fields

- `status`: Needed because directory and frontmatter should agree. [page:1]
- `dependencies`: Needed for activation safety. [page:1]
- `Acceptance Criteria`: The most important readiness control. [page:1]
- `Verification`: Critical for cold-session completion. [page:1]
- `Files Changed`: Useful at completion and mid-ticket handoff. [page:1]
- `Decisions` and `Log`: Valuable for resumability across compaction and separate sessions, which Pi supports but does not turn into project memory by itself. [page:1][page:2]

### Redundant or weak fields

- `priority`: Potentially useful, but currently underdefined. If you keep it, define how it influences selection; otherwise it becomes decorative.
- `estimated_complexity`: Likely too subjective to be reliable. “small | medium | large” will drift quickly and may create false confidence.
- `type`: Fine for filtering, but not operationally important unless you plan to query by it.

### Missing or should be strengthened

- Add a `blocked_by` or `blocked_reason` field only if you do not add a `blocked/` directory later; otherwise interruption state will remain implicit.
- Add a `selected_by` or `activation_reason` line in the log, not frontmatter, so future sessions know whether the user explicitly chose the ticket or the agent selected the only ready one.
- Add a rule that `Files Changed` may be empty in backlog/planned but must be filled before completion.
- Add a minimum log schema, for example: timestamp, actor, action, short reason, next step. That makes handoff notes more machine-readable without adding automation.

## AGENTS.md review

The ticket guidance in `AGENTS.md` is almost the right amount. It correctly tells the agent to read `tickets/README.md`, inspect `ongoing/` first, and continue only the active ticket unless the user explicitly changes direction. [page:1]

What `AGENTS.md` still needs is one more sentence about planned-ticket selection. Since Pi loads `AGENTS.md` at startup from the working directory and parent directories, this is exactly the right file for one short hard rule that prevents autonomous ticket choice drift. [page:1] I would add: “If no ticket is ongoing and more than one planned ticket exists, do not activate one without explicit user choice unless the README defines a deterministic selection rule.” [page:1]

There is no major conflict between the ticket workflow and the MVP/change-discipline guidance. In fact, they reinforce each other: the repository wants small, inspectable, bounded work, and the ticket workflow is also built around atomic changes and focused commits. [page:1] The only mild tension is that the ticket system may encourage administrative completeness even when the repository's broader philosophy says to keep things minimal, so you should guard against overfilling ticket prose for trivial work. [page:1]

## Smallest changes

Adjust lightly, not redesign. The system is structurally sound; it mainly needs sharper operational rules.

### Must-change

1. Define planned-ticket selection explicitly.
   - Add to `tickets/README.md`: “If multiple tickets are in `planned/`, do not choose one implicitly unless the user names it or exactly one ticket is unblocked at the highest priority.”
2. Define filename convention explicitly.
   - Add: “Ticket filenames must be exactly `<ID>.md`.”
3. Define backlog vs planned field expectations in the template or README.
   - Add a short rule: backlog may omit full scope/verification detail; planned and ongoing may not.
4. Define minimum handoff log content.
   - Add: “Each substantive log entry should include what changed, current status, blockers if any, and the next intended step.”
5. Either operationalize `priority` or remove it.
   - Right now it invites inconsistent use.

### Nice-to-have

1. Rename `planned` to `ready` only if you want stronger semantics for both humans and agents.
2. Drop `estimated_complexity` unless you later prove it helps splitting.
3. Add a lightweight “blocked in ongoing” convention, such as `status: ongoing` plus a required `Notes` or `Log` entry beginning with `Blocked:` rather than adding a new directory yet.
4. Add one inline example each for:
   - a good backlog ticket,
   - a ready planned ticket,
   - a superseded rejected parent.
   Short examples reduce interpretation variance more than another paragraph of rules.

## Can I work with this?

Yes, I could follow this workflow as-is. [page:1] It is good enough to run real repository work without built-in Pi project-management features because Pi already supports file reading, editing, shell use, session persistence, resume, fork, clone, compaction, and export, while the tickets provide the missing durable project-state layer. [page:1][page:2]

The mistakes I would still be likely to make are predictable:
- Activating the wrong planned ticket when several are present.
- Treating `priority` as meaningful even though the README does not define its force.
- Writing logs that are too terse to help the next session.
- Leaving `ongoing/` semantically overloaded between “actively being worked” and “paused until clarification.”
- Over-updating ticket prose during implementation instead of preserving a stable scope contract.

## Pre-mortem

If this becomes counterproductive in six months, the first thing that probably went wrong is that the “only one ticket in ongoing” rule stayed formally true while actual work began leaking outside tickets. The repository would then have clean-looking directories but poor correspondence between ticket state and real code history. [page:1]

The first ignored rule will probably be the definition of ready. Teams often move tickets into `planned/` too early because writing acceptance criteria feels slower than starting code, and then every cold session reconstructs missing intent from git diffs and chat history instead of the ticket. [page:1][page:2]

The noisiest directory will probably be `backlog/` first, then `completed/`. `backlog/` will accumulate vague ideas that were never refined or rejected, and `completed/` will become misleading if tickets are amended too much after closure or if commit links are missing. [page:1]

The part most likely to become ceremony without value is the manual metadata updating. If `updated`, `status`, `Files Changed`, `Resolution`, and `Log` are not clearly useful in actual handoffs, agents will half-maintain them, which is worse than not having them. [page:1]

The ambiguity most likely to cause repeated agent mistakes is selection authority: who decides what to activate next, based on what rule. Pi can resume and branch sessions well, but that does not answer project-priority questions, so the workflow needs to answer them in files. [page:1][page:2]

### Early warning signs

- Multiple planned tickets all look “ready” but none says why it should be next.
- Ongoing tickets contain “need clarification” notes for several sessions in a row.
- Completed tickets often lack commit identifiers or verification notes.
- Backlog tickets become long essays instead of concise future work units.
- Agents keep asking the same scoping questions that prior tickets should already answer.

### Minimal guardrails

- Refuse activation when more than one unblocked planned ticket exists without an explicit user choice or deterministic priority rule.
- Refuse activation when `Acceptance Criteria` or `Verification` is still placeholder text.
- Require one meaningful log entry whenever a session stops with the ticket still in `ongoing/`.
- Periodically prune or reject stale backlog tickets instead of letting backlog become a memory dump.

## Final recommendation

Adjust lightly. The chosen workflow is fundamentally compatible with Pi's minimal, file-first model and is already better than relying on session memory alone, but it needs a few tighter rules to become reliably agent-operable across many separate sessions. [page:1][page:2]

### Ranked changes

1. Define deterministic planned-ticket activation rules.
2. Clarify backlog-vs-planned required content.
3. Make handoff log quality explicit.
4. Either define or remove `priority`.
5. Consider trimming `estimated_complexity`.
6. Only later, if `ongoing/` becomes misleading, introduce a blocked convention or `blocked/` state.

### Recommended version

- Keep the five-directory model.
- Keep state-by-directory as the source of truth.
- Keep one active ticket maximum.
- Tighten activation and handoff rules.
- Reduce template fields that are not operationally enforced.
- Do not add automation yet, except possibly a future lightweight validator for one-ongoing-only, unique IDs, and required sections in planned/ongoing if manual drift appears. [page:1]
```