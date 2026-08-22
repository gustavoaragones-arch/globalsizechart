# Phase 7 — Brand Page UX + Content Architecture Remediation

**Baseline commit:** `50e759cdf59bed4887af1bd63e5cfde3366b17cc` (`HEAD` =
`origin/main`, working tree clean, confirmed before any modification).

---

## 1. Files Changed

| File | Type |
|---|---|
| `brands/*.html` (all 20) | Modified — regenerated body content |
| `scripts/remediate-brand-pages.js` | New — canonical source for brand-page structure |
| `scripts/test-phase-7-brand-pages.js` | New — Phase 7 automated test suite |
| `reports/phase-7-brand-page-before.json` | New — pre-implementation inventory |
| `reports/phase-7-brand-page-after.json` | New — post-implementation inventory |
| `reports/phase-7-brand-page-architecture-remediation.md` | New — this report |

No other file was modified. Verified in §12.

---

## 2. Source Architecture Discovered

Investigated the actual call path before editing, per instruction — did
not assume the Phase 6 report's script names were correct without
verification.

Traced via `grep` for the exact markers found in brand pages
(`ai-answer-block`, `ai-faq-block`, `conversion-loop`, `session-depth`,
`monetization-module`/`commercial-module`, `high-rpm-modules`):

- `scripts/ai-answer-injector.js` — writes the "Quick answer" block
- `scripts/fix-ai-layout.js` / `scripts/refactor-conversion-page-model.js` — write the "Common questions" `.ai-faq-block`
- `scripts/inject-aeo-layer.js` — writes the `.aeo-ai-layer` "Why Sizes May Vary" + "Frequently Asked Questions" block
- `scripts/revenue-engine.js` — writes `conversion-loop`, `monetization-module`
- `scripts/generate-programmatic-pages.js` — writes `next-step`, `session-depth`, `related-links`, `commercial-module`, `high-rpm-modules`, and is also the generator for **756 programmatic-pages + 120 measurement files**, confirmed via `grep -l "brands/" scripts/*.js` and cross-checked against Phase 6's own file-count findings

**Decision: did not patch these six scripts directly.** Each one also
produces output for hundreds of non-brand pages. Patching any of them
without additional per-family scoping guards would risk exactly the "a
shared source change would alter non-brand pages" condition this phase's
own instructions require stopping for (§2 of the spec). None of the six
scripts has an existing directory-scoping flag that would let them run
against `brands/` alone without also touching `programmatic-pages/` and
`measurement/`.

**Chosen architecture**: `scripts/remediate-brand-pages.js`, a new script
that is the canonical source for brand-page structure going forward,
explicitly and permanently scoped to `brands/*.html` only (`BRANDS_DIR`
hardcoded, no directory recursion). It reads each of the 20 current files,
extracts their existing genuine brand-specific content, and rewrites the
structure — it does not invent new brand claims (§15's constraint) and
does not touch any file outside `brands/`. This is documented at the top
of the script itself.

**Two page templates found**, not one, verified by comparing H1 patterns
and section structure across all 20 files before writing any code:

- **Template A** (10 files, e.g. `nike-shoe-size-chart.html`,
  `zara-clothing-size-guide.html`): has `high-rpm-modules` info cards,
  `monetization-module`/`commercial-module` pairs, `conversion-loop`,
  `next-step`, `session-depth`, a flat "Related links" list.
- **Template B** (10 files, e.g. `asics-size-guide.html`,
  `nike-size-guide.html`): simpler — no info-card grid, no monetization
  modules, three flat link-list sections ("Converters", "Size conversion
  pages", "Other brand guides").

Both templates shared the same core defects (Quick answer, dual FAQ, thin
Why-Sizes-May-Vary) and were handled by the same script with
template-aware branching.

**Also discovered, not previously documented**: 6 of the 20 files are a
*second* page for the same brand under a different filename (e.g.
`nike-shoe-size-chart.html` + `nike-size-guide.html` both exist for Nike;
similarly Adidas, Puma, New Balance, H&M, Zara). This is a separate
information-architecture question (should a brand have two pages?) outside
this phase's explicit scope (§2's IN SCOPE section is "the following brand
pages: `brands/*.html`" as they exist, not consolidating them) — flagged
in §14 as a known limitation, not acted on.

---

## 3. Exact Source Changes

`scripts/remediate-brand-pages.js` performs, per file:

1. Removes the `.ai-answer-block` ("Quick answer") entirely (§6 of spec).
2. Removes the visible intro paragraph if it's identical (or a truncated
   prefix match) to the meta description (§7).
3. Extracts existing fact sections (`Brand sizing philosophy/differences`,
   `Known inconsistencies`, `Fit tendencies/type`, `Real-world fit
   tips`/`User fit warnings`) and the union of all existing navigation
   links **before** removing any old sections, so nothing is lost before
   being evaluated for reuse.
4. Removes `.ai-faq-block` ("Common questions"), `.why-sizes-vary` (thin
   "Why Sizes May Vary"), `.conversion-loop`, `.next-step`,
   `.session-depth-modules`, the "Related links" section, and the
   "Converters"/"Size conversion pages"/"Other brand guides"/"Generic
   converters"/"Conversion comparison" list sections.
5. Consolidates `.monetization-module` + `.commercial-module` into a
   single kept aside (the longer, more substantive one of each
   near-duplicate pair), removing the rest.
6. Rewrites keyword-stuffed "Fit and sizing explained" card copy
   (`Regional Differences`, `Why Sizes Vary`, `Fit Problems Explained`) into
   concise prose (§19, §20) — Template A only, since Template B has no such
   card grid.
7. Inserts a human-written, brand-specific intro paragraph immediately
   after the H1, built from the brand's own already-existing fit-tendency
   fact (never inventing a new claim).
8. Inserts the embedded converter (§4 below) immediately after the intro.
9. Builds one unified `<section class="card nav-explore-more">` ("Explore
   more size guides") from the deduplicated union of all previously-removed
   navigation links, ranked by usefulness (converters → measurement/fit
   tools → same-category brand comparisons → explainer guides → other
   brand comparisons → specific conversion examples), excluding the
   current page's own file, capped at 7 cards, every destination verified
   to exist via `fs.existsSync` before inclusion.
10. Rebuilds exactly one FAQ (3–5 brand-specific Q&As, sourced from the
    page's own existing facts wherever possible) and regenerates the
    `FAQPage` JSON-LD **from that same data structure** — not from a
    separate source (§16/§17).

---

## 4. 20-Page Before/After Counts

Full detail in `reports/phase-7-brand-page-before.json` /
`reports/phase-7-brand-page-after.json`. Summary:

| Metric | Before | After |
|---|---|---|
| Pages with a "Quick answer" block | 20/20 | 0/20 |
| Pages with a "Common questions" block | 20/20 | 0/20 |
| Pages with a converter present | 0/20 | 20/20 |
| Pages with a standalone thin "Why Sizes May Vary" | 20/20 | 0/20 |
| Pages with more than one monetization/commercial module | 10/20 | 0/20 |
| Pages with FAQ visible-question-count == schema-question-count, 1:1 text match | 0/20 (not verifiable — 2 independent FAQ sources existed) | 20/20 |
| Distinct navigation-block types present per page | 3–6 (Template-dependent stacked systems) | 1 (`nav-explore-more`) |
| Total navigation cards across all 20 pages | n/a (unstructured link dumps) | 140 |
| Total FAQ items across all 20 pages | n/a (dual sources, inconsistent counts) | 100 (avg 5/page) |

---

## 5. Converter Implementation

Per §3/§25's hard constraint, **no new conversion engine was created**.
The embedded converter markup on each brand page is copied verbatim from
the certified dedicated converter pages: `#shoeConverter` (from
`shoe-size-converter.html`) for the 12 shoe-brand files, `#clothingConverter`
(from `clothing-size-converter.html`) for the 8 clothing-brand files —
identical field names, identical IDs, identical hidden `category` input,
so the existing `app.js` initialization/contract binds to it exactly as it
does on its original pages. No JavaScript was written or modified for this
phase; `app.js` is untouched (verified in §12).

The results panel carries an explicit non-affiliation line: *"Independent
conversion tool — not an official brand calculator."* No brand-specific
data, sizing math, or endorsement language was added anywhere.

Category assignment (12 shoe-brand files / 8 clothing-brand files) was
determined by direct verification of each brand's actual product category,
not inferred from filename patterns alone.

---

## 6. FAQ Architecture

Traced per §17 before modifying: the old architecture had the visible
"Common questions" block, the visible `.aeo-ai-layer` "Frequently Asked
Questions" block, and the `FAQPage` JSON-LD schema as **three independent
data sources**, each hand-authored or injected separately, with no shared
origin — confirmed by the fact that on the sampled Nike page, all three
had genuinely different question sets.

New architecture: one `buildFaq()` function produces a single canonical
array of `{q, a}` pairs per page (3–5 items, sourced from the page's own
pre-existing fact content wherever a genuine brand-specific fact exists,
falling back to two universal-but-legitimately-identical questions — "How
do I use this converter?" and "Why do international sizes differ?" — only
when no more specific content is available). That **one array** renders
both the visible `.faq-item` HTML and the `FAQPage` JSON-LD script tag.
Verified programmatically across all 20 files: question text and answer
text match 1:1, question-for-question, with zero mismatches (§16's
requirement).

---

## 7. Navigation Consolidation

Per §13's explicit mandate, links were inventoried before any deletion —
not blindly deleted:

- **Method**: `collectNavLinks()` extracted the union of every `href` from
  `.conversion-loop`, `.next-step`, `.session-depth-modules`,
  `.high-rpm-module`, the "Related links" list, and the three flat
  list-sections (Converters / Size conversion pages / Other brand guides),
  **before** those blocks were removed.
- **Deduplication**: by destination `href`, keeping the first-seen label.
- **Ranking**: converters (both site converters) → measurement/fit tools →
  same-category brand comparisons (a shoe page ranks other shoe brands
  above clothing brands, and vice versa) → explainer guides → remaining
  brand comparisons → specific conversion-page examples.
- **Cap**: 7 cards per page (a deliberate choice — enough to include both
  universal tools and 1–3 brand comparisons without recreating the old
  30-link dump).
- **Self-link exclusion**: a page never recommends itself (caught and
  fixed during implementation — an early version surfaced e.g.
  "nike-shoe-size-chart.html" as a nav card on that same page, inherited
  from a pre-existing self-referential link in the old "Brand Differences"
  card; excluded by filename comparison before the final version).
- **Existence verification**: every retained URL checked with
  `fs.existsSync` relative to `brands/`; any link that wouldn't resolve is
  silently excluded rather than kept. Zero were excluded this way in
  practice — the pre-existing link set was accurate.

**Link inventory** (aggregate across all 20 pages, exact per-file detail
in the before/after JSONs):

| | Count |
|---|---|
| Unique destinations before (union across old nav systems, per page, summed) | Varies per page (Template A pages: up to ~20 unique destinations across 4–6 stacked blocks; Template B: up to ~13 across 3 blocks) |
| Repeated occurrences before | High — e.g. the Nike page's own brand-comparison set (Adidas/Puma/Zara/H&M/Shein/Uniqlo) appeared in 3 separate old blocks |
| Unique destinations retained (after) | 140 total cards across 20 pages (avg 7/page), zero duplicates within any single page (verified programmatically) |
| Destinations removed | The remainder of each page's old union — primarily: cross-family bare "crawl hub"–style entries, and the >7th-ranked lower-priority items once each page's list exceeded the 7-card cap |
| Reason removed | Redundant with a higher-ranked equivalent already retained (e.g. a specific `measurement/24-cm-to-us-shoe-size.html` example dropped in favor of the general Measurement Assistant tool link), or genuinely lower relevance per the ranking in §7 above — never removed merely to shorten the page |

No new URL was invented anywhere in this process.

---

## 8. Monetization Consolidation

Traced source: `.monetization-module` (from `scripts/revenue-engine.js`)
and `.commercial-module` (from `scripts/generate-programmatic-pages.js`)
were two independently-written asides covering the same "brands deviate
from standard charts, check the official size guide" advice, present
together only on the 10 Template-A pages. Kept the longer/more complete
text of the pair (verified per-file by character length, per §21's
"select the better substantive version" instruction), removed the rest.
Zero pages now carry more than one such aside (verified in §4's table).
No new monetization or affiliate language was added.

---

## 9. Content / Tone Changes

- Every "Fit and sizing explained" card previously containing the
  keyword-stuffed fragment pattern identified in Phase 6 (`"...Japan size
  chart explained. How UK shoe sizes differ from US and EU. Conversion
  and regional comparison guide."` and its close variants across the
  `Why Sizes Vary` / `Fit Problems Explained` cards) was rewritten into one
  concise, human-toned paragraph per card. Verified absent via automated
  test (`no keyword-stuffed Regional Differences fragment pattern`).
- Every brand-page intro is now brand-specific prose built from that
  page's own previously-existing fit-tendency fact, never the meta
  description repeated, and never a single generic sentence stamped
  identically across brands (verified: 20 distinct intro strings, no two
  identical, each containing the brand name and a genuine fact specific to
  that brand).

---

## 10. Automated Test Results

`node scripts/test-phase-7-brand-pages.js`:

```
740 passed, 0 failed (across 20 brand pages)
```

37 assertions × 20 pages, covering structure, FAQ exact-match, navigation
integrity (no duplicates, no broken links, no self-links, no old
nav-system remnants), converter presence/id/positioning, and content
(no Quick Answer, no Common questions, no keyword-stuffed fragment, no
duplicate monetization text, intro ≠ meta description).

---

## 11. Existing Regression Test Results

| Suite | Result | Baseline | Status |
|---|---|---|---|
| `node scripts/test-converter-contract.js` | 987 passed, 0 failed | 987/987 | **Unchanged — PASS** |
| `npm run footer:check` | `Checked 1151 HTML files (skipped 1 without <body>). OK: all footers match master.` | clean | **Unchanged — PASS** |
| `node scripts/prebuild-link-validation.js` | Missing targets: 47 | 47 (stable pre-existing baseline) | **Unchanged — PASS**, did not increase |

---

## 12. Browser Test Results

Real Chrome (`puppeteer-core`) against the local dev server
(`npm run dev`, `http://127.0.0.1:5190`) — this is a pre-deploy
implementation-phase check, not a production certification; consistent
with how Phases 3/4/5A/5C tested before their respective commits.

**Three representative pages**, chosen per §31's criteria (a major shoe
brand, a page with substantial existing navigation, a page with different
content characteristics):

- Nike (`nike-shoe-size-chart.html`) — major shoe brand, Template A, most
  heavily-linked page in the original set
- ASICS (`asics-size-guide.html`) — Template B, simpler structure
- Zara (`zara-clothing-size-guide.html`) — clothing category (different
  converter, different content characteristics), Template A

Each tested at desktop (1440×900) and mobile (390×844): page load, H1,
introduction, converter visibility without excessive scroll, full
converter interaction (gender/category/region/size → conversion result),
single navigation section, single FAQ section, footer presence, console
errors, failed network requests.

**Result: 58 of 60 checks passed.** The 2 non-passes (`no console errors`
/ `no failed network requests`, both on Nike-desktop, the first page
tested in the browser session) were traced to a single cause: **the
repository has no `favicon.ico` file anywhere, and no page — including the
homepage — declares a `<link rel="icon">`**, so Chrome's automatic
first-request-per-origin favicon probe returns a 404. Verified this is not
a Phase 7 regression: `ls favicon.ico` confirms the file has never existed
in this repository, and `grep -i favicon index.html` confirms even the
unmodified homepage has no favicon declaration. This is a pre-existing,
site-wide condition unrelated to brand pages, disclosed here rather than
suppressed from the test.

**Transparency note on this section's own construction**: an initial
version of the browser-test script had an argument-count bug in its
`record()` helper (called with 4 arguments against a 3-parameter
signature) that caused every check to vacuously report PASS regardless of
the actual assertion. This was caught by inspecting the raw result
objects before trusting the "60/60" first run, fixed, and the suite
re-run to produce the genuine 58/60 result reported above. Disclosed for
the same reason as the monetization/nav-priority bugs below.

**Two implementation bugs were found and fixed during this phase's own
verification work, not left in the shipped result:**
1. The initial navigation-card priority ranking used a regex
   (`/converter\.html$/`) that also matched brand-specific files like
   `hm-size-converter.html`, incorrectly ranking them equal to the genuine
   site-wide converters. Fixed to match only the two canonical converter
   filenames exactly.
2. The initial navigation build surfaced a page's own file as one of its
   "Explore more" cards (inherited from a pre-existing self-referential
   link in the old content). Fixed with an explicit self-link exclusion,
   now covered by a permanent test assertion.

---

## 13. Content Quality Gate

Manually inspected the **rendered structure** (not only raw HTML) of Nike,
Adidas, and ASICS by reading the generated files in full and cross-checking
against the browser-test evidence above. Each now reads as: H1 → a
brand-specific one-sentence introduction → a working converter (visibly
the primary element on the page) → 3 concise fact sections → an
info-card grid with rewritten, non-keyword-stuffed copy → one consolidated
fit-guidance aside → one navigation card block → one FAQ → the master
footer. None of the three feels like a link farm, an AI-answer page, or a
crawl hub — the converter is now unambiguously the page's primary action,
consistent with §35's stated goal.

---

## 14. Diff-Scope Verification

```
git status --short
 M brands/adidas-eu-to-us-shoe-sizing.html
 M brands/adidas-size-guide.html
 M brands/asics-size-guide.html
 M brands/asos-size-guide.html
 M brands/converse-size-guide.html
 M brands/hm-size-converter.html
 M brands/hm-size-guide.html
 M brands/levis-jeans-size-guide.html
 M brands/new-balance-shoe-size-chart.html
 M brands/new-balance-size-guide.html
 M brands/nike-shoe-size-chart.html
 M brands/nike-size-guide.html
 M brands/puma-shoe-size-chart.html
 M brands/puma-size-guide.html
 M brands/reebok-size-guide.html
 M brands/shein-size-converter.html
 M brands/uniqlo-size-guide.html
 M brands/vans-size-guide.html
 M brands/zara-clothing-size-guide.html
 M brands/zara-size-guide.html
?? reports/phase-7-brand-page-after.json
?? reports/phase-7-brand-page-before.json
?? scripts/remediate-brand-pages.js
?? scripts/test-phase-7-brand-pages.js
```

Exactly the 20 brand HTML outputs + the Phase 7 source/test scripts +
the two required inventory reports. No `app.js`, no `data/*.json`, no
`clothing/*.html`, no `measurement/*.html`, no `programmatic-pages/*.html`,
no `index.html`, no shoe-conversion-chart, no regional hubs, no sitemap
files, no `_redirects`, no footer files. **Confirmed clean.**

---

## 15. Known Limitations

- **Duplicate brand pages** (6 brands have two separate files each — Nike,
  Adidas, Puma, New Balance, H&M, Zara) were both independently
  remediated to the same standard, but whether a brand should have two
  separate pages at all is an information-architecture question outside
  this phase's scope. Flagged, not acted on.
- **Navigation card copy is templated**, not individually hand-tuned per
  destination beyond the `describeDestination()` lookup table — the
  descriptions are accurate and non-keyword-stuffed, but not as bespoke as
  the brand-specific intro/FAQ content.
- **Browser testing covered 3 of 20 pages** (both templates, both
  categories, the most link-dense page) — not all 20 individually
  browser-tested, consistent with §31's explicit "at minimum 3" scope.
  The remaining 17 were verified structurally (§10, 740/740 assertions)
  but not interactively in a real browser.
- **This phase did not verify against Google's structured-data testing
  tool** — the FAQ schema/visible exact-match was verified programmatically
  (string equality), which satisfies this phase's own requirement, but a
  full Rich Results Test run was not performed.
- **The `favicon.ico` gap (§12) is a genuine, separate, pre-existing site
  issue** worth fixing in a future phase — flagged, not fixed here, since
  it's unrelated to brand pages and out of this phase's scope.

---

## 16. Final Gate

| Hard-stop condition | Status |
|---|---|
| Converter logic modified | **No** — `app.js` untouched, verified in diff scope |
| Conversion datasets changed | **No** — `data/*.json` untouched |
| Clothing routes changed | **No** — `clothing/` untouched |
| Unrelated page families changed unexpectedly | **No** — diff scope confirmed exactly `brands/` + Phase 7 scripts/reports |
| FAQ visible/schema mismatch remains | **No** — 20/20 exact match, verified programmatically |
| More than one FAQ remains on any brand page | **No** — 20/20 exactly one |
| Quick Answer remains on a brand page | **No** — 0/20 |
| Navigation duplication remains | **No** — 20/20 exactly one unified navigation block, zero in-page duplicate destinations |
| Broken navigation URLs introduced | **No** — 140/140 verified to exist |
| Browser converter interaction fails | **No** — conversion succeeded on all 6 tested page/viewport combinations |
| Existing converter contract tests fail | **No** — 987/987 unchanged |
| Footer check fails | **No** — clean |
| Link validator worsens | **No** — 47, unchanged from baseline |
| Unexpected generated files changed | **No** |

**No hard-stop condition was triggered.**

---

# PHASE 7 — PASS

All required gates pass. 20/20 brand pages now have an embedded,
certified converter as the primary above-the-fold action; exactly one
FAQ per page with exact schema/visible match; one unified navigation
block replacing the prior 3–6 stacked systems; no Quick Answer; no
duplicate monetization content; rewritten, non-keyword-stuffed
explanatory copy. `app.js`, datasets, clothing routes, and every
non-brand page family are unmodified.

Not committed or pushed yet — proceeding to the git discipline sequence
next, per §38.
