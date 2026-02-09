#!/usr/bin/env node
/**
 * Prebuild Link Validation — BUILD GUARD
 *
 * Runs before build finishes. Detects internal links that point to missing pages.
 * Allows only: external links (http/https/mailto/tel), anchor links (#).
 * FAILs the build if 10 or more missing targets are detected.
 *
 * Can be run standalone: node scripts/prebuild-link-validation.js
 * Or required and run() called after generate-all-pages.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXCLUDE_DIRS = new Set(['programmatic', 'components', 'sitemaps', 'config', 'data', 'build', 'scripts', 'node_modules']);
const MISSING_THRESHOLD = 10;

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

/** Resolve href from a page at fromRelPath. Returns path relative to ROOT or null if external/anchor-only. */
function resolveHref(href, fromRelPath) {
  let raw = (href || '').trim();
  const hashIndex = raw.indexOf('#');
  if (hashIndex >= 0) raw = raw.slice(0, hashIndex);
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return null;
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

function run() {
  const allPages = new Set();
  const files = listHtmlFiles(ROOT);
  for (const f of files) {
    const rel = toRelPath(f);
    if (!rel.includes('programmatic/templates')) allPages.add(rel);
  }

  const missingTargets = new Set();
  const brokenPairs = [];

  for (const rel of allPages) {
    const absPath = path.join(ROOT, rel);
    let html;
    try {
      html = fs.readFileSync(absPath, 'utf8');
    } catch (_) {
      continue;
    }
    const links = getInternalLinks(html, rel);
    for (const target of links) {
      if (!allPages.has(target)) {
        missingTargets.add(target);
        brokenPairs.push({ from: rel, to: target });
      }
    }
  }

  const count = missingTargets.size;
  if (count >= MISSING_THRESHOLD) {
    console.error('mathematica');
    console.error('BUILD BLOCKED — Missing Programmatic Pages Detected');
    console.error('Missing targets: ' + count + ' (threshold: ' + MISSING_THRESHOLD + ')');
    const sample = [...missingTargets].slice(0, 20);
    sample.forEach(t => console.error('  - ' + t));
    if (missingTargets.size > 20) console.error('  ... and ' + (missingTargets.size - 20) + ' more');
    return false;
  }

  if (count > 0) {
    console.log('Prebuild link validation: ' + count + ' missing target(s) (below threshold ' + MISSING_THRESHOLD + '). Build allowed.');
  } else {
    console.log('Prebuild link validation: OK (0 missing targets).');
  }
  return true;
}

if (require.main === module) {
  if (!run()) process.exit(1);
  process.exit(0);
}

module.exports = { run };
