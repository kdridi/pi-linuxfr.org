```markdown
# Review of the Chosen File-Based Ticket Workflow for pi-linuxfr.org

**Perspective:** AI coding agent operating across many independent Pi sessions. The workflow must enable reliable cold-start resumption, strict scope adherence, clear handoff via files, and minimal cognitive load without assuming built-in Pi features like persistent memory, sub-agents, or automation.

## 1. Agent usability verdict

If dropped into a fresh Pi session I could use the workflow reliably for the core loop (inspect → implement scoped change → handoff), but with friction and risk of missteps on the edges.

**Immediately clear:**
- Directory names map directly to state and intention.
- Start every ticketed session by reading `tickets/README.md` then inspecting `tickets/ongoing/`.
- Only one active ticket is allowed; the Log section is the handoff mechanism.
- Git is the durable audit trail; commit messages carry the ticket ID.
- Backlog tickets can be vague; planned/ongoing tickets must be self-contained.

**Still ambiguous or risky:**
- Agency is unclear. The README repeatedly uses passive voice ("if a planned ticket is selected", "before moving a ticket", "ask framing questions"). In a cold Pi session it is not obvious whether I should autonomously choose a planned ticket and move it to `ongoing/`, only implement what the user explicitly places in `ongoing/`, or treat every state change as a human-only action. This is the single largest source of potential wrong behavior.
- "Definition of ready" checklist is good but subjective ("small enough", "self-contained enough for another Pi session"). An agent cannot mechanically verify "another Pi session could implement it" without trying.
- ID assignment procedure ("scanning all ticket directories") works for a tiny repo but has no canonical command; different agents may parse filenames differently and collide or skip numbers.
- When work stops mid-ticket the instruction is to leave it in `ongoing/` and append to Log. This is correct in principle, but the Log template gives no required structure for "current state + suggested resumption prompt", so handoff quality will vary.
- No explicit rule about whether the agent may run `mv` on ticket files. Because Pi provides `bash`, an over-eager agent could move files and create desync between directory location and the `status` frontmatter field.

Overall verdict: Usable today for disciplined small-MVP work, but the ambiguities around agency and selection will cause hesitation or incorrect assumptions on the first few sessions and repeated clarification requests to the user.

## 2. Fit to Pi

Excellent fit. The design directly leverages Pi's actual capabilities and deliberately avoids anything Pi does not provide by default.

- File-based state via directories is native to Pi's `read`/`edit`/`bash` tool set and to its resumable/forkable session model.
- No assumption of built-in to-dos, plan mode, memory across sessions, or sub-agents.
- Git as single source of truth for history aligns with Pi's minimalism.
- "Intentionally manual until painful" matches Pi's philosophy of adding extensions/tools only when the manual loop becomes the bottleneck.
- The workflow can later be extended with a `.pi/extensions/` tool (e.g., `ticket-status` or `next-id`) without changing the core contract.
- AGENTS.md correctly delegates detail to `tickets/README.md` instead of duplicating or contradicting it.

The only minor mismatch is that the README still contains some project-management-flavored language ("definition of ready", checklists before every transition) that feels heavier than Pi's usual lightweight style, even though the intent is minimal.

## 3. Directory structure review

The five-state model is the right minimal set.

**Strengths:**
- `backlog/` as true inbox (vague ideas allowed) vs `planned/` as "ready for a fresh agent session" creates a useful quality gate.
- Single `ongoing/` directory enforces focus better than a "in-progress" list.
- `completed/` and `rejected/` as historical sinks keep the active surface small.
- `.gitkeep` files are correct to preserve empty directories in git.

**No directories are missing** for the stated goals. A `paused/` or `blocked/` directory would add ceremony without value; the existing rules (leave in `ongoing/` + Log entry, or move back to `planned/`) already cover interruption.

**Names are optimal** for both AI and human scanning: short, lowercase, verb/noun forms that read naturally in `ls` output. "ongoing" is clearer than "active" or "in-progress" because it signals "this is the one thing happening right now".

The structure will scale to low dozens of tickets without change. Only when `planned/` routinely contains >10–15 files would a generated index become worth considering—and even then it should be a read-only view, not another source of truth.

## 4. README review

The README is durable and mostly precise, but has three categories of issues.

**Clear and strong:**
- Principles section correctly prioritizes atomicity, one-ticket-one-commit, single ongoing, and English artifacts.
- State meanings are well differentiated.
- Dependency and split procedures are operational with numbered steps.
- "When to add automation" guidance is exactly right for this project.
- Commit convention is simple and effective.

**Problems:**
- Passive voice and ambiguous agency throughout the transition sections ("if a planned ticket is selected", "before moving", "ask framing questions"). This must be replaced with explicit actor language.
- Session workflow is close but not prescriptive enough for a cold AI start. Step 6 ("If a planned ticket is selected...") leaves open whether the agent performs selection.
- ID assignment lacks a reproducible one-liner; different agents will implement "scanning" inconsistently.
- The definition-of-ready checklist is excellent but buried; it should be referenced more visibly from the `planned/` and `ongoing/` activation rules.
- Minor verbosity: some repetition between "State transitions", "State meanings", and "Manual session workflow". Can be tightened without losing clarity.

**Missing:**
- Explicit statement that the human maintainer owns all directory moves and frontmatter status/timestamp updates except during explicit workflow-bootstrap or repair.
- Required Log entry format for mid-ticket pauses (current state, what was attempted, concrete next action or suggested resumption prompt).
- Warning that the `status` frontmatter field is secondary; directory location is authoritative. Desync is a detectable error condition.

## 5. Template review

The template is minimal yet sufficient and correctly supports the vagueness-to-readiness spectrum.

**Useful fields/sections:**
- Frontmatter `id`, `title`, `status`, `dependencies`, `created`/`updated` — all necessary.
- `Objective`, `Scope` (in/out), `Acceptance Criteria`, `Verification` — these are the core contract for a planned/ongoing ticket.
- `Log` (append-only) is the single most important handoff mechanism.
- `Implementation Notes`, `Decisions`, `Notes`, `Files Changed`, `Resolution` cover the rest without bloat.

**Redundant or low-value:**
- `priority` and `estimated_complexity` are nice-to-have for human triage but never referenced in the workflow rules. They can stay but should not be treated as required.
- `type` is useful for later filtering but not essential today.

**Missing or weak:**
- No required "Related tickets" or "Supersedes / superseded by" field (Resolution can hold this, but a dedicated line would be clearer when scanning).
- Log entries have no mandated minimal structure for pauses/resumptions. This is the biggest handoff gap.
- Template does not show a minimal filled example for backlog vs planned; an agent new to the project has to infer the difference.

The template already allows backlog vagueness (many sections can be one sentence or "TBD") while the README checklists enforce readiness for planned/ongoing. That separation is correct.

## 6. AGENTS.md review

The ticket guidance in AGENTS.md is the right length and placement.

- It correctly tells the agent to read `tickets/README.md` first and to inspect `ongoing/` before anything else.
- It reinforces the single-active-ticket rule and the "continue only that ticket" discipline.
- It does not duplicate the full workflow, avoiding maintenance burden.

**No conflicts** with the MVP mindset or change-discipline sections. The ticket workflow actually strengthens change discipline by forcing ideas through backlog → planned before implementation.

It could usefully add one sentence: "State transitions (moving ticket files) are performed by the human maintainer unless you are explicitly repairing the workflow itself." This would eliminate the main ambiguity without lengthening the file much.

## 7. Optimization proposal

### Must-change recommendations (apply these first; they directly address the ambiguities that will cause agent mistakes)

1. **Clarify agency and actor responsibility** (highest urgency).
   Add a new short subsection after "Principles":
   ```
   ## Actor responsibilities

   - Human maintainer: performs all directory moves (`backlog/` ↔ `planned/` ↔ `ongoing/` ↔ `completed/` ↔ `rejected/`), updates the `status` frontmatter field and `updated` timestamp on every transition, and approves splits or rejections.
   - AI agent:
     - Never moves ticket files between directories except when the user explicitly says "move PLF-XXX to completed" or during bootstrap/repair of the workflow itself.
     - Only implements changes when a ticket is in `ongoing/`.
     - May create new tickets in `backlog/`, refine existing backlog tickets, append to any ticket's Log/Notes/Decisions, and report when a planned ticket does not meet the definition of ready.
     - At session start, if `ongoing/` contains anything other than exactly one ticket + `.gitkeep`, report a workflow violation and stop.
   ```
   Update every transition rule to use active voice with the responsible actor.

2. **Make the manual session workflow prescriptive for the agent.**
   Replace the current numbered list with:
   ```
   1. Read `tickets/README.md`.
   2. `ls tickets/ongoing/` (ignore `.gitkeep`).
      - Exactly one `.md` file → read it. This is your scope contract. Continue from the last Log entry. Do not edit any other ticket.
      - Zero files → proceed to step 3.
      - More than one file → STOP and tell the user the workflow is corrupted.
   3. `ls tickets/planned/`. List the tickets for the user. The user will choose one, move it to `ongoing/`, update its frontmatter, and give you a prompt that names the ticket. Do not activate or implement any planned ticket yourself.
   4. If no suitable planned ticket exists, work in `backlog/` (refine, split proposals, or create new tickets). Never move a backlog ticket to `planned/` yourself.
   ```
   This removes all passive voice and decision ambiguity.

3. **Provide a reproducible next-ID command.**
   Add to the "Ticket ID convention" section:
   ```
   To obtain the next ID safely, run:
   ```bash
   max=$(find tickets -path 'tickets/*/*.md' -exec basename {} .md \; 2>/dev/null | grep -oE 'PLF-[0-9]+' | cut -d- -f2 | sort -n | tail -1)
   next=$((10#${max:-000} + 1))
   printf 'PLF-%03d\n' "$next"
   ```
   Use the printed value for the new ticket's `id` and filename.
   ```

4. **Strengthen Log handoff for mid-ticket pauses.**
   In both README and TEMPLATE, require that every pause/resumption Log entry ends with a line:
   ```
   Next action: <one concrete sentence or suggested user prompt for the next session>
   ```

### Nice-to-have recommendations (only after the above are done and the manual workflow has been used for several tickets)

- Add a one-paragraph "Common pitfalls" section to README (e.g., "Agent implemented from planned/ without it being moved to ongoing/", "Status field desynced from directory", "Scope creep via Notes instead of new backlog ticket").
- In TEMPLATE frontmatter, rename or deprecate `estimated_complexity` if it is never used in practice; otherwise leave it.
- Once `planned/` grows, consider a read-only `tickets/INDEX.md` that is regenerated by a future Pi tool — but only when listing files manually becomes the actual pain point.

Do not add validation scripts, hooks, or a ticket-management Pi tool yet. The manual discipline is the feature.

## 8. Can you work with this?

Yes, I can follow this workflow as-is for the immediate needs of the three-tool MVP, but I would still make the following mistakes without the clarifications above:

- I might autonomously pick the "most important" planned ticket and start editing it (or even move it) because the current wording does not explicitly forbid it.
- I might implement changes while a ticket is still in `planned/` if the user prompt is ambiguous.
- I might produce inconsistent Log entries that omit the "Next action" line, making resumption harder for the subsequent session.
- I might use different ad-hoc commands to discover the next ID and occasionally collide or skip numbers.
- I might treat the `status` frontmatter field as authoritative and become confused when it lags the directory move performed by the user.

With the four must-change items implemented, the remaining risk is low and acceptable for a small project.

## 9. Pre-mortem

Six months from now the workflow becomes counterproductive most likely through slow erosion rather than sudden collapse.

**What probably went wrong first:**
- The "definition of ready" checklist was treated as optional under delivery pressure. Vague tickets reached `planned/` and then `ongoing/`, causing the agent to ask repeated clarifying questions or to make hidden assumptions. Trust in the workflow dropped.
- Multiple tickets accumulated in `ongoing/` because the single-active rule had no mechanical enforcement and the human sometimes moved a new ticket without finishing or parking the previous one.
- `backlog/` grew into a noisy attic of stale ideas that were never refined, rejected, or pruned. The agent started ignoring it.

**Which rule was ignored first:** The explicit actor split between human (state transitions) and agent (implementation + backlog work). Once agents began performing moves themselves, the directory location stopped being a reliable signal and desync with frontmatter became common.

**Which directory became noisy/misleading:** `planned/`. It filled with tickets whose dependencies or surrounding context had changed, but no one updated or rejected them.

**Which part became ceremony without value:** Updating the `updated` timestamp and writing a Log entry for every tiny clarification or typo fix. Agents began batching changes and writing generic Log lines ("minor edits"), defeating the handoff purpose.

**Which ambiguity caused repeated agent mistakes:** The selection/activation step. Agents sometimes started coding from a planned ticket that the user had not yet moved to `ongoing/`, producing work that later had to be re-scoped or discarded.

**Early warning signs the maintainer should watch for:**
- Agent responses that begin "I see two tickets in ongoing/..." or "I went ahead and activated PLF-XXX...".
- Completed tickets whose Log stops mid-sentence or lacks a commit identifier.
- Planned tickets whose Acceptance Criteria or Verification sections are still copy-pasted from TEMPLATE.
- User prompts that say "just implement the next planned ticket" instead of naming a specific ID in `ongoing/`.

**Minimal guardrails that would prevent these failures:**
- The four must-change items above (especially explicit actor rules and prescriptive session steps).
- A standing instruction in AGENTS.md: "If you ever feel tempted to move a ticket file yourself, stop and ask the user for explicit permission."
- Quarterly (or after every 5–6 completed tickets) quick human review of `planned/` to reject or refine stale entries. This is still manual and cheap.

## 10. Final recommendation

**Keep with light adjustments.** The core design (five directories, single ongoing, file-based handoff, human-owned state transitions, deliberately manual) is sound and well-aligned with both the project constraints and Pi's philosophy. It does not need redesign.

**Ranked urgency of changes:**

1. (Immediate) Add the "Actor responsibilities" subsection and rewrite all transition/session rules in active voice with explicit human/agent roles. This single edit removes the largest source of agent confusion.
2. (Immediate) Replace the manual session workflow list with the prescriptive version that tells the agent exactly what `ls` commands to run and what decisions it must not make.
3. (This week) Add the reproducible next-ID bash one-liner and the required "Next action" format for pause Log entries.
4. (After 3–4 real tickets have been exercised) Add the short "Common pitfalls" section and consider whether `priority`/`estimated_complexity` are earning their keep.

After these minimal targeted edits the workflow will be reliable for session-by-session Pi development without becoming a project-management platform. The existing TEMPLATE.md and directory layout can stay unchanged.

The adjusted workflow will let an AI coding agent start cold, know exactly what it is allowed to do, produce focused commits, and leave a high-quality handoff for the next independent session — which is precisely what the project needs.
```