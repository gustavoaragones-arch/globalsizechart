#!/usr/bin/env node
/**
 * Phase 10 — Mass Route Generator Engine
 *
 * Supports ALL route types and produces 1,000+ pages (scalable to 10,000+).
 * Route types: size_pair, region, category, semantic, clothing_size_pair,
 * brand_converter, measurement_converter.
 *
 * Architecture (scalable to 10,000+ pages):
 * - One page at a time (no accumulation of HTML in memory).
 * - Sitemaps chunked (MAX_URLS_PER_SITEMAP = 500) in generate-programmatic-pages.js.
 * - Mass expansion: size_pair from shoe_sizes × region pairs; measurement_converter
 *   from cm ranges and clothing_sizes; clothing_size_pair from clothing_sizes × regions.
 * - To scale further: add more regionPairs in expandSizePairRoutes, more cm steps or
 *   to_regions in expandMeasurementRoutes, or more clothing categories in expandClothingRoutes.
 *
 * Usage: node scripts/generate-phase10-pages.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');

const TARGET_MIN_PAGES = 1000;
const SCALE_TARGET_PAGES = 10000;

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Build a set of existing slugs from programmatic routes to avoid duplicates.
 */
function existingProgrammaticSlugs(routes) {
  const set = new Set();
  for (const r of routes || []) if (r.slug) set.add(r.slug);
  return set;
}

/**
 * Mass-expand size_pair routes from shoe_sizes.
 * Emits (from_region, to_region, size, gender) for each row; slug format matches existing.
 */
function expandSizePairRoutes(shoeData, existingSlugs) {
  const out = [];
  const regionPairs = [
    ['EU', 'US'], ['US', 'EU'], ['UK', 'US'], ['US', 'UK'], ['EU', 'UK'], ['UK', 'EU'],
    ['JP', 'US'], ['US', 'JP'], ['CM', 'US'], ['CN', 'US'], ['JP', 'EU'], ['EU', 'JP'],
    ['CM', 'EU'], ['UK', 'EU'], ['CN', 'EU']
  ];
  for (const gender of ['men', 'women', 'kids']) {
    const rows = shoeData[gender];
    if (!rows || !rows.length) continue;
    const suffixSlug = gender === 'women' ? '-women' : gender === 'kids' ? '-kids' : '';

    for (const row of rows) {
      for (const [fromR, toR] of regionPairs) {
        const fromK = fromR === 'JP' ? 'jp' : fromR === 'CN' ? 'cn' : fromR.toLowerCase();
        const size = row[fromK];
        if (size == null) continue;
        const slugPart = fromK === 'jp' ? 'japan' : fromK;
        const slug = `${slugPart}-${size}-to-${toR.toLowerCase()}-shoe-size${suffixSlug}`;
        if (existingSlugs.has(slug)) continue;
        out.push({
          type: 'size_pair',
          slug,
          category: 'shoes',
          gender,
          from_region: fromR,
          to_region: toR,
          size: String(size)
        });
      }
    }
  }
  return out;
}

/**
 * Mass-expand measurement_converter routes (foot_cm, chest_cm, waist_cm).
 */
function expandMeasurementRoutes(shoeData, clothingData, existingSlugs) {
  const out = [];
  const toRegions = ['US', 'EU'];

  for (const gender of ['men', 'women']) {
    for (let cm = 20; cm <= 32; cm += 0.5) {
      const slug = `${String(cm).replace('.', '-')}-cm-to-us-shoe-size-${gender}`;
      if (existingSlugs.has(slug)) continue;
      existingSlugs.add(slug);
      out.push({
        type: 'measurement_converter',
        measurement_type: 'foot_cm',
        value_cm: cm,
        to_region: 'US',
        category: 'shoes',
        gender,
        slug
      });
    }
  }

  const menTops = clothingData.men && clothingData.men.tops;
  if (menTops) {
    for (const row of menTops) {
      if (!row.chest_cm) continue;
      for (const toR of toRegions) {
        const slug = `${row.chest_cm}cm-chest-to-${toR.toLowerCase()}-shirt-size-men`;
        if (existingSlugs.has(slug)) continue;
        existingSlugs.add(slug);
        out.push({
          type: 'measurement_converter',
          measurement_type: 'chest_cm',
          value_cm: row.chest_cm,
          to_region: toR,
          category: 'tops',
          gender: 'men',
          slug
        });
      }
    }
  }
  const womenTops = clothingData.women && clothingData.women.tops;
  if (womenTops) {
    for (const row of womenTops) {
      if (!row.chest_cm) continue;
      for (const toR of toRegions) {
        const slug = `${row.chest_cm}cm-chest-to-${toR.toLowerCase()}-shirt-size-women`;
        if (existingSlugs.has(slug)) continue;
        existingSlugs.add(slug);
        out.push({
          type: 'measurement_converter',
          measurement_type: 'chest_cm',
          value_cm: row.chest_cm,
          to_region: toR,
          category: 'tops',
          gender: 'women',
          slug
        });
      }
    }
  }
  for (const gender of ['men', 'women']) {
    const pants = clothingData[gender] && clothingData[gender].pants;
    if (!pants) continue;
    for (const row of pants) {
      if (!row.waist_cm) continue;
      for (const toR of toRegions) {
        const slug = `${row.waist_cm}cm-waist-to-${toR.toLowerCase()}-pants-${gender}`;
        if (existingSlugs.has(slug)) continue;
        existingSlugs.add(slug);
        out.push({
          type: 'measurement_converter',
          measurement_type: 'waist_cm',
          value_cm: row.waist_cm,
          to_region: toR,
          category: 'pants',
          gender,
          slug
        });
      }
    }
  }
  return out;
}

/**
 * Dataset value for `fromRegion` on this clothing_sizes.json row. US/EU/UK are
 * the only regions expandClothingRoutes() generates direction pairs for.
 * Returns null (never a substituted value from a different region) when the
 * row has no data for that region — callers must skip route generation in
 * that case rather than fabricate one from another column.
 */
function getSourceSize(row, fromRegion) {
  if (fromRegion === 'US') return row.us != null ? row.us : null;
  if (fromRegion === 'EU') return row.eu != null ? row.eu : null;
  if (fromRegion === 'UK') return row.uk != null ? row.uk : null;
  return null;
}

/** Five-field semantic identity key — see Phase 5E/5F reports. Two routes
 * with the same key describe the identical conversion regardless of slug. */
function clothingRouteIdentity(r) {
  return `${r.gender}|${r.category}|${r.from_region}|${String(r.size)}|${r.to_region}`;
}

/**
 * Mass-expand clothing_size_pair routes from clothing_sizes.
 *
 * Phase 5C fix: the route's functional `size` (validation, CTA params, title,
 * description, on-page conversion preview) comes from the column matching
 * that route's own `from_region` (getSourceSize), not unconditionally from
 * `row.us` — see reports/phase-5b-generated-page-integrity-audit.md.
 *
 * Phase 5F fix: the URL slug now uses that same corrected `sourceSize`
 * value too (previously it deliberately kept using `row.us` for every
 * direction, which is exactly what made the filename disagree with the
 * page's own title/content for EU->US and UK->US routes — see
 * reports/phase-5e-url-migration-architecture-audit.md). For US-sourced
 * pairs sourceSize === row.us, so those 82 filenames are unaffected; only
 * the 38 EU/UK-sourced routes whose slug previously used the wrong column
 * get a new filename now.
 *
 * Phase 5F also adds semantic-identity deduplication: `baseRoutes` (the
 * hand-authored routes in data/clothing_routes.json) is checked via the
 * five-field identity key (gender|category|from_region|size|to_region) in
 * addition to the existing slug-string check, so a mass-expanded route is
 * never generated when a base route already describes the identical
 * conversion under a different slug (the root cause of the 3 known
 * duplicate-semantic-intent pairs — see
 * reports/phase-5e-url-migration-architecture-audit.md §7-8). This is a
 * second, independent guard — it does not replace the slug-string check.
 */
function expandClothingRoutes(clothingData, existingSlugs, baseRoutes = []) {
  const out = [];
  const regionPairs = [['US', 'EU'], ['US', 'UK'], ['EU', 'US'], ['UK', 'US']];
  const baseIdentitySet = new Set(baseRoutes.map(clothingRouteIdentity));

  for (const gender of ['men', 'women']) {
    const tops = clothingData[gender] && clothingData[gender].tops;
    const pants = clothingData[gender] && clothingData[gender].pants;
    if (tops) {
      for (const row of tops) {
        for (const [fromR, toR] of regionPairs) {
          const sourceSize = getSourceSize(row, fromR);
          if (sourceSize == null) continue; // no data for this row's from-region — do not generate a route from a substituted value
          const slugSimple = `clothing-${gender}-tops-${String(sourceSize).replace(/\s/g, '-')}-${fromR}-to-${toR}`;
          if (existingSlugs.has(slugSimple)) continue;
          const candidate = {
            type: 'clothing_size_pair',
            slug: slugSimple,
            category: 'tops',
            gender,
            from_region: fromR,
            to_region: toR,
            size: sourceSize,
            measurement_reference: 'chest_cm',
            description: `Convert ${gender}'s ${fromR} ${sourceSize} to ${toR} for tops.`
          };
          if (baseIdentitySet.has(clothingRouteIdentity(candidate))) continue; // a base route already covers this exact conversion
          existingSlugs.add(slugSimple);
          out.push(candidate);
        }
      }
    }
    if (pants) {
      for (const row of pants) {
        for (const [fromR, toR] of regionPairs) {
          const sourceSize = getSourceSize(row, fromR);
          if (sourceSize == null) continue; // no data for this row's from-region — do not generate a route from a substituted value
          const slugSimple = `clothing-${gender}-pants-${String(sourceSize).replace(/\s/g, '-')}-${fromR}-to-${toR}`;
          if (existingSlugs.has(slugSimple)) continue;
          const candidate = {
            type: 'clothing_size_pair',
            slug: slugSimple,
            category: 'pants',
            gender,
            from_region: fromR,
            to_region: toR,
            size: sourceSize,
            measurement_reference: 'waist_cm',
            description: `Convert ${gender}'s ${fromR} pants ${sourceSize} to ${toR}.`
          };
          if (baseIdentitySet.has(clothingRouteIdentity(candidate))) continue; // a base route already covers this exact conversion
          existingSlugs.add(slugSimple);
          out.push(candidate);
        }
      }
    }
  }
  return out;
}

/**
 * The inverse of expandClothingRoutes()'s semantic-dedup skip: reconstructs
 * exactly the candidate routes that WOULD have been mass-expanded but were
 * suppressed because a base route already covers the identical
 * gender|category|from_region|size|to_region conversion (the 3 known
 * duplicate-semantic-intent pairs — see
 * reports/phase-5e-url-migration-architecture-audit.md §7-8).
 *
 * These candidates already have a published, indexed, cross-linked HTML
 * file (they were generated under the pre-Phase-5F code, before semantic
 * dedup existed). Phase 5F's migration keeps that file live rather than
 * deleting it — see reports/phase-5e-url-migration-architecture-audit.md
 * §8 (canonical, not deletion) — so the page-generation pass still needs a
 * route object for each of them, tagged with `canonical_target` pointing at
 * the base route's slug, instead of self-canonicalizing.
 *
 * Fully generic: derives the suppressed set from the current dataset and
 * base routes, not from a hardcoded slug list — if clothing_sizes.json or
 * clothing_routes.json changes, this recomputes correctly.
 */
function findCanonicalizedDuplicateRoutes(clothingData, baseRoutes) {
  const out = [];
  const regionPairs = [['US', 'EU'], ['US', 'UK'], ['EU', 'US'], ['UK', 'US']];
  const baseByIdentity = new Map(baseRoutes.map((r) => [clothingRouteIdentity(r), r]));

  for (const gender of ['men', 'women']) {
    const tops = clothingData[gender] && clothingData[gender].tops;
    const pants = clothingData[gender] && clothingData[gender].pants;
    if (tops) {
      for (const row of tops) {
        for (const [fromR, toR] of regionPairs) {
          const sourceSize = getSourceSize(row, fromR);
          if (sourceSize == null) continue;
          const candidate = { type: 'clothing_size_pair', category: 'tops', gender, from_region: fromR, to_region: toR, size: sourceSize };
          const baseMatch = baseByIdentity.get(clothingRouteIdentity(candidate));
          if (!baseMatch) continue;
          out.push({
            ...candidate,
            slug: `clothing-${gender}-tops-${String(sourceSize).replace(/\s/g, '-')}-${fromR}-to-${toR}`,
            measurement_reference: 'chest_cm',
            description: `Convert ${gender}'s ${fromR} ${sourceSize} to ${toR} for tops.`,
            canonical_target: baseMatch.slug
          });
        }
      }
    }
    if (pants) {
      for (const row of pants) {
        for (const [fromR, toR] of regionPairs) {
          const sourceSize = getSourceSize(row, fromR);
          if (sourceSize == null) continue;
          const candidate = { type: 'clothing_size_pair', category: 'pants', gender, from_region: fromR, to_region: toR, size: sourceSize };
          const baseMatch = baseByIdentity.get(clothingRouteIdentity(candidate));
          if (!baseMatch) continue;
          out.push({
            ...candidate,
            slug: `clothing-${gender}-pants-${String(sourceSize).replace(/\s/g, '-')}-${fromR}-to-${toR}`,
            measurement_reference: 'waist_cm',
            description: `Convert ${gender}'s ${fromR} pants ${sourceSize} to ${toR}.`,
            canonical_target: baseMatch.slug
          });
        }
      }
    }
  }
  return out;
}

/**
 * Merge expanded routes with existing, ensuring no duplicate slugs.
 */
function mergeRoutes(existing, expanded, slugKey = 'slug') {
  const bySlug = new Map();
  for (const r of existing || []) {
    const s = r[slugKey];
    if (s) bySlug.set(s, r);
  }
  for (const r of expanded || []) {
    const s = r[slugKey];
    if (s && !bySlug.has(s)) bySlug.set(s, r);
  }
  return Array.from(bySlug.values());
}

/**
 * Expand all route sets to meet TARGET_MIN_PAGES (1000+) and support scaling to 10k+.
 */
function expandMassRoutes(shoeData, clothingData, options = {}) {
  const targetMin = options.targetMinPages != null ? options.targetMinPages : TARGET_MIN_PAGES;

  const programmaticPath = path.join(DATA_DIR, 'programmatic_routes.json');
  const programmaticRoutes = fs.existsSync(programmaticPath) ? loadJson(programmaticPath) : [];
  const existingSlugs = existingProgrammaticSlugs(programmaticRoutes);

  const expandedSizePair = expandSizePairRoutes(shoeData, existingSlugs);
  let mergedProgrammatic = mergeRoutes(programmaticRoutes, expandedSizePair);

  // Merge extended converter coverage from generators/ (missing region hubs)
  const generatorModules = [
    require('../generators/generate-cm-converters.js'),
    require('../generators/generate-measurement-converters.js'),
    require('../generators/generate-kids-measurement.js'),
    require('../generators/generate-cross-region-measurement.js')
  ];
  const extraRegionRoutes = [];
  for (const mod of generatorModules) {
    if (mod && typeof mod.getRoutes === 'function') extraRegionRoutes.push(...mod.getRoutes());
  }
  mergedProgrammatic = mergeRoutes(mergedProgrammatic, extraRegionRoutes);
  const programmaticSlugsAfter = new Set(mergedProgrammatic.map(r => r.slug));

  const semanticPath = path.join(DATA_DIR, 'semantic_routes.json');
  const semanticRoutes = fs.existsSync(semanticPath) ? loadJson(semanticPath) : [];

  const clothingPath = path.join(DATA_DIR, 'clothing_routes.json');
  const clothingRoutes = fs.existsSync(clothingPath) ? loadJson(clothingPath) : [];
  const existingClothingSlugs = new Set((clothingRoutes || []).map(r => r.slug));
  const expandedClothing = expandClothingRoutes(clothingData, existingClothingSlugs, clothingRoutes);
  const mergedClothing = mergeRoutes(clothingRoutes, expandedClothing);

  const brandPath = path.join(DATA_DIR, 'brand_routes.json');
  const brandRoutes = fs.existsSync(brandPath) ? loadJson(brandPath) : [];

  const measurementPath = path.join(DATA_DIR, 'measurement_routes.json');
  const measurementRoutes = fs.existsSync(measurementPath) ? loadJson(measurementPath) : [];
  const measurementSlugs = new Set((measurementRoutes || []).map(r => r.slug));
  const expandedMeasurement = expandMeasurementRoutes(shoeData, clothingData, measurementSlugs);
  const mergedMeasurement = mergeRoutes(measurementRoutes, expandedMeasurement);

  const counts = {
    size_pair: mergedProgrammatic.filter(r => r.type === 'size_pair' || !r.type).length,
    region: mergedProgrammatic.filter(r => r.type === 'region').length,
    category: mergedProgrammatic.filter(r => r.type === 'category').length,
    semantic: semanticRoutes.length,
    clothing_size_pair: mergedClothing.length,
    brand_converter: brandRoutes.length,
    measurement_converter: mergedMeasurement.length
  };
  const estimatedTotal = counts.size_pair + counts.region + counts.category + counts.semantic + counts.clothing_size_pair + counts.brand_converter + counts.measurement_converter + 3 + 1; // printable + tool + index/hub/guides
  console.log('Mass route expansion:', counts);
  console.log('Estimated total pages:', estimatedTotal);

  return {
    programmaticRoutes: mergedProgrammatic,
    semanticRoutes,
    clothingRoutes: mergedClothing,
    brandRoutes,
    measurementRoutes: mergedMeasurement,
    shoeData,
    clothingData,
    counts,
    estimatedTotal
  };
}

function main() {
  console.log('Phase 10 — Mass Route Generator Engine');
  console.log('Target: ' + TARGET_MIN_PAGES + '+ pages (scalable to ' + SCALE_TARGET_PAGES + '+)\n');

  ensureDir(DATA_DIR);
  const shoeData = loadJson(path.join(DATA_DIR, 'shoe_sizes.json'));
  const clothingData = fs.existsSync(path.join(DATA_DIR, 'clothing_sizes.json')) ? loadJson(path.join(DATA_DIR, 'clothing_sizes.json')) : {};

  const expanded = expandMassRoutes(shoeData, clothingData, { targetMinPages: TARGET_MIN_PAGES });

  if (expanded.estimatedTotal < TARGET_MIN_PAGES) {
    console.warn('Warning: estimated total (' + expanded.estimatedTotal + ') is below target (' + TARGET_MIN_PAGES + '). Add more route expansion if needed.');
  }

  const authorityGraphPath = path.join(DATA_DIR, 'authority_graph.json');
  const authorityGraph = fs.existsSync(authorityGraphPath) ? loadJson(authorityGraphPath) : {};

  const config = {
    programmaticRoutes: expanded.programmaticRoutes,
    semanticRoutes: expanded.semanticRoutes,
    clothingRoutes: expanded.clothingRoutes,
    brandRoutes: expanded.brandRoutes,
    measurementRoutes: expanded.measurementRoutes,
    shoeData: expanded.shoeData,
    clothingData: expanded.clothingData,
    authorityGraph
  };

  // Phase 13: Brand Size Database — authority pages under /brands/*-size-guide.html
  const brandSizeDb = require(path.join(ROOT, 'generators', 'generate-brand-size-database.js'));
  if (typeof brandSizeDb.run === 'function') brandSizeDb.run();

  // Measurement Authority Layer — how-to-measure-feet, how-to-measure-in-cm, foot-width-guide, shoe-fit-guide
  require(path.join(ROOT, 'generators', 'generate-measurement-authority.js'));

  const generator = require('./generate-programmatic-pages.js');
  const result = generator.runPhase10Generator(config);

  if (result.totalPages < TARGET_MIN_PAGES) {
    console.warn('Warning: total pages generated (' + result.totalPages + ') is below target (' + TARGET_MIN_PAGES + ').');
  } else {
    console.log('\nPhase 10 complete. Total pages: ' + result.totalPages + ' (target: ' + TARGET_MIN_PAGES + '+).');
  }

  const { run: runPrebuildValidation } = require('./prebuild-link-validation.js');
  if (!runPrebuildValidation()) {
    console.error('Prebuild link validation failed. Fix missing internal link targets and re-run.');
    process.exit(1);
  }
  return result;
}

if (require.main === module) {
  main();
} else {
  // Exposed for scripts/test-clothing-route-generator.js (Phase 5C regression
  // test) — requiring this module must never trigger a full production run.
  module.exports = { expandClothingRoutes, getSourceSize, clothingRouteIdentity, findCanonicalizedDuplicateRoutes };
}
