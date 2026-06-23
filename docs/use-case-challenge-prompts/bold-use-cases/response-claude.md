# LinuxFr Agent — Bold Use Cases for the 3-Tool MVP

*Grounding note:* recommendations below use LinuxFr's real structure. Confirmed: section Atom feeds follow the `https://linuxfr.org/<section>.atom` pattern (`news.atom`, `journaux.atom` verified; the full, exact list of feed URLs for *liens, sondages, forums, suivi, suivi-comments, wiki, wiki-modifications* is published on the site map at `https://linuxfr.org/plan` — have the agent seed from there once rather than guessing slugs). Cross-type tag pages aggregate **every** content type that carries a tag at `https://linuxfr.org/tags/<tag>/public`. Dépêche-only topical sections live at `https://linuxfr.org/sections/<name>`. Per-user feeds exist at `https://linuxfr.org/users/<user>.atom`. Crucially, **every comment exposes its score publicly** as `Évalué à N (+up/−down)` — that single fact unlocks several use cases nothing else could. Content is CC By-SA / CC0, so citing is clean.

The three primitives map cleanly onto an investigative loop:
- **collect** = acquire a *bounded, explicit* slice of the corpus (a feed, a tag page, a handful of detail URLs)
- **query_raw** = slice that local corpus by type/url/string/limit
- **update_wiki** = crystallize a finding into a cited, reusable note that compounds over sessions

The whole design philosophy below: treat LinuxFr not as "articles to summarize" but as **a 27-year time-series of a community thinking out loud, with built-in epistemic metadata** (content type = epistemic status, comment scores = collective judgment, tags = the community's own ontology, timestamps = the arrow of time).

---

## 1. Ten Bold Use Cases

### 1.1 — Le Marronnier Detector *(Recurring-Debate Excavator)*
**Core idea.** "Marronnier" is the French press term for a topic that resurfaces on a seasonal cycle. LinuxFr has dozens: systemd, Wayland-vs-X, GNOME-vs-KDE, RSS-is-dying, the Year of the Linux Desktop, souveraineté numérique, Mozilla's decline, "faut-il quitter GitHub". The agent reconstructs each marronnier as a **dated recurrence map**: every time the debate flared, who/what triggered it, and whether the arguments *evolved* or merely *looped*.
**Why valuable / surprising.** It converts "ugh, this again" into a measurable cultural rhythm and shows which debates are genuinely *settled* versus *eternally unresolved*. A debate that loops with identical arguments is a sign of a structural, not factual, disagreement — a genuinely non-obvious diagnosis.
**How the MVP supports it.** `collect` the tag page (`/tags/systemd/public`) plus `news.atom`/`journaux.atom` filtered for the term → `query_raw` by string across the dated corpus → `update_wiki` one note per marronnier holding a chronological table of flare-ups with one-line argument summaries.
**Collect first.** `/tags/<topic>/public` for the topic; the section feeds; a handful of the highest-profile dépêche detail pages per era.
**Example prompt.** *"Reconstruct the systemd debate on LinuxFr as a timeline of flare-ups. For each one, tell me whether the core argument was new or recycled, and when the tone shifted from outrage to acceptance."*

### 1.2 — Le Grand Livre des Prophéties *(Prophecy Ledger)*
**Core idea.** Mine old journaux, dépêches, and comments for **confident, falsifiable predictions** — "X will die," "Y will never take off," "this is the future" — and score each against what actually happened. Build a standing ledger of community prophecies, graded.
**Why valuable / surprising.** It's accountability + epistemic calibration for a whole subculture, and it's delightful. It reveals *which kinds* of predictions the community is systematically good or bad at (e.g. great at spotting governance risk, terrible at desktop-adoption timelines).
**How the MVP supports it.** `collect` old content by tag/era → `query_raw` for future-tense / modal phrasing ("va mourir", "ne percera jamais", "l'avenir", "dans 5 ans") → `update_wiki` a ledger note: prediction, date, source, present-day verdict (the agent supplies the verdict from its own knowledge or a follow-up collection).
**Collect first.** Tag pages for high-prediction topics (Wayland, Rust, Docker, Mozilla, IPv6, "bureau Linux"); older dépêches from the same tags.
**Example prompt.** *"Find me five predictions LinuxFr made about Wayland between 2010 and 2016, with dates and sources, and grade each as right, wrong, or too-early."*

### 1.3 — Le Karma Contrarian *(The Rejected Prophets)*
**Core idea.** Use the **public comment scores** to find comments that were *heavily downvoted* (`inutile`) at the time but whose position later became consensus — the community's rejected prophets. Inverse: highly-upvoted takes that aged badly.
**Why valuable / surprising.** This is the sharpest possible probe of *where collective intelligence failed*. It is only possible because LinuxFr exposes per-comment up/down scores — a property almost no other corpus offers. Finding a `−8` comment from 2014 that turned out completely right is a genuinely uncanny result.
**How the MVP supports it.** Needs comment-level data, which is the **one small extension** (see Tool Wishlist → `linuxfr_collect_comments`). With it: `collect` comments on a topic's key threads → `query_raw` for low-score comments → cross-reference with the present → `update_wiki` a "prescient minority" note.
**Collect first.** Detail pages (with comments) of the most-commented threads on a topic that later flipped (e.g. early Docker skepticism, early Rust enthusiasm, GitHub-acquisition reactions).
**Example prompt.** *"On the threads about Microsoft buying GitHub, find the most-downvoted comments that turned out to be right, and quote them with dates and scores."*

### 1.4 — Baromètre de Souveraineté *(Digital-Sovereignty Barometer)*
**Core idea.** LinuxFr is one of the richest francophone archives of *digital-sovereignty* discourse: dégooglisation, Framasoft, Microsoft in French schools/administrations, the Health Data Hub, Qwant, le cloud souverain, RGPD. Track the **sentiment arc and the specific recurring fights** decade over decade — hope, betrayal, cynicism, renewal.
**Why valuable / surprising.** No English-language source captures this. It's a longitudinal read on francophone tech-political mood that is directly relevant to policy, journalism, and EU open-source strategy.
**How the MVP supports it.** `collect` `/tags/souveraineté/public`, `/tags/dégooglisation/public`, `/tags/framasoft/public`, plus `liens.atom` for current pulse → `query_raw` for the named institutions → `update_wiki` a barometer note per theme with dated sentiment markers.
**Collect first.** The sovereignty/dégooglisation/Framasoft tag pages; recent `liens`.
**Example prompt.** *"Trace how LinuxFr's mood about French digital sovereignty changed from 2013 to today — name the specific episodes that drove optimism or disillusion."*

### 1.5 — La Courbe d'Adoption *(Community Hype-Cycle Reconstructor)*
**Core idea.** For an emerging project/tech, reconstruct its **full lifecycle through LinuxFr's eyes**: the first mention (usually a *lien* or *journal*, not a dépêche), the skeptical first comments, the "I actually tried it" reports, the eventual dépêche that anoints it, then disillusion or consolidation. A qualitative, dated, community-grounded Gartner curve.
**Why valuable / surprising.** Because LinuxFr's content types carry different epistemic weight, the *order* in which a project moves through them (lien → journal → dépêche) is itself the adoption signal. You get a hype cycle with citations and dates, not vibes.
**How the MVP supports it.** `collect` the project's tag page across all types → `query_raw` sorted by date → `update_wiki` a lifecycle note marking the type-transitions.
**Collect first.** `/tags/<project>/public`; earliest and latest detail pages.
**Example prompt.** *"Map Docker's lifecycle on LinuxFr from first mention to mainstream: when did it move from journaux to dépêches, and when did the skepticism peak?"*

### 1.6 — Le Pouls des Liens *(Weak-Signal Radar)*
**Core idea.** The *liens* section is a continuously curated stream of what the francophone libre community deems worth sharing **right now**. Use it as a radar: detect terms, tools, and projects appearing in *liens* (and their comments) that **have not yet earned a dépêche** — i.e. things on the cusp.
**Why valuable / surprising.** It's genuinely predictive and feed-native: you can run it today with zero extensions. The gap between "shows up in liens" and "gets an official dépêche" is an early-adopter lead time you can exploit.
**How the MVP supports it.** `collect` the *liens* feed regularly → `query_raw` for terms absent from the dépêche corpus → `update_wiki` a rolling "watchlist" note that the agent updates each run (the compounding-wiki thesis in action).
**Collect first.** The *liens* Atom feed (from `/plan`); `news.atom` for the contrast set.
**Example prompt.** *"What's getting shared in LinuxFr liens this month that hasn't made it into a dépêche yet? Give me a watchlist of three emerging things."*

### 1.7 — Cartographie des Douleurs *(Pain-Point Cartography)*
**Core idea.** Forums are where people go when something is broken. Mine recurring, often-unresolved questions and cluster them into a **map of persistent friction** in the francophone Linux experience — by hardware, by distro, by task.
**Why valuable / surprising.** This is a product/UX goldmine: real, dated, recurring pain from actual French-speaking users, the kind distro maintainers and doc writers rarely see aggregated. Recurrence over years separates *chronic* pain from *transient* pain.
**How the MVP supports it.** `collect` the forums feed and forum tag pages → `query_raw` for repeated question shapes ("comment", "ne fonctionne pas", "problème", specific hardware) → `update_wiki` a pain-map note grouped by theme with frequency and recency.
**Collect first.** Forums feed; `/tags/<hardware-or-distro>/public` filtered to forum entries.
**Example prompt.** *"What do French-speaking Linux users repeatedly struggle with around Wi-Fi and laptops, based on LinuxFr forums? Group the recurring pain points."*

### 1.8 — Le Miroir Communautaire *(Self-Portrait via Polls)*
**Core idea.** *Sondages* are the community interrogating itself — distro of choice, editor wars, hardware, habits, even reading and pets. Aggregate them over the years into an **evolving ethnographic self-portrait**: how the LinuxFr demographic's tastes and identity drift.
**Why valuable / surprising.** A rare longitudinal self-ethnography of a tech subculture, in its own words and its own chosen questions. The *questions the community chooses to ask itself* are as revealing as the answers.
**How the MVP supports it.** `collect` the *sondages* feed and archive → `query_raw` by theme → `update_wiki` a self-portrait note tracking shifts (e.g. editor-war intensity cooling, distro preference migration). Result distributions parse better with a small helper (see `linuxfr_poll_parse`), but titles+dates alone already tell a story.
**Collect first.** The *sondages* feed/archive (`/sondages`, feed via `/plan`).
**Example prompt.** *"From LinuxFr polls over the years, how has the community's relationship to its own identity — distros, editors, what counts as 'libre enough' — shifted?"*

### 1.9 — Anatomie d'un Consensus *(Manufacturing-of-News Forensics)*
**Core idea.** Many dépêches begin life as a single user's *journal* and then get collectively edited into "official" community news. Reconstruct, for a given dépêche, its **origin and framing drift**: was there a journal first? What got softened, sharpened, or dropped between the raw post and the curated record?
**Why valuable / surprising.** It's a study of *how a volunteer community manufactures consensus and curates its own memory* — meta, novel, and quietly profound. It exposes the editorial values a community enforces without ever writing them down.
**How the MVP supports it.** `collect` a dépêche and the earlier journal(s) on the same topic by the same/related author → `query_raw` both → `update_wiki` a "before/after framing" note. (Deeper version wants edit history — see `linuxfr_diff_versions`.)
**Collect first.** A dépêche detail page + its precursor journal (find via the topic tag page).
**Example prompt.** *"Find a recent dépêche that started as a journal, and show me what changed in framing and tone between the personal post and the published news."*

### 1.10 — Le Fil Rouge Idéologique *(Trust-Trajectory Tracker)*
**Core idea.** Track the community's **emotional/trust arc toward major FLOSS actors** — Mozilla, Canonical/Ubuntu, Red Hat→IBM, Docker, Google/Android, GitHub→Microsoft. Produce a dated "trust trajectory" per entity: adored → suspicious → betrayed → grudging respect, with the specific episodes that turned the dial.
**Why valuable / surprising.** It maps the *relationship history* between a community and the ecosystem's power players. Contradictions over time (praising then condemning the same actor) are the feature, not a bug — they show exactly when and why trust broke.
**How the MVP supports it.** `collect` `/tags/<entity>/public` → `query_raw` for sentiment-laden snippets ordered by date → `update_wiki` a trust-trajectory note per entity. Best done at the *community* level (aggregate sentiment), not by profiling named individuals.
**Collect first.** Entity tag pages (`/tags/mozilla/public`, `/tags/canonical/public`, …).
**Example prompt.** *"Chart LinuxFr's trust in Mozilla over time. What were the specific moments the community turned, and has it ever turned back?"*

---

## 2. Rankings

Scored 1–5 (5 = highest) on each axis. "Feasibility" = doable with the *current* three tools and no extension.

| # | Use case | Originality | Usefulness | Feasibility (now) | Non-obvious insight |
|---|----------|:-:|:-:|:-:|:-:|
| 1.3 | Karma Contrarian | **5** | 4 | 2 | **5** |
| 1.2 | Prophecy Ledger | **5** | 4 | **5** | **5** |
| 1.10 | Fil Rouge Idéologique | 4 | 4 | 4 | **5** |
| 1.9 | Anatomie d'un Consensus | **5** | 3 | 3 | 4 |
| 1.1 | Marronnier Detector | 4 | 4 | **5** | 4 |
| 1.6 | Pouls des Liens (radar) | 4 | **5** | **5** | 4 |
| 1.7 | Cartographie des Douleurs | 3 | **5** | 4 | 4 |
| 1.4 | Baromètre Souveraineté | 4 | 4 | **5** | 4 |
| 1.5 | Courbe d'Adoption | 3 | 4 | 4 | 3 |
| 1.8 | Miroir Communautaire | 4 | 3 | 4 | 4 |

**Read of the table.** The Karma Contrarian (1.3) is the most original and insight-rich idea in the set but is gated on one small extension (comment collection). The Prophecy Ledger (1.2) is the rare idea that scores top marks on *both* insight and feasibility-now — that's your flagship demo. The Pouls des Liens (1.6) is the most immediately *useful* thing buildable today.

---

## 3. Top 3 to Prototype First

Chosen for: high value × buildable now × each demonstrates a *different mode* of the agent, so together they prove the platform's range.

1. **Le Marronnier Detector (1.1)** — proves the *longitudinal memory* mode.
2. **Le Grand Livre des Prophéties (1.2)** — proves the *accountability / time-tested-claims* mode and is the most demo-friendly ("wait, it really said that in 2011?").
3. **Le Pouls des Liens (1.6)** — proves the *real-time radar* mode and showcases the compounding wiki.

(Build **Karma Contrarian (1.3)** the moment `linuxfr_collect_comments` lands — it will be the most impressive single result the system produces.)

---

## 4. Detailed Workflows for the Top 3

### 4.1 — Le Marronnier Detector

**Step-by-step agent workflow**
1. Resolve the topic to a tag (e.g. `systemd`) and confirm it via `/tags/systemd/public`.
2. `collect` the tag page (all types) + `news.atom` + `journaux.atom`.
3. `collect` a bounded set (≈8–12) of the highest-signal detail pages, spread across eras.
4. `query_raw` by the term to assemble every dated mention with its snippet and type.
5. Bucket mentions into "flare-ups" (clusters in time); for each, extract the one-line core argument.
6. Compare argument text across flare-ups → label each recurrence *new argument* vs *recycled*.
7. `update_wiki` the marronnier note.
8. Answer from the note.

**Minimal sources to collect**
- `https://linuxfr.org/tags/<topic>/public`
- `https://linuxfr.org/news.atom`, `https://linuxfr.org/journaux.atom`
- 8–12 dépêche/journal detail pages spanning the topic's lifespan

**Expected wiki note**
`wiki/marronnier-<topic>.md` — a chronological table (date · type · title · trigger · core argument · new-or-recycled · source URL · local raw path), plus a 3-line synthesis of how the debate has (or hasn't) moved.

**User-facing answer format**
A timeline (oldest→newest) of flare-ups, each one line, with a verdict banner: *"Settled / Looping / Slowly shifting"* and the single sentence that best captures the unmoved core of the disagreement.

### 4.2 — Le Grand Livre des Prophéties

**Step-by-step agent workflow**
1. Pick a prediction-rich tag (Wayland, Rust, Docker, "bureau Linux", IPv6, Mozilla).
2. `collect` the tag page + older dépêches/journaux from the same tag.
3. `query_raw` for predictive phrasing ("va mourir", "ne percera jamais", "c'est l'avenir", "dans X ans", "remplacera").
4. Extract candidate predictions with date + author-context + source.
5. For each, assign a present-day verdict (right / wrong / too-early / unfalsifiable) from current knowledge; collect a confirming present-day source if needed.
6. `update_wiki` / append to the standing ledger.
7. Answer from the ledger.

**Minimal sources to collect**
- `https://linuxfr.org/tags/<topic>/public`
- Older detail pages from that tag (the feed only reaches recent items, so the tag page is the archive entry point)

**Expected wiki note**
`wiki/prophecies-ledger.md` — an append-only table (date · prediction (≤1 sentence, paraphrased + short cited fragment) · source URL · present verdict · note). It *grows every session* — the literal embodiment of the compounding-wiki goal.

**User-facing answer format**
A graded list: each prophecy as `[date] "<short paraphrase>" → ✅/❌/⏳`, followed by a one-paragraph meta-finding ("the community calls governance risk early but is chronically over-optimistic on desktop timelines").

### 4.3 — Le Pouls des Liens

**Step-by-step agent workflow**
1. `collect` the *liens* feed (exact URL from `/plan`).
2. `collect` `news.atom` as the "already official" contrast set.
3. `query_raw` to list terms/projects in *liens* and in dépêches separately.
4. Diff: surface items present in *liens* but absent from dépêches → candidate weak signals.
5. Rank candidates by recurrence across recent liens.
6. `update_wiki` the rolling watchlist (carry forward last run's list; mark items as *new / persisting / graduated-to-dépêche / faded*).
7. Answer with the current watchlist + what changed since last run.

**Minimal sources to collect**
- The *liens* Atom feed
- `https://linuxfr.org/news.atom`

**Expected wiki note**
`wiki/weak-signal-watchlist.md` — a living table (term · first-seen-in-liens · times-seen · status · representative link). Updated, not replaced, each run.

**User-facing answer format**
A short "radar" briefing: *Rising* (3–5 items with one-line why-it-matters), *Graduated* (moved to a dépêche since last check), *Faded*. Each item cites its lien.

---

## 5. Ten Powerful Prompts (surprising insights, MVP-only)

1. *"Reconstruct the systemd debate on LinuxFr as a timeline of flare-ups, and tell me at which point the tone flipped from outrage to acceptance."*
2. *"Find five predictions LinuxFr made about Wayland between 2010–2016, with dates and sources, and grade each right / wrong / too-early."*
3. *"What's being shared in LinuxFr liens this month that hasn't earned a dépêche yet? Give me a 3-item watchlist."*
4. *"Chart the community's trust in Mozilla over time — name the exact episodes that turned the mood, and whether it ever recovered."*
5. *"Across LinuxFr polls over the years, how has the community's self-image shifted — distros, editors, what counts as 'libre enough'?"*
6. *"Which technical debates on LinuxFr recur with the *same* arguments every few years (truly unresolved), versus those that genuinely got settled?"*
7. *"Map Docker's journey from first mention to mainstream: when did it move from journaux to dépêches, and when did skepticism peak?"*
8. *"What do French-speaking Linux users repeatedly struggle with around laptops and Wi-Fi, based on the forums? Cluster the chronic pain points."*
9. *"Trace how LinuxFr's mood on French digital sovereignty changed from 2013 to now — the specific moments of hope and disillusion."*
10. *"Find a recent dépêche that began as a journal and show what changed in framing and tone between the raw post and the published news."*

---

## 6. Tool Wishlist (compatible with public, read-only LinuxFr)

All proposals stay within public read-only data: **no auth, no posting, no voting, no private data, no full-site crawl.** "Bounded enumeration" everywhere instead of crawling.

| # | Tool | What it does | Unlocks / improves | Why MVP isn't enough | Complexity | When |
|---|------|--------------|--------------------|--------------------|:-:|:-:|
| 1 | **linuxfr_feed_registry** | Returns the canonical list of all section/tag/user feed URL patterns (seeded once from `/plan`), so the agent never guesses slugs. | All longitudinal cases (1.1, 1.4, 1.6, 1.8) | MVP collects explicit URLs but has no map of *where the feeds live*; the agent currently has to be handed each URL. | Small | **Soon** |
| 2 | **linuxfr_expand_feed** | Given one feed, enumerate its entry **detail** URLs up to a hard cap N, so the agent can go feed→details without manual paste. Capped, not recursive — explicitly not a crawler. | Every case that needs detail pages at scale (1.1, 1.2, 1.5, 1.10) | The MVP states it has *no automatic feed-to-detail collection*; today a human must paste every detail URL. | Medium | **Soon** |
| 3 | **linuxfr_collect_comments** | Fetch a content's comments **with their public `+up/−down` scores** (via the per-content comment view/feed). | **Karma Contrarian (1.3)**; deepens 1.9, 1.10 | MVP has *no comment support*, and the comment scores are the single most valuable untapped signal on the site. | Medium | **Soon** |
| 4 | **linuxfr_timeline** | From the local raw set, emit a clean dated index (date · type · title · score · url) for a topic. Pure local computation. | 1.1, 1.2, 1.5, 1.10 | `query_raw` filters and returns snippets but doesn't assemble an ordered, typed timeline — the core artifact of half these cases. | Small | **Soon** |
| 5 | **linuxfr_term_firstseen** | Detect the earliest appearance of a term/project across collected raw, and its trajectory of mentions. | **Pouls des Liens (1.6)**, Courbe d'Adoption (1.5) | Emergence detection needs "first/earliest" semantics; `query_raw` returns matches but not their temporal frontier. | Small | **Soon** |
| 6 | **linuxfr_quote_extract** | Pull short (≤~1 sentence), dated, attributed snippets with source URL, formatted for citation. | Evidence quality in 1.2, 1.3, 1.10 | `query_raw` returns snippets, but not citation-ready, length-bounded, attributed quotes — important since content is CC By-SA and needs attribution. | Small | **Soon** |
| 7 | **linuxfr_score_filter** | Sort/filter local content & comments by `note`, `intérêt`, or a computed *controversy* score (high up **and** high down). | **Karma Contrarian (1.3)**, finding the liveliest threads anywhere | Requires score data (depends on #3) and sort logic the MVP's filters don't provide. | Small | **Soon** (after #3) |
| 8 | **linuxfr_wiki_graph** | Cross-link and index accumulated wiki notes (backlinks + a topic index), so memory *compounds* instead of fragmenting. | The compounding-wiki thesis behind **all** cases | `update_wiki` writes isolated notes; nothing connects or indexes them as the corpus of findings grows. | Small | **Soon** |
| 9 | **linuxfr_poll_parse** | Parse a *sondage* into structured options + result distribution. | **Miroir Communautaire (1.8)** | Poll *results* live in page structure the raw snippet doesn't cleanly capture; titles alone undercount the signal. | Medium | **Later** |
| 10 | **linuxfr_diff_versions** | Compare a journal vs its later dépêche (or a content's edit history) to surface framing drift. | **Anatomie d'un Consensus (1.9)** | MVP has no notion of versions/precursors; framing-drift analysis needs paired or historical text. | Medium | **Later** |

**Sequencing logic.** Ship **#1, #2, #4** first — they're small/medium and immediately multiply the value of the three use cases you're already prototyping (more sources, less manual URL-pasting, real timelines). Ship **#3 + #7** next as a pair to unlock the highest-originality case (Karma Contrarian). **#8** is cheap and quietly important — it's what turns a pile of notes into an asset. Leave **#9** and **#10** for later; they unlock one case each and cost more.

**Deliberately *not* proposed:** a general crawler, embeddings/vector DB, OAuth/API auth, or anything that posts/votes. Each of the cases above is reachable with bounded, explicit, public collection — and keeping it that way is also what keeps the agent a good citizen of a volunteer-run site.