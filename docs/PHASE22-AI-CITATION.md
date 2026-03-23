# Phase 22 — AI Citation Engine (authority layer)

## Goal

Make answers **extractable in raw HTML** (no JS required): short statements, FAQs, transparency, and structured data so AI systems and search can quote the site reliably.

## Artifacts

| Path | Purpose |
|------|---------|
| `data/author.json` | Author / org entity (name, expertise) |
| `scripts/lib/ai-answer-generate.js` | `generateAnswer({ from, to, value, result, cm })`, conversion-guide parsing |
| `scripts/ai-answer-injector.js` | Injects **Quick answer**, **Common questions**, **Data sources**, optional **JSON-LD @graph**, author `<meta>` |
| `scripts/generate-ai-index.js` | Builds `/ai/index.html` (list of programmatic URLs) |
| `scripts/svg-accessibility.js` | Adds `role="img"` + `aria-label` on inline `<svg>` where missing |
| `scripts/fix-ai-answer-typos.js` | Maintenance fix for rare text glitches after bulk inject |

## Scope (who gets injected)

- Crawl tiers **high** and **medium** (see `crawl-priority-map.js`)
- **All** `/programmatic-pages/*.html` conversion pages  
- Excludes **`/legal/`**

**JSON-LD:** If the page already contains both **Article** and **FAQPage** in existing `application/ld+json` blocks, the injector **does not** add another `data-ai-citation-ld` script (avoids duplicate types). Visible blocks still inject.

## NPM

```bash
npm run build:ai-citation   # injector + SVG a11y + regenerate /ai/index.html
npm run ai:answer           # injector only (idempotent)
npm run ai:index            # regenerate /ai/index.html
npm run ai:svg              # SVG accessibility only
```

## Images / diagrams

- Prefer **`<img src="…" alt="…">`** for diagrams referenced in answers (AI text pipelines read `alt`).
- Inline SVGs: run `ai:svg` so diagrams get **`aria-label`** (and `role="img"` when needed).

## After template changes

Re-run `npm run build:ai-citation`, then `npm run build:sitemaps` so `/ai/` is in the sitemap index.
