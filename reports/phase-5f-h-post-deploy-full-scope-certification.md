# Phase 5F-H — Post-Deploy Full-Scope Certification

**STOPPED PER STOP CONDITION #1 (Part 14): production does not correspond
to `9417dba`.** The mandatory first gate — "verify production matches
9417dba before proceeding" — failed. Per explicit instruction, this phase
does not proceed to the full 15-part matrix, and does not repair anything.
Findings below are what was established before stopping, plus the scope
characterization needed to make the finding actionable.

**No repository state was modified.** All work was production HTTP/browser
reads plus local `curl`/`diff` comparisons against the working tree.

---

## 1. Executive Result

**Production is running a stale, cached, pre-Phase-3 copy of `app.js` (and
by the same mechanism, likely any other changed `*.js`/`*.css` asset),
despite the Cloudflare Pages origin itself correctly holding `9417dba`'s
content.** This is a CDN edge-cache staleness defect, not a deployment
failure and not a source-code defect — the correct file exists at the
origin (confirmed: a cache-busting query string on the same URL returns the
exact, byte-identical current `app.js`). The site's own `_headers` file
marks `*.js` and `*.css` as `Cache-Control: public, max-age=31536000,
immutable`, and Cloudflare's edge has been serving a single cached response
for **~16.4 days** (`age: 1421415`–`1421450` seconds) — predating this
entire Phase 3–5F engagement — without ever revalidating.

**Concrete, verified user impact:** on production right now, following a
clothing landing page's "Convert" CTA (e.g.
`/clothing/clothing-men-pants-42-EU-to-US.html` →
`clothing-size-converter.html?gender=men&clothing=pants&from=EU&size=42&to=US`)
does **not** pre-fill the form or show a conversion — the destination page
loads with an empty size field and the region dropdown on its default
value, not `EU`. This is Phase 3's deep-linking feature
(`applyDeepLinkParams`), and it is completely absent from the JavaScript
actually executing in users' browsers, because that function does not exist
in the cached `app.js`. This affects the CTA on every one of the 125
`clothing/*.html` landing pages, not just the one tested.

**HTML content itself is current** — confirmed via the same production
checks used in Phase 5F-D (redirect certification passed identically when
re-checked here), and via fresh `cf-cache-status: MISS` responses on tested
HTML pages (HTML is not marked immutable in `_headers`, so it revalidates
normally). The mismatch is scoped to immutable-cached static assets, not the
generated page content.

---

## 2. Production Commit Verification (the mandatory first gate)

| Check | Method | Result |
|---|---|---|
| `_redirects`-driven behavior (301s, jacket retirement, collision URLs) | Re-ran a subset of Phase 5F-D's live checks | **Matches `9417dba`** — same 301s, same `Location` headers, same collision-URL behavior observed before |
| HTML content freshness | `curl` a representative `clothing/*.html` page; check `cf-cache-status` | `MISS`, `cache-control: public, max-age=86400, must-revalidate` — served fresh from origin, consistent with `9417dba` |
| `app.js` byte-for-byte vs. local `9417dba` working tree | `curl https://globalsizechart.com/app.js` vs. local `app.js`, `diff` | **DOES NOT MATCH.** Missing: `isValidShoeSize`, `isValidClothingSize`, `getAvailableClothingSizes`, `getAvailableShoeSizes`, `applyDeepLinkParams`, `filterClothingCategoryByGender`, `_initEmbeddedDataForTests`, `_getRuntimeStateForTests`. Present instead: old hardcoded numeric range table (`ranges = { shoes: { men: { US: [3,18], ... } } }`), old letter-only regex missing `XXXXL`/`XXXXXL`, relative `fetch('data/...')` instead of absolute `fetch('/data/...')` |
| `app.js` cache-bust (`?cachebust=<ts>`) vs. local `9417dba` working tree | Same `diff`, cache-defeating query string | **Matches exactly** — proves the correct file exists at the Cloudflare Pages origin; only the previously-cached edge response is stale |
| `app.js` response headers | `curl -I` | `cache-control: public, max-age=31536000, immutable`; `cf-cache-status: HIT`; **`age: 1421415`** (≈16.45 days) |
| `styles.css` response headers | `curl -I` | Same pattern: `immutable`, `HIT`, `age: 1421450` (≈16.45 days) — content happens to be byte-identical to `9417dba`'s version by coincidence (unchanged across this engagement), so this asset shows no *visible* staleness, but is served via the exact same stale-cache mechanism |

**Verdict: production is a hybrid state** — HTML/generated-page layer
matches `9417dba`; at least one critical JS asset (`app.js`) does not, and
is proven to be served from a ≈16-day-old edge cache that predates every
phase in this engagement (Phase 3 was the first phase and post-dates this
cache entry). Per Part 14 Stop Condition #1, this halts the full
certification matrix.

---

## 3. Live-Browser Confirmation of Real User Impact

Using real Chrome (`puppeteer-core`, same isolated setup as prior phases)
directly against `https://globalsizechart.com` (not localhost):

| Check | Result |
|---|---|
| `window.app._getRuntimeStateForTests` exists (Phase 3 signature) | **Absent** on root page, nested clothing page, and nested measurement page — confirms the browser is executing the same old `app.js` the `curl` diff found |
| Console errors / page errors on root, nested clothing, nested measurement page loads | None captured |
| Failed (4xx/5xx) network requests on those same loads | None captured |
| `fetch('data/shoe_sizes.json')` from a nested page (`/clothing/...`) | Resolves to `/clothing/data/shoe_sizes.json`, which returns **HTTP 200 but `content-type: text/html`** — Cloudflare's not-found/fallback handler, not real JSON. No console error was observed, meaning the old `app.js`'s data-loading path silently swallows this failure (its `loadData()` predates Phase 3's stricter contract) and falls back to whatever dataset is hardcoded/embedded in that old file version |
| Deep-link CTA (`?gender=men&clothing=pants&from=EU&size=42&to=US`) → destination page state | **Broken.** `sizeInputValue` empty (expected `42`), `fromRegionValue` = `US` (expected `EU`), 0 result cards rendered. The URL parameters are correct (proving the *HTML/generator* layer — Phase 3/5F's work — is fine); the JS that's supposed to read and apply them is simply not present in what's executing |

**This is evidence of real, currently-live user-facing breakage**, not a
theoretical risk: every clothing landing page's primary call-to-action is
silently non-functional in production right now. It is caused entirely by
CDN cache staleness, not by any defect in the code that was written and
committed across Phases 3–5F.

One open question this audit did **not** resolve, in keeping with the stop
instruction (no further investigation once the stop condition was
confirmed): whether the *embedded/fallback* dataset baked into the stale
`app.js` is old enough to produce silently **wrong** conversion numbers
(not just a missing feature), given that `data/clothing_routes.json` and
`data/clothing_sizes.json` received substantive corrections in Phases 5A
and 5C. This is flagged as a real possibility, explicitly unverified.

---

## 4. Why This Wasn't Caught by Phase 5F-D

Phase 5F-D certified the 32 `_redirects` rules and 7 collision exclusions —
all of which are HTML-layer/routing behavior, served fresh (not immutable-
cached) and therefore unaffected by this issue. It never requested or
checked `app.js`, `styles.css`, or any interactive/JS-dependent behavior on
production — that was explicitly out of its scope (redirect certification
only). Phase 5F-G's git-scope audit was git-only and never touched
production. This is the first phase in the engagement to compare production
`app.js` byte-for-byte against the repository, which is why it is the first
to surface this.

---

## 5. What Was NOT Done (per the stop instruction)

Per Part 14 ("Do NOT repair the issue inside this phase") and the general
instruction to stop immediately on a Stop Condition #1 match, this audit
did **not**:

- Run the full 15-part certification matrix (converter interaction matrix
  across all regions/garments, 50+ programmatic-pages sample, 20+
  measurement sample, 30+ clothing sample, 10+ brand sample, sitemap
  crawl, mobile/desktop viewport sweep, full internal-link crawl).
- Purge, modify, or bypass any Cloudflare cache.
- Modify `_headers`, `app.js`, or any other file.
- Attempt to determine whether the embedded-fallback dataset in the stale
  `app.js` produces incorrect (as opposed to merely feature-degraded)
  conversion results.
- Check whether other non-`.js`/`.css` immutable-cached asset types (images,
  fonts) are similarly stale — plausible by the same mechanism, not
  verified.

These are natural candidates for the next phase, not completed here.

---

## 6. Coverage Statement

Per this report's own standard (no inflating sampled evidence): this phase
tested a small, targeted set of production URLs (root, one nested clothing
page, one nested measurement page, `app.js`, `styles.css`, a subset of
Phase 5F-D's redirect checks) sufficient to establish and characterize the
Stop Condition. It does **not** constitute certification — positive or
negative — of the 750 `programmatic-pages/`, 119 `measurement/`, 94
"unchanged" `clothing/`, or 10 `brands/` files' current production
correctness. Those remain **NOT TESTED**.

---

## 7. Risk Assessment

- **P0 — confirmed, live, currently affecting real users:** the deep-link
  CTA on all 125 clothing landing pages is non-functional in production due
  to stale cached `app.js`. Classified P0 because it's a conversion-path
  failure on the site's primary monetizable interaction, not a cosmetic
  issue.
- **P0/P1 — unverified but plausible:** silently incorrect conversion
  results, if the stale `app.js`'s embedded fallback dataset diverges from
  the corrected `data/*.json` files. Not confirmed either way; flagged for
  the next phase.
- **Scope:** believed limited to immutable-cached static assets
  (`*.js`, `*.css`, per `_headers`) — HTML is unaffected (confirmed fresh).
  Images/fonts not checked.
- **Not a regression from this engagement's source changes** — the source
  is correct at the origin; this is a caching/invalidation gap that would
  have affected *any* update to an immutable-cached asset, independent of
  what Phase 3–5F specifically changed.

---

## 8. Recommended Next Action

This is a deployment/infrastructure fix, not a code fix, and is likely
higher-priority than resuming the broader certification sweep:

1. **Purge Cloudflare's cache for `/app.js` and `/styles.css`** (and audit
   other immutable-cached asset types) — the fastest, lowest-risk
   resolution, since the origin already has correct content.
2. Once cache-freshness is confirmed, **re-run this Phase 5F-H matrix from
   the beginning** — the stop condition should clear, and the full 15-part
   certification can proceed meaningfully.
3. Separately, consider whether `Cache-Control: immutable` is the right
   policy for `*.js`/`*.css` given this site's deploy pattern (content
   changes without a filename/hash change) — `immutable` is safe only when
   paired with cache-busting filenames (e.g. `app.<hash>.js`), which this
   site does not use. That's an architecture decision for a future phase,
   not something to fix as a side effect of resolving the immediate
   staleness.

No implementation change was made in this phase; all three items above are
recommendations only.

---

## Final Summary

- Production commit verified: **NO — mismatch found (see §2)**
- Production URLs tested: **7** (root, 2 nested pages, `app.js`, `styles.css`, plus a `_redirects`-behavior subset re-check of ~3 URLs from Phase 5F-D)
- Browser checks run: **5** (3 page-load probes + 1 deep-link interaction check + 1 network-request inspection)
- Passed: **2** (HTML freshness check, `_redirects` behavior re-check)
- Failed: **1** (`app.js` production-vs-`9417dba` byte match — Stop Condition #1)
- Warnings: **1** (unresolved question of whether stale embedded fallback data produces wrong conversion numbers)
- Not tested: **the entire 15-part matrix** — converters (interaction matrix), clothing (30+ sample), programmatic-pages (50+ sample), measurement (20+ sample), brands (10+ sample), sitemap/indexing surface, internal-link crawl, mobile/desktop, canonical/Cloudflare re-verification beyond what Phase 5F-D already established
- P0: **1 confirmed** (deep-link CTA broken sitewide on clothing pages, live) **+ 1 unverified/plausible** (possible silent wrong-conversion risk)
- P1/P2/P3: **0** (not reached — matrix not run)

```
Production commit verified:        NO — app.js mismatch (HTML layer matches 9417dba; app.js/styles.css served from stale immutable cache, age ~16.45 days)
Production URLs tested:            7
Browser checks:                    5
Passed:                            2
Failed:                            1
Warnings:                          1
Not tested:                        full 15-part matrix (all families beyond the targeted stop-condition check)
P0:                                1 confirmed + 1 unverified/plausible
P1:                                0 (not reached)
P2:                                0 (not reached)
P3:                                0 (not reached)
HEAD:                              9f2ba94fbcea73045f1a3e0774530b48b7487fbb
origin/main:                       9417dba116371bccf344e1ee79223a652df526e0
Repository implementation state modified during this phase:  NO
```

**STOP — end of Phase 5F-H, per Stop Condition #1.**
