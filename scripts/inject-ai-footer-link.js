#!/usr/bin/env node
/**
 * Phase 23 — Add "All Size Conversion Answers" link to footer Hubs section.
 * Idempotent: skips if data-footer-ai-index is present.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components', 'authority/generated']);

function walkHtmlFiles(dir = '.', prefix = '') {
  const out = [];
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return out;
  for (const ent of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
    if (ent.isDirectory()) {
      if (IGNORE_DIRS.has(ent.name)) continue;
      out.push(...walkHtmlFiles(path.join(dir, ent.name), rel));
    } else if (ent.isFile() && ent.name.endsWith('.html')) {
      out.push(rel.replace(/\\/g, '/'));
    }
  }
  return out;
}

function aiHref(rel) {
  const depth = rel.split('/').length - 1;
  if (depth <= 0) return 'ai/';
  return `${'../'.repeat(depth)}ai/`;
}

function main() {
  const dry = process.argv.includes('--dry-run');
  let n = 0;
  for (const rel of walkHtmlFiles('.')) {
    const abs = path.join(ROOT, rel);
    let html = fs.readFileSync(abs, 'utf8');
    if (html.includes('data-footer-ai-index')) continue;
    if (!html.includes('footer-section')) continue;

    const href = aiHref(rel);
    const li = `<li><a href="${href}" data-footer-ai-index="1">All size conversion answers</a></li>`;

    const reHubs = /(<h3[^>]*>\s*Hubs\s*<\/h3>\s*<ul>)/i;
    const reConv = /(<h3[^>]*>\s*Converters\s*<\/h3>\s*<ul>)/i;
    let replaced = false;
    if (reHubs.test(html)) {
      html = html.replace(reHubs, `$1\n            ${li}`);
      replaced = true;
    } else if (reConv.test(html)) {
      html = html.replace(reConv, `$1\n            ${li}`);
      replaced = true;
    }
    if (!replaced) continue;
    if (!dry) fs.writeFileSync(abs, html, 'utf8');
    n++;
  }
  console.log('inject-ai-footer-link: %d pages updated%s', n, dry ? ' (dry-run)' : '');
}

main();
