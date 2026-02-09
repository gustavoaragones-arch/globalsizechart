#!/usr/bin/env node
/**
 * Orphan Resolver — STEP 2
 *
 * After broken links are 0:
 * 1. Find all orphan pages (inbound links < 2).
 * 2. Categorize each: clothing | measurement | brand | authority | legal | programmatic.
 * 3. Add links from shoe-size-pages.html, brand-size-guides.html, measurement-tools.html,
 *    shoe-sizing-guides.html, and footer navigation so every orphan has ≥2 inbound links.
 * 4. Write build/orphan-resolver-manifest.json.
 *
 * Workflow:
 *   1. Ensure broken links are 0 (prebuild-link-validation passes).
 *   2. Run full build: node scripts/generate-all-pages.js
 *   3. Run this script: node scripts/fix-orphans.js  (patches hub files so every orphan has ≥2 inbound).
 *   4. To regenerate hubs from templates: node scripts/generate-hubs.js  (then run this script again to re-apply orphan links).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'build');
const MIN_INBOUND = 2;

const EXCLUDE_DIRS = new Set(['programmatic', 'components', 'sitemaps', 'config', 'data', 'build', 'scripts', 'node_modules']);

const HUB_FILES = [
  'shoe-size-pages.html',
  'brand-size-guides.html',
  'measurement-tools.html',
  'shoe-sizing-guides.html'
];

const CATEGORY_HUBS = {
  clothing: ['shoe-size-pages.html', 'brand-size-guides.html'],
  measurement: ['measurement-tools.html', 'shoe-sizing-guides.html'],
  brand: ['brand-size-guides.html', 'measurement-tools.html'],
  authority: ['shoe-sizing-guides.html', 'measurement-tools.html'],
  legal: ['shoe-size-pages.html', 'brand-size-guides.html'],
  programmatic: ['shoe-size-pages.html', 'shoe-sizing-guides.html']
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function listHtmlFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const full = path.join(dirPath, e.name);
    if (e.isDirectory() && !e.name.startsWith('.') && !EXCLUDE_DIRS.has(e.name)) {
      out.push(...listHtmlFiles(full));
    } else if (e.isFile() && e.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

function toRelPath(absPath) {
  const rel = path.relative(ROOT, absPath);
  return rel.replace(/\\/g, '/');
}

function resolveHref(href, fromRelPath) {
  let raw = (href || '').trim().replace(/#.*$/, '');
  if (!raw || raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return null;
  if (raw.startsWith('#')) return null;
  if (raw.startsWith('/')) {
    raw = raw.slice(1) || 'index.html';
    return raw.endsWith('.html') ? raw : (raw === '' ? 'index.html' : raw + '.html');
  }
  const fromDir = path.dirname(path.join(ROOT, fromRelPath));
  const resolved = path.normalize(path.join(fromDir, raw));
  let rel = path.relative(ROOT, resolved);
  if (rel.startsWith('..')) return null;
  rel = rel.replace(/\\/g, '/');
  if (rel.endsWith('.html')) return rel;
  if (rel === '' || rel === '.') return 'index.html';
  if (!rel.includes('.')) return rel + '.html';
  return rel;
}

function collectAllPages() {
  const files = listHtmlFiles(ROOT);
  const pages = new Set();
  for (const f of files) {
    const rel = toRelPath(f);
    if (!rel.includes('programmatic/templates')) pages.add(rel);
  }
  return pages;
}

function getInternalLinks(html, fromRelPath) {
  const re = /<a\s+[^>]*href\s*=\s*["']([^"']+)["']/gi;
  const out = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    const resolved = resolveHref(m[1], fromRelPath);
    if (resolved) out.add(resolved);
  }
  return out;
}

function getCategory(relPath) {
  if (relPath.startsWith('clothing/')) return 'clothing';
  if (relPath.startsWith('measurement/')) return 'measurement';
  if (relPath.startsWith('brands/')) return 'brand';
  if (relPath.startsWith('legal/')) return 'legal';
  if (relPath.startsWith('programmatic-pages/')) return 'programmatic';
  if (relPath.startsWith('semantic/')) return 'authority';
  return 'programmatic';
}

function linkTextFromPath(relPath) {
  const base = path.basename(relPath, '.html');
  return base.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getExistingHubLinks(html) {
  const re = /<a\s+[^>]*href\s*=\s*["']([^"']+)["']/gi;
  const out = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    const h = (m[1] || '').trim().replace(/#.*$/, '');
    if (h && !h.startsWith('http') && !h.startsWith('#')) out.add(h);
  }
  return out;
}

function injectOrphanSection(html, hubFile, linksToAdd) {
  if (linksToAdd.length === 0) return html;
  const ul = '<ul class="hub-links">' + linksToAdd.map(({ href, text }) => '<li><a href="' + escapeHtml(href) + '">' + escapeHtml(text) + '</a></li>').join('') + '</ul>';
  const section = '<section class="content-section" id="orphan-resolver"><h2>More pages</h2>' + ul + '</section>';
  const beforeFooter = html.indexOf('  <footer>');
  if (beforeFooter >= 0) {
    return html.slice(0, beforeFooter) + '\n' + section + '\n' + html.slice(beforeFooter);
  }
  const beforeMainClose = html.lastIndexOf('</main>');
  if (beforeMainClose >= 0) {
    return html.slice(0, beforeMainClose) + '\n' + section + '\n  ' + html.slice(beforeMainClose);
  }
  return html;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function run() {
  ensureDir(BUILD_DIR);
  const allPages = collectAllPages();
  const hubSet = new Set(HUB_FILES);
  const pageToLinks = new Map();
  const pageToInLinks = new Map();

  for (const rel of allPages) {
    pageToInLinks.set(rel, new Set());
  }

  for (const rel of allPages) {
    const absPath = path.join(ROOT, rel);
    let html;
    try {
      html = fs.readFileSync(absPath, 'utf8');
    } catch (_) {
      continue;
    }
    const links = getInternalLinks(html, rel);
    pageToLinks.set(rel, links);
    for (const target of links) {
      if (allPages.has(target)) {
        const inSet = pageToInLinks.get(target);
        if (inSet) inSet.add(rel);
      }
    }
  }

  const orphans = [];
  for (const rel of allPages) {
    if (rel === 'index.html' || hubSet.has(rel)) continue;
    const inSet = pageToInLinks.get(rel);
    const count = inSet ? inSet.size : 0;
    if (count < MIN_INBOUND) {
      const category = getCategory(rel);
      orphans.push({ path: rel, category, inbound: count });
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    minInbound: MIN_INBOUND,
    orphanCount: orphans.length,
    orphans: orphans.map(o => ({ path: o.path, category: o.category, inbound: o.inbound })),
    linksAdded: {}
  };

  const linksByHub = new Map();
  for (const h of HUB_FILES) linksByHub.set(h, []);

  for (const o of orphans) {
    const hubs = CATEGORY_HUBS[o.category] || CATEGORY_HUBS.programmatic;
    const need = MIN_INBOUND - o.inbound;
    if (need <= 0) continue;
    const text = linkTextFromPath(o.path);
    let added = 0;
    for (const hubFile of hubs) {
      if (added >= need) break;
      const arr = linksByHub.get(hubFile);
      if (!arr.some(x => x.href === o.path)) {
        arr.push({ href: o.path, text });
        added++;
      }
    }
  }

  for (const hubFile of HUB_FILES) {
    const hubPath = path.join(ROOT, hubFile);
    if (!fs.existsSync(hubPath)) continue;
    let html = fs.readFileSync(hubPath, 'utf8');
    const existing = getExistingHubLinks(html);
    const toAdd = linksByHub.get(hubFile).filter(l => !existing.has(l.href) && !existing.has(l.href.replace(/^\.\//, '')));
    if (toAdd.length === 0) continue;
    html = injectOrphanSection(html, hubFile, toAdd);
    fs.writeFileSync(hubPath, html, 'utf8');
    manifest.linksAdded[hubFile] = toAdd.length;
    console.log('  patched ' + hubFile + ' (+' + toAdd.length + ' links)');
  }

  fs.writeFileSync(path.join(BUILD_DIR, 'orphan-resolver-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('Orphan resolver: ' + orphans.length + ' orphan(s), manifest written to build/orphan-resolver-manifest.json');
  return { orphanCount: orphans.length, manifest };
}

if (require.main === module) {
  run();
}

module.exports = { run };
