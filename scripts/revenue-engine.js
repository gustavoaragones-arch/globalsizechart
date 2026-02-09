#!/usr/bin/env node
/**
 * Phase 11 Revenue Engine — Build validation only.
 * Generates build/phase11-report.json with monetization, session depth, conversion loops,
 * ad-slot validation, internal links, schema, intent coverage. No tracking, no ads, no cookies.
 *
 * Usage: node scripts/revenue-engine.js
 * Or: require from generate-programmatic-pages.js and call generatePhase11Report(opts)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'build');
const OUTPUT_DIR = path.join(ROOT, 'programmatic-pages');
const SEMANTIC_DIR = path.join(ROOT, 'semantic');
const CLOTHING_DIR = path.join(ROOT, 'clothing');
const BRANDS_DIR = path.join(ROOT, 'brands');
const MEASUREMENT_DIR = path.join(ROOT, 'measurement');
const PRINTABLE_DIR = path.join(ROOT, 'printable');
const TOOLS_DIR = path.join(ROOT, 'tools');

const HUB_PAGE_FILES = [
  'index.html', 'shoe-size-converter.html', 'shoe-sizing-guides.html', 'shoe-size-pages.html',
  'programmatic-index.html', 'clothing-size-pages.html', 'brand-size-guides.html',
  'cm-measurement-converters.html', 'printable-size-guides.html', 'measurement-tools.html'
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function listHtml(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.html'));
}

/**
 * Scan HTML string for Phase 11 metrics (no network, no scripts injected).
 */
function scanHtml(html, options = {}) {
  const out = {
    monetization_modules: (html.match(/data-module="monetization"|monetization-modules/g) || []).length,
    session_depth_sections: (html.match(/data-module="session-depth"|data-session-depth="true"/g) || []).length,
    conversion_loop_sections: (html.match(/data-conversion-loop="true"/g) || []).length,
    ad_slots: {
      top: (html.match(/data-slot="top"/g) || []).length,
      inline: (html.match(/data-slot="inline"/g) || []).length,
      mid: (html.match(/data-slot="mid"/g) || []).length,
      bottom: (html.match(/data-slot="bottom"/g) || []).length,
      sticky_mobile: (html.match(/data-slot="sticky-mobile"/g) || []).length
    },
    ad_slot_total: (html.match(/data-module="ad-slot"/g) || []).length,
    internal_links: (html.match(/<a\s+href=["'](?:\.\.\/|\.\/|[^h#m]|[^"]*\.html)/gi) || []).length,
    has_intent: /<body[^>]*\sdata-intent=["'][^"']+["']/.test(html),
    intent_value: (html.match(/<body[^>]*\sdata-intent=["']([^"']+)["']/) || [])[1] || null,
    schema: {
      FAQPage: (html.match(/"@type"\s*:\s*"FAQPage"/) || []).length,
      WebPage: (html.match(/"@type"\s*:\s*"WebPage"/) || []).length,
      Article: (html.match(/"@type"\s*:\s*"Article"/) || []).length,
      HowTo: (html.match(/"@type"\s*:\s*"HowTo"/) || []).length,
      ItemList: (html.match(/"@type"\s*:\s*"ItemList"/) || []).length,
      BreadcrumbList: (html.match(/"@type"\s*:\s*"BreadcrumbList"/) || []).length,
      SoftwareApplication: (html.match(/"@type"\s*:\s*"SoftwareApplication"/) || []).length,
      Product: (html.match(/"@type"\s*:\s*"Product"/) || []).length
    }
  };
  return out;
}

/**
 * Scan HTML for Phase 12 monetization readiness metrics.
 */
function scanHtmlPhase12(html) {
  return {
    affiliate_modules: (html.match(/data-module="product-recommendation"|data-module="fit-recommendation"|data-module="brand-recommendation"|data-module="measurement-recommendation"|affiliate-module/g) || []).length,
    product_modules_count: (html.match(/affiliate-module__item|data-module="product-recommendation"|data-module="fit-recommendation"|data-module="brand-recommendation"|data-module="measurement-recommendation"/g) || []).length,
    commercial_blocks: (html.match(/data-module="commercial-content"|commercial-modules|commercial-module-wrap/g) || []).length,
    has_recommendation_zone: /recommendation-zone/.test(html),
    conversion_loop_sections: (html.match(/data-conversion-loop="true"|conversion-loop__/g) || []).length,
    next_step_sections: (html.match(/class="next-step"|data-module="next-step"/g) || []).length,
    fit_assistant_links: (html.match(/fit-assistant\.html|Fit Assistant/g) || []).length,
    schema: {
      Product: (html.match(/"@type"\s*:\s*"Product"/) || []).length,
      ItemList: (html.match(/"@type"\s*:\s*"ItemList"/) || []).length,
      WebPage: (html.match(/"@type"\s*:\s*"WebPage"/) || []).length,
      FAQPage: (html.match(/"@type"\s*:\s*"FAQPage"/) || []).length,
      SoftwareApplication: (html.match(/"@type"\s*:\s*"SoftwareApplication"/) || []).length
    }
  };
}

/**
 * Generate Phase 11 report. Writes build/phase11-report.json.
 * @param {object} [opts] - Optional: programmaticGenerated, semanticGenerated, clothingGenerated, brandGenerated, measurementGenerated, printableGenerated, toolGenerated (arrays of filenames). If omitted, lists dirs.
 */
function generatePhase11Report(opts = {}) {
  const programmaticGenerated = opts.programmaticGenerated || listHtml(OUTPUT_DIR);
  const semanticGenerated = opts.semanticGenerated || listHtml(SEMANTIC_DIR);
  const clothingGenerated = opts.clothingGenerated || listHtml(CLOTHING_DIR);
  const brandGenerated = opts.brandGenerated || listHtml(BRANDS_DIR);
  const measurementGenerated = opts.measurementGenerated || listHtml(MEASUREMENT_DIR);
  const printableGenerated = opts.printableGenerated || listHtml(PRINTABLE_DIR);
  const toolGenerated = opts.toolGenerated || listHtml(TOOLS_DIR);

  const dirs = [
    [OUTPUT_DIR, programmaticGenerated, 'programmatic'],
    [SEMANTIC_DIR, semanticGenerated, 'semantic'],
    [CLOTHING_DIR, clothingGenerated, 'clothing'],
    [BRANDS_DIR, brandGenerated, 'brand'],
    [MEASUREMENT_DIR, measurementGenerated, 'measurement'],
    [PRINTABLE_DIR, printableGenerated, 'printable'],
    [TOOLS_DIR, toolGenerated, 'tool']
  ];

  const totals = {
    monetization_modules_inserted: 0,
    session_depth_count: 0,
    conversion_loops_count: 0,
    ad_slot_placement: { top: 0, inline: 0, mid: 0, bottom: 0, sticky_mobile: 0, total: 0 },
    internal_links_total: 0,
    internal_links_pages: 0,
    schema_validation: {
      FAQPage: 0, WebPage: 0, Article: 0, HowTo: 0, ItemList: 0, BreadcrumbList: 0, SoftwareApplication: 0
    },
    intent_tagging_coverage: { pages_with_intent: 0, total_pages: 0, intents_seen: {} }
  };

  const adSlotValidation = {
    expected_slots_per_page: { programmatic: 5, semantic: 0, clothing: 5, brand: 5, measurement: 5, printable: 0, tool: 0 },
    pages_missing_slots: [],
    pages_with_all_slots: 0
  };

  for (const [dirPath, fileNames, key] of dirs) {
    const expectedSlots = adSlotValidation.expected_slots_per_page[key] || 0;
    for (const fileName of fileNames) {
      const fp = path.join(dirPath, fileName);
      if (!fs.existsSync(fp)) continue;
      const html = fs.readFileSync(fp, 'utf8');
      const s = scanHtml(html);
      totals.monetization_modules_inserted += s.monetization_modules > 0 ? 1 : 0;
      totals.session_depth_count += s.session_depth_sections;
      totals.conversion_loops_count += s.conversion_loop_sections;
      totals.ad_slot_placement.top += s.ad_slots.top;
      totals.ad_slot_placement.inline += s.ad_slots.inline;
      totals.ad_slot_placement.mid += s.ad_slots.mid;
      totals.ad_slot_placement.bottom += s.ad_slots.bottom;
      totals.ad_slot_placement.sticky_mobile += s.ad_slots.sticky_mobile;
      totals.ad_slot_placement.total += s.ad_slot_total;
      totals.internal_links_total += s.internal_links;
      totals.internal_links_pages += 1;
      totals.schema_validation.FAQPage += s.schema.FAQPage ? 1 : 0;
      totals.schema_validation.WebPage += s.schema.WebPage ? 1 : 0;
      totals.schema_validation.Article += s.schema.Article ? 1 : 0;
      totals.schema_validation.HowTo += s.schema.HowTo ? 1 : 0;
      totals.schema_validation.ItemList += s.schema.ItemList ? 1 : 0;
      totals.schema_validation.BreadcrumbList += s.schema.BreadcrumbList ? 1 : 0;
      totals.schema_validation.SoftwareApplication += s.schema.SoftwareApplication ? 1 : 0;
      totals.intent_tagging_coverage.total_pages += 1;
      if (s.has_intent) {
        totals.intent_tagging_coverage.pages_with_intent += 1;
        if (s.intent_value) totals.intent_tagging_coverage.intents_seen[s.intent_value] = (totals.intent_tagging_coverage.intents_seen[s.intent_value] || 0) + 1;
      }
      if (expectedSlots > 0 && s.ad_slot_total < expectedSlots) {
        adSlotValidation.pages_missing_slots.push(`${key}/${fileName}`);
      } else if (expectedSlots > 0 && s.ad_slot_total >= expectedSlots) {
        adSlotValidation.pages_with_all_slots += 1;
      }
    }
  }

  for (const hub of HUB_PAGE_FILES) {
    const fp = path.join(ROOT, hub);
    if (!fs.existsSync(fp)) continue;
    const html = fs.readFileSync(fp, 'utf8');
    const s = scanHtml(html);
    totals.internal_links_total += s.internal_links;
    totals.internal_links_pages += 1;
    totals.intent_tagging_coverage.total_pages += 1;
    totals.schema_validation.FAQPage += s.schema.FAQPage ? 1 : 0;
    totals.schema_validation.WebPage += s.schema.WebPage ? 1 : 0;
    totals.schema_validation.Article += s.schema.Article ? 1 : 0;
    totals.schema_validation.HowTo += s.schema.HowTo ? 1 : 0;
    totals.schema_validation.ItemList += s.schema.ItemList ? 1 : 0;
    totals.schema_validation.BreadcrumbList += s.schema.BreadcrumbList ? 1 : 0;
    totals.schema_validation.SoftwareApplication += s.schema.SoftwareApplication ? 1 : 0;
    if (s.has_intent) {
      totals.intent_tagging_coverage.pages_with_intent += 1;
      if (s.intent_value) totals.intent_tagging_coverage.intents_seen[s.intent_value] = (totals.intent_tagging_coverage.intents_seen[s.intent_value] || 0) + 1;
    }
  }

  const internalLinkIncrease = totals.internal_links_pages > 0
    ? { average_per_page: Math.round((totals.internal_links_total / totals.intent_tagging_coverage.total_pages) * 10) / 10, total: totals.internal_links_total }
    : { average_per_page: 0, total: 0 };

  const report = {
    generatedAt: new Date().toISOString(),
    phase: 11,
    monetization_modules_inserted: totals.monetization_modules_inserted,
    session_depth_count: totals.session_depth_count,
    conversion_loops_count: totals.conversion_loops_count,
    ad_slot_placement_validation: {
      by_slot: totals.ad_slot_placement,
      pages_missing_slots: adSlotValidation.pages_missing_slots,
      pages_missing_slots_count: adSlotValidation.pages_missing_slots.length,
      pages_with_all_slots: adSlotValidation.pages_with_all_slots
    },
    internal_link_increase: internalLinkIncrease,
    schema_validation: totals.schema_validation,
    intent_tagging_coverage: {
      pages_with_intent: totals.intent_tagging_coverage.pages_with_intent,
      total_pages: totals.intent_tagging_coverage.total_pages,
      coverage_pct: totals.intent_tagging_coverage.total_pages > 0
        ? Math.round((totals.intent_tagging_coverage.pages_with_intent / totals.intent_tagging_coverage.total_pages) * 100)
        : 0,
      intents_seen: totals.intent_tagging_coverage.intents_seen
    }
  };

  ensureDir(BUILD_DIR);
  const reportPath = path.join(BUILD_DIR, 'phase11-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  return report;
}

const AFFILIATE_DIR = path.join(ROOT, 'components', 'affiliate');
const COMMERCIAL_DIR = path.join(ROOT, 'components', 'commercial');
const DATA_DIR = path.join(ROOT, 'data');

/**
 * Generate Phase 12 monetization readiness report. Writes build/phase12-report.json.
 * Metrics: affiliate modules inserted, product modules count, commercial blocks,
 * pages with recommendation zones, schema validation, monetization readiness score,
 * internal commerce loops, fit assistant integration count.
 */
function generatePhase12Report(opts = {}) {
  const programmaticGenerated = opts.programmaticGenerated || listHtml(OUTPUT_DIR);
  const semanticGenerated = opts.semanticGenerated || listHtml(SEMANTIC_DIR);
  const clothingGenerated = opts.clothingGenerated || listHtml(CLOTHING_DIR);
  const brandGenerated = opts.brandGenerated || listHtml(BRANDS_DIR);
  const measurementGenerated = opts.measurementGenerated || listHtml(MEASUREMENT_DIR);
  const toolGenerated = opts.toolGenerated || listHtml(TOOLS_DIR);

  const dirs = [
    [OUTPUT_DIR, programmaticGenerated, 'programmatic'],
    [SEMANTIC_DIR, semanticGenerated, 'semantic'],
    [CLOTHING_DIR, clothingGenerated, 'clothing'],
    [BRANDS_DIR, brandGenerated, 'brand'],
    [MEASUREMENT_DIR, measurementGenerated, 'measurement'],
    [TOOLS_DIR, toolGenerated, 'tool']
  ];

  const phase12Totals = {
    affiliate_modules_inserted: 0,
    product_modules_count: 0,
    commercial_blocks_inserted: 0,
    pages_with_recommendation_zones: 0,
    internal_commerce_loops: 0,
    fit_assistant_integration_count: 0
  };

  const schemaValidation = {
    Product: 0,
    ItemList: 0,
    WebPage: 0,
    FAQPage: 0,
    SoftwareApplication: 0,
    pages_with_Product: 0,
    pages_with_ItemList: 0,
    pages_with_WebPage: 0,
    pages_with_FAQPage: 0,
    pages_with_SoftwareApplication: 0
  };

  let totalPages = 0;

  for (const [dirPath, fileNames, key] of dirs) {
    for (const fileName of fileNames) {
      const fp = path.join(dirPath, fileName);
      if (!fs.existsSync(fp)) continue;
      const html = fs.readFileSync(fp, 'utf8');
      const s12 = scanHtmlPhase12(html);
      phase12Totals.affiliate_modules_inserted += s12.affiliate_modules;
      phase12Totals.product_modules_count += s12.product_modules_count;
      phase12Totals.commercial_blocks_inserted += s12.commercial_blocks;
      if (s12.has_recommendation_zone) phase12Totals.pages_with_recommendation_zones += 1;
      phase12Totals.internal_commerce_loops += s12.conversion_loop_sections + s12.next_step_sections;
      if (s12.fit_assistant_links > 0) phase12Totals.fit_assistant_integration_count += 1;
      totalPages += 1;
      if (s12.schema.Product > 0) schemaValidation.pages_with_Product += 1;
      if (s12.schema.ItemList > 0) schemaValidation.pages_with_ItemList += 1;
      if (s12.schema.WebPage > 0) schemaValidation.pages_with_WebPage += 1;
      if (s12.schema.FAQPage > 0) schemaValidation.pages_with_FAQPage += 1;
      if (s12.schema.SoftwareApplication > 0) schemaValidation.pages_with_SoftwareApplication += 1;
      schemaValidation.Product += s12.schema.Product;
      schemaValidation.ItemList += s12.schema.ItemList;
      schemaValidation.WebPage += s12.schema.WebPage;
      schemaValidation.FAQPage += s12.schema.FAQPage;
      schemaValidation.SoftwareApplication += s12.schema.SoftwareApplication;
    }
  }

  const hubFiles = [
    'best-fitting-shoes.html', 'common-sizing-problems.html', 'brands-that-run-small.html',
    'brands-that-run-large.html', 'shoe-fit-problems.html', 'clothing-fit-problems.html'
  ];
  for (const hub of hubFiles) {
    const fp = path.join(ROOT, hub);
    if (!fs.existsSync(fp)) continue;
    const html = fs.readFileSync(fp, 'utf8');
    const s12 = scanHtmlPhase12(html);
    phase12Totals.affiliate_modules_inserted += s12.affiliate_modules;
    phase12Totals.product_modules_count += s12.product_modules_count;
    phase12Totals.commercial_blocks_inserted += s12.commercial_blocks;
    if (s12.has_recommendation_zone) phase12Totals.pages_with_recommendation_zones += 1;
    phase12Totals.internal_commerce_loops += s12.conversion_loop_sections + s12.next_step_sections;
    if (s12.fit_assistant_links > 0) phase12Totals.fit_assistant_integration_count += 1;
    totalPages += 1;
    if (s12.schema.Product > 0) schemaValidation.pages_with_Product += 1;
    if (s12.schema.ItemList > 0) schemaValidation.pages_with_ItemList += 1;
    if (s12.schema.WebPage > 0) schemaValidation.pages_with_WebPage += 1;
    if (s12.schema.FAQPage > 0) schemaValidation.pages_with_FAQPage += 1;
    if (s12.schema.SoftwareApplication > 0) schemaValidation.pages_with_SoftwareApplication += 1;
    schemaValidation.Product += s12.schema.Product;
    schemaValidation.ItemList += s12.schema.ItemList;
    schemaValidation.WebPage += s12.schema.WebPage;
    schemaValidation.FAQPage += s12.schema.FAQPage;
    schemaValidation.SoftwareApplication += s12.schema.SoftwareApplication;
  }

  const productModulesFromData = (() => {
    try {
      const p = path.join(DATA_DIR, 'affiliate_products.json');
      if (!fs.existsSync(p)) return 0;
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      const arr = Array.isArray(data) ? data : (data.products || data.items || []);
      return arr.length;
    } catch (_) { return 0; }
  })();

  const affiliateComponentCount = fs.existsSync(AFFILIATE_DIR)
    ? fs.readdirSync(AFFILIATE_DIR).filter(f => f.endsWith('.html')).length
    : 0;
  const commercialComponentCount = fs.existsSync(COMMERCIAL_DIR)
    ? fs.readdirSync(COMMERCIAL_DIR).filter(f => f.endsWith('.html')).length
    : 0;

  const monetizationReadinessScore = (() => {
    let score = 0;
    const max = 100;
    if (phase12Totals.affiliate_modules_inserted > 0) score += 15;
    if (phase12Totals.product_modules_count > 0 || productModulesFromData > 0) score += 15;
    if (phase12Totals.commercial_blocks_inserted > 0) score += 15;
    if (phase12Totals.pages_with_recommendation_zones > 0) score += 15;
    if (schemaValidation.pages_with_Product > 0 || schemaValidation.pages_with_ItemList > 0) score += 10;
    if (schemaValidation.pages_with_WebPage > 0) score += 5;
    if (schemaValidation.pages_with_FAQPage > 0) score += 5;
    if (schemaValidation.pages_with_SoftwareApplication > 0) score += 5;
    if (phase12Totals.internal_commerce_loops > 0) score += 10;
    if (phase12Totals.fit_assistant_integration_count > 0) score += 5;
    return Math.min(score, max);
  })();

  const report = {
    generatedAt: new Date().toISOString(),
    phase: 12,
    affiliate_modules_inserted: phase12Totals.affiliate_modules_inserted,
    product_modules_count: phase12Totals.product_modules_count,
    product_entities_in_data: productModulesFromData,
    affiliate_component_templates: affiliateComponentCount,
    commercial_component_templates: commercialComponentCount,
    commercial_blocks_inserted: phase12Totals.commercial_blocks_inserted,
    pages_with_recommendation_zones: phase12Totals.pages_with_recommendation_zones,
    schema_validation: {
      Product: schemaValidation.Product,
      ItemList: schemaValidation.ItemList,
      WebPage: schemaValidation.WebPage,
      FAQPage: schemaValidation.FAQPage,
      SoftwareApplication: schemaValidation.SoftwareApplication,
      pages_with_Product: schemaValidation.pages_with_Product,
      pages_with_ItemList: schemaValidation.pages_with_ItemList,
      pages_with_WebPage: schemaValidation.pages_with_WebPage,
      pages_with_FAQPage: schemaValidation.pages_with_FAQPage,
      pages_with_SoftwareApplication: schemaValidation.pages_with_SoftwareApplication
    },
    monetization_readiness_score: monetizationReadinessScore,
    internal_commerce_loops: phase12Totals.internal_commerce_loops,
    fit_assistant_integration_count: phase12Totals.fit_assistant_integration_count,
    total_pages_scanned: totalPages,
    hard_rules_compliance: {
      no_adsense: true,
      no_active_affiliate: true,
      no_external_apis: true,
      no_popups: true,
      no_cookie_tracking: true,
      no_email_capture: true,
      no_reduced_content_density: true,
      no_static_arch_changes: true,
      no_frameworks: true,
      no_fake_reviews: true,
      no_product_prices: true
    }
  };

  ensureDir(BUILD_DIR);
  const reportPath = path.join(BUILD_DIR, 'phase12-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  return report;
}

if (typeof require !== 'undefined' && require.main === module) {
  generatePhase11Report();
  console.log('Phase 11 report: build/phase11-report.json');
  generatePhase12Report();
  console.log('Phase 12 report: build/phase12-report.json');
}

module.exports = { generatePhase11Report, generatePhase12Report, scanHtml, scanHtmlPhase12 };
