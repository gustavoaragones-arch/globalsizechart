/**
 * Shared structural modules for ALL programmatic page generators.
 * Ensures every generated page includes: Authority Links, Region Converters, Related Sizes Grid.
 * Uses utils/internalLinkBuilder.js for all hrefs (no hardcoded ../ or relative guesses).
 */

const internalLinkBuilder = require('../utils/internalLinkBuilder.js');
const { QUICK_CONVERTERS_HTML } = require('./lib/quick-converters-snippet');

/**
 * Authority Links Section HTML.
 * Must include: brand-sizing-guide, shoe-size-pages, measurement-tools, shoe-sizing-guides, homepage.
 * @param {string} currentFile - Path of page being generated (relative to site root, e.g. 'programmatic-pages/eu-to-us-shoe-size.html')
 */
function getAuthorityLinksSectionHtml(currentFile) {
  const h = (t) => internalLinkBuilder.href(currentFile, t);
  const tile = (path, label) =>
    `<a class="nav-card" href="${escapeHtml(h(path))}"><span class="nav-card__label">${escapeHtml(label)}</span></a>`;
  return `<section class="content-section authority-links-block">
        <h2>Key navigation</h2>
        <div class="card-grid nav-card-grid">
          ${tile('index.html', 'Home')}
          ${tile('brand-sizing-guide.html', 'Brand sizing guide')}
          ${tile('shoe-size-pages.html', 'Shoe size pages')}
          ${tile('measurement-tools.html', 'Measurement tools')}
          ${tile('shoe-sizing-guides.html', 'Shoe sizing guides')}
        </div>
      </section>`;
}

/**
 * Region Converter Links Section HTML.
 * Must include: eu-to-us-shoe-size, us-to-eu-shoe-size, us-to-uk-shoe-size, uk-to-us-shoe-size, cm-to-us-shoe-size, japan-to-us-shoe-size.
 * @param {string} currentFile - Path of page being generated (e.g. 'programmatic-pages/eu-to-us-shoe-size.html')
 */
function getRegionConvertersSectionHtml(currentFile) {
  const slugs = [
    { slug: 'eu-to-us-shoe-size', label: 'EU to US' },
    { slug: 'us-to-eu-shoe-size', label: 'US to EU' },
    { slug: 'us-to-uk-shoe-size', label: 'US to UK' },
    { slug: 'uk-to-us-shoe-size', label: 'UK to US' },
    { slug: 'uk-to-eu-shoe-size', label: 'UK to EU' },
    { slug: 'cm-to-us-shoe-size', label: 'CM to US' },
    { slug: 'cm-to-eu-shoe-size', label: 'CM to EU' },
    { slug: 'cm-to-uk-shoe-size', label: 'CM to UK' },
    { slug: 'inch-to-us-shoe-size', label: 'Inch to US' },
    { slug: 'inch-to-eu-shoe-size', label: 'Inch to EU' },
    { slug: 'japan-to-us-shoe-size', label: 'Japan to US' },
    { slug: 'japan-to-eu-shoe-size', label: 'Japan to EU' },
    { slug: 'eu-to-japan-shoe-size', label: 'EU to Japan' },
    { slug: 'us-to-japan-shoe-size', label: 'US to Japan' },
    { slug: 'china-to-us-shoe-size', label: 'China to US' },
    { slug: 'china-to-eu-shoe-size', label: 'China to EU' },
    { slug: 'korea-cm-to-us', label: 'Korea to US' }
  ];
  const items = slugs
    .map(
      (l) =>
        `<a class="nav-card" href="${escapeHtml(internalLinkBuilder.href(currentFile, 'programmatic-pages/' + l.slug + '.html'))}"><span class="nav-card__label">${escapeHtml(l.label)} shoe size</span></a>`
    )
    .join('\n          ');
  return `<section class="content-section region-converters-block">
        <h2>Regional &amp; conversion pages</h2>
        <div class="card-grid nav-card-grid">
          ${items}
        </div>
      </section>`;
}

function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Canonical Quick Converters card grid (replaces dynamic related-size grid).
 */
function getRelatedSizeGridHtml(_route, _allRoutes, _getFromRegionLabel, _maxLinks = 20) {
  return QUICK_CONVERTERS_HTML;
}

// --- Breadcrumb (Step 4): Home > Shoe Converter > Region > Size Pair ---
const REGION_NAMES = { US: 'US', UK: 'UK', EU: 'EU', JP: 'Japan', CN: 'China', CM: 'CM' };
function getFromRegionLabel(region) {
  return REGION_NAMES[region] || region;
}
function getRegionSlugSegment(region) {
  const map = { EU: 'eu', US: 'us', UK: 'uk', JP: 'japan', CM: 'cm', CN: 'china' };
  return map[region] || (region && region.toLowerCase()) || region;
}

/**
 * Build programmatic breadcrumb: Home > Shoe Converter > Region > Size Pair (or 3 levels for region/category).
 * @param {object} route - { type, from_region, to_region, size, gender, slug }
 * @param {string} fileName - output filename (e.g. eu-42-to-us-shoe-size.html)
 * @param {string} baseUrl - e.g. https://globalsizechart.com
 * @returns {{ html: string, jsonLd: string }}
 */
function buildProgrammaticBreadcrumb(route, fileName, baseUrl) {
  const items = [
    { name: 'Home', url: `${baseUrl}/` },
    { name: 'Shoe Converter', url: `${baseUrl}/shoe-size-converter.html` }
  ];

  if (route.type === 'region') {
    const fromLabel = getFromRegionLabel(route.from_region);
    const toLabel = getFromRegionLabel(route.to_region);
    items.push({ name: `${fromLabel} to ${toLabel}`, url: `${baseUrl}/programmatic-pages/${fileName}` });
  } else if (route.type === 'category') {
    const genderCap = route.gender === 'men' ? "Men's" : route.gender === 'women' ? "Women's" : "Kids'";
    items.push({ name: `${genderCap} Shoe Size Converter`, url: `${baseUrl}/programmatic-pages/${fileName}` });
  } else {
    const fromLabel = getFromRegionLabel(route.from_region);
    const toLabel = getFromRegionLabel(route.to_region);
    const regionSlug = `${getRegionSlugSegment(route.from_region)}-to-${getRegionSlugSegment(route.to_region)}-shoe-size`;
    items.push({ name: `${fromLabel} to ${toLabel}`, url: `${baseUrl}/programmatic-pages/${regionSlug}.html` });
    items.push({ name: `${fromLabel} ${route.size} to ${toLabel}`, url: `${baseUrl}/programmatic-pages/${fileName}` });
  }

  const link = (item, i) => {
    if (i === items.length - 1) return `<span>${escapeHtml(item.name)}</span>`;
    let href;
    if (item.url === `${baseUrl}/`) href = '/';
    else if (item.url === `${baseUrl}/shoe-size-converter.html`) href = '/shoe-size-converter.html';
    else if (item.url.startsWith(`${baseUrl}/programmatic-pages/`)) href = '/programmatic-pages/' + item.url.replace(`${baseUrl}/programmatic-pages/`, '');
    else href = item.url.replace(baseUrl, '') || '/';
    return `<a href="${escapeHtml(href)}">${escapeHtml(item.name)}</a>`;
  };
  const html = '<nav class="breadcrumbs" aria-label="Breadcrumb">' + items.map((item, i) => link(item, i)).join(' &gt; ') + '</nav>';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url
    }))
  };
  return { html, jsonLd: JSON.stringify(jsonLd) };
}

/**
 * Build BreadcrumbList JSON-LD from an array of { name, url }.
 * Use for semantic, hub, brand, tools pages that define their own trail.
 */
function getBreadcrumbJsonLd(items, baseUrl) {
  const fullItems = items.map(it => ({
    name: it.name,
    url: it.url.startsWith('http') ? it.url : (baseUrl ? baseUrl.replace(/\/$/, '') + (it.url.startsWith('/') ? it.url : '/' + it.url) : it.url)
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: fullItems.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url
    }))
  };
}

module.exports = {
  getAuthorityLinksSectionHtml,
  getRegionConvertersSectionHtml,
  getRelatedSizeGridHtml,
  escapeHtml,
  buildProgrammaticBreadcrumb,
  getBreadcrumbJsonLd,
  getFromRegionLabel,
  getRegionSlugSegment
};
