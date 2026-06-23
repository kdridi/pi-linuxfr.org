# File-based ticket workflow for `pi-linuxfr.org`

A minimal, agent-friendly, git-native ticket system designed for Pi-assisted
development across separate AI sessions. The whole system is Markdown files in
directories. The filesystem **is** the database, git **is** the history, and
`AGENTS.md` **is** the entry point that makes every fresh Pi session self-resuming.

---

## 1. Executive recommendation

**Introduce a four-state, directory-as-state ticket system under `tickets/`,
where each ticket is one Markdown file that physically moves between `backlog/`,
`ready/`, `active/`, and `done/`. The filesystem is the only index. `AGENTS.md`
points Pi at `tickets/README.md` so the rules load on every session start.**

The load-bearing invariant is: **`active/` holds at most one ticket.** Everything
else exists to feed that single slot with well-shaped, implementable work and to
record the result durably enough that a brand-new session can pick up cold.

Why this level of structure, and not more or less:

- **Less (e.g. a single `TODO.md`)** loses per-ticket acceptance criteria,
  per-ticket handoff notes, and the one-active invariant — exactly the things a
  cold AI session needs to resume safely. A flat list also can't be moved with
  `git mv`, so state changes don't show up cleanly in history.
- **More (statuses in a tracker, epics, sprints, estimates, labels, a roadmap
  board)** is project-management theater for a single developer. It creates a
  second source of truth that drifts from the code and that agents forget to
  update.
- **Directory-as-state** is the sweet spot: a ticket's state is *where its file
  lives*. `ls tickets/active/` answers "what am I doing?" with zero parsing and
  zero sync burden. State transitions are `git mv`, which are atomic, reviewable,
  and revertible.

This matches Pi's own philosophy ("No built-in to-dos — use a file"; AGENTS.md is
loaded from the current and parent directories at startup) and the project's MVP
discipline. It is deliberately durable: nothing in it references a specific future
milestone, so it reads the same in V2, V5, or never.

---

## 2. Directory layout

```
tickets/
  README.md          # The workflow spec (this file's rules, condensed). Durable.
  _TEMPLATE.md       # Canonical ticket template. Copied to create new tickets.
  backlog/           # Captured ideas. May be vague. Unordered.
  ready/             # Refined, implementable tickets. Ordered by filename prefix.
  active/            # AT MOST ONE ticket. The work in progress.
  done/              # Terminal tickets: completed, rejected, or split.
```

A ticket is a single file, e.g. `tickets/ready/0007-candidate-extraction.md`.
Moving state = `git mv` between these directories. The ID in the filename never
changes, so cross-references stay valid forever.

### States included, and why

- **`backlog/` — keep.** The project explicitly needs "ideas captured without
  losing them." This is the inbox. Vagueness is allowed here and nowhere else.
- **`ready/` — keep.** This is the "planned" state. It exists *separately* from
  backlog because an agent must have exactly one place to look for work that is
  safe to implement without further design. The backlog/ready split is the line
  between "an idea" and "a spec." Collapsing them into one directory with a flag
  would force agents to filter, and filtering is where mistakes happen.
- **`active/` — keep.** This is the project's "only one implementation ticket at
  a time" rule made physical. One ticket here, period.
- **`done/` — keep.** Completed work must remain readable so the next session
  understands what already exists. This directory doubles as the archive.

### States deliberately excluded, and why

- **`ongoing` as a separate concept from `active`** — same thing. Use `active/`.
- **`completed` / `rejected` / `archive` as separate directories — excluded.**
  All three are terminal. Splitting them into three directories triples the move
  targets and tempts a future "where does a rejected-then-reconsidered ticket
  go?" debate. Instead, **one `done/` directory** with an `outcome:` field
  (`completed` | `rejected` | `split`) carries the distinction. `grep -l
  'outcome: rejected' done/*` is enough to find rejected ideas.
- **`archive/` — excluded for now.** `done/` *is* the archive. Only if `done/`
  grows to hundreds of files would you shard it (e.g. `done/2026/`), and that's a
  trivial, deferrable mechanical change. Don't pay for it before you have it.
- **`roadmap` as a state — excluded.** A roadmap is strategy, not a ticket state,
  and roadmaps go stale (violating the "durable over time" constraint). Ordering
  lives in `ready/` via filename prefixes. If you want a human-readable direction
  note, keep an *optional* `ROADMAP.md` at the repo root marked explicitly as
  non-authoritative — but the backlog and ready ordering are the real plan.
- **A separate index/status file — excluded on principle.** It would be a second
  source of truth that drifts from the directories. `ls` is the index.

---

## 3. Ticket lifecycle semantics

States and legal transitions:

```
        (new)
          │
          ▼
      backlog ──refine──► ready ──activate──► active ──complete──► done (completed)
          │                 │                    │
          │                 │                    └──block/needs-split──► back to ready or backlog
          └──drop───────────┴──────────────────────────────────────► done (rejected)
          │
          └──split──► (new child tickets) + original ──► done (split)
```

A ticket moves by `git mv`-ing its file. The frontmatter `outcome:` and `commit:`
fields are only ever filled on the way into `done/`.

### Transition: (new) → `backlog/`

- **Precondition:** an idea exists. That's all.
- **Update:** create file from `_TEMPLATE.md`, assign next ID, write `title`,
  `created`, and a rough `Summary`. Other sections may be empty placeholders.
- **Missing info:** fine. Backlog tolerates unknowns. Capture and move on.
- **Dependencies:** note them informally in `Summary` if obvious; don't gate.
- **Split?** No. Don't pre-split ideas. Splitting happens at refinement.

### Transition: `backlog/` → `ready/` (refine)

- **Precondition — the Definition of Ready (DoR), all true:**
  1. `Scope` lists concrete, in-scope deliverables.
  2. `Out of scope` is filled (even if just "nothing notable").
  3. `Acceptance criteria` are present and verifiable (you could check each by
     running a command or reading a file).
  4. `Verification` names how to prove it works (commands, expected output).
  5. The ticket plausibly fits **one focused commit**.
  6. Every entry in `depends_on` is already in `done/` (outcome `completed`).
- **Update:** fill the sections above; set/confirm `depends_on`; give the file an
  ordering prefix in `ready/` if you order by filename (see §8). `git mv` to
  `ready/`.
- **Missing info:** if any DoR item can't be satisfied with confidence, the
  ticket **stays in backlog**. Write down the specific open question in the
  `Summary` so the next session knows what's blocking refinement. Do not guess
  acceptance criteria into existence.
- **Dependencies:** if a dep is not yet `done/`, either refine and promote the
  dep first, or leave this ticket in backlog with `depends_on` recorded.
- **Split?** If satisfying DoR forces the scope past "one focused commit," **split
  now** (§7) instead of promoting a too-large ticket.

### Transition: `ready/` → `active/` (activate)

- **Precondition:** `active/` is **empty**. Exactly one ticket is being activated.
  All `depends_on` are in `done/`.
- **Update:** `git mv` the chosen ticket to `active/`. Append a dated line to
  `Handoff notes`: "Activated; plan: …". Optionally commit this move on its own
  (a `chore` commit) so the start of work is visible in history.
- **Missing info:** if on re-reading the ticket the DoR no longer holds, **send it
  back to `ready/` or `backlog/`** rather than starting blind.
- **Dependencies:** if a dep turns out to be missing, do not start — resolve the
  dependency first (§7).
- **Split?** If activation reveals the ticket is two things, move it back and split
  before doing any code.

### Transition: `active/` → `done/` (complete)

- **Precondition:** every acceptance criterion passes, `Verification` has been run
  and its result recorded, and the change is committed as one focused commit.
- **Update:** set `outcome: completed`, set `commit:` to the commit hash, append a
  final dated `Handoff notes` line summarizing what shipped and anything the next
  ticket should know. `git mv` to `done/`.
- **Missing info:** if a criterion can't be verified, the ticket is **not done**.
  Either finish it or, if it must pause, leave it in `active/` with a clear
  Handoff note (it's still the one active ticket; a paused active ticket blocks
  new work by design, which is the correct pressure).
- **Dependencies:** none downstream to manage on completion, but if the work
  spawned new ideas, file them as **new backlog tickets** (never silently extend
  this one).
- **Split?** Too late to split a completed ticket; spawn follow-up tickets instead.

### Transition: any → `done/` (rejected) / `active/`→back (rollback) / split

- **Reject:** set `outcome: rejected`, add a one-line reason in `Handoff notes`,
  `git mv` to `done/`. Keeps rejected ideas searchable without cluttering backlog.
- **Rollback:** an activated ticket that turns out underspecified or blocked moves
  back to `ready/` (still implementable, just not now) or `backlog/` (needs
  rethinking). Record why.
- **Split:** see §7. Original ends in `done/` with `outcome: split`.

---

## 4. Ticket template

Copy this to `tickets/_TEMPLATE.md`. It is intentionally short; every field earns
its place.

```markdown
---
id: T-0000
title: <one line, imperative>
created: 2026-01-01
depends_on: []          # list of ticket IDs, e.g. [T-0003]
outcome:                # set only in done/: completed | rejected | split
commit:                 # set only when completed: <git hash>
---

# T-0000 — <title>

## Summary
<Why this exists and what problem it solves. One short paragraph.>

## Scope
- <Concrete deliverable 1>
- <Concrete deliverable 2>

## Out of scope
- <Explicitly excluded thing, to prevent drift>

## Acceptance criteria
- [ ] <Verifiable statement 1>
- [ ] <Verifiable statement 2>

## Verification
<Exact commands to run and what success looks like. e.g.
`pi -p "run linuxfr_query_raw ..."` returns N records; or `npm test` passes.>

## Implementation notes
<Optional. Approach, files likely touched, gotchas. Filled during refine/work.>

## Handoff notes
<Running, dated log. The most important section for cross-session resumability.
Append, never overwrite. e.g.>
- 2026-01-01: created.
```

### Field completeness by state

| Field | backlog | ready | active | done |
|---|---|---|---|---|
| `id`, `title`, `created` | required | required | required | required |
| `Summary` | rough OK | clear | clear | clear |
| `Scope`, `Out of scope` | may be empty | **required** | required | required |
| `Acceptance criteria` | may be empty | **required, verifiable** | required | all checked |
| `Verification` | may be empty | **required** | required | run + recorded |
| `depends_on` | informal | **resolved (all done)** | resolved | n/a |
| `Implementation notes` | optional | optional | filled as you go | reflects reality |
| `Handoff notes` | seed line | refine note | **updated each work step** | final summary |
| `outcome`, `commit` | empty | empty | empty | **set** |

The rule of thumb: **backlog may be vague everywhere except identity. `ready`
must be implementable by a stranger.** `active` adds a live Handoff log. `done`
adds outcome + commit.

---

## 5. Agent workflow

These are the five things a Pi session does. They should be summarized in
`tickets/README.md` and pointed to from `AGENTS.md` so a cold session loads them.

### Session start
1. Read `tickets/README.md` (loaded via `AGENTS.md`).
2. `ls tickets/active/`.
   - **If a ticket is there:** that is your job. Read it top to bottom, especially
     `Handoff notes`, re-run `Verification` to learn current state, and continue.
   - **If empty:** look at `tickets/ready/`. If it has tickets, you may **activate
     the top one** (§5 activate). If `ready/` is also empty, **refine backlog**.
3. Never start a second ticket while `active/` is occupied.

### Refine backlog tickets
- Pick a backlog ticket (highest value / unblocks others).
- Work it toward the Definition of Ready (§3): fill Scope, Out of scope,
  Acceptance criteria, Verification; resolve `depends_on`.
- If it exceeds one focused commit, **split** (§7) rather than promote.
- When DoR holds, `git mv` to `ready/` and give it an ordering prefix.
- If you can't reach DoR, leave it in backlog with the open question written down.

### Activate one planned ticket
- Confirm `active/` is empty and `depends_on` are all `done/`.
- `git mv ready/NNNN-*.md active/`.
- Append a Handoff note: date + intended plan.
- Optionally make a `chore(tickets): activate T-NNNN` commit.

### Implement and verify an ongoing ticket
- Do the work as one coherent change. Keep it inside `Scope`; anything new and
  tempting goes to **backlog as a new ticket**, not into this one.
- **Update `Handoff notes` as you go**, not just at the end — this is what makes a
  mid-flight session interruption recoverable. Note files touched and decisions.
- Run everything in `Verification`. Check off acceptance criteria as they pass.
- If you discover the ticket is really two things, stop coding and split (§7).

### Complete and prepare handoff
- All acceptance criteria checked, `Verification` run and result noted.
- Commit the implementation as one focused commit (§8).
- Set `outcome: completed` and `commit: <hash>`; write a final Handoff note
  ("shipped X; next likely step Y; gotcha Z").
- `git mv active/NNNN-*.md done/`.
- File any spin-off ideas as new backlog tickets.
- `active/` is now empty, so the next session can immediately pick up.

---

## 6. Guardrails

- **Tickets too large.** The "one focused commit" rule is the size limit. Concrete
  heuristics for splitting: more than ~5 acceptance criteria; the word "and"
  joining independent deliverables in `Scope`; or the change spans two unrelated
  tools (e.g. extraction *and* ranking). If any holds at refinement, split.
- **Hidden dependencies.** Make them explicit with `depends_on`, and enforce at two
  gates: a ticket can't enter `ready/` and can't be `activate`d unless all deps are
  in `done/`. Because the rule lives in frontmatter, it survives across sessions.
- **Vague tickets entering planned.** The Definition of Ready (§3) is the gate. The
  decisive item is *verifiability*: if you can't write the exact command in
  `Verification` that proves the ticket is done, it isn't ready — full stop.
- **Scope drift during implementation.** Two mechanisms: the `Out of scope`
  section names temptations up front, and the standing rule "new ideas become new
  backlog tickets, never additions to the active ticket." The single-active
  invariant reinforces this — you literally cannot start the shiny new thing
  without finishing or parking the current one.
- **Atomic commits.** One ticket → one focused commit, made only after acceptance
  criteria pass. If the work won't fit one commit, that's the signal the ticket
  should have been split. The `commit:` field records the hash, tying ticket to
  diff permanently.

---

## 7. Dependency and split procedure

### Resolving a dependency
1. While refining ticket **A**, you realize it needs **B** first.
2. Add `B`'s ID to A's `depends_on`.
3. If `B` doesn't exist yet, create it in `backlog/` and reference its new ID.
4. A stays in `backlog/` (cannot reach `ready/` with an unmet dep).
5. Refine and ship `B` through to `done/` (outcome `completed`).
6. Now A's dep is satisfied; A may be promoted to `ready/` and later activated.

No dependency *graph file* is needed — `depends_on` plus the "deps must be in
`done/`" gate is sufficient for a single-developer cadence where work is serial
anyway.

### Splitting a large ticket
1. Stop. Do not promote or implement the oversized ticket.
2. Create N child tickets (new IDs) in `backlog/`, each one focused deliverable.
   Carry over the relevant Scope/criteria into each child.
3. Wire ordering with `depends_on` where children must happen in sequence.
4. In each child's `Summary`, note "Split from T-XXXX."
5. **The original ticket goes to `done/` with `outcome: split`**, and its Handoff
   notes list the child IDs. It is *not* kept as a lingering "epic" — that would
   add a state to manage. The children are now the real work; the parent is a
   historical record explaining where they came from.

This deliberately avoids an epic/parent-task concept. The parent's only job after
splitting is to be findable later via its `outcome: split` and child list.

---

## 8. Commit and git conventions

- **Ticket ID:** `T-NNNN`, zero-padded, monotonically increasing, assigned at
  creation and **never reused or changed**. Filename is `NNNN-short-slug.md`
  (e.g. `0007-candidate-extraction.md`). The slug aids humans; the number is the
  identity. State is *not* encoded in the ID — that's the whole point of moving
  files between directories.
- **Ordering in `ready/`:** if you want explicit priority, prefix the filename with
  a two-digit order (`10-0007-candidate-extraction.md`) or simply rely on the ID
  order. Keep ordering out of the frontmatter to avoid a second thing to sync.
- **Commit messages:** Conventional Commits, with the ticket ID as a trailer so
  it's machine-greppable:

  ```
  feat(extraction): add candidate extraction from raw pages

  Implements T-0007. Parses local raw files into candidate records and
  writes them to data/candidates/.

  Ticket: T-0007
  ```

  Use types like `feat`, `fix`, `docs`, `chore`, `refactor`. The `chore(tickets):`
  scope is handy for pure ticket-state moves (`activate`, `split`, `reject`).
- **Recording the final commit:** after the implementation commit lands, write its
  hash into the ticket's `commit:` field and move the ticket to `done/`. This
  produces a clean two-way link: the commit names the ticket (trailer), and the
  ticket names the commit (`commit:` field). Practically, this is one extra small
  commit (`chore(tickets): close T-0007`), or you can amend if you haven't pushed.
  Recommend the separate small commit — it keeps the implementation diff pure.

---

## 9. Minimal automation wishlist

Everything below is **optional**. The system must work with nothing but `git mv`
and a text editor. Add automation only when manual friction is proven. Listed in
the order I'd actually add them, smallest first. In Pi, "1" and "2" are the
obvious first candidates, and they can start as shell scripts and *later* become a
tiny `pi.registerTool()` extension if the manual flow proves its worth.

1. **`new-ticket` (scaffold).** Computes the next `T-NNNN`, copies `_TEMPLATE.md`
   into `backlog/`, fills `id`/`created`/`title`. *Worth it early:* manual ID
   allocation is the most likely place for collisions across sessions, and
   template drift is the second. A 15-line script removes both. Could also be a
   Pi prompt template (`/new-ticket`) or extension tool.
2. **`check-active` (invariant guard).** Fails if `tickets/active/` contains more
   than one file. *Worth it early:* this is the system's load-bearing rule;
   cheap to assert, catastrophic to silently violate. Ideal as a pre-commit hook.
3. **`check-ready` (DoR lint).** For each file in `ready/`, verify the required
   sections are non-empty and contain no template placeholders. *Worth it
   medium-term:* catches under-specified tickets before they waste an
   implementation session.
4. **`check-deps` (dependency gate).** Warn if any ticket in `ready/` or `active/`
   has a `depends_on` entry not present in `done/` with `outcome: completed`.
   *Worth it later:* valuable only once dependencies actually appear; until then
   it guards an empty case.

What should stay **manual indefinitely:** state transitions themselves (`git mv`
is already atomic and reviewable — automating it hides intent), writing acceptance
criteria and handoff notes (the human/agent judgment *is* the work), and anything
resembling a dashboard (`ls` and `grep` suffice for one developer). Resist a
"sync the index" script — there is no index to sync, and there shouldn't be.

---

## 10. Critique of this design

### Most likely failure modes
- **Handoff-note rot.** The entire resumability promise rests on `Handoff notes`
  being kept current. An agent that updates them only at completion breaks
  mid-flight recovery — the one scenario this system exists for. *Mitigation:*
  make "append a Handoff note" an explicit step of the implement loop (§5), not a
  closing chore.
- **Backlog as graveyard.** Captured ideas accumulate and never get refined. This
  is mostly fine (cheap to ignore) but can hide good work. *Mitigation:* occasional
  "refine pass" sessions; accept that some backlog items will be rejected en masse.
- **ID allocation races.** Two sessions creating tickets pick the same number.
  Low risk for a single developer working serially, but real. *Mitigation:* the
  `new-ticket` script, or just check the max ID before creating.
- **Paused-active deadlock.** A hard ticket sits in `active/` half-done, blocking
  all new work. This is *by design* (it creates pressure to finish), but a
  genuinely stuck ticket needs the rollback path (§3) to be used, not ignored.

### What's overkill
- **`depends_on`** will be empty for most tickets in a project of small,
  independent V2 capabilities. I keep it because the cost is one frontmatter line
  and the failure mode it prevents (hidden ordering) is nasty — but expect it
  rarely used.
- **The `split` outcome and split procedure** is more ceremony than a one-person
  project hits often. Justified only because splitting-instead-of-bloating is an
  explicit project goal.

### What might be missing
- **Priority signal.** Beyond filename ordering in `ready/`, there's no notion of
  importance. Deliberate — estimates and priorities are the first things to rot —
  but if "which next?" becomes a real question, a single `ROADMAP.md` ordering
  note is the lightest fix.
- **Themes/tags.** No way to group "all wiki tickets." If that need appears, a
  `tags:` frontmatter line plus `grep` is enough; don't add a taxonomy.
- **Linking discovered work back to its source ticket** is only informal (a
  Handoff note). Fine at this scale.

### What I'd simplify further if forced
- **Drop `ready/`, keep three states.** You *could* fold ready into backlog with a
  `status: ready` field. I argue against it (agents benefit from one physical
  place for implementable work), but it's the first cut I'd consider if the
  backlog/ready boundary feels like overhead in practice.
- **Drop `Out of scope` and `Implementation notes`** if drift never materializes;
  they're guardrails, not requirements, and a disciplined operator may not need
  the written reminder.

The honest summary: the only parts that truly must exist are the **single
`active/` slot**, the **Definition of Ready gate** (especially verifiability), and
**durable Handoff notes**. Everything else is supporting scaffolding that can be
trimmed if it stops paying for itself.