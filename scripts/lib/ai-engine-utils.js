/**
 * Shared helpers for AI citation engine scripts.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const IGNORE_DIRS = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components', 'data']);

function walkHtmlFiles(dir = '.', prefix = '') {
  const out = [];
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return out;
  for (const ent of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
    if (ent.isDirectory()) {
      if (IGNORE_DIRS.has(ent.name)) continue;
      out.push(...walkHtmlFiles(path.join(dir, ent.name), rel));
    } else if (ent.isFile() && ent.name.endsWith('.html')) {
      out.push(rel.replace(/\\/g, '/'));
    }
  }
  return out;
}

/** Lowercase, collapse whitespace, remove most punctuation for pattern keys */
function normalizePattern(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Web path from project-relative html path */
function relPathToUrlPath(rel) {
  const n = rel.replace(/\\/g, '/');
  if (n === 'index.html') return '/';
  if (n.endsWith('/index.html')) return '/' + n.slice(0, -11) + '/';
  return '/' + n;
}

module.exports = {
  ROOT,
  IGNORE_DIRS,
  walkHtmlFiles,
  normalizePattern,
  stripTags,
  relPathToUrlPath,
};
