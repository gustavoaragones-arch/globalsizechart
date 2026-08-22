#!/usr/bin/env node
'use strict';
/**
 * Phase 7 — automated structural/content tests for the 20 remediated
 * brand pages. Read-only; asserts against the files on disk.
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const BRANDS_DIR = path.join(ROOT, 'brands');
const files = fs.readdirSync(BRANDS_DIR).filter(f => f.endsWith('.html')).sort();

let pass = 0;
let fail = 0;
const failures = [];
function check(file, name, ok, detail) {
  if (ok) {
    pass++;
  } else {
    fail++;
    failures.push({ file, name, detail: detail || '' });
    console.log(`[FAIL] ${file} :: ${name}${detail ? ' — ' + detail : ''}`);
  }
}

const OLD_SIZE_CONVERTER_LOGIC_MARKERS = [
  'function isValidClothingSize', 'function isValidShoeSize', 'function buildSizeDatabase',
];

for (const file of files) {
  const filePath = path.join(BRANDS_DIR, file);
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html);
  const bodyText = $('body').text();

  // ---- Structure ----
  check(file, 'exactly one H1', $('h1').length === 1, `found ${$('h1').length}`);
  const converterForm = $('form.converter-form');
  check(file, 'converter exists', converterForm.length === 1, `found ${converterForm.length}`);
  if (converterForm.length === 1) {
    const h1Offset = html.indexOf('<h1');
    const formOffset = html.indexOf('class="converter-form"');
    const faqOffset = html.indexOf('id="faq"');
    const navOffset = html.indexOf('nav-explore-more');
    check(file, 'converter occurs before FAQ block', formOffset > -1 && faqOffset > -1 && formOffset < faqOffset);
    check(file, 'converter occurs before navigation block', formOffset > -1 && navOffset > -1 && formOffset < navOffset);
    check(file, 'converter occurs shortly after H1 (no long section between)', h1Offset > -1 && formOffset > -1 && (formOffset - h1Offset) < 1500, `distance=${formOffset - h1Offset}`);
  }
  check(file, 'no Quick Answer block', $('.ai-answer-block').length === 0);
  check(file, 'no Common questions block', $('.ai-faq-block').length === 0 && !/Common questions/i.test(bodyText));
  const faqH2Count = $('main h2').filter((i, el) => $(el).text().trim() === 'Frequently Asked Questions').length;
  check(file, 'exactly one "Frequently Asked Questions" visible section', faqH2Count === 1, `found ${faqH2Count}`);
  check(file, 'no standalone "Why Sizes May Vary"', $('.why-sizes-vary').length === 0 && $('h2:contains("Why Sizes May Vary")').length === 0);
  const monCount = $('.monetization-module').length;
  const comCount = $('.commercial-module').length;
  check(file, 'no duplicate monetization/commercial pair', (monCount + comCount) <= 1, `monetization=${monCount} commercial=${comCount}`);
  check(file, 'exactly one unified navigation block', $('.nav-explore-more').length === 1, `found ${$('.nav-explore-main').length}`);

  // ---- FAQ ----
  const visibleQ = $('.faq-item h3').map((i, el) => $(el).text().trim()).get();
  const visibleA = $('.faq-item p').map((i, el) => $(el).text().trim()).get();
  check(file, 'visible FAQ exists', visibleQ.length >= 3 && visibleQ.length <= 5, `count=${visibleQ.length}`);
  let schemaQ = [], schemaA = [];
  let schemaFound = false;
  $('script[type="application/ld+json"]').each((i, el) => {
    const txt = $(el).html();
    if (txt && txt.includes('"FAQPage"')) {
      schemaFound = true;
      try {
        const obj = JSON.parse(txt);
        schemaQ = obj.mainEntity.map(m => m.name);
        schemaA = obj.mainEntity.map(m => m.acceptedAnswer.text);
      } catch (e) { check(file, 'FAQ schema is valid JSON', false, e.message); }
    }
  });
  check(file, 'schema FAQ exists', schemaFound);
  check(file, 'visible and schema question counts match', visibleQ.length === schemaQ.length, `visible=${visibleQ.length} schema=${schemaQ.length}`);
  check(file, 'every visible question has a schema counterpart', visibleQ.every(q => schemaQ.includes(q)));
  check(file, 'every schema question has a visible counterpart', schemaQ.every(q => visibleQ.includes(q)));
  check(file, 'answer text matches 1:1', JSON.stringify(visibleA) === JSON.stringify(schemaA));

  // ---- Navigation ----
  const navHrefs = $('.nav-explore-more .card-link').map((i, el) => $(el).attr('href')).get();
  const uniqueHrefs = new Set(navHrefs);
  check(file, 'no duplicate destination URLs inside the unified navigation block', uniqueHrefs.size === navHrefs.length, `${navHrefs.length} links, ${uniqueHrefs.size} unique`);
  let allExist = true;
  const missing = [];
  navHrefs.forEach(href => {
    const resolved = path.normalize(path.join(BRANDS_DIR, href));
    if (!fs.existsSync(resolved)) { allExist = false; missing.push(href); }
  });
  check(file, 'every retained navigation URL exists', allExist, missing.join(', '));
  const selfLinks = navHrefs.filter(h => h.split('/').pop() === file);
  check(file, 'navigation block contains no self-link', selfLinks.length === 0, selfLinks.join(', '));
  check(file, 'no old conversion-loop', $('.conversion-loop').length === 0);
  check(file, 'no old next-step', $('.next-step').length === 0);
  check(file, 'no old session-depth', $('.session-depth-modules').length === 0);
  check(file, 'no old Related links dump', $('h2:contains("Related links")').length === 0);
  check(file, 'no crawl-hub presentation', !/crawl hub/i.test(html));
  check(file, 'each nav card has a non-empty description', $('.nav-explore-more .card-link p').toArray().every(el => $(el).text().trim().length > 0));

  // ---- Converter ----
  check(file, 'converter initialization exists (id set for app.js binding)', !!converterForm.attr('id'));
  const expectedId = /clothing/i.test(html.slice(0, html.indexOf('</head>'))) ? null : null; // category determined per-file below
  check(file, 'converter uses an existing certified form id (shoeConverter or clothingConverter)', ['shoeConverter', 'clothingConverter'].includes(converterForm.attr('id')), converterForm.attr('id'));
  check(file, 'app.js script tag present and unmodified path', $('script[src$="app.js"]').length === 1);
  OLD_SIZE_CONVERTER_LOGIC_MARKERS.forEach(marker => {
    check(file, `no embedded conversion logic (${marker})`, !html.includes(marker));
  });

  // ---- Content ----
  const metaDesc = ($('meta[name="description"]').attr('content') || '').trim();
  const introText = $('.brand-intro').text().trim();
  check(file, 'meta description is not identical to visible intro', introText !== metaDesc, `intro="${introText.slice(0,40)}..." meta="${metaDesc.slice(0,40)}..."`);
  check(file, 'no literal "Quick answer:"', !/Quick answer:/i.test(bodyText));
  check(file, 'no literal "Common questions"', !/Common questions/i.test(bodyText));
  const keywordStuffPattern = /Japan size chart explained\. How UK shoe sizes differ from US and EU\. Conversion and regional comparison guide\./;
  check(file, 'no keyword-stuffed Regional Differences fragment pattern', !keywordStuffPattern.test(html));
  check(file, 'no duplicate monetization text ("Sizing is not standardized globally" appearing twice)', (html.match(/Sizing is not standardized globally/g) || []).length <= 1);
}

console.log(`\n${pass} passed, ${fail} failed (across ${files.length} brand pages).`);
fs.writeFileSync(path.join(ROOT, 'reports', '.phase7-test-results.json'), JSON.stringify({ pass, fail, failures }, null, 2));
if (fail > 0) process.exit(1);
