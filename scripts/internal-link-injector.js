#!/usr/bin/env node
/**
 * Crawl priority: one "Popular conversions" block after the converter card (in-main only).
 * Idempotent via data-crawl-priority-links="content".
 *
 * Usage: node scripts/internal-link-injector.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.resolve(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components']);

const TARGETS = [
  { path: '/shoe-size-converter.html', label: 'Shoe Size Converter' },
  { path: '/us-to-eu-size.html', label: 'US to EU Size' },
  { path: '/cm-to-us-shoe-size.html', label: 'CM to US Shoe Size' },
  { path: '/shoe-size-conversions/', label: 'Shoe size conversions' },
];

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

function hrefTo(fromRel, toUrlPath) {
  const fromDir = path.dirname(path.join(ROOT, fromRel));
  let toFull;
  if (toUrlPath.endsWith('/')) {
    const seg = toUrlPath.replace(/^\//, '').replace(/\/$/, '');
    toFull = path.join(ROOT, seg, 'index.html');
  } else {
    toFull = path.join(ROOT, toUrlPath.replace(/^\//, ''));
  }
  if (!fs.existsSync(toFull)) {
    return toUrlPath.startsWith('/') ? `.${toUrlPath}` : toUrlPath;
  }
  let r = path.relative(fromDir, toFull);
  r = r.replace(/\\/g, '/');
  if (!r.startsWith('.')) r = `./${r}`;
  return r;
}

function buildContentBlock(rel) {
  const hrefs = TARGETS.map((t) => ({ ...t, href: hrefTo(rel, t.path) }));
  const items = hrefs.map((t) => `    <li><a href="${t.href}">${t.label}</a></li>`).join('\n');
  return `<section class="crawl-priority-links crawl-priority-links--content" data-crawl-priority-links="content" aria-label="Popular conversions">
    <h2>Popular conversions</h2>
    <ul>
${items}
    </ul>
  </section>`;
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  let n = 0;
  for (const rel of walkHtmlFiles('.')) {
    const abs = path.join(ROOT, rel);
    const raw = fs.readFileSync(abs, 'utf8');
    if (!raw.includes('<main')) continue;
    if (raw.includes('data-crawl-priority-links="content"')) continue;

    const $ = cheerio.load(raw, { decodeEntities: false });
    const $main = $('main').first();
    if (!$main.length) continue;

    const $card = $main.find('section.converter-card').first();
    const $form = $main.find('form#mainConverter').first();
    const $block = $(buildContentBlock(rel));

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

    const next = $.html();
    if (next === raw) continue;
    n++;
    if (!dryRun) fs.writeFileSync(abs, next, 'utf8');
  }
  console.log('internal-link-injector: %d pages updated%s', n, dryRun ? ' (dry-run)' : '');
}

main();
