# Content Findings

Evaluated for **actual user value**, not keyword coverage.

## Automated content quality scan

**Script:** `node scripts/content-quality-audit.js`  
**Directories:** programmatic-pages, clothing, brands, measurement, semantic, tools

| Metric | Value |
|--------|------:|
| Pages scanned | 1,030 |
| Avg quality score | 98 |
| Avg word count | 1,278 |
| Below approval threshold (55) | 1 |

**Lowest page:** `measurement/index.html` — score **48** (AUD-012)

**Interpretation:** High word counts on programmatic pages are driven by repeated modules (FAQ, how-to, related links, fit tips) — not necessarily unique editorial depth.

---

## Originality and usefulness

| Area | Status | Notes |
|------|--------|-------|
| Programmatic conversion pages | NEEDS WORK | Converter + contextual lead is useful; bottom modules highly repetitive |
| Brand guides | PASS | Brand-specific content with some unique analysis |
| Semantic/educational | PASS | Longer-form guides (e.g. `semantic/how-shoe-sizing-works.html`) |
| Quick answer blocks | NEEDS WORK | Often generic; no explicit question (109 pages) |
| AI FAQ block | NEEDS WORK | Generic 3-question template duplicated |

---

## Duplicate content patterns

### Common questions + Frequently Asked Questions

- **Count:** 100 pages
- **Status:** NEEDS WORK (P1)
- **Sample:** `cm-to-us-shoe-size.html` — `ai-faq-block` then `faq-block` with overlapping intent
- **User impact:** Reads as duplicated SEO sections, not helpful Q&A

### Generic third question in ai-faq-block

Pattern: "More on [page title]" → "See linked guides..." — low value on every page.

---

## "Why Sizes May Vary" historical issue

| State | Count | Verdict |
|-------|------:|---------|
| Single-sentence stub (`why-sizes-vary`) | 112 | **Still present** on editorial/hub pages |
| Improved 3-card grid (`why-vary-cards`) | 1,017 | **Improved** on programmatic pages |

Example stub (`cm-to-us-shoe-size.html`):
> "Shoe and clothing sizes can vary between brands due to manufacturing differences..."

Example improved (`programmatic-pages/china-to-us-shoe-size.html`):
> Cards: Different scales / Brand lasts / Use centimeters

---

## Quick answer historical issue

**Status:** NEEDS WORK — **still present** (109 pages)

Pattern:
```html
<p><strong>Quick answer:</strong></p>
<p>[answer text without preceding question]</p>
```

**User clarity:** Reader sees a label implying a question was asked, but no question is shown.

**Not the same as:** A visible H2 question followed by answer (which would be fine).

---

## Low-value navigation blocks (historical)

| Block | Status |
|-------|--------|
| "Men's, Women's & Kids' Shoe Size Charts" | **PASS** — 0 matches |
| "Regional & Conversion Pages" | **PASS** — 0 matches |

---

## Trust and expertise signals

| Signal | Status |
|--------|--------|
| Sizing methodology page | PASS (exists, linked) |
| Footer "How We Ensure Accuracy" | PASS — measured tone |
| Data sources list in footer | PASS |
| Placeholder Reddit/Quora in schema | FAIL (AUD-003) |
| AI usage disclosure page | PASS (`legal/ai-usage-disclosure.html`) |
| Shoe return rate study | PASS — unique research-style content |

---

## AdSense / thin content policy scan

**Script:** `node scripts/adsense-policy-checker.js`

- 1 warning: thin `measurement/index.html` (42 words)
- 0 prohibited content, medical claims, fake reviews detected in scan

---

## Spam-policy risk (content angle)

**Status:** NEEDS WORK

At ~765 programmatic shoe pages with similar module stacks, the site risks **scaled content** perception if pages do not differ meaningfully beyond the converted size pair. Mitigating factors in repo:
- Prefilled converter state per page
- Contextual titles/descriptions
- 35 kids pages marked noindex

**EXTERNAL VERIFICATION REQUIRED:** Google Search Console manual actions, crawl stats.

---

## Content maintenance risks

- Multiple injectors (`inject-aeo-layer`, `ai-answer-injector`) can drift from templates
- Manual pages (guides) vs generated pages (programmatic) use different AEO variants
- Regenerating programmatic pages without re-running migrations may undo hero-tool/footer fixes

**Recommendation:** Document required post-generate pipeline order in remediation roadmap.
