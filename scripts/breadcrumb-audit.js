#!/usr/bin/env node
/**
 * Step 4: Breadcrumb structure audit.
 * Scans programmatic, semantic, brand, hub, and tools pages for:
 * - Visible breadcrumb nav (Home > Shoe Converter > Region > Size Pair)
 * - JSON-LD BreadcrumbList schema
 * - Correct parent relationships and consistent structure
 * Outputs: build/breadcrumb-audit.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'build');
const BASE_URL = 'https://globalsizechart.com';

const DIRS = [
  { dir: path.join(ROOT, 'programmatic-pages'), rel: 'programmatic-pages', label: 'programmatic' },
  { dir: path.join(ROOT, 'semantic'), rel: 'semantic', label: 'semantic' },
  { dir: path.join(ROOT, 'brands'), rel: 'brands', label: 'brand' },
  { dir: path.join(ROOT, 'measurement'), rel: 'measurement', label: 'measurement' },
  { dir: path.join(ROOT, 'printable'), rel: 'printable', label: 'printable' },
  { dir: path.join(ROOT, 'tools'), rel: 'tools', label: 'tools' }
];

const HUB_FILES = [
  'shoe-size-pages.html',
  'measurement-tools.html',
  'printable-size-guides.html',
  'cm-measurement-converters.html',
  'brand-size-guides.html',
  'brand-sizing-guide.html',
  'clothing-size-pages.html',
  'shoe-sizing-guides.html',
  'shoe-size-converter.html',
  'clothing-size-converter.html',
  'programmatic-index.html'
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function listHtmlFiles(dirPath) {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) return [];
  return fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(dirPath, f));
}

/** Extract visible breadcrumb from HTML: <nav class="breadcrumbs" ...>...</nav> */
function extractVisibleBreadcrumb(html) {
  const m = html.match(/<nav[^>]*class="[^"]*breadcrumbs[^"]*"[^>]*aria-label="Breadcrumb"[^>]*>([\s\S]*?)<\/nav>/i);
  if (!m) return null;
  const inner = m[1];
  const links = [];
  const linkRe = /<a\s+[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let linkM;
  while ((linkM = linkRe.exec(inner)) !== null) {
    links.push({ href: linkM[1].trim(), text: linkM[2].replace(/<[^>]+>/g, '').trim() });
  }
  const spanRe = /<span>([\s\S]*?)<\/span>/g;
  let spanM;
  while ((spanM = spanRe.exec(inner)) !== null) {
    links.push({ href: null, text: spanM[1].trim() });
  }
  return { raw: m[0].slice(0, 200), links };
}

/** Extract BreadcrumbList from script type="application/ld+json" */
function extractBreadcrumbListJsonLd(html) {
  const blocks = html.match(/<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of blocks) {
    const inner = block.replace(/<script[^>]*>([\s\S]*?)<\/script>/i, '$1').trim();
    try {
      const data = JSON.parse(inner);
      const list = Array.isArray(data) ? data.find(x => x['@type'] === 'BreadcrumbList') : (data['@type'] === 'BreadcrumbList' ? data : null);
      if (list && list.itemListElement && Array.isArray(list.itemListElement)) {
        return list.itemListElement.map((el, i) => ({
          position: el.position || i + 1,
          name: el.name,
          item: el.item
        }));
      }
    } catch (_) {}
  }
  return null;
}

/** Normalize URL to path (no host, no trailing slash except for root). */
function urlToPath(url) {
  if (!url) return '';
  const u = url.replace(/^https?:\/\/[^/]+/i, '').replace(/#.*$/, '');
  if (u === '' || u === '/') return '/';
  return u.startsWith('/') ? u : '/' + u;
}

/** Check if breadcrumb trail is valid: starts with Home, positions sequential, no broken expectations. */
function validateBreadcrumbItems(items, pagePath) {
  const errors = [];
  if (!items || items.length === 0) {
    errors.push('missing_items');
    return { valid: false, errors };
  }
  const first = items[0];
  const firstPath = first.item ? urlToPath(first.item) : '';
  const homePaths = ['/', '/index.html', BASE_URL + '/', 'https://globalsizechart.com/'];
  const isHome = homePaths.some(h => (first.item || '').endsWith(h.replace(/\/$/, '')) || firstPath === '/' || firstPath === '/index.html' || (first.name && first.name.toLowerCase() === 'home'));
  if (!isHome && !(first.name && first.name.toLowerCase().includes('home'))) {
    errors.push('first_item_not_home');
  }
  for (let i = 0; i < items.length; i++) {
    if (items[i].position !== i + 1) {
      errors.push('position_not_sequential');
      break;
    }
  }
  return { valid: errors.length === 0, errors };
}

function runAudit() {
  ensureDir(BUILD_DIR);
  const pages = [];
  let withVisible = 0;
  let withJsonLd = 0;
  let validStructure = 0;
  const brokenParents = [];

  function processFile(filePath, relPath, label) {
    const html = fs.readFileSync(filePath, 'utf8');
    const visible = extractVisibleBreadcrumb(html);
    const items = extractBreadcrumbListJsonLd(html);
    const validation = validateBreadcrumbItems(items, relPath);

    if (visible) withVisible++;
    if (items && items.length) withJsonLd++;
    if (validation.valid && items && items.length) validStructure++;
    if (!validation.valid && items && items.length) brokenParents.push(relPath);

    pages.push({
      path: relPath,
      type: label,
      hasVisible: !!visible,
      hasJsonLd: !!(items && items.length),
      itemCount: items ? items.length : 0,
      validStructure: validation.valid,
      errors: validation.errors,
      items: items ? items.map(i => ({ name: i.name, item: i.item })) : null
    });
  }

  for (const { dir, rel, label } of DIRS) {
    const files = listHtmlFiles(dir);
    for (const filePath of files) {
      const relPath = path.relative(ROOT, filePath).replace(/\\/g, '/');
      processFile(filePath, relPath, label);
    }
  }

  for (const hub of HUB_FILES) {
    const filePath = path.join(ROOT, hub);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      processFile(filePath, hub, 'hub');
    }
  }

  const summary = {
    total: pages.length,
    withVisible,
    withJsonLd,
    validStructure,
    missingVisible: pages.length - withVisible,
    missingJsonLd: pages.length - withJsonLd,
    brokenParents: brokenParents.length,
    byType: {}
  };

  for (const p of pages) {
    if (!summary.byType[p.type]) {
      summary.byType[p.type] = { total: 0, withVisible: 0, withJsonLd: 0, validStructure: 0 };
    }
    summary.byType[p.type].total++;
    if (p.hasVisible) summary.byType[p.type].withVisible++;
    if (p.hasJsonLd) summary.byType[p.type].withJsonLd++;
    if (p.validStructure) summary.byType[p.type].validStructure++;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    goal: 'Flatten crawl depth + improve indexing. Visible: Home > Shoe Converter > Region > Size Pair. JSON-LD BreadcrumbList on all.',
    summary,
    brokenParents: brokenParents.slice(0, 50),
    pages: pages
  };

  fs.writeFileSync(path.join(BUILD_DIR, 'breadcrumb-audit.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log('Breadcrumb audit written to build/breadcrumb-audit.json');
  console.log('Total pages:', summary.total);
  console.log('With visible breadcrumb:', summary.withVisible);
  console.log('With BreadcrumbList JSON-LD:', summary.withJsonLd);
  console.log('Valid structure:', summary.validStructure);
  console.log('Missing visible:', summary.missingVisible);
  console.log('Missing JSON-LD:', summary.missingJsonLd);
  console.log('Broken parents:', summary.brokenParents);
}

runAudit();
