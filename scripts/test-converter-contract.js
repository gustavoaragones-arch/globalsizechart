#!/usr/bin/env node
/**
 * Phase 3 Step 10 — Automated converter data-contract test.
 *
 * Verifies the core Phase 3 invariant: DATA -> OPTIONS -> VALIDATION are one
 * consistent contract.
 *   - If a value is offered as a selectable option, the shared validator MUST
 *     accept it.
 *   - If the shared validator rejects a value, it MUST NOT be offered as a
 *     selectable option.
 *
 * Runs app.js in a minimal stubbed DOM (no jsdom dependency in this repo) so the
 * real runtime functions — not a reimplementation — are what gets tested.
 *
 * Usage: node scripts/test-converter-contract.js
 * Exit code 0 = all checks passed, 1 = at least one failure.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// --- Minimal DOM stub so app.js's top-level init code doesn't throw on require() ---
global.document = {
  readyState: 'complete',
  addEventListener() {},
  querySelectorAll() { return []; },
  querySelector() { return null; },
  createElement() {
    return { setAttribute() {}, appendChild() {}, style: {}, classList: { add() {}, remove() {} } };
  }
};
global.window = { location: { pathname: '/', search: '' } };

const app = require(path.join(ROOT, 'app.js'));

let failures = 0;
let passed = 0;

function check(label, condition) {
  if (condition) {
    passed++;
  } else {
    failures++;
    console.error('FAIL: ' + label);
  }
}

function assertValid(label, actual) {
  check(label, actual === true);
}

function assertInvalid(label, actual) {
  check(label, actual === false);
}

// ============================================
// Setup
// ============================================
const sizeDatabase = app._initEmbeddedDataForTests();

// ============================================
// A. Shoe invariant — every dataset-offered size validates
// ============================================
const SHOE_GENDERS = ['men', 'women', 'kids'];
const UNSUPPORTED_SHOE_REGIONS = ['KR', 'INCH'];

for (const gender of SHOE_GENDERS) {
  const regions = app.getAvailableShoeRegions(gender);
  check(`${gender}: has at least one shoe region with data`, regions.length > 0);
  for (const bad of UNSUPPORTED_SHOE_REGIONS) {
    check(`${gender}: ${bad} is NOT offered as a shoe region (no dataset)`, !regions.includes(bad));
  }
  for (const region of regions) {
    const sizes = app.getAvailableShoeSizes(gender, region);
    check(`${gender}/${region}: has at least one dataset-backed size`, sizes.length > 0);
    for (const s of sizes) {
      assertValid(`${gender}/${region}/${s.value}: dataset size validates`, app.isValidShoeSize(gender, region, s.value));
      assertValid(`${gender}/${region}/${s.value}: validateSize('shoes',...) agrees`, app.validateSize('shoes', gender, region, s.value));
    }
  }
}

// Explicit CONV-002/CONV-003 regression cases from the Phase 2 audit — previously
// rejected by a hardcoded range table despite existing in the dataset.
const PREVIOUSLY_BROKEN_SHOE_CASES = [
  ['kids', 'UK', 9],
  ['kids', 'JP', 17],
  ['kids', 'EU', 37.5],
  ['kids', 'CM', 24.5],
  ['men', 'JP', 32.5],
  ['men', 'JP', 33]
];
for (const [gender, region, size] of PREVIOUSLY_BROKEN_SHOE_CASES) {
  assertValid(`regression CONV-002/003: ${gender}/${region}/${size} now validates`, app.isValidShoeSize(gender, region, size));
}

// Standard conversions must not regress.
const STANDARD_SHOE_CASES = [
  ['men', 'US', 9],
  ['men', 'EU', 42],
  ['men', 'UK', 8],
  ['women', 'US', 8],
  ['kids', 'US', 11]
];
for (const [gender, region, size] of STANDARD_SHOE_CASES) {
  assertValid(`standard case: ${gender}/${region}/${size} still validates`, app.isValidShoeSize(gender, region, size));
}

// Out-of-dataset values must still be rejected — the contract isn't a rubber stamp.
assertInvalid('men/US/999 (nonsense size) is rejected', app.isValidShoeSize('men', 'US', 999));
assertInvalid('men/KR/9 (no KR dataset) is rejected', app.isValidShoeSize('men', 'KR', 9));
assertInvalid('men/INCH/9 (no INCH dataset) is rejected', app.isValidShoeSize('men', 'INCH', 9));

// ============================================
// B. Clothing invariant — every dataset-offered size validates
// ============================================
const CLOTHING_GARMENTS = ['tops', 'pants', 'dresses'];

for (const gender of SHOE_GENDERS) {
  for (const garment of CLOTHING_GARMENTS) {
    const regions = app.getAvailableClothingRegions(gender, garment);
    for (const region of regions) {
      const sizes = app.getAvailableClothingSizes(gender, garment, region);
      check(`${gender}/${garment}/${region}: has at least one dataset-backed size`, sizes.length > 0);
      for (const s of sizes) {
        assertValid(`${gender}/${garment}/${region}/${s.value}: dataset size validates`, app.isValidClothingSize(gender, garment, region, s.value));
      }
    }
  }
}

// Step 11 browser-matrix named regression cases (dedicated + homepage converters).
assertValid('matrix: men/tops/US/L validates', app.isValidClothingSize('men', 'tops', 'US', 'L'));
assertValid('matrix: women/dresses/US/M validates', app.isValidClothingSize('women', 'dresses', 'US', 'M'));
assertValid('matrix: women/skirts/US/M validates (alias -> dresses)', app.isValidClothingSize('women', 'skirts', 'US', 'M'));
// NOTE: the Phase 3 brief's browser matrix lists "Kids Tops US M", but kids' tops
// sizing in the actual dataset is numeric/age-based (US 4-14), not letter sizes —
// "M" was never a real dataset value for this combination. Per the "do not invent
// missing dataset values" rule, this checks a real kids/tops/US value instead of
// fabricating an "M" entry; see the Phase 3 report for this discrepancy.
assertValid('matrix: kids/tops/US/8 validates (kids tops use numeric sizing, not M/L/XL)', app.isValidClothingSize('kids', 'tops', 'US', '8'));
assertInvalid('matrix: kids/tops/US/M correctly rejected (no letter sizes in kids tops dataset)', app.isValidClothingSize('kids', 'tops', 'US', 'M'));
assertValid('matrix: shoe CN 42 (men) validates', app.isValidShoeSize('men', 'CN', 42));
assertInvalid('matrix: shoe size "abc" fails format check', app.validateShoeSize('abc'));

// No-phantom-garment invariant (CONV-005): men's and kids' dresses have no dataset,
// so the contract must report zero available regions/sizes for that combination.
check('men/dresses: no dataset regions (CONV-005)', app.getAvailableClothingRegions('men', 'dresses').length === 0);
check('kids/dresses: no dataset regions', app.getAvailableClothingRegions('kids', 'dresses').length === 0);
assertInvalid('men/dresses/US/M is rejected (no data)', app.isValidClothingSize('men', 'dresses', 'US', 'M'));

// CONV-004 regression: JP/CN large labels exist in the dataset and must now validate.
assertValid('men/tops/JP/XXXXL validates (CONV-004)', app.isValidClothingSize('men', 'tops', 'JP', 'XXXXL'));
assertValid('men/tops/CN/XXXXL validates (CONV-004)', app.isValidClothingSize('men', 'tops', 'CN', 'XXXXL'));
assertValid('men/pants/JP/XXXXXL validates (CONV-004)', app.isValidClothingSize('men', 'pants', 'JP', 'XXXXXL'));

// But XXXXL must not become valid for a combination that doesn't have it.
assertInvalid('women/dresses/US/XXXXL is rejected (not in that dataset)', app.isValidClothingSize('women', 'dresses', 'US', 'XXXXL'));

// ============================================
// C. Broken-link invariant (P0 / GATE F)
// ============================================
const SELF_PATH = __filename;

function grepRepoForLiveRefs(needle) {
  const hits = [];
  const skipDirs = new Set(['node_modules', '.git', 'reports']);
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
      } else if (/\.(html|js)$/.test(entry.name)) {
        const full = path.join(dir, entry.name);
        if (full === SELF_PATH) continue; // this test file legitimately contains the needle as a string literal
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes(needle)) hits.push(full);
      }
    }
  })(ROOT);
  return hits;
}

const brokenShoeRefs = grepRepoForLiveRefs('/tools/shoe-size-converter.html');
const brokenClothingRefs = grepRepoForLiveRefs('/tools/clothing-size-converter.html');
check('zero live refs to /tools/shoe-size-converter.html', brokenShoeRefs.length === 0);
check('zero live refs to /tools/clothing-size-converter.html', brokenClothingRefs.length === 0);
if (brokenShoeRefs.length) console.error('  found in:', brokenShoeRefs.slice(0, 5));
if (brokenClothingRefs.length) console.error('  found in:', brokenClothingRefs.slice(0, 5));

check('/shoe-size-converter.html exists', fs.existsSync(path.join(ROOT, 'shoe-size-converter.html')));
check('/clothing-size-converter.html exists', fs.existsSync(path.join(ROOT, 'clothing-size-converter.html')));

// ============================================
// D. No unsupported KR/INCH controls anywhere in generated HTML (GATE H)
// ============================================
function grepRepoForPattern(regex) {
  const hits = [];
  const skipDirs = new Set(['node_modules', '.git', 'reports']);
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
      } else if (entry.name.endsWith('.html')) {
        const full = path.join(dir, entry.name);
        const content = fs.readFileSync(full, 'utf8');
        if (regex.test(content)) hits.push(full);
      }
    }
  })(ROOT);
  return hits;
}

const krInchHits = grepRepoForPattern(/value="KR"|value="INCH"/);
check('zero live <option value="KR"|"INCH"> anywhere in the site', krInchHits.length === 0);
if (krInchHits.length) console.error('  found in:', krInchHits.slice(0, 5));

// ============================================
// E. Step 7/8 — garment filtering + clothing landing-page deep link
// (minimal hand-rolled fake DOM; no jsdom dependency in this repo)
// ============================================
function makeOption(value) {
  return { value, disabled: false, hidden: false, tagName: 'OPTION' };
}
function makeSelect(name, values, initialValue) {
  const options = values.map(makeOption);
  let _value = initialValue !== undefined ? initialValue : (options[0] ? options[0].value : '');
  return {
    tagName: 'SELECT',
    name,
    options,
    get value() { return _value; },
    set value(v) { _value = v; }
  };
}
function makeInput(name, value) {
  return { tagName: 'INPUT', name, value: value || '' };
}
/** hasClothingCategoryGroup=true mimics a main-combo form (isMainComboForm -> true). */
function makeForm(fields, { hasClothingCategoryGroup = false } = {}) {
  return {
    querySelector(sel) {
      if (sel === '#clothingCategoryGroup') return hasClothingCategoryGroup ? {} : null;
      const m = sel.match(/^\[name="([^"]+)"\]$/);
      if (m) return fields[m[1]] || null;
      return null;
    }
  };
}

// Step 7: dedicated (non-main-combo) clothing form must hide garments the dataset
// doesn't support for the selected gender, using the same CLOTHING_TYPES_BY_GENDER
// authority the main combo form already uses.
{
  const clothingSel = makeSelect('clothingCategory', ['tops', 'pants', 'dresses'], 'tops');
  const form = makeForm({
    gender: makeSelect('gender', ['men', 'women', 'kids'], 'men'),
    clothingCategory: clothingSel,
    category: makeInput('category', 'clothing')
  });
  app.filterClothingCategoryByGender(form);
  const dresses = clothingSel.options.find((o) => o.value === 'dresses');
  check('Step 7: men -> dresses option hidden (no dataset, CONV-005)', dresses.hidden === true && dresses.disabled === true);
  check('Step 7: men -> tops option stays enabled', clothingSel.options.find((o) => o.value === 'tops').disabled === false);
}
{
  // Previously-selected now-disallowed value must be reassigned, not left dangling.
  const clothingSel = makeSelect('clothingCategory', ['tops', 'pants', 'dresses'], 'dresses');
  const form = makeForm({
    gender: makeSelect('gender', ['men', 'women', 'kids'], 'men'),
    clothingCategory: clothingSel,
    category: makeInput('category', 'clothing')
  });
  app.filterClothingCategoryByGender(form);
  check('Step 7: men -> previously-selected "dresses" reassigned away', clothingSel.value !== 'dresses');
}
{
  const clothingSel = makeSelect('clothingCategory', ['tops', 'pants', 'dresses'], 'tops');
  const form = makeForm({
    gender: makeSelect('gender', ['men', 'women', 'kids'], 'women'),
    clothingCategory: clothingSel,
    category: makeInput('category', 'clothing')
  });
  app.filterClothingCategoryByGender(form);
  check('Step 7: women -> dresses option stays available', clothingSel.options.find((o) => o.value === 'dresses').disabled === false);
}

// Step 8: clothing landing-page deep link (?gender=&clothing=&from=&size=&to=)
{
  global.window.location.search = '?gender=women&clothing=dresses&from=US&size=8&to=EU';
  const genderSel = makeSelect('gender', ['men', 'women', 'kids'], 'men');
  const clothingSel = makeSelect('clothingCategory', ['tops', 'pants', 'dresses'], 'tops');
  const regionSel = makeSelect('fromRegion', ['US', 'UK', 'EU', 'JP', 'CN'], 'US');
  const toRegionEl = makeInput('toRegion', '');
  const sizeInput = makeInput('size', '');
  const form = makeForm({
    gender: genderSel,
    clothingCategory: clothingSel,
    fromRegion: regionSel,
    toRegion: toRegionEl,
    size: sizeInput,
    category: makeInput('category', 'clothing')
  });
  app.applyDeepLinkParams(form);
  check('Step 8: deep link sets gender=women', genderSel.value === 'women');
  check('Step 8: deep link sets clothingCategory=dresses', clothingSel.value === 'dresses');
  check('Step 8: deep link sets fromRegion=US', regionSel.value === 'US');
  check('Step 8: deep link sets hidden toRegion=EU (best-match highlight)', toRegionEl.value === 'EU');
  check('Step 8: deep link pre-fills size input=8', sizeInput.value === '8');
}
{
  // No query params -> no-op, must not disturb a normal direct visit.
  global.window.location.search = '';
  const genderSel = makeSelect('gender', ['men', 'women', 'kids'], 'men');
  const form = makeForm({
    gender: genderSel,
    clothingCategory: makeSelect('clothingCategory', ['tops', 'pants', 'dresses'], 'tops'),
    fromRegion: makeSelect('fromRegion', ['US', 'UK', 'EU'], 'US'),
    size: makeInput('size', ''),
    category: makeInput('category', 'clothing')
  });
  app.applyDeepLinkParams(form);
  check('Step 8: no query params -> gender untouched', genderSel.value === 'men');
}
{
  // Main-combo forms (homepage) are not a landing-page deep-link target -> no-op.
  global.window.location.search = '?gender=women&clothing=dresses&from=US&size=8&to=EU';
  const genderSel = makeSelect('gender', ['', 'men', 'women', 'kids'], '');
  const form = makeForm(
    { gender: genderSel, clothingCategory: makeSelect('clothingCategory', ['', 'tops'], ''), category: makeInput('category', 'clothing') },
    { hasClothingCategoryGroup: true }
  );
  app.applyDeepLinkParams(form);
  check('Step 8: main-combo form is not a deep-link target (no-op)', genderSel.value === '');
}

// ============================================
// F. Step 12 — network fallback: embedded data must survive a fetch failure,
// and a successful fetch must still replace it (async, run last, before summary).
// ============================================
async function runNetworkFallbackTests() {
  // F1: fetch throws entirely (offline / DNS failure / CORS) -> embedded data must
  // still initialize and dataLoaded must still become true. No uncaught exception.
  global.fetch = () => Promise.reject(new Error('simulated network failure'));
  let threw = false;
  try {
    await app.loadData();
  } catch (e) {
    threw = true;
  }
  check('Step 12: loadData() does not throw when fetch fails entirely', !threw);
  let state = app._getRuntimeStateForTests();
  check('Step 12: dataLoaded=true after fetch failure (embedded data used)', state.dataLoaded === true);
  check('Step 12: shoeData populated after fetch failure', !!(state.shoeData && state.shoeData.men && state.shoeData.men.length));
  check('Step 12: clothingData populated after fetch failure', !!(state.clothingData && state.clothingData.men));

  // F2: fetch resolves but not .ok (e.g. 404/500 on data/*.json) -> same guarantee.
  global.fetch = () => Promise.resolve({ ok: false });
  threw = false;
  try {
    await app.loadData();
  } catch (e) {
    threw = true;
  }
  check('Step 12: loadData() does not throw when fetch responses are non-ok', !threw);
  state = app._getRuntimeStateForTests();
  check('Step 12: embedded data still usable after non-ok fetch responses', state.dataLoaded === true && !!state.shoeData.men);

  // F3: fetch succeeds -> background JSON replaces embedded data as designed.
  const distinctShoeData = { men: [{ us: 9, uk: 8, eu: 42, jp: 28, cn: 42, cm: 27.0 }], women: [], kids: [] };
  const distinctClothingData = { men: { tops: [] }, women: {}, kids: {} };
  const distinctRegionsData = { regions: [{ region_code: 'US', region_name: 'United States' }] };
  global.fetch = (url) => {
    if (String(url).includes('shoe_sizes')) return Promise.resolve({ ok: true, json: () => Promise.resolve(distinctShoeData) });
    if (String(url).includes('clothing_sizes')) return Promise.resolve({ ok: true, json: () => Promise.resolve(distinctClothingData) });
    if (String(url).includes('regions')) return Promise.resolve({ ok: true, json: () => Promise.resolve(distinctRegionsData) });
    if (String(url).includes('brands')) return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    return Promise.resolve({ ok: false });
  };
  await app.loadData();
  state = app._getRuntimeStateForTests();
  check('Step 12: successful fetch replaces shoeData with fetched JSON', state.shoeData === distinctShoeData);
  check('Step 12: successful fetch replaces clothingData with fetched JSON', state.clothingData === distinctClothingData);

  // Rebuild the contract's dataset from the fetched data and confirm the contract
  // still holds after a live replacement (not just at embedded-data boot time).
  const rebuiltDb = app.buildSizeDatabase();
  check('Step 12: contract still holds after fetched-data replacement', app.isValidShoeSize('men', 'US', 9) === true);

  delete global.fetch;
  // Restore embedded data for anyone re-running checks after this point.
  app._initEmbeddedDataForTests();
}

// ============================================
// Summary
// ============================================
runNetworkFallbackTests().then(() => {
  console.log(`\n${passed} passed, ${failures} failed.`);
  process.exit(failures > 0 ? 1 : 0);
});
