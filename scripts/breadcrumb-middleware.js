/**
 * Breadcrumb JSON-LD injection middleware.
 * injectBreadcrumbs(pageType, hierarchy) — build BreadcrumbList schema and optional HTML injection.
 *
 * Apply to: legal, guides, measurement tools, clothing authority pages (5 pages only).
 */

const BASE_URL = 'https://globalsizechart.com';

/**
 * Normalize URL to absolute for JSON-LD.
 * @param {string} url - Relative path (e.g. "index.html") or absolute URL.
 * @returns {string}
 */
function toAbsoluteUrl(url) {
  if (!url) return BASE_URL + '/';
  const u = url.trim();
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  const path = u.startsWith('/') ? u : '/' + u;
  return BASE_URL.replace(/\/$/, '') + path;
}

/**
 * Build BreadcrumbList JSON-LD and script tag from a hierarchy.
 * @param {string} pageType - One of: 'legal' | 'guides' | 'measurement_tools' | 'clothing_authority'
 * @param {Array<{ name: string, url: string }>} hierarchy - Trail from home to current page (urls can be relative or absolute).
 * @returns {{ jsonLd: object, jsonLdScript: string }}
 */
function injectBreadcrumbs(pageType, hierarchy) {
  const items = (hierarchy || []).map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: toAbsoluteUrl(item.url)
  }));
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items
  };
  const jsonLdScript = '<script type="application/ld+json">' + JSON.stringify(jsonLd) + '</script>';
  return { jsonLd, jsonLdScript };
}

/**
 * Inject or replace BreadcrumbList JSON-LD in HTML.
 * If a BreadcrumbList script exists, replace it; otherwise insert before </head>.
 * @param {string} html - Full page HTML.
 * @param {string} pageType - For logging; passed to injectBreadcrumbs.
 * @param {Array<{ name: string, url: string }>} hierarchy - Breadcrumb trail.
 * @returns {string} Modified HTML.
 */
function injectBreadcrumbsIntoHtml(html, pageType, hierarchy) {
  const { jsonLdScript } = injectBreadcrumbs(pageType, hierarchy);
  const breadcrumbListRegex = /<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>[\s\S]*?"@type"\s*:\s*"BreadcrumbList"[\s\S]*?<\/script>/i;
  if (breadcrumbListRegex.test(html)) {
    return html.replace(breadcrumbListRegex, jsonLdScript);
  }
  const beforeHeadClose = html.indexOf('</head>');
  if (beforeHeadClose >= 0) {
    return html.slice(0, beforeHeadClose) + '\n  ' + jsonLdScript + '\n' + html.slice(beforeHeadClose);
  }
  return html;
}

module.exports = {
  injectBreadcrumbs,
  injectBreadcrumbsIntoHtml,
  toAbsoluteUrl,
  BASE_URL
};
