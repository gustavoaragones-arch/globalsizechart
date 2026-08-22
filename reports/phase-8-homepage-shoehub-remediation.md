# Phase 8 — Homepage + Shoe Conversion Hub UX Remediation

**Baseline commit:** `535af4109f59dab54da58244e00efebd1a8fc8f6` (`HEAD` =
`origin/main`, working tree clean, confirmed before any modification).

---

## 1. Baseline Commit

Confirmed identical `HEAD`/`origin/main`/clean working tree before any
edit — matches the values given in this phase's own instructions exactly.

## 2. Source Architecture Discovered

Both target pages are **single, hand-authored files with no reusable
generator**:

- `index.html` — confirmed hand-authored (established in Phase 6; no
  script in `scripts/` treats it as generator output).
- `shoe-size-conversion-chart/index.html` — the only file in that
  directory. Two scripts reference it (`scripts/migrate-hero-tool.js`,
  `scripts/refactor-conversion-page-model.js`), but both are **one-shot,
  whole-site migration scripts** (they walk the entire tree once, applying
  a structural transform, then are done) — not repeatable per-page
  generators. Their effects are already baked into the current file;
  re-running either would touch hundreds of unrelated files across every
  page family, violating this phase's strict scope. Confirmed via direct
  inspection of both scripts' headers ("One-shot migration...").

**Decision, per §31**: edited both HTML files directly. No shared
generator/template exists that produces only these two pages, so direct
editing is the correct (and only scope-safe) mechanism — consistent with
how Phase 6 itself found these two pages hand-authored.

## 3. Exact Files Changed

| File | Change |
|---|---|
| `index.html` | Homepage — hero intro rewrite, "See also" removed, duplicate "why sizes" content merged, FAQ/schema reconciled, trust card trimmed |
| `shoe-size-conversion-chart/index.html` | Shoe hub — hero intro rewrite, redundant Quick Converters grid removed, gender cards given a heading + equal hierarchy, crawl-hub cards removed, navigation consolidated, why-sizes heading renamed, FAQ/schema reconciled and expanded, trust note added |
| `scripts/test-phase-8-homepage-shoehub.js` | New — Phase 8 automated test suite |
| `reports/phase-8-before.json` | New — pre-implementation inventory |
| `reports/phase-8-after.json` | New — post-implementation inventory |
| `reports/phase-8-homepage-shoehub-remediation.md` | New — this report |

No other file was modified. Verified in §16.

---

## 4. Homepage Before/After Architecture

**Before**: `H1 ("Global Size Chart") → meta-description-identical lead
paragraph → "See also" (3 links, above the converter) → converter → ad →
Quick Converters (8 cards) → ad → how-to-measure-shoes → ad (mid-content)
→ how-to-measure-clothing → Fit & Garment Guide (2 card grids: Fit Types +
Fit Differences & Sizing Behavior) → "Why Sizes Differ Between US, EU, UK
& Asia" (5 subsections) → ad → FAQ (5 items, answer text differing from
schema) → ad → 5-paragraph trust card → footer.`

**After**: `H1 (unchanged — evaluated per §6 below) → new human-written
lead → converter (immediately adjacent, no "See also," no ad, no
navigation in between) → ad → Quick Converters (8 cards, unchanged —
audited, all kept, see §7) → ad → how-to-measure-shoes → ad (mid-content)
→ how-to-measure-clothing → Fit & Garment Guide (1 card grid: Fit Types
only — the "Fit Differences & Sizing Behavior" grid removed, its content
folded into the explanation section below) → "Why sizes don't always line
up" (3 subsections, condensed from 5, brand-variation content merged in) →
ad → FAQ (5 items, schema now text-identical to visible) → ad → 1-sentence
trust card → footer.`

Section count: 12 major sections before → 11 after (one card-grid
removed, two explanation sections merged into one).

## 5. Shoe Hub Before/After Architecture

**Before**: `H1 → lead paragraph (contained "Use the converter below..."
instruction sentence) → converter → Quick Converters (8 cards, 6 of them
literally duplicating what the converter directly above already does) →
reference table (men's only) → 3 bare gender cards (no section heading) →
"How to Measure Your Foot in CM" (prose) → "Crawl hub: internal links" (4
bare H3-only cards, explicitly labeled as a crawl aid in a source
comment) → [outside main] "Why sizes don't line up everywhere" (3-card AEO
block) → FAQ (2 visible questions vs. 5 schema questions, mismatched).`

**After**: `H1 → new human lead (instruction sentence removed — the intro
itself states what to do) → converter → "Men's, Women's & Kids' Shoe
Charts" (3 equal-hierarchy cards, now under a proper heading) → reference
table (retitled "Quick reference chart (men's scale)," repositioned after
the gender cards, kept — it's real 11-row data, not thin content) →
"Explore more size guides" (3 cards: Clothing Converter, Mattress Size
Chart, How to Measure — the redundant Quick-Converters grid and the
self-admitted crawl-hub removed entirely) → "Why sizes don't always line
up" (3-card AEO block, heading renamed, unchanged content — it was already
a good pattern) → FAQ (5 items, schema and visible now identical) → 1-
sentence trust note (new — none existed before) → footer.`

Navigation systems: 3 before (Quick Converters, bare gender cards, crawl
hub) → 2 after (gender cards with a heading, one unified "Explore more"
block) — the redundant Quick Converters grid was removed rather than
merged, since Part 30's target structure has no separate quick-converter
section for this page and Phase 6 specifically flagged it as duplicating
the on-page tool.

---

## 6. Content Changes

**Homepage H1** (§3 of spec): evaluated "Global Size Chart" against the
"is it ambiguous?" test. With the new human intro directly beneath it
explicitly stating the tool converts shoe and clothing sizes across
regions, the H1 is no longer ambiguous in context — **kept unchanged**,
per the instruction not to turn it into an SEO string.

**Homepage intro**: adapted from the user-approved reference copy's tone
(the "size 9 means something different" hook) rather than copied verbatim,
since the reference was shoe-specific and the homepage tool covers both
shoes and clothing:

> *"A 'size 9' can mean something completely different depending on where
> you're shopping — and it's not just shoes. Whether you're eyeing Italian
> boots, Japanese streetwear, or a UK-cut jacket, the numbers rarely line
> up. This tool converts shoe and clothing sizes between US, UK, EU,
> Japan, and China, right down to the centimeter."*

**Shoe hub intro**: same tone reference, adapted for a shoe-only,
higher-intent page:

> *"A 'size 9' can mean a different shoe entirely depending on whether
> you're shopping in the US, UK, EU, or Asia. This chart converts between
> them instantly — pick your gender, region, and size below to see the
> exact match."*

Neither intro contains "Quick answer," "AI answer," "free international
size conversion tool," or a keyword list, per §4/§28.

**"Use the converter below..." instruction sentence** (§6): removed from
the shoe hub's lead entirely — the new intro's own final clause ("pick
your gender, region, and size below") already carries the instruction,
so no fourth layer was added.

**"See also"** (§7): removed from the homepage entirely, not relocated
under the same heading. Its three destinations were evaluated: `CM to US
converter` and `Shoe size converter` are already present as Quick
Converter cards a few hundred pixels below; `Measurement standards`
(`/measurement/`) is already present as the "Measurement Tools" Quick
Converter card. All three destinations remain reachable through the
existing unified Quick Converters block — nothing was lost, nothing was
preserved merely for SEO.

---

## 7. Navigation Consolidation

**Homepage Quick Converters** (§8) — audited all 8 existing cards
individually:

| Card | Decision | Reason |
|---|---|---|
| Shoe Size Converter | KEEP | Genuine shortcut to a fixed converter |
| Clothing Size Converter | KEEP | Genuine shortcut |
| CM to US Shoe Size | KEEP | Fixed-route shortcut — a user who already knows they want this specific conversion shouldn't have to configure the combo form |
| US to EU Size | KEEP | Same reasoning |
| UK to US Size | KEEP | Same reasoning |
| EU to US Size | KEEP | Same reasoning |
| Mattress Size Chart | KEEP | Genuinely different category, not reachable from the primary converter at all |
| Measurement Tools | KEEP | Genuinely different category |

No card was removed. Distinguished from the shoe hub's near-identical
grid: on the homepage, the primary tool is a multi-step combo form
(category → gender → region → size); these 8 cards are legitimate
"I already know what I want" shortcuts. On the shoe hub, 6 of the same 8
cards duplicated a converter that's *already scoped to shoes* and sitting
directly above — that duplication doesn't exist here, so the Phase 6
finding about this exact card grid does not transfer to the homepage
unchanged, and the cards were kept.

**Homepage "Popular Conversions" / "Regional & Conversion Pages"** (§9–11):
verified directly against the live file (`grep -in "popular conversion\|
regional & conversion" index.html shoe-size-conversion-chart/index.html`)
— **neither heading exists on either page**, and no fragmented
three-section pattern matching this phase's description was found on
either target page. Rather than inventing a new "Explore popular size
conversions" section to match an outline that doesn't correspond to
current content (explicitly disallowed by §29/§30's "do not add sections
simply to fill this outline"), no such section was created. The homepage's
existing Quick Converters block already serves the "unified shortcuts"
role these instructions describe; no separate content was found that
needed consolidating into a second block.

**Shoe hub navigation** (§9, §20, §21): this is where the real
fragmentation Phase 6 described actually existed. Three overlapping
systems consolidated to two:
1. Removed the 8-card Quick Converters grid (6 of 8 cards redundant with
   the on-page shoe converter).
2. Gave the 3 bare gender cards a proper heading ("Men's, Women's & Kids'
   Shoe Charts") and verified equal hierarchy (h3 + one descriptive
   sentence + link, each).
3. Removed the "Crawl hub: internal links" block (4 bare H3-only cards,
   self-labeled as crawl-only in a source comment, zero user-facing
   value).
4. Built one new "Explore more size guides" block (3 cards: Clothing
   Converter, Mattress Size Chart, How to Measure Your Feet in CM) from
   the genuinely non-redundant destinations that survived the audit — no
   new URLs invented, each verified to exist.

## 8. FAQ Consolidation

**Homepage**: only ever had one visible FAQ surface (no "Common
questions" duplicate existed here) — the defect was a visible/schema
**answer-text** mismatch on all 5 questions (matching questions, different
wording per answer). Rewrote the schema's 5 answers to match the visible
text exactly. Verified programmatically: 5/5 questions and 5/5 answers now
identical.

**Shoe hub**: had a visible/schema **question-set** mismatch — 2 visible
questions, 5 schema questions, only partial overlap. Built one canonical
5-question set combining the genuinely distinct questions from both
sources (What is EU 42 in US / How to convert to CM / Are UK and US the
same / Why do sizes vary by country / How to measure your foot), rewrote
both the visible FAQ block and the JSON-LD schema from that same set.
Verified: 5/5 questions and 5/5 answers identical between visible and
schema.

Neither FAQ contains a "Quick answer," "Answer:," or "At a glance:"
substitute — normal explanatory copy was used throughout, per §17.

## 9. Card Architecture

No new visual card style was introduced. Every card added or kept reuses
the existing `.card` / `.card-link` / `.grid.grid-3` classes already used
by Quick Converters and the Fit & Garment Guide (the Phase 7 navigation-
card pattern, per §10/§11's instruction to use the existing language). The
shoe hub's new "Men's, Women's & Kids' Shoe Charts" heading + 3-card grid
and "Explore more size guides" heading + 3-card grid both follow this same
markup pattern.

## 10. Ad-Placement Changes

No ad-system change was made (§26 explicitly out of scope for redesign).
Verified programmatically that no `ad-container`/`ad-slot` element falls
between `<h1>` and the converter form's opening tag on either page, both
before and after this phase's edits — the existing ad placements already
satisfied this constraint (the homepage's `ad-top` sits after the hero
section closes, not before it; the shoe hub had no ad inside its hero at
all). No page-specific ad placement mechanism needed adjustment.

---

## 11. Automated Test Results

`node scripts/test-phase-8-homepage-shoehub.js`:

```
39 passed, 0 failed.
```

Covers: single H1, human intro presence, converter presence/position, no
Quick Answer, no Common Questions, exactly one FAQ, FAQ visible/schema
exact match (question count and Q&A content), no standalone "Why Sizes
May Vary," exactly one "why sizes" heading, master footer presence, no
duplicate destinations within any single navigation block, "See also"
fully absent (homepage), gender-card presence/count/equal-hierarchy/no
duplicate destinations (shoe hub), no crawl-hub remnants, no redundant
Quick Converters grid on the shoe hub.

## 12. Browser Results

Real Chrome (`puppeteer-core`) against the local dev server — a pre-deploy
implementation check, consistent with prior phases' methodology.

**45 checks run across both pages, both viewports (1440×900 desktop,
390×844 mobile), plus 5 real converter interactions:**

- Page load, H1, intro, converter visibility without excessive scroll, no
  horizontal overflow, navigation sections present, exactly one FAQ,
  footer present, console errors, failed requests — for homepage and shoe
  hub, at both viewports (32 checks).
- Converter interactions, using dataset-derived size values (never
  invented): homepage combo converter for Men/Shoes/US and Women/Shoes/UK;
  shoe hub converter for Men/US, Women/UK, and Kids/EU (5 checks, all
  produced a non-empty result grid).

**Result: 44 of 45 passed.** The one non-pass (`homepage :: [desktop-1440]
no console errors`) was the same pre-existing, site-wide `favicon.ico` 404
already documented in the Phase 7 report — confirmed unrelated to this
phase's changes (no `favicon.ico` file exists anywhere in the repository,
and the corresponding `no failed network requests` check on the same
page/viewport combination passed, since that check explicitly excludes
the favicon request). Not a Phase 8 regression.

**Transparency note**: an initial version of the browser-test harness had
a variable temporal-dead-zone bug (`consoleErrors`/`failedRequests`
referenced inside a callback before the destructuring assignment that
defined them completed) that would have crashed before collecting most
results. Caught on the first run (the script threw before finishing, not
silently), fixed by passing the two arrays into the callback directly,
then re-run to produce the genuine 44/45 result reported above.

## 13. Link-Validator Result

```
Missing targets: 47 (threshold: 10)
```

Unchanged from the stable pre-existing baseline. No new broken link was
introduced by the navigation consolidation — every retained destination
was verified to exist before being written, and every removed destination
(the Quick Converters grid and crawl-hub links on the shoe hub) remains
reachable elsewhere on the site (footer, homepage, header nav), so no
sitemap-visible page became orphaned by this change alone.

## 14. Footer Result

```
npm run footer:check
Checked 1151 HTML files (skipped 1 without <body>). OK: all footers match master.
```

Additionally verified directly: the MD5 hash of both pages' `<footer>`
inner HTML is byte-identical to the master footer's hash (cross-checked
against a known-good Phase 7 brand page) — the footer was not modified.

## 15. Schema Result

FAQPage JSON-LD verified programmatically for both pages: visible
question count equals schema question count (5 and 5 for both pages), and
every question/answer pair is textually identical between the visible DOM
and the schema script tag. No schema-only or visible-only question remains
on either page.

## 16. Diff-Scope Verification

```
git status --short
 M index.html
 M shoe-size-conversion-chart/index.html
?? reports/phase-8-after.json
?? reports/phase-8-before.json
?? scripts/test-phase-8-homepage-shoehub.js
```

Exactly the two target pages + the Phase 8 test script + the two required
inventory reports (the implementation report itself, once written, adds a
sixth). No `app.js`, no datasets, no clothing routes, no `brands/*.html`,
no `measurement/*.html`, no mattress pages, no regional-hub files, no
sitemap files, no `_redirects`, no footer files. **Confirmed clean.**

## 17. Known Limitations

- **The literal "Popular conversions" / "Popular Shoe Size Conversions" /
  "Regional & Conversion Pages" fragmentation described in §9–11 was not
  found on either target page** — verified by direct grep before
  concluding this. This phase's instructions may have been describing a
  pattern present on a different page family (several `shoe-size-pages`-
  style hub pages elsewhere on the site do carry headings closer to this
  description) rather than these two specific files. No section was
  invented to match the described-but-absent pattern, per the explicit
  "do not add sections simply to fill this outline" instruction. Flagged
  for the Project Director's awareness rather than silently working around
  it.
- **Homepage's how-to-measure content (shoes + clothing) was left
  substantively unchanged** — Phase 6 identified this content as
  genuinely useful, and nothing in this phase's scope asked for its
  removal; only ad-placement and structural-boundary checks were applied
  to it.
- **Browser testing covered both pages at both viewports plus 5 real
  conversion interactions** — this is full coverage of the two in-scope
  pages (not a sample, unlike Phase 7's 20-page population), so no
  sampling caveat applies here.
- **The reference table on the shoe hub was kept, not made gender-aware**
  — Phase 6 offered both options ("KEEP but relabel" or "make gender-
  aware"); the simpler relabeling (retitled to clarify it's a men's-scale
  quick reference, repositioned after the gender cards which already
  cover the full-gender need) was chosen as the minimal change that
  resolves the redundancy-with-the-tool concern without touching the
  converter or table-generation logic.

---

## 18. Final Gate

| Hard-stop condition | Status |
|---|---|
| Converter logic changed | **No** — `app.js` untouched |
| Datasets changed | **No** |
| Clothing routes changed | **No** |
| Brand pages changed unexpectedly | **No** — `brands/` untouched |
| Mobile converter not immediately visible | **No** — verified visible without excessive scroll at 390px on both pages |
| Quick Answer remains | **No** — 0 on both pages |
| Duplicate FAQ remains | **No** — exactly one FAQ per page |
| Visible/schema FAQ mismatch | **No** — 5/5 exact match on both pages |
| Navigation remains fragmented | **No** — shoe hub consolidated from 3 systems to 2 (gender cards + one unified block); homepage's single Quick Converters block confirmed not fragmented |
| Duplicate navigation destinations remain | **No** — verified per-block, zero duplicates |
| Broken links introduced | **No** — link validator unchanged at 47 |
| Converter browser test fails | **No** — 5/5 real conversion interactions succeeded |
| Footer changes | **No** — hash-verified identical to master |
| Unexpected page families changed | **No** — diff scope confirmed exactly the two target pages + Phase 8 artifacts |
| Ads interrupt the primary tool sequence | **No** — verified no ad between H1 and converter on either page |
| Generated output changed outside approved scope | **No** |

**No hard-stop condition was triggered.**

---

# PHASE 8 — PASS

Both the homepage and the shoe conversion hub now present H1 → human
introduction → converter as one uninterrupted sequence, with no ad,
navigation, or "See also" between them. Redundant navigation systems on
the shoe hub (Quick Converters duplicating the on-page tool, a
self-admitted crawl-hub block) were removed rather than relabeled;
duplicate "why sizes" explanations were merged into one heading per page;
FAQ visible/schema mismatches on both pages were resolved with a single
canonical data source. `app.js`, datasets, clothing routes, brand pages,
and the master footer are unmodified.

One limitation is disclosed rather than smoothed over: the specific
"Popular Conversions" fragmentation this phase's brief described was not
found on either target page, and no section was fabricated to match it.

Not committed or pushed yet — proceeding to the git discipline sequence
next, per §40.
