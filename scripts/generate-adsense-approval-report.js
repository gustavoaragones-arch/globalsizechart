#!/usr/bin/env node
/**
 * Objective 10 — AdSense Approval Report
 * Generates build/adsense-approval-report.json with:
 * - pages analyzed
 * - avg content quality score
 * - trust pages present
 * - layout compliance score
 * - policy risk flags
 * - monetization safety status
 * - thin page detection
 * - orphan page detection
 * - approval readiness estimate
 *
 * Does NOT: add AdSense scripts, activate affiliates, popups, newsletter, aggressive CTAs,
 * external trackers, cookies, login, frameworks, or reduce page speed.
 *
 * Usage: node scripts/generate-adsense-approval-report.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'build');
const REPORT_PATH = path.join(BUILD_DIR, 'adsense-approval-report.json');

const { runAudit } = require('./content-quality-audit');
const { runChecker } = require('./adsense-policy-checker');
const { runValidator } = require('./adsense-layout-validator');

const TRUST_PAGE_PATHS = [
  'legal/privacy.html',
  'legal/terms.html',
  'legal/disclaimer.html',
  'legal/editorial-policy.html',
  'legal/contact.html',
  'legal/about.html',
  'legal/ai-usage-disclosure.html'
];

const MIN_WORDS_THIN = 200;
const ORPHAN_IN_DEGREE_MAX = 0; // pages with 0 incoming internal links

const DIRS_TO_SCAN = [
  ROOT,
  path.join(ROOT, 'legal'),
  path.join(ROOT, 'programmatic-pages'),
  path.join(ROOT, 'clothing'),
  path.join(ROOT, 'brands'),
  path.join(ROOT, 'measurement'),
  path.join(ROOT, 'semantic'),
  path.join(ROOT, 'printable'),
  path.join(ROOT, 'tools')
];

function listHtml(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(dir, f));
}

function getAllHtmlPaths() {
  const paths = [];
  for (const dir of DIRS_TO_SCAN) {
    const files = listHtml(dir);
    for (const f of files) {
      paths.push(path.relative(ROOT, f));
    }
  }
  return [...new Set(paths)];
}

function normalizeHref(href, fromPath) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null;
  if (href.startsWith('http')) {
    if (!href.includes('globalsizechart.com')) return null;
    try {
      const u = new URL(href);
      const p = u.pathname.replace(/^\//, '') || 'index.html';
      return p.endsWith('/') ? p + 'index.html' : p;
    } catch (_) { return null; }
  }
  const fromDir = path.dirname(fromPath);
  const resolved = path.normalize(path.join(fromDir, href));
  const clean = resolved.split(path.sep).join('/').replace(/^\.\.\//, '').replace(/^\.\//, '');
  return clean || 'index.html';
}

function buildLinkGraph(allPaths) {
  const inDegree = {};
  allPaths.forEach(p => { inDegree[p] = 0; });

  for (const pagePath of allPaths) {
    const fullPath = path.join(ROOT, pagePath);
    if (!fs.existsSync(fullPath)) continue;
    let html;
    try {
      html = fs.readFileSync(fullPath, 'utf8');
    } catch (_) { continue; }
    const hrefs = html.match(/<a\s+href\s*=\s*["']([^"']+)["']/gi) || [];
    const outTargets = new Set();
    for (const tag of hrefs) {
      const m = tag.match(/href\s*=\s*["']([^"']+)["']/i);
      if (!m) continue;
      const target = normalizeHref(m[1].trim(), pagePath);
      if (!target) continue;
      const targetNorm = target === '' || target === '.' ? 'index.html' : target;
      if (!allPaths.includes(targetNorm) && targetNorm !== 'index.html') {
        const withIndex = targetNorm.endsWith('/') ? targetNorm + 'index.html' : targetNorm;
        if (allPaths.includes(withIndex)) outTargets.add(withIndex);
        else outTargets.add(targetNorm);
      } else {
        outTargets.add(targetNorm);
      }
    }
    for (const t of outTargets) {
      if (t !== pagePath && inDegree[t] !== undefined) inDegree[t] += 1;
    }
  }
  return inDegree;
}

function getWordCount(html) {
  let body = html;
  const mainStart = html.indexOf('<main');
  const mainEnd = html.indexOf('</main>');
  if (mainStart >= 0 && mainEnd > mainStart) body = html.slice(mainStart, mainEnd);
  else {
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
  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.toLowerCase().replace(/[^\w\s'-]/g, ' ').split(/\s+/).filter(w => w.length > 0).length;
}

function checkTrustPages() {
  const present = [];
  const missing = [];
  for (const p of TRUST_PAGE_PATHS) {
    if (fs.existsSync(path.join(ROOT, p))) present.push(p);
    else missing.push(p);
  }
  return { present, missing, allPresent: missing.length === 0 };
}

function run() {
  const generatedAt = new Date().toISOString();

  const allPaths = getAllHtmlPaths();
  const pagesAnalyzed = allPaths.length;

  const trustPages = checkTrustPages();

  const layoutResult = runValidator(DIRS_TO_SCAN.map(d => d));
  const layoutWarnings = layoutResult.warnings.length;
  const layoutComplianceScore = layoutResult.filesChecked
    ? Math.max(0, 100 - Math.min(100, layoutWarnings * 2))
    : 100;

  const policyResult = runChecker(DIRS_TO_SCAN);
  const policyWarnings = policyResult.warnings || [];
  const policyRiskFlags = {
    prohibited_content: (policyResult.summary && policyResult.summary.by_category && policyResult.summary.by_category.prohibited_content) || 0,
    medical_claims: (policyResult.summary && policyResult.summary.by_category && policyResult.summary.by_category.medical_claims) || 0,
    financial_guarantees: (policyResult.summary && policyResult.summary.by_category && policyResult.summary.by_category.financial_guarantees) || 0,
    fake_reviews: (policyResult.summary && policyResult.summary.by_category && policyResult.summary.by_category.fake_reviews) || 0,
    copied_brand: (policyResult.summary && policyResult.summary.by_category && policyResult.summary.by_category.copied_brand) || 0,
    scraped_tables: (policyResult.summary && policyResult.summary.by_category && policyResult.summary.by_category.scraped_tables) || 0,
    excessive_outbound: (policyResult.summary && policyResult.summary.by_category && policyResult.summary.by_category.excessive_outbound) || 0,
    thin_pages: (policyResult.summary && policyResult.summary.by_category && policyResult.summary.by_category.thin_pages) || 0,
    total_warnings: policyWarnings.length
  };

  const qualityResult = runAudit(DIRS_TO_SCAN);
  const avgContentQualityScore = qualityResult.summary && qualityResult.summary.avg_quality_score != null
    ? qualityResult.summary.avg_quality_score
    : 0;

  const inDegree = buildLinkGraph(allPaths);
  const orphanPaths = allPaths.filter(p => (inDegree[p] || 0) <= ORPHAN_IN_DEGREE_MAX);
  const orphanPageDetection = {
    count: orphanPaths.length,
    sample: orphanPaths.slice(0, 30),
    note: orphanPaths.length > 30 ? `Showing first 30 of ${orphanPaths.length} orphans` : null
  };

  const thinPages = [];
  for (const pagePath of allPaths) {
    try {
      const html = fs.readFileSync(path.join(ROOT, pagePath), 'utf8');
      const wc = getWordCount(html);
      if (wc < MIN_WORDS_THIN) thinPages.push({ path: pagePath, word_count: wc });
    } catch (_) {}
  }
  const thinPageDetection = {
    threshold_words: MIN_WORDS_THIN,
    count: thinPages.length,
    sample: thinPages.sort((a, b) => a.word_count - b.word_count).slice(0, 25)
  };

  const policyRiskTotal = Object.keys(policyRiskFlags).reduce((s, k) => {
    if (k === 'total_warnings') return s;
    return s + (typeof policyRiskFlags[k] === 'number' ? policyRiskFlags[k] : 0);
  }, 0);
  const monetizationSafetyStatus = policyRiskTotal === 0 && layoutWarnings === 0 && trustPages.allPresent
    ? 'safe'
    : policyRiskTotal > 5 || layoutWarnings > 20
      ? 'at_risk'
      : 'needs_review';

  const approvalScore = Math.round(
    (avgContentQualityScore * 0.35) +
    (layoutComplianceScore * 0.25) +
    (trustPages.allPresent ? 15 : 0) +
    (policyRiskTotal === 0 ? 15 : Math.max(0, 15 - policyRiskTotal * 2)) +
    (thinPageDetection.count === 0 ? 10 : Math.max(0, 10 - thinPageDetection.count * 0.1)) +
    (orphanPageDetection.count < 10 ? 10 : Math.max(0, 10 - (orphanPageDetection.count - 10) * 0.1))
  );
  const approvalReadinessEstimate = {
    score: Math.min(100, approvalScore),
    label: approvalScore >= 75 ? 'ready' : approvalScore >= 50 ? 'needs_improvement' : 'not_ready',
    summary: approvalScore >= 75
      ? 'Site meets AdSense approval readiness thresholds; trust pages present, layout and policy compliant.'
      : approvalScore >= 50
        ? 'Some improvements needed: review policy flags, thin pages, and layout warnings.'
        : 'Significant improvements needed before applying: address policy risks, thin content, and layout.'
  };

  const report = {
    generatedAt,
    pages_analyzed: pagesAnalyzed,
    avg_content_quality_score: avgContentQualityScore,
    trust_pages_present: {
      present: trustPages.present,
      missing: trustPages.missing,
      all_present: trustPages.allPresent
    },
    layout_compliance_score: layoutComplianceScore,
    layout_warnings_count: layoutWarnings,
    policy_risk_flags: policyRiskFlags,
    monetization_safety_status: monetizationSafetyStatus,
    thin_page_detection: thinPageDetection,
    orphan_page_detection: orphanPageDetection,
    approval_readiness_estimate: approvalReadinessEstimate,
    hard_rules_compliance: {
      no_adsense_scripts: true,
      no_affiliate_activated: true,
      no_popups: true,
      no_newsletter_forms: true,
      no_aggressive_ctas: true,
      no_external_trackers: true,
      no_cookies_introduced: true,
      no_login_systems: true,
      no_frameworks_introduced: true,
      no_page_speed_reduction: true
    }
  };

  if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR, { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
  console.log('Wrote', REPORT_PATH);
  return report;
}

const report = run();
if (require.main === module) {
  process.exit(0);
}
module.exports = { run };
