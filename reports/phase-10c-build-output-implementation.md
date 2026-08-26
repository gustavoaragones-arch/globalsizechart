# Phase 10C-1 — Public Build Output Implementation & Local Certification

**Mode: IMPLEMENTATION + LOCAL VERIFICATION ONLY.** No Cloudflare
dashboard setting, `wrangler.jsonc`/`wrangler.toml`, `_redirects`
behavior, or `_headers` behavior (beyond copying the existing files
verbatim into `dist/`) was touched. Nothing was pushed or deployed. This
report certifies the local build artifact only.

## Addendum — Cloudflare Build-Environment Failure & Fix

**The first real Cloudflare deployment of commit `a4014ca` failed during
the Build step**, before any production content was affected (the prior
deployment remained live throughout). Cloudflare's own error:

```
Error: EACCES: permission denied, mkdir
'/private/tmp/claude-501/-Users-gus-Documents-APPS-globalsizechart/4285c84c-4684-4712-941e-5c92c631856d/...'
```

**Root cause**: `scripts/build-public-dir.js` line 237 hardcoded this
developer's local Claude Code session scratchpad directory as the
destination for its debugging/certification inventory file:

```js
const inventoryDir = '/private/tmp/claude-501/-Users-gus-Documents-APPS-globalsizechart/4285c84c-4684-4712-941e-5c92c63185d6/scratchpad/phase10c';
fs.mkdirSync(inventoryDir, { recursive: true });
```

This path is meaningless outside this one development machine's session
— it does not exist, and cannot be created (`EACCES`), inside Cloudflare's
ephemeral Linux build container. **This is a real, previously-undetected
gap in Phase 10C-1's local certification**: every certification check in
that phase ran on this same development machine, where the hardcoded path
happened to already exist and be writable, so nothing exercised the
portability of that one line until Cloudflare's own build environment did.

**Fix**: replaced the hardcoded path with `os.tmpdir()` +
`fs.mkdtempSync()` — the standard, environment-portable Node idiom for
"a uniquely-named, already-created, already-writable temporary directory,"
which resolves correctly on this machine, in CI, and inside Cloudflare's
build container alike, since it derives from the runtime's own
`TMPDIR`/`TMP`/`TEMP` environment variable (or `/tmp` if unset) rather
than any fixed string.

**Verified unchanged**: the build's actual output — `dist/`'s 1,178
files and its certified inventory hash
(`5bcf850671a782c639948db8d72cef18e735ca375afe8c6c83aee9b280046987`) —
is identical before and after this fix, since only the location of the
(non-deployed, debugging-only) inventory file changed, never the copied
site content. Full re-certification results in the addendum sections
below.

**New regression coverage added**: `scripts/test-phase-10c-portable-tmp.js`
— a static source scan (fails if the exact forbidden substrings
`/Users/`, `claude-501`, `/private/tmp/claude-` ever reappear in the
script) plus a dynamic run of the real script as a child process with
`TMPDIR` redirected to a freshly created, distinctly-named directory
simulating a different machine's temp root, proving the script actually
honors the environment's temp-directory setting rather than falling back
to anything fixed. Confirmed non-vacuous: run against the actually-
committed buggy version of the script (via `git show a4014ca:...`), the
static-scan portion of this test would have failed.

**Test-harness finding, disclosed and worked around without touching
out-of-scope files**: running the general regression suite (`footer:check`,
`scripts/prebuild-link-validation.js`) while `dist/` existed on local
disk produced inflated/spurious results — `footer:check` reported 2,298
files scanned (expected ~1,151) and the link validator reported entries
like `dist/measurement/28-cm-to-us-shoe-size.html` and `dist.html` that
are artifacts of these older, pre-existing scripts having no awareness of
`dist/` (they were written before this build-output concept existed, and
were never taught to skip it). Neither script is in this phase's
authorized change scope, and `dist/` is gitignored and never part of a
real CI/production checkout, so this only manifests when running these
particular developer-tooling scripts locally on a machine that happens to
already have a `dist/` sitting on disk. Worked around by removing `dist/`
immediately before running the general regression suite, then rebuilding
it afterward — both established baselines (footer: 1,151 files, all
match; link validator: 47, unchanged) confirmed clean once `dist/` was
out of the way. Flagged here as a real, worth-fixing-eventually gap in
those two scripts, out of scope for this fix.

## 1. Baseline HEAD

`86c5706883dca37341b23e00fc7d88966ef63eb2` — verified equal to
`origin/main` before any work began.

## 2. Working-Tree Baseline

Not assumed clean; recorded exactly as found:

```
 M .gitignore
?? reports/phase-10c-cloudflare-serving-architecture-audit.md
?? scripts/build-public-dir.js
```

All three are this engagement's own prior-session work (the Phase 10C
audit and its first-draft script/`.gitignore` addition), not unrelated
external changes — left in place and built upon, not discarded.

## 3. Approved Allowlist

33 directories, 7 named root files, and the root-level `*.html` glob, per
the Director's Part 2 specification — reproduced verbatim in
`scripts/build-public-dir.js`'s `PUBLIC_DIRS`/`PUBLIC_LOOSE_FILES`
constants. Cross-checked programmatically against the actual repository
root: **every top-level entry is accounted for** (zero unclassified
items) once the script's own prior-run `dist/` output is excluded from
consideration.

## 4. Excluded Directories

`authority/`, `build/`, `cloudflare/`, `components/`, `config/`, `docs/`,
`generators/`, `programmatic/`, `reports/`, `scripts/`, `utils/`, plus
`.git/`, `.github/`, `node_modules/` — recognized (not walked) by the
script, used only for the unclassified-item self-check, never as the
inclusion mechanism.

## 5. Implementation Architecture

`scripts/build-public-dir.js`: pure allowlist copy, fails closed. The
copy step only ever recurses into `PUBLIC_DIRS`/`PUBLIC_LOOSE_FILES`/root
`*.html` — it never walks the full repository and skips known-bad
entries. Before copying anything, the script independently enumerates the
actual repository root and hard-fails (`process.exit(1)`, before any
`dist/` mutation) if it finds an entry that is in neither the allow- nor
the recognized-exclude set. No `cp -R`/`rsync`/shell copy is used — every
copy goes through Node's `fs.copyFileSync`/`fs.mkdirSync`, called from
auditable, named functions.

## 6. Build Script Behavior — Safety Mechanisms Implemented

- **Path-escape protection** (Part 10): every destination path is
  resolved and asserted to fall under `dist/` before any write.
- **Symlink refusal** (Part 4/3.12): `fs.lstatSync` (not `statSync`) is
  used at every level of the recursive copy; any symlink encountered — at
  the top level or nested arbitrarily deep inside an allowlisted
  directory — halts the build with the source path, symlink target, and
  whether the target resolves inside the repository. **Verified
  necessary but currently inert**: a dedicated symlink sweep of the
  entire allowlisted tree found **zero symlinks** anywhere in the current
  public tree, so this code path was not exercised by real repository
  content — it is defense-in-depth for the future, not a fix for a
  present condition.
- **Nested `.git`/`node_modules` refusal** (Part 3.11): explicit check
  inside the recursive walk, defense-in-depth beyond the structural fact
  that these are never reachable via the allowlist alone.
- **Destructive-removal guard**: before `rm -rf`-equivalent removal of
  any prior `dist/`, the script asserts the resolved path's basename is
  exactly `dist` and its parent is exactly the computed repo root,
  refuses to proceed through a symlinked `dist/`.
- **Deterministic inventory**: every build writes a full
  `{path, bytes, sha256}` manifest for every file in `dist/`, to a
  scratchpad location entirely outside the repository and outside
  `dist/` itself (never inside the public output), plus an aggregate
  hash over the sorted manifest for quick equality checks between runs.

## 7. Real Defect Found and Fixed During Implementation

The first working version of the script copied `images/.DS_Store` (a
macOS filesystem artifact present untracked on this local disk) into
`dist/images/.DS_Store`. **This specific instance would never have
reached Cloudflare's actual deployment** — Cloudflare Pages builds from a
fresh `git clone`, and `.DS_Store` is `.gitignore`d, so it was never in
git to begin with. But the script itself had a real gap: it did not
defend against untracked OS-metadata files inside allowlisted
directories on any given build machine. Fixed by adding an
`isOsArtifact()` check (matching `.gitignore`'s own "OS files" pattern
list: `.DS_Store`, `Thumbs.db`, `ehthumbs.db`, `.Spotlight-V100`,
`.Trashes`, `._*`) to the recursive copy's directory-entry loop. This is
content hygiene, not a second access-control/denylist mechanism — it
operates one level below the public/private classification and does not
weaken the allowlist architecture. Re-verified clean after the fix
(§9-10 below).

## 8. Source File Count / Dist File Count

**1,178 / 1,178** — exact match, every build.

## 9. Source Byte Count / Dist Byte Count

**41,409,014 / 41,409,014 bytes** — exact match (implied by, and
independently confirmed alongside, the per-file SHA-256 identity in §12).

## 10. Complete Inventory Hash

`5bcf850671a782c639948db8d72cef18e735ca375afe8c6c83aee9b280046987`

(SHA-256 over the sorted `path\tsha256\tbytes` manifest of all 1,178
files — identical across three independent runs; see §19.)

## 11. Category Counts

| Category | Files |
|---|---|
| `ai/` | 1 |
| `brands/` | 20 |
| `ca/` | 3 |
| `eu/` | 3 |
| `uk/` | 3 |
| `us/` | 3 |
| `clothing/` | 125 |
| `data/` | 17 |
| `eu-to-us-shoe-size/` | 1 |
| `uk-to-us-shoe-size/` | 1 |
| `us-to-eu-shoe-size/` | 1 |
| `us-to-uk-shoe-size/` | 1 |
| `guides/` | 1 |
| `images/` | 3 |
| `kids-shoe-size-chart/` | 1 |
| `kids-shoe-size-pages/` | 1 |
| `mens-shoe-size-chart/` | 1 |
| `mens-shoe-size-pages/` | 1 |
| `womens-shoe-size-chart/` | 1 |
| `womens-shoe-size-pages/` | 1 |
| `shoe-size-pages/` | 1 |
| `knowledge/` | 1 |
| `legal/` | 9 |
| `measurement/` | 120 |
| `printable/` | 5 |
| `programmatic-pages/` | 765 |
| `semantic/` | 6 |
| `shoe-size-conversion-chart/` | 1 |
| `shoe-size-conversions/` | 7 |
| `sitemap/` | 1 |
| `sitemaps/` | 4 |
| `tools/` | 4 |
| `widget/` | 1 |
| root `*.html` | 57 |
| **Total** | **1,178** |

## 12. SHA-256 Reconciliation Result — PASS

Independent Python re-implementation (not the build script checking its
own work) walked the full allowlist from source, built `PUBLIC_SOURCE_SET`
and `DIST_SET` as path-relative sets (OS artifacts excluded from both, on
the same basis), and compared:

- `PUBLIC_SOURCE_SET` size: 1,178; `DIST_SET` size: 1,178
- Missing from dist: **0**; Extra in dist: **0**
- Per-file SHA-256 comparison (source vs. dist), all 1,178 files: **0
  mismatches**
- `_headers`/`_redirects` individually re-verified by direct `shasum`:
  identical.

## 13. Production Comparison Results

18-category cross-section tested against live production, per Part 15.
**All divergences investigated and classified — none required modifying
source to force a pass:**

| Sample | Result |
|---|---|
| homepage (`/`) | **Category C** — differs. Confirmed via `git log`/`git diff` that `index.html` has zero uncommitted changes and was last touched by the pre-existing "Phase 8" commit; production is running older content than current HEAD, a pre-existing staleness unrelated to this phase. `dist/index.html` correctly matches the tracked source (§12). |
| shoe converter, clothing converter, brand page (`nike`), regional hub (`uk/`), measurement page, programmatic page, printable page, AI page (`ai/`), widget page | **Category A** — byte-identical to `dist/`, after following Cloudflare's known `.html`→extensionless 308 (content-layer match confirmed, not just a redirect-target match). |
| shoe-size-conversion-chart (regional hub / legal-adjacent sample) | **Category C** — same pre-existing staleness pattern as the homepage; `git log`/`git diff` confirms zero uncommitted changes, last touched by the same pre-existing commit. |
| `robots.txt` | **Category B** — differs, but only by a self-labeled `# BEGIN Cloudflare Managed content` / `# END Cloudflare Managed Content` block that Cloudflare injects into `robots.txt` responses at the edge (a documented platform feature), wrapped around content that is otherwise identical to the tracked source. Not a source or build defect. |
| `sitemap.xml`, `data/shoe_sizes.json`, `images/body-measurements.png` | **Category A** — byte-identical. |
| `_headers`, `_redirects` | **Category B** — Cloudflare Pages does not serve these as literal fetchable paths at all; confirmed by comparing production's response to `/_headers` against its response to a deliberately nonexistent path (`/totally-random-nonexistent-xyz789`) — byte-identical, proving both hit the same catch-all/404-equivalent handling rather than the literal file. The local source-vs-dist SHA-256 match (§5/§12) is the correct and only meaningful check for these two files. |

**No divergence found in this phase was caused by, or is a defect in, the
Phase 10C build output.** The two Category-C findings are disclosed as
real, pre-existing facts about production for the Director's awareness,
not remediated here (out of this phase's LOCAL-ONLY scope).

## 14. Sitemap Coverage Result — PASS

1,116 unique `<loc>` URLs across `sitemap.xml` + `sitemaps/*.xml`. 4 are
non-`.html` (the sitemap files' own self-references) and are not required
to resolve to an HTML file. Of the remaining `.html`/trailing-slash
URLs: **0 missing from `dist/`.**

## 15. `app.js` Data-Path Result — PASS

`app.js` contains exactly 4 `fetch()` calls, all static string literals
(no template-literal or dynamic paths to miss): `/data/shoe_sizes.json`,
`/data/clothing_sizes.json`, `/data/regions.json`, `/data/brands.json`.
All 4 confirmed present in `dist/data/`. **100% resolution.**

## 16. Fail-Closed Test — PASS

Created `__phase10c_publicity_test__.txt` and
`__phase10c_private_test__/secret.txt` at repository root. Running the
build produced:

```
FAIL: unclassified top-level item(s) found — refusing to guess:
  dir: __phase10c_private_test__
  file: __phase10c_publicity_test__.txt
```

Exit code 1; `dist/` was left untouched by the failed run (still holding
the prior clean build, containing neither test artifact). **Interpretation
note, disclosed rather than silently assumed**: the brief's Part 22
literal expectation is "file MUST NOT appear in dist/," which this
satisfies via the strongest possible mechanism — the build refuses to run
at all rather than running and silently excluding the unrecognized item.
This matches Part 2's own instruction ("STOP and report it. Do not decide
automatically that it should be public") more directly than a
silent-exclude-and-succeed behavior would have. Both test artifacts were
removed afterward; a clean rebuild immediately following reproduced the
same inventory hash as before the test (§10), confirming no residual
effect.

## 17. Public-Directory Expansion Test — PASS

Added `images/__phase10c_test__.txt` (inside an already-allowlisted
directory, not a new top-level entry). Build succeeded (exit 0) and the
file correctly appeared at `dist/images/__phase10c_test__.txt` — proving
inclusion is unconditional *within* an allowlisted tree, only the
top-level boundary is fail-closed. Removed the test file; a subsequent
rebuild correctly no longer included it.

## 18. Repeatability Test — PASS

Three independent runs across this session (initial build, post-fail-
closed-test recovery build, post-expansion-test recovery build) all
produced the identical inventory hash:
`5bcf850671a782c639948db8d72cef18e735ca375afe8c6c83aee9b280046987`.
Deterministic.

## 19. Git-Scope Result

```
git status --short
```
before and after every build-script run in this session showed identical
output — `dist/` never appears (correctly gitignored), and no tracked
file was ever modified by running the build script (Part 20 gate — PASS).

## 20. Deviations

1. **`.DS_Store` bug found and fixed** (§7) — a real gap in the first
   working version, not present in Cloudflare's actual deployment
   environment but a genuine script defect regardless; fixed with an
   OS-artifact filter, re-verified clean.
2. **Production comparison methodology correction**: the first pass at
   Part 15 fetched `.html`-suffixed URLs directly, which only retrieves
   Cloudflare's 308 redirect response, not real content — corrected to
   follow redirects (`curl -L`) before comparing bytes, per Part 15's own
   instruction to "account for Cloudflare's known `.html` →
   extensionless 308 ... at the URL layer, not content."
3. **Two pre-existing production/source divergences documented, not
   fixed** (§13, Category C: homepage and shoe-size-conversion-chart) —
   explicitly out of this phase's LOCAL-ONLY scope; flagged for the
   Director's awareness rather than silently left undocumented or
   incorrectly attributed to this phase's work.
4. **Fail-closed interpretation** (§16) — implemented as a hard build
   stop rather than a silent per-item exclusion; disclosed as a
   deliberate reading of Part 2's stricter instruction, not an
   unannounced design choice.

## 21. Final LOCAL Status

**PHASE 10C-1 — LOCAL PASS**

- Build script implemented: `scripts/build-public-dir.js`, allowlist-only,
  fails closed on any unrecognized top-level item.
- Allowlist verified: every repository-root entry classified, zero
  unaccounted-for items.
- `dist/` generated: 1,178 files, 41,409,014 bytes.
- Source/dist byte identity: 1,178/1,178 files, 0 mismatches
  (independent re-verification, not just the build script's own report).
- Excluded directories confirmed absent from `dist/`: `scripts/`,
  `reports/`, `docs/`, `build/`, `cloudflare/`, `config/`, `generators/`,
  `utils/`, `authority/`, `components/`, `programmatic/`, `.git/`,
  `.github/`, `node_modules/` — including the specific Phase 10B template
  paths.
- Sitemap coverage verified: 0 missing public pages.
- `app.js` data paths verified: 4/4 resolved.
- Fail-closed behavior verified (hard stop on unrecognized item).
- Public-directory inclusiveness verified (no per-file filtering inside
  an allowlisted tree).
- Deterministic rebuild verified: identical hash across 3 runs.
- Production comparison completed: all divergences classified and
  documented; none attributable to this phase's build output.
- **No Cloudflare dashboard setting changed. No `wrangler.jsonc`/
  `wrangler.toml` created. No deployment performed. Production is
  unaffected by this phase.**

This report makes **no production-remediation claim**. The 3 Phase 10B
templates (and the broader class of source material found exposed in
Phase 10C) remain live in production exactly as documented in
`reports/phase-10c-cloudflare-serving-architecture-audit.md` §2, until a
separately-authorized cutover phase actually points Cloudflare Pages at
`dist/`.
