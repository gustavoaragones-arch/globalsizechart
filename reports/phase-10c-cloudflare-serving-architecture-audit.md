# Phase 10C — Cloudflare Serving Architecture Audit & Build-Output Design

**Scope, per Director authorization following Phase 10B's BLOCKED finding:**
(1) determine, from Cloudflare's own current documentation — not guessed
syntax — whether `_headers`/`_redirects` can suppress indexing or force a
true 404/410 for the 3 relocated templates; (2) evaluate a minimal
build-output-directory configuration as the actual architectural fix;
(3) if that's the direction, produce a deterministic classification of
what belongs in the published output vs. what stays source-only. No
Cloudflare dashboard setting or deployment-affecting file has been
changed. This is audit + local, reversible design work only.

**Phase 10B's implementation stands** — no rework. `e2ddb72` (relocation)
and `86c5706` (BLOCKED report) remain the committed state. This phase
addresses only the remaining production-exposure problem.

---

## 1. Confirmed Cloudflare Capabilities (via official docs, not guessed)

| Question | Answer | Source |
|---|---|---|
| Can `_redirects` return a 404/410 for a specific path? | **No.** Only 301/302/303/307/308 (redirect) and 200 (proxy/rewrite) are supported. The docs explicitly list "Rewrites (other status codes)" — using 404 as their own example — as unsupported (❌). | `developers.cloudflare.com/pages/configuration/redirects/` |
| Can `_headers` set `X-Robots-Tag: noindex` per path? | **Yes.** Header rules are path-pattern-scoped blocks; `X-Robots-Tag` is one of the docs' own worked examples. | `developers.cloudflare.com/pages/configuration/headers/` |
| Can `_headers` change a response's HTTP status code? | **No.** It is strictly header add/override/remove; status-code changes require `_redirects` or Pages Functions, neither of which covers this case (previous row). | same |
| Does Pages support a build command + build output directory for a Git-connected static project, including a no-op `exit 0` build pointing at a pre-existing subdirectory? | **Yes.** `exit 0` is the docs' own recommended no-op build command for "not using a preset" projects; "Build directory" is a first-class, independently configurable field, explicitly supporting monorepo-style subdirectory targeting. | `developers.cloudflare.com/pages/configuration/build-configuration/` |
| Where must `_headers`/`_redirects` live if the build output directory isn't the repo root? | **Inside the build output directory**, not the repo root — confirmed explicitly ("the `_redirects` file can go directly into your build output directory"). | `developers.cloudflare.com/pages/configuration/redirects/` |
| Can build settings be set by committing `wrangler.toml`/`wrangler.jsonc` instead of a dashboard edit? | **Yes, but with a one-way risk.** Adding `pages_build_output_dir` to a committed Wrangler config and deploying makes that file **authoritative from that deploy onward** — the docs' own words: "Do not deploy until you are confident... dashboard settings become read-only at that point." This is not a safe, casually-reversible change. | `developers.cloudflare.com/pages/functions/wrangler-configuration/` |

**Conclusion matching the Director's own assessment**: `_headers` can only
mitigate indexing (`noindex`), not eliminate raw exposure. `_redirects`
cannot force a 404. Neither is a real fix. The build-output-directory
mechanism is the only Cloudflare-native path to genuine non-public
status, and it is real, documented, supported functionality — not
something that needs to be invented.

## 2. This Is Not a 3-File Problem — Confirmed Empirically

Before designing the fix, the assumption that this only affects the 3
templates was tested directly against production, the same way Phase
10A/10B insisted on testing rather than assuming:

```
https://globalsizechart.com/reports/phase-10-template-sitemap-remediation.md  -> HTTP 200
https://globalsizechart.com/docs/cloudflare-pages-setup.md                    -> HTTP 200
https://globalsizechart.com/scripts/generate-programmatic-pages.js            -> HTTP 200
```

**Every internal audit report from this entire engagement — including
this very report once committed, and every phase's disclosed mistakes
and internal reasoning — is currently live and publicly fetchable**,
along with the full source of every generator script, every internal doc,
and every build-time config file. This is the same root cause as the
templates (no build-output exclusion exists at all), just not yet
observed for these paths because nothing has looked. This significantly
raises the stakes of Phase 10C beyond "fix 3 URLs" and directly supports
the Director's framing: the build-output-directory fix is the only option
here that closes the *class* of defect, not one instance of it.

## 3. Recommended Architecture

A real (but trivial) build step: a Node script that copies an **explicit
allowlist** of known-public top-level entries into a fresh `dist/`
directory, which becomes the Cloudflare Pages **build output directory**.
Everything not on the allowlist — `scripts/`, `reports/`, `docs/`,
`build/`, `cloudflare/`, `config/`, `generators/`, `utils/`, `authority/`,
`components/`, `programmatic/`, `node_modules/`, `.git/`, `package.json`,
etc. — stays in the git repository (so the generator pipeline, which
reads/writes many of these paths, is completely unaffected) but is never
copied into `dist/`, and therefore never deployed or served.

**Allowlist, not denylist, deliberately**: this repo root has ~90
top-level entries and has grown organically across 10+ phases. An
allowlist fails closed (a new source-only directory added later is
excluded by default, matching this defect's own root cause of "nothing
explicitly excludes anything"); a denylist fails open (a new *public*
directory added later would be silently excluded from the live site
unless someone remembers to add it to the denylist — a correctness risk,
not just a security one). Given this phase exists because "nothing was
ever excluded" caused a real defect, failing closed is the right default
going forward.

`_headers` and `_redirects` must be copied into `dist/` as part of the
build (confirmed requirement, §1) — they cannot stay at repo root once
the output directory changes.

## 4. Root-Level Classification

Directories, checked individually against sitemap membership, internal
link references, and (for ambiguous cases) direct content inspection —
not assumed by name:

| Directory | Sitemap entries | Verified public? | Decision |
|---|---|---|---|
| `ai/` | 1 | linked from 1,151 pages, `index,follow` | **INCLUDE** |
| `brands/` | 40 | — | **INCLUDE** |
| `ca/`, `eu/`, `uk/`, `us/` | 6 each | — | **INCLUDE** |
| `clothing/` | 130 | — | **INCLUDE** |
| `data/` | 0 (JSON, not HTML — expected) | `app.js` does `fetch('/data/shoe_sizes.json')` etc. directly | **INCLUDE** (whole directory — see note below) |
| `eu-to-us-shoe-size/`, `uk-to-us-shoe-size/`, `us-to-eu-shoe-size/`, `us-to-uk-shoe-size/` | 2 each | — | **INCLUDE** |
| `guides/` | 2 | linked from 1,151 pages, `index,follow` | **INCLUDE** |
| `images/` | 0 (assets, not HTML — expected) | no `<img>` reference found in the pages sampled, but this is a normal site-asset directory (favicons/OG images etc. commonly referenced by absolute path or meta tags not grepped here) — default to safe inclusion, not exclusion, for non-sensitive binary assets | **INCLUDE** |
| `kids-shoe-size-chart/`, `kids-shoe-size-pages/`, `mens-shoe-size-chart/`, `mens-shoe-size-pages/`, `womens-shoe-size-chart/`, `womens-shoe-size-pages/`, `shoe-size-pages/` | 2 each | — | **INCLUDE** |
| `knowledge/` | 2 | linked from 1,151 pages, `index,follow` | **INCLUDE** |
| `legal/` | 18 | — | **INCLUDE** |
| `measurement/` | 239 | — | **INCLUDE** |
| `printable/` | 10 | — | **INCLUDE** |
| `programmatic-pages/` | 1,460 | — | **INCLUDE** |
| `semantic/` | 12 | — | **INCLUDE** |
| `shoe-size-conversion-chart/`, `shoe-size-conversions/` | 2 / 14 | — | **INCLUDE** |
| `sitemap/` | 2 | human-readable sitemap page | **INCLUDE** |
| `sitemaps/` | 4 (self-referential) | the actual XML sitemap files submitted to search engines | **INCLUDE** |
| `tools/` | 8 | — | **INCLUDE** |
| `widget/` | 1 | explicit embeddable-iframe target (`<iframe src=".../widget/">` documented in its own file) | **INCLUDE** |
| `authority/` | 0 | 0 links from any served page; contents are 200 `.md` files under `authority/generated/{quora,reddit}/`, matching `REDDIT-STRATEGY.md`/`QUORA-STRATEGY.md`'s description as **off-site posting drafts**, not site pages | **EXCLUDE** |
| `build/` | 0 | internal diagnostic JSON (`indexability-report.json`, `phase9-report.json`, etc.) — same category as `reports/` | **EXCLUDE** |
| `cloudflare/` | 0 | internal dashboard-config markdown notes | **EXCLUDE** |
| `components/` | 0 | not fetched client-side or linked; HTML **partials** (breadcrumbs, FAQ blocks, monetization snippets) consumed at generation time — same class of defect as the Phase 10 templates, just not yet flagged | **EXCLUDE** |
| `config/` | 0 | `adsense_approval_mode.json`, referenced only by `scripts/adsense-approval-config.js` | **EXCLUDE** |
| `docs/` | 0 | internal markdown documentation | **EXCLUDE** |
| `generators/` | 0 | Node.js build-time modules, required by `scripts/*` | **EXCLUDE** |
| `programmatic/` | 0 | now contains only `README.md` (post-Phase-10B) | **EXCLUDE** |
| `reports/` | 0 | this entire engagement's audit trail — **confirmed currently live in production** (§2) | **EXCLUDE** |
| `scripts/` | 0 | all generator/build source, including the Phase 10B-relocated templates — **confirmed currently live in production** (§2) | **EXCLUDE** |
| `utils/` | 0 | `internalLinkBuilder.js`, required by 3 generator scripts | **EXCLUDE** |
| `.git/`, `node_modules/`, `.github/` | n/a | git internals, npm dependencies, CI workflow config — never plausible candidates | **EXCLUDE** |

**`data/` note**: only 4 of its 17 files were confirmed directly
`fetch()`-ed by `app.js` (`shoe_sizes.json`, `clothing_sizes.json`,
`regions.json`, `brands.json`); the rest are scoring/analytics caches
(`ai-signals.json`, `authority-tracker.json`, etc.) written by build-time
scripts. Recommending the **whole directory** be included rather than
splitting it: none of it is sensitive (aggregate size/conversion data and
content-scoring numbers, not credentials or internal reasoning), and
guessing which files are "safe to drop" risks silently breaking a future
client-side feature that reads one of the unconfirmed files. This is a
different judgment than the excluded directories above, all of which
contain genuine source code, internal audits, or off-site drafts.

Root-level loose files: every `*.html` file, `app.js`, `styles.css`,
`robots.txt`, `sitemap.xml`, `_headers`, `_redirects`, and
`BingSiteAuth.xml` (a search-engine verification file that must be
publicly reachable at root) — **INCLUDE**. `package.json`,
`package-lock.json` (npm metadata — also currently live in production
today, same defect class), `CHECK-OUTPUT-REQUIRED.md`,
`PERFORMANCE-RULES.md` (internal engineering docs),
`search-console-indexing-list.txt` (internal working notes, not fetched
by Search Console), `.gitignore`, `.DS_Store` — **EXCLUDE**. `.nojekyll`
is inert leftover from a GitHub Pages-era setup with zero function under
Cloudflare Pages — recommend **EXCLUDE** as unneeded, though it is
harmless either way.

## 5. What Has Been Done vs. What Requires Separate Authorization

**Done in this phase (audit + local design only, zero production risk)**:
Confirmed Cloudflare capabilities against official docs; empirically
confirmed the broader exposure; produced the full classification above.

**Recommended as the next, still code-only, still zero-production-risk
step**: write `scripts/build-public-dir.js` implementing the allowlist
copy (including `_headers`/`_redirects` relocation into `dist/`), and run
it **locally only** — producing a local `dist/` directory that can be
diffed against a sample of live production content to prove correctness,
without touching git history, without pushing, and without altering any
Cloudflare setting. This is the natural, low-risk continuation of "one
small... implementation step."

**Explicitly NOT done, and requiring separate, deploy-aware
authorization before either one is touched** — because either one flips
production the moment it takes effect:

- **Manual Cloudflare dashboard change** (Build command → e.g. `node
  scripts/build-public-dir.js`; Build output directory → `dist`) —
  reversible (can be changed back in the dashboard), but is a live
  infrastructure action outside this repo, and outside what a git-based
  tool can perform directly. Requires the Director or someone with
  dashboard access to apply it, ideally *after* reviewing a locally-
  verified `dist/` output.
- **Committing a `wrangler.jsonc` with `pages_build_output_dir`** —
  code-only, but per Cloudflare's own docs becomes **authoritative on the
  very next deploy**, at which point "dashboard settings become
  read-only." This is a materially higher-risk mechanism than a dashboard
  edit (a bad `dist/` output would go live immediately on push, with no
  manual review gate) and is not recommended as the activation mechanism
  unless the Director specifically prefers a fully git-driven cutover
  over a dashboard one.

## 6. Recommendation

Proceed with building and locally testing `scripts/build-public-dir.js`
now (§5, first bullet) as this phase's implementation step. Hold the
actual Cloudflare cutover (either mechanism) for explicit, separate
authorization once the classification table above is reviewed and the
local `dist/` output has been verified correct.
