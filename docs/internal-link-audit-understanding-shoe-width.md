# Internal Link Audit: understanding-shoe-width.html

**Page:** `/understanding-shoe-width.html`  
**Audit date:** 2026-02-04  
**Phase 13.5 – Width & Fit Authority**

---

## 1. Linked from at least 8 internal pages ✅

**Result:** **PASS** — Page is linked from **86+ internal pages** (10 root + 76 programmatic).

### Root / core pages linking to understanding-shoe-width.html (10)

| Page | Location of link |
|------|------------------|
| `brand-sizing-guides.html` | Articles & guides |
| `complete-global-size-chart-guide.html` | Width section + Resources |
| `shoe-size-guides.html` | Hub section |
| `measurement-guides.html` | Hub section |
| `shoe-size-converter.html` | Fit notice / width CTA |
| `cm-to-us-shoe-size.html` | Fit notice |
| `us-to-eu-size.html` | Fit notice |
| `uk-to-us-size.html` | Fit notice |
| `foot-width-guide.html` | Related guides |
| `foot-width-calculator.html` | Footer – Converters |

### Programmatic pages (76)

All shoe conversion pages under `programmatic-pages/` that use the conversion template include a fit notice linking to `understanding-shoe-width.html` (e.g. “Learn how width affects fit →”).

---

## 2. No orphan status ✅

**Result:** **PASS** — Page is linked from multiple hubs, the master pillar, converters, width tools, and programmatic pages. It is included in `sitemaps/sitemap-core.xml`. Not an orphan.

---

## 3. Breadcrumb present ✅

**Result:** **PASS**

- **On-page:** `<nav class="breadcrumbs">` — Home → Shoe Size Guides → Understanding Shoe Width
- **Schema:** `BreadcrumbList` JSON-LD with 3 items (Home, Shoe Size Guides, Understanding Shoe Width)

---

## 4. Schema valid ✅

**Result:** **PASS** — All expected schema blocks present:

| Type | Purpose |
|------|---------|
| `Organization` | Site identity |
| `BreadcrumbList` | Breadcrumb trail |
| `Article` | Page as article (headline, description, datePublished, publisher) |
| `FAQPage` | 8 FAQs (why tight when length right, US width letters, measure at home, size up vs wide, EU/UK width, D width, tight on sides, size up if narrow) |

Can be validated with [Google Rich Results Test](https://search.google.com/test/rich-results) or Schema.org validator.

---

## Summary

| Criterion | Status |
|-----------|--------|
| Linked from ≥8 internal pages | ✅ 86+ |
| No orphan | ✅ |
| Breadcrumb present | ✅ (on-page + BreadcrumbList) |
| Schema valid | ✅ (Organization, BreadcrumbList, Article, FAQPage) |

**Phase 13.5 structural validity for this page:** **PASS**.

---

## Optional follow-ups

- Add `understanding-shoe-width.html` to any other hub “Related” or “Guides” sections if you want more root-level links (already exceeds 8).
- Periodically re-run this audit after adding or removing pages.
