# Phase 6 — User-Centered UX + Content Architecture Audit

**Mode: READ-ONLY.** No source, generated HTML, data, template, generator,
schema, sitemap, navigation, footer, redirect, or Cloudflare file was
modified. The only repository change is this report.

**Baseline:** `HEAD` = `origin/main` = `c9fb34d81dc681581fc615b523c48b88de803a12`,
working tree clean at the start of this phase, unchanged by it.

---

## 1. Executive Summary

The site's *conversion engine* (certified through Phase 5F-H) is solid.
The site's *content architecture* is not — and the gap is systemic, not
scattered. A handful of shared generator/injector scripts
(`scripts/generate-programmatic-pages.js`, `scripts/ai-answer-injector.js`,
`scripts/inject-aeo-layer.js`, `scripts/fix-ai-layout.js`,
`scripts/revenue-engine.js`) stamp the same handful of problems across
**most of the site's ~1,240 generated pages** (756 programmatic-pages, 120
measurement, 125 clothing, 20 brands, plus the hand-authored homepage and
~57 root-level guide pages). Fixing the shared templates fixes the
population; almost nothing here requires touching pages one at a time.

Concretely, evidence gathered directly from the live repository (not
inferred) confirms nearly every pattern the brief described, often more
severely than described:

- **"Quick answer:" with no visible question**, verbatim, on all 20 brand
  pages and a smaller root-level set (121 files total contain the string).
- **Two independently-authored FAQ surfaces on the same page**, with
  *different questions*, on brand pages: an `.ai-faq-block` "Common
  questions" block and a separate `.aeo-ai-layer` "Frequently Asked
  Questions" block — 1,003 files contain "Frequently Asked Questions"
  and 107 additionally contain "Common questions" (all 20 brand pages
  have both).
- **A FAQ schema/visible-content mismatch** on `/shoe-size-conversion-chart/`:
  the `FAQPage` JSON-LD declares 5 questions; the visible FAQ block on the
  same page shows only 2, and they don't fully match in wording.
- **The homepage duplicates its own meta description as visible body
  copy**, then repeats the "why sizes differ" explanation twice more
  (a fit-guide card and a full `<h2>` section) before the FAQ.
- **"See also" sits above the fold, before the tool**, on the homepage,
  linking to two things the converter directly below it already does.
- **Six stacked navigation/link-dump sections on one brand page** (a
  4-card "Fit and sizing explained" grid, a "conversion-loop", a
  "next-step" block, a "session-depth" block, and a ~30-link flat
  "Related links" list) with the same 5–6 brand links repeated across
  four of the six.
- **Duplicated monetization copy**: near-identical "Sizing Insights" /
  "Fit Considerations" text appears twice on the Nike brand page, once
  styled as `.monetization-module` and once as `.commercial-module`.
- **A "Why Sizes May Vary" section with a single throwaway sentence**,
  exactly the pattern flagged in the brief, on brand pages.

None of this reflects badly on the underlying converter — it reflects an
AEO/programmatic-SEO content system that was built in phases (visible in
the many overlapping generator/injector scripts) without a governing
content hierarchy. Phase 7 onward has a clear, mostly-systemic fix surface.

---

## 2. Current Site Inventory

Built from an actual repository listing, not assumed from prior reports.

| Family | Count | Source |
|---|---|---|
| `programmatic-pages/*.html` | 765 (incl. `ai-generated/` subdir) | `scripts/generate-programmatic-pages.js` + AEO/AI injector passes |
| `measurement/*.html` | 120 | same generator family |
| `clothing/*.html` | 125 | `scripts/generate-phase10-pages.js` + `generate-programmatic-pages.js` (certified through Phase 5F) |
| `brands/*.html` | 20 | `scripts/generate-programmatic-pages.js` + injector passes |
| Regional hubs `us/ uk/ eu/ ca/` | 3 pages each (12 total) | hand-authored/templated, Phase 14A |
| `legal/*.html` | 9 | hand-authored |
| `tools/` (`measurement-assistant.html`, `fit-assistant.html`, `home/mattress-size-chart.html`, `home/duvet-size-guide.html`) | 4 | hand-authored |
| `semantic/*.html` | 6 | explainer articles (how sizing systems work, per-region) |
| `printable/*.html` | 5 | printable reference sheets |
| Root-level guide/article pages (`.html` at repo root — brand comparisons, "how to measure," "why sizes vary," etc.) | 57 | hand-authored, Phase 6–19-era content |
| Pretty-URL directories at root (`shoe-size-conversion-chart/`, `eu-to-us-shoe-size/`, `mens-shoe-size-chart/`, etc.) | ~15 directories | mix of hand-authored and generated |
| Homepage (`index.html`) | 1 | hand-authored |
| Sitemap/index surfaces (`sitemap/`, `ai/`, `guides/`, `knowledge/`) | small | generated indexes |

**Common patterns observed across families** (detail in §4–§9): converter
presence is inconsistent (homepage, shoe-size-conversion-chart, regional
hubs, clothing pages, and dedicated converters have a live tool; brand
pages and most root-level guide pages do **not** — they defer to "our
generic converters linked at the bottom"); FAQ presence is near-universal
(1,003 of ~1,240 generated pages); "Quick answer" and "Common questions"
are brand-page-and-narrower phenomena; every sampled page shares one
master footer (confirmed identical across homepage, shoe-size-conversion-
chart, a brand page, a measurement page, a clothing page, and a legal
page — six independent samples, byte-identical footer markup in all six).

---

## 3. User Intent Analysis

| Family | Who | Searched for | Wants first | Needs before tool | Can wait | Currently distracting |
|---|---|---|---|---|---|---|
| Homepage | Broad/navigational arrival | "size converter" or brand name | Understand what the site does, then convert | Nothing — should be able to convert immediately | Everything below the tool | "See also" links appear *before* the tool; meta-description-as-body-copy adds a sentence before the user reaches the form |
| Shoe conversion chart | "shoe size chart," "size 9 in EU," etc. | Convert their specific size, or scan a table if unsure of exact size | Convert immediately | Nothing | Full reference table (partial, men's only), gender hub cards, FAQ | "Quick Converters" card grid duplicates the tool already on screen |
| Clothing landing pages (post-5F) | Arrived via a specific size search ("men's pants EU 42 to US") | Confirm their specific conversion | The pre-filled conversion itself | Nothing — deep-link already carries their intent | Explanatory content | Minimal — these are lean, task-focused pages (verified in Phase 5F cert) |
| Measurement pages | "24cm to US shoe size" | The one specific conversion | The answer to their specific query | Nothing | Everything else on the page | Six-plus stacked navigation blocks after a one-answer query |
| Brand pages | "Nike size chart," "does Nike run small" | Fit guidance for that brand + a conversion | Fit tendency + a way to convert *their* size | Nothing conceptually, but there is **no tool on the page** | Brand-comparison links, monetization asides | No converter at all; "Quick answer" that isn't an answer to anything the user asked; duplicate FAQs |
| Mattress page | "mattress size chart," "UK king vs US king" | Compare or convert their mattress size | The tool or a clear table | Nothing | Explanation of why sizes differ globally | Two similar-sounding H2s before the tool ("Convert your mattress size internationally" / "Find equivalent mattress sizes worldwide") |
| Root-level guide articles | "why do shoe sizes vary by brand," "how to measure feet" | An answer to that specific question | The answer, fast | Nothing | Everything else | Not sampled exhaustively this phase — flagged for Phase 7 scoping, not assumed |

The throughline: **every family's user wants the tool or the specific
answer first.** The current architecture instead frontloads SEO-authored
paragraphs, duplicate "why sizes vary" framing, and large link-dump
sections before or immediately after the thing the user came for.

---

## 4. Above-the-Fold Findings

| Family | 3-second clarity | Tool visible/usable immediately | Title competes with tool | Intro delays utility | Ads interfere |
|---|---|---|---|---|---|
| Homepage | Yes — H1 + lead + tool are all in the first viewport | Yes | No | Minor — one duplicate-of-meta-description sentence, then a 3-link "See also" block, before the form | No (ad-top sits *after* the hero section, not before it — despite the misleading class name) |
| Shoe conversion chart | Yes | Yes — tool is first, gender+region+size only (no category selector needed, pre-set via hidden input) | No | No — lead paragraph is short and genuinely orienting ("A 'size 9' can mean different things...") | No |
| Brand pages | **No** — H1, then an unlabeled "Quick answer" restating the meta description, then an ad slot, then the *same sentence again* | **No tool present on the page at all** | N/A (no tool to compete with) | **Yes, materially** — two redundant paragraphs before any real content | **Yes** — `ad-top` sits directly after the quick-answer block, before the first substantive section |
| Mattress page | Partial — two similarly-worded H2s appear before the tool is reached | Yes, tool exists | No | Minor | Not assessed in this pass (not opened in full; flagged for Phase 7) |
| Measurement pages | Not applicable in the same way — these pages answer one specific query rather than hosting a general tool | N/A (no general tool; the specific answer is the "tool") | No | Depends on exact template, not fully sampled | Not assessed |

**Concrete answer to the brief's question** ("Can a new user understand
what this page does within 3 seconds?"): **yes for the homepage, shoe
conversion chart, and clothing landing pages; no for brand pages**, which
open with two redundant paragraphs and no interactive element before the
user has to scroll past an ad and a static 5-row table.

---

## 5. Title + Introduction Audit

**Robotic wording, confirmed verbatim:**

- Homepage meta description: *"Convert shoe and clothing sizes between US,
  UK, EU, Japan, China, and CM measurements. Free international size
  conversion tool with accurate charts."* This exact sentence is **also**
  the homepage's visible lead paragraph — the meta description was copied
  directly into the page body.
- Brand pages: the meta description is echoed **twice more** as visible
  copy (once in the "Quick answer" block, once as the first real
  paragraph) — three copies of the same sentence on one page.

**Introductions that say the same thing as later sections:** the homepage's
lead paragraph, the "Quick Converters" card descriptions, and the FAQ's
first answer all restate "converts sizes between US/UK/EU/JP/CN/CM" in
slightly different words.

**Recommended standardized hierarchy** (derived from what already works
best in the sample — the shoe-size-conversion-chart page's lead paragraph,
which orients the user in one sentence without repeating the meta
description verbatim):

- **Tool-first families** (homepage, dedicated converters, shoe/clothing
  conversion chart, regional hubs, clothing landing pages, mattress page):
  `H1 → one human-written orienting sentence (never the meta description
  verbatim) → tool → optional one-line result context`.
- **No-tool explainer families** (brand pages, root-level guide articles,
  semantic explainers): `H1 → one human-written orienting sentence → the
  actual content the user searched for (fit tendency, explanation,
  comparison) → a clearly-labeled converter CTA, not a deferred
  afterthought`.

The meta description and the visible intro should never be the same
string — this is a single, systemic fix (the intro-generation step in
`scripts/generate-programmatic-pages.js` and/or the injector that writes
the "Quick answer" block).

---

## 6. Quick Answer Audit

121 files contain "Quick answer" (case-insensitive), concentrated in
`brands/` (20/20 — every brand page), `programmatic-pages/ai-generated/`
(9), a `semantic`-adjacent set (6), `printable/` (5), and a scattering of
root-level guide pages (each ~1). Produced by `scripts/ai-answer-injector.js`.

| Location | Question visible? | Duplicates another section? | Adds value? | Classification |
|---|---|---|---|---|
| Brand pages (20/20) | **No** — "Quick answer:" is immediately followed by a restated meta description, never a question | **Yes** — identical sentence appears again as the page's first real paragraph | No | **REMOVE** (or, if the injector is kept for AEO reasons, it must be rewritten to actually answer a stated question — see below) |
| `programmatic-pages/ai-generated/*` (9) | Not sampled individually this phase; same injector, presumed same pattern | Likely, same injector | Uncertain | **REWRITE** — verify against the "visible question" rule per §Part 5's instruction before deciding REMOVE vs REWRITE |
| Root-level guide pages (scattered, 1 each) | Not sampled individually | — | — | **Not assessed this phase — flag for Phase 7 spot-check** |

**Governing rule for Phase 7**: a "Quick answer" block must not exist
without an immediately-preceding, visibly-rendered question (e.g., an H2
phrased as a question, or the H1 itself framed as a question). Where the
page's actual H1 already functions as the implicit question (e.g., "Nike
Shoe Size Guide & Conversion" does not — it's a title, not a question),
either rewrite the H1/subhead into a real question or drop the label and
fold the sentence into normal orienting copy per §5.

---

## 7. FAQ Audit

| Signal | Count | Where |
|---|---|---|
| "Frequently Asked Questions" (any case) | 1,003 files | 756 programmatic-pages, 119 measurement, 20 brands, 9 legal, 6 semantic, 5 printable, 12 regional (3 each × 4), + scattered root pages |
| "Common questions" | 107 files | 20 brands, 6 semantic, 5 printable, 2 tools, ~74 scattered root/guide pages |
| `FAQPage` schema blocks | 1,021 files | roughly tracks "Frequently Asked Questions" plus a handful of schema-only pages |

**Confirmed duplicate FAQ surfaces on the same page** (brand pages, and by
generator inference likely `semantic/` and `printable/` too, not
individually re-verified this phase): an `.ai-faq-block`
(`aria-label="Common questions"`, produced by `scripts/fix-ai-layout.js`
or `scripts/refactor-conversion-page-model.js`) with **different
questions** than the `.aeo-ai-layer`'s `.faq-block`
(`Frequently Asked Questions`, produced by `scripts/inject-aeo-layer.js`).
On the Nike page these are genuinely different Q&A sets — not a
copy-paste duplicate, which is arguably worse: it signals two separate
injector passes ran independently without awareness of each other.

**Schema/visible mismatch, confirmed on `/shoe-size-conversion-chart/`**:
the page's `FAQPage` JSON-LD lists 5 questions ("What is EU 42 in US shoe
size?", "How do I convert US shoe size to CM?", "Are UK and US shoe sizes
the same?", "Why do shoe sizes vary by country?", "How do I measure my
foot in cm?"); the visible `.faq-block` shows only 2 ("What is EU 42 in US
shoe size?", "Are EU and US shoe sizes the same?") — 3 schema questions
have no visible counterpart, and one visible question's wording doesn't
match any schema entry exactly. This is a real structured-data hygiene
problem independent of the UX question, worth flagging to whoever owns
schema/SEO validity even though it's outside this UX audit's primary lens.

**Recommendation: ONE FAQ surface per page.**

- **Where FAQ belongs**: pages answering a general question (homepage,
  shoe/clothing conversion chart, regional hubs, brand pages, guide
  articles). It does **not** belong, or belongs in a minimal 1–2 item form,
  on single-intent deep-link pages (clothing landing pages, measurement
  pages) where the page already *is* the answer — a full FAQ block is
  redundant with the page's own H1+result.
- **How many questions**: 3–5, genuinely distinct, no cross-page copy-paste
  of the same generic 2–3 questions ("Why do sizes differ between
  countries?" currently appears near-verbatim across dozens of unrelated
  pages' FAQ blocks — homepage, shoe-size-conversion-chart, and the Nike
  brand page all ask a version of this same question).
- **Schema must match visible content 1:1** — this is a mechanical
  generator fix, not a content-writing task.

---

## 8. Explanation Content Audit

| Section pattern | Where found | Classification | Why |
|---|---|---|---|
| Homepage "Why Sizes Differ Between US, EU, UK & Asia" (full `<h2>`, 5 subsections) | Homepage only | **KEEP AS PROSE, but de-duplicate** | Genuinely substantive (historical systems, manufacturing standards, vanity sizing, cultural preferences, metric/imperial) — this is real content, not filler. But it overlaps heavily with the homepage's own "Why Sizes Vary by Brand" card (inside Fit & Garment Guide) covering the same "brands use different fit models" point twice on one page. |
| Homepage "Why Sizes Vary by Brand" (one card inside Fit & Garment Guide grid) | Homepage | **MERGE** into the fuller "Why Sizes Differ" section, or **REMOVE** the card and let the fuller section be the single source | Redundant with the above |
| "Why Sizes May Vary" (single-sentence `<h2>` section) | Brand pages (confirmed on Nike; injector-produced, `scripts/inject-aeo-layer.js`) | **REMOVE or MERGE** | Exactly the brief's flagged pattern — one throwaway sentence in a full-width section, and the same brand page *already* has a "Why Sizes Vary" card in the "Fit and sizing explained" 4-card grid a few hundred lines earlier covering the same ground with more specificity |
| Shoe conversion chart "Why sizes don't line up everywhere" (3-card AEO block) | Shoe conversion chart (and likely other AEO-layer pages, injector-produced) | **CARDIFY — already appropriately cardified** | Three genuinely distinct conceptual units (different scales / brand lasts / use centimeters) in a 3-card grid — this is the pattern working correctly, unlike the single-sentence version above |
| Fit & Garment Guide (Slim/Regular/Oversized) | Homepage | **KEEP AS CARDS** | Three distinct conceptual units with icons, already well-structured — a genuine positive example, not a problem |
| "Fit and sizing explained" 4-card grid (brand pages) | Brand pages | **REWRITE** | The cards themselves are a reasonable structure, but the "Regional Differences" card's snippet text is keyword-stuffed run-on prose ("Why European and US shoe sizes use different scales. Regional differences and conversion explained. How Japanese shoe sizing works... Japan size chart explained. How UK shoe sizes differ... Conversion and regional comparison guide.") — six sentence fragments strung together, clearly AEO-keyword-optimized rather than written for a human |
| Monetization/commercial module pairs ("Sizing Insights," "Fit Considerations") | Brand pages, appearing as both `.monetization-module` and `.commercial-module` with overlapping text | **REMOVE duplicate, KEEP one as prose** | Two independently-authored near-duplicates of the same "check the brand's size chart, size up if unsure" advice — genuinely useful advice, badly duplicated |

**General rule confirmed by this sample**: cardify only when a section
has genuinely distinct conceptual units (Fit & Garment Guide, "Why sizes
don't line up everywhere" 3-card block — both good). Do not cardify a
single sentence; remove or merge it instead ("Why Sizes May Vary").

---

## 9. Navigation / Card System Audit

Inventory of every distinct link-block *pattern* found (not every
instance — the population is large; patterns are what matter for a
systemic fix):

| Pattern | Purpose (as observed) | Genuinely useful? | Duplicates |
|---|---|---|---|
| **Quick Converters** (8-card grid: shoe/clothing/CM-to-US/US-to-EU/UK-to-US/EU-to-US/mattress/measurement) | Appears identically on homepage, shoe-size-conversion-chart, and (by pattern) likely other tool-hub pages | **Partially.** The first 6 cards are literally the *same single converter component* with a different default region pre-selected — a user on the shoe-size-conversion-chart page, which already has that exact converter live on screen, is shown 6 cards that duplicate what's 200px above them. Mattress and Measurement cards are genuinely different tools and belong. | The tool already on the page (for 6 of 8 cards) |
| **"Fit and sizing explained" / "conversion-loop" / "next-step" / "session-depth"** (4 distinct stacked sections on brand pages) | Crawl-discovery / internal linking, per the code's own module names (`data-module="session-depth"`, `data-conversion-loop="true"`) | **Mixed.** "Next region" and "Brand comparison" links are plausibly useful for a shopper. "People Also Convert" and "Same Brand — Different Region" in the session-depth block repeat the *same six brand links* already shown in "Brand Differences" (fit-and-sizing card) and "next-step"'s "Brand comparison" block — three separate presentations of an identical link set. | Each other, extensively |
| **"Related links (same brand, hub, tools, guides)"** (flat ~30-link list, brand pages) | Crawl discovery, explicitly | **No, for a human.** A 30-item flat `<ul>` at the bottom of a brand page, containing links already shown 2–4 times earlier in "conversion-loop"/"next-step"/"session-depth" | Nearly everything above it on the same page |
| **Gender hub cards** (Men's/Women's/Kids' — shoe-size-conversion-chart) | Navigation to gender-specific charts | Yes | None observed |
| **"Crawl hub: internal links"** (US/UK/EU sizing + "All size pages," bare H3-only cards, explicitly labeled in source as a crawl hub) | Self-admitted crawler discovery aid | **No, for a human** — three cards with a heading and nothing else, no description, no reason for a user to click | Regional hub links already in the header/footer nav |

**Recommended unified card language** (three categories, matching the
brief's suggestion and validated against what already works well in the
sample):

1. **PRIMARY TOOL CARD** — the live converter itself. One per page, always
   above the fold where the family is tool-first.
2. **NAVIGATION CARD** — a card whose entire purpose is "go to a different,
   genuinely distinct page" (Men's/Women's/Kids' hub cards are the good
   example). Requires a real description, not a bare heading.
3. **INFORMATION CARD** — a card presenting a distinct conceptual unit of
   explanatory content (Fit & Garment Guide's Slim/Regular/Oversized, and
   "Why sizes don't line up everywhere"'s 3-card block, are the working
   examples).

Everything currently built as "conversion-loop" / "next-step" /
"session-depth" / "Related links" / "crawl hub" should collapse into **at
most one NAVIGATION CARD block per page**, deduplicated against whatever
links the master footer already provides (see §11) — not four to six
separate stacked sections repeating the same five brand names.

---

## 10. "See Also" Audit

Only 5 files contain the literal string "See also" — far less pervasive
than other patterns, but the one confirmed instance is high-impact: it's
on the **homepage**, positioned **between the H1/lead and the converter
form**, i.e., above the fold and before the tool:

> *"See also: [CM to US converter](/cm-to-us-shoe-size.html) ·
> [Shoe size converter](/shoe-size-converter.html) ·
> [Measurement standards](/measurement/)"*

Two of the three links (CM-to-US, shoe size converter) are **the exact
same converter** the user is about to see directly below, just with a
different default region — not a "next step," a premature duplicate.

**Recommendation**: remove "See also" from its current above-the-fold
homepage position entirely. If a lightweight cross-reference is wanted, it
belongs *after* the user has completed the primary task (post-conversion),
framed as "Next steps" per the brief's own suggested reframing, and it
should link to something genuinely different from the tool just used —
not a same-tool-different-default variant.

---

## 11. Data Source / Trust Audit

The trust statement quoted in the brief —
*"GlobalSizeChart.com is an independent utility for size conversion. Our
content is educational and our sizing data is compiled from public
standards."* — is real, confirmed on the homepage as a standalone
`<section class="card">` immediately above the footer, followed by three
more bullet-style trust statements ("Independent Utility Tool," "No brand
affiliation," "Educational content," "Sizing data compiled from public
standards" — the last one nearly repeating the opening sentence).

**This is then repeated a second time, immediately after, inside the
footer itself**: "How We Ensure Accuracy" (4 bullets + one sentence) and
"Data sources" (3 bullets), as two side-by-side sections in a
`footer-info-row`. So trust/methodology content appears in **two adjacent
blocks** — a pre-footer card and a footer sub-section — covering
overlapping ground (both assert independence/no-affiliation/methodology)
within roughly 100 lines of markup on every page.

**Recommendation**: consolidate into one place. Given the footer already
carries "How We Ensure Accuracy" and "Data sources" as its own labeled
sections, the pre-footer trust card is the redundant one — fold its
non-duplicate content (the explicit "independent, no brand affiliation"
framing, which the footer doesn't currently state as directly) into the
footer's existing sections rather than keeping a separate card
immediately above. This does not weaken factual transparency — it removes
the *repetition*, not the *content*.

---

## 12. Footer Audit

Confirmed via six independent, byte-identical samples (homepage, shoe
conversion chart, a brand page, a measurement page, a clothing page, a
legal page): **every sampled page family uses the same master footer**,
consistent with the "homepage footer is now canonical" premise. Not
modified in this phase, per instruction.

- **Does content above the footer make it feel repetitive?** Yes, on
  every page — the footer's "Hubs" section (10 links) substantially
  overlaps the header's primary+secondary nav (also present on every
  page) and, on brand/measurement pages, the "Related links" /
  "session-depth" blocks immediately above it. By the time a user reaches
  the footer, they've typically seen most of its links at least once
  already.
- **Should trust/data-source content precede it?** Per §11, the current
  pre-footer trust card is redundant with the footer's own sections —
  recommend removing the duplicate rather than adding more before the
  footer.
- **Footer overload?** The footer itself (4 columns + 2 accuracy/sources
  sections + ownership block + copyright) is reasonably organized and not
  the primary offender — the problem is what precedes it, not the footer's
  own structure.

---

## 13. Ads / Monetization UX Audit

Ad-zone counts per sampled page (via `ad-container`/`ad-slot` markers):
homepage 5 zones (top, after-tool, mid-content, before-faq, bottom, plus a
sticky-mobile unit = 6 total), brand/measurement/clothing pages ~3 zones
each (top, one or two inline, bottom, plus sticky-mobile).

| Position | Family | Assessment |
|---|---|---|
| Homepage `ad-top` | Homepage | **Safe** — despite the class name, it renders *after* the hero-tool section closes, not before it; does not block the converter |
| Homepage `ad-after-tool` | Homepage | **Safe** — sits between the tool and "Quick Converters," a natural break |
| Homepage `ad-mid-content` | Homepage | **Borderline** — embedded mid-paragraph inside the "How to Measure Shoe Size" how-to list; interrupts a step-by-step guide the user may be actively following |
| Brand page `ad-top` | Brand pages | **Dangerous** — sits directly after the "Quick answer" block and before the page's first substantive paragraph, i.e., in the exact spot where (per §4) the page is already failing the 3-second-clarity test; an ad here compounds a page that already has no visible tool |
| Brand page `ad-inline` (×2) | Brand pages | **Borderline** — one sits between the 4-card "Fit and sizing explained" grid and the "Generic converters" list; reasonable if the surrounding content is substantive, but on a page this link-dense it risks visually blending with the many card/link blocks around it |
| Sticky mobile ad | All families | **Needs explicit non-overlap verification against the converter's mobile layout** — not independently re-tested this phase (Phase 5F-H's mobile checks confirmed no *layout* overflow, but did not specifically evaluate ad-vs-tool visual proximity on brand pages, which weren't in that certification's sample) |

**No instance found in this sample of an ad being visually styled to
resemble a converter, card, or CTA** — a genuine positive finding, worth
preserving as a hard constraint in Phase 7+.

**Recommendation ordering, per the brief's stated priority** (tool
visibility > first interaction > result visibility > readability > page
completion > secondary exploration > advertising): brand pages are the
one family where this priority order is currently inverted — an ad and
duplicate text appear before any real content, on a page family that has
no tool at all. Fixing the "no converter on brand pages" gap (§Part 2,
§6) would also fix the worst ad-placement problem, since it gives the
page a legitimate first element to place *before* the ad.

---

## 14. Mobile UX Audit

Phase 5F-H's certification (78 mobile/desktop viewport checks, ≥390px)
confirms **no horizontal overflow, no clipped controls, footer renders
correctly** across its sampled families (homepage, both dedicated
converters, one regional hub, 10 programmatic-pages, 10 measurement, 10
clothing, 5 brand pages) — that evidence is reused here, not
re-verified, since it's current and directly relevant.

What Phase 5F-H's certification did **not** evaluate (out of its scope,
in scope for Phase 6/7 planning): **content density and stacking order**
on mobile for the long, multi-section pages this audit found (brand pages
with 6+ stacked navigation sections; the homepage's ~5 major content
sections). On a 390px viewport, a brand page's current structure would
require scrolling past: H1 → quick-answer (2 paragraphs) → ad → 3 prose
sections → table → 4-card grid → ad → generic-converters list → warnings
→ ad → 3 monetization asides → conversion-loop → next-step (3 blocks) →
session-depth (4 blocks) → ad → 30-link related-links list → sticky-ad →
common-questions FAQ → why-sizes-vary → FAQ (again) → footer. That is a
**very long single-column scroll** with no tool anywhere in it — the
mobile-specific risk isn't overflow (already certified clean), it's
scroll fatigue and never reaching a way to act on the page's own topic.

**Recommendation**: any Phase 7 restructuring of the brand-page template
should be evaluated primarily on mobile, since that's where the current
section count is most punishing.

---

## 15. Content Tone Audit

Evidence-based tone assessment, citing exact strings found:

| Pattern | Example (verbatim) | Assessment |
|---|---|---|
| Robotic/keyword-listy | "Convert shoe and clothing sizes between US, UK, EU, Japan, China, and CM measurements. Free international size conversion tool with accurate charts." | Reads as a meta-description template, not human copy — confirmed to literally *be* the meta description reused as body text |
| Keyword-stuffed run-on | "Why European and US shoe sizes use different scales. Regional differences and conversion explained. How Japanese shoe sizing works and how to convert to US, EU, and UK. Japan size chart explained. How UK shoe sizes differ from US and EU. Conversion and regional comparison guide." (brand page "Regional Differences" card) | Six unrelated sentence fragments concatenated — no human editor would write this as one paragraph; it reads as keyword-target concatenation |
| Excessive "free" repetition | Homepage title ("Free International Size Converter"), homepage meta description ("Free international size conversion tool"), homepage OG description | "Free" appears 3 times across title+meta+OG for one page — not egregious alone, but part of a broader pattern of restating the same 1–2 selling points in every metadata field |
| Redundant explanation across sections | "Why do sizes differ between countries?" (or a close variant) appears as its own FAQ answer on the homepage, on the shoe conversion chart, and on the Nike brand page, each independently authored | Same question, same rough answer, reinvented per page rather than a single well-written canonical answer referenced/linked where relevant |
| Genuinely good, human-toned copy (positive finding) | Shoe conversion chart lead: *"Finding the right shoe size across countries can be confusing. A 'size 9' can mean different things in the US, UK, EU, or Asia. Use the converter below to get your exact size instantly, or scroll to explore full charts and regional guides."* | This is the tone the rest of the site should match — plain, oriented toward the user's actual confusion, tells them what to do next |

**Desired-direction alignment**: the shoe-size-conversion-chart lead
paragraph and the Fit & Garment Guide cards are the two clearest existing
examples of "human, clear, confident, helpful, concise" tone already
present in the codebase — Phase 8 (content/tone system) should use these
as the internal reference standard rather than inventing a voice from
scratch.

---

## 16. Homepage Architecture

Current order (confirmed from full read of `index.html`): `H1 → lead
paragraph (= meta description) → "See also" (3 links) → converter → ad →
Quick Converters (8 cards) → ad → "How to Measure Shoe Size" (long
how-to) → ad (mid-content) → "How to Measure Clothing Size" (long how-to)
→ Fit & Garment Guide (2 card grids) → "Why Sizes Differ..." (5
subsections) → ad → FAQ (5 items) → ad → trust card → footer (with its
own accuracy/sources sections)`.

**Problems, in priority order:**

1. "See also" before the tool (§10) — P1, easy systemic fix (move/remove).
2. Meta-description-as-lead-paragraph (§5) — P2, needs a human-written
   replacement sentence.
3. Quick Converters' 6-of-8 cards duplicating the tool just used (§9) —
   P2, needs either removal of the redundant 6 or repositioning as
   "explore specific conversions" framed differently from "use this tool."
4. Two "why sizes vary" treatments on one page (§8) — P2, merge.
5. Trust content in two adjacent blocks (§11) — P3, consolidate.

**What's already right and should not be touched carelessly**: the
converter itself, the Fit & Garment Guide's card structure, the FAQ's
question set (reasonable, not duplicated elsewhere on this specific page),
and the master footer.

**Ideal hierarchy** (derived, not the brief's example verbatim):
`H1 → one short human sentence (not the meta description) → converter →
optional immediate result context → Quick Converters, trimmed to
genuinely distinct tools only (mattress, measurement, and 1–2 direct
converters, not 6 variants of the same one) → How-to-measure content
(kept, it's genuinely useful, but consider whether both shoe AND clothing
how-to belong on the homepage itself vs. linked out) → ONE "why sizes
vary" section → FAQ → single trust/data-source section → footer.`

---

## 17. Shoe Architecture

Audited `/shoe-size-conversion-chart/` directly (full read).

| Element | Keep / Merge / Remove |
|---|---|
| H1 "International Shoe Size Conversion Chart" + lead | **KEEP** — good example of tone (§15) |
| "Quick Converters" 8-card grid | **TRIM** — same 6-of-8-redundant-with-tool problem as homepage (§9), directly beneath a converter that already does what 6 of the 8 cards claim to offer |
| Reference table (men's only, 11 rows) | **KEEP, but relabel** — currently captioned "Use the converter above for women's and kids'," which is honest, but a men's-only static table beneath a converter that handles all genders is a strange asymmetry; consider either making the table gender-aware (matching the converter's current selection) or removing it in favor of the converter, which already fully supersedes it |
| Gender hub cards (Men's/Women's/Kids') | **KEEP** — genuinely useful navigation cards, good example (§9) |
| "How to Measure Your Foot in CM" | **KEEP** — concise, links out rather than repeating full instructions inline |
| "Crawl hub: internal links" (bare US/UK/EU/All-pages cards) | **REMOVE or absorb into footer** — self-admitted crawl aid, zero user value as currently presented (§9) |
| "Why sizes don't line up everywhere" 3-card block | **KEEP** — good cardification example (§8) |
| FAQ (2 visible, 5 in schema) | **FIX SCHEMA MISMATCH** (§7) and decide the true canonical question set — this is the one clear P1/P2 defect on an otherwise well-structured page |

This page is the **best-structured tool-hub page found in this audit** —
its problems are narrower and more mechanical (redundant Quick Converters
cards, the crawl-hub block, the FAQ schema mismatch) than the systemic
brand-page problems in §18/§9. It's a reasonable template reference for
Phase 7, not a page needing a rebuild.

---

## 18. Clothing Architecture

Per instruction, the route system (certified through Phase 5F-H) is not
re-evaluated here. UX/content-only findings, based on this and prior
phases' direct reads of clothing landing pages:

- Clothing landing pages are **already lean and task-focused** — H1, a
  short conversion-preview sentence, a CTA to the dedicated converter with
  the user's specifics carried via deep-link, and minimal surrounding
  content. This is closer to the desired direction than any other family
  audited. **No major restructuring recommended.**
- The dedicated `/clothing-size-converter.html` page (audited in Phase
  5F-H for functionality) was not re-audited here for content/copy — flag
  for a light Phase 7 pass to check it against the same "See also"/
  "Quick answer"/duplicate-FAQ patterns found elsewhere, since it wasn't
  opened in full during this content-focused pass.
- Garment selection (tops/pants/dresses, gender-filtered) is a functional
  strength already verified working correctly in Phase 5F-H — no content
  change should risk destabilizing that dependency chain.

---

## 19. Mattress Architecture

Audited `tools/home/mattress-size-chart.html` structurally (headings +
form/select count; not a full line-by-line read this phase — flagged for
Phase 7 detail pass).

- Title: *"Mattress Size Chart (US, UK, EU)"* — as the brief anticipated,
  this frames the feature narrower than international (no Japan/Asia
  standard mentioned, unlike the shoe/clothing converters which include
  JP/CN throughout).
- Two similarly-worded H2s appear before the interactive tool is reached:
  "Convert your mattress size internationally" and "Find equivalent
  mattress sizes worldwide" — likely one is meant as orienting copy and
  one as the tool's own section heading, but as written they read as
  competing/duplicate framing (§3's "competing messages" pattern).
- The page does have a real interactive tool (2 forms, 5 selects
  confirmed present) — the brief's question ("should an interactive input
  tool be the primary experience?") is already answered **yes** in the
  existing build; the gap is framing/naming, not missing functionality.
- "Quick Converters" card block appears here too (same site-wide
  component) — same redundancy question as §16/§17, though mattress
  conversion is *not* one of the 8 cards' targets, so the redundancy is
  milder here.

**Recommendation**: treat as closer to the shoe/clothing tool-first
architecture (§16/§17's ideal hierarchy) rather than a from-scratch
design, but explicitly broaden the framing beyond "US, UK, EU" to match
the site's stated international identity, and resolve the two-H2
competing-message issue. A full line-by-line audit of this page is
recommended as an early, narrow Phase 7 task given it wasn't fully read
this phase.

---

## 20. Systemic Findings

| Finding | Source file(s) | Affected population | Safe implementation mechanism |
|---|---|---|---|
| "Quick answer" without a visible question | `scripts/ai-answer-injector.js` (also touched by `fix-ai-layout.js`, `refactor-conversion-page-model.js`) | 121 files (20/20 brands + ~101 others) | Fix the injector's template logic once; re-run against the affected population the same way prior phases re-ran generators (scoped write interception, verified diff) |
| Dual FAQ surfaces with mismatched questions | `scripts/inject-aeo-layer.js` (Frequently Asked Questions block) + `scripts/fix-ai-layout.js`/`refactor-conversion-page-model.js` (Common questions / ai-faq-block) | Brand pages confirmed (20); likely broader per the 107-file "Common questions" count | Consolidate to one injector pass with one canonical question set per page; remove the redundant one |
| FAQ schema/visible mismatch | Whichever pass writes `FAQPage` JSON-LD (likely `scripts/generate-ai-index.js` or `scripts/ai-answer-injector.js` — not fully traced this phase, flag for Phase 7 investigation) vs. the visible-FAQ injector | At least `/shoe-size-conversion-chart/`; population-wide extent not verified this phase | Generate schema *from* the final visible FAQ content, not independently |
| Meta-description-reused-as-body-copy | Homepage: hand-authored. Brand pages: likely `scripts/generate-programmatic-pages.js`'s intro-paragraph logic | Homepage (1) + brands (20) + likely more | Separate the meta-description string from the visible-intro string at the template level so they can never be forced identical |
| Redundant "Quick Converters" cards (6-of-8 duplicate the tool on-page) | Shared card component/partial (likely `scripts/lib/quick-converters-snippet.js`, per Phase 3's own report referencing this exact file) | Homepage, shoe-size-conversion-chart, likely other tool-hub pages | Single component fix — make the card set context-aware (exclude cards matching the page's own live tool) or trim to genuinely-distinct tools only |
| "Crawl hub" bare-heading cards | Inline in page templates, likely `scripts/internal-link-optimizer.js` or `scripts/generate-programmatic-pages.js` | Shoe-size-conversion-chart confirmed; likely broader | Remove or fold into footer; single template change |
| Stacked navigation sections (conversion-loop / next-step / session-depth / related-links) repeating the same links | `scripts/revenue-engine.js` (conversion-loop, monetization/commercial modules), `scripts/generate-programmatic-pages.js` (next-step, session-depth, related-links) | Brand pages confirmed (20); measurement pages show the next-step/session-depth/related-links pattern too (120) | Consolidate to the single NAVIGATION CARD block proposed in §9; this is the largest single systemic win available — it touches the most stacked sections per page |
| Duplicate monetization module text | `scripts/revenue-engine.js` (monetization-module) alongside a second, separately-authored commercial-module pass | Brand pages confirmed (20); extent elsewhere not verified | Pick one module system, remove the other, keep the better-written copy |
| Trust content in two adjacent blocks | Homepage/pages: pre-footer card (hand-authored/templated) + footer's own "How We Ensure Accuracy"/"Data sources" (footer partial) | All pages sharing the master footer (near-universal) | Remove the pre-footer card's redundant content once, since the footer partial is shared everywhere already |

**Page-specific findings** (do not fit a systemic bucket):

- The homepage's specific "why sizes differ" duplication (§8, §16) is a
  one-off hand-authored page, not a template — fixing it means editing
  `index.html` directly, not a generator.
- The mattress page's two competing H2s (§19) are similarly page-specific
  (one hand-authored file).
- The `/shoe-size-conversion-chart/`'s specific FAQ schema/visible
  mismatch (§7, §17), while it may recur elsewhere, was only directly
  verified on this one page — treat the *fix mechanism* as systemic but
  verify the *population* before assuming every FAQ page has this exact
  mismatch.

---

## 21. Priority Matrix

| Finding | Priority | Rationale |
|---|---|---|
| Brand pages have no converter/tool at all | **P0** | User cannot accomplish the primary task (convert a size) on the page family most likely to be searched by brand name |
| "See also" above the fold, before the homepage tool | **P1** | Delays task completion on the highest-traffic entry point; easy fix |
| Dual FAQ surfaces with different questions (brand pages) | **P1** | Directly confusing — two different answers to "what are the FAQs" on one page is a coherence failure, not polish |
| "Quick answer" with no question | **P1** | Actively confusing per the brief's own framing; label promises something the content doesn't deliver |
| Stacked navigation sections repeating the same 5–6 links four-to-six times (brand pages) | **P1** | Major hierarchy/confusion problem, high abandonment risk on mobile especially (§14) |
| Meta-description-as-visible-copy (homepage + brands) | **P2** | Robotic tone, but doesn't block task completion |
| Redundant "Quick Converters" cards duplicating the on-page tool | **P2** | Confusing but not blocking; user can still find and use the real tool |
| "Why Sizes May Vary" one-sentence sections | **P2** | Visual emptiness, not a blocker |
| Duplicate monetization module text | **P2** | Content quality, not a user-blocking issue |
| FAQ schema/visible mismatch | **P2** | SEO/structured-data hygiene, not a direct UX failure, but worth fixing alongside the FAQ consolidation work since it's the same touchpoint |
| Trust content in two adjacent blocks | **P3** | Polish |
| Mattress page's two competing H2s | **P3** | Minor clarity issue, tool itself works |
| "Free" repeated across title/meta/OG | **P3** | Tone polish only |

---

## 22. Recommended Design System

Three card types (§9), applied consistently:

- **PRIMARY TOOL CARD** — one per page, above the fold on tool-first
  families.
- **NAVIGATION CARD** — requires a real description; replaces
  conversion-loop/next-step/session-depth/related-links/crawl-hub as a
  single consolidated block, deduplicated against the footer.
- **INFORMATION CARD** — only for genuinely distinct conceptual units
  (Fit & Garment Guide, "Why sizes don't line up everywhere" are the
  working references).

**Content hierarchy rule** (applies to every family, detailed differences
per family in §23): H1 → one human sentence (never identical to the meta
description) → tool (where the family is tool-first) or the direct answer
(where it's a single-intent page) → supporting content → **one**
navigation block → **one** FAQ block (only where genuinely useful, per
§7) → **one** trust/data note (not two) → master footer.

**Tone standard**: use the shoe-size-conversion-chart lead paragraph and
the Fit & Garment Guide cards as the internal reference examples for
"human, clear, concise" — both already exist in the codebase and don't
need to be invented.

---

## 23. Recommended Page Structures

Per-family, derived from the actual audit (not the brief's generic
example applied uniformly):

**Homepage**: `H1 → human intro → converter → trimmed Quick Converters
(genuinely distinct tools only) → how-to-measure content → ONE why-sizes
section → FAQ → ONE trust note → footer.`

**Shoe/clothing conversion chart & regional hubs**: `H1 → human intro →
converter → (optional reference table, gender-aware or removed) → gender/
category navigation cards → brief how-to-measure link-out → why-sizes
info cards → FAQ (schema-matched) → footer.` No "Quick Converters" grid
duplicating the on-page tool; no bare crawl-hub cards.

**Clothing landing pages**: largely unchanged — already close to ideal
(§18). Light copy pass only.

**Brand pages**: needs the most structural change. `H1 → human intro (not
the meta description) → an embedded converter or a clearly-labeled,
single prominent CTA to the dedicated converter (not "linked at the
bottom") → fit-tendency content (kept, it's genuine value) → ONE
navigation card block (not four) → ONE FAQ (not two) → footer.` Remove
duplicate monetization modules; remove "Why Sizes May Vary" one-liner (its
content is already covered in the fit-and-sizing card grid).

**Measurement pages**: similar consolidation to brand pages for the
navigation-block stacking (§9's next-step/session-depth/related-links
pattern also present here), but keep the single-answer-first structure
since these are single-intent pages, not general hubs.

**Mattress page**: adopt the shoe/clothing tool-first hierarchy; resolve
the two-H2 framing; broaden beyond US/UK/EU framing in line with the
site's international identity (no dataset/architecture change implied —
this may be copy-only if the underlying tool already supports more
regions, or may require a Phase 7 data-scope decision if it doesn't;
not verified this phase).

---

## 24. Implementation Roadmap

Adjusted from the brief's suggested sequence based on evidence gathered —
brand pages are the clear highest-impact, most self-contained fix, so
they're pulled earlier:

- **Phase 7 — Brand page architecture (P0/P1 fixes)**: add a converter/CTA
  to brand pages, consolidate the dual FAQ, remove "Quick answer"-without-
  question or rewrite it, consolidate the four stacked navigation
  sections into one. Narrow scope: `brands/*.html` (20 files) + whichever
  generator/injector scripts produce them.
- **Phase 8 — Homepage + shoe/clothing hub architecture**: remove
  above-the-fold "See also," de-duplicate meta-description-as-intro, trim
  redundant Quick Converters cards, merge duplicate "why sizes vary"
  content. Narrow scope: `index.html`, `shoe-size-conversion-chart/`, and
  the shared Quick Converters component.
- **Phase 9 — FAQ/schema consolidation, site-wide**: one canonical FAQ
  injector pass, schema generated from final visible content, applied
  across the 1,003-file population that currently has FAQ content.
  Highest file-count phase; needs its own careful scoped-regeneration
  discipline (matching the two-pass regenerate-then-cleanup pattern
  already proven in Phase 5F).
- **Phase 10 — Navigation/card system consolidation**: replace
  conversion-loop/next-step/session-depth/related-links/crawl-hub with the
  single NAVIGATION CARD pattern, site-wide (programmatic-pages,
  measurement, brands).
- **Phase 11 — Content tone pass**: rewrite keyword-stuffed snippets (e.g.
  the brand-page "Regional Differences" card copy) and remove duplicate
  monetization module text. Lower urgency (P2/P3), can run after the
  structural phases.
- **Phase 12 — Mattress page dedicated pass**: resolve competing H2s,
  broaden international framing, evaluate against the shoe/clothing
  hierarchy. Small, self-contained.
- **Phase 13 — Production browser + content certification**: re-run the
  Phase 5F-H-style methodology (real production evidence, deterministic
  sampling, mobile+desktop) against every page family touched by Phases
  7–12.

Every phase above should follow the Part 23 git discipline (§27) — no
implementation phase's work should be committed alongside another's.

---

## 25. Risks / Regression Concerns

- **Do not touch the converter/generator logic certified through Phase
  5F-H** while doing content/UX work — every recommendation in this
  report is about surrounding content, card structure, and copy, not the
  `app.js` contract, `data/*.json`, or the route/redirect system.
- **The stacked navigation sections (§9, §20) are also internal-linking
  infrastructure** — Phase 3's own report and `scripts/internal-link-
  optimizer.js`/`scripts/crawl-priority-map.js` suggest these blocks serve
  a crawl-budget/discovery purpose beyond pure UX. Consolidating them
  (Phase 10) should preserve total internal link count/reach where
  reasonably possible, not just delete links — this needs explicit
  verification against whatever crawl-budget goals motivated their
  original creation, which this UX-focused audit did not investigate.
- **FAQ schema changes affect structured data / rich results** — Phase 9's
  FAQ consolidation should be verified against Google's structured-data
  guidelines (schema must match visible content), not just against UX
  goals, since removing/merging FAQ content changes what can legally be
  marked up as `FAQPage`.
- **The 1,003-file FAQ population and 765-file programmatic-pages
  population are large** — any systemic fix must use the same scoped,
  verified regeneration discipline established in Phase 5F (write-
  interception, diff verification, two-pass regenerate-then-cleanup where
  files are added/removed) rather than a blanket find-and-replace.

---

## 26. Phase-Gating Requirements

Per the established permanent rule (restated, not modified, by this
phase):

**IMPLEMENTATION PHASE**: implement → test → inspect diff → stage exact
phase files → verify staged list → commit → verify commit scope → push →
verify `origin/main` → deploy → production certification if required →
close phase.

**READ-ONLY PHASE**: audit → report → stage exact report → verify staged
list → commit report → push report → close phase.

**No phase may carry uncommitted implementation work into the next
phase.** This report is itself a read-only-phase deliverable and should
be committed/pushed under that discipline, exactly as Phases 5F-D through
5F-I were.

---

## 27. Git / Phase Discipline

```
HEAD (start of phase):        c9fb34d81dc681581fc615b523c48b88de803a12
origin/main (start of phase): c9fb34d81dc681581fc615b523c48b88de803a12
Working tree (start of phase): CLEAN
```

Unaltered by this phase — confirmed in the closing gate (§28).

---

## 28. Final Recommendation

**Do not implement anything yet — this report is the Phase 7 input, not
Phase 7 itself**, per this phase's own explicit scope. The single highest-
leverage next step is **Phase 7 as scoped in §24: the brand-page template**
— it's the one family with a P0 finding (no converter at all), it's fully
generator-produced (20 files, one systemic source), and fixing it
validates the consolidated-navigation-card and single-FAQ patterns this
report proposes before applying them to the much larger programmatic-pages
and measurement populations in Phases 9–10.

---

## Final Gate

```
git status --short
```
The only repository change from this phase is the creation of
`reports/phase-6-ux-content-architecture-audit.md`, verified below.

No source file, generated HTML file, data file, template, generator,
schema, sitemap, navigation, footer, redirect, or Cloudflare configuration
file was modified. No commit was made. No push was made.

**STOP — end of Phase 6.**
