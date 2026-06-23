```markdown
# Review of the Lightweight File‑Based Ticket Workflow

This is a thorough, well‑structured workflow. It is unusually disciplined for a minimal Pi repository, and it is clearly written with AI‑agent handoff in mind. Below is a direct, critical review organized by the ten requested questions.

---

## 1. Agent usability verdict

### What is immediately clear
- The **state model** is unambiguous: the directory a ticket lives in *is* its state.
- The **single‑ongoing‑ticket rule** is explicit and easy for an agent to check.
- The **definition of ready** for `planned/` is extremely clear and actionable.
- The **session workflow** gives a deterministic startup procedure for a cold agent.
- The **template** provides enough structure for an agent to fill in missing fields.
- The **transition checklists** are explicit enough that an agent can follow them step‑by‑step.

### What remains ambiguous
- The workflow does not specify **how strict** the agent should be about missing fields in backlog tickets. It says backlog can be vague, but not how vague.
- It is unclear whether the agent should **auto‑fix** missing metadata (timestamps, status fields) or ask the user first.
- The workflow does not specify whether an agent may **edit past log entries** for formatting or correctness (presumably no, but it is not stated).
- The workflow does not define how to handle **ticket numbering conflicts** if two sessions create tickets concurrently.
- The workflow does not specify whether the agent should **refuse to implement** a planned ticket if the template sections are present but empty.

Overall: usable, but with a few operational ambiguities that could cause inconsistent agent behavior.

---

## 2. Fit to Pi

### Strong fit
- Entirely file‑based, no external system required.
- Works with Pi’s strengths: reading files, editing files, running `bash`, scanning directories.
- Avoids assumptions about Pi features (no built‑in to‑dos, no agent memory).
- Encourages resumability, which is essential for Pi’s session model.

### Minor mismatches
- The workflow assumes the agent will **always read the README** at session start. This is correct but repetitive; Pi has no built‑in mechanism to enforce it.
- The workflow assumes the agent will **never forget** to update timestamps or logs. Pi cannot enforce this; mistakes will happen.

Overall: very good alignment with Pi’s philosophy.

---

## 3. Directory structure review

### Are the five states correct?
Yes. They map cleanly to the minimal lifecycle needed for small, atomic work.

### Missing directories?
No. Adding more (e.g., “paused”, “archived”) would add ceremony without value.

### Unnecessary directories?
None. Each serves a distinct purpose.

### Directory name clarity
- `backlog`, `planned`, `ongoing`, `completed`, `rejected` are intuitive for both humans and agents.
- The names are short, stable, and easy to grep.

Verdict: the structure is optimal for this scale.

---

## 4. README review

### Durability
The README is durable because:
- It avoids references to specific tools or future features.
- It defines principles rather than workflows tied to a particular implementation.

### Clarity of state transitions
Very clear. The checklists are excellent.

### Handling rule failures
Mostly clear, but:
- It does not specify what to do if a ticket is malformed (missing sections, invalid YAML).
- It does not specify what to do if two tickets accidentally appear in `ongoing/`.

### Dependency procedure
Operational and realistic. Good emphasis on explicitness.

### Split procedure
Strong and actionable. The “superseded by” rule is especially good.

### Session workflow
Clear and deterministic. A cold agent can follow it.

### Too verbose?
Some sections repeat the same principle (“do not expand scope silently”). Could be tightened.

### Missing?
- A short **“common mistakes”** section would help agents avoid typical pitfalls.
- A rule about **not rewriting history** in logs (append‑only is stated, but not emphasized).

---

## 5. Template review

### Minimal but sufficient?
Yes. It captures all the fields an agent needs.

### Useful fields
- `status`, `dependencies`, `estimated_complexity`, `Files Changed`, `Log` — all highly useful for agents.
- `Resolution` is excellent for historical clarity.

### Redundant fields
- `priority` may be unnecessary in a single‑ongoing‑ticket workflow.
- `estimated_complexity` may not influence scheduling in such a small project.

### Missing fields
- A **“Related Tickets”** section could help cross‑linking without implying dependency.
- A **“Prompt to start implementation”** field could help cold agents begin work deterministically.

### Backlog vagueness support
Yes — backlog tickets can be incomplete, but the template still provides structure.

### Handoff support
The `Log` section is excellent for handoff. No changes needed.

---

## 6. AGENTS.md review

### Is the ticket guidance enough?
Yes, but it is minimal. It assumes the agent will read `tickets/README.md` for details.

### Should AGENTS.md say more?
Probably not. It should remain high‑level.

### Conflicts?
No direct conflicts, but:
- AGENTS.md emphasizes “small MVP steps” and “avoid premature complexity”.
  The ticket workflow is slightly more elaborate than the MVP philosophy, but still acceptable.

---

## 7. Optimization proposal

### Must‑change recommendations (smallest possible changes)

1. **Clarify backlog vagueness boundaries**
   Add one sentence:
   *“A backlog ticket may omit any section except `id`, `title`, `status`, and `created`.”*

2. **Clarify metadata update rules**
   Add:
   *“Agents may update timestamps and status fields without asking the user.”*

3. **Clarify log immutability**
   Add:
   *“The Log section is strictly append‑only; do not rewrite or reorder entries.”*

4. **Define behavior for multiple ongoing tickets**
   Add:
   *“If more than one ticket appears in `ongoing/`, the agent must stop and ask the user to resolve the conflict manually.”*

### Nice‑to‑have recommendations

1. Add a **“Related Tickets”** section to the template.
2. Add a **“Common mistakes”** section to the README.
3. Add a **“Start prompt”** field to the template for deterministic cold‑start instructions.
4. Add a short rule about **YAML validity** (agents often break frontmatter).

---

## 8. Can I work with this?

### Yes — I can follow this workflow as‑is.

### Likely mistakes I might still make
- Forgetting to update timestamps.
- Forgetting to update the `status` field when moving directories.
- Misinterpreting vague backlog tickets as planned tickets.
- Over‑refining backlog tickets without user confirmation.
- Adding too much detail to the log or too little.

None of these are fatal, but they will cause drift.

---

## 9. Pre‑mortem (six months later)

### What probably went wrong
- Backlog became a dumping ground with dozens of vague tickets.
- Planned tickets were accepted without fully meeting the definition of ready.
- Agents forgot to update timestamps or logs, causing inconsistent metadata.
- Some tickets were implemented without moving them to `ongoing/`.

### First rule ignored
The **single‑ongoing‑ticket rule**. Once that breaks, the workflow loses its anchor.

### Noisy or misleading directory
`backlog/` — it will accumulate stale, unclear, or duplicate ideas.

### Ceremony without value
- Overly detailed acceptance criteria for tiny tasks.
- Repeated timestamp updates that don’t add meaning.

### Ambiguity causing repeated mistakes
- How vague backlog tickets may be.
- Whether empty sections in planned tickets are acceptable.

### Early warning signs
- Tickets in `planned/` with empty sections.
- Tickets in `ongoing/` with no log entries.
- Backlog tickets older than a month with no refinement.

### Minimal guardrails
- A simple script or Pi tool that checks:
  - exactly one ticket in `ongoing/`;
  - required fields present in planned/ongoing tickets;
  - frontmatter parses as YAML.

This is minimal and does not automate the workflow itself.

---

## 10. Final recommendation

### Verdict
**Adjust lightly.**
The workflow is strong and does not need redesign. It only needs a few clarifications to reduce agent ambiguity.

### Ranked changes (highest urgency first)

1. **Clarify backlog vagueness boundaries** (prevents misclassification errors).
2. **Clarify metadata update rules** (prevents hesitation and drift).
3. **Clarify log immutability** (prevents accidental rewriting).
4. **Define behavior for multiple ongoing tickets** (prevents corruption).
5. Add “Related Tickets” section (optional but helpful).
6. Add “Common mistakes” section (optional).
7. Add “Start prompt” field (optional).
8. Add YAML validity rule (optional).

---

## Final concise recommended version

- Keep the directory structure exactly as‑is.
- Keep the template mostly as‑is; add “Related Tickets” if desired.
- Add four clarifications to the README:
  1. Backlog tickets may omit all sections except id/title/status/created.
  2. Agents may update timestamps and status fields without user confirmation.
  3. The Log section is strictly append‑only.
  4. If more than one ticket appears in `ongoing/`, the agent must stop and ask the user to resolve it manually.

Everything else is already solid.

---

**Final answer:**
This workflow is already strong and usable. With a few small clarifications, it becomes extremely reliable for Pi‑assisted, session‑by‑session development without drifting into project‑management overhead.
```