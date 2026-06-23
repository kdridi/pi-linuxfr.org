# Agentic AI Career Radar Expanded Prompt

Use this prompt in Pi with the `linuxfr-dataset` extension enabled.

This is a stronger bounded exploration than the first radar prompt. It is still not a full crawler: it starts from explicit public LinuxFr feeds, listings, and tag pages, then extracts a limited number of relevant LinuxFr detail URLs from the collected local raw files before producing a cited report.

```text
I want to run a stronger bounded LinuxFr exploration for the use case “Agentic AI Career Radar — Expanded”.

Personal context:
I want to work at Alan in a team building an internal agentic harness.
I have already built agentic harnesses.
I want to deepen my skills in generative AI, AI agents, agentic harnesses, open-source LLM tooling, RAG, local models, evaluation, automation, developer tooling, privacy, sovereignty, and compliance.

Goal:
Use public LinuxFr sources to identify the best current signals, projects, people, communities, tools, debates, and reading paths related to:

- AI agents;
- internal agentic harnesses;
- open-source LLMs;
- RAG;
- local models;
- MCP or similar tool/context protocols;
- AI developer tools;
- AI evaluation and benchmarks;
- secure automation;
- privacy, sovereignty, compliance, and health-data concerns around AI.

Important exploration policy:

- Use only the available LinuxFr tools and local file-reading tools.
- Do not authenticate.
- Do not submit forms.
- Do not perform an unbounded crawl.
- Keep the exploration bounded and inspectable.
- Prefer cached raw files when available.
- You may collect explicit public LinuxFr feeds, listings, tag pages, and detail pages.
- You may extract LinuxFr detail URLs from raw files that you already collected, but only as a bounded second pass.
- Do not follow external websites.
- Do not collect comments unless the current LinuxFr tools explicitly support that safely.

Step 1 — collect seed sources:

Collect the following explicit public LinuxFr URLs. Use several tool calls if needed because the collector has a per-call limit.

Feeds:

- https://linuxfr.org/news.atom
- https://linuxfr.org/journaux.atom
- https://linuxfr.org/forums.atom
- https://linuxfr.org/liens.atom
- https://linuxfr.org/sondages.atom

Listings:

- https://linuxfr.org/news
- https://linuxfr.org/journaux
- https://linuxfr.org/forums
- https://linuxfr.org/liens
- https://linuxfr.org/sondages

Tag or topic pages to try. Some may not exist or may be weak; if a URL fails or is unhelpful, record that in the report:

- https://linuxfr.org/tags/intelligence_artificielle/public
- https://linuxfr.org/tags/ia/public
- https://linuxfr.org/tags/llm/public
- https://linuxfr.org/tags/agent/public
- https://linuxfr.org/tags/agents/public
- https://linuxfr.org/tags/mcp/public
- https://linuxfr.org/tags/ollama/public
- https://linuxfr.org/tags/llama.cpp/public
- https://linuxfr.org/tags/mistral/public
- https://linuxfr.org/tags/openai/public
- https://linuxfr.org/tags/rag/public
- https://linuxfr.org/tags/cybersécurité/public
- https://linuxfr.org/tags/sécurité/public
- https://linuxfr.org/tags/confidentialité/public
- https://linuxfr.org/tags/vie_privée/public
- https://linuxfr.org/tags/souveraineté/public
- https://linuxfr.org/tags/souveraineté_numérique/public
- https://linuxfr.org/tags/logiciel_libre/public
- https://linuxfr.org/tags/open_source/public
- https://linuxfr.org/tags/données_personnelles/public

Step 2 — inspect and extract candidate detail URLs:

After Step 1, inspect the local raw dataset with `linuxfr_query_raw` and, when useful, read the collected raw files directly.

Search for at least these terms:

- IA
- intelligence artificielle
- LLM
- agent
- agents
- MCP
- RAG
- modèle local
- modèles locaux
- Ollama
- llama.cpp
- Mistral
- OpenAI
- LangChain
- copilote
- développeur
- automatisation
- workflow
- benchmark
- évaluation
- pentest
- cybersécurité
- souveraineté
- confidentialité
- vie privée
- données personnelles
- données de santé
- conformité

From the collected feeds, listings, and tag pages, extract up to 40 relevant LinuxFr detail URLs.

Selection rules for candidate URLs:

- Prefer detail pages whose titles or snippets mention AI, agents, LLMs, local models, MCP, RAG, automation, developer tools, security automation, privacy, sovereignty, or compliance.
- Include a mix of source types when available: news, journals, links, forums, polls.
- Prioritize recent sources, but include older sources if they look important for context.
- Do not collect arbitrary unrelated pages.
- Do not collect more than 40 detail pages in this second pass.
- If fewer than 40 relevant URLs are available, collect fewer.

Step 3 — collect selected detail URLs:

Collect the selected LinuxFr detail URLs with `linuxfr_collect_pages`.
Use multiple calls if needed, respecting the tool limit.
Prefer Markdown when available and HTML fallback when necessary.

Step 4 — produce the final report:

Create a cited Markdown report at:

`docs/prototype-prompts/agentic-ai-career-radar-expanded/result.md`

The report must be written in English and must contain:

1. Executive summary
   - What this expanded LinuxFr exploration reveals beyond the first feed-only radar.
   - What matters most for someone aiming to work on an internal agentic harness at a health/enterprise company.

2. Corpus summary
   - Number of seed URLs attempted.
   - Number of seed URLs successfully collected.
   - Number of candidate detail URLs extracted.
   - Number of detail URLs collected.
   - Source-type breakdown: news, journals, links, forums, polls, feeds, listings, tags.
   - Mention important failures or empty tags.

3. Top weak signals
   Provide 8 to 12 signals if the corpus supports it.
   For each signal:
   - short name;
   - description;
   - supporting LinuxFr URLs and local raw paths;
   - why it matters for agentic harness work;
   - confidence level: low / medium / high;
   - what to read or test next.

4. Projects, tools, and standards to watch
   Group by:
   - agentic systems / harnesses;
   - local models and inference;
   - RAG / search / knowledge systems;
   - developer tools;
   - security automation;
   - evaluation / benchmarks;
   - privacy / sovereignty / compliance;
   - internal automation and rules-as-code.

5. People, communities, and source types to follow
   - Identify public LinuxFr authors, recurring source types, journals, links, or sections that are useful for further reading.
   - Do not perform intrusive personal profiling.
   - Explain why each public source appears relevant.

6. What LinuxFr sees that mainstream AI watch may miss
   - French-speaking angles;
   - open-source concerns;
   - skepticism and anti-hype patterns;
   - sovereignty and privacy framing;
   - security and auditability concerns;
   - enterprise or health-adjacent implications.

7. Recommended learning plan
   Based on the evidence, propose:
   - 10 topics to study;
   - 10 tools, projects, or standards to test;
   - 10 technical questions to investigate;
   - a 30-day learning plan focused on becoming stronger at agentic harness engineering.

8. MVP assessment
   - Was the expanded prompt significantly better than the feed-only prompt?
   - Which parts worked with the current tools?
   - Which parts were awkward or manual?
   - What is the single most important missing capability, without implementing it now?
   - Is this use case valuable enough to keep as a repeatable prototype prompt?

9. Evidence log
   - List seed URLs attempted and their outcome.
   - List selected detail URLs.
   - List every local raw path used as evidence.
   - Distinguish fresh fetches from cache hits if the tool output provides it.
   - Mention search terms that produced useful results and search terms that produced no useful results.

After writing the report, answer briefly in the conversation with:

- the path of the generated report;
- the number of collected sources used;
- the 5 strongest signals;
- the 5 most important projects/tools/standards to follow;
- a verdict on whether this expanded prompt is a good repeatable workflow.
```
