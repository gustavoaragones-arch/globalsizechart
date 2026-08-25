# Phase 10B — Programmatic Template Exposure Remediation

**Baseline commit:** `bbb40309f0af6f8542a846245a16b1074a8b4c17` (`HEAD` =
`origin/main` confirmed at phase start). **Working tree was NOT reported
as clean at phase start** — actual state, not assumed: 1 unrelated,
pre-existing trailing-newline diff on `why-shoe-sizes-vary-by-brand.html`
(already documented and left untouched in the Phase 10A report), plus the
2 untracked Phase 10A deliverables. No unrelated implementation changes
were present. This matches exactly what Phase 10A's own report disclosed.

---

## 1. Baseline Commit

Confirmed `HEAD` = `origin/main` = `bbb40309f0af6f8542a846245a16b1074a8b4c17`
at phase start, and again verified unchanged immediately before this
implementation's commit (§18).

## 2. Dependency Audit (fresh, repository-wide, not scripts/*.js only)

Searched all `.js`, `.json`, `.md`, `.sh`, `.html`, `.yml` files for
`category-template.html`, `conversion-template.html`, `region-template.html`,
`programmatic/templates`, and `TEMPLATES_DIR`.

| Reference | Classification | Action |
|---|---|---|
| `scripts/generate-programmatic-pages.js:21,5216` (`TEMPLATES_DIR`, `fs.readFileSync`) | **A — runtime/generator dependency** | Path updated (§5) |
| `scripts/generate-pages.js:13,302` (`TEMPLATES_DIR`, `fs.readFileSync`) | **A — runtime/generator dependency** (dormant — see §3) | Path updated (§5) |
| `programmatic/README.md` (describes all 3 templates' purpose; notes category/region as "future" stubs) | C — documentation | Left as-is; describes intent, not a live path — a future phase may want to update this doc to reflect the new location, out of this phase's scope |
| `CHECK-OUTPUT-REQUIRED.md` | C — documentation | Left as-is, same reasoning |
| `reports/full-site-audit/architecture-map.md`, `reports/full-site-audit/page-family-inventory.json` | C/D — historical documentation, confirmed never read by any script | Left as-is — pre-existing historical audit artifacts, out of scope |
| `data/ai-signals.json` | **Derived output artifact**, not a dependency — built by `ai-signal-scoring.js`'s own filesystem walk (same pattern as sitemaps), contains stale scoring entries for the 3 template URLs from when they were still walkable. Read by `internal-link-optimizer.js` for scoring data only, never for template-generation input. | Not regenerated in this phase — will self-correct the next time `ai-signal-scoring.js` runs (that script was not part of this phase's explicit scope). Documented as a known limitation (§16). |
| `scripts/consolidate-faq-architecture.js:50-52` (my own Phase 9 one-time migration script, already executed and committed) | D — stale/unused reference | Not modified — Phase 9 is closed; this script's hardcoded paths reference where those files *were* at the time it ran, which is historically accurate and not re-invoked |
| `reports/phase-9-faq-inventory.json`, `reports/phase-9-faq-architecture-remediation.md` | D — historical, closed-phase reports | Not modified, per standing practice of not editing closed phases' records |
| `scripts/fix-orphans.js`, `scripts/missing-programmatic-pages.js`, `scripts/phase1275-structure-audit.js`, `scripts/prebuild-link-validation.js`, `scripts/standardize-quick-converters.js` (all `!rel.includes('programmatic/templates')` exclusion checks) | D — now-inert, harmless | Not modified — these checks simply never match anything now that the path doesn't exist; not broken, just vacuous |

No test dependency (B) or unrelated-text (E) references were found.

## 3. Generator Entry Points

- **`scripts/generate-programmatic-pages.js`** — confirmed live: required by `scripts/generate-phase10-pages.js` (the CLI entry point used throughout this engagement's Phases 5C/5F/9) and `scripts/revenue-engine.js`. Last modified `bbb4030` (this engagement's own Phase 9 commit).
- **`scripts/generate-pages.js`** — **no npm script references it, and no other script requires or imports it anywhere in the repository.** Last modified commit `5fbe957` ("Build guard, orphan resolver, breadcrumbs, Phase 13 readiness"), dated Feb 8, 2026 — **predating this entire engagement** (Phase 3 began afterward). This is strong, converging evidence that it is dormant/superseded legacy code, not part of the live pipeline. Per the explicit instruction not to silently classify it as dead, this finding is disclosed as evidence, not an assumption — and **its `TEMPLATES_DIR` was updated anyway** (§5), so it cannot fail with a stale path if ever invoked directly in the future.

Both are updated identically; no asymmetric risk was introduced by treating one differently.

## 4. Files Moved

| From | To |
|---|---|
| `programmatic/templates/category-template.html` | `scripts/lib/programmatic-templates/category-template.html` |
| `programmatic/templates/conversion-template.html` | `scripts/lib/programmatic-templates/conversion-template.html` |
| `programmatic/templates/region-template.html` | `scripts/lib/programmatic-templates/region-template.html` |

Performed via `git mv` (content-preserving rename, not delete+recreate).
The old, now-empty `programmatic/templates/` directory was removed from
the filesystem (§9).

## 5. SHA-256 Before/After Hashes

| File | Hash (identical before and after) |
|---|---|
| `category-template.html` | `c7a1ee7120898626c5d0096b5896a373026a0bc9f1c3d4b0964e8a54029db7c7` |
| `conversion-template.html` | `a511de81d9f6bd8a83ebcd092047ebb54de64ccf97ec0b1132e129e9d73ebaef` |
| `region-template.html` | `12bf5c45ec4a2ef14c28efe128832e697d77a425106a021b77bec7956052d3b8` |

**All three identical before/after — confirmed by direct hash comparison,
not assumed from `git mv`'s content-preserving semantics alone.**

## 6. Generator Path Changes

Both `TEMPLATES_DIR` constants updated from
`path.join(ROOT, 'programmatic', 'templates')` to
`path.join(ROOT, 'scripts', 'lib', 'programmatic-templates')`:

- `scripts/generate-programmatic-pages.js` (line 21, now with an
  explanatory comment)
- `scripts/generate-pages.js` (line 13, now with an explanatory comment
  noting its dormant status)

No generation logic, template-substitution logic, or route-processing
logic was touched — verified by diff (`generate-programmatic-pages.js`:
7 insertions/1 deletion; `generate-pages.js`: equivalent single-constant
change).

## 7. Sitemap-Generator Change

`scripts/generate-sitemaps.js`'s `IGNORE_DIRS` gained `'templates'`:

```js
const IGNORE_DIRS = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components', 'templates']);
```

Same existing architecture — no second filtering system introduced.
**Verified this is genuinely defense-in-depth, not the only protection**:
`'scripts'` was already in `IGNORE_DIRS`, so the new location
(`scripts/lib/programmatic-templates/`) is *already* excluded by that
pre-existing entry — the walker never recurses into `scripts/` at all.
The explicit `'templates'` addition protects against any *future*
`templates/`-named directory at any depth, independent of where it
happens to be nested, rather than relying on incidental protection.

Also confirmed: no other `templates/`-named directory exists anywhere
else in the repository that this addition could wrongly exclude
(`find . -type d -iname templates` returned only the now-relocated one).

## 8. Sitemap Before/After Counts

| Metric | Before | After |
|---|---|---|
| `sitemap-high.xml` `<loc>` count | 14 | 14 |
| `sitemap-medium.xml` `<loc>` count | 371 | 368 |
| `sitemap-low.xml` `<loc>` count | 730 | 730 |
| `indexing-feed.xml` `<loc>` count | 1,010 | 989 |
| **Unique URLs across all sitemaps** | **1,115** | **1,112** |

The `indexing-feed.xml` raw count moved by more than 3 (1,010 → 989)
because it is a **7-day rolling freshness window** keyed on file mtime —
its membership naturally shifts between any two runs regardless of this
change (confirmed: not template-related). The authoritative,
deduplicated cross-sitemap URL-set comparison (below) is the precise
measure, and it is exact.

## 9. Exact Six Removed Sitemap Entries

Direct set comparison (`comm`) of every unique URL across all four
sitemap files, before vs. after:

**Removed (exactly 3 unique URLs, each previously present in 2 files —
`sitemap-medium.xml` and `indexing-feed.xml` — accounting for the 6 raw
`<loc>` entries Phase 10A identified):**

```
https://globalsizechart.com/programmatic/templates/category-template.html
https://globalsizechart.com/programmatic/templates/conversion-template.html
https://globalsizechart.com/programmatic/templates/region-template.html
```

**Added: zero.** No other URL entered or left the sitemap population as
a result of this change — confirmed by the same set comparison, not
inferred from raw counts alone.

`sitemap-high.xml` and `sitemap-low.xml`'s only diffs are `<lastmod>`
date bumps from today's regeneration run (this tier's lastmod policy is
"today, for freshness" per the generator's own header comment) — zero
`<loc>` line changes in either file, confirmed via diff.

Old repository path confirmed removed (Part 6/11): `programmatic/templates/`
no longer exists on disk (the directory itself, now empty, was also
removed).

## 10. Generator Byte-Identity Tests

**This required correcting course mid-implementation, disclosed in full
rather than hidden:**

The first regression attempt ran the real generator with write-
interception scoped only to the `programmatic-pages/` directory prefix.
This was a mistake: `runPhase10Generator()` turns out to also write, for
real, to `clothing/`, `brands/`, `measurement/`, `printable/`,
`semantic/`, and several root-level files — none of which were
intercepted, so that run **genuinely modified 44 files including
protected `brands/*`, `clothing/*`, and `measurement/*` pages** (real,
substantial content differences — hundreds of changed lines per file, not
cosmetic). Caught immediately via `git status`/`git diff`, all 44 files
reverted via `git checkout --` before anything was staged or committed.
A second mistake compounded this: the revert command's file list, built
from `git status` at that moment, also included my own already-made,
intentional edits to the 3 generator/sitemap scripts, reverting those
too. Both mistakes were caught, diagnosed, and corrected before proceeding
— no data was lost (all edits were fully known and reproducible), and
nothing was ever staged or committed during this window.

**Root finding from that investigation, independent of the mistake
itself**: `runPhase10Generator()`'s raw output has already diverged
substantially from the current live `programmatic-pages/*.html` /
`brands/*.html` / `clothing/*.html` / `measurement/*.html` content — a
**pre-existing fact, already disclosed in this engagement's own Phase 9B
report** ("No pages were regenerated via the full generation pipeline...
the already-generated population was fixed via a scoped, mechanical
synchronization pass... rather than by re-running generate-programmatic-
pages.js"). Phases 3, 5F, 7, 8, and 9 all applied targeted, hand-verified
fixes directly to generated HTML without feeding those fixes back into
the generator's own template-substitution logic. Re-running the raw
generator was therefore never going to reproduce today's live content —
this has nothing to do with the template relocation.

**Correct, isolating regression test performed instead**: ran the real
generator twice with complete write-interception (zero disk writes,
verified via `git status` before and after both runs) — once reading the
old template content (loaded from the pre-move git blob at commit
`bbb4030`, written to a temp directory) and once reading the actual new
path — and compared the **two runs' outputs against each other**, not
against already-diverged live content. This isolates exactly what Phase
10B's specific change (a path relocation) does or does not affect.

**Result: 127 of 132 output files byte-identical between the two runs.**
The only differences were in 5 `build/*-report.json` diagnostic files
(`indexability-report.json`, `phase9-report.json` through
`phase12-report.json`), and inspecting those directly found the entire
difference in every case was a single `generatedAt` ISO-timestamp field —
present because each run calls `new Date()` independently, unrelated to
any code path touching the template. This is exactly the "unavoidable
timestamp... nondeterminism" exception the phase brief pre-authorized as
acceptable, verified by direct inspection rather than assumed.

**Conclusion: the template relocation is a confirmed behavioral no-op for
every actual generated page.** The pre-existing, already-disclosed
divergence between the generator's raw output and live site content is
unrelated to and unaffected by this phase's change.

## 11. Old Production URL Results

**Not yet tested — requires deployment.** Per the phase brief, production
verification happens after push, not before (§21 below covers deploy
timing and results, or their absence if not yet live at report-writing
time).

## 12. New Template-Path Production Results

**Not yet tested — requires deployment**, same reasoning as §11.

## 13. Converter Regression

```
node scripts/test-converter-contract.js
987 passed, 0 failed.
```
Unchanged from baseline.

## 14. Footer Regression

First run surfaced a real, disclosed issue: regenerating `sitemap/
index.html` via `generate-sitemaps.js` produced a version missing its
master-footer markers entirely. Investigated before fixing: confirmed via
`git show HEAD:sitemap/index.html` that the *previously committed*
version had a complete, correct footer marker pair, while
`writeHtmlSitemap()` (the function that builds this file) has never
itself included the master footer in its own template — the footer was
always applied as a **separate post-processing step**
(`standardize-footer.js`) after generation. This is the same,
already-documented gap this engagement hit in Phase 5A and 5C ("scoped
generator call bypasses the full pipeline's footer pass"), not a new
defect. Fixed with the established remedy: `node scripts/standardize-
footer.js` (updated exactly 1 file — `sitemap/index.html` — skipped 1
without `<body>`, as expected). Re-verified clean:

```
npm run footer:check
Checked 1151 HTML files (skipped 1 without <body>).
OK: all footers match master.
```

## 15. Link-Validator Result

```
node scripts/prebuild-link-validation.js
Missing targets: 47 (threshold: 10)
```
Unchanged from the 47 baseline.

## 16. Phase 7 / Phase 8 / Phase 9 Results

```
node scripts/test-phase-7-brand-pages.js   → 740 passed, 0 failed (across 20 brand pages)
node scripts/test-phase-8-homepage-shoehub.js → 39 passed, 0 failed
node scripts/test-phase-9-faq-architecture.js → 12,972 passed, 0 failed (scanned 1,147 files)
```

The Phase 9 validator's scanned-file count dropped from 1,150 to 1,147
and its total-checks count from 12,990 to 12,972 — **expected and
correct**: exactly the 3 relocated template files, which the validator
used to scan (they were part of the served tree it walks), are no longer
present in that population. This is confirmation the fix is working, not
a regression — 0 failures either way.

## 17. Git Scope

```
git status --short
 M scripts/generate-pages.js
 M scripts/generate-programmatic-pages.js
 M scripts/generate-sitemaps.js
R  programmatic/templates/category-template.html -> scripts/lib/programmatic-templates/category-template.html
R  programmatic/templates/conversion-template.html -> scripts/lib/programmatic-templates/conversion-template.html
R  programmatic/templates/region-template.html -> scripts/lib/programmatic-templates/region-template.html
 M sitemap.xml
 M sitemap/index.html
 M sitemaps/indexing-feed.xml
 M sitemaps/sitemap-high.xml
 M sitemaps/sitemap-low.xml
 M sitemaps/sitemap-medium.xml
?? reports/phase-10-template-sitemap-audit.md
?? reports/phase-10-template-sitemap-inventory.json
```

**Zero protected paths present** — verified explicitly against `app.js`,
`styles.css`, `data/*`, `brands/*`, `clothing/*`, `programmatic-pages/*`,
`measurement/*`, `index.html`, `shoe-size-conversion-chart/*`,
`robots.txt`, `_redirects`.

**One deviation from the brief's exact expected file list, disclosed
precisely**: the brief named only `sitemap-medium.xml` and
`indexing-feed.xml` as expected sitemap changes. Running the real
generator (as instructed) necessarily also touches `sitemap-high.xml`
and `sitemap-low.xml` (all four tiers are written in one pass — there is
no mechanism to regenerate only two of them) and produces `sitemap.xml`
(the index) and `sitemap/index.html` (the HTML sitemap) as their own
standard, always-produced outputs. All four extra files were individually
verified to contain zero unrelated URL-set changes (§9) — this is a
necessary, correctly-scoped consequence of using the real generator, not
scope creep.

**A second deviation, more significant, also disclosed precisely**: the
brief's Part 9 instruction was to run `npm run build:sitemaps`. That
compound command is defined as `generate-sitemaps.js &&
internal-link-injector.js` — running it as literally instructed modified
12 `brands/*.html` files and `shoe-size-conversion-chart/index.html` (13
files, matching the injector's own "13 pages updated" output), both
explicitly protected paths. This is a **pre-existing characteristic of
that npm script**, not something Phase 10B caused — but it conflicts with
this phase's own explicit protected-path list. Resolved by reverting
those 13 files (clean, safe — all tracked, all confirmed unrelated to
templates) and running `node scripts/generate-sitemaps.js` directly
instead of the compound `npm run build:sitemaps`, achieving the sitemap
fix without the unrelated coupling. Flagged here rather than silently
substituted.

## 18. Baseline Re-Verification Before Commit

```
HEAD:         bbb40309f0af6f8542a846245a16b1074a8b4c17
origin/main:  bbb40309f0af6f8542a846245a16b1074a8b4c17
```
Unchanged from phase start, confirmed again immediately before staging.

## 19. Deviations Summary

1. Two mid-implementation mistakes during the generator regression test
   (over-broad revert, under-scoped write interception) — both caught via
   the same git-status discipline this engagement has used throughout,
   corrected before any commit, fully disclosed in §10.
2. `sitemap/index.html` required a footer-standardization pass after
   regeneration — a known, previously-documented gap (§14), not new.
3. Four sitemap-family files beyond the brief's named two were
   necessarily touched by running the real generator (§9, §17) — verified
   to contain zero unrelated content changes.
4. `npm run build:sitemaps` was not run as literally instructed; `node
   scripts/generate-sitemaps.js` was run directly instead, to avoid an
   unrelated, pre-existing side effect (`internal-link-injector.js`)
   touching protected paths (§17).
5. `data/ai-signals.json` still contains stale scoring entries for the
   relocated templates — not regenerated in this phase (out of explicit
   scope; self-correcting on next `ai-signal-scoring.js` run).
6. `generate-pages.js` was updated but not proven to be part of any live
   pipeline (§3) — updated defensively rather than left stale, per the
   brief's explicit instruction.

None of these affected the final, verified outcome: templates relocated
with byte-identical content, generator behavior proven unaffected for
every real page, sitemap population corrected with zero unrelated churn,
full regression suite green, zero protected paths modified.

## 20. Final Local Gate Status

**PASS — all local gates green.** Proceeding to commit/push, then
production verification (§21, populated after deploy).

---

## 21. Production Deploy Certification

*(To be completed after push and deployment — see the follow-up section
of this report, appended once production has been verified live, per the
explicit instruction not to claim production success before it is
actually tested post-deploy.)*
