#!/usr/bin/env node
/**
 * One-time / maintenance: add Article JSON-LD with Albor Digital Team author
 * to <head> when missing (checks only the head section, not body).
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function walk(dir, prefix = '', out = []) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return out;
  for (const ent of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
    if (ent.isDirectory()) {
      if (['node_modules', '.git', 'scripts', 'sitemaps', 'components'].includes(ent.name)) continue;
      walk(path.join(dir, ent.name), rel, out);
    } else if (ent.name.endsWith('.html')) out.push(rel);
  }
  return out;
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m
    ? m[1].replace(/\s*\|\s*GlobalSizeChart\.com.*$/i, '').trim()
    : 'Global Size Chart';
}

function extractCanonical(html) {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return m ? m[1] : null;
}

function formatDate(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function main() {
  let n = 0;
  for (const rel of walk('.')) {
    const full = path.join(ROOT, rel);
    let html = fs.readFileSync(full, 'utf8');
    const parts = html.split(/<\/head>/i);
    if (parts.length < 2) continue;
    const headPart = parts[0];
    if (/Albor Digital Team/.test(headPart)) continue;
    if (/"@type"\s*:\s*"Article"/.test(headPart)) continue;
    const title = extractTitle(html);
    const canonical = extractCanonical(html);
    const pageUrl = canonical || `https://globalsizechart.com/${rel.replace(/\\/g, '/')}`;
    const dateModified = formatDate(fs.statSync(full).mtimeMs);
    const article = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      author: { '@type': 'Person', name: 'Albor Digital Team' },
      publisher: { '@type': 'Organization', name: 'Global Size Chart', url: 'https://globalsizechart.com' },
      datePublished: '2026-01-01',
      dateModified,
      url: pageUrl,
    };
    const script = `  <script type="application/ld+json">${JSON.stringify(article)}</script>\n`;
    const tail = parts.slice(1).join('</head>');
    html = `${headPart}${script}</head>${tail}`;
    fs.writeFileSync(full, html, 'utf8');
    n++;
  }
  console.log('Patched Article in head for %d files', n);
}

main();
