# Converter Issues Register — Phase 2

Cross-reference: Phase 0 `AUD-*`, Phase 1 `UX-*`.

---

## P0 — Critical

*None confirmed. Core shoe/clothing paths work for majority combinations on hub pages after dependencies are satisfied.*

---

## P1 — High

### CONV-001 — KR and INCH regions offered without dataset

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **File** | `app.js` (`shoeRegionHasDataset`, `handleConversion`); programmatic page templates |
| **Function/selector** | `[name="fromRegion"] option[value="KR"]`, `option[value="INCH"]` |
| **Observed** | Selecting KR shows empty state: "No data available for this region yet." INCH same. |
| **Expected** | Region not offered, or conversion data exists. |
| **Root cause** | `shoe_sizes.json` has no `kr`/`inch` keys; UI still renders options on ~765 programmatic pages. |
| **Evidence** | Browser: `china-to-us-shoe-size.html` KR → empty message; `normalizeShoeRegion('KR')` → `KR`; `sizeDatabase.shoes.men.kr` undefined |
| **Scope** | global template + data |
| **Recommended location** | Remove options from generator template OR add data columns + `buildSizeDatabase` support |
| **Links** | AUD-002, UX-002 |

---

### CONV-002 — Kids UK/JP shoe sizes: all dropdown values fail validation

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **File** | `app.js` |
| **Function** | `validateSize('shoes','kids','UK'|'JP', size)` |
| **Observed** | Kids + JP region + size `17` in dropdown → no results, empty state (browser verified on homepage). |
| **Expected** | Valid dataset sizes convert successfully. |
| **Root cause** | `validateSize` ranges for `kids` omit `UK` and `JP` keys entirely → always returns `false`. |
| **Evidence** | 34 kids UK/JP row-region pairs with `no_range_defined`; browser test kids/JP/17 |
| **Scope** | global |
| **Recommended location** | `validateSize` ranges object ~line 945 |

---

### CONV-003 — validateSize rejects valid dataset sizes (men JP, kids EU/US)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **File** | `app.js` |
| **Function** | `validateSize`, `handleConversion` (shoe path) |
| **Observed** | Sizes appear in `#sizeSelect` but conversion blocked with range error. |
| **Expected** | If size is in `sizeDatabase`, conversion proceeds. |
| **Root cause** | Hardcoded ranges narrower than dataset (e.g. men JP max 32 but data has 33; kids EU max 35 but data has 37.5; kids US max 13 but data has 13.5). |
| **Evidence** | 47 per-size `validateSize` failures in matrix script; men/JP failure on matrix row |
| **Scope** | global |
| **Recommended location** | `validateSize` or remove range check when size came from dataset dropdown |

---

### CONV-004 — Clothing JP/CN dropdown sizes fail validateClothingSize

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **File** | `app.js` |
| **Function** | `validateClothingSize`, `populateSizeOptions`, `getAvailableSizes` |
| **Observed** | Men's tops JP/CN largest option `XXXXL` in dropdown; selecting it would fail validation. |
| **Expected** | Dropdown only offers validatable sizes, or validator accepts data labels. |
| **Root cause** | `validateClothingSize` regex stops at `XXXL`; data uses `XXXXL`/`XXXXXL` for JP/CN. |
| **Evidence** | 12 clothing matrix failures (men/women tops/pants/jackets × JP/CN); `clothing_sizes.json` men tops XXXL row |
| **Scope** | global |
| **Recommended location** | `validateClothingSize` or filter sizes in `buildSizeDatabase` |

---

### CONV-005 — Men's dresses offered on dedicated clothing converter

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **File** | `clothing-size-converter.html`; `data/clothing_sizes.json` |
| **Function/selector** | `#clothingCategory option[value="dresses"]` with `#gender` men |
| **Observed** | Dresses category visible for men; `clothingData.men.dresses` undefined → empty conversion. |
| **Expected** | Dresses hidden for men/kids, or men's dresses data exists. |
| **Root cause** | Static HTML lists all three categories for every gender; no `CLOTHING_TYPES_BY_GENDER` filter on this form. |
| **Evidence** | `clothing_sizes.json` structure; `getAllClothingConversions` returns `{}` for men+dresses |
| **Scope** | page family (dedicated clothing converter + regional clothing pages) |
| **Recommended location** | `clothing-size-converter.html` template or shared form partial |

---

## P2 — Medium

### CONV-006 — Gender-required size gate mistaken for broken converter

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **File** | `app.js`, `index.html`, regional hubs |
| **Function** | `updateMainConverterFieldDisabled`, `effectiveGenderForSizes`, `isMainComboForm` |
| **Observed** | On load: `#sizeSelect` disabled, placeholder "Select gender first". After selecting gender, sizes populate and enable (browser verified men/women/kids). |
| **Expected** | Clear UX that gender is required; or sensible default. |
| **Root cause** | Intentional dependency design on main combo form (`#clothingCategoryGroup` + `[name="category"]`). **Not a code bug** — matches recent field-order spec. |
| **Evidence** | Browser: gender men → 17 shoe sizes; reported "cannot select size" likely before gender chosen |
| **Scope** | 5 pages (homepage + 4 regional hubs) |
| **Recommended location** | UX copy near gender field (Phase 3) |
| **Links** | UX-018 |

---

### CONV-007 — Static reference chart ≠ interactive converter

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **File** | `shoe-size-conversion-chart/index.html` |
| **Component** | `<table class="size-chart-table">` vs `app.js` converter |
| **Observed** | Table: men's scale only, US–CM columns, hardcoded 6–11 rows, **no CN column**. Converter: all genders, CN included, CM-anchor engine, full dataset. |
| **Expected** | Chart and converter agree for overlapping rows. |
| **Root cause** | Chart is static HTML editorial content; converter uses dynamic `sizeDatabase`. |
| **Evidence** | Table lines 184–195; converter CN men 42 → US 9 verified |
| **Scope** | page |
| **Recommended location** | Generate table from data or add disclaimer |

---

### CONV-008 — Inconsistent size input models across page families

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **File** | Multiple HTML templates |
| **Selectors** | `#sizeSelect` (6 pages) vs `input[name="size"]` (programmatic, clothing dedicated) |
| **Observed** | Hubs use dropdown populated from dataset; programmatic uses free text + strict regex validation. |
| **Expected** | Documented intentional difference or unified UX. |
| **Root cause** | Multiple form templates without shared partial. |
| **Evidence** | 6 `#sizeSelect` files; 765 programmatic text inputs |
| **Scope** | family |
| **Recommended location** | Shared converter form component |

---

### CONV-009 — Duplicate change listeners on converter controls

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **File** | `app.js` |
| **Functions** | `initializeConverters` (lines 1058–1060) + `runConverterInit` (597–599 capture listeners) |
| **Observed** | Gender/region/clothing changes fire `runAutoConversion` twice per change. |
| **Expected** | Single handler per event. |
| **Root cause** | Both init paths attach `change` listeners to same selects. |
| **Evidence** | Code review; no user-visible failure observed |
| **Scope** | global |
| **Recommended location** | Consolidate listener registration in `runConverterInit` |

---

### CONV-010 — Kids jackets/skirts in UI map to missing data

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **File** | `app.js` `CLOTHING_TYPES_BY_GENDER` |
| **Observed** | Kids only get tops/pants in UI (correct). Women get skirts→dresses alias. If kids jackets added later, no kids tops alias issue. |
| **Expected** | N/A — currently correct for kids. |
| **Root cause** | — |
| **Scope** | — |
| **Note** | Documented for completeness; not a current failure. |

---

### CONV-011 — getAllShoeConversions US gate

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **File** | `app.js:709-716` |
| **Function** | `getAllShoeConversions` |
| **Observed** | Returns `{}` if US conversion null and from region ≠ cm. |
| **Expected** | Return partial regional results if possible. |
| **Root cause** | Defensive guard `hasUs` before populating results. |
| **Evidence** | Code path; no failure found for standard regions in matrix |
| **Scope** | global |
| **Recommended location** | `getAllShoeConversions` |

---

## P3 — Low

### CONV-012 — China conversion reported failure NOT reproduced

| Field | Value |
|-------|-------|
| **Priority** | P3 (informational) |
| **File** | `app.js`, `data/shoe_sizes.json` |
| **Observed** | CN men 42 → US 9, EU 42, CM 27 (browser + matrix). |
| **Expected** | — |
| **Root cause** | Prior bug likely fixed; or confusion with KR/INCH/validation issues. |
| **Evidence** | Browser homepage CN/42; matrix CN spot checks |
| **Scope** | — |

---

### CONV-013 — Embedded/fetch data dual maintenance

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **File** | `app.js` lines 6–174 |
| **Observed** | Full datasets duplicated inline and in JSON files. |
| **Root cause** | Offline-first deployment pattern. |
| **Scope** | global |
| **Recommended location** | Build step to inject JSON into bundle |

---

## Summary counts

| Priority | Count |
|----------|------:|
| P0 | 0 |
| P1 | 5 |
| P2 | 5 |
| P3 | 2 |
