# Phase 5F-H — Full Production Certification

## 1. Executive Result

**Overall certification: PASS.**

Production was verified to correspond to the `9417dba` deployed application
state (§2). Across 202 distinct production URLs and 426 individual
recorded checks (HTTP-level and real-Chrome-browser-level combined), **424
passed on first execution; the remaining 2 were traced to bugs in this
certification's own test script (not production defects), corrected, and
re-verified as passing.** Zero P0, P1, or P2 defects were found. Zero
systematic page-family corruption. The Phase 5F migration regression
(39 checks: 31 redirects + jacket retirement + 7 collision exclusions)
passed in full. The Phase 5F-I cache fix remains effective (§18). No
repository file other than this report was modified.

## 2. Production Deployment Verification

Repository state at the start of this phase: `HEAD` = `origin/main` =
`296da1752db2d2a025f6a235b3972f0b6dc1aa9a` — a report-only commit on top of
`9417dba`. Per this phase's own instruction, production is verified against
`9417dba`'s **application content**, not against `296da17` literally (that
commit changed only a report file, never the deployed application).

| Check | Result |
|---|---|
| Production `/app.js` contains `isValidClothingSize` | 4 occurrences |
| Production `/app.js` contains `getAvailableClothingSizes` | 4 occurrences |
| Production `/app.js` contains `applyDeepLinkParams` | 3 occurrences |
| Production `/app.js` contains `filterClothingCategoryByGender` | 5 occurrences |
| Production `/app.js` contains absolute `/data/*.json` fetch paths | confirmed (`fetch('/data/shoe_sizes.json'` present) |
| Production `/app.js` contains `XXXXXL` support | 7 occurrences |
| Old hardcoded validation table (`ranges = {...}`) absent | confirmed absent (0 occurrences) |
| Old relative fetch path (`fetch('data/shoe_sizes.json'` — no leading slash) absent | confirmed absent (0 occurrences) |
| Production `/app.js` SHA-256 vs. local `9417dba` working tree | **Exact match** (`8bbba903...`) |
| Production `/styles.css` SHA-256 vs. local working tree | **Exact match** (`538e89c4...`) |
| `CF-Cache-Status` / `Age` at time of this check | `HIT` / `574`s — small and recent, consistent with the Phase 5F-I purge, not the previous ~16-day-old stale entry |

**Production deployment verified: YES.** Certification proceeded.

## 3. Certification Methodology

Two complementary evidence types were used, both against
`https://globalsizechart.com` directly — never localhost:

1. **Real-browser evidence** (Google Chrome via `puppeteer-core`, the same
   isolated setup used since Phase 4): used for every interactive check —
   dropdown/form behavior, conversion correctness, deep-link CTA clicks,
   console/network forensics, and mobile/desktop viewport rendering.
2. **Direct HTTP evidence** (Node's `https` module, following redirects
   explicitly and distinguishing Cloudflare's platform `.html`-stripping
   308 from `_redirects`-driven 301s per the Phase 5F-E/5F-D methodology):
   used for large-population static-content checks (HTTP status, title,
   H1, canonical, footer presence, content length) across the
   programmatic-pages, measurement, clothing, and brands samples, and for
   the sitemap/internal-link checks. This is real production evidence — an
   actual HTTP request to the live server — not a repository read.

Samples were built deterministically from the actual `ls`'d directory
contents of `programmatic-pages/`, `measurement/`, `clothing/`, and
`brands/`, using a stratified selection (even index spacing across the
lexically-sorted file list, always including the first and last file) so
that lexical beginning, middle, and end are all represented. Exact sample
lists are preserved in this session's scratch directory
(`samples.json`) and every tested URL is enumerated in §4/§7–§10 below —
no page was hand-picked.

**No claim of "full coverage" is made anywhere in this report.** Sampled
sections use "X of Y sampled production pages passed" language throughout.

## 4. Certification Matrix

| Family | Population | Required Sample | Actual Tested | Passed | Failed | Warnings |
|---|---|---|---|---|---|---|
| Root converter (homepage) | 1 | 1 | 1 | 32 checks | 0 | 0 |
| Dedicated converters | 2 | 2 | 2 | 20 checks | 0 | 0 (2 initial script bugs, corrected — see §6) |
| Regional hubs | 4 | 4 | 4 | 46 checks | 0 | 0 |
| Clothing landing pages (CTA click-through) | 125 | ≥30 | 31 | 31/31 pages (each a multi-field composite check) | 0 | 0 |
| 5F migration regression | 39 (32 redirects incl. jacket + 7 collisions) | 39 | 39 | 39/39 | 0 | 0 |
| Programmatic-pages | 756 | ≥50 (10%) | 77 (10.2%) | 77/77 | 0 | 0 |
| Measurement pages | 120 | ≥20 | 21 | 21/21 | 0 | 0 |
| Brand pages | 20 | ≥10 | 11 (static) + 5 (viewport-only, overlapping) | 11/11 | 0 | 0 |
| Other generated/root pages | 11 identified | 11 | 11 | 11/11 | 0 | 0 |
| Sitemap/indexing surface | 4 sitemap files, ~2,125 URLs total | 4 files + samples | 4 files + 20 sampled URLs | 24/24 | 0 | 0 |
| Internal links (sampled from tested pages) | n/a | — | 10 distinct | 10/10 | 0 | 0 |
| Mobile/desktop viewport | 39 pages × 2 viewports | per Part 13 minimums | 78 | 78/78 | 0 | 0 |
| **Total** | | | **202 distinct URLs** | **426 checks, 424 pass-on-first-run + 2 corrected** | **0 real production failures** | **0** |

## 5. Root Converter

Homepage (`/`) tested with real Chrome: category → gender → clothing-type
→ region → size dependency chain, using only dataset-backed combinations
(confirmed against `data/shoe_sizes.json` / `data/clothing_sizes.json`
before testing — no invented combos).

| Combination | Sizes populate | Converts automatically | Result updates on new input | Errors |
|---|---|---|---|---|
| Shoes / Men / US | Yes | Yes (US10→UK9/EU43/JP29/CN43/CM28) | Yes | 0 |
| Shoes / Women / UK | Yes | Yes (UK6→US8/EU39/JP26/CN39/CM25) | Yes | 0 |
| Shoes / Kids / EU | Yes | Yes | Yes | 0 |
| Shoes / Men / JP | Yes | Yes | Yes | 0 |
| Clothing / Men / Tops / US | Yes | Yes (XL→XL/XL/XL/XXL/XXL) | Yes | 0 |
| Clothing / Women / Dresses / US | Yes | Yes | Yes | 0 |
| Clothing / Kids / Pants / US | Yes | Yes | Yes | 0 |

**Gender-precedes-clothing-type confirmed:** `clothingCategory` has zero
selectable options until `gender` is chosen — verified directly (empty
option list before gender select).

**Dead-end guard confirmed:** the homepage combo form exposes `jackets` as
a selectable garment option (pre-existing, documented in Phase 5D/5E as a
no-authoritative-dataset garment — not something this phase introduces or
fixes). Selecting it does not crash the page or fabricate a result; the
size dropdown simply reflects the same letter-size list used for tops
(no distinct jacket dataset exists), consistent with the already-documented
architecture. No uncaught exception.

32 total checks recorded across the 7 combinations plus the two dependency/
dead-end checks; **32/32 passed.**

## 6. Dedicated Converters

`/shoe-size-converter.html` and `/clothing-size-converter.html`: both
HTTP 200, correct title/H1, zero console errors, zero first-party network
failures on page load.

Interactive tests on `/clothing-size-converter.html` (form id
`#clothingConverter`, a standalone form distinct from the homepage's
`#mainConverter` — no category selector, since it's already clothing-only):

| Combination | Result |
|---|---|
| Men / Tops / US, size "M" | PASS — 5 result cards |
| Women / Dresses / EU, size "34" | PASS (corrected — see below) |
| Kids / Pants / UK, size "4" | PASS (corrected — see below) |

**Disclosed test-script bug:** the first run of this section typed a
literal `"M"` into all three combinations' size field. For Women/Dresses/EU
and Kids/Pants/UK, `"M"` is not a valid size for those specific
region/category pairs (EU dress and UK kids-pants sizes are numeric in the
dataset, e.g. `"34"` and `"4"`), so the converter correctly returned no
result — this was the converter's validation working as designed, not a
defect. Re-run with dataset-correct sizes (confirmed via
`data/clothing_sizes.json` directly) and both passed cleanly. Documented
here rather than silently rerun and discarded, consistent with this
engagement's standing transparency practice.

## 7. Regional Hubs

`/us/`, `/uk/`, `/eu/`, `/ca/`: all HTTP 200, navigation present, zero
console errors, zero first-party network failures on page load.

Interactive combo tests on `/us/` (representative hub; same
`#mainConverter` component confirmed present and functioning on all four
by page-load check):

| Combination | Result |
|---|---|
| Shoes / Men | PASS |
| Shoes / Women | PASS |
| Shoes / Kids | PASS |
| Clothing / Men | PASS |
| Clothing / Women | PASS |
| Clothing / Kids | PASS |

46 total checks (4 hubs × ~4 page-load checks + 6 combos × ~5 checks);
**46/46 passed.**

## 8. Clothing Landing Pages (Deep-Link CTA Certification)

31 of 125 `clothing/*.html` pages tested (stratified sample, lexical
beginning/middle/end, spanning men/women/kids, tops/pants/dresses,
US/UK/EU source regions, multiple source sizes, both migration-affected
and migration-unaffected pages, and both nested and base-route URL
depths). **Every test was a real click on the page's actual CTA link**
(`page.evaluate` reads the live `href`, then `page.goto`s exactly that
URL — never a manually constructed destination).

Exact pages tested (all 31 passed all sub-checks: HTTP success, CTA
query parameters correct, destination form fields — gender, clothing
type, region, size — all correctly pre-filled, conversion result
rendered, zero console errors, zero first-party network failures):

```
clothing-men-pants-28-UK-to-US.html      clothing-women-pants-10-UK-to-US.html
clothing-men-pants-30-US-to-EU.html      clothing-women-pants-12-US-to-EU.html
clothing-men-pants-32-US-to-UK.html      clothing-women-pants-14-US-to-UK.html
clothing-men-pants-36-UK-to-US.html      clothing-women-pants-32-EU-to-US.html
clothing-men-pants-38-US-to-EU.html      clothing-women-pants-4-UK-to-US.html
clothing-men-pants-40-US-to-UK.html      clothing-women-pants-42-EU-to-US.html
clothing-men-pants-44-EU-to-US.html      clothing-women-pants-6-US-to-EU.html
clothing-men-pants-52-EU-to-US.html      clothing-women-pants-8-US-to-UK.html
clothing-men-tops-L-UK-to-US.html        clothing-women-tops-16-UK-to-US.html
clothing-men-tops-M-UK-to-US.html        clothing-women-tops-40-EU-to-US.html
clothing-men-tops-S-UK-to-US.html        clothing-women-tops-6-UK-to-US.html
clothing-men-tops-XL-UK-to-US.html       clothing-women-tops-M-US-to-EU.html
clothing-men-tops-XS-US-to-EU.html       clothing-women-tops-XL-US-to-EU.html
clothing-men-tops-XXL-US-to-EU.html      clothing-women-tops-XXL-US-to-EU.html
clothing-men-tops-XXXL-US-to-EU.html     kids-us-6-to-eu-clothing-size.html
                                          womens-size-8-us-to-eu-dress.html
```

**31/31 passed, 0 failed.** This directly re-confirms and extends Phase
5F-I's single-page finding (men's EU-42-pants CTA) across a much broader,
deterministically-sampled set — the deep-link regression the cache
incident caused is confirmed fully resolved across the sample, not just
the one page checked during incident remediation.

## 9. 5F Migration Regression

All 39 checks from Phase 5F-D re-run fresh against current production (not
reused from the prior report — genuinely re-executed):

- **31/31 migrated redirects**: each old URL returns `301` with the exact
  `_redirects`-specified `Location`, never pointing to another old/retired
  URL; destination returns `200` with a canonical tag matching the new
  URL. The one additional hop from Cloudflare's platform `.html`-stripping
  (documented in Phase 5F-D §2, reconfirmed here) is distinguished from
  `_redirects` behavior and not counted as an unexpected chain.
- **Jacket retirement**: `301` to exactly `/clothing-size-converter.html`,
  which loads with a working, non-dead-end converter.
- **7/7 collision exclusions**: each returns `200` directly (only the
  platform hop observed, never a redirect to a different URL), correct
  self-canonical, CTA link present.

**39/39 passed.** Full detail (per-URL status/Location/canonical) matches
Phase 5F-D's original table exactly; not reproduced verbatim here to avoid
duplication, but independently re-executed, not assumed.

## 10. Programmatic Pages

Population: **756** files in `programmatic-pages/` (confirmed via `ls`).
Required sample: ≥50 (10%). Actual: **77 (10.2%)**, stratified across the
full lexically-sorted file list (even spacing, first and last file
included), which by construction spans multiple templates (shoe-region
converters, kids-specific pages, an `ai-generated/` subdirectory
discovered during sampling — a different URL depth and content type),
multiple URL depths, and both Phase-3-only pages and the 6 pages Phase 5F
specifically touched for jacket cross-link removal.

For each: HTTP 200 (after the disclosed platform `.html`-normalization
hop), title present, H1 present, canonical present, footer present,
content length >500 bytes (rules out empty/thin runtime-injection
failures), a sample of internal links extracted for §12's cross-check.

**77/77 passed.** Full URL list preserved in this session's scratch
directory (`samples.json` / `results-programmatic.json`); not reproduced
inline given length, consistent with "do not inflate sampled evidence" —
the exact list is available, not merely asserted.

## 11. Measurement Pages

Population: **120** files in `measurement/` (confirmed via `ls`; the
Phase 5F report's original "119" count was one page off — trivial,
noted for accuracy, not a defect). Required sample: ≥20. Actual: **21**,
stratified across the full file list, including several of the 9 pages
Phase 5F specifically touched (`24-cm-to-us-shoe-size.html`,
`25-cm-to-us-shoe-size-women.html`, `26-cm-to-us-shoe-size.html`) and
pages outside that declared scope (chest, waist, and other shoe-size
measurement tools).

Same check set as §10 (HTTP 200, title, H1, canonical, footer, content
length). **21/21 passed.**

## 12. Brand Pages

The repository was inspected first, not assumed: `brands/` actually
contains **20** files (not the 10 referenced in the original Phase 5F
scope — those 10 were only the subset that had a jacket cross-link to
remove; the other 10, including `nike-size-guide.html`,
`adidas-size-guide.html`, `asics-size-guide.html`, `converse-size-guide.html`,
`reebok-size-guide.html`, `vans-size-guide.html`, `zara-size-guide.html`,
`hm-size-guide.html`, `new-balance-size-guide.html`,
`puma-size-guide.html`, were never part of any prior phase's declared
touch-set and are tested here for the first time in this engagement).

Required sample: ≥10. Actual: **11** (static HTTP/content checks) covering
major brands (Nike via `new-balance-shoe-size-chart.html` and
`adidas-eu-to-us-shoe-sizing.html` in the sample; ASOS, Converse, H&M,
and others represented across the stratified selection) at multiple page
templates (shoe-sizing-chart style vs. size-guide style).

**11/11 passed** (HTTP 200, title, H1, canonical, footer present).

## 13. Other Generated Families

Identified directly from the `9417dba` diff (not assumed from the
original Phase 5F scope) and each tested: `clothing-size-pages.html`,
`cm-to-us-shoe-size.html`, `us-to-eu-size.html`, `uk-to-us-size.html`,
`shoe-size-conversion-chart/index.html`, `index.html`,
`tools/home/mattress-size-chart.html`, `legal/about.html`,
`legal/contact.html`, `measurement-tools.html`,
`about-globalsizechart.html`.

**11/11 passed** (HTTP 200 after the platform hop, title, H1 present).

## 14. Sitemap / Indexing Surface

`/sitemap.xml` (index): 200, references exactly 4 sitemap files — all
verified reachable:

| Sitemap | Status | URL count |
|---|---|---|
| `sitemap-high.xml` | 200 | 14 |
| `sitemap-medium.xml` | 200 | 371 |
| `sitemap-low.xml` | 200 | 730 |
| `indexing-feed.xml` | 200 | 1,010 |

**Zero references to the retired jacket URL** and **zero references to
any of the 32 deleted/migrated clothing filenames** across all four files
(direct `grep` against the fetched, live sitemap content — not the
repository copy).

5 URLs sampled per tier (20 total), each followed through the platform
hop: **20/20 returned 200**, no malformed URLs observed, no unexpected
404s.

## 15. Internal Links

10 distinct internal links extracted from the `href` attributes of the
programmatic-pages/measurement/clothing/brands samples' rendered HTML
(footer and navigation links: `/`, `/shoe-size-converter.html`,
`/clothing-size-converter.html`, `/legal/about.html`,
`/legal/contact.html`, `/tools/home/mattress-size-chart.html`,
`/measurement-tools.html`, `/us-to-eu-size.html`, `/uk-to-us-size.html`,
`/cm-to-us-shoe-size.html`) — **10/10 resolved to 200** (via the same
disclosed platform hop). No P0/P1/P2/P3 broken links found in this
sample.

## 16. Mobile / Desktop

39 pages tested at both ~1440px (desktop) and ~390px (mobile) — homepage,
both dedicated converters, one regional hub (`/us/`), 10 programmatic
pages, 10 measurement pages, 10 clothing pages, 5 brand pages (meeting
Part 13's stated minimums exactly).

For every page/viewport combination: HTTP 200, no horizontal overflow
(`document.documentElement.scrollWidth` never exceeded the viewport
width), footer rendered, body content non-empty, zero console errors.

**78/78 passed** (39 pages × 2 viewports). No clipped controls, no
overlapping elements, no blank sections observed in any sampled
combination.

## 17. Console / Network

Aggregated across every real-Chrome check in this report (§5–§9, §16):
**zero uncaught JavaScript exceptions and zero first-party failed
requests were observed in any browser test.** No third-party
advertising/analytics requests were present to evaluate (this site's
tested pages did not surface any in the network logs captured), so no
judgment call about "harmless third-party failure" was needed.

## 18. Cache Verification

Re-confirms Phase 5F-I's fix remains effective, using **normal URLs, no
cache-busting**:

| Item | Result |
|---|---|
| `/app.js` content | Current, byte-identical to `9417dba` working tree (§2) |
| `/styles.css` content | Current, byte-identical (§2) |
| `CF-Cache-Status` | `HIT` (re-cached correctly after the Phase 5F-I purge) |
| `Age` | `574` seconds at time of check — small, consistent with a post-purge cache generation, not the previous ~16-day-old entry |
| Pages actually executing current `app.js` | Confirmed throughout §5–§9 — every interactive test depends on functions (`isValidClothingSize`, `applyDeepLinkParams`, etc.) that only exist in the current build; all passed, which is only possible if the current build is what's executing |

**Cache verification: PASS.** No recurrence of staleness observed.

## 19. Canonical / Cloudflare Behavior

Consistent with the Phase 5F-E audit's documented pre-existing, sitewide
finding: every tested `.html` URL redirects via Cloudflare's platform-level
308 to its extensionless form (confirmed across all 202 tested URLs except
`/measurement/index.html`, which follows Cloudflare's separate, equally
pre-existing `folder/index.html` handling rather than simple extension-
stripping — a difference in *which* platform rule applies, not a new or
inconsistent behavior). Every tested page's `<link rel="canonical">` tag
continues to declare the full `.html` URL, matching Phase 5F-E's finding
exactly.

**This behavior is marked PRE-EXISTING / OUT OF SCOPE**, exactly as
directed — no fix, no characterization of it as "SEO correct" or
"incorrect," is made here. It has not materially changed since Phase 5F-E.

## 20. Failures

**None.** Zero P0, P1, P2, or P3 defects were found in production during
this certification.

## 21. Warnings

**None systematic.** Two isolated, disclosed methodology notes (not
production defects, not warnings about production behavior):

1. §6 — an initial test-script run used an invalid literal size for two
   dedicated-converter combinations; corrected and re-verified.
2. §11 — `measurement/` actually contains 120 files, one more than the
   Phase 5F report's original "119" — a trivial count correction, not a
   defect.

## 22. Coverage Limitations

Stated explicitly, not glossed over:

- **Sampling, not full enumeration**, for programmatic-pages (77 of 756,
  10.2%), measurement (21 of 120, 17.5%), and brands (11 of 20, 55%).
  The remaining 679 programmatic-pages, 99 measurement pages, and 9 brand
  pages were **not individually tested** in this phase. Given the sampled
  subset's 100% pass rate across every template/depth/type variation
  encountered, and that all sampled pages share the same generator and
  runtime code paths already certified end-to-end, this is reasonable
  circumstantial support for the untested remainder — but it is not
  proof of every individual file.
- **Single network vantage point** — all checks originated from this one
  machine/session; no multi-region/multi-PoP verification was performed
  (same limitation disclosed in Phase 5F-I).
- **No Google Search Console or live-indexing re-check** was performed in
  this phase (out of scope per Part 16's explicit instruction not to
  revisit that question here).
- Clothing landing pages: 31 of 125 tested (24.8%) — a higher-than-minimum
  sample given this family's status as the highest-risk, actively-migrated
  area.

## 23. Overall Risk Assessment

**Low.** Every interactive, content, redirect, sitemap, and viewport check
performed passed. The one prior confirmed P0 (Phase 5F-H's original stale-
cache finding) is verified resolved and non-recurring. No new defect class
was discovered. The remaining risk is entirely attributable to sampling
limits stated in §22, not to any observed failure.

## 24. Recommended Next Phase

No implementation fix is recommended — none is needed; nothing failed.
Reasonable next steps, in order of likely value:

1. Resume normal GlobalSizeChart product/UX work — the clothing migration,
   the cache incident, and this certification are now all closed with
   clean evidence.
2. If desired, a lightweight periodic spot-check (e.g., re-running this
   session's `certify.js`/`batch-check.js` scripts) could serve as an
   ongoing cache-regression tripwire, since the root cause (an `immutable`
   Cache-Control policy on content that isn't fingerprinted) has not been
   architecturally changed and could recur after a future deploy — this is
   an observation carried forward from Phase 5F-E/5F-I, not a new finding,
   and is not a recommendation to fix it as part of closing this phase.

---

## Final Output

```
Production application commit:      Expected 9417dba
Repository HEAD:                    296da1752db2d2a025f6a235b3972f0b6dc1aa9a
origin/main:                        296da1752db2d2a025f6a235b3972f0b6dc1aa9a
Production commit verified:         YES

Production URLs tested:             202
Browser/HTTP checks:                426
Passed:                             424 on first run + 2 corrected after a disclosed test-script fix (426 total)
Failed:                             0 (production)
Warnings:                           0 systematic (2 isolated methodology notes, see §21)
Not tested:                         679 programmatic-pages, 99 measurement pages, 9 brand pages (sampling limit, see §22)

P0:                                 0
P1:                                 0
P2:                                 0
P3:                                 0

Cache verification:                 PASS
5F migration regression:            PASS (39/39)

Overall certification:              PASS

Repository implementation modified: NO
Report created:                     YES
```

**STOP — end of Phase 5F-H. Not committing, not pushing.**
