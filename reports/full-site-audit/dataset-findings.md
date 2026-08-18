# Dataset Findings — Phase 2

**Audit date:** 2026-08-16  
**Method:** JSON schema inspection, `app.js` embedded data parity check, `buildSizeDatabase()` trace  
**Scope:** Read-only — no data or code modified

---

## 1. Dataset inventory

| File | Purpose | Loaded by |
|------|---------|-----------|
| `data/shoe_sizes.json` | Shoe conversion rows | `app.js` `loadData()` (fetch) + `embeddedShoeData` (fallback) |
| `data/clothing_sizes.json` | Clothing conversion rows | `loadData()` + `embeddedClothingData` |
| `data/regions.json` | Region metadata (6 regions) | `loadData()` + `embeddedRegionsData` |
| `data/brands.json` | Brand fit overrides (clothing) | `loadData()` + `embeddedBrandsData` |
| `data/programmatic_routes.json` | Page generator routes | Generators only — not runtime converter |
| `data/clothing_routes.json` | Clothing page routes | Generators only |
| `data/measurement_routes.json` | Measurement page routes | Generators only |
| `data/commercial_intent.json` | SEO/monetization config | Not converter path |

**Runtime source of truth:** `app.js` loads embedded data immediately, then optionally replaces with fetched JSON if HTTP succeeds. Embedded and JSON files are **byte-identical** for shoe/clothing at audit time.

---

## 2. Shoe dataset schema

### Top-level keys (gender)

| Key | Rows | Status |
|-----|-----:|--------|
| `men` | 17 | Present |
| `women` | 17 | Present |
| `kids` | 17 | Present |

### Row object keys (canonical)

| Key | Type | Role |
|-----|------|------|
| `us` | number | US size |
| `uk` | number | UK size |
| `eu` | number | EU size |
| `jp` | number | Japan size (cm-based label) |
| `cn` | number | China size |
| `cm` | number | Foot length anchor (universal) |

### Regions **in data**

`us`, `uk`, `eu`, `jp`, `cn`, `cm` — all genders.

### Regions **in UI but NOT in data**

| UI value | Normalized | Dataset key | Status |
|----------|------------|-------------|--------|
| `KR` | `KR` | *(none)* | **Missing** — 765 programmatic pages |
| `INCH` | `INCH` | *(none)* | **Missing** — 765 programmatic pages |

### Missing combinations

- No `kr` or `inch` columns in any shoe row.
- Kids dataset includes US sizes 10–13.5 then 1–5 (toddler/youth mix) — all regions populated per row.
- No explicit "width" dimension in shoe data.

### Normalization (`app.js`)

- `normalizeShoeRegion()` — maps labels and codes to uppercase `US|UK|EU|JP|CN|CM|KR|INCH`
- `buildSizeDatabase()` — lowercases region keys: `db.shoes[gender][rk].sizes = [{value, cm}]`
- `shoeRegionHasDataset()` — checks `sizeDatabase.shoes[gender][regionLower].sizes.length`

---

## 3. Clothing dataset schema

### Structure

```
clothing_sizes.json
├── men: { tops[], pants[] }
├── women: { tops[], pants[], dresses[] }
└── kids: { tops[], pants[] }
```

### Row object keys

| Key | Type | Notes |
|-----|------|-------|
| `us`, `uk`, `eu`, `jp`, `cn` | string | Regional size label |
| `chest_cm`, `waist_cm`, `hips_cm` | number | Body measurements; `0` on pants rows for chest |

### Garment types in data vs UI

| UI label (`clothingCategory`) | Data key (`resolveClothingDataKey`) | men | women | kids |
|-------------------------------|-------------------------------------|:---:|:-----:|:----:|
| `tops` | `tops` | ✓ | ✓ | ✓ |
| `pants` | `pants` | ✓ | ✓ | ✓ |
| `dresses` | `dresses` | **✗** | ✓ | **✗** |
| `jackets` | `tops` (alias) | ✓ | ✓ | **✗** |
| `skirts` | `dresses` (alias) | **✗** | ✓ | **✗** |

`CLOTHING_TYPES_BY_GENDER` in `app.js` correctly limits homepage combo options. **`clothing-size-converter.html` hardcodes `dresses` for all genders** — dataset gap for men/kids.

### Clothing regions

Data and UI: `US`, `UK`, `EU`, `JP`, `CN` only. No `CM` in clothing size rows (measurements returned as `chest_cm` etc. on US result card).

### JP/CN label anomalies (data truth, validation mismatch)

Men's tops row for US `XXXL` maps to JP `XXXXL`, CN `XXXXL`.  
Men's pants largest sizes map to JP/CN `XXXXXL`.  
These values exist in **data** and appear in **dropdowns** but fail `validateClothingSize()` regex (max `XXXL`).

---

## 4. Brands dataset (`data/brands.json`)

| Category | men | women | kids |
|----------|-----|-------|------|
| tops | Nike, Uniqlo | Zara, H&M, Nike, Uniqlo | [] |
| pants | Levi's, Wrangler | H&M, Uniqlo | [] |
| dresses | [] | Zara, H&M | [] |

Used only on `clothing-size-converter.html` and pages with `#brand` select. `adjustClothingSizeForBrand()` shifts one row on chart — does not change underlying JSON.

---

## 5. Regions metadata (`data/regions.json`)

Six entries: `US`, `UK`, `EU`, `JP`, `CN`, `CM`. Informational only — not used for conversion lookup.

---

## 6. Validation vs dataset alignment gaps

### `validateSize()` (`app.js:925-958`) — shoes only

| Gender | Regions with ranges defined | Regions in dataset but **no range** |
|--------|----------------------------|-------------------------------------|
| men | US, UK, EU, JP, CN, CM | — |
| women | US, UK, EU, JP, CN, CM | — |
| kids | US, EU, CN, CM | **UK, JP** |

**Per-size failures (dataset has value, `validateSize` rejects):** 47 row-region pairs, including:
- men JP `32.5`, `33` (range max 32)
- kids US `13.5` (range max 13)
- kids EU `35.5`–`37.5` (range max 35)
- kids UK/JP **all 17 sizes** (no range object)

### `validateClothingSize()` (`app.js:974-980`)

Accepts: `XS`–`XXXL` or pure digits.  
Rejects: `XXXXL`, `XXXXXL` (present in JP/CN columns for larger rows).

---

## 7. Embedded vs external data

| Concern | Finding |
|---------|---------|
| Drift risk | Embedded copy in `app.js` must be manually synced with `data/*.json` |
| Fetch failure | Silent — embedded data used (acceptable) |
| Generator alignment | `generate-programmatic-pages.js` reads same JSON files |

---

## 8. Measurement pages

Separate from main datasets — static HTML embeds computed answers (e.g. `27 cm → Men's US 9`). Not driven by `sizeDatabase` at runtime on those pages.

---

## Related

- [converter-findings.md](./converter-findings.md) — architecture & flow  
- [converter-matrix.md](./converter-matrix.md) — combination test results  
- [converter-issues.md](./converter-issues.md) — defect register
