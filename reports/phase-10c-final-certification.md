# Phase 10C — Final Production Certification (Reconciled)

**This report is the final, authoritative Phase 10C certification
record.** It was originally written mid-engagement to close two specific
evidence gaps left by `reports/phase-10c-production-certification.md`
(the 7 collision-exclusion URLs, and real-browser production smoke
testing), and at that time correctly reported **PHASE 10C — BLOCKED**
because no real browser automation was available. Browser tooling was
subsequently made to work (via the existing system Chrome, driven
directly over the Chrome DevTools Protocol — see
`reports/phase-10c-browser-certification.md` for that run's full detail)
and passed. This document has been reconciled to reflect that outcome as
the final state, **without erasing the historical fact that the browser
gate was genuinely unavailable at the time of this report's initial
writing** — that history is preserved in §5 below rather than deleted.

**Full certification chronology:**

1. The original Phase 10C production certification
   (`reports/phase-10c-production-certification.md`) closed the
   source-boundary, template-exposure, sitemap, and build-completeness
   gates, and disclosed two open evidence gaps.
2. This report (`phase-10c-final-certification.md`) subsequently
   certified the 7 collision-exclusion URLs directly (7/7 PASS), and at
   that time reported the real-browser gate as unavailable — **BLOCKED**.
3. The browser gate was later executed successfully using the existing
   system Chrome via raw CDP (`reports/phase-10c-browser-certification.md`)
   — **PASS**.
4. Therefore the final, reconciled Phase 10C status is **PASS**.

No implementation, Cloudflare configuration, application code, or
production behavior was changed to produce this reconciliation — only
this document was updated.

## 1. Certified Deployment SHA

`510d98ddf3ad323b546fe45c95a56aa20db928e0` — unchanged throughout the
entire Phase 10C certification chronology (source-boundary certification,
collision-URL certification, and browser certification all verified
against this same live deployment; no new deployment occurred at any
point in this sequence).

## 2. Final Repository SHA

`HEAD` == `origin/main` == `ad20a1ee373873fd1f761bca58005c53c4b368e7` —
the state as of this closeout (the commit that added
`reports/phase-10c-browser-certification.md`). At the time this report
was originally written (the collision-URL closure), the repository SHA
was `4a192d1baaba604caaab11b04aa054b9781da013`; that value remains
accurate as a historical checkpoint but is superseded by the SHA above
as the final state.

## 3. Seven Collision URLs

Recovered from the authoritative source — `reports/phase-5e-url-
migration-architecture-audit.md` §4 ("Seven Collision Chains") — not
reconstructed from assumption. Cross-checked against `_redirects`
(confirmed none of the 7 have a redirect entry, as the architecture
requires) and against `clothing/` (confirmed all 7 files exist):

1. `clothing-men-pants-42-EU-to-US.html` (Chain A's 1 collision point)
2. `clothing-women-pants-4-UK-to-US.html`
3. `clothing-women-pants-8-UK-to-US.html`
4. `clothing-women-pants-12-UK-to-US.html`
5. `clothing-women-pants-6-UK-to-US.html`
6. `clothing-women-pants-10-UK-to-US.html`
7. `clothing-women-pants-14-UK-to-US.html`

(Chain B's 6 collision points.) Each is an old filename that a
*different* migrated route's corrected content now legitimately occupies
— these must **not** redirect, since a redirect would hijack traffic
away from the page now correctly living at that URL.

## 4. 7/7 Collision Results — PASS

For each, tested with cache-busting, `--max-redirs 0` to observe the
first hop explicitly, then followed to completion:

| URL | First hop | Final status | Content |
|---|---|---|---|
| `clothing-men-pants-42-EU-to-US.html` | 308 → same filename, extensionless (Cloudflare's routine `.html` normalization only — not a semantic redirect to a different page) | 200 | Byte-identical to current `clothing/clothing-men-pants-42-EU-to-US.html` |
| `clothing-women-pants-4-UK-to-US.html` | 308 → same filename, extensionless | 200 | Byte-identical to source |
| `clothing-women-pants-8-UK-to-US.html` | 308 → same filename, extensionless | 200 | Byte-identical to source |
| `clothing-women-pants-12-UK-to-US.html` | 308 → same filename, extensionless | 200 | Byte-identical to source |
| `clothing-women-pants-6-UK-to-US.html` | 308 → same filename, extensionless | 200 | Byte-identical to source |
| `clothing-women-pants-10-UK-to-US.html` | 308 → same filename, extensionless | 200 | Byte-identical to source |
| `clothing-women-pants-14-UK-to-US.html` | 308 → same filename, extensionless | 200 | Byte-identical to source |

**7/7 PASS.** Every URL's only redirect is the pre-existing, sitewide,
platform-level `.html`→extensionless 308 (same filename, not a different
target) — confirmed distinct from a Phase 5F migration redirect, which
would target a *different* filename. No redirect loops. No cross-semantic
misrouting — each URL serves the correct, current row's content (verified
byte-identical to the tracked source, which is itself the output of the
Phase 5E two-pass regenerated-content migration), not stale content from
whichever row originally owned that filename before the collision.

## 5. Browser Gate — Historical Unavailability, Then Resolved

**At the time this report was first written, the real-browser gate was
genuinely unavailable**, checked rather than assumed:

- `node_modules/`: no `puppeteer`/`playwright` entry.
- `package.json`: no `puppeteer`/`playwright` dependency.
- `npm ls -g --depth=0`: no global install.
- `npx --no-install puppeteer --version`: fails — package not resolvable
  without installing.
- `npx --no-install playwright --version`: reported a version string, but
  that only reflects npx resolving package *metadata*; a real launch
  attempt (`require('playwright')` + `chromium.launch()`) failed with
  `MODULE_NOT_FOUND` — the module was not actually installed anywhere
  requirable.
- `~/Library/Caches/ms-playwright/`: contained only a `.links` file, no
  actual Chromium/Chrome-for-Testing binary directory.
- `Google Chrome.app` existed in `/Applications`, but no automation
  framework was wired to drive it at that time, and installing one was
  explicitly out of that phase's authorized scope.

**This was correctly reported as BLOCKED at that time — not rounded up
to a false PASS.**

**Subsequently, the gate was closed without installing any browser
automation package or dependency**: the existing system Chrome
(150.0.7871.125) was launched directly with remote debugging enabled and
driven over the raw Chrome DevTools Protocol via its native WebSocket
interface, using a temporary external Node script (outside the
repository, deleted after the run) built on Node v24's built-in
`WebSocket`/`fetch` globals only. Full detail, including every test
scenario and result, is in `reports/phase-10c-browser-certification.md`
and summarized in §6-§9 below.

## 6. Real-Browser Certification Results

- **Chrome**: 150.0.7871.125 (existing system installation; no new
  browser installed).
- **Automation method**: raw Chrome DevTools Protocol over Chrome's
  native WebSocket interface, via a temporary external Node script using
  only built-in `WebSocket`/`fetch` — no Puppeteer, no Playwright, no
  repository dependency added. Script deleted after the certification
  run, per instruction.
- **Browser page matrix**: **8/8 PASS** — homepage, dedicated shoe
  converter, dedicated clothing converter, a regional hub, a brand page,
  a programmatic shoe page, a programmatic clothing page, and a
  measurement page all rendered correctly (correct title/H1, footer
  present, CSS loaded, zero console errors, zero failed requests).
- **Converter interactions**: **9/9 PASS** — 3 homepage shoe genders
  (men/women/kids), 3 homepage clothing combinations (men/pants,
  women/dresses, kids/tops, with dependency gating verified live — the
  clothing-type select confirmed disabled until gender is chosen, the
  size select confirmed disabled until all three prior dependencies are
  set), and 3 dedicated shoe-converter genders, each producing correct,
  fully-populated conversion results across all target regions.
- **Real rendered clothing CTA click-through**: **3/3 PASS** — men's,
  women's, and kids' clothing landing pages, each via an actual mouse
  click (genuine `Input.dispatchMouseEvent` coordinates, not a
  synthetic `.click()` call and not a manually constructed destination
  URL) on the real, rendered `<a class="btn">` CTA. All 5 deep-link
  fields (gender, clothing type, from-region, to-region, size) correctly
  transferred into the destination converter in all 3 tests, with
  correct conversion results rendered.
- **Console errors**: 0, across all 20 browser sessions.
- **Failed network requests**: 0, across all 20 browser sessions.

## 7. Test-Tooling Finding — Not a Production Defect

One issue was found and corrected during the browser certification run,
and it is a finding about the **temporary certification harness**, not
about production:

The default headless Chrome viewport (~756×469px) was too small for
`Element.scrollIntoView()` to visibly reposition scroll within it, so the
first attempt at a coordinate-based real click on a below-the-fold CTA
computed coordinates that fell outside the actual visible viewport and
hit nothing. This was diagnosed directly (`elementFromPoint` at the
computed coordinates returned nothing meaningful; `window.scrollY`
stayed at 0 after `scrollIntoView`), then corrected by explicitly setting
a **1280×2000** viewport via CDP's `Emulation.setDeviceMetricsOverride`
before navigation, so on-page scrolling and click-target coordinates
behaved as they would in a normal browser window. The fix was verified
directly (`elementFromPoint` at the recomputed coordinates correctly
resolved to the target CTA element) **before** the full browser
certification suite was run and its results accepted — the results
recorded in §6 are from the corrected run, not the broken one.

This was a defect in the disposable test harness built for this
certification, not in the production site, the build output, or any
committed code, and is not counted as a P0-P3 production finding.

## 8. Public-Build Completeness

**PASS** — carried forward from the original production certification
(`reports/phase-10c-production-certification.md` §5/§13): representative
public files across every category (root, converters, regional hubs,
programmatic pages, measurement pages, brand pages, images, `data/`,
sitemaps) confirmed present and byte-identical to the certified `dist/`
artifact, with zero missing public content and zero broken CSS/JS/data
dependency. Not re-run in this reconciliation — this section restates
that already-certified result for completeness of the final record.

## 9. Cache

**PASS** — carried forward from the original production certification
(§10 there): `app.js`/`styles.css` cached and cache-busted responses
byte-identical to each other and to current source, no stale asset, no
purge required. Indirectly reconfirmed during browser certification: no
session in §6 exhibited any stale-asset symptom (broken converter,
missing styling, JS error).

## 10. P0/P1/P2/P3 Counts — Final

**Zero P0, P1, or P2 findings across the entire Phase 10C certification
chronology.**

The two pre-existing P3 findings from the original production
certification (`reports/phase-10c-production-certification.md` §15) —
unmatched/excluded paths returning HTTP 200 with a generic fallback page
instead of a true 404, and Cloudflare's Email Address Obfuscation feature
rewriting `mailto:` links — remain documented there as **pre-existing
platform behaviors, not Phase 10C regressions**, and are not restated or
reclassified here; this report does not introduce any new P3 finding.
The one tooling issue found during browser certification (§7) is
explicitly **not** a production defect and is not counted in this tally.

## 11. Scope of Evidence — What Was and Was Not Tested

The final certification is based on, and limited to, the following
categories of evidence — not an exhaustive test of every production URL:

- Source-boundary certification (representative repository-only paths)
- Sitemap reconciliation (exact URL-set match, all tiers)
- Public-build completeness checks (representative files per category)
- Automated regression suites (converter contract, Phase 7, Phase 8,
  Phase 9, footer, link validator, Phase 10C build-output tests)
- Direct HTTP production checks (cache-busted, header-inspected)
- 7/7 collision-exclusion URL certification (exact filenames)
- 8/8 real-browser page smoke matrix
- 9/9 real-browser converter interactions
- 3/3 actual rendered CTA click-throughs

Visual layout/overflow was not captured via screenshot; mobile/responsive
viewport behavior was not separately tested (browser sessions ran at a
1280×2000 desktop-sized viewport, chosen for reliable headless CDP
scrolling/clicking per §7). These remain open, disclosed, non-blocking
limitations, not claims of exhaustive coverage.

## 12. Final Status

**PHASE 10C — PASS**

| Gate | Result |
|---|---|
| Source-boundary | PASS |
| Template exposure | PASS |
| Sitemap | PASS |
| Public-build completeness | PASS |
| Cache | PASS |
| 7 collision exclusions | 7/7 PASS |
| Real-browser production certification | PASS |
| — Chrome | 150.0.7871.125 |
| — Automation | Raw Chrome DevTools Protocol over native WebSocket interface, temporary external Node script |
| — Browser page matrix | 8/8 PASS |
| — Converter interactions | 9/9 PASS |
| — Real rendered clothing CTA | 3/3 PASS |
| — Console errors | 0 |
| — Failed requests | 0 |
| P0/P1/P2/P3 | 0/0/0/0 |

Every gate raised across the full Phase 10C certification chronology —
the original production certification, the collision-URL closure, and
the browser-gate closure — has now passed. The gate that was initially
BLOCKED (real-browser testing) was closed by genuinely executing it, not
by narrowing its requirements or substituting weaker evidence.
