/**
 * Centralized internal link builder for all generators.
 * All internal hrefs must be built via resolveInternalPath(currentFile, targetFile).
 * No hardcoded ../ or absolute relative guesses; supports nested directories.
 *
 * Paths are relative to site root: e.g. "index.html", "brands/nike.html", "programmatic-pages/eu-to-us-shoe-size.html".
 */

const path = require('path');

/**
 * Resolve the relative href from currentFile to targetFile.
 * Both are paths relative to site root (e.g. "brands/adidas.html", "clothing/mens-medium-us-to-eu.html").
 * Returns a relative href suitable for use in the current page (e.g. "../clothing/mens-medium-us-to-eu.html").
 *
 * @param {string} currentFile - Path of the page being generated (relative to site root)
 * @param {string} targetFile - Path of the target page (relative to site root)
 * @returns {string} Relative href from current page to target
 */
function resolveInternalPath(currentFile, targetFile) {
  if (!targetFile || typeof targetFile !== 'string') return '#';
  const target = normalizeInternalHref(targetFile);
  if (!target) return '#';
  const fromDir = path.dirname(currentFile.replace(/\//g, path.sep));
  const rel = path.relative(fromDir, target.replace(/\//g, path.sep));
  return rel.replace(/\\/g, '/');
}

/**
 * Normalize a href or target path to a consistent root-relative form (no leading slash).
 * Use for targets before passing to resolveInternalPath, or to compare/canonicalize.
 *
 * @param {string} href - Href or path (e.g. "/shoe-size-converter.html", "shoe-size-converter.html", "/")
 * @returns {string} Root-relative path (e.g. "shoe-size-converter.html", "index.html")
 */
function normalizeInternalHref(href) {
  if (!href || typeof href !== 'string') return '';
  let s = href.trim().replace(/#.*$/, '');
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('mailto:') || s.startsWith('tel:')) return '';
  if (s.startsWith('/')) s = s.slice(1) || 'index.html';
  s = s.replace(/\\/g, '/');
  if (s === '' || s === '.') return 'index.html';
  if (!s.endsWith('.html') && !s.includes('.')) return s + '.html';
  return s;
}

/**
 * Build href for a target from the current output file. Convenience wrapper.
 * @param {string} currentFile - Path of page being generated (relative to site root)
 * @param {string} targetPath - Target path (root-relative or slash-prefixed)
 * @returns {string} Relative href
 */
function href(currentFile, targetPath) {
  const target = normalizeInternalHref(targetPath);
  return target ? resolveInternalPath(currentFile, target) : '#';
}

module.exports = {
  resolveInternalPath,
  normalizeInternalHref,
  href
};
