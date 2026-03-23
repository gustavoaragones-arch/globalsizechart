/**
 * Phase 21 — Crawl budget: priority tiers for sitemaps and internal linking.
 * urlPath: leading slash, from relPathToUrlPath(rel) e.g. /shoe-size-converter.html
 */

/** Suffix match (not substring) so /programmatic-pages/cm-to-us-shoe-size.html stays low */
const HIGH_FILE_SUFFIXES = [
  '/shoe-size-converter.html',
  '/us-to-eu-size.html',
  '/cm-to-us-shoe-size.html',
];

const HIGH_PRIORITY = [...HIGH_FILE_SUFFIXES, '/shoe-size-conversions/'];

/**
 * @param {string} urlPath - e.g. /programmatic-pages/foo.html
 * @returns {'high'|'medium'|'low'}
 */
function getPriorityTier(urlPath) {
  const p = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;

  // Long-tail programmatic first — do not let shared filenames match “high” tools
  if (p.includes('/programmatic-pages/')) {
    return 'low';
  }

  if (p.includes('/shoe-size-conversions/')) {
    return 'high';
  }

  if (HIGH_FILE_SUFFIXES.some((suf) => p.endsWith(suf))) {
    return 'high';
  }

  if (p.includes('/measurement/') || p.includes('/brands/')) {
    return 'medium';
  }

  return 'medium';
}

/**
 * Sitemap changefreq hint (legacy; still emitted for crawlers that read it).
 * @param {'high'|'medium'|'low'} tier
 */
function getChangeFreq(tier) {
  if (tier === 'high') return 'daily';
  if (tier === 'medium') return 'weekly';
  return 'monthly';
}

/**
 * Lastmod: high-tier URLs get “today” for a stronger freshness signal; others use file mtime (ms).
 * @param {'high'|'medium'|'low'} tier
 * @param {number} mtimeMs
 * @param {number} [nowMs]
 */
function getLastmodForTier(tier, mtimeMs, nowMs = Date.now()) {
  if (tier === 'high') return nowMs;
  return mtimeMs;
}

/** Align with inject-noindex-longtail.js — omit from XML sitemaps */
function shouldNoindexLongtail(urlPath) {
  const p = String(urlPath).toLowerCase();
  return p.includes('kids') && p.includes('cm-');
}

module.exports = {
  HIGH_PRIORITY,
  HIGH_FILE_SUFFIXES,
  getPriorityTier,
  getChangeFreq,
  getLastmodForTier,
  shouldNoindexLongtail,
};
