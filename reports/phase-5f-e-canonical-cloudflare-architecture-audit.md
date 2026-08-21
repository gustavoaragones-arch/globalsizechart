# Phase 5F-E — Canonical / Cloudflare Architecture Audit (Read-Only)

**Scope:** Answer whether the `.html` → extensionless 308 behavior observed
in production during Phase 5F-D reflects a documented/intentional
architecture, whether `.html` is deliberately the canonical convention, what
live Google indexing shows, and whether this belongs in a separate future
phase. **No files were modified, no redirects, canonical tags, or Cloudflare
configuration were touched.** This audit does not reopen or revise Phase 5F
or 5F-D — both stand as certified.

---

## 1. Is the `.html` → extensionless behavior documented or intentional for GlobalSizeChart?

**Repo search — no site-specific configuration found:**

- No `wrangler.toml`/`wrangler.jsonc` in the repo.
- `_headers` exists and sets caching/security headers only — no
  `html_handling`, no trailing-slash directive.
- No `_routes.json`.
- No report, script, or doc anywhere in the repo (prior to this audit)
  mentions this behavior, `html_handling`, "extensionless," or "clean URLs."

**External confirmation (Cloudflare's own docs, via web search):** Cloudflare
Pages' asset serving has an `html_handling` setting that **defaults to
`auto-trailing-slash`** when not explicitly configured. In that default
mode, a request for `/file.html` redirects to `/file`, while a request for
`/folder/` serves `/folder/index.html`. This matches exactly what Phase 5F-D
observed in production (with one discrepancy noted below).

**Conclusion: this is Cloudflare Pages' platform default, not a
GlobalSizeChart-specific configuration decision.** Nothing in the repo shows
this was ever chosen, reviewed, or overridden — it is inherited, unexamined
default behavior, not a documented architectural choice.

**Minor discrepancy worth flagging:** Cloudflare's documented default
redirects with `307`. Production is observed returning `308` (see Phase
5F-D §1–§2, and control checks against `/index.html`,
`/brands/nike-shoe-size-chart.html`, `/shoe-size-converter.html` — all
`308`, not `307`). This may reflect a Cloudflare platform change since that
documentation was written, or a distinction not captured by the doc summary.
Not further investigated — it doesn't change any conclusion here (308 and
307 are both non-caching-by-default, method-preserving redirects; the
difference is permanent vs. temporary semantics, and either way this is
Cloudflare's serving layer, not this site's `_redirects` file, which never
mentions these paths at all).

## 2. Is `.html` the intentional, deliberately-chosen canonical convention?

**Yes, in the site's own code — consistently, sitewide, not just for
clothing pages.**

- `scripts/generate-programmatic-pages.js`: canonical URL construction is
  always `${BASE_URL}/clothing/${fileName}` (or `canonical_target`) — always
  ending in `.html`.
- `scripts/generate-sitemaps.js` (`pathToUrl`): every file's sitemap `<loc>`
  entry keeps its `.html` extension, with exactly one special case —
  `index.html` maps to `/` (and `*/index.html` maps to `path/`). This is a
  deliberate, hand-written rule in the walk function, not an accident.
- Verified directly: `sitemaps/sitemap-medium.xml` lists
  `https://globalsizechart.com/clothing/clothing-men-pants-42-EU-to-US.html`
  (full `.html`), not the extensionless form, for every non-index page
  checked.

So `.html` is the canonical convention the site's generators and sitemap
consistently commit to. **But nothing in the repo indicates this was
reconciled against Cloudflare's default `html_handling` behavior** — the
sitemap has apparently been submitting `.html` URLs that 308-redirect away
from themselves for as long as both have coexisted, with no comment,
report, or config anywhere addressing the conflict.

## 3. Does live Google indexing show this as problematic?

**Google Search Console: not available.** No GSC access is connected to
this session (no authenticated MCP tool for Search Console exists in this
environment) — this question cannot be answered from server-side indexing
reports, crawl-error logs, or Search Console's own canonical-selection
report. Disclosed as a real limitation, not glossed over.

**Live Google index (via `site:globalsizechart.com` web search) — partial
but directionally clear evidence:**

| Google-indexed URL | Form |
|---|---|
| `https://globalsizechart.com/shoe-size-converter` | extensionless |
| `https://globalsizechart.com/us-to-eu-size` | extensionless |
| `https://globalsizechart.com/shoe-size-conversion-chart/` | extensionless (trailing slash) |
| `https://globalsizechart.com/programmatic-pages/japan-23-to-us-shoe-size` | extensionless |
| `https://globalsizechart.com/programmatic-pages/eu-47-to-us-shoe-size` | extensionless |
| `https://globalsizechart.com/programmatic-pages/us-11-to-eu-shoe-size` | extensionless |

**None of the sampled indexed URLs carry `.html`**, despite every one of
these pages declaring `.html` as its canonical in its own `<link
rel="canonical">` tag and being submitted to the sitemap that way. Google
has indexed the **308 redirect target**, not the declared canonical.

This is consistent with well-established search engine behavior: a
permanent, sitewide, infrastructure-level redirect is generally treated as a
stronger canonicalization signal than a page's own `rel=canonical` tag,
especially when the redirect is completely consistent (every single `.html`
URL on the domain redirects the same way, with no exceptions). This isn't
necessarily "problematic" in the sense of causing crawl errors or duplicate
content penalties — Google appears to have resolved the conflict cleanly on
its own, in the more standard direction — but it does mean **the site's
declared canonical convention has had no actual effect on what gets
indexed, for as long as this pattern has existed.**

## 4. Which URL form is the actual preferred/live canonical architecture — `.html` or extensionless?

**In practice: extensionless.** That's what production infrastructure
serves as the final, non-redirecting URL, and what Google has independently
converged on indexing. **In the codebase's stated intent: `.html`** — that's
what every canonical tag, every sitemap entry, and every internal generator
declares. These two are in direct, unreconciled conflict, sitewide.

Neither can be called "wrong" in isolation — a codebase consistently
declaring `.html` as canonical is internally coherent, and Cloudflare Pages
serving extensionless URLs as the final resource is also standard, common
practice (many static-site frameworks default to exactly this convention
deliberately, for cleaner URLs). The problem isn't that either choice is
bad; it's that **this site is currently doing both at once, unintentionally,
with the infrastructure layer silently overriding the application layer's
stated intent.**

## 5. Is this pre-existing and sitewide, or something Phase 5F touched?

**Confirmed pre-existing, confirmed sitewide, confirmed unrelated to Phase
5F:**

- `shoe-size-converter.html` was added to the repo on **2026-02-02**
  (`git log --diff-filter=A`), long before Phase 3 (the first phase of this
  entire engagement) began. It shows the identical pattern: canonical tag
  declares `.html`, live request 308s to extensionless.
- Confirmed on completely unrelated, untouched files:
  `/index.html`, `/brands/nike-shoe-size-chart.html`.
- Phase 5F's own `_redirects` additions (the 31 migration rules + 1 jacket
  rule) never reference extensionless paths at all — they redirect
  `.html` → `.html` exclusively, exactly as designed. Phase 5F did not
  create, worsen, or interact with this pattern in any way; it inherited an
  already-sitewide default that predates the entire audit-and-remediation
  engagement.

## 6. Recommendation

This should become its own, separately-scoped future phase — not folded
into 5F/5F-D, and not blocking their PASS status. It requires a real
decision (not a mechanical fix):

- **Option A:** Keep `.html` as the deliberate canonical/indexing
  convention, and configure Cloudflare Pages' `html_handling` to `none` (or
  equivalent) so `.html` URLs serve directly instead of redirecting away
  from themselves.
- **Option B:** Accept extensionless as the real canonical architecture
  (matching what Cloudflare already serves and Google already indexes), and
  update every generator (`generate-programmatic-pages.js`,
  `generate-phase10-pages.js`, `generate-sitemaps.js`, `_redirects`, all
  existing canonical tags and JSON-LD sitewide) to declare and link
  extensionless URLs consistently.
- **Option C:** Do nothing — document this as an accepted, low-risk
  quirk (Google has already resolved it sensibly on its own) and move on.

Any of these is legitimate; none should be decided as a side effect of the
clothing migration. This audit does not make that call.

## 7. Answering the conditional from the prior message

The instruction was: *"If that audit confirms this is an accepted existing
architecture, then commit the certification report immediately."*

This audit confirms the behavior is **pre-existing, sitewide, and unrelated
to Phase 5F** — all three, cleanly. It does **not** find evidence that the
`.html`/extensionless conflict was ever a deliberately **accepted**
decision — no config, comment, or report anywhere reconciles it; it reads as
an unexamined default that Google happened to resolve gracefully rather
than a choice anyone signed off on. That's a real distinction: "not a Phase
5F regression" is fully established; "someone decided this was fine" is
not. Recommend treating the former as sufficient to unblock the commit
(§7 below), while flagging the latter honestly rather than rounding it up
to "accepted."

**PHASE 5F-E — COMPLETE.** No blocker to committing
`phase-5f-d-production-redirect-certification.md` (now corrected per this
audit's findings) — the canonical-tag language there has been revised to
state facts (tag values) rather than SEO-effectiveness claims, and this
audit itself supplies the SEO context as a separate, honestly-scoped
document rather than folding an unverified verdict into 5F-D.
