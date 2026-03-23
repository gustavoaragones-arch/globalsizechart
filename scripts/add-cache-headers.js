#!/usr/bin/env node
/**
 * Injects browser cache hint into static HTML:
 * <meta http-equiv="Cache-Control" content="public, max-age=86400">
 *
 * Idempotent: skips files that already contain data-cache-meta="1" or matching meta.
 * Skips: node_modules, .git, scripts, sitemaps, components.
 *
 * Usage: node scripts/add-cache-headers.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components']);

const META_LINE =
  '  <meta http-equiv="Cache-Control" content="public, max-age=86400" data-cache-meta="1">';

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

function hasCacheMeta(html) {
  if (/data-cache-meta=["']1["']/.test(html)) return true;
  if (/http-equiv=["']Cache-Control["'][^>]*max-age=86400/i.test(html)) return true;
  return false;
}

function injectAfterViewport(html) {
  // Prefer after viewport meta for consistent head order
  const re = /(<meta\s+name=["']viewport["'][^>]*>)/i;
  if (re.test(html)) {
    return html.replace(re, `$1\n${META_LINE}`);
  }
  const charset = /(<meta\s+charset=["'][^"']*["']\s*>)/i;
  if (charset.test(html)) {
    return html.replace(charset, `$1\n${META_LINE}`);
  }
  const headOpen = /(<head[^>]*>)/i;
  if (headOpen.test(html)) {
    return html.replace(headOpen, `$1\n${META_LINE}`);
  }
  return html;
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const files = walkHtmlFiles();
  let updated = 0;
  let skipped = 0;

  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    let html = fs.readFileSync(abs, 'utf8');
    if (hasCacheMeta(html)) {
      skipped++;
      continue;
    }
    const next = injectAfterViewport(html);
    if (next === html) {
      skipped++;
      continue;
    }
    if (!dryRun) fs.writeFileSync(abs, next, 'utf8');
    updated++;
  }

  console.log(
    `add-cache-headers: ${updated} updated, ${skipped} skipped, ${files.length} total` +
      (dryRun ? ' (dry-run)' : '')
  );
}

main();
