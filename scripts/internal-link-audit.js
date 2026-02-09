#!/usr/bin/env node
/**
 * Step 3: Internal Link Audit for programmatic pages.
 * Scans programmatic-pages/*.html and produces build/internal-link-audit.json.
 * Required per page: 15–25+ internal links; Related Sizes Grid; Region Converters; Authority Links.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PROGRAMMATIC_DIR = path.join(ROOT, 'programmatic-pages');
const BUILD_DIR = path.join(ROOT, 'build');
const MIN_INTERNAL_LINKS = 15;
const MAX_INTERNAL_LINKS_RECOMMENDED = 25;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Count internal links in HTML: same-site (../ or relative .html or #). */
function countInternalLinks(html) {
  const internalHref = /<a\s+[^>]*href\s*=\s*["']([^"']+)["']/gi;
  let count = 0;
  let m;
  while ((m = internalHref.exec(html)) !== null) {
    const href = (m[1] || '').trim();
    if (!href) continue;
    if (href.startsWith('#')) { count++; continue; }
    if (href.startsWith('../') || href.startsWith('..\\')) { count++; continue; }
    if (href.endsWith('.html') && !href.startsWith('http')) count++;
    if (/^[a-z0-9-]+\.html$/i.test(href)) count++;
  }
  return count;
}

/** Check for Related Sizes Grid (section or "Explore Nearby"). */
function hasRelatedSizesGrid(html) {
  return /related-size-grid|Explore Nearby Size Conversions/i.test(html);
}

/** Check for Region Converters (EU→US, US→UK, JP→US, CM→US or "Region Converters"). */
function hasRegionConverters(html) {
  const hasSection = /Region Converters|region-converters-block/i.test(html);
  const hasRequired = /eu-to-us-shoe-size|us-to-uk-shoe-size|japan-to-us-shoe-size|cm-to-us-shoe-size/i.test(html);
  return hasSection || hasRequired;
}

/** Check for Authority Links (brand guide, measurement tool, sizing guides). */
function hasAuthorityLinks(html) {
  const hasSection = /Authority Links|authority-links-block/i.test(html);
  const hasBrand = /brand-size-guides|brand-sizing-guide/i.test(html);
  const hasMeasurement = /measurement-tools|measurement-assistant/i.test(html);
  const hasSizingGuides = /shoe-sizing-guides|shoe-size-pages/i.test(html);
  return hasSection || (hasBrand && (hasMeasurement || hasSizingGuides));
}

function runAudit() {
  ensureDir(BUILD_DIR);
  const files = fs.readdirSync(PROGRAMMATIC_DIR).filter(f => f.endsWith('.html'));
  const results = [];
  let underMinimum = 0;
  let missingRelatedGrid = 0;
  let missingRegionConverters = 0;
  let missingAuthorityLinks = 0;

  for (const file of files) {
    const filePath = path.join(PROGRAMMATIC_DIR, file);
    const html = fs.readFileSync(filePath, 'utf8');
    const internalLinkCount = countInternalLinks(html);
    const hasRelated = hasRelatedSizesGrid(html);
    const hasRegion = hasRegionConverters(html);
    const hasAuthority = hasAuthorityLinks(html);
    const meetsMinimum = internalLinkCount >= MIN_INTERNAL_LINKS;
    const meetsSections = hasRelated && hasRegion && hasAuthority;

    if (internalLinkCount < MIN_INTERNAL_LINKS) underMinimum++;
    if (!hasRelated) missingRelatedGrid++;
    if (!hasRegion) missingRegionConverters++;
    if (!hasAuthority) missingAuthorityLinks++;

    results.push({
      file,
      internal_link_count: internalLinkCount,
      has_related_sizes_grid: hasRelated,
      has_region_converters: hasRegion,
      has_authority_links: hasAuthority,
      meets_minimum_links: meetsMinimum,
      has_all_required_sections: meetsSections
    });
  }

  const report = {
    audit_type: 'internal_link',
    date: new Date().toISOString().slice(0, 10),
    scope: 'programmatic-pages',
    requirement: {
      min_internal_links: MIN_INTERNAL_LINKS,
      recommended_max: MAX_INTERNAL_LINKS_RECOMMENDED,
      required_sections: ['Related Sizes Grid', 'Region Converters', 'Authority Links']
    },
    summary: {
      total_pages: results.length,
      pages_under_minimum_links: underMinimum,
      pages_missing_related_grid: missingRelatedGrid,
      pages_missing_region_converters: missingRegionConverters,
      pages_missing_authority_links: missingAuthorityLinks,
      pages_passing_all: results.filter(r => r.meets_minimum_links && r.has_all_required_sections).length
    },
    pages: results
  };

  const outPath = path.join(BUILD_DIR, 'internal-link-audit.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('Internal link audit written to', outPath);
  console.log('  Total pages:', report.summary.total_pages);
  console.log('  Under 15 links:', report.summary.pages_under_minimum_links);
  console.log('  Missing related grid:', report.summary.pages_missing_related_grid);
  console.log('  Missing region converters:', report.summary.pages_missing_region_converters);
  console.log('  Missing authority links:', report.summary.pages_missing_authority_links);
  console.log('  Passing all:', report.summary.pages_passing_all);
  return report;
}

runAudit();
