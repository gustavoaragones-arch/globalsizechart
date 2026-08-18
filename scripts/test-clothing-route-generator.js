#!/usr/bin/env node
/**
 * Regression test for the clothing route generator
 * (scripts/generate-phase10-pages.js: expandClothingRoutes, getSourceSize,
 * clothingRouteIdentity, findCanonicalizedDuplicateRoutes).
 *
 * History:
 *  - Phase 5C fixed `size` to come from the from_region-matching column
 *    (getSourceSize) instead of unconditionally from row.us. See
 *    reports/phase-5b-generated-page-integrity-audit.md /
 *    reports/phase-5c-clothing-route-generator-remediation.md.
 *  - Phase 5F additionally fixed the URL SLUG to use that same corrected
 *    value (previously the slug deliberately kept using row.us even after
 *    the Phase 5C fix, which is exactly what made 38 filenames disagree
 *    with their own page content), and added semantic-identity
 *    deduplication against the hand-authored base routes. See
 *    reports/phase-5e-url-migration-architecture-audit.md /
 *    reports/phase-5f-clothing-url-migration.md.
 *
 * Usage: node scripts/test-clothing-route-generator.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

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

const {
  expandClothingRoutes,
  getSourceSize,
  clothingRouteIdentity,
  findCanonicalizedDuplicateRoutes
} = require(path.join(ROOT, 'scripts', 'generate-phase10-pages.js'));
const clothingData = require(path.join(ROOT, 'data', 'clothing_sizes.json'));
const baseRoutes = require(path.join(ROOT, 'data', 'clothing_routes.json'));

// app.js contract, required directly (not reimplemented) — the dataset
// contract, not a hand-rolled check, is the authority on validity.
global.document = { readyState: 'complete', addEventListener() {}, querySelectorAll() { return []; }, querySelector() { return null; }, createElement() { return { setAttribute() {}, appendChild() {}, style: {}, classList: { add() {}, remove() {} } }; } };
global.window = { location: { pathname: '/', search: '' } };
const app = require(path.join(ROOT, 'app.js'));
app._initEmbeddedDataForTests();

// ============================================
// A. getSourceSize() column selection
// ============================================
{
  const row = { us: 'M', eu: '38', uk: '10' };
  check('getSourceSize(row, US) returns row.us', getSourceSize(row, 'US') === 'M');
  check('getSourceSize(row, EU) returns row.eu (not row.us)', getSourceSize(row, 'EU') === '38');
  check('getSourceSize(row, UK) returns row.uk (not row.us)', getSourceSize(row, 'UK') === '10');
  check('getSourceSize(row, unknown region) returns null', getSourceSize(row, 'JP') === null);
}
{
  const rowMissingEu = { us: '9', eu: null, uk: '8' };
  check('getSourceSize returns null (not a substituted value) when the row has no data for the requested region', getSourceSize(rowMissingEu, 'EU') === null);
}

// ============================================
// B. Route construction — Phase 5F: build the full final architecture
// ============================================
check('baseRoutes no longer contains the jacket route (Phase 5F retirement)', !baseRoutes.some((r) => r.slug === 'eu-50-jacket-to-us-size'));
check('exactly 5 base routes remain', baseRoutes.length === 5);

const existingSlugs = new Set(baseRoutes.map((r) => r.slug));
const expanded = expandClothingRoutes(clothingData, existingSlugs, baseRoutes);
const canonicalDupes = findCanonicalizedDuplicateRoutes(clothingData, baseRoutes);
const allRoutes = baseRoutes.concat(expanded, canonicalDupes);

// ---- TEST 5 (per Phase 5F spec Part 8): expected route count ----
check('auto-expanded route count = 117 (120 original - 3 deduped)', expanded.length === 117);
check('canonicalized-duplicate route count = 3', canonicalDupes.length === 3);
check('TOTAL final route count = 125 (5 base + 117 expanded + 3 canonical-override)', allRoutes.length === 125);

// ============================================
// C. TEST 1 — every route's size validates under the real dataset contract
// ============================================
let invalidCount = 0;
const stillInvalid = [];
allRoutes.forEach((r) => {
  if (!app.isValidClothingSize(r.gender, r.category, r.from_region, r.size)) {
    invalidCount++;
    stillInvalid.push(r.slug);
  }
});
check('zero routes are invalid under the dataset contract', invalidCount === 0);
if (invalidCount) console.error('  still invalid:', JSON.stringify(stillInvalid));

// ============================================
// D. TEST 2 — filename's embedded size token equals route.size
// Parser recognizes ALL real size shapes (letters AND numbers) — this is
// the exact class of bug that under-counted mismatches in Phase 5D's first
// pass (it only recognized spelled-out words like "medium", not the bare
// letters "S"/"M"/"L"/"XXXL" the slugs actually use). Do not repeat that.
// ============================================
const LETTER_SIZES = new Set(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL', 'XXXXXL']);
function extractFilenameSize(slug) {
  const tokens = slug.split('-');
  for (const t of tokens) {
    if (/^\d+(\.\d+)?$/.test(t)) return t;
    if (LETTER_SIZES.has(t.toUpperCase())) return t.toUpperCase();
  }
  return null;
}
let filenameMismatches = 0;
const mismatchList = [];
// Only the generated (base + expanded) routes have a slug directly derived
// from their own size; canonical-override routes share this property too
// (their slug is unchanged from before — they're the pre-existing expanded
// duplicate pages, still self-consistent internally).
allRoutes.forEach((r) => {
  const fnSize = extractFilenameSize(r.slug);
  if (fnSize === null) return; // slug doesn't encode a recognizable size token (e.g. some base-route slugs like "kids-us-6-to-eu-clothing-size" — checked by the token parser regardless, but a null here just means no token matched, not a failure)
  if (fnSize.toUpperCase() !== String(r.size).toUpperCase()) {
    filenameMismatches++;
    mismatchList.push({ slug: r.slug, filenameSize: fnSize, routeSize: r.size });
  }
});
check('zero filename/content size mismatches across all 125 routes', filenameMismatches === 0);
if (filenameMismatches) console.error('  mismatches:', JSON.stringify(mismatchList, null, 2));

// ============================================
// E. TEST 3 — semantic uniqueness among the AUTHORITATIVE route set
// (base + auto-expanded). Canonical-override routes are intentionally
// excluded from this check: they exist specifically because they're the
// deliberately-preserved, already-published duplicate pages (§7/§8 of
// reports/phase-5e-url-migration-architecture-audit.md) — their identity
// matching a base route is the expected, documented condition, not a
// regression. Section J below separately verifies there are exactly 3 of
// them and each carries the correct canonical_target.
// ============================================
{
  const authoritativeRoutes = baseRoutes.concat(expanded);
  const identityCounts = {};
  authoritativeRoutes.forEach((r) => {
    const id = clothingRouteIdentity(r);
    identityCounts[id] = (identityCounts[id] || 0) + 1;
  });
  const dupIdentities = Object.entries(identityCounts).filter(([, c]) => c > 1);
  check('no two AUTHORITATIVE routes (base + auto-expanded, excluding canonical-override) share a semantic identity', dupIdentities.length === 0);
  if (dupIdentities.length) console.error('  duplicate identities:', JSON.stringify(dupIdentities));

  // Every canonical-override route's identity MUST match a base route
  // (that's the whole reason it exists) — the inverse of the check above.
  const baseIdentitySet = new Set(baseRoutes.map(clothingRouteIdentity));
  const orphanedCanonicalDupes = canonicalDupes.filter((r) => !baseIdentitySet.has(clothingRouteIdentity(r)));
  check('every canonical-override route\'s identity matches a real base route (none are orphaned/spurious)', orphanedCanonicalDupes.length === 0);
}

// ============================================
// F. TEST 4 — no auto-expanded route shares identity with a base route
// ============================================
{
  const baseIdentities = new Set(baseRoutes.map(clothingRouteIdentity));
  const collisions = expanded.filter((r) => baseIdentities.has(clothingRouteIdentity(r)));
  check('no auto-expanded route duplicates a base route\'s semantic identity', collisions.length === 0);
  if (collisions.length) console.error('  collisions:', JSON.stringify(collisions.map((r) => r.slug)));
}

// ============================================
// G. No duplicate slugs (filesystem-safety — two routes must never target
// the same filename)
// ============================================
{
  const slugCounts = {};
  allRoutes.forEach((r) => { slugCounts[r.slug] = (slugCounts[r.slug] || 0) + 1; });
  const dupes = Object.entries(slugCounts).filter(([, c]) => c > 1);
  check('no duplicate slugs among the 125 final routes', dupes.length === 0);
  if (dupes.length) console.error('  duplicate slugs:', JSON.stringify(dupes));
}

// ============================================
// H. TEST 6 — jacket invalidity guard
// ============================================
check('isValidClothingSize(men, jackets, EU, 50) remains false (no authoritative jacket dataset)', app.isValidClothingSize('men', 'jackets', 'EU', '50') === false);
check('the jacket route no longer appears anywhere in the final route array', !allRoutes.some((r) => r.category === 'jackets'));

// ============================================
// I. TEST 7 — no generated route represents an empty-data garment/gender
// ============================================
{
  let emptyDataRoutes = 0;
  allRoutes.forEach((r) => {
    const sizes = app.getAvailableClothingSizes(r.gender, r.category, r.from_region);
    if (sizes.length === 0) emptyDataRoutes++;
  });
  check('zero routes represent a gender/category/region with no dataset-backed sizes', emptyDataRoutes === 0);
}

// ============================================
// J. Canonical-override routes carry the correct target
// ============================================
{
  const expectedCanonicalTargets = {
    'clothing-men-tops-M-US-to-EU': 'mens-medium-us-to-eu',
    'clothing-men-tops-L-US-to-UK': 'mens-large-us-to-uk',
    'clothing-women-pants-6-US-to-EU': 'womens-pants-us-6-to-eu'
  };
  Object.entries(expectedCanonicalTargets).forEach(([slug, expectedTarget]) => {
    const r = canonicalDupes.find((x) => x.slug === slug);
    check(`canonical-override route ${slug} exists with canonical_target=${expectedTarget}`, !!r && r.canonical_target === expectedTarget);
  });
}

// ============================================
// K. Core regression — representative rows, all four directions, using the
// NEW (source-size-based) slug convention
// ============================================
{
  const row = clothingData.men.pants.find((r) => r.us === '28');
  const euToUs = allRoutes.find((r) => r.gender === 'men' && r.category === 'pants' && r.from_region === 'EU' && r.to_region === 'US' && String(r.size) === String(row.eu));
  check('men/pants EU->US for the row.us=28 row: slug and size both use "42" (row.eu), not "28" (row.us)', !!euToUs && euToUs.slug.includes('-42-EU-to-US') && String(euToUs.size) === '42');
}
{
  const row = clothingData.women.tops.find((r) => r.us === 'XS');
  const ukToUs = allRoutes.find((r) => r.gender === 'women' && r.category === 'tops' && r.from_region === 'UK' && r.to_region === 'US' && String(r.size) === String(row.uk));
  check('women/tops UK->US for the row.us=XS row: slug and size both use "6" (row.uk), not "XS" (row.us)', !!ukToUs && ukToUs.slug.includes('-6-UK-to-US') && String(ukToUs.size) === '6');
}
{
  // US-sourced pairs are unaffected — sourceSize === row.us always.
  const row = clothingData.men.pants.find((r) => r.us === '28');
  const usToEu = allRoutes.find((r) => r.gender === 'men' && r.category === 'pants' && r.from_region === 'US' && r.to_region === 'EU' && String(r.size) === '28');
  check('men/pants US->EU: slug and size both remain "28" (US-sourced pairs unaffected by the slug fix)', !!usToEu && usToEu.slug.includes('-28-US-to-EU'));
}

console.log(`\n${passed} passed, ${failures} failed.`);
process.exit(failures > 0 ? 1 : 0);
