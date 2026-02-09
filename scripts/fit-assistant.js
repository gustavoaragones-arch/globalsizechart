/**
 * Fit Assistant — local logic only. No external APIs, no LLM.
 * Deterministic rules: foot length, garment measurements, region, brand, fit preference
 * → recommended sizes, fit warnings, alternative sizes, related converters, measurement advice.
 *
 * Browser: window.FitAssistant.run(inputs, data)
 * Node: require and call FitAssistant.run(inputs, data)
 */

(function (global) {
  'use strict';

  var REGIONS = ['US', 'UK', 'EU', 'JP', 'CN'];
  var FIT_PREFERENCE = ['tight', 'regular', 'loose'];

  /** Brand fit notes: deterministic, no API. Lowercase key. */
  var BRAND_FIT = {
    nike: 'runs_small',
    adidas: 'runs_small',
    puma: 'true_to_size',
    'new balance': 'true_to_size',
    zara: 'runs_small',
    hm: 'true_to_size',
    shein: 'runs_small',
    uniqlo: 'runs_small',
    asos: 'true_to_size',
    levis: 'runs_large',
    "levi's": 'runs_large'
  };

  function normalizeBrand(s) {
    if (!s || typeof s !== 'string') return '';
    return s.toLowerCase().trim();
  }

  /**
   * Find closest shoe size row by foot length (cm).
   */
  function findShoeByCm(shoeData, footCm, gender) {
    var arr = shoeData && shoeData[gender];
    if (!arr || !arr.length || footCm == null || footCm === '' || isNaN(Number(footCm))) return null;
    var val = Number(footCm);
    var best = null;
    var bestDiff = Infinity;
    for (var i = 0; i < arr.length; i++) {
      var cm = arr[i].cm;
      var d = Math.abs(cm - val);
      if (d < bestDiff) {
        bestDiff = d;
        best = arr[i];
      }
    }
    return best;
  }

  /**
   * Get adjacent shoe size row (index + 1 or - 1).
   */
  function getAdjacentShoeRow(shoeData, gender, currentRow, direction) {
    var arr = shoeData && shoeData[gender];
    if (!arr || !currentRow) return null;
    var idx = -1;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].cm === currentRow.cm && arr[i].us === currentRow.us) {
        idx = i;
        break;
      }
    }
    if (idx < 0) return null;
    var next = idx + (direction === 'up' ? 1 : -1);
    if (next < 0 || next >= arr.length) return null;
    return arr[next];
  }

  /**
   * Find clothing size by measurement. category: tops | pants | dresses.
   * Tops/dresses: match chest then hips; pants: match waist.
   */
  function findClothingByMeasurements(clothingData, gender, category, chestCm, waistCm, hipsCm) {
    var cat = clothingData && clothingData[gender] && clothingData[gender][category];
    if (!cat || !cat.length) return null;
    var key = category === 'pants' ? 'waist_cm' : 'chest_cm';
    var val = category === 'pants'
      ? (waistCm != null && waistCm !== '' && !isNaN(Number(waistCm)) ? Number(waistCm) : null)
      : (chestCm != null && chestCm !== '' && !isNaN(Number(chestCm)) ? Number(chestCm) : null);
    if (val == null) return null;
    var best = null;
    var bestDiff = Infinity;
    for (var i = 0; i < cat.length; i++) {
      var v = cat[i][key];
      if (v == null || v === 0) continue;
      var d = Math.abs(v - val);
      if (d < bestDiff) {
        bestDiff = d;
        best = cat[i];
      }
    }
    return best;
  }

  /**
   * Build fit warnings from brand and fit preference (deterministic).
   */
  function getFitWarnings(brand, fitPreference, hasShoe, hasClothing) {
    var out = [];
    var b = normalizeBrand(brand);
    if (b && BRAND_FIT[b]) {
      var fit = BRAND_FIT[b];
      if (fit === 'runs_small' && hasShoe) out.push('This brand often runs small in shoes. Consider trying half a size up if you prefer more room.');
      if (fit === 'runs_small' && hasClothing) out.push('This brand often runs small in clothing. Consider sizing up if between sizes.');
      if (fit === 'runs_large' && hasShoe) out.push('This brand often runs large in shoes. You may prefer half a size down for a snug fit.');
      if (fit === 'runs_large' && hasClothing) out.push('This brand often runs large in clothing. Consider sizing down if between sizes.');
    }
    if (fitPreference === 'tight' && hasShoe) out.push('You prefer a tighter fit. The recommendation may be exact or slightly snug; try the same or half size down.');
    if (fitPreference === 'loose' && hasShoe) out.push('You prefer a looser fit. Consider half a size up from the base recommendation for extra room.');
    return out;
  }

  /**
   * Build alternative sizes (half size up/down, or adjacent) based on fit preference.
   */
  function getAlternativeSizes(shoeData, gender, baseRow, fitPreference, region) {
    var out = [];
    if (!baseRow || !shoeData) return out;
    var up = getAdjacentShoeRow(shoeData, gender, baseRow, 'up');
    var down = getAdjacentShoeRow(shoeData, gender, baseRow, 'down');
    if (fitPreference === 'loose' && up) {
      out.push({ label: 'Half size up (more room)', sizes: { us: up.us, uk: up.uk, eu: up.eu, jp: up.jp, cm: up.cm }, region: region });
    }
    if (fitPreference === 'tight' && down) {
      out.push({ label: 'Half size down (snugger fit)', sizes: { us: down.us, uk: down.uk, eu: down.eu, jp: down.jp, cm: down.cm }, region: region });
    }
    if (fitPreference === 'regular') {
      if (up) out.push({ label: 'Or half size up', sizes: { us: up.us, uk: up.uk, eu: up.eu, jp: up.jp, cm: up.cm }, region: region });
      if (down) out.push({ label: 'Or half size down', sizes: { us: down.us, uk: down.uk, eu: down.eu, jp: down.jp, cm: down.cm }, region: region });
    }
    return out;
  }

  /**
   * Related converter links (deterministic list by context). Base path for programmatic pages.
   */
  function getRelatedConverters(region, gender, category, basePath) {
    basePath = basePath || '../programmatic-pages';
    var links = [];
    var g = (gender || 'men').toLowerCase();
    if (region === 'EU') {
      links.push({ label: 'EU to US shoe size', url: basePath + '/eu-to-us-shoe-size.html' });
      links.push({ label: 'EU to UK shoe size', url: basePath + '/eu-to-uk-shoe-size.html' });
    }
    if (region === 'UK') {
      links.push({ label: 'UK to US shoe size', url: basePath + '/uk-to-us-shoe-size.html' });
      links.push({ label: 'EU to UK shoe size', url: basePath + '/eu-to-uk-shoe-size.html' });
    }
    if (region === 'US') {
      links.push({ label: 'US to EU shoe size', url: basePath + '/us-to-eu-shoe-size.html' });
      links.push({ label: 'US to UK shoe size', url: basePath + '/us-to-uk-shoe-size.html' });
    }
    if (region === 'JP') {
      links.push({ label: 'Japan to US shoe size', url: basePath + '/japan-to-us-shoe-size.html' });
    }
    links.push({ label: (g === 'men' ? "Men's" : g === 'women' ? "Women's" : "Kids'") + ' shoe size converter', url: basePath + '/' + (g === 'men' ? 'mens' : g === 'women' ? 'womens' : 'kids') + '-shoe-size-converter.html' });
    if (category && category !== 'shoes') {
      links.push({ label: 'Clothing size converters', url: '../clothing-size-pages.html' });
    }
    return links.slice(0, 6);
  }

  /**
   * Measurement advice (deterministic tips).
   */
  function getMeasurementAdvice(hasFoot, hasChest, hasWaist, hasHips, garmentCategory) {
    var out = [];
    if (hasFoot) {
      out.push('Measure foot length from heel to longest toe, in the evening when feet are slightly larger. Use the larger foot if they differ.');
    }
    if (hasChest || garmentCategory === 'tops' || garmentCategory === 'dresses') {
      out.push('Chest: measure around the fullest part, under arms, tape horizontal. Keep snug but not tight.');
    }
    if (hasWaist || garmentCategory === 'pants') {
      out.push('Waist: measure at your natural waist (above navel, below ribs).');
    }
    if (hasHips || garmentCategory === 'dresses') {
      out.push('Hips: measure around the fullest part of hips and seat.');
    }
    out.push('Always check the brand\'s own size chart for the specific item—conversions are approximate.');
    return out;
  }

  /**
   * Main entry: run fit assistant with inputs and data. Returns all outputs.
   * @param {object} inputs - { footLengthCm, gender, garmentCategory?, chestCm?, waistCm?, hipsCm?, region, brand?, fitPreference }
   * @param {object} data - { shoeSizes, clothingSizes } (same shape as data/shoe_sizes.json, data/clothing_sizes.json)
   * @param {object} options - { basePath? } for related converter links
   */
  function run(inputs, data, options) {
    options = options || {};
    var shoeData = (data && data.shoeSizes) || null;
    if (!shoeData && data && data.men && data.women && data.kids && !data.clothingSizes) {
      shoeData = data;
    }
    var clothingData = (data && data.clothingSizes) || null;
    if (!clothingData && data && data.men && data.men.tops) {
      clothingData = data;
    }

    var footCm = inputs.footLengthCm;
    var gender = inputs.gender || 'men';
    var region = inputs.region || 'US';
    var brand = inputs.brand || '';
    var fitPreference = FIT_PREFERENCE.indexOf(inputs.fitPreference) >= 0 ? inputs.fitPreference : 'regular';
    var garmentCategory = inputs.garmentCategory || null;
    var chestCm = inputs.chestCm;
    var waistCm = inputs.waistCm;
    var hipsCm = inputs.hipsCm;

    var recommendedSizes = { shoes: null, clothing: null };
    var shoeRow = null;
    if (footCm != null && footCm !== '' && shoeData) {
      shoeRow = findShoeByCm(shoeData, footCm, gender);
      if (shoeRow) {
        recommendedSizes.shoes = {
          us: shoeRow.us,
          uk: shoeRow.uk,
          eu: shoeRow.eu,
          jp: shoeRow.jp,
          cn: shoeRow.cn,
          cm: shoeRow.cm
        };
      }
    }

    var clothingRow = null;
    if (clothingData && garmentCategory && (chestCm != null && chestCm !== '' || waistCm != null && waistCm !== '' || hipsCm != null && hipsCm !== '')) {
      clothingRow = findClothingByMeasurements(clothingData, gender, garmentCategory, chestCm, waistCm, hipsCm);
      if (clothingRow) {
        recommendedSizes.clothing = {
          us: clothingRow.us,
          uk: clothingRow.uk,
          eu: clothingRow.eu,
          jp: clothingRow.jp,
          cn: clothingRow.cn,
          category: garmentCategory
        };
      }
    }

    var fitWarnings = getFitWarnings(brand, fitPreference, !!shoeRow, !!clothingRow);
    var alternativeSizes = getAlternativeSizes(shoeData, gender, shoeRow, fitPreference, region);
    var relatedConverters = getRelatedConverters(region, gender, garmentCategory, options.basePath);
    var measurementAdvice = getMeasurementAdvice(
      footCm != null && footCm !== '',
      chestCm != null && chestCm !== '',
      waistCm != null && waistCm !== '',
      hipsCm != null && hipsCm !== '',
      garmentCategory
    );

    return {
      recommendedSizes: recommendedSizes,
      fitWarnings: fitWarnings,
      alternativeSizes: alternativeSizes,
      relatedConverters: relatedConverters,
      measurementAdvice: measurementAdvice
    };
  }

  var FitAssistant = { run: run };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FitAssistant;
  } else {
    global.FitAssistant = FitAssistant;
  }
})(typeof window !== 'undefined' ? window : global);
