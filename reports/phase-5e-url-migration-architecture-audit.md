# Phase 5E — URL Migration & Duplicate Consolidation Architecture Audit

**Mode: READ-ONLY.** No file was modified except this report — verified in
§16.

---

## 1. Executive Decision Summary

- **Jacket page:** retire it. No repository evidence supports repairing it in
  place — the only dataset value that makes "EU 50" real (men's pants)
  already has a page, so "fixing" it would create a 4th duplicate, not solve
  anything. **RECOMMENDATION**, not left open (see §2).
- **39-page migration:** re-verified independently at **39** (38 Phase-5C
  routes + 1 dress page), matching Phase 5D's corrected figure. Exact
  canonical target filename derived for all 38; 7 form a single-hop
  collision each (not 7 independent long chains — traced precisely, §4).
- **Canonical slug policy:** filenames must encode **source size** (the
  value actually being converted *from*), not a stable US-anchor. This
  matches the convention every other programmatic page family on the site
  already uses and is the only policy that makes "filename semantics =
  content semantics" true architecturally, not just per-page.
- **Duplicate pairs:** confirmed via direct code reading (not inference) that
  `expandClothingRoutes()`'s dedup check is slug-string-based only — it never
  checks semantic identity against `data/clothing_routes.json`. The 5-field
  key `gender|category|from_region|size|to_region` was verified (not
  assumed) to produce identical values for all 3 known pairs.
- **Migration mechanism:** two-pass regenerate-then-cleanup (§4), the same
  technique already used and proven in Phases 5A and 5C, extended to 38
  files with full route context.
- **Redirect mechanism:** the repository has exactly one supported mechanism
  — the Cloudflare Pages `_redirects` file — currently empty (0 active
  entries, only commented examples). This is the mechanism Phase 5F must
  use; nothing else exists.
- **Sitemaps:** fully filesystem-derived (`scripts/generate-sitemaps.js`
  walks the actual HTML tree; it does not read route JSON). Re-running it
  after migration is sufficient — no manual sitemap editing is ever
  required or should ever be attempted.

**No stop condition was triggered.** All four architectural questions (A–D)
were resolved from repository evidence.

---

## 2. Jacket Page Decision

### Facts

- **VERIFIED FACT:** `data/clothing_routes.json` entry: `category: "jackets",
  gender: "men", from_region: "EU", to_region: "US", size: "50"`.
- **VERIFIED FACT:** `resolveClothingDataKey('men','jackets')` → `'tops'`
  (app.js:306); `findClothingConversion()` in
  `generate-programmatic-pages.js:2006` applies the identical alias.
- **VERIFIED FACT:** men's tops EU column = `["XS","S","M","L","XL","XXL","XXXL"]`
  — no numeric value exists. `isValidClothingSize('men','jackets','EU','50')`
  → `false`.
- **VERIFIED FACT:** `isValidClothingSize('men','pants','EU','50')` → `true`
  (row: `us:"36", uk:"36", eu:"50"`).
- **VERIFIED FACT:** `clothing/clothing-men-pants-36-EU-to-US.html` already
  exists and its live content already reads *"Men's EU 50 to US Pants
  Size... EU 50 converts to approximately US 36 for pants."*
- **VERIFIED FACT:** no jacket-specific dataset exists anywhere in the
  repository (`data/*.json`, `components/`, `generators/`, `utils/`,
  `config/` all searched; only generic advisory prose in
  `components/commercial/garment-cut-explainer.html`, not sizing data).
- **VERIFIED FACT:** 275 HTML-file inbound occurrences (re-confirmed this
  phase using Phase 5C's exact `countInboundRefs` methodology), 151
  referring files, breakdown reproduced from Phase 5D: ~120 automated
  clothing cross-link blocks, 10 brand-guide pages, ~13 measurement pages,
  plus 2 sitemap entries and 2 JSON-file references outside the HTML count.

### Inferences

- **INFERENCE, not fact:** `data/query-patterns.json` lists `"men s eu 50 to
  us jackets size globalsizechart com"` directly inside an unbroken run of
  otherwise-consecutive, correctly-labeled `"men s eu {36,38,40,42} to us
  pants size..."` entries. This is *consistent with* "jackets" being an
  authoring error for what was likely a pants query, but no direct evidence
  (comment, changelog, duplicate corrected entry) proves this in either
  direction.

### Unknowns

- Whether the original author intended "jacket" literally (a genuine,
  never-fulfilled content goal) or mistyped a pants query — **UNKNOWN**,
  unresolvable from static repository evidence.
- Whether any external inbound links (outside this repository — social,
  backlinks, bookmarks) point to this URL — **UNKNOWN**, cannot be
  determined from repository contents.

### Options

| | Factual basis | Required data/HTML changes | URL/redirect/sitemap | Duplicate-content risk | Indexing/canonical | Risk | Executable now from repo evidence alone? |
|---|---|---|---|---|---|---|---|
| **A — Retire** | Removes a page that has never been able to state a true fact | Delete route from `clothing_routes.json`; remove the generated file; regenerate the ~120 clothing pages' cross-links that reference it | 301 redirect old URL → a stable destination (e.g. `/clothing-size-converter.html`); remove from sitemap on next `generate-sitemaps.js` run | None — eliminates a risk, creates none | Old URL de-indexed via redirect over time | Low — same class of operation already twice executed safely (Phase 5A/5C scoped regeneration) | **Yes** |
| **B — Replace with real jacket data** | No factual basis exists yet — no jacket dataset anywhere in the repo | Requires *acquiring* a genuine jacket sizing dataset (chest/EU-suit-size mapping), then authoring it into `clothing_sizes.json` as a first-class category | New page content, new/same URL, sitemap update | None, if done correctly | Clean, once real data exists | Cannot be scoped or executed from what's in the repository today — this is a data-acquisition task, not a coding task | **No** |
| **C — Reclassify as pants** | EU 50 is real pants data | Change `category` to `"pants"`, keep gender/size | Would need its own new URL (or collide with the existing pants page's URL) | **Creates a 4th duplicate-semantic-intent pair**, identical in kind to the 3 already flagged for consolidation (§7) | Splits authority/inbound signals between two URLs answering the same question | Actively counterproductive — turns one known defect into an instance of the other known defect class this whole audit track exists to eliminate | Technically yes, but not recommended |
| **D — Keep as-is, ensure it can't silently "pass"** | Already true today (Phase 5C's negative test confirmed: no fabricated number, dead-end CTA, error state shown) | None | None | None (status quo) | Continues consuming a sitemap/indexing slot and ~275 cross-link references for a page that can never complete its stated purpose | Low risk, but is not a decision — it is the current state, which this phase exists to move past | Yes, but is a non-action |

### Recommended Decision

**OPTION A — Retire the page**, with a 301 redirect to
`/clothing-size-converter.html` (the nearest stable, always-functional
destination; verified to exist and require no new content) via the existing
`_redirects` mechanism (§10). This is the only option that satisfies the
stated priority order — factual correctness first (the page can never state
a true fact under its current framing), user usefulness second (a redirect
to a working converter is strictly more useful than a dead end), and
architectural integrity third (it does not create a new duplicate, unlike
Option C). Option B remains available as a **separate, future, data-
acquisition-gated** action — consistent with the "Clothing Expansion Track"
already carved out as independent of this remediation.

---

## 3. 39-Page Migration Inventory

Independently re-derived (not copied from Phase 5D) by iterating
`clothing_sizes.json` rows directly through the corrected `getSourceSize()`
and comparing against the current on-disk slug for every one of the 120
generated routes plus the 1 dress route. **Result: 39, exactly matching
Phase 5D's corrected count** (38 + 1) — Phase 5D's figure is confirmed, not
merely repeated.

**GROUP 1 — 38 Phase-5C-corrected routes with stale filenames:**

| Garment/direction | Count | Old filename size | Correct content size |
|---|---|---|---|
| men/pants, EU→US | 8 | row.us (28–42) | row.eu (42–56) |
| women/tops, EU→US | 7 | row.us (letters XS–XXXL) | row.eu (numbers 34–46) |
| women/tops, UK→US | 7 | row.us (letters XS–XXXL) | row.uk (numbers 6–18) |
| women/pants, EU→US | 8 | row.us (0–14) | row.eu (32–46) |
| women/pants, UK→US | 8 | row.us (0–14) | row.uk (4–18) |
| **Subtotal** | **38** | | |

Every one of the 38 was re-verified this phase against its live on-disk
content: title, H1, meta description, conversion preview, and CTA `size`
parameter all already correctly reflect the source-region value (Phase 5C's
functional fix holds); only the filename's embedded number is stale.

**GROUP 2 — pre-existing dress-page mismatch:**

`womens-size-8-us-to-eu-dress.html` — filename says `US`, all functional
content (route, title, H1, description, preview, CTA) correctly says `UK`.
Deliberately retained per Phase 5A/5B/5C's explicit decision (1,139 inbound
occurrences at time of Phase 5A; not independently re-counted this phase, no
change expected since it hasn't been touched since Phase 5A).

Total: **38 + 1 = 39.**

---

## 4. Seven Collision Chains

Re-derived and traced precisely (not estimated). **Correction to how these
were characterized in Phase 5C/5D:** they are not seven independent chains —
they are **two distinct chain structures**, one of which has a single
collision point and one of which has two interleaved 4-link chains, for
seven collision points total. Precise reproduction:

### Chain A — men's pants, EU→US (1 collision point, in an 8-item family)

```
clothing-men-pants-28-EU-to-US  → clothing-men-pants-42-EU-to-US   (COLLIDES: "42" is an old filename)
clothing-men-pants-30-EU-to-US  → clothing-men-pants-44-EU-to-US   (clean — never existed)
clothing-men-pants-32-EU-to-US  → clothing-men-pants-46-EU-to-US   (clean)
clothing-men-pants-34-EU-to-US  → clothing-men-pants-48-EU-to-US   (clean)
clothing-men-pants-36-EU-to-US  → clothing-men-pants-50-EU-to-US   (clean)
clothing-men-pants-38-EU-to-US  → clothing-men-pants-52-EU-to-US   (clean)
clothing-men-pants-40-EU-to-US  → clothing-men-pants-54-EU-to-US   (clean)
clothing-men-pants-42-EU-to-US  → clothing-men-pants-56-EU-to-US   (clean — "56" never existed)
```
Only 1 of these 8 targets (`...-42-EU-to-US`) collides with a current
filename — and that current filename belongs to a *different* row in this
same family (the row whose own target is `...-56-EU-to-US`).

### Chain B — women's pants, UK→US (two interleaved 4-link chains, 6 collision points, in an 8-item family)

```
clothing-women-pants-0-UK-to-US  → clothing-women-pants-4-UK-to-US   (COLLIDES)
clothing-women-pants-4-UK-to-US  → clothing-women-pants-8-UK-to-US   (COLLIDES)
clothing-women-pants-8-UK-to-US  → clothing-women-pants-12-UK-to-US  (COLLIDES)
clothing-women-pants-12-UK-to-US → clothing-women-pants-16-UK-to-US  (clean — "16" never existed)

clothing-women-pants-2-UK-to-US  → clothing-women-pants-6-UK-to-US   (COLLIDES)
clothing-women-pants-6-UK-to-US  → clothing-women-pants-10-UK-to-US  (COLLIDES)
clothing-women-pants-10-UK-to-US → clothing-women-pants-14-UK-to-US  (COLLIDES)
clothing-women-pants-14-UK-to-US → clothing-women-pants-18-UK-to-US  (clean — "18" never existed)
```
6 of these 8 targets collide with a current filename that belongs to the
*next* row in the same chain.

**Total collision points: 1 (Chain A) + 6 (Chain B) = 7**, matching Phase
5C/5D's count exactly, now with the precise internal structure documented.

### Selected migration mechanism

Compared per the brief's four methods:

- **Method 1 (direct sequential rename):** rejected. A plain rename doesn't
  fix *content* (many of the 38 need their title/H1/preview/CTA to reflect a
  *different* row's data at the new filename, not just a renamed copy of the
  old file) — content must be regenerated, not moved. Also unsafe for both
  chains without a carefully hand-ordered sequence.
- **Method 2 (temporary staging filenames):** rejected as unnecessary
  overhead. Requires 2 file operations per affected file (76 total) and
  still doesn't solve the content-regeneration requirement — a temp-named
  file still has stale content until regenerated anyway.
- **Method 3 (two-pass generated rebuild) — RECOMMENDED:**
  - **Pass 1:** for each of the 38 corrected routes, compute its final
    target filename (source-size-based, §5) and write freshly-generated
    content there via the real `generateClothingProgrammaticPages()`
    function (same technique already proven in Phase 5A and Phase 5C).
    Every target filename is written **exactly once**, with its final,
    correct content, regardless of write order — so mid-pass states where a
    target temporarily "collides" with a not-yet-cleaned-up old file are
    irrelevant: the write simply overwrites whatever was there with the
    correct final bytes.
  - **Pass 2:** after Pass 1 completes for all 38, delete every one of the
    31 old filenames that is **not** among the 38 new target filenames
    (i.e., truly orphaned — no route claims it anymore). The 7 collision
    targets are never deleted (they were overwritten with new correct
    content in Pass 1, not orphaned).
  - This is **order-independent within each pass**, **never reads stale
    data as a source of truth** (content always comes fresh from
    `clothing_sizes.json` via the route object, never copied from the old
    file), and **cannot lose data** — nothing is deleted until Pass 1 has
    unconditionally succeeded for all 38 writes.
- **Method 4:** no other repository-supported mechanism was found (no
  existing migration tooling beyond what Phases 5A/5C already improvised via
  scoped `fs.writeFileSync` interception, which Method 3 is itself an
  extension of).

---

## 5. Canonical URL Policy

**Recommended policy: filenames must encode source size** (the value
actually being converted *from*, matching `getSourceSize(row, fromRegion)`),
not a stable US-anchor.

Verified reasoning:

- Every other programmatic page family on the site (shoes:
  `us-9-to-eu-shoe-size.html`, `japan-25-to-eu-shoe-size.html`, etc.) already
  names files after the *source* value, never a stable per-row anchor
  disconnected from direction. Aligning clothing to this is not a new
  pattern — it's closing a divergence that clothing accidentally introduced.
- It is the only policy under which "filename semantics = route semantics =
  content semantics = CTA semantics = dataset semantics" (Phase 3's own
  stated goal) becomes true **by construction**, not just true today for 87
  of 125 generated routes. Under the current (US-anchor) policy, the
  mismatch class can only grow as more direction pairs are added in the
  future (§11's kids/JP/CN expansion track would reproduce the identical bug
  pattern if it reused the current slug convention).
- It requires no new concept: the slug template
  `clothing-{gender}-{tops|pants}-{size}-{fromR}-to-{toR}` is unchanged —
  only which value fills `{size}` changes, from `row.us` (always) to
  `getSourceSize(row, fromR)` (already-implemented, already-tested — Phase
  5C's regression suite, `scripts/test-clothing-route-generator.js`, already
  asserts this function's correctness).
- Consequence, already fully scoped: exactly the 38 routes in §3 change
  filename; the other 82 generated routes (where `row.us` was always the
  correct source value, i.e. every `US→EU`/`US→UK` pair) keep their current
  filenames unchanged, since `getSourceSize(row,'US') === row.us` always.

**Rejected alternative (US-anchor / stable identifier):** perpetuates the
exact defect class this whole track exists to close, and does not reduce
migration scope (the 38 pages still need their *content* fixed, which Phase
5C already did — keeping a stable anchor filename doesn't avoid touching
those 38 files, it just leaves their names permanently wrong).

---

## 6. Generator / Slug Architecture

Traced precisely (code read directly, not inferred):

```
route object (gender, category, from_region, to_region, size)
  → slug: `clothing-${gender}-${category}-${size}-${fromR}-to-${toR}`     [generate-phase10-pages.js:217/232, RECOMMENDED to change from row.us to sourceSize]
  → filename: `clothing/${slug}.html`
  → generated HTML (generateClothingProgrammaticPages, generate-programmatic-pages.js:2032)
      → title/H1: `${genderLabel} ${fromLabel} ${route.size} to ${toLabel} ${categoryLabel} Size`   [already correct post-Phase-5C]
      → canonical: `${BASE_URL}/clothing/${fileName}`                                                [derived from slug — will automatically follow the corrected slug]
      → CTA href: `clothing-size-converter.html?gender=...&clothing=...&from=...&size=${route.size}&to=...`   [already correct post-Phase-5C]
  → sitemap: NOT derived from the route object at all — generate-sitemaps.js walks the filesystem directly (§11); automatically correct once files are renamed
  → cross-links: relatedGarments/session-depth/conversion-loop blocks built from the live `clothingRoutes` array inside generateClothingProgrammaticPages() — will automatically use corrected slugs IF the full route array (with corrected slug construction) is passed to a full regeneration (§9)
```

**Can the current architecture support a correct future filename without a
new inconsistency?** **Yes**, with exactly one change: in
`expandClothingRoutes()` (both the `tops` and `pants` blocks), replace:

```js
const slugSimple = `clothing-${gender}-tops-${String(row.us).replace(/\s/g, '-')}-${fromR}-to-${toR}`;
```

with:

```js
const slugSimple = `clothing-${gender}-tops-${String(sourceSize).replace(/\s/g, '-')}-${fromR}-to-${toR}`;
```

(and the identical change in the `pants` block) — i.e., **use the exact same
`sourceSize` variable already computed one line earlier for the `size`
field**, instead of hardcoding `row.us`. This is a **one-token change per
block, two total**, not a rewrite. Everything downstream (title, canonical,
CTA, sitemap-on-next-run) already derives correctly from the route object —
confirmed by code reading, not assumed.

**This is the exact, sole generator change Phase 5F requires** for the slug
layer. No other function needs modification for filename correctness.

---

## 7. Duplicate Semantic Intent Findings

Re-verified all 3 pairs this phase (not restated from Phase 5D without
re-checking):

| Pair | Base slug (inbound refs) | Expanded slug (inbound refs) | Title (both) | CTA href (both) | Semantic identity key (verified identical) |
|---|---|---|---|---|---|
| 1 | `mens-medium-us-to-eu` (1,228) | `clothing-men-tops-M-US-to-EU` (10) | "Men's US M to EU Tops Size" | `?gender=men&clothing=tops&from=US&size=M&to=EU` | `men\|tops\|US\|M\|EU` |
| 2 | `mens-large-us-to-uk` (364) | `clothing-men-tops-L-US-to-UK` (2) | "Men's US L to UK Tops Size" | `?gender=men&clothing=tops&from=US&size=L&to=UK` | `men\|tops\|US\|L\|UK` |
| 3 | `womens-pants-us-6-to-eu` (320) | `clothing-women-pants-6-US-to-EU` (7) | "Women's US 6 to EU Pants Size" | `?gender=women&clothing=pants&from=US&size=6&to=EU` | `women\|pants\|US\|6\|EU` |

**Root cause, verified by direct code reading of `expandClothingRoutes()`
(generate-phase10-pages.js:217, 232):**

```js
if (existingSlugs.has(slugSimple)) continue;
```

This checks **only the literal slug string** against a `Set` seeded from the
6 base routes' own `slug` fields. It never compares
`gender`/`category`/`from_region`/`size`/`to_region` against the base
routes' fields. Since `mens-medium-us-to-eu` (base) and
`clothing-men-tops-M-US-to-EU` (expanded) are different strings, this check
never fires, even though both routes have byte-identical semantic-identity
tuples (verified directly, not assumed — computed and printed during this
audit).

**The semantic identity key is confirmed as exactly 5 fields:** `gender +
category + from_region + size + to_region`. No additional field was found
necessary or present that would distinguish any of the 3 pairs (e.g., no
`measurement_reference` difference — both members of each pair have
consistent, non-distinguishing values there).

---

## 8. Duplicate Consolidation Policy

**Recommended: Option C — canonical the expanded page to the base page,
leave both URLs live.**

Reasoning against the alternatives:

- **A (delete redundant expanded page):** rejected as the sole action — the
  expanded page is currently indexed and may hold minor independent search
  visibility; deleting outright without a redirect/canonical risks a hard
  404 for anyone who reached it directly.
- **B (301 redirect expanded → base):** viable and arguably stronger than C
  for consolidating link equity, but changes user-visible URL behavior (a
  redirect is a bigger behavioral change than a canonical tag) for a
  same-content page — more invasive than necessary given the base page
  already has 100x+ the inbound references and is clearly the established
  page.
- **C (canonical expanded → base, both remain accessible) — RECOMMENDED:**
  lowest-risk, standard, reversible SEO consolidation mechanism; leaves both
  URLs resolving (no new 404 risk from any as-yet-undiscovered inbound
  link), while telling search engines unambiguously which URL is
  authoritative. Matches the site's existing self-canonical convention
  (§Phase 5B/5D — every page already emits `<link rel="canonical">`; this
  simply points the expanded page's canonical at the base page's URL instead
  of at itself).
- **D (keep both, distinct intent):** rejected — verified false; titles, H1s,
  CTAs, and computed conversions are byte-identical (§7), there is no
  demonstrable distinct intent.

**Uniform policy across all 3 pairs:** yes, all 3 pairs have the identical
shape (1 base + 1 expanded route, byte-identical content, base has
dramatically higher inbound references) — the same Option C treatment
applies uniformly, no pair needs different handling.

**Preventing future duplicates — exact generator requirement:** before
`expandClothingRoutes()` adds any generated route to its output, it must
additionally check the **5-field semantic identity key** (not just the slug
string) against every route in `data/clothing_routes.json`. Concretely: build
a `Set` of `` `${gender}|${category}|${from_region}|${size}|${to_region}` ``
strings from the base routes at the top of `expandClothingRoutes()`
(alongside the existing `existingSlugs` set), and skip generating any
expanded route whose own identity string is already present in that set —
in addition to (not instead of) the existing slug-string check.

---

## 9. Cross-Link Propagation Model

Every reference class to the 38 slugs, traced and classified:

| Reference source | Count/scope | Classification |
|---|---|---|
| The 38 pages' own filenames | 38 files | **MUST CHANGE** (this is the migration itself) |
| Other clothing pages' related-garment/session-depth/conversion-loop cross-link blocks | All 125 other clothing pages pull from the same shared 126-route pool — any of the 38 renamed slugs appearing in any other page's cross-link section | **MUST CHANGE** — stale otherwise (broken internal links to now-nonexistent old filenames) |
| `sitemaps/sitemap-medium.xml`, `sitemaps/indexing-feed.xml` | 38 URLs each | **MUST CHANGE**, but not by hand — regenerate via `node scripts/generate-sitemaps.js` (filesystem-derived, §11) |
| Canonical tags on the 38 pages themselves | 38 | **MUST CHANGE** — automatic consequence of regenerating those 38 pages (canonical is derived from the page's own filename) |
| Brand-guide pages' cross-reference pools | Not verified to reference any of the 38 specifically in this phase (only confirmed for the jacket page, §2) — **REQUIRES VERIFICATION IN PHASE 5F** before execution, flagged explicitly rather than assumed clean |
| Measurement pages' cross-reference pools | Same — not independently re-verified for the 38 this phase; **REQUIRES VERIFICATION IN PHASE 5F** |
| `data/clothing_routes.json`, `data/ai-signals.json`, `data/query-patterns.json` | Data files, not rendered pages | **MAY CHANGE** if they contain literal old-slug strings (not confirmed either way for the 38 in this phase — the jacket page was confirmed present in these files, §2; the 38 were not individually re-checked against these three JSON files this phase) — **REQUIRES VERIFICATION IN PHASE 5F** |
| Any file outside `clothing/`, `sitemaps/`, and the JSON files above (e.g. `robots.txt`, footer, global nav) | None found referencing any specific clothing-route slug | **MUST NOT CHANGE** — out of scope, no evidence any such reference exists |

**Full 126-page regeneration vs. targeted replacement — compared:**

- **Targeted replacement** (string-find-replace of old→new slug across ~125
  other clothing files' cross-link HTML) risks: missing an occurrence,
  matching a substring incorrectly, leaving surrounding markup
  inconsistent with what the real generator would produce, and does nothing
  to catch the "not yet verified" categories in the table above.
- **Full regeneration** (re-run `generateClothingProgrammaticPages()` for
  all 126 routes, with the corrected slug-construction change from §6
  already in place) guarantees every cross-link, canonical, and CTA across
  the entire clothing family is internally consistent with the final route
  data — the same governing principle ("fix the source, not individual
  pages") already established across every prior phase in this engagement.

**RECOMMENDATION: full 126-page clothing regeneration**, not targeted
replacement. This is a bounded, previously-exercised operation (Phase 3's
original full clothing generation was exactly this scale) and is the only
approach that doesn't require enumerating every cross-link occurrence by
hand or trusting an incomplete find-replace.

---

## 10. Redirect Architecture

- **VERIFIED FACT:** `_redirects` (repository root) is the Cloudflare Pages
  redirect mechanism — standard format `<source> <destination> <status>`,
  e.g. the file's own commented example: `/old-page /new-page 301`.
- **VERIFIED FACT:** currently **zero active entries** — only comments and
  examples. No prior renamed-page precedent exists in this file.
- **VERIFIED FACT:** no dedicated redirect-generation script exists anywhere
  in `scripts/`.
- **This is the repository's only supported mechanism** — confirmed by
  checking `cloudflare/` (documentation only: `BOT-AND-SECURITY.md`,
  `cache-rules.md`, no redirect logic), and finding no alternative
  (`.htaccess`, framework-level redirect config, etc.) anywhere in the repo.

**Should each of the 38 have a redirect?** **Yes, 301, old slug → new
slug**, added as 38 explicit lines in `_redirects`. Rationale: these are
live, indexed, cross-linked URLs (§9) — removing them without a redirect
would create 38 new 404s for anyone with an old bookmark, an existing
external backlink, or a cached search result, which directly contradicts
the "no user-facing regression" standard every prior phase in this
engagement has held to.

**The dress page:** **no redirect** — it is not being renamed (§3, Group 2
is explicitly out of this migration's scope; Phase 5A/5B/5C's decision to
retain its URL stands unchanged).

**The jacket page (§2):** **yes, one redirect**, old URL → `/clothing-size-converter.html`
(distinct from the 38 — this is a retirement redirect, not a rename
redirect).

---

## 11. Sitemap / Indexing Architecture

```
HTML files on disk (clothing/*.html, and every other page)
  → scripts/generate-sitemaps.js  (walks the filesystem directly — walkHtml(), IGNORE_DIRS-filtered)
  → sitemaps/sitemap-high.xml, sitemap-medium.xml, sitemap-low.xml (tiered by scripts/crawl-priority-map.js)
  → sitemaps/indexing-feed.xml (last-7-days by file mtime)
  → sitemap/index.html (human/AI index page)
  → sitemap.xml (root sitemap index, references the 4 files above — VERIFIED unchanged by any of this, since it only lists the 4 filenames, not individual URLs)
```

- **Authoritative source:** the live filesystem, not any route JSON.
  **VERIFIED FACT** — read `generate-sitemaps.js` directly; it contains no
  reference to `clothing_routes.json` or `expandClothingRoutes`.
- **Files that should never be hand-patched:** all of the above — every one
  is fully regenerated output.
- **Can regeneration safely update only the affected URLs?** Not
  meaningfully distinct from a full run — `generate-sitemaps.js` always
  walks the entire site tree; there is no "partial" mode, and none is
  needed, since re-running it is a single, fast, idempotent, read-the-
  filesystem operation with no risk to unrelated content.
- **Required action in Phase 5F:** run `npm run build:sitemaps` (which
  chains `generate-sitemaps.js` and `internal-link-injector.js`) after the
  38-page rename + 126-page cross-link regeneration is complete, and after
  the jacket page is removed. **Do not hand-edit any sitemap file.**

---

## 12. Future Generator Safety Requirements

Specified as exact intended assertions (not written as code) for Phase 5F's
required test additions:

1. For every generated clothing route, `size` must be a member of
   `getAvailableClothingSizes(gender, category, from_region)` — i.e.
   `isValidClothingSize(gender, category, from_region, size) === true` for
   all 126 (post-jacket-retirement: 125) routes.
2. For every generated route, the rendered `<title>` must contain both the
   route's `from_region` code/name and `size` — asserted by parsing the
   actual rendered HTML, not by re-deriving the expected string
   independently (avoids the exact class of bug found in this phase's own
   tooling, §Correction below).
3. For every generated route, the CTA's query parameters
   (`gender`,`clothing`,`from`,`size`,`to`) must equal the route object's own
   fields, exactly (string equality after normalization).
4. **Filename's embedded size token must equal `route.size`** for every
   generated route — this is the direct regression guard for the defect
   class this entire multi-phase track exists to close. Must use a token
   extractor that recognizes **all** real size shapes used in this dataset:
   bare letters (`XS,S,M,L,XL,XXL,XXXL,XXXXL,XXXXXL`) and numeric strings —
   not only spelled-out words (the exact gap that caused this phase's own
   31-vs-39 correction, §Correction below).
5. No two routes (checked pairwise across the full 126-entry — post-
   retirement 125-entry — combined base+expanded array) may share the
   5-field identity key `gender|category|from_region|size|to_region`.
6. Corollary of 5, stated explicitly per the brief: no generated
   (`expanded`-source) route may share that identity key with any
   hand-authored (`base`-source) route specifically — this is the exact
   mechanism to implement per §8.
7. No generated page's slug may reference a `category` for which
   `getAvailableClothingRegions(gender, category)` is empty for every
   region (this is the jacket-page defect class — a generated page must
   never claim a garment/gender combination the dataset cannot back at all).
8. Every sitemap URL (parsed from the actual regenerated
   `sitemaps/sitemap-medium.xml`) must correspond to an existing file on
   disk.
9. No internal link anywhere in the regenerated 126 clothing pages (or the
   ~10 brand-guide / ~13 measurement pages found to reference the jacket
   page, §2) may point to any of the 31 filenames being deleted in Pass 2
   of the migration (§4), nor to the retired jacket page's old URL, unless
   that reference is the literal 301 target check itself.
10. Every one of the 38 old filenames (§3, Group 1) and the 1 retired
    jacket filename must appear as a `<source>` in `_redirects` pointing to
    its correct destination, and must NOT exist as a live file on disk
    post-migration (mutually exclusive: a URL is either a live file or a
    redirect source, never both).
11. For both collision chains (§4), the two-pass algorithm's final state
    must be independently re-verifiable: every one of the 38 target
    filenames exists with content matching a fresh in-memory regeneration
    from current route data (the same "capture without writing" technique
    already used in Phase 5A/5B/5C's audits), and none of the 31 orphaned
    old filenames remain on disk.
12. `isValidClothingSize('men','jackets','EU','50')` (or any other numeric
    value) must remain `false` unless a real, dedicated jacket dataset entry
    is added to `clothing_sizes.json` — i.e., no future change to
    `resolveClothingDataKey`'s alias behavior should silently begin
    accepting numeric jacket sizes without an explicit, reviewed dataset
    change backing it.

**Correction surfaced by this phase, relevant to assertion 2 and 4 above:**
Phase 5D's own re-audit tooling under-counted filename mismatches (31
instead of 39) because its token parser recognized spelled-out size words
but not the bare letters the slugs actually use. Any Phase 5F test asserting
filename-vs-content correctness must be built (or reviewed) against this
specific known failure mode.

---

## 13. Exact Phase 5F Implementation Specification

### A. Files expected to change

- `scripts/generate-phase10-pages.js` — the two-token slug-construction
  change (§6): `row.us` → `sourceSize`, in both the `tops` and `pants`
  blocks of `expandClothingRoutes()`.
- `scripts/generate-phase10-pages.js` — add the 5-field semantic-identity
  dedup check (§8) alongside the existing slug-string check.
- `data/clothing_routes.json` — remove the jacket route entry (§2, Option
  A); add `canonical_target` metadata (or equivalent, matching whatever
  field convention the eventual implementer finds `generateClothingProgrammaticPages()`
  already supports for canonical overrides — **if no such field/mechanism
  currently exists, Phase 5F must add one to the generator, not hand-edit
  canonical tags post-generation**) for the 2 `expanded`-source routes in
  each of the 3 duplicate pairs (§8) — 3 total.
- `clothing/*.html` — all 126 files regenerated (full-family regeneration,
  §9); net result: 38 files renamed (new filenames), 31 old filenames
  removed, 1 jacket file removed, 88 filenames unchanged (content
  unchanged, since they were already correct).
- `_redirects` — 39 new lines: 38 rename redirects (§4) + 1 jacket
  retirement redirect (§2), each `301`.
- `sitemaps/sitemap-high.xml`, `sitemaps/sitemap-medium.xml`,
  `sitemaps/sitemap-low.xml`, `sitemaps/indexing-feed.xml`, `sitemap/index.html`
  — regenerated via `npm run build:sitemaps`, not hand-edited.
- A new or extended test file asserting the twelve invariants in §12.

### B. Files explicitly forbidden from changing unless evidence proves otherwise

- `data/clothing_sizes.json` — no dataset value changes; this migration is
  purely a filename/routing correction plus one retirement, not a data
  change.
- `app.js` — the converter contract (`isValidClothingSize`,
  `getAvailableClothingSizes`, `resolveClothingDataKey`, `getAllClothingConversions`
  equivalents) is untouched; nothing in this migration requires a runtime
  behavior change.
- Any `programmatic-pages/`, `measurement/`, `us/uk/eu/ca/` file — unless
  Phase 5F's own reference-audit (required by §9's flagged "REQUIRES
  VERIFICATION" rows) proves one of them literally contains a stale
  clothing slug. Do not touch these preemptively.
- Footer architecture, AI Citation Engine, AI index, card system, Cloudflare
  cache rules, `robots.txt`, global navigation — no evidence in this or any
  prior phase implicates any of these.
- `scripts/generate-programmatic-pages.js`'s `generateClothingProgrammaticPages()`
  function body — no change identified as necessary; it already correctly
  derives title/H1/CTA/canonical from the route object (§6). Only the
  *route-construction* function (`expandClothingRoutes`, a different
  function in a different file) needs the slug-token change.

### C. Exact generator changes required

1. In `scripts/generate-phase10-pages.js`, function `expandClothingRoutes()`:
   change `const slugSimple = \`clothing-${gender}-tops-${String(row.us).replace(/\s/g, '-')}-${fromR}-to-${toR}\`;`
   to use `sourceSize` instead of `row.us` — in the `tops` block. Identical
   change in the `pants` block.
2. In the same function, before the `tops`/`pants` loops, build
   `const baseIdentitySet = new Set(baseRoutes.map(r => \`${r.gender}|${r.category}|${r.from_region}|${String(r.size)}|${r.to_region}\`));`
   (requires passing `baseRoutes`, or the already-computed identity set, into
   `expandClothingRoutes()` — currently it only receives `clothingData` and
   `existingSlugs`; its signature must be extended, or the check performed
   by its caller before merging — **this is an implementation-detail choice
   Phase 5F must make explicitly and document, not leave ambiguous**). Skip
   generating (i.e. `continue`, same as the existing null-guard) any route
   whose own identity string is already in `baseIdentitySet`.
3. `data/clothing_routes.json`: remove the jacket entry entirely (array
   splice, not a field mutation — the route must not exist in any form).

### D. Exact migration algorithm

Two-pass regenerate-then-cleanup (§4), applied to the full 126-route
(post-fix) → 125-route (post-jacket-retirement) array:

1. Compute the full corrected route array (base routes minus jacket, plus
   `expandClothingRoutes()` output under the new C.1/C.2 logic).
2. **Pass 1:** for every route in the array, write its fully-generated HTML
   to `clothing/{slug}.html` via `generateClothingProgrammaticPages()`
   (full run, not scoped — §9's recommendation). This naturally overwrites
   the 7 collision-point files with their new correct content and creates
   every other target filename.
3. **Pass 2:** delete every file currently in `clothing/` whose basename is
   not present in the final route array's slug set. This removes the 31
   truly-orphaned old filenames (§4) and the jacket page's old filename.
4. Verify: `clothing/` directory now contains exactly 125 files (126 − 1
   retired jacket page), each corresponding 1:1 to a route in the final
   array (re-run the orphan-page/orphan-route check from Phase 5B/5D's
   methodology as a post-migration gate, §14).

### E. Exact redirect behavior

Append to `_redirects` (Cloudflare Pages format, one line per entry):
```
/clothing/{old-slug-1}.html /clothing/{new-slug-1}.html 301
... (38 total rename redirects)
/clothing/eu-50-jacket-to-us-size.html /clothing-size-converter.html 301
```
39 total new lines. No existing `_redirects` content is modified.

### F. Exact sitemap behavior

Run `npm run build:sitemaps` (= `node scripts/generate-sitemaps.js && node
scripts/internal-link-injector.js`) once, after D and before any commit.
Do not hand-edit any file under `sitemaps/` or `sitemap/`.

### G. Exact cross-link regeneration behavior

Covered by D.2 (full 126→125-route regeneration naturally regenerates every
page's cross-link blocks from the corrected route array). Additionally,
Phase 5F must execute the "REQUIRES VERIFICATION" checks flagged in §9
(brand-guide pages, measurement pages, the 3 JSON data files) for all 38
renamed slugs and the 1 retired jacket slug — grep each of the 39 old slugs
across the full repository (excluding `reports/`) and confirm zero live
(non-`_redirects`, non-historical-report) references remain after
regeneration.

### H. Exact duplicate-consolidation behavior

For the 3 pairs (§7, §8): the `expanded`-source page in each pair gets a
`<link rel="canonical">` pointing to the `base`-source page's URL, not its
own. Both pages remain live (Option C, §8) — no deletion, no redirect for
these 3. This requires `generateClothingProgrammaticPages()` to support a
canonical override per route (§13.A notes this as an implementation choice
Phase 5F must make explicitly).

### I. Exact tests to create/run

- Extend `scripts/test-clothing-route-generator.js` (or create a sibling
  file) asserting all twelve invariants from §12, using the corrected
  (letter-aware) filename-token extractor.
- Re-run `scripts/test-converter-contract.js` — expect 987/987 unchanged
  (this migration doesn't touch `app.js` or the runtime contract).

### J. Exact validation gates

All of the following must pass before Phase 5F can be considered complete:
1. `node scripts/test-converter-contract.js` → 987/987.
2. The new/extended clothing-route generator test → all assertions pass,
   0 failures, explicitly including the filename-token-parser correctness
   check.
3. `npm run footer:check` → clean (regeneration must preserve footer
   markers, or the existing `standardize-footer.js` fix pass — already used
   twice in this engagement — must be run afterward).
4. `node scripts/prebuild-link-validation.js` → the known 47-entry baseline
   must not grow (any new entry must be individually explained).
5. Full clothing integrity re-audit (Phase 5B/5D methodology) →
   `route_valid: 125/125` (post-retirement), `orphan pages: 0`, `orphan
   routes: 0`, `filename_semantics mismatches: 0` (this is the metric that
   should finally reach zero — the entire point of this migration),
   `duplicate semantic intents: 0` (post-consolidation — canonical, not
   deletion, so the *pages* still both exist, but the identity-key duplicate
   check itself should now report the pair as consolidated, not flagged).
6. Real-browser certification (same isolated `puppeteer-core` technique used
   in Phases 4/5A/5C) on: at least one page per collision chain, the jacket
   redirect (confirm 301 lands on `/clothing-size-converter.html` and it's
   functional), and one of the 3 duplicate pairs (confirm the canonical tag
   change and that both URLs still resolve and convert).
7. `git diff --check` → clean.

### K. Exact expected counts

| Metric | Before Phase 5F | After Phase 5F |
|---|---|---|
| Clothing HTML pages | 126 | 125 |
| Invalid routes | 1 (jacket) | 0 |
| Filename/content mismatches | 39 | 0 |
| Duplicate semantic intents (as distinct, uncanonicalized pairs) | 3 | 0 (both pages remain, canonical resolved) |
| `_redirects` active entries | 0 | 39 |
| Orphan pages/routes | 0 / 0 | 0 / 0 (must remain) |

### L. Explicit stop conditions (for Phase 5F itself)

- If Pass 1 (§D.2) fails to write any one of the 125 target files, STOP
  before Pass 2 — do not delete any old file until every new file is
  confirmed written and non-empty.
- If any of the "REQUIRES VERIFICATION" reference classes in §9 turn out to
  reference a to-be-deleted slug from a file outside `clothing/`,
  `sitemaps/`, or the 3 named JSON files, STOP and re-scope — that file was
  not accounted for in this specification's file-scope list (§13.A/B).
- If the semantic-identity dedup check (§C.2) would cause the total route
  count to drop below the expected 125, STOP — that would mean it's
  incorrectly rejecting a route that isn't actually a duplicate of the 3
  known pairs.
- If any of the 7 collision-point files is found to contain, post-migration,
  content matching the *old* (pre-migration) row instead of its correct new
  row, STOP — this would indicate Pass 1's write order or content-generation
  logic has a defect, not that the two-pass algorithm itself is unsafe.

---

## 14. Phase 5F Validation Gates

(Restated as a standalone checklist per the required report structure — see
§13.J for the authoritative, detailed version.)

1. Converter contract tests: 987/987.
2. Clothing route generator regression test: all assertions pass, including
   the corrected filename-token check.
3. Footer check: clean.
4. Link validator: 47-entry baseline, no unexplained growth.
5. Full clothing integrity re-audit: 0 invalid routes, 0 filename
   mismatches, 0 orphans, 3/3 duplicate pairs consolidated (canonical, not
   deleted).
6. Real-browser certification: chain representatives, jacket redirect,
   duplicate-pair canonical behavior.
7. `git diff --check`: clean.

---

## 15. Phase 5F Stop Conditions

(Restated per the required report structure — see §13.L for full detail.)

1. Any of the 125 target writes fails.
2. Any previously-unaccounted-for file (outside §13.A/B's scope) is found to
   reference a migrating slug.
3. The semantic-dedup check rejects more or fewer routes than the 2 known
   redundant members of the 3 duplicate pairs.
4. Any collision-point file ends up with the wrong row's content
   post-migration.
5. Any of the twelve §12 invariants fails post-migration and cannot be
   traced to a specific, fixable cause within Phase 5F's own scope (as
   opposed to indicating a need to re-open Phase 5E's architecture
   decisions).

---

## 16. Read-Only Integrity Verification

- **HEAD before:** `0dc41c5ad56cbdd1e34bc41d1f2b55d3e17b09b5`
- **HEAD after:** `0dc41c5ad56cbdd1e34bc41d1f2b55d3e17b09b5` — unchanged.
- **`git status --short` before:** 1,033 entries.
- **`git status --short` after:** 1,033 entries **+ this one new report**.
- **Filesystem hash snapshot** of `data/`, `clothing/`, `scripts/`,
  `programmatic/`, `reports/`, `app.js`, `sitemaps/`, `sitemap.xml`,
  `_redirects` — taken before any investigation and re-taken immediately
  before writing this report: **byte-identical, zero-line diff** except the
  addition of this report file itself.
- **`git diff --check`:** exit 0.
- No command executed during this audit wrote to any existing repository
  file — every `require()` of `expandClothingRoutes`,
  `generateClothingProgrammaticPages`, and `app.js`'s contract functions was
  a pure read/in-memory computation in throwaway Node processes, consistent
  with the identical technique already validated safe in Phases 5B/5C/5D.

**No existing file was modified. Only `reports/phase-5e-url-migration-architecture-audit.md` was created.**

---

## 17. Final Verdict

All four architectural questions (A–D) were resolved from repository
evidence, with explicit VERIFIED FACT / INFERENCE / UNKNOWN / RECOMMENDATION
labeling throughout. No mandatory stop condition (Part 12 of the brief) was
triggered: the jacket decision was cleanly separated from the 38-page
migration scope (§2 vs. §3); the collision-free rename sequence was fully
derived (§4); duplicate semantic identity was defined and verified, not
assumed (§7); the canonical URL policy was determined from concrete
architectural evidence, not generic SEO preference (§5); sitemap
regeneration was traced to its authoritative, filesystem-based source (§11);
redirect behavior was reconciled with the one existing project mechanism
(§10); and the required file-scope for Phase 5F does not extend into any
system without a specific, evidenced dependency (§13.B).

**PHASE 5E — PASS**
