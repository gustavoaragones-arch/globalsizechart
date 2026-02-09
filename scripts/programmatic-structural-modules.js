/**
 * Shared structural modules for ALL programmatic page generators.
 * Ensures every generated page includes: Authority Links, Region Converters, Related Sizes Grid.
 * Uses utils/internalLinkBuilder.js for all hrefs (no hardcoded ../ or relative guesses).
 */

const internalLinkBuilder = require('../utils/internalLinkBuilder.js');

/**
 * Authority Links Section HTML.
 * Must include: brand-sizing-guide, shoe-size-pages, measurement-tools, shoe-sizing-guides, homepage.
 * @param {string} currentFile - Path of page being generated (relative to site root, e.g. 'programmatic-pages/eu-to-us-shoe-size.html')
 */
function getAuthorityLinksSectionHtml(currentFile) {
  const h = (t) => internalLinkBuilder.href(currentFile, t);
  return `<section class="content-section authority-links-block">
        <h2>Authority Links</h2>
        <ul class="hub-links">
          <li><a href="${h('index.html')}">Home</a></li>
          <li><a href="${h('brand-sizing-guide.html')}">Brand Sizing Guide</a></li>
          <li><a href="${h('shoe-size-pages.html')}">Shoe Size Pages</a></li>
          <li><a href="${h('measurement-tools.html')}">Measurement Tools</a></li>
          <li><a href="${h('shoe-sizing-guides.html')}">Shoe Sizing Guides</a></li>
        </ul>
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
  const items = slugs.map(l => `<li><a href="${internalLinkBuilder.href(currentFile, 'programmatic-pages/' + l.slug + '.html')}">${escapeHtml(l.label)} Shoe Size</a></li>`).join('\n          ');
  return `<section class="content-section region-converters-block">
        <h2>Region Converters</h2>
        <ul class="hub-links">
          ${items}
        </ul>
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
 * Related Sizes Grid HTML: ±1 size, same gender, same region.
 * @param {object} route - { from_region, to_region, size, gender, slug }
 * @param {object[]} allRoutes - list of routes with type, from_region, to_region, size, gender, slug
 * @param {function} getFromRegionLabel - (region) => string
 * @param {number} maxLinks - max links in grid (default 20)
 * @returns {string} HTML section or ''
 */
function getRelatedSizeGridHtml(route, allRoutes, getFromRegionLabel, maxLinks = 20) {
  const from = route.from_region;
  const to = route.to_region;
  const size = route.size;
  const gender = route.gender || 'men';
  const added = new Set();
  const items = [];

  function add(href, text) {
    if (added.has(href) || href === route.slug + '.html') return;
    added.add(href);
    items.push({ href, text });
  }

  // ±1 size, same gender, same region
  const samePair = (allRoutes || []).filter(
    r => (r.type === 'size_pair' || !r.type) && r.from_region === from && r.to_region === to && r.gender === gender
  );
  samePair.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
  const idx = samePair.findIndex(r => String(r.size) === String(size));
  if (idx >= 0) {
    if (idx > 0) add(samePair[idx - 1].slug + '.html', `${getFromRegionLabel(from)} ${samePair[idx - 1].size} to ${getFromRegionLabel(to)}`);
    if (idx < samePair.length - 1) add(samePair[idx + 1].slug + '.html', `${getFromRegionLabel(from)} ${samePair[idx + 1].size} to ${getFromRegionLabel(to)}`);
  }

  // Same region (other sizes, same from/to)
  const sameRegion = (allRoutes || []).filter(
    r => (r.type === 'size_pair' || !r.type) && r.from_region === from && r.to_region === to && r.slug !== route.slug
  );
  sameRegion.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
  for (const r of sameRegion) {
    if (items.length >= maxLinks) break;
    add(r.slug + '.html', `${getFromRegionLabel(from)} ${r.size} to ${getFromRegionLabel(to)}`);
  }

  // Same gender (other region pairs)
  const sameGender = (allRoutes || []).filter(
    r => (r.type === 'size_pair' || !r.type) && r.gender === gender && (r.from_region !== from || r.to_region !== to)
  );
  sameGender.sort((a, b) => `${a.from_region}-${a.to_region}`.localeCompare(`${b.from_region}-${b.to_region}`) || parseFloat(a.size) - parseFloat(b.size));
  for (const r of sameGender) {
    if (items.length >= maxLinks) break;
    add(r.slug + '.html', `${getFromRegionLabel(r.from_region)} ${r.size} to ${getFromRegionLabel(r.to_region)}`);
  }

  if (items.length === 0) return '';
  const gridLinks = items.map(it => `<a href="${it.href}">${escapeHtml(it.text)}</a>`).join('\n        ');
  return `<section class="related-size-grid">
  <h2>Explore Nearby Size Conversions</h2>
  <div class="grid">
        ${gridLinks}
  </div>
</section>`;
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
