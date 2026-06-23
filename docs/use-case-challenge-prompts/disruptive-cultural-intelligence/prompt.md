# Prompt: Disruptive Cultural Intelligence

```text
You are not here to design a boring content summarizer.

We have a minimal local dataset tool for LinuxFr.org:
- collect explicit public LinuxFr pages or feeds;
- query the local raw dataset;
- generate cited Markdown wiki notes.

Assume this is enough to build an “agentic cultural intelligence microscope” over a long-running tech community.

Your task:
Find the most surprising, high-leverage use cases that become possible when an AI agent can gradually build a local cited memory from LinuxFr public content.

I want use cases that feel like:
- “I did not know we could extract that from public community archives.”
- “This could reveal weak signals before they become obvious.”
- “This turns forum/journal/news history into strategic intelligence.”
- “This helps understand open-source culture, adoption, controversy, and technical pain.”

Constraints:
- No crawler.
- No login.
- No comments unless explicitly collected as Atom later.
- No vector DB.
- Use only the current three-tool loop:
  collect -> query -> wiki -> reason.

Deliver:
- 15 disruptive use cases.
- For each: name, insight target, why it matters, required LinuxFr source types, MVP workflow, example user prompt.
- Then select the 5 strongest.
- For each selected use case, write a complete prompt that a user could give to an agent using this extension.
- Then propose a tool wishlist for going further: up to 10 additional agent tools or small tool improvements that would unlock even more disruptive analysis.
- For each proposed tool: name, purpose, use case unlocked, why the current MVP is insufficient, implementation complexity (small/medium/large), priority (soon/later/probably not), and public-read-only constraints.
- If you believe a truly disruptive use case requires one missing tool, describe that tool precisely.
- Do not ask for a generic crawler or vector database unless you can justify the specific insight it unlocks.
- Prefer narrow, composable tools that extend the current collect/query/wiki loop.
- Be concrete. No generic summaries.
```
