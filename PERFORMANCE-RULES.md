# Performance & indexing rules (do not violate)

These rules apply to the whole site, especially programmatic and core pages. Compliance is required for crawlability and Search Console.

## DO NOT

1. **JS navigation rendering** — Do not render navigation or main content via JavaScript. All nav and internal links must be plain HTML (`<a href="...">`) in the initial response. No client-side routing, no `history.pushState` for page navigation, no SPA-style nav.

2. **Pagination scripts** — Do not add pagination (e.g. "Load more", page 2/3) that requires JavaScript to reveal or load links. All linked URLs must be present in the static HTML.

3. **Lazy load internal links** — Do not lazy-load internal links (e.g. `loading="lazy"` on anchors, or JS that injects links on scroll). Every internal link must be in the DOM on first paint so crawlers can follow them without executing JS.

4. **Infinite link loops** — Do not create cycles where a small set of pages only link to each other (e.g. A→B→C→A with no other outlinks). Internal linking must be diverse; the generator uses a `Set` to avoid duplicate links and mixes regions/genders/types.

5. **Query parameters on internal links** — Do not add query parameters to internal URLs (e.g. `page.html?ref=foo` or `?utm_*`). Use clean paths only (e.g. `programmatic-pages/eu-42-to-us-shoe-size.html`). Sitemaps and canonicals also use parameter-free URLs.

## Current compliance

- **Navigation:** Static HTML only; no JS-based nav.
- **Pagination:** None; all programmatic pages are single full HTML documents.
- **Internal links:** All in static HTML (crawl-discovery block, discovery grid, related links, breadcrumbs); no lazy loading.
- **Link graph:** Discovery/crawl link builders use `added` Set and mix size pairs, region converters, categories, and main converters to avoid tight loops.
- **URLs:** Generator outputs only path-based URLs; no `?` in `href` or in sitemap/canonical.
