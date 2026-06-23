# Agentic AI Career Radar Prompt

Use this prompt in Pi with the `linuxfr-dataset` extension enabled.

The goal is to test whether the current three-tool LinuxFr MVP can produce a useful cited analysis for a concrete personal research need, without adding any new tool.

```text
I want to test a LinuxFr use case named “Agentic AI Career Radar”.

Personal context:
I want to work at Alan in a team that builds an internal agentic harness.
I have already built agentic harnesses.
I now want to deepen my skills in generative AI, agents, developer tooling, open source, evaluation, RAG, local models, automation, and internal workflows.

Goal:
Using recent public LinuxFr sources, identify weak signals, projects, communities, authors, tools, and debates to follow in order to better understand the current ecosystem around:

- AI agents;
- agentic harnesses;
- open source LLMs;
- RAG;
- local models;
- AI-augmented developer tools;
- emerging protocols or standards;
- agent evaluation;
- internal automation;
- sovereignty, privacy, compliance, and health-data concerns around AI.

Constraints:

- Use only the available LinuxFr tools.
- Do not crawl.
- Do not authenticate.
- Do not submit forms.
- Collect only these explicit URLs:
  - https://linuxfr.org/news.atom
  - https://linuxfr.org/journaux.atom
  - https://linuxfr.org/forums.atom
  - https://linuxfr.org/liens.atom
- Prefer local cached raw files when available.
- After collection, query the local raw dataset with searches related to:
  - IA
  - intelligence artificielle
  - LLM
  - agent
  - agents
  - RAG
  - MCP
  - modèle local
  - modèles locaux
  - Ollama
  - llama.cpp
  - Mistral
  - LangChain
  - workflow
  - automatisation
  - copilote
  - développeur
  - évaluation
  - benchmark
  - open source
  - souveraineté
  - confidentialité
  - données de santé
  - conformité
- If some terms produce no useful result, say so explicitly.

Expected output:

Create a cited Markdown report at:

`docs/prototype-prompts/agentic-ai-career-radar/result.md`

The report must be written in English and must contain:

1. Executive summary
   - What LinuxFr currently seems to signal around generative AI and agents.
   - What is directly useful for someone aiming to work on an internal agentic harness.

2. Detected weak signals
   For each signal:
   - short name;
   - description;
   - cited LinuxFr sources;
   - why it is relevant to the personal goal;
   - confidence level: low / medium / high;
   - next thing to read or collect.

3. Projects and tools to watch
   Group them by category:
   - local models;
   - orchestration / agents;
   - RAG / search;
   - AI developer tools;
   - evaluation / benchmark;
   - privacy / sovereignty;
   - internal automation.

4. Communities, authors, or source types to follow
   - Identify public LinuxFr authors, journals, links, or source types that seem useful to follow.
   - Do not perform intrusive personal profiling.
   - Only mention public sources that are useful for further reading.

5. What LinuxFr may see that mainstream AI watch misses
   - French-speaking angles;
   - open source concerns;
   - skepticism patterns;
   - sovereignty, privacy, health, and enterprise-readiness concerns.

6. Recommended learning plan
   Based on the detected signals, suggest:
   - 5 topics to study;
   - 5 projects or tools to test;
   - 5 technical questions to investigate;
   - 5 next LinuxFr URLs or source types to collect.

7. MVP assessment
   - What the current feeds were sufficient to discover.
   - What they were not sufficient to conclude.
   - Whether this use case is already valuable with the current MVP.
   - Which missing capability would improve the result the most, without implementing it now.

8. Evidence log
   - List every LinuxFr URL collected.
   - List every local raw path used.
   - Mention whether each source was a cache hit or a fresh fetch if the tool output provides it.

After writing the report, answer briefly in the conversation with:

- the 5 most interesting signals;
- the 5 projects or tools to follow;
- a verdict on whether the current MVP is sufficient for this use case;
- the path of the generated report.
```
