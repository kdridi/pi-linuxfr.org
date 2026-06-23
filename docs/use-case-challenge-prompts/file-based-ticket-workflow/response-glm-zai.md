Here is the recommended file-based ticket workflow for the `pi-linuxfr.org` repository.

### 1. Executive recommendation

Introduce a **three-state Markdown ticket system** (`backlog/`, `active/`, `done/`) controlled by a single pointer file (`CURRENT.md`).

This is the right level of structure because it perfectly mirrors the project's "small MVP steps" philosophy. It avoids the cognitive overhead of a state machine (no `planned`, `in-review`, or `blocked` states) while solving the core handoff problem: a new AI session only needs to read `CURRENT.md` to know exactly what to do. It relies entirely on standard file operations that Pi excels at (read, write, bash `mv`, bash `git`).

### 2. Directory layout

```text
tickets/
  backlog/    # Unprioritized, unrefined ideas
  active/     # EXACTLY ZERO or ONE ticket. Ready for implementation.
  done/       # Completed tickets. Serves as the project's changelog.
CURRENT.md   # Pointer to the active ticket (or empty if none).
```

**States included:**
*   **Backlog:** The idea capture net. Tickets here can be half-baked.
*   **Active:** The execution state. Strictly limited to one ticket to enforce focus.
*   **Done:** The historical record.

**States excluded (and why):**
*   *Planned/Ready:* Redundant. A backlog ticket that meets the completion criteria is implicitly planned. Moving it to `active/` is the planning act.
*   *Rejected/Icebox:* Unnecessary. Git history is the graveyard for bad ideas. If a ticket is obsolete, delete it. The commit message will explain why.
*   *Roadmap:* Too heavy. The backlog itself is small enough to serve as the roadmap.
*   *Archive:* `done/` is the archive.

### 3. Ticket lifecycle semantics

**Backlog → Active**
*   *Must be true:* The ticket's "Acceptance Criteria" and "Implementation Steps" sections are fully filled out. Any dependencies are in `done/`. `active/` must be empty.
*   *Files updated:* Ticket file is moved (`mv`) from `backlog/` to `active/`. `CURRENT.md` is updated with the link.
*   *Missing info:* The agent must STOP and either ask the user for the missing information, or move the ticket back to `backlog/` after adding a comment detailing what is missing.
*   *Dependencies:* If a dependency is not in `done/`, the ticket cannot move to active.
*   *When to split:* If the "Implementation Steps" describe sequential changes to unrelated files, or if the agent realizes it will require more than one logical commit, the ticket must be split *before* moving to active.

**Active → Done**
*   *Must be true:* Code is written, tested via bash, and committed. The commit hash is recorded in the ticket.
*   *Files updated:* Ticket is moved to `done/`. `CURRENT.md` is cleared (left with only a "No active ticket" placeholder).

**Active → Backlog (The "U-turn")**
*   *Must be true:* A critical blocker is discovered during implementation that was not visible during planning, or the scope is fundamentally flawed.
*   *Files updated:* Moved back to `backlog/`. `CURRENT.md` is cleared. A "Blockers" section must be added to the ticket explaining the U-turn.

### 4. Ticket template

```markdown
# T003: Add candidate extraction from raw HTML

## Status
Backlog

## Context
Why does this matter? (Leave vague in backlog, but must make sense later).

## Acceptance Criteria
- [ ] MUST: `linuxfr_extract_candidates` tool exists in the Pi extension.
- [ ] MUST: Returns structured data (title, URL) for diary entries.
- [ ] MUST: Works on locally cached raw files, no network calls.

## Implementation Steps
1. Add new tool file under `.pi/extensions/tools/`.
2. Parse HTML using existing project dependencies (no new `npm install`).
3. Write 2 unit tests covering valid and malformed HTML.
4. Register tool in `index.ts`.

## Dependencies
- T002 (done)

## Commit
_(Leave blank until moved to done)_
```

**Field rules:**
*   **Backlog:** `Context` can be a single sentence. `Acceptance Criteria` and `Implementation Steps` can be empty or bulleted guesses.
*   **Active:** `Acceptance Criteria` MUST use "MUST/SHOULD" and be checkable. `Implementation Steps` MUST be a numbered list of concrete file actions. `Dependencies` MUST be verified as `done`.

### 5. Agent workflow

**Start of session:**
1. Read `CURRENT.md`.
2. If it points to a ticket, read that ticket and resume implementation.
3. If it is empty, run `ls tickets/active/` to verify it is empty. Then run `ls tickets/backlog/` and ask the user which ticket to refine and activate next.

**Refine backlog tickets:**
1. Read the raw ticket.
2. Analyze the codebase (using `read` and `bash grep/find`) to understand current state.
3. Propose concrete `Acceptance Criteria` and `Implementation Steps`.
4. Edit the ticket file in place. Do not move it to active unless the user explicitly approves.

**Activate a planned ticket:**
1. Verify `tickets/active/` is empty.
2. Run `grep -r "T0XX" tickets/` to ensure no active dependencies exist.
3. Move file: `mv tickets/backlog/T0XX.md tickets/active/T0XX.md`
4. Update `CURRENT.md` to contain exactly: `[T0XX](tickets/active/T0XX.md)`
5. Change the `## Status` field inside the ticket to `Active`.

**Implement and verify:**
1. Follow the `Implementation Steps` sequentially.
2. Run tests or manual bash verification after each step.
3. If scope drift occurs (e.g., "I need to refactor the parser first"), STOP. Do not do it. Either add it to the ticket steps (if tiny) or create a new backlog ticket and U-turn the current one.

**Complete and handoff:**
1. Make the final atomic commit.
2. Capture the commit hash: `git rev-parse --short HEAD`
3. Edit the ticket: update `## Status` to `Done` and fill in `## Commit` with the hash.
4. Move file: `mv tickets/active/T0XX.md tickets/done/T0XX.md`
5. Clear `CURRENT.md`.
6. Print a short summary to the terminal: "Completed T003 in commit abc1234. Ready for next ticket."

### 6. Guardrails

*   **Preventing large tickets:** The "Implementation Steps" gatekeeper. If a step says "Update all tools to support X," it is too broad. It must be broken down to "Update `linuxfr_collect_pages` to support X".
*   **Preventing hidden dependencies:** The agent must be instructed to strictly follow the `## Dependencies` field. If an agent realizes mid-task it needs something else, it must halt, not do it silently.
*   **Preventing vague active tickets:** A bash pre-check. Before `mv` to active, the agent should run a mental or literal check: do checkboxes exist in `Acceptance Criteria`? If no, abort.
*   **Preventing scope drift:** The agent must be prompted to review its uncommitted changes (`git diff`) against the ticket title before committing. If `git diff` shows changes to files not mentioned in the Implementation Steps, the agent must revert those changes or split the commit.
*   **Keeping commits atomic:** The rule is simple: One active ticket = exactly one `git commit`. No "WIP" commits. Stage all related files and commit once.

### 7. Dependency and split procedure

**Resolving dependencies:**
1. Agent identifies Ticket A needs feature from Ticket B.
2. Agent checks `tickets/done/` for B.
3. If B is not done, agent creates B in `backlog/` (if it doesn't exist).
4. Agent adds `## Dependencies: - T0B` to Ticket A.
5. Agent tells the user: "Cannot activate T0A. Created T0B in backlog. We must do T0B first."

**Splitting a large ticket:**
1. Identify the distinct logical units. (e.g., "Extract data" and "Rank data").
2. Create `T00X_part2.md` in `backlog/` with the second unit.
3. Rewrite the original ticket (`T00X.md`) to *only* contain the first unit. Update its title and steps.
4. Add `## Dependencies: - T00X` to the new part 2 ticket.
5. Proceed with the original ticket.

### 8. Commit and git conventions

*   **Ticket ID:** 3-digit zero-padded integer based on creation order (e.g., `T001`, `T002`). File names are `T001.md`. Simple, sortable, no UUIDs.
*   **Commit message:** Strict format: `[T001] Add candidate extraction from raw HTML`
    *   No "feat:", "fix:" prefixes. The ticket ID provides the tracking. The sentence describes the change.
*   **Recording the commit:** At the very bottom of the ticket, before moving to `done/`:
    `## Commit: a1b2c3d`

### 9. Minimal automation wishlist

Keep it 100% manual right now. Pi agents are perfectly capable of following these instructions. Writing bash scripts to enforce this creates a maintenance burden that contradicts the MVP philosophy.

*   *Wishlist item 1 (only if agents constantly break the rules):* A tiny Pi extension tool `ticket_activate(id)` that programmatically enforces the empty-active-dir check and updates `CURRENT.md`. Do not build this until an agent fails the manual workflow twice.

### 10. Critique of this design

*   **Most likely failure mode:** The AI agent gets excited about a ticket, skips updating `CURRENT.md`, starts coding, and the session crashes. The next session finds an empty `CURRENT.md` but uncommitted code in the working directory. *Mitigation:* The agent workflow instructions must explicitly tie the bash `git commit` to the clearing of `CURRENT.md`.
*   **What is overkill:** The `CURRENT.md` file. Technically, `ls tickets/active/` achieves the same thing. *Justification for keeping it:* Reading a single file is faster and less prone to parsing errors across different AI models than reading directory listings. It costs almost nothing.
*   **What may be missing:** A way to track "Epics" or themes (e.g., "V2 Candidate Pipeline"). Right now, you'd just rely on the `Context` field or folder prefixes. If the backlog hits ~20 tickets, you might want `tickets/backlog/v2-candidates/`, but do not add subdirectories until the flat list becomes unreadable.
*   **What I would simplify further:** If the "Dependencies" field proves annoying to maintain, drop it entirely. An AI agent can usually infer dependencies by reading the `Implementation Steps` of a backlog ticket and checking if those files/functions exist yet. I included it only because it gives the agent an explicit, unarguable halt condition.