# Data Findings

## Data sources

| File | Purpose | Records |
|------|---------|---------|
| `data/shoe_sizes.json` | Shoe size rows by gender | men, women, kids arrays |
| `data/clothing_sizes.json` | Clothing size rows | men/women/kids × tops/pants/dresses |
| `data/programmatic_routes.json` | Route definitions for generator | (config for page generation) |
| `config/` | Additional generation config | Referenced by generators |

---

## Shoe data model

**Status:** PASS for core regions

**Row keys (verified):** `us`, `uk`, `eu`, `jp`, `cn`, `cm`

**Sample men CN coverage:** 17 distinct CN sizes (39–47 range with half sizes)

**China fix verification (static):**
- `buildSizeDatabase()` maps `cn` field → `db.shoes[gender].cn`
- `normalizeShoeRegion('CN'|'China'|'China (CN)')` → `CN`
- `validateSize` includes CN ranges for men/women/kids (`app.js:934-948`)

**Simulation:** CN men size 42 → found in dataset, `validateSize` returns true

---

## Shoe data gaps

| Region in UI | In JSON | Status |
|--------------|---------|--------|
| US, UK, EU, JP, CN, CM | Yes | PASS |
| KR (Korea) | No | **FAIL** (AUD-002) |
| INCH | No | **FAIL** (AUD-002) |

**Impact:** Forms on programmatic pages expose KR and INCH; `shoeRegionHasDataset` returns false → empty state.

**Scope:** E — data layer + B — templates that render region `<select>`

---

## Clothing data model

**Status:** PASS

**Structure:** Nested by gender → category (tops/pants/dresses) → array of row objects with regional keys and `_cm` measurements.

**UI mapping (`app.js`):**
- `jackets` → `tops` data key
- `skirts` → `dresses` data key
- `CLOTHING_TYPES_BY_GENDER` limits choices per gender (shoes removed from clothing types)

**Kids data:** Present in JSON; verify kids clothing pages in Phase 2.

---

## Validation logic

### Shoes (`validateSize`, `validateShoeSize`)

- Numeric only for shoe input on programmatic pages (regex `^\d+(\.\d+)?$`)
- Range validation per gender/region — **kids missing UK/JP in ranges object** (may reject valid kids UK/JP if those regions used)

**Status:** NEEDS WORK — verify kids UK/JP paths in browser

### Clothing (`validateClothingSize`)

- Letters XS–XXXL or numeric

---

## Brand override scaffold

`app.js` `buildSizeDatabase` includes `db.brands` scaffold for Nike/Adidas — **not used in conversion path yet**.

**Status:** N/A (future feature)

---

## Data ↔ generator alignment

`scripts/generate-programmatic-pages.js` reads same JSON files as `app.js` — **single source of truth** for sizes if pages are regenerated after data updates.

**Risk:** Static HTML pages embed prefilled form values at generation time; data updates require regeneration to sync prefills.

---

## Measurement pages

Use derived conversion logic from measurements (waist/chest/cm) — separate from main `shoe_sizes.json` row lookup.

**Status:** EXTERNAL VERIFICATION REQUIRED for accuracy sampling in Phase 2.

---

## Recommendations (future, not implemented)

1. Add `kr` column to shoe rows OR remove KR from all `<select>` elements
2. Document INCH as derived from CM or remove option
3. Extend `validateSize` kids ranges for UK/JP if those regions are offered in kids forms
4. Version stamp data files in footer or methodology page for transparency
