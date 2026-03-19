#!/usr/bin/env node
/**
 * Dynamic Sitemap Generator for globalsizechart.com
 *
 * Scans the project for HTML files, groups them by category, and generates
 * sitemap XML files with automatic splitting at 50,000 URLs per file (Google limit).
 * Uses file modification time for lastmod. No priority or changefreq (ignored by Google).
 * Scans the full site root (includes /knowledge/, /guides/, /semantic/, etc.); skips /components/.
 *
 * Usage: node scripts/generate-sitemaps.js
 * Deploy: npm run build:sitemaps
 *
 * Output:
 *   /sitemap.xml (index)
 *   /sitemaps/sitemap-core.xml (or -1, -2 if >50k)
 *   /sitemaps/sitemap-programmatic-1.xml, -2.xml, ...
 *   /sitemaps/sitemap-brands.xml
 *   /sitemaps/sitemap-guides.xml
 *   /sitemaps/sitemap-measurement.xml
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITEMAPS_DIR = path.join(ROOT, 'sitemaps');
const BASE_URL = 'https://globalsizechart.com';
const MAX_URLS_PER_SITEMAP = 50000;

const IGNORE_DIRS = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components']);

/** Map path prefix to category. Order matters: more specific first. */
function getCategory(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  if (normalized.startsWith('programmatic-pages/ai-generated/')) return 'programmaticAi';
  if (normalized.startsWith('programmatic-pages/')) return 'programmatic';
  if (normalized.startsWith('measurement/') || normalized.startsWith('tools/')) return 'measurement';
  if (normalized.startsWith('brands/')) return 'brands';
  if (normalized.startsWith('semantic/') || normalized.startsWith('printable/')) return 'guides';
  return 'core';
}

/** Convert file path to full URL. index.html → directory URL with trailing slash. */
function pathToUrl(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  if (normalized === 'index.html') return BASE_URL + '/';
  if (normalized.endsWith('/index.html')) return BASE_URL + '/' + normalized.slice(0, -11) + '/';
  return BASE_URL + '/' + normalized;
}

/** Format mtime as YYYY-MM-DD */
function formatLastmod(mtime) {
  const d = new Date(mtime);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/**
 * Recursively walk directory and yield { relPath, mtime } for each .html file.
 * Skips IGNORE_DIRS. Streams one file at a time to avoid holding all in memory.
 */
function* walkHtml(dir, prefix = '') {
  const entries = fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true });
  for (const ent of entries) {
    const rel = prefix ? prefix + '/' + ent.name : ent.name;
    if (ent.isDirectory()) {
      if (IGNORE_DIRS.has(ent.name)) continue;
      yield* walkHtml(path.join(dir, ent.name), rel);
    } else if (ent.isFile() && ent.name.endsWith('.html')) {
      const fullPath = path.join(ROOT, dir, ent.name);
      let mtime;
      try {
        mtime = fs.statSync(fullPath).mtimeMs;
      } catch {
        mtime = Date.now();
      }
      yield { relPath: rel, mtime };
    }
  }
}

/**
 * Writes URL entries to sitemap file(s), splitting at MAX_URLS_PER_SITEMAP.
 * Uses sync writes so index is generated only after all sitemaps are closed.
 * One file at a time per category to avoid holding all URLs in memory.
 */
class SitemapWriter {
  /**
   * @param {string} category
   * @param {{ fileBase?: string }} [opts] - if fileBase set, first file is fileBase.xml, then fileBase-2.xml
   */
  constructor(category, opts = {}) {
    this.category = category;
    this.fileBase = opts.fileBase || null;
    this.fileIndex = 0;
    this.count = 0;
    this.currentPath = null;
    this.generatedFiles = [];
  }

  _openNext() {
    if (this.currentPath) {
      fs.appendFileSync(this.currentPath, '</urlset>\n');
    }
    this.fileIndex++;
    let baseName;
    if (this.fileBase) {
      baseName = this.fileIndex === 1 ? `${this.fileBase}.xml` : `${this.fileBase}-${this.fileIndex}.xml`;
    } else if (this.fileIndex === 1 && this.category !== 'programmatic') {
      baseName = `sitemap-${this.category}.xml`;
    } else {
      baseName = `sitemap-${this.category}-${this.fileIndex}.xml`;
    }
    this.currentPath = path.join(SITEMAPS_DIR, baseName);
    this.generatedFiles.push(baseName);
    const header = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    fs.writeFileSync(this.currentPath, header);
    this.count = 0;
  }

  addUrl(relPath, mtime) {
    if (this.count >= MAX_URLS_PER_SITEMAP || (this.currentPath === null && this.fileIndex === 0)) {
      this._openNext();
    }
    const url = pathToUrl(relPath);
    const lastmod = formatLastmod(mtime);
    const line = '<url>\n <loc>' + escapeXml(url) + '</loc>\n <lastmod>' + lastmod + '</lastmod>\n</url>\n';
    fs.appendFileSync(this.currentPath, line);
    this.count++;
  }

  close() {
    if (this.currentPath) {
      fs.appendFileSync(this.currentPath, '</urlset>\n');
      this.currentPath = null;
    }
    return this.generatedFiles;
  }
}

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function main() {
  if (!fs.existsSync(SITEMAPS_DIR)) {
    fs.mkdirSync(SITEMAPS_DIR, { recursive: true });
  } else {
    for (const name of fs.readdirSync(SITEMAPS_DIR)) {
      if (name.endsWith('.xml')) {
        fs.unlinkSync(path.join(SITEMAPS_DIR, name));
      }
    }
  }

  const writers = {
    core: new SitemapWriter('core'),
    programmatic: new SitemapWriter('programmatic'),
    programmaticAi: new SitemapWriter('programmaticAi', { fileBase: 'sitemap-programmatic-ai' }),
    measurement: new SitemapWriter('measurement'),
    brands: new SitemapWriter('brands'),
    guides: new SitemapWriter('guides'),
  };
  const categories = ['core', 'programmatic', 'programmaticAi', 'measurement', 'brands', 'guides'];

  let total = 0;
  for (const { relPath, mtime } of walkHtml('.')) {
    const category = getCategory(relPath);
    writers[category].addUrl(relPath, mtime);
    total++;
  }

  const allGenerated = [];
  const today = formatLastmod(Date.now());

  for (const cat of categories) {
    const files = writers[cat].close();
    for (const f of files) {
      allGenerated.push({ file: f, lastmod: today });
    }
  }

  const indexPath = path.join(ROOT, 'sitemap.xml');
  const indexStream = fs.createWriteStream(indexPath, { flags: 'w' });
  indexStream.write('<?xml version="1.0" encoding="UTF-8"?>\n');
  indexStream.write('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n');
  for (const { file, lastmod } of allGenerated) {
    const loc = BASE_URL + '/sitemaps/' + file;
    indexStream.write('<sitemap>\n <loc>' + escapeXml(loc) + '</loc>\n <lastmod>' + lastmod + '</lastmod>\n</sitemap>\n\n');
  }
  indexStream.write('</sitemapindex>\n');
  indexStream.end();

  console.log('Generated sitemaps: %d URLs, %d files', total, allGenerated.length);
  for (const { file } of allGenerated) {
    console.log('  - sitemaps/' + file);
  }
  console.log('  - sitemap.xml (index)');
}

main();
