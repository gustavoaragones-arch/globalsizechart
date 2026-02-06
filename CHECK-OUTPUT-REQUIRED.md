# Check output required — verification checklist

All items below are **verified present** in the current codebase.

---

## 1. Updated generator script

**File:** `scripts/generate-programmatic-pages.js`

- Builds programmatic pages from `data/programmatic_routes.json` and `programmatic/templates/conversion-template.html`
- Implements: `buildCrawlDiscoveryLinks`, `buildDiscoveryGridLinks`, `buildBreadcrumb`, `buildInternalLinks`
- Sitemap priorities: `programmaticPriority(route)` (region 0.8, category 0.7, size_pair 0.6)
- Outputs to `programmatic-pages/*.html` and `programmatic-index.html`; rebuilds tiered sitemaps

---

## 2. Split sitemap system

**Root:** `sitemap.xml` (sitemap index only)

**Under `sitemaps/`:**
- `sitemap-core.xml` — core pages + programmatic-index (priority 1.0)
- `sitemap-programmatic.xml` — index that references:
  - `sitemap-programmatic-sizepairs.xml` (size pair pages, priority 0.6; chunked if >500 URLs)
  - `sitemap-programmatic-regions.xml` (region pages, priority 0.8)
  - `sitemap-programmatic-categories.xml` (category pages, priority 0.7)

Generator: `writeUrlsetSitemap`, `writeSitemapIndex`, `buildTieredSitemaps`

---

## 3. Programmatic index page

**File:** `programmatic-index.html` (generated at project root)

- Built by `buildProgrammaticIndexPage()` in the generator
- Grouped sections: Size pair conversions, Region converters, Category converters
- Text links only (crawl-friendly)
- Has `<meta name="robots" content="index, follow">` and `<link rel="canonical" href=".../programmatic-index.html">`
- Linked from core sitemap

---

## 4. Discovery blocks added

**On every programmatic page (from conversion template):**

1. **Crawl-discovery** — `<section class="crawl-discovery">` with `<h2>Related Size Conversions</h2>` and `<ul class="crawl-discovery-links">` (min 12 internal links: main converters, ±1 sizes, same region/gender, etc.)
2. **Discovery grid** — `<div class="discovery-grid">` at bottom of main with 20 visible text links (no lazy load, no hiding)

Both use static HTML; no JS required for links to be crawlable.

---

## 5. Breadcrumb schema added

**Template placeholders:** `{{BREADCRUMB_HTML}}`, `{{BREADCRUMB_JSON_LD}}`

- **Visible breadcrumb:** `<nav class="breadcrumb">` at top of main container (e.g. Home > Shoe Size Converter > EU to US > EU 42 to US)
- **JSON-LD:** Second `<script type="application/ld+json">` in `<head>` with `@type: BreadcrumbList` and `itemListElement` (position, name, item URL)

Implemented in `buildBreadcrumb(route, fileName)` for all three route types (region, category, size_pair).

---

## 6. Robots/canonical enforcement

**On all programmatic pages (template + generator):**
- `<meta name="robots" content="index, follow">` in `<head>`
- `<link rel="canonical" href="{{CANONICAL_URL}}">` with `CANONICAL_URL` = full self URL (e.g. `https://globalsizechart.com/programmatic-pages/eu-42-to-us-shoe-size.html`)

**Programmatic index:** Same meta robots and canonical in inline HTML in `buildProgrammaticIndexPage()`.

---

## 7. Updated footer link

**Programmatic pages:** Footer “Converters” block includes `<li><a href="../programmatic-index.html">Programmatic Index</a></li>`.

**Core/main site:**
- `index.html` — footer has “Programmatic Index” link
- `shoe-size-converter.html` — footer has “Programmatic Index” link
- `us-to-eu-size.html` — footer has “Programmatic Index” link

(Other core converter pages can be given the same link if desired.)

---

## Quick verification commands

```bash
# Regenerate everything (optional)
node scripts/generate-programmatic-pages.js

# Spot-check a programmatic page
grep -E "robots|canonical|BreadcrumbList|crawl-discovery|discovery-grid|programmatic-index" programmatic-pages/eu-42-to-us-shoe-size.html | head -20
```

All output requirements above are satisfied in the current project state.
