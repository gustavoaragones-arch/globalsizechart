#!/usr/bin/env node
/**
 * Phase 19 — Programmatic AI-gap pages (conservative)
 * Only creates stubs for patterns that look like numeric conversion queries
 * and have no obvious existing HTML match.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, normalizePattern } = require('./lib/ai-engine-utils');

const PATTERNS_FILE = path.join(ROOT, 'data', 'query-patterns.json');
const OUT_DIR = path.join(ROOT, 'programmatic-pages', 'ai-generated');

const BLOCK =
  /^(about|privacy|terms|contact|disclaimer|agreement|adidas|nike|brand|alternative|guide conversion)/i;
const MUST_CONVERT =
  /(\d+\s*cm|\d+\.\d+\s*cm|cm\s*\d|eu\s*\d{2}|us\s*\d{1,2}(\.\d)?|uk\s*\d|size\s*\d+\s*(cm|to))/i;

function slugify(pattern) {
  return normalizePattern(pattern)
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72) || 'query';
}

function patternAllowed(p) {
  if (BLOCK.test(p)) return false;
  if (!MUST_CONVERT.test(p)) return false;
  if (p.length < 12 || p.length > 100) return false;
  return true;
}

function walkAllHtml() {
  const out = [];
  function w(dir, prefix = '') {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) return;
    for (const ent of fs.readdirSync(full, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
      if (ent.isDirectory()) {
        if (['node_modules', '.git', 'sitemaps', 'components', 'data'].includes(ent.name)) continue;
        w(path.join(dir, ent.name), rel);
      } else if (ent.name.endsWith('.html')) out.push(rel.replace(/\\/g, '/'));
    }
  }
  w('.');
  return out;
}

function pageExistsForPattern(allFiles, slug) {
  const compact = slug.replace(/-/g, '');
  for (const f of allFiles) {
    const base = f.replace(/\.html$/i, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (base.includes(compact.slice(0, 16))) return true;
  }
  return false;
}

function buildPage(slug, pattern) {
  const title = pattern.slice(0, 1).toUpperCase() + pattern.slice(1);
  const canonical = `https://globalsizechart.com/programmatic-pages/ai-generated/${slug}.html`;
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    author: { '@type': 'Person', name: 'Albor Digital Team' },
    publisher: { '@type': 'Organization', name: 'Global Size Chart', url: 'https://globalsizechart.com' },
    datePublished: '2026-01-01',
    dateModified: new Date().toISOString().slice(0, 10),
    url: canonical,
  };
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How do I use this ${title} reference?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Measure foot length in centimeters and use the shoe size converter, or open a dedicated region pair page from the programmatic index.',
        },
      },
    ],
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="description" content="${title} — length-based reference. Use the main converter for exact mapping.">
  <link rel="canonical" href="${canonical}">
  <title>${title} | Global Size Chart</title>
  <link rel="stylesheet" href="../../styles.css">
  <script type="application/ld+json">${JSON.stringify(article)}</script>
  <script type="application/ld+json">${JSON.stringify(faq)}</script>
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <div class="header-top">
        <a href="/" class="site-logo">GlobalSizeChart.com</a>
        <nav class="primary-nav">
          <a href="../../index.html">Home</a>
          <a href="../../shoe-size-converter.html">Shoe Converter</a>
          <a href="../../knowledge/">Knowledge</a>
        </nav>
      </div>
    </div>
  </header>
  <main>
    <div class="container">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="../../">Home</a> &gt; <span>Query match</span></nav>
      <h1>${title}</h1>
      <section class="ai-answer content-section" data-ai-generated-page="true">
        <h2>Quick Answer</h2>
        <p>Use our <a href="../../shoe-size-converter.html">shoe size converter</a> with CM or regional input for the closest match.</p>
      </section>
      <section class="content-section">
        <h2>Conversion table</h2>
        <p>For full tables see the <a href="../../shoe-size-conversion-chart/">international shoe size conversion chart</a>.</p>
      </section>
      <section class="faq-block content-section">
        <h2>FAQs</h2>
        <div class="faq-item">
          <h3>Is this a substitute for a brand chart?</h3>
          <p>No—always confirm with the brand when possible.</p>
        </div>
      </section>
      <p><a href="../../programmatic-index.html">Browse all conversion pages</a></p>
    </div>
  </main>
  <footer><div class="container"><p>&copy; 2026 Albor Digital LLC. GlobalSizeChart.com.</p></div></footer>
  <script src="../../app.js"></script>
</body>
</html>`;
}

function main() {
  if (!fs.existsSync(PATTERNS_FILE)) {
    console.error('generate-ai-pages: run extract-query-patterns.js first');
    process.exit(1);
  }
  const { patterns = [] } = JSON.parse(fs.readFileSync(PATTERNS_FILE, 'utf8'));
  const allFiles = walkAllHtml();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let created = 0;
  const maxNew = parseInt(process.env.MAX_AI_GAP_PAGES || '8', 10);
  const seen = new Set();

  for (const pattern of patterns) {
    if (created >= maxNew) break;
    if (!patternAllowed(pattern)) continue;
    const slug = slugify(pattern);
    if (!slug || slug === 'query') continue;
    if (seen.has(slug)) continue;
    seen.add(slug);
    if (pageExistsForPattern(allFiles, slug)) continue;

    const filePath = path.join(OUT_DIR, `${slug}.html`);
    if (fs.existsSync(filePath)) continue;

    fs.writeFileSync(filePath, buildPage(slug, pattern), 'utf8');
    allFiles.push(`programmatic-pages/ai-generated/${slug}.html`);
    created++;
  }

  console.log('generate-ai-pages: created %d stub(s) (MAX_AI_GAP_PAGES=%s)', created, maxNew);
}

main();
