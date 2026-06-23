Here is a concrete, ambitious but implementable set of **LinuxFr MVP‑based agent use cases**, tailored to your current three‑tool loop (`linuxfr_collect_pages`, `linuxfr_query_raw`, `linuxfr_update_wiki`). I’ll follow your outline exactly.

***

### 1. Ten bold use cases

I’ll give each one: **name**, **core idea**, **value**, **how the current MVP supports it**, **first sources to collect**, and **one concrete example prompt**.

#### 1. “Memory‑lane heatmaps”

**Core idea**  
The agent maps how often key topics (e.g., “Flatpak vs Snap”, “systemd vs OpenRC”, “AI models in FOSS”) have been discussed over time, and how opinion tone shifted (via titles, tags, and early‑comment snippets), producing “cultural‑heat timelines” for LinuxFr.

**Value**  
Reveals forgotten debates, recurring pain points, and how positions on hot topics (e.g., security, privacy, AI) have drifted over LinuxFr’s 20+‑year history—something no existing visualization offers.

**How current MVP supports it**  
- Use `linuxfr_collect_pages` to gather specific feeds (e.g., `news.atom`, `journaux.atom`, tag‑filtered feeds) and a few key historic threads.  
- Use `linuxfr_query_raw` to filter by tag, year, topic keywords, and type (news vs journal vs forum).  
- Build `linuxfr_update_wiki` notes that track: topic, year, sentiment‑proxy, and representative links.

**First sources to collect**  
- `https://linuxfr.org/tags/flatpak.atom`  
- `https://linuxfr.org/tags/snaps.atom`  
- `https://linuxfr.org/tags/ai.atom`  
- `https://linuxfr.org/tags/ia.atom`  
- `https://linuxfr.org/tags/systemd.atom`  
- A few “classic” threads from the 2000s and 2010s (you can pick URLs manually).

**Example user prompt**  
> “Show me how LinuxFr’s attitude toward systemd changed between 2010 and 2020, using titles, tags, and top‑level comments; summarize the main phases and turning‑point threads.”

***

#### 2. “Contradiction‑spotter”

**Core idea**  
The agent finds explicit contradictions or strong disagreement between older and newer LinuxFr content on the same topic (e.g., “Free software purism vs pragmatic SaaS”, “AI‑assisted development”), and surfaces them as “debate pivots”.

**Value**  
Helps users see where the community ate its own dogma, switched sides, or failed to acknowledge prior contradictions—great for historians, journalists, and community strategists.

**How current MVP supports it**  
- Collect sets of pages around a topic (e.g., all “software libre”‑related news/journals over 10 years).  
- Use `linuxfr_query_raw` to extract snippets plus metadata (author, date, tags).  
- `linuxfr_update_wiki` notes can encode: claim, date, author, and “contradicted‑by” IDs.

**First sources to collect**  
- `https://linuxfr.org/tags/software_libre.atom`  
- A few editorial‑style journals or front‑page news from 2010, 2015, 2020, 2025.  
- A few “classic” comments sections illustrating “hard‑core FOSS” vs “pragmatic” positions.

**Example user prompt**  
> “Find two LinuxFr posts written at least 5 years apart that make directly contradictory claims about the role of proprietary SaaS tools in free‑software ecosystems, and explain how the context changed between them.”

***

#### 3. “Forgotten‑tech graveyard”

**Core idea**  
The agent builds a “graveyard” of projects and technologies that were once heavily discussed on LinuxFr but now rarely appear, flagging them with “last mention” dates and possible reasons for decline.

**Value**  
Useful for researchers, historians, and developers scouting “what worked, what didn’t”, while avoiding “reinventing the wheel” that LinuxFr users already abandoned.

**How current MVP supports it**  
- Use `linuxfr_collect_pages` on a few technology‑specific feeds (e.g., `tags/flatpak`, `tags/snaps`, `tags/wayland`).  
- Use `linuxfr_query_raw` to extract project‑mentions and dates.  
- Use `linuxfr_update_wiki` to maintain a per‑project profile: “first big wave”, “last mention”, notable debates.

**First sources to collect**  
- `https://linuxfr.org/tags/wayland.atom`  
- `https://linuxfr.org/tags/mir.atom`  
- `https://linuxfr.org/tags/systemd.atom`  
- A few “project adoption” or “kill‑shot” threads.

**Example user prompt**  
> “List all LinuxFr‑discussed Linux desktop compositors that were once considered promising but have now largely disappeared from discussion, and summarize the reasons given in those threads.”

***

#### 4. “Opinion‑shift pulse”

**Core idea**  
The agent tracks how a specific contentious idea (e.g., “AI‑assisted code review”, “remote‑only work”, “cloud‑native vs on‑premise”) evolved in LinuxFr’s tone over 5–10 years, using a “pulse” narrative (phases, key turning‑point posts, and notable detractors/promoters).

**Value**  
Gives a quick “we were angry → confused → cautiously accepting → resigned” view of how LinuxFr’s community adapted to big trends.

**How current MVP supports it**  
- Collect atom feeds for a topic over multiple years.  
- Query with `linuxfr_query_raw` by year chunks and sentiment‑proxy keywords.  
- Build wiki notes that encode “phase” (fear, ridicule, evaluation, normalization) plus exemplar links.

**First sources to collect**  
- `https://linuxfr.org/tags/intelligence_artificielle.atom`  
- `https://linuxfr.org/tags/ia.atom`  
- `https://linuxfr.org/tags/teletravail.atom`  
- A few news items and journals from 2018 and 2023–2026.

**Example user prompt**  
> “Describe how LinuxFr users’ views on AI‑assisted programming changed from 2018 to 2025, using phases (e.g., ‘fear’, ‘experimentation’, ‘acceptance and caution’) and 3–5 key articles or journals.”

***

#### 5. “Weak‑signal‑spotter”

**Core idea**  
The agent scans for early mentions of technologies, practices, or concerns that later became mainstream (e.g., “LLMs”, “container‑security”, “small‑talk‑style UIs”), and then looks for similar “early‑signal” patterns that are still niche today.

**Value**  
Functions as a “time‑traveling” early‑warning system: “What looks like fringe noise now might be second‑order LinuxFr dogma in 5 years.”

**How current MVP supports it**  
- Collect multi‑year feeds around fast‑moving topics (AI, security, containers, GUIs).  
- Use `linuxfr_query_raw` to rank by rarity‑of‑term vs importance cues (tags, top‑level comments).  
- Use `linuxfr_update_wiki` to keep a “weak‑signal registry” with birth‑date and potential “why now”.

**First sources to collect**  
- `https://linuxfr.org/tags/containers.atom`  
- `https://linuxfr.org/tags/docker.atom`  
- `https://linuxfr.org/tags/rust.atom`  
- `https://linuxfr.org/tags/ia.atom`

**Example user prompt**  
> “Find three topics that were mentioned only a few times on LinuxFr between 2018 and 2020 but later exploded in 2023–2026, and then propose three similar‑looking ‘weak signals’ that are still rare today.”

***

#### 6. “Community‑DNA profiler”

**Core idea**  
The agent builds a longitudinal profile of LinuxFr’s “values‑DNA”: how often users invoke “freedom”, “security”, “simplicity”, “pragmatism”, “compatibility”, “privacy”, and how these tradeoffs play out in concrete debates.

**Value**  
Helps third‑party researchers, journalists, and even LinuxFr’s own moderators understand the community’s implicit ethical compass and where it is inconsistent.

**How current MVP supports it**  
- Collect a diverse set of news, journals, and forum discussions over 10+ years.  
- `linuxfr_query_raw` can filter by clusters of keywords and tags.  
- `linuxfr_update_wiki` notes can encode “value‑alignment” snippets and tensions.

**First sources to collect**  
- `https://linuxfr.org/news.atom`  
- `https://linuxfr.org/journaux.atom`  
- `https://linuxfr.org/forums` front‑page (50–100 most recent threads + some classic ones via URLs).  
- A few “editorial”‑style posts from the site’s leadership.

**Example user prompt**  
> “Profile LinuxFr’s core values (freedom, security, privacy, simplicity, compatibility) by finding 5–10 high‑impact posts where those values conflict, and explain which value usually wins.”

***

#### 7. “Debate‑map‑builder”

**Core idea**  
For a given topic (e.g., “Flatpak vs Snap vs AppImage”), the agent assembles a map of “positions” (pro, con, neutral, hybrid) taken across LinuxFr, citing landmark posts, notable authors, and key arguments.

**Value**  
Turns scattered, noisy discussion into a legible, navigable “map” for newcomers or decision‑makers evaluating which path to adopt.

**How current MVP supports it**  
- Use `linuxfr_collect_pages` on topic‑tag feeds and a few iconic threads.  
- Use `linuxfr_query_raw` to cluster by stance keywords and tags.  
- Build `linuxfr_update_wiki` notes that encode “position”, “proponents”, “arguments”, and “counters”.

**First sources to collect**  
- `https://linuxfr.org/tags/flatpak.atom`  
- `https://linuxfr.org/tags/snaps.atom`  
- `https://linuxfr.org/tags/appimage.atom`  
- A few “let’s settle this once and for all” journal posts.

**Example user prompt**  
> “Create a ‘Flatpak vs Snap vs AppImage’ debate map: list the main positions, key authors, and most‑quoted arguments, and tell me which solution LinuxFr seems to lean toward today.”

***

#### 8. “Institutional‑amnesia‑detector”

**Core idea**  
The agent finds instances where LinuxFr users propose or endorse ideas that were already discussed, debated, and even rejected years earlier, labeling them “re‑inventions” with links to the older threads.

**Value**  
Helps fight “institutional amnesia” and saves time by showing “we already tried this in 2012 and here’s why it failed”.

**How current MVP supports it**  
- Collect a broad historical corpus (news + journals + forum) over 10+ years.  
- Use `linuxfr_query_raw` to match high‑level proposals (e.g., “Linux‑only app store”, “FOSS‑only SaaS proxy”) against older text.  
- Use `linuxfr_update_wiki` to maintain “idea‑hashes” and “prior‑attempts”.

**First sources to collect**  
- `https://linuxfr.org/tags/logiciel_libre.atom`  
- `https://linuxfr.org/tags/plateforme.atom`  
- `https://linuxfr.org/tags/depot_d_applications.atom`  
- A few “moonshot project” journals.

**Example user prompt**  
> “Find three ideas proposed on LinuxFr after 2020 that were already seriously discussed and rejected between 2010 and 2015, and summarize why the earlier attempts failed.”

***

#### 9. “Cultural‑bridge‑builder”

**Core idea**  
The agent builds “translation tables” between LinuxFr’s jargon and outsider‑friendly language, mapping community‑specific norms, inside jokes, and hidden expectations.

**Value**  
Onboarding new users without drowning them in 20 years of context; also helps journalists and researchers interpret LinuxFr’s culture more accurately.

**How current MVP supports it**  
- Use `linuxfr_collect_pages` on popular, emblematic threads that new users often get into trouble over.  
- Use `linuxfr_query_raw` to pull out recurring patterns of “moderation remarks”, “top‑level comments”, “editorial notes”.  
- Use `linuxfr_update_wiki` to generate “glossary”‑style notes that explain sub‑texts.

**First sources to collect**  
- `https://linuxfr.org/equipe` + moderation‑related posts.  
- `https://linuxfr.org/tags/regles_de_bon_ton.atom`  
- A few “you got your first negative score” or “why was my post deleted?” posts and comments.

**Example user prompt**  
> “Build a beginner’s ‘cultural‑bridge’ guide to LinuxFr: explain common jargon, moderation expectations, and invisible community norms using examples from 2018–2026.”

***

#### 10. “Collective‑intelligence‑curator”

**Core idea**  
For a specific practical problem (e.g., “choosing a Linux laptop”, “setting up a FOSS‑first home server”), the agent aggregates scattered wisdom (journals, forums, links, comments) into a compact, logically‑organized “community‑curated recipe”.

**Value**  
Turns fragmented collective intelligence into something that feels like a mini‑textbook, not a wall of comments.

**How current MVP supports it**  
- `linuxfr_collect_pages` collects a bounded set of Linux‑laptop or home‑server‑related news/journals/forums.  
- `linuxfr_query_raw` filters by topic, hardware, use case, and tags.  
- `linuxfr_update_wiki` notes form sub‑sections of the “recipe” (hardware, OS, services, gotchas).

**First sources to collect**  
- `https://linuxfr.org/tags/ordinateur_portable.atom`  
- `https://linuxfr.org/tags/serveur.atom`  
- `https://linuxfr.org/tags/maison_atom`  
- A few “best laptop for Linux”‑style threads from each of the last 5 years.

**Example user prompt**  
> “Design a community‑curated ‘FOSS‑first Linux home server’ setup for 2026, drawing only from LinuxFr posts; list components, distros, services, and common pitfalls.”

***

### 2. Ranking the ten use cases

Ranking is by four dimensions (originality, usefulness, feasibility with current MVP, non‑obvious‑insightfulness). I’ll give a qualitative order and then highlight the top‑3.

1. **Opinion‑shift pulse** – high originality, high usefulness, high feasibility, very good at revealing non‑obvious narrative arcs.  
2. **Contradiction‑spotter** – very original, high value for community introspection, high feasibility, great at surfacing “that we once said the opposite”.  
3. **Memory‑lane heatmaps** – original, very useful for historians and journalists, high feasibility, reveals temporal patterns users rarely see.  
4. **Weak‑signal‑spotter** – original, high research value, medium feasibility, excellent at surfacing “seeds” that might bloom later.  
5. **Institutional‑amnesia‑detector** – original, highly useful for community maturity, medium feasibility, reveals “we already tried this”.  
6. **Debate‑map‑builder** – very useful, moderately original, high feasibility, excellent for newcomers.  
7. **Collective‑intelligence‑curator** – highly useful, less original, very high feasibility, great for practical decision‑making.  
8. **Community‑DNA profiler** – original and valuable, medium feasibility, good insight into implicit values.  
9. **Cultural‑bridge‑builder** – very useful, medium originality, high feasibility, helps onboarding.  
10. **Forgotten‑tech graveyard** – original, somewhat niche, high feasibility, interesting but lower impact.

#### Top‑3 I would prototype first

1. **Opinion‑shift pulse**  
2. **Contradiction‑spotter**  
3. **Memory‑lane heatmaps**

***

### 3. Top‑3 prototypes: step‑by‑step workflows

#### 3.1 Opinion‑shift pulse (Topic: AI‑assisted programming)

**Step‑by‑step agent workflow**

1. **User asks**  
   > “Describe how LinuxFr users’ views on AI‑assisted programming changed from 2018 to 2025, using phases and key posts.”

2. **Agent collects**  
   - `linuxfr_collect_pages` on:  
     - `https://linuxfr.org/tags/intelligence_artificielle.atom`  
     - `https://linuxfr.org/tags/ia.atom`  
     - `https://linuxfr.org/tags/intelligence_artificielle?q=programmation` (if atom supports search) or manually pick 10–20 key URLs from the search.  
   - Store raw pages under `data/raw/pages/`.

3. **Agent queries and clusters**  
   - Run `linuxfr_query_raw` filtering by:  
     - type: news, journal, forum  
     - year ranges: 2018–2019, 2020–2021, 2022–2023, 2024–2025.  
   - Extract titles, tags, top‑level comment snippets, and note especially: fear, ridicule, cautious experimentation, acceptance.

4. **Agent builds wiki notes**  
   - `linuxfr_update_wiki` creates:  
     - `wiki/ai_programming/2018-2019_phase.md`: “Initial fear and skepticism” with 3–5 key URLs.  
     - `wiki/ai_programming/2020-2021_phase.md`: “First experiments” with tool‑specific threads.  
     - `wiki/ai_programming/2022-2023_phase.md`: “Growing acceptance with caveats”.  
     - `wiki/ai_programming/2024-2025_phase.md`: “Routine integration, ethical debates”.  

5. **Agent synthesizes answer**  
   - Build a short narrative:  
     - Phase 1: Fear and “AI writes garbage code”.  
     - Phase 2: “Let’s try this anyway” with specific tools.  
     - Phase 3: “It’s useful but dangerous”.  
     - Phase 4: “It’s just another tool, but we need guardrails”.  
   - Include 3–5 landmark posts per phase.

**Final user‑facing answer format**  
- A 300–500‑word narrative with 4 labeled phases.  
- A bullet list of 6–10 key LinuxFr URLs, each tied to a phase.  
- A short “takeaway” on where the community stands today.

***

#### 3.2 Contradiction‑spotter (Topic: proprietary SaaS tools in FOSS projects)

**Step‑by‑step workflow**

1. **User asks**  
   > “Find two LinuxFr posts written at least 5 years apart that make directly contradictory claims about the role of proprietary SaaS tools in free‑software ecosystems, and explain how the context changed between them.”

2. **Agent collects**  
   - `linuxfr_collect_pages` on:  
     - `https://linuxfr.org/tags/logiciel_libre.atom`  
     - `https://linuxfr.org/tags/saas.atom`  
     - A few “ethical SaaS” or “open‑core”‑related journals/news (pick 20 URLs manually).  

3. **Agent queries and contrasts**  
   - `linuxfr_query_raw` filters by:  
     - sentiment‑proxy keywords: “tolérable”, “inacceptable”, “pragmatique”, “compromis”.  
     - date ranges: 2010–2015, 2020–2025.  
   - Extract explicit claims like:  
     - “SaaS is poison for FOSS” vs “some SaaS is necessary for growth”.

4. **Agent builds wiki notes**  
   - `linuxfr_update_wiki` creates:  
     - `wiki/saas_foss/2012_hardline.md`: “Pure‑FOSS stance”.  
     - `wiki/saas_foss/2022_pragmatic.md`: “SaaS is unavoidable but must be cautious”.  
   - Each note cites 2–3 URLs plus key quotes.

5. **Agent constructs answer**  
   - Present two pairs:  
     - Earliest hard‑line post (2012).  
     - Later pragmatic post (2022).  
   - Explain the technological and business‑context shift (GitHub dominance, cloud, CI/CD, etc.).

**Final answer format**  
- A short narrative of “purism vs pragmatism” evolution.  
- Two clear tables:  
  - Table 1: “Hard‑line stance” (year, title, URL, key quote).  
  - Table 2: “Pragmatic stance” (same).  
- 2–3 sentences on why the community shifted.

***

#### 3.3 Memory‑lane heatmaps (Topic: Flatpak vs Snap)

**Step‑by‑ahead workflow**

1. **User asks**  
   > “Show me how LinuxFr’s attitude toward systemd changed between 2010 and 2020, using titles, tags, and top‑level comments; summarize the main phases and turning‑point threads.”

2. **Agent collects**  
   - `linuxfr_collect_pages` on:  
     - `https://linuxfr.org/tags/systemd.atom`  
     - `https://linuxfr.org/tags/upstart.atom`  
     - `https://linuxfr.org/tags/sysvinit.atom`  
     - 10–15 key “systemd adoption” or “systemd debate” threads from 2010–2020.  

3. **Agent queries and time‑slices**  
   - `linuxfr_query_raw` filters by year chunks (2010–2012, 2013–2015, 2016–2018, 2019–2020).  
   - Counts occurrences of keywords like “loat”, “bloat”, “unavoidable”, “standard”, “replacement”.

4. **Agent builds wiki notes**  
   - `linuxfr_update_wiki` creates:  
     - `wiki/systemd/migration_phases_2010-2012.md`  
     - `wiki/systemd/migration_phases_2013-2015.md`  
     - `wiki/systemd/migration_phases_2016-2018.md`  
     - `wiki/systemd/migration_phases_2019-2020.md`  
   - Each note includes:  
     - sentiment flavor,  
     - key arguments,  
     - links to 2–3 pivotal posts.

5. **Agent visualizes verbally (text heatmap)**  
   - Describe “heat” as:  
     - “Cold” (little discussion),  
     - “Warming” (emerging controversy),  
     - “Hot” (open war),  
     - “Cooling” (acceptance).  

**Final answer format**  
- A timeline of 4–5 phases, each with 1–2 sentences.  
- A short list of 4–6 “turning‑point” URLs.  
- A “today” snapshot: “systemd is now the default, but debates continue around scope and bloat”.

***

### 4. 10 powerful user prompts for surprising insights

Use these as templates to probe the LinuxFr corpus with only your current MVP:

1. “Find three technologies that were once strongly opposed on LinuxFr but later widely accepted, and explain what changed between the early and late phases.”  
2. “List the top five LinuxFr‑discussed software‑freedom issues that still show no clear consensus, and summarize the main camps.”  
3. “Identify a LinuxFr user whose views on a specific topic have clearly reversed over time, and show their earlier and later positions with links.”  
4. “Compare how LinuxFr reacts to a security crisis (e.g., Log4Shell‑type event) versus a licensing crisis (e.g., AGPL‑like controversy), and highlight the moral‑reasoning patterns.”  
5. “Find two LinuxFr debates that look superficially similar but actually rest on different underlying values (e.g., freedom vs usability), and explain the difference.”  
6. “Map the evolution of LinuxFr’s attitude toward ‘cloud’ between 2012 and 2025, using phases and key articles.”  
7. “Build a ‘what‑not‑to‑do’ guide for publishing a LinuxFr journal: list 5 common mistakes that attract negative comments and show example posts.”  
8. “Trace how the LinuxFr community has shifted its stance on proprietary binaries (e.g., firmware blobs), and identify the turning‑point debates.”  
9. “Find three LinuxFr topics that have been discussed for at least 10 years without real resolution, and list the arguments that keep them alive.”  
10. “Given the LinuxFr data from 2018–2025, propose three emerging ethical tensions that are likely to define the next decade.”

***

### 5. Tool wishlist for going further

Here are 10 new or improved tools that stay within: public‑read‑only, no crawl, no auth, no vector‑DB, but amplify your current MVP.

#### 1. `linuxfr_extract_entities`

- **What it does**  
  Extracts named entities (projects, people, companies, standards) and topics from raw LinuxFr pages.

- **Use case it unlocks**  
  “Memory‑lane heatmaps”, “Weak‑signal‑spotter”, “Collective‑intelligence‑curator” can now track specific entities over time.

- **Why current MVP is not enough**  
  `linuxfr_query_raw` only filters by keywords; entities are noisy and overlapping.

- **Complexity:** medium.  
- **Add:** soon.

#### 2. `linuxfr_Clusters_topics`

- **What it does**  
  Groups raw pages into topical clusters (e.g., “systemd‑migration”, “Flatpak‑vs‑Snap”, “AI‑assisted‑coding”) using keyword‑based heuristics.

- **Use case it unlocks**  
  “Opinion‑shift pulse”, “Debate‑map‑builder”, “Memory‑lane heatmaps”.

- **Why current MVP is not enough**  
  Current tools are manual filters; clusters let the agent propose “topics of interest” to users.

- **Complexity:** medium.  
- **Add:** soon.

#### 3. `linuxfr_summarize_snippets`

- **What it does**  
  Produces compact, coherent summaries of page snippets (title + first 200 words + key tags) for each raw page.

- **Use case it unlocks**  
  “Debate‑map‑builder”, “Community‑DNA profiler”, “Collective‑intelligence‑curator”.

- **Why current MVP is not enough**  
  You currently query “snippets” but must summarize manually.

- **Complexity:** small.  
- **Add:** soon.

#### 4. `linuxfr_timeline_by_year`

- **What it does**  
  Given a query, returns a year‑by‑year count of matching pages plus a short “what happened this year” note.

- **Use case it unlocks**  
  “Memory‑lane heatmaps”, “Opinion‑shift pulse”, “Institutional‑amnesia‑detector”.

- **Why current MVP is not enough**  
  You can filter by year but must build timelines in the agent logic.

- **Complexity:** small.  
- **Add:** soon.

#### 5. `linuxfr_extract_arguments`

- **What it does**  
  For a given page, identifies explicit claims and counter‑claims (pro/con lists) from body text and top‑level comments.

- **Use case it unlocks**  
  “Contradiction‑spotter”, “Debate‑map‑builder”, “Institutional‑amnesia‑detector”.

- **Why current MVP is not enough**  
  You currently see text; you don’t formally extract “claim” and “counter‑claim”.

- **Complexity:** medium.  
- **Add:** later.

#### 6. `linuxfr_diff_with_years`

- **What it does**  
  Given two year ranges and a topic, returns a diff of dominant arguments, keywords, and sentiment.

- **Use case it unlocks**  
  “Opinion‑shift pulse”, “Contradiction‑spotter”.

- **Why current MVP is not enough**  
  You can query each year range, but no diff automation.

- **Complexity:** medium.  
- **Add:** later.

#### 7. `linuxfr_tags_cooccurrence`

- **What it does**  
  Computes tag co‑occurrence (e.g., “ia + logiciel_libre”, “systemd + securite”) across pages.

- **Use case it unlocks**  
  “Weak‑signal‑spotter”, “Community‑DNA profiler”.

- **Why current MVP is not enough**  
  You can filter by tag; you don’t see which tags move together.

- **Complexity:** small.  
- **Add:** soon.

#### 8. `linuxfr_extract_quoted_sources`

- **What it does**  
  Identifies and extracts URLs, RFCs, standards, and external references mentioned in LinuxFr posts.

- **Use case it unlocks**  
  “Community‑DNA profiler”, “Cultural‑bridge‑builder”, “Collective‑intelligence‑curator”.

- **Why current MVP is not enough**  
  Raw text contains links, but they are not structured.

- **Complexity:** small.  
- **Add:** later.

#### 9. `linuxfr_rank_by_influence`

- **What it does**  
  Uses heuristics (number of comments, score, age, author) to rank pages by “influence” for a given topic.

- **Use case it unlocks**  
  “Memory‑lane heatmaps”, “Debate‑map‑builder”, “Collective‑intelligence‑curator”.

- **Why current MVP is not enough**  
  You can filter but not rank pages by “impact”.

- **Complexity:** medium.  
- **Add:** later.

#### 10. `linuxfr_export_as_markdown_dataset`

- **What it does**  
  Exports selected pages and their metadata into a flat Markdown dataset (one `.md` per page, with front‑matter) for external analysis or sharing.

- **Use case it unlocks**  
  Researchers, journalists, and historians can work with your LinuxFr corpus without touching Pi or the agent.

- **Why current MVP is not enough**  
  You already store raw pages, but not in a structured, portable dataset.

- **Complexity:** small.  
- **Add:** later.

***

Would you like me to now **take one of the top‑3 use cases** (e.g., “Opinion‑shift pulse” on “AI‑assisted programming”) and turn it into a fully scripted, concrete example of what the agent would output, with a mockup of the actual wiki notes and final answer?