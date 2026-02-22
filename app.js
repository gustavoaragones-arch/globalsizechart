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
let dataLoaded = false;

// Load JSON data - use embedded data as primary, fetch as fallback for updates
async function loadData() {
  try {
    // Use embedded data immediately (works locally and when deployed)
    shoeData = embeddedShoeData;
    clothingData = embeddedClothingData;
    regionsData = embeddedRegionsData;
    dataLoaded = true;
    console.log('Data loaded from embedded source');

    // Try to fetch updated data in background (optional, for future updates)
    try {
      const [shoeResponse, clothingResponse, regionsResponse] = await Promise.all([
        fetch('data/shoe_sizes.json'),
        fetch('data/clothing_sizes.json'),
        fetch('data/regions.json')
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Show loading state
  const forms = document.querySelectorAll('.converter-form');
  forms.forEach(form => {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      // Store original text
      if (!submitBtn.getAttribute('data-original-text')) {
        submitBtn.setAttribute('data-original-text', submitBtn.textContent);
      }
      submitBtn.disabled = true;
      submitBtn.textContent = 'Loading...';
    }
  });

  await loadData();

  // Phase 14A: Default "From Region" by page path
  applyRegionalDefault();

  // Enable forms after data loads
  forms.forEach(form => {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      const originalText = submitBtn.getAttribute('data-original-text') || 'Convert Size';
      submitBtn.textContent = originalText;
    }
  });

  initializeConverters();
  initializeCollapsibles();
  initializeCategoryToggle();
});

// ============================================
// Category Toggle (Shoes/Clothing)
// ============================================

function initializeCategoryToggle() {
  const categorySelects = document.querySelectorAll('[name="category"]');
  categorySelects.forEach(select => {
    select.addEventListener('change', () => {
      const form = select.closest('form');
      const clothingCategoryGroup = form?.querySelector('#clothingCategoryGroup');
      const fromRegionSelect = form?.querySelector('[name="fromRegion"]');
      const sizeInput = form?.querySelector('[name="size"]');
      
      if (select.value === 'clothing') {
        if (clothingCategoryGroup) {
          clothingCategoryGroup.style.display = 'flex';
        }
        if (fromRegionSelect) {
          const cmOption = fromRegionSelect.querySelector('option[value="CM"]');
          if (cmOption) cmOption.style.display = 'none';
        }
        if (sizeInput && sizeInput.dataset.placeholderClothing) {
          sizeInput.placeholder = sizeInput.dataset.placeholderClothing;
        }
      } else {
        if (clothingCategoryGroup) {
          clothingCategoryGroup.style.display = 'none';
        }
        if (fromRegionSelect) {
          const cmOption = fromRegionSelect.querySelector('option[value="CM"]');
          if (cmOption) cmOption.style.display = 'block';
        }
        if (sizeInput && sizeInput.dataset.placeholderShoe) {
          sizeInput.placeholder = sizeInput.dataset.placeholderShoe;
        }
      }
      if (typeof updateConvertButtonState === 'function') updateConvertButtonState(form);
    });
    
    if (select.value === 'clothing') {
      select.dispatchEvent(new Event('change'));
    }
  });
}

// ============================================
// Shoe Size Conversion
// ============================================

function convertShoeSize(size, fromRegion, toRegion, gender) {
  if (!shoeData[gender] || !size) return null;

  const genderData = shoeData[gender];
  
  // Find the entry with the matching size in the source region
  let sourceEntry = null;
  for (const entry of genderData) {
    if (entry[fromRegion.toLowerCase()] === parseFloat(size)) {
      sourceEntry = entry;
      break;
    }
  }

  if (!sourceEntry) return null;

  // Return the size in the target region
  const targetKey = toRegion.toLowerCase();
  return sourceEntry[targetKey] !== undefined ? sourceEntry[targetKey] : null;
}

function convertShoeFromCM(cm, gender) {
  if (!shoeData[gender] || !cm) return null;

  const genderData = shoeData[gender];
  
  // Find closest match by CM
  let closest = null;
  let minDiff = Infinity;

  for (const entry of genderData) {
    if (entry.cm) {
      const diff = Math.abs(entry.cm - parseFloat(cm));
      if (diff < minDiff) {
        minDiff = diff;
        closest = entry;
      }
    }
  }

  return closest;
}

function getAllShoeConversions(size, fromRegion, gender) {
  if (!shoeData[gender]) return {};

  const genderData = shoeData[gender];
  let sourceEntry = null;
  const sizeNum = parseFloat(size);
  const regionKey = fromRegion.toLowerCase();

  // Find source entry - try exact match first, then closest match
  for (const entry of genderData) {
    const entryValue = entry[regionKey];
    if (entryValue !== undefined && entryValue !== null) {
      // Handle both numeric and string comparisons
      if (entryValue === sizeNum || entryValue === size || 
          parseFloat(entryValue) === sizeNum || String(entryValue).toLowerCase() === String(size).toLowerCase()) {
        sourceEntry = entry;
        break;
      }
    }
  }

  // If no exact match, try closest numeric match
  if (!sourceEntry && !isNaN(sizeNum)) {
    let closest = null;
    let minDiff = Infinity;
    for (const entry of genderData) {
      const entryValue = entry[regionKey];
      if (entryValue !== undefined && entryValue !== null) {
        const entryNum = parseFloat(entryValue);
        if (!isNaN(entryNum)) {
          const diff = Math.abs(entryNum - sizeNum);
          if (diff < minDiff) {
            minDiff = diff;
            closest = entry;
          }
        }
      }
    }
    sourceEntry = closest;
  }

  if (!sourceEntry) return {};

  return {
    us: sourceEntry.us,
    uk: sourceEntry.uk,
    eu: sourceEntry.eu,
    jp: sourceEntry.jp,
    cn: sourceEntry.cn,
    cm: sourceEntry.cm
  };
}

// ============================================
// Clothing Size Conversion
// ============================================

function convertClothingSize(size, fromRegion, toRegion, gender, category) {
  if (!clothingData[gender] || !clothingData[gender][category] || !size) return null;

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

function getAllClothingConversions(size, fromRegion, gender, category) {
  if (!clothingData[gender] || !clothingData[gender][category]) {
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
  const ranges = {
    shoes: {
      men: {
        US: [3, 18],
        UK: [2, 17],
        EU: [35, 52],
        JP: [21, 32],
        CM: [21, 32]
      },
      women: {
        US: [4, 16],
        UK: [2, 14],
        EU: [34, 46],
        JP: [21, 30],
        CM: [21, 30]
      },
      kids: {
        US: [1, 13],
        EU: [16, 35],
        CM: [9, 22]
      }
    }
  };

  const regionRanges = ranges[category] && ranges[category][gender] && ranges[category][gender][region];
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

/**
 * Enable convert button only when size input is valid.
 * Shoes: numeric format + within range for current gender/region. Clothing: XS–XXXL or numeric.
 */
function updateConvertButtonState(form) {
  const category = form.querySelector('[name="category"]')?.value;
  const sizeInput = form.querySelector('[name="size"]');
  const sizeRaw = sizeInput?.value;
  const fromRegion = form.querySelector('[name="fromRegion"]')?.value;
  const gender = form.querySelector('[name="gender"]')?.value;
  const isClothing = category === 'clothing';
  let valid = false;
  if (isClothing) {
    valid = validateClothingSize(sizeRaw);
  } else {
    if (!validateShoeSize(sizeRaw)) valid = false;
    else {
      const num = parseFloat(sizeRaw);
      if (num < 0 || num > 60) valid = false;
      else valid = validateSize('shoes', gender, fromRegion, num);
    }
  }
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = !valid;
}

function initializeConverters() {
  const forms = document.querySelectorAll('.converter-form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleConversion(form);
    });

    const sizeInput = form.querySelector('[name="size"]');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    // Clear shoe size error on input/change (no auto-convert for shoe form when invalid)
    const shoeErrorEl = form.querySelector('#shoe-size-error');
    if (sizeInput && shoeErrorEl) {
      const clearError = () => {
        shoeErrorEl.style.display = 'none';
        shoeErrorEl.textContent = '';
      };
      sizeInput.addEventListener('input', clearError);
      sizeInput.addEventListener('change', clearError);
    }
    // Clear clothing size error on input
    const clothingErrorEl = form.querySelector('#clothing-size-error');
    if (sizeInput && clothingErrorEl) {
      const clearClothingError = () => {
        clothingErrorEl.style.display = 'none';
        clothingErrorEl.textContent = '';
      };
      sizeInput.addEventListener('input', clearClothingError);
      sizeInput.addEventListener('change', clearClothingError);
    }

    const syncButtonState = () => updateConvertButtonState(form);
    if (sizeInput) {
      sizeInput.addEventListener('input', syncButtonState);
      sizeInput.addEventListener('change', syncButtonState);
    }
    const categorySelect = form.querySelector('[name="category"]');
    if (categorySelect) {
      categorySelect.addEventListener('change', syncButtonState);
    }

    updateConvertButtonState(form);

    // Auto-convert on input change
    const inputs = form.querySelectorAll('select, input');
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        if (form.dataset.autoConvert !== 'false') {
          handleConversion(form);
        }
      });
    });
  });
}

function handleConversion(form) {
  if (!dataLoaded) {
    console.warn('Data not loaded yet, please wait...');
    alert('Please wait for the size data to load, then try again.');
    return;
  }

  const category = form.querySelector('[name="category"]')?.value;
  const fromRegion = form.querySelector('[name="fromRegion"]')?.value;
  const toRegion = form.querySelector('[name="toRegion"]')?.value;
  const sizeInput = form.querySelector('[name="size"]');
  const sizeRaw = sizeInput?.value;
  const size = category === 'clothing' ? sizeRaw?.trim() : sizeRaw;
  const gender = form.querySelector('[name="gender"]')?.value;
  const clothingCategory = form.querySelector('[name="clothingCategory"]')?.value;

  if (!fromRegion || !gender) {
    console.warn('Missing required fields:', { size: sizeRaw, fromRegion, gender });
    return;
  }

  if (category === 'shoes' || !category) {
    if (!validateShoeSize(sizeRaw)) {
      const formSection = form.closest('.converter-card');
      const shoeErrorEl = formSection?.querySelector('#shoe-size-error') || form.querySelector('#shoe-size-error');
      if (shoeErrorEl) {
        shoeErrorEl.textContent = SHOE_SIZE_ERROR_MSG;
        shoeErrorEl.style.display = 'block';
      }
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
      return;
    }
    if (!validateSize('shoes', gender, fromRegion, sizeNum)) {
      const formSection = form.closest('.converter-card');
      const shoeErrorEl = formSection?.querySelector('#shoe-size-error') || form.querySelector('#shoe-size-error');
      if (shoeErrorEl) {
        shoeErrorEl.textContent = SHOE_SIZE_RANGE_ERROR_MSG;
        shoeErrorEl.style.display = 'block';
      }
      return;
    }
    const shoeErrorEl = form.querySelector('#shoe-size-error');
    if (shoeErrorEl) {
      shoeErrorEl.style.display = 'none';
      shoeErrorEl.textContent = '';
    }
  }

  if (category === 'clothing') {
    if (!validateClothingSize(sizeRaw)) {
      const formSection = form.closest('.converter-card');
      const clothingErrorEl = formSection?.querySelector('#clothing-size-error') || form.querySelector('#clothing-size-error');
      if (clothingErrorEl) {
        clothingErrorEl.textContent = CLOTHING_SIZE_ERROR_MSG;
        clothingErrorEl.style.display = 'block';
      }
      return;
    }
    const clothingErrorEl = form.querySelector('#clothing-size-error');
    if (clothingErrorEl) {
      clothingErrorEl.style.display = 'none';
      clothingErrorEl.textContent = '';
    }
  }

  if (!size) {
    console.warn('Missing size');
    return;
  }

  console.log('Converting:', { category, fromRegion, size, gender, clothingCategory });

  let results = {};
  let bestMatchRegion = toRegion || fromRegion;

  if (category === 'shoes' || !category) {
    // Shoe conversion
    if (fromRegion === 'CM') {
      const closest = convertShoeFromCM(size, gender);
      if (closest) {
        results = {
          us: closest.us,
          uk: closest.uk,
          eu: closest.eu,
          jp: closest.jp,
          cn: closest.cn,
          cm: closest.cm
        };
      }
    } else {
      results = getAllShoeConversions(size, fromRegion, gender);
    }
  } else if (category === 'clothing') {
    // Clothing conversion
    results = getAllClothingConversions(size, fromRegion, gender, clothingCategory || 'tops');
  }

  console.log('Conversion results:', results);

  // Find the results container within this form's parent section
  const formSection = form.closest('.converter-card');
  const resultsContainer = formSection?.querySelector('.results');
  
  if (resultsContainer) {
    displayResults(results, bestMatchRegion, category === 'shoes' || !category, resultsContainer);
  } else {
    console.error('Results container not found');
  }

  // Phase 13.5: show fit notice only for shoe conversions when results are shown
  const fitNotice = formSection?.querySelector('.fit-notice');
  if (fitNotice) {
    const isShoeConversion = category === 'shoes' || !category;
    const hasResults = results && Object.keys(results).length > 0;
    fitNotice.style.display = isShoeConversion && hasResults ? 'block' : 'none';
  }
}

function displayResults(results, bestMatchRegion, isShoe = true, resultsContainer = null) {
  if (!resultsContainer) {
    resultsContainer = document.querySelector('.results');
  }
  if (!resultsContainer) {
    console.error('Results container not found');
    return;
  }

  const resultsGrid = resultsContainer.querySelector('.results-grid');
  if (!resultsGrid) {
    console.error('Results grid not found');
    return;
  }

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
  
  // Scroll to results
  resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    getAllClothingConversions
  };
}
