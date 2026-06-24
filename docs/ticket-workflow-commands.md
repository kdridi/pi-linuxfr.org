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
