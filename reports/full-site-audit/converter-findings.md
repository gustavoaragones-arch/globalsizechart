# Converter Findings — Phase 2 Forensic Audit

**Audit date:** 2026-08-16  
**Method:** `app.js` trace, dataset replication, 74-combination matrix, browser verification (localhost:5190)  
**Principle:** Chart rendering ≠ converter correctness

---

## Executive summary

The converter **core engine is sound**: CM-anchor shoe conversion and row-lookup clothing conversion work when validation passes. **Failures cluster around validation/dataset mismatches**, not missing conversion math.

| Area | Verdict |
|------|---------|
| Shoe conversion math | **PASS** |
| Clothing conversion math | **PASS** (when data exists) |
| Data ↔ UI region alignment | **FAIL** (KR, INCH) |
| Validation ↔ dataset alignment | **FAIL** (kids UK/JP, JP/CN clothing labels) |
| Recent gender dependency change | **PASS** (functional; UX friction only) |
| Chart vs converter | **MISMATCH** (static partial table) |

---

## 1. Converter architecture

```
HTML form (.converter-form)
    │
    ├─ isMainComboForm? (#clothingCategoryGroup + [name="category"])
    │     YES → Category / Gender / Clothing Type / Region / #sizeSelect
    │     NO  → Gender / Region / #sizeSelect OR input[name="size"]
    │
    ▼
runConverterInit() [DOMContentLoaded]
    │
    ├─ loadData() → shoeData, clothingData, regionsData, brandsData
    ├─ buildSizeDatabase() → sizeDatabase { shoes, clothing }
    ├─ applyRegionalDefault() → path-based fromRegion
    ├─ initializeConverters() → submit preventDefault, generic select/input listeners
    └─ Per-form setup:
          rebuildClothingTypeOptions()
          updateMainConverterFieldDisabled()
          populateSizeOptions()
          gender/region/clothing change → populateSizeOptions + runAutoConversion

User change / submit
    ▼
runAutoConversion(form)
    ▼
handleConversion(form)
    ├─ Guards: dataLoaded, gender, clothingCategory, shoeRegionHasDataset
    ├─ validateShoeSize + validateSize (shoes)
    ├─ validateClothingSize (clothing)
    ├─ getAllShoeConversions() OR getAllClothingConversions()
    └─ displayResults() → .results-grid result cards
```

### Form variants (site-wide)

| Variant | Pages | Size control | Category toggle |
|---------|------:|--------------|-----------------|
| Main combo | 5 (`index`, `us`, `uk`, `eu`, `ca`) | `#sizeSelect` dropdown | Yes |
| Shoe-only hub | 1 (`shoe-size-conversion-chart`) | `#sizeSelect` | Hidden shoes |
| Programmatic shoe | ~765 | `input[name="size"]` text | Hidden shoes |
| Dedicated clothing | 1+ regional | `input[name="size"]` text | Hidden clothing |
| Dedicated shoe | `shoe-size-converter.html` | varies | — |

---

## 2. Dependency logic (field order change)

### Intended chain (main combo)

```
category → (show/hide clothing type, hide CM for clothing)
gender → rebuild clothing types, enable size when set
clothingCategory → enable size when set (clothing only)
fromRegion → repopulate size options
size → convert
```

### Key functions

| Function | Role |
|----------|------|
| `isMainComboForm(form)` | Detects homepage/regional hub forms |
| `effectiveGenderForSizes(form)` | Returns `''` if gender empty on combo form; else defaults `'men'` on shoe-only forms |
| `rebuildClothingTypeOptions(form)` | Fills `#clothingCategory` from `CLOTHING_TYPES_BY_GENDER` |
| `updateMainConverterFieldDisabled(form)` | Disables size until gender (+ clothing type for clothing) |
| `populateSizeOptions(form)` | Clears size, loads from `getAvailableSizes()` |
| `syncMainConverterForm` | Orchestrates rebuild + disabled states |

### Event order

1. `category` change → `initializeCategoryToggle` → clear clothing + size → rebuild types → populate sizes
2. `gender` change (capture) → clear clothing category + size → rebuild types → populate sizes → convert
3. `fromRegion` / `clothingCategory` change (capture) → clear size → populate → convert
4. **Also:** `initializeConverters` attaches generic `change` on all selects → **duplicate** `runAutoConversion` calls

### Recent regression assessment

| Reported failure | Current behavior | Verdict |
|------------------|------------------|---------|
| Men/Women/Kids → size cannot be selected | Size disabled **until gender chosen**; after selection, 17 options appear | **By design** — not broken (CONV-006) |
| China region fails | CN 42 → full conversion | **Not reproduced** (CONV-012) |
| Clothing no garment | Homepage clothing men/tops/M works; dedicated page men+dresses fails | **Partial** — CONV-005 |
| Invalid combinations selectable | KR/INCH selectable on programmatic pages | **Still broken** — CONV-001 |

**Conclusion:** The field-order dependency implementation **did not introduce a race/order bug** for standard shoe paths. Remaining failures are **validation gaps** and **missing datasets**, not stale state from repopulation timing.

---

## 3. Region normalization table

| Display label (HTML) | `option` value | `normalizeShoeRegion()` | `sizeDatabase` key | Dataset row key | Works? |
|----------------------|----------------|-------------------------|-------------------|-----------------|--------|
| United States (US) | `US` | `US` | `us` | `us` | **Yes** |
| United States / Canada (US) | `US` | `US` | `us` | `us` | **Yes** |
| United Kingdom (UK) | `UK` | `UK` | `uk` | `uk` | **Yes** (kids: validation fails) |
| European Union (EU) | `EU` | `EU` | `eu` | `eu` | **Yes** (kids upper EU fails validation) |
| Japan (JP) | `JP` | `JP` | `jp` | `jp` | **Yes** (men max JP; kids all fail validation) |
| China (CN) | `CN` | `CN` | `cn` | `cn` | **Yes** |
| Centimeters (CM) | `CM` | `CM` | `cm` | `cm` | **Yes** (shoes only; hidden for clothing on combo form) |
| Korea (KR) | `KR` | `KR` | *(none)* | *(none)* | **No** |
| Inch | `INCH` | `INCH` | *(none)* | *(none)* | **No** |

Clothing uses same `normalizeShoeRegion` for `fromRegion` but looks up `sizeDatabase.clothing[gender][dataKey][regionUppercase]` — keys `US`, `UK`, etc.

---

## 4. Size population (`populateSizeOptions`)

**Inputs:** category, gender (`effectiveGenderForSizes`), region (`normalizeShoeRegion`), clothingCategory

**Filtering:**
- Shoes: `sizeDatabase.shoes[gender][regionLower].sizes`
- Clothing: `sizeDatabase.clothing[gender][resolveClothingDataKey(ui)][regionUpper]`

**Empty dropdown causes:**
1. Gender empty on combo form → placeholder "Select gender first"
2. Clothing category empty → "Select clothing type first"
3. No dataset for region (KR/INCH) → empty list (programmatic text input still allows typing)
4. No clothing data key (men+dresses) → empty list + `NO_SIZES_COMBO_MSG`

---

## 5. Result calculation path

### Shoes

```
selectedValue + fromRegion + gender
  → normalizeShoeRegion → lowercase
  → find row in sizeDatabase → cm anchor
  → closest match per target region (convertSize)
  → getAllShoeConversions → { us, uk, eu, jp, cn, cm }
  → displayResults (skips nulls; adds CM card if results.cm)
```

### Clothing

```
size + fromRegion + gender + clothingCategoryUi
  → resolveClothingDataKey (jackets→tops, skirts→dresses)
  → find matching row in clothingData[gender][category]
  → return all regional columns + _cm fields
  → displayResults (shows chest/waist on US card only)
```

---

## 6. Chart vs converter

| Aspect | Static chart (`shoe-size-conversion-chart`) | Interactive converter |
|--------|---------------------------------------------|----------------------|
| Data source | Hardcoded HTML `<td>` cells | `embeddedShoeData` / JSON |
| Gender | Men's only (stated in copy) | men/women/kids |
| CN column | **Absent** | Present |
| Rows | US 6–11 only (partial) | Full 17-row scale per gender |
| Conversion method | None (display only) | CM-anchor closest match |
| Can work while converter fails? | **Yes** — chart doesn't run validation or JS |

---

## 7. Browser verification summary

| Test | Result |
|------|--------|
| Homepage shoes men US 9 | 6 region cards rendered |
| Homepage shoes men CN 42 | US 9, EU 42, CM 27 |
| Homepage clothing men tops M | 5 region cards |
| Homepage kids shoes JP 17 | Empty (validateSize) |
| Programmatic KR region | "No data available for this region yet." |
| Gender → size enable | Works after gender selected |

---

## 8. Recommended implementation order (not executed)

1. **CONV-002/003** — Fix or bypass `validateSize` for dataset-sourced dropdown values (unblocks kids UK/JP/EU edge sizes)
2. **CONV-001** — Remove KR/INCH from programmatic templates or add data
3. **CONV-004** — Extend `validateClothingSize` or filter JP/CN dropdown labels
4. **CONV-005** — Gender-filter clothing categories on dedicated converter pages
5. **CONV-009** — Deduplicate event listeners
6. **CONV-007** — Align static chart with dataset or label as partial reference
7. **CONV-008** — Long-term form partial unification

---

## Related documents

- [dataset-findings.md](./dataset-findings.md)
- [converter-matrix.md](./converter-matrix.md)
- [converter-issues.md](./converter-issues.md)
- Machine-readable matrix: [converter-matrix.json](./converter-matrix.json)
