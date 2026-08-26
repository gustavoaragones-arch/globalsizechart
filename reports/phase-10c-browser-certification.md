# Phase 10C-4 — Real-Browser Production Certification

**Scope: closes the one remaining Phase 10C gap — real-browser production
smoke testing. The 7 collision-exclusion URLs (Gap 1) are already closed
per `reports/phase-10c-final-certification.md` and are not re-tested
here.** No implementation, Cloudflare configuration, application code, or
production behavior was changed. `reports/phase-10c-production-
certification.md` and `reports/phase-10c-final-certification.md` were
not modified.

## 1. Deployment SHA

`510d98ddf3ad323b546fe45c95a56aa20db928e0` (unchanged — no new deployment
in this phase).

## 2. Repository SHA

`HEAD` == `origin/main` == `4a192d1baaba604caaab11b04aa054b9781da013`,
working tree clean, verified before this phase began.

## 3. Chrome Executable / Version

`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` —
**Chrome 150.0.7871.125**, the existing system installation. No new
browser was installed.

## 4. Automation Method

No Puppeteer/Playwright package was installed (both remain absent from
`node_modules`, `package.json`, and any global npm location — unchanged
from the prior phase's finding). Instead, the existing Chrome binary was
launched directly with `--remote-debugging-port=9222` and a temporary
`--user-data-dir` under `/tmp`, and driven via **raw Chrome DevTools
Protocol (CDP)** over its native WebSocket interface, using only Node
v24's built-in `WebSocket` and `fetch` (both stable globals, zero npm
dependencies).

Two temporary Node scripts implemented the CDP client and the test
scenarios; both lived at `/tmp/phase10c-*.js`, outside the repository,
and were **deleted after the certification run**, along with the Chrome
launch log and temporary user-data directory. Nothing was committed to
or added as a dependency of the repository.

**A genuine driver defect was found and fixed mid-run, disclosed rather
than hidden**: the default headless viewport was only ~756×469px, and
`Element.scrollIntoView()` had no observable effect on scroll position
within it — so the first attempt at a real coordinate-based click on a
below-the-fold CTA landed outside the visible viewport and silently hit
nothing. Diagnosed directly (confirmed via `elementFromPoint` at the
computed coordinates returning nothing meaningful, and `window.scrollY`
staying at 0 after `scrollIntoView`), then fixed by setting an explicit,
generous 1280×2000 viewport via CDP's `Emulation.setDeviceMetricsOverride`
before any navigation. Re-verified with a direct diagnostic
(`elementFromPoint` at the recomputed coordinates correctly resolved to
the target `<a class="btn">` element) before re-running the full suite.

Clicks on links (the CTA test) used genuine `Input.dispatchMouseEvent`
mouse-down/mouse-up events at the element's real, scrolled-into-view,
on-screen coordinates — not a synthetic `element.click()` call.
`<select>` interaction used the standard value-assignment +
`input`/`change` event dispatch technique, which is what Puppeteer's
`select()` and Playwright's `selectOption()` do internally as well (there
is no lower-level "real click" equivalent for native `<select>` dropdowns
that works reliably in a headless context).

## 5. Eight-Page Smoke Matrix

| Page | URL tested | Title correct | H1 present | Footer | CSS loaded | Console errors | Failed requests |
|---|---|---|---|---|---|---|---|
| A. Homepage | `https://globalsizechart.com/` | ✓ | "Global Size Chart" | ✓ | ✓ | 0 | 0 |
| B. Dedicated shoe converter | `https://globalsizechart.com/shoe-size-converter.html` | ✓ | "Shoe Size Converter" | ✓ | ✓ | 0 | 0 |
| C. Dedicated clothing converter | `https://globalsizechart.com/clothing-size-converter.html` | ✓ | "Clothing Size Converter" | ✓ | ✓ | 0 | 0 |
| D. Regional hub | `https://globalsizechart.com/us/` | ✓ | "US Size Conversion Tools" | ✓ | ✓ | 0 | 0 |
| E. Brand page | `https://globalsizechart.com/brands/nike-shoe-size-chart.html` | ✓ | "Nike Shoe Size Guide & Conversion" | ✓ | ✓ | 0 | 0 |
| F. Programmatic shoe page | `https://globalsizechart.com/programmatic-pages/kids-shoe-size-converter.html` | ✓ | "Kids' Shoe Size Converter" | ✓ | ✓ | 0 | 0 |
| G. Programmatic clothing page | `https://globalsizechart.com/clothing/womens-pants-us-6-to-eu.html` | ✓ | "Women's US 6 to EU Pants Size" | ✓ | ✓ | 0 | 0 |
| H. Measurement page | `https://globalsizechart.com/measurement/24-cm-to-us-shoe-size.html` | ✓ | "24 cm to US Shoe Size" | ✓ | ✓ | 0 | 0 |

**8/8 PASS.**

## 6. Homepage Converter Results

**Shoes** — real `<select>` interaction through `#category` → `#gender`
→ `#fromRegion` → `#sizeSelect`, no submit button (results update
automatically, matching the site's own stated behavior):

| Gender | From region | Size | Result rows rendered | Console errors |
|---|---|---|---|---|
| Men | US | 6 | 6 (US/UK/EU/JP/CN/CM), e.g. "United States 6 → 24 cm" | 0 |
| Women | UK | 2 | 6 rows, e.g. "United Kingdom 2 → 21 cm" | 0 |
| Kids | EU | 27 | 6 rows, e.g. "European Union 27 → 16.5 cm" | 0 |

**Clothing** — verified dependency gating live, not assumed: `#clothing
CategoryGroup`'s select is confirmed `disabled` before gender is chosen,
and its option list is confirmed to populate correctly *after* gender
selection (different option sets per gender — e.g. kids: `[tops, pants]`
vs. women: `[tops, pants, dresses, skirts, jackets]`), and `#sizeSelect`
is confirmed `disabled` until all three prior dependencies are set:

| Gender | Clothing type | From region | Size | Result rendered | Console errors |
|---|---|---|---|---|---|
| Men | Pants | US | 28 | "United States 28, Waist: 71cm … European Union 42" | 0 |
| Women | Dresses | US | L | "United States L, Chest: 96cm, Waist: 76cm … European Union 40" | 0 |
| Kids | Tops | US | 4 | "United States 4, Chest: 56cm, Waist: 51cm … European Union 110" | 0 |

**6/6 PASS.**

## 7. Shoe Converter Results (dedicated page)

`#gender` + `#fromRegion` selects, `#sizeInput` (numeric text field, real
value + `input`/`change` dispatch):

| Gender | From region | Size entered | Result rendered | Error banner shown | Console errors |
|---|---|---|---|---|---|
| Men | US | 9 | 6 rows, "United States 9 → 27 cm" | No | 0 |
| Women | US | 9 | 6 rows, "United States 9 → 26 cm" | No | 0 |
| Kids | US | 3 | 6 rows, "United States 3 → 22.5 cm" | No | 0 |

**3/3 PASS.**

## 8. Clothing CTA Click-Through Results — the critical test

Real, rendered production landing pages; the actual `<a class="btn">`
element was located in the live DOM (not assumed/constructed), scrolled
into view, and clicked via genuine mouse-event coordinates — the
navigation itself was produced by the click, not by manually assembling
the destination URL:

| Landing page | CTA href found in DOM | Destination reached | gender | clothingType | fromRegion | toRegion | size | Result rendered |
|---|---|---|---|---|---|---|---|---|
| `/clothing/mens-large-us-to-uk.html` | `clothing-size-converter.html?gender=men&clothing=tops&from=US&size=L&to=UK` | `clothing-size-converter?gender=men&clothing=tops&from=US&size=L&to=UK` | men | tops | US | UK | L | "United States L, Chest: 101cm, Waist: 86cm … United Kingdom L" |
| `/clothing/womens-size-8-us-to-eu-dress.html` | `clothing-size-converter.html?gender=women&clothing=dresses&from=UK&size=8&to=EU` | same, extensionless | women | dresses | UK | EU | 8 | "United States S … United Kingdom 8, European Union 36" |
| `/clothing/kids-us-6-to-eu-clothing-size.html` | `clothing-size-converter.html?gender=kids&clothing=tops&from=US&size=6&to=EU` | same, extensionless | kids | tops | US | EU | 6 | "United States 6, Chest: 66cm … European Union 130" |

All 5 deep-link fields (gender, clothing type, from-region, to-region,
size) correctly transferred from the query string into the destination
form on all 3 tests, and conversion results rendered correctly in every
case. **3/3 PASS.** This was the specific requirement Phase 10C's
original certification could not verify (constructed URLs were
explicitly disallowed as a substitute) — now closed with an actual
rendered click.

## 9. Non-Converter Page Results

Covered by §5's eight-page matrix (regional hub, brand page, both
programmatic pages, measurement page) — all render correctly with intact
footer, loaded CSS, and zero console errors.

## 10. Console Errors

**Zero console errors or uncaught exceptions across all 20 browser
sessions** (8 smoke-test pages + 9 converter-interaction scenarios + 3
CTA click-throughs).

## 11. Network Failures

**Zero failed (4xx/5xx or network-level-failed) requests across all 20
sessions.** `/app.js`, `/styles.css`, and the `/data/*.json` resources
were not merely observed as non-failing — their successful loading is
functionally proven by every converter interaction producing correct,
fully-populated, multi-region conversion results (impossible without the
underlying JSON data having loaded and app.js having executed without
error).

## 12. Cache Observations

Not independently re-measured via browser network timing in this phase
(already directly verified via HTTP cache-header/byte-identity checks in
`reports/phase-10c-production-certification.md` §10). Indirectly
reconfirmed here: every page in every session loaded current, correctly-
functioning `app.js`/`styles.css` — no stale-asset symptom (broken
converter, missing styling, JS errors) appeared anywhere in 20 sessions.

## 13. P0/P1/P2/P3 Counts

**Zero P0, P1, P2, or P3 production defects found.**

One driver-side defect was found and fixed during this phase (the
default-viewport/scroll issue, §4) — this was a bug in my own temporary
CDP test tooling, not in the production site, and does not count against
production.

## 14. Exact Limitations

1. Visual layout/overflow (e.g., horizontal scrollbars, CSS breakage not
   severe enough to throw a JS error) was not explicitly captured via
   screenshot in this run — DOM/functional correctness was verified
   directly instead (rendered text content, element states, console/
   network events), which is stronger evidence of *functional* health but
   does not by itself rule out a purely cosmetic layout issue.
2. Mobile viewport/responsive behavior was not separately tested — all
   sessions ran at a 1280×2000 desktop-sized viewport (chosen specifically
   to make on-page scrolling and clicking behave reliably under headless
   CDP automation, per §4).
3. This phase did not repeat Gap 1 (the 7 collision-exclusion URLs),
   consistent with the instruction that it was already closed.

## 15. Final Browser-Gate Status

**PHASE 10C BROWSER GATE — PASS**

- Chrome was genuinely driven via raw CDP (no HTTP-only substitute).
- All required browser smoke tests passed: 8/8 pages.
- All required converter interactions passed: 6/6 homepage (3 shoe + 3
  clothing) + 3/3 dedicated shoe converter = 9/9.
- All three clothing CTA deep-link click-throughs passed: 3/3, verified
  via an actual rendered click, not a constructed URL.
- Zero new production defects found.
- Zero required resource failures.
