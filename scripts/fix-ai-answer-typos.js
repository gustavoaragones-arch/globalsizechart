#!/usr/bin/env node
/** One-off / maintenance: fix Quick answer typos from early Phase 22 parse. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const IGNORE = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components']);

function walk(dir, prefix = '') {
  const out = [];
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return out;
  for (const ent of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
    if (ent.isDirectory()) {
      if (IGNORE.has(ent.name)) continue;
      out.push(...walk(path.join(dir, ent.name), rel));
    } else if (ent.isFile() && ent.name.endsWith('.html')) {
      out.push(rel.replace(/\\/g, '/'));
    }
  }
  return out;
}

function fix(html) {
  return html
    .replace(/(\d+(?:\.\d+)?)\.\.(\s+Typical)/g, '$1.$2')
    .replace(/<p>A EU /g, '<p>An EU ');
}

let n = 0;
for (const rel of walk('.')) {
  const abs = path.join(ROOT, rel);
  let h = fs.readFileSync(abs, 'utf8');
  if (!h.includes('data-ai-answer-block')) continue;
  const next = fix(h);
  if (next !== h) {
    fs.writeFileSync(abs, next, 'utf8');
    n++;
  }
}
console.log('fix-ai-answer-typos: %d files fixed', n);
