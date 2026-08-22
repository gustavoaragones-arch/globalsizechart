#!/usr/bin/env node
'use strict';
/**
 * Phase 8 — automated structural/content tests for the homepage and the
 * shoe conversion hub. Read-only; asserts against the files on disk.
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const PAGES = [
  { file: path.join(ROOT, 'index.html'), label: 'homepage' },
  { file: path.join(ROOT, 'shoe-size-conversion-chart', 'index.html'), label: 'shoe-hub' },
];

let pass = 0, fail = 0;
const failures = [];
function check(label, name, ok, detail) {
  if (ok) { pass++; }
  else { fail++; failures.push({ label, name, detail: detail || '' }); console.log(`[FAIL] ${label} :: ${name}${detail ? ' — ' + detail : ''}`); }
}

for (const { file, label } of PAGES) {
  const html = fs.readFileSync(file, 'utf8');
  const $ = cheerio.load(html);
  const bodyText = $('body').text();
  const mainText = $('main').text();

  // ---- Structure ----
  check(label, 'exactly one H1', $('h1').length === 1, `found ${$('h1').length}`);
  const lead = $('.hero-tool .lead').first().text().trim();
  check(label, 'human intro exists', lead.length > 30, `len=${lead.length}`);
  const converterForm = $('form.converter-form');
  check(label, 'converter exists', converterForm.length === 1, `found ${converterForm.length}`);
  const h1Offset = html.indexOf('<h1');
  const formOffset = html.indexOf('class="converter-form"');
  check(label, 'converter follows intro (H1 -> intro -> converter, no long gap)', h1Offset > -1 && formOffset > -1 && (formOffset - h1Offset) < 900, `distance=${formOffset - h1Offset}`);
  check(label, 'no navigation between intro and converter', !/card-link|nav-primary/.test(html.slice(h1Offset, formOffset)));
  check(label, 'no ad between H1 and converter', !/ad-container|ad-slot/.test(html.slice(h1Offset, formOffset)));

  check(label, 'no Quick Answer', !/Quick answer/i.test(bodyText));
  check(label, 'no Common questions', !/Common questions/i.test(bodyText));

  const faqH2Count = $('main h2').filter((i, el) => $(el).text().trim() === 'Frequently Asked Questions').length;
  check(label, 'exactly one FAQ', faqH2Count === 1, `found ${faqH2Count}`);

  const visibleQ = $('.faq-item h3').map((i, el) => $(el).text().trim()).get();
  const visibleA = $('.faq-item p').map((i, el) => $(el).text().trim()).get();
  let schemaQ = [], schemaA = [];
  $('script[type="application/ld+json"]').each((i, el) => {
    const txt = $(el).html();
    if (txt && txt.includes('"FAQPage"')) {
      try { const obj = JSON.parse(txt); schemaQ = obj.mainEntity.map(m => m.name); schemaA = obj.mainEntity.map(m => m.acceptedAnswer.text); } catch (e) {}
    }
  });
  check(label, 'visible/schema FAQ question count matches', visibleQ.length === schemaQ.length, `visible=${visibleQ.length} schema=${schemaQ.length}`);
  check(label, 'visible/schema FAQ exact match (Q&A)', JSON.stringify(visibleQ) === JSON.stringify(schemaQ) && JSON.stringify(visibleA) === JSON.stringify(schemaA));
  check(label, 'FAQ has 3-5 questions', visibleQ.length >= 3 && visibleQ.length <= 5, `count=${visibleQ.length}`);

  check(label, 'no standalone thin "Why Sizes May Vary"', !/Why Sizes May Vary/i.test(mainText));
  const whyH2 = $('main h2').filter((i, el) => /why/i.test($(el).text())).map((i, el) => $(el).text().trim()).get();
  check(label, 'exactly one "why sizes" explanation heading', whyH2.length === 1, JSON.stringify(whyH2));

  check(label, 'master footer present', $('footer').length === 1);

  // ---- Navigation duplication ----
  const mainLinks = [];
  $('.card-link, .card-grid a, .nav-explore-more a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && !href.startsWith('#')) mainLinks.push(href);
  });
  // check per navigation block for duplicates, not the whole page (prose links may legitimately repeat)
  $('section').each((i, sectionEl) => {
    const hrefs = $(sectionEl).find('> .grid .card-link, > .card-grid > a').map((j, el) => $(el).attr('href')).get();
    if (hrefs.length > 1) {
      const unique = new Set(hrefs);
      check(label, `no duplicate destination inside navigation block (${$(sectionEl).find('> h2').first().text().trim() || 'unnamed'})`, unique.size === hrefs.length, `${hrefs.length} links, ${unique.size} unique`);
    }
  });

  if (label === 'homepage') {
    check(label, 'See Also not present at all (removed above converter)', !/See also/i.test(mainText));
  }

  if (label === 'shoe-hub') {
    const genderCards = $('h2:contains("Men\'s, Women\'s")').first().closest('section').find('.card-link');
    check(label, "Men's/Women's/Kids' cards exist", genderCards.length === 3, `found ${genderCards.length}`);
    let equalHierarchy = true;
    genderCards.each((i, el) => {
      if ($(el).find('h3').length !== 1 || $(el).find('p').length !== 1) equalHierarchy = false;
    });
    check(label, 'three gender cards have equal hierarchy (h3+p each)', equalHierarchy);
    const genderHrefs = genderCards.map((i, el) => $(el).attr('href')).get();
    check(label, 'no duplicate gender navigation destinations', new Set(genderHrefs).size === genderHrefs.length);
    check(label, 'no old "Crawl hub" bare cards', !/crawl hub/i.test(html));
    check(label, 'no redundant Quick Converters grid duplicating the on-page tool', $('h2:contains("Quick Converters")').length === 0);
  }
}

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
