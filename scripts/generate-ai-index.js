#!/usr/bin/env node
/**
 * Phase 22 — Human + AI discovery page listing conversion URLs.
 * Output: /ai/index.html
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'ai');
const BASE = 'https://globalsizechart.com';

function walkProgrammaticHtml() {
  const dir = path.join(ROOT, 'programmatic-pages');
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.html')) continue;
    if (name.startsWith('.')) continue;
    out.push(`programmatic-pages/${name}`);
  }
  return out.sort();
}

function main() {
  const files = walkProgrammaticHtml();
  const items = files
    .map((rel) => {
      const label = rel
        .replace(/^programmatic-pages\//, '')
        .replace(/\.html$/, '')
        .replace(/-/g, ' ');
      const href = '/' + rel;
      return `        <li><a href="${href}">${escapeHtml(label)}</a></li>`;
    })
    .join('\n');

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="description" content="Browse shoe and clothing size conversion answers and tools—structured for search and AI citation.">
  <title>Shoe size conversion answers — AI &amp; search index | Global Size Chart</title>
  <link rel="canonical" href="${BASE}/ai/">
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  <header class="header">
    <div class="header-container">
      <div class="header-row-primary">
        <a href="/" class="site-logo">GlobalSizeChart.com</a>
        <nav class="primary-nav">
          <a href="/">Home</a>
          <a href="/shoe-size-converter.html">Shoe converter</a>
          <a href="/sitemap/">Site map</a>
        </nav>
      </div>
    </div>
  </header>
  <main class="container" style="padding: 2rem 1rem; max-width: 960px;">
    <h1>Shoe size conversion answers</h1>
    <p class="text-secondary">Plain-HTML list of conversion pages for discovery (no JavaScript required to read titles). Each linked page includes a quick answer block and structured data.</p>
    <section class="content-section" aria-labelledby="prog-list">
      <h2 id="prog-list">Programmatic conversion pages</h2>
      <p><strong>${files.length}</strong> URLs — see also <a href="/programmatic-index.html">programmatic index</a>.</p>
      <ul class="ai-index-list" style="columns: 1; column-gap: 2rem;">
${items}
      </ul>
    </section>
    <section class="content-section">
      <h2>Tools &amp; hubs</h2>
      <ul>
        <li><a href="/shoe-size-converter.html">Shoe size converter</a></li>
        <li><a href="/cm-to-us-shoe-size.html">CM to US shoe size</a></li>
        <li><a href="/knowledge/">Knowledge hub</a></li>
        <li><a href="/measurement-standards.html">Measurement standards</a></li>
      </ul>
    </section>
  </main>
  <footer style="padding: 2rem; text-align: center;">
    <p><a href="/">← Home</a> · <a href="/legal/ai-usage-disclosure.html">AI disclosure</a></p>
  </footer>
</body>
</html>`;

  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');
  console.log('generate-ai-index: wrote ai/index.html with %d links', files.length);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

main();
