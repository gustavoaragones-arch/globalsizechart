# Site Inventory

**Total HTML files:** 1,172 (excluding `node_modules`)  
**Inventory method:** `find . -name '*.html'` + directory grouping  
**Machine-readable family data:** [page-family-inventory.json](./page-family-inventory.json)

## Count by top-level directory

| Count | Directory / family |
|------:|-------------------|
| 765 | `programmatic-pages/` — shoe conversion longtail |
| 126 | `clothing/` — clothing conversion pages |
| 120 | `measurement/` — cm/waist/chest conversion pages |
| 20 | `brands/` — brand sizing guides |
| 20 | `components/` — HTML component references (not all user-facing routes) |
| 9 | `legal/` — privacy, terms, disclaimer, etc. |
| 7 | `shoe-size-conversions/` — directional hub pages |
| 6 | `semantic/` — educational semantic pages |
| 5 | `printable/` — printable charts |
| 4 | `tools/` — fit/measurement assistants, mattress chart |
| 3 each | `us/`, `uk/`, `eu/`, `ca/` — regional hubs (+ converter subpages) |
| ~55 | Root-level guides, indexes, converters, calculators |

## Core user-facing URLs (canonical tools)

| URL | File | Role |
|-----|------|------|
| `/` | `index.html` | Main combo converter (shoes + clothing) |
| `/shoe-size-converter.html` | root | Dedicated shoe converter |
| `/clothing-size-converter.html` | root | Dedicated clothing converter |
| `/shoe-size-conversion-chart/` | `shoe-size-conversion-chart/index.html` | Shoe chart hub |

## Programmatic page naming patterns

Examples from `programmatic-pages/`:

- Region pair: `china-to-us-shoe-size.html`, `eu-to-us-shoe-size.html`
- Size pair: `us-9.5-to-uk-shoe-size.html`, `cn-42-to-us-shoe-size.html`
- CM pair: `cm-27-to-us-shoe-size.html`
- Gender suffix: `*-women.html`, `*-kids.html`

Approximate breakdown within `programmatic-pages/` (by filename heuristic):

| Pattern | Approx. count |
|---------|---------------|
| `*-kids.html` | ~200+ |
| `*-women.html` | ~150+ |
| `cn-*` / `china-*` | ~80+ |
| `cm-*` kids (noindex subset) | 35 |

## Layout coverage

| Pattern | Pages |
|---------|------:|
| `class="hero-tool"` | 778 |
| Without hero-tool | 394 |

Families **without** hero-tool include: all `clothing/`, all `measurement/`, all `brands/`, `legal/`, most editorial root pages.

## Footer consistency

- **Checked:** 1,152 HTML files with `<body>`  
- **Result:** All footers match `scripts/lib/master-footer.html`  
- **Command:** `npm run footer:check`

## Sitemap inventory

Root `sitemap.xml` indexes:

- `sitemaps/sitemap-high.xml`
- `sitemaps/sitemap-medium.xml`
- `sitemaps/sitemap-low.xml`
- `sitemaps/indexing-feed.xml`

Lastmod in index: **2026-03-22**

## robots.txt

- Allows `/` for major search and AI crawlers  
- Sitemap: `https://globalsizechart.com/sitemap.xml`

## Files intentionally not listed

Thousands of individual programmatic URLs are omitted here; use filename patterns above or grep/sitemap for exhaustive lists. Full URL export can be generated in Phase 2 from `sitemaps/*.xml` (read-only parse).

## Indexation signals in repo

| Signal | Count |
|--------|------:|
| `noindex` in HTML | 35 files (kids CM longtail in `programmatic-pages/`) |
| `index, follow` default | Majority of converter pages |

## Missing from repo

| Asset | Status |
|-------|--------|
| `ads.txt` | **Not present** |
| `tools/shoe-size-converter.html` | **Not present** (linked from 779 pages) |
| `tools/clothing-size-converter.html` | **Not present** (linked from 779 pages) |

Actual converters live at `/shoe-size-converter.html` and `/clothing-size-converter.html`.
