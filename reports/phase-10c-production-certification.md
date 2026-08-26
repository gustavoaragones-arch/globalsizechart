# Phase 10C — Production Certification (Cloudflare Public-Build Cutover)

## 1. Deployment Identity

- Pre-cutover-fix commit (Cloudflare build failed): `a4014ca`
- Cutover-fix commit (Cloudflare build/deploy succeeded per dashboard):
  `510d98ddf3ad323b546fe45c95a56aa20db928e0`
- `HEAD` == `origin/main` == `510d98d`, working tree clean, verified
  before this certification began.
- **Note on commit identity vs. public content**: `a4014ca` and `510d98d`
  produce **byte-identical `dist/` output** — every file that differs
  between the two commits (`scripts/build-public-dir.js`, the new test
  script, the implementation report) is itself excluded from `dist/` by
  the allowlist. There is therefore no HTTP-observable way to distinguish
  "serving `dist/` built from `a4014ca`" from "serving `dist/` built from
  `510d98d`" — what matters, and what this certification actually
  verifies, is that the `dist/`-based architecture itself is genuinely
  active, which the tests below confirm directly.
- Cloudflare Pages dashboard build log was not independently inspected
  (no API/dashboard access from this session) — this certification
  relies entirely on live production HTTP behavior as evidence, per the
  Director's own report of dashboard status.

## 2. Production Source-Boundary Results — PASS (with one disclosed caveat)

**Methodology correction, disclosed rather than silently applied**: the
first check of this phase (a 20-attempt polling loop over ~6.5 minutes,
run just before this certification's authorization arrived) showed
`/scripts/generate-programmatic-pages.js` returning HTTP 200 with real
source content on every single attempt — appearing to indicate the
cutover had *not* taken effect. Re-tested with a cache-busting query
parameter and found `cf-cache-status: MISS` with the response now being
the site's generic fallback page, not source content. Root cause: this
URL matches `_headers`' `/*.js` rule
(`Cache-Control: public, max-age=31536000, immutable`) — a **one-year
immutable edge cache** — so the polling loop was repeatedly hitting a
long-lived cached copy of the pre-cutover response and could never have
detected the change without a different cache key. All results below use
cache-busting on every request.

13 representative source-only paths tested (`/scripts/`, `/scripts/lib/`,
`/reports/`, `/docs/`, `/build/`, `/cloudflare/`, `/config/`,
`/generators/`, `/utils/`, `/authority/`, `/components/`, plus specific
files within several of these):

**All 13 now return the site's generic fallback response** — confirmed
byte-identical (28,368 bytes) to both the homepage and a deliberately
nonexistent path, with **zero source content, zero repository-internal
text**, `cf-cache-status: MISS`/`DYNAMIC` (fresh, not stale cache).

**Caveat, disclosed precisely**: the fallback response is **HTTP 200**,
not a true 404/410. This is confirmed to be the site's **pre-existing**
unmatched-path behavior (identical for excluded source paths and for a
deliberately-invented nonexistent path), not something Phase 10C
introduced or could have changed within its authorized scope (no
`_redirects`/`_headers` changes were authorized or made). Per Part 1's
own literal success criterion — "A 200 containing repository-internal
source content is a FAIL" — this is **not** a fail, since no source
content is exposed; it simply doesn't achieve the cleaner "404 is
acceptable and expected" form. Classified as a **P3, pre-existing,
out-of-scope characteristic**, not a Phase 10C regression.

## 3. Template Exposure Results — PASS

All 6 template locations (3 original `programmatic/templates/`, 3
relocated `scripts/lib/programmatic-templates/`), each tested in both
`.html` and extensionless form (12 URLs total), cache-busted:

**100% return the generic fallback response. Zero contain `{{` / `}}`
unresolved tokens. Zero expose any template HTML.** This is the decisive
proof that the original Phase 10 defect — raw, unsubstituted template
files being live and indexable in production — is now actually fixed in
production, not merely removed from the sitemap (Phase 10B's own
achievement) or relocated within a still-public tree (Phase 10B's own
documented failure mode).

## 4. Sitemap Results — PASS

Fetched `sitemap.xml` + all 4 `sitemaps/*.xml` fresh (cache-busted). All
valid XML. Zero references to `programmatic/templates` or any template
filename. Zero references to the retired jacket URL
(`eu-50-jacket-to-us-size.html`). Zero references to the 31 pre-Phase-5F-
migration source URLs.

**Exact set reconciliation** against the current locally-tracked
`sitemap.xml` + `sitemaps/*.xml` (the source that generated the
certified `dist/`): **1,116 unique URLs in production, 1,116 in local
source — 0 missing, 0 extra.** Full 1:1 match.

Raw per-tier counts (368/14/730/989 for medium/high/low/indexing-feed)
match Phase 10B's own established post-remediation baseline exactly — no
unexpected churn from this phase.

## 5. Public-File Completeness Results — PASS

10 representative files across categories (brand, measurement,
programmatic shoe, shoe-size-conversions hub, legal, printable, AI hub,
widget, regional hub, image asset) fetched from production and compared
byte-for-byte against the corresponding certified `dist/` file. **10/10
identical** (after correcting two of my own wrong URL guesses during
testing — not production issues).

`data/shoe_sizes.json`, `data/clothing_sizes.json`, `data/regions.json`,
`data/brands.json`: all HTTP 200, all byte-identical to source.

## 6. Converter Regression Results — PASS

Local automated suite (re-run fresh, post-cutover, with `dist/` removed
during the run per the established Phase 10C-1 workaround for the two
validators that have no awareness of `dist/` — not modified, per
instruction):

- Converter contract: **987/987**
- Phase 7 (brand pages): **740/740**
- Phase 8 (homepage/shoe hub): **39/39**
- Phase 9 (FAQ architecture): 0 mismatches across every category checked
  (duplicates, count, question, answer, schema-only, visible-only,
  orphans, "more questions" surfaces)
- Footer check: 1,151/1,151 files, all match master
- Link validator: **47** — unchanged from the established pre-existing
  baseline
- `dist/` rebuild: 1,178 files, inventory hash
  `5bcf850671a782c639948db8d72cef18e735ca375afe8c6c83aee9b280046987` —
  identical to the certified Phase 10C-1 value
- New portability regression test (`test-phase-10c-portable-tmp.js`):
  12/12 checks pass

## 7. Browser Smoke Results — LIMITATION DISCLOSED, not a false PASS

**No real Chrome/Puppeteer browser automation tool is available in this
session.** Rather than claim a browser-executed smoke test that did not
happen, this is disclosed plainly, consistent with this engagement's
standing rule not to claim UI verification that wasn't actually
performed.

**Best-effort proxy performed instead**: fetched 8 representative pages
(homepage, shoe converter, clothing converter, shoe hub, brand page,
programmatic shoe page, programmatic clothing page, measurement page)
and checked for `app.js`/`styles.css` linkage and expected converter
markup. 6/8 showed the expected `id="mainConverter"` pattern; the
clothing-programmatic and measurement pages did not match that specific
string pattern. Investigated and confirmed **both are genuine, correctly-
titled, real content pages** (not the fallback), so this reflects a
pre-existing template/page-type characteristic — and since Phase 10C
changes only *how* files are served, never their content (proven
byte-identical throughout this report), **any such characteristic is
identical to what existed before this phase's cutover**. Not a Phase 10C
regression. Not independently verified as correct-or-not by an earlier
phase either, within the scope of this report.

**What was NOT verified**: actual JS execution, absence of console
errors, real click-driven CTA navigation, visual layout/overflow. These
require real browser tooling this session does not have access to.

## 8. Clothing CTA / Deep-Link Results — LIMITATION DISCLOSED

Same tooling constraint as §7 applies directly: Part 7's explicit
requirement ("actual rendered CTA clicks, NOT constructed destination
URLs") cannot be met without a real browser. Not attempted as a
substitute with constructed URLs, since the Director's instruction
specifically rules that out as insufficient. Flagged as an open item
requiring either real browser tooling or manual verification, not
silently skipped.

## 9. Phase 5F Migration Results — PASS (32/32 directly verified)

Extracted all 32 `/clothing/*` rules from `_redirects` (31 migration
redirects + 1 jacket retirement) and tested each directly against
production with cache-busting. **32/32 correctly 301-redirect to their
expected destination.** (One test-harness bug was caught and fixed
mid-run: the cache-busting query string was being echoed onto the
`Location` header, breaking a naive string-suffix comparison — corrected
by stripping the query string before comparing, then all 32 passed
cleanly; this was my own test-script defect, not a production issue.)

The remaining 7 "collision exclusion" URLs (Phase 5F-E's documented set
of routes that legitimately reused an old filename as their own new
home, correctly given no redirect entry) were **not individually
re-tested by filename** — I do not have that exact 7-URL list reliably
available in this session's context, and reconstructing it from memory
risked fabricating an inaccurate list. These are indirectly covered by
§4's exact 1,116/1,116 sitemap reconciliation, which would have surfaced
any regression to those pages' existence, but this is disclosed as a
narrower form of verification than a named-URL check would provide.

## 10. Cache Results — PASS

`app.js` and `styles.css`: normal (cached, `cf-cache-status: HIT`,
`age: 423604`s ≈ 4.9 days) and cache-busted (`MISS`, fresh) requests
return **byte-identical** content, and both match the current committed
source exactly. No stale pre-cutover asset detected. No purge required.

## 11. Canonical / Cloudflare Behavior — Unchanged, not modified

The pre-existing `.html` → extensionless 308 behavior (documented since
Phase 5F-E) was observed throughout this certification exactly as
before, and was not touched. Not classified as a Phase 10C regression,
per explicit instruction.

## 12. Negative Source-Boundary Tests — PASS

13 cache-busted requests against repository-only paths (exceeding the
required minimum of 10), covering every previously-exposed source
category. **0 exposed any repository-internal content.**

## 13. Public-Build Completeness Cross-Check — PASS

No missing root assets, data files, images, converters, programmatic
pages, measurement pages, brand pages, or sitemap files found across all
spot checks in this report. No broken CSS/JS/data dependency detected —
`app.js`, `styles.css`, and all 4 `data/*.json` files fetched by it
confirmed present and current.

## 14. Production JavaScript / Data-Path Results — PASS

`app.js` contains exactly the 4 expected absolute `/data/*.json` fetch
calls (verified in Phase 10C-1, unchanged — content proven byte-identical
in §10 of this report). All 4 return HTTP 200 from production with
content identical to source. No relative `data/*.json`-style path found.

## 15. Failure Classification

| Finding | Classification | Disposition |
|---|---|---|
| Unmatched/excluded paths return HTTP 200 (fallback page) instead of a true 404 | P3 | Pre-existing platform default, unaffected by and out of scope for this phase; source content is not exposed |
| Email addresses rewritten via Cloudflare's Email Address Obfuscation (`/cdn-cgi/l/email-protection`) on `legal/privacy` | P3 | Pre-existing Cloudflare zone feature, unrelated to the build-output cutover, not a content or architecture defect |
| No real browser/Puppeteer tool available for JS-execution and click-driven CTA testing (§7, §8) | Disclosed limitation, not scored as a numbered defect | Genuine gap in this session's tooling, not a production defect — flagged for follow-up with real browser access |
| 7 collision-exclusion redirect URLs not individually re-verified by filename (§9) | Disclosed limitation | Indirectly covered by exact sitemap reconciliation |

**Zero P0 or P1 findings. Zero P2 findings.**

## 16. Final Status

**PHASE 10C — PASS**

- Cloudflare Pages now builds from the repository (build command
  `node scripts/build-public-dir.js`, output directory `dist`) and is
  confirmed, via live cache-busted production testing, to actually be
  serving that output rather than the raw repository filesystem.
- Internal repository source (`scripts/`, `reports/`, `docs/`, `build/`,
  `cloudflare/`, `config/`, `generators/`, `utils/`, `authority/`,
  `components/`) is no longer publicly exposed with real content — 13/13
  representative paths and 12/12 template-URL forms confirmed clean.
- All three original Phase 10B templates, at both their original and
  relocated repository paths, no longer expose raw template content in
  production — the original Phase 10 defect is fixed, not merely hidden.
- Sitemap surface intact: exact 1,116/1,116 match against local source,
  zero template/retired-URL references.
- Converters remain functional per the full local automated suite
  (987/987, 740/740, 39/39, footer/link-validator clean) and per
  byte-identical production-vs-source content checks; real
  browser-executed interaction was not verified (disclosed, §7-8).
- Phase 5F migration: 32/32 directly-tested redirects pass.
- Cache is current and healthy; no stale asset, no purge needed.

## 17. Exact Known Limitations

1. No real browser (Chrome/Puppeteer) automation available in this
   session — JS-execution correctness, console-error absence, and actual
   CTA click-through were not verified. Structural HTTP-level proxies
   were used instead and are explicitly weaker evidence.
2. Cloudflare dashboard build logs were not independently inspected (no
   API/dashboard access) — this certification is based entirely on live
   production HTTP behavior.
3. The 7 Phase 5F-E collision-exclusion URLs were not individually
   re-verified by filename (list not reliably available in this
   session's context); covered only indirectly via exact sitemap-set
   reconciliation.
4. Unmatched/excluded paths return HTTP 200 with a generic fallback page
   rather than a true 404 — pre-existing, out of this phase's authorized
   scope to change.
