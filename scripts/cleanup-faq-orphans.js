#!/usr/bin/env node
'use strict';
/**
 * Phase 9B — second pass: remove confirmed-orphaned FAQ-adjacent blocks
 * that the primary consolidation pass didn't touch because they use a
 * markup variant (bare h3/p, not wrapped in .faq-item) that fell outside
 * that pass's selectors.
 *
 * 1. .ai-faq-block ("Common questions") — traced in the Phase 9B report
 *    to a historical, no-longer-reachable version of
 *    scripts/ai-answer-injector.js. Every one of the 88 pages carrying
 *    this block already has its own healthy, correctly-matched
 *    "Frequently Asked Questions" section elsewhere on the page (verified
 *    below before removing anything) — removing this block loses no
 *    unique content, it was a pure duplicate.
 * 2. .ai-answer-block ("Quick answer") — the same invalid-UX pattern
 *    (a label with no preceding question) already remediated on brands/,
 *    homepage, and the shoe hub in Phases 7/8.
 * 3. .ai-faq-expansion ("More questions") — the one remaining test-stub
 *    artifact from the now-retired scripts/generate-faqs.js.
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const DRY = process.argv.includes('--dry-run');

function walk(dir, prefix, out) {
  const IGNORE_DIRS = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components', 'build', 'reports', 'docs', 'authority/generated']);
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

const files = [];
walk('.', '', files);

const summary = { aiFaqBlockRemoved: [], aiFaqBlockSkippedNoHealthyFaq: [], quickAnswerRemoved: [], moreQuestionsRemoved: [] };

for (const relPath of files) {
  const abs = path.join(ROOT, relPath);
  const html = fs.readFileSync(abs, 'utf8');
  if (!html.includes('<body')) continue;
  const $ = cheerio.load(html, { decodeEntities: false });
  let changed = false;

  if ($('.ai-faq-block').length) {
    // safety check: only remove if a separate, healthy "Frequently Asked
    // Questions" section already exists elsewhere on the page
    const hasHealthyFaq = $('h2').filter((i, el) => $(el).text().trim() === 'Frequently Asked Questions').length > 0 &&
      $('.faq-item').length > 0;
    if (hasHealthyFaq) {
      $('.ai-faq-block').remove();
      changed = true;
      summary.aiFaqBlockRemoved.push(relPath);
    } else {
      summary.aiFaqBlockSkippedNoHealthyFaq.push(relPath);
    }
  }

  // .ai-answer-block (the original Phase 6/7/8 pattern) and the bare
  // .ai-answer variant (aria-labelledby="quick-answer-heading") found
  // during Phase 9B's population-wide validator run — same invalid UX
  // pattern, different class name.
  if ($('.ai-answer-block, section.ai-answer').length) {
    $('.ai-answer-block, section.ai-answer').remove();
    changed = true;
    summary.quickAnswerRemoved.push(relPath);
  }

  if ($('.ai-faq-expansion').length) {
    $('.ai-faq-expansion').remove();
    changed = true;
    summary.moreQuestionsRemoved.push(relPath);
  }

  if (changed && !DRY) {
    fs.writeFileSync(abs, $.html(), 'utf8');
  }
}

fs.writeFileSync(path.join(ROOT, 'reports', '.phase9-cleanup-summary.json'), JSON.stringify(summary, null, 2));
console.log('ai-faq-block removed:', summary.aiFaqBlockRemoved.length);
console.log('ai-faq-block SKIPPED (no healthy FAQ found — needs manual review):', summary.aiFaqBlockSkippedNoHealthyFaq.length);
if (summary.aiFaqBlockSkippedNoHealthyFaq.length) console.log(summary.aiFaqBlockSkippedNoHealthyFaq);
console.log('Quick Answer removed:', summary.quickAnswerRemoved.length);
console.log('"More questions" removed:', summary.moreQuestionsRemoved.length);
