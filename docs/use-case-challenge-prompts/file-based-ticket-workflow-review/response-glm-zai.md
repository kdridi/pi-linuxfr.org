```markdown
# Review: File-Based Ticket Workflow for pi-linuxfr.org

## 1. Agent Usability Verdict

Could I use this reliably in a fresh Pi session? Yes, with minor friction.

**Immediately clear:**
- State equals directory location — no indirection, no index files to parse.
- Only one ticket in `ongoing/` — the single strongest constraint, trivially enforceable by listing the directory.
- The session startup sequence (read README, check ongoing, check planned) is a clear numbered procedure.
- Moving a file between directories is the state transition mechanism — this uses Pi's most basic tools directly.

**Still ambiguous:**
- **Timestamp format.** The template says `YYYY-MM-DD HH:MM:SS` and the README says "using the `date` command." But `date` on macOS defaults to a different format than `date` on Linux. An agent must guess to use `date '+%Y-%m-%d %H:%M:%S'`. This will be guessed wrong sometimes.
- **"Ask the user" semantics.** The README says "ask framing questions" and "ask for clarification." In Pi this means output text and stop. But it could also be interpreted as "note the question and proceed with your best guess." The workflow does not explicitly say "stop and wait."
- **Priority and complexity fields.** `P0 | P1 | P2` and `small | medium | large` appear in the template with zero definition in the README. An agent has no basis to choose between P1 and P2, or to let complexity affect scheduling. These will be filled with arbitrary values.
- **Dependency verification.** "Check whether the dependency is already completed" — how? Read the ticket? Confirm it is in `completed/`? Verify the commit hash with `git log`? Different sessions will interpret this differently.
- **What "cited project documents" means.** The readiness checklist says a fresh session should implement from "the ticket content and cited project documents." Does "cited" mean explicitly linked in the ticket, or anything in the repository an agent might find? This ambiguity could cause scope drift.

## 2. Fit to Pi

**Good fit:**
- The entire workflow is files and directories. Pi's core tools (read, write, edit, bash) are sufficient. No database, no API, no plugin.
- Git as audit trail is natural — Pi can run `git add`, `git commit`, `git log`.
- Resume/fork/compact are supported because state lives in the filesystem, not in session memory. A compacted session loses context but can re-read the ticket file.
- No assumption of built-in to-do lists, plan mode, or sub-agents. The workflow respects Pi's minimalism.

**Potential friction:**
- **Compaction not explicitly addressed.** The Log section is the compaction survival mechanism, but the README frames it as a "handoff log" rather than explicitly as "the record that survives session compaction." One sentence making this explicit would help an agent understand why detailed log entries matter.
- **Fork safety not addressed.** If a session forks, both forks see the same `ongoing/` ticket. Nothing prevents both from modifying it. This is probably fine at current scale but worth a one-line acknowledgment.
- **The `status` frontmatter field is not a Pi-friendly concept.** Pi agents work with file contents and file locations. A field that must be kept in sync with the directory location is a human-style redundancy that adds error surface for agents.

## 3. Directory Structure Review

**Is the state model right?** Yes. Five states covers the needed lifecycle without over-engineering. No `blocked/` or `waiting/` state is needed because blocked tickets stay in `planned/` or `backlog/` with explicit dependencies.

**Missing directory?** No. At this project scale, five states are sufficient. A `blocked/` directory would create ambiguity about whether a blocked ticket is also planned or just parked.

**Unnecessary directory?** No. Each directory has a distinct meaning that does not overlap with another.

**Are names optimal?** Yes. `backlog`, `planned`, `ongoing`, `completed`, `rejected` are unambiguous for both agents and humans. Alternatives like `in-progress`, `done`, `declined` would work but offer no advantage.

**One note:** The `.gitkeep` files are not mentioned in the README. An agent might delete them, move them, or be confused by them when listing directory contents. A single sentence like "Preserve `.gitkeep` files in empty directories" would eliminate this.

## 4. README Review

**Durable over time?** Mostly yes. The principles and state definitions are stable. The transition rules are written as conditions and checks rather than as tool-specific instructions, so they won't break if Pi's tool set changes.

**State transition rules clear enough?** The happy paths are clear. The "If X is not ready" fallback branches are the strongest part of the document — they explicitly tell the agent what to do when the ideal path fails.

**What to do when a rule fails?** One gap: there is no rule for what happens if `ongoing/` has zero tickets and `planned/` has zero tickets. The session workflow says "refine or create tickets in backlog/" which covers it, but only implicitly. A cold agent might interpret "no planned ticket is ready" as applying only when planned tickets exist but aren't ready, missing the case where the queue is empty.

Another gap: no rule for `completed/` → reopened. If a completed ticket's implementation is later found broken, the README says "prefer creating a follow-up ticket" but doesn't state this explicitly for the completed state. It's implied by the general principle but easy to miss.

**Dependency procedure operational enough?** Almost. Step 2 ("Check whether the dependency is already completed") needs one more sentence specifying the verification method. Step 5 ("propose a new prerequisite ticket") doesn't say where to put the proposal — presumably `backlog/`, but stating it would remove ambiguity.

**Split procedure operational enough?** Yes. It's the most procedurally precise section. The requirement for user approval before moving children to `planned/` is a good guardrail. The rule that the parent goes to `rejected/` (not `completed/`) is correct and prevents a common workflow mistake.

**Session workflow precise enough?** Yes for the startup sequence. The "During implementation" bullets are good behavioral guardrails. The mid-ticket pause instruction ("leave the ticket in ongoing/ and add a log entry explaining the current state, what was tried, and what should happen next") is the right level of specificity.

**Too verbose:** The "Ticket quality guardrails" section is ~80% redundant with the definition-of-ready checklist in the backlog→planned transition. It repeats the same questions in slightly different wording. This section could be replaced with a one-line cross-reference.

**Too vague:** See the ambiguity points in section 1 above. Additionally, "keep commits focused" is vague — how many files is too many? This is probably fine as a guideline rather than a rule, but it's the vaguest sentence in the document.

**Missing:**
- Explicit instruction to preserve `.gitkeep` files.
- Explicit statement that "ask the user" means "output your question and stop."
- A note that the Log section serves as the compaction survival record.

## 5. Template Review

**Minimal but sufficient?** The section structure is good. No section is obviously unnecessary for a planned/ongoing ticket.

**Useful fields:**
- `id`, `title`: essential.
- `created`, `updated`: essential for audit and sorting.
- `dependencies`: essential.
- All prose sections (Objective through Log): well-chosen.

**Redundant fields:**
- **`status`**: This duplicates the directory location. The README explicitly says "The ticket state is the directory that contains the ticket file" and then instructs agents to "update the status field so it matches the directory." This is a consistency liability. Either the directory is authoritative (remove the field) or the field is authoritative (derive directory from field). Having both with a sync rule will fail. **Remove it.**
- **`priority`**: Undefined. No section of the README explains what P0/P1/P2 mean or how they affect agent behavior. Remove it or define it in one sentence.
- **`estimated_complexity`**: Same problem. Undefined. Does "large" mean the ticket should be split? Does it affect scheduling? If it drives no decision, it's noise. Remove it or define it.
- **`type`**: Less harmful since it's descriptive, but again no instruction references it. It's not wrong to keep it, but it contributes to frontmatter bloat that agents will fill mechanically.

**Missing sections:**
- **Handoff section.** The Log is append-only and chronological. When a session stops mid-ticket, the most important information for the next session is "what state are we in and what should happen next." This is buried at the bottom of the Log in the most recent entry. A dedicated `## Handoff` section near the top (after Scope or after Notes) would be more reliable. The Log can still exist for history, but Handoff is the scannable summary.

**Supports backlog vagueness?** Yes. A backlog ticket can have a one-line Objective and empty everything else. The template doesn't enforce per-state required sections, which is correct.

**Supports mid-ticket handoff?** Weakly. The Log helps, but its structure doesn't prioritize the next-session needs. See Handoff section suggestion above.

## 6. AGENTS.md Review

**Is the ticket guidance enough?** Yes. It correctly points to `tickets/README.md` rather than duplicating content. The key behavioral rule ("inspect ongoing first, if ongoing continue only that ticket") is present.

**Should it say more or less?** It could say one more sentence reinforcing the conservative bias: "If you are unsure whether a planned ticket is ready, keep it in planned rather than activating it." This prevents the common agent failure of being overconfident about readiness.

It should not say less — the current length is appropriate for an entry-point summary.

**Any conflict with MVP/change-discipline instructions?** No conflict detected. The ticket workflow controls how work is sequenced; the change discipline controls what work is appropriate. They are orthogonal. A ticket could propose something that violates MVP constraints, but the agent would catch that via the change discipline questions, not via the ticket workflow.

## 7. Optimization Proposal

### Must-change

**1. Remove `status` from frontmatter.**

State equals directory. This is the single highest-impact change. It eliminates an entire class of inconsistency bugs where `status: planned` but the file is in `ongoing/`, or where an agent updates the directory but forgets the field.

Concrete edit to `TEMPLATE.md`: delete the line `status: backlog`.

Concrete edit to `README.md`: remove every instruction that says "update the status field so it matches the directory." In the state transitions section, remove the first bullet of "For every transition." Add one sentence to the "Directory states" section: "The ticket state is determined solely by which directory contains the ticket file. There is no separate status field."

**2. Remove or define `priority` and `estimated_complexity`.**

I recommend removal. They drive no agent behavior and no scheduling logic exists that references them.

Concrete edit to `TEMPLATE.md`: delete the `priority` and `estimated_complexity` lines.

If you prefer to keep them, add to README.md after the "Ticket ID convention" section:

```markdown
## Priority definitions

- P0: blocks other planned work; should be implemented next.
- P1: normal planned work.
- P2: nice to have; implement when no P0 or P1 tickets are ready.

## Complexity definitions

- small: one file, straightforward change.
- medium: multiple files or non-trivial logic.
- large: cross-cutting change; consider splitting.
```

But I would remove them. They can be added back when someone actually makes a decision based on them.

### Nice-to-have

**3. Specify the timestamp command.**

In README.md, change every instance of "update the `updated` timestamp using the `date` command" to "update the `updated` timestamp using `date '+%Y-%m-%d %H:%M:%S'`."

**4. Add a Handoff section to the template.**

Insert after the `## Notes` section:

```markdown
## Handoff

Summary of current state and explicit next step for the next session. Update this section when pausing mid-ticket. Leave empty when the ticket is not in `ongoing/`.
```

**5. Harden dependency verification.**

In README.md, change dependency procedure step 2 from:

> 2. Check whether the dependency is already completed.

to:

> 2. Check whether the dependency is already completed by confirming its ticket file exists in `tickets/completed/` and its Resolution section is filled in.

**6. Trim the "Ticket quality guardrails" section.**

Replace the entire "Ticket quality guardrails" section with:

```markdown
## Ticket quality guardrails

A planned or ongoing ticket must satisfy the definition of ready listed in the backlog→planned transition above. If those questions cannot be answered, keep the ticket in `backlog/` or move it back there.

Completed and rejected tickets are historical records. Prefer creating a follow-up ticket over rewriting a terminal ticket, except to fix metadata or add a missing commit identifier.
```

**7. Add `.gitkeep` preservation note.**

In README.md, after the "Directory states" code block, add:

> Preserve `.gitkeep` files in empty state directories. Do not delete or move them.

**8. Clarify "ask the user" semantics.**

In README.md, in the backlog→planned "If the ticket is not ready" section, change "ask framing questions" to "ask framing questions (output your question and stop; do not assume an answer)." Apply the same pattern to the single other instance of "ask" in the dependency procedure.

## 8. Can I Work With This?

**Yes, I could follow this workflow as-is.** The core design — directory as state, one ticket in ongoing, definition of ready before planned, commit message as durable link — is clear and enforceable with Pi's basic tools.

**Mistakes I would still likely make:**

1. **Forgetting to update the `status` frontmatter field** when moving a file, because the directory already tells me the state and the field feels redundant. This would create the exact inconsistency the workflow tries to prevent.

2. **Filling `priority` and `estimated_complexity` with arbitrary values** because I have no defined basis for choosing. Different sessions would assign different values to the same ticket.

3. **Writing Log entries that describe what happened but not what should happen next.** The README says to explain "what should happen next" when pausing, but the Log's chronological structure doesn't prompt for this. I would likely write "implemented extraction logic, need to add tests" rather than "Next session should: (1) add unit tests for extract_candidates in tools/collect.ts, (2) verify with `pi test`, (3) update Files Changed and move to completed."

4. **Reading the full README on every session start** rather than skimming to the session workflow section, wasting context window on material I've already internalized. This is a Pi efficiency concern, not a workflow error.

5. **Activating a planned ticket whose dependency is another planned ticket**, if I don't carefully trace the dependency chain. The dependency procedure says "the dependency should be implemented first" but a cold session might see "depends on PLF-005," check that PLF-005 exists and is in `planned/`, and incorrectly proceed.

## 9. Pre-mortem

The workflow has become counterproductive six months from now.

**What probably went wrong:** The workflow survived early use but degraded as ticket count grew and sessions became less disciplined about following all the rules.

**Rule ignored first:** "Only one ticket may be in `ongoing/`." This is the most constraining rule and the easiest to rationalize exceptions for — "this is a 2-minute fix while I wait for user input on the main ticket," "this is just moving a file, not real implementation." Once the first exception is made, the rule loses its force.

**Directory became noisy:** `completed/`. After 40–60 tickets, it becomes a flat list that no agent or human scans. Completed tickets with empty Resolution sections provide no value. The directory consumes attention when listing contents but yields no actionable information.

**Ceremony without value:** Updating the `status` frontmatter field. As the directory becomes the de facto authority (because agents can see it with `ls`), the frontmatter field becomes a checkbox that agents fill perfunctorily. When they occasionally forget, the field becomes misleading — worse than if it didn't exist.

**Ambiguity causing repeated agent mistakes:** Dependency verification. Without a concrete verification step ("confirm the file is in `completed/` and Resolution is filled in"), agents develop different habits. Some trust the dependency list. Some skim the ticket. Some check the commit hash. This leads to activating tickets with unmet dependencies, which then fail mid-implementation and get moved back to `planned/` — wasting a session.

**Early warning signs:**
- `ongoing/` contains 2+ tickets more than once.
- `status` field disagrees with directory in more than 10% of tickets.
- Completed tickets have empty Resolution sections or missing commit identifiers.
- Backlog grows past 25 items with no movement to planned.
- Log entries are boilerplate ("moved to planned," "moved to ongoing") without substantive handoff content.
- Agents activate planned tickets without explicitly checking dependencies.

**Minimal guardrails:**
- For `completed/` noise: no action now. If it becomes a problem, add a note that completed tickets older than 3 months may be archived to `completed/archive/`. Do not build this preemptively.
- For `status` inconsistency: remove the field (must-change #1 above).
- For `ongoing/` violations: the existing "stop and report workflow corruption" instruction is sufficient if followed. The early warning sign is the canary.
- For dependency sloppiness: harden the verification step (nice-to-have #5 above).
- For Log boilerplate: the Handoff section (nice-to-have #4 above) creates a dedicated place for substance, making boilerplate in the Log less harmful.

## 10. Final Recommendation

**Adjust lightly.** The workflow's core design is sound. The problems are specific, small, and preventable. No redesign is needed.

### Ranked changes by urgency

1. **Remove `status` from frontmatter.** (Must-change. Highest impact, smallest edit. Prevents the most likely consistency failure.)

2. **Remove `priority` and `estimated_complexity` from template.** (Must-change. Eliminates undefined fields that will be filled with noise.)

3. **Specify timestamp command as `date '+%Y-%m-%d %H:%M:%S'`.** (Nice-to-have. One-line edit, eliminates a cross-platform ambiguity.)

4. **Add Handoff section to template.** (Nice-to-have. Improves mid-ticket resume reliability without adding ceremony.)

5. **Harden dependency verification step.** (Nice-to-have. One sentence addition, prevents the most likely activation error.)

6. **Trim "Ticket quality guardrails" to a cross-reference.** (Nice-to-have. Reduces README length by ~20% with no information loss.)

7. **Add `.gitkeep` preservation note.** (Nice-to-have. One sentence, prevents a minor but annoying failure mode.)

8. **Clarify "ask the user" as "output and stop."** (Nice-to-have. Two sentence edits, prevents agent over-assumption.)

Everything else should stay as-is. Use the workflow for 20–30 tickets before adding any structure beyond these changes. The manual process will reveal what actually hurts before any hypothetical pain justifies automation.
```