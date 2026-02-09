#!/usr/bin/env node
/**
 * AdSense Policy Compliance Checker — Phase 12.5
 * Checks pages for policy violations:
 * - no prohibited content
 * - no medical claims
 * - no financial guarantees
 * - no fake reviews
 * - no copied brand content
 * - no scraped tables
 * - no excessive outbound links
 * - no thin pages
 *
 * Outputs warnings. Does not modify files.
 * Usage: node scripts/adsense-policy-checker.js [dir1] [dir2] ...
 * Optional: --json for full report
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

const MIN_WORDS_THIN_PAGE = 200;
const MAX_OUTBOUND_LINKS = 25;
const MAX_TABLE_ROWS_PER_1K_WORDS = 80;
const MIN_WORDS_FOR_TABLE_RATIO = 100;

function listHtml(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.html')).map(f => path.join(dir, f));
}

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

function getWordCount(html) {
  const text = getVisibleText(html);
  return text.toLowerCase().replace(/[^\w\s'-]/g, ' ').split(/\s+/).filter(w => w.length > 0).length;
}

const PROHIBITED_PATTERNS = [
  { name: 'prohibited_content', regex: /\b(adult|porn|casino|gambling|weapon|illegal\s*drug)\b/i }
];

const MEDICAL_CLAIM_PATTERNS = [
  /\bcures?\b/i,
  /\btreats?\s+(disease|condition|illness|cancer|pain)\b/i,
  /\bdiagnos(e|is)\b/i,
  /\bmedical\s+advice\b/i,
  /\bFDA\s*approved\b/i,
  /\bclinical\s+trial\b/i,
  /\bhealth\s+claim\s+that\b/i,
  /\bguarantee\s+(to\s+)?(cure|heal|treat)\b/i
];

const FINANCIAL_GUARANTEE_PATTERNS = [
  /\bguaranteed\s+(return|profit|income)\b/i,
  /\bmake\s+(big\s+)?money\s+fast\b/i,
  /\binvestment\s+guarantee\b/i,
  /\b100%\s*(profit|return)\b/i,
  /\brisk[- ]free\s+investment\b/i,
  /\bget\s+rich\s+quick\b/i
];

const FAKE_REVIEW_PATTERNS = [
  /"@type"\s*:\s*"Review"/g,
  /"@type"\s*:\s*"AggregateRating"/g,
  /ratingValue.*5\s*\/\s*5/g,
  /class="[^"]*testimonial[^"]*"[^>]*>[\s\S]*?(5\s*star|★★★★★)/gi
];

const COPIED_BRAND_PATTERNS = [
  /©\s*\d{4}\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*\.\s*All\s+rights\s+reserved/i,
  /All\s+rights\s+reserved\s*\.\s*[A-Z][a-z]+/i,
  /(?:copyright|©)\s*[^.]{20,80}\s*\.\s*All\s+rights/i,
  /product\s+description\s*:\s*[\s\S]{100,}/i
];

function checkPage(html, filePath) {
  const relPath = path.relative(ROOT, filePath);
  const warnings = [];
  const visibleText = getVisibleText(html);
  const wordCount = getWordCount(html);
  const lower = visibleText.toLowerCase();

  // --- Prohibited content ---
  for (const { name, regex } of PROHIBITED_PATTERNS) {
    if (regex.test(visibleText)) {
      warnings.push(`[${relPath}] Prohibited content: possible ${name} (keyword/phrase match).`);
      break;
    }
  }

  // --- Medical claims ---
  for (const regex of MEDICAL_CLAIM_PATTERNS) {
    if (regex.test(visibleText)) {
      warnings.push(`[${relPath}] Medical claims: page text may contain medical or health claims (AdSense policy).`);
      break;
    }
  }

  // --- Financial guarantees ---
  for (const regex of FINANCIAL_GUARANTEE_PATTERNS) {
    if (regex.test(visibleText)) {
      warnings.push(`[${relPath}] Financial guarantees: page may contain financial guarantee or get-rich language.`);
      break;
    }
  }

  // --- Fake reviews ---
  const reviewSchemaCount = (html.match(/"@type"\s*:\s*"Review"/g) || []).length;
  const aggregateRatingCount = (html.match(/"@type"\s*:\s*"AggregateRating"/g) || []).length;
  if (reviewSchemaCount > 0 && wordCount < 400) {
    warnings.push(`[${relPath}] Fake reviews risk: Review schema present with low word count (${wordCount}); ensure reviews are genuine.`);
  }
  if (aggregateRatingCount > 1 && wordCount < 300) {
    warnings.push(`[${relPath}] Fake reviews risk: multiple AggregateRating with little content; avoid fabricated ratings.`);
  }
  if (/testimonial|user\s+review|customer\s+said/i.test(html) && /5\s*\/\s*5|★★★★★|5\s*star/i.test(html) && wordCount < 350) {
    warnings.push(`[${relPath}] Fake reviews risk: testimonial/rating pattern with thin content; ensure real user feedback.`);
  }

  // --- Copied brand content ---
  for (const regex of COPIED_BRAND_PATTERNS) {
    if (regex.test(html)) {
      warnings.push(`[${relPath}] Copied brand content: possible verbatim brand/copyright block; use only original or licensed content.`);
      break;
    }
  }
  if ((html.match(/All\s+rights\s+reserved/gi) || []).length > 1 && !html.includes('GlobalSizeChart')) {
    warnings.push(`[${relPath}] Copied brand content: multiple "All rights reserved" blocks; confirm no copied legal text from brands.`);
  }

  // --- Scraped tables ---
  const tableRows = (html.match(/<tr[^>]*>/gi) || []).length;
  if (wordCount >= MIN_WORDS_FOR_TABLE_RATIO && tableRows > 0) {
    const rowsPer1k = (tableRows / wordCount) * 1000;
    if (rowsPer1k > MAX_TABLE_ROWS_PER_1K_WORDS) {
      warnings.push(`[${relPath}] Scraped tables: high table row to word ratio (${Math.round(rowsPer1k)} rows/1k words, ${tableRows} rows, ${wordCount} words); add more original prose.`);
    }
  }
  if (tableRows >= 30 && wordCount < 150) {
    warnings.push(`[${relPath}] Thin page with many tables: ${tableRows} table rows and only ${wordCount} words; may look like scraped data.`);
  }

  // --- Excessive outbound links ---
  const outboundLinks = (html.match(/<a\s+href\s*=\s*["']https?:\/\/[^"']*["']/gi) || []).filter(tag => {
    const m = tag.match(/href\s*=\s*["'](https?:\/\/[^"']+)["']/i);
    if (!m) return false;
    const url = m[1];
    return !url.includes('globalsizechart.com') && !url.includes('schema.org') && !url.includes('w3.org');
  });
  if (outboundLinks.length > MAX_OUTBOUND_LINKS) {
    warnings.push(`[${relPath}] Excessive outbound links: ${outboundLinks.length} external links (threshold ${MAX_OUTBOUND_LINKS}); reduce or nofollow where appropriate.`);
  }

  // --- Thin pages ---
  if (wordCount < MIN_WORDS_THIN_PAGE) {
    warnings.push(`[${relPath}] Thin page: ${wordCount} words (minimum ${MIN_WORDS_THIN_PAGE}); add more original content for AdSense.`);
  }

  return { path: relPath, warnings, wordCount, outboundCount: outboundLinks.length, tableRows };
}

function runChecker(dirList) {
  const dirs = dirList && dirList.length ? dirList : DEFAULT_DIRS;
  const allWarnings = [];
  const results = [];
  let filesChecked = 0;

  for (const dir of dirs) {
    const files = listHtml(dir);
    for (const filePath of files) {
      try {
        const html = fs.readFileSync(filePath, 'utf8');
        const r = checkPage(html, filePath);
        results.push(r);
        allWarnings.push(...r.warnings);
        filesChecked += 1;
      } catch (e) {
        allWarnings.push(`[${path.relative(ROOT, filePath)}] Error: ${e.message}`);
        results.push({ path: path.relative(ROOT, filePath), warnings: [e.message], error: true });
      }
    }
  }

  const byCategory = {
    prohibited_content: 0,
    medical_claims: 0,
    financial_guarantees: 0,
    fake_reviews: 0,
    copied_brand: 0,
    scraped_tables: 0,
    excessive_outbound: 0,
    thin_pages: 0
  };
  allWarnings.forEach(w => {
    if (w.includes('Prohibited content')) byCategory.prohibited_content += 1;
    else if (w.includes('Medical claims')) byCategory.medical_claims += 1;
    else if (w.includes('Financial guarantees')) byCategory.financial_guarantees += 1;
    else if (w.includes('Fake reviews')) byCategory.fake_reviews += 1;
    else if (w.includes('Copied brand')) byCategory.copied_brand += 1;
    else if (w.includes('Scraped tables') || w.includes('Thin page with many tables')) byCategory.scraped_tables += 1;
    else if (w.includes('Excessive outbound')) byCategory.excessive_outbound += 1;
    else if (w.includes('Thin page:')) byCategory.thin_pages += 1;
  });

  return {
    warnings: allWarnings,
    filesChecked,
    results,
    summary: {
      total_warnings: allWarnings.length,
      by_category: byCategory,
      compliant: filesChecked - results.filter(r => r.warnings && r.warnings.length > 0).length
    }
  };
}

function main() {
  const args = process.argv.slice(2);
  const jsonOut = args.includes('--json');
  const dirs = args.filter(a => !a.startsWith('--')).map(d => path.isAbsolute(d) ? d : path.join(process.cwd(), d));
  const report = runChecker(dirs.length ? dirs : null);

  if (jsonOut) {
    console.log(JSON.stringify(report, null, 2));
    if (report.warnings.length > 0) process.exitCode = 1;
    return report;
  }

  if (report.warnings.length > 0) {
    console.log('\n--- AdSense Policy Checker (warnings) ---');
    report.warnings.forEach(w => console.warn('WARN', w));
    console.log(`--- ${report.warnings.length} warning(s) across ${report.filesChecked} file(s) ---`);
    console.log('Summary:', report.summary);
    console.log('');
    process.exitCode = 1;
  } else {
    console.log(`AdSense policy checker: ${report.filesChecked} file(s) checked, no policy warnings.`);
  }
  return report;
}

if (typeof require !== 'undefined' && require.main === module) {
  main();
}

module.exports = { checkPage, runChecker };
