# Phase 5C — Clothing Route Generator Remediation

**Status:** PASS. Generator source fixed, regression test added, exactly 38
affected pages regenerated via the real generator (no hand-patched HTML), all
gates green.

**Baseline commit:** `0dc41c5ad56cbdd1e34bc41d1f2b55d3e17b09b5` (unchanged —
nothing has been committed across Phases 3, 4, 5A, 5B, or 5C).

**No commit was made. No push was made.**

---

## Two scope decisions made mid-phase (both escalated, both resolved by the Project Director)

Before any code was written, implementing the brief exactly as specified
surfaced two genuine conflicts inside the brief itself. Both were escalated
rather than guessed, per Phase 5C's own STOP CONDITIONS rule ("do not
improvise... document the problem and stop").

**Decision 1 — scope of the fix (31 vs. 38 routes).** A uniform, source-level
fix to `expandClothingRoutes()` doesn't just correct the 31 routes Phase 5B
flagged as invalid — it also corrects 7 more routes that were *silently
wrong but happened to pass `isValidClothingSize` by coincidence* (the same
architecture note Phase 5B flagged for `clothing-men-pants-42-EU-to-US`, whose
old value "42" was a real EU pants size, just from a different row than
intended). There is no way to fix the bug for 31 routes while leaving these 7
untouched without adding a per-slug exception list, which the brief explicitly
forbade. **Decision: fix all 38.**

**Decision 2 — rename or keep filenames.** Correcting the size value implies
the filename should change too (e.g. `...-28-EU-to-US.html` should really be
`...-42-EU-to-US.html`, since EU 28 was never real for that garment). But a
full, correct rename requires deleting 31 old files and creating new ones —
and all 31 are referenced from `sitemaps/sitemap-medium.xml`,
`sitemaps/indexing-feed.xml`, and 50+ other clothing pages' cross-link
sections (also generated content). Fixing those references would mean
touching sitemap architecture and "unrelated" pages — both explicitly
off-limits this phase — while leaving them unfixed would ship 31 dead sitemap
entries and 50+ broken internal links. **Decision: keep all 38 filenames
unchanged** — the slug continues to embed the original `row.us` value (as
before), while the route's functional data (validation, CTA parameters,
title, description, H1, on-page conversion preview) is corrected to the true
per-direction value. This is the same tradeoff Phase 5A made for
`womens-size-8-us-to-eu-dress.html`, applied consistently. Consequence,
disclosed here and in the counts below: the filename-mismatch count rises
from 1 to 31 rather than staying at 1, because 30 more pages now carry the
same class of (already-accepted) URL/content drift the dress page has.

---

## Root Cause

**File:** `scripts/generate-phase10-pages.js`, function `expandClothingRoutes()`.

For every row in `clothing_sizes.json`'s `tops`/`pants` arrays (men and
women), the function generates four direction-pair routes:
`US→EU`, `US→UK`, `EU→US`, `UK→US`. The old code assigned:

```js
size: row.us
```

**unconditionally, for all four pairs** — correct for the two US-sourced
pairs (where `row.us` genuinely is the source value), but silently wrong for
the two reversed pairs, where the source value should have come from
`row.eu`/`row.uk` instead. This produced routes like "EU pants size 28,"
which never existed (the men's pants EU column only has 42–56); the dataset
contract correctly rejected these 32 times over (31 from this bug + the
independent jacket route), and the audit found the additional 7 cases where
the wrong value coincidentally matched a real value from a *different* row.

## Source Fix

**Old logic (conceptual):**
```
for each row:
  for each [fromRegion, toRegion] in [US→EU, US→UK, EU→US, UK→US]:
    size = row.us   // WRONG for EU→US and UK→US
```

**Corrected logic:**
```
for each row:
  for each [fromRegion, toRegion] in [US→EU, US→UK, EU→US, UK→US]:
    size = getSourceSize(row, fromRegion)   // row.us / row.eu / row.uk, matching fromRegion
    if size is null: skip this route (never substitute another region's value)
```

New helper, matching the name suggested in the brief:

```js
function getSourceSize(row, fromRegion) {
  if (fromRegion === 'US') return row.us != null ? row.us : null;
  if (fromRegion === 'EU') return row.eu != null ? row.eu : null;
  if (fromRegion === 'UK') return row.uk != null ? row.uk : null;
  return null;
}
```

Applied identically to both the `tops` and `pants` blocks. The **slug**
generation was deliberately left using `row.us` (per Decision 2 above) — only
the route object's `size` field (and everything derived from it downstream:
`description`, and — inside `generateClothingProgrammaticPages()` — title,
H1, meta description, on-page preview, and the CTA's `size` query parameter)
now uses the corrected value.

`data/clothing_sizes.json` was inspected for null/missing `us`/`eu`/`uk`
values across all 30 relevant rows (men/women × tops/pants): **zero found.**
The null-guard (`if (sourceSize == null) continue`) is therefore purely
defensive for this dataset today — it doesn't change current output count —
but prevents a future data gap from silently generating a route with a
substituted value from the wrong region.

## Regression Test

**File:** `scripts/test-clothing-route-generator.js` (new). 19 checks, 0
failures. Requires the real `expandClothingRoutes`/`getSourceSize` (exported
from `generate-phase10-pages.js` — see below) and the real `app.js` contract
functions; nothing is reimplemented.

Covers, per Step 8's explicit requirement:
- `getSourceSize()` column selection for US/EU/UK, plus null-safety (no
  substitution when a region has no data).
- All four direction pairs for representative rows in each of the four
  affected categories (men's tops, men's pants, women's tops, women's pants),
  asserting the exact expected size per direction — including a case
  (`men/pants EU→US`) where `row.us` and the correct `row.eu` are provably
  different numbers, so the test cannot pass by coincidence.
- All 120 generated routes validate under `app.isValidClothingSize` (0
  invalid, down from 32).
- Every generated slug still matches an existing on-disk filename (proves no
  accidental rename).
- No duplicate slugs.
- An explicit "regression guard" assertion that would fail if the
  implementation were reverted to `size: row.us` unconditionally.

**To make this test possible at all**, `generate-phase10-pages.js` needed a
`require.main === module` guard added (it previously ran `main()` — the full
production pipeline — unconditionally at import time, exactly like
`generate-programmatic-pages.js` already does). This was a necessary,
minimal, behavior-preserving change: running the file directly
(`node scripts/generate-phase10-pages.js`, its only production usage) is
completely unaffected; only `require()`-ing it (for testing) now safely
returns `{ expandClothingRoutes, getSourceSize }` instead of triggering a full
site regeneration.

## Affected Routes (38 total: 31 from Phase 5B's list + 7 additional)

All 38 share the exact same root cause and fix. Filenames are **unchanged**
for all 38 (Decision 2); only the functional `size` (and everything derived
from it) changed.

| Old filename (unchanged) | Old (wrong) source region/size | Correct source region/size | Target region | Correct converted value |
|---|---|---|---|---|
| clothing-men-pants-28-EU-to-US | EU 28 | EU 42 | US | 28 |
| clothing-men-pants-30-EU-to-US | EU 30 | EU 44 | US | 30 |
| clothing-men-pants-32-EU-to-US | EU 32 | EU 46 | US | 32 |
| clothing-men-pants-34-EU-to-US | EU 34 | EU 48 | US | 34 |
| clothing-men-pants-36-EU-to-US | EU 36 | EU 50 | US | 36 |
| clothing-men-pants-38-EU-to-US | EU 38 | EU 52 | US | 38 |
| clothing-men-pants-40-EU-to-US | EU 40 | EU 54 | US | 40 |
| clothing-men-pants-42-EU-to-US *(new — not in Phase 5B's 31)* | EU 42 *(coincidentally valid — really row us=42's OLD, wrong claim)* | EU 56 | US | 42 |
| clothing-women-tops-XS-EU-to-US | EU XS | EU 34 | US | XS |
| clothing-women-tops-XS-UK-to-US | UK XS | UK 6 | US | XS |
| clothing-women-tops-S-EU-to-US | EU S | EU 36 | US | S |
| clothing-women-tops-S-UK-to-US | UK S | UK 8 | US | S |
| clothing-women-tops-M-EU-to-US | EU M | EU 38 | US | M |
| clothing-women-tops-M-UK-to-US | UK M | UK 10 | US | M |
| clothing-women-tops-L-EU-to-US | EU L | EU 40 | US | L |
| clothing-women-tops-L-UK-to-US | UK L | UK 12 | US | L |
| clothing-women-tops-XL-EU-to-US | EU XL | EU 42 | US | XL |
| clothing-women-tops-XL-UK-to-US | UK XL | UK 14 | US | XL |
| clothing-women-tops-XXL-EU-to-US | EU XXL | EU 44 | US | XXL |
| clothing-women-tops-XXL-UK-to-US | UK XXL | UK 16 | US | XXL |
| clothing-women-tops-XXXL-EU-to-US | EU XXXL | EU 46 | US | XXXL |
| clothing-women-tops-XXXL-UK-to-US | UK XXXL | UK 18 | US | XXXL |
| clothing-women-pants-0-EU-to-US | EU 0 | EU 32 | US | 0 |
| clothing-women-pants-0-UK-to-US | UK 0 | UK 4 | US | 0 |
| clothing-women-pants-2-EU-to-US | EU 2 | EU 34 | US | 2 |
| clothing-women-pants-2-UK-to-US *(new)* | UK 2 *(coincidentally valid)* | UK 6 | US | 2 |
| clothing-women-pants-4-EU-to-US | EU 4 | EU 36 | US | 4 |
| clothing-women-pants-4-UK-to-US *(new)* | UK 4 *(coincidentally valid)* | UK 8 | US | 4 |
| clothing-women-pants-6-EU-to-US | EU 6 | EU 38 | US | 6 |
| clothing-women-pants-6-UK-to-US *(new)* | UK 6 *(coincidentally valid)* | UK 10 | US | 6 |
| clothing-women-pants-8-EU-to-US | EU 8 | EU 40 | US | 8 |
| clothing-women-pants-8-UK-to-US *(new)* | UK 8 *(coincidentally valid)* | UK 12 | US | 8 |
| clothing-women-pants-10-EU-to-US | EU 10 | EU 42 | US | 10 |
| clothing-women-pants-10-UK-to-US *(new)* | UK 10 *(coincidentally valid)* | UK 14 | US | 10 |
| clothing-women-pants-12-EU-to-US | EU 12 | EU 44 | US | 12 |
| clothing-women-pants-12-UK-to-US *(new)* | UK 12 *(coincidentally valid)* | UK 16 | US | 12 |
| clothing-women-pants-14-EU-to-US | EU 14 | EU 46 | US | 14 |
| clothing-women-pants-14-UK-to-US *(new)* | UK 14 *(coincidentally valid)* | UK 18 | US | 14 |

(31 rows above are the Phase 5B-known list; 7 rows marked *(new)* are the
additional coincidentally-valid cases found and fixed under Decision 1.)

## Independent P1 — NOT Touched

**`clothing/eu-50-jacket-to-us-size.html`** was explicitly left unresolved, as
instructed. Verified via real browser (§Browser Certification): the page
still shows no fabricated conversion number ("Convert EU size 50 jacket to US
men's size. Use the clothing converter below...") and its CTA still leads to
a dead end (0 result cards, error message shown). `isValidClothingSize('men',
'jackets', 'EU', '50')` remains `false` — jackets alias to letter-only "tops"
data, and no numeric EU value has ever existed for that combination. This
remains a separate P1, requiring a deliberate product/data decision (recorded
in Remaining Issues).

## Phase 5A Control — Verified Intact

**`clothing/womens-size-8-us-to-eu-dress.html`** re-tested in the real
browser: conversion preview still reads *"Convert women's UK size 8 to EU
dress size. UK 8 converts to approximately EU 36 for dresses"* and its CTA
still deep-links with `from=UK`. Untouched by this phase (it's a base route
in `clothing_routes.json`, not generated by `expandClothingRoutes()`).

## Before / After Counts

| Metric | Before | After |
|---|---|---|
| Invalid route inputs | 32 | **1** (jacket route only) |
| P1 | 32 | **1** |
| P0 | 0 | **0** |
| Conversion mismatches | 0 | **0** |
| Filename semantic mismatches | 1 | **31** *(disclosed, user-approved consequence of Decision 2 — see above)* |
| Duplicate semantic intents | 3 | **3** (unchanged, none new) |
| Orphan pages | 0 | **0** |
| Orphan routes | 0 | **0** |
| Duplicate route slugs | 0 | **0** |
| Sitemap coverage | 126/126 | **126/126** |
| Canonical coverage | 126/126 self-canonical | **126/126 self-canonical** |
| Total clothing routes generated | 120 expanded + 6 base = 126 | **126** (unchanged) |

Re-audit performed by re-running the Phase 5B audit methodology against the
post-fix state (with its route-reconstruction updated to `require()` the
real, now-fixed `expandClothingRoutes()` rather than Phase 5B's necessary
inline snapshot copy of the old logic — that inline copy was written *before*
the function was exported and would otherwise have silently tested against
stale logic).

## Browser Certification

Real Chrome (same isolated `puppeteer-core` setup used in Phases 4/5A — no
repository dependency added), against `npm run dev`. **44/44 checks passed,
zero uncaught JS exceptions.**

| Page tested | Class | Result |
|---|---|---|
| `clothing-women-tops-XS-EU-to-US.html` | women's tops, EU→US | H1/preview/CTA all show EU 34 (not the filename's "XS"); destination pre-fills `from=EU&size=34`; converts automatically; US highlighted |
| `clothing-women-pants-0-EU-to-US.html` | women's pants, EU→US | Shows EU 32; destination pre-fills correctly; converts; US highlighted |
| `clothing-women-tops-XS-UK-to-US.html` | women's tops, UK→US | Shows UK 6; destination pre-fills correctly; converts; US highlighted |
| `clothing-women-pants-0-UK-to-US.html` | women's pants, UK→US | Shows UK 4; destination pre-fills correctly; converts; US highlighted |
| `clothing-men-pants-28-EU-to-US.html` | men's pants, EU→US | Shows EU 42 (not filename's "28"); destination pre-fills `from=EU&size=42`; converts; US highlighted |
| `womens-size-8-us-to-eu-dress.html` | Phase 5A control | Still UK 8 → EU 36, unaffected |
| `eu-50-jacket-to-us-size.html` | Negative test | Still no fabricated number, still a dead-end CTA — confirmed NOT silently fixed |

## Regression Tests

```
node scripts/test-converter-contract.js         → 987 passed, 0 failed
node scripts/test-clothing-route-generator.js   → 19 passed, 0 failed  (new)
```

## Repository Changes

| File | Change |
|---|---|
| `scripts/generate-phase10-pages.js` | Root fix: `getSourceSize()` helper + `expandClothingRoutes()` uses it for `size` (slug unchanged); `require.main === module` guard added so the module is safely testable |
| `scripts/test-clothing-route-generator.js` | New — Step 16's required regression test |
| `clothing/*.html` (38 files, filenames unchanged) | Regenerated via the real `generateClothingProgrammaticPages()` (scoped write interception, same technique as Phase 5A — verified via `fs.writeFileSync` interception logs and on-disk `mtime` comparison that exactly these 38 and no others changed); footer markers normalized afterward via the existing `standardize-footer.js` tool (same post-processing gap Phase 5A encountered — the scoped generator call bypasses the full pipeline's footer pass) |

No other file was modified. `data/clothing_sizes.json`, `data/clothing_routes.json`
(Phase 5A's dress-route fix), `app.js`, sitemaps, footer architecture, AI
Citation Engine, navigation, Cloudflare config, `robots.txt`, and all other
generated pages (the other 88 clothing pages, all `programmatic-pages/`, all
`measurement/*.html`) are untouched — confirmed via `mtime` comparison across
the whole `clothing/` directory.

## Unexpected Changes

None beyond the two disclosed, user-approved scope decisions (§ above). The
footer-marker normalization on the 38 regenerated files was anticipated
(identical to a Phase 5A finding) and is not a new/unexpected class of issue.

## Remaining Issues

Explicitly not addressed in this phase, exactly as instructed:

1. **`eu-50-jacket-to-us-size.html`** — remains invalid (P1). Requires a
   deliberate decision: correct the route's intended jacket size (if
   recoverable), add real jacket-specific sizing data, or remove/redirect the
   page. 277 inbound references make this non-trivial.
2. **`womens-size-8-us-to-eu-dress.html`** retained URL slug — still the sole
   dedicated URL-migration candidate from Phase 5A/5B, unresolved.
3. **Three duplicate semantic intents** (`mens-medium-us-to-eu` /
   `clothing-men-tops-M-US-to-EU`, `mens-large-us-to-uk` /
   `clothing-men-tops-L-US-to-UK`, `womens-pants-us-6-to-eu` /
   `clothing-women-pants-6-US-to-EU`) — unchanged, no new ones introduced.
4. **Stale template wording** on 89 pages (Phase 5B finding) — factually
   correct, cosmetically outdated; not touched.
5. **Row-correspondence validator architecture note** (Phase 5B) —
   `isValidClothingSize` checks column membership, not row correspondence.
   This phase's fix makes the *generator* row-correct for all 38 affected
   routes, which closes the specific instances this note was about, but the
   underlying validator behavior itself is unchanged and the note stands as a
   general architecture observation for any future route authoring.
6. **NEW — 31 pages now carry a filename-vs-content mismatch** (Decision 2,
   disclosed above), joining the pre-existing dress-page case. All 32 are the
   same class of issue and the natural candidates for a single, dedicated,
   properly-scoped URL migration phase that also updates sitemaps and
   cross-links — not attempted here.

---

## Final Acceptance Gate — Verified

- Generator source bug fixed at the source: **yes** (`getSourceSize()` +
  corrected `expandClothingRoutes()`).
- No individual HTML patch used as the primary fix: **confirmed** — all 38
  files were produced by the real, unmodified `generateClothingProgrammaticPages()`
  function, not hand-edited.
- All 31 (+ 7 additional, per Decision 1) generator-caused invalid routes
  became valid: **confirmed**, 0 invalid among the 120 generated routes.
- Independent jacket route remains explicitly unresolved: **confirmed** via
  real browser negative test.
- Phase 5A route remains valid: **confirmed** via real browser re-test.
- Regression test prevents recurrence: **confirmed** — 19 checks, including
  an explicit guard that fails if `size: row.us` is reintroduced.
- No P0 conversion errors: **confirmed**, 0.
- No conversion mismatches: **confirmed**, 0.
- No new duplicate semantic intents: **confirmed**, still exactly 3.
- No orphan pages/routes: **confirmed**, 0/0.
- Sitemap coverage complete: **confirmed**, 126/126.
- Canonical coverage complete: **confirmed**, 126/126 self-canonical.
- Real browser tests pass: **confirmed**, 44/44.
- Phase 3 contract tests pass: **confirmed**, 987/0.
- Footer validation passes: **confirmed**.
- Link validator baseline unchanged (47) with the change explained: **confirmed** — 47, identical to Phase 3/4/5A/5B, this phase touched no files the validator's known baseline concerns.
- `git diff --check` passes: **confirmed**, exit 0.

**Not committed. Not pushed.**
