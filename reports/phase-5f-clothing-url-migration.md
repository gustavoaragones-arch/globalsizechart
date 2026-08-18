# Phase 5F — Clothing URL Migration & Duplicate Consolidation

**Status: PASS.** All required gates green. HEAD unchanged
(`0dc41c5ad56cbdd1e34bc41d1f2b55d3e17b09b5`). Not committed, not pushed.

---

## 1. Implementation Summary

Executed the Phase 5E specification exactly, with two deviations discovered
during implementation and corrected with full documentation (§18) rather than
either silently matching the brief's stated numbers or silently improvising:

1. Fixed `expandClothingRoutes()`'s slug construction to use the same
   corrected `sourceSize` value already used for the route's functional
   `size` field (previously the slug deliberately kept using `row.us`).
2. Added semantic-identity deduplication (5-field key) against the
   hand-authored base routes.
3. Retired the jacket route from `data/clothing_routes.json`.
4. Added a `canonical_target` override mechanism to
   `generateClothingProgrammaticPages()` for the 3 duplicate-pair expanded
   pages.
5. Ran the full two-pass migration (write all 125 final files, then delete
   only the truly-orphaned 32).
6. Discovered and corrected a redirect-count error: 7 of the 38 planned
   redirects would have hijacked live traffic away from newly-correct pages
   — excluded them, landing on 32 redirect entries instead of the assumed 39.
7. Discovered and fixed 26 external cross-link references (brands,
   measurement, programmatic-pages, clothing-size-pages.html) to the retired
   jacket page, plus regenerated the AI-signal-scoring artifact — both found
   via the mandatory Part 18 repository-wide search, neither anticipated in
   Phase 5E's file-scope list.
8. Regenerated sitemaps via the authoritative tool.
9. All required test suites, browser certification, and filesystem
   assertions pass.

---

## 2. Source Changes

| File | Change |
|---|---|
| `scripts/generate-phase10-pages.js` | Slug construction uses `sourceSize` (not `row.us`); added `clothingRouteIdentity()`; added semantic-identity dedup in `expandClothingRoutes()`; added `findCanonicalizedDuplicateRoutes()`; updated the one production caller to pass `clothingRoutes`; extended `module.exports` |
| `scripts/generate-programmatic-pages.js` | `canonicalUrl` computation now checks `route.canonical_target` before falling back to self-canonical |
| `data/clothing_routes.json` | Jacket route entry removed (5 routes remain) |

## 3. Generator Changes

Exactly the two-token change specified in Phase 5E §6, applied to both the
`tops` and `pants` blocks:

```js
// before
const slugSimple = `clothing-${gender}-tops-${String(row.us)...}-${fromR}-to-${toR}`;
// after
const slugSimple = `clothing-${gender}-tops-${String(sourceSize)...}-${fromR}-to-${toR}`;
```

US-sourced pairs are unaffected (`sourceSize === row.us` always for
`from_region: 'US'`) — verified: 82 of 120 auto-expanded routes kept their
exact prior filename.

## 4. Semantic Deduplication

Implemented via `clothingRouteIdentity(r) = \`${gender}|${category}|${from_region}|${size}|${to_region}\``,
generic (no hardcoded slugs — verified by re-deriving the 3 known pairs
programmatically, not typing them). `expandClothingRoutes()` now takes a
third parameter (`baseRoutes`), builds an identity set from it, and skips any
candidate whose identity matches. Result: 120 → 117 auto-expanded routes (3
suppressed). A companion function, `findCanonicalizedDuplicateRoutes()`,
independently re-derives exactly those 3 suppressed candidates (never
hardcoded) so they can be explicitly reintroduced with a `canonical_target`
(§9) rather than silently dropped — their HTML files are not deleted.

## 5. Jacket Retirement

Removed from `data/clothing_routes.json`. Verified absent from the final
125-route array and from disk. 26 external cross-link references (10
`brands/`, 10 `measurement/`, 6 `programmatic-pages/`, 1
`clothing-size-pages.html`) removed at their source (§10). One 301 redirect
added: `/clothing/eu-50-jacket-to-us-size.html → /clothing-size-converter.html`.

## 6. 38-URL Migration

All 38 corrected routes' target filenames verified via a two-pass
regeneration (§7). 82 unaffected + 38 corrected = 120 auto-expanded routes;
combined with 5 base + 3 canonical-override = 125 total final pages.

## 7. Collision Chain Execution

Both chains (Phase 5E §4) executed via Pass 1 (write) / Pass 2 (delete-only-
orphaned), verified safe by construction — no data ever read from an old
file, every target written fresh from current route data:

- **Chain A** (men's pants EU→US, 1 collision point): `...-42-EU-to-US.html`
  now correctly holds the row-us=28 content (EU 42→US 28); the row-us=42
  content moved to the newly-created `...-56-EU-to-US.html`.
- **Chain B** (women's pants UK→US, 6 collision points across two
  interleaved 4-link chains): all 8 targets verified holding their own
  route's correct content post-migration.

Hard safety gate (Phase 5E Part 13 / this phase's Part 13) run and passed
before any deletion — see §12.

## 8. Redirects

**Deviation from the brief's stated 39, fully explained — not a shortfall,
a correction.** Programmatically derived all 38 old→new pairs, then checked
each redirect *source* against the post-migration filesystem. **7 of the 38
sources are themselves live files** — the 7 collision-point filenames that
were never deleted, only had their content corrected in place (§7). Adding
a redirect rule for a URL that is simultaneously a real, live, correct page
would (on Cloudflare Pages, where `_redirects` rules are evaluated before
static asset serving) silently hijack every visitor to that page away to the
wrong destination. Excluded those 7. **Final count: 31 migration redirects +
1 jacket retirement redirect = 32**, all verified to have sources that do
not exist as live files.

`_redirects` — pre-existing content (comments/examples) untouched; 32 new
lines appended with explanatory comments, including the reasoning for the
7 intentionally-omitted pairs.

**Local verification limitation, disclosed:** the local dev server
(`python3 -m http.server`) does not process Cloudflare Pages' `_redirects`
file — that's a platform feature only active on an actual Cloudflare Pages
deployment. Verified locally: (a) `_redirects` syntax and source/target
correctness for all 32 entries, (b) every redirect source correctly 404s
locally (confirms the old page is genuinely gone, not confirms the redirect
fires — that requires the real platform). Live 301 behavior was **not**
verified end-to-end in this phase; flagged in §18.

## 9. Duplicate Canonical Consolidation

Implemented via the generator, not post-processing (per Phase 5E's explicit
requirement). `findCanonicalizedDuplicateRoutes()` tags each of the 3
suppressed candidates with `canonical_target` set to its paired base route's
slug; `generateClothingProgrammaticPages()` uses that field (when present)
for the single `canonicalUrl` variable that feeds both the `<link
rel="canonical">` tag and every JSON-LD `url` field, keeping all of a page's
canonical-bearing signals consistent with each other. Verified: all 3
expanded pages emit a canonical pointing to their base page; all 3 base
pages remain self-canonical; both members of all 3 pairs return HTTP 200 and
convert correctly (§13 browser results).

## 10. Cross-Link Regeneration

Full 125-route regeneration (not targeted replacement), per Phase 5E's
explicit recommendation. Verified zero live references to any of the 32
retired/migrated slugs remain within `clothing/*.html` (§Part 17 check).

**Beyond the declared clothing-family scope**, the mandatory Part 18
repository-wide search (required, not optional) found 26 additional live
references in `brands/` (10), `measurement/` (9), `programmatic-pages/`
(6), and `clothing-size-pages.html` (1) — all exclusively to the retired
jacket page (verified: zero of these referenced any of the 31 migrated,
non-retired URLs). **Corrected count** — an earlier draft of this report
misstated `measurement/` as 10; re-verified directly against `git diff`
output per file (not against memory) and confirmed exactly 9:
`24-cm-to-us-shoe-size.html`, `25-cm-to-us-shoe-size.html`,
`26-cm-to-us-shoe-size.html`, `27-cm-to-eu-shoe-size.html`,
`66cm-waist-to-us-womens-pants.html`, `70cm-waist-to-eu-pants.html`,
`76cm-waist-to-us-pants.html`, `90cm-chest-to-us-shirt-size.html`,
`96cm-chest-to-eu-shirt-size.html`. 10 + 9 + 6 + 1 = 26, matching the
execution-time count exactly (`Fixed 26 files (expect 26)`). Traced to
source: these files' generators pull from a
shared cross-reference pool that isn't part of the clothing family and was
never declared in scope. Given each file had exactly one stale list item (not
a structural issue), and regenerating those entire families (900+
unrelated files) would be grossly disproportionate and outside declared
scope, fixed each with a precise, individually-verified removal of the one
`<li><a>...eu-50-jacket-to-us-size.html...</a></li>` entry — confirmed
identical pattern across all 26 before touching any of them.

## 11. Sitemap Regeneration

`npm run build:sitemaps` (`generate-sitemaps.js` + `internal-link-injector.js`).
No sitemap file hand-edited. Result: `sitemap-medium.xml` and
`indexing-feed.xml` each show exactly 125 `/clothing/` URLs, zero references
to any of the 32 retired/deleted slugs.

**Additional artifact found and fixed, beyond Phase 5E's anticipated
scope:** `data/ai-signals.json` (an AI-citation-readiness scoring cache,
generated by `scripts/ai-signal-scoring.js`, consumed by
`scripts/internal-link-optimizer.js` for a separate build step — not read by
any runtime code) had 32 stale entries. Confirmed it's a pure, filesystem-
derived build artifact (same pattern as sitemaps — the script walks the live
HTML tree, not a route JSON) and regenerated it via its own authoritative
tool (`node scripts/ai-signal-scoring.js`) rather than hand-editing.

## 12. Test Results

| Test | Command | Expected | Actual | Result |
|---|---|---|---|---|
| Pre-migration regression | `node scripts/test-clothing-route-generator.js` | all pass | 25 passed, 0 failed | **PASS** |
| Pre-migration contract | `node scripts/test-converter-contract.js` | 987/987 | 987 passed, 0 failed | **PASS** |
| Post-migration regression | `node scripts/test-clothing-route-generator.js` | all pass | 25 passed, 0 failed | **PASS** |
| Post-migration contract | `node scripts/test-converter-contract.js` | 987/987 | 987 passed, 0 failed | **PASS** |
| Footer check | `npm run footer:check` | clean | `OK: all footers match master.` (after running the standard `standardize-footer.js` pass — required, same gap Phase 5A/5C also hit) | **PASS** |
| Link validator | `node scripts/prebuild-link-validation.js` | 47, unchanged | `Missing targets: 47` | **PASS** |
| `git diff --check` | `git diff --check` | clean | exit 0 | **PASS** |

## 13. Browser Certification

Real Chrome 150.0.7871.125 via the same isolated `puppeteer-core` setup used
in Phases 4/5A/5C (no repository dependency added), against `npm run dev`.
**20/20 checks passed**, zero uncaught JS exceptions.

| Area | Result |
|---|---|
| Collision Chain A (`...-28-EU-to-US` → `...-42-EU-to-US`) | Old URL 404s locally; new URL loads, H1/preview show EU 42, CTA carries `from=EU&size=42`, canonical self-referential, converts correctly, no JS errors |
| Collision Chain B (`...-0-UK-to-US` → `...-4-UK-to-US`, plus a second interleaved-chain example `...-2-UK-to-US` → `...-6-UK-to-US`) | Old URL 404s locally; new URLs load with correct H1/preview; destination converter auto-populates and converts (5 cards) |
| Jacket | Old URL 404s locally (redirect target verified separately: `/clothing-size-converter.html` loads with a working, non-dead-end converter) |
| Duplicate pair (`mens-medium-us-to-eu` / `clothing-men-tops-M-US-to-EU`) | Both return HTTP 200 (no redirect between them); base is self-canonical; expanded's canonical points to base; both convert correctly via their CTA |
| Unchanged route (`clothing-men-tops-XS-US-to-EU`, a US-forward pair whose filename never needed to change) | Resolves directly, converts correctly exactly as before |

## 14. Final Clothing Integrity Metrics

| Metric | Value |
|---|---|
| ROUTES | **125** |
| INVALID ROUTES | **0** |
| ORPHAN PAGES | **0** |
| ORPHAN ROUTES | **0** |
| FILENAME/CONTENT MISMATCHES | **0** |
| UNRESOLVED SEMANTIC DUPLICATES | **0** |
| JACKET ROUTE | **0** (absent) |
| OLD MIGRATED LIVE FILENAMES | **0** |
| OLD MIGRATED INTERNAL REFERENCES (within clothing/) | **0** |
| JACKET LIVE REFERENCES | **0** (except the 1 explicit redirect source in `_redirects`) |
| Sitemap coverage | **125/125** |
| Canonical: self-canonical | **122/125** |
| Canonical: points to base (consolidated pairs) | **3/125** |

## 15. Files Modified by Phase 5F

Distinguished from pre-existing changes (§16) by direct knowledge of every
action taken this phase, not by attempting to diff-parse cumulative `git
status` output (which cannot separate "changed before Phase 5F" from
"changed further during Phase 5F" within the same already-modified file).

**Source files:**
- `scripts/generate-phase10-pages.js` (further modified — already carried Phase 5C's fix)
- `scripts/generate-programmatic-pages.js` (further modified — already carried Phase 3/5A changes)
- `data/clothing_routes.json` (further modified — already carried Phase 5A's dress-route fix)
- `scripts/test-clothing-route-generator.js` (substantially rewritten — existed as a new file from Phase 5C)

**Generated content:**
- `clothing/*.html` — all 125 final files (re)written by the full regeneration; net: 94 pre-existing filenames refreshed, 31 brand-new filenames created, 32 old filenames deleted (31 migration-orphaned + 1 jacket)
- `_redirects` (32 lines appended)
- `sitemaps/sitemap-high.xml`, `sitemaps/sitemap-medium.xml`, `sitemaps/sitemap-low.xml`, `sitemaps/indexing-feed.xml`, `sitemap.xml`, `sitemap/index.html` (regenerated via `npm run build:sitemaps`)
- `data/ai-signals.json` (regenerated via `node scripts/ai-signal-scoring.js`)
- `brands/*.html` — exactly these 10 files, jacket cross-link removed:
  `adidas-eu-to-us-shoe-sizing.html`, `asos-size-guide.html`,
  `hm-size-converter.html`, `levis-jeans-size-guide.html`,
  `new-balance-shoe-size-chart.html`, `nike-shoe-size-chart.html`,
  `puma-shoe-size-chart.html`, `shein-size-converter.html`,
  `uniqlo-size-guide.html`, `zara-clothing-size-guide.html`
- `measurement/*.html` — exactly these 9 files (corrected from an earlier
  miscount of 10 — see §10), jacket cross-link removed:
  `24-cm-to-us-shoe-size.html`, `25-cm-to-us-shoe-size.html`,
  `26-cm-to-us-shoe-size.html`, `27-cm-to-eu-shoe-size.html`,
  `66cm-waist-to-us-womens-pants.html`, `70cm-waist-to-eu-pants.html`,
  `76cm-waist-to-us-pants.html`, `90cm-chest-to-us-shirt-size.html`,
  `96cm-chest-to-eu-shirt-size.html`
- `programmatic-pages/*.html` — exactly these 6 files, jacket cross-link
  removed: `kids-eu-32-to-us-shoe-size.html`,
  `kids-eu-34-to-us-shoe-size.html`, `kids-eu-36-to-us-shoe-size.html`,
  `kids-shoe-size-converter.html`, `kids-us-3-to-eu-shoe-size.html`,
  `kids-us-4-to-eu-shoe-size.html`
- `clothing-size-pages.html` (jacket cross-link removed)

**Note on the list above:** `programmatic-pages/` and `measurement/` each
appear twice in this report — once here (as directories Phase 5F **did**
touch, but only these 6 and 9 specific files respectively, for one
single-line jacket-link removal each) and once in the "Not touched" list
immediately below (which excludes every *other* file in those same
directories — the ~750 other `programmatic-pages/*.html` files and ~110
other `measurement/*.html` files were not touched by Phase 5F at all, even
though they were already modified by earlier phases). These are not
contradictory: this phase touched a named, exact, 15-file subset of two
otherwise-untouched directories, and both facts hold simultaneously. Every
filename in the touched subset is enumerated explicitly above so there is no
ambiguity about which files that refers to.

**Not touched by Phase 5F** (explicitly, per Phase 5E §13.B, verified by
absence from every action log above): `data/clothing_sizes.json`, `app.js`,
every `programmatic-pages/*.html` file **except** the 6 named above, every
`measurement/*.html` file **except** the 9 named above, `us/`, `uk/`, `eu/`,
`ca/` in their entirety, footer architecture (beyond running the existing,
unmodified standardization tool), AI Citation Engine logic, card system,
Cloudflare configuration, `robots.txt`, global navigation, the Phase 4
`maxlength` fix, the Phase 5A fetch-path fix.

## 16. Pre-Existing Working Tree Changes

At Phase 5F's start: **1,033** `git status --short` entries (HEAD
`0dc41c5ad56cbdd1e34bc41d1f2b55d3e17b09b5`), all attributable to Phases 3, 4,
5A, 5B (report-only), 5C, 5D (report-only), 5E (report-only). None of these
were reverted, reset, stashed, or otherwise disturbed — confirmed by the
absence of any destructive git command in this phase's command history, and
by the fact that every file this phase touched is listed explicitly in §15.

## 17. Git Integrity

- **HEAD before:** `0dc41c5ad56cbdd1e34bc41d1f2b55d3e17b09b5`
- **HEAD after:** `0dc41c5ad56cbdd1e34bc41d1f2b55d3e17b09b5` — unchanged
- **`git status --short` before:** 1,033 entries — broken down as 1,030
  modified (`M`) + 0 deleted (`D`) + 3 untracked (`??`: the `reports/`
  directory marker, `scripts/test-clothing-route-generator.js`,
  `scripts/test-converter-contract.js` — all three already present before
  Phase 5F began, from earlier phases).
- **`git status --short` after:** 1,083 entries — broken down as 1,017
  modified (`M`) + 32 deleted (`D`) + 34 untracked (`??`). Full +50
  reconciliation, verified by direct enumeration (not estimated):
  - **`??` : +31** — exactly the 31 brand-new `clothing/*.html` filenames
    created by the migration (§7). (34 total `??` after − 3 already present
    before = 31 new.)
  - **`D` : +32** — exactly the 32 files removed in Pass 2 (§14): 31
    migration-orphaned clothing filenames + the retired jacket page. These
    are git-tracked files (present in HEAD), so deleting them from the
    working tree makes git report them as `D`, not make them vanish from
    `git status` — confirmed by direct listing, not assumed.
  - **`M` : −13 net**, decomposed into two opposite movements that must be
    read together, not net-summed at face value:
    - **−32**: the 32 files that moved from `M` into `D` (a file can't be
      both modified-in-place and deleted at once) subtract from the `M`
      bucket.
    - **+19**: files Phase 5F modified for the **first time** in this
      session (i.e., untouched by any earlier phase, so their modification
      is wholly attributable to Phase 5F) — verified by direct enumeration:
      the 10 `brands/*.html` files (§15), `clothing-size-pages.html`,
      `data/ai-signals.json`, the 6 sitemap-family files
      (`sitemaps/sitemap-high.xml`, `sitemaps/sitemap-medium.xml`,
      `sitemaps/sitemap-low.xml`, `sitemaps/indexing-feed.xml`,
      `sitemap.xml`, `sitemap/index.html`), and `_redirects`. 10+1+1+6+1 = 19,
      confirmed against `git status` for each of the 19 filenames
      individually.
    - Net: 1,030 − 32 + 19 = 1,017, matching the actual post-migration `M`
      count exactly.
  - Every other file this phase touched (`scripts/generate-phase10-pages.js`,
    `scripts/generate-programmatic-pages.js`, `data/clothing_routes.json`,
    `scripts/test-clothing-route-generator.js`, the 9 `measurement/*.html`
    files, the 6 `programmatic-pages/*.html` files, and the 94
    `clothing/*.html` files that kept their existing filename) was **already**
    `M` (or, for the one test file, `??`) before Phase 5F began, from earlier
    phases — Phase 5F added further changes to already-dirty files, which
    does not change their bucket or the count.
  - Total: 1,033 + 31(`??`) + 32(`D`) − 13(net `M`) = 1,083. ✓
- **`git diff --check`:** exit 0, clean
- **No destructive git command was run** (no `checkout`, `restore`, `reset --hard`, `clean`, `stash`) — all file removal in this phase was the Pass 2 migration cleanup (`fs.unlinkSync` on exactly the 32 verified-orphaned files), a filesystem operation, not a git operation, and fully accounted for in §14/§26.

## 18. Known Limitations / Follow-Ups

1. **Live 301 redirect behavior was not verified end-to-end.** The local dev
   server doesn't process `_redirects` (a Cloudflare Pages-specific
   feature). Verified: file syntax, source/target correctness, and that
   every redirect source correctly has no live file backing it (so the
   redirect is the only thing that can serve that URL). **Recommend a
   post-deploy smoke test** on the actual Cloudflare Pages environment
   confirming all 32 redirects return 301 with the correct `Location`
   header, before considering this fully shipped.
2. **Redirect count is 32, not the assumed 39** — 7 collision-point URLs
   were correctly excluded because they're live pages, not removed ones
   (§8). This is a correction to the brief's arithmetic, not a shortfall;
   fully explained and independently re-verifiable via §12/§14.
3. **26 external cross-link references were removed** (§10) — beyond Phase
   5E's declared file-scope, discovered only because Part 18's repository-
   wide search is mandatory. `build/adsense-approval-report.json` (6
   references) was deliberately **not** touched — classified as a dated,
   one-off historical audit artifact (like `reports/`), not part of any live
   build pipeline, consistent with how prior phases have treated similar
   files.
4. **Remaining, unchanged from Phase 5D/5E:** the 89 pages with stale-but-
   factually-correct template wording, and the general kids/JP/CN clothing
   dataset-expansion opportunity — both explicitly out of scope for this
   phase, untouched.
5. **`internal-link-injector.js` reported "0 pages updated"** during the
   `build:sitemaps` run — not investigated further in this phase (not part
   of any required gate); noted for awareness only.

## 19. Final Verdict

Every required gate passed: source fix implemented and tested before any
destructive operation; two-pass migration executed with a hard safety gate
between passes; all 15 final filesystem assertions pass; both discovered
deviations from the brief (redirect count, external cross-link scope) were
investigated to a full, evidence-based, documented resolution rather than
either blindly matching a stated number or silently improvising; real
browser certification passed 20/20; all automated test suites and validation
tooling pass at their required baselines; git history is clean and HEAD is
unchanged.

**PHASE 5F — PASS**
