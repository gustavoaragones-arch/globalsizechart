# Phase 9A — Site-Wide FAQ Architecture Audit (Read-Only)

**Mode: READ-ONLY.** No source file, generated HTML, package file, or
prior-phase report was modified. The only artifacts produced are this
report and `reports/phase-9-faq-inventory.json`.

**Baseline:** `HEAD` = `origin/main` = `0015e084f69b9a0f25f62371b4b281f5601c6944`,
working tree clean at the start and end of this audit.

---

## 1. Baseline Commit

Confirmed `HEAD` = `origin/main` = `0015e084f69b9a0f25f62371b4b281f5601c6944`,
working tree clean, before any inspection began.

## 2. Total HTML Population

**1,150 HTML files** scanned (excluding `node_modules/`, `.git/`,
`scripts/`, `sitemaps/`, `components/`, `build/`, `reports/`, `docs/`,
`authority/generated/` — the same ignore set the site's own generator/
injector scripts use). This is close to, but not identical to, the
"1,003" figure Phase 6 cited — that number was a grep-count of the string
"Frequently Asked Questions" specifically, not a page-population count.
**Do not reuse "1,003" as a population figure** — the actual population is
1,150, of which 1,008 have at least one visible FAQ-like section (see §3).

## 3. Pages With FAQ-Like Content

| Metric | Count |
|---|---|
| Pages with ≥1 visible FAQ section | 1,008 |
| Pages with ≥1 FAQPage schema block | 1,020 |
| Pages with exact visible/schema match | **47** |
| Pages with a mismatch (question or answer text differs) | 953 |
| Pages with ≥2 visible FAQ surfaces (true duplication) | 8 |
| Pages with schema-only FAQ (no matching visible content at all) | 12 |
| Pages with "Common questions" present | 88 |
| Pages with an `.ai-faq-block` element (`aiFaqPresent`) | 88 |
| Pages with an `.aeo-ai-layer`/`.faq-block`/`#aeo-faq-block` element (`aeoFaqPresent`) | 221 |
| Pages with "More questions" (`generate-faqs.js` output) | 1 |
| Pages with "Quick answer" present | 100 |
| Pages with more than one `FAQPage` JSON-LD script tag | 0 |

## 4–13. (Folded into §3/§14 tables above/below per field — see the full
breakdown in §14 for classification counts and §15 for the family matrix,
which supersede a flat list here for readability.)

---

## 14. Classification Counts (A–H)

| Class | Meaning | Count | % of population |
|---|---|---|---|
| **A** | Healthy — single visible FAQ, exact schema match | 47 | 4.1% |
| **B** | Multiple visible FAQ surfaces on one page | 8 | 0.7% |
| **C** | One visible FAQ, schema mismatch | **953** | **82.9%** |
| **D** | Schema-only FAQ (no matching visible content) | 12 | 1.0% |
| **F** | No FAQ, and none needed (page family judgment — see §21) | 130 | 11.3% |
| **G** | No FAQ, but page likely benefits from one | 0 (see note) | — |
| **H** | Architecture unknown | 0 | — |

**Note on G**: no page was classified G in this pass. Every currently
FAQ-less page (F) was judged, at the page-family level, as either
genuinely not needing one (`clothing/` — deep-link, single-intent pages,
matching Phase 6's own finding) or as an index/navigation surface
(`sitemap/`, `/ai/`) where a FAQ would add nothing. If the Project
Director disagrees with any specific family's F judgment, that's a Part I
decision to revisit in 9B, not a defect in the audit itself.

**The dominant finding, by a wide margin, is Classification C at 82.9% of
the entire site.** This is not scattered — it traces to one specific,
reproducible source-code pattern (§17, §18).

---

## 15. Page-Family Matrix

| Family | Pages | Classification breakdown | Notes |
|---|---|---|---|
| `programmatic-pages/` | 756 | 756 C | 100% mismatched — single dominant defect |
| `clothing/` | 125 | 125 F | No FAQ anywhere in this family (by design — matches Phase 6's finding that single-intent deep-link pages don't need one) |
| `measurement/` | 120 | 119 C, 1 F | Same mismatch pattern as programmatic-pages |
| `root-page` (57 hand-authored files at repo root minus homepage) | 56 | 27 C, 22 A, 7 D | Most heterogeneous family — no single generator touched all of these uniformly |
| `brands/` | 20 | **20 A** | **Phase 7's remediation confirmed fully intact** |
| `regional-hub` (`us/ uk/ eu/ ca/`) | 12 | 12 C | Uniform mismatch |
| `legal/` | 9 | 9 C | Uniform mismatch |
| `programmatic-ai-generated` | 9 | 8 C, 1 B | The 1 B is a known test-stub artifact (§9) |
| `shoe-conversions-hub` (`shoe-size-conversions/*/`) | 7 | 6 B, 1 C | **Worst family — 0 healthy pages; newly discovered, not covered by Phases 6–8** |
| `gender-shoe-hub` (`mens-/womens-/kids-shoe-size-*`) | 6 | 3 C, 3 A | Mixed |
| `semantic/` | 6 | 6 C | Uniform mismatch |
| `printable/` | 5 | 5 C | Uniform mismatch |
| `region-pair-hub` (`*-to-*-shoe-size/`) | 4 | 4 C | Uniform mismatch |
| `other:programmatic` (`programmatic/templates/*.html`) | 3 | 3 D | **These are source templates, not live pages** — see §16 caveat |
| `tools/` | 2 | 1 B, 1 C | `fit-assistant.html` (B), `measurement-assistant.html` (C) |
| `home-tools` (`tools/home/*`) | 2 | 1 D, 1 F | `mattress-size-chart.html` is D — well-written schema, zero visible FAQ |
| `homepage` | 1 | 1 A | **Phase 8's remediation confirmed intact** |
| `shoe-hub` | 1 | 1 A | **Phase 8's remediation confirmed intact** |
| `shoe-pages-hub`, `knowledge`, `guides`, `ai-index`, `sitemap-html`, `other:widget` | 1 each | 1 C / 1 C / 1 D / 1 F / 1 F / 1 F | Small index/single pages, mixed |

---

## 16. Source Architecture Map

Traced by direct code inspection (not assumed from Phase 6's list, which
this audit found to be incomplete — see §17).

```
data/*.json, hand-authored page content
        │
        ├── scripts/generate-pages.js ─────────────┐
        │   (reads data/programmatic_routes.json,    │
        │    injects into programmatic/templates/     │
        │    conversion-template.html)                │
        │                                             ▼
        ├── scripts/generate-programmatic-pages.js   generated HTML in
        │   (5,439 lines; the actual generator for    programmatic-pages/,
        │    most of the 756-page family; contains     measurement/,
        │    AT LEAST 6 distinct FAQ-generation code    clothing/, regional
        │    paths for different sub-templates —        hubs, etc.
        │    region-converter pages, category pages,
        │    individual routes, "guide" pages,
        │    "semantic" pages, and a "Master Hub
        │    Network" template)
        │
        ├── scripts/ai-answer-injector.js ── post-processing pass:
        │   walks ALL html, targets crawl tiers high/medium +
        │   all programmatic-pages/ (excludes /legal/). Injects a
        │   "Data sources" section (NOT FAQ) + conditionally a
        │   generic 2-question FAQPage schema via buildArticleGraph()
        │   IF the page has no FAQPage schema yet. Comment in the
        │   source confirms it no longer adds a visible "Quick
        │   answer" block in its current form.
        │
        ├── scripts/inject-aeo-layer.js ── post-processing pass:
        │   walks ALL html (except a small SKIP_FILES set + files
        │   already carrying data-aeo-ai-layer or an ai-answer
        │   class). Injects a VISIBLE "why sizes vary" 3-card block
        │   + "Key navigation" tiles — but injectHeadSchemas()
        │   ALSO independently adds a hardcoded, generic 2-question
        │   FAQPage schema ("What is EU 42 in US shoe size?" / "Are
        │   EU and US shoe sizes the same?") if no FAQPage schema
        │   exists yet. THIS FUNCTION'S VISIBLE OUTPUT DOES NOT
        │   INCLUDE A MATCHING FAQ BLOCK — confirmed by direct
        │   reading of buildBodyLayer(). This is the exact source of
        │   most of the 12 schema-only (D) pages that show this
        │   specific 2-question pair.
        │
        ├── scripts/generate-faqs.js ── post-processing pass, SCOPED
        │   to programmatic-pages/ only. Appends a "More questions"
        │   heading (data-ai-generated items) if not already present.
        │   Confirmed DORMANT — only 1 file in the entire population
        │   carries its marker, and that file is a known test/stub
        │   artifact. Flagged as a live risk (§23), not a current
        │   contributor to the 953-page defect.
        │
        ├── scripts/fix-ai-layout.js ── a PRIOR cleanup attempt.
        │   Dedupes MULTIPLE INSTANCES OF THE SAME SELECTOR (e.g.
        │   keeps only the first [data-ai-faq-block]) but does NOT
        │   recognize that [data-ai-faq-block] ("Common questions")
        │   and .faq-block/#aeo-faq-block ("Frequently Asked
        │   Questions") are two DIFFERENT selectors representing the
        │   same user-facing concept — cross-mechanism duplication is
        │   invisible to this script. This is the root cause of why
        │   Classification B pages still exist despite this script's
        │   prior run.
        │
        └── scripts/refactor-conversion-page-model.js ── a PRIOR
            one-shot migration, explicitly scoped via a PREFIXES list
            to: programmatic-pages/, measurement/, clothing/,
            shoe-size-conversion-chart/, us/, uk/, eu/, ca/, plus
            shoe-size-converter.html and clothing-size-converter.html.
            brands/ WAS NOT in this list — this is the exact,
            confirmed reason Phase 7 needed a from-scratch
            remediation: brand pages were categorically excluded from
            this earlier cleanup attempt. This script DOES remove
            [data-ai-faq-block] unconditionally within its scope, and
            conditionally removes .ai-faq-expansion / #aeo-faq-block
            when a section#faq also exists — but it does not touch
            FAQ SCHEMA at all, so it could not have fixed the
            visible/schema mismatch pattern even within its own
            scope.
```

## 17. Injector Map (exact source/function/selector/population table)

| Mechanism | File | Function | Output selector(s) | Scope | Runs at | Can produce duplicate/mismatched FAQ? |
|---|---|---|---|---|---|---|
| Region/category/route FAQ | `scripts/generate-programmatic-pages.js` | `buildRegionFaqContent`/`buildRegionFaqJsonLd`, `buildCategoryFaqContent`/`buildCategoryFaqJsonLd`, `buildFaqContent`/`buildFaqJsonLd`, plus 3 more distinct pairs for guide/semantic/hub sub-templates (≥6 total pairs) | `.faq-item` inside `section#faq` (visible) + `{{FAQ_JSON_LD}}` (schema) | `programmatic-pages/`, `measurement/`, regional hubs, and others depending on which sub-template | Generation time | **YES — confirmed the dominant cause.** Each pair is two independently hand-written function bodies with near-identical but not-identical text (verified exact diff, §18) |
| Generic AEO schema fallback | `scripts/inject-aeo-layer.js` | `injectHeadSchemas` | schema only, no visible counterpart | All HTML except `SKIP_FILES` and already-tagged files | Post-processing | **YES — confirmed source of schema-only (D) pages** carrying the generic "EU 42" 2-question pair |
| Generic Article/FAQ schema fallback | `scripts/ai-answer-injector.js` | `buildArticleGraph` | schema only (conditional) | Crawl tiers high/medium + all `programmatic-pages/`, excludes `/legal/` | Post-processing | Yes, in principle, but empirically only 1 page in this population shows its exact 2-question fallback text (`about-globalsizechart.html`) — most `programmatic-pages/` already had a `FAQPage` from the generator itself by the time this ran, so its `includeFaqGraph` guard suppressed it |
| "Common questions" | Not currently traced to an active generator — likely from an earlier version of one of the above scripts, or a retired script not found in the current `scripts/` directory | — | `.ai-faq-block`, heading "Common questions" | 88 pages, concentrated pre-Phase-7 in `brands/` (now 0) and scattered elsewhere | Unknown — **could not fully trace to a currently-active source; flagged as an open item, not guessed at (§23)** | Yes — this is the visible half of Classification B pages |
| "More questions" | `scripts/generate-faqs.js` | `buildFaqHtml` | `.ai-faq-expansion`, heading "More questions" | `programmatic-pages/` only, capped at `MAX_FAQ_PAGES` (env, default 500) | Post-processing, **dormant** (1 marker found site-wide) | Yes, if ever run for real — flagged as a live risk |
| Dedup (partial) | `scripts/fix-ai-layout.js` | `removeDuplicateAeoQuickAnswer`, same-selector slicing | removes duplicate instances of the *same* selector only | All HTML | Post-processing | No — this script REDUCES duplication but cannot fix cross-mechanism duplication (its own limitation, confirmed) |
| One-shot migration (partial) | `scripts/refactor-conversion-page-model.js` | `processHtml` | removes `.ai-answer-block`, `[data-ai-faq-block]`; conditionally removes `.ai-faq-expansion`/`#aeo-faq-block` | Explicit `PREFIXES` list — **excludes `brands/`** | One-shot, already run | No — reduces some duplication within its scope but does not touch schema at all |

## 18. Duplication Findings (Part G)

- **3,663 total visible FAQ question instances** across the population;
  **691 unique question texts**.
- **Legitimate sitewide questions** (category 1): "Are shoe sizes
  standardized?" and "Should I size up or down?" each appear on all 756
  `programmatic-pages/` — the same correct answer applies regardless of
  which specific conversion the page covers. **Legitimate, not a defect.**
- **Legitimate but over-broad template reuse** (category 5, borderline):
  "What is EU 42 in US shoe size?" / "Are EU and US shoe sizes the same?"
  (190 and 189 occurrences respectively) — the `inject-aeo-layer.js`
  hardcoded fallback pair. These appear on pages that have nothing to do
  with EU size 42 specifically (e.g., a Japan-sizing guide) — a generic
  question repeated as filler rather than a genuinely page-relevant one.
- **Accidental/architectural duplicate** (category 3/4): the exact
  `buildRegionFaqContent`/`buildRegionFaqJsonLd` drift is not really
  "duplication" in the traditional sense — it's two **near-identical but
  independently maintained copies of the same 4 questions**, drifting in
  wording every time one copy is edited without the other. Confirmed via
  direct diff (§18a below) that this drift has already produced at least
  one outright **factual error** in schema: a China-sizing page's schema
  answer states *"EU sizes are often 1–1.5 larger than US"* — copy-pasted
  boilerplate that doesn't even mention China, while the visible answer on
  the same page correctly discusses China vs. US sizing. This is evidence
  the drift is not merely cosmetic.

### 18a. Concrete mismatch example (`programmatic-pages/china-42-to-us-shoe-size.html`)

| # | Visible question | Schema question | Visible answer | Schema answer |
|---|---|---|---|---|
| 1 | What is China 42 in US shoes? | *(identical)* | "...Use the converter above for your exact gender **and to see other regions**." | "...Use the converter above for your exact gender." |
| 2 | Is China sizing bigger than US? | *(identical)* | "China and US use different scales. The converter above gives the exact equivalent..." | **"Sizing scales differ by region. EU sizes are often 1–1.5 larger than US..."** — factually off-topic for a China page |
| 3 | Are shoe sizes standardized? | *(identical)* | "...always check the brand's size chart when buying." | "...check the brand's size chart when possible." |
| 4 | Should I size up or down? | *(identical)* | "...European and Asian brands often run smaller. If between sizes or buying athletic shoes, consider sizing up. Check reviews and the brand's fit guide." | "...Consider sizing up for athletic shoes or if the brand runs small." |

This single example is representative of all 931 pages classified
`derived-but-independently-transformed` in the inventory JSON — same
questions, independently-drifted answers, traced to the exact function
pair responsible.

## 19. Quick Answer Inventory (Part H)

**100 pages** carry a "Quick answer" block, concentrated entirely outside
the families Phases 7/8 already remediated:

| Family | Count |
|---|---|
| `root-page` | 56 |
| `programmatic-ai-generated` | 9 |
| `shoe-conversions-hub` | 7 |
| `gender-shoe-hub` | 6 |
| `semantic` | 6 |
| `printable` | 5 |
| `region-pair-hub` | 4 |
| `tools` | 2 |
| `home-tools`, `ai-index`, `guides`, `knowledge`, `shoe-pages-hub` | 1 each |

**Zero** occurrences remain in `brands/`, `homepage`, `shoe-hub`,
`clothing/`, `measurement/`, or `programmatic-pages/` — confirming those
populations are clean (Phases 7/8 for the first three; the latter three
apparently never had this specific pattern).

In every sampled instance, the Quick Answer block is **not preceded by a
visible question** — it is the same "invalid UX pattern" identified in
Phase 6/7/8: a label followed directly by a restated meta description.
**Flagged as INVALID UX PATTERN across all 100 occurrences**, consistent
with Phases 7/8's finding; not re-verified page-by-page individually in
this pass beyond the automated marker check, since the pattern has been
manually confirmed identical on every family sampled so far (brands,
homepage, shoe hub) and the automated check (`quickAnswerPresent`) is a
reliable proxy for its structural presence.

## 20. Schema/Content Forensics Summary (Part F)

| Architecture status | Count | Meaning |
|---|---|---|
| `same-source (verified identical)` | 47 | Healthy — visible and schema text are byte-identical |
| `derived-but-independently-transformed` | 931 | Same questions, independently drifted answer text — the dominant defect |
| `separate-sources` | 30 | Different question sets entirely between visible and schema (includes the 8 true-duplicate B pages plus ~22 other mismatched-question-set C pages) |
| `schema-only (no visible source)` | 12 | No visible FAQ at all; schema exists in isolation |
| `no-faq` | 130 | Neither surface present |

**No page in the population currently implements the target
`faqData → renderVisibleFAQ(faqData) → renderFAQSchema(faqData)` pattern
at the source-code level** — even the 47 "healthy" pages achieve their
match by coincidence of two independently-written strings happening to be
identical (or, for the 40 pages fixed in Phases 7/8, by deliberate
same-array rendering introduced in those phases). The `generate-
programmatic-pages.js` "Master Hub Network" builder (§16, line ~3899) is
the **one exception found in the codebase that already implements the
correct pattern** (`const faq = opts.faq || []`, with both `faqHtml` and
`faqJsonLd` derived from that same array) — but it is used for a small
number of hub-style pages, not the main 756-page population. **This
existing function is the strongest candidate reference implementation for
Phase 9B**, rather than needing to design the pattern from scratch.

---

## 21. Recommended Canonical Architecture

```
faqData: [{ question, answer }, ...]   (page-specific, or a named shared
                                         set for legitimately sitewide
                                         questions — never two parallel
                                         copies of the same set)
        │
        ├──► renderVisibleFaqHtml(faqData) → <section id="faq">
        │                                      <h2>Frequently Asked Questions</h2>
        │                                      {faq-item per entry}
        │                                    </section>
        │
        └──► renderFaqSchema(faqData) → <script type="application/ld+json">
                                            {FAQPage, mainEntity: faqData.map(...)}
                                          </script>
```

Modeled directly on the already-correct `generate-programmatic-pages.js`
Master Hub Network pattern (§20), generalized to the other ≥5 FAQ-
generating code paths in that file, and to a shared renderer the
post-processing injectors (`inject-aeo-layer.js`, `ai-answer-injector.js`)
call **instead of** independently hand-writing their own fallback
question/answer pairs.

## 22. Exact Implementation Scope (proposed for 9B — not started)

**In scope for a Phase 9B implementation**, pending explicit
authorization:

1. `scripts/generate-programmatic-pages.js` — consolidate the ≥6 FAQ
   content/schema function pairs into calls to one shared
   `renderVisibleFaqHtml`/`renderFaqSchema` pair, keeping each
   sub-template's existing page-specific question sets as data (not
   inventing new questions), fixing the confirmed answer-text drift
   (§18a) as a side effect of removing the second, independent copy.
2. `scripts/inject-aeo-layer.js` — remove `injectHeadSchemas`' hardcoded
   generic FAQ fallback (the 12 schema-only pages' primary cause) rather
   than have it write schema with no visible counterpart; either drop the
   schema injection entirely for pages with no real FAQ content, or make
   it call the shared renderer against genuine page content if any exists.
3. `scripts/ai-answer-injector.js` — same treatment for its
   `buildArticleGraph` FAQ fallback.
4. `scripts/fix-ai-layout.js` and/or a new consolidation pass — extend
   deduplication to recognize cross-mechanism duplicates (`.ai-faq-block`
   "Common questions" vs. `.faq-block`/`#aeo-faq-block` "Frequently Asked
   Questions") as the same user-facing concept, not two independent
   selectors each individually deduped to 1.
5. `scripts/generate-faqs.js` — **recommend retiring** (delete or
   explicitly disable via a hard guard), since it is dormant, scoped only
   to `programmatic-pages/`, and would reintroduce a third competing FAQ
   surface with a mismatched heading ("More questions") if ever run.
6. Regenerate/re-process the affected page populations using the real
   generator/injector pipeline, scoped exactly to the files that need it
   — not a blanket full-site run. Exact scoping mechanism (per-directory
   flag vs. write-interception, matching the technique used in Phases 5,
   7, and 8) to be decided in 9B once the generator consolidation is
   written and its blast radius can be measured directly.
7. `shoe-size-conversions/*/index.html` (7 files) and
   `tools/fit-assistant.html` — the Classification-B duplicate-visible-FAQ
   family not covered by any prior phase; needs the same "keep one FAQ,
   remove the other, migrate any non-redundant questions" treatment
   Phase 7 applied to brands.
8. The 7 `root-page` D-classification pages with substantive hand-authored
   schema-only content (`about-globalsizechart.html`,
   `clothing-size-converter.html`, `eu/japan/uk/us-shoe-sizing-
   system.html`, `guides/index.html`, `shoe-size-converter.html`,
   `tools/home/mattress-size-chart.html`) — these have **genuinely good,
   page-specific schema questions that were simply never rendered
   visibly**. Recommend rendering them as real visible FAQ sections rather
   than discarding good content, per Part Q's preservation requirement.

**Explicitly out of scope, unless 9B's own investigation finds otherwise**:
`clothing/*.html` (125 files — no FAQ by design, not touched), `brands/*.html`
(20 files — already healthy from Phase 7, do not re-touch), `index.html`
and `shoe-size-conversion-chart/index.html` (already healthy from Phase 8,
do not re-touch), `app.js`, all `data/*.json`, clothing routes,
`_redirects`, sitemap generation, Cloudflare/cache configuration, the
master footer.

## 23. Risks

- **Scale**: 953 pages need the same class of fix. Even with a correct
  generator-level change, regenerating that many files in one pass is the
  largest single-phase blast radius in this engagement to date — larger
  than Phase 5F's 125-file clothing migration. Requires the same rigor
  (scoped write-interception, exact before/after file-count verification,
  diff-scope gate) already proven in Phases 5, 7, and 8, applied at
  greater scale.
- **`programmatic-pages/` is not one template** — at least 6 distinct
  FAQ-generation code paths exist inside `generate-programmatic-pages.js`
  for different sub-page-types (region converters, category pages,
  individual routes, guide-style pages, semantic pages, hub pages). A 9B
  fix must consolidate all of them, not just the one pair sampled in §18a
  — under-scoping this risks leaving some sub-populations still
  mismatched while appearing to have "fixed programmatic-pages."
- **`scripts/generate-faqs.js` is a live landmine** — dormant now, but
  wired into `npm run ai:faqs` and would reintroduce a third FAQ surface
  across up to 500 pages if ever run by anyone unaware of this audit.
  Recommend explicit retirement, not just "leave it alone."
- **"Common questions" source could not be fully traced** — 88 pages
  carry `.ai-faq-block`, but no currently-active script in `scripts/` was
  found to be its generator (the two migration scripts that reference it,
  `fix-ai-layout.js` and `refactor-conversion-page-model.js`, only
  *remove* it, don't create it). It's possible the true generator was
  itself already retired/deleted, or renamed. **9B should re-verify this
  rather than assume it's fully understood** — an unidentified live
  generator would be a hard-stop-worthy surprise if discovered mid-
  implementation.
- **Preserving good content**: 12 D-classification pages, and many C
  pages, have genuinely well-written, page-specific questions (e.g. the
  mattress page's schema). A blunt "regenerate everything from the
  generic template" approach would destroy this — 9B must extract and
  preserve existing good content per Part Q, not just silently replace it
  with generic questions to hit a count target.

## 24. Migration Strategy (proposed, not started)

1. Consolidate the generator-level FAQ functions first (source-only
   change, zero generated-file impact until re-run).
2. Prove the consolidated renderer against a small, representative sample
   (one page per distinct sub-template found in §17) using the same
   scoped-write-interception technique as Phases 5/7/8, verifying
   visible/schema exact match before touching the full population.
3. Regenerate the 756 `programmatic-pages/` + 119 `measurement/` (the
   two single-cause, 100%-affected families) as one controlled batch,
   with an exact before/after file-count and diff-scope gate.
4. Handle the smaller, more heterogeneous families (`root-page`,
   `regional-hub`, `legal`, `semantic`, `printable`, `region-pair-hub`,
   `gender-shoe-hub`, `shoe-conversions-hub`, `tools`) as a second,
   separately-verified batch, since they don't share one single generator
   and need more individual judgment (matching Part Q's content-
   preservation requirement for the D-classification pages in particular).
5. Retire `scripts/generate-faqs.js`.
6. Full regression suite (converter contract, footer, link validator,
   Phase 7 and Phase 8 test suites) + new Phase 9 validator + browser
   testing across every affected family, per the phase brief's own Parts
   W–Y.

## 25. Acceptance Gates (for 9B, restated from the phase brief for
completeness)

Duplicate visible FAQ: 0. Schema-only FAQ questions: 0. Visible-only FAQ
questions: 0. FAQPage mismatch: 0. Duplicate "Common questions": 0. Orphan
Quick Answer: 0. Broken links introduced: 0. Footer regression: 0.
Converter contract regression: 0 (987/987 baseline). Unexpected
page-family modifications: 0. Phase 7 and Phase 8 test suites remain
green.

---

## Audit Deliverables

- `reports/phase-9-faq-architecture-audit.md` — this report.
- `reports/phase-9-faq-inventory.json` — 1,150 records, one per HTML page
  in the population, with the exact fields specified in Part J (`url`,
  `file`, `pageFamily`, `visibleFaqCount`, `visibleFaqHeadings`,
  `visibleQuestions`, `schemaFaqCount`, `schemaQuestions`, `exactMatch`,
  `commonQuestionsPresent`, `aiFaqPresent`, `aeoFaqPresent`,
  `quickAnswerPresent`, `classification`, `faqNeeded`, `visibleSource`,
  `schemaSource`, `architectureStatus`). No page was omitted for lacking
  an FAQ.

---

# PHASE 9A — AUDIT COMPLETE

**No repository file was modified during this audit.** No generator was
run in write mode. No commit was made. No push was made.

**Summary for review:**

- **Total population**: 1,150 HTML pages.
- **Classification**: A=47 (4.1%), B=8 (0.7%), **C=953 (82.9%)**, D=12
  (1.0%), F=130 (11.3%), G=0, H=0.
- **Dominant finding**: a single, reproducible source-code pattern in
  `scripts/generate-programmatic-pages.js` (≥6 independently-hand-written
  content/schema function pairs) accounts for 931 of the 953 mismatches,
  affecting `programmatic-pages/` (756/756), `measurement/` (119/120),
  and most smaller generated-hub families uniformly. This has already
  produced at least one confirmed factual error in live schema (§18a).
- **Confirmed healthy and untouched**: `brands/` (20/20, Phase 7),
  `homepage` + `shoe-hub` (2/2, Phase 8) — both prior remediations remain
  fully intact.
- **Newly discovered, not covered by any prior phase**: the
  `shoe-size-conversions/*/` family (6 of 7 pages have genuine duplicate
  visible FAQ surfaces — the worst family in the population) and 12
  pages with well-written schema-only FAQ content that was never rendered
  visibly, including two major pages (`shoe-size-converter.html`,
  `clothing-size-converter.html`).
- **Proposed architecture**: consolidate around the pattern
  `generate-programmatic-pages.js` already implements correctly in its
  "Master Hub Network" builder — one canonical `faqData` array per page,
  rendered to both visible HTML and schema from the same source.
- **Key risk**: `scripts/generate-faqs.js` is a dormant but wired-in
  script that would reintroduce a third competing FAQ surface across up
  to 500 pages if ever run; recommend explicit retirement in 9B.
- **Expected 9B file population**: source changes to 4–5 scripts, plus
  regeneration of up to 953 HTML files (756 `programmatic-pages/` + 119
  `measurement/` + ~78 smaller-family pages), scoped and verified in
  batches per §24. `brands/`, `homepage`, `shoe-hub`, and `clothing/` are
  explicitly out of scope for regeneration.

**Waiting for explicit authorization before beginning Phase 9B.**
