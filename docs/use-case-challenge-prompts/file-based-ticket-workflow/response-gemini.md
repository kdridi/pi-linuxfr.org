Here is a design for a minimal, file-based ticket workflow tailored for AI-assisted development using Pi. This workflow relies strictly on standard file operations and directories, making it natively understandable to any LLM with standard terminal and file-editing capabilities.

### 1. Executive recommendation

**The Recommendation:** Introduce a lightweight Directory-State Kanban system located in a `tickets/` directory at the root of the repository, using plain Markdown files. Tickets move through states strictly by being moved (`mv`) between subdirectories.

**Why this is right for the project:** Pi is a terminal-native, file-based harness. By using directories as states, the agent can instantly grasp the project status using standard tools like `ls` and `cat`. It requires no external APIs, no complex database reads, and gracefully handles AI session boundaries because the exact state of the project is always durable in the filesystem.

### 2. Directory layout

Create the following tree at the repository root:

```text
tickets/
├── drafts/    # Raw ideas, notes, and unrefined features.
├── ready/     # Fully specified, atomic tickets ready for implementation.
├── active/    # Exactly ONE ticket currently being worked on.
└── done/      # Completed tickets with recorded commit hashes.

```

**State Justifications:**

* **`drafts/` (Included - maps to backlog):** Necessary to capture ideas so they aren't lost, without polluting the actionable queue. Tickets here can be vague.
* **`ready/` (Included - maps to planned):** Necessary to provide a clear queue of immediate next steps for a new Pi session.
* **`active/` (Included - maps to ongoing):** Crucial for handoff and resumability. Limiting this directory to *one file* enforces focus and prevents an agent from hallucinating concurrent tasks.
* **`done/` (Included - maps to archive/completed):** Acts as a local context bank. AI sessions can read past implementations to understand historical context.
* **`rejected/` (Excluded):** Unnecessary clutter. If an idea is rejected, simply delete the file or summarize it into a general `docs/graveyard.md` file.
* **`roadmap/` (Excluded):** Roadmaps are macro-level documents. A roadmap should be a single `docs/ROADMAP.md` file outlining phases, rather than a state that individual micro-tickets sit in.

### 3. Ticket lifecycle semantics

Tickets transition by a simple bash command: `mv tickets/<source>/<file>.md tickets/<destination>/<file>.md`.

* **Draft → Ready:**
* *Prerequisites:* The objective is clear, the implementation plan is explicit, all required files are identified, and the scope is atomic (one commit).
* *Updates:* The Markdown template fields must be fully populated.
* *Missing Info:* The agent should halt the transition and prompt the user (or search the codebase) to resolve ambiguities.
* *Splitting:* If the implementation requires multiple commits or touches disparate systems, the agent must split the ticket before moving.


* **Ready → Active:**
* *Prerequisites:* `tickets/active/` must be entirely empty.
* *Updates:* Move the file.
* *Dependencies:* If the ticket relies on a feature not yet in `main`, it cannot be moved to active.


* **Active → Done:**
* *Prerequisites:* Code is written, tested, and verified against Acceptance Criteria. The changes have been successfully committed.
* *Updates:* Append the git commit hash to the bottom of the ticket. Move the file.



### 4. Ticket template

Keep the template extremely minimal. The filename itself acts as the ID and title (e.g., `001-extract-candidates.md`).

```markdown
# Objective
[What we are building and why. Vague in drafts, explicit in ready.]

# Context
[Relevant file paths, commands to run, or architectural constraints.]

# Implementation Plan
[Step-by-step technical instructions. Must be filled before moving to `ready/`.]

# Acceptance Criteria
- [ ] [Verifiable condition 1]
- [ ] [Verifiable condition 2]

# Resolution
Commit: [Filled when moving to `done/`]

```

### 5. Agent workflow

**Start of a session:**

1. The Pi agent runs `ls tickets/active/`.
2. If a file exists, read it. Read `git status` and `git diff`. Resume work to complete the ticket.
3. If empty, the agent asks the user: "Should I pull a ticket from `ready/`, refine an idea from `drafts/`, or create a new ticket?"

**Refining backlog (Draft → Ready):**

1. Read a `drafts/` file.
2. Investigate the codebase using `cat` or `grep` to understand the context.
3. Rewrite the ticket to fill out the "Implementation Plan" and "Acceptance Criteria".
4. Run `mv tickets/drafts/<file> tickets/ready/`.

**Activating a ticket:**

1. Run `mv tickets/ready/<file> tickets/active/`.
2. Acknowledge to the user what is being worked on.

**Implementation and verification:**

1. Follow the Implementation Plan using standard coding tools (read, write, bash).
2. As steps are completed, use the file-edit tool to check off `[x]` the Acceptance Criteria in the `active/` ticket.

**Handoff/Completion:**

1. Run `git add` and `git commit`.
2. Edit the active ticket to add `Commit: <hash>`.
3. Run `mv tickets/active/<file> tickets/done/`.
4. Output a summary to the user indicating the session can be closed or a new ticket can be pulled.

### 6. Guardrails

* **Preventing tickets from becoming too large:** Impose a rule via the system prompt (or `AGENTS.md`): If a ticket's Implementation Plan exceeds 5 distinct steps or impacts more than 3 existing files, the agent must propose splitting it.
* **Preventing hidden dependencies:** The `Context` block must explicitly list target file paths. If a path does not exist, the ticket cannot enter `ready/`.
* **Preventing vague tickets:** A ticket cannot leave `drafts/` unless every item in the "Acceptance Criteria" can be verified either by a bash script, a test command, or a strict visual check.
* **Preventing scope drift:** The agent must be instructed to treat the active ticket as an immutable contract. If the user asks for an unrelated change during implementation, the agent must write a new ticket to `drafts/` and return to the active task.
* **Keeping commits atomic:** Enforced strictly by the rule: exactly one ticket active at a time, and a ticket moves to `done/` immediately after its single commit.

### 7. Dependency and split procedure

**Resolving Dependencies:**
If `003-ranking.md` depends on `002-extraction.md`, keep `003` in `drafts/` and add a note in its context: `Depends on: 002-extraction.md`. The agent must not move `003` to `ready/` until `ls tickets/done/002-extraction.md` returns true.

**Split Procedure:**
When an agent encounters a large ticket (e.g., `tickets/drafts/005-full-pipeline.md`), it should:

1. Create `005a-extraction-logic.md` and `005b-ranking-logic.md` in `drafts/`.
2. Distribute the context and criteria accordingly.
3. Delete the original: `rm tickets/drafts/005-full-pipeline.md`. (Do not keep "epic" tracker files; they create unnecessary hierarchy for a single developer).

### 8. Commit and git conventions

* **Ticket ID:** Use sequential numbering combined with a slug for the filename: `001-collect-urls.md`. The three-digit prefix ensures files sort correctly in terminal output.
* **Commit message:** Conventional commits tagged with the ID:
`feat(#001): implement raw url collection`
* **Recording:** Update the `Resolution` block in the ticket just before moving it to `done/`.

### 9. Minimal automation wishlist

If you eventually want to automate parts of this using Pi extensions (`.pi/extensions/`), I recommend only these minimal additions:

1. **`check_active_limit.sh`:** A simple bash pre-commit hook that errors if `ls tickets/active | wc -l` > 1.
* *Why:* Enforces the core rule of atomicity mechanically, preventing user or agent error.


2. **`pi_new_ticket` extension tool:** A tool that reads the highest number in `drafts`, `ready`, `active`, and `done`, increments it by 1, and creates a template file in `drafts/`.
* *Why:* Figuring out the next sequential ID manually by running `ls` across 4 directories is slightly tedious for an LLM and error-prone.


3. *Keep manual:* Moving files between states. Do not write a script for `pi_move_ticket`. Standard `mv` is universally understood by all LLMs and avoids black-box abstractions.

### 10. Critique of this design

**Failure modes:**

* **ID Collisions:** If working on separate git branches simultaneously, two agents might create `006-feature.md` on different branches, causing merge conflicts. (Mitigation: Single-developer flows usually serialize work on `main`, but if branching is heavily used, timestamp prefixes like `20260623-feature.md` might be safer than sequential numbers).
* **Forgotten file moves:** An agent might commit the code but forget to move the ticket to `done/`.

**What is overkill:**

* The `Resolution: Commit: [hash]` block might be tedious. In reality, Git history tracks what happened. You could drop this requirement and rely purely on the `done/` folder and `git log`.

**What may be missing:**

* **Prioritization:** There is no strict queue ordering inside `ready/`. A developer might need to manually prefix files (e.g., `P1-003.md`) if order of execution matters.

**What I would simplify further:**

* I intentionally omitted YAML frontmatter (status tags, metadata). The *location* of the file is its status. Keeping the ticket pure markdown with no metadata headers drastically simplifies file reading and writing for the agent.