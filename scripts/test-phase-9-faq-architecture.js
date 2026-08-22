#!/usr/bin/env node
'use strict';
/**
 * Phase 9 — site-wide FAQ architecture validator.
 * Scans the full page population and verifies the consolidated
 * single-source FAQ architecture holds everywhere.
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components', 'build', 'reports', 'docs', 'authority/generated']);

function walk(dir, prefix, out) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return;
  for (const ent of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
    if (ent.isDirectory()) {
      if (IGNORE_DIRS.has(ent.name)) continue;
      walk(path.join(dir, ent.name), rel, out);
    } else if (ent.isFile() && ent.name.endsWith('.html')) {
      out.push(rel.replace(/\\/g, '/'));
    }
  }
}

let pass = 0, fail = 0;
const failures = [];
function check(file, name, ok, detail) {
  if (ok) { pass++; }
  else { fail++; failures.push({ file, name, detail: detail || '' }); }
}

const files = [];
walk('.', '', files);

let dupVisibleFaq = 0, commonQuestions = 0, aiFaqNonCanonical = 0, aeoFaqDup = 0;
let countMismatch = 0, questionMismatch = 0, answerMismatch = 0, schemaOnly = 0, visibleOnly = 0;
let quickAnswerOrphans = 0, moreQuestionsFound = 0;

for (const relPath of files) {
  const abs = path.join(ROOT, relPath);
  const html = fs.readFileSync(abs, 'utf8');
  if (!html.includes('<body')) continue;
  const $ = cheerio.load(html);
  const bodyText = $('body').text();

  // 1. zero duplicate visible FAQ surfaces
  const faqSections = [];
  $('section, div.aeo-ai-layer').each((i, el) => {
    const $s = $(el);
    const h2 = $s.find('> h2').first().text().trim();
    const items = $s.find('.faq-item');
    if (h2 && items.length && $s.find('> h2').length) faqSections.push(h2);
  });
  const dup = faqSections.length > 1;
  if (dup) dupVisibleFaq++;
  check(relPath, 'zero duplicate visible FAQ surfaces', !dup, JSON.stringify(faqSections));

  // 2. zero Common questions blocks
  const hasCommon = /Common questions/i.test(bodyText) || $('[data-ai-faq-block]').length > 0;
  if (hasCommon) commonQuestions++;
  check(relPath, 'zero Common questions blocks', !hasCommon);

  // 3. zero non-canonical AI FAQ blocks
  const hasAiFaq = $('.ai-faq-block').length > 0;
  if (hasAiFaq) aiFaqNonCanonical++;
  check(relPath, 'zero AI FAQ blocks', !hasAiFaq);

  // 4. zero AEO FAQ duplicates (aeo-ai-layer's own faq-block should be the ONLY one, i.e. not counted twice)
  const aeoFaqBlocks = $('.faq-block').length;
  if (aeoFaqBlocks > 1) aeoFaqDup++;
  check(relPath, 'zero AEO FAQ duplicates', aeoFaqBlocks <= 1, `count=${aeoFaqBlocks}`);

  // 11. no Quick Answer orphan blocks — check for the actual UI element,
  // not incidental prose that mentions the phrase (e.g. a page describing
  // the site's own AEO methodology in passing is not an invalid-UX-pattern
  // violation)
  const hasQuickAnswer = $('.ai-answer-block').length > 0 || $('section.ai-answer').length > 0;
  if (hasQuickAnswer) quickAnswerOrphans++;
  check(relPath, 'no Quick Answer orphan blocks', !hasQuickAnswer);

  // "More questions" surface must never reappear
  const hasMoreQuestions = /More questions/i.test(bodyText) || $('.ai-faq-expansion').length > 0;
  if (hasMoreQuestions) moreQuestionsFound++;
  check(relPath, 'no "More questions" surface', !hasMoreQuestions);

  // 5-10: visible/schema correspondence
  const visibleQ = $('.faq-item h3, .faq-item summary').map((i, el) => $(el).text().trim()).get();
  const visibleA = $('.faq-item p').map((i, el) => $(el).text().trim()).get();
  let schemaQ = [], schemaA = [];
  $('script[type="application/ld+json"]').each((i, el) => {
    const txt = $(el).html();
    if (!txt) return;
    if (txt.includes('"FAQPage"') || txt.includes("'FAQPage'")) {
      try {
        const obj = JSON.parse(txt);
        const graph = obj['@graph'] ? obj['@graph'] : [obj];
        graph.forEach(node => {
          if (node['@type'] === 'FAQPage' && Array.isArray(node.mainEntity)) {
            schemaQ.push(...node.mainEntity.map(m => m.name));
            schemaA.push(...node.mainEntity.map(m => m.acceptedAnswer && m.acceptedAnswer.text));
          }
        });
      } catch (e) {}
    }
  });

  if (visibleQ.length === 0 && schemaQ.length === 0) continue; // no FAQ on this page — not a violation

  const countOk = visibleQ.length === schemaQ.length;
  if (!countOk) countMismatch++;
  check(relPath, 'visible FAQ count == schema FAQ count', countOk, `visible=${visibleQ.length} schema=${schemaQ.length}`);

  const qMatch = JSON.stringify(visibleQ) === JSON.stringify(schemaQ);
  if (!qMatch) questionMismatch++;
  check(relPath, 'exact question match', qMatch);

  const aMatch = JSON.stringify(visibleA) === JSON.stringify(schemaA);
  if (!aMatch) answerMismatch++;
  check(relPath, 'exact answer match', aMatch);

  const isSchemaOnly = visibleQ.length === 0 && schemaQ.length > 0;
  if (isSchemaOnly) schemaOnly++;
  check(relPath, 'no schema-only questions (FAQPage without visible FAQ)', !isSchemaOnly);

  const isVisibleOnly = visibleQ.length > 0 && schemaQ.length === 0;
  if (isVisibleOnly) visibleOnly++;
  check(relPath, 'no visible-only questions (visible FAQ without matching schema)', !isVisibleOnly);

  // 10. no FAQPage schema without visible FAQ (same as schema-only, restated)
  check(relPath, 'no FAQPage schema without visible FAQ', !isSchemaOnly);
}

console.log(`Scanned ${files.length} files.`);
console.log(`\n${pass} passed, ${fail} failed.\n`);
console.log('Summary:');
console.log('  Duplicate visible FAQ surfaces:', dupVisibleFaq);
console.log('  Common questions blocks:', commonQuestions);
console.log('  Non-canonical AI FAQ blocks:', aiFaqNonCanonical);
console.log('  AEO FAQ duplicates:', aeoFaqDup);
console.log('  Count mismatches:', countMismatch);
console.log('  Question mismatches:', questionMismatch);
console.log('  Answer mismatches:', answerMismatch);
console.log('  Schema-only pages:', schemaOnly);
console.log('  Visible-only (no schema) pages:', visibleOnly);
console.log('  Quick Answer orphans:', quickAnswerOrphans);
console.log('  "More questions" surfaces:', moreQuestionsFound);

if (fail > 0) {
  console.log('\nFirst 30 failures:');
  failures.slice(0, 30).forEach(f => console.log(`  [FAIL] ${f.file} :: ${f.name}${f.detail ? ' — ' + f.detail : ''}`));
  fs.writeFileSync(path.join(ROOT, 'reports', '.phase9-validator-failures.json'), JSON.stringify(failures, null, 2));
}

if (fail > 0) process.exit(1);
