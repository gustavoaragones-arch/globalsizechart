# Phase 19 — AI Citation Engine

Internal tooling to harvest query-like phrases, score pages for citation-readiness, optionally expand FAQs, tighten quick answers, add internal links toward high-score URLs, and (conservatively) create gap pages under `programmatic-pages/ai-generated/`.

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/extract-query-patterns.js` | Reads all HTML; extracts titles, H2/H3, FAQ questions → `data/query-patterns.json` |
| `scripts/ai-signal-scoring.js` | Scores each URL → `data/ai-signals.json` |
| `scripts/generate-faqs.js` | Appends “More questions” FAQ block to `programmatic-pages/**/*.html` (idempotent via `data-ai-faq-expanded`) |
| `scripts/optimize-answers.js` | Shortens `.ai-answer` first paragraph on known conversion slug patterns |
| `scripts/internal-link-optimizer.js` | Injects “Related (high-value)” links from medium/low pages toward top-scoring URLs |
| `scripts/generate-ai-pages.js` | Creates **conservative** stubs only for strict conversion-like patterns (see env vars) |
| `scripts/ai-citation-engine.js` | Runs the pipeline **and** `generate-sitemaps.js` |

## Commands

```bash
npm run build:ai          # full pipeline + sitemaps
npm run ai:patterns       # patterns only
npm run ai:score          # scoring only
```

## Environment

| Variable | Effect |
|----------|--------|
| `SKIP_FAQ_EXPAND=1` | Skip `generate-faqs.js` (large batch) |
| `MAX_FAQ_PAGES=500` | Cap FAQ expansion count (default 500) |
| `MAX_AI_GAP_PAGES=8` | Max new AI gap stubs per run (default 8) |

`generate-faqs.js` supports `--dry-run` (no file writes).

## Data files

- `data/query-patterns.json` — deduplicated normalized strings  
- `data/ai-signals.json` — per-URL `score`, `status`, `reasons`  
- `data/ai-citation-log.json` — optional manual citation log  

## Sitemaps

- `programmatic-pages/ai-generated/*.html` use category **programmaticAi** → **`sitemaps/sitemap-programmatic-ai.xml`**
- Root `sitemap.xml` lists this file alongside core, programmatic, measurement, brands, guides.

## Safety

- **AI gap pages** use strict filters (numeric / CM / EU-US style patterns). Review stubs before scaling `MAX_AI_GAP_PAGES`.
- Run `SKIP_FAQ_EXPAND=1` in CI if you do not want mass FAQ append on every deploy.
