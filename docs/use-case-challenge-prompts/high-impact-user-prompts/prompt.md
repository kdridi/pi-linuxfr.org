# Prompt: High-Impact User Prompts

```text
Given this MVP agentic extension for LinuxFr.org:

Tools:
- linuxfr_collect_pages: collect explicit public LinuxFr URLs into local raw files.
- linuxfr_query_raw: inspect/query the local raw dataset.
- linuxfr_update_wiki: generate cited Markdown wiki notes from selected raw sources.

Workflow:
A human asks a question, provides or selects a few LinuxFr URLs/feeds, the agent collects them, queries the local dataset, builds cited wiki notes, and answers from those sources.

Please generate 30 high-impact user prompts that would exploit this system.

The prompts must not be generic.
They should aim to reveal:
- hidden patterns in technical debates;
- recurring community frustrations;
- early signs of technology adoption or rejection;
- differences between official news and user journals;
- controversy maps;
- historical shifts in free software values;
- useful project ideas derived from community pain points;
- signals from polls, forums, links, and journals;
- contradictions between hype and lived experience;
- under-discussed but important topics.

For each prompt:
- write the exact user prompt;
- explain what the agent should collect;
- explain what wiki note should be generated;
- explain what kind of insight the user should expect.

Then propose a tool wishlist for going further:
- up to 10 additional agent tools or small tool improvements;
- for each tool, give its name, purpose, the prompts or insights it would unlock, why the current MVP is insufficient, implementation complexity (small/medium/large), and priority (soon/later/probably not);
- keep every proposal compatible with public read-only LinuxFr data;
- avoid authentication, posting, voting, private data, and full-site crawling;
- prefer narrow, composable tools that extend the current collect/query/wiki loop.

Stay within the current MVP constraints for the 30 prompts.
No crawler, no auth, no vector database.
```
