/**
 * Universal Breadcrumb Engine
 * Derives hierarchy (Home > Section > Subsection > Page) from a page path.
 * Used with components/breadcrumbs.html and breadcrumb-middleware.js to inject breadcrumbs.
 *
 * Examples:
 *   legal/content-policy.html     → Home > Legal > Content Policy
 *   semantic/how-to-measure-feet-cm.html → Home > Measurement Guides > How to Measure Feet in CM
 */

const path = require('path');
const BASE_URL = 'https://globalsizechart.com';

/** Humanize filename: "content-policy.html" → "Content Policy", "how-to-measure-feet-cm" → "How to Measure Feet in CM" */
function pageNameFromPath(relPath) {
  const base = path.basename(relPath, '.html');
  return base
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Map path to breadcrumb hierarchy.
 * @param {string} relPath - Page path relative to site root (e.g. "legal/content-policy.html", "semantic/how-to-measure-feet-cm.html")
 * @returns {{ name: string, url: string }[]} hierarchy for Home > Section > Subsection > Page
 */
function hierarchyFromPath(relPath) {
  const norm = (relPath || '').replace(/\\/g, '/').replace(/^\/+/, '');
  const pageName = pageNameFromPath(norm);
  const pageUrl = BASE_URL + '/' + norm;

  const home = { name: 'Home', url: BASE_URL + '/' };

  if (norm.startsWith('legal/')) {
    return [
      home,
      { name: 'Legal', url: BASE_URL + '/legal/about.html' },
      { name: pageName, url: pageUrl }
    ];
  }

  if (norm.startsWith('semantic/') || norm.startsWith('guides/')) {
    return [
      home,
      { name: 'Measurement Guides', url: BASE_URL + '/shoe-sizing-guides.html' },
      { name: pageName, url: pageUrl }
    ];
  }

  if (norm.startsWith('measurement/')) {
    return [
      home,
      { name: 'Measurement Tools', url: BASE_URL + '/measurement-tools.html' },
      { name: pageName, url: pageUrl }
    ];
  }

  if (norm.startsWith('clothing/')) {
    return [
      home,
      { name: 'Clothing Converter', url: BASE_URL + '/clothing-size-converter.html' },
      { name: pageName, url: pageUrl }
    ];
  }

  if (norm.startsWith('programmatic-pages/')) {
    return [
      home,
      { name: 'Shoe Size Pages', url: BASE_URL + '/shoe-size-pages.html' },
      { name: pageName, url: pageUrl }
    ];
  }

  if (norm.startsWith('brands/')) {
    return [
      home,
      { name: 'Brand Size Guides', url: BASE_URL + '/brand-size-guides.html' },
      { name: pageName, url: pageUrl }
    ];
  }

  if (norm.startsWith('printable/')) {
    return [
      home,
      { name: 'Printable Guides', url: BASE_URL + '/printable-size-guides.html' },
      { name: pageName, url: pageUrl }
    ];
  }

  if (norm.startsWith('tools/')) {
    return [
      home,
      { name: 'Measurement Tools', url: BASE_URL + '/measurement-tools.html' },
      { name: pageName, url: pageUrl }
    ];
  }

  const rootConverters = [
    'cm-to-us-shoe-size.html',
    'us-to-eu-size.html',
    'uk-to-us-size.html'
  ];
  if (rootConverters.includes(norm) || rootConverters.some(c => norm.endsWith('/' + c))) {
    return [
      home,
      { name: 'Converters', url: BASE_URL + '/shoe-size-converter.html' },
      { name: pageName, url: pageUrl }
    ];
  }

  return [home, { name: pageName, url: pageUrl }];
}

/**
 * Get relative href from current page (relPath) to target path (pathFromRoot).
 * Uses forward slashes for URLs.
 */
function relativeHref(relPath, pathFromRoot) {
  const fromDir = path.dirname(relPath).replace(/\\/g, '/');
  const to = (pathFromRoot || 'index.html').replace(/\\/g, '/');
  if (!fromDir || fromDir === '.') return to || 'index.html';
  const fromParts = fromDir.split('/');
  const toParts = to.split('/');
  let i = 0;
  while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) i++;
  const up = fromParts.length - i;
  const down = toParts.slice(i);
  const out = [...Array(up).fill('..'), ...down].join('/');
  return out || 'index.html';
}

/**
 * Render nav HTML for the breadcrumb (relative hrefs from a given base path).
 * @param {string} relPath - Page path (used to compute relative hrefs)
 * @param {{ name: string, url: string }[]} hierarchy - From hierarchyFromPath
 * @returns {string} <nav> inner HTML
 */
function renderBreadcrumbNav(relPath, hierarchy) {
  const parts = [];
  hierarchy.forEach((item, i) => {
    const isLast = i === hierarchy.length - 1;
    const pathFromRoot = item.url.replace(BASE_URL, '').replace(/^\//, '') || '';
    const relHref = relativeHref(relPath, pathFromRoot || 'index.html');
    if (isLast) {
      parts.push('<span>' + escapeHtml(item.name) + '</span>');
    } else {
      parts.push('<a href="' + escapeHtml(relHref) + '">' + escapeHtml(item.name) + '</a>');
    }
  });
  return parts.join(' &gt; ');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  hierarchyFromPath,
  pageNameFromPath,
  renderBreadcrumbNav,
  BASE_URL
};
