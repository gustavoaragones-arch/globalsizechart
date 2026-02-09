#!/usr/bin/env node
/**
 * Step 6: Structural audit + pre-Phase 13 validation.
 * Runs validation across entire site:
 *   - Orphan pages (no inlinks)
 *   - Broken internal links (target missing)
 *   - Pages with <10 internal links
 *   - Pages missing breadcrumb schema
 *   - Missing hubs (expected hub files)
 *   - Duplicate titles
 *   - Missing meta descriptions
 *   - Pages not linked from any hub
 * Outputs: build/phase1275-structure-report.json
 * Report includes: total_pages, orphan_pages, avg_internal_links, authority_coverage_score,
 *   crawl_depth_estimate, phase13_readiness (true/false).
 *
 * Phase 13 Readiness (after fixes) — target thresholds:
 *   Broken links: 0
 *   Orphan pages: 0
 *   Pages <10 links: <5
 *   Missing breadcrumb: 0–2
 *   Authority coverage: ≥0.995
 *   Crawl depth: ≤4
 *   phase13_readiness: true when all above pass
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'build');

const MIN_INTERNAL_LINKS = 10;

// Phase 13 readiness thresholds (after fixes)
const PHASE13_BROKEN_LINKS_MAX = 0;
const PHASE13_ORPHAN_COUNT_MAX = 0;
const PHASE13_PAGES_UNDER_10_LINKS_MAX = 4;   // <5
const PHASE13_MISSING_BREADCRUMB_MAX = 2;     // 0–2
const PHASE13_AUTHORITY_COVERAGE_MIN = 0.995;
const PHASE13_CRAWL_DEPTH_MAX = 4;

const EXCLUDE_DIRS = new Set(['programmatic', 'components', 'sitemaps', 'config', 'data', 'build', 'scripts', 'node_modules']);

const KNOWN_HUBS = [
  'index.html',
  'shoe-size-converter.html',
  'shoe-sizing-guides.html',
  'shoe-size-pages.html',
  'programmatic-index.html',
  'clothing-size-pages.html',
  'brand-size-guides.html',
  'brand-sizing-guide.html',
  'cm-measurement-converters.html',
  'printable-size-guides.html',
  'measurement-tools.html',
  'mens-shoe-size-pages.html',
  'womens-shoe-size-pages.html',
  'kids-shoe-size-pages.html'
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function listHtmlFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const full = path.join(dirPath, e.name);
    if (e.isDirectory() && !e.name.startsWith('.') && !EXCLUDE_DIRS.has(e.name)) {
      out.push(...listHtmlFiles(full));
    } else if (e.isFile() && e.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

/** Get relative path from ROOT for a file path. Normalize to forward slashes. */
function toRelPath(absPath) {
  const rel = path.relative(ROOT, absPath);
  return rel.replace(/\\/g, '/');
}

/** Resolve href from a page at fromRelPath (relative to ROOT). Returns path relative to ROOT or null if external. */
function resolveHref(href, fromRelPath) {
  let raw = (href || '').trim().replace(/#.*$/, '');
  if (!raw || raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return null;
  if (raw.startsWith('#')) return null;
  if (raw.startsWith('/')) {
    raw = raw.slice(1) || 'index.html';
    return raw.endsWith('.html') ? raw : (raw === '' ? 'index.html' : raw + '.html');
  }
  const fromDir = path.dirname(path.join(ROOT, fromRelPath));
  const resolved = path.normalize(path.join(fromDir, raw));
  let rel = path.relative(ROOT, resolved);
  if (rel.startsWith('..')) return null;
  rel = rel.replace(/\\/g, '/');
  if (rel.endsWith('.html')) return rel;
  if (rel === '' || rel === '.') return 'index.html';
  if (!rel.includes('.')) return rel + '.html';
  return rel;
}

/** Collect all HTML page paths under ROOT (exclude EXCLUDE_DIRS). */
function collectAllPages() {
  const files = listHtmlFiles(ROOT);
  const pages = new Set();
  for (const f of files) {
    const rel = toRelPath(f);
    if (!rel.includes('programmatic/templates')) pages.add(rel);
  }
  return pages;
}

/** Extract title from HTML. */
function getTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

/** Extract meta description. */
function getMetaDescription(html) {
  const m = html.match(/<meta\s+name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']*)["']/i) ||
    html.match(/<meta\s+content\s*=\s*["']([^"']*)["'][^>]*name\s*=\s*["']description["']/i);
  return m ? m[1].trim() : '';
}

/** Check for BreadcrumbList in application/ld+json. */
function hasBreadcrumbSchema(html) {
  const blocks = html.match(/<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of blocks) {
    const inner = block.replace(/<script[^>]*>([\s\S]*?)<\/script>/i, '$1').trim();
    try {
      const data = JSON.parse(inner);
      const list = Array.isArray(data) ? data.find(x => x['@type'] === 'BreadcrumbList') : (data['@type'] === 'BreadcrumbList' ? data : null);
      if (list) return true;
    } catch (_) {}
  }
  return false;
}

/** Extract all internal link targets from HTML (resolved to rel paths). */
function getInternalLinks(html, fromRelPath) {
  const re = /<a\s+[^>]*href\s*=\s*["']([^"']+)["']/gi;
  const out = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    const resolved = resolveHref(m[1], fromRelPath);
    if (resolved) out.add(resolved);
  }
  return out;
}

function runAudit() {
  ensureDir(BUILD_DIR);
  const allPages = collectAllPages();
  const totalPages = allPages.size;

  const pageToLinks = new Map();
  const pageToInLinks = new Map();
  const pageData = new Map();

  for (const rel of allPages) {
    pageToInLinks.set(rel, new Set());
  }

  for (const rel of allPages) {
    const absPath = path.join(ROOT, rel);
    let html;
    try {
      html = fs.readFileSync(absPath, 'utf8');
    } catch (e) {
      pageData.set(rel, { error: e.message, internal_links: 0, title: '', meta_description: '', has_breadcrumb: false });
      continue;
    }
    const links = getInternalLinks(html, rel);
    pageToLinks.set(rel, links);
    for (const target of links) {
      if (allPages.has(target)) {
        const inSet = pageToInLinks.get(target);
        if (inSet) inSet.add(rel);
      }
    }
    const title = getTitle(html);
    const metaDescription = getMetaDescription(html);
    const hasBreadcrumb = hasBreadcrumbSchema(html);
    const internalLinkCount = links.size;
    pageData.set(rel, {
      title,
      meta_description: metaDescription,
      has_breadcrumb: hasBreadcrumb,
      internal_links: internalLinkCount,
      link_targets: [...links]
    });
  }

  const orphanPages = [];
  for (const rel of allPages) {
    if (rel === 'index.html') continue;
    const inSet = pageToInLinks.get(rel);
    if (!inSet || inSet.size === 0) orphanPages.push(rel);
  }

  const brokenInternalLinks = [];
  const brokenByPage = new Map();
  for (const [rel, targets] of pageToLinks) {
    for (const target of targets) {
      if (!allPages.has(target)) {
        brokenInternalLinks.push({ from: rel, to: target });
        if (!brokenByPage.has(rel)) brokenByPage.set(rel, []);
        brokenByPage.get(rel).push(target);
      }
    }
  }

  const pagesUnder10Links = [];
  for (const [rel, data] of pageData) {
    if (data.error) continue;
    if (data.internal_links < MIN_INTERNAL_LINKS) pagesUnder10Links.push({ path: rel, count: data.internal_links });
  }

  const pagesMissingBreadcrumb = [];
  for (const [rel, data] of pageData) {
    if (data.error) continue;
    if (!data.has_breadcrumb) pagesMissingBreadcrumb.push(rel);
  }

  const missingHubs = KNOWN_HUBS.filter(h => !allPages.has(h));

  const titleToPages = new Map();
  for (const [rel, data] of pageData) {
    if (data.error || !data.title) continue;
    const t = data.title.trim();
    if (!titleToPages.has(t)) titleToPages.set(t, []);
    titleToPages.get(t).push(rel);
  }
  const duplicateTitles = [];
  for (const [title, pages] of titleToPages) {
    if (pages.length > 1) duplicateTitles.push({ title, pages });
  }

  const pagesMissingMetaDescription = [];
  for (const [rel, data] of pageData) {
    if (data.error) continue;
    if (!data.meta_description || data.meta_description.length < 10) pagesMissingMetaDescription.push(rel);
  }

  const hubSet = new Set(KNOWN_HUBS.filter(h => allPages.has(h)));
  const linkedFromHubs = new Set();
  for (const hub of hubSet) {
    const links = pageToLinks.get(hub);
    if (links) {
      for (const t of links) {
        if (allPages.has(t)) linkedFromHubs.add(t);
      }
    }
  }
  const pagesNotLinkedFromHubs = [];
  for (const rel of allPages) {
    if (rel === 'index.html') continue;
    if (!linkedFromHubs.has(rel)) pagesNotLinkedFromHubs.push(rel);
  }

  let totalInternalLinks = 0;
  let pagesWithData = 0;
  for (const [, data] of pageData) {
    if (data.error) continue;
    totalInternalLinks += data.internal_links || 0;
    pagesWithData++;
  }
  const avgInternalLinks = pagesWithData ? Math.round((totalInternalLinks / pagesWithData) * 10) / 10 : 0;

  const pagesWithBreadcrumb = [...pageData.values()].filter(d => !d.error && d.has_breadcrumb).length;
  const pagesWithMeta = [...pageData.values()].filter(d => !d.error && d.meta_description && d.meta_description.length >= 10).length;
  const pagesWithEnoughLinks = [...pageData.values()].filter(d => !d.error && (d.internal_links || 0) >= MIN_INTERNAL_LINKS).length;
  const authorityCoverageScore = pagesWithData
    ? Math.round(( (pagesWithBreadcrumb / pagesWithData) * 0.35 + (pagesWithMeta / pagesWithData) * 0.35 + (pagesWithEnoughLinks / pagesWithData) * 0.3 ) * 100) / 100
    : 0;

  const queue = [{ path: 'index.html', depth: 0 }];
  const visited = new Set(['index.html']);
  let maxDepth = 0;
  while (queue.length) {
    const { path: p, depth } = queue.shift();
    maxDepth = Math.max(maxDepth, depth);
    const links = pageToLinks.get(p);
    if (links) {
      for (const t of links) {
        if (allPages.has(t) && !visited.has(t)) {
          visited.add(t);
          queue.push({ path: t, depth: depth + 1 });
        }
      }
    }
  }
  const crawlDepthEstimate = maxDepth;
  const unreachableFromIndex = totalPages - visited.size;

  const criticalIssues = [
    orphanPages.length > 0 && 'orphan_pages',
    brokenInternalLinks.length > 0 && 'broken_internal_links',
    unreachableFromIndex > 0 && 'unreachable_from_index'
  ].filter(Boolean);

  const phase13_criteria = {
    broken_links: { required: PHASE13_BROKEN_LINKS_MAX, actual: brokenInternalLinks.length, pass: brokenInternalLinks.length <= PHASE13_BROKEN_LINKS_MAX },
    orphan_pages: { required: PHASE13_ORPHAN_COUNT_MAX, actual: orphanPages.length, pass: orphanPages.length <= PHASE13_ORPHAN_COUNT_MAX },
    pages_under_10_links: { required: ' < 5', actual: pagesUnder10Links.length, pass: pagesUnder10Links.length < 5 },
    missing_breadcrumb: { required: '0–2', actual: pagesMissingBreadcrumb.length, pass: pagesMissingBreadcrumb.length <= PHASE13_MISSING_BREADCRUMB_MAX },
    authority_coverage: { required: '≥' + PHASE13_AUTHORITY_COVERAGE_MIN, actual: authorityCoverageScore, pass: authorityCoverageScore >= PHASE13_AUTHORITY_COVERAGE_MIN },
    crawl_depth: { required: '≤' + PHASE13_CRAWL_DEPTH_MAX, actual: crawlDepthEstimate, pass: crawlDepthEstimate <= PHASE13_CRAWL_DEPTH_MAX },
    unreachable_from_index: { required: 0, actual: unreachableFromIndex, pass: unreachableFromIndex === 0 }
  };
  const phase13_readiness = Object.values(phase13_criteria).every(c => c.pass);

  const report = {
    generatedAt: new Date().toISOString(),
    total_pages: totalPages,
    orphan_pages: orphanPages.sort(),
    orphan_count: orphanPages.length,
    broken_internal_links: brokenInternalLinks.slice(0, 200),
    broken_internal_links_count: brokenInternalLinks.length,
    pages_with_under_10_internal_links: pagesUnder10Links.slice(0, 100),
    pages_under_10_links_count: pagesUnder10Links.length,
    pages_missing_breadcrumb_schema: pagesMissingBreadcrumb.slice(0, 100),
    pages_missing_breadcrumb_count: pagesMissingBreadcrumb.length,
    missing_hubs: missingHubs,
    duplicate_titles: duplicateTitles.slice(0, 50),
    duplicate_titles_count: duplicateTitles.length,
    pages_missing_meta_description: pagesMissingMetaDescription.slice(0, 100),
    pages_missing_meta_description_count: pagesMissingMetaDescription.length,
    pages_not_linked_from_hubs: pagesNotLinkedFromHubs.slice(0, 100),
    pages_not_linked_from_hubs_count: pagesNotLinkedFromHubs.length,
    avg_internal_links: avgInternalLinks,
    authority_coverage_score: authorityCoverageScore,
    crawl_depth_estimate: crawlDepthEstimate,
    unreachable_from_index: unreachableFromIndex,
    phase13_readiness,
    phase13_criteria,
    summary: {
      total_pages: totalPages,
      orphan_count: orphanPages.length,
      broken_links_count: brokenInternalLinks.length,
      under_10_links_count: pagesUnder10Links.length,
      missing_breadcrumb_count: pagesMissingBreadcrumb.length,
      missing_meta_count: pagesMissingMetaDescription.length,
      unreachable_count: unreachableFromIndex
    }
  };

  fs.writeFileSync(path.join(BUILD_DIR, 'phase1275-structure-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log('Phase 12.75 structure report written to build/phase1275-structure-report.json');
  console.log('Total pages:', totalPages);
  console.log('Orphan pages:', orphanPages.length);
  console.log('Broken internal links:', brokenInternalLinks.length);
  console.log('Pages with <10 internal links:', pagesUnder10Links.length);
  console.log('Pages missing breadcrumb schema:', pagesMissingBreadcrumb.length);
  console.log('Avg internal links:', avgInternalLinks);
  console.log('Authority coverage score:', authorityCoverageScore);
  console.log('Crawl depth estimate:', crawlDepthEstimate);
  console.log('Phase 13 readiness:', phase13_readiness);
}

runAudit();
