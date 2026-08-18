# Validator Output Summary

Read-only commands executed during audit (2026-08-16).

---

## 1. Footer check

```bash
npm run footer:check
```

**Exit code:** 0

```
Checked 1152 HTML files (skipped 1 without <body>).
OK: all footers match master.
```

**Status:** PASS

---

## 2. Content quality audit

```bash
node scripts/content-quality-audit.js
```

**Exit code:** 0

**Summary (tail output):**
```json
{
  "avg_quality_score": 98,
  "avg_word_count": 1278,
  "min_quality_score": 48,
  "max_quality_score": 100
}
```

**Pages below approval threshold (score < 55):** 1
- `measurement/index.html` — score **48**

**Status:** PASS (with 1 outlier)

---

## 3. AdSense policy checker

```bash
node scripts/adsense-policy-checker.js
```

**Exit code:** 0

```
WARN [measurement/index.html] Thin page: 42 words (minimum 200)
--- 1 warning(s) across 1030 file(s) ---
Summary: {
  "total_warnings": 1,
  "compliant": 1029
}
```

**Status:** PASS (1 thin-page warning)

---

## 4. Prebuild link validation

```bash
node scripts/prebuild-link-validation.js
```

**Exit code:** 0 (prints BUILD BLOCKED message; script may not set non-zero exit)

```
BUILD BLOCKED — Missing Programmatic Pages Detected
Missing targets: 52 (threshold: 10)
```

**Notable targets:**
- `tools/shoe-size-converter.html` — **file does not exist**
- `tools/clothing-size-converter.html` — **file does not exist**
- `knowledge/.html` — false positive (`knowledge/index.html` exists)
- `measurement/.html` — false positive (`measurement/index.html` exists)

**Status:** NEEDS WORK

---

## 5. HTML inventory counts

```bash
find . -name '*.html' -not -path './node_modules/*' | wc -l
# → 1172

rg -l 'class="hero-tool"' --glob '*.html' | wc -l
# → 778

rg -l '/tools/shoe-size-converter.html' --glob '*.html' | wc -l
# → 779

rg -l 'REPLACE_WITH_YOUR' --glob '*.html' | wc -l
# → 1148

rg -l 'noindex' --glob '*.html' | wc -l
# → 35
```

---

## 6. Custom repository scans (Node one-liners)

**Duplicate FAQ (Common questions + Frequently Asked Questions on same page):** 100

**Quick answer pages:** 109

**why-vary short stub pages:** 112

**why-vary-cards pages:** 1017

**Shoe data CN simulation:** CN men size 42 — dataset hit, validateSize true

---

## Commands NOT run (may modify repo or require network)

| Command | Reason |
|---------|--------|
| `npm run build:sitemaps` | Modifies sitemap files |
| `npm run footer:standardize` | Modifies HTML |
| `npm run migrate:hero-tool` | Modifies HTML |
| `npm run build:cf` | Modifies headers/assets |
| Lighthouse / PageSpeed | EXTERNAL — requires live URL |
| W3C validator | Not run (time); optional Phase 2 |

---

## 7. Browser / production

**Not executed in this audit phase.**

See [remediation-roadmap.md](./remediation-roadmap.md) Phase 2.
