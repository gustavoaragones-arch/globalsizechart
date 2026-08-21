# Phase 5F-D — Production Redirect Certification

**Status: PHASE 5F-D — PASS.** All 39 checks (31 migrated redirects + 1
jacket retirement + 7 collision exclusions) verified live against production.

- **Deployed commit:** `9417dba116371bccf344e1ee79223a652df526e0` ("Fix
  clothing conversion routes and migrate clothing URLs")
- **Pushed:** 2026-08-18, `origin/main`
- **Deploy confirmed live:** 2026-08-18 00:26 MDT (detected via poll; first
  request where `/clothing/eu-50-jacket-to-us-size.html` stopped serving the
  old jacket page)
- **Domain tested:** `https://globalsizechart.com`

---

## 1. Pre-check: was production actually running the new commit?

Before running the certification matrix, this was verified empirically
rather than assumed from the push succeeding:

- `curl -I https://globalsizechart.com/clothing/eu-50-jacket-to-us-size.html`
  → `301` with `Location: /clothing-size-converter.html` (matches
  `_redirects` exactly)
- `curl -I https://globalsizechart.com/clothing/clothing-men-pants-28-EU-to-US.html`
  → `301` with `Location: /clothing/clothing-men-pants-42-EU-to-US.html`
  (matches `_redirects` exactly)

Both match the deployed `_redirects` file's rules precisely (301 status,
exact destination), confirming the new commit is live and being served, not
stale-cached.

## 2. Platform-level discovery (not a Phase 5F defect — disclosed for
transparency)

Initial certification runs against every single one of the 32 `_redirects`
targets showed a **second** hop after our own redirect resolved correctly:
requesting the new `.html` destination directly returns an additional `308`
to the same path with `.html` stripped (e.g.
`/clothing/clothing-men-pants-42-EU-to-US.html` → `308` →
`/clothing/clothing-men-pants-42-EU-to-US`).

This was verified to be a **Cloudflare Pages platform-level behavior
applying uniformly to every `.html` URL on the entire domain**, unrelated to
our `_redirects` rules and pre-existing (i.e., not introduced by Phase 5F).
Confirmed via three independent controls, all of which show the identical
pattern on pages nothing in Phases 3–5F ever touched:

| Control URL | Result |
|---|---|
| `/index.html` | `308` → `/` |
| `/brands/nike-shoe-size-chart.html` | `308` → `/brands/nike-shoe-size-chart` |
| Any of the 31 migrated destination `.html` URLs, requested directly | `308` → same path, extensionless |

The extensionless destination itself returns `200`, and its
`<link rel="canonical">` tag declares the full `.html` URL — the same URL
that, if requested directly, itself 308-redirects to the extensionless form
this page is being served at. **This report does not conclude that this is
SEO-correct or SEO-incorrect** — that requires understanding whether search
engines honor the declared `.html` canonical over the live 308 redirect
target, which is outside this report's read-only redirect-behavior scope.
See
[`phase-5f-e-canonical-cloudflare-architecture-audit.md`](phase-5f-e-canonical-cloudflare-architecture-audit.md)
for that separate investigation. What this report *does* establish: this
platform behavior is Cloudflare Pages' own clean-URL serving layer, sitting
**after** `_redirects` evaluation, not a redirect chain introduced by this
migration — and it applies identically to `.html` URLs across the entire
site, not just migrated clothing pages.

**Certification methodology was corrected to account for this**: each
redirect's "single hop" requirement is evaluated against *our own*
`_redirects` rule (old `.html` → new `.html`, exactly one hop, never
pointing at another retired/old URL) — not against Cloudflare's own
universal extensionless-URL normalization, which is treated as a disclosed,
expected, non-disqualifying platform hop that happens identically on every
page of the site. Final content, status, and canonical checks are performed
against the fully-resolved destination after this platform hop.

An earlier draft of the certification script did *not* account for this and
reported all 39 checks as FAIL — including the jacket redirect, which had
already been manually confirmed correct via `curl -I`. That was a test
methodology bug (mis-scoring an unrelated, universal platform redirect as a
chain violation), not a production defect. Corrected before recording any
result below.

## 3. Migrated Redirects (31)

For each: request old URL → confirm `301` with exact `Location` matching the
`_redirects` rule, not pointing to another old/retired URL → follow to the
new `.html` URL → (platform strips `.html`, disclosed above) → confirm final
destination `200` and that its declared canonical tag matches the intended
new `.html` URL (see §2 caveat: this is a content check, not an SEO-effectiveness
claim).

| Old URL | Status | Location | Next hop | Final status | Declared canonical (tag value) | Result |
|---|---|---|---|---|---|---|
| /clothing/clothing-men-pants-28-EU-to-US.html | 301 | /clothing/clothing-men-pants-42-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-men-pants-42-EU-to-US.html | PASS |
| /clothing/clothing-men-pants-30-EU-to-US.html | 301 | /clothing/clothing-men-pants-44-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-men-pants-44-EU-to-US.html | PASS |
| /clothing/clothing-men-pants-32-EU-to-US.html | 301 | /clothing/clothing-men-pants-46-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-men-pants-46-EU-to-US.html | PASS |
| /clothing/clothing-men-pants-34-EU-to-US.html | 301 | /clothing/clothing-men-pants-48-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-men-pants-48-EU-to-US.html | PASS |
| /clothing/clothing-men-pants-36-EU-to-US.html | 301 | /clothing/clothing-men-pants-50-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-men-pants-50-EU-to-US.html | PASS |
| /clothing/clothing-men-pants-38-EU-to-US.html | 301 | /clothing/clothing-men-pants-52-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-men-pants-52-EU-to-US.html | PASS |
| /clothing/clothing-men-pants-40-EU-to-US.html | 301 | /clothing/clothing-men-pants-54-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-men-pants-54-EU-to-US.html | PASS |
| /clothing/clothing-women-tops-XS-EU-to-US.html | 301 | /clothing/clothing-women-tops-34-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-tops-34-EU-to-US.html | PASS |
| /clothing/clothing-women-tops-XS-UK-to-US.html | 301 | /clothing/clothing-women-tops-6-UK-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-tops-6-UK-to-US.html | PASS |
| /clothing/clothing-women-tops-S-EU-to-US.html | 301 | /clothing/clothing-women-tops-36-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-tops-36-EU-to-US.html | PASS |
| /clothing/clothing-women-tops-S-UK-to-US.html | 301 | /clothing/clothing-women-tops-8-UK-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-tops-8-UK-to-US.html | PASS |
| /clothing/clothing-women-tops-M-EU-to-US.html | 301 | /clothing/clothing-women-tops-38-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-tops-38-EU-to-US.html | PASS |
| /clothing/clothing-women-tops-M-UK-to-US.html | 301 | /clothing/clothing-women-tops-10-UK-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-tops-10-UK-to-US.html | PASS |
| /clothing/clothing-women-tops-L-EU-to-US.html | 301 | /clothing/clothing-women-tops-40-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-tops-40-EU-to-US.html | PASS |
| /clothing/clothing-women-tops-L-UK-to-US.html | 301 | /clothing/clothing-women-tops-12-UK-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-tops-12-UK-to-US.html | PASS |
| /clothing/clothing-women-tops-XL-EU-to-US.html | 301 | /clothing/clothing-women-tops-42-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-tops-42-EU-to-US.html | PASS |
| /clothing/clothing-women-tops-XL-UK-to-US.html | 301 | /clothing/clothing-women-tops-14-UK-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-tops-14-UK-to-US.html | PASS |
| /clothing/clothing-women-tops-XXL-EU-to-US.html | 301 | /clothing/clothing-women-tops-44-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-tops-44-EU-to-US.html | PASS |
| /clothing/clothing-women-tops-XXL-UK-to-US.html | 301 | /clothing/clothing-women-tops-16-UK-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-tops-16-UK-to-US.html | PASS |
| /clothing/clothing-women-tops-XXXL-EU-to-US.html | 301 | /clothing/clothing-women-tops-46-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-tops-46-EU-to-US.html | PASS |
| /clothing/clothing-women-tops-XXXL-UK-to-US.html | 301 | /clothing/clothing-women-tops-18-UK-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-tops-18-UK-to-US.html | PASS |
| /clothing/clothing-women-pants-0-EU-to-US.html | 301 | /clothing/clothing-women-pants-32-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-pants-32-EU-to-US.html | PASS |
| /clothing/clothing-women-pants-0-UK-to-US.html | 301 | /clothing/clothing-women-pants-4-UK-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-pants-4-UK-to-US.html | PASS |
| /clothing/clothing-women-pants-2-EU-to-US.html | 301 | /clothing/clothing-women-pants-34-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-pants-34-EU-to-US.html | PASS |
| /clothing/clothing-women-pants-2-UK-to-US.html | 301 | /clothing/clothing-women-pants-6-UK-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-pants-6-UK-to-US.html | PASS |
| /clothing/clothing-women-pants-4-EU-to-US.html | 301 | /clothing/clothing-women-pants-36-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-pants-36-EU-to-US.html | PASS |
| /clothing/clothing-women-pants-6-EU-to-US.html | 301 | /clothing/clothing-women-pants-38-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-pants-38-EU-to-US.html | PASS |
| /clothing/clothing-women-pants-8-EU-to-US.html | 301 | /clothing/clothing-women-pants-40-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-pants-40-EU-to-US.html | PASS |
| /clothing/clothing-women-pants-10-EU-to-US.html | 301 | /clothing/clothing-women-pants-42-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-pants-42-EU-to-US.html | PASS |
| /clothing/clothing-women-pants-12-EU-to-US.html | 301 | /clothing/clothing-women-pants-44-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-pants-44-EU-to-US.html | PASS |
| /clothing/clothing-women-pants-14-EU-to-US.html | 301 | /clothing/clothing-women-pants-46-EU-to-US.html | 308 (platform strip) | 200 | /clothing/clothing-women-pants-46-EU-to-US.html | PASS |

**31/31 PASS.** No redirect pointed to another old/retired URL; no redirect
chain beyond our own single intended hop (plus the disclosed, universal
platform hop); every destination returns 200 with its declared canonical tag
correctly matching the intended new URL (see §2 for the caveat that this is
a document-content check, not a claim about which URL search engines treat
as canonical).

## 4. Jacket Retirement (1)

| Check | Result |
|---|---|
| Old URL `/clothing/eu-50-jacket-to-us-size.html` | `301` |
| `Location` | `/clothing-size-converter.html` (exact match) |
| Next hop | `308` platform extension-strip to `/clothing-size-converter` (disclosed, §2) |
| Final destination status | `200` |
| Final destination has working converter form (`#clothing-size-input`) | Present |

**PASS.** Retired jacket URL correctly permanent-redirects to a live,
functional converter — not a dead end.

## 5. Collision Exclusions (7)

These 7 URLs were deliberately **excluded** from `_redirects` because the
URL string itself is the correct, permanent home for its own (corrected)
route — see `_redirects` file comments and
[`phase-5e-url-migration-architecture-audit.md`](phase-5e-url-migration-architecture-audit.md)
§4/§9. Verified each returns `200` directly (after only the disclosed
platform extension-strip hop, never a redirect to a *different* URL), its
canonical tag declares its own `.html` URL, and its CTA link to the
converter is present.

| URL | Status (direct) | Redirected elsewhere? | Final status | Canonical tag matches own `.html` URL | CTA present | Result |
|---|---|---|---|---|---|---|
| /clothing/clothing-men-pants-42-EU-to-US.html | 308 (platform strip only) | No | 200 | Yes | Yes | PASS |
| /clothing/clothing-women-pants-4-UK-to-US.html | 308 (platform strip only) | No | 200 | Yes | Yes | PASS |
| /clothing/clothing-women-pants-6-UK-to-US.html | 308 (platform strip only) | No | 200 | Yes | Yes | PASS |
| /clothing/clothing-women-pants-8-UK-to-US.html | 308 (platform strip only) | No | 200 | Yes | Yes | PASS |
| /clothing/clothing-women-pants-10-UK-to-US.html | 308 (platform strip only) | No | 200 | Yes | Yes | PASS |
| /clothing/clothing-women-pants-12-UK-to-US.html | 308 (platform strip only) | No | 200 | Yes | Yes | PASS |
| /clothing/clothing-women-pants-14-UK-to-US.html | 308 (platform strip only) | No | 200 | Yes | Yes | PASS |

**7/7 PASS.** None of these 7 were redirected to a different URL — the only
hop observed on any of them is the same universal platform extension-strip
seen everywhere else on the site (§2).

## 6. Methodology

- Real HTTPS requests via Node's built-in `https` module (no browser
  needed for header/status/canonical checks — this is server-side redirect
  behavior, not client-rendered), run from this machine directly against
  `https://globalsizechart.com`.
- `HEAD` requests used for status/`Location` checks; `GET` requests used
  only where response body inspection (canonical tag, converter form,
  CTA link) was required, to minimize load against production.
- Script: kept in scratchpad (not part of the repo), not a project
  dependency.
- Full raw results (all fields, all 39 checks) preserved in
  `certify-results.json` alongside the script, available on request if
  deeper inspection of any individual check is wanted.

## 7. Final Verdict

- Redirects: **31/31 PASS**
- Jacket retirement: **PASS**
- Collision exclusions: **7/7 PASS**
- No redirect chain beyond the intended single hop from any `_redirects`
  rule (the disclosed platform-level `.html`-stripping hop is universal,
  pre-existing, and unrelated to this migration — not a defect)
- No old/retired URL redirects to another old/retired URL
- All destinations return 200 with a declared canonical tag matching the
  intended `.html` URL (a document-content check; whether that declared
  `.html` URL is also what search engines treat as canonical, given the
  sitewide 308 away from it, is answered separately — not a claim of this
  report — in
  [`phase-5f-e-canonical-cloudflare-architecture-audit.md`](phase-5f-e-canonical-cloudflare-architecture-audit.md))

**PHASE 5F-D — PASS**
