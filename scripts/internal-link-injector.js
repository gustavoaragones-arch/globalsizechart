#!/usr/bin/env node
/**
 * Injects the canonical "Quick Converters" card block after the main converter card (in-main only).
 * Idempotent: skips if Quick Converters section is already present.
 *
 * Usage: node scripts/internal-link-injector.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { QUICK_CONVERTERS_HTML, mainHasQuickConverters } = require('./lib/quick-converters-snippet');

const ROOT = path.resolve(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components']);

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

function main() {
  const dryRun = process.argv.includes('--dry-run');
  let n = 0;
  for (const rel of walkHtmlFiles('.')) {
    const abs = path.join(ROOT, rel);
    const raw = fs.readFileSync(abs, 'utf8');
    if (!raw.includes('<main')) continue;

    const $ = cheerio.load(raw, { decodeEntities: false });
    const $main = $('main').first();
    if (!$main.length) continue;
    if (mainHasQuickConverters($, $main)) continue;

    const $card = $main.find('section.converter-card').first();
    const $form = $main.find('form#mainConverter, form#shoeConverter').first();
    const $block = $(QUICK_CONVERTERS_HTML);

    if ($card.length) {
      $card.after($block);
    } else if ($form.length) {
      const $sec = $form.closest('section').first();
      if ($sec.length) {
        $sec.after($block);
      } else {
        $form.after($block);
      }
    } else {
      continue;
    }

    const doctype = raw.match(/^<!DOCTYPE[^>]*>\s*/i);
    let next = $.html();
    if (doctype && !/^<!DOCTYPE/i.test(next.trim())) {
      next = doctype[0] + (doctype[0].endsWith('\n') ? '' : '\n') + next;
    }
    if (next === raw) continue;
    n++;
    if (!dryRun) fs.writeFileSync(abs, next, 'utf8');
  }
  console.log('internal-link-injector: %d pages updated%s', n, dryRun ? ' (dry-run)' : '');
}

main();
