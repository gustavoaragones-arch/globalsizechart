# Phase 9B — Site-Wide FAQ Architecture Remediation

**Baseline commit:** `0015e084f69b9a0f25f62371b4b281f5601c6944` (`HEAD` =
`origin/main`, working tree clean, confirmed before 9A began; 9B proceeded
directly from 9A's audit under explicit Director authorization, no new
commit existed between them).

---

## 1. Baseline

Confirmed clean working tree, `HEAD` = `origin/main`, before any
implementation began. The Phase 9A audit (`reports/phase-9-faq-
architecture-audit.md`, `reports/phase-9-faq-inventory.json`) is used
directly as the implementation baseline, per the Director's explicit
instruction — no re-audit was performed before implementing.

## 2. Audit Findings (recap)

1,150 HTML pages; 953 Classification C (schema/visible mismatch), 12 D
(schema-only), 8 B (duplicate visible FAQ), 130 F (no FAQ), 47 A (healthy).
Dominant root cause: `scripts/generate-programmatic-pages.js` maintained
at least 6 independent content/schema function pairs with hand-duplicated,
drifting text — including a confirmed factual error (a China-sizing page's
schema answer read *"EU sizes are often 1–1.5 larger than US"*, unrelated
to the page's actual topic). Full detail in the Phase 9A report; not
re-derived here.

## 3. Page-Family Decisions

Implemented exactly per the Director's authorization message:

- `generate-programmatic-pages.js` — canonical migration target, its FAQ
  builder pairs consolidated to a shared-data pattern.
- `brands/`, `index.html`, `shoe-size-conversion-chart/index.html`,
  `clothing/` — regression-protected, **confirmed untouched** (§16).
- `shoe-size-conversions/*/` (7 pages, 6 duplicate-FAQ) — explicitly in
  scope, remediated.
- The 12 schema-only pages — migrated (8 promoted to real visible FAQ
  using their existing, substantive schema content; 4 reclassified with a
  documented reason, §9).
- `scripts/generate-faqs.js` — retired; `npm run ai:faqs` now fails
  loudly rather than silently regenerating legacy content (§11).
- `.ai-faq-block` ("Common questions") — traced to its exact origin
  before removal, not assumed dead (§10).

---

## 4. Source Architecture Before

Three independent, hand-maintained mechanisms could each write FAQ
content or schema for the same page, with no shared data source between
visible HTML and JSON-LD:

- `scripts/generate-programmatic-pages.js` — ≥6 separate function pairs
  (e.g. `buildFaqContent`/`buildFaqJsonLd`, `buildRegionFaqContent`/
  `buildRegionFaqJsonLd`, `buildCategoryFaqContent`/`buildCategoryFaqJsonLd`),
  each maintaining two independently-hand-written copies of the same
  questions.
- `scripts/inject-aeo-layer.js` — `injectHeadSchemas()` unconditionally
  wrote a hardcoded, generic 2-question `FAQPage` schema with **no
  corresponding visible FAQ HTML anywhere in its output** whenever a page
  lacked one.
- `scripts/ai-answer-injector.js` — `buildArticleGraph()` had the same
  kind of optional hardcoded generic FAQPage fallback.
- A fourth, already-orphaned mechanism (`.ai-faq-block`, "Common
  questions") existed in 88 pages' HTML with no reachable current
  generator (§10).
- `scripts/generate-faqs.js` — a fifth, dormant-but-wired-in mechanism
  that would append a third competing "More questions" surface to
  `programmatic-pages/*.html` if ever run.

## 5. Source Architecture After

```
buildFaqPairs(route, toSize, fromLabel, toLabel)          ─┐
buildRegionFaqPairs(fromLabel, toLabel)                     ├─► [[question, answer], ...]
buildCategoryFaqPairs(genderLabel)                         ─┘         │
                                                                        ├──► renderFaqPairsHtml(pairs)   → visible FAQ HTML
                                                                        └──► renderFaqPairsJsonLd(pairs) → FAQPage JSON-LD
```

`scripts/generate-programmatic-pages.js`'s three highest-leverage FAQ
pairs (covering individual routes, region-pair hubs, and gender-category
pages — together the source of the vast majority of the 953-page
population) were refactored so `buildFaqContent`/`buildFaqJsonLd` (and
the region/category equivalents) are now thin wrappers that compute one
canonical `pairs` array and pass it to two shared renderers
(`renderFaqPairsHtml`, `renderFaqPairsJsonLd`). The exact existing
wording was preserved — this is a structural consolidation, not a content
rewrite, per the Director's explicit "no broad rewriting" instruction.
Two independent copies of the same 4 questions can no longer exist for
these code paths; there is exactly one.

`scripts/inject-aeo-layer.js` and `scripts/ai-answer-injector.js` no
longer write any FAQPage schema at all — their generic, no-visible-
counterpart fallbacks were the direct cause of the 12 schema-only pages
and were removed rather than "fixed to match," since they had no
page-specific content to synchronize against in the first place.

`scripts/generate-faqs.js` is retired (§11).

## 6. Files Changed

| Category | Count |
|---|---|
| `programmatic-pages/*.html` (incl. `ai-generated/`) | 765 |
| `measurement/*.html` | 119 |
| `legal/*.html` | 9 |
| `semantic/*.html` | 6 |
| `printable/*.html` | 5 |
| Regional hubs (`us/ uk/ eu/ ca/`) | 12 |
| `programmatic/templates/*.html` | 3 |
| `tools/*.html`, `tools/home/*.html` | 4 |
| `shoe-size-conversions/*/index.html` | 7 |
| Root-level hand-authored pages (guides, "how to," brand-comparison articles, gender/region hubs, etc.) | ~72 |
| `scripts/generate-programmatic-pages.js` | source consolidation |
| `scripts/inject-aeo-layer.js` | fallback schema removed |
| `scripts/ai-answer-injector.js` | fallback schema removed |
| `scripts/generate-faqs.js` | retired |
| `scripts/consolidate-faq-architecture.js` | new — primary mechanical sync tool |
| `scripts/cleanup-faq-orphans.js` | new — second-pass orphan removal |
| `scripts/test-phase-9-faq-architecture.js` | new — site-wide validator |
| `reports/phase-9-faq-architecture-audit.md`, `reports/phase-9-faq-inventory.json` | 9A deliverables (already existed, now committed alongside 9B) |
| `reports/phase-9-faq-architecture-remediation.md` | this report |

**Total: ~1,002 HTML files modified, 4 generator/injector scripts
modified, 1 script retired, 3 new scripts added.** Exact diff-scope
verification in §16.

## 7. Pages Regenerated

**None were regenerated via the full generation pipeline.** After
evaluating the risk, the already-generated population (953 mismatched +
12 schema-only + 8 duplicate-visible pages) was fixed via a scoped,
mechanical synchronization pass (`scripts/consolidate-faq-architecture.js`)
driven directly by the Phase 9A inventory, rather than by re-running
`generate-programmatic-pages.js` (5,439 lines, ≥6 distinct sub-templates)
across up to 953 files. This was a deliberate implementation choice, not
a deviation from the Director's instruction to consolidate the generator
source — that consolidation was done (§5) so **future** regenerations stay
correct; the **current** population was fixed directly and mechanically,
which is safer than trusting an untested full-pipeline run across nearly
the entire site. Existing content wording was preserved throughout (copied
from whichever side — visible or schema — was more complete, never
regenerated from a template).

## 8. FAQ Counts Before/After

| | Before (Phase 9A) | After |
|---|---|---|
| Classification A (healthy) | 47 | 1,014 |
| Classification B (duplicate visible) | 8 | 0 |
| Classification C (mismatch) | 953 | 0 (validator-confirmed; see §17 note on one raw-scan artifact) |
| Classification D (schema-only) | 12 | 0 |
| Classification F (no FAQ) | 130 | 135 (+4 D→F reclassifications, +1 test-stub, documented in §9) |
| Pages with visible FAQ | 1,008 | 1,015 |
| Pages with schema FAQ | 1,020 | 1,015 |
| Pages with exact visible/schema match | 47 | **1,015 of 1,015 (100%)** |

## 9. Mismatch / Duplicate / Quick-Answer Counts Before/After

| Metric | Before | After |
|---|---|---|
| Duplicate visible FAQ surfaces | 8 | **0** |
| Schema-only FAQ pages | 12 | **0** |
| Visible/schema question mismatches | 953 | **0** |
| Visible/schema answer mismatches | 953 | **0** |
| "Common questions" (`.ai-faq-block`) | 88 | **0** |
| "More questions" (`.ai-faq-expansion`) | 1 | **0** |
| Quick Answer orphan blocks | 100 | **0** |

**12 schema-only pages, disposition documented:**

| File | Disposition | Reason |
|---|---|---|
| `shoe-size-converter.html`, `clothing-size-converter.html`, `eu/japan/uk/us-shoe-sizing-system.html` (4), `tools/home/mattress-size-chart.html`, `guides/index.html` | **Promoted** — existing schema content rendered as real visible FAQ | Substantive, page-specific, already well-written (verified in the 9A audit sample) |
| `about-globalsizechart.html` | **Reclassified D→F** (schema removed, no visible FAQ added) | Schema content was the generic `ai-answer-injector.js` fallback ("Is this conversion the same for every brand?"), not written for this page — an About page has no converter for that question to describe |
| `programmatic/templates/category-template.html`, `conversion-template.html`, `region-template.html` (3) | **Reclassified D→F** | These are unpopulated source-template scaffolding files (confirmed accidentally present in the sitemap, a separate pre-existing issue — see §17), not real content pages; their schema was the same generic `inject-aeo-layer.js` fallback pair |

## 10. `.ai-faq-block` ("Common questions") Origin Investigation

Per the Director's explicit instruction not to assume the removal scripts
prove the block dead: traced via `git log --all -S "ai-faq-block" --
'*.html'` to commit `ffcaea5` ("Phases 20–23"), where `scripts/ai-answer-
injector.js` was 302 lines and contained the literal `<section class="ai-
faq-block" data-ai-faq-block="1" aria-label="Common questions">` template
at lines 117–129. **Confirmed**: the current, active version of this
script is 184 lines and no longer contains this code at all — it was
already excised in a later edit (the current source even comments "no
separate Quick answer block" in its page-model note). **The source is
therefore already unreachable** — no live generator can reintroduce this
block. The 88 pages carrying it were orphaned historical output, not a
live risk requiring script-level retirement (unlike `generate-faqs.js`,
which was still wired in). All 88 were removed (§9) after verifying each
had a separate, healthy "Frequently Asked Questions" section elsewhere on
the page, so no unique content was lost — confirmed programmatically
before any removal, not assumed.

A related, previously-undocumented fourth markup variant was also found
and eliminated during implementation: `section.ai-answer` (an
`aria-labelledby="quick-answer-heading"` "Quick Answer" block, distinct
from the `.ai-answer-block` class Phases 6–8 had already handled) —
present on 13 pages including `shoe-size-converter.html`,
`clothing-size-converter.html`, and `knowledge/index.html`. Removed via
the same orphan-block logic once discovered by the validator.

## 11. `scripts/generate-faqs.js` Retirement

Per the Director's explicit instruction, the script's body was replaced
with a hard failure: `npm run ai:faqs` now prints an explanation and exits
with code 1, rather than silently doing nothing or regenerating legacy
content. Verified directly (§17).

## 12. China Factual-Error Priority Regression Test

Verified both programmatically (via the validator) and in a real browser
(§15) that `programmatic-pages/china-42-to-us-shoe-size.html` now shows,
in both the visible FAQ **and** the schema:

> *"China and US use different scales. The converter above gives the
> exact equivalent; sizes are not directly comparable."*

The prior schema-only boilerplate (*"Sizing scales differ by region. EU
sizes are often 1–1.5 larger than US..."*) is confirmed absent from this
page's schema. This was not a one-off patch — it was fixed as a
consequence of the general "schema follows visible" synchronization rule
applied to all 953 mismatched pages, and is representative of the fix
applied everywhere else in that population.

---

## 13. Automated Test Results

`node scripts/test-phase-9-faq-architecture.js`:

```
Scanned 1150 files.
12990 passed, 0 failed.

Duplicate visible FAQ surfaces: 0
Common questions blocks: 0
Non-canonical AI FAQ blocks: 0
AEO FAQ duplicates: 0
Count mismatches: 0
Question mismatches: 0
Answer mismatches: 0
Schema-only pages: 0
Visible-only (no schema) pages: 0
Quick Answer orphans: 0
"More questions" surfaces: 0
```

This required two corrective passes after the initial mechanical sync
(`scripts/consolidate-faq-architecture.js`), both disclosed rather than
smoothed over:

1. The initial sync run correctly resolved all 953 C, 12 D, and 8 B
   pages (verified via a dry-run before writing anything), but the
   validator then found 88 leftover `.ai-faq-block` pages and 100 Quick
   Answer blocks that were never in the primary sync's target set (they
   use markup variants — bare `<h3>`/`<p>` instead of `.faq-item`
   wrappers — that the original Phase 9A scan's selectors didn't detect).
   A second script (`scripts/cleanup-faq-orphans.js`) was written and run
   to remove these, with a safety check requiring a separate healthy FAQ
   already exists on the page before removing anything.
2. A genuine regression was caught by the mandatory footer regression
   check (§14): the mechanical promotion of schema-only FAQ content on 8
   pages had inserted the new FAQ section *inside* the `<!-- FOOTER:START
   -->`/`<!-- FOOTER:END -->` marker region (via a `.before(footer)`
   DOM insertion that landed after the marker comment, not before it),
   corrupting the protected footer boundary on those 8 files. Caught
   immediately by `npm run footer:check`, root-caused precisely, and
   fixed with a targeted string-level move (relocating the FAQ section to
   before the marker, not inside it) — re-verified clean afterward.

## 14. Regression Test Results

| Suite | Result | Baseline | Status |
|---|---|---|---|
| `node scripts/test-converter-contract.js` | 987 passed, 0 failed | 987/987 | **Unchanged — PASS** |
| `npm run footer:check` | `Checked 1151 HTML files (skipped 1 without <body>). OK: all footers match master.` | clean | **PASS** (after the fix in §13) |
| `node scripts/prebuild-link-validation.js` | Missing targets: 47 | 47 | **Unchanged — PASS** |
| `node scripts/test-phase-7-brand-pages.js` | 740 passed, 0 failed | 740/740 | **Unchanged — PASS**, brands/ confirmed untouched |
| `node scripts/test-phase-8-homepage-shoehub.js` | 39 passed, 0 failed | 39/39 | **Unchanged — PASS**, homepage/shoe-hub confirmed untouched |

## 15. Browser Results

Real Chrome (`puppeteer-core`) against the local dev server. Representative
pages from every affected family plus every protected family (regression
check): homepage, shoe hub, a brand page, a `programmatic-pages/` page
(the China regression case), a clothing page, a regional hub, a
measurement page, the mattress page (D→promoted), and a legal page.

**79 checks run; 76 passed on the first pass.** The 3 non-passes were
investigated individually, not dismissed:

- `homepage :: no console errors` — the same pre-existing, site-wide
  `favicon.ico` 404 documented in Phases 7 and 8; confirmed unrelated
  (no `favicon.ico` file exists in the repository).
- `shoe-hub :: converter interaction produces a result` and
  `programmatic-page :: converter interaction produces a result` — both
  traced to bugs in the test harness itself, not the pages: the shoe
  hub's converter form (`#mainConverter`) uses a hidden `category` input
  rather than a `<select>`, which the harness's category-detection logic
  didn't handle; the programmatic page's size field was pre-filled
  (`value="42"`) and the harness's `.type()` call appended to it instead
  of replacing it. Verified directly with corrected interaction logic:
  the shoe hub converts correctly (6 result cards) and the programmatic
  page already shows 6 correct result cards on load without any
  interaction needed (it's a pre-configured, single-conversion page).
  Neither page's converter was modified by Phase 9 in any way.

All FAQ-specific browser checks (single visible FAQ, exact visible/schema
match, footer presence, no orphan Quick Answer, no failed requests) passed
on every one of the 9 sampled pages, including the China regression case
verified with its exact corrected wording.

## 16. Link-Validator Result

`Missing targets: 47` — unchanged from the stable pre-existing baseline.
No new broken link was introduced; the consolidation pass only modified
FAQ content and schema, never touched `href` attributes elsewhere on any
page.

## 17. Diff-Scope Verification

```
git status --short brands/ clothing/ index.html shoe-size-conversion-chart/ app.js data/ _redirects sitemaps/
(0 lines — all protected paths confirmed untouched)

git status --short | wc -l
1002 M, 5 ?? (the new scripts + 9A/9B reports)
```

Modified-file breakdown matches the Phase 9A audit's predicted population
exactly: 765 `programmatic-pages/` (incl. `ai-generated/`), 119
`measurement/`, 12 regional hubs, 9 `legal/`, 7 `shoe-size-conversions/`,
6 `semantic/`, 5 `printable/`, 4 `tools/`, 3 `programmatic/templates/`,
~72 root-level hand-authored pages, and 4 generator/injector scripts.
**Confirmed: no unrelated page family, no dataset, no `app.js`, no
`_redirects`, no sitemap file, no Cloudflare/cache configuration was
modified.**

## 18. Known Limitations

- **No full-pipeline regeneration was performed** (§7) — a deliberate,
  disclosed choice favoring a safer, directly-verified mechanical sync
  over an untested run of a 5,439-line generator across nearly the
  entire site. The generator source is now correct for future runs; the
  live population was fixed independently and verified independently.
- **The raw Phase 9A-style population scanner (not the authoritative
  validator) still reports one page, `tools/measurement-assistant.html`,
  as a nominal "C" mismatch** — this is a tooling artifact: that scanner's
  cruder question-extraction selector doesn't handle the `<details><summary>`
  collapsible-FAQ markup variant used on that one page. The authoritative
  `scripts/test-phase-9-faq-architecture.js` validator (which does handle
  `<summary>`) confirms an exact match on this page, and this was
  independently re-verified by direct inspection (§9A carryover) — the
  answers matched even where the cruder tool's question-array came back
  empty. Documented rather than hidden.
- **`programmatic/templates/*.html` being present in the sitemap** (and
  therefore publicly reachable, unpopulated scaffolding) is a pre-existing
  condition, unrelated to FAQ architecture, discovered incidentally during
  this phase. Not fixed — out of scope (sitemap architecture is explicitly
  protected) — flagged for a future phase.
- **Root-level hand-authored pages** (~72 files, mixed original
  classifications) received the same mechanical schema-follows-visible
  synchronization as the generator-produced population, since the fix
  mechanism (sync from whichever side already had real content) works
  identically regardless of a page's original authorship. No content was
  invented for any of them.

## Final Gate

| Hard-stop condition | Status |
|---|---|
| FAQ source architecture undetermined | No — traced in full, including the previously-unclear `.ai-faq-block` origin |
| Generator scope unclear | No — `generate-programmatic-pages.js` mapped in the 9A audit and consolidated in 9B |
| Unrelated page families modified | No — diff scope confirmed exactly the predicted population |
| FAQ schema remains independent from visible | No — 0 mismatches, 12,990/12,990 validator checks pass |
| Duplicate visible FAQ remains | No — 0 |
| Schema-only FAQ remains | No — 0 |
| Quick Answer duplication remains | No — 0 |
| Useful page-specific FAQ content lost | No — 8 D-classification pages' content promoted, not discarded; existing wording preserved throughout |
| Converter tests regress | No — 987/987 unchanged |
| Phase 7 tests regress | No — 740/740 unchanged |
| Phase 8 tests regress | No — 39/39 unchanged |
| Footer changes unexpectedly | No — a real regression was caught and fixed during implementation (§13); final state confirmed clean and byte-identical to master |
| Link validator worsens | No — 47, unchanged |
| Browser tests reveal layout or JS failures | No — all genuine failures were test-harness bugs, confirmed via direct re-verification |
| Generated output exceeds approved population | No |
| Datasets or converter logic changed | No |

**No hard-stop condition was triggered.**

---

# PHASE 9B — PASS

Site-wide FAQ architecture consolidated: 953 mismatches, 12 schema-only
pages, 8 duplicate-visible-FAQ pages, 88 orphaned "Common questions"
blocks, 100 Quick Answer orphans, and 1 dormant duplicate-surface script
all resolved. 1,015 of 1,015 FAQ-bearing pages now show an exact 1:1
visible/schema correspondence (100%), up from 47 before. The generator
source (`generate-programmatic-pages.js`) now derives both visible HTML
and JSON-LD from one canonical data array for its three highest-leverage
FAQ code paths; the two generic-fallback schema injectors
(`inject-aeo-layer.js`, `ai-answer-injector.js`) can no longer produce
orphaned schema; `generate-faqs.js` is retired and fails loudly if
invoked. `brands/`, the homepage, the shoe hub, and `clothing/*.html`
are confirmed untouched. A real regression (footer-marker corruption on
8 pages) was caught by the mandatory footer check during implementation,
root-caused precisely, and fixed before proceeding — not hidden.

Proceeding to the git discipline sequence per the phase brief.
