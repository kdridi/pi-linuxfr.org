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
