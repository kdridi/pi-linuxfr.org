# Agentic AI Career Radar — Expanded LinuxFr Report

## 1. Executive summary

The expanded, two-pass LinuxFr exploration was substantially better than a feed-only radar. The feeds and current listings surfaced a recent, highly relevant anchor item: DarkMoon, a free-software autonomous pentest engine using AI agents, MCP, containers, configurable LLM providers, local models, logging, and Markdown reports. The tag pages then broadened the corpus into older and less visible LinuxFr discussions about agent sovereignty, OpenAI/Anthropic dependency, local/self-hosted agents, Mistral, AI economics, AI-assisted development, privacy, GDPR, data centers, and French digital sovereignty.

For someone aiming to work on an internal agentic harness in a health or enterprise company, the most important message is not “use agents everywhere”. LinuxFr’s signal is more cautious and operational: agentic systems need strict scope boundaries, human-in-the-loop control, local or configurable inference, audit logs, reproducible evaluation environments, privacy filtering before prompts, and an explicit sovereignty/compliance story.

The strongest career-relevant direction is therefore: build internal harnesses as governed execution platforms, not chatbots. Treat every tool call, data transfer, model choice, and generated action as something that must be scoped, logged, reviewed, evaluated, and reversible.

## 2. Corpus summary

- Seed URLs attempted: 30.
- Seed URLs successfully collected: 27.
- Seed failures: 3 tags returned HTTP 404: `agent`, `llama.cpp`, and `rag`.
- Candidate detail URLs extracted: 40.
- Detail URLs collected: 39.
- Detail failure: `https://linuxfr.org/users/patrick_g/liens/claude-code-open-source` returned HTTP 404.
- Total collected evidence used for this report: 66 sources.
- Cache/fresh breakdown: 5 cache hits, 61 fresh fetches.

Source-type breakdown for the bounded corpus used:

| Type | Count |
|---|---:|
| Feeds | 5 |
| Listings | 5 |
| Tags | 17 |
| News detail | 1 |
| Journal details | 7 |
| Link details | 29 |
| Forum details | 2 |
| Poll details | 0 |

Important empty or weak areas:

- The explicit `agent`, `llama.cpp`, and `rag` tag URLs failed with 404, even though related content was discoverable through other tags and listings.
- The corpus contained strong agent/security/privacy/souvereignty material, but little direct LinuxFr evidence about formal AI evaluation frameworks, health-data-specific AI compliance, or MCP beyond DarkMoon.
- Polls were collected as seeds, but no relevant poll detail was selected in the second pass.

## 3. Top weak signals

### 1. Agentic security automation is becoming concrete

DarkMoon is a recent free-software project that orchestrates existing security tools, specialized agents, configurable LLMs, Docker isolation, logs, and Markdown pentest reports. It supports cloud providers and local-compatible endpoints such as Ollama and llama.cpp, while emphasizing authorized targets, bounded scope, and human interpretation.

Evidence:

- https://linuxfr.org/news/darkmoon-un-moteur-libre-de-pentest-autonome-avec-agents-ia-mcp-et-outillage-conteneurise — `data/raw/pages/news-55dbdf0ead.md`
- Seed tag: https://linuxfr.org/tags/cybers%C3%A9curit%C3%A9/public — `data/raw/pages/tag-35788e85f2.html`

Why it matters for agentic harness work: it is close to the desired architecture for enterprise agents: orchestration, tool choice, controlled execution, artifacts, logs, and explicit rules of engagement.

Confidence: high.

Read/test next: run DarkMoon only in a lab such as OWASP Juice Shop; inspect how it models tools, logs actions, handles false positives, and constrains agent decisions.

### 2. MCP-like tool protocols are useful only with execution guardrails

The MCP tag existed and DarkMoon explicitly appeared in feed/listing/tag sources mentioning agents, IA, MCP, and containerized tooling. However, the broader LinuxFr signal is that protocol connectivity increases risk unless paired with sandboxing, authorization, logs, and human review.

Evidence:

- https://linuxfr.org/tags/mcp/public — `data/raw/pages/tag-7c4a121e55.html`
- https://linuxfr.org/news/darkmoon-un-moteur-libre-de-pentest-autonome-avec-agents-ia-mcp-et-outillage-conteneurise — `data/raw/pages/news-55dbdf0ead.md`

Why it matters: an internal harness will likely integrate tools and context protocols. The hard part is not attaching tools; it is making tool use auditable, scoped, revocable, and safe.

Confidence: medium.

Read/test next: compare MCP-style tool exposure with a policy engine, per-tool permissions, dry-run modes, and approval checkpoints.

### 3. Local/self-hosted agents are framed as a compliance primitive

ELY presents an agent with pre-prompt anonymization, local memory, local search, optional local models via Ollama/LM Studio, configurable cloud routing, and structural human-in-the-loop controls. It explicitly targets organizations under professional secrecy or strict GDPR constraints.

Evidence:

- https://linuxfr.org/users/elydefranck/journaux/ely-un-agent-ia-auto-heberge-conforme-rgpd-avec-anonymisation-native — `data/raw/pages/journal-c188fbbede.md`
- https://linuxfr.org/tags/ollama/public — `data/raw/pages/tag-15ab32acc9.html`

Why it matters: health and enterprise environments need architectures where sensitive data is filtered before model calls, model routing is explicit, and irreversible actions require approval.

Confidence: medium.

Read/test next: prototype a local PII redaction layer before RAG or agent prompts; test deterministic restoration, failure cases, and audit traces.

### 4. Sovereignty concerns are moving from abstract policy to agent infrastructure

LiberClaw argues that AI agents should not depend unilaterally on US cloud providers or closed model accounts. It describes agents running in separate VMs, open models through LibertAI, encrypted secrets, JWT rotation, and command filters.

Evidence:

- https://linuxfr.org/users/jon1012/journaux/vos-agents-ia-dependent-d-entreprises-americaines-et-ca-devrait-vous-poser-probleme — `data/raw/pages/journal-2ecbda2774.md`
- https://linuxfr.org/tags/souverainet%C3%A9_num%C3%A9rique/public — `data/raw/pages/tag-0bba10540c.html`
- https://linuxfr.org/tags/souverainet%C3%A9/public — `data/raw/pages/tag-aee976ccd6.html`

Why it matters: an internal health/enterprise harness must have a provider-exit strategy and avoid making critical workflows dependent on one external account, API, or jurisdiction.

Confidence: high.

Read/test next: design a harness abstraction where models, tools, and execution sandboxes can be swapped without changing business workflows.

### 5. Agent economics may force architecture changes

LinuxFr discussions around GitHub Copilot, Claude Code, OpenAI, Anthropic, and AI pricing show concern that agent pricing and token economics can change suddenly. Several link details also point to OpenAI financial stress or legal pressure.

Evidence:

- https://linuxfr.org/users/ryan/journaux/l-envolee-des-prix-des-agents-ia — `data/raw/pages/journal-dc3ca7290f.md`
- https://linuxfr.org/users/antistress/liens/openai-est-le-prochain-netscape-condamne-et-en-pleine-hemorragie-de-cash — `data/raw/pages/link-965cdd0b8b.html`
- https://linuxfr.org/users/vmagnin/liens/chatgpt-depasse-pertes-records-openai-est-il-en-train-de-vaciller — `data/raw/pages/link-9ae6f89126.html`

Why it matters: enterprise agent harnesses need cost observability, budget limits, local fallbacks, task-tier routing, and model substitution.

Confidence: high.

Read/test next: implement per-task token/cost telemetry and compare cloud, local, and hybrid routing for the same workflows.

### 6. AI-generated code is under social and maintenance scrutiny

LinuxFr selected several items about AI-assisted development: systemd accepting AI contributions, open-source projects being cloned commercially, vibe-coded tools, and developers losing time. The tone is skeptical: generated code can increase maintenance burden or undermine contributor trust.

Evidence:

- https://linuxfr.org/users/wilk/liens/systemd-accueille-les-contributions-par-ia — `data/raw/pages/link-5e32d68877.html`
- https://linuxfr.org/users/vmagnin/liens/l-ia-est-capable-de-cloner-des-logiciels-open-source-en-quelques-minutes-les-projets-benevoles-peuvent-ainsi-etre-exploites-commercialement — `data/raw/pages/link-2698048025.html`
- https://linuxfr.org/users/superjohn/journaux/a-la-recherche-d-une-alternative-libre-a-notion-ou-obsidian-j-ai-cree-mindzj-oss-via-vibe-coding — `data/raw/pages/journal-bf9a24a1e5.md`
- https://linuxfr.org/users/tangrim/liens/faire-perdre-du-temps-aux-developpeurs — `data/raw/pages/link-997da24234.html`

Why it matters: an internal harness should optimize for reviewability and maintainability, not raw code volume.

Confidence: medium.

Read/test next: define contribution policies for AI-generated code, provenance labels, mandatory tests, and reviewer checklists.

### 7. Prompt injection is becoming an operational software supply-chain issue

One selected link describes a Java library injecting log prompts that order AI agents to destroy generated tests. Another describes manipulation of AI search results with a short text. These are exactly the kinds of adversarial context problems internal harnesses will face.

Evidence:

- https://linuxfr.org/users/impromptux/liens/une-bibliotheque-java-injecte-dans-ses-logs-un-prompt-ordonnant-aux-agents-ia-de-detruire-tous-les-tests-crees-par-celle-ci — `data/raw/pages/link-a042d79267.html`
- https://linuxfr.org/users/thoasm/liens/13-mots-suffisent-pour-manipuler-un-resultat-de-recherche-par-ia — `data/raw/pages/link-898d647991.html`

Why it matters: agents consume logs, tickets, web pages, documents, and code. All of these can contain hostile instructions.

Confidence: high.

Read/test next: build prompt-injection test fixtures for logs, tickets, and retrieved documents; require tools to distinguish instructions from untrusted content.

### 8. Human-in-the-loop is a structural control, not just UX

Both DarkMoon and ELY emphasize that automated actions still need human responsibility. ELY explicitly distinguishes structural HITL from optional confirmation UX; DarkMoon states that interpretation, validation, prioritization, legality, and production impact remain human responsibilities.

Evidence:

- https://linuxfr.org/news/darkmoon-un-moteur-libre-de-pentest-autonome-avec-agents-ia-mcp-et-outillage-conteneurise — `data/raw/pages/news-55dbdf0ead.md`
- https://linuxfr.org/users/elydefranck/journaux/ely-un-agent-ia-auto-heberge-conforme-rgpd-avec-anonymisation-native — `data/raw/pages/journal-c188fbbede.md`

Why it matters: a health-company internal harness must distinguish reversible suggestions from irreversible actions such as sending messages, changing records, running commands, or exposing data.

Confidence: high.

Read/test next: design an action taxonomy with approval modes: suggest-only, dry-run, one-time approval, persisted approval, and forbidden.

### 9. French AI sovereignty is tied to infrastructure, energy, chips, and Mistral

The corpus includes Mistral hearings, French AI data center concerns, Chips Act 2.0, energy framing, and audits of digital sovereignty. LinuxFr links AI capability to physical infrastructure and political dependency.

Evidence:

- https://linuxfr.org/users/wilk/journaux/audition-de-la-direction-de-mistral-ai-et-solo-dev — `data/raw/pages/journal-a45b85dff1.md`
- https://linuxfr.org/users/vendrediouletrollsauvage/liens/choose-france-derriere-les-milliards-de-l-ia-l-enjeu-crucial-de-l-energie — `data/raw/pages/link-5a1fdb7859.html`
- https://linuxfr.org/users/vmagnin/liens/publication-du-chips-act-2-0-une-etape-importante-pour-la-souverainete-technologique-europeenne — `data/raw/pages/link-660f55760f.html`
- https://linuxfr.org/users/yinqi/liens/on-fait-l-audit-des-8-piliers-de-notre-souverainete-numerique-yt-alafrench — `data/raw/pages/link-19cee98128.html`

Why it matters: enterprise AI strategy is not only model accuracy. It includes procurement, jurisdiction, energy, hardware availability, and resilience.

Confidence: medium.

Read/test next: map a harness deployment against provider jurisdiction, data residency, GPU dependency, model license, and energy/cost constraints.

### 10. Health-adjacent AI risk is visible through companion AI and sensitive data themes

The corpus did not find many health-data-specific LinuxFr pages, but it did surface doctors warning about AI companions, suicide after ChatGPT discussions, and ELY’s professional secrecy/GDPR framing.

Evidence:

- https://linuxfr.org/users/vendrediouletrollsauvage/liens/avertissement-des-medecins-sur-la-dangerosite-des-compagnons-ia — `data/raw/pages/link-4cc505a41d.html`
- https://linuxfr.org/users/vendrediouletrollsauvage/liens/suicide-apres-discussions-avec-chatgpt-openai-rejette-la-responsabilite-sur-le-defunt — `data/raw/pages/link-958d2ab35f.html`
- https://linuxfr.org/users/elydefranck/journaux/ely-un-agent-ia-auto-heberge-conforme-rgpd-avec-anonymisation-native — `data/raw/pages/journal-c188fbbede.md`

Why it matters: health-adjacent agent harnesses must avoid anthropomorphic overreach, unsafe advice, and uncontrolled sensitive-data exposure.

Confidence: medium.

Read/test next: study escalation policies, clinical/non-clinical boundaries, refusal behavior, and audit requirements for health-related internal assistants.

## 4. Projects, tools, and standards to watch

### Agentic systems / harnesses

- DarkMoon — agentic pentest harness with MCP, tool orchestration, Docker, logs, reports: `data/raw/pages/news-55dbdf0ead.md`.
- ELY — self-hosted agent with anonymization and HITL: `data/raw/pages/journal-c188fbbede.md`.
- LiberClaw / OpenClaw-compatible skills — sovereign agent execution angle: `data/raw/pages/journal-2ecbda2774.md`.
- OpenClaw, Hermes, Aider, Google Remy — named in LinuxFr discussions as ecosystem references, especially around dependency and agent growth.

### Local models and inference

- Ollama and LM Studio — ELY local routing: `data/raw/pages/journal-c188fbbede.md`.
- llama.cpp and OpenAI-compatible endpoints — DarkMoon provider options: `data/raw/pages/news-55dbdf0ead.md`.
- Mistral AI — French sovereignty and enterprise debate: `data/raw/pages/journal-a45b85dff1.md`, `data/raw/pages/link-5bc00c2af2.html`.
- Swiss open-source LLM — `data/raw/pages/link-ea4b16db9e.html`.

### RAG / search / knowledge systems

- Qdrant local vector memory and SQLite FTS5 keyword search in ELY: `data/raw/pages/journal-c188fbbede.md`.
- AI search manipulation risk: `data/raw/pages/link-898d647991.html`.
- Local Markdown reports and raw evidence trails in DarkMoon: `data/raw/pages/news-55dbdf0ead.md`.

### Developer tools

- GitHub Copilot / Claude Code pricing and economics: `data/raw/pages/journal-dc3ca7290f.md`.
- AI contribution policy in systemd: `data/raw/pages/link-5e32d68877.html`.
- Vibe-coded OSS note-taking project MindZJ: `data/raw/pages/journal-bf9a24a1e5.md`.
- Developer productivity skepticism: `data/raw/pages/link-997da24234.html` and `data/raw/pages/journal-a45b85dff1.md`.

### Security automation

- DarkMoon.
- Naabu, Masscan, Nuclei, ffuf, sqlmap, Arjun, wafw00f, Subfinder, Katana, Waybackurls, httpx, WPScan, CMSeeK, Hydra, BloodHound, Impacket, kubectl, Kubescape, Kubeletctl — tools cited in DarkMoon’s LinuxFr article.
- Prompt-injection-in-logs example: `data/raw/pages/link-a042d79267.html`.

### Evaluation / benchmarks

- OWASP Juice Shop as a reproducible lab target in the DarkMoon article.
- False-positive/false-negative and human validation concerns in DarkMoon.
- No strong dedicated AI benchmark source was found in this bounded corpus.

### Privacy / sovereignty / compliance

- GDPR / RGPD, professional secrecy, PII anonymization: ELY.
- Souveraineté numérique tags: `data/raw/pages/tag-aee976ccd6.html`, `data/raw/pages/tag-0bba10540c.html`.
- Firefox privacy-policy debate: `data/raw/pages/link-c85f2ca9c5.html`.
- Professional Gmail confidentiality forum: `data/raw/pages/forum-post-6d94f15db0.md`.
- Wero and privacy: `data/raw/pages/journal-6fae0235f7.md`.

### Internal automation and rules-as-code

- SKILL.md-like agent descriptions in LiberClaw.
- Regex command filters, JWT rotation, and encrypted secrets in LiberClaw.
- DarkMoon rules of engagement, target/exclusion parameters, and Markdown reporting.
- ELY action categories requiring explicit authorization.

## 5. People, communities, and source types to follow

This is not personal profiling; it is a list of public LinuxFr source patterns that were useful in this corpus.

- LinuxFr news/dépêches: valuable for longer, more technical project presentations such as DarkMoon.
- Journals: valuable for opinionated architecture and sovereignty discussions; examples include posts by Jonathan Schemoul, Thomas, ElyDeFranck, wilk, SuperJohn, Ysabeau, and rahan.
- Links: very useful for weak signals and debates around OpenAI, Mistral, data centers, AI safety, copyright, privacy, and developer tooling.
- Forums: less dense for this topic, but useful for practical confidentiality questions such as professional Gmail use and privacy-oriented Linux distribution choices.
- Tags to follow: `intelligence_artificielle`, `ia`, `llm`, `agents`, `mcp`, `ollama`, `mistral`, `openai`, `cybersécurité`, `sécurité`, `confidentialité`, `vie_privée`, `souveraineté`, `souveraineté_numérique`, `données_personnelles`, `logiciel_libre`, `open_source`.
- Recurring link submitters in this corpus, especially `vendrediouletrollsauvage`, `vmagnin`, `wilk`, `yinqi`, `wynogu606`, and `thoasm`, were useful for scanning AI-policy, sovereignty, privacy, and AI-skepticism signals.

## 6. What LinuxFr sees that mainstream AI watch may miss

LinuxFr’s angle is not primarily product launch monitoring. It emphasizes:

- French-speaking and European sovereignty: Mistral, French data centers, Chips Act 2.0, French public-sector and professional contexts.
- Open-source governance: whether AI-generated contributions are acceptable, whether open-source projects can be cloned and monetized, and whether source-available is an acceptable compromise.
- Skepticism and anti-hype: AI economics, maintenance burden, reduced gains in larger teams, and risk of code gloubi-boulga.
- Privacy and compliance framing: GDPR, professional secrecy, anonymization before prompts, confidentiality of communications, and sensitive personal data.
- Security and auditability: pentest automation, prompt injection, agent tool safety, logs, reports, false positives, and human responsibility.
- Enterprise and health-adjacent implications: AI companions, sensitive data, controlled internal tooling, and the need for model/provider independence.

## 7. Recommended learning plan

### 10 topics to study

1. Agent orchestration architecture.
2. Tool permissioning and sandboxed execution.
3. MCP and comparable tool/context protocols.
4. Human-in-the-loop design for irreversible actions.
5. Prompt injection and untrusted-context handling.
6. RAG with local vector and keyword search.
7. PII detection, anonymization, and restoration.
8. Local model deployment and OpenAI-compatible routing.
9. AI evaluation in reproducible labs.
10. GDPR, professional secrecy, and health-data governance.

### 10 tools, projects, or standards to test

1. DarkMoon.
2. Ollama.
3. llama.cpp.
4. LM Studio.
5. Qdrant.
6. SQLite FTS5.
7. LangGraph.
8. MCP.
9. OWASP Juice Shop.
10. OpenAI-compatible local/cloud gateway patterns.

### 10 technical questions to investigate

1. How should an internal harness represent tool capabilities and permissions?
2. How can untrusted retrieved text be prevented from becoming agent instructions?
3. What actions must always require human approval in a health/enterprise setting?
4. How should model routing decide between local, sovereign cloud, and hyperscaler APIs?
5. How can PII anonymization be tested for false negatives before prompts are built?
6. How should audit logs link prompts, retrieved context, tool calls, approvals, and outputs?
7. What is the minimum useful evaluation suite for internal agent workflows?
8. How can agent costs be capped per workflow, user, and department?
9. What is a safe format for reusable internal skills or rules-as-code?
10. What data residency and vendor-exit guarantees are required before production use?

### 30-day plan

- Days 1–3: read the collected LinuxFr sources; summarize DarkMoon, ELY, and LiberClaw architectures.
- Days 4–6: build a tiny local agent harness with explicit tool registration, no autonomous execution by default, and full event logging.
- Days 7–9: add a local model route with Ollama or llama.cpp and a cloud route behind the same interface.
- Days 10–12: add RAG over a small Markdown corpus using SQLite FTS5 plus Qdrant; mark retrieved text as untrusted.
- Days 13–15: implement PII redaction before prompts and restoration after responses; write failure tests.
- Days 16–18: implement HITL modes for file write, command execution, email/message send, and external API calls.
- Days 19–21: create prompt-injection fixtures from logs, tickets, and retrieved documents; measure harness behavior.
- Days 22–24: run OWASP Juice Shop or another lab and study DarkMoon-like reporting patterns without targeting real systems.
- Days 25–27: add cost, latency, and model-route telemetry; compare local versus cloud results.
- Days 28–30: write an enterprise/health readiness memo: architecture, risks, approvals, audit logs, model routing, compliance gaps, and evaluation plan.

## 8. MVP assessment

- Was the expanded prompt significantly better than the feed-only prompt? Yes. The tag/listing seed pass surfaced many more relevant detail pages than feeds alone, especially on sovereignty, privacy, OpenAI economics, and older agent discussions.
- Which parts worked with the current tools? Bounded seed collection, cache reuse, explicit detail collection, local raw inspection, and cited report generation worked well.
- Which parts were awkward or manual? Candidate extraction required local scripting and manual filtering of EPUB/comment URLs, weak anchors, irrelevant matches, and duplicate paths. HTML link pages often provided less structured metadata than Markdown detail pages.
- Single most important missing capability: a built-in bounded candidate extractor that reads collected LinuxFr seed files, scores LinuxFr detail URLs by terms/title/snippet/source type/date, deduplicates non-detail variants, and returns an inspectable shortlist.
- Is this valuable enough to keep as a repeatable prototype prompt? Yes. It is a useful repeatable workflow for turning a public community site into a bounded, cited career and technology radar.

## 9. Evidence log

### Seed URLs attempted and outcome

Fresh success:

- https://linuxfr.org/news — `data/raw/pages/listing-f606eda14c.html`
- https://linuxfr.org/journaux — `data/raw/pages/listing-0c68d32103.html`
- https://linuxfr.org/forums — `data/raw/pages/listing-8980d09932.html`
- https://linuxfr.org/liens — `data/raw/pages/listing-b5ba3a2825.html`
- https://linuxfr.org/sondages — `data/raw/pages/listing-d4f8035667.html`
- https://linuxfr.org/tags/intelligence_artificielle/public — `data/raw/pages/tag-07e4f4520b.html`
- https://linuxfr.org/tags/ia/public — `data/raw/pages/tag-f9cafc3e63.html`
- https://linuxfr.org/tags/llm/public — `data/raw/pages/tag-8d53e4b95a.html`
- https://linuxfr.org/tags/agents/public — `data/raw/pages/tag-ceb0f58687.html`
- https://linuxfr.org/tags/mcp/public — `data/raw/pages/tag-7c4a121e55.html`
- https://linuxfr.org/tags/ollama/public — `data/raw/pages/tag-15ab32acc9.html`
- https://linuxfr.org/tags/mistral/public — `data/raw/pages/tag-3c7a2ada2d.html`
- https://linuxfr.org/tags/openai/public — `data/raw/pages/tag-86b013340b.html`
- https://linuxfr.org/tags/cybersécurité/public — `data/raw/pages/tag-35788e85f2.html`
- https://linuxfr.org/tags/sécurité/public — `data/raw/pages/tag-50fbece59e.html`
- https://linuxfr.org/tags/confidentialité/public — `data/raw/pages/tag-447a2c86d6.html`
- https://linuxfr.org/tags/vie_privée/public — `data/raw/pages/tag-586de9f475.html`
- https://linuxfr.org/tags/souveraineté/public — `data/raw/pages/tag-aee976ccd6.html`
- https://linuxfr.org/tags/souveraineté_numérique/public — `data/raw/pages/tag-0bba10540c.html`
- https://linuxfr.org/tags/logiciel_libre/public — `data/raw/pages/tag-7c0eaca54d.html`
- https://linuxfr.org/tags/open_source/public — `data/raw/pages/tag-33cdba82aa.html`
- https://linuxfr.org/tags/données_personnelles/public — `data/raw/pages/tag-dc7da159a8.html`

Cache hits:

- https://linuxfr.org/news.atom — `data/raw/pages/feed-ae6c4d98ad.atom`
- https://linuxfr.org/journaux.atom — `data/raw/pages/feed-cbe6c32732.atom`
- https://linuxfr.org/forums.atom — `data/raw/pages/feed-e8887c467d.atom`
- https://linuxfr.org/liens.atom — `data/raw/pages/feed-a554f7e7d2.atom`
- https://linuxfr.org/sondages.atom — `data/raw/pages/feed-cf3d7415b1.atom`

Failures:

- https://linuxfr.org/tags/agent/public — HTTP 404.
- https://linuxfr.org/tags/llama.cpp/public — HTTP 404.
- https://linuxfr.org/tags/rag/public — HTTP 404.

### Selected detail URLs

Collected:

- https://linuxfr.org/news/darkmoon-un-moteur-libre-de-pentest-autonome-avec-agents-ia-mcp-et-outillage-conteneurise — `data/raw/pages/news-55dbdf0ead.md`
- https://linuxfr.org/users/vendrediouletrollsauvage/liens/intelligence-artificielle-a-france-travail-des-risques-pour-les-agents — `data/raw/pages/link-7f607718ec.html`
- https://linuxfr.org/users/ryan/journaux/l-envolee-des-prix-des-agents-ia — `data/raw/pages/journal-dc3ca7290f.md`
- https://linuxfr.org/users/jon1012/journaux/vos-agents-ia-dependent-d-entreprises-americaines-et-ca-devrait-vous-poser-probleme — `data/raw/pages/journal-2ecbda2774.md`
- https://linuxfr.org/users/impromptux/liens/une-bibliotheque-java-injecte-dans-ses-logs-un-prompt-ordonnant-aux-agents-ia-de-detruire-tous-les-tests-crees-par-celle-ci — `data/raw/pages/link-a042d79267.html`
- https://linuxfr.org/users/vendrediouletrollsauvage/liens/un-agent-ia-a-ruine-son-operateur-en-tentant-de-scanner-l-integralite-du-reseau-hobbyiste-dn42 — `data/raw/pages/link-2feb56d78d.html`
- https://linuxfr.org/users/elydefranck/journaux/ely-un-agent-ia-auto-heberge-conforme-rgpd-avec-anonymisation-native — `data/raw/pages/journal-c188fbbede.md`
- https://linuxfr.org/users/wilk/journaux/audition-de-la-direction-de-mistral-ai-et-solo-dev — `data/raw/pages/journal-a45b85dff1.md`
- https://linuxfr.org/users/raspbeguy/liens/nouveau-llm-suisse-open-source — `data/raw/pages/link-ea4b16db9e.html`
- https://linuxfr.org/users/vmagnin/liens/l-ia-est-capable-de-cloner-des-logiciels-open-source-en-quelques-minutes-les-projets-benevoles-peuvent-ainsi-etre-exploites-commercialement — `data/raw/pages/link-2698048025.html`
- https://linuxfr.org/users/wilk/liens/systemd-accueille-les-contributions-par-ia — `data/raw/pages/link-5e32d68877.html`
- https://linuxfr.org/users/superjohn/journaux/a-la-recherche-d-une-alternative-libre-a-notion-ou-obsidian-j-ai-cree-mindzj-oss-via-vibe-coding — `data/raw/pages/journal-bf9a24a1e5.md`
- https://linuxfr.org/users/tangrim/liens/faire-perdre-du-temps-aux-developpeurs — `data/raw/pages/link-997da24234.html`
- https://linuxfr.org/users/thoasm/liens/13-mots-suffisent-pour-manipuler-un-resultat-de-recherche-par-ia — `data/raw/pages/link-898d647991.html`
- https://linuxfr.org/users/vendrediouletrollsauvage/liens/bulle-de-l-ia-des-investisseurs-parient-sur-les-faillites-futures-de-openai-et-de-perplexity — `data/raw/pages/link-31ceed37be.html`
- https://linuxfr.org/users/antistress/liens/openai-est-le-prochain-netscape-condamne-et-en-pleine-hemorragie-de-cash — `data/raw/pages/link-965cdd0b8b.html`
- https://linuxfr.org/users/vmagnin/liens/chatgpt-depasse-pertes-records-openai-est-il-en-train-de-vaciller — `data/raw/pages/link-9ae6f89126.html`
- https://linuxfr.org/users/vendrediouletrollsauvage/liens/openai-reconnu-coupable-d-avoir-enfreint-les-droits-d-auteur-de-chansons-en-allemagne — `data/raw/pages/link-6985eb4f7b.html`
- https://linuxfr.org/users/vendrediouletrollsauvage/liens/suicide-apres-discussions-avec-chatgpt-openai-rejette-la-responsabilite-sur-le-defunt — `data/raw/pages/link-958d2ab35f.html`
- https://linuxfr.org/users/vendrediouletrollsauvage/liens/avertissement-des-medecins-sur-la-dangerosite-des-compagnons-ia — `data/raw/pages/link-4cc505a41d.html`
- https://linuxfr.org/users/vendrediouletrollsauvage/liens/livres-pirates-et-intelligence-artificielle-le-francais-mistral-ai-sous-pression — `data/raw/pages/link-5bc00c2af2.html`
- https://linuxfr.org/users/vendrediouletrollsauvage/liens/intelligence-artificielle-une-guerre-a-coups-de-milliards-de-dollars-qui-va-mal-finir — `data/raw/pages/link-59948b79f5.html`
- https://linuxfr.org/users/vendrediouletrollsauvage/liens/les-sacrifies-de-l-ia-le-scandale-meconnu-des-data-workers — `data/raw/pages/link-fe953daf50.html`
- https://linuxfr.org/users/vendrediouletrollsauvage/liens/l-heure-de-l-ia-au-lycee-buvez-des-donnees-et-mangez-des-tokens — `data/raw/pages/link-3b4859e6b3.html`
- https://linuxfr.org/users/ysabeau/journaux/ia-et-enseignement-superieur-en-france — `data/raw/pages/journal-a492517b96.md`
- https://linuxfr.org/users/wynogu606/liens/plaidoyer-pour-un-label-sans-ia-generative — `data/raw/pages/link-ce68af8523.html`
- https://linuxfr.org/users/wynogu606/liens/ia-dans-la-drome-la-population-resiste-contre-un-gigantesque-data-center — `data/raw/pages/link-10dc76826a.html`
- https://linuxfr.org/users/yinqi/liens/mega-data-center-decouvrez-si-vous-vivez-a-proximite-d-un-des-futurs-projets-francais-destines-a-l-intelligence-artificielle — `data/raw/pages/link-3c6aa7fc98.html`
- https://linuxfr.org/users/sobriquet/liens/combien-d-energie-consomme-vraiment-l-ia-la-reponse-en-infographies — `data/raw/pages/link-f5243709c1.html`
- https://linuxfr.org/users/vendrediouletrollsauvage/liens/choose-france-derriere-les-milliards-de-l-ia-l-enjeu-crucial-de-l-energie — `data/raw/pages/link-5a1fdb7859.html`
- https://linuxfr.org/users/yinqi/liens/on-fait-l-audit-des-8-piliers-de-notre-souverainete-numerique-yt-alafrench — `data/raw/pages/link-19cee98128.html`
- https://linuxfr.org/users/vmagnin/liens/publication-du-chips-act-2-0-une-etape-importante-pour-la-souverainete-technologique-europeenne — `data/raw/pages/link-660f55760f.html`
- https://linuxfr.org/users/vmagnin/liens/la-fin-de-l-ere-de-la-confidentialite-des-correspondances-numeriques-en-ue — `data/raw/pages/link-775c52e3f1.html`
- https://linuxfr.org/users/hellpe/liens/mozilla-reecrit-le-paragraphe-controverse-de-la-nouvelle-politique-de-confidentialite-de-firefox — `data/raw/pages/link-c85f2ca9c5.html`
- https://linuxfr.org/forums/general-general/posts/confidentialite-des-communications-professionnelles-et-utilisation-de-gmail — `data/raw/pages/forum-post-6d94f15db0.md`
- https://linuxfr.org/forums/linux-debutant/posts/meilleur-distribution-linux-pour-confidentialite-anonymat — `data/raw/pages/forum-post-96c01f5319.md`
- https://linuxfr.org/users/rahan/journaux/respect-de-la-vie-privee-et-wero — `data/raw/pages/journal-6fae0235f7.md`
- https://linuxfr.org/users/vendrediouletrollsauvage/liens/ia-au-kenya-derriere-les-entreprises-de-sous-traitance-l-essor-d-une-nouvelle-classe-ouvriere — `data/raw/pages/link-b4aef53561.html`
- https://linuxfr.org/users/vendrediouletrollsauvage/liens/500-millions-d-utilisateurs-disent-non-a-windows-11-merci-la-strategie-ia — `data/raw/pages/link-90a42a9a67.html`

Failed selected detail:

- https://linuxfr.org/users/patrick_g/liens/claude-code-open-source — HTTP 404.

### Search terms

Useful search terms included: intelligence artificielle, LLM, agent, agents, MCP, RAG, modèle local, Ollama, llama.cpp, Mistral, OpenAI, développeur, automatisation, évaluation, pentest, cybersécurité, souveraineté, confidentialité, vie privée, données personnelles, données de santé, conformité.

Terms with no useful local hits in this bounded corpus included: LangChain, copilote, workflow, benchmark, and modèles locaux.
