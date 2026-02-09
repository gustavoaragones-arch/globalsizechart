#!/usr/bin/env node
/**
 * Missing Page Detector
 *
 * Parses all HTML under the site root, extracts internal links that point to
 * programmatic-pages/, measurement/, or converters/, and compares against
 * actually generated files. Outputs build/missing-pages.json with missing
 * targets grouped by type:
 *   - measurement_converters
 *   - region_converters
 *   - gender_converters
 *   - kids_converters
 *   - semantic_converters
 *   - other
 *
 * Usage: node scripts/missing-programmatic-pages.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'build');

const EXCLUDE_DIRS = new Set(['programmatic', 'components', 'sitemaps', 'config', 'data', 'build', 'scripts', 'node_modules']);

/** Paths we care about: linked-to directories that should have generated pages. */
const TARGET_PREFIXES = ['programmatic-pages/', 'measurement/', 'converters/', 'semantic/'];

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

/** True if target path is one we track (programmatic-pages, measurement, converters, semantic). */
function isTrackedPath(relPath) {
  return TARGET_PREFIXES.some(prefix => relPath === prefix.slice(0, -1) || relPath.startsWith(prefix));
}

/**
 * Classify a missing target into a template type for reporting.
 * @param {string} relPath - e.g. "programmatic-pages/cm-to-eu-shoe-size.html", "measurement/24-cm-to-us-shoe-size.html"
 */
function classifyMissing(relPath) {
  if (relPath.startsWith('measurement/')) return 'measurement_converters';
  if (relPath.startsWith('semantic/')) return 'semantic_converters';
  if (relPath.startsWith('converters/')) return 'region_converters'; // treat converters as region hub-style

  if (relPath.startsWith('programmatic-pages/')) {
    const slug = relPath.replace('programmatic-pages/', '').replace(/\.html$/, '');
    if (/-kids$/.test(slug) || /^kids-/.test(slug)) return 'kids_converters';
    if (/-women$/.test(slug) || /-men$/.test(slug)) return 'gender_converters';
    // Region converter: hub-style slug like eu-to-us-shoe-size, us-to-eu-shoe-size, cm-to-eu-shoe-size, japan-to-us-shoe-size (no size number)
    if (/^(eu|us|uk|cm|japan|china)-to-(eu|us|uk|japan|china)-shoe-size$/i.test(slug)) return 'region_converters';
    if (/^[a-z]+-to-[a-z]+-shoe-size$/i.test(slug) && !/\d/.test(slug)) return 'region_converters';
    return 'other';
  }

  return 'other';
}

function run() {
  ensureDir(BUILD_DIR);

  const allPages = new Set();
  const files = listHtmlFiles(ROOT);
  for (const f of files) {
    const rel = toRelPath(f);
    if (!rel.includes('programmatic/templates')) allPages.add(rel);
  }

  const missingByType = {
    measurement_converters: [],
    region_converters: [],
    gender_converters: [],
    kids_converters: [],
    semantic_converters: [],
    other: []
  };
  const missingSet = new Set();
  const referrers = new Map(); // missingPath -> [ fromRelPath, ... ]

  for (const rel of allPages) {
    const absPath = path.join(ROOT, rel);
    let html;
    try {
      html = fs.readFileSync(absPath, 'utf8');
    } catch (e) {
      continue;
    }
    const links = getInternalLinks(html, rel);
    for (const target of links) {
      if (!isTrackedPath(target)) continue;
      if (allPages.has(target)) continue;
      if (!missingSet.has(target)) {
        missingSet.add(target);
        const type = classifyMissing(target);
        missingByType[type].push(target);
      }
      if (!referrers.has(target)) referrers.set(target, []);
      referrers.get(target).push(rel);
    }
  }

  // Dedupe and sort each type
  for (const key of Object.keys(missingByType)) {
    missingByType[key] = [...new Set(missingByType[key])].sort();
  }

  const missingList = [...missingSet].sort();
  const report = {
    generatedAt: new Date().toISOString(),
    totalGeneratedPages: allPages.size,
    missingCount: missingList.length,
    missingByType,
    missingPages: missingList,
    referrers: missingList.reduce((acc, p) => {
      acc[p] = referrers.get(p) || [];
      return acc;
    }, {})
  };

  const outPath = path.join(BUILD_DIR, 'missing-pages.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('Missing page report written to', outPath);
  console.log('Total missing (tracked):', report.missingCount);
  console.log('By type:', Object.entries(missingByType).map(([k, v]) => `${k}: ${v.length}`).join(', '));
}

run();
