# UX Issues Register — Phase 1

Cross-reference Phase 0: `AUD-*` IDs in `issues.md`. Phase 1 UX IDs use `UX-*` prefix.

---

## P0 — Immediate

*None confirmed from static + limited browser audit. Runtime converter failure on production would elevate to P0 in Phase 2.*

---

## P1 — High

### UX-001 — Broken Quick Converter links (779 pages)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Page family** | programmatic-pages, regional-hubs, homepage, shoe-chart-hub |
| **URL/path** | e.g. `/index.html`, `/programmatic-pages/china-to-us-shoe-size.html` |
| **Component** | `section.card` → `a[href="/tools/shoe-size-converter.html"]` |
| **Observed** | Prominent "Shoe Size Converter" cards link to `/tools/shoe-size-converter.html` which does not exist. Real URL: `/shoe-size-converter.html`. |
| **Why it harms users** | Primary secondary navigation on conversion landing pages returns 404 — breaks trust mid-task. |
| **Evidence** | `rg -l '/tools/shoe-size-converter.html' \| wc -l` → 779; `tools/shoe-size-converter.html` missing |
| **Scope** | template (`scripts/lib/quick-converters-snippet.js`) |
| **Recommended action** | Fix snippet hrefs; batch-replace in generated HTML |
| **Phase 0 link** | AUD-001 |

---

### UX-002 — KR / INCH shoe regions are dead ends

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Page family** | programmatic-pages |
| **URL/path** | `/programmatic-pages/china-to-us-shoe-size.html` |
| **Component** | `#fromRegion` select; `app.js` `shoeRegionHasDataset` |
| **Observed** | Form offers Korea (KR) and Inch (INCH). Dataset has no `kr`/`inch` keys. User gets empty state. |
| **Why it harms users** | Valid-looking choice produces no conversion — appears broken. |
| **Evidence** | `data/shoe_sizes.json` keys: us, uk, eu, jp, cn, cm only; form includes KR/INCH |
| **Scope** | global (`app.js`) + data + template |
| **Recommended action** | Remove options or add data |
| **Phase 0 link** | AUD-002 |

---

### UX-003 — Clothing conversion pages lack embedded converter

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Page family** | clothing |
| **URL/path** | `/clothing/clothing-men-tops-M-US-to-EU.html` |
| **Component** | `h2` "Clothing converter tool" + `a.btn` only |
| **Observed** | Page title promises "Men's US M to EU Tops Size" but user must leave page to click "Use Clothing Size Converter". No prefilled converter, no instant result on-page. |
| **Why it harms users** | Visitor from Google expecting immediate answer gets an article + outbound link — violates core journey for a conversion landing page. |
| **Evidence** | `clothing/clothing-men-tops-M-US-to-EU.html` lines 64–67; browser snapshot: no combobox for size, only link ref e12 |
| **Scope** | family (clothing template / generator) |
| **Recommended action** | Embed hero-tool clothing converter prefilled to page params, or show static conversion result prominently |

---

### UX-004 — Programmatic pages feel assembled, not task-focused

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Page family** | programmatic-pages |
| **URL/path** | `/programmatic-pages/china-to-us-shoe-size.html` |
| **Component** | Stack: Fit Guide + Measurement + high-rpm-modules + Related ul (40+ links) + Regional cards + Key navigation + FAQ + Recommended next steps + Explore more + why-vary-cards |
| **Observed** | 17 `<section>` elements, 15 `<h2>` headings below a working converter. Multiple overlapping nav card grids with same destinations. |
| **Why it harms users** | Extreme scroll depth and cognitive load; user cannot tell what to do after converting. Page reads as SEO assembly, not a tool. |
| **Evidence** | Section count scan; snapshot 359 refs / 174 interactive on one page |
| **Scope** | template (`programmatic-structural-modules.js`, generator) |
| **Recommended action** | Collapse to: converter + 1 contextual paragraph + 1 optional FAQ + compact related (3–5 links max) |

---

### UX-005 — Duplicate FAQ sections (100 pages)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Page family** | editorial-root, brands, shoe-size-conversions |
| **URL/path** | `/cm-to-us-shoe-size.html`, `/shoe-size-conversions/us-to-eu/index.html` |
| **Component** | `section.ai-faq-block` + `section.faq-block` |
| **Observed** | "Common questions" (3 generic Qs) immediately followed by "Frequently Asked Questions" with overlapping content. |
| **Why it harms users** | Repetition signals low-quality templating; user unsure which block to read. |
| **Evidence** | Site scan: 100 pages with both headings |
| **Scope** | global (`ai-answer-injector.js`) + family |
| **Recommended action** | Merge to single FAQ or remove ai-faq-block |
| **Phase 0 link** | AUD-004 |

---

### UX-006 — Homepage "See also" links to broken shoe converter

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Page family** | homepage |
| **URL/path** | `/index.html` |
| **Component** | `p.muted` See also → `/tools/shoe-size-converter.html` |
| **Observed** | Inline link in hero-tool points to non-existent path. |
| **Why it harms users** | First-screen distraction that 404s. |
| **Evidence** | `index.html` line 166 |
| **Scope** | page |
| **Recommended action** | Fix href to `/shoe-size-converter.html` |

---

## P2 — Medium

### UX-007 — Quick answer without explicit question (109 pages)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Page family** | editorial-root (82), brands (20), shoe-size-conversions (7) |
| **URL/path** | `/us-shoe-sizing-system.html` |
| **Component** | `<p><strong>Quick answer:</strong></p>` + answer paragraph |
| **Observed** | Label "Quick answer:" with no visible question heading. |
| **Why it harms users** | Historically reported confusion — reader doesn't know what was answered. |
| **Evidence** | 109 pages; example `us-shoe-sizing-system.html:68-69` |
| **Scope** | global injector |
| **Recommended action** | Use question as H2 or remove block |

---

### UX-008 — Why Sizes May Vary one-sentence stub (116 pages)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Page family** | editorial-root, brands, shoe-size-conversions |
| **URL/path** | `/cm-to-us-shoe-size.html` |
| **Component** | `section.why-sizes-vary` |
| **Observed** | Heading + single generic sentence about brand variance. |
| **Why it harms users** | Adds scroll without teaching anything new; feels like SEO filler. |
| **Evidence** | 116 pages vs 1,017 with improved `why-vary-cards` |
| **Scope** | family / injector |
| **Recommended action** | Migrate to 3-card grid or remove |

---

### UX-009 — Regional & conversion pages card grid (754 pages)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Page family** | programmatic-pages |
| **URL/path** | `/programmatic-pages/china-to-us-shoe-size.html` |
| **Component** | `section.region-converters-block` → `h2` "Regional & conversion pages" |
| **Observed** | 17+ nav cards to other conversion URLs. Phase 0 reported 0 matches for title-case variant; **lowercase variant still present on 754 pages**. |
| **Why it harms users** | Low-value link grid after user already has a converter; competes with task completion. |
| **Evidence** | `rg -il 'regional &.*conversion pages' \| wc -l` → 754 |
| **Scope** | template |
| **Recommended action** | Remove or replace with 3–5 contextual links only |

---

### UX-010 — Recommended next steps / Explore more module stack (1,009 pages)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Page family** | programmatic-pages, clothing, measurement |
| **URL/path** | All major programmatic/clothing pages |
| **Component** | `section.next-step`, `section.session-depth-modules`, `section.conversion-loop` |
| **Observed** | Up to 5 sub-blocks (Next region, Men's/women's/kids', Measurement, Brand) each with 4–8 nav cards. Duplicates "Related" link lists. |
| **Why it harms users** | Overwhelming optional navigation; shoe links on clothing pages. |
| **Evidence** | 1,009 pages with "Recommended next steps"; clothing page snapshot shows shoe sizing links |
| **Scope** | template |
| **Recommended action** | Single compact "Related conversions" block; category-aware links only |

---

### UX-011 — Men's, women's & kids' block with off-category links (880 pages)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Page family** | programmatic-pages, clothing, measurement |
| **URL/path** | `/programmatic-pages/china-to-us-shoe-size.html` (next-step block) |
| **Component** | `h3.next-step__title` "Men's, women's & kids'" |
| **Observed** | On shoe pages, block includes clothing links; on clothing pages, includes shoe CM links. Historical exact heading removed but **semantic block remains**. |
| **Why it harms users** | Irrelevant cross-category links increase noise. |
| **Evidence** | 880 pages; `china-to-us-shoe-size.html` next-step block line 304 |
| **Scope** | template |
| **Recommended action** | Remove block or filter links by page category |

---

### UX-012 — Regional hub missing hero lead + duplicate Quick Converters

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Page family** | regional-hubs |
| **URL/path** | `/us/index.html` |
| **Component** | `section.hero-tool` (H1 only); two `h2` "Quick Converters" sections |
| **Observed** | US hub: `<h1>US Size Conversion Tools</h1>` with no `.lead`. Quick Converters appears immediately after converter AND again in body (lines 133–195). |
| **Why it harms users** | Weaker orientation than homepage; redundant navigation blocks. |
| **Evidence** | `us/index.html` lines 91–195 |
| **Scope** | family |
| **Recommended action** | Add lead sentence; dedupe Quick Converters |

---

### UX-013 — Header navigation inconsistency

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Page family** | global |
| **URL/path** | `/index.html` vs `/programmatic-pages/china-to-us-shoe-size.html` |
| **Component** | `nav.primary-nav`, `nav.secondary-nav` |
| **Observed** | Homepage: 7 primary + 8 secondary links including Shoe Size Pages, Men's, Women's. Inner pages: 6 primary + 3–4 secondary (no Shoe Size Chart on some). Two header HTML patterns (`header-container` vs `header-inner`). |
| **Why it harms users** | Unpredictable navigation; harder to build mental model. |
| **Evidence** | Compare `index.html:138-157` vs `china-to-us-shoe-size.html:51-65` |
| **Scope** | global (no shared nav partial) |
| **Recommended action** | Centralize header partial |

---

### UX-014 — Mattress Size Chart in primary nav

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Page family** | global |
| **URL/path** | All pages with standard header |
| **Component** | `nav.primary-nav` → Mattress Size Chart |
| **Observed** | Bedding tool listed alongside shoe/clothing converters in primary nav. |
| **Why it harms users** | Dilutes site purpose for first-time visitors from sizing queries. |
| **Evidence** | Present on homepage, programmatic, clothing headers |
| **Scope** | global |
| **Recommended action** | Move to footer/resources |

---

### UX-015 — Homepage competes with converter (scroll depth)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Page family** | homepage |
| **URL/path** | `/index.html` |
| **Component** | Post-converter: Quick Converters, 4 long guides, fit cards, regional essay, FAQ |
| **Observed** | ~1,653 main words; user must scroll extensively to reach educational content; Quick Converters duplicates hero function. |
| **Why it harms users** | Users who want only to convert face noise; users who want guides must scroll past duplicate tools. |
| **Evidence** | Word count scan; structure lines 218–491 |
| **Scope** | page |
| **Recommended action** | Move long guides to `/guides/` hub; keep homepage tool-first |

---

### UX-016 — Shoe FAQ on non-shoe pages

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Page family** | clothing, measurement |
| **URL/path** | `/clothing/clothing-men-tops-M-US-to-EU.html` |
| **Component** | `section.faq-block` — "What is EU 42 in US shoe size?" |
| **Observed** | Clothing tops page ends with shoe-size FAQ questions. |
| **Why it harms users** | Irrelevant questions undermine trust and clarity. |
| **Evidence** | Clothing page snapshot refs e245–e248; JSON-LD FAQ on clothing pages |
| **Scope** | template |
| **Recommended action** | Category-specific FAQ per page family |

---

### UX-017 — high-rpm-modules generic shoe copy on clothing pages

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Page family** | clothing, measurement, programmatic |
| **URL/path** | `/clothing/clothing-men-tops-M-US-to-EU.html` |
| **Component** | `section.high-rpm-modules` |
| **Observed** | "Fit Problems Explained" snippet discusses **foot length in centimeters** and shoe mistakes on a men's tops page. |
| **Why it harms users** | Obviously templated; signals content not written for the task. |
| **Evidence** | Line 67 snippet text in clothing file |
| **Scope** | template |
| **Recommended action** | Category-aware module content or remove |

---

### UX-018 — Gender required before size with minimal guidance (homepage)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Page family** | homepage, regional-hubs |
| **URL/path** | `/index.html` |
| **Component** | `#gender`, `#sizeSelect` disabled |
| **Observed** | Size dropdown shows "Select gender first" (good) but no inline helper near gender field. Category defaults to Shoes while gender empty. |
| **Why it harms users** | Some users attempt to pick size first; friction on first visit. |
| **Evidence** | Browser snapshot: size value "Select gender first", states disabled |
| **Scope** | global (`app.js` + hub markup) |
| **Recommended action** | Add brief helper text under Gender label |

---

## P3 — Enhancement

### UX-019 — Mobile header consumes excessive viewport

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Page family** | global |
| **URL/path** | `/index.html` @ 390×844 |
| **Component** | `header.site-header` — 2–3 rows of links |
| **Observed** | On mobile, logo + 7 primary + 8 secondary links stack before converter visible. Screenshot shows ~full viewport header. |
| **Why it harms users** | Delays access to core tool; increases scroll to convert. |
| **Evidence** | Mobile browser screenshot 2026-08-17; `styles.css` stacks nav at max-width 992px |
| **Scope** | global CSS + header markup |
| **Recommended action** | Hamburger menu or collapse secondary nav on mobile |

---

### UX-020 — Footer hub links may overwhelm (SEO-weighted)

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Page family** | global |
| **URL/path** | Master footer all pages |
| **Component** | `footer-section` Hubs — 10 links + Programmatic Index |
| **Observed** | Footer consistent (PASS) but dense; includes "All size conversion answers", "Programmatic Index" — crawler-oriented labels. |
| **Why it harms users** | Many users never need 10 hub links; adds scroll on mobile. |
| **Evidence** | `scripts/lib/master-footer.html`; `footer:check` PASS |
| **Scope** | global |
| **Recommended action** | Trim to top 5 user-facing hubs; move index links to HTML sitemap page only |

---

### UX-021 — Programmatic text input vs hub dropdown inconsistency

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Page family** | programmatic-pages vs hubs |
| **URL/path** | Compare `/index.html` vs `/programmatic-pages/china-to-us-shoe-size.html` |
| **Component** | `#sizeSelect` vs `input#size` |
| **Observed** | Hubs use size dropdown; programmatic pages use free-text input with placeholder "Enter size". |
| **Why it harms users** | Different interaction models; text input allows invalid entries with error messages. |
| **Evidence** | Form markup in both files |
| **Scope** | family |
| **Recommended action** | Document as intentional or align UX |

---

### UX-022 — Emoji in instructional copy (homepage)

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Page family** | homepage |
| **URL/path** | `/index.html` |
| **Component** | FAQ and guide paragraphs — "👉" |
| **Observed** | Pointer emoji in FAQ answers and measurement guide. |
| **Why it harms users** | Slightly informal/inconsistent tone for reference utility. |
| **Evidence** | `index.html` lines 293, 465 |
| **Scope** | page |
| **Recommended action** | Remove emoji for cleaner tone |

---

## Components: eliminate / merge / keep

| Component | Verdict | Pages affected |
|-----------|---------|---------------|
| **hero-tool + converter** | **KEEP** — core value | 778 |
| **why-vary-cards (3-card)** | **KEEP** (optional, below fold) | 1,017 |
| **Quick Converters grid** | **MERGE** into footer or fix links first | ~779 |
| **ai-faq-block "Common questions"** | **MERGE** with FAQ or **REMOVE** | 108 |
| **why-sizes-vary 1-sentence** | **REMOVE** or merge to why-vary-cards | 116 |
| **high-rpm-modules** | **REMOVE** or make category-specific | 1,009 |
| **region-converters-block** | **REMOVE** (redundant with Related) | 754 |
| **Key navigation** | **MERGE** into single related block | 754 |
| **Recommended next steps** | **REMOVE** or collapse to 3 links | 1,009 |
| **session-depth-modules** | **REMOVE** | 1,009 |
| **Related Size Conversions (40+ ul)** | **MERGE** to top 5 links | programmatic |
| **conversion-loop** | **MERGE** with next steps or remove | 1,009 |
| **Quick answer (no question)** | **MERGE** into FAQ or rewrite | 109 |
| **Mattress in primary nav** | **REMOVE** from primary | global |
