#!/usr/bin/env node
/**
 * Dedupe legacy nav + AI blocks, reorder <main> for conversion UX.
 * Run: node scripts/fix-ai-layout.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { QUICK_CONVERTERS_HTML, mainHasQuickConverters } = require('./lib/quick-converters-snippet');

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

function stripAfterFooter(html) {
  return html.replace(/<\/footer>\s*([\s\S]*?)(<\/body>)/i, (_, between, bodyClose) => {
    const scripts = [...between.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map((m) => m[0]).join('\n\n  ');
    return `</footer>\n\n  ${scripts}${scripts ? '\n' : ''}${bodyClose}`;
  });
}

function removeDuplicateAeoQuickAnswer($) {
  $('section.ai-answer').each((_, el) => {
    const $s = $(el);
    if ($s.closest('.ai-answer-block').length) return;
    const h2 = $s.find('h2[id]').first();
    const id = h2.attr('id') || '';
    const aria = $s.attr('aria-labelledby') || '';
    if (id === 'aeo-qa-h2' || aria === 'aeo-qa-h2' || id === 'home-quick-answer' || aria === 'home-quick-answer') {
      $s.remove();
      return;
    }
    if ($s.closest('.aeo-ai-layer').length) {
      const h2t = ($s.find('h2').first().text() || '').trim();
      if (/^quick answer$/i.test(h2t)) {
        $s.remove();
      }
    }
  });
}

function fixDocument(content, rel) {
  const doctype = content.match(/^<!DOCTYPE[^>]*>\s*/i);
  const $ = cheerio.load(content, { decodeEntities: false });
  const $main = $('main').first();
  if (!$main.length) return content;

  $('section.author-box').remove();

  $('section.crawl-priority-links').remove();
  $('section.related-size-grid').remove();

  const $quickDup = $main.find('section.card').filter((_, el) => $(el).find('> h2').first().text().trim() === 'Quick Converters');
  if ($quickDup.length > 1) {
    $quickDup.slice(1).remove();
  }

  $main.find('[data-ai-answer-block]').slice(1).remove();
  $main.find('[data-ai-faq-block]').slice(1).remove();

  const $ans = $main.find('section.ai-answer-block').first();
  const $h1Card = $main.find('section.converter-card h1').first();
  const $h1Hero = $main.find('section.hero h1').first();

  if ($h1Card.length && $ans.length && !$h1Card.next().is($ans)) {
    $ans.insertAfter($h1Card);
  } else if (!$h1Card.length && $h1Hero.length && $ans.length && !$h1Hero.next().is($ans)) {
    $ans.insertAfter($h1Hero);
  }

  const $hero = $main.find('section.hero').first();
  const $adTop = $main.children('div.ad-container').first();
  const hasMainConverter = $main.find('form#mainConverter').length > 0;

  if ($hero.length && $adTop.length && hasMainConverter) {
    const $toolWrap = $hero.next('div.container').filter((_, el) => $(el).find('> section.converter-card').length > 0);
    if ($toolWrap.length && $toolWrap.next()[0] === $adTop[0]) {
      $toolWrap.insertAfter($adTop);
    }
  }

  const hasTool =
    $main.find('section.converter-card').length > 0 ||
    $main.find('form#shoeConverter').length > 0 ||
    $main.find('form#mainConverter').length > 0;

  const $card = $main.find('section.converter-card').first();
  if (hasTool && !mainHasQuickConverters($, $main)) {
    const $quick = $(QUICK_CONVERTERS_HTML);
    if ($card.length) {
      $card.after($quick);
    } else {
      const $formSec = $main.find('form#mainConverter, form#shoeConverter').closest('section').first();
      if ($formSec.length) {
        $formSec.after($quick);
      }
    }
  }

  const $faq = $main.find('section.ai-faq-block').first();
  const $ds = $main.find('section.data-sources').first();
  if ($faq.length && $ds.length) {
    $faq.insertBefore($ds);
  }

  function loose(sel) {
    return $main
      .find(sel)
      .filter((_, el) => !$(el).closest('.aeo-ai-layer').length)
      .first();
  }
  if ($ds.length) {
    const $seeMove = loose('section.aeo-see-also');
    if ($seeMove.length) {
      $seeMove.insertAfter($ds);
    }
  }

  removeDuplicateAeoQuickAnswer($);

  let out = $.html();
  if (doctype && !/^<!DOCTYPE/i.test(out.trim())) {
    out = doctype[0] + (doctype[0].endsWith('\n') ? '' : '\n') + out;
  }
  return stripAfterFooter(out);
}

function main() {
  const dry = process.argv.includes('--dry-run');
  let n = 0;
  for (const rel of walkHtmlFiles('.')) {
    const abs = path.join(ROOT, rel);
    const raw = fs.readFileSync(abs, 'utf8');
    if (!raw.includes('<main')) continue;
    const next = fixDocument(raw, rel);
    if (next === raw) continue;
    n++;
    if (!dry) fs.writeFileSync(abs, next, 'utf8');
  }
  console.log('fix-ai-layout: %d files %s', n, dry ? 'would update (dry-run)' : 'updated');
}

main();
