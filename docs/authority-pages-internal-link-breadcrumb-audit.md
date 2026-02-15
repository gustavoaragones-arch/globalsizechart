# Authority Pages: Internal Link Graph & Breadcrumb Audit

**Date:** 2026-02-04  
**Rules:** 15–25 internal links per authority page; cross-links between hubs; links to main converters; links to measurement tools; no orphans; breadcrumb schema on all new pages (Home > Hub > Page).

---

## 1. Brand consistency authority

### `/why-shoe-sizes-vary-by-brand.html`
- **Status:** Exists; E-E-A-T content (lasts, fit models, grading, target markets; “we do not guarantee fit”).
- **Internal links:** 20+ (4 hubs, 5 converters, 4 measurement tools, region systems, printables, width guides, brand pages).
- **Cross-links:** Authority hubs, main converters, measurement tools sections present.
- **Breadcrumb:** Home > Brand Sizing Guides > Why Shoe Sizes Vary by Brand (on-page + BreadcrumbList).
- **Orphan check:** Linked from `brand-sizing-guides.html`, `shoe-size-guides.html`; in sitemap.

---

## 2. Internal link graph (authority pages)

| Page | Hubs | Converters | Measurement tools | Est. total body+footer links |
|------|------|------------|-------------------|-----------------------------|
| international-sizing-system.html | 4 | 5+ | 4+ | 25+ |
| shoe-width-guide.html | 4 | 5 | 4 | 20+ |
| wide-vs-regular-shoes.html | 4 | 5 | 4 | 20+ |
| how-to-measure-foot-width.html | 4 | 5 | 4 | 20+ |
| why-shoe-sizes-vary-by-brand.html | 4 | 5 | 4 | 25+ |

All listed authority pages include:
- Links to all 4 authority hubs (Shoe, Clothing, Brand, Measurement Guides).
- Links to main converters (Shoe, Clothing, CM to US, US to EU, UK to US).
- Links to measurement tools (Foot Measurement Calculator, Foot Width Calculator, Measurement Assistant, Measurement Tools hub).

---

## 3. Breadcrumb structure (new authority pages)

Schema: `BreadcrumbList` JSON-LD. On-page: `<nav class="breadcrumbs">` with same trail.

| Page | Breadcrumb trail |
|------|------------------|
| international-sizing-system.html | Home > Shoe Size Guides > International Sizing System |
| shoe-width-guide.html | Home > Shoe Size Guides > Shoe Width Guide |
| wide-vs-regular-shoes.html | Home > Shoe Size Guides > Wide vs Regular Shoes |
| how-to-measure-foot-width.html | Home > Measurement Guides > How to Measure Foot Width |
| why-shoe-sizes-vary-by-brand.html | Home > Brand Sizing Guides > Why Shoe Sizes Vary by Brand |

Pattern matches requested example: **Home > [Hub] > [Page]**.

---

## 4. Orphan check

All authority pages are:
- Linked from at least one hub (Shoe Size Guides, Brand Sizing Guides, or Measurement Guides).
- Listed in `sitemaps/sitemap-core.xml`.
- Linked from other authority pages (e.g. width cluster ↔ understanding-shoe-width ↔ international-sizing-system).

No authority pages are orphans.
