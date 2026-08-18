# SEO & AEO Findings

**Principle applied:** SEO/AEO must not justify confusing or low-value UX. Issues flagged where structured data or content blocks harm clarity or trust.

---

## Crawlability & indexation

| Item | Status | Evidence |
|------|--------|----------|
| robots.txt | PASS | Allows `/`, lists sitemap |
| Sitemap index | PASS | `sitemap.xml` → 4 child sitemaps |
| Canonical tags | PASS | Present on sampled programmatic pages |
| noindex longtail | PASS (if intentional) | 35 kids CM pages |
| GSC coverage | EXTERNAL VERIFICATION REQUIRED | — |

---

## On-page SEO basics

| Item | Status | Notes |
|------|--------|-------|
| Unique `<title>` per page | PASS | Contextual on programmatic pages |
| Meta description | PASS | Present |
| H1 per page | PASS | Hero-tool pages: single clear H1 |
| Heading hierarchy | NEEDS WORK | Duplicate H2 FAQ sections |
| Internal links | FAIL | 779 broken Quick Converter URLs hurt crawl equity and UX |

---

## Structured data

### Density on programmatic pages

**Status:** NEEDS WORK (P2)

Example `programmatic-pages/china-to-us-shoe-size.html` includes:
- Organization (standard + authority duplicate)
- WebSite
- WebPage (duplicate variants)
- BreadcrumbList
- FAQPage
- HowTo
- Article
- QAPage
- SoftwareApplication
- ItemList ×2 (related conversions + product examples)

**Concerns:**
1. Redundant Organization/WebPage nodes
2. QAPage + FAQPage + Article overlapping same Q&A
3. Product ItemList with generic Nike/Adidas references — may not match visible page content closely

### Placeholder sameAs

**Status:** FAIL (P1 — AUD-003)

`REPLACE_WITH_YOUR_REDDIT_USERNAME` on ~1,148 pages

### Irrelevant FAQ on legal pages

**Status:** NEEDS WORK (P2 — AUD-010)

Privacy page FAQ schema about shoe sizes — unrelated to page topic

---

## AEO (AI answer optimization) blocks

| Block | Pages | User value | SEO risk |
|-------|------:|------------|----------|
| `why-vary-cards` | 1,017 | Medium-high | Low if kept concise |
| `ai-faq-block` | ~100+ hubs/editorial | Low (generic) | Medium |
| Quick answer | 109 | Low without question | Medium |
| JSON-LD FAQ | Most programmatic | Medium | Low if matches visible FAQ |

**Verdict:** AEO layer on programmatic pages is **partially useful** (structured how-to + FAQ matching converter). Editorial duplicate FAQ pattern is **not useful**.

---

## Search intent alignment

**Status:** PASS

Programmatic URLs match transactional conversion queries (e.g. china-to-us-shoe-size). Page delivers converter above fold on hero-tool pages.

---

## Spam / scaled content policy

**Status:** NEEDS WORK

~765 similar programmatic templates with shared modules. Mitigations observed:
- Unique titles, prefilled converter state, breadcrumbs
- noindex on thinnest kids longtail subset

**EXTERNAL VERIFICATION REQUIRED:** Index coverage ratio, manual actions, crawl budget in GSC.

---

## Internationalization

**Status:** N/A

- `lang="en"` only
- No hreflang

---

## Open Graph / Twitter

**Status:** NEEDS WORK

- Homepage has OG/Twitter tags
- Many inner/programmatic pages lack OG tags

**Priority:** P3 — nice for sharing, not blocking conversion

---

## Backlinks

**Status:** EXTERNAL VERIFICATION REQUIRED

No backlink data in repository.

---

## Search Console technical readiness checklist

| Check | Status |
|-------|--------|
| Property verified | EXTERNAL VERIFICATION REQUIRED |
| Sitemap submitted | EXTERNAL VERIFICATION REQUIRED |
| HTTPS valid | EXTERNAL VERIFICATION REQUIRED |
| Mobile usability report | EXTERNAL VERIFICATION REQUIRED |
| Rich results status for FAQ | EXTERNAL VERIFICATION REQUIRED |
| Core Web Vitals | EXTERNAL VERIFICATION REQUIRED |

---

## Recommended SEO priorities (future — not implemented)

1. Fix broken internal links (P1) before any content expansion
2. Remove/fix placeholder schema (P1)
3. Consolidate JSON-LD on programmatic template (P2)
4. Merge duplicate FAQ sections (P1)
5. Audit indexed vs noindex strategy in GSC (external)
