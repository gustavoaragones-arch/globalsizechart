#!/usr/bin/env node
/**
 * Phase 22 — Add aria-label / title to inline SVGs so assistive tech & AI text pipelines get context.
 * Skips SVGs that already have aria-label, aria-labelledby, or <title>.
 *
 * Usage: node scripts/svg-accessibility.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components']);

const DEFAULT_LABEL =
  'Diagram showing foot length and measurement reference for shoe size conversion';

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

function patchSvgTags(html) {
  return html.replace(/<svg\b([^>]*)>/gi, (full, attrs) => {
    if (/\baria-label\s*=/.test(attrs)) return full;
    if (/\baria-labelledby\s*=/.test(attrs)) return full;
    const role = /\brole\s*=/.test(attrs) ? '' : ' role="img"';
    return `<svg${attrs}${role} aria-label="${DEFAULT_LABEL}">`;
  });
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  let n = 0;
  for (const rel of walkHtmlFiles('.')) {
    const abs = path.join(ROOT, rel);
    let html = fs.readFileSync(abs, 'utf8');
    if (!html.includes('<svg')) continue;
    const next = patchSvgTags(html);
    if (next === html) continue;
    if (!dryRun) fs.writeFileSync(abs, next, 'utf8');
    n++;
  }
  console.log('svg-accessibility: %d files updated%s', n, dryRun ? ' (dry-run)' : '');
}

main();
