# Prompt: File-Based Ticket Workflow for Pi-Assisted Development

```text
We are working on a repository named pi-linuxfr.org.

Project context:
- The project builds a minimal Pi extension around public LinuxFr.org pages.
- The current technical MVP has three Pi tools:
  1. linuxfr_collect_pages: collect explicit public LinuxFr URLs into local raw files.
  2. linuxfr_query_raw: inspect the local raw dataset.
  3. linuxfr_update_wiki: create lightweight cited Markdown wiki notes from selected raw sources.
- The broader goal is to use Pi as a general agentic harness and LinuxFr as a first public-read-only dataset provider.
- The project intentionally follows small MVP steps.
- No full crawler, no authentication, no private data, no vector database, no heavy automation unless clearly justified.
- Work often happens across separate AI-agent sessions, so handoff and resumability matter.
- Repository artifacts must be written in English.

About Pi:
- Official website and documentation entry point: https://pi.dev
- Pi is a minimal terminal coding harness for AI-assisted software work.
- We use Pi both to build this repository and as the runtime for the LinuxFr extension we are building.
- By default, Pi gives the model coding tools such as read, write, edit, and bash.
- Pi loads repository guidance from files such as AGENTS.md.
- Pi sessions can be resumed, forked, branched, compacted, and exported, but separate work sessions still need durable file-based handoff.
- Pi is intentionally minimal: it does not impose built-in to-dos, plan mode, sub-agents, or a project-management workflow.
- Pi can be extended with TypeScript extensions, skills, prompt templates, themes, and packages.
- Project-local extensions live under .pi/extensions/ after project trust and can register custom tools via pi.registerTool().
- The existing LinuxFr tools are implemented as Pi extension tools, so any ticket workflow should fit naturally with Pi-assisted coding and may later be automated through a Pi extension only if the manual workflow proves useful.
- If you can browse the web, consult https://pi.dev before answering. If you cannot browse, rely on the summary above.

Current problem:
The project has reached a point where there are several possible next directions: candidate extraction, candidate ranking, run manifests, public comment collection, prompt experiments, workflow documentation, and other small V2 capabilities.

We need a lightweight file-based ticket workflow inside the git repository so that:
- ideas can be captured without losing them;
- planned work is clear enough for another agent session to implement;
- only one implementation ticket is active at a time;
- each ticket maps to an atomic feature or change;
- each ticket normally maps to one focused commit;
- the workflow remains simple enough for Pi-assisted work;
- a new AI session can resume work by reading files, not conversation history.

Important constraints:
- Prefer Markdown files and directories over databases or external tools.
- Prefer a manual workflow first; automation can be suggested but should not be required.
- Do not assume Claude Code-specific agents, skills, slash commands, or permission systems.
- Do design for Pi-assisted development: a terminal coding agent reading and editing repository files, running commands, and optionally using project-local TypeScript extension tools.
- Do not design a full project-management platform.
- Keep the system useful for a single developer working with AI agents session by session.
- The workflow must be durable over time: avoid wording or concepts that only make sense before a specific future milestone.

Task:
Design the file-based ticket workflow you would recommend for this repository.

Please answer with the following structure:

1. Executive recommendation
   - What minimal ticket system would you introduce?
   - Why is this the right level of structure for this project now?

2. Directory layout
   - Propose the directory tree.
   - Explain each directory state.
   - Explain whether you would include backlog, planned, ongoing, completed, rejected, archive, roadmap, or any other state.
   - Justify every state you include or exclude.

3. Ticket lifecycle semantics
   - Explain what it means to move a ticket from one state to another.
   - For each transition, explain:
     - what must be true before the move;
     - what files or fields must be updated;
     - what the agent should do if required information is missing;
     - how dependencies should be handled;
     - when the ticket should be split instead of moved forward.

4. Ticket template
   - Provide a concrete Markdown ticket template.
   - Include only fields and sections that are truly useful.
   - Explain which fields may be vague in backlog and which must be complete before planned or ongoing.

5. Agent workflow
   - Describe how an AI agent should use this system at the start of a session.
   - Describe how an AI agent should refine backlog tickets.
   - Describe how an AI agent should activate one planned ticket.
   - Describe how an AI agent should implement and verify an ongoing ticket.
   - Describe how an AI agent should complete the ticket and prepare a handoff.

6. Guardrails
   - How do we prevent tickets from becoming too large?
   - How do we prevent hidden dependencies?
   - How do we prevent vague tickets from entering planned?
   - How do we prevent scope drift during implementation?
   - How do we keep commits atomic?

7. Dependency and split procedure
   - Give a practical procedure for resolving dependencies.
   - Give a practical procedure for splitting a large ticket into smaller tickets.
   - Explain what happens to the original ticket after a split.

8. Commit and git conventions
   - Recommend a ticket ID convention.
   - Recommend a commit message convention.
   - Explain how the ticket should record the final commit.

9. Minimal automation wishlist
   - If automation later becomes useful, list the smallest scripts or checks you would add.
   - For each, explain why it is worth adding or why it should remain manual for now.

10. Critique your own design
   - What are the most likely failure modes?
   - Which parts are overkill?
   - Which parts may be missing?
   - What would you simplify further?

Please be opinionated and concrete. The goal is not to describe every possible ticket system. The goal is to recommend a minimal, agent-friendly, file-based workflow that would work well for this repository and remain usable across many separate AI sessions.
```
