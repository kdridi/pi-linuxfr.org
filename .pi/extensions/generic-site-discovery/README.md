# Generic Site Discovery Extension

Project-local Pi extension that registers `generic_site_discover`.

The tool explores public pages from a root URL with Playwright under strict page and depth limits, then writes a Markdown discovery report. It does not submit forms or perform authenticated actions.

Example input:

```json
{
  "rootUrl": "https://linuxfr.org",
  "maxPages": 10,
  "maxDepth": 1,
  "outputPath": "data/discovery/linuxfr-discovery.md"
}
```

If Chromium is missing, run from this directory:

```bash
npx playwright install chromium
```
