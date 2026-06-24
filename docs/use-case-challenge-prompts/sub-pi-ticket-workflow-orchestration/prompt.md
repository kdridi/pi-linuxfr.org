# Prompt: Sub-Pi Ticket Workflow Orchestration

````text
We are working in a real repository named pi-linuxfr.org.

Important output constraint:
- Return your entire answer as one single Markdown response block.
- Do not create or reference additional downloadable files.
- Do not say "see attached file" or "I created files".
- If you propose file contents, schemas, commands, prompts, or examples, include them inline.
- Be concrete and opinionated, but do not assume your first design is the only valid one.

Context:
- This is a small Pi-assisted software repository.
- Official Pi documentation entry point: https://pi.dev
- Pi is a terminal coding agent harness. It can read and edit files, run shell commands, and be extended with project-local TypeScript extensions, skills, prompt templates, and commands.
- Pi intentionally does not impose built-in to-dos, plan mode, sub-agents, or project management workflows.
- Pi can be run non-interactively from the CLI, can be restricted to specific tools, and can be orchestrated through extensions, JSON mode, RPC mode, or SDK usage.
- Repository artifacts must be written in English.
- The project values minimal, inspectable, human-directed workflows over heavy automation.

Current ticket workflow:
The repository uses a lightweight file-based ticket workflow under `tickets/`.
The directory containing a ticket file is the source of truth for its state:

```text
tickets/
  backlog/     Raw ideas, rough notes, and unscheduled work.
  planned/     Refined tickets ready for implementation.
  ongoing/     The single active ticket being implemented.
  completed/   Tickets whose work has been implemented, verified, and committed.
  rejected/    Tickets intentionally not implemented as written.
```

Core rules:
- One ticket should describe one atomic feature or change.
- One ticket should normally map to one focused commit.
- Only one ticket may be in `ongoing/` at a time.
- A ticket in `planned/` must be ready for a fresh Pi session to implement without hidden assumptions.
- Before `backlog/` -> `planned/`, objective, scope, acceptance criteria, dependencies, expected artifacts, and verification must be clear enough.
- Before `planned/` -> `ongoing/`, `ongoing/` must be empty and dependencies must be resolved or explicitly accepted by the human.
- Before `ongoing/` -> `completed/`, acceptance criteria must be satisfied, verification must be recorded, changed files and decisions must be documented, and the commit must include the ticket ID.
- Dependencies must be explicit before a ticket enters `planned/`.
- Tickets should be split when they are too broad, risky, cross-cutting, hard to verify in one pass, or likely to require multiple unrelated commits.
- The human remains the final decision-maker for meaningful state transitions.

Problem:
The human currently drives this workflow verbally through repeated speech-to-text instructions.
Many sessions repeat the same rituals:
- read the workflow documentation;
- inspect ticket state;
- check whether a backlog ticket is ready;
- refine or split tickets;
- prepare implementation plans;
- activate exactly one ticket;
- implement within scope;
- verify against acceptance criteria;
- update logs and completion records.

This repetition consumes context, slows down work, and creates inconsistent execution.

Goal:
Design a small Pi-native command system that reduces repeated context-heavy ticket workflow rituals while preserving the file-based ticket workflow as the source of truth.

The main idea to evaluate:
- One main Pi session remains the human-facing orchestrator.
- The orchestrator may launch child Pi sessions or use equivalent Pi mechanisms for bounded subtasks.
- Child sessions should usually be read-only and advisory.
- Child sessions should produce durable Markdown artifacts such as readiness briefs, implementation plans, or verification briefs.
- The orchestrator and human review those artifacts before state transitions or project mutations.
- Write-capable automation, if any, must be narrowly scoped and strongly guarded.

Do not assume the command design below is fixed. We are looking for your best architecture.
Possible workflow stages include:
- backlog readiness analysis;
- ticket refinement or split proposal;
- implementation planning for planned tickets;
- activation from planned to ongoing;
- implementation of the active ticket;
- verification of implementation against the ticket and plan;
- completion support.

Design challenge:
How would you design a minimal, reliable, Pi-native command system for this ticket workflow?

Please answer with the following structure:

1. Executive recommendation
   - What should be built first?
   - What should remain manual?
   - What should explicitly not be automated yet?

2. Workflow architecture
   - Describe the relationship between the main orchestrator Pi session and child Pi sessions.
   - Compare viable approaches: CLI child process, JSON mode, RPC mode, SDK, extension commands, or prompt-template-only workflow.
   - Recommend one path for the first implementation and explain why.

3. Command design
   - Propose command names and lifecycle.
   - For each command, specify:
     - purpose;
     - input arguments;
     - preconditions;
     - read/write permissions;
     - whether it may spawn a child Pi;
     - expected artifact;
     - what it reports to the orchestrator;
     - failure modes.

4. Artifact design
   - Propose where advisory artifacts should live.
   - Propose Markdown/frontmatter schemas for readiness briefs, implementation plans, verification briefs, and command logs if useful.
   - Explain which artifacts are advisory and which repository files remain authoritative.
   - Explain how to avoid trusting stale artifacts after a ticket changes.

5. Guardrails and safety
   - How do we keep child sessions from mutating the project accidentally?
   - How do we prevent recursive command spawning?
   - How do we enforce only one ticket in `ongoing/`?
   - How do we prevent implementation from exceeding ticket scope?
   - How do we keep commits atomic?
   - How do we handle failed or partial child-session runs?

6. Child-session prompt design
   - Describe the prompt patterns for child Pi sessions.
   - What context should be embedded directly in prompts?
   - What should child sessions discover through read-only file inspection?
   - How structured should their output be?

7. Human-in-the-loop checkpoints
   - Where must the human explicitly approve something?
   - Which decisions should the orchestrator never make alone?
   - How should the system surface questions when a ticket is not ready?

8. Incremental implementation plan
   - Split your proposal into small tickets suitable for the existing workflow.
   - For each proposed ticket, provide:
     - objective;
     - scope;
     - acceptance criteria;
     - likely files;
     - dependencies;
     - verification.
   - Keep the first ticket small enough for one focused implementation pass.

9. Premortem
   - Assume this command system failed after a month. What likely went wrong?
   - What early warning signs would appear?
   - What design choices reduce those risks?

10. Critique and alternatives
   - Critique your own proposal.
   - Identify what may be over-engineered.
   - Identify what may be too weak.
   - Propose one simpler alternative and one more ambitious alternative.

11. Agent behavior recommendations
   - If you were the AI in the orchestrator Pi session, how would you use these commands?
   - If you were the AI in a child Pi session, how would you constrain yourself?
   - What information would make you fast, reliable, and useful?

Please be practical. The goal is not to design a generic project-management product. The goal is to reduce repeated ticket-management rituals in a single-developer Pi-assisted repository while preserving inspectability, git-based truth, and human control.
````
