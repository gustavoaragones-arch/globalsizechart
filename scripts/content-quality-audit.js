#!/usr/bin/env node
/**
 * Content Quality Audit — Phase 12.5
 * Evaluates per-page content quality for AdSense/approval readiness.
 *
 * Metrics per page:
 * - word_count
 * - unique_content_pct (vocabulary diversity: unique words / total words)
 * - semantic_depth (heading hierarchy, lists, sections)
 * - internal_link_count
 * - instructional_content_presence (how-to, steps, guides)
 * - faq_presence
 * - schema_presence
 *
 * Output: quality_score (0–100), approval_ready (true/false)
 *
 * Usage: node scripts/content-quality-audit.js [dir1] [dir2] ...
 * Default: programmatic-pages, clothing, brands, measurement, semantic, tools
 * Optional: --json to output full report as JSON
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const DEFAULT_DIRS = [
  path.join(ROOT, 'programmatic-pages'),
  path.join(ROOT, 'clothing'),
  path.join(ROOT, 'brands'),
  path.join(ROOT, 'measurement'),
  path.join(ROOT, 'semantic'),
  path.join(ROOT, 'tools')
];

const MIN_WORDS_APPROVAL = 250;
const MIN_SCORE_APPROVAL = 55;
const MIN_INTERNAL_LINKS_APPROVAL = 5;
const MIN_UNIQUE_PCT_APPROVAL = 20;

function listHtml(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.html')).map(f => path.join(dir, f));
}

/**
 * Extract visible body text (main content only) for word count and uniqueness.
 */
function getVisibleText(html) {
  let body = html;
  const mainStart = html.indexOf('<main');
  const mainEnd = html.indexOf('</main>');
  if (mainStart >= 0 && mainEnd > mainStart) {
    body = html.slice(mainStart, mainEnd);
  } else {
    const bodyStart = html.indexOf('<body');
    const bodyEnd = html.lastIndexOf('</body>');
    if (bodyStart >= 0 && bodyEnd > bodyStart) body = html.slice(bodyStart, bodyEnd);
  }
  body = body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ');
  body = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return body;
}

function getWords(text) {
  return text.toLowerCase().replace(/[^\w\s'-]/g, ' ').split(/\s+/).filter(w => w.length > 0);
}

/**
 * Audit a single HTML file. Returns metrics object and derived score.
 */
function auditPage(html, filePath) {
  const relPath = path.relative(ROOT, filePath);
  const visibleText = getVisibleText(html);
  const words = getWords(visibleText);
  const wordCount = words.length;
  const uniqueWords = new Set(words);
  const uniqueContentPct = wordCount > 0 ? Math.round((uniqueWords.size / wordCount) * 100) : 0;

  const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;
  const listCount = (html.match(/<ol[^>]*>|<ul[^>]*>/gi) || []).length;
  const pCount = (html.match(/<p[^>]*>/gi) || []).length;
  const sectionCount = (html.match(/<section[^>]*>/gi) || []).length;
  const semanticDepth = Math.min(100, (
    (h1Count ? 15 : 0) +
    Math.min(h2Count * 8, 30) +
    Math.min(h3Count * 3, 20) +
    Math.min(listCount * 5, 15) +
    Math.min(pCount * 2, 15) +
    Math.min(sectionCount * 2, 10)
  ));

  const internalLinks = html.match(/<a\s+href\s*=\s*["']([^"']+)["']/gi) || [];
  const internalLinkCount = internalLinks.filter(tag => {
    const m = tag.match(/href\s*=\s*["']([^"']+)["']/i);
    if (!m) return false;
    const href = m[1].trim();
    return href.startsWith('#') || href.endsWith('.html') || /^\.\.?\//.test(href) || href.includes('globalsizechart.com');
  }).length;

  const hasInstructional = (
    /how to\s|how-to|step\s*\d|measurement guide|measure your|conversion guide|fit guide/i.test(visibleText) ||
    /<ol[^>]*>[\s\S]*?<li[\s\S]*?<\/ol>/i.test(html) ||
    /"@type"\s*:\s*"HowTo"/.test(html) ||
    /how-to-measure|measurement-steps|measurement-steps/i.test(html)
  );
  const instructionalContentPresence = hasInstructional ? 100 : 0;

  const hasFaq = (
    /<h[23][^>]*>[\s\S]*?faq|frequently asked|questions?\s*<\/h/i.test(html) ||
    /"@type"\s*:\s*"FAQPage"/.test(html) ||
    /"@type"\s*:\s*"Question"/.test(html) ||
    /class="[^"]*faq[^"]*"|id="faq"/i.test(html)
  );
  const faqPresence = hasFaq ? 100 : 0;

  const schemaTypes = [];
  const schemaMatches = html.match(/"@type"\s*:\s*"([^"]+)"/g) || [];
  schemaMatches.forEach(m => {
    const type = m.replace(/"@type"\s*:\s*"/, '').replace(/"$/, '');
    if (!schemaTypes.includes(type)) schemaTypes.push(type);
  });
  const schemaPresence = Math.min(100, schemaTypes.length * 20);

  const wordScore = Math.min(20, (wordCount / 25));
  const uniqueScore = Math.min(15, uniqueContentPct * 0.15);
  const depthScore = semanticDepth * 0.25;
  const linkScore = Math.min(15, (Math.min(internalLinkCount, 30) / 30) * 15);
  const instrScore = instructionalContentPresence ? 10 : 0;
  const faqScore = faqPresence ? 10 : 0;
  const schemaScore = Math.min(15, schemaPresence * 0.15);
  const qualityScore = Math.round(Math.min(100, wordScore + uniqueScore + depthScore + linkScore + instrScore + faqScore + schemaScore));

  const approvalReady = (
    qualityScore >= MIN_SCORE_APPROVAL &&
    wordCount >= MIN_WORDS_APPROVAL &&
    internalLinkCount >= MIN_INTERNAL_LINKS_APPROVAL &&
    uniqueContentPct >= MIN_UNIQUE_PCT_APPROVAL
  );

  return {
    path: relPath,
    word_count: wordCount,
    unique_content_pct: uniqueContentPct,
    semantic_depth: semanticDepth,
    internal_link_count: internalLinkCount,
    instructional_content_presence: instructionalContentPresence,
    faq_presence: faqPresence,
    schema_presence: schemaPresence,
    schema_types: schemaTypes,
    quality_score: Math.max(0, Math.min(100, qualityScore)),
    approval_ready: approvalReady
  };
}

/**
 * Run audit on directories. Returns { pages: [], summary: {} }.
 */
function runAudit(dirList) {
  const dirs = dirList && dirList.length ? dirList : DEFAULT_DIRS;
  const results = [];
  for (const dir of dirs) {
    const files = listHtml(dir);
    for (const filePath of files) {
      try {
        const html = fs.readFileSync(filePath, 'utf8');
        results.push(auditPage(html, filePath));
      } catch (e) {
        results.push({
          path: path.relative(ROOT, filePath),
          error: e.message,
          quality_score: 0,
          approval_ready: false
        });
      }
    }
  }

  const withScore = results.filter(r => r.quality_score !== undefined);
  const approved = results.filter(r => r.approval_ready === true);
  const summary = {
    total_pages: results.length,
    approval_ready_count: approved.length,
    approval_ready_pct: results.length ? Math.round((approved.length / results.length) * 100) : 0,
    avg_quality_score: withScore.length ? Math.round(withScore.reduce((s, r) => s + r.quality_score, 0) / withScore.length) : 0,
    avg_word_count: withScore.length ? Math.round(withScore.reduce((s, r) => s + (r.word_count || 0), 0) / withScore.length) : 0,
    min_quality_score: withScore.length ? Math.min(...withScore.map(r => r.quality_score)) : 0,
    max_quality_score: withScore.length ? Math.max(...withScore.map(r => r.quality_score)) : 0
  };

  return { pages: results, summary };
}

function main() {
  const args = process.argv.slice(2);
  const jsonOut = args.includes('--json');
  const dirs = args.filter(a => !a.startsWith('--')).map(d => path.isAbsolute(d) ? d : path.join(process.cwd(), d));
  const report = runAudit(dirs.length ? dirs : null);

  if (jsonOut) {
    console.log(JSON.stringify(report, null, 2));
    return report;
  }

  console.log('\n--- Content Quality Audit ---');
  console.log('Summary:', JSON.stringify(report.summary, null, 2));
  console.log('\nPer-page (quality_score, approval_ready):');
  report.pages.slice(0, 20).forEach(p => {
    if (p.error) console.log('  ', p.path, 'ERROR', p.error);
    else console.log('  ', p.path, 'score=' + p.quality_score, 'approval_ready=' + p.approval_ready);
  });
  if (report.pages.length > 20) {
    console.log('  ... and', report.pages.length - 20, 'more pages.');
  }
  console.log('---\n');
  return report;
}

if (typeof require !== 'undefined' && require.main === module) {
  main();
}

module.exports = { auditPage, runAudit };
