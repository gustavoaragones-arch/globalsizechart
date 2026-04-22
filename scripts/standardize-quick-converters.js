#!/usr/bin/env node
/**
 * Remove legacy crawl-priority + related-size-grid blocks; ensure one canonical
 * Quick Converters card section after the main converter tool (when a tool exists).
 *
 * Usage: node scripts/standardize-quick-converters.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { QUICK_CONVERTERS_HTML, mainHasQuickConverters } = require('./lib/quick-converters-snippet');

const ROOT = path.resolve(__dirname, '..');
const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'scripts',
  'sitemaps',
  'components',
  'authority/generated',
  'programmatic/templates'
]);

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

function saveWithDoctype(raw, $) {
  const doctype = raw.match(/^<!DOCTYPE[^>]*>\s*/i);
  let out = $.html();
  if (doctype && !/^<!DOCTYPE/i.test(out.trim())) {
    out = doctype[0] + (doctype[0].endsWith('\n') ? '' : '\n') + out;
  }
  return out;
}

function processHtml(raw) {
  if (!raw.includes('<main')) return raw;
  const $ = cheerio.load(raw, { decodeEntities: false });
  const $main = $('main').first();
  if (!$main.length) return raw;

  $('section.crawl-priority-links').remove();
  $('section.related-size-grid').remove();

  const $quickAll = $main.find('section.card').filter((_, el) => $(el).find('> h2').first().text().trim() === 'Quick Converters');
  if ($quickAll.length > 1) {
    $quickAll.slice(1).remove();
  }

  const hasTool =
    $main.find('section.converter-card').length > 0 ||
    $main.find('form#shoeConverter').length > 0 ||
    $main.find('form#mainConverter').length > 0;

  if (hasTool && !mainHasQuickConverters($, $main)) {
    const $card = $main.find('section.converter-card').first();
    const $quick = $(QUICK_CONVERTERS_HTML);
    if ($card.length) {
      $card.after($quick);
    } else {
      const $form = $main.find('form#shoeConverter, form#mainConverter').first();
      const $sec = $form.closest('section').first();
      if ($sec.length) $sec.after($quick);
      else if ($form.length) $form.after($quick);
    }
  }

  return saveWithDoctype(raw, $);
}

function main() {
  const dry = process.argv.includes('--dry-run');
  let n = 0;
  for (const rel of walkHtmlFiles('.')) {
    const abs = path.join(ROOT, rel);
    const raw = fs.readFileSync(abs, 'utf8');
    const next = processHtml(raw);
    if (next === raw) continue;
    n++;
    if (!dry) fs.writeFileSync(abs, next, 'utf8');
  }
  console.log('standardize-quick-converters: %d files %s', n, dry ? 'would update (dry-run)' : 'updated');
}

main();
