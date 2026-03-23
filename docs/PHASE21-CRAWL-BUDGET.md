# Phase 21 — Crawl budget maximizer

## Goals

- **Signal priority** to search engines via sitemap tiers, `changefreq`, and `lastmod`.
- **Concentrate internal PageRank** on high-intent URLs with repeated in-content links.
- **Accelerate indexing** of fresh URLs via `sitemaps/indexing-feed.xml`.
- **Optionally** reduce low-value indexed URLs with `noindex, follow` on a narrow long-tail pattern.

## Files

| Artifact | Role |
|----------|------|
| `scripts/crawl-priority-map.js` | `getPriorityTier`, `getChangeFreq`, `getLastmodForTier`, `shouldNoindexLongtail` |
| `scripts/generate-sitemaps.js` | Emits `sitemap-high.xml`, `sitemap-medium.xml`, `sitemap-low.xml`, `indexing-feed.xml`, `sitemap.xml`, `sitemap/index.html` |
| `scripts/internal-link-injector.js` | Injects “Popular conversions” at **`<main>`** and **`<footer>`** (idempotent) |
| `scripts/inject-noindex-longtail.js` | Optional `noindex, follow` when URL path contains `kids` **and** `cm-` |

## Tier rules

1. **`/programmatic-pages/`** → **low** (checked first so filenames don’t collide with high tools).
2. **`/shoe-size-conversions/`** → **high**.
3. Paths ending with **`/shoe-size-converter.html`**, **`/us-to-eu-size.html`**, **`/cm-to-us-shoe-size.html`** → **high** (includes regional copies like `/ca/shoe-size-converter.html`).
4. **`/measurement/`**, **`/brands/`** → **medium**.
5. Everything else → **medium**.

**`changefreq`:** high = `daily`, medium = `weekly`, low = `monthly`.

**`lastmod`:** high-tier URLs use **today’s date**; others use file `mtime`.

## Noindex + sitemaps

- Long-tail pages matching `shouldNoindexLongtail` get **`noindex, follow`** when you run `inject-noindex-longtail`.
- Those URLs are **omitted** from `sitemap-*.xml` and `indexing-feed.xml` to match Google’s expectations.

## NPM scripts

```bash
npm run build:sitemaps   # XML + sitemap/index.html, then re-applies crawl-priority link blocks
npm run crawl:inject     # internal-link-injector only (e.g. after manual HTML edits)
npm run crawl:noindex    # optional noindex long-tail pattern
```

`build:sitemaps` chains **`internal-link-injector.js`** so regenerated `sitemap/index.html` keeps the “Popular conversions” blocks (other pages are skipped if already injected).

## Expectations

Google uses sitemap hints as **signals**, not guarantees. Internal links and content quality remain the primary drivers; this phase improves **discoverability and prioritization** for large static sites.
