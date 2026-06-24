# Ticketization Proposal for Sub-Pi Ticket Workflow Orchestration

This proposal was produced by a read-only child Pi session on 2026-06-24 and then used by the orchestrator session to create `PLF-018` through `PLF-026`.

The child session was asked to read the ticket workflow, challenge prompt, and collected LLM responses, then propose a practical ticket sequence for a reliable, lightweight ticket workflow command system.

## Current priority

The next implementation priority is `PLF-018: Add deterministic ticket status command` in `tickets/planned/`.

A fresh session should start by reading:

- `AGENTS.md`
- `tickets/README.md`
- `tickets/planned/PLF-018.md`
- this file
- optionally `docs/use-case-challenge-prompts/sub-pi-ticket-workflow-orchestration/response-comparison.md`

The fresh session should explain why `PLF-018` matters now, propose a minimal implementation plan, mention reasonable alternatives, justify why `PLF-018` is the preferred next step, and wait for human validation before implementing.

## Recommended sequence

1. `PLF-018`: Add deterministic ticket status command.
2. `PLF-019`: Define advisory artifact conventions for ticket commands.
3. `PLF-020`: Add read-only child Pi advisory runner.
4. `PLF-021`: Add backlog ticket readiness brief command.
5. `PLF-022`: Add planned ticket implementation plan command.
6. `PLF-023`: Add ongoing ticket verification brief command.
7. `PLF-024`: Add planned ticket activation check command.
8. `PLF-025`: Add ongoing ticket completion brief command.
9. `PLF-026`: Add ticket workflow doctor command.

## Strategy summary

- Start with deterministic read-only workflow checks.
- Add advisory artifact conventions before generating advisory content.
- Add child Pi orchestration only after deterministic helpers exist.
- Keep child Pi sessions read-only and advisory.
- Keep ticket directories as the source of truth.
- Keep meaningful ticket transitions manual or explicitly human-approved.
- Do not automate commits.
- Do not add a write-capable implementation child yet.

## Suggested command phases

### Phase 1: deterministic foundation

- `/ticket-status`

### Phase 2: advisory briefs

- `/ticket-readiness <ticket>`
- `/ticket-plan <ticket>`
- `/ticket-verify`

### Phase 3: guarded helper checks

- `/ticket-activate-check <ticket>`
- `/ticket-completion-brief`
- `/ticket-doctor`

## Key risk controls

- Artifacts are advisory only.
- Every artifact should include ticket identity and a ticket fingerprint to detect staleness.
- Child Pi sessions should be launched with read-only tools and no project-local extensions.
- State transitions remain under the main orchestrator and human control.
- Commands should provide evidence and checklists, not authority.
