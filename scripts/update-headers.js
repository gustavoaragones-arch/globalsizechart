#!/usr/bin/env node
/**
 * Bulk update header structure: site-nav → site-header with primary/secondary nav
 * Preserves all links and URLs.
 */
const fs = require('fs');
const path = require('path');

function walkDir(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
      walkDir(p, files);
    } else if (e.isFile() && e.name.endsWith('.html')) {
      files.push(p);
    }
  }
  return files;
}

const OLD_HEADER = /<header[^>]*class="[^"]*site-nav[^"]*"[^>]*>[\s\S]*?<\/header>/;

function extractLinks(html) {
  const linkMatches = [...html.matchAll(/<li><a href="([^"]+)">([^<]+)<\/a><\/li>/g)];
  return linkMatches.map(([, href, text]) => ({ href, text }));
}

const PRIMARY_TEXTS = ['Home', 'Main Site', 'US Home', 'UK Home', 'EU Home', 'Canada Home', 'Shoe Converter', 'Shoe Sizes', 'Clothing Converter', 'Clothing Sizes', 'Measurement Tools', 'Guides'];

function buildNewHeader(links) {
  const primary = [];
  const secondary = [];
  const primaryOrder = ['Home', 'Main Site', 'US Home', 'UK Home', 'EU Home', 'Canada Home', 'Shoe Converter', 'Shoe Sizes', 'Clothing Converter', 'Clothing Sizes', 'Measurement Tools', 'Guides'];

  for (const key of primaryOrder) {
    const found = links.find((l) =>
      l.text === key || (key === 'Home' && (l.text === 'Main Site' || / Home$/.test(l.text)))
    );
    if (found && !primary.some((p) => p.href === found.href && p.text === found.text)) primary.push(found);
  }
  if (primary.length === 0) primary.push(links[0]);
  for (const l of links) {
    if (!primary.some((p) => p.href === l.href && p.text === l.text)) secondary.push(l);
  }

  const primaryHtml = primary.map((l) => `<a href="${l.href}">${l.text.replace(/&/g, '&amp;')}</a>`).join('\n          ');
  const secondaryHtml = secondary.map((l) => `<a href="${l.href}">${l.text.replace(/&/g, '&amp;')}</a>`).join('\n        ');

  return `<header class="site-header">
    <div class="header-inner">
      <div class="header-top">
        <a href="/" class="site-logo">GlobalSizeChart.com</a>
        <nav class="primary-nav">
          ${primaryHtml}
        </nav>
      </div>
      <nav class="secondary-nav">
        ${secondaryHtml}
      </nav>
    </div>
  </header>`;
}

function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  const match = html.match(OLD_HEADER);
  if (!match) return false;

  const oldHeader = match[0];
  const links = extractLinks(oldHeader);
  if (links.length === 0) return false;

  const newHeader = buildNewHeader(links);
  const newHtml = html.replace(OLD_HEADER, newHeader);
  fs.writeFileSync(filePath, newHtml);
  return true;
}

const root = path.join(__dirname, '..');
const files = walkDir(root);

let updated = 0;
for (const f of files) {
  if (processFile(f)) {
    updated++;
    console.log(path.relative(root, f));
  }
}
console.log(`\nUpdated ${updated} files.`);
