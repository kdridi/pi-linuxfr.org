# Wiki Schema

## Purpose

This is the minimal wiki schema for the MVP.

The wiki is a lightweight Markdown layer generated from local raw LinuxFr sources. It should help agents reuse knowledge without re-reading every raw page each time.

## Minimal layout

```text
data/wiki/
  index.md
  notes/
```

## Note format

Each note should be simple:

```markdown
# Note title

## Summary

Short summary of what the collected sources say.

## Sources

- https://linuxfr.org/...
- data/raw/pages/...

## Observations

- Observation with source reference.

## Open questions

- What should be collected or checked next?
```

## Rules

- Keep raw sources separate from wiki notes.
- Cite source URLs or local raw files.
- Prefer updating an existing note over creating duplicates.
- Do not create a complex taxonomy yet.
- Add structure only when the MVP needs it.
