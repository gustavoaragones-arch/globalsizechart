#!/usr/bin/env node
/**
 * Dynamic Sitemap Generator — Phase 21: priority tiers (high / medium / low)
 *
 * Scans HTML files, assigns tier via crawl-priority-map.js, emits:
 *   - changefreq + lastmod (high = today for freshness)
 *   - sitemap-high.xml, sitemap-medium.xml, sitemap-low.xml (+ splits at 50k URLs)
 *   - sitemaps/indexing-feed.xml (URLs touched in last 7 days)
 *   - sitemap/index.html (human + AI navigation)
 *
 * Usage: node scripts/generate-sitemaps.js
 * Deploy: npm run build:sitemaps
 */

const fs = require('fs');
const path = require('path');

const { relPathToUrlPath } = require('./lib/ai-engine-utils');
const {
  getPriorityTier,
  getChangeFreq,
  getLastmodForTier,
  shouldNoindexLongtail,
} = require('./crawl-priority-map');

const ROOT = path.resolve(__dirname, '..');
const SITEMAPS_DIR = path.join(ROOT, 'sitemaps');
const SITEMAP_HTML_DIR = path.join(ROOT, 'sitemap');
const BASE_URL = 'https://globalsizechart.com';
const MAX_URLS_PER_SITEMAP = 50000;
const INDEXING_FEED_DAYS = 7;

const IGNORE_DIRS = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components']);

/** Convert file path to full URL. index.html → directory URL with trailing slash. */
function pathToUrl(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  if (normalized === 'index.html') return `${BASE_URL}/`;
  if (normalized.endsWith('/index.html')) {
    return `${BASE_URL}/${normalized.slice(0, -11)}/`;
  }
  return `${BASE_URL}/${normalized}`;
}

function formatLastmod(mtimeMs) {
  const d = new Date(mtimeMs);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

function* walkHtml(dir, prefix = '') {
  const entries = fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true });
  for (const ent of entries) {
    const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
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
      yield { relPath: rel.replace(/\\/g, '/'), mtime };
    }
  }
}

class SitemapWriter {
  constructor(tier, opts = {}) {
    this.tier = tier;
    this.fileBase = opts.fileBase || `sitemap-${tier}`;
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
    const baseName =
      this.fileIndex === 1
        ? `${this.fileBase}.xml`
        : `${this.fileBase}-${this.fileIndex}.xml`;
    this.currentPath = path.join(SITEMAPS_DIR, baseName);
    this.generatedFiles.push(baseName);
    const header =
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    fs.writeFileSync(this.currentPath, header);
    this.count = 0;
  }

  addUrl(relPath, mtime) {
    if (this.count >= MAX_URLS_PER_SITEMAP || (this.currentPath === null && this.fileIndex === 0)) {
      this._openNext();
    }
    const urlPath = relPathToUrlPath(relPath);
    const tier = getPriorityTier(urlPath);
    if (tier !== this.tier) {
      throw new Error(`SitemapWriter tier mismatch for ${relPath}`);
    }
    const lastmodMs = getLastmodForTier(tier, mtime);
    const url = pathToUrl(relPath);
    const lastmod = formatLastmod(lastmodMs);
    const changefreq = getChangeFreq(tier);
    const line =
      '<url>\n' +
      ' <loc>' +
      escapeXml(url) +
      '</loc>\n' +
      ' <lastmod>' +
      lastmod +
      '</lastmod>\n' +
      ' <changefreq>' +
      changefreq +
      '</changefreq>\n' +
      '</url>\n';
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
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function writeIndexingFeed(entries, nowMs) {
  const cutoff = nowMs - INDEXING_FEED_DAYS * 24 * 60 * 60 * 1000;
  const recent = entries
    .filter((e) => e.mtime >= cutoff)
    .sort((a, b) => b.mtime - a.mtime);
  const outPath = path.join(SITEMAPS_DIR, 'indexing-feed.xml');
  let body =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const { relPath, mtime } of recent) {
    const url = pathToUrl(relPath);
    const lastmod = formatLastmod(mtime);
    body +=
      '<url>\n <loc>' +
      escapeXml(url) +
      '</loc>\n <lastmod>' +
      lastmod +
      '</lastmod>\n <changefreq>daily</changefreq>\n</url>\n';
  }
  body += '</urlset>\n';
  fs.writeFileSync(outPath, body);
  return recent.length;
}

function writeHtmlSitemap(entries, nowMs) {
  if (!fs.existsSync(SITEMAP_HTML_DIR)) {
    fs.mkdirSync(SITEMAP_HTML_DIR, { recursive: true });
  }
  const cutoff = nowMs - INDEXING_FEED_DAYS * 24 * 60 * 60 * 1000;
  const recent = entries
    .filter((e) => e.mtime >= cutoff)
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 80);

  const newPagesLi = recent
    .map((e) => {
      const href = pathToUrl(e.relPath);
      const label = e.relPath.replace(/\.html$/, '').replace(/\//g, ' · ');
      return `          <li><a href="${escapeXml(href)}">${escapeXml(label)}</a> <span class="sitemap-new-date">(${formatLastmod(e.mtime)})</span></li>`;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="description" content="Browse top size conversions, tools, and recently updated pages on Global Size Chart.">
  <title>Site map — Global Size Chart</title>
  <link rel="canonical" href="${BASE_URL}/sitemap/">
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  <header class="header">
    <div class="header-container">
      <div class="header-row-primary">
        <a href="/" class="site-logo">GlobalSizeChart.com</a>
        <nav class="primary-nav">
          <a href="/">Home</a>
          <a href="/shoe-size-converter.html">Shoe Converter</a>
        </nav>
      </div>
    </div>
  </header>
  <main class="container" style="padding: 2rem 1rem; max-width: 900px;">
    <h1>Site map</h1>
    <p class="text-secondary">High-intent hubs and recently updated pages (helps discovery and crawl prioritization).</p>

    <section class="content-section" aria-labelledby="top-conv">
      <h2 id="top-conv">Top conversions</h2>
      <ul class="sitemap-hub-list">
        <li><a href="/shoe-size-converter.html">Shoe size converter</a></li>
        <li><a href="/us-to-eu-size.html">US to EU size</a></li>
        <li><a href="/cm-to-us-shoe-size.html">CM to US shoe size</a></li>
        <li><a href="/uk-to-us-size.html">UK to US size</a></li>
        <li><a href="/clothing-size-converter.html">Clothing size converter</a></li>
      </ul>
    </section>

    <section class="content-section" aria-labelledby="popular-tools">
      <h2 id="popular-tools">Popular size tools</h2>
      <ul class="sitemap-hub-list">
        <li><a href="/shoe-size-conversions/">Shoe size conversions hub</a></li>
        <li><a href="/shoe-size-conversion-chart/">Shoe size conversion chart</a></li>
        <li><a href="/measurement-tools.html">Measurement tools</a></li>
        <li><a href="/knowledge/">Knowledge hub</a></li>
        <li><a href="/guides/">Guides</a></li>
        <li><a href="/brand-sizing-guide.html">Brand sizing guide</a></li>
      </ul>
    </section>

    <section class="content-section" aria-labelledby="new-pages">
      <h2 id="new-pages">New &amp; recently updated (last ${INDEXING_FEED_DAYS} days)</h2>
      <ul class="sitemap-new-list">
${newPagesLi || '          <li><em>No recent file updates in this window (run deploy after changes).</em></li>'}
      </ul>
    </section>

    <section class="content-section">
      <h2>Machine-readable sitemaps</h2>
      <ul>
        <li><a href="/sitemap.xml">Sitemap index</a> (priority tiers: high / medium / low)</li>
        <li><a href="/sitemaps/indexing-feed.xml">Indexing feed</a> (recent URLs)</li>
      </ul>
    </section>
  </main>
  <footer class="footer" style="padding: 2rem; text-align: center;">
    <p><a href="/">← Back to home</a></p>
  </footer>
</body>
</html>
`;
  fs.writeFileSync(path.join(SITEMAP_HTML_DIR, 'index.html'), html, 'utf8');
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

  const entries = [];
  for (const item of walkHtml('.')) {
    entries.push(item);
  }

  const sitemapEntries = entries.filter((e) => !shouldNoindexLongtail(relPathToUrlPath(e.relPath)));

  const writers = {
    high: new SitemapWriter('high', { fileBase: 'sitemap-high' }),
    medium: new SitemapWriter('medium', { fileBase: 'sitemap-medium' }),
    low: new SitemapWriter('low', { fileBase: 'sitemap-low' }),
  };

  const nowMs = Date.now();
  let total = 0;
  for (const { relPath, mtime } of sitemapEntries) {
    const urlPath = relPathToUrlPath(relPath);
    const tier = getPriorityTier(urlPath);
    writers[tier].addUrl(relPath, mtime);
    total++;
  }

  const allGenerated = [];
  const today = formatLastmod(nowMs);

  for (const tier of ['high', 'medium', 'low']) {
    const files = writers[tier].close();
    for (const f of files) {
      allGenerated.push({ file: f, lastmod: today });
    }
  }

  const feedCount = writeIndexingFeed(
    entries.filter((e) => !shouldNoindexLongtail(relPathToUrlPath(e.relPath))),
    nowMs
  );
  allGenerated.push({ file: 'indexing-feed.xml', lastmod: today });

  writeHtmlSitemap(entries, nowMs);

  const indexPath = path.join(ROOT, 'sitemap.xml');
  const indexStream = fs.createWriteStream(indexPath, { flags: 'w' });
  indexStream.write('<?xml version="1.0" encoding="UTF-8"?>\n');
  indexStream.write('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n');
  for (const { file, lastmod } of allGenerated) {
    const loc = `${BASE_URL}/sitemaps/${file}`;
    indexStream.write(
      '<sitemap>\n <loc>' + escapeXml(loc) + '</loc>\n <lastmod>' + lastmod + '</lastmod>\n</sitemap>\n\n'
    );
  }
  indexStream.write('</sitemapindex>\n');
  indexStream.end();

  const excluded = entries.length - sitemapEntries.length;
  console.log(
    'Generated sitemaps: %d URLs, %d sitemap files + indexing-feed + sitemap/index.html (excluded %d noindex long-tail)',
    total,
    allGenerated.length,
    excluded
  );
  for (const { file } of allGenerated) {
    console.log('  - sitemaps/' + file);
  }
  console.log('  - sitemap.xml (index)');
  console.log('  - sitemap/index.html (HTML site map)');
  console.log('  indexing-feed: %d URLs (last %d days)', feedCount, INDEXING_FEED_DAYS);
}

main();
