# Agentic AI Career Radar Expanded Review Prompt

Use this prompt in Pi after running the expanded Agentic AI Career Radar prompt.

The goal is not to fetch more data first. The goal is to critically review the previous run as a product and research workflow: corpus quality, source coverage, confidence, missing capabilities, and whether the current LinuxFr MVP is enough for repeatable topical discovery.

```text
I want to critically review the previous LinuxFr exploration run: “Agentic AI Career Radar — Expanded”.

Context:
The previous run generated this report:

`docs/prototype-prompts/agentic-ai-career-radar-expanded/result.md`

It also populated the local LinuxFr raw dataset under:

- `data/raw/metadata.jsonl`
- `data/raw/pages/`

Do not start by collecting new LinuxFr pages.
First, review the existing report and local dataset.
Use local file-reading tools, shell inspection, and `linuxfr_query_raw` as needed.
Only if you find a very small number of obviously missing explicit LinuxFr URLs already mentioned in the previous report may you propose them as next steps, but do not collect them unless explicitly instructed later.

Review objective:
Assess whether the expanded prompt produced a trustworthy, repeatable, and useful workflow for discovering LinuxFr signals about agentic AI, internal agentic harnesses, local LLMs, RAG, MCP, evaluation, privacy, sovereignty, and compliance.

Questions to answer:

1. Corpus quality
   - How many unique raw sources exist locally?
   - Which source types dominate the corpus?
   - Is the corpus balanced between news, journals, links, forums, polls, tags, listings, and feeds?
   - Are too many conclusions based on link pages rather than detail articles or community discussions?
   - Are important source types underused?

2. Coverage quality
   - Which topic areas are well covered?
   - Which topic areas are weak or missing?
   - Did the exploration find strong evidence for agentic harnesses specifically, or mostly adjacent AI discourse?
   - Did it find enough about RAG, evaluation, MCP, health-data concerns, and internal automation?
   - Which tags worked well and which failed or were weak?

3. Signal quality
   - Which signals in `result.md` are strongly supported by the corpus?
   - Which signals are plausible but weakly supported?
   - Which signals may be over-interpreted from too little evidence?
   - Which cited sources are genuinely central?
   - Which sources look noisy, incidental, or too indirect?

4. Discovery workflow quality
   - Did the two-pass prompt approximate a useful bounded topical discovery workflow?
   - Which steps were robust?
   - Which steps were brittle, manual, or dependent on the agent improvising too much?
   - Was the candidate URL selection transparent enough?
   - Could another run reproduce similar quality results, or was the result too dependent on luck and prompt-following?

5. Missing capabilities
   Identify the minimal missing capabilities that would make this workflow more reliable.
   Categorize them as:
   - critical for repeatability;
   - useful but not urgent;
   - tempting but premature;
   - out of scope.

   Consider at least:
   - bounded candidate URL extraction from seed pages;
   - structured Atom parsing;
   - tag/listing link extraction;
   - source ranking by matched terms, title, tags, date, and type;
   - date filtering;
   - better HTML cleanup for link pages;
   - comment collection;
   - poll parsing;
   - wiki note templates;
   - coverage reports.

6. Product conclusion
   - Is “Agentic AI Career Radar” a good repeatable prototype prompt?
   - What is the smallest workflow change that would make it meaningfully better without adding a new tool?
   - What is the smallest future tool improvement that would make it meaningfully better, if tools are improved later?
   - Should the project keep using prompts like this to discover post-MVP needs?

Expected output:

Write a critical Markdown review at:

`docs/prototype-prompts/agentic-ai-career-radar-expanded/review.md`

The review must be written in English and must contain:

1. Executive verdict
2. Corpus audit
3. Coverage audit
4. Signal audit
5. Workflow audit
6. Missing capability matrix
7. Recommended next prompt-only experiment
8. Recommended future tool improvement, without implementing it
9. Final recommendation

Be candid. The goal is not to defend the previous run. The goal is to learn what is missing from the MVP and whether this use case is truly supported.

After writing the review, answer briefly in the conversation with:

- the path of the generated review;
- whether the previous expanded run was genuinely convincing or only partially convincing;
- the single biggest missing capability;
- the next prompt-only experiment you recommend.
```
