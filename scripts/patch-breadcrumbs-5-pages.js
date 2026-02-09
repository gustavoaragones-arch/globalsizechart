#!/usr/bin/env node
/**
 * STEP 3 — PATCH BREADCRUMBS (5 PAGES ONLY)
 *
 * Applies injectBreadcrumbs(pageType, hierarchy) to:
 *   1. legal (legal/about.html)
 *   2. guides (shoe-sizing-guides.html)
 *   3. measurement tools (measurement-tools.html)
 *   4. clothing authority (clothing-size-pages.html)
 *   5. clothing authority (clothing/clothing-men-tops-L-EU-to-US.html)
 *
 * Usage: node scripts/patch-breadcrumbs-5-pages.js
 * Run after build if those 5 pages are regenerated (e.g. after generate-hubs or full build).
 */

const fs = require('fs');
const path = require('path');
const { injectBreadcrumbsIntoHtml } = require('./breadcrumb-middleware.js');

const ROOT = path.resolve(__dirname, '..');

const PAGES = [
  {
    file: 'legal/about.html',
    pageType: 'legal',
    hierarchy: [
      { name: 'Home', url: 'https://globalsizechart.com/' },
      { name: 'Legal', url: 'https://globalsizechart.com/legal/about.html' },
      { name: 'About', url: 'https://globalsizechart.com/legal/about.html' }
    ]
  },
  {
    file: 'shoe-sizing-guides.html',
    pageType: 'guides',
    hierarchy: [
      { name: 'Home', url: 'https://globalsizechart.com/' },
      { name: 'Shoe Converter', url: 'https://globalsizechart.com/shoe-size-converter.html' },
      { name: 'Shoe Sizing Guides', url: 'https://globalsizechart.com/shoe-sizing-guides.html' }
    ]
  },
  {
    file: 'measurement-tools.html',
    pageType: 'measurement_tools',
    hierarchy: [
      { name: 'Home', url: 'https://globalsizechart.com/' },
      { name: 'Converters', url: 'https://globalsizechart.com/shoe-size-converter.html' },
      { name: 'Measurement Tools', url: 'https://globalsizechart.com/measurement-tools.html' }
    ]
  },
  {
    file: 'clothing-size-pages.html',
    pageType: 'clothing_authority',
    hierarchy: [
      { name: 'Home', url: 'https://globalsizechart.com/' },
      { name: 'Clothing Converter', url: 'https://globalsizechart.com/clothing-size-converter.html' },
      { name: 'Clothing Size Pages', url: 'https://globalsizechart.com/clothing-size-pages.html' }
    ]
  },
  {
    file: 'clothing/clothing-men-tops-L-EU-to-US.html',
    pageType: 'clothing_authority',
    hierarchy: [
      { name: 'Home', url: 'https://globalsizechart.com/' },
      { name: 'Clothing Converter', url: 'https://globalsizechart.com/clothing-size-converter.html' },
      { name: "Men's EU L to US Tops Size", url: 'https://globalsizechart.com/clothing/clothing-men-tops-L-EU-to-US.html' }
    ]
  }
];

function run() {
  for (const { file, pageType, hierarchy } of PAGES) {
    const filePath = path.join(ROOT, file);
    if (!fs.existsSync(filePath)) {
      console.warn('  skip (not found): ' + file);
      continue;
    }
    const html = fs.readFileSync(filePath, 'utf8');
    const out = injectBreadcrumbsIntoHtml(html, pageType, hierarchy);
    if (out !== html) {
      fs.writeFileSync(filePath, out, 'utf8');
      console.log('  patched: ' + file);
    } else {
      console.log('  unchanged: ' + file);
    }
  }
  console.log('Breadcrumb patch (5 pages) done.');
}

run();
