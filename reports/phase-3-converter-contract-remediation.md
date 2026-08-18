# Phase 3 — Converter Contract Repair & Task Completion

**Status:** Complete (P0/P1/P2 implemented; P3 partially — see "Not done").
**Baseline commit:** `0dc41c5ad56cbdd1e34bc41d1f2b55d3e17b09b5` (branch `main`, clean except untracked `reports/`).
**Implementation engine:** Claude Code, direct in-repo edits (no Composer, no full-site regeneration run).
**No commit was made.** All changes are in the working tree; `git status` at the end of this document is the ground truth.

---

## 1. Approach

Rather than re-running the full page generator (which touches AEO/footer/sitemap
layers and risks unrelated diffs across 1,000+ files), every fix was made at its
**generator/template source** first, then applied to the **already-baked static
HTML** via precise, scoped string replacements that produce byte-identical output
to what the fixed generator would now emit. This was verified file-by-file (see
§9) rather than assumed.

---

## 2. P0 — Broken links (Step 1, GATE F)

**Root cause:** `scripts/lib/quick-converters-snippet.js` is the single canonical
"Quick Converters" block injected into ~780 pages by five different
scripts/generators. It hardcoded `/tools/shoe-size-converter.html` and
`/tools/clothing-size-converter.html` — paths that never existed. The real files
live at the site root.

**Fixed:**
- `scripts/lib/quick-converters-snippet.js` — corrected both hrefs.
- `index.html` — a hand-edited "See also:" line above the hero converter had the
  same broken shoe-converter link (not generator-sourced; a one-off).
- Swept **779 already-generated files** (`programmatic-pages/`, `clothing/`,
  hub pages under `us/uk/eu/ca/`, `shoe-size-converter.html`,
  `clothing-size-converter.html`, `tools/home/mattress-size-chart.html`,
  `programmatic/templates/*`) replacing the exact broken href strings only.

**Verification:** `grep -r` for both broken paths across all live HTML/JS
(excluding `reports/`) returns 0. `curl` against a fresh local server:
`/shoe-size-converter.html` → 200, `/clothing-size-converter.html` → 200,
`/tools/shoe-size-converter.html` → 404 (correctly gone).

### Bonus P0 fix found during verification (not in the original audit)

Running `scripts/prebuild-link-validation.js` as a sanity check surfaced **four
more broken links in the same Quick Converters snippet**, sitting right next to
the two already known:

| Broken (before) | Fixed (after) |
|---|---|
| `/measurement/cm-to-us.html` | `/cm-to-us-shoe-size.html` |
| `/measurement/us-to-eu.html` | `/us-to-eu-size.html` |
| `/measurement/uk-to-us.html` | `/uk-to-us-size.html` |
| `/measurement/eu-to-us.html` | `/eu-to-us-shoe-size/` |

These never existed under `measurement/`; the correct destinations were
confirmed by checking what `measurement/index.html` itself links to (it already
used the correct paths). Also present on the homepage's "See also" line
(`CM to US converter`). Fixed at the same snippet source and swept across the
same 779 files. Per "investigate root cause, don't stop at the first visible
problem," this was in-scope: same file, same defect class, same fix mechanism.

---

## 3. P1 — Single converter data contract (Steps 2, 3, 6, 7)

**Root cause confirmed:** `app.js` already had one correct half of the contract
— `sizeDatabase` (built by `buildSizeDatabase()` from `shoe_sizes.json` /
`clothing_sizes.json`) drove `getAvailableSizes()` / `populateSizeOptions()`, so
dropdowns were already 100% dataset-driven. The broken half was **validation**:
`validateSize()` used a hand-maintained numeric range table that had drifted
from the dataset (kids UK/JP had no range object at all; men JP max was
hardcoded to 32 when the dataset goes to 33; kids EU/US maxes were similarly
stale). `validateClothingSize()` used a regex capped at `XXXL` when the dataset
uses `XXXXL`/`XXXXXL` for JP/CN.

**Fix — added to `app.js`** (kept in the existing runtime file rather than a new
module, since this is a plain `<script src="/app.js">` include on ~1,000 pages
with no bundler; adding a second script tag everywhere would be a much larger,
riskier change than the contract itself):

```
getAvailableShoeRegions(gender)
getAvailableShoeSizes(gender, region)
isValidShoeSize(gender, region, size)
getAvailableClothingRegions(gender, clothingType)
getAvailableClothingSizes(gender, clothingType, region)
isValidClothingSize(gender, clothingType, region, size)
```

All six read `sizeDatabase` directly — there is now exactly one definition of
"valid." `validateSize()` and `validateClothingSize()` became thin
dataset-backed wrappers instead of independent range/regex tables.
`validateShoeSize()` / the clothing letter-shape regex remain as **format**
gates only (numeric shape / XS–XXXXXL shape) — contextual acceptance is decided
solely by the dataset contract functions.

**Step 7 (CONV-005):** `clothing-size-converter.html`'s garment `<select>` was
static HTML (tops/pants/dresses for every gender), with no gender-based
filtering — unlike the homepage's combo form, which already filters via
`CLOTHING_TYPES_BY_GENDER`. Added `filterClothingCategoryByGender()`, reusing
that same `CLOTHING_TYPES_BY_GENDER` authority (no second competing list), wired
into initial load and gender-change for all non-main-combo forms. Men's/kids'
"Dresses" is now hidden+disabled (no dataset exists for it); if it was somehow
already selected, the field is reassigned to the first allowed garment.

**Step 4 (homepage validation surface):** Investigated and largely a non-issue
once Step 2 landed — the homepage/regional-hub combo forms only ever expose a
`<select>` for size (no free-text path), so once dropdown options are 100%
dataset-backed, an invalid *selected* value is structurally impossible. The
remaining "no dataset for this combination" case (e.g., KR/INCH, or
men+dresses) already used the existing `showConverterEmptyState()` mechanism —
consolidated `REGION_NO_DATA_MSG` and `NO_SIZES_COMBO_MSG` into one shared
`NO_CONVERSION_AVAILABLE_MSG` string ("No conversion is available for this
combination yet. Try another region or size.") so the two prior different
messages for the same root cause become one, per the spec's exact wording. No
new UI section was added.

---

## 4. Region/garment pruning (Steps 5, 6, 7 continued)

- **KR/INCH removed from the shoe region selector.** Source fix:
  `buildFromRegionOptions()` in `scripts/generate-programmatic-pages.js` now
  filters `REGION_LABELS` down to `SUPPORTED_SHOE_DATA_REGIONS` (US/UK/EU/JP/
  CN/CM) before generating `<option>`s. Swept the two literal `<option>` lines
  out of all 754 already-generated programmatic shoe pages.
  - Also handled 3 pages whose entire premise is Inch/Korea conversion
    (`inch-to-us-shoe-size.html`, `inch-to-eu-shoe-size.html`,
    `korea-cm-to-us.html`) — these had **no working default region at all**
    since `inch`/`kr` have zero dataset support. Per "unsupported input must be
    impossible to select" and "don't invent missing datasets," their KR/INCH
    option was removed too; the selector now defaults to US like every other
    page. Rewriting their title/copy to match is a content change explicitly
    out of scope (Step 13: "SEO copy, page titles").
- **CN/JP XXXXL/XXXXXL clothing labels** now validate correctly via the dataset
  contract (§3) — no validator change needed beyond removing the stale regex
  cap, since the labels were already correctly present in the dataset and
  dropdown.

---

## 5. Clothing landing-page task completion (Step 8, GATE G)

**Root cause:** 126 pages under `clothing/` (e.g.
`clothing-men-tops-M-US-to-EU.html`) stated a specific conversion in their
title/copy but only linked to the generic converter with **no state
carried over** — the user had to re-enter gender, garment, region, and size.

**Fix:**
- `generateClothingProgrammaticPages()` in `scripts/generate-programmatic-pages.js`
  now builds the CTA link as
  `clothing-size-converter.html?gender=&clothing=&from=&size=&to=`, sourced
  directly from the route's own `gender`/`category`/`from_region`/`size`/
  `to_region` fields.
- `app.js`: new `applyDeepLinkParams(form)`, called during converter init for
  all non-main-combo clothing forms. Reads `gender`, `clothing`, `from`,
  `size`, `to` from `window.location.search` and pre-fills gender → (re-filters
  garment options per Step 7) → garment → region → size, then the existing
  auto-convert flow (`runAutoConversion`) runs immediately — no extra click.
  A hidden `toRegion` field (added to `clothing-size-converter.html` and its
  `us/uk/eu/ca` variants) lets the existing `bestMatchRegion` highlighting
  logic mark the intended target region's result card, reusing the mechanism
  the dedicated shoe converter already has rather than inventing a new one.
  Invalid/unrecognized param values are simply ignored (fields keep their
  default), never silently substituted.
- Applied the same query string to all 126 already-generated `clothing/*.html`
  files (both the 6 named-slug pages from `clothing_routes.json` and the 120
  expanded `clothing-{gender}-{tops|pants}-{size}-{FROM}-to-{TO}.html` pages
  from `generate-phase10-pages.js`'s `expandClothingRoutes()`), computed from
  the same route data the generator now uses, so the static files match what
  regeneration would produce.

**Verified:** spot-checked hrefs on multiple pages
(`?gender=men&clothing=tops&from=US&size=M&to=EU`, `?gender=women&clothing=
dresses&from=US&size=8&to=EU`); unit-tested `applyDeepLinkParams()` and
`filterClothingCategoryByGender()` against a hand-built fake-DOM form (no
`jsdom` in this repo — see §9) confirming gender/garment/region/size/toRegion
all populate correctly, that main-combo forms correctly no-op (deep links only
target the dedicated converter, not the homepage), and that a direct visit with
no query string leaves defaults untouched.

---

## 6. Measurement pages (Step 9, P3)

119 of 120 `measurement/*.html` pages loaded `app.js` with **zero**
`.converter-form` / `#sizeSelect` / `.collapsible-header` anywhere on the page
— confirmed before touching anything. These are static computed-result articles
("101 cm Chest to EU Shirt Size") with the answer already baked into the HTML
at generation time. Removed the dead `<script src="../app.js">` tag from the
generator (`generateCMConverters()` in `generate-programmatic-pages.js`) and
from all 119 existing files. `measurement/index.html` (the one page without it)
was already correct and untouched.

**Explicitly not done:** `clothing/*.html` landing pages have the same
"no converter form, loads app.js" pattern (0 forms, still load app.js) but were
**not** touched — Step 9 named only "measurement pages," and expanding that to
another page family wasn't part of this task. Flagging it here as a legitimate
follow-up, not silently fixing it.

---

## 7. Automated contract tests (Step 10)

`scripts/test-converter-contract.js` — new file, runs `app.js` in a minimal
hand-stubbed `document`/`window` (this repo has no `jsdom`/`puppeteer`
dependency; see §9 for what that does and doesn't cover) and exercises the real
runtime functions, not a reimplementation.

**987 checks pass, 0 fail.** Covers:
- Every dataset-backed shoe size for every gender/region validates
  (`isValidShoeSize` / `validateSize` agree), including the six specific
  previously-broken cases from the audit (kids UK 9, kids JP 17, kids EU 37.5,
  kids CM 24.5, men JP 32.5, men JP 33) and five standard-case regressions.
- Every dataset-backed clothing size for every gender/garment/region validates,
  including JP/CN `XXXXL`/`XXXXXL`, while confirming a label doesn't become
  globally valid just because *some* combination has it (e.g.
  women/dresses/US/`XXXXL` is correctly rejected).
- No-phantom-combination checks: men/kids `dresses` have zero available
  regions; KR/INCH are absent from every shoe region list.
- Repo-wide sweep confirms zero live `/tools/shoe-size-converter.html` /
  `/tools/clothing-size-converter.html` references and zero
  `<option value="KR">`/`<option value="INCH">` anywhere in generated HTML.
- Step 7 (garment filtering) and Step 8 (deep link) unit tests against a
  hand-built fake DOM (see §5).
- Step 12 network-fallback tests (see §8).

**One test-matrix correction, not a code defect:** the Phase 3 brief's browser
matrix lists "Kids → Tops → US → M," but kids' tops sizing in the actual
dataset is numeric/age-based (US 4, 5, 6, 7, 8, 10, 12, 14) — there has never
been a letter-size row for kids tops. Per "do not invent missing dataset
values," the test now checks a real value (`US 8`) and separately asserts
`M` is correctly rejected for that combination, rather than fabricating data to
make the original matrix entry pass.

Run: `node scripts/test-converter-contract.js` (exit 0 = pass).

---

## 8. Network fallback (Step 12, GATE J)

`loadData()` was not modified — it already assigns embedded data and sets
`dataLoaded = true` **before** attempting any fetch, and the fetch's own
try/catch swallows failures silently. This was verified, not assumed, with
three simulated scenarios in the test script:
1. `fetch()` rejects outright (offline/DNS failure) → `loadData()` does not
   throw; `dataLoaded` is `true`; embedded shoe/clothing data is populated.
2. `fetch()` resolves but `response.ok` is `false` (404/500 on the JSON files)
   → same guarantee.
3. `fetch()` succeeds with different data → the background data correctly
   replaces the embedded data, and the contract (`isValidShoeSize`, etc.)
   still holds against the newly-fetched dataset.

---

## 9. Browser regression matrix (Step 11) — what was and wasn't actually tested

**This repo has no browser automation dependency** (no `puppeteer`,
`playwright`, or `jsdom` in `package.json` — only `cheerio`, which parses HTML
but doesn't execute JS or lay out a page). I do not have a browser tool
available in this environment either. Given that constraint, verification used
two channels instead of a real click-through:

1. **Runtime-logic verification (strong):** every conversion pathway
   (`isValidShoeSize`, `isValidClothingSize`, `getAllShoeConversions`,
   `getAllClothingConversions`, `applyDeepLinkParams`,
   `filterClothingCategoryByGender`, `loadData`'s fallback behavior) is the
   actual `app.js` code, executed for real in Node against the actual embedded
   dataset — not a hand reimplementation. This covers every named case in the
   Step 11 matrix functionally (does the right data flow through to a
   conversion result / validation decision).
2. **HTTP/structural verification (moderate):** a local server
   (`python3 -m http.server`) was started cleanly on a free port; every touched
   page family was spot-checked for HTTP 200/404 correctness with `curl`, and
   `cheerio` was used to confirm the edited HTML still parses with the
   expected form/script structure (catches corruption from the sed sweeps,
   which a plain grep count would not).

**What this does NOT cover, explicitly (NOT TESTED):**
- Actual DOM event wiring in a real browser — `change` listener firing order,
  whether a `<select>` visually shows/hides an option when `hidden`/`disabled`
  is set, whether clicking through the homepage gender→region→size flow
  produces the right visible result cards.
- Visual rendering/CSS — whether the highlighted "best match" card is visually
  distinct, whether disabled dropdown options render acceptably across
  browsers.
- Mobile viewport behavior.
- Accessibility (screen reader behavior, focus order) beyond what already
  existed.
- Any interaction requiring real user input timing (typing into the
  programmatic pages' free-text `input[name="size"]`).

If browser-level verification matters before shipping this, it needs a real
browser session — I'd recommend that as the next step before treating this as
fully done, not just running the Node test suite again.

---

## 10. Files changed

No commit was made; this reflects the current working tree against baseline
`0dc41c5`.

| Area | Files | What changed |
|---|---|---|
| Converter runtime | `app.js` | +270/-75 lines: data contract functions, dataset-backed validation, message consolidation, garment filtering, deep-link handling, network-fallback-safe (unchanged logic, now tested), test exports |
| Page generator | `scripts/generate-programmatic-pages.js` | Region-option filtering (KR/INCH), clothing deep-link query params, measurement-page `app.js` removal |
| Shared snippet | `scripts/lib/quick-converters-snippet.js` | 6 corrected hrefs (2 `/tools/*`, 4 `/measurement/*`) |
| Link validator | `scripts/prebuild-link-validation.js` | Strip query strings before existence-checking (needed for the new deep-link hrefs; also fixed, incidentally, nothing else) |
| New test | `scripts/test-converter-contract.js` | Step 10 mandatory automated contract test (987 checks) |
| Generated pages | 756 `programmatic-pages/*.html`, 126 `clothing/*.html`, 119 `measurement/*.html`, 3 each of `us/uk/eu/ca/*.html`, `tools/home/mattress-size-chart.html`, `programmatic/templates/*.html`, `index.html`, `shoe-size-converter.html`, `clothing-size-converter.html`, `cm-to-us-shoe-size.html`, `us-to-eu-size.html`, `uk-to-us-size.html`, `shoe-size-conversion-chart/index.html` | Broken-link fixes, KR/INCH removal, deep-link params, app.js removal — each scoped to exactly the described fix, verified via `git diff` sampling |

**Total: 1,030 files touched** (1,028 modified + 2 new: this report directory
and `scripts/test-converter-contract.js`). Verified via `git status --short`
grouped by directory that every changed file traces to one of the fixes above —
no unrelated files. `git diff --check` passes (no whitespace errors).

---

## 11. Explicitly NOT touched (Step 13 boundary)

Footer architecture, sitemap generation, Cloudflare cache rules, AI Citation
Engine, AI index, card system, homepage visual redesign, global navigation
structure, AdSense architecture, unrelated CSS, dataset *values* (only
validation logic changed — no `shoe_sizes.json`/`clothing_sizes.json` value was
added, removed, or altered), SEO copy, page titles, canonical URLs,
`robots.txt`. `npm run footer:check` still reports `1152/1152 OK` after all
changes.

---

## 12. Acceptance gates

| Gate | Result |
|---|---|
| A — Build | No generation errors (`node -c` clean on all touched `.js`; footer check passes) |
| B — JS runtime errors | No uncaught errors in the Node-level test harness; **not** verified in an actual browser (see §9) |
| C — Data contract (dataset-backed values accept) | **PASS** — 987/987 automated checks |
| D — UI contract (selectable ⇒ valid) | **PASS** — verified programmatically; not verified via live DOM interaction |
| E — Unsupported combinations not selectable | **PASS** — KR/INCH removed repo-wide; men's/kids' dresses hidden+disabled client-side |
| F — Zero live `/tools/*` links | **PASS** — 0 references (plus 4 bonus `/measurement/*` broken links fixed) |
| G — Clothing landing pages preserve intent | **PASS** — deep-link query params verified on all 126 pages + unit-tested parsing logic |
| H — No KR/INCH controls | **PASS** — 0 matches repo-wide |
| I — Standard conversions unregressed | **PASS** — explicit regression cases in the automated suite |
| J — Network fallback | **PASS** — simulated fetch-failure and fetch-success scenarios both verified |
| K — Repository integrity | **PASS** — `git diff --check` clean; every changed file accounted for; no dataset values altered |

## 13. Not done / follow-ups

- Real browser click-through testing (§9) — recommended before considering this
  fully shipped.
- `clothing/*.html` app.js removal (§6) — same dead-weight pattern as
  measurement pages, out of scope for this task as written.
- No commit was created. Working tree is ready for review; say the word if you
  want it committed (and whether as one commit or split by concern).
