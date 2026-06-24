# Ticket Workflow Commands

This document records conventions for project-local ticket workflow commands.

## Source of truth

The ticket directories remain authoritative:

```text
tickets/backlog/
tickets/planned/
tickets/ongoing/
tickets/completed/
tickets/rejected/
```

Commands may inspect tickets and produce advisory Markdown artifacts, but they must not treat generated artifacts as workflow state.

## Existing commands

### `/ticket-status`

Read-only command that reports ticket counts by state, the active ongoing ticket when exactly one exists, missing state directories, and basic workflow errors.

### `/ticket-doctor`

Read-only deterministic audit command that checks ticket workflow consistency and prints errors, warnings, and actionable next steps without mutating files.

The command reports as errors:

- missing expected ticket state directories;
- duplicate `PLF-*.md` ticket IDs across ticket state directories;
- multiple tickets in `tickets/ongoing/`;
- unreadable ticket state directories.

The command reports as warnings:

- planned or ongoing tickets missing required ready-ticket sections from `tickets/TEMPLATE.md`;
- missing or unreadable advisory artifact directories;
- advisory artifacts missing staleness metadata;
- advisory artifacts whose recorded type, ticket ID, path, state, or SHA-256 no longer matches the current source ticket;
- advisory artifacts whose source ticket no longer exists.

Advisory artifacts are inspected only for consistency. They remain non-authoritative, and `/ticket-doctor` does not delete, regenerate, or otherwise repair them. The command does not trigger parent LLM handoff by default.

### `/ticket-child-diagnostic`

Read-only diagnostic command for the reusable child Pi advisory runner. It immediately displays a starting message, launches one bounded child Pi process, captures its Markdown output, and displays the final result to the parent session. The command is for validating the runner primitive; future commands should call the helper directly and write advisory artifacts themselves when appropriate.

The child process is launched with this safety boundary:

```bash
pi --approve --no-session --no-extensions --no-skills --no-prompt-templates --no-themes --tools read,grep,find,ls -p '<prompt>'
```

The parent also sets `PI_TICKET_CHILD=1` in the child environment and refuses to spawn another child when that variable is already present. The tool allowlist intentionally excludes `write`, `edit`, and `bash`.

### `/ticket-readiness <ticket-id>`

Read-only advisory command that analyzes a ticket currently in `tickets/backlog/` and writes a readiness brief to:

```text
tickets/.artifacts/readiness/<ticket-id>.md
```

The command refuses tickets outside `tickets/backlog/`. It starts a bounded read-only child Pi analysis, writes advisory metadata with the source ticket fingerprint, displays the readiness result, and hands the advisory result back to the parent LLM according to the parent handoff convention.

The command does not edit tickets, move tickets, create split tickets, resolve dependencies, or perform workflow transitions.

### `/ticket-plan <ticket-id>`

Read-only advisory command that analyzes a ticket currently in `tickets/planned/` and writes an implementation plan to:

```text
tickets/.artifacts/plans/<ticket-id>.md
```

The command refuses tickets outside `tickets/planned/`. It performs a small parent dependency pre-check, starts a bounded read-only child Pi analysis, writes advisory metadata with the source ticket fingerprint, displays the implementation plan, and hands the advisory result back to the parent LLM according to the parent handoff convention.

The plan should restate the objective, summarize scope boundaries, identify likely files while marking uncertainty, outline implementation steps, map acceptance criteria to verification steps where practical, list risks, and name stop conditions for scope drift or missing information.

The command does not activate tickets, edit tickets, resolve dependencies automatically, run a write-capable child, commit changes, or perform workflow transitions.

### `/ticket-activate-check <ticket-id>`

Read-only advisory command that checks whether a ticket currently in `tickets/planned/` is ready for manual activation into `tickets/ongoing/`.

The command refuses tickets outside `tickets/planned/` and refuses to continue when `tickets/ongoing/` already contains a `PLF-*.md` ticket file. It inspects explicit frontmatter dependencies, warns when the implementation plan artifact is missing or stale, prints exact suggested manual activation steps including `git mv`, and hands the activation recommendation back to the parent LLM according to the parent handoff convention.

The command intentionally writes no advisory artifact because activation checking must not mutate files. In parent handoff messages, the advisory artifact path is `(none)`.

The command does not move tickets, edit ticket logs, resolve dependencies automatically, run child Pi analysis, commit changes, or start implementation.

### `/ticket-verify`

Read-only advisory command that verifies the single ongoing ticket against its acceptance criteria, implementation plan, and current repository changes, then writes a verification brief to:

```text
tickets/.artifacts/verification/<ticket-id>.md
```

The command requires exactly one `PLF-*.md` file in `tickets/ongoing/`. It performs a bounded parent-side git changed-files snapshot (`git status --porcelain`), checks whether a plan artifact exists and whether it is stale against the current ticket SHA-256, starts a bounded read-only child Pi analysis, writes advisory metadata with the source ticket fingerprint, displays the verification brief, and hands the advisory result back to the parent LLM according to the parent handoff convention.

The brief should review each acceptance criterion, mark it satisfied, failed, or unverifiable, summarize changed files and scope, note verification evidence, and provide a verdict such as `pass`, `fail`, or `inconclusive`, plus a completion-readiness recommendation.

The command does not complete the ticket, commit changes, move files, run destructive commands, or fix failed verification automatically.

### `/ticket-completion-brief`

Read-only advisory command that prepares a completion checklist for the single ongoing ticket, then writes a completion brief to:

```text
tickets/.artifacts/completion/<ticket-id>.md
```

The command requires exactly one `PLF-*.md` file in `tickets/ongoing/`. It performs a bounded parent-side git changed-files snapshot (`git status --porcelain`), reads the latest verification artifact and warns when it is missing, stale, failed, or inconclusive, derives a parent-side completion checklist from the `ongoing -> completed` requirements in `tickets/README.md`, suggests a commit message in the `PLF-NNN: <title>` form, starts a bounded read-only child Pi analysis, writes advisory metadata with the source ticket fingerprint, displays the completion brief, and hands the advisory result back to the parent LLM according to the parent handoff convention.

The brief should summarize verification status and changed files, list remaining completion requirements with concrete next actions, restate or refine the suggested commit message, and provide a verdict such as `ready-for-completion`, `not-ready`, or `inconclusive`, plus a completion-readiness recommendation.

The command does not commit changes, move the ticket to `completed/`, edit the ticket resolution automatically, or decide that completion is allowed without human approval.

## Command interaction classes

Ticket workflow commands fall into two interaction classes:

- deterministic display-only commands inspect local workflow state and show bounded results without asking the parent LLM to synthesize anything;
- advisory commands produce a verdict, plan, verification result, or transition recommendation that should be handed back to the parent LLM for conversational synthesis.

`/ticket-status` and `/ticket-doctor` are deterministic and display-only. Future audit commands should also stay deterministic and display-only by default unless a later ticket explicitly adds advisory handoff behavior.

`/ticket-readiness`, `/ticket-plan`, `/ticket-activate-check`, `/ticket-verify`, and `/ticket-completion-brief` are advisory and use the parent LLM handoff pattern below.

## Advisory parent handoff

An advisory command must not only display child output or write an artifact. When it produces a verdict, plan, verification result, or transition recommendation, it should hand that advisory result back to the parent LLM so the main conversation can explain what matters and ask for human approval before any workflow transition.

In interactive modes, advisory commands should call `pi.sendUserMessage(...)` after the advisory result is ready. If the parent agent is busy, queue the message with `{ deliverAs: "followUp" }` instead of interrupting the current work.

The handoff message must include:

- the command name;
- the original user request or command arguments;
- the advisory artifact path when an artifact was written, or `(none)`;
- the advisory summary, verdict, or child output;
- an explicit notice that the result is advisory only;
- an explicit instruction that ticket files and ticket directories remain authoritative;
- an explicit instruction not to mutate ticket state, edit tickets, commit, or perform transitions without human approval.

Use this template, or the shared extension helper `buildAdvisoryParentHandoffMessage(...)`:

```markdown
A ticket workflow advisory command completed.

Command: <command-name>

Original request:
<request or command arguments>

Advisory artifact:
<path or none>

Advisory result:
<summary, verdict, or child output>

This is advisory only. Ticket files and ticket directories remain authoritative.
Please synthesize the result for the user, explain what matters, propose the next action, and do not mutate ticket state, edit ticket files, commit, or perform workflow transitions without explicit human approval.
```

The extension helper `deliverAdvisoryParentHandoff(...)` builds the same message and sends it only in interactive modes. In print mode, it prints a suggested handoff message instead of triggering a hidden LLM follow-up. In other non-interactive modes, commands should include the suggested handoff in their explicit command result rather than starting another LLM turn.

## Advisory artifacts

Advisory commands should write Markdown artifacts under `tickets/.artifacts/` using deterministic paths:

```text
tickets/.artifacts/<artifact-type>/<ticket-id>.md
```

Initial artifact types:

- `readiness`
- `plans`
- `verification`
- `completion`

The extension helper `buildAdvisoryArtifactPath(ticketId, artifactType)` implements this path convention.

## Artifact metadata

Generated advisory artifacts should include enough metadata to identify their source ticket and detect likely staleness:

- artifact type;
- command name;
- generated timestamp;
- ticket ID;
- ticket path;
- ticket state when known;
- SHA-256 hash of the ticket file;
- explicit advisory notice.

The extension helper `buildAdvisoryArtifactMetadata(...)` computes the ticket ID, ticket state, and SHA-256 fingerprint for a ticket path.

## Stale artifacts

An advisory artifact should be considered stale when its recorded ticket path, state, or SHA-256 no longer matches the current ticket file.

Stale artifacts can be useful history, but they must not override ticket files, ticket directories, or human decisions.
