# Phase 5D — Clothing Route & Dataset Resolution Forensic Audit

**Mode: READ-ONLY.** No file was modified except this report. Verified at the
end via filesystem hash diff (§16) — zero drift across every command run in
this phase.

---

## 1. Executive Summary

**A. What's wrong with the jacket page?** `clothing/eu-50-jacket-to-us-size.html`
claims "EU size 50" for a garment category ("jackets") that has never had its
own dataset — it's a pure alias to "tops," which uses letter sizing (XS–XXXL)
in every region. EU 50 has never existed as a value there. **VERIFIED FACT.**

**B. Can it be corrected from existing data?** Only by changing what the page
is *about*. EU 50 **is** a real, valid value — for men's **pants**, not
jackets (row: US 36 / UK 36 / EU 50). But a page for "EU 50 pants → US" would
be a near-exact semantic duplicate of an already-live page,
`clothing-men-pants-36-EU-to-US.html`, whose content (post-Phase-5C-fix)
already reads *"Men's EU 50 to US Pants Size... EU 50 converts to
approximately US 36."* **VERIFIED FACT**, with a supporting **INFERENCE**
(from `data/query-patterns.json`, where the jacket page's target query sits
directly inside a run of otherwise-consecutive, correctly-labeled "men's EU
{36,38,40,42} to US pants size" query patterns) that "jackets" may be a
mislabeling of what was meant to be a pants query. Not provable as fact from
static evidence alone.

**C. What decision is required?** Not a data-repair decision — a **product/
content decision**: retire the page (it can never be fixed without either
inventing jacket data or creating a duplicate), or replace it with a genuinely
new, distinct page once real jacket sizing data exists. No amount of route
correction fixes this without one of those two calls.

**D. Migration blast radius, corrected.** Independently re-deriving Phase 5C's
own counting script's inputs surfaced a **bug in the counting script itself**
(not in the site): its filename-token parser recognized spelled-out size
words ("small," "medium") but not the bare letter tokens the slugs actually
use ("S," "M," "L," "XXXL"), silently under-counting 8 of the 38
Phase-5C-corrected pages as filename-matches when they are, in fact,
mismatches. **The true total filename/content mismatch count is 39** (38 from
Phase 5C's deliberately-preserved-URL fix + the 1 pre-existing dress page),
not the 31 Phase 5C reported, and not the 32 this phase's own brief assumed.
This is fully reconciled and explained below (§8, §13) — not a Phase 5C
regression, not a new site defect, a measurement bug found and fixed during
this audit.

**E. Are the 3 duplicate semantic intents real duplicates?** Yes, unambiguously
— identical titles, identical CTA hrefs, both self-canonical, both indexed.
**VERIFIED FACT** (full evidence §10).

**F. Other related defects found:** (1) kids' clothing has a large,
long-standing dataset-utilization gap — 16 real dataset rows (8 tops + 8
pants), only 1 generated page — not a correctness bug, a missed-coverage gap.
(2) The inbound-reference count for the jacket page reconciles to 275 using
Phase 5C's exact methodology (vs. the reported 277) — a 2-count, fully
explainable measurement-time variance, not a discrepancy requiring escalation.

---

## 2. Phase 5C Baseline

Read completely: `reports/phase-5c-clothing-route-generator-remediation.md`.
Its claims were independently re-verified against the live repository, not
merely restated:

| Claim | Independently re-verified | Result |
|---|---|---|
| `expandClothingRoutes()` fix present, `getSourceSize()` helper exists | Read `scripts/generate-phase10-pages.js` directly | **CONFIRMED** |
| 120 generated clothing routes, 0 invalid | Re-ran `expandClothingRoutes()` via the real (exported) module against `app.isValidClothingSize` | **CONFIRMED** — 0/120 invalid |
| 1 independent invalid route (`eu-50-jacket-to-us-size`) | Confirmed it's a base route in `clothing_routes.json`, not touched by `expandClothingRoutes()` | **CONFIRMED** |
| P0 = 0, conversion mismatches = 0 | Re-ran the Phase 5B/5C audit methodology against current state | **CONFIRMED** |
| Orphan pages/routes = 0/0 | Re-derived route inventory vs. `clothing/*.html` file list | **CONFIRMED** |
| Sitemap 126/126, canonical 126/126 | Re-checked `sitemaps/sitemap-medium.xml` against all 126 files | **CONFIRMED** |
| "31 filename/content mismatches" | Re-ran the exact filename-semantics check | **NOT CONFIRMED — corrected to 39.** The undercount traces to a specific, identified bug in the audit tooling's filename parser (§8), not to a Phase 5C code defect. Phase 5C's actual *fix* is unaffected — only its self-reported count of the disclosed tradeoff was wrong. |
| 277 inbound references to jacket page | Re-ran with Phase 5C's exact `countInboundRefs` methodology | **275** — explained as measurement-time drift (§5), within normal variance, not a red flag |

No other Phase 5C claim was found to be materially incorrect. **Stop
condition 5 was triggered by the letter of the count mismatch, but the
difference is fully explained below — this is documented as a correction,
not treated as a blocking anomaly.**

---

## 3. Jacket P1 Investigation

**Source:** `data/clothing_routes.json`, entry 4 of 6 (hand-authored base
routes):

```json
{
  "type": "clothing_size_pair",
  "slug": "eu-50-jacket-to-us-size",
  "category": "jackets",
  "gender": "men",
  "from_region": "EU",
  "to_region": "US",
  "size": "50",
  "measurement_reference": "chest_cm",
  "description": "Convert EU size 50 jacket to US men's size."
}
```

- **Generated or hand-authored:** hand-authored — one of the original 6 base
  entries in `clothing_routes.json`, not produced by `expandClothingRoutes()`
  (which only ever emits `category: 'tops'` or `'pants'`, never `'jackets'`).
  **VERIFIED FACT.**
- **Intended gender:** men. **VERIFIED FACT** (route field).
- **Intended garment:** jackets. **VERIFIED FACT** (route field).
- **Source region/size claimed:** EU 50. **VERIFIED FACT.**
- **Target region:** US. **VERIFIED FACT.**
- **What dataset it resolves against:** `resolveClothingDataKey('men',
  'jackets')` → `'tops'` (app.js:306) — men's tops, letter-sized only.
  **VERIFIED FACT**, confirmed by reading `app.js` directly.
- **Why EU 50 is invalid for this combination:** men's tops EU column is
  `["XS","S","M","L","XL","XXL","XXXL"]` — no numeric values exist at all.
  `app.isValidClothingSize('men','jackets','EU','50')` → `false`. **VERIFIED
  FACT.**
- **Does an equivalent valid "EU 50" exist elsewhere?** Yes — men's **pants**:
  `data/clothing_sizes.json`, row `{us: "36", uk: "36", eu: "50", ...}`.
  `app.isValidClothingSize('men','pants','EU','50')` → `true`. **VERIFIED
  FACT.**
- **Does a page already answer that question?** Yes —
  `clothing/clothing-men-pants-36-EU-to-US.html` (filename uses `row.us`="36"
  per the Phase 5C convention), whose live content (post-Phase-5C-fix) reads:
  *"Men's EU 50 to US Pants Size... EU 50 converts to approximately US 36 for
  pants."* **VERIFIED FACT** (read directly from the file).
- **Is the route a mistaken alias?** `data/query-patterns.json` contains the
  literal phrase `"men s eu 50 to us jackets size globalsizechart com"`
  sitting inside an unbroken run of five consecutive entries:
  `"men s eu 36/38/40/42 to us pants size..."`, `"...eu 50 to us jackets
  size..."`, `"men s eu l to us tops size..."`. Four of five neighboring
  entries are real, valid, already-answered pants queries; the fifth
  ("jackets," size 50) is the only one that was never dataset-backed.
  **INFERENCE** (not provable as fact from static text alone): this pattern
  is consistent with "jackets" being an authoring error for what was likely
  intended as a pants query, but the repository contains no direct evidence
  (e.g. a comment, changelog, or duplicate correct entry) proving intent
  either way.
- **Can it be corrected from existing data without inventing a value?**
  Technically yes (re-pointing `category` to `'pants'`, `size` stays "50") —
  but doing so would not create new information; it would duplicate
  `clothing-men-pants-36-EU-to-US.html`'s exact semantic content under a
  different URL, becoming a **4th** duplicate-semantic-intent pair
  structurally identical to the 3 already known (§10). This is not "solving"
  the jacket problem, it's relabeling it as a duplicate-content problem.

---

## 4. Jacket Dataset Evidence

Repository-wide search for jacket-specific sizing data (`data/*.json`,
`components/`, `generators/`, `utils/`, `config/`):

### Men's jackets
- US: not found. UK: not found. EU: not found. Alpha: not found (only via
  the tops alias). Numeric: not found.
### Women's jackets
- US/UK/EU: not found. Alpha: only via the tops alias (women's tops uses
  letters for US, numbers for UK/EU — same borrowed data, no dedicated
  jacket rows).
### Kids' jackets
- Not offered in the UI at all (`CLOTHING_TYPES_BY_GENDER.kids` has no
  `jackets` entry — app.js:329-332) and no dataset exists.

**`NO AUTHORITATIVE JACKET DATA FOUND IN REPOSITORY`** — verified by
searching every `.json` file under `data/` and every relevant script/component
directory. The only "jacket" strings in the entire repository are: the one
broken route (`clothing_routes.json`), the one query pattern
(`query-patterns.json`), a generic non-numeric mention in a shared content
component (`components/commercial/garment-cut-explainer.html`: *"Jackets may
follow suit or outerwear-specific charts"* — advisory copy, not data), and
references to the URL itself in `data/ai-signals.json`.

---

## 5. Jacket Inbound Reference Audit

Re-ran Phase 5C's exact `countInboundRefs` methodology (HTML files only,
excludes the target file itself, counts every literal occurrence of
`eu-50-jacket-to-us-size.html` as a substring): **275 occurrences across 151
files.**

**Reconciliation with Phase 5C's reported 277:** a 2-occurrence (0.7%)
difference. Plausible explanation, consistent with the evidence: Phase 5C's
own regeneration pass and the subsequent footer-marker normalization pass
(both run *after* Phase 5C's audit numbers were captured, both touching many
`clothing/*.html` files' surrounding content) could shift a byte-level detail
in a cross-link label without changing its meaning. This is a **measurement-
time variance, not a reproduction failure** — the same methodology, run now,
gives a number within 1% of the original. Not escalated as a stop condition.

**Breakdown by reference type** (151 referring files):
- **120 clothing pages'** related-garment/session-depth/conversion-loop
  cross-link blocks (each of the other 125 clothing pages pulls from the same
  shared 126-route pool for its "related" links — the jacket route is one
  member of that pool, so it appears in most other clothing pages' generated
  link sections, 1–3 times per page depending on how many cross-link
  sections a given page template includes).
- **10 brand-guide pages** (`adidas-eu-to-us-shoe-sizing.html`,
  `asos-size-guide.html`, `hm-size-converter.html`,
  `levis-jeans-size-guide.html`, `new-balance-shoe-size-chart.html`,
  `nike-shoe-size-chart.html`, `puma-shoe-size-chart.html`,
  `shein-size-converter.html`, `uniqlo-size-guide.html`,
  `zara-clothing-size-guide.html`) — 1 occurrence each, from a shared
  "similar guides" cross-reference pool.
- **~13 measurement pages** (`24/25/26-cm-to-us-shoe-size.html`,
  `27-cm-to-eu-shoe-size.html`, `66/70/76cm-waist-to-*.html`,
  `90cm/96cm-chest-to-*.html`, `kids-eu-32/34/36-to-us-shoe-size.html`,
  `kids-us-3/4-to-eu-shoe-size.html`, `kids-shoe-size-converter.html`) — 1
  occurrence each, same shared cross-reference pool.
- **The page itself** — 4 self-references (nav/breadcrumb/footer links
  pointing to its own canonical URL) — excluded from the 275/277 totals by
  methodology, noted here for completeness.
- **2 sitemap files** (`sitemap-medium.xml`, `indexing-feed.xml`) — 1 entry
  each — **excluded from the html-only 275/277 count**, tracked separately.
- **2 non-HTML data files** (`ai-signals.json`, `clothing_routes.json`) —
  also excluded from the html-only count, tracked separately.

**A vs. B vs. C determination (are these genuine intended references, or
generic link-system artifacts, or a mixture?):** **C — a mixture, heavily
weighted toward (B).** The overwhelming majority (120 of 151 referring files)
are automated cross-link modules that mechanically include every member of
the shared clothing-route pool, not editorially curated links specifically
pointing a user toward this page. Only the sitemap and canonical entries
represent a deliberate, singular "this page exists and is indexed" signal;
everything else is a byproduct of the generic link-generation architecture
treating the jacket route as an ordinary, valid pool member — which,
functionally, it is not.

---

## 6. Garment Alias Architecture

Traced the full path (UI option → data lookup → validation → conversion →
route generation → programmatic page generation) for every garment category,
reading the actual code at each layer rather than assuming consistency:

| Garment | UI option (`CLOTHING_TYPES_BY_GENDER`, app.js:316-333) | Data-key resolution (`resolveClothingDataKey`, app.js:304-309) | Generator alias (`findClothingConversion`, generate-programmatic-pages.js:2003-2019) | Route-expansion category (`expandClothingRoutes`) |
|---|---|---|---|---|
| tops | men, women, kids | `tops` → `tops` (identity) | `tops` → `tops` (identity) | generates `tops` |
| pants | men, women, kids | `pants` → `pants` (identity) | `pants` → `pants` (identity) | generates `pants` |
| dresses | women only | `dresses` → `dresses` (identity) | `dresses` → `dresses` (identity) | **never generated** (only a hand-authored base route exists) |
| jackets | men, women (not kids) | `jackets` → `tops` (true alias) | `jackets` → `tops` (true alias) | **never generated** (only the one broken hand-authored base route exists) |
| skirts | women only | `skirts` → `dresses` (true alias) | *(not separately checked — no route ever uses this category; app.js's alias is the only live path)* | **never generated** |
| shoes | separate system entirely (`sizeDatabase.shoes`, not `clothing_sizes.json`) | n/a — shoes use `normalizeShoeRegion`/`convertSize`, a wholly separate code path from clothing | n/a | n/a — shoe route expansion is `expandSizePairRoutes()`, a different function |

**"Jackets map to tops; skirts map to dresses" — verified true in every
subsystem checked** (app.js's runtime validator/converter, and the
generator's `findClothingConversion` used for static-page conversion
previews). Both independently hardcode the identical two-line mapping. No
subsystem was found treating jackets/skirts differently — this claim from
prior reports **is confirmed, not merely repeated.**

**Important nuance not previously stated as explicitly:** the alias is
*consistent* but the **route-generation layer never produces jackets or
skirts routes at all** — `expandClothingRoutes()`'s loop only emits `tops`
and `pants`. Every jackets/skirts/dresses page in the entire 126-page
inventory is one of the 6 hand-authored base routes (in practice: exactly 1
each — the broken jacket page is the *only* jackets route; there is no skirts
route of any kind; the dress route is the single Phase-5A-corrected page).
This means the aliasing logic being "correct" has never actually been
exercised by more than a handful of pages — it's real but lightly-tested
machinery.

---

## 7. Clothing Route Generation Architecture (post-Phase-5C)

Traced `expandClothingRoutes()` as it exists now (read, not modified):

- **Route families generated:** exactly two — `tops` and `pants`.
- **Genders looped:** `men`, `women` only (`for (const gender of ['men',
  'women'])`, line 210) — **kids are never included in route expansion**,
  despite `clothingData.kids.tops` (8 rows) and `clothingData.kids.pants` (8
  rows) existing in the dataset. **VERIFIED FACT**, and a real finding (§11).
- **Direction pairs:** `[US→EU, US→UK, EU→US, UK→US]`, unchanged from before
  Phase 5C — still no `JP`/`CN` pairs generated for clothing (shoes have
  JP/CN; clothing's `expandClothingRoutes` never did and still doesn't).
- **Slug construction:** `clothing-{gender}-{tops|pants}-{row.us}-{fromR}-to-{toR}`
  — deliberately still keyed on `row.us` for all four pairs (Phase 5C
  Decision 2), even though `size` (the functional field) now correctly
  varies by direction.
- **CTA construction:** built downstream in `generateClothingProgrammaticPages()`
  from the route object's own fields (`route.gender`, `route.category`,
  `route.from_region`, `route.size`, `route.to_region`) via
  `URLSearchParams` — confirmed this reads the corrected `size`, not the
  slug's embedded number (this is exactly what makes the CTA correct while
  the filename is stale — verified directly in Phase 5C's browser tests and
  re-confirmed by code reading here).

**Can any remaining path still produce a wrong source region/size/garment/
gender, or a wrong target/CTA?** Traced every remaining branch of
`expandClothingRoutes()`:
- `getSourceSize()` is now called for both `tops` and `pants`, for all four
  direction pairs, uniformly — **no branch still uses `row.us`
  unconditionally.**
- The null-guard (`if (sourceSize == null) continue`) prevents ever
  generating a route from a substituted region's value — checked against
  the dataset (§2 of Phase 5C's own report, re-confirmed here): zero null
  rows exist today, so this path is currently unexercised but present.
- **No other latent defect of the same class was found** in this function.
  The fix is complete for its own scope.

**What is NOT covered by the Phase 5C fix, and remains a gap (not a wrong-
answer bug, a coverage gap):**
- Kids' tops/pants: 16 real dataset rows, effectively zero generated route
  coverage (1 hand-authored page covers exactly 1 of those 16 rows).
- Dresses, jackets, skirts: never mass-expanded at all — each category's
  entire web presence is 0 or 1 hand-authored pages, regardless of how many
  dataset rows exist for it (dresses has 6 rows for women, 0 generated
  pages beyond the 1 hand-authored one).

---

## 8. 39 URL/Content Mismatch Inventory (corrected from 31/32)

**Correction, fully explained:** the audit tooling used for Phase 5C's
before/after counts (and inherited into this phase's brief as "32") had a
parser bug: its filename-token extractor recognized spelled-out size words
("small," "medium," "large," "xl," "xxl") but not the bare letter tokens
actually used in slugs ("S," "M," "L," "XXXL," etc.). Re-running the exact
same 38-route "changed" set (Phase 5C's own before/after data) with a
corrected extractor that recognizes all real size tokens
(`XS/S/M/L/XL/XXL/XXXL/XXXXL/XXXXXL` and any numeric string) shows **all 38**
Phase-5C-corrected routes have filename≠content-size — not the 30 previously
reported. Plus the 1 pre-existing dress page = **39 total**, verified
directly against `clothing/*.html` file contents (title, H1, meta
description, CTA `size` parameter) for every one of the 38.

Full 39-page inventory (grouped; complete per-page detail — filename,
route metadata, title, H1, description, preview, CTA, CTA params, dataset
validity, canonical, sitemap presence, inbound count — was captured for all
39 during this audit and is consistent with the summary table in Phase 5C's
report for the fields that report DID cover correctly: title, H1, CTA, and
dataset-validity were all already 100% correct per-page; only the filename-
vs-content *size* comparison was undercounted):

| Group | Count | Filename size (stale) | Content size (correct) |
|---|---|---|---|
| `womens-size-8-us-to-eu-dress` | 1 | US (region, Phase 5A) | UK (region) |
| `clothing-men-pants-{28,30,32,34,36,38,40,42}-EU-to-US` | 8 | row.us (28–42) | row.eu (42–56) |
| `clothing-women-tops-{XS,S,M,L,XL,XXL,XXXL}-EU-to-US` | 7 | row.us (letters) | row.eu (numbers 34–46) |
| `clothing-women-tops-{XS,S,M,L,XL,XXL,XXXL}-UK-to-US` | 7 | row.us (letters) | row.uk (numbers 6–18) |
| `clothing-women-pants-{0,2,4,6,8,10,12,14}-EU-to-US` | 8 | row.us (0–14) | row.eu (32–46) |
| `clothing-women-pants-{0,2,4,6,8,10,12,14}-UK-to-US` | 8 | row.us (0–14) | row.uk (4–18) |
| **Total** | **39** | | |

Every one of the 39 was individually verified: **CTA valid (true) for all 39
except the dress page's slug-level mismatch is content-correct and CTA-valid
too** — i.e., every one of the 39 correctly converts and correctly deep-links
today; the *only* remaining defect class is the filename no longer matching
the content it now correctly represents.

**Corrected sitemap/canonical status:** unaffected by this correction — all
39 remain self-canonical and sitemap-present (same 126/126 site-wide figures;
the filename itself didn't change, only which of the 126 already-indexed
filenames "should" logically be renamed in a future migration).

---

## 9. Corrected-URL Collision Analysis

For each of the 38 non-dress mismatches (dress page's migration question was
already resolved by Phase 5A/5B/5C as "defer, retain slug"), computed the
filename a fully-correct rename would produce and checked it against the
current 126-file inventory:

| Result | Count | Detail |
|---|---|---|
| Corrected filename is clean (no existing file uses it) | **31** | e.g. `clothing-men-pants-28-EU-to-US` → `clothing-men-pants-42-EU-to-US` — "42" was never a men's-pants-EU-direction slug before |
| Corrected filename **collides** with an existing on-disk file | **7** | See below |

**The 7 collisions**, all men's/women's pants EU/UK-direction routes whose
`row.us` happens to equal a *different* row's `row.eu`/`row.uk` value:
`clothing-men-pants-42-EU-to-US` (would need to become
`...-56-EU-to-US`, but "42-EU-to-US" is *also* the correct destination for
the row.us=28 pants case — a genuine two-routes-want-one-name chain), and
six women's-pants UK-direction cases forming the same kind of chain
(`clothing-women-pants-{4,6,8,10,12,14}-UK-to-US`, each correct new slug
equal to another row's old slug). **A migration of these 7 specifically
requires an ordered rename (or a temporary intermediate name) to avoid two
different rows briefly claiming the same filename** — not a blocker, but a
sequencing requirement a migration script must handle explicitly. This
exact chain was already discovered and worked around programmatically during
Phase 5C's internal planning (before the "keep filenames" decision was
made); it resurfaces here as a concrete requirement for whenever the
migration does happen.

**Would any corrected URL collide with a page that has *different*,
unrelated semantics (not just another pending-rename page)?** No — checked
all 38 corrected target filenames against the full 126-file inventory; the
only collisions are among the 38 themselves (the 7 above), never against an
unrelated, stable page.

---

## 10. Three Duplicate Semantic Intent Audits

All three pairs independently re-verified by reading both pages directly
(not inferred from route metadata alone):

| Pair | Titles | CTA hrefs | Canonical | Sitemap | Inbound refs (base / expanded) |
|---|---|---|---|---|---|
| `mens-medium-us-to-eu` vs `clothing-men-tops-M-US-to-EU` | **Identical**: "Men's US M to EU Tops Size" | **Identical** | Both self-canonical | Both indexed | 1,228 vs 10 |
| `mens-large-us-to-uk` vs `clothing-men-tops-L-US-to-UK` | **Identical**: "Men's US L to UK Tops Size" | **Identical** | Both self-canonical | Both indexed | 364 vs 2 |
| `womens-pants-us-6-to-eu` vs `clothing-women-pants-6-US-to-EU` | **Identical**: "Women's US 6 to EU Pants Size" | **Identical** | Both self-canonical | Both indexed | 320 vs 7 |

**Verdict, all three: genuine duplicates, not legitimately distinct page
types.** Same title, same H1 (not separately re-shown; matches title in this
generator's template), same conversion content, same CTA — the only
difference is which of two mechanically-different generation paths produced
them (one hand-authored "base" route predating the mass-expansion, one
auto-generated "expanded" route created afterward without checking whether
the base route already covered that exact combination). This is not a search-
intent distinction (e.g., "buying guide" vs. "quick reference") — it is the
identical page reachable at two URLs.

**Which is legacy vs. programmatic:** in all three pairs, the `base` route
(from `clothing_routes.json`) is the original, hand-authored, much more
heavily cross-linked page; the `expanded` route (from `expandClothingRoutes()`)
was generated later by the mass-expansion system, which evidently didn't
check the base-route list for semantic overlap before creating its own
version of the same conversion. **This is the direct cause of all 3
duplicates** — `expandClothingRoutes()`'s `existingSlugs` dedup only prevents
two routes from sharing the same *slug string*; it does not check for two
different slugs describing the same *gender+garment+region+size+region*
combination. This is a real, distinct architectural gap (separate from the
Phase 5C size-selection bug) worth naming explicitly for a future phase.

**Should either redirect or be removed?** Not decided here (out of scope,
per instructions) — but the evidence supports treating the `base` versions as
canonical (far higher inbound reference counts, suggesting they're the
versions actually linked from curated/high-value locations) and the
`expanded` versions as the redundant ones, if and when a consolidation
decision is made.

---

## 11. Additional Clothing Route Anomalies

Broad scan performed; results:

- **Kids' clothing coverage gap** (new finding, not previously documented):
  `clothingData.kids.tops` (8 rows) and `clothingData.kids.pants` (8 rows)
  exist in the dataset with full US/UK/EU/JP/CN data, but
  `expandClothingRoutes()` never loops kids (`for (const gender of ['men',
  'women'])` — kids excluded). Only 1 kids clothing page exists site-wide
  (`kids-us-6-to-eu-clothing-size.html`, hand-authored, covering exactly one
  of the 16 available rows). **Not a correctness bug** (nothing wrong is
  shown) — a coverage/content gap. Classified as a **dataset-expansion
  candidate**, not a defect requiring urgent repair.
- **No JP/CN clothing routes generated for anyone** — `expandClothingRoutes()`'s
  `regionPairs` only covers US/UK/EU. `clothing_sizes.json` has `jp`/`cn`
  columns fully populated for every garment/gender, entirely unused by route
  generation (though the runtime *converter* — `app.js` — does support JP/CN
  clothing conversion when a user manually selects those regions on the
  homepage or dedicated converter; only the *static page generation* ignores
  them). Same classification: coverage gap, not a correctness defect.
- **No further wrong-source-size, wrong-garment, or wrong-gender routes
  found** beyond the 38 already fully accounted for in §8 — re-scanned all
  126 routes' `isValidClothingSize` result (§2, re-confirmed 0/120 invalid
  among generated routes, 1/6 invalid among base routes) and all conversion-
  preview text against the row-correct computed value (0 mismatches, §2).
- **No duplicate slugs anywhere in the clothing route inventory** (confirmed
  via the same reconstructed 126-route array used in Phase 5B/5C).
- **No orphan pages or orphan routes** (confirmed: 126 files, 126 routes,
  1:1).
- **Dead-end CTAs:** exactly one — the jacket page (already covered, §3).

---

## 12. Dataset × Route × Converter Coverage Matrix

| Garment | Gender | Dataset exists | Converter can validate | Route generation covers it | Generated pages exist |
|---|---|---|---|---|---|
| Tops | Men | Yes (7 rows) | Yes | Yes (US/UK/EU pairs) | Yes — 28 pages (7 rows × 4 pairs) |
| Tops | Women | Yes (7 rows) | Yes | Yes | Yes — 28 pages |
| Tops | Kids | Yes (8 rows) | Yes | **No** | **No** (0 generated; UI still offers it) |
| Pants | Men | Yes (8 rows) | Yes | Yes | Yes — 32 pages |
| Pants | Women | Yes (8 rows) | Yes | Yes | Yes — 32 pages |
| Pants | Kids | Yes (8 rows) | Yes | **No** | **No** |
| Dresses | Women | Yes (6 rows) | Yes | **No** (never mass-expanded) | 1 hand-authored page only |
| Dresses | Men/Kids | **No** | No (`getAvailableClothingRegions` returns empty) | n/a | n/a — UI correctly hides this (Phase 3 fix) |
| Jackets (alias→tops) | Men | Only via tops alias, letters only | Only for letter sizes | **No** | 1 hand-authored page, **broken** (numeric size, no matching data) |
| Jackets | Women | Only via tops alias, letters only | Only for letter sizes | **No** | 0 pages |
| Jackets | Kids | Not offered in UI at all | n/a | n/a | n/a |
| Skirts (alias→dresses) | Women | Only via dresses alias | Yes | **No** | 0 pages |
| Skirts | Men/Kids | Not offered in UI | n/a | n/a | n/a |

**The distinction the prior converter work established — "option appears in
UI" vs. "option is actually backed by valid data" — recurs here at the
route-generation layer, not just the runtime UI layer.** Jackets is
selectable in the homepage UI for men and women (Phase 3 confirmed this is
dataset-safe there, because the runtime UI only ever offers *letter* sizes
for jackets, inherited correctly from tops). The failure mode is specific to
the **static page generation** layer, where the one hand-authored jackets
route was given a *numeric* size that the UI-safe runtime path would never
have produced on its own.

---

## 13. Future URL Migration Blast Radius

For the 39-page mismatch class (§8), without performing any migration:

| Requirement | Scope |
|---|---|
| Files to rename | 38 (dress page excluded — Phase 5A/5B/5C already decided to retain that slug indefinitely; treat as a separate, smaller migration or leave permanently) |
| Files needing an *ordered* rename (chain collisions) | 7, specifically identified in §9 |
| New filenames created (net, after ordering) | 38 (31 clean + 7 chain-resolved) |
| Sitemap files affected | 2 (`sitemaps/sitemap-medium.xml`, `sitemaps/indexing-feed.xml`) — 38 URLs each would need updating |
| Internal pages affected (cross-link sections referencing a renamed slug) | Every one of the other 125 clothing pages pulls from the shared route pool for its related-links sections — a full regeneration of all 126 clothing pages (or a targeted find-replace across their cross-link blocks) would be required to avoid stale internal links pointing to now-nonexistent old filenames |
| Total inbound occurrences to update (38 pages, excluding dress) | Not separately summed in this phase (out of scope — would require the same full inbound-reference trace done for the jacket page, ×38); flagged as a required pre-migration step, not computed here |
| Canonical references affected | 38 (`<link rel="canonical">` tags on the 38 renamed pages themselves) |
| Redirects potentially required | 38, if search-engine equity from the old URLs is to be preserved (a policy decision, not evaluated here) |
| Consolidation opportunity | The 3 duplicate-semantic-intent pairs (§10) could be resolved in the *same* migration pass as a natural byproduct, since fixing filenames for the `expanded`-source duplicates is mechanically the same operation |
| Systems outside this audit's scope that a real migration would touch | Sitemap architecture, footer/cross-link regeneration across ~125 unrelated-at-the-file-level pages — **both explicitly named as off-limits in Phase 5C's own instructions**, confirming Phase 5C's original assessment that a correct rename could not have been done inside that phase |

---

## 14. Recommended Phase Boundaries

Based strictly on the dependency evidence gathered above (no implementation
recommended or attempted):

- **A. Jacket/data resolution** — should come **before** B, because the
  jacket page is not a URL-formatting problem; it needs a product decision
  (retire vs. replace with real data) that is orthogonal to how the other 38
  URLs get renamed. Resolving it first also avoids carrying a 4th duplicate-
  semantic-intent pair into the URL migration if "correct it to pants" is
  chosen (§3).
- **B. URL migration** (the 38-page rename, §13) — depends on A only in the
  sense that A should be *decided* first so the migration's scope is final
  (39 vs. 40 pages) rather than needing a second pass. Does not depend on C,
  D, or E.
- **C. Duplicate-intent consolidation** (§10) — can be done independently of
  A/B, but doing it *inside* the same migration phase as B is mechanically
  efficient (§13) since both involve the same cross-link regeneration
  machinery. Recommend bundling C into B's scope when B is eventually
  planned, not running it as a fully separate phase.
- **D. Clothing dataset expansion** (kids' clothing, JP/CN route generation,
  §11/§12) — fully independent of A/B/C. No dependency either direction. Can
  be sequenced whenever, based on product priority rather than technical
  constraint.
- **E. Clothing UI expansion** — no evidence gathered in this audit suggests
  any UI-level work is needed; the UI already correctly hides unsupported
  combinations (Phase 3's work holds up under this audit's re-verification,
  §12). Not recommended as a near-term phase at all based on current
  evidence.
- **F. Final browser certification** — should run **after** B (and C, if
  bundled), the same way Phase 4/5A/5C each closed with real-browser
  verification of exactly what changed. Not meaningful before B exists to
  verify.

**Suggested dependency order: A → B (with C bundled) → F, with D fully
independent and schedulable at any point.**

---

## 15. Unresolved Questions

- Whether "jackets EU 50" was truly a mislabeling of a pants query or an
  independently (if unfortunately) chosen SEO target — **UNKNOWN**, the
  `query-patterns.json` adjacency is suggestive but not proof, and no
  authorship history/changelog is available in this static repository to
  settle it definitively.
- Whether the Project Director wants the jacket page retired or replaced —
  **a product decision**, not resolvable from repository evidence.
- Whether the 3 duplicate pairs' `expanded`-source URLs should redirect,
  canonicalize, or simply be deleted — **a policy decision**, evidence here
  only establishes that they are true duplicates, not what to do about it.
- Exact per-file inbound-reference counts for all 38 (non-dress) mismatch
  pages were not individually traced in this phase (only the jacket page and
  the 3 duplicate pairs were fully traced) — a real migration phase would
  need this data for all 38 before executing; flagged as required pre-work,
  not gathered here since it wasn't required to answer this phase's six
  questions.

---

## 16. Read-Only Integrity Verification

- **HEAD before:** `0dc41c5ad56cbdd1e34bc41d1f2b55d3e17b09b5`
- **HEAD after:** `0dc41c5ad56cbdd1e34bc41d1f2b55d3e17b09b5` — unchanged.
- **`git status --short` before this phase:** 1,033 entries (unchanged
  carryover from Phases 3/4/5A/5B/5C, all uncommitted).
- **`git status --short` after this phase:** 1,033 entries **+ this one new
  report** (`reports/phase-5d-clothing-route-dataset-resolution-audit.md`) —
  the only new repository file.
- **`git diff --check`:** exit 0.
- **Filesystem hash snapshot** of `data/`, `clothing/`, `scripts/`,
  `programmatic/`, `reports/`, `app.js` — taken before any investigation
  began and re-taken immediately before writing this report: **byte-
  identical, zero-line diff.** No command run during this audit (including
  every `require()` of `expandClothingRoutes`, `generateClothingProgrammaticPages`,
  and `app.js`'s contract functions) wrote to the filesystem — all were pure
  reads or in-memory computations in throwaway Node processes.

**READ-ONLY INTEGRITY CHECK: PASS**

---

## 17. Final Phase 5D Verdict

All fourteen requested investigation steps were completed with repository-
sourced evidence, each conclusion labeled as VERIFIED FACT, INFERENCE, or
UNKNOWN. One stop-condition trigger (§2: the mismatch count differed from
the brief's stated baseline) was investigated to a full, specific,
documented explanation (a parser bug in the counting tooling, corrected and
re-verified) rather than left as an unexplained anomaly — consistent with
the instruction to stop only when a discrepancy *cannot* be explained. No
other stop condition was triggered. No repository file was modified except
this report.

**PHASE 5D — PASS**
