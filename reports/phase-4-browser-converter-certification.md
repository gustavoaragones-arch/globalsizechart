# Phase 4 — Real Browser Converter QA & Interaction Certification

**Status:** PASS, with one confirmed pre-existing defect left unfixed by design
(scope decision needed — see §15) and one significant follow-up discovery flagged
for a scope decision (§16).

**Baseline commit:** `0dc41c5ad56cbdd1e34bc41d1f2b55d3e17b09b5` (unchanged —
Phase 3's working-tree changes were present but nothing was committed). Phase 3's
automated contract test was re-confirmed passing (987/0) before any Phase 4
change was made.

**No commit was made. No push was made.**

---

## 1. Browser-testing mechanism used

No browser automation tool was available in the Claude Code/Cursor environment
itself (checked: no MCP browser/Chrome-DevTools tool, no Playwright/Puppeteer
tool). The repository also has no browser automation dependency (`node_modules`
and `package.json` were checked — only `cheerio`, which parses HTML but doesn't
execute JS).

Per the instruction not to add a large production dependency and to use the
least invasive real-browser mechanism available: installed **`puppeteer-core`**
(a ~2 MB control library with **no bundled Chromium download**) into an isolated
scratch directory entirely outside the project repository
(`/private/tmp/.../scratchpad/phase4-browser/`, its own throwaway `package.json`,
`npm install --no-save`). It drives the **system's already-installed
Google Chrome.app** via `executablePath`. Nothing was added to
`globalsizechart/package.json` or `globalsizechart/node_modules`. `git status`
in the project repo confirms this — no dependency-manifest changes anywhere in
this report's file list (§13).

**Browser version:** Chrome 150.0.7871.125 (headless, real rendering/JS engine —
not a DOM stub, not cheerio).

## 2. Local server used

The project's own `npm run dev` (`python3 -m http.server ${PORT:-5190}`),
started cleanly on port 5190 after confirming it was free. No second/invented
dev server. Verified 200 on all Step 2 pages before testing began:
`/`, `/shoe-size-converter.html`, `/clothing-size-converter.html`,
`/shoe-size-conversion-chart/`, `/measurement/index.html`,
`/tools/home/mattress-size-chart.html`.

---

## 3. Aggregate result

**104 passed / 106 total** across the full Step 3–18 matrix (2 known failures,
both the same single pre-existing data bug — see §9 and §15). **Zero** uncaught
JavaScript exceptions (`pageerror` events) across every page and every
interaction tested.

---

## 4. Homepage shoe test matrix (Step 3) — 10/10 PASS

All ten cases (S1–S10), including the six specifically-previously-broken
combinations from the Phase 2/3 audit, converted correctly in the real browser:
Men/US/9, Women/US/8, Kids/US/11, **Kids/UK/9**, **Kids/JP/17**,
**Kids/EU/37.5**, **Kids/CM/24.5**, **Men/JP/32.5**, **Men/JP/33**, Men/CN/42.
Size field was confirmed disabled until gender was selected, then correctly
enabled with the right options for every case.

## 5. Homepage dependency testing (Step 4) — 4/4 PASS

- Selecting Category=Clothing correctly reveals the clothing-type group.
- `#clothingCategory` is disabled until gender is chosen.
- Men → `[tops, pants, jackets]` present, `dresses` absent.
- Women → `[tops, pants, dresses, skirts, jackets]` all present.
- Kids → `[tops, pants]` present, `dresses` absent.

## 6. Homepage clothing test matrix (Step 5) — 6/6 PASS (1 test-matrix correction)

C1–C5 all converted correctly. **Test-matrix correction, not a code defect:**
the brief's C4 case was "Women/Pants/US/M" — but women's pants use numeric US
sizing in the dataset (`0, 2, 4, 6, 8, 10, 12, 14`), never letters, so "M" was
never a real value (same class of pre-existing dataset-shape assumption as the
Phase 3 report's "Kids Tops US M" correction). Retested with a real value
(`US 6`) instead of inventing data to force the original case to pass. Also
explicitly re-confirmed "Kids Tops US M" is correctly absent from the dropdown.

## 7. Dependency reset testing (Step 6) — 8/8 PASS

This is the test the Node contract suite structurally cannot perform (it
verifies *values*, not *state transitions*). In a real browser, starting from
Women/Dresses/US/M (converts correctly), then:
- switching Gender → Men: `clothingCategory` is no longer `dresses`, the
  `dresses` `<option>` is removed from the list, and the stale conversion is
  replaced by the empty state — no invalid/leftover result shown.
- switching Gender → Women again: `dresses` returns, size is cleared (not
  silently re-applied).
- switching garment Dresses → Pants: size resets and repopulates from the
  pants dataset.
- switching From Region → JP: size resets and repopulates from JP's dataset
  (`[L,M,S,XL,XXL,XXXL,XXXXL,XXXXXL]`), confirming no stale size survives a
  region change.

## 8. Dedicated shoe converter (Step 7) — 11/11 PASS

`/shoe-size-converter.html`: all ten size cases (same matrix as §4, using the
free-text `#sizeInput`), plus confirmed changing the input value produces a
genuinely different, non-stale result (US 9 → US 10).

## 9. Dedicated clothing converter (Step 8) — 11/11 PASS, 1 follow-up noted

`/clothing-size-converter.html`: Men/Tops, Men/Pants, Women/Tops, Women/Pants,
Women/Dresses, Kids/Tops, Kids/Pants all converted. Confirmed via real DOM
inspection: **Men's Dresses and Kids' Dresses options are `hidden: true` AND
`disabled: true`** (the Step 7 fix from Phase 3, verified in an actual
rendered `<select>`, not just logically). Women's Dresses is enabled.

**Follow-up noted, not a defect:** the dedicated converter's static markup has
never had a "Skirts" `<option>` at all (only tops/pants/dresses) — unlike the
homepage combo form, which offers Skirts via `CLOTHING_TYPES_BY_GENDER`. Since
"skirts" is a data alias that maps to the identical `dresses` dataset rows, a
user selecting "Dresses" on the dedicated converter gets the exact same
conversion result "Skirts" would produce — this is a labeling/option-count gap
on one page family, not a broken conversion path. Pre-existing, unrelated to
Phase 3.

## 10. Large clothing sizes (Step 9) — 4/4 PASS (1 real defect found + fixed)

Men/Tops/JP/XXXXL, Men/Tops/CN/XXXXL, Men/Pants/JP/**XXXXXL** all now convert.
`Women/Dresses/US/XXXXL` correctly rejected — confirms the fix didn't broaden
acceptance globally, exactly per the "must not become valid simply because
another garment supports it" rule.

### Real defect found and fixed

`men/pants/JP/XXXXXL` **failed** on first run (0 cards, error visible) despite
Phase 3's Node contract test explicitly asserting this exact case passes.
**Root cause:** `<input id="clothing-size-input" maxlength="5">` — but
`XXXXXL` is 6 characters. Puppeteer's `page.type()` simulates real keystrokes,
and the browser's native `maxlength` enforcement silently truncated the typed
value to `XXXXX` (5 characters) before it ever reached `app.js`. The Node
contract test set `.value` directly via JS, which bypasses `maxlength`
entirely — this is precisely the class of defect Phase 3's own report flagged
as untestable without a real browser ("real user input timing").

**Fix:** `maxlength="5"` → `maxlength="6"` (the longest label anywhere in
`clothing_sizes.json`, confirmed programmatically) in all 5 places this markup
exists: `clothing-size-converter.html`, `us/`, `uk/`, `eu/`, `ca/` variants.
Re-tested after the fix — full 6-character `XXXXXL` now reaches the input and
converts (5 cards). This is a targeted, minimal, source-level repair directly
required by a test failure, per the phase's own repair rule.

## 11. Programmatic shoe pages (Step 10) — 4/4 PASS

`/programmatic-pages/us-9-to-eu-shoe-size.html`, opened and interacted with
(not just HTML-inspected): KR and INCH confirmed absent from the region
`<select>`'s actual rendered options; page preloads with a working US 9 → EU
conversion already visible; changing gender/region/size to CN/42 converts
correctly.

## 12. Clothing deep-link testing (Step 11) — 12/14 PASS, 2 FAIL (pre-existing data bug, not fixed)

Tested three representative landing pages by finding the actual "Use Clothing
Size Converter" link on the page and navigating to its real `href` (the exact
sequence a human clicking the button would follow):

| Landing page | CTA href correct | Form pre-filled | Converts automatically | Target highlighted |
|---|---|---|---|---|
| `clothing-men-tops-M-US-to-EU.html` | PASS | PASS | PASS | PASS |
| `womens-size-8-us-to-eu-dress.html` | PASS | PASS | **FAIL** | **FAIL** |
| `clothing-men-pants-30-US-to-EU.html` | PASS | PASS | PASS | PASS |

A direct visit to `/clothing-size-converter.html` with no query string was also
confirmed to leave every field at its normal default (Men/Tops, empty size) —
no accidental selections from stale query-parsing logic.

### Root cause of the 2 failures (confirmed, not fixed — see §15)

`data/clothing_routes.json`'s `womens-size-8-us-to-eu-dress` entry has
`"gender": "women", "category": "dresses", "size": "8"`. But
`data/clothing_sizes.json`'s `women.dresses` rows have only ever used letter
sizes (`XS, S, M, L, XL, XXL`) — **there has never been a numeric "8" value for
women's dresses in this dataset.** Confirmed directly:
`isValidClothingSize('women','dresses','US','8')` → `false`, and
`getAvailableClothingSizes('women','dresses','US')` → `['L','M','S','XL','XS','XXL']`.

This is **not** a Phase 3 or Phase 4 regression. The deep-link mechanism did
exactly its job — it faithfully passed the route's own `size: "8"` through to
the converter, which correctly rejected it (the same dataset contract Phase 3
built is why this fails loudly instead of silently). This single landing page
has never been able to complete a real conversion, before or after Phase 3,
because its route data was authored with a size value that was never valid.

## 13. Programmatic free-text input (Step 12) — 4/4 PASS + 1 follow-up

Valid numeric (`9`) converts; alphabetic (`abc`) produces the empty state with
no crash; empty input produces the empty state, not a stale result; decimal
(`9.5`) converts. **Zero uncaught JS exceptions** across all four inputs.

A separate class of console message was recorded but is **not** counted as a
converter failure (see §14 for why): five "Failed to load resource: 404"
network messages on every load of a nested page. Investigated and documented
as a follow-up in §16 — not a JS exception, not a broken conversion, and per
the phase's own instruction ("A favicon or unrelated third-party warning is not
a converter failure. A JavaScript exception in app.js IS a failure"), this is
closer to the former category functionally, though more consequential than a
favicon — flagged prominently rather than silently dropped.

## 14. Automatic conversion (Step 13) — 5/5 PASS

No `<button type="submit">` exists on the main converter form. Selecting the
final required field (size) triggers a result with no additional action.
Changing a selection after a result exists produces a genuinely different
value (not a stale echo). Switching to an incomplete state (Category→Clothing
with no gender yet) correctly clears the previous shoe result rather than
leaving it displayed. No `.results.loading` class was ever left stuck.

## 15. Error and empty states (Step 14) — 5/5 PASS

Entering an out-of-range shoe size (`999`) on the dedicated converter shows
exactly the expected copy: *"Please enter a valid size for the selected
region."* No stale result cards appear alongside it. Entering a valid size
immediately after clears the error and shows results — never both at once. No
duplicate error blocks. No AEO/"Quick answer" content is present inside the
converter's results container.

## 16. Back/forward navigation (Step 15) — 4/4 PASS

Homepage → valid conversion → navigate to dedicated shoe converter → browser
back → re-interact with the homepage form. The converter remained fully
functional (event listeners were still attached; a fresh selection produced a
correct, single, non-garbled result — no duplicate-listener symptom). Zero
uncaught JS errors across the whole sequence.

## 17. Mobile viewport (Step 16) — 9/9 PASS (1 test-harness false positive corrected)

Tested homepage, dedicated shoe converter, and dedicated clothing converter at
390×844 (iPhone-class viewport). No horizontal page overflow on any of the
three. Converter forms render with nonzero size. No form control is clipped
off-screen.

**Test-harness note, not a product bug:** the first run of this check flagged
`#clothingCategory` as "clipped" because its bounding box is `0×0` — but that's
because it's correctly inside `#clothingCategoryGroup`, which is
`display:none` by design until Category=Clothing is chosen (verified this is
intentional, matching the desktop behavior already tested in §5). Fixed the
check to only evaluate controls that are actually visible in the current state
(`offsetParent !== null`) before re-running — this was a flaw in the Phase 4
test script itself, corrected and documented rather than silently patched.

## 18. Console error audit (Step 17)

- **JS exceptions (`pageerror`) across every page/interaction tested: 0.**
- **Failed/blocked network requests:** the four `data/*.json` files 404 on
  every nested-page load (see §16) plus an expected `favicon.ico` 404 (cosmetic,
  unrelated to the converter, not counted as a failure per the phase's own
  rule).
- No missing JS, missing CSS, or converter-relevant missing assets found.

## 19. Network failure, real browser (Step 18) — 5/5 PASS

Using Puppeteer's request interception (not simulation-in-Node — actual browser
network-layer blocking) to abort all four `data/*.json` requests on the
homepage: page still initializes, the size dropdown still populates from
embedded data, a full conversion still completes, and there is no uncaught
exception. Additionally confirmed on a nested programmatic page where the
fetch **already fails for real** (§16's finding) — the embedded-data path
still produces a correct conversion there too. Phase 3's Node-level fallback
tests (§8 of the Phase 3 report) are now corroborated at the real browser/network
layer, not just simulated.

---

## 20. Files modified (Phase 4 only)

| File | Change |
|---|---|
| `clothing-size-converter.html`, `us/clothing-size-converter.html`, `uk/clothing-size-converter.html`, `eu/clothing-size-converter.html`, `ca/clothing-size-converter.html` | `maxlength="5"` → `maxlength="6"` on `#clothing-size-input` (§10 defect fix) |
| `reports/phase-4-browser-converter-certification.md` | this report (new) |

No other repository file was touched. The browser test scripts themselves
(`phase4-test*.js`, `helpers.js`) live entirely in the isolated scratch
directory outside the repository and are not part of this change set.

**Total file count vs. Phase 3's baseline: unchanged (1,030)** — the maxlength
fix landed in files Phase 3 had already modified, so no new files entered the
working tree.

## 21. Regression test results (Step 19)

`node scripts/test-converter-contract.js` → **987 passed, 0 failed** (same
count as Phase 3 — the maxlength fix is a static-HTML attribute, out of that
suite's scope by design, and correctly didn't need a new automated check since
it's now covered by this report's browser-level test §10).

## 22. Link validation result (Step 20)

`node scripts/prebuild-link-validation.js` → 47 missing targets (unchanged from
Phase 3's final state — same pre-existing, out-of-scope directory-trailing-slash
validator quirk documented in the Phase 3 report, not touched or worsened by
Phase 4). Zero live `/tools/shoe-size-converter.html` /
`/tools/clothing-size-converter.html` references (the one shell `grep` hit
during verification was the Node test script's own literal search string, a
false alarm, confirmed and dismissed). Zero `<option value="KR">` /
`<option value="INCH">` anywhere in the site.

## 23. Footer validation result (Step 20)

`npm run footer:check` → `Checked 1152 HTML files (skipped 1 without <body>).
OK: all footers match master.` (unchanged).

## 24. git diff --check result (Step 20)

Exit code 0 — no whitespace/diff errors.

---

## 25. Follow-up issues (recorded, not fixed — per Step 21)

### 25a. `data/clothing_routes.json`: `womens-size-8-us-to-eu-dress` has an invalid size value (§12)

**What:** the route's `size: "8"` has never existed in `women.dresses`'
dataset (letters only). This is the one confirmed real, reproducible failure
in this phase's entire matrix.
**Why not fixed now:** repairing it means either changing route data (touches
`clothing_routes.json`, arguably adjacent to "datasets" on the do-not-touch
list) or inventing a numeric dress size (explicitly forbidden). Both are scope
decisions, not obvious "smallest correct repair" calls — recommend the project
director choose between: (a) correct the route to a real letter size (e.g.
`"M"`), (b) remove/regenerate that one page, or (c) accept it as a known,
narrow, pre-existing gap (1 of 126 clothing landing pages).
**Severity:** low-blast-radius (one page) but user-visible on that page.

### 25b. `app.js` `loadData()` uses relative fetch paths — 404s on every nested page (§13, §18)

**What:** `fetch('data/shoe_sizes.json')` etc. (relative, not `/data/...`
absolute) resolve incorrectly on any page not at the site root — which is
nearly the entire site (`programmatic-pages/`, `clothing/`, `measurement/`,
`semantic/`, `brands/`, `us/uk/eu/ca/`, etc.). This means the "successful fetch
upgrades embedded data to live JSON" path Phase 3 verified in isolation
essentially never fires in real-world usage except on the handful of
root-level pages — every nested page runs on embedded data forever, by
accident rather than by design.
**Why not fixed now:** functionally harmless today (embedded data is complete
and correct, and is the primary path by design already), and Step 18
explicitly scoped "do not modify fallback architecture unless this real-browser
test fails" — the *fallback itself* did not fail (§19, 5/5 pass); it's the
*upgrade* path that's silently dead. Fixing it is a one-line, low-risk change
(`'data/...'` → `'/data/...'`, 4 occurrences) but touches the exact mechanism
Phase 3's report called out as intentionally untouched, so flagging for an
explicit go-ahead rather than bundling it into this QA phase.
**Severity:** currently invisible to users (embedded data is always correct at
time of writing), but means any future data corrections to
`data/*.json` will silently never reach ~99% of pages until the next full
regeneration. Worth fixing soon, recommend as a fast-follow.

### 25c. Dedicated clothing converter has no "Skirts" option (§9)

Pre-existing, not caused by Phase 3/4. `Women/Dresses` produces the identical
result since "skirts" is a data alias for "dresses". Cosmetic/labeling gap
only.

### 25d. `clothing/*.html` landing pages still load `app.js` with no converter form

Carried forward from the Phase 3 report exactly as instructed — Phase 4 did
not investigate or fix this per the explicit "do not fix that yet" instruction.
Now that Phase 4's own findings exist, if it's addressed: it should reuse the
same "does this page have a `.converter-form`" check Phase 3 used for
measurement pages (confirmed 0 forms on `clothing/*.html` during earlier
investigation, same pattern).

---

## 26. Explicit limitations of this certification

- Tested at 1 mobile viewport size (390×844, iPhone-class) and headless desktop
  Chrome. Did not test tablet breakpoints, landscape orientation, or other
  browser engines (Firefox/Safari/WebKit) — only Chromium-based Chrome was
  available to drive locally.
- Did not test with a screen reader or other assistive technology; accessibility
  beyond "form controls aren't clipped/hidden incorrectly" was not certified.
- Did not test real network conditions (throttled 3G, high latency) — only
  outright request failure/blocking.
- `page.type()` was used to simulate real keystroke-by-keystroke input for
  free-text fields (this is what caught the `maxlength` defect in §10); dropdown
  interactions used Puppeteer's `page.select()`, which is a standard, realistic
  way to drive a `<select>` in headless testing but is not literally a mouse
  click + option click sequence.
- Did not test copy/paste input, browser autofill, or IME (non-Latin) input
  methods into the size fields.

---

## 27. Final acceptance criteria checklist

| Criterion | Result |
|---|---|
| Homepage shoe conversion works in real browser | PASS |
| Homepage clothing conversion works in real browser | PASS |
| Gender → garment dependency works | PASS |
| Invalid garment selections cannot remain active | PASS |
| Region changes correctly update available sizes | PASS |
| Previously broken shoe sizes work in the browser | PASS |
| Previously broken clothing sizes work in the browser | PASS (after §10 fix) |
| Unsupported KR/INCH are absent and cannot be selected | PASS |
| Dedicated shoe converter works | PASS |
| Dedicated clothing converter works | PASS |
| Clothing deep links preserve conversion intent | PASS for 2/3 tested pages; 1 fails due to a pre-existing, unrelated data bug (§12, §25a) |
| Automatic conversion works without a Convert button | PASS |
| Error/empty states work | PASS |
| No stale results remain after invalidating a selection | PASS |
| Programmatic converter works | PASS |
| Mobile converter is usable | PASS |
| No converter-related browser console errors (JS exceptions) | PASS (0 uncaught exceptions); pre-existing background-fetch 404 noise documented separately (§25b) |
| Network fallback works in a browser | PASS |
| `node scripts/test-converter-contract.js` passes | PASS (987/0) |
| `git diff --check` passes | PASS |
| No unrelated systems modified | PASS — only the 5 `maxlength` fixes plus this report |

**Not committed. Not pushed.**
