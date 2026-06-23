# Rhythm

## Purpose

This file defines the working rhythm for `pi-linuxfr.org`.

The project should move in small MVP steps. The goal is not to design a large system upfront, but to quickly get a useful loop working.

## Core loop

```text
ask a question
  -> collect a few relevant LinuxFr pages
  -> store raw files locally
  -> inspect what was collected
  -> update a lightweight Markdown wiki
  -> use the wiki to answer or decide what to collect next
```

## Work rhythm

For each session:

1. Pick one small outcome.
2. Avoid expanding scope.
3. Use Playwright only to understand what is needed next.
4. Implement or improve one small part of the MVP.
5. Test it manually.
6. Update documentation only if it helps the next step.

## Discovery rhythm

When exploring LinuxFr:

1. Open the site with Playwright.
2. Inspect only the page type needed for the current MVP step.
3. Record useful URL patterns or selectors.
4. Stop when enough is known to implement the next small tool behavior.

Do not attempt to map the whole website upfront.

## Tool rhythm

Before adding or expanding a tool, ask:

- Is this required for `linuxfr_collect_pages`, `linuxfr_query_raw`, or `linuxfr_update_wiki`?
- Can this be done manually for now?
- Can this wait until the MVP loop works?

If it can wait, do not implement it yet.

## Wiki rhythm

Keep the wiki simple:

- small Markdown notes;
- source citations;
- clear links when useful;
- no complex taxonomy at first.

The wiki should help the agent avoid re-reading everything from scratch, but it does not need to be perfect.

## End-of-conversation ritual

When the user asks whether the session is ready to close or whether the conversation can be reset, run a short closing ritual instead of only answering yes or no.

First, check the repository state with `git status --short`. If there are pending changes, explain clearly what they are, whether they look like code, documentation, generated data, or temporary artifacts, and what should be committed, reverted, ignored, or left for later. If commits are needed and the user wants them, keep commits small and focused. If the working tree is clean, mention the latest useful commit or the clean handoff point.

Then prepare a restart prompt that the user can paste into a fresh conversation. The restart prompt should be readable as normal prose, not only as a dense technical checklist. It should summarize what was just completed, name the current handoff commit or state, explain the next likely step, and ask the next agent to inspect the relevant files before coding.

The restart prompt must also ask the next agent to begin by explaining why the proposed next step matters now, then describe a clear minimal implementation plan, mention reasonable alternative next steps when they exist, justify why the proposed step is preferred, and wait for the user's validation before implementing anything.

Show the restart prompt in the conversation so the user can review it. When possible on macOS, also copy it to the clipboard with `pbcopy`, for example:

```bash
printf '%s' "<restart prompt>" | pbcopy
```

## Definition of done for the MVP

The MVP is done when an agent can:

1. collect a few LinuxFr pages related to a question;
2. store them under `data/raw/`;
3. inspect the collected dataset;
4. generate or update Markdown notes under `data/wiki/`;
5. answer using the local sources and wiki citations.
