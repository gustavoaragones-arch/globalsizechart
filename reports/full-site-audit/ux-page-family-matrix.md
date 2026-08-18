# UX Page-Family Matrix — Phase 1

**Audit date:** 2026-08-16  
**Method:** Representative HTML inspection + pattern scans + mobile browser (390×844) on localhost

Legend: **Tool** = feels like a utility page | **Assembly** = feels stitched from SEO modules | **Mixed** = tool present but buried in modules

| Family | Representative URL | ~Count | Hero-tool | Converter on page | Time to tool (static) | Primary clarity | Page feel | Major UX risks |
|--------|-------------------|-------:|:---------:|:-----------------:|----------------------|-----------------|-----------|----------------|
| **Homepage** | `/index.html` | 1 | Yes | Yes (`#mainConverter`) | Fast (after header) | Good H1 + lead | **Mixed** | Gender gate unclear; huge scroll; broken See also link |
| **Shoe chart hub** | `/shoe-size-conversion-chart/` | 1 | Yes | Yes (shoes only) | Fast | **Best in class** lead copy | **Tool** | Quick Converters 404; FAQ repeats schema Qs |
| **Regional hubs** | `/us/`, `/uk/`, `/eu/`, `/ca/` | 12 | Yes | Yes (`#mainConverter`) | Fast | Title clear; **no lead** on US hub | **Mixed** | Duplicate Quick Converters ×2; long SEO prose |
| **Dedicated shoe converter** | `/shoe-size-converter.html` | 1 | Yes | Yes | Fast | Clear | **Tool** | — |
| **Dedicated clothing converter** | `/clothing-size-converter.html` | 1 | Yes | Yes | Fast | Clear | **Tool** | — |
| **Programmatic shoe** | `/programmatic-pages/china-to-us-shoe-size.html` | 765 | Yes | Yes (text input) | Fast | Good H1 + lead | **Assembly** | 15+ sections below tool; nav card overload |
| **Clothing conversion** | `/clothing/clothing-men-tops-M-US-to-EU.html` | 126 | **No** | **No** (link out only) | **N/A — dead end** | Title OK | **Assembly** | No inline result; shoe boilerplate on clothing page |
| **Measurement conversion** | `/measurement/24-cm-to-us-shoe-size.html` | 120 | No | Varies | Slow / unclear | Keyword title | **Assembly** | Same module stack as clothing |
| **Editorial / guide** | `/cm-to-us-shoe-size.html` | ~50 | Partial | Often yes | Medium | Mixed | **Mixed** | Dup FAQ + Quick answer patterns |
| **Brand guides** | `/brands/nike-shoe-size-chart.html` | 20 | No | Rarely | Slow | Brand-specific OK | **Mixed** | Generic Quick answer + dup FAQ |
| **Shoe conversion hubs** | `/shoe-size-conversions/us-to-eu/` | 7 | Yes | Yes | Fast | Clear | **Mixed** | Common questions + FAQ duplicate |

---

## Scroll-depth sample (main content word count & structure)

| Page | Main words | `<section>` count | `<h2>` count | FAQ blocks | Quick Converters blocks | Related-style blocks |
|------|----------:|------------------:|-------------:|-----------:|------------------------:|---------------------:|
| `index.html` | 1,653 | 9 | 8 | 1 | 1 | 0 |
| `us/index.html` | 838 | 9 | 7 | 1 | **2** | 0 |
| `shoe-size-conversion-chart/index.html` | 529 | 8 | 5 | 1 | 1 | 0 |
| `programmatic-pages/china-to-us-shoe-size.html` | 1,262 | **17** | **15** | 1 | 1 | 5+ |
| `clothing/clothing-men-tops-M-US-to-EU.html` | 1,300 | **15** | **11** | 1 | 0 | 3+ |
| `cm-to-us-shoe-size.html` | 645 | 9 | 7 | 1 (+ Common questions) | 1 | 2 |

---

## Pattern prevalence by family (site-wide scans)

| Pattern | Total pages | Primary families | User value verdict |
|---------|------------:|------------------|-------------------|
| `Quick answer:` (no question) | 109 | editorial-root (82), brands (20), shoe-size-conversions (7) | **Low** — label without question |
| `Common questions` | 108 | editorial, brands, shoe-size-conversions | **Low** when paired with FAQ |
| `Frequently Asked Questions` | 1,127 | all families | **Mixed** — OK if unique; often generic |
| Both Common questions + FAQ same page | **100** | editorial, brands, hubs | **Fail** — duplicate |
| `Why Sizes May Vary` (1-sentence stub) | 116 | editorial, brands, hubs | **Fail** — filler |
| `why-vary-cards` (3-card grid) | 1,017 | programmatic, clothing, measurement | **Acceptable** — concise, scannable |
| `Regional & conversion pages` (card grid) | **754** | programmatic-pages | **Low** — crawl grid, not task help |
| `Recommended next steps` | **1,009** | programmatic, clothing, measurement | **Low** — repetitive card nav |
| `Men's, women's & kids'` (in next-step) | **880** | programmatic, clothing, measurement | **Low** — off-intent links |
| `Key navigation` | **754** | programmatic-pages | **Low** — duplicate of other nav blocks |
| `Related` / `Related Size Conversions` | **1,050** | programmatic, clothing, measurement | **Low–medium** — long link dumps |
| `See also` | 1 | homepage only | **Neutral** (but contains broken link) |
| `Men's, Women's & Kids' Shoe Size Charts` (exact historical) | **0** | — | Removed |
| `Regional & Conversion Pages` (exact historical casing) | **0** | — | Renamed to lowercase variant still present |

---

## Homepage journey checklist

| Step | Status | Notes |
|------|--------|-------|
| Understand purpose | **PASS** | H1 + lead communicate converter |
| Find converter | **PASS** | Above fold after header (desktop); mobile header eats ~40% viewport |
| Choose category | **PASS** | Shoes default selected |
| Choose gender | **NEEDS WORK** | Required; size shows "Select gender first" — OK but easy to miss |
| Choose clothing type | **PASS** | Hidden until clothing — correct |
| Choose region | **PASS** | Sensible defaults |
| Choose size | **NEEDS WORK** | Disabled until gender — runtime not fully tested |
| Receive conversion | **NEEDS WORK** | Empty state visible; runtime verify |
| Understand result | **PASS** | "Converted Sizes" + brand variance note |
| Explore supporting info | **NEEDS WORK** | Overwhelming volume below tool |

---

## Best reference pages (for future template standard)

1. **`/shoe-size-conversion-chart/`** — Strong lead, converter tied to title, reference table adds value  
2. **`/index.html` (hero-tool only)** — Field order and hero association (not below-fold content)  
3. **`/programmatic-pages/china-to-us-shoe-size.html` (hero only)** — Contextual H1/lead + prefilled CN (ignore everything below fold)

## Worst reference pages (anti-patterns)

1. **`/clothing/clothing-men-tops-M-US-to-EU.html`** — No converter; shoe content on clothing page  
2. **`/programmatic-pages/china-to-us-shoe-size.html` (full page)** — Module assembly below converter  
3. **`/us/index.html`** — Duplicate Quick Converters + missing hero lead
