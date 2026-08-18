# Remediation Roadmap

**This document recommends future work only. No implementation was performed in the audit phase.**

---

## Phase 2 — Runtime & converter QA (next recommended)

**Goal:** Verify functional correctness where static analysis cannot.

| Task | Priority | Scope | Files to exercise |
|------|----------|-------|-------------------|
| Browser test homepage hub converter (shoes + clothing flows) | P1 | A | `index.html`, `app.js` |
| Browser test CN/JP/CM shoe conversions | P1 | A/E | `programmatic-pages/china-to-us-shoe-size.html` |
| Confirm KR/INCH empty-state UX | P1 | A | Any programmatic shoe form |
| Click-through Quick Converters links | P1 | B | Any `programmatic-pages/*` |
| Clothing type population by gender | P1 | A | `index.html`, `clothing-size-converter.html` |
| Accessibility spot check (keyboard + SR) | P2 | A | Hub converter |
| Run `adsense-layout-validator.js` read-only | P2 | C | Programmatic sample |
| Run `breadcrumb-audit.js` read-only | P3 | C | All families |

**Deliverable:** Test matrix spreadsheet with PASS/FAIL per scenario.

---

## Phase 3 — P1 fixes (implementation phase — not started)

| ID | Fix | Layer | Suggested approach |
|----|-----|-------|-------------------|
| AUD-001 | Broken `/tools/*-converter.html` links | B | Update `scripts/lib/quick-converters-snippet.js` → `/shoe-size-converter.html`, `/clothing-size-converter.html`; batch replace in HTML or regenerate |
| AUD-002 | KR/INCH without data | E/B | Remove options from templates OR add data + validation |
| AUD-003 | Placeholder `sameAs` | A | Fix `inject-authority-org-schema.js`; strip placeholders site-wide |
| AUD-004 | Duplicate FAQ sections | A | Consolidate `ai-answer-injector.js` output with visible FAQ |
| AUD-005 | Converter regressions | A | Fix any failures found in Phase 2 |

---

## Phase 4 — P2 quality & trust

| ID | Fix | Layer |
|----|-----|-------|
| AUD-006 | Quick answer → question + answer format | A/C |
| AUD-007 | Migrate `why-sizes-vary` stub to `why-vary-cards` | B/C |
| AUD-008 | Hero-tool on clothing/measurement families | B/C |
| AUD-009 | Reduce JSON-LD redundancy | B |
| AUD-010 | Remove irrelevant FAQ schema from legal | C |
| AUD-011 | Fix link validator index resolution | A |
| AUD-012 | Expand `measurement/index.html` hub | D |
| AUD-013 | Revisit mattress nav placement | A |

---

## Phase 5 — Monetization & external verification

| Task | Owner |
|------|-------|
| Create and deploy `ads.txt` | Ops / publisher account |
| Integrate AdSense script + test slots | Implementation |
| Add cookie consent if EU traffic | Legal + implementation |
| Google Search Console: coverage, CWV, rich results | Site owner |
| PageSpeed / CrUX field data | Site owner |
| Replace or remove placeholder social profiles | Marketing |

---

## Suggested post-generate pipeline order

When regenerating programmatic content in future:

1. `generate-programmatic-pages.js` (or `generate-all-pages.js`)
2. `inject-aeo-layer.js` / `ai-answer-injector.js` (if still needed)
3. `migrate-hero-tool.js` (if templates not updated at source)
4. `standardize-footer.js`
5. `generate-sitemaps.js`
6. `footer:check`
7. `prebuild-link-validation.js`
8. `content-quality-audit.js` + `adsense-policy-checker.js`

---

## Files to inspect first in Phase 2

```
app.js
index.html
shoe-size-converter.html
clothing-size-converter.html
programmatic-pages/china-to-us-shoe-size.html
clothing/clothing-men-tops-M-US-to-EU.html
measurement/24-cm-to-us-shoe-size.html
scripts/lib/quick-converters-snippet.js
scripts/inject-authority-org-schema.js
scripts/ai-answer-injector.js
data/shoe_sizes.json
```

---

## Out of scope for remediation unless product decides

- Removing programmatic page scale
- Adding non-English locales
- Mattress/duvet content line (product decision)
