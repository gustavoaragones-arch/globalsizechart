#!/usr/bin/env node
/**
 * Phase 21 — Optional noindex for ultra-long-tail URLs to preserve crawl budget.
 * Condition (URL path): includes "kids" AND "cm-" (case-insensitive).
 *
 * Injects: <meta name="robots" content="noindex, follow" data-noindex-longtail="1">
 * Skips if data-noindex-longtail or existing noindex already present.
 *
 * Usage: node scripts/inject-noindex-longtail.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { relPathToUrlPath } = require('./lib/ai-engine-utils');
const { shouldNoindexLongtail } = require('./crawl-priority-map');

const ROOT = path.resolve(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components']);

const META =
  '  <meta name="robots" content="noindex, follow" data-noindex-longtail="1">';

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

function injectAfterViewport(html) {
  const re = /(<meta\s+name=["']viewport["'][^>]*>)/i;
  if (re.test(html)) {
    return html.replace(re, `$1\n${META}`);
  }
  const head = /(<head[^>]*>)/i;
  if (head.test(html)) {
    return html.replace(head, `$1\n${META}`);
  }
  return html;
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  let n = 0;
  for (const rel of walkHtmlFiles('.')) {
    const urlPath = relPathToUrlPath(rel);
    if (!shouldNoindexLongtail(urlPath)) continue;

    const abs = path.join(ROOT, rel);
    let html = fs.readFileSync(abs, 'utf8');
    if (html.includes('data-noindex-longtail')) continue;
    if (/<meta\s+name=["']robots["'][^>]*noindex/i.test(html)) continue;

    html = injectAfterViewport(html);
    if (!html.includes('data-noindex-longtail')) continue;

    if (!dryRun) fs.writeFileSync(abs, html, 'utf8');
    n++;
  }
  console.log('inject-noindex-longtail: %d pages updated%s', n, dryRun ? ' (dry-run)' : '');
}

main();
