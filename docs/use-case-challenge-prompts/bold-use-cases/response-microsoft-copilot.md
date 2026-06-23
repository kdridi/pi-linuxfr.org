### 1. Ten bold MVP-ready use cases

---

#### 1. Timeline Surgeon

- **Core idea:**  
  **Reconstruct long-term opinion shifts** on a specific topic (e.g. systemd, Wayland, GitHub, cloud, licenses) by stitching together news, journals, forums, polls, and links into a dated narrative.
- **Why it’s valuable/surprising:**  
  You don’t just get “what people think now”, but how the LinuxFr community *changed its mind* over 10–20 years—where resistance broke, where compromises emerged, and which arguments disappeared.
- **How the MVP supports it:**  
  - **linuxfr_collect_pages:** Collect key news, journals, polls, and forum threads on a chosen topic across years.  
  - **linuxfr_query_raw:** Filter by type and query string (e.g. “systemd”, “Wayland”) to surface representative pages.  
  - **linuxfr_update_wiki:** Create “timeline notes” summarizing each phase, citing sources and capturing key arguments.
- **Sources to collect first:**  
  - News and journals announcing major changes (systemd adoption, Wayland milestones, GitHub acquisitions).  
  - Polls about controversial topics.  
  - Long forum threads with heated debates.
- **Example user prompt:**  
  *“Reconstruct how LinuxFr’s attitude toward systemd evolved from initial outrage to today. Show key turning points and arguments.”*

---

#### 2. Contradiction Radar

- **Core idea:**  
  **Detect contradictions over time** between what the community predicted or claimed and what actually happened—especially around technologies, licenses, business models, or governance.
- **Why it’s valuable/surprising:**  
  It reveals blind spots, recurring biases, and where collective intuition failed or succeeded—useful for current decision-making and humility.
- **How the MVP supports it:**  
  - **linuxfr_collect_pages:** Gather early “prediction” posts (journals, news, polls) and later outcome discussions.  
  - **linuxfr_query_raw:** Filter by topic and date ranges to compare early vs late discourse.  
  - **linuxfr_update_wiki:** Create “prediction vs reality” notes with quotes and outcomes.
- **Sources to collect first:**  
  - Early hype or doom posts (e.g. about open-core, cloud, mobile Linux, GPL enforcement).  
  - Later retrospectives, bug reports, project post-mortems, or “what went wrong” journals.
- **Example user prompt:**  
  *“Find cases where LinuxFr predicted failure for a project that later became mainstream, and analyze why the prediction missed.”*

---

#### 3. Weak Signal Hunter

- **Core idea:**  
  **Identify early mentions of projects or ideas** that later became important (or could still become important), by scanning old news, journals, and links for “small” announcements and niche discussions.
- **Why it’s valuable/surprising:**  
  Shows LinuxFr as a radar for emerging tech—surfacing obscure projects, early forks, or governance experiments before they were widely known.
- **How the MVP supports it:**  
  - **linuxfr_collect_pages:** Collect old feeds and news/journals around specific years or themes.  
  - **linuxfr_query_raw:** Filter by date and keywords like “new project”, “alpha”, “fork”, “experimental”.  
  - **linuxfr_update_wiki:** Create “weak signal” notes with short descriptions and links to original posts.
- **Sources to collect first:**  
  - News feeds from 2000–2015.  
  - Journals announcing personal projects.  
  - Links sections pointing to obscure repos or mailing lists.
- **Example user prompt:**  
  *“Find three projects that appeared as ‘small announcements’ on LinuxFr around 2010–2015 and later became influential.”*

---

#### 4. Pain Point Atlas

- **Core idea:**  
  **Map recurring pain points** (packaging, drivers, documentation, UX, governance, funding) across years and content types to see what never gets solved.
- **Why it’s valuable/surprising:**  
  It reveals structural frustrations of the free software ecosystem and where interventions could have the biggest impact.
- **How the MVP supports it:**  
  - **linuxfr_collect_pages:** Collect forum threads, journals, and polls about “problèmes”, “galère”, “ras-le-bol”, “drivers”, “doc”, “UX”.  
  - **linuxfr_query_raw:** Filter by type (forums/journals) and keywords to cluster pain points.  
  - **linuxfr_update_wiki:** Create thematic notes (e.g. “Packaging pain 2005–2020”) with representative quotes.
- **Sources to collect first:**  
  - Forum threads about installation issues, hardware support, distro wars.  
  - Journals about burnout, maintenance fatigue, project abandonment.  
  - Polls about “what annoys you most”.
- **Example user prompt:**  
  *“Show me the top recurring pain points for desktop Linux users on LinuxFr over the last 15 years.”*

---

#### 5. Governance Lab

- **Core idea:**  
  **Analyze community debates about governance, licenses, and ethics** (copyleft vs permissive, code of conduct, foundations, corporate influence) across news, journals, and forums.
- **Why it’s valuable/surprising:**  
  It surfaces the community’s political and ethical reasoning, not just technical opinions—useful for designing new projects or foundations.
- **How the MVP supports it:**  
  - **linuxfr_collect_pages:** Collect debates around GPL, AGPL, MIT, corporate contributions, CoC, foundations.  
  - **linuxfr_query_raw:** Filter by type and keywords like “licence”, “fondation”, “gouvernance”, “code de conduite”.  
  - **linuxfr_update_wiki:** Create “governance patterns” notes summarizing recurring arguments and trade-offs.
- **Sources to collect first:**  
  - News about license changes, foundation announcements, corporate acquisitions.  
  - Journals reflecting on community conflicts.  
  - Forum threads about moderation, rules, and ethics.
- **Example user prompt:**  
  *“What governance models does the LinuxFr community tend to favor for large open-source projects, and why?”*

---

#### 6. Distro War Archaeologist

- **Core idea:**  
  **Excavate the history of distro wars** (Debian vs Ubuntu vs Arch vs Gentoo vs Fedora, etc.) and show how arguments evolved—performance, philosophy, packaging, community.
- **Why it’s valuable/surprising:**  
  It turns endless flamewars into structured knowledge: what actually mattered, what was noise, and which criticisms aged well or poorly.
- **How the MVP supports it:**  
  - **linuxfr_collect_pages:** Collect forum threads, polls, and news about distros.  
  - **linuxfr_query_raw:** Filter by distro names and type (forums/polls).  
  - **linuxfr_update_wiki:** Create “distro war” notes per era, summarizing main arguments and outcomes.
- **Sources to collect first:**  
  - Polls about “favorite distro”.  
  - Forum threads comparing distros.  
  - News about major releases or controversial changes.
- **Example user prompt:**  
  *“Summarize how arguments in Debian vs Ubuntu debates on LinuxFr changed between 2006 and 2020.”*

---

#### 7. Project Fate Tracker

- **Core idea:**  
  **Follow the lifecycle of specific projects** (desktop environments, package managers, self-hosted tools) from first mention to current status, using LinuxFr as a narrative backbone.
- **Why it’s valuable/surprising:**  
  It shows how projects live, stagnate, fork, or die—and how community sentiment tracks that trajectory.
- **How the MVP supports it:**  
  - **linuxfr_collect_pages:** Collect all major posts about a chosen project (news, journals, links, forums).  
  - **linuxfr_query_raw:** Filter by project name and date.  
  - **linuxfr_update_wiki:** Create “project dossier” notes with phases: launch, adoption, crisis, fork, decline.
- **Sources to collect first:**  
  - News announcing releases or forks.  
  - Journals from contributors or users.  
  - Forum threads about bugs, migration, or abandonment.
- **Example user prompt:**  
  *“Build a dossier on the history of Mageia as seen through LinuxFr: hopes, crises, and current perception.”*

---

#### 8. Cultural Lexicon Miner

- **Core idea:**  
  **Extract the cultural vocabulary of LinuxFr**—recurring jokes, memes, nicknames, idioms, and references that define the community’s identity.
- **Why it’s valuable/surprising:**  
  It reveals the “inside language” of the community, which is crucial for designing respectful tools, onboarding newcomers, or studying tech culture.
- **How the MVP supports it:**  
  - **linuxfr_collect_pages:** Collect journals and forums where informal language is rich.  
  - **linuxfr_query_raw:** Search for recurring expressions, memes, and nicknames.  
  - **linuxfr_update_wiki:** Create “lexicon” notes with definitions, origins, and example citations.
- **Sources to collect first:**  
  - Popular journals with many comments.  
  - Long forum threads on off-topic or meta discussions.  
  - Polls with humorous options.
- **Example user prompt:**  
  *“Identify five recurring in-jokes or expressions on LinuxFr and explain what they reveal about the community.”*

---

#### 9. Policy Impact Lens

- **Core idea:**  
  **Track how public policies and laws** (Hadopi, DRM, software patents, digital sovereignty, cloud regulation) were discussed and perceived over time.
- **Why it’s valuable/surprising:**  
  It connects tech culture with political context, showing how a free software community reacts to state and corporate power.
- **How the MVP supports it:**  
  - **linuxfr_collect_pages:** Collect news and journals about specific laws or policy debates.  
  - **linuxfr_query_raw:** Filter by law names and keywords like “loi”, “DRM”, “brevets”, “souveraineté numérique”.  
  - **linuxfr_update_wiki:** Create “policy impact” notes summarizing fears, hopes, and actual outcomes.
- **Sources to collect first:**  
  - News on legislative changes.  
  - Journals reflecting on policy consequences.  
  - Forum threads debating activism or boycotts.
- **Example user prompt:**  
  *“How did LinuxFr discussions around Hadopi and DRM evolve, and what impact did people expect versus what happened?”*

---

#### 10. Collective Design Critic

- **Core idea:**  
  **Aggregate community critiques of UX, documentation, and onboarding** for major tools (desktop environments, package managers, editors) to produce a “collective design review”.
- **Why it’s valuable/surprising:**  
  It turns scattered complaints into actionable design insights grounded in years of lived experience.
- **How the MVP supports it:**  
  - **linuxfr_collect_pages:** Collect forum threads and journals about usability, documentation, onboarding.  
  - **linuxfr_query_raw:** Filter by keywords like “ergonomie”, “interface”, “doc”, “tutoriel”, “prise en main”.  
  - **linuxfr_update_wiki:** Create “design review” notes per tool, with categorized issues and suggestions.
- **Sources to collect first:**  
  - Forum threads about “why X is hard to use”.  
  - Journals describing migration experiences.  
  - Polls about favorite/most hated tools.
- **Example user prompt:**  
  *“Produce a collective UX review of KDE Plasma based on LinuxFr discussions over the last decade.”*

---

### 2. Ranking the use cases

| #  | Use case                 | Originality | Practical usefulness | Feasibility (MVP) | Non-obvious insight potential |
|----|--------------------------|------------|----------------------|-------------------|-------------------------------|
| 1  | Timeline Surgeon         | High       | High                 | High              | Very high                    |
| 2  | Contradiction Radar      | Very high  | Medium-high          | Medium            | Very high                    |
| 3  | Weak Signal Hunter       | Very high  | High                 | Medium            | Very high                    |
| 4  | Pain Point Atlas         | High       | Very high            | High              | High                         |
| 5  | Governance Lab           | High       | High                 | Medium-high       | High                         |
| 6  | Distro War Archaeologist | Medium     | Medium-high          | High              | Medium-high                  |
| 7  | Project Fate Tracker     | Medium-high| High                 | High              | High                         |
| 8  | Cultural Lexicon Miner   | High       | Medium               | Medium            | High                         |
| 9  | Policy Impact Lens       | Medium-high| Medium-high          | Medium            | High                         |
| 10 | Collective Design Critic | Medium     | Very high            | High              | Medium-high                  |

---

### 3. Top 3 use cases to prototype first

1. **Timeline Surgeon**  
2. **Weak Signal Hunter**  
3. **Pain Point Atlas**

These three:
- Exploit historical depth and differences between content types.
- Are feasible with explicit URL collection and simple querying.
- Naturally benefit from incremental wiki notes.
- Produce highly non-obvious, strategic insights.

---

### 4. Detailed workflows for the top 3

---

#### A. Timeline Surgeon

##### Step-by-step agent workflow

1. **Clarify topic and timeframe**  
   - Ask user: topic (e.g. systemd, Wayland, GitHub) and rough years of interest.
2. **Collect key pages**  
   - Use **linuxfr_collect_pages** on:  
     - News announcing major events (adoption, releases, controversies).  
     - Journals with personal reflections.  
     - Polls about the topic.  
     - Forum threads with long debates.
3. **Query local dataset**  
   - Use **linuxfr_query_raw** with filters:  
     - `query="systemd"` (or chosen topic).  
     - `type` in `{news, journal, forum, poll}`.  
     - Optional date filters if available in metadata.
4. **Cluster by phase**  
   - Group sources into phases: “early reaction”, “consolidation”, “normalization”, “backlash”, etc.  
   - Identify representative posts per phase.
5. **Generate wiki notes**  
   - Use **linuxfr_update_wiki** to create:  
     - `timeline_<topic>_overview.md` — high-level phases.  
     - `timeline_<topic>_phase_<n>.md` — per-phase notes with key arguments and citations.
6. **Compose final answer**  
   - Reason from wiki notes to produce a narrative: turning points, argument shifts, emotional tone changes.

##### Minimal URLs/source types to collect

- **News:**  
  - Initial introduction of the topic (e.g. “systemd arrives in Debian”).  
  - Major milestones (default adoption, big releases, controversies).
- **Journals:**  
  - Personal migration stories, rants, or praise.  
- **Forums:**  
  - Long threads debating pros/cons.  
- **Polls:**  
  - “Do you use X?”, “Do you like X?”, “Should distro Y adopt X?”

##### Expected wiki notes

- **Overview note:**  
  - Title: *“Timeline: LinuxFr and systemd (2009–2020)”*  
  - Sections: phases, sentiment summary, key events, representative quotes.
- **Phase notes:**  
  - One note per phase (e.g. “Initial shock”, “Reluctant adoption”, “Normalization”).  
  - Each with: date range, main arguments, typical comments, poll results.
- **Meta note (optional):**  
  - “Lessons from the systemd transition” with patterns applicable to future tech shifts.

##### Final user-facing answer format

- **Structured narrative report:**
  - Short intro.  
  - Timeline with phases and dates.  
  - Bullet points of key arguments per phase.  
  - Selected quotes (paraphrased or short citations).  
  - “What this teaches us” section with 3–5 insights.

---

#### B. Weak Signal Hunter

##### Step-by-step agent workflow

1. **Clarify scope**  
   - Ask user: time window (e.g. 2005–2015) and domain (e.g. self-hosting, programming languages, desktop environments).
2. **Collect historical feeds/pages**  
   - Use **linuxfr_collect_pages** on:  
     - Atom feeds for news/journals in the chosen period.  
     - Specific archives pages if the user provides URLs.
3. **Query for weak signals**  
   - Use **linuxfr_query_raw** with:  
     - `query` containing terms like “nouveau projet”, “alpha”, “fork”, “expérimental”, “petit outil”.  
     - Limit to small sets (e.g. top 50 matches).
4. **Select candidates**  
   - From snippets and metadata, pick posts that:  
     - Introduce a new project.  
     - Have few comments but interesting ideas.  
     - Mention unusual approaches or architectures.
5. **Generate wiki notes**  
   - Use **linuxfr_update_wiki** to create:  
     - `weak_signals_<domain>_<year_range>.md` — overview.  
     - One note per project: short description, initial reception, links.
6. **Compose final answer**  
   - Highlight 3–5 projects: what they were, what they became (if known), and why they were “weak signals”.

##### Minimal URLs/source types to collect

- **Atom feeds:**  
  - News and journals feeds for the relevant years.  
- **News/journals pages:**  
  - Posts that look like “I’m releasing a small tool”, “new project”, “alpha release”.
- **Links:**  
  - Link posts pointing to obscure repos or blog posts.

##### Expected wiki notes

- **Overview note:**  
  - “Weak signals in self-hosting (2008–2015)” with categories: storage, messaging, collaboration, etc.
- **Project notes:**  
  - Each with: name, initial description, context, early comments, potential impact.
- **Meta note:**  
  - “Patterns in weak signals” (e.g. many start as personal frustration projects).

##### Final user-facing answer format

- **Discovery-style report:**
  - Intro explaining “weak signals”.  
  - List of 3–5 highlighted projects with short stories.  
  - Timeline or table showing when they appeared and what happened later.  
  - “How to spot the next weak signal” section.

---

#### C. Pain Point Atlas

##### Step-by-step agent workflow

1. **Clarify domain of pain**  
   - Ask user: desktop usage, server admin, packaging, drivers, documentation, etc.
2. **Collect relevant pages**  
   - Use **linuxfr_collect_pages** on:  
     - Forum threads about “problème”, “galère”, “bug”, “drivers”, “installation”.  
     - Journals describing frustrations or failures.  
     - Polls about “what annoys you most”.
3. **Query and categorize**  
   - Use **linuxfr_query_raw** with:  
     - `query` terms like “problème”, “galère”, “ras-le-bol”, “drivers”, “doc”, “UX”.  
     - Filter by type (forums/journals/polls).
4. **Cluster pain points**  
   - Group snippets into categories: hardware, packaging, UX, documentation, community, governance, etc.  
   - Note frequency and persistence across years.
5. **Generate wiki notes**  
   - Use **linuxfr_update_wiki** to create:  
     - `pain_points_<domain>_overview.md` — categories and examples.  
     - Category-specific notes (e.g. `pain_points_drivers.md`, `pain_points_packaging.md`).
6. **Compose final answer**  
   - Present top recurring pain points, how they evolved, and what the community sees as possible solutions (if any).

##### Minimal URLs/source types to collect

- **Forums:**  
  - Threads about installation issues, hardware incompatibility, distro upgrades gone wrong.  
- **Journals:**  
  - Personal stories of failed migrations, burnout, or maintenance fatigue.  
- **Polls:**  
  - “What annoys you most in Linux?” or similar.

##### Expected wiki notes

- **Overview note:**  
  - “Pain Point Atlas: Desktop Linux on LinuxFr” with categories and severity.
- **Category notes:**  
  - Each with representative quotes, typical scenarios, and time evolution.
- **Meta note:**  
  - “Structural vs solved pain points” (what keeps coming back vs what faded).

##### Final user-facing answer format

- **Analytical map:**
  - Intro explaining the Atlas concept.  
  - Category-by-category breakdown with short descriptions and examples.  
  - Timeline hints (e.g. “driver issues peaked around X, packaging complaints persisted”).  
  - “If you’re designing a new distro/tool, here’s what to fix first” section.

---

### 5. Ten powerful user prompts for surprising insights

1. **“Show me three cases where LinuxFr was strongly opposed to a technology that later became standard, and analyze why.”**  
2. **“Identify early mentions of self-hosted alternatives to big cloud platforms on LinuxFr and what happened to them.”**  
3. **“Map the recurring arguments in Debian vs Ubuntu debates and tell me which ones aged badly.”**  
4. **“From journals and forums, extract the main reasons maintainers on LinuxFr say they burn out or abandon projects.”**  
5. **“Compare how LinuxFr discussed GitHub when it appeared versus how it discusses code hosting today.”**  
6. **“Find examples where a small personal project announced in a LinuxFr journal later became widely used or influential.”**  
7. **“Build a lexicon of three recurring jokes or memes on LinuxFr and explain what they reveal about the community’s values.”**  
8. **“Analyze LinuxFr discussions around digital sovereignty and cloud over the last decade and summarize the main fears and hopes.”**  
9. **“Using polls and forums, show how desktop environment preferences shifted over time and why.”**  
10. **“Identify the top three structural pain points that never seem to disappear from LinuxFr discussions, and explain why they persist.”**

---

### 6. Tool wishlist for going further

---

#### 1. linuxfr_collect_by_search

- **What it does:**  
  Allows the agent to search LinuxFr by keyword and type (news, journal, forum, poll, link) and automatically collect matching URLs, within a bounded limit.
- **Which use cases it unlocks/improves:**  
  - Strongly improves **Timeline Surgeon**, **Weak Signal Hunter**, **Pain Point Atlas**, **Contradiction Radar** by reducing manual URL provision.  
- **Why MVP is not enough:**  
  Currently, a human must manually provide URLs or feeds; this limits breadth and makes longitudinal analysis tedious.  
- **Complexity:** Medium.  
- **When to add:** Soon.  
- **Compatibility:** Uses public search pages only, no auth, no full crawling.

---

#### 2. linuxfr_comment_snapshot

- **What it does:**  
  Collects and stores comments for a given page (within a limit), as raw HTML/Markdown, linked to the parent source.
- **Which use cases it unlocks/improves:**  
  - Deepens **Pain Point Atlas**, **Cultural Lexicon Miner**, **Collective Design Critic**, **Governance Lab**.  
- **Why MVP is not enough:**  
  Many insights live in comments; without them, you miss the richest community debates and jokes.  
- **Complexity:** Medium.  
- **When to add:** Soon.  
- **Compatibility:** Public comments only, no posting, no auth.

---

#### 3. linuxfr_time_filter_query

- **What it does:**  
  Extends **linuxfr_query_raw** with explicit date-range filtering based on metadata (year, month).
- **Which use cases it unlocks/improves:**  
  - Crucial for **Timeline Surgeon**, **Policy Impact Lens**, **Distro War Archaeologist**.  
- **Why MVP is not enough:**  
  Without time filtering, longitudinal analysis is fuzzier and harder to structure.  
- **Complexity:** Small (assuming metadata already includes dates).  
- **When to add:** Soon.  
- **Compatibility:** Uses existing metadata only.

---

#### 4. linuxfr_topic_cluster_hint

- **What it does:**  
  Provides lightweight clustering hints (e.g. grouping sources by shared keywords or tags) without full embeddings or heavy infra.
- **Which use cases it unlocks/improves:**  
  - Helps **Pain Point Atlas**, **Weak Signal Hunter**, **Project Fate Tracker** by grouping related posts.  
- **Why MVP is not enough:**  
  Manual clustering from raw queries is possible but tedious and error-prone.  
- **Complexity:** Medium.  
- **When to add:** Later.  
- **Compatibility:** Operates on local metadata and titles only.

---

#### 5. linuxfr_poll_extractor

- **What it does:**  
  Extracts poll questions, options, and results into structured data from poll pages.
- **Which use cases it unlocks/improves:**  
  - Boosts **Timeline Surgeon**, **Distro War Archaeologist**, **Policy Impact Lens**, **Pain Point Atlas**.  
- **Why MVP is not enough:**  
  Polls are currently just raw pages; structured extraction enables quantitative trend analysis.  
- **Complexity:** Medium.  
- **When to add:** Soon.  
- **Compatibility:** Public poll pages only.

---

#### 6. linuxfr_link_graph_builder

- **What it does:**  
  Builds a simple graph of links between LinuxFr pages (news, journals, links) and external URLs, stored as a small adjacency list.
- **Which use cases it unlocks/improves:**  
  - Enables **Weak Signal Hunter**, **Project Fate Tracker**, **Policy Impact Lens** to see which external sites or projects are central.  
- **Why MVP is not enough:**  
  Current wiki notes are textual; link structure is hidden and not exploitable.  
- **Complexity:** Medium-large (depending on HTML variability).  
- **When to add:** Later.  
- **Compatibility:** Public pages only, no crawling beyond explicit URLs.

---

#### 7. linuxfr_tag_metadata_enricher

- **What it does:**  
  Extracts and normalizes tags/categories from LinuxFr pages into structured metadata.
- **Which use cases it unlocks/improves:**  
  - Helps **Governance Lab**, **Policy Impact Lens**, **Pain Point Atlas**, **Timeline Surgeon** by enabling tag-based filtering.  
- **Why MVP is not enough:**  
  Querying only by free-text is less precise than combining tags and keywords.  
- **Complexity:** Small-medium.  
- **When to add:** Soon.  
- **Compatibility:** Uses public tag/category info.

---

#### 8. linuxfr_wiki_crosslinker

- **What it does:**  
  Automatically suggests cross-links between wiki notes (e.g. connecting “systemd timeline” with “pain points: init systems”).
- **Which use cases it unlocks/improves:**  
  - Turns the wiki into a **knowledge graph**, improving all longitudinal and thematic analyses.  
- **Why MVP is not enough:**  
  Current wiki is incremental but not structurally connected; insights remain siloed.  
- **Complexity:** Medium.  
- **When to add:** Later.  
- **Compatibility:** Operates only on local wiki files.

---

#### 9. linuxfr_feed_to_detail_helper

- **What it does:**  
  Given an Atom feed entry, helps resolve and collect the corresponding detail page URL (without full crawling), using simple heuristics.
- **Which use cases it unlocks/improves:**  
  - Improves **Weak Signal Hunter**, **Timeline Surgeon**, **Project Fate Tracker** by ensuring feed entries have full content.  
- **Why MVP is not enough:**  
  Currently, feed-to-detail is not automatic; you risk missing full context.  
- **Complexity:** Medium.  
- **When to add:** Later.  
- **Compatibility:** Uses explicit links from feeds only.

---

#### 10. linuxfr_snippet_highlighter

- **What it does:**  
  Enhances **linuxfr_query_raw** to return highlighted snippets around matched keywords, making manual inspection easier.
- **Which use cases it unlocks/improves:**  
  - Helps **Cultural Lexicon Miner**, **Pain Point Atlas**, **Contradiction Radar** by quickly spotting relevant passages.  
- **Why MVP is not enough:**  
  Current snippets may be too generic; highlighting accelerates human-directed workflows.  
- **Complexity:** Small.  
- **When to add:** Soon.  
- **Compatibility:** Operates on local raw sources only.

---

If you want, we can pick one topic—say systemd, GitHub, or digital sovereignty—and sketch the exact URLs and first wiki notes to build for a real prototype.