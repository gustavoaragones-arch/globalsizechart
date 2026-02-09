#!/usr/bin/env node
/**
 * STEP 3 — Add JSON-LD Breadcrumb Generator
 *
 * Process:
 *   - Parse HTML
 *   - If no BreadcrumbList → auto-generate from URL structure (breadcrumb-engine)
 *   - Inject <script type="application/ld+json">BreadcrumbList</script> before </head>
 *
 * Usage:
 *   node scripts/inject-breadcrumb-schema.js
 *     → processes pages_missing_breadcrumb_schema from build/phase1275-structure-report.json
 *   node scripts/inject-breadcrumb-schema.js path/to/page.html [path2.html ...]
 *     → processes given paths (relative to repo root)
 */

const fs = require('fs');
const path = require('path');
const { hierarchyFromPath } = require('./breadcrumb-engine.js');

const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'build');
const REPORT_PATH = path.join(BUILD_DIR, 'phase1275-structure-report.json');

const BASE_URL = 'https://globalsizechart.com';

/** True if HTML already contains a BreadcrumbList in application/ld+json */
function hasBreadcrumbList(html) {
  return /<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>[\s\S]*?"@type"\s*:\s*"BreadcrumbList"/i.test(html);
}

/**
 * Build BreadcrumbList JSON-LD from hierarchy.
 * Last item omits "item" (current page) per schema.org example.
 */
function buildBreadcrumbJsonLd(hierarchy) {
  const itemListElement = (hierarchy || []).map((item, i) => {
    const isLast = i === hierarchy.length - 1;
    const entry = {
      '@type': 'ListItem',
      position: i + 1,
      name: item.name
    };
    if (!isLast && item.url) {
      entry.item = item.url.startsWith('http') ? item.url : BASE_URL + '/' + item.url.replace(/^\//, '');
    }
    return entry;
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement
  };
}

function injectScript(html, jsonLd) {
  const script = '<script type="application/ld+json">\n' + JSON.stringify(jsonLd, null, 2) + '\n</script>';
  const beforeHeadClose = html.indexOf('</head>');
  if (beforeHeadClose >= 0) {
    return html.slice(0, beforeHeadClose) + '\n  ' + script + '\n' + html.slice(beforeHeadClose);
  }
  return html;
}

function processFile(relPath) {
  const filePath = path.join(ROOT, relPath);
  if (!fs.existsSync(filePath)) {
    console.warn('  skip (not found): ' + relPath);
    return { done: false, reason: 'not_found' };
  }
  let html = fs.readFileSync(filePath, 'utf8');
  if (hasBreadcrumbList(html)) {
    return { done: false, reason: 'already_has_breadcrumb' };
  }
  const hierarchy = hierarchyFromPath(relPath);
  const jsonLd = buildBreadcrumbJsonLd(hierarchy);
  html = injectScript(html, jsonLd);
  fs.writeFileSync(filePath, html, 'utf8');
  return { done: true, hierarchy: hierarchy.map(h => h.name).join(' > ') };
}

function main() {
  let paths = [];
  const args = process.argv.slice(2);
  if (args.length > 0) {
    paths = args.map(a => a.replace(/^\/+/, '').replace(/\\/g, '/'));
  } else {
    if (!fs.existsSync(REPORT_PATH)) {
      console.error('Run phase1275-structure-audit.js first, or pass file paths as arguments.');
      process.exit(1);
    }
    const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
    paths = report.pages_missing_breadcrumb_schema || [];
  }

  if (paths.length === 0) {
    console.log('No pages to process.');
    return;
  }

  console.log('Injecting BreadcrumbList JSON-LD into', paths.length, 'page(s)...');
  let injected = 0;
  for (const relPath of paths) {
    const result = processFile(relPath);
    if (result.done) {
      injected++;
      console.log('  injected:', relPath, '→', result.hierarchy);
    } else if (result.reason === 'already_has_breadcrumb') {
      console.log('  skip (has BreadcrumbList):', relPath);
    }
  }
  console.log('Done. Injected', injected, 'of', paths.length);
}

main();
