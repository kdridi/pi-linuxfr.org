# Ticket Advisory Artifacts

This directory stores durable advisory outputs produced by ticket workflow commands.

Artifacts are not workflow state. The authoritative state remains the ticket file location under `tickets/backlog/`, `tickets/planned/`, `tickets/ongoing/`, `tickets/completed/`, or `tickets/rejected/`.

## Layout

Use one Markdown file per ticket and artifact type:

```text
tickets/.artifacts/
  readiness/PLF-019.md
  plans/PLF-019.md
  verification/PLF-019.md
  completion/PLF-019.md
```

Artifact paths are deterministic:

```text
tickets/.artifacts/<artifact-type>/<ticket-id>.md
```

Allowed artifact types are:

- `readiness` — readiness briefs for backlog or planned tickets.
- `plans` — implementation plans for planned tickets.
- `verification` — verification briefs for ongoing tickets.
- `completion` — completion briefs before moving an ongoing ticket to completed.

## Metadata

Each generated artifact should start with small YAML frontmatter:

```yaml
---
artifactType: plans
commandName: ticket-plan
generatedAt: 2026-06-24T15:00:00.000Z
ticketId: PLF-019
ticketPath: tickets/ongoing/PLF-019.md
ticketState: ongoing
ticketSha256: <sha256-of-ticket-file>
advisory: true
advisoryNotice: "Advisory artifact only. Ticket files and ticket state directories remain authoritative."
---
```

A command may add command-specific fields, but it should keep metadata inspectable.

## Staleness

An artifact is likely stale when any of these no longer match the current ticket:

- `ticketPath`
- `ticketState`
- `ticketSha256`

Commands may still show stale artifacts as historical evidence, but they must not treat them as current authority.

## Safety rules

- Do not use this directory for ticket state transitions.
- Do not move tickets into this directory.
- Do not commit automatic decisions based only on these artifacts.
- Prefer regenerating an advisory artifact over manually editing it.
