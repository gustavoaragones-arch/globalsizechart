# Phase 10A — Programmatic Template Exposure & Sitemap Architecture Audit

**Mode: READ-ONLY.** No HTML, script, template, sitemap, robots.txt,
redirect, Cloudflare configuration, or `package.json` file was modified.
The only repository changes are the creation of this report and
`reports/phase-10-template-sitemap-inventory.json`.

---

## 1. Executive Summary

**This is a real, live, currently-active production defect — not a false
positive, not a repository-only artifact.** All three files in
`programmatic/templates/` (`category-template.html`, `conversion-
template.html`, `region-template.html`) are:

- Directly reachable on production at `https://globalsizechart.com/
  programmatic/templates/<name>` — confirmed via live HTTP requests,
  returning `200` (after Cloudflare's routine, unrelated `.html`-
  extension-stripping `308`, the same universal platform behavior
  documented in Phases 5F-D/5F-E/9).
- Served with their **raw, unsubstituted content** — literal
  `{{CANONICAL_URL}}`, `{{META_DESCRIPTION}}`, `{{PAGE_TITLE}}`, and
  dozens of other `{{PLACEHOLDER}}` tokens visible in the actual HTTP
  response body, including in the `<link rel="canonical">` tag itself.
- Explicitly marked `<meta name="robots" content="index, follow">` —
  telling any crawler that respects this tag to index the broken page.
- Present in **two of the site's four sitemaps** (`sitemap-medium.xml`,
  `indexing-feed.xml`), which actively submit these URLs for crawling
  rather than merely failing to hide them.
- Allowed by `robots.txt`'s blanket `Allow: /` for every named crawler
  (Googlebot, Bingbot, several AI crawlers), with no disallow rule for
  `/programmatic/` anywhere.

**Root cause is R6 (multiple, interacting causes)**, not a single simple
mistake: the sitemap generator's directory-ignore list omits `templates`,
and the site's Cloudflare Pages deployment model has no build-output
exclusion step (every repository file is served verbatim), and no other
gate (robots.txt, page-level noindex) exists to compensate.

**One important asymmetry**: `conversion-template.html` is a **live,
actively-read generator input** (`scripts/generate-programmatic-pages.js`,
`scripts/generate-pages.js` both `fs.readFileSync` it), while
`category-template.html` and `region-template.html` have **zero current
generator dependents** — no script reads them by name anywhere in the
repository. This materially changes what's safe to do with each file in
Phase 10B (§19–20).

## 2. Baseline Commit

```
HEAD:         bbb40309f0af6f8542a846245a16b1074a8b4c17
origin/main:  bbb40309f0af6f8542a846245a16b1074a8b4c17
```

Both confirmed matching, as stated in the phase brief. **One
discrepancy from the stated "working tree clean" baseline, disclosed
rather than silently worked around**: `why-shoe-sizes-vary-by-brand.html`
shows a one-line modification. Inspected directly — the diff is a
trailing-newline-at-EOF change only (`</body></html>` gaining a final
newline), zero content difference, and unrelated to Phase 10's scope.
This audit did not touch it, per the read-only rule, and it remains
exactly as found. Not investigated further, since Phase 10 has no mandate
to address it.

## 3. Template Inventory

| File | Size | Lines | Complete HTML doc? | `{{...}}` placeholders? | Canonical | Robots meta |
|---|---|---|---|---|---|---|
| `category-template.html` | 8,644 B | 226 | Yes (`<html>`/`<head>`/`<body>` all present) | Yes | `{{CANONICAL_URL}}` (unresolved) | `index, follow` |
| `conversion-template.html` | 13,532 B | 353 | Yes | Yes | `{{CANONICAL_URL}}` (unresolved) | `index, follow` |
| `region-template.html` | 8,692 B | 226 | Yes | Yes | `{{CANONICAL_URL}}` (unresolved) | `index, follow` |

All three are **complete, well-formed HTML documents** — not fragments —
each with its own `<head>`, JSON-LD blocks, header/nav, footer, and
internal links, all built around dozens of `{{TOKEN}}` placeholders
(`META_DESCRIPTION`, `KEYWORDS`, `CANONICAL_URL`, `PAGE_TITLE`,
`H1_TITLE`, `INTRO_TEXT`, `FAQ_CONTENT`, `INTERNAL_LINK_GRAPH`, and
~20 more). **Classification: A — source templates only**, per Part 2's
scheme. None is browser-viewable content in its own right; all are
clearly meant to be read by a generator, never served directly.

`conversion-template.html`'s embedded header navigation hardcodes links
like `/programmatic/shoe-size-converter.html` and `/programmatic/legal/
about.html` — a URL structure that **does not exist anywhere else on the
live site** (the real converter lives at `/shoe-size-converter.html`).
Confirmed this does **not** propagate into real generated output: a live
`programmatic-pages/*.html` file has none of these `/programmatic/`-
prefixed links, so `generatePage()` (the function that consumes this
template) must replace this section rather than leaving it in place. This
stale nav is therefore harmless *as template content* — it only becomes
visible if the raw template itself is served unprocessed, which (§4) it
currently is.

## 4. Deployment Architecture

Traced via `docs/cloudflare-pages-setup.md` and the absence of any
`.cfignore`/`wrangler.toml`/build-exclusion mechanism: this site's
Cloudflare Pages project is configured with **build output directory:
root (`/`)**, no build command. This is a **no-build static deployment**
— Cloudflare Pages serves every file in the repository tree verbatim, at
its literal repository path, with no distinction between "source" and
"output." There is no mechanism by which a repository file could be
present in the repo but absent from the deployed site (short of `_redirects`
intercepting it, which does not apply here — confirmed no `_redirects`
rule mentions `/programmatic/`).

**Direct consequence**: repository path `programmatic/templates/
conversion-template.html` maps 1:1 to production URL `https://
globalsizechart.com/programmatic/templates/conversion-template.html`,
with no gate in between. This is not a guess — it is the same
architecture already established and relied upon throughout this entire
engagement (every other page family's repository path is its production
path).

## 5. Production URL Tests

Direct HTTP requests, no fabricated URLs — each derived from the exact
repository file path.

| URL requested | Status | Redirect location | Final status | Final content-type | Served canonical | Served robots meta | `cf-cache-status` |
|---|---|---|---|---|---|---|---|
| `/programmatic/templates/category-template.html` | 308 | `/programmatic/templates/category-template` | 200 | `text/html` | `{{CANONICAL_URL}}` | `index, follow` | `HIT` |
| `/programmatic/templates/conversion-template.html` | 308 | `/programmatic/templates/conversion-template` | 200 | `text/html` | `{{CANONICAL_URL}}` | `index, follow` | `HIT` |
| `/programmatic/templates/region-template.html` | 308 | `/programmatic/templates/region-template` | 200 | `text/html` | `{{CANONICAL_URL}}` | `index, follow` | `HIT` |

The `308` is Cloudflare Pages' own universal `.html`-extension-stripping
behavior (documented and proven unrelated to this specific issue in
Phase 5F-E — confirmed again here by the same pattern appearing on
`/index.html`, `/brands/*`, and every other page family throughout this
engagement). The meaningful result is the **final `200` response**, whose
body was fetched and inspected directly (not assumed): it contains the
literal, unsubstituted template markup shown in §1, including a broken
canonical tag.

**All three tested — this is systemic across the full population of
templates, not an isolated case.**

## 6. Sitemap Architecture

`scripts/generate-sitemaps.js` is **filesystem-derived**, not
route-list-derived — it walks the live repository tree directly
(`walkHtml()`, using an `IGNORE_DIRS` set) and converts every `.html`
file it finds into a sitemap `<loc>` entry via `pathToUrl()`. This is the
same generator and mechanism already established in Phases 5F-E/9 for
the rest of the site's sitemap population.

```js
const IGNORE_DIRS = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components']);
```

**This set does not include `templates` or `programmatic/templates`.**
The walker enters `programmatic/` (not ignored) and then `templates/`
(also not ignored), and all three `.html` files inside are picked up as
ordinary content pages — no different in the generator's eyes from a real
`programmatic-pages/*.html` file.

**Template files CAN and DO currently enter the sitemap.** This is not a
theoretical risk — confirmed present (§7).

Separately and notably: **five other, unrelated tools in this codebase
already exclude `programmatic/templates` from their own file enumeration**
(`scripts/fix-orphans.js`, `scripts/missing-programmatic-pages.js`,
`scripts/phase1275-structure-audit.js`, `scripts/prebuild-link-
validation.js`, `scripts/standardize-quick-converters.js`). This
establishes that excluding this directory is a known, already-adopted
pattern elsewhere in the codebase — the sitemap generator is the outlier
that never received the same treatment, not a case where no precedent
exists.

## 7. Sitemap Inventory

| Sitemap file | Total `<loc>` entries |
|---|---|
| `sitemap-high.xml` | 14 |
| `sitemap-medium.xml` | 371 |
| `sitemap-low.xml` | 730 |
| `indexing-feed.xml` | 1,010 |
| **Total raw entries** | **2,125** |
| **Unique URLs across all four** | **1,115** |

**Template URLs found in sitemaps:**

| File | Contains template URLs? |
|---|---|
| `sitemap-high.xml` | No |
| `sitemap-medium.xml` | **Yes — all 3** (`category-template.html`, `conversion-template.html`, `region-template.html`) |
| `sitemap-low.xml` | No |
| `indexing-feed.xml` | **Yes — all 3** |

No duplicate URLs, no URLs pointing to nonexistent files, and no URLs
pointing to redirect sources were found among the template-related
entries specifically — the defect here is narrow and precise: exactly 3
distinct URLs, appearing in exactly 2 of the 4 sitemap files, 6 raw `<loc>`
entries total. A broader duplicate/orphan sweep of the *entire* 1,115-URL
sitemap population was not performed (out of this phase's scope — Phase
10 is about the templates issue specifically, not a general sitemap
hygiene audit).

## 8. `robots.txt` Findings

```
User-agent: *
Allow: /
User-agent: Googlebot
Allow: /
User-agent: Bingbot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: GPTBot
...
```

**`/programmatic/` and `/programmatic/templates/` are not mentioned at
all** — neither allowed nor disallowed explicitly; they fall under the
blanket `Allow: /` that applies to every named crawler, including
Googlebot, Bingbot, and several AI crawlers. Per the phase's explicit
instruction, this audit does **not** recommend adding a `Disallow` rule
as a fix in itself — a robots.txt block would suppress crawling but would
not address the underlying facts that (a) the URL is still live and
returns broken content to any direct visitor or non-compliant bot, and
(b) it is still being actively published via the sitemap. Robots.txt
alone would be treating a symptom.

## 9. Canonical / Noindex Findings

All three exposed templates classify identically:

**Classification: B — crawlable + indexable + unintended.**

- No `noindex` directive anywhere (robots meta says `index, follow`).
- No `X-Robots-Tag` HTTP header present (checked the full response header
  set in §5 — not present).
- Canonical tag is broken (`{{CANONICAL_URL}}`, literally unresolved) —
  worse than simply missing, since a broken canonical provides no
  self-referential signal at all and could theoretically confuse
  duplicate-content resolution if two templates were ever compared.
- Present in the sitemap (§7), which is an active crawl-discovery signal,
  not merely a passive absence-of-blocking.

This is **not** a C, D, or E classification — nothing about the current
architecture prevents indexing; several signals actively encourage it.

## 10. Internal-Link Findings

Searched the entire repository (`.html` files) for any reference to
`programmatic/templates/`.

**Zero user-facing HTML pages link to any template file.** The only
repository references found are:

- The 6 sitemap `<loc>` entries (§7) — machine-readable crawl signals,
  not human-clickable links.
- The 2 generator scripts that read `conversion-template.html` as source
  data via `fs.readFileSync` (§3, §11) — code references, not rendered
  links.
- 5 unrelated tools' own exclusion lists (§6) — code references that
  actively avoid treating these files as pages.
- This audit's own new inventory/report files.

**No user could ever reach these URLs by clicking through the site.**
The only paths to discovery are (a) a crawler following the sitemap, or
(b) someone directly guessing/typing the URL. This matters for §15's
impact assessment — the exposure is a crawl/indexation concern, not a
navigation or broken-user-journey concern.

## 11. Generator Call Chain

```
scripts/generate-phase10-pages.js:472
  → generator.runPhase10Generator(config)
      [generator = require('./generate-programmatic-pages.js')]

scripts/generate-programmatic-pages.js
  require.main === module guard (bottom of file)
    → runPhase10Generator()

scripts/generate-programmatic-pages.js:5213
  function runPhase10Generator(config) {
    ...
    const template = fs.readFileSync(
      path.join(TEMPLATES_DIR, 'conversion-template.html'), 'utf8'
    );                                                    // line 5216
    ...
    for (const route of phase8Routes) {
      const { html, fileName } = generatePage(route, template, ...);
      fs.writeFileSync(path.join(OUTPUT_DIR, fileName), html, 'utf8');
      ...
    }
  }

scripts/generate-programmatic-pages.js:21-22
  const TEMPLATES_DIR = path.join(ROOT, 'programmatic', 'templates');
  const OUTPUT_DIR = path.join(ROOT, 'programmatic-pages');

scripts/generate-pages.js:13, :302
  (an older/parallel entry point with the identical TEMPLATES_DIR
  constant and its own fs.readFileSync of conversion-template.html —
  not traced further; out of this phase's scope to determine which of
  the two is the currently-authoritative entry point, since both would
  be affected identically by any Phase 10B fix to the template's own
  location or content)
```

**`runPhase10Generator` is genuinely live** — it is the same function
this engagement has relied on throughout Phases 5C, 5F, and 9 (confirmed
present in `generate-programmatic-pages.js`'s `module.exports`, already
established in Phase 9's investigation). It reads `conversion-
template.html`, substitutes placeholders via `generatePage()`, and writes
real output to `programmatic-pages/` — **this is not dead or orphaned
code.**

**`category-template.html` and `region-template.html` have no such call
chain.** A repository-wide search for their filenames outside this
audit's own new files found **zero** generator references. No script
currently reads either file for any purpose.

**No generator accidentally includes the template directory in a page
enumeration** — the generators correctly target `OUTPUT_DIR` for writes
and only read the templates directory for *input*. The defect is entirely
in the separate sitemap generator (§6), which walks the filesystem
independently of any generator's own page list.

**No cleanup step exists** that would remove or gate template files after
a build — consistent with there being no build step at all (§4).

## 12. Filesystem / Production Matrix

| Template | Repo exists | Generated output | Production URL | Sitemap | Internal links | Indexable |
|---|---|---|---|---|---|---|
| `category-template.html` | Yes | N/A — not consumed by any generator | **Live, 200, raw template content** | **Yes** (medium, indexing-feed) | 0 | **Yes** |
| `conversion-template.html` | Yes | **Yes** — actively consumed to produce `programmatic-pages/*.html` | **Live, 200, raw template content** | **Yes** (medium, indexing-feed) | 0 | **Yes** |
| `region-template.html` | Yes | N/A — not consumed by any generator | **Live, 200, raw template content** | **Yes** (medium, indexing-feed) | 0 | **Yes** |

---

## 13. Root Cause

**R6 — multiple, interacting root causes:**

1. **R3 (real production defect)**: all three templates are publicly
   crawlable and indexable in their current broken state — proven by
   direct production HTTP tests (§5), not assumed.
2. **R4 (sitemap architecture defect)**: `generate-sitemaps.js`'s
   `IGNORE_DIRS` omits `templates`, so the filesystem walk actively
   publishes these URLs into 2 sitemaps (§6, §7) — this is the direct
   mechanism that turns "a file that technically exists on production"
   into "a URL that crawlers are actively told to visit."
3. **Contributing factor, not itself a distinct "mistake" (not really
   R5)**: the site's no-build Cloudflare Pages deployment model means
   every repository file is inherently servable at its literal path —
   this is the same architecture correctly relied upon for the rest of
   the site, so it is not a deployment *mistake* in isolation; it is the
   baseline condition that makes the sitemap generator's omission (R4)
   consequential rather than harmless.

None of R1 ("no defect"), R2 ("exposed but intentionally unindexed"), or
a standalone R5 ("pure deployment mistake, otherwise fine") fits the
evidence — the templates are neither harmless nor is their exposure
intentional-and-gated (§9 established `index, follow` with a broken
canonical, not a deliberate noindex pattern), and the deployment model
itself isn't the anomaly (it's consistent site-wide) — the anomaly is the
sitemap generator's specific omission interacting with that otherwise-
normal model.

## 14. Production Impact

Confirmed, not theoretical:

- **Broken canonical URLs** on all 3 live template URLs (§5, §9).
- **Placeholder/template text visible** in the actual served HTML —
  `{{META_DESCRIPTION}}`, `{{PAGE_TITLE}}`, `{{KEYWORDS}}`, and the
  visible page body all contain literal unresolved tokens.
- **Thin/broken pages actively marked indexable** (`index, follow`).
- **Duplicate content risk between the 3 templates is low** — they are
  structurally different from each other (different placeholder sets,
  different page types), so this is not classic near-duplicate content;
  the more precise problem is each one individually being nonsensical,
  broken content.
- **No broken user navigation** — confirmed §10, zero real pages link to
  these URLs, so no legitimate user journey is disrupted.
- **Crawl waste**: 3 URLs is a small absolute number against the site's
  ~1,115-URL sitemap population (0.27%) — not a large-scale crawl-budget
  problem by itself, but a real, needless one.
- **No schema errors beyond the canonical/description tokens** — the
  JSON-LD blocks themselves are syntactically present (though also token-
  laden and thus semantically broken if actually parsed by a consumer).

## 15. Security / User Impact

- **No security issue** — no credentials, no sensitive data, no
  injectable content; these are static placeholder tokens, not
  executable or exploitable content.
- **No user-facing navigation impact** — confirmed zero internal links
  point here (§10); a real user browsing the site would never encounter
  these pages through normal use.
- **The realistic impact is entirely about search/crawl hygiene**: a
  search engine or AI crawler that follows the sitemap could index or
  cite a broken page, potentially surfacing `{{PAGE_TITLE}}`-style
  garbage in a search result or an AI-generated citation — a real, if
  narrow, reputational/UX risk for anyone who reaches the site via such a
  result, but not a risk to existing users navigating the live site
  normally.

## 16. Cloudflare Behavior

The `308` redirect observed on every template URL request is Cloudflare
Pages' own platform-level `.html`-extension-stripping behavior — already
established as universal and unrelated to any specific page's content in
Phases 5F-D/5F-E/9 (confirmed again here via the same pattern occurring
on completely unrelated, healthy pages like `/index.html`). This
behavior is **orthogonal to the actual defect**: it does not cause, mask,
or worsen the template-exposure issue — it would apply identically to
any legitimate page at this path. The substantive problem is entirely
what happens *after* that redirect resolves: the final `200` response's
content and metadata. Cloudflare's edge caching (`cf-cache-status: HIT`
observed on first test) means at least one prior fetch occurred, but does
not by itself distinguish a crawler visit from incidental traffic —
disclosed as inconclusive rather than treated as proof either way.

## 13-B. Production Search Evidence

A `site:globalsizechart.com` search for template-related terms returned
only legitimate `programmatic-pages/*` results — no template URL
appeared. **This is disclosed as supporting evidence only.** Per this
phase's explicit instruction, absence from a `site:` search result set is
**not proof of non-indexation** — Google's `site:` operator is well
documented to be an incomplete, unreliable coverage signal. Combined with
the `cf-cache-status: HIT` finding (§16) showing at least one prior
fetch, the honest conclusion is: **indexation status is unresolved by
this audit** — the templates are *indexable* (nothing prevents it) and
*have been fetched at least once*, but whether Google or another engine
has actually indexed and would surface them is not established either
way by the evidence gathered here.

---

## 17. Exact Remediation Options

**OPTION A** — Keep templates repository-only; guarantee they cannot
enter deployed/crawlable output. Given the site's no-build deployment
model (§4), "guarantee" here cannot mean a build-exclusion step (none
exists) — it would require either moving the directory outside the
publicly-served tree structure (functionally equivalent to Option B) or
adding a Cloudflare-level rule. Evaluated but not standalone-sufficient
without addressing the sitemap (a page can be un-indexed by search but
still be a live, broken URL if directly requested).

**OPTION B** — Move templates outside the public build tree. Since this
site has no separate "build tree" distinct from the served tree (§4), this
would mean relocating `programmatic/templates/` to a path Cloudflare
Pages does not serve as a route — the only such mechanism available on
this static-file host is a directory Cloudflare Pages is configured not
to serve, which effectively means moving the templates outside the
repository's Pages-deployed root entirely (e.g., into `scripts/lib/` —
already an established location for non-served source assets in this
codebase, per `scripts/lib/master-footer.html`, which is never itself a
live URL despite being genuine HTML).

**OPTION C** — Explicitly exclude `templates` (or the full
`programmatic/templates` path) from `generate-sitemaps.js`'s
`IGNORE_DIRS`. Directly fixes §6/§7's confirmed defect — the templates
would no longer be walked into the sitemap. Does **not** by itself change
the fact that the URL is still live and returns broken content if
directly requested or found by non-sitemap discovery (unlikely given
§10's zero-internal-links finding, but not impossible).

**OPTION D** — Combination of A + C (per the phase brief's own framing).

## 18. Recommended Option

**A combination of B (for the file layer) + C (for the sitemap layer),
applied per-file based on actual generator dependency (§11), not
uniformly:**

- `conversion-template.html` — **cannot simply be moved without updating
  its 2 known readers' `TEMPLATES_DIR`-relative path expectations**
  (`generate-programmatic-pages.js`, `generate-pages.js`). Moving it to a
  non-served location (e.g. `scripts/lib/programmatic-templates/`,
  mirroring the existing `scripts/lib/master-footer.html` pattern) is the
  most complete fix, but requires touching both consuming scripts' path
  constants — a small, mechanical, well-scoped change given both
  reference paths are already centralized in a single `TEMPLATES_DIR`
  constant each.
- `category-template.html` / `region-template.html` — **zero generator
  dependents** (§11). Free to move to the same non-served location with
  no consuming-script update required, since nothing currently reads
  them.
- **`generate-sitemaps.js`'s `IGNORE_DIRS`** should also gain the
  exclusion regardless of the file-relocation decision, as defense in
  depth — per the phase's explicit instruction not to rely on a single
  gate, and because it directly fixes the confirmed, currently-live
  sitemap defect (§6, §7) with a one-line, extremely low-risk change.

This recommendation deliberately does **not** propose robots.txt as the
primary fix (§8's explicit reasoning: it would suppress crawling without
fixing the underlying live/broken URL or the sitemap's active
publication of it) and does **not** propose deleting any template (§11
confirms `conversion-template.html` is a genuine, needed generator
dependency; the other two, while currently unused, were not established
by this audit to be safe to delete outright — only safe to relocate,
since deletion goes beyond this audit's evidence about why they exist or
whether something else might reference them in the future).

## 19. Exact Files Expected to Change in Implementation (Phase 10B)

| File | Change |
|---|---|
| `scripts/generate-sitemaps.js` | Add `'templates'` (or a more specific `'programmatic/templates'` path check) to `IGNORE_DIRS` (line 33) |
| `scripts/generate-programmatic-pages.js` | Update `TEMPLATES_DIR` constant (line 21) to point to the new non-served location |
| `scripts/generate-pages.js` | Update `TEMPLATES_DIR` constant (line 13) to point to the same new location |
| `programmatic/templates/category-template.html`, `conversion-template.html`, `region-template.html` | Relocated (moved, not content-modified) to the new non-served path |
| `sitemaps/sitemap-medium.xml`, `sitemaps/indexing-feed.xml` | Regenerated via `npm run build:sitemaps` — the 6 template `<loc>` entries removed as a consequence of the `IGNORE_DIRS` fix, not hand-edited |

## 20. Exact Files Expected NOT to Change

`app.js`, all `data/*.json`, `clothing/*.html`, `brands/*.html`,
`index.html`, `shoe-size-conversion-chart/index.html`,
`measurement/*.html`, any `programmatic-pages/*.html` output file
(regenerating the sitemap does not regenerate page content), `_redirects`,
`robots.txt` (per §8's explicit reasoning — not the right fix layer),
Cloudflare configuration, `sitemap-high.xml`, `sitemap-low.xml` (neither
currently contains template URLs — confirmed §7), `scripts/lib/master-
footer.html` and other unrelated `scripts/lib/` assets, footer output on
any page.

## 21. Implementation Risks

- **Both `TEMPLATES_DIR` constants must be updated in the same commit** —
  if only one script's constant is updated, that generator would break
  (file-not-found) the next time it runs, since the file would no longer
  be at its old path.
- **`generate-pages.js` vs. `generate-programmatic-pages.js`** — this
  audit did not establish which of the two is the currently-authoritative
  live entry point (§11 notes this as out of scope). Phase 10B must
  either confirm both are still live and update both, or confirm one is
  dead code and document that explicitly before leaving its `TEMPLATES_DIR`
  unchanged — do not assume.
  the sitemap regeneration must be verified to produce exactly a
  6-entry reduction (3 URLs × 2 files) and no other unrelated sitemap
  delta.
- **Relocating `category-template.html`/`region-template.html`** carries
  low but nonzero risk if some undiscovered reference exists outside the
  `scripts/*.js`/`generators/*.js` search performed in this audit (e.g.,
  a shell script, a CI config, or documentation with a hardcoded path) —
  Phase 10B should re-verify with a fresh, broader search immediately
  before moving anything, not rely solely on this audit's search scope.

## 22. Acceptance Gates for Phase 10B

- `curl` to all 3 former template URLs (both `.html` and extensionless
  forms) returns a real `404` (or the URL is otherwise confirmed removed
  from the deployed tree) — not a `200` with template content.
- `sitemap-medium.xml` and `indexing-feed.xml` contain **zero**
  `programmatic/templates` references after regeneration.
- `node scripts/test-converter-contract.js` — 987/987 unchanged.
- `npm run footer:check` — clean, unchanged.
- `node scripts/prebuild-link-validation.js` — missing-target count does
  not increase from the 47 baseline (§21 baseline below); a **decrease**
  is plausible and acceptable if the validator was counting these as
  something other than clean links, but must be explained, not just
  observed.
- `runPhase10Generator()` (and whichever of `generate-pages.js` /
  `generate-programmatic-pages.js` is confirmed live) still runs
  successfully end-to-end against the relocated template path, producing
  byte-identical output to before the move for a sampled set of
  `programmatic-pages/*.html` files (proving the relocation didn't
  silently change generated content).
- Phase 7 and Phase 8 test suites remain green (unrelated families, but
  cheap to re-verify given they're already established regression gates
  in this engagement).

---

## 21-B. Regression Baseline (recorded, not modified)

```
node scripts/test-converter-contract.js  →  987 passed, 0 failed
npm run footer:check                     →  OK: all footers match master (1,151 files checked)
node scripts/prebuild-link-validation.js →  Missing targets: 47 (threshold: 10)
Sitemap total unique URLs                →  1,115 (2,125 raw <loc> entries across 4 files)
Schema validation                        →  not run in this phase (no dedicated schema-validation
                                             script found in package.json beyond the FAQ-specific
                                             Phase 9 validator, which is unrelated to this issue —
                                             disclosed rather than fabricating a result)
```

---

## Final Gate

```
git status --short
```
The only repository changes from this phase are the creation of
`reports/phase-10-template-sitemap-audit.md` and `reports/phase-10-
template-sitemap-inventory.json`, plus the pre-existing, unrelated,
untouched `why-shoe-sizes-vary-by-brand.html` discrepancy noted in §2 (not
caused by, or modified by, this audit).

No HTML, script, template, sitemap, robots.txt, redirect, Cloudflare
configuration, or `package.json` file was modified. No implementation was
performed. No commit was made. No push was made.

**PHASE 10A — AUDIT COMPLETE. STOP.**
