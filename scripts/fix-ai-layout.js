#!/usr/bin/env node
/**
 * Dedupe crawl + AI blocks, reorder <main> for conversion UX.
 * Run: node scripts/fix-ai-layout.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

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

const TARGETS = [
  { path: '/shoe-size-converter.html', label: 'Shoe Size Converter' },
  { path: '/us-to-eu-size.html', label: 'US to EU Size' },
  { path: '/cm-to-us-shoe-size.html', label: 'CM to US Shoe Size' },
  { path: '/shoe-size-conversions/', label: 'Shoe size conversions' },
];

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

function buildPopularSection(rel) {
  const items = TARGETS.map((t) => `    <li><a href="${hrefTo(rel, t.path)}">${t.label}</a></li>`).join('\n');
  return `<section class="crawl-priority-links crawl-priority-links--content" data-crawl-priority-links="content" aria-label="Popular conversions">
    <h2>Popular conversions</h2>
    <ul>
${items}
    </ul>
  </section>`;
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

  const $card = $main.find('section.converter-card').first();
  if ($card.length && !$main.find('[data-crawl-priority-links="content"]').length) {
    $card.after(buildPopularSection(rel));
  } else if (!$card.length) {
    const $formSec = $main.find('form#mainConverter').closest('section').first();
    if ($formSec.length && !$main.find('[data-crawl-priority-links="content"]').length) {
      $formSec.after(buildPopularSection(rel));
    }
  }

  const $heroInner = $hero.find('> .container').first();
  const $popBlock = $main.find('[data-crawl-priority-links="content"]').first();
  if ($heroInner.length && $popBlock.length) {
    let $anchor = $popBlock;
    $heroInner.children('p').each((_, p) => {
      const $p = $(p);
      $p.insertAfter($anchor);
      $anchor = $p;
    });
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
