# UX Findings — Phase 1 (User Clarity & Information Architecture)

**Audit date:** 2026-08-16  
**Phase:** 1 — UX / IA / user clarity (read-only)  
**Builds on:** Phase 0 reports in this directory  
**Method:** HTML inspection, pattern scans (1,172 pages), representative page review, mobile browser at 390×844 (localhost)

**Principle:** A normal visitor must understand what the page does and what to do next — before any SEO/AEO consideration.

---

## Executive summary

GlobalSizeChart’s **core converter experience is strongest** on the homepage hero-tool, shoe chart hub, and programmatic shoe pages (above the fold). The site **fails the “tool page” test** on clothing/measurement families and **fails the “focused task” test** on programmatic pages below the fold, where multiple overlapping navigation modules create an assembled-SEO feel.

| Category | Verdict |
|----------|---------|
| First-time visitor clarity (homepage) | **NEEDS WORK** |
| Converter prominence | **PASS** on hero-tool pages |
| Core journey completion | **NEEDS WORK** (clothing dead-ends, broken links) |
| Content duplication | **FAIL** (100 dup FAQ pages; 1,009 next-step stacks) |
| Navigation consistency | **NEEDS WORK** |
| Mobile UX | **NEEDS WORK** (header height) |
| Footer consistency | **PASS** |

Full issue register: [ux-issues.md](./ux-issues.md)  
Page-family matrix: [ux-page-family-matrix.md](./ux-page-family-matrix.md)

---

## 1. Core user journey audit

### Intended journey

```
Land → understand purpose → find converter → category → gender → clothing type? 
→ region → size → see results → optional help
```

### Journey breakpoints

| Step | Finding | Severity |
|------|---------|----------|
| Land / understand | H1 + lead clear on homepage and programmatic shoe pages | PASS |
| Find converter | Hero-tool associates title + tool | PASS |
| Category / gender | Gender required; size disabled with "Select gender first" | NEEDS WORK (UX-018) |
| Clothing type | Hidden until clothing selected on hub | PASS |
| Region / size | KR/INCH dead ends on programmatic shoe forms | FAIL (UX-002) |
| Results | Empty state message exists (`role="status"`) | PASS (markup) |
| After conversion | 10+ navigation modules on programmatic pages | FAIL (UX-004) |
| Clothing pages | No converter — outbound link only | FAIL (UX-003) |

---

## 2. Homepage audit (`/index.html`)

### First viewport (desktop)

| Element | Assessment |
|---------|------------|
| **Title tag** | Long but descriptive — acceptable |
| **H1** | "Global Size Chart" — clear |
| **Lead** | Explains US/UK/EU/JP/CN/CM — **PASS** |
| **See also** | Links to CM converter (OK), **broken** `/tools/shoe-size-converter.html` (UX-006), measurement standards (OK) |
| **Converter** | Prominent in hero-tool — **PASS** |
| **Field order** | Category → Gender → Clothing type → Region → Size — **PASS** |
| **Defaults** | Shoes + US; gender empty; size disabled — logical but needs hint |
| **Results** | Visible "Converted Sizes" with empty state before selection |
| **Competing elements** | Quick Converters immediately below hero — duplicates tool |

### Below the fold

Four major educational sections (~1,200+ words) plus fit-type emoji cards, regional essay, FAQ, trust boilerplate, disclaimer card, footer. **Competes with converter mission** for users who only need a quick conversion (UX-015).

### Homepage answers the four clarity questions

1. **What is GlobalSizeChart?** — Yes (lead + H1)  
2. **What can I do?** — Yes (convert shoes/clothing)  
3. **How?** — Mostly yes (form visible); gender prerequisite easy to miss  
4. **What happens after selecting size?** — Partially (results area visible; auto-update note helps)

---

## 3. Conversion page families

### `/shoe-size-conversion-chart/` — **Best reference**

- Strong lead: explains problem then points to converter  
- Converter visually inside hero-tool with title  
- Reference table adds genuine value  
- Gender defaults to Men (no empty gender gate — simpler than homepage)  
- Issues: broken Quick Converters links; FAQ repeats schema questions  

### Regional hubs (`/us/`, `/uk/`, `/eu/`, `/ca/`)

- Converter present with US pre-selected on `/us/`  
- **Missing `.lead` paragraph** in hero-tool (UX-012)  
- **Duplicate Quick Converters** (snippet + inline section)  
- Long explanatory prose below — useful for SEO, heavy for task-focused visitors  

### Programmatic shoe (`/programmatic-pages/*`)

**Above fold: PASS** — Contextual H1 ("China to US Shoe Size Converter"), lead, breadcrumbs, prefilled CN region, gender default Men.

**Below fold: FAIL** — Page becomes a stack of:
- Quick Converters (broken links)
- Conversion Guide (repeats lead)
- Understanding This Conversion (generic)
- Fit Guide + How to Measure (duplicates other pages)
- high-rpm-modules (4 tiles, keyword-stuffed snippets)
- Related Size Conversions (40+ bullet links)
- Regional & conversion pages (17 nav cards)
- Key navigation (5 cards)
- FAQ
- Recommended next steps (5 sub-grids)
- Explore more (4 sub-grids)
- why-vary-cards (duplicate of content above)

**Verdict:** Feels like **page assembled from SEO components**, not a tool (UX-004).

### Clothing (`/clothing/*`)

- **No hero-tool, no embedded converter**  
- User sees H1, one paragraph with answer, then "Use Clothing Size Converter" button  
- high-rpm-modules discuss **shoes** on a **tops** page (UX-017)  
- FAQ asks about **EU 42 shoe size** (UX-016)  
- Same next-step / explore-more stack as shoe pages  

**Verdict:** **FAIL** for landing-page intent — visitor cannot complete task on-page (UX-003).

### Editorial with converter (`/cm-to-us-shoe-size.html`)

- Hero-tool with converter — good  
- Has **both** Common questions and FAQ (UX-005)  
- why-sizes-vary stub (UX-008)  

---

## 4. Known pattern audit (current state)

| Pattern | Still present? | Count | User value | Recommendation |
|---------|:--------------:|------:|------------|----------------|
| `Quick answer:` | **Yes** | 109 | Low without question | Merge/remove (UX-007) |
| `Common questions` | **Yes** | 108 | Low when + FAQ | Merge (UX-005) |
| `Frequently Asked Questions` | **Yes** | 1,127 | Mixed | Keep if unique per page |
| `Why Sizes May Vary` (stub) | **Yes** | 116 | Low | Remove (UX-008) |
| `Why sizes don't line up` (cards) | **Yes** | 1,017 | Medium | Optional keep |
| `Men's, Women's & Kids' Shoe Size Charts` (exact) | **No** | 0 | — | Resolved |
| `Regional & Conversion Pages` (exact title case) | **No** | 0 | — | Renamed |
| `Regional & conversion pages` (lowercase) | **Yes** | 754 | Low | Remove (UX-009) |
| `See also` | **Yes** | 1 | Neutral | Fix broken link |
| `Related` / `Related Size Conversions` | **Yes** | 1,050 | Low–medium | Collapse |
| `Authority Links` (exact) | **No** | 0 | — | Renamed to "Key navigation" |
| `Key navigation` | **Yes** | 754 | Low | Merge/remove |
| `Next steps` / `Recommended next steps` | **Yes** | 1,009 | Low | Remove/collapse (UX-010) |
| `Men's, women's & kids'` (in next-step) | **Yes** | 880 | Low | Category-filter or remove (UX-011) |

---

## 5. Content tone audit

### Robotic / generated signals (examples — do not rewrite in this phase)

| Example | Location | Why it weakens UX |
|---------|----------|-------------------|
| "Understand how shoe sizing systems work across US, UK, EU, Japan, and CM. Educational guide with conversion references." | `programmatic-pages/china-to-us-shoe-size.html` — Understanding This Conversion | Says nothing specific to China→US |
| "Avoid common shoe sizing mistakes when converting between regions. Fit tips and conversion best practices." | high-rpm-modules snippets (all families) | Same filler repeated on clothing pages |
| "Use this page's tools and charts for international size conversion; measure foot or body length in centimeters when possible for the closest match." | `us-shoe-sizing-system.html` — Quick answer | Generic; could apply to any page |
| "More on [page title]" → "See linked guides..." | ai-faq-block third question | Template noise |
| "The **EU sizing system** and **US shoe sizing scale**" (bold keyword stuffing) | FAQ on shoe chart hub | Reads for crawlers, not humans |
| Shoe FAQ ("What is EU 42 in US?") on clothing tops page | `clothing/clothing-men-tops-M-US-to-EU.html` | Wrong category — erodes trust |

### Positive tone examples

| Example | Location |
|---------|----------|
| "Finding the right shoe size across countries can be confusing. A 'size 9' can mean different things..." | `shoe-size-conversion-chart/index.html` lead |
| "No exaggeration. No claims of certification. Just competence." | Footer accuracy block |
| "Results are based on standard international size systems. Fit may vary by brand." | Homepage results disclaimer |

**Desired standard gap:** Site mixes **clear, human hub copy** with **templated SEO paragraphs** on programmatic/clothing families.

---

## 6. Navigation audit

### Header

| Check | Result |
|-------|--------|
| Homepage vs inner consistency | **FAIL** — different link sets and wrapper classes |
| Duplicate nav (header + in-page Quick Converters) | **FAIL** on hubs |
| Mattress in primary nav | **NEEDS WORK** (UX-014) |
| Labels clear | Mostly yes |
| Mobile | Stacks to 2–3 rows — **NEEDS WORK** (UX-019) |

### Footer

| Check | Result |
|-------|--------|
| Canonical footer on all pages | **PASS** (`npm run footer:check`) |
| Same structure site-wide | **PASS** |
| Useful for users | **Mixed** — Converters + legal good; "Programmatic Index" + "All size conversion answers" skew SEO |
| Excessive links | **NEEDS WORK** — 4 columns + accuracy blocks (UX-020) |

---

## 7. Page length & scroll depth

| Page type | Before tool | After tool | Problem |
|-----------|-------------|------------|---------|
| Homepage | ~480 chars to form | ~1,500 words + FAQ | Education competes with tool |
| Programmatic shoe | ~593 chars | 15 H2 sections, 1,200+ words | Assembly zone |
| Clothing | Breadcrumb + H1 only | No tool; 1,300 words of modules | No task completion |
| Shoe chart hub | ~652 chars | Table + short guides | Reasonable |

**Disproportionate content:** Programmatic and clothing pages target a **single conversion query** but deliver **hub-level** navigation surface area.

---

## 8. Mobile UX (390×844, localhost)

| Check | Result |
|-------|--------|
| Header | Logo + multi-row nav — **consumes most of first screen** |
| Converter visibility | Requires scroll past header on homepage |
| Dropdowns | Native `<select>` — adequate tap targets |
| Horizontal overflow | Not observed on sampled pages |
| Footer | Long scroll to reach; accuracy blocks stack (CSS grid → 1 col at 768px) |
| Sticky mobile ad placeholder | Present in markup (`ad-sticky-mobile`) — may reduce viewport when live |

**Evidence:** Browser screenshots + `styles.css` `@media (max-width: 992px)` header stack.

---

## 9. Priority summary

### P0
None from Phase 1 alone.

### P1
- UX-001 Broken Quick Converter links (779 pages)
- UX-002 KR/INCH dead ends
- UX-003 Clothing pages lack converter
- UX-004 Programmatic page module overload
- UX-005 Duplicate FAQ (100 pages)
- UX-006 Homepage broken See also link

### P2
- UX-007 through UX-018 (patterns, hubs, nav, tone, category-wrong FAQ)

### P3
- UX-019 Mobile header
- UX-020 Footer density
- UX-021 Input model inconsistency
- UX-022 Emoji tone

---

## 10. Phase 2 recommendations (not executed)

1. **Browser QA matrix** — homepage shoes/clothing flows, CN conversion, KR selection, clothing prefilled converter  
2. **Click-test** all Quick Converter and See also links  
3. **Accessibility** — keyboard order through disabled fields, screen reader on live results update  
4. **User test** (optional) — 5-task hallway test: "Convert men's US 9 shoes to EU"

---

## Related documents

- [ux-issues.md](./ux-issues.md) — Full issue register with evidence  
- [ux-page-family-matrix.md](./ux-page-family-matrix.md) — Per-family matrix  
- [issues.md](./issues.md) — Phase 0 master register (AUD-*)  
- [remediation-roadmap.md](./remediation-roadmap.md) — Prioritized future work
