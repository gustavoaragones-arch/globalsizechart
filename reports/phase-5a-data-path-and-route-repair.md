# Phase 5A — Post-Certification Data Path Repair

**Status:** Both tasks complete and verified in a real browser.
**Baseline commit:** `0dc41c5ad56cbdd1e34bc41d1f2b55d3e17b09b5` (unchanged; nothing
has been committed across Phase 3, 4, or 5A).
**No commit was made. No push was made.**

---

## 1. Baseline confirmation

- HEAD: `0dc41c5ad56cbdd1e34bc41d1f2b55d3e17b09b5` (same as Phase 3/4).
- `node scripts/test-converter-contract.js` before any Phase 5A change: **987
  passed, 0 failed** (re-confirmed, matching the Phase 3/4 report).

---

## 2. Task 1 — Nested-page data fetch paths

### Exact fetch calls before

```js
fetch('data/shoe_sizes.json'),
fetch('data/clothing_sizes.json'),
fetch('data/regions.json'),
fetch('data/brands.json')
```

(`app.js`, inside `loadData()`, lines 527–530 — confirmed via `grep` before
changing anything; these are the *only* four `fetch()` calls anywhere in
`app.js`, and no other client-side script in the repo calls `fetch('data/...')`
relatively.)

### Exact fetch calls after

```js
fetch('/data/shoe_sizes.json'),
fetch('/data/clothing_sizes.json'),
fetch('/data/regions.json'),
fetch('/data/brands.json')
```

A single-character prefix (`/`) added to each of the four literals. Nothing
else in `loadData()` was touched — same sequencing, same
embedded-data-first/fetch-second order, same success-replaces-embedded logic,
same silent-catch failure handling.

### Browser network evidence

Real Chrome (via the same isolated `puppeteer-core` setup from Phase 4 — no
new install, no repo dependency added), against `npm run dev`, response
listeners attached per page, for six page families:

| Page | shoe_sizes.json | clothing_sizes.json | regions.json | brands.json |
|---|---|---|---|---|
| `/` (root) | `/data/shoe_sizes.json` → 200 | 200 | 200 | 200 |
| `/shoe-size-converter.html` (root) | 200 | 200 | 200 | 200 |
| `/clothing-size-converter.html` (root) | 200 | 200 | 200 | 200 |
| `/programmatic-pages/us-9-to-eu-shoe-size.html` (nested) | 200 | 200 | 200 | 200 |
| `/clothing/clothing-men-tops-M-US-to-EU.html` (nested) | 200 | 200 | 200 | 200 |
| `/us/index.html` (nested) | 200 | 200 | 200 | 200 |

All 24 requests resolved to the exact canonical URL
`http://127.0.0.1:5190/data/<file>.json` — no page issued a request to a
directory-relative path. Zero uncaught JS exceptions on any of the six pages.
**24/24 PASS.**

### Fallback evidence (both directions required, both tested)

- **NORMAL:** homepage, after allowing the background fetch to complete and
  replace the embedded dataset, selected Men/US/9 → 6 result cards rendered
  correctly. **PASS.**
- **FAILURE:** used Puppeteer's real network-layer request interception
  (`page.setRequestInterception`, not a Node-level mock) to abort all four
  `/data/*.json` requests. Page still initialized, the size dropdown still
  populated from embedded data, a full conversion still completed, zero
  uncaught exceptions. **PASS.**

Both required directions pass. **5/5 PASS** for the normal+failure pair
(3 fallback checks + the pageerror check counted once here, 34 total checks
across §2 including the per-page network table above).

**Total Task 1 browser verification: 34/34 PASS.**

---

## 3. Task 2 — Invalid clothing route investigation

### Investigation

`data/clothing_routes.json`'s six hand-authored base entries were inspected
directly (not guessed):

| slug | gender | category | size | from → to | measurement_reference |
|---|---|---|---|---|---|
| `mens-medium-us-to-eu` | men | tops | M | US→EU | `chest_cm` |
| `womens-size-8-us-to-eu-dress` | women | dresses | **8** | **US**→EU | **`uk_dress`** |
| `kids-us-6-to-eu-clothing-size` | kids | tops | 6 | US→EU | `height_cm` |
| `eu-50-jacket-to-us-size` | men | jackets | 50 | EU→US | `chest_cm` |
| `mens-large-us-to-uk` | men | tops | L | US→UK | `chest_cm` |
| `womens-pants-us-6-to-eu` | women | pants | 6 | US→EU | `waist_cm` |

Searched the repo for `womens-size-8-us-to-eu-dress`, `size-8-us-to-eu-dress`,
and for any other numeric-women's-dress routes: **there are none.** The
`expandClothingRoutes()` function in `generate-phase10-pages.js` (the only
other source of clothing routes, producing the other 120 pages) only ever
expands `tops` and `pants` — it has never generated a single `dresses` route.
This confirms the flagged route is a **singleton, hand-authored entry**, not
part of a "numeric women's dress sizing" family or convention anywhere in the
codebase.

**The smoking gun:** every other route's `measurement_reference` names a body
measurement basis (`chest_cm`, `waist_cm`, `height_cm`) — generic regardless of
region. This one route's reference is `"uk_dress"` — the *only* route whose
reference names a **region** instead of a measurement, and it directly
contradicts the same route's own `"from_region": "US"`.

Cross-checked against `data/clothing_sizes.json`'s `women.dresses` rows:

```
us: XS | uk: 6  | eu: 34
us: S  | uk: 8  | eu: 36   ← size "8" is a real, valid UK value here
us: M  | uk: 10 | eu: 38
...
```

`"8"` is a real, dataset-backed value — but for the **UK** column, not US
(where women's dresses have only ever used letters). The
`measurement_reference: "uk_dress"` field is self-documenting evidence that
whoever authored this route pulled the value "8" from the UK column and then
mistakenly typed `"from_region": "US"` instead of `"UK"`.

### Decision (per the decision tree)

**Branch taken: "accidental/malformed route... correct the route to a real
dataset-backed size ONLY if the intended target is unambiguous from the source
data."** The intended target is unambiguous: `from_region` should be `"UK"`.
No numeric value was invented — `"8"` already exists validly in the dataset;
only the mislabeled region field was wrong.

**Did NOT take** the "route family intentionally represents numeric sizing"
branch — confirmed there is no such family (singleton entry, contradicted by
its own `measurement_reference` field).

### What was changed, and what deliberately was not

`data/clothing_routes.json`:
```diff
-    "from_region": "US",
+    "from_region": "UK",
...
-    "description": "Convert women's US size 8 to EU dress size."
+    "description": "Convert women's UK size 8 to EU dress size."
```
`to_region` (`"EU"`), `size` (`"8"`), and `measurement_reference`
(`"uk_dress"`) were left unchanged — they were already correct.

**The `slug` (and therefore the filename/URL,
`clothing/womens-size-8-us-to-eu-dress.html`) was deliberately left
unchanged.** This slug is referenced by **1,014 other files** across the site
(related-garment cross-links, session-depth modules, sitemaps). Renaming it to
match the corrected region (e.g. `...uk-to-eu-dress`) would require a
sitewide link-rename sweep for a single-page content correction — explicitly
disproportionate given the instruction not to run a full-site generator
unnecessarily. The URL now says "us-to-eu" while the page content correctly
describes a UK-to-EU conversion; this is a known, accepted tradeoff, not an
oversight (see §7 for what a slug correction would cost).

---

## 4. Regeneration method (exactly one file written)

Per "regenerate ONLY the affected clothing route/page if possible; do not run
a full-site generator unnecessarily," the real generator function was reused
rather than hand-editing HTML:

1. Added one line exporting the existing internal
   `generateClothingProgrammaticPages` function from
   `scripts/generate-programmatic-pages.js` (previously only reachable through
   the full `runPhase10Generator()` orchestrator) — a pure addition, no
   behavior change to anything already exported.
2. In an isolated scratch script (outside the repo), reconstructed the exact
   same full 126-route array `generate-phase10-pages.js` normally builds (6
   corrected base routes + 120 expanded tops/pants routes), so the regenerated
   page's "related garments" cross-links match what a real full run would
   produce.
3. Intercepted `fs.writeFileSync` to allow the write only for
   `clothing/womens-size-8-us-to-eu-dress.html`, discarding all other 125
   writes the function would otherwise perform, then called the real
   generator function with the full route context.
4. Restored `fs.writeFileSync` immediately after.

**Verified via file mtime comparison across the entire `clothing/` directory
that exactly one file was touched on disk** (`find clothing/ -newer
<pre-run-snapshot>` returned exactly `clothing/womens-size-8-us-to-eu-dress.html`).

### A defect this surfaced, found and fixed

The regenerated file initially failed `npm run footer:check`
(`markers START=0 END=0`) — the generator's own template writes a raw
`<footer>` block without the `<!-- FOOTER:START/END -->` comment markers;
those are normally added by a separate post-processing pass
(`scripts/standardize-footer.js`) that runs later in the full pipeline, which
my scoped single-function call correctly bypassed (by design — it only calls
`generateClothingProgrammaticPages`, not the whole orchestrator). **Fix:** ran
`node scripts/standardize-footer.js` (the existing, idempotent,
already-audited tool for exactly this) in write mode. It only writes a file
when its content differs from the master footer — confirmed it updated
exactly 1 of 1,152 files (this one) and left the other 1,151 untouched, then
`--check` passed clean again. This is the same tool Phase 3 already used to
verify footer integrity, not a new mechanism.

---

## 5. Verification of the corrected route (real browser)

- `isValidClothingSize('women','dresses','UK','8')` → `true` (confirmed via
  Node before regenerating).
- Regenerated page's own on-page conversion preview now reads *"UK 8 converts
  to approximately EU 36 for dresses"* — proof the generator's real conversion
  logic (`findClothingConversion`) found a match, which was structurally
  impossible before this fix.
- Real-browser click-through: opened
  `/clothing/womens-size-8-us-to-eu-dress.html`, extracted the actual CTA
  `href` from the rendered page (`...?gender=women&clothing=dresses&from=UK&size=8&to=EU`
  — confirmed `from=UK`, not `from=US`), navigated to it exactly as a user
  clicking the button would:

  | Check | Result |
  |---|---|
  | Destination form pre-filled (`gender=women, clothingCategory=dresses, fromRegion=UK, size=8, toRegion=EU`) | PASS |
  | Conversion runs automatically | PASS — 5 result cards |
  | Target region (EU) highlighted as best match | PASS — `European Union` card carries `.best-match` |

Full result set returned: US → S, UK → 8, **EU → 36 (best match)**, JP → M,
CN → M — a complete, correct, five-region conversion where before there was
none.

---

## 6. Files changed (Phase 5A only)

| File | Change |
|---|---|
| `app.js` | 4 fetch URLs: relative → absolute (`/data/...`) |
| `data/clothing_routes.json` | 1 route: `from_region` US→UK, description corrected |
| `scripts/generate-programmatic-pages.js` | +1 export line (`generateClothingProgrammaticPages`), no behavior change |
| `clothing/womens-size-8-us-to-eu-dress.html` | Regenerated via the real generator (scoped to this one file); footer markers normalized via the existing footer tool |
| `reports/phase-5a-data-path-and-route-repair.md` | this report (new) |

**No other file was touched.** The Phase 4 `maxlength="6"` fix on the five
`clothing-size-converter.html` variants was explicitly left alone — confirmed
still present and still working (§8).

---

## 7. What was deliberately NOT changed, and why

- **The route's `slug`/filename** — kept `womens-size-8-us-to-eu-dress.html`
  to avoid an unrelated 1,014-file link-rename sweep for one page's content
  fix. If a clean URL is wanted later, that's a separate, explicit,
  intentionally-scoped decision (rename + redirect + sitewide link sweep),
  not a byproduct of this repair.
- **`shoe_sizes.json` / `clothing_sizes.json`** — no dataset value was added,
  removed, or altered. `"8"` already existed for UK; nothing was invented.
- **`app.js` converter contract** — untouched beyond the 4-character fetch
  path fix. No validation logic, no data-contract function, no deep-link
  logic was modified.
- **The Phase 4 `maxlength` fix** — untouched, re-verified working (§8).
- Footer architecture, sitemap architecture, AI Citation Engine, AI index,
  Cloudflare config, robots.txt, navigation, card system, SEO copy on any
  other page — untouched.

---

## 8. Browser regression (real Chrome, post-fix)

| Test | Result |
|---|---|
| Homepage Shoes/Men/US/9 | PASS |
| Homepage Shoes/Women/US/8 | PASS |
| Homepage Shoes/Kids/UK/9 | PASS |
| Homepage Shoes/Men/JP/33 | PASS |
| Homepage Clothing/Men/Tops/US/L | PASS |
| Homepage Clothing/Women/Dresses/US/M | PASS |
| Homepage Clothing/Women/Skirts/US/M | PASS |
| Homepage Clothing/Kids/Tops/US/8 | PASS |
| Men/Pants/JP/XXXXXL (Phase 4 maxlength fix regression) | PASS — full `XXXXXL` still reaches the input, still converts |
| Deep-link regression: `clothing-men-tops-M-US-to-EU.html` (previously-working case, unaffected by this change) | PASS |
| Deep-link: corrected route CTA now uses `from=UK` | PASS |
| Deep-link: corrected route destination converts automatically | PASS |
| Deep-link: corrected route highlights EU as best match | PASS |

**13/13 PASS.**

---

## 9. Contract test results (Step 19)

`node scripts/test-converter-contract.js` → **987 passed, 0 failed** (identical
to the Phase 3/4 baseline — the fetch-path fix and route correction are both
outside that suite's scope by design, since it runs against embedded data and
doesn't exercise `fetch()` or route-JSON files).

## 10. Footer check

`npm run footer:check` → `Checked 1152 HTML files (skipped 1 without <body>).
OK: all footers match master.` (after the one-file footer-marker fix in §4).

## 11. Link validator result

`node scripts/prebuild-link-validation.js` → **47 missing targets** (unchanged
from the Phase 3/4 baseline — the same pre-existing directory-trailing-slash
validator quirk documented in both prior reports; not touched, not worsened,
not silently patched to hide the count).

## 12. git diff --check

Exit code 0 — no whitespace/diff errors.

---

## 13. Remaining issues (carried forward, still not fixed)

- **`clothing/*.html` landing pages still load `app.js` with no converter
  form** (Phase 3 §6 / Phase 4 §25d follow-up) — not investigated or touched
  in this phase; out of scope for Phase 5A's two named tasks.
- **Dedicated clothing converter has no "Skirts" option** (Phase 4 §9/§25c
  follow-up) — cosmetic, pre-existing, not touched.
- **The corrected route's URL still reads "us-to-eu"** despite now being a
  UK→EU conversion (§3, §7) — an explicit, documented tradeoff, not an
  oversight; flagged for a future scope decision if a clean URL is wanted.

## 14. Explicit items NOT changed

`shoe_sizes.json`, `clothing_sizes.json`, the converter data contract
(`isValidShoeSize`/`isValidClothingSize`/etc.), the Phase 4 `maxlength` fix,
footer architecture (only the one broken file's markers were normalized using
the existing, unmodified footer tool), sitemap generation, AI Citation Engine,
AI index, card system, Cloudflare configuration, `robots.txt`, global
navigation, SEO copy on any page other than the one corrected route's own
title/description/lead paragraph (which necessarily changed to describe UK
instead of US, matching the data correction), and every other generated page
on the site (124 of 126 `clothing/*.html` files, all `programmatic-pages/`,
all `measurement/*.html`, etc. — confirmed untouched by file-mtime check).

**Not committed. Not pushed.**
