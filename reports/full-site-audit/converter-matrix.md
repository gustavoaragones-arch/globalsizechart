# Converter Test Matrix — Phase 2

**Generated:** 2026-08-16  
**Machine-readable:** [converter-matrix.json](./converter-matrix.json) (74 summary rows + failure detail)  
**Method:** Node script replicating `app.js` `buildSizeDatabase`, `getAvailableSizes`, `getAllShoeConversions`, `getAllClothingConversions`, `validateSize`, `validateClothingSize`

---

## Matrix dimensions

### Shoes (24 rows = 3 genders × 8 UI regions)

Genders: `men`, `women`, `kids`  
Regions: `US`, `UK`, `EU`, `JP`, `CN`, `CM`, `KR`, `INCH`

### Clothing (50 rows = gender-specific types × 5 regions)

| Gender | UI types tested | Data keys |
|--------|-----------------|-----------|
| men | tops, pants, jackets | tops, pants, tops |
| women | tops, pants, dresses, skirts, jackets | tops, pants, dresses, dresses, tops |
| kids | tops, pants | tops, pants |

Regions: `US`, `UK`, `EU`, `JP`, `CN`

---

## Summary results

| Status | Count | Meaning |
|--------|------:|---------|
| **pass** | 57 | Sizes populate; sample conversions succeed; validation passes |
| **expected_no_data** | 6 | KR/INCH — no dataset (expected gap, still UX failure) |
| **fail_validateSize** | 5 | Shoe sizes in dropdown fail `validateSize` |
| **fail_validation** | 12 | Clothing JP/CN labels fail `validateClothingSize` |

**Total failures:** 17 of 74 combination summaries (23%)

---

## Shoe matrix

| Gender | Region | Dataset | Size count | Dropdown | Conversion | Validation | Status |
|--------|--------|:-------:|-----------:|:--------:|:----------:|:----------:|--------|
| men | US | ✓ | 17 | enabled | ✓ | ✓ | pass |
| men | UK | ✓ | 17 | enabled | ✓ | ✓ | pass |
| men | EU | ✓ | 17 | enabled | ✓ | ✓ | pass |
| men | JP | ✓ | 17 | enabled | ✓ | **partial** | **fail_validateSize** (sizes 32.5, 33) |
| men | CN | ✓ | 17 | enabled | ✓ | ✓ | pass |
| men | CM | ✓ | 17 | enabled | ✓ | ✓ | pass |
| men | KR | ✗ | 0 | empty | ✗ | — | expected_no_data |
| men | INCH | ✗ | 0 | empty | ✗ | — | expected_no_data |
| women | US–CM | ✓ | 17 | enabled | ✓ | ✓ | pass |
| women | KR/INCH | ✗ | 0 | empty | ✗ | — | expected_no_data |
| kids | US | ✓ | 17 | enabled | ✓ | **partial** | **fail_validateSize** (13.5) |
| kids | UK | ✓ | 17 | enabled | ✓ | **all fail** | **fail_validateSize** |
| kids | EU | ✓ | 17 | enabled | ✓ | **partial** | **fail_validateSize** (35.5–37.5) |
| kids | JP | ✓ | 17 | enabled | ✓ | **all fail** | **fail_validateSize** |
| kids | CN | ✓ | 17 | enabled | ✓ | ✓ | pass |
| kids | CM | ✓ | 17 | enabled | ✓ | **partial** | **fail_validateSize** (24.5) |
| kids | KR/INCH | ✗ | 0 | empty | ✗ | — | expected_no_data |

---

## Clothing matrix (failures only)

| Gender | Type | Data key | Region | Size count | Issue |
|--------|------|----------|--------|----------:|-------|
| men | tops | tops | JP, CN | 7 | `XXXXL` fails `validateClothingSize` |
| men | pants | pants | JP, CN | 8 | `XXXXXL` fails validation |
| men | jackets | tops | JP, CN | 7 | same as tops |
| women | tops | tops | JP, CN | 7 | `XXXXL` fails |
| women | pants | pants | JP, CN | 8 | `XXXXXL` fails |
| women | jackets | tops | JP, CN | 7 | `XXXXL` fails |

**All other clothing combinations (38 rows):** pass — sizes populate, US/EU/UK samples convert.

### Additional manual checks (not in 74-row grid)

| category | gender | clothingType | region | size | result | status |
|----------|--------|--------------|--------|------|--------|--------|
| clothing | men | dresses | US | M | no data key | **fail** (CONV-005) |
| clothing | men | skirts | US | — | N/A on dedicated converter | UI on homepage women only |
| shoes | men | — | CN | 42 | US 9, EU 42, CM 27 | **pass** (browser) |
| shoes | kids | — | JP | 17 | empty results | **fail** (browser, CONV-002) |

---

## Per-size validation failure inventory (shoes)

**47 dataset values** fail `validateSize` when selected from dropdown path:

| Gender | Region | Failing sizes (examples) |
|--------|--------|--------------------------|
| men | JP | 32.5, 33 |
| kids | US | 13.5 |
| kids | UK | **all 17 sizes** (no range defined) |
| kids | EU | 35.5, 36, 36.5, 37, 37.5 |
| kids | JP | **all 17 sizes** (no range defined) |
| kids | CM | 24.5 |

---

## Row schema (machine-readable)

Each entry in `converter-matrix.json`:

```json
{
  "category": "shoes|clothing",
  "gender": "men|women|kids",
  "clothingType": null | "tops|pants|...",
  "region": "US|UK|...",
  "expectedDataset": true,
  "actualDataset": true,
  "sizeCount": 17,
  "sizeDropdownState": "enabled|disabled_or_empty|empty",
  "resultState": "has_results|empty|N/A",
  "status": "pass|fail_validateSize|fail_validation|expected_no_data|...",
  "issues": ["..."]
}
```

---

## Form-family runtime matrix (browser)

| Page | Gender gate | Size control | CN shoes | Clothing |
|------|-------------|--------------|----------|----------|
| `/index.html` | Required (empty default) | Dropdown | ✓ | ✓ (after type select) |
| `/us/index.html` | Required | Dropdown | ✓ | ✓ |
| `/shoe-size-conversion-chart/` | Default men | Dropdown | ✓ | N/A |
| `/programmatic-pages/china-to-us-shoe-size.html` | Default men | Text input | ✓ | N/A |
| `/clothing-size-converter.html` | Default men | Text input | N/A | ✓ tops/pants; ✗ men dresses |

---

## Related

- [converter-findings.md](./converter-findings.md)
- [converter-issues.md](./converter-issues.md)
- [dataset-findings.md](./dataset-findings.md)
