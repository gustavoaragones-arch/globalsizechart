# Master Issues Register

Each finding includes: ID, severity, status, path, observation, impact, evidence, recommended action, scope layer.

**Scope layers:** A=global, B=template, C=page-family, D=page-specific, E=data

---

## P1 — High

### AUD-001 — Broken Quick Converter links at scale

| Field | Value |
|-------|-------|
| **Severity** | P1 |
| **Status** | FAIL |
| **Path** | `scripts/lib/quick-converters-snippet.js`; ~779 HTML files |
| **Selector** | `a[href="/tools/shoe-size-converter.html"]`, `a[href="/tools/clothing-size-converter.html"]` |
| **Observed** | Quick Converters grid links to `/tools/shoe-size-converter.html` and `/tools/clothing-size-converter.html`. Those files do not exist. Actual tools: `/shoe-size-converter.html`, `/clothing-size-converter.html`. |
| **Why it matters** | Users on 779 conversion pages hit 404 from prominent secondary navigation — breaks trust and core journey. |
| **Evidence** | `rg -l '/tools/shoe-size-converter.html' | wc -l` → **779**; `ls tools/shoe-size-converter.html` → not found |
| **Recommended action** | Fix snippet hrefs to canonical converter URLs; regenerate or batch-replace affected pages |
| **Scope** | **B** template/snippet (propagates to **C** programmatic-pages + hubs) |

---

### AUD-002 — Korea (KR) and Inch (INCH) shoe regions offered without data

| Field | Value |
|-------|-------|
| **Severity** | P1 |
| **Status** | FAIL |
| **Path** | `programmatic-pages/china-to-us-shoe-size.html` (form `#fromRegion`); `app.js` `shoeRegionHasDataset`, `REGION_NO_DATA_MSG` |
| **Observed** | Shoe converter forms include `<option value="KR">` and `<option value="INCH">`. `data/shoe_sizes.json` rows only contain: us, uk, eu, jp, cn, cm. Selecting KR/INCH triggers empty state: "No data available for this region yet." |
| **Why it matters** | User selects a valid-looking region and cannot convert — appears broken. |
| **Evidence** | Shoe row keys: `[cm, cn, eu, jp, uk, us]`; form includes Korea/Inch; `app.js:1113-1115` shows empty state when no dataset |
| **Recommended action** | Either add KR/INCH data to `shoe_sizes.json` + validation ranges, or remove/hide options until supported |
| **Scope** | **A** app.js + **E** data + **B** templates |

---

### AUD-003 — Placeholder `sameAs` URLs in Organization schema (site-wide)

| Field | Value |
|-------|-------|
| **Severity** | P1 |
| **Status** | FAIL |
| **Path** | `index.html`, `legal/privacy.html`, ~1,148 HTML files with `data-authority-org-global="1"` |
| **Observed** | JSON-LD contains `REPLACE_WITH_YOUR_REDDIT_USERNAME` and `REPLACE_WITH_YOUR_QUORA_PROFILE` |
| **Why it matters** | Trust signal and structured data point to invalid URLs; risk of rich-result rejection and credibility loss |
| **Evidence** | `rg -l 'REPLACE_WITH_YOUR' --glob '*.html' | wc -l` → **1148** |
| **Recommended action** | Replace with real profiles or remove `sameAs` until available; fix at injector `inject-authority-org-schema.js` |
| **Scope** | **A** injector script |

---

### AUD-004 — Duplicate FAQ sections on same page

| Field | Value |
|-------|-------|
| **Severity** | P1 |
| **Status** | NEEDS WORK |
| **Path** | e.g. `cm-to-us-shoe-size.html`, `shoe-size-conversions/us-to-uk/index.html`, 98 more |
| **Selector** | `section.ai-faq-block` + `section.faq-block` / `h2: Frequently Asked Questions` |
| **Observed** | 100 pages contain both **"Common questions"** (`ai-faq-block`) and **"Frequently Asked Questions"** with overlapping generic copy |
| **Why it matters** | Repetitive, confusing UX; looks SEO-stuffed rather than helpful |
| **Evidence** | Node scan: `dupFaq: 100`; sample `cm-to-us-shoe-size.html` lines 279–295 |
| **Recommended action** | Merge into one FAQ per page or remove generic `ai-faq-block` where JSON-LD FAQ already exists |
| **Scope** | **A** `ai-answer-injector.js` / **C** editorial + hub families |

---

### AUD-005 — Runtime converter correctness unverified

| Field | Value |
|-------|-------|
| **Severity** | P1 |
| **Status** | EXTERNAL VERIFICATION REQUIRED |
| **Path** | `app.js`, `index.html`, `programmatic-pages/china-to-us-shoe-size.html` |
| **Observed** | Static analysis shows CN data + validation present (men CN 42 → valid). Hub form uses disabled fields until gender/clothing type selected. No browser test executed in this audit. |
| **Why it matters** | Historical regressions (field order, shoes vs clothing unified logic) require live QA |
| **Evidence** | Node simulation: CN men size 42 exists, `validateSize` true; code review of `isMainComboForm` split |
| **Recommended action** | Phase 2 browser test matrix: homepage shoes/clothing, CN/JP/CM, gender changes, programmatic text-input forms |
| **Scope** | **A** app.js |

---

## P2 — Medium

### AUD-006 — Quick answer label without explicit question

| Field | Value |
|-------|-------|
| **Severity** | P2 |
| **Status** | NEEDS WORK |
| **Path** | 109 pages e.g. `us-shoe-sizing-system.html:68` |
| **Observed** | Pattern `<p><strong>Quick answer:</strong></p>` followed by answer paragraph — no visible question |
| **Why it matters** | User sees "Quick answer:" with no question context — historically reported UX issue **still present** |
| **Evidence** | `rg -l 'Quick answer:' | wc -l` → **109** |
| **Recommended action** | Reframe as `h2` question + answer, or remove block where redundant with title |
| **Scope** | **A** injector / **C** editorial pages |

---

### AUD-007 — Why Sizes May Vary one-sentence stub (112 pages)

| Field | Value |
|-------|-------|
| **Severity** | P2 |
| **Status** | NEEDS WORK |
| **Path** | e.g. `cm-to-us-shoe-size.html` — `section.why-sizes-vary` |
| **Observed** | 112 pages use heading "Why Sizes May Vary" + single generic sentence. Programmatic pages (1,017) use improved `why-vary-cards` 3-card grid |
| **Why it matters** | Inconsistent quality; editorial pages feel like SEO filler |
| **Evidence** | Scan: `whyVaryShort: 112`, `whyVaryCards: 1017` |
| **Recommended action** | Migrate editorial/hub pages to `why-vary-cards` module or remove stub |
| **Scope** | **B** structural modules / **C** editorial family |

---

### AUD-008 — Hero-tool layout incomplete (394 pages)

| Field | Value |
|-------|-------|
| **Severity** | P2 |
| **Status** | NEEDS WORK |
| **Path** | `clothing/`, `measurement/`, `brands/`, `legal/` |
| **Observed** | 778/1172 pages have `hero-tool`; 394 do not — including entire clothing and measurement families |
| **Why it matters** | Inconsistent above-the-fold experience; title/converter not unified on high-traffic conversion families |
| **Evidence** | `hero-tool` count 778 vs total 1172 |
| **Recommended action** | Extend hero-tool migration to clothing/measurement templates or document intentional exclusion |
| **Scope** | **B** templates / **C** page families |

---

### AUD-009 — Schema density / duplicate types on programmatic pages

| Field | Value |
|-------|-------|
| **Severity** | P2 |
| **Status** | NEEDS WORK |
| **Path** | `programmatic-pages/china-to-us-shoe-size.html` `<head>` |
| **Observed** | 8+ JSON-LD scripts: Organization (×2), WebSite, WebPage (×2), FAQPage, QAPage, HowTo, Article, SoftwareApplication, ItemList (×2) |
| **Why it matters** | Maintenance burden; potential Google guideline issues for redundant/conflicting graph |
| **Evidence** | Head lines 19–30 of sample page |
| **Recommended action** | Consolidate to Organization + WebPage + one FAQ or QAPage; remove duplicate WebPage/QAPage |
| **Scope** | **B** `generate-programmatic-pages.js` |

---

### AUD-010 — Irrelevant FAQ schema on legal pages

| Field | Value |
|-------|-------|
| **Severity** | P2 |
| **Status** | NEEDS WORK |
| **Path** | `legal/privacy.html:13` |
| **Observed** | Privacy page includes FAQPage schema about EU shoe size 42 — unrelated to privacy |
| **Why it matters** | Misleading structured data; trust/compliance noise |
| **Evidence** | `legal/privacy.html` FAQPage JSON-LD |
| **Recommended action** | Remove generic FAQ schema from legal templates |
| **Scope** | **C** legal family |

---

### AUD-011 — Internal link validator reports build block

| Field | Value |
|-------|-------|
| **Severity** | P2 |
| **Status** | NEEDS WORK |
| **Path** | `scripts/prebuild-link-validation.js` |
| **Observed** | 52 "missing" targets including `knowledge/.html` (false positive for `knowledge/index.html`) AND real missing `tools/shoe-size-converter.html` |
| **Why it matters** | Validator signal/noise mix; real broken links not fully surfaced |
| **Evidence** | Command output: "BUILD BLOCKED — Missing targets: 52" |
| **Recommended action** | Fix resolver for directory indexes; fix broken hrefs; re-run validator |
| **Scope** | **A** validator + **B** snippets |

---

### AUD-012 — Thin measurement index hub

| Field | Value |
|-------|-------|
| **Severity** | P2 |
| **Status** | NEEDS WORK |
| **Path** | `measurement/index.html` |
| **Observed** | 42 visible words; quality score 48; AdSense thin-page warning |
| **Why it matters** | Poor landing experience for measurement family |
| **Evidence** | `content-quality-audit.js` + `adsense-policy-checker.js` |
| **Recommended action** | Add purposeful hub copy + links to top measurement tools |
| **Scope** | **D** single page |

---

### AUD-013 — Primary nav includes off-topic mattress chart

| Field | Value |
|-------|-------|
| **Severity** | P2 |
| **Status** | NEEDS WORK |
| **Path** | `index.html:144`, most inner headers |
| **Observed** | "Mattress Size Chart" in primary nav alongside shoe/clothing converters |
| **Why it matters** | Dilutes site focus; users may question site purpose |
| **Evidence** | Header nav link to `/tools/home/mattress-size-chart.html` |
| **Recommended action** | Move to secondary/resources or separate property |
| **Scope** | **A** header pattern (per-page today) |

---

## P3 — Enhancement

### AUD-014 — Header navigation inconsistency

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Status** | NEEDS WORK |
| **Path** | `index.html` vs `programmatic-pages/china-to-us-shoe-size.html` |
| **Observed** | Homepage primary nav includes "Shoe Size Chart"; many inner pages use different link set |
| **Scope** | **A** (needs centralized nav partial) |

### AUD-015 — 35 noindex kids CM longtail pages

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Status** | PASS (if intentional) |
| **Path** | `programmatic-pages/cm-*-kids.html` (35 files) |
| **Observed** | `noindex` present — likely from `inject-noindex-longtail.js` |
| **Scope** | **C** programmatic family — confirm strategy in GSC |

### AUD-016 — No analytics implementation

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Status** | FAIL |
| **Path** | Site-wide HTML/JS |
| **Observed** | No gtag/GTM in site source (excluding node_modules) |
| **Scope** | **A** — EXTERNAL VERIFICATION REQUIRED for production injection via tag manager |

---

## Resolved / not present (verified)

| Historical issue | Status | Evidence |
|------------------|--------|----------|
| Men's/Women's/Kids' Shoe Size Charts nav block | PASS (absent) | 0 grep matches |
| Regional & Conversion Pages block | PASS (absent) | 0 grep matches |
| Interactive Shoe Size Converter heading | PASS (absent) | 0 grep matches |
| Footer inconsistency | PASS | `footer:check` OK |
| China missing from validateSize | PASS (fixed in code) | `app.js:934` CN ranges present |
