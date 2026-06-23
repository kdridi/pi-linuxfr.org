Here is the review, as a single copy-pasteable Markdown document.

---

# Review: File-Based Ticket Workflow for `pi-linuxfr.org`

Verdict up front: **adjust lightly, do not redesign.** The model is sound and well-matched to Pi. The problems are a small number of duplicated-state and under-specified-command issues that will cause predictable drift across sessions. Fix those five things and this is reliable.

## 1. Agent usability verdict

Dropped into a fresh Pi session, **yes, I could use this reliably** — with a few foreseeable mistakes.

Immediately clear:
- State = directory. This is the single best decision in the design. No index to parse, no pointer files, `ls tickets/ongoing/` answers "what am I doing."
- The single-ongoing invariant and the "read README → inspect ongoing → continue or activate" loop.
- The bootstrap exception, which removes the obvious chicken-and-egg objection ("how do I create the ticket system without a ticket?").

Still ambiguous:
- **`status` frontmatter vs directory.** Both encode state and the README requires updating `status` on every move. When they disagree (and across interrupted sessions they *will*), which wins is never stated. This is the workflow's biggest latent bug.
- **Which planned ticket to pick.** Step 5–6 of the session workflow says "inspect `planned/`" and "if a planned ticket is selected" — selection criterion unspecified. `priority` exists in frontmatter but is never referenced for selection. An autonomous fresh session has no rule to choose between three planned tickets.
- **Timestamp format.** The template wants `YYYY-MM-DD HH:MM:SS`; "use the `date` command" produces a different default and is timezone-dependent. Two sessions will write inconsistent timestamps.
- **How to find a ticket's commit.** The README says the commit message is the durable link, but never states the lookup (`git log --grep=PLF-XXX`). An agent reconstructing history has to guess.
- **`mv` vs `git mv`.** Never specified. A plain `mv` plus a dead session loses the move; it also fragments the history that the README calls "the audit trail."

## 2. Fit to Pi

Strong fit. This is close to ideal for Pi's philosophy.

- File-based, inspectable, no daemon, no DB, no scheduler — matches Pi's minimalism.
- Uses exactly the four tools Pi gives by default: read (README/tickets), write/edit (frontmatter, log), bash (`mv`, `date`, `git`). Nothing here assumes plan-mode, sub-agents, to-dos, or any feature Pi deliberately omits. Correctly so.
- Resumability is the explicit design goal and the directory-as-state model serves it well: a cold session reconstructs full state from the filesystem with one `ls`.

One Pi-specific gap: Pi sessions **fork and branch**. The single-ongoing invariant is only true on a single linear branch. Two forks can each activate a ticket, or both edit the same one, and a later merge silently violates the invariant. Worth one caveat sentence (see §7).

## 3. Directory structure review

The five-state model (`backlog`, `planned`, `ongoing`, `completed`, `rejected`) is **right**. Keep all five.

- No directory is missing. The tempting addition is `blocked/` — **don't add it.** Blocking is correctly handled by leaving the ticket in `ongoing/` with a log note, or moving it back to `planned/`. A sixth directory would be ceremony.
- No directory is unnecessary. `rejected/` earns its place: it stops an agent from re-proposing already-rejected ideas, which git-deletion would not (an agent reads directories far more readily than it spelunks history). `completed/` is the cheap, greppable archive.
- Names: `ongoing/`, `backlog/`, `completed/`, `rejected/` are unambiguous. `planned/` is the only slightly weak one — the README leans entirely on "definition of ready," so `ready/` would communicate the invariant better. The rename is not worth the churn now; flagging it only so you choose deliberately.

One consequence of the single-ongoing rule deserves stating explicitly: a paused-but-unfinished ticket sitting in `ongoing/` **blocks all other work**. That is the intended pressure, but a fresh agent should be told to move it back to `planned/` if it is genuinely blocked, rather than parking a second ticket somewhere creative.

## 4. README review

Durable and mostly clear. It explains failure handling unusually well — every transition has an "if not ready" branch, which is exactly what a cold agent needs. Specific findings:

- **State transition rules:** clear, with the one exception of the `status`/directory duality (§1). The fix is a single authoritative-source sentence, not a rewrite.
- **What to do when a rule fails:** well covered. The "more than one ticket in `ongoing/` → stop and report corruption" guard is good. Consider telling the agent *not to auto-pick* one — currently implied, not stated.
- **Dependency procedure:** operational enough, but dependencies live in two places (`Dependencies` body section *and* `dependencies:` frontmatter, "if useful"). "If useful" guarantees inconsistency. Pick one authoritative source.
- **Split procedure:** operational and correct, including the sharp call that a superseded parent goes to `rejected/` (not `completed/`) with `Resolution: superseded by <ids>`. Good.
- **Session workflow:** precise except for the planned-selection gap (§1).
- **Too verbose:** the README is long, and an agent reads it *every* ticketed session, spending context budget each time. The operational core (session loop + invariants + directory meanings) is buried below long checklists. Front-load it.
- **Missing:** authoritative-state rule; exact `date` command; `git mv`; `git log --grep` lookup; planned-selection rule.

## 5. Template review

Minimal-but-sufficient is *almost* achieved; two fields are noise.

Useful, keep: `id`, `title`, `type`, `created`, `updated`, `dependencies`, and the body sections (`Objective`, `Scope`, `Acceptance Criteria`, `Verification`, `Resolution`, `Log`). The append-only `Log` is the single most important handoff feature — it is what lets a mid-ticket stop resume cleanly. Keep it exactly as designed.

Redundant / candidate for removal:
- **`estimated_complexity` (small/medium/large):** every planned ticket must already be "small enough for one focused commit." So this field is ~always "small" — pure ceremony. Drop it, or fold a one-line note into `Implementation Notes` only when something is unusually risky.
- **`priority` (P0/P1/P2):** currently *dead* — never referenced for selection. Either give it a job (use it in planned-selection, §7) or drop it. Don't keep a field nothing reads.
- **`status` frontmatter:** redundant with the directory (§1). My recommendation is to drop it and let the directory be the only state; if you keep it, declare it a non-authoritative mirror.
- **`title` appears twice** (frontmatter + `# PLF-XXX:` heading). Minor; acceptable since the heading is for human reading.

Backlog vagueness vs planned readiness: the template supports this well — the same file is allowed to be sketchy in `backlog/` and the README's definition-of-ready gates the move. Good.

Missing: nothing structural. Optionally a one-line `Commit:` field under `Resolution` to hold the hash when practical, so the lookup target is explicit.

## 6. AGENTS.md review

The ticket guidance in `AGENTS.md` is the right amount — it points to `tickets/README.md` as the source of truth and restates only the invariant ("inspect `ongoing/` first, continue only that ticket"). Don't expand it; duplicating the README here would create a second drift source.

One genuine conflict to resolve: `AGENTS.md`'s **Change discipline** ("Does the MVP need this? Can it wait? Prefer waiting.") sits in tension with a ticket backlog that invites capturing every idea. These are reconcilable — capturing in `backlog/` is explicitly *not a commitment* — but a fresh agent may read "log all discoveries as backlog tickets" as license to generate volume. Add half a sentence in `AGENTS.md` or the README: *capturing a backlog ticket is free; promoting one to `planned/` is where change-discipline applies.* That keeps the two systems aligned.

## 7. Optimization proposal

Smallest concrete changes. **Must-change** first.

**M1 — Declare the directory authoritative; demote or drop `status`.**
In README under "Directory states" add:
> The directory is the single source of truth for state. If a ticket's `status` frontmatter disagrees with its directory, the directory wins; fix the frontmatter to match.
Then either remove `status` from `TEMPLATE.md` entirely (preferred), or keep it and change the per-transition rule from "update the `status` field" to "update `status` to mirror the directory (the directory remains authoritative)."

**M2 — Pin the timestamp command.**
Replace "using the `date` command" with:
> Generate timestamps with `date -u '+%Y-%m-%d %H:%M:%S'` (UTC), so timestamps are consistent across sessions and timezones.

**M3 — Use `git mv` and state the commit lookup.**
In "State transitions" add:
> Move tickets with `git mv` so history follows the file. To find the commit that completed a ticket, run `git log --grep=PLF-XXX`.

**M4 — Define planned-selection (and thereby give `priority` a job, or drop it).**
In "Manual session workflow" step 6 add:
> When several planned tickets are ready and the user gave no direction, present them ordered by `priority`, resolved dependencies first, and ask the user to choose. Never auto-activate.
If you don't want this rule, delete `priority` from the template instead.

**M5 — One dependency source of truth.**
Change "Add it to the ticket's `Dependencies` section and frontmatter if useful" to:
> The `dependencies:` frontmatter list is authoritative (machine-checkable). Use the body `Dependencies` section only for prose explanation.

**Nice-to-have:**

- **N1 — Front-load the README.** Move "Manual session workflow" and the invariants (single ongoing, directory = state, bootstrap exception) to the top, push the long transition checklists below. Reduces per-session context cost and skim-failure.
- **N2 — Drop `estimated_complexity`** (subsumed by "must be small to be planned").
- **N3 — Fork caveat.** Add: *This workflow assumes serialized work on one branch. Parallel Pi forks can both activate or edit a ticket; reconcile the single-ongoing invariant when branches merge.*
- **N4 — Add a `Commit:` line** under `Resolution` in the template.
- **N5 — Reconcile change-discipline vs backlog** (the half-sentence in §6).

I am deliberately **not** proposing automation. The README's "add at most-one-ongoing / required-sections / unique-ID checks only when manual becomes painful" is the correct trigger, and M1–M5 remove the failure modes a script would otherwise be papering over. When pain *does* appear, the first thing to add is a ~10-line shell check for exactly those four invariants — justified because they are precisely the ones agents forget and they are trivially checkable — and nothing more.

## 8. Can you work with this?

**Yes, as-is.** Nothing here blocks me. With the current text (before fixes) the mistakes I would most likely make:

1. Move a ticket with `mv`, forget to update `status`, and leave a ticket whose frontmatter contradicts its directory — then, on resume, trust the wrong one because the precedence isn't stated.
2. Write `updated:` timestamps in an inconsistent format/timezone from a different session.
3. Complete a ticket and forget to put `PLF-XXX` in the commit message — silently breaking the only durable git link, because the hash often can't go in the committed file.
4. Stall on which of three planned tickets to activate, or pick arbitrarily.

All four are closed by M1–M4. None is a design flaw; each is a missing one-liner.

## 9. Pre-mortem

Six months out, here is the most likely way this has gone bad:

- **What went wrong:** `status` drifted from directories until nobody trusted the frontmatter, so agents started relying on directory alone *but kept editing `status` anyway* — pure overhead producing wrong data. Meanwhile a few commits shipped without `PLF-XXX` in the message, so the git↔ticket link silently broke and `completed/` tickets point to nothing recoverable.
- **First rule ignored:** "update the `status` field on every transition," followed closely by "record the commit identifier / put the ID in the commit message."
- **Noisiest directory:** `backlog/` — it became an idea graveyard. Change-discipline says "prefer waiting," every discovery becomes a backlog ticket, and nothing gets refined out, so `backlog/` fills with stale, never-promoted notes that an agent must wade through.
- **Ceremony without value:** `priority` and `estimated_complexity` — copy-pasted on every ticket, read by nothing.
- **Ambiguity causing repeated mistakes:** "which planned ticket do I pick," and the `status`/directory precedence.
- **Early warning signs the maintainer should watch:**
  - any ticket where `status` ≠ its directory;
  - tickets sitting in `ongoing/` for many days (paused-and-forgotten, blocking everything);
  - commits in `git log` with no `PLF-` token;
  - `backlog/` growing while `planned/`→`completed/` throughput stays flat;
  - `planned/` tickets that don't actually meet the definition of ready.
- **Minimal guardrails that prevent this:** M1 (kill the drift at the source), M3 (greppable commit linkage), M4 (no selection stalls), and a periodic human/agent sweep of `backlog/` to reject-or-refine stale entries. The optional 4-invariant check script is the *only* automation worth adding, and only once the manual sweep stops happening.

## 10. Final recommendation

**Adjust lightly. Do not redesign.** The directory-as-state model, the single-ongoing invariant, the per-transition failure branches, and the append-only log are good and should be preserved untouched.

Apply the five must-changes, ranked by urgency:

1. **M1 — directory is authoritative; drop/demote `status`.** (Prevents the central drift bug.)
2. **M3 — `git mv` + `git log --grep=PLF-XXX`.** (Protects the audit trail and recoverability.)
3. **M4 — planned-selection rule / give `priority` a job or cut it.** (Removes the cold-session stall.)
4. **M2 — pin `date -u '+%Y-%m-%d %H:%M:%S'`.** (Consistency across sessions.)
5. **M5 — one dependency source of truth.** (Removes a second drift surface.)

Then, if you have appetite: front-load the README (N1), drop `estimated_complexity` (N2), add the fork caveat (N3). Leave everything else exactly as written, and resist adding automation until the manual loop demonstrably hurts — at which point a single ~10-line invariant check, not a platform, is the answer.