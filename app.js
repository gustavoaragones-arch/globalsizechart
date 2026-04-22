// ============================================
// GlobalSizeChart.com - Conversion Logic
// ============================================

// Embedded data - works both locally and when deployed
const embeddedShoeData = {
  "men": [
    {"us": 6, "uk": 5, "eu": 39, "jp": 25, "cn": 39, "cm": 24.0},
    {"us": 6.5, "uk": 5.5, "eu": 39.5, "jp": 25.5, "cn": 39.5, "cm": 24.5},
    {"us": 7, "uk": 6, "eu": 40, "jp": 26, "cn": 40, "cm": 25.0},
    {"us": 7.5, "uk": 6.5, "eu": 40.5, "jp": 26.5, "cn": 40.5, "cm": 25.5},
    {"us": 8, "uk": 7, "eu": 41, "jp": 27, "cn": 41, "cm": 26.0},
    {"us": 8.5, "uk": 7.5, "eu": 41.5, "jp": 27.5, "cn": 41.5, "cm": 26.5},
    {"us": 9, "uk": 8, "eu": 42, "jp": 28, "cn": 42, "cm": 27.0},
    {"us": 9.5, "uk": 8.5, "eu": 42.5, "jp": 28.5, "cn": 42.5, "cm": 27.5},
    {"us": 10, "uk": 9, "eu": 43, "jp": 29, "cn": 43, "cm": 28.0},
    {"us": 10.5, "uk": 9.5, "eu": 43.5, "jp": 29.5, "cn": 43.5, "cm": 28.5},
    {"us": 11, "uk": 10, "eu": 44, "jp": 30, "cn": 44, "cm": 29.0},
    {"us": 11.5, "uk": 10.5, "eu": 44.5, "jp": 30.5, "cn": 44.5, "cm": 29.5},
    {"us": 12, "uk": 11, "eu": 45, "jp": 31, "cn": 45, "cm": 30.0},
    {"us": 12.5, "uk": 11.5, "eu": 45.5, "jp": 31.5, "cn": 45.5, "cm": 30.5},
    {"us": 13, "uk": 12, "eu": 46, "jp": 32, "cn": 46, "cm": 31.0},
    {"us": 13.5, "uk": 12.5, "eu": 46.5, "jp": 32.5, "cn": 46.5, "cm": 31.5},
    {"us": 14, "uk": 13, "eu": 47, "jp": 33, "cn": 47, "cm": 32.0}
  ],
  "women": [
    {"us": 4, "uk": 2, "eu": 35, "jp": 22, "cn": 35, "cm": 21.0},
    {"us": 4.5, "uk": 2.5, "eu": 35.5, "jp": 22.5, "cn": 35.5, "cm": 21.5},
    {"us": 5, "uk": 3, "eu": 36, "jp": 23, "cn": 36, "cm": 22.0},
    {"us": 5.5, "uk": 3.5, "eu": 36.5, "jp": 23.5, "cn": 36.5, "cm": 22.5},
    {"us": 6, "uk": 4, "eu": 37, "jp": 24, "cn": 37, "cm": 23.0},
    {"us": 6.5, "uk": 4.5, "eu": 37.5, "jp": 24.5, "cn": 37.5, "cm": 23.5},
    {"us": 7, "uk": 5, "eu": 38, "jp": 25, "cn": 38, "cm": 24.0},
    {"us": 7.5, "uk": 5.5, "eu": 38.5, "jp": 25.5, "cn": 38.5, "cm": 24.5},
    {"us": 8, "uk": 6, "eu": 39, "jp": 26, "cn": 39, "cm": 25.0},
    {"us": 8.5, "uk": 6.5, "eu": 39.5, "jp": 26.5, "cn": 39.5, "cm": 25.5},
    {"us": 9, "uk": 7, "eu": 40, "jp": 27, "cn": 40, "cm": 26.0},
    {"us": 9.5, "uk": 7.5, "eu": 40.5, "jp": 27.5, "cn": 40.5, "cm": 26.5},
    {"us": 10, "uk": 8, "eu": 41, "jp": 28, "cn": 41, "cm": 27.0},
    {"us": 10.5, "uk": 8.5, "eu": 41.5, "jp": 28.5, "cn": 41.5, "cm": 27.5},
    {"us": 11, "uk": 9, "eu": 42, "jp": 29, "cn": 42, "cm": 28.0},
    {"us": 11.5, "uk": 9.5, "eu": 42.5, "jp": 29.5, "cn": 42.5, "cm": 28.5},
    {"us": 12, "uk": 10, "eu": 43, "jp": 30, "cn": 43, "cm": 29.0}
  ],
  "kids": [
    {"us": 10, "uk": 9, "eu": 27, "jp": 17, "cn": 27, "cm": 16.5},
    {"us": 10.5, "uk": 9.5, "eu": 28, "jp": 17.5, "cn": 28, "cm": 17.0},
    {"us": 11, "uk": 10, "eu": 29, "jp": 18, "cn": 29, "cm": 17.5},
    {"us": 11.5, "uk": 10.5, "eu": 30, "jp": 18.5, "cn": 30, "cm": 18.0},
    {"us": 12, "uk": 11, "eu": 31, "jp": 19, "cn": 31, "cm": 18.5},
    {"us": 12.5, "uk": 11.5, "eu": 31.5, "jp": 19.5, "cn": 31.5, "cm": 19.0},
    {"us": 13, "uk": 12, "eu": 32, "jp": 20, "cn": 32, "cm": 19.5},
    {"us": 13.5, "uk": 12.5, "eu": 33, "jp": 20.5, "cn": 33, "cm": 20.0},
    {"us": 1, "uk": 0.5, "eu": 33.5, "jp": 21, "cn": 33.5, "cm": 20.5},
    {"us": 1.5, "uk": 1, "eu": 34, "jp": 21.5, "cn": 34, "cm": 21.0},
    {"us": 2, "uk": 1.5, "eu": 34.5, "jp": 22, "cn": 34.5, "cm": 21.5},
    {"us": 2.5, "uk": 2, "eu": 35, "jp": 22.5, "cn": 35, "cm": 22.0},
    {"us": 3, "uk": 2.5, "eu": 35.5, "jp": 23, "cn": 35.5, "cm": 22.5},
    {"us": 3.5, "uk": 3, "eu": 36, "jp": 23.5, "cn": 36, "cm": 23.0},
    {"us": 4, "uk": 3.5, "eu": 36.5, "jp": 24, "cn": 36.5, "cm": 23.5},
    {"us": 4.5, "uk": 4, "eu": 37, "jp": 24.5, "cn": 37, "cm": 24.0},
    {"us": 5, "uk": 4.5, "eu": 37.5, "jp": 25, "cn": 37.5, "cm": 24.5}
  ]
};

const embeddedClothingData = {
  "men": {
    "tops": [
      {"us": "XS", "uk": "XS", "eu": "XS", "jp": "S", "cn": "S", "chest_cm": 86, "waist_cm": 71, "hips_cm": 91},
      {"us": "S", "uk": "S", "eu": "S", "jp": "M", "cn": "M", "chest_cm": 91, "waist_cm": 76, "hips_cm": 96},
      {"us": "M", "uk": "M", "eu": "M", "jp": "L", "cn": "L", "chest_cm": 96, "waist_cm": 81, "hips_cm": 101},
      {"us": "L", "uk": "L", "eu": "L", "jp": "XL", "cn": "XL", "chest_cm": 101, "waist_cm": 86, "hips_cm": 106},
      {"us": "XL", "uk": "XL", "eu": "XL", "jp": "XXL", "cn": "XXL", "chest_cm": 106, "waist_cm": 91, "hips_cm": 111},
      {"us": "XXL", "uk": "XXL", "eu": "XXL", "jp": "XXXL", "cn": "XXXL", "chest_cm": 111, "waist_cm": 96, "hips_cm": 116},
      {"us": "XXXL", "uk": "XXXL", "eu": "XXXL", "jp": "XXXXL", "cn": "XXXXL", "chest_cm": 116, "waist_cm": 101, "hips_cm": 121}
    ],
    "pants": [
      {"us": "28", "uk": "28", "eu": "42", "jp": "S", "cn": "S", "chest_cm": 0, "waist_cm": 71, "hips_cm": 91},
      {"us": "30", "uk": "30", "eu": "44", "jp": "M", "cn": "M", "chest_cm": 0, "waist_cm": 76, "hips_cm": 96},
      {"us": "32", "uk": "32", "eu": "46", "jp": "L", "cn": "L", "chest_cm": 0, "waist_cm": 81, "hips_cm": 101},
      {"us": "34", "uk": "34", "eu": "48", "jp": "XL", "cn": "XL", "chest_cm": 0, "waist_cm": 86, "hips_cm": 106},
      {"us": "36", "uk": "36", "eu": "50", "jp": "XXL", "cn": "XXL", "chest_cm": 0, "waist_cm": 91, "hips_cm": 111},
      {"us": "38", "uk": "38", "eu": "52", "jp": "XXXL", "cn": "XXXL", "chest_cm": 0, "waist_cm": 96, "hips_cm": 116},
      {"us": "40", "uk": "40", "eu": "54", "jp": "XXXXL", "cn": "XXXXL", "chest_cm": 0, "waist_cm": 101, "hips_cm": 121},
      {"us": "42", "uk": "42", "eu": "56", "jp": "XXXXXL", "cn": "XXXXXL", "chest_cm": 0, "waist_cm": 106, "hips_cm": 126}
    ]
  },
  "women": {
    "tops": [
      {"us": "XS", "uk": "6", "eu": "34", "jp": "S", "cn": "S", "chest_cm": 81, "waist_cm": 61, "hips_cm": 86},
      {"us": "S", "uk": "8", "eu": "36", "jp": "M", "cn": "M", "chest_cm": 86, "waist_cm": 66, "hips_cm": 91},
      {"us": "M", "uk": "10", "eu": "38", "jp": "L", "cn": "L", "chest_cm": 91, "waist_cm": 71, "hips_cm": 96},
      {"us": "L", "uk": "12", "eu": "40", "jp": "XL", "cn": "XL", "chest_cm": 96, "waist_cm": 76, "hips_cm": 101},
      {"us": "XL", "uk": "14", "eu": "42", "jp": "XXL", "cn": "XXL", "chest_cm": 101, "waist_cm": 81, "hips_cm": 106},
      {"us": "XXL", "uk": "16", "eu": "44", "jp": "XXXL", "cn": "XXXL", "chest_cm": 106, "waist_cm": 86, "hips_cm": 111},
      {"us": "XXXL", "uk": "18", "eu": "46", "jp": "XXXXL", "cn": "XXXXL", "chest_cm": 111, "waist_cm": 91, "hips_cm": 116}
    ],
    "pants": [
      {"us": "0", "uk": "4", "eu": "32", "jp": "S", "cn": "S", "chest_cm": 0, "waist_cm": 61, "hips_cm": 86},
      {"us": "2", "uk": "6", "eu": "34", "jp": "M", "cn": "M", "chest_cm": 0, "waist_cm": 66, "hips_cm": 91},
      {"us": "4", "uk": "8", "eu": "36", "jp": "L", "cn": "L", "chest_cm": 0, "waist_cm": 71, "hips_cm": 96},
      {"us": "6", "uk": "10", "eu": "38", "jp": "XL", "cn": "XL", "chest_cm": 0, "waist_cm": 76, "hips_cm": 101},
      {"us": "8", "uk": "12", "eu": "40", "jp": "XXL", "cn": "XXL", "chest_cm": 0, "waist_cm": 81, "hips_cm": 106},
      {"us": "10", "uk": "14", "eu": "42", "jp": "XXXL", "cn": "XXXL", "chest_cm": 0, "waist_cm": 86, "hips_cm": 111},
      {"us": "12", "uk": "16", "eu": "44", "jp": "XXXXL", "cn": "XXXXL", "chest_cm": 0, "waist_cm": 91, "hips_cm": 116},
      {"us": "14", "uk": "18", "eu": "46", "jp": "XXXXXL", "cn": "XXXXXL", "chest_cm": 0, "waist_cm": 96, "hips_cm": 121}
    ],
    "dresses": [
      {"us": "XS", "uk": "6", "eu": "34", "jp": "S", "cn": "S", "chest_cm": 81, "waist_cm": 61, "hips_cm": 86},
      {"us": "S", "uk": "8", "eu": "36", "jp": "M", "cn": "M", "chest_cm": 86, "waist_cm": 66, "hips_cm": 91},
      {"us": "M", "uk": "10", "eu": "38", "jp": "L", "cn": "L", "chest_cm": 91, "waist_cm": 71, "hips_cm": 96},
      {"us": "L", "uk": "12", "eu": "40", "jp": "XL", "cn": "XL", "chest_cm": 96, "waist_cm": 76, "hips_cm": 101},
      {"us": "XL", "uk": "14", "eu": "42", "jp": "XXL", "cn": "XXL", "chest_cm": 101, "waist_cm": 81, "hips_cm": 106},
      {"us": "XXL", "uk": "16", "eu": "44", "jp": "XXXL", "cn": "XXXL", "chest_cm": 106, "waist_cm": 86, "hips_cm": 111}
    ]
  },
  "kids": {
    "tops": [
      {"us": "4", "uk": "4", "eu": "110", "jp": "110", "cn": "110", "chest_cm": 56, "waist_cm": 51, "hips_cm": 61},
      {"us": "5", "uk": "5", "eu": "120", "jp": "120", "cn": "120", "chest_cm": 61, "waist_cm": 56, "hips_cm": 66},
      {"us": "6", "uk": "6", "eu": "130", "jp": "130", "cn": "130", "chest_cm": 66, "waist_cm": 61, "hips_cm": 71},
      {"us": "7", "uk": "7", "eu": "140", "jp": "140", "cn": "140", "chest_cm": 71, "waist_cm": 66, "hips_cm": 76},
      {"us": "8", "uk": "8", "eu": "150", "jp": "150", "cn": "150", "chest_cm": 76, "waist_cm": 71, "hips_cm": 81},
      {"us": "10", "uk": "10", "eu": "160", "jp": "160", "cn": "160", "chest_cm": 81, "waist_cm": 76, "hips_cm": 86},
      {"us": "12", "uk": "12", "eu": "170", "jp": "170", "cn": "170", "chest_cm": 86, "waist_cm": 81, "hips_cm": 91},
      {"us": "14", "uk": "14", "eu": "180", "jp": "180", "cn": "180", "chest_cm": 91, "waist_cm": 86, "hips_cm": 96}
    ],
    "pants": [
      {"us": "4", "uk": "4", "eu": "110", "jp": "110", "cn": "110", "chest_cm": 0, "waist_cm": 51, "hips_cm": 61},
      {"us": "5", "uk": "5", "eu": "120", "jp": "120", "cn": "120", "chest_cm": 0, "waist_cm": 56, "hips_cm": 66},
      {"us": "6", "uk": "6", "eu": "130", "jp": "130", "cn": "130", "chest_cm": 0, "waist_cm": 61, "hips_cm": 71},
      {"us": "7", "uk": "7", "eu": "140", "jp": "140", "cn": "140", "chest_cm": 0, "waist_cm": 66, "hips_cm": 76},
      {"us": "8", "uk": "8", "eu": "150", "jp": "150", "cn": "150", "chest_cm": 0, "waist_cm": 71, "hips_cm": 81},
      {"us": "10", "uk": "10", "eu": "160", "jp": "160", "cn": "160", "chest_cm": 0, "waist_cm": 76, "hips_cm": 86},
      {"us": "12", "uk": "12", "eu": "170", "jp": "170", "cn": "170", "chest_cm": 0, "waist_cm": 81, "hips_cm": 91},
      {"us": "14", "uk": "14", "eu": "180", "jp": "180", "cn": "180", "chest_cm": 0, "waist_cm": 86, "hips_cm": 96}
    ]
  }
};

const embeddedBrandsData = {
  tops: {
    men: [
      { name: 'Nike', fit: 'runs_large' },
      { name: 'Uniqlo', fit: 'true_to_size' }
    ],
    women: [
      { name: 'Zara', fit: 'runs_small' },
      { name: 'H&M', fit: 'true_to_size' },
      { name: 'Nike', fit: 'runs_large' },
      { name: 'Uniqlo', fit: 'true_to_size' }
    ],
    kids: []
  },
  pants: {
    men: [
      { name: "Levi's", fit: 'true_to_size' },
      { name: 'Wrangler', fit: 'runs_small' }
    ],
    women: [
      { name: 'H&M', fit: 'true_to_size' },
      { name: 'Uniqlo', fit: 'true_to_size' }
    ],
    kids: []
  },
  dresses: {
    women: [
      { name: 'Zara', fit: 'runs_small' },
      { name: 'H&M', fit: 'true_to_size' }
    ],
    men: [],
    kids: []
  }
};

const embeddedRegionsData = {
  "US": {"region_code": "US", "region_name": "United States", "sizing_notes": "US sizing uses numeric sizes for shoes and letter sizes (XS-XXXL) or numeric waist sizes for clothing. Men's and women's sizing are separate."},
  "UK": {"region_code": "UK", "region_name": "United Kingdom", "sizing_notes": "UK shoe sizes are typically 1 size smaller than US. Clothing uses UK-specific numeric sizes that differ from US."},
  "EU": {"region_code": "EU", "region_name": "European Union", "sizing_notes": "EU uses metric-based sizing. Shoe sizes are typically 1-1.5 sizes larger than US. Clothing uses numeric sizes (32-52 for women, 42-56+ for men)."},
  "JP": {"region_code": "JP", "region_name": "Japan", "sizing_notes": "Japanese sizing runs smaller than US/EU. Shoe sizes use centimeter-based measurements. Clothing uses S/M/L/XL system but smaller than Western equivalents."},
  "CN": {"region_code": "CN", "region_name": "China", "sizing_notes": "Chinese sizing is similar to Japanese but may vary by brand. Generally runs smaller than US/EU sizes. Uses metric measurements."},
  "CM": {"region_code": "CM", "region_name": "Centimeters", "sizing_notes": "Direct foot length measurement in centimeters. Most accurate method for shoe sizing. Measure from heel to longest toe."}
};

let shoeData = {};
let clothingData = {};
let regionsData = {};
let brandsData = {};
let dataLoaded = false;
// Dataset-driven: shoes[gender][region].sizes = [ { value, cm } ]. No synthetic increments.
let sizeDatabase = { shoes: {}, clothing: {} };

/** Full dropdown labels / aliases → codes (must match shoe DB keys when uppercased). */
const SHOE_REGION_LABEL_MAP = {
  'United States (US)': 'US',
  'United States / Canada (US)': 'US',
  'United Kingdom (UK)': 'UK',
  'European Union (EU)': 'EU',
  'Europe (EU)': 'EU',
  'Japan (JP)': 'JP',
  'China (CN)': 'CN',
  China: 'CN',
  'Centimeters (CM)': 'CM',
};

const REGION_NO_DATA_MSG = 'No data available for this region yet.';

/**
 * Normalize region for shoe logic (dataset keys are lowercase us, uk, eu, jp, cn, cm).
 * @param {string} raw - option value or label text
 * @returns {string} US | UK | EU | JP | CN | CM | … (uppercase code)
 */
function normalizeShoeRegion(raw) {
  if (raw == null) return '';
  const s = String(raw).trim();
  if (!s) return '';
  if (Object.prototype.hasOwnProperty.call(SHOE_REGION_LABEL_MAP, s)) {
    return SHOE_REGION_LABEL_MAP[s];
  }
  if (/^china$/i.test(s)) return 'CN';
  const up = s.toUpperCase();
  if (/^(US|UK|EU|JP|CN|CM|KR|INCH)$/.test(up)) return up;
  return up;
}

function shoeRegionHasDataset(gender, regionNormUpper) {
  if (!gender || !regionNormUpper) return false;
  const r = String(regionNormUpper).toLowerCase();
  return !!(sizeDatabase.shoes?.[gender]?.[r]?.sizes?.length);
}

/**
 * Build size database from row data only. No arithmetic generation, no step loops.
 * Shoes: each region gets explicit { value, cm } from rows (CM is universal anchor).
 * Clothing: explicit value lists from rows (letter or numeric from dataset).
 */
function buildSizeDatabase() {
  const db = { shoes: {}, clothing: {} };
  const regionKeys = ['us', 'uk', 'eu', 'jp', 'cn', 'cm'];
  ['men', 'women', 'kids'].forEach(gender => {
    if (!shoeData[gender]) return;
    db.shoes[gender] = {};
    regionKeys.forEach(rk => {
      const key = rk.toUpperCase();
      // Only sizes that exist in the dataset; each has explicit cm from the row
      const sizes = shoeData[gender]
        .map(row => ({ value: row[rk], cm: row.cm }))
        .filter(s => s.value != null && s.cm != null);
      // Dedupe by value (keep first cm)
      const seen = new Set();
      const unique = sizes.filter(s => {
        const v = s.value;
        if (seen.has(v)) return false;
        seen.add(v);
        return true;
      });
      unique.sort((a, b) => {
        const na = Number(a.value), nb = Number(b.value);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return String(a.value).localeCompare(String(b.value));
      });
      db.shoes[gender][rk] = { regionCode: key, sizes: unique };
    });
  });
  // Scaffold for future brand override layer (Phase C). Not used yet.
  db.brands = {
    Nike: { shoes: { men: { US: { overrides: {} }, EU: { overrides: {} } }, women: { US: { overrides: {} }, EU: { overrides: {} } } } },
    Adidas: { shoes: { men: { US: { overrides: {} }, EU: { overrides: {} } }, women: { US: { overrides: {} }, EU: { overrides: {} } } } }
  };
  ['men', 'women', 'kids'].forEach(gender => {
    if (!clothingData[gender]) return;
    db.clothing[gender] = {};
    ['tops', 'pants', 'dresses'].forEach(cat => {
      if (!clothingData[gender][cat]) return;
      db.clothing[gender][cat] = {};
      ['us', 'uk', 'eu', 'jp', 'cn'].forEach(rk => {
        const key = rk.toUpperCase();
        const vals = [...new Set(clothingData[gender][cat].map(e => e[rk]).filter(v => v != null))];
        db.clothing[gender][cat][key] = vals.map(v => ({ value: v, label: String(v) })).sort((a, b) => {
          const na = Number(a.value), nb = Number(b.value);
          if (!isNaN(na) && !isNaN(nb)) return na - nb;
          return String(a.value).localeCompare(String(b.value));
        });
      });
    });
  });
  sizeDatabase = db;
}

/** Combined hub forms: Category + Clothing Type group (index, regional home pages). */
function isMainComboForm(form) {
  return !!(
    form &&
    form.querySelector('#clothingCategoryGroup') &&
    form.querySelector('[name="category"]')
  );
}

/** Map UI clothing type to `clothing_sizes.json` keys (jackets/skirts alias). */
function resolveClothingDataKey(gender, clothingCategoryUi) {
  if (!clothingCategoryUi) return null;
  if (clothingCategoryUi === 'jackets') return 'tops';
  if (clothingCategoryUi === 'skirts') return 'dresses';
  return clothingCategoryUi;
}

function resolveBrandCategoryKey(gender, clothingCategoryUi) {
  const k = resolveClothingDataKey(gender, clothingCategoryUi);
  return k || null;
}

const CLOTHING_TYPES_BY_GENDER = {
  men: [
    { value: 'tops', label: 'Tops' },
    { value: 'pants', label: 'Pants' },
    { value: 'jackets', label: 'Jackets' },
  ],
  women: [
    { value: 'tops', label: 'Tops' },
    { value: 'pants', label: 'Pants' },
    { value: 'dresses', label: 'Dresses' },
    { value: 'skirts', label: 'Skirts' },
    { value: 'jackets', label: 'Jackets' },
  ],
  kids: [
    { value: 'tops', label: 'Tops' },
    { value: 'pants', label: 'Pants' },
  ],
};

const NO_SIZES_COMBO_MSG =
  'No sizes available for this combination. Try selecting a different category or gender.';

function effectiveGenderForSizes(form, category) {
  const raw = form.querySelector('[name="gender"]')?.value || '';
  if (isMainComboForm(form)) {
    if (!raw) return '';
    return raw;
  }
  return raw || 'men';
}

function rebuildClothingTypeOptions(form) {
  const sel = form.querySelector('[name="clothingCategory"]');
  if (!sel || !isMainComboForm(form)) return;
  const category = form.querySelector('[name="category"]')?.value;
  const gender = form.querySelector('[name="gender"]')?.value || '';
  sel.innerHTML = '';
  const ph = document.createElement('option');
  ph.value = '';
  ph.textContent = 'Select clothing type';
  ph.disabled = true;
  ph.selected = true;
  sel.appendChild(ph);
  if (category !== 'clothing' || !gender) return;
  const list = CLOTHING_TYPES_BY_GENDER[gender] || [];
  list.forEach(({ value, label }) => {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = label;
    sel.appendChild(o);
  });
}

function updateMainConverterFieldDisabled(form) {
  if (!isMainComboForm(form)) return;
  const category = form.querySelector('[name="category"]')?.value;
  const gender = form.querySelector('[name="gender"]')?.value || '';
  const clothingGroup = form.querySelector('#clothingCategoryGroup');
  const clothingSel = form.querySelector('[name="clothingCategory"]');
  const sizeSelect = form.querySelector('#sizeSelect');
  const fromRegionSelect = form.querySelector('[name="fromRegion"]');

  if (fromRegionSelect) {
    const cmOption = fromRegionSelect.querySelector('option[value="CM"]');
    if (cmOption) {
      cmOption.style.display = category === 'clothing' ? 'none' : 'block';
    }
  }

  if (category === 'shoes') {
    if (clothingGroup) clothingGroup.style.display = 'none';
    if (clothingSel) clothingSel.disabled = true;
    if (sizeSelect) sizeSelect.disabled = !gender;
  } else if (category === 'clothing') {
    if (clothingGroup) clothingGroup.style.display = 'flex';
    if (clothingSel) clothingSel.disabled = !gender;
    if (sizeSelect) sizeSelect.disabled = !gender || !clothingSel?.value;
  }
}

function showNoSizesComboMessage(form) {
  showConverterEmptyState(form, NO_SIZES_COMBO_MSG);
}

function syncMainConverterForm(form, opts = { rebuildTypes: false }) {
  if (!isMainComboForm(form)) return;
  if (opts.rebuildTypes) {
    rebuildClothingTypeOptions(form);
  }
  updateMainConverterFieldDisabled(form);
}

/**
 * Returns sizes for the given context. Shoes: list of { value, cm } from dataset only.
 * Clothing: list of { value, label } from dataset only. No synthetic generation.
 */
function getAvailableSizes(category, gender, region, clothingCategory) {
  if (category === 'shoes' || !category) {
    const r = String(normalizeShoeRegion(region || '') || region || '')
      .trim()
      .toLowerCase();
    const g = sizeDatabase.shoes[gender];
    if (!g || !g[r]) return [];
    const regionData = g[r];
    return regionData.sizes ? regionData.sizes : [];
  }
  if (category === 'clothing') {
    const dataKey = resolveClothingDataKey(gender, clothingCategory);
    if (!dataKey) return [];
    const g = sizeDatabase.clothing[gender];
    if (!g) return [];
    const cat = g[dataKey];
    if (!cat) return [];
    const list = cat[region];
    return Array.isArray(list) ? list : [];
  }
  return [];
}

/**
 * Populate size dropdown from dataset only. No .step, no arithmetic, no loops.
 * Always clears selection (placeholder) so we never retain old size across context change.
 */
function populateSizeOptions(form) {
  const sizeSelect = form.querySelector('#sizeSelect');
  if (!sizeSelect) return;
  const category = form.querySelector('[name="category"]')?.value || 'shoes';
  const gender = effectiveGenderForSizes(form, category);
  const regionRaw = form.querySelector('[name="fromRegion"]')?.value || 'US';
  const region = normalizeShoeRegion(regionRaw) || regionRaw || 'US';
  const clothingCategory = form.querySelector('[name="clothingCategory"]')?.value || '';

  sizeSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.disabled = true;
  placeholder.selected = true;
  sizeSelect.appendChild(placeholder);

  if (isMainComboForm(form) && !gender) {
    placeholder.textContent = 'Select gender first';
    updateMainConverterFieldDisabled(form);
    return;
  }

  if (isMainComboForm(form) && category === 'clothing' && !clothingCategory) {
    placeholder.textContent = 'Select clothing type first';
    updateMainConverterFieldDisabled(form);
    return;
  }

  placeholder.textContent = 'Select size';

  const sizes = getAvailableSizes(
    category,
    gender,
    region,
    category === 'clothing' ? clothingCategory : undefined
  );

  if (isMainComboForm(form) && category === 'clothing' && gender && clothingCategory && sizes.length === 0) {
    showNoSizesComboMessage(form);
  }

  sizes.forEach((s) => {
    const option = document.createElement('option');
    option.value = s.value;
    option.textContent = s.label != null ? s.label : String(s.value);
    sizeSelect.appendChild(option);
  });
  sizeSelect.selectedIndex = 0;
  updateMainConverterFieldDisabled(form);
}

// Load JSON data - use embedded data as primary, fetch as fallback for updates
async function loadData() {
  try {
    // Use embedded data immediately (works locally and when deployed)
    shoeData = embeddedShoeData;
    clothingData = embeddedClothingData;
    regionsData = embeddedRegionsData;
    brandsData = embeddedBrandsData;
    dataLoaded = true;
    console.log('Data loaded from embedded source');

    // Try to fetch updated data in background (optional, for future updates)
    try {
      const [shoeResponse, clothingResponse, regionsResponse, brandsResponse] = await Promise.all([
        fetch('data/shoe_sizes.json'),
        fetch('data/clothing_sizes.json'),
        fetch('data/regions.json'),
        fetch('data/brands.json')
      ]);

      if (shoeResponse.ok && clothingResponse.ok && regionsResponse.ok) {
        const fetchedShoe = await shoeResponse.json();
        const fetchedClothing = await clothingResponse.json();
        const fetchedRegions = await regionsResponse.json();
        
        // Update with fetched data if available
        shoeData = fetchedShoe;
        clothingData = fetchedClothing;
        regionsData = fetchedRegions.regions.reduce((acc, region) => {
          acc[region.region_code] = region;
          return acc;
        }, {});
        if (brandsResponse.ok) {
          brandsData = await brandsResponse.json();
        }
        console.log('Data updated from fetched source');
      }
    } catch (fetchError) {
      // Silently fail - embedded data is already loaded
      console.log('Using embedded data (fetch unavailable)');
    }
  } catch (error) {
    console.error('Error loading data:', error);
    alert('Error loading size data. Please refresh the page.');
  }
}

// Phase 14A: Set default "From Region" based on page path
function applyRegionalDefault() {
  const path = window.location.pathname;
  let defaultRegion = null;
  if (path.startsWith('/us/')) defaultRegion = 'US';
  else if (path.startsWith('/uk/')) defaultRegion = 'UK';
  else if (path.startsWith('/eu/')) defaultRegion = 'EU';
  else if (path.startsWith('/ca/')) defaultRegion = 'US'; // Canada mirrors US
  if (!defaultRegion) return;
  document.querySelectorAll('[name="fromRegion"]').forEach(select => {
    const opt = select.querySelector(`option[value="${defaultRegion}"]`);
    if (opt) {
      opt.selected = true;
    }
  });
}

// Converter initialization: run only after DOM is ready. Form submit prevents default.
function runConverterInit() {
  const forms = document.querySelectorAll('.converter-form');

  loadData().then(() => {
    buildSizeDatabase();
    applyRegionalDefault();

    initializeConverters();
    initializeCollapsibles();

    document.querySelectorAll('.converter-form').forEach((form) => {
      if (!form.querySelector('#brand')) return;
      populateBrandOptions(form);
      const repopBrands = () => populateBrandOptions(form);
      form.querySelector('[name="gender"]')?.addEventListener('change', repopBrands);
      form.querySelector('[name="clothingCategory"]')?.addEventListener('change', repopBrands);
    });

    document.querySelectorAll('.converter-form').forEach((form) => {
      if (!form.querySelector('[name="category"]')) return;
      if (isMainComboForm(form)) {
        rebuildClothingTypeOptions(form);
        updateMainConverterFieldDisabled(form);
      }
      populateSizeOptions(form);

      const refreshSizeDropdown = () => {
        syncMainConverterForm(form, { rebuildTypes: false });
        const sizeSelect = form.querySelector('#sizeSelect');
        if (sizeSelect) sizeSelect.value = '';
        populateSizeOptions(form);
        runAutoConversion(form);
      };

      const onGenderChange = () => {
        if (isMainComboForm(form)) {
          const c = form.querySelector('[name="clothingCategory"]');
          if (c) c.value = '';
          syncMainConverterForm(form, { rebuildTypes: true });
        }
        const sizeSelect = form.querySelector('#sizeSelect');
        if (sizeSelect) sizeSelect.value = '';
        populateSizeOptions(form);
        runAutoConversion(form);
      };

      form.querySelector('[name="gender"]')?.addEventListener('change', onGenderChange, true);
      form.querySelector('[name="fromRegion"]')?.addEventListener('change', refreshSizeDropdown, true);
      form.querySelector('[name="clothingCategory"]')?.addEventListener('change', refreshSizeDropdown, true);
      runAutoConversion(form);
    });

    initializeCategoryToggle();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runConverterInit);
} else {
  runConverterInit();
}

// ============================================
// Category Toggle (Shoes/Clothing)
// ============================================

function initializeCategoryToggle() {
  const categorySelects = document.querySelectorAll('[name="category"]');
  categorySelects.forEach((select) => {
    select.addEventListener('change', () => {
      const form = select.closest('form');
      if (form?.querySelector('#sizeSelect')) {
        if (isMainComboForm(form)) {
          const c = form.querySelector('[name="clothingCategory"]');
          if (c) c.value = '';
          const sizeSelect = form.querySelector('#sizeSelect');
          if (sizeSelect) sizeSelect.value = '';
          syncMainConverterForm(form, { rebuildTypes: true });
        }
        populateSizeOptions(form);
        runAutoConversion(form);
      }
    });

    if (select.value === 'clothing') {
      select.dispatchEvent(new Event('change'));
    }
  });
}

// ============================================
// Shoe Size Conversion — CM-Anchor Engine
// ============================================

/**
 * Convert one size: fromRegion selected value → CM baseline → closest size in toRegion.
 * EU half-size precision, UK baseline respect, US half-step consistency, JP exact CM match.
 * No direct region-to-region table guess. Future: apply brand overrides to cm before lookup.
 */
function convertSize(category, gender, fromRegion, toRegion, selectedValue) {
  if (category !== 'shoes') return null;
  fromRegion = String(normalizeShoeRegion(fromRegion || '') || fromRegion || '')
    .trim()
    .toLowerCase();
  toRegion = String(normalizeShoeRegion(toRegion || '') || toRegion || '')
    .trim()
    .toLowerCase();

  let cmValue;
  if (fromRegion === 'cm') {
    cmValue = parseFloat(selectedValue);
    if (isNaN(cmValue)) return null;
    if (toRegion === 'cm') return cmValue;
  } else {
    const fromData = sizeDatabase.shoes?.[gender]?.[fromRegion];
    if (!fromData?.sizes?.length) return null;
    const selected = fromData.sizes.find(s => s.value == selectedValue);
    if (!selected) return null;
    cmValue = selected.cm;
    if (fromRegion === toRegion) return selected.value;
  }

  if (toRegion === 'cm') return cmValue;

  const toData = sizeDatabase.shoes?.[gender]?.[toRegion];
  if (!toData?.sizes?.length) return null;
  const toSizes = toData.sizes;
  const closest = toSizes.reduce((prev, curr) =>
    Math.abs(curr.cm - cmValue) < Math.abs(prev.cm - cmValue) ? curr : prev
  );
  return closest.value;
}

function convertShoeSize(size, fromRegion, toRegion, gender) {
  return convertSize('shoes', gender, fromRegion, toRegion, size);
}

function convertShoeFromCM(cm, gender) {
  if (!shoeData[gender] || !cm) return null;
  const genderData = shoeData[gender];
  let closest = null;
  let minDiff = Infinity;
  for (const entry of genderData) {
    if (entry.cm != null) {
      const diff = Math.abs(entry.cm - parseFloat(cm));
      if (diff < minDiff) {
        minDiff = diff;
        closest = entry;
      }
    }
  }
  return closest;
}

/**
 * All shoe conversions via CM anchor: selected value → cm → closest per region.
 * Region-specific database; no numeric stepping; half-size precise.
 */
function getAllShoeConversions(size, fromRegion, gender) {
  const regionCodes = ['us', 'uk', 'eu', 'jp', 'cn', 'cm'];
  const result = {};
  const fromNorm = String(normalizeShoeRegion(fromRegion || '') || fromRegion || '')
    .trim()
    .toLowerCase();
  const hasUs = convertSize('shoes', gender, fromRegion, 'us', size) != null;
  if (!hasUs && fromNorm !== 'cm') return {};

  regionCodes.forEach(toRegion => {
    const val = convertSize('shoes', gender, fromRegion, toRegion, size);
    if (val != null) result[toRegion] = val;
  });
  return result;
}

// ============================================
// Clothing Size Conversion
// ============================================

function humanizeFit(fit) {
  if (!fit) return '';
  return String(fit).replace(/_/g, ' ');
}

/**
 * Numeric-only nudge from task spec (shoe-like sizes). Clothing uses adjustClothingSizeForBrand.
 */
function adjustForBrand(size, brandFit) {
  if (!brandFit) return size;
  const n = parseInt(String(size), 10);
  if (!Number.isNaN(n) && /^\d+$/.test(String(size).trim())) {
    if (brandFit === 'runs_small') return String(n + 1);
    if (brandFit === 'runs_large') return String(Math.max(0, n - 1));
  }
  return size;
}

function getBrandsList(clothingCategory, gender) {
  if (!brandsData || !brandsData[clothingCategory] || !brandsData[clothingCategory][gender]) return [];
  const arr = brandsData[clothingCategory][gender];
  return Array.isArray(arr) ? arr : [];
}

function populateBrandOptions(form) {
  const sel = form.querySelector('#brand');
  if (!sel) return;
  const gender = form.querySelector('[name="gender"]')?.value || 'men';
  const catUi = form.querySelector('[name="clothingCategory"]')?.value || 'tops';
  const cat = resolveBrandCategoryKey(gender, catUi);
  const prev = sel.value;
  const list = cat ? getBrandsList(cat, gender) : [];
  sel.innerHTML = '';
  const ph = document.createElement('option');
  ph.value = '';
  ph.textContent = 'Standard sizing (no brand)';
  sel.appendChild(ph);
  list.forEach((b) => {
    const o = document.createElement('option');
    o.value = b.name;
    o.textContent = b.name;
    o.setAttribute('data-fit', b.fit);
    o.setAttribute('data-brand-name', b.name);
    sel.appendChild(o);
  });
  if (prev && [...sel.options].some((o) => o.value === prev)) sel.value = prev;
  else sel.selectedIndex = 0;
}

/**
 * Move one row on the clothing chart in fromRegion when brand runs small/large.
 * Does not change underlying JSON or non-clothing paths.
 */
function adjustClothingSizeForBrand(size, brandFit, gender, categoryUi, fromRegion) {
  const raw = String(size == null ? '' : size).trim();
  if (!brandFit || brandFit === 'true_to_size' || !raw) return raw;
  const category = resolveClothingDataKey(gender, categoryUi);
  if (!category || !clothingData[gender] || !clothingData[gender][category]) return raw;
  const categoryData = clothingData[gender][category];
  const rk = String(fromRegion).toLowerCase();
  let idx = -1;
  for (let i = 0; i < categoryData.length; i++) {
    const v = categoryData[i][rk];
    if (v != null && String(v).trim().toLowerCase() === raw.toLowerCase()) {
      idx = i;
      break;
    }
  }
  if (idx < 0) {
    const num = parseFloat(raw);
    if (!Number.isNaN(num)) {
      for (let i = 0; i < categoryData.length; i++) {
        const v = categoryData[i][rk];
        if (v == null) continue;
        const entryNum = parseFloat(v);
        if (!Number.isNaN(entryNum) && entryNum === num) {
          idx = i;
          break;
        }
      }
    }
  }
  if (idx < 0) return raw;
  let delta = 0;
  if (brandFit === 'runs_small') delta = 1;
  else if (brandFit === 'runs_large') delta = -1;
  else return raw;
  const newIdx = Math.max(0, Math.min(categoryData.length - 1, idx + delta));
  const out = categoryData[newIdx][rk];
  return out != null ? String(out).trim() : raw;
}

function convertClothingSize(size, fromRegion, toRegion, gender, categoryUi) {
  const category = resolveClothingDataKey(gender, categoryUi);
  if (!category || !clothingData[gender] || !clothingData[gender][category] || !size) return null;

  const categoryData = clothingData[gender][category];
  
  // Find the entry with matching size in source region
  let sourceEntry = null;
  for (const entry of categoryData) {
    const sourceValue = entry[fromRegion.toLowerCase()];
    if (sourceValue && String(sourceValue).toLowerCase() === String(size).toLowerCase()) {
      sourceEntry = entry;
      break;
    }
  }

  if (!sourceEntry) return null;

  // Return size in target region
  const targetKey = toRegion.toLowerCase();
  return sourceEntry[targetKey] !== undefined ? sourceEntry[targetKey] : null;
}

function getAllClothingConversions(size, fromRegion, gender, categoryUi) {
  const category = resolveClothingDataKey(gender, categoryUi);
  if (!category || !clothingData[gender] || !clothingData[gender][category]) {
    console.warn('No data for:', { gender, category });
    return {};
  }

  const categoryData = clothingData[gender][category];
  let sourceEntry = null;
  const regionKey = fromRegion.toLowerCase();
  const sizeStr = String(size).trim().toLowerCase();

  // Find source entry - try exact match first
  for (const entry of categoryData) {
    const sourceValue = entry[regionKey];
    if (sourceValue !== undefined && sourceValue !== null) {
      const entryStr = String(sourceValue).trim().toLowerCase();
      if (entryStr === sizeStr) {
        sourceEntry = entry;
        break;
      }
    }
  }

  // If no exact match, try numeric comparison for numeric sizes
  if (!sourceEntry && !isNaN(parseFloat(size))) {
    const sizeNum = parseFloat(size);
    for (const entry of categoryData) {
      const sourceValue = entry[regionKey];
      if (sourceValue !== undefined && sourceValue !== null) {
        const entryNum = parseFloat(sourceValue);
        if (!isNaN(entryNum) && entryNum === sizeNum) {
          sourceEntry = entry;
          break;
        }
      }
    }
  }

  if (!sourceEntry) {
    console.warn('No matching entry found for:', { size, fromRegion, gender, category });
    return {};
  }

  return {
    us: sourceEntry.us,
    uk: sourceEntry.uk,
    eu: sourceEntry.eu,
    jp: sourceEntry.jp,
    cn: sourceEntry.cn,
    chest_cm: sourceEntry.chest_cm,
    waist_cm: sourceEntry.waist_cm,
    hips_cm: sourceEntry.hips_cm
  };
}

// ============================================
// Validation (Phase 13.5 - strict numeric shoe, no auto-correct)
// ============================================

/**
 * Strict numeric shoe size validation. Allows whole numbers and decimals only.
 * No letters, words, symbols, trim, or auto-clean.
 * @param {string} value - Raw input value (do not trim)
 * @returns {boolean}
 */
function validateShoeSize(value) {
  if (value === null || value === undefined) return false;
  if (!/^\d+(\.\d+)?$/.test(value)) return false;
  return true;
}

/**
 * Task C: Validate size is within allowed range for category, gender, region.
 * Used for shoes only. No fallback conversion for invalid ranges.
 * @param {string} category - 'shoes'
 * @param {string} gender - 'men' | 'women' | 'kids'
 * @param {string} region - 'US' | 'UK' | 'EU' | 'JP' | 'CM'
 * @param {number} size - Parsed numeric size
 * @returns {boolean}
 */
function validateSize(category, gender, region, size) {
  const regionKey = normalizeShoeRegion(region || '') || region;
  const ranges = {
    shoes: {
      men: {
        US: [3, 18],
        UK: [2, 17],
        EU: [35, 52],
        JP: [21, 32],
        CN: [39, 47],
        CM: [21, 32]
      },
      women: {
        US: [4, 16],
        UK: [2, 14],
        EU: [34, 46],
        JP: [21, 30],
        CN: [35, 43],
        CM: [21, 30]
      },
      kids: {
        US: [1, 13],
        EU: [16, 35],
        CN: [27, 38],
        CM: [9, 22]
      }
    }
  };

  const regionRanges =
    ranges[category] && ranges[category][gender] && ranges[category][gender][regionKey];
  if (!regionRanges) return false;
  const [min, max] = regionRanges;
  return size >= min && size <= max;
}

// ============================================
// UI Functions
// ============================================

const SHOE_SIZE_ERROR_MSG = 'Please enter a valid numeric shoe size (e.g., 9, 9.5, 42).';
const SHOE_SIZE_RANGE_ERROR_MSG = 'Please enter a valid size for the selected region.';

/**
 * Validate clothing size: XS, S, M, L, XL, XXL, XXXL or numeric only (e.g. 32, 40).
 * Disallows words like "medium", "small", "size 10", mixed text.
 * @param {string} value - Raw input (will be trimmed and uppercased for letter check)
 * @returns {boolean}
 */
function validateClothingSize(value) {
  if (value === null || value === undefined) return false;
  const normalized = value.trim().toUpperCase();
  const letterPattern = /^(XS|S|M|L|XL|XXL|XXXL)$/;
  const numberPattern = /^\d+$/;
  if (letterPattern.test(normalized) || numberPattern.test(normalized)) return true;
  return false;
}

const CLOTHING_SIZE_ERROR_MSG = 'Use standard sizes only (XS–XXXL or numeric values like 32, 40).';

const CONVERTER_EMPTY_MSG = 'Select your size to see conversions';

function showConverterEmptyState(form, message = CONVERTER_EMPTY_MSG) {
  const formSection = form.closest('.converter-card');
  const resultsContainer = formSection?.querySelector('.results');
  if (!resultsContainer) return;
  resultsContainer.classList.remove('loading');
  const prevBrand = resultsContainer.querySelector('.brand-adjustment-note');
  if (prevBrand) prevBrand.remove();
  const resultsGrid = resultsContainer.querySelector('.results-grid');
  if (resultsGrid) {
    resultsGrid.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'converter-results-empty';
    p.setAttribute('role', 'status');
    p.textContent = message;
    resultsGrid.appendChild(p);
  }
  resultsContainer.classList.add('active');
  const fitNotice = formSection?.querySelector('.fit-notice');
  if (fitNotice) fitNotice.style.display = 'none';
}

/**
 * Runs conversion immediately on control change (no debounce, no submit button).
 * @param {HTMLFormElement} form
 */
function runAutoConversion(form) {
  if (form.dataset.autoConvert === 'false') return;
  if (!form.querySelector('[name="category"]')) return;

  const box = form.closest('.converter-card')?.querySelector('.results');
  if (box) box.classList.add('loading');
  try {
    handleConversion(form);
  } finally {
    if (box) box.classList.remove('loading');
  }
}

function initializeConverters() {
  const forms = document.querySelectorAll('.converter-form');
  forms.forEach(form => {
    if (!form.querySelector('[name="category"]')) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      runAutoConversion(form);
    });

    const sizeSelect = form.querySelector('#sizeSelect');
    const sizeInput = form.querySelector('[name="size"]');
    const sizeEl = sizeSelect || sizeInput;

    const shoeErrorEl = form.querySelector('#shoe-size-error');
    if (sizeEl && shoeErrorEl) {
      const clearError = () => {
        shoeErrorEl.style.display = 'none';
        shoeErrorEl.textContent = '';
      };
      sizeEl.addEventListener('input', clearError);
      sizeEl.addEventListener('change', clearError);
    }
    const clothingErrorEl = form.querySelector('#clothing-size-error');
    if (sizeEl && clothingErrorEl) {
      const clearClothingError = () => {
        clothingErrorEl.style.display = 'none';
        clothingErrorEl.textContent = '';
      };
      sizeEl.addEventListener('input', clearClothingError);
      sizeEl.addEventListener('change', clearClothingError);
    }

    form.querySelectorAll('select').forEach(el => {
      if (el.getAttribute('name') === 'category') return;
      el.addEventListener('change', () => runAutoConversion(form));
    });

    form.querySelectorAll('input:not([type="hidden"])').forEach(el => {
      el.addEventListener('input', () => runAutoConversion(form));
      el.addEventListener('change', () => runAutoConversion(form));
    });
  });
}

function handleConversion(form) {
  if (!dataLoaded) {
    console.warn('Data not loaded yet, please wait...');
    alert('Please wait for the size data to load, then try again.');
    return;
  }

  const categoryEl = form.querySelector('[name="category"]');
  if (!categoryEl) return;

  const category = categoryEl.value;
  const fromRegionRaw = form.querySelector('[name="fromRegion"]')?.value;
  const toRegionRaw = form.querySelector('[name="toRegion"]')?.value;
  const fromRegionNorm = normalizeShoeRegion(fromRegionRaw || '');
  const toRegionNorm = normalizeShoeRegion(toRegionRaw || '');
  const sizeSelect = form.querySelector('#sizeSelect');
  const sizeInput = form.querySelector('[name="size"]');
  const sizeEl = sizeSelect || sizeInput;
  const sizeRaw = sizeEl?.value;
  const gender = form.querySelector('[name="gender"]')?.value;
  const clothingCategory = form.querySelector('[name="clothingCategory"]')?.value || '';

  const isShoePath = category === 'shoes' || !category;
  const isLetterClothing = category === 'clothing';
  const size = isLetterClothing ? sizeRaw?.trim() : sizeRaw;

  if (isMainComboForm(form) && !gender) {
    showConverterEmptyState(form);
    return;
  }

  if (category === 'clothing' && !clothingCategory) {
    showConverterEmptyState(form);
    return;
  }

  if (!fromRegionRaw || !gender) {
    console.warn('Missing required fields:', { size: sizeRaw, fromRegion: fromRegionRaw, gender });
    showConverterEmptyState(form);
    return;
  }

  if (isShoePath) {
    if (!shoeRegionHasDataset(gender, fromRegionNorm)) {
      showConverterEmptyState(form, REGION_NO_DATA_MSG);
      return;
    }
    const shoeEmpty = sizeRaw === null || sizeRaw === undefined || String(sizeRaw).trim() === '';
    if (shoeEmpty) {
      const shoeErrorEl =
        form.closest('.converter-card')?.querySelector('#shoe-size-error') ||
        form.querySelector('#shoe-size-error');
      if (shoeErrorEl) {
        shoeErrorEl.style.display = 'none';
        shoeErrorEl.textContent = '';
      }
      showConverterEmptyState(form);
      return;
    }
    if (!validateShoeSize(sizeRaw)) {
      const formSection = form.closest('.converter-card');
      const shoeErrorEl = formSection?.querySelector('#shoe-size-error') || form.querySelector('#shoe-size-error');
      if (shoeErrorEl) {
        shoeErrorEl.textContent = SHOE_SIZE_ERROR_MSG;
        shoeErrorEl.style.display = 'block';
      }
      showConverterEmptyState(form);
      return;
    }
    const sizeNum = parseFloat(sizeRaw);
    if (sizeNum < 0 || sizeNum > 60) {
      const formSection = form.closest('.converter-card');
      const shoeErrorEl = formSection?.querySelector('#shoe-size-error') || form.querySelector('#shoe-size-error');
      if (shoeErrorEl) {
        shoeErrorEl.textContent = SHOE_SIZE_RANGE_ERROR_MSG;
        shoeErrorEl.style.display = 'block';
      }
      showConverterEmptyState(form);
      return;
    }
    if (!validateSize('shoes', gender, fromRegionNorm, sizeNum)) {
      const formSection = form.closest('.converter-card');
      const shoeErrorEl = formSection?.querySelector('#shoe-size-error') || form.querySelector('#shoe-size-error');
      if (shoeErrorEl) {
        shoeErrorEl.textContent = SHOE_SIZE_RANGE_ERROR_MSG;
        shoeErrorEl.style.display = 'block';
      }
      showConverterEmptyState(form);
      return;
    }
    const shoeErrorEl = form.querySelector('#shoe-size-error');
    if (shoeErrorEl) {
      shoeErrorEl.style.display = 'none';
      shoeErrorEl.textContent = '';
    }
  }

  if (isLetterClothing) {
    const clothingEmpty = sizeRaw === null || sizeRaw === undefined || String(sizeRaw).trim() === '';
    if (clothingEmpty) {
      const clothingErrorEl =
        form.closest('.converter-card')?.querySelector('#clothing-size-error') ||
        form.querySelector('#clothing-size-error');
      if (clothingErrorEl) {
        clothingErrorEl.style.display = 'none';
        clothingErrorEl.textContent = '';
      }
      showConverterEmptyState(form);
      return;
    }
    if (!validateClothingSize(sizeRaw)) {
      const formSection = form.closest('.converter-card');
      const clothingErrorEl = formSection?.querySelector('#clothing-size-error') || form.querySelector('#clothing-size-error');
      if (clothingErrorEl) {
        clothingErrorEl.textContent = CLOTHING_SIZE_ERROR_MSG;
        clothingErrorEl.style.display = 'block';
      }
      showConverterEmptyState(form);
      return;
    }
    const clothingErrorEl = form.querySelector('#clothing-size-error');
    if (clothingErrorEl) {
      clothingErrorEl.style.display = 'none';
      clothingErrorEl.textContent = '';
    }
  }

  if (!size) {
    showConverterEmptyState(form);
    return;
  }

  console.log('Converting:', {
    category,
    fromRegion: fromRegionNorm || fromRegionRaw,
    size,
    gender,
    clothingCategory
  });

  let results = {};
  let bestMatchRegion = toRegionNorm || fromRegionNorm || fromRegionRaw;
  let brandNote = '';

  if (isShoePath) {
    results = getAllShoeConversions(size, fromRegionNorm, gender);
  } else if (category === 'clothing') {
    let sizeToConvert = size;
    const brandSel = form.querySelector('#brand');
    if (brandSel && brandSel.value) {
      const opt = brandSel.options[brandSel.selectedIndex];
      const fit = opt.getAttribute('data-fit');
      const bname = opt.getAttribute('data-brand-name') || brandSel.value;
      if (fit && fit !== 'true_to_size') {
        const adj = adjustClothingSizeForBrand(
          size,
          fit,
          gender,
          clothingCategory || 'tops',
          fromRegionNorm || fromRegionRaw
        );
        if (adj !== String(size).trim()) {
          sizeToConvert = adj;
          brandNote = `Adjusted for brand: ${bname} (${humanizeFit(fit)})`;
        }
      }
    }
    results = getAllClothingConversions(
      sizeToConvert,
      fromRegionNorm || fromRegionRaw,
      gender,
      clothingCategory || 'tops'
    );
  }

  console.log('Conversion results:', results);

  // Find the results container within this form's parent section
  const formSection = form.closest('.converter-card');
  const resultsContainer = formSection?.querySelector('.results');
  
  if (resultsContainer) {
    displayResults(results, bestMatchRegion, isShoePath, resultsContainer, {
      brandNote
    });
  } else {
    console.error('Results container not found');
  }

  // Phase 13.5: show fit notice only for shoe conversions when results are shown
  const fitNotice = formSection?.querySelector('.fit-notice');
  if (fitNotice) {
    const hasResults = results && Object.keys(results).length > 0;
    fitNotice.style.display = isShoePath && hasResults ? 'block' : 'none';
  }
}

function displayResults(results, bestMatchRegion, isShoe = true, resultsContainer = null, opts = {}) {
  if (!resultsContainer) {
    resultsContainer = document.querySelector('.results');
  }
  if (!resultsContainer) {
    console.error('Results container not found');
    return;
  }

  resultsContainer.classList.remove('loading');

  const resultsGrid = resultsContainer.querySelector('.results-grid');
  if (!resultsGrid) {
    console.error('Results grid not found');
    return;
  }

  const prevBrandNote = resultsContainer.querySelector('.brand-adjustment-note');
  if (prevBrandNote) prevBrandNote.remove();

  resultsGrid.innerHTML = '';

  if (Object.keys(results).length === 0) {
    resultsContainer.classList.remove('active');
    // Show error message
    const errorMsg = document.createElement('div');
    errorMsg.style.padding = '1rem';
    errorMsg.style.color = 'var(--error-color)';
    errorMsg.textContent = 'Size not found. Please check your input and try again.';
    resultsGrid.appendChild(errorMsg);
    resultsContainer.classList.add('active');
    return;
  }

  if (opts && opts.brandNote) {
    const note = document.createElement('p');
    note.className = 'brand-adjustment-note';
    note.setAttribute('role', 'status');
    note.textContent = opts.brandNote;
    resultsContainer.insertBefore(note, resultsGrid);
  }

  const regions = [
    { code: 'US', name: 'United States' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'EU', name: 'European Union' },
    { code: 'JP', name: 'Japan' },
    { code: 'CN', name: 'China' }
  ];

  if (isShoe && results.cm) {
    regions.push({ code: 'CM', name: 'Centimeters' });
  }

  regions.forEach(region => {
    const value = results[region.code.toLowerCase()];
    if (value === undefined || value === null) return;

    const card = document.createElement('div');
    card.className = 'result-card';
    
    if (region.code === bestMatchRegion) {
      card.classList.add('best-match');
    }

    const label = document.createElement('div');
    label.className = 'result-label';
    label.textContent = region.name;

    const valueDiv = document.createElement('div');
    valueDiv.className = 'result-value';
    valueDiv.textContent = value;

    card.appendChild(label);
    card.appendChild(valueDiv);

    if (isShoe && region.code !== 'CM' && results.cm) {
      const cmDiv = document.createElement('div');
      cmDiv.className = 'result-cm';
      cmDiv.textContent = `${results.cm} cm`;
      card.appendChild(cmDiv);
    }

    if (!isShoe && region.code === 'US') {
      if (results.chest_cm) {
        const cmDiv = document.createElement('div');
        cmDiv.className = 'result-cm';
        cmDiv.textContent = `Chest: ${results.chest_cm}cm`;
        card.appendChild(cmDiv);
      }
      if (results.waist_cm) {
        const cmDiv = document.createElement('div');
        cmDiv.className = 'result-cm';
        cmDiv.textContent = `Waist: ${results.waist_cm}cm`;
        card.appendChild(cmDiv);
      }
    }

    resultsGrid.appendChild(card);
  });

  resultsContainer.classList.add('active');
}

// ============================================
// Collapsible Sections
// ============================================

function initializeCollapsibles() {
  const collapsibles = document.querySelectorAll('.collapsible-header');
  collapsibles.forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const isActive = header.classList.contains('active');

      // Close all collapsibles in the same container
      const container = header.closest('.collapsible').parentElement;
      container.querySelectorAll('.collapsible-header').forEach(h => {
        h.classList.remove('active');
        h.nextElementSibling.classList.remove('active');
      });

      // Toggle current
      if (!isActive) {
        header.classList.add('active');
        content.classList.add('active');
      }
    });
  });
}

// ============================================
// Utility Functions
// ============================================

function formatSize(size) {
  if (size === null || size === undefined) return 'N/A';
  if (typeof size === 'number') {
    return size % 1 === 0 ? size.toString() : size.toFixed(1);
  }
  return size.toString();
}

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    convertShoeSize,
    convertClothingSize,
    getAllShoeConversions,
    getAllClothingConversions,
    adjustForBrand,
    adjustClothingSizeForBrand
  };
}
