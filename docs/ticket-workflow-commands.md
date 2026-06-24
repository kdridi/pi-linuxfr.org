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

## Existing command

### `/ticket-status`

Read-only command that reports ticket counts by state, the active ongoing ticket when exactly one exists, missing state directories, and basic workflow errors.

### `/ticket-child-diagnostic`

Read-only diagnostic command for the reusable child Pi advisory runner. It immediately displays a starting message, launches one bounded child Pi process, captures its Markdown output, and displays the final result to the parent session. The command is for validating the runner primitive; future commands should call the helper directly and write advisory artifacts themselves when appropriate.

The child process is launched with this safety boundary:

```bash
pi --approve --no-session --no-extensions --no-skills --no-prompt-templates --no-themes --tools read,grep,find,ls -p '<prompt>'
```

The parent also sets `PI_TICKET_CHILD=1` in the child environment and refuses to spawn another child when that variable is already present. The tool allowlist intentionally excludes `write`, `edit`, and `bash`.

## Command interaction classes

Ticket workflow commands fall into two interaction classes:

- deterministic display-only commands inspect local workflow state and show bounded results without asking the parent LLM to synthesize anything;
- advisory commands produce a verdict, plan, verification result, or transition recommendation that should be handed back to the parent LLM for conversational synthesis.

`/ticket-status` is deterministic and display-only. Future audit commands such as `/ticket-doctor` should also stay deterministic and display-only by default unless a later ticket explicitly adds advisory handoff behavior.

Future advisory commands such as `/ticket-readiness`, `/ticket-plan`, `/ticket-verify`, `/ticket-activate-check`, and `/ticket-completion-brief` should use the parent LLM handoff pattern below.

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

Future advisory commands should write Markdown artifacts under `tickets/.artifacts/` using deterministic paths:

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
