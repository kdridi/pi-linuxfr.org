Below is a complete, opinionated, minimal, file‑based ticket workflow tailored specifically for **pi-linuxfr.org**, designed for **Pi-assisted development**, **durable handoff**, **atomic commits**, and **session-to-session continuity**.

No external tools, no automation required, no databases, no heavy workflow.
Just Markdown files, directories, and conventions that Pi agents can reliably follow.

---

# 1. Executive recommendation

**Introduce a minimal directory‑based ticket system with four states:**

- **`tickets/backlog/`** — ideas, rough notes, unrefined possibilities
- **`tickets/planned/`** — fully specified, ready-to-implement tickets
- **`tickets/ongoing/`** — exactly one active ticket
- **`tickets/done/`** — completed tickets with commit reference

**Why this level of structure?**

- It is **simple enough** for Pi-assisted work and manual editing.
- It is **durable** across sessions: the state is encoded in the directory tree.
- It enforces **one active ticket**, preventing parallelism and drift.
- It supports **atomic commits** and **small MVP steps**.
- It avoids over-engineering: no epics, no labels, no metadata systems.
- It is easy to automate later *if* the workflow proves useful.

---

# 2. Directory layout

```
tickets/
  backlog/
    T0001-short-title.md
    T0002-other-idea.md
  planned/
    T0003-some-feature.md
  ongoing/
    T0004-active-ticket.md
  done/
    T0001-short-title.md
    T0003-some-feature.md
```

### State explanations

### **`backlog/`**
- Contains **rough ideas**, incomplete thoughts, vague proposals.
- Tickets may be short, exploratory, or speculative.
- No requirement for completeness.

### **`planned/`**
- Tickets here are **fully specified** and ready for implementation.
- Must have clear acceptance criteria and no unresolved dependencies.
- Only move a ticket here when it is implementable in one atomic commit.

### **`ongoing/`**
- Contains **exactly one ticket**.
- Represents the active work for the current Pi session.
- The agent should not start another ticket until this one is completed or moved back.

### **`done/`**
- Completed tickets with a **commit reference** added.
- Serves as durable project history.

### Why no other states?

- **No “rejected”** — simply delete or archive manually if needed.
- **No “archive”** — `done/` already serves as history.
- **No “roadmap”** — roadmap can be a separate document if needed, not part of ticket flow.
- **No “in-review”** — single-developer workflow does not need it.

---

# 3. Ticket lifecycle semantics

### **Backlog → Planned**
**Meaning:** The idea is now a concrete, implementable task.

**Requirements before move:**
- Clear problem statement.
- Clear acceptance criteria.
- No unresolved dependencies.
- Scope small enough for one commit.

**Files to update:**
- Fill missing fields in the template.
- Add or refine acceptance criteria.

**If information is missing:**
Agent should refine the ticket in backlog instead of moving it.

**Dependencies:**
If dependencies exist, either:
- resolve them first, or
- split the ticket (see section 7).

---

### **Planned → Ongoing**
**Meaning:** This is the next task to implement.

**Requirements before move:**
- No other ticket in `ongoing/`.
- Ticket is fully specified.

**Files to update:**
- Add a “Work Notes” section (empty is fine).
- Move file to `ongoing/`.

---

### **Ongoing → Done**
**Meaning:** Implementation is complete and committed.

**Requirements before move:**
- Code implemented.
- Tests or manual verification done.
- Commit created and pushed.

**Files to update:**
- Add final commit hash.
- Add any final notes.

**Dependencies:**
If new dependencies appear during implementation, move back to `planned/` and split.

---

# 4. Ticket template

**Minimal, useful, durable.**

```markdown
# Ticket TXXXX: Short Title

## Summary
One-paragraph description of the problem or feature.

## Motivation
Why this matters for the project or workflow.

## Requirements / Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Implementation Notes
(High-level hints, constraints, or design ideas.
May be empty in backlog.)

## Dependencies
(List other ticket IDs or “None”.)

## Work Notes
(Used only in `ongoing/`. Leave empty in backlog/planned.)

## Final Commit
(Added when moved to `done/`: `commit <hash>`)
```

### Which fields may be vague?
- In **backlog**: Summary, Motivation, Implementation Notes may be rough.
- In **planned**: All fields except Work Notes and Final Commit must be complete.
- In **ongoing**: Work Notes becomes active.
- In **done**: Final Commit must be filled.

---

# 5. Agent workflow

### **At the start of a session**
1. Check `tickets/ongoing/`.
2. If a ticket exists:
   - Read it fully.
   - Continue implementation.
3. If none exists:
   - Look at `planned/`.
   - If empty, refine backlog tickets.
   - If not empty, activate the top priority planned ticket.

---

### **Refining backlog tickets**
- Read backlog entries.
- Improve clarity, add acceptance criteria.
- Split large ideas into smaller tickets.
- Move to `planned/` only when fully specified.

---

### **Activating a planned ticket**
- Ensure `ongoing/` is empty.
- Move the ticket file to `ongoing/`.
- Begin implementation.

---

### **Implementing and verifying an ongoing ticket**
- Use Pi tools as needed.
- Keep Work Notes updated.
- Ensure the implementation matches acceptance criteria.
- Create a single atomic commit.

---

### **Completing the ticket**
- Add commit hash to “Final Commit”.
- Move ticket to `done/`.
- Ensure no leftover work notes that imply incomplete work.

---

# 6. Guardrails

### Preventing large tickets
- If a ticket cannot be completed in one commit, split it.
- Planned tickets must be small and atomic.

### Preventing hidden dependencies
- Planned tickets must list dependencies explicitly.
- If a dependency appears during implementation, move back to planned and split.

### Preventing vague tickets from entering planned
- Planned tickets must have:
  - clear summary
  - clear acceptance criteria
  - no open questions

### Preventing scope drift
- Ongoing tickets must not change scope.
- If scope expands, split and return to planned.

### Keeping commits atomic
- One ticket → one commit.
- If multiple commits are needed, squash before marking done.

---

# 7. Dependency and split procedure

### **Resolving dependencies**
1. Identify dependent tickets.
2. Ensure they are in `planned/` or `ongoing/`.
3. If dependency is large, split it first.
4. Only move the dependent ticket to `planned/` when all prerequisites are done.

### **Splitting a large ticket**
1. Create new backlog tickets for each subtask.
2. Replace the original ticket’s content with:
   - a short explanation
   - links to the new tickets
3. Move the original ticket to `done/` with a note: “Superseded by TXXXX, TXXXX”.

### **What happens to the original ticket?**
- It becomes a historical pointer.
- It is not implemented directly.

---

# 8. Commit and git conventions

### Ticket ID convention
- `T0001`, `T0002`, …
- Four digits, sequential, assigned manually.

### Commit message convention
```
T0004: Implement candidate extraction prototype
```

### Ticket recording the final commit
In the “Final Commit” field:
```
commit abc123def456
```

---

# 9. Minimal automation wishlist

Only after the manual workflow proves useful.

### Possible small scripts:
- **`bin/ticket-new`** — create a new backlog ticket with next ID.
- **`bin/ticket-activate`** — move a planned ticket to ongoing.
- **`bin/ticket-done`** — move ongoing to done and insert commit hash.
- **`bin/ticket-lint`** — check that:
  - only one ongoing ticket exists
  - planned tickets have required fields

**Why keep these optional?**
- The workflow is simple enough to manage manually.
- Pi agents can perform moves without scripts.
- Scripts should only be added if they reduce friction.

---

# 10. Critique of this design

### Likely failure modes
- Backlog may grow messy if not curated.
- Developers may forget to enforce one ongoing ticket.
- Tickets may drift in scope if not carefully reviewed.

### Parts that may be overkill
- The “Dependencies” field may be unnecessary early on.
- The “Work Notes” section may be unused for very small tasks.

### Parts that may be missing
- A lightweight priority system (but can be added later).
- A roadmap file (but not required for ticket flow).

### What could be simplified further?
- Collapse planned and ongoing into a single “active” directory — but this loses clarity.
- Remove dependencies entirely — but this risks hidden blockers.

---

If you want, I can now **generate the initial directory structure**, **create the first tickets**, or **draft a README section describing this workflow**.