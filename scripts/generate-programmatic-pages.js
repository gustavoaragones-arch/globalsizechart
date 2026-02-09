#!/usr/bin/env node
/**
 * GlobalSizeChart.com — Static Programmatic Page Generator
 *
 * Reads size data JSON (shoe_sizes, programmatic_routes) and builds static HTML
 * with: prefilled converter, contextual explanation, fit guide snippet,
 * measurement guide snippet, dynamic FAQ, JSON-LD schema, related links, canonical.
 *
 * Usage: node scripts/generate-programmatic-pages.js
 */

const fs = require('fs');
const path = require('path');
const structuralModules = require('./programmatic-structural-modules.js');
const internalLinkBuilder = require('../utils/internalLinkBuilder.js');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_DIR = path.join(ROOT, 'config');
const DATA_DIR = path.join(ROOT, 'data');
const TEMPLATES_DIR = path.join(ROOT, 'programmatic', 'templates');
const OUTPUT_DIR = path.join(ROOT, 'programmatic-pages');
const SEMANTIC_DIR = path.join(ROOT, 'semantic');
const CLOTHING_DIR = path.join(ROOT, 'clothing');
const BRANDS_DIR = path.join(ROOT, 'brands');
const MEASUREMENT_DIR = path.join(ROOT, 'measurement');
const PRINTABLE_DIR = path.join(ROOT, 'printable');
const TOOLS_DIR = path.join(ROOT, 'tools');
const SITEMAPS_DIR = path.join(ROOT, 'sitemaps');
const BASE_URL = 'https://globalsizechart.com';
const ORGANIZATION_ID = `${BASE_URL}/#organization`;
const WEBSITE_ID = `${BASE_URL}/#website`;
const CONTACT_EMAIL = 'contact@globalsizechart.com';
const LOGO_URL = `${BASE_URL}/logo.png`;
const MAX_URLS_PER_SITEMAP = 500;

/** Schema trust: Organization (name, logo, contact email, sameAs optional). */
function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'GlobalSizeChart.com',
    url: BASE_URL,
    logo: LOGO_URL,
    email: CONTACT_EMAIL
    // sameAs: [] — optional, add when social profiles exist
  };
}

/** Schema trust: WebSite (publisher references Organization). */
function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: 'GlobalSizeChart.com',
    url: BASE_URL,
    publisher: { '@id': ORGANIZATION_ID }
  };
}

/** Schema trust: WebPage with publisher and isPartOf references. */
function getWebPageSchema(options) {
  const { name, description, url } = options;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: name || 'GlobalSizeChart.com',
    ...(description && { description }),
    url: url || BASE_URL,
    publisher: { '@id': ORGANIZATION_ID },
    isPartOf: { '@id': WEBSITE_ID }
  };
}

// Phase 8: current page types. Phase 8.5: future types (architecture only, no pages generated yet).
// programmatic_routes.json may include: type (region|category|size_pair|brand_converter|cm_measurement|printable_guide|interactive_tool), category (shoes|clothing), brand, measurement_type, printable, interactive.
const PHASE8_TYPES = new Set(['region', 'category', 'size_pair']);
const PHASE85_TYPES = new Set(['brand_converter', 'cm_measurement', 'printable_guide', 'interactive_tool']);

const REGION_LABELS = {
  US: 'United States (US)',
  UK: 'United Kingdom (UK)',
  EU: 'European Union (EU)',
  JP: 'Japan (JP)',
  CN: 'China (CN)',
  CM: 'Centimeters (CM)',
  KR: 'Korea (KR)',
  INCH: 'Inch'
};

const REGION_NAMES = {
  US: 'US',
  UK: 'UK',
  EU: 'EU',
  JP: 'Japan',
  CN: 'China',
  CM: 'CM',
  KR: 'Korea',
  INCH: 'Inch'
};

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function findShoeConversion(shoeData, gender, fromRegion, size) {
  const genderData = shoeData[gender];
  if (!genderData) return null;
  const fromKey = fromRegion.toLowerCase();
  const sizeNum = parseFloat(size);
  for (const row of genderData) {
    const val = row[fromKey];
    if (val === undefined) continue;
    const rowNum = parseFloat(val);
    if (!isNaN(sizeNum) && !isNaN(rowNum) && Math.abs(rowNum - sizeNum) < 0.01) return row;
    if (String(val) === String(size)) return row;
  }
  return null;
}

function getTargetSize(row, toRegion) {
  if (!row) return null;
  const key = toRegion.toLowerCase();
  const v = row[key];
  return v !== undefined ? (typeof v === 'number' && v % 1 !== 0 ? v : v) : null;
}

function buildGenderOptions(selected) {
  const options = [
    { value: 'men', label: 'Men' },
    { value: 'women', label: 'Women' },
    { value: 'kids', label: 'Kids' }
  ];
  return options.map(o => `<option value="${o.value}"${o.value === selected ? ' selected' : ''}>${o.label}</option>`).join('\n            ');
}

function buildFromRegionOptions(selected) {
  return Object.entries(REGION_LABELS)
    .map(([code, label]) => `<option value="${code}"${code === selected ? ' selected' : ''}>${label}</option>`)
    .join('\n            ');
}

function getFromRegionLabel(region) {
  return REGION_NAMES[region] || region;
}

function getGenderLabel(gender) {
  return { men: "men's", women: "women's", kids: "kids'" }[gender] || "men's";
}

/** Region slug segment used in programmatic routes (e.g. eu, japan, cm). */
function getRegionSlugSegment(region) {
  const map = { EU: 'eu', US: 'us', UK: 'uk', JP: 'japan', CM: 'cm', CN: 'china' };
  return map[region] || region.toLowerCase();
}

/** Build breadcrumb: Home > Shoe Converter > Region > Size Pair (shared module). */
function buildBreadcrumb(route, fileName) {
  return structuralModules.buildProgrammaticBreadcrumb(route, fileName, BASE_URL);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildConversionExplanation(route, toSize, fromLabel, toLabel, genderLabel) {
  const size = route.size;
  if (toSize !== null && toSize !== undefined) {
    return `${fromLabel} size ${size} converts approximately to ${toLabel} ${genderLabel} size ${toSize}. Use the converter above to see all regional equivalents and confirm your fit.`;
  }
  return `${fromLabel} size ${size} can be converted to ${toLabel} sizes using the tool above. Sizing varies by brand; always check the brand's size chart when possible.`;
}

function buildFitGuideSnippet(fromLabel, toLabel) {
  return `
        <p>Fit can vary by brand and style:</p>
        <ul>
          <li><strong>European brands</strong> often run slightly narrower; consider half a size up if you have wide feet.</li>
          <li><strong>US and UK sizes</strong> may offer more width options (N, M, W).</li>
          <li><strong>Asian sizing (JP/CN)</strong> typically runs smaller—sizing up is common when converting from ${fromLabel} or ${toLabel}.</li>
        </ul>
        <p>When in doubt, check the brand's size chart or order two sizes and return one.</p>`;
}

function buildFaqContent(route, toSize, fromLabel, toLabel) {
  const size = route.size;
  const toSizeStr = toSize != null ? String(toSize) : '—';
  const q1 = `What is ${fromLabel} ${size} in ${toLabel} shoes?`;
  const a1 = toSize != null
    ? `${fromLabel} size ${size} typically converts to ${toLabel} size ${toSizeStr}. Use the converter above for your exact gender and to see other regions.`
    : `Use the converter above to find your ${toLabel} equivalent. Select your gender and enter ${fromLabel} size ${size} for accurate results.`;

  const q2 = `Is ${fromLabel} sizing bigger than ${toLabel}?`;
  const a2 = fromLabel === 'EU' && toLabel === 'US'
    ? 'EU shoe sizes are typically 1–1.5 sizes larger than US. So EU 42 is about US 9 for men. Other region pairs have different offsets.'
    : `${fromLabel} and ${toLabel} use different scales. The converter above gives the exact equivalent; sizes are not directly comparable.`;

  const q3 = 'Are shoe sizes standardized?';
  const a3 = sanitizeForApprovalMode('No. Shoe sizes vary by country and brand. Conversion charts give approximate equivalents; always check the brand\'s size chart when buying.');

  const q4 = 'Should I size up or down?';
  const a4 = sanitizeForApprovalMode('It depends on the brand. European and Asian brands often run smaller. If between sizes or buying athletic shoes, consider sizing up. Check reviews and the brand\'s fit guide.');

  return `
        <div class="faq-item">
          <h3>${q1}</h3>
          <p>${a1}</p>
        </div>
        <div class="faq-item">
          <h3>${q2}</h3>
          <p>${a2}</p>
        </div>
        <div class="faq-item">
          <h3>${q3}</h3>
          <p>${a3}</p>
        </div>
        <div class="faq-item">
          <h3>${q4}</h3>
          <p>${a4}</p>
        </div>`;
}

function buildFaqJsonLd(route, toSize, fromLabel, toLabel) {
  const size = route.size;
  const toSizeStr = toSize != null ? String(toSize) : '—';
  const q1 = `What is ${fromLabel} ${size} in ${toLabel} shoes?`;
  const a1 = toSize != null
    ? `${fromLabel} size ${size} typically converts to ${toLabel} size ${toSizeStr}. Use the converter above for your exact gender.`
    : `Use the converter above to find your ${toLabel} equivalent for ${fromLabel} size ${size}.`;

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: q1, acceptedAnswer: { '@type': 'Answer', text: a1 } },
      { '@type': 'Question', name: 'Is ' + fromLabel + ' sizing bigger than ' + toLabel + '?', acceptedAnswer: { '@type': 'Answer', text: 'Sizing scales differ by region. EU sizes are often 1–1.5 larger than US. Use the converter for exact equivalents.' } },
      { '@type': 'Question', name: 'Are shoe sizes standardized?', acceptedAnswer: { '@type': 'Answer', text: 'No. Shoe sizes vary by country and brand. Always check the brand\'s size chart when possible.' } },
      { '@type': 'Question', name: 'Should I size up or down?', acceptedAnswer: { '@type': 'Answer', text: 'It depends on the brand. Consider sizing up for athletic shoes or if the brand runs small.' } }
    ]
  };
  return JSON.stringify(faq);
}

function buildInternalLinks(route, allRoutes) {
  const added = new Set();
  const links = [];

  function add(href, text) {
    if (added.has(href)) return;
    added.add(href);
    links.push({ href, text });
  }

  // TYPE B — Region converter: link to size_pair pages for this from/to + main converters
  if (route.type === 'region') {
    const from = route.from_region;
    const to = route.to_region;
    const sizePairs = allRoutes.filter(r => r.type === 'size_pair' && r.from_region === from && r.to_region === to);
    sizePairs.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
    for (let i = 0; i < Math.min(6, sizePairs.length); i++) {
      const r = sizePairs[i];
      const genderTag = r.gender === 'women' ? "Women's " : r.gender === 'kids' ? "Kids' " : '';
      add(r.slug + '.html', `${genderTag}${getFromRegionLabel(from)} ${r.size} to ${getFromRegionLabel(to)}`);
    }
    add('../shoe-size-converter.html', 'Shoe Size Converter');
    add('../clothing-size-converter.html', 'Clothing Size Converter');
    add('../us-to-eu-size.html', 'US to EU Size');
    add('../uk-to-us-size.html', 'UK to US Size');
    add('../cm-to-us-shoe-size.html', 'CM to US Shoe Size');
    add('../index.html', 'Global Size Chart Home');
    return links.map(l => `<li><a href="${l.href}">${l.text}</a></li>`).join('\n          ');
  }

  // TYPE C — Category: link to other category pages + main converters + sample size_pair for this gender
  if (route.type === 'category') {
    const gender = route.gender;
    const categoryPages = allRoutes.filter(r => r.type === 'category' && r.slug !== route.slug);
    for (const r of categoryPages) {
      const label = r.gender === 'men' ? "Men's" : r.gender === 'women' ? "Women's" : "Kids'";
      add(r.slug + '.html', label + ' Shoe Size Converter');
    }
    const sampleSizePairs = allRoutes.filter(r => r.type === 'size_pair' && r.gender === gender);
    for (let i = 0; i < Math.min(3, sampleSizePairs.length); i++) {
      const r = sampleSizePairs[i];
      add(r.slug + '.html', `${getFromRegionLabel(r.from_region)} ${r.size} to ${getFromRegionLabel(r.to_region)}`);
    }
    add('../shoe-size-converter.html', 'Shoe Size Converter');
    add('../clothing-size-converter.html', 'Clothing Size Converter');
    add('../index.html', 'Global Size Chart Home');
    return links.map(l => `<li><a href="${l.href}">${l.text}</a></li>`).join('\n          ');
  }

  // TYPE A — Size pair (default)
  const from = route.from_region;
  const to = route.to_region;
  const size = route.size;
  const gender = route.gender;

  const samePairSameGender = allRoutes.filter(r =>
    r.type !== 'region' && r.type !== 'category' && r.from_region === from && r.to_region === to && r.gender === gender && r.size != null
  );
  samePairSameGender.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
  const idx = samePairSameGender.findIndex(r => String(r.size) === String(size));
  if (idx >= 0) {
    if (idx > 0) add(samePairSameGender[idx - 1].slug + '.html',
      `${getFromRegionLabel(from)} ${samePairSameGender[idx - 1].size} to ${getFromRegionLabel(to)}`);
    if (idx < samePairSameGender.length - 1) add(samePairSameGender[idx + 1].slug + '.html',
      `${getFromRegionLabel(from)} ${samePairSameGender[idx + 1].size} to ${getFromRegionLabel(to)}`);
  }

  const sameRegion = allRoutes.filter(r =>
    r.type === 'size_pair' && r.from_region === from && r.to_region === to && r.slug !== route.slug
  );
  sameRegion.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
  let sameRegionCount = 0;
  for (const r of sameRegion) {
    if (sameRegionCount >= 4) break;
    const href = r.slug + '.html';
    if (added.has(href)) continue;
    sameRegionCount++;
    const genderTag = r.gender === 'women' ? "Women's " : r.gender === 'kids' ? "Kids' " : '';
    add(href, `${genderTag}${getFromRegionLabel(from)} ${r.size} to ${getFromRegionLabel(to)}`);
  }

  const otherGenders = allRoutes.filter(r =>
    r.type === 'size_pair' && r.from_region === from && r.to_region === to && String(r.size) === String(size) && r.gender !== gender
  );
  const genderLabels = { men: "Men's", women: "Women's", kids: "Kids'" };
  for (const r of otherGenders) {
    add(r.slug + '.html', `${genderLabels[r.gender]} ${getFromRegionLabel(from)} ${r.size} to ${getFromRegionLabel(to)}`);
  }

  add('../shoe-size-converter.html', 'Shoe Size Converter');
  add('../clothing-size-converter.html', 'Clothing Size Converter');
  add('../us-to-eu-size.html', 'US to EU Size');
  add('../uk-to-us-size.html', 'UK to US Size');
  add('../cm-to-us-shoe-size.html', 'CM to US Shoe Size');
  add('../index.html', 'Global Size Chart Home');

  return links.map(l => `<li><a href="${l.href}">${l.text}</a></li>`).join('\n          ');
}

const MIN_CRAWL_DISCOVERY_LINKS = 12;
const MAIN_CONVERTER_LINKS = [
  { href: '../shoe-size-converter.html', text: 'Shoe Size Converter' },
  { href: '../clothing-size-converter.html', text: 'Clothing Size Converter' },
  { href: '../us-to-eu-size.html', text: 'US to EU Size' },
  { href: '../uk-to-us-size.html', text: 'UK to US Size' },
  { href: '../cm-to-us-shoe-size.html', text: 'CM to US Shoe Size' },
  { href: '../programmatic-index.html', text: 'Programmatic Index' },
  { href: '../index.html', text: 'Global Size Chart Home' }
];

/** Region converter slugs (programmatic) — spec list; only include if not current page. */
const REGION_CONVERTER_SLUGS = [
  'eu-to-us-shoe-size',
  'us-to-eu-shoe-size',
  'us-to-uk-shoe-size',
  'uk-to-us-shoe-size',
  'eu-to-uk-shoe-size',
  'japan-to-us-shoe-size',
  'cm-to-us-shoe-size'
];

const MIN_INTERNAL_LINK_GRAPH = 30;
const MAX_INTERNAL_LINK_GRAPH = 45;

/** Step 3: Region Converters section — same spec as all generators (shared module). Uses link builder. */
function buildRegionConvertersSection(currentFile) {
  return structuralModules.getRegionConvertersSectionHtml(currentFile);
}

/** Step 3: Authority Links section — same spec as all generators (shared module). Uses link builder. */
function buildAuthorityLinksSection(currentFile) {
  return structuralModules.getAuthorityLinksSectionHtml(currentFile);
}

/** Related conversions grid for region or category pages (so every programmatic page has a grid + 15–25+ links). */
function generateRelatedGridForRegionOrCategory(route, allRoutes) {
  const added = new Set();
  const items = [];

  function add(href, text) {
    if (added.has(href)) return;
    added.add(href);
    items.push({ href, text });
  }

  // Region converters (EU→US, US→UK, JP→US, CM→US, CM→EU, UK→EU, China, Japan, Korea, Inch)
  const regionSlugs = [
    { slug: 'eu-to-us-shoe-size', label: 'EU to US' },
    { slug: 'us-to-uk-shoe-size', label: 'US to UK' },
    { slug: 'japan-to-us-shoe-size', label: 'Japan to US' },
    { slug: 'cm-to-us-shoe-size', label: 'CM to US' },
    { slug: 'cm-to-eu-shoe-size', label: 'CM to EU' },
    { slug: 'cm-to-uk-shoe-size', label: 'CM to UK' },
    { slug: 'us-to-eu-shoe-size', label: 'US to EU' },
    { slug: 'uk-to-us-shoe-size', label: 'UK to US' },
    { slug: 'uk-to-eu-shoe-size', label: 'UK to EU' },
    { slug: 'inch-to-us-shoe-size', label: 'Inch to US' },
    { slug: 'inch-to-eu-shoe-size', label: 'Inch to EU' },
    { slug: 'japan-to-eu-shoe-size', label: 'Japan to EU' },
    { slug: 'eu-to-japan-shoe-size', label: 'EU to Japan' },
    { slug: 'us-to-japan-shoe-size', label: 'US to Japan' },
    { slug: 'china-to-us-shoe-size', label: 'China to US' },
    { slug: 'china-to-eu-shoe-size', label: 'China to EU' },
    { slug: 'korea-cm-to-us', label: 'Korea to US' },
    { slug: 'women-cm-to-us', label: "Women's CM to US" },
    { slug: 'men-cm-to-eu', label: "Men's CM to EU" },
    { slug: 'kids-cm-to-us', label: "Kids' CM to US" }
  ];
  for (const r of regionSlugs) {
    if (route.type === 'region' && route.slug === r.slug) continue;
    add(r.slug + '.html', r.label + ' Shoe Size');
  }

  // Category converters
  const categories = allRoutes.filter(r => r.type === 'category');
  const categoryLabels = { men: "Men's", women: "Women's", kids: "Kids'" };
  for (const r of categories) {
    add(r.slug + '.html', categoryLabels[r.gender] + ' Shoe Size Converter');
  }

  if (route.type === 'region') {
    const sizePairs = allRoutes.filter(r => r.type === 'size_pair' && r.from_region === route.from_region && r.to_region === route.to_region);
    sizePairs.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
    for (const r of sizePairs.slice(0, 12)) {
      const genderTag = r.gender === 'women' ? "Women's " : r.gender === 'kids' ? "Kids' " : '';
      add(r.slug + '.html', `${genderTag}${getFromRegionLabel(route.from_region)} ${r.size} to ${getFromRegionLabel(route.to_region)}`);
    }
  }

  if (route.type === 'category') {
    const sameGender = allRoutes.filter(r => r.type === 'size_pair' && r.gender === route.gender);
    sameGender.sort((a, b) => `${a.from_region}-${a.to_region}`.localeCompare(`${b.from_region}-${b.to_region}`) || parseFloat(a.size) - parseFloat(b.size));
    for (const r of sameGender.slice(0, 15)) {
      add(r.slug + '.html', `${getFromRegionLabel(r.from_region)} ${r.size} to ${getFromRegionLabel(r.to_region)}`);
    }
  }

  if (items.length === 0) return '';
  const gridLinks = items.map(it => `<a href="${it.href}">${escapeHtml(it.text)}</a>`).join('\n        ');
  return `<section class="related-size-grid">
  <h2>Explore Nearby Size Conversions</h2>
  <div class="grid">\n        ${gridLinks}\n  </div>
</section>`;
}

/** Hub pages — linked from every page for 20–35 internal link target. */
const HUB_PAGE_LINKS = [
  { href: '../index.html', text: 'Global Size Chart Home' },
  { href: '../shoe-size-pages.html', text: 'Shoe Size Pages Index' },
  { href: '../programmatic-index.html', text: 'Programmatic Index' },
  { href: '../shoe-sizing-guides.html', text: 'Shoe Sizing Guides' }
];

/** Tools and printable guides — link category for 20–35 internal links. */
const TOOLS_AND_PRINTABLE_LINKS = [
  { href: '../tools/measurement-assistant.html', text: 'Measurement Assistant Tool' },
  { href: '../printable/foot-measuring-sheet.html', text: 'Printable Foot Measuring Sheet' },
  { href: '../printable/clothing-measurement-chart.html', text: 'Printable Clothing Measurement Chart' },
  { href: '../printable/shoe-size-reference-chart.html', text: 'Printable Shoe Size Reference Chart' }
];

/** Sample measurement converter links (cm-based) — same region/gender context. */
const MEASUREMENT_CONVERTER_SAMPLE = [
  { href: '../measurement/24-cm-to-us-shoe-size.html', text: '24 cm to US Shoe Size' },
  { href: '../measurement/26-cm-to-us-shoe-size.html', text: '26 cm to US Shoe Size' },
  { href: '../measurement/90cm-chest-to-us-shirt-size.html', text: '90 cm Chest to US Shirt Size' },
  { href: '../measurement/70cm-waist-to-eu-pants.html', text: '70 cm Waist to EU Pants' }
];

/**
 * Internal Link Graph Engine: 30+ contextual internal links per page (target 30–45).
 * Uses internalLinkBuilder; currentFile is path of page being generated (e.g. programmatic-pages/eu-to-us-shoe-size.html).
 */
function buildInternalLinkGraph(route, allRoutes, semanticRoutes = [], currentFile) {
  const added = new Set();
  const links = [];
  const h = (target) => internalLinkBuilder.href(currentFile, target);
  function add(targetPath, text) {
    const href = h(targetPath);
    if (added.has(href)) return;
    added.add(href);
    links.push({ href, text });
  }

  // Homepage + main converters (always)
  add('index.html', 'Global Size Chart Home');
  add('shoe-size-converter.html', 'Shoe Size Converter');
  add('clothing-size-converter.html', 'Clothing Size Converter');

  // Hub pages (target paths)
  add('shoe-size-pages.html', 'Shoe Size Pages Index');
  add('programmatic-index.html', 'Programmatic Index');
  add('shoe-sizing-guides.html', 'Shoe Sizing Guides');

  // Region converter links (programmatic-pages/); exclude current if Type B
  const regionLabels = {
    'eu-to-us-shoe-size': 'EU to US Shoe Size',
    'us-to-eu-shoe-size': 'US to EU Shoe Size',
    'us-to-uk-shoe-size': 'US to UK Shoe Size',
    'uk-to-us-shoe-size': 'UK to US Shoe Size',
    'japan-to-us-shoe-size': 'Japan to US Shoe Size',
    'cm-to-us-shoe-size': 'CM to US Shoe Size',
    'eu-to-uk-shoe-size': 'EU to UK Shoe Size'
  };
  for (const slug of REGION_CONVERTER_SLUGS) {
    if (route.type === 'region' && route.slug === slug) continue;
    add('programmatic-pages/' + slug + '.html', regionLabels[slug] || slug.replace(/-/g, ' '));
  }

  // A. ±1 size links (size_pair only)
  if (route.type === 'size_pair' || (route.type !== 'region' && route.type !== 'category' && route.size != null)) {
    const from = route.from_region;
    const to = route.to_region;
    const size = route.size;
    const gender = route.gender || 'men';
    const samePair = allRoutes.filter(r =>
      r.type === 'size_pair' && r.from_region === from && r.to_region === to && r.gender === gender
    );
    samePair.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
    const idx = samePair.findIndex(r => String(r.size) === String(size));
    if (idx >= 0) {
      if (idx > 0) add('programmatic-pages/' + samePair[idx - 1].slug + '.html', `${getFromRegionLabel(from)} ${samePair[idx - 1].size} to ${getFromRegionLabel(to)}`);
      if (idx < samePair.length - 1) add('programmatic-pages/' + samePair[idx + 1].slug + '.html', `${getFromRegionLabel(from)} ${samePair[idx + 1].size} to ${getFromRegionLabel(to)}`);
    }
  }

  const from = route.from_region;
  const to = route.to_region;
  const gender = route.gender || 'men';

  // B. Same region: same from_region, to_region, gender (up to 6)
  if (from && to) {
    const sameRegion = allRoutes.filter(r =>
      r.type === 'size_pair' && r.from_region === from && r.to_region === to && r.gender === gender && r.slug !== route.slug
    );
    sameRegion.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
    let nearbyCount = 0;
    for (const r of sameRegion) {
      if (nearbyCount >= 6) break;
      const target = 'programmatic-pages/' + r.slug + '.html';
      if (added.has(h(target))) continue;
      nearbyCount++;
      add(target, `${getFromRegionLabel(from)} ${r.size} to ${getFromRegionLabel(to)}`);
    }
  }

  // C. Same gender: other region pairs (fill toward 20–35)
  const sameGenderOther = allRoutes.filter(r =>
    r.type === 'size_pair' && r.gender === gender && (r.from_region !== from || r.to_region !== to)
  );
  sameGenderOther.sort((a, b) => `${a.from_region}-${a.to_region}`.localeCompare(`${b.from_region}-${b.to_region}`) || parseFloat(a.size) - parseFloat(b.size));
  for (const r of sameGenderOther) {
    if (links.length >= MAX_INTERNAL_LINK_GRAPH) break;
    add('programmatic-pages/' + r.slug + '.html', `${getFromRegionLabel(r.from_region)} ${r.size} to ${getFromRegionLabel(r.to_region)}`);
  }

  // Type B (region): add size_pair pages for this from/to
  if (route.type === 'region') {
    const sizePairs = allRoutes.filter(r => r.type === 'size_pair' && r.from_region === from && r.to_region === to);
    sizePairs.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
    for (const r of sizePairs) {
      if (links.length >= MAX_INTERNAL_LINK_GRAPH) break;
      const genderTag = r.gender === 'women' ? "Women's " : r.gender === 'kids' ? "Kids' " : '';
      add('programmatic-pages/' + r.slug + '.html', `${genderTag}${getFromRegionLabel(from)} ${r.size} to ${getFromRegionLabel(to)}`);
    }
  }

  // Type C (category): add same-gender size pairs
  if (route.type === 'category') {
    const sameGender = allRoutes.filter(r => r.type === 'size_pair' && r.gender === gender);
    sameGender.sort((a, b) => `${a.from_region}-${a.to_region}`.localeCompare(`${b.from_region}-${b.to_region}`) || parseFloat(a.size) - parseFloat(b.size));
    for (const r of sameGender) {
      if (links.length >= MAX_INTERNAL_LINK_GRAPH) break;
      add('programmatic-pages/' + r.slug + '.html', `${getFromRegionLabel(r.from_region)} ${r.size} to ${getFromRegionLabel(r.to_region)}`);
    }
  }

  // Measurement converters (sample) — target paths
  add('measurement/24-cm-to-us-shoe-size.html', '24 cm to US Shoe Size');
  add('measurement/26-cm-to-us-shoe-size.html', '26 cm to US Shoe Size');
  add('measurement/90cm-chest-to-us-shirt-size.html', '90 cm Chest to US Shirt Size');
  add('measurement/70cm-waist-to-eu-pants.html', '70 cm Waist to EU Pants');

  // --- Similar brands, garments, fit problems, measurement refinements ---
  let brandRoutes = [];
  let clothingRoutes = [];
  let measurementRoutes = [];
  if (fs.existsSync(path.join(DATA_DIR, 'brand_routes.json'))) brandRoutes = loadJson(path.join(DATA_DIR, 'brand_routes.json'));
  if (fs.existsSync(path.join(DATA_DIR, 'clothing_routes.json'))) clothingRoutes = loadJson(path.join(DATA_DIR, 'clothing_routes.json'));
  if (fs.existsSync(path.join(DATA_DIR, 'measurement_routes.json'))) measurementRoutes = loadJson(path.join(DATA_DIR, 'measurement_routes.json'));

  for (const r of brandRoutes) {
    if (links.length >= MAX_INTERNAL_LINK_GRAPH) break;
    if (r.type === 'brand_converter' && r.slug) add('brands/' + r.slug + '.html', (r.brand || r.slug) + ' ' + (r.category === 'shoes' ? 'Shoe' : 'Clothing') + ' Size Guide');
  }

  for (const r of clothingRoutes.slice(0, 10)) {
    if (links.length >= MAX_INTERNAL_LINK_GRAPH) break;
    if (r.type === 'clothing_size_pair' && r.slug) {
      const cat = r.category === 'tops' ? 'Tops' : r.category === 'pants' ? 'Pants' : r.category === 'dresses' ? 'Dresses' : r.category === 'jackets' ? 'Jackets' : r.category;
      const g = r.gender === 'men' ? "Men's" : r.gender === 'women' ? "Women's" : "Kids'";
      add('clothing/' + r.slug + '.html', `${g} ${getFromRegionLabel(r.from_region)} ${r.size} to ${getFromRegionLabel(r.to_region)} ${cat}`);
    }
  }

  const fitProblemSemantic = (semanticRoutes || []).filter(sr =>
    sr.slug && (sr.semantic_category === 'sizing_myths' || sr.semantic_category === 'measurement_guides' || /fit|mistake|measure/i.test(sr.title || sr.slug))
  );
  for (const sr of fitProblemSemantic) {
    if (links.length >= MAX_INTERNAL_LINK_GRAPH) break;
    add('semantic/' + sr.slug + '.html', sr.title || sr.slug.replace(/-/g, ' '));
  }

  const categoryRoutes = allRoutes.filter(r => r.type === 'category');
  for (const r of categoryRoutes) {
    if (links.length >= MAX_INTERNAL_LINK_GRAPH) break;
    const label = (r.gender === 'men' ? "Men's" : r.gender === 'women' ? "Women's" : "Kids'") + ' Shoe Size Converter';
    add('programmatic-pages/' + r.slug + '.html', label);
  }

  for (const r of measurementRoutes) {
    if (links.length >= MAX_INTERNAL_LINK_GRAPH) break;
    if (r.slug) {
      const t = r.measurement_type === 'foot_cm' ? (r.value_cm + ' cm to ' + (r.to_region || 'US') + ' Shoe Size') : r.measurement_type === 'chest_cm' ? (r.value_cm + ' cm Chest to ' + (r.to_region || 'US') + ' Shirt') : (r.value_cm + ' cm Waist to ' + (r.to_region || 'EU') + ' Pants');
      add('measurement/' + r.slug + '.html', t);
    }
  }

  add('tools/measurement-assistant.html', 'Measurement Assistant Tool');
  add('printable/foot-measuring-sheet.html', 'Printable Foot Measuring Sheet');
  add('printable/clothing-measurement-chart.html', 'Printable Clothing Measurement Chart');
  add('printable/shoe-size-reference-chart.html', 'Printable Shoe Size Reference Chart');

  for (const sr of (semanticRoutes || [])) {
    if (links.length >= MAX_INTERNAL_LINK_GRAPH) break;
    if (sr.slug) add('semantic/' + sr.slug + '.html', sr.title || sr.slug.replace(/-/g, ' '));
  }

  const out = links.slice(0, MAX_INTERNAL_LINK_GRAPH);
  return out.map(l => `<li><a href="${l.href}">${escapeHtml(l.text)}</a></li>`).join('\n        ');
}

// --- Related Size Grid (Type A only) helpers ---

/** Adjacent sizes: [size-1 route, size+1 route] (either may be null). Uses programmatic_routes only. */
function findAdjacentSizes(route, allRoutes) {
  if (route.type !== 'size_pair' || route.size == null) return [null, null];
  const same = allRoutes.filter(r =>
    r.type === 'size_pair' && r.from_region === route.from_region && r.to_region === route.to_region && r.gender === route.gender
  );
  same.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
  const idx = same.findIndex(r => String(r.size) === String(route.size));
  if (idx < 0) return [null, null];
  return [same[idx - 1] || null, same[idx + 1] || null];
}

/** Same from_region, to_region, gender; different sizes (exclude current). Sorted by size. */
function findSameRegionRoutes(route, allRoutes) {
  if (!route.from_region || !route.to_region) return [];
  return allRoutes.filter(r =>
    r.type === 'size_pair' && r.from_region === route.from_region && r.to_region === route.to_region && r.gender === route.gender && r.slug !== route.slug
  ).sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
}

/** Same gender, different from_region or to_region. */
function findSameGenderRoutes(route, allRoutes) {
  const gender = route.gender || 'men';
  return allRoutes.filter(r =>
    r.type === 'size_pair' && r.gender === gender && (r.from_region !== route.from_region || r.to_region !== route.to_region)
  ).sort((a, b) => `${a.from_region}-${a.to_region}`.localeCompare(`${b.from_region}-${b.to_region}`) || parseFloat(a.size) - parseFloat(b.size));
}

/** Direct equivalents: same from_region, same size, different to_region (exclude self). */
function findDirectEquivalents(route, allRoutes) {
  if (route.type !== 'size_pair' || route.size == null) return [];
  return allRoutes.filter(r =>
    r.type === 'size_pair' && r.from_region === route.from_region && String(r.size) === String(route.size) && r.to_region !== route.to_region && r.slug !== route.slug
  );
}

/** Region converter routes (type === 'region') from allRoutes. */
function findRegionConverters(allRoutes) {
  return allRoutes.filter(r => r.type === 'region');
}

const MIN_RELATED_GRID_LINKS = 12;
const MAX_RELATED_GRID_LINKS = 20;

/**
 * Related Size Grid HTML for Type A pages only. Content: adjacent sizes, direct equivalents,
 * same-gender converters (category pages), region converters. 12–20 links, no self, no dupes.
 * Returns empty string for Type B/C.
 */
function generateRelatedSizeGrid(route, allRoutes) {
  if (route.type !== 'size_pair' && !(route.type != null && route.size != null)) return '';

  const added = new Set();
  const items = [];

  function add(href, text) {
    if (added.has(href) || href === route.slug + '.html') return;
    added.add(href);
    items.push({ href, text });
  }

  const from = route.from_region;
  const to = route.to_region;
  const gender = route.gender || 'men';

  // 1. Adjacent sizes
  const [prevRoute, nextRoute] = findAdjacentSizes(route, allRoutes);
  if (prevRoute) add(prevRoute.slug + '.html', `${getFromRegionLabel(from)} ${prevRoute.size} to ${getFromRegionLabel(to)}`);
  if (nextRoute) add(nextRoute.slug + '.html', `${getFromRegionLabel(from)} ${nextRoute.size} to ${getFromRegionLabel(to)}`);

  // 2. Direct equivalents (same from + size, different to_region)
  const equivalents = findDirectEquivalents(route, allRoutes);
  for (const r of equivalents) {
    if (items.length >= MAX_RELATED_GRID_LINKS) break;
    add(r.slug + '.html', `${getFromRegionLabel(r.from_region)} ${r.size} to ${getFromRegionLabel(r.to_region)}`);
  }

  // 3. Same gender converters (category pages: Men's, Women's, Kids' Shoe Size Converter)
  const categories = allRoutes.filter(r => r.type === 'category');
  const categoryLabels = { men: "Men's", women: "Women's", kids: "Kids'" };
  for (const r of categories) {
    if (items.length >= MAX_RELATED_GRID_LINKS) break;
    add(r.slug + '.html', `${categoryLabels[r.gender] || r.gender} Shoe Size Converter`);
  }

  // Region converters (from routes only)
  const regionConverters = findRegionConverters(allRoutes);
  for (const r of regionConverters) {
    if (items.length >= MAX_RELATED_GRID_LINKS) break;
    add(r.slug + '.html', `${getFromRegionLabel(r.from_region)} to ${getFromRegionLabel(r.to_region)} Shoe Size`);
  }

  // Same region nearby (fill toward 12–20)
  const sameRegion = findSameRegionRoutes(route, allRoutes);
  for (const r of sameRegion) {
    if (items.length >= MAX_RELATED_GRID_LINKS) break;
    add(r.slug + '.html', `${getFromRegionLabel(from)} ${r.size} to ${getFromRegionLabel(to)}`);
  }

  // Same gender other regions (fill)
  const sameGender = findSameGenderRoutes(route, allRoutes);
  for (const r of sameGender) {
    if (items.length >= MAX_RELATED_GRID_LINKS) break;
    add(r.slug + '.html', `${getFromRegionLabel(r.from_region)} ${r.size} to ${getFromRegionLabel(r.to_region)}`);
  }

  const out = items.slice(0, MAX_RELATED_GRID_LINKS);
  if (out.length === 0) return '';

  const gridLinks = out.map(it => `<a href="${it.href}">${escapeHtml(it.text)}</a>`).join('\n        ');
  return `<section class="related-size-grid">
  <h2>Explore Nearby Size Conversions</h2>
  <div class="grid">
        ${gridLinks}
  </div>
</section>`;
}

function buildCrawlDiscoveryLinks(route, allRoutes) {
  const added = new Set();
  const links = [];

  function add(href, text) {
    const key = href;
    if (added.has(key)) return;
    added.add(key);
    links.push({ href, text });
  }

  // Main converters (always include)
  for (const m of MAIN_CONVERTER_LINKS) {
    add(m.href, m.text);
  }

  // TYPE B — Region: add size_pair pages for this from/to (up to 10), then same-gender from other regions
  if (route.type === 'region') {
    const from = route.from_region;
    const to = route.to_region;
    const sizePairs = allRoutes.filter(r => r.type === 'size_pair' && r.from_region === from && r.to_region === to);
    sizePairs.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
    for (let i = 0; i < Math.min(10, sizePairs.length); i++) {
      const r = sizePairs[i];
      const genderTag = r.gender === 'women' ? "Women's " : r.gender === 'kids' ? "Kids' " : '';
      add(r.slug + '.html', `${genderTag}${getFromRegionLabel(from)} ${r.size} to ${getFromRegionLabel(to)}`);
    }
    const otherRegion = allRoutes.filter(r => r.type === 'size_pair' && (r.from_region !== from || r.to_region !== to));
    for (const r of otherRegion) {
      if (links.length >= MIN_CRAWL_DISCOVERY_LINKS) break;
      add(r.slug + '.html', `${getFromRegionLabel(r.from_region)} ${r.size} to ${getFromRegionLabel(r.to_region)}`);
    }
    const out = links.map(l => `<li><a href="${l.href}">${l.text}</a></li>`).join('\n          ');
    return out;
  }

  // TYPE C — Category: add other category pages + same-gender size pairs (fill to 12+)
  if (route.type === 'category') {
    const gender = route.gender;
    for (const r of allRoutes.filter(r => r.type === 'category' && r.slug !== route.slug)) {
      const label = r.gender === 'men' ? "Men's" : r.gender === 'women' ? "Women's" : "Kids'";
      add(r.slug + '.html', label + ' Shoe Size Converter');
    }
    const sameGender = allRoutes.filter(r => r.type === 'size_pair' && r.gender === gender);
    sameGender.sort((a, b) => `${a.from_region}-${a.to_region}`.localeCompare(`${b.from_region}-${b.to_region}`) || parseFloat(a.size) - parseFloat(b.size));
    for (const r of sameGender) {
      if (links.length >= Math.max(MIN_CRAWL_DISCOVERY_LINKS, 14)) break;
      add(r.slug + '.html', `${getFromRegionLabel(r.from_region)} ${r.size} to ${getFromRegionLabel(r.to_region)}`);
    }
    const out = links.map(l => `<li><a href="${l.href}">${l.text}</a></li>`).join('\n          ');
    return out;
  }

  // TYPE A — Size pair: size ±1, same region (more), same gender (other regions), main already added
  const from = route.from_region;
  const to = route.to_region;
  const size = route.size;
  const gender = route.gender;

  const samePairSameGender = allRoutes.filter(r =>
    r.type === 'size_pair' && r.from_region === from && r.to_region === to && r.gender === gender
  );
  samePairSameGender.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
  const idx = samePairSameGender.findIndex(r => String(r.size) === String(size));
  if (idx >= 0) {
    if (idx > 0) add(samePairSameGender[idx - 1].slug + '.html',
      `${getFromRegionLabel(from)} ${samePairSameGender[idx - 1].size} to ${getFromRegionLabel(to)}`);
    if (idx < samePairSameGender.length - 1) add(samePairSameGender[idx + 1].slug + '.html',
      `${getFromRegionLabel(from)} ${samePairSameGender[idx + 1].size} to ${getFromRegionLabel(to)}`);
  }

  const sameRegion = allRoutes.filter(r =>
    r.type === 'size_pair' && r.from_region === from && r.to_region === to && r.slug !== route.slug
  );
  sameRegion.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
  for (const r of sameRegion) {
    if (links.length >= 20) break;
    const href = r.slug + '.html';
    if (added.has(href)) continue;
    const genderTag = r.gender === 'women' ? "Women's " : r.gender === 'kids' ? "Kids' " : '';
    add(href, `${genderTag}${getFromRegionLabel(from)} ${r.size} to ${getFromRegionLabel(to)}`);
  }

  const otherGenders = allRoutes.filter(r =>
    r.type === 'size_pair' && r.from_region === from && r.to_region === to && String(r.size) === String(size) && r.gender !== gender
  );
  const genderLabels = { men: "Men's", women: "Women's", kids: "Kids'" };
  for (const r of otherGenders) {
    add(r.slug + '.html', `${genderLabels[r.gender]} ${getFromRegionLabel(from)} ${r.size} to ${getFromRegionLabel(to)}`);
  }

  const sameGenderOther = allRoutes.filter(r =>
    r.type === 'size_pair' && r.gender === gender && (r.from_region !== from || r.to_region !== to)
  );
  sameGenderOther.sort((a, b) => `${a.from_region}-${a.to_region}`.localeCompare(`${b.from_region}-${b.to_region}`) || parseFloat(a.size) - parseFloat(b.size));
  for (const r of sameGenderOther) {
    if (links.length >= Math.max(MIN_CRAWL_DISCOVERY_LINKS, 16)) break;
    add(r.slug + '.html', `${getFromRegionLabel(r.from_region)} ${r.size} to ${getFromRegionLabel(r.to_region)}`);
  }

  const regionPages = allRoutes.filter(r => r.type === 'region');
  for (const r of regionPages) {
    if (links.length >= Math.max(MIN_CRAWL_DISCOVERY_LINKS, 14)) break;
    add(r.slug + '.html', `${getFromRegionLabel(r.from_region)} to ${getFromRegionLabel(r.to_region)} Converter`);
  }

  return links.map(l => `<li><a href="${l.href}">${l.text}</a></li>`).join('\n          ');
}

const DISCOVERY_GRID_COUNT = 20;

/** Build 20 related-page links for the discovery grid (visible, SEO-safe). */
function buildDiscoveryGridLinks(route, allRoutes) {
  const added = new Set();
  const links = [];

  function add(href, text) {
    const key = href;
    if (added.has(key)) return;
    added.add(key);
    links.push({ href, text });
  }

  // Main converters first
  for (const m of MAIN_CONVERTER_LINKS) {
    if (links.length >= DISCOVERY_GRID_COUNT) break;
    add(m.href, m.text);
  }

  if (route.type === 'region') {
    const from = route.from_region;
    const to = route.to_region;
    const sizePairs = allRoutes.filter(r => r.type === 'size_pair' && r.from_region === from && r.to_region === to);
    sizePairs.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
    for (const r of sizePairs) {
      if (links.length >= DISCOVERY_GRID_COUNT) break;
      const genderTag = r.gender === 'women' ? "Women's " : r.gender === 'kids' ? "Kids' " : '';
      add(r.slug + '.html', `${genderTag}${getFromRegionLabel(from)} ${r.size} to ${getFromRegionLabel(to)}`);
    }
    for (const r of allRoutes.filter(r => r.type === 'size_pair')) {
      if (links.length >= DISCOVERY_GRID_COUNT) break;
      add(r.slug + '.html', `${getFromRegionLabel(r.from_region)} ${r.size} to ${getFromRegionLabel(r.to_region)}`);
    }
  } else if (route.type === 'category') {
    for (const r of allRoutes.filter(r => r.type === 'category' && r.slug !== route.slug)) {
      const label = r.gender === 'men' ? "Men's" : r.gender === 'women' ? "Women's" : "Kids'";
      add(r.slug + '.html', label + ' Shoe Size Converter');
    }
    const sameGender = allRoutes.filter(r => r.type === 'size_pair' && r.gender === route.gender);
    sameGender.sort((a, b) => `${a.from_region}-${a.to_region}`.localeCompare(`${b.from_region}-${b.to_region}`) || parseFloat(a.size) - parseFloat(b.size));
    for (const r of sameGender) {
      if (links.length >= DISCOVERY_GRID_COUNT) break;
      add(r.slug + '.html', `${getFromRegionLabel(r.from_region)} ${r.size} to ${getFromRegionLabel(r.to_region)}`);
    }
    for (const r of allRoutes.filter(r => r.type === 'region')) {
      if (links.length >= DISCOVERY_GRID_COUNT) break;
      add(r.slug + '.html', `${getFromRegionLabel(r.from_region)} to ${getFromRegionLabel(r.to_region)}`);
    }
  } else {
    // Type A — size_pair: ±1, same region, same gender other regions, region pages, then fill
    const from = route.from_region;
    const to = route.to_region;
    const size = route.size;
    const gender = route.gender;

    const samePair = allRoutes.filter(r =>
      r.type === 'size_pair' && r.from_region === from && r.to_region === to && r.gender === gender
    );
    samePair.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
    const idx = samePair.findIndex(r => String(r.size) === String(size));
    if (idx >= 0) {
      if (idx > 0) add(samePair[idx - 1].slug + '.html', `${getFromRegionLabel(from)} ${samePair[idx - 1].size} to ${getFromRegionLabel(to)}`);
      if (idx < samePair.length - 1) add(samePair[idx + 1].slug + '.html', `${getFromRegionLabel(from)} ${samePair[idx + 1].size} to ${getFromRegionLabel(to)}`);
    }

    const sameRegion = allRoutes.filter(r =>
      r.type === 'size_pair' && r.from_region === from && r.to_region === to && r.slug !== route.slug
    );
    sameRegion.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
    for (const r of sameRegion) {
      if (links.length >= DISCOVERY_GRID_COUNT) break;
      const genderTag = r.gender === 'women' ? "Women's " : r.gender === 'kids' ? "Kids' " : '';
      add(r.slug + '.html', `${genderTag}${getFromRegionLabel(from)} ${r.size} to ${getFromRegionLabel(to)}`);
    }

    for (const r of allRoutes.filter(r => r.type === 'region')) {
      if (links.length >= DISCOVERY_GRID_COUNT) break;
      add(r.slug + '.html', `${getFromRegionLabel(r.from_region)} to ${getFromRegionLabel(r.to_region)}`);
    }

    const sameGenderOther = allRoutes.filter(r =>
      r.type === 'size_pair' && r.gender === gender && (r.from_region !== from || r.to_region !== to)
    );
    sameGenderOther.sort((a, b) => `${a.from_region}-${a.to_region}`.localeCompare(`${b.from_region}-${b.to_region}`) || parseFloat(a.size) - parseFloat(b.size));
    for (const r of sameGenderOther) {
      if (links.length >= DISCOVERY_GRID_COUNT) break;
      add(r.slug + '.html', `${getFromRegionLabel(r.from_region)} ${r.size} to ${getFromRegionLabel(r.to_region)}`);
    }

    for (const r of allRoutes.filter(r => r.type === 'size_pair')) {
      if (links.length >= DISCOVERY_GRID_COUNT) break;
      add(r.slug + '.html', `${getFromRegionLabel(r.from_region)} ${r.size} to ${getFromRegionLabel(r.to_region)}`);
    }
  }

  return links.map(l => `<a href="${l.href}">${escapeHtml(l.text)}</a>`).join('\n        ');
}

const MEASUREMENT_GUIDE_SNIPPET = `
        <p>Measure your foot length in centimeters for the most accurate conversion:</p>
        <ol>
          <li>Place a piece of paper against a wall on a hard floor.</li>
          <li>Stand with your heel touching the wall and mark the tip of your longest toe.</li>
          <li>Measure from the wall to the mark in centimeters.</li>
          <li>Repeat for both feet and use the larger measurement.</li>
        </ol>
        <p>Foot length in CM is the most reliable reference across all regional sizing systems.</p>`;

function buildRegionFaqContent(fromLabel, toLabel) {
  return `
        <div class="faq-item">
          <h3>How do I convert ${fromLabel} shoe sizes to ${toLabel}?</h3>
          <p>Use the converter above. Select your gender, choose ${fromLabel} as the source region, enter your size, and view ${toLabel} and other regional equivalents.</p>
        </div>
        <div class="faq-item">
          <h3>Is ${fromLabel} sizing different from ${toLabel}?</h3>
          <p>Yes. Each region uses its own scale. ${fromLabel} and ${toLabel} conversion is approximate; always check the brand's size chart when possible.</p>
        </div>
        <div class="faq-item">
          <h3>Are shoe sizes standardized?</h3>
          <p>No. Shoe sizes vary by country and brand. Conversion charts give approximate equivalents.</p>
        </div>
        <div class="faq-item">
          <h3>Should I size up or down?</h3>
          <p>It depends on the brand. European and Asian brands often run smaller. Consider sizing up for athletic shoes or wide feet.</p>
        </div>`;
}

function buildRegionFaqJsonLd(fromLabel, toLabel) {
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: `How do I convert ${fromLabel} shoe sizes to ${toLabel}?`, acceptedAnswer: { '@type': 'Answer', text: `Use the converter above. Select your gender, choose ${fromLabel} as source, enter your size, and view ${toLabel} equivalents.` } },
      { '@type': 'Question', name: `Is ${fromLabel} sizing different from ${toLabel}?`, acceptedAnswer: { '@type': 'Answer', text: 'Yes. Each region uses its own scale. Conversion is approximate; check the brand size chart when possible.' } },
      { '@type': 'Question', name: 'Are shoe sizes standardized?', acceptedAnswer: { '@type': 'Answer', text: 'No. Shoe sizes vary by country and brand.' } },
      { '@type': 'Question', name: 'Should I size up or down?', acceptedAnswer: { '@type': 'Answer', text: 'It depends on the brand. Consider sizing up for athletic shoes or if the brand runs small.' } }
    ]
  };
  return JSON.stringify(faq);
}

function buildCategoryFaqContent(genderLabel) {
  return `
        <div class="faq-item">
          <h3>How do I convert ${genderLabel} shoe sizes?</h3>
          <p>Use the converter above. Select your region and enter your ${genderLabel} size to see equivalents in US, UK, EU, Japan, China, and CM.</p>
        </div>
        <div class="faq-item">
          <h3>Do men's and women's shoe sizes use the same scale?</h3>
          <p>No. ${genderLabel} sizes use a different scale than other genders. Always choose the correct gender in the converter.</p>
        </div>
        <div class="faq-item">
          <h3>Are shoe sizes standardized?</h3>
          <p>No. Shoe sizes vary by country and brand. Always check the brand's size chart when possible.</p>
        </div>
        <div class="faq-item">
          <h3>Should I size up or down?</h3>
          <p>It depends on the brand. Consider sizing up for athletic shoes or if the brand runs small.</p>
        </div>`;
}

function buildCategoryFaqJsonLd(genderLabel) {
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: `How do I convert ${genderLabel} shoe sizes?`, acceptedAnswer: { '@type': 'Answer', text: `Use the converter above. Select your region and enter your ${genderLabel} size to see US, UK, EU, JP, CN, and CM equivalents.` } },
      { '@type': 'Question', name: "Do men's and women's shoe sizes use the same scale?", acceptedAnswer: { '@type': 'Answer', text: 'No. Always choose the correct gender in the converter.' } },
      { '@type': 'Question', name: 'Are shoe sizes standardized?', acceptedAnswer: { '@type': 'Answer', text: 'No. Shoe sizes vary by country and brand.' } },
      { '@type': 'Question', name: 'Should I size up or down?', acceptedAnswer: { '@type': 'Answer', text: 'It depends on the brand. Consider sizing up for athletic shoes or if the brand runs small.' } }
    ]
  };
  return JSON.stringify(faq);
}

// --- SERP CTR: Enhanced structured data (HowTo, Article, QAPage, SoftwareApplication). Does NOT replace existing FAQ. ---
/**
 * Build HowTo schema for measurement + fit instructions. Objective 9: adds potentialAction for interaction metrics.
 */
function buildHowToSchema(context) {
  const url = context.canonicalUrl || BASE_URL;
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: context.howToName || 'How to measure your feet for shoe size conversion',
    description: context.howToDescription || 'Measure your foot length in centimeters and use fit tips for accurate shoe size conversion between US, UK, EU, Japan, and CM.',
    step: [
      { '@type': 'HowToStep', name: 'Place paper and stand', text: 'Place a piece of paper against a wall on a hard floor. Stand with your heel touching the wall and mark the tip of your longest toe.' },
      { '@type': 'HowToStep', name: 'Measure length', text: 'Measure from the wall to the mark in centimeters. Repeat for both feet and use the larger measurement.' },
      { '@type': 'HowToStep', name: 'Use converter', text: 'Enter your measurement or regional size in the shoe size converter to get equivalents in all regions.' },
      { '@type': 'HowToStep', name: 'Fit tips', text: 'European brands often run narrower; Asian sizing runs smaller. Check the brand\'s size chart or order two sizes when unsure.' }
    ],
    potentialAction: { '@type': 'UseAction', target: { '@type': 'EntryPoint', urlTemplate: url }, name: 'Use shoe size converter' }
  };
}

/**
 * Build Article schema for semantic pages and region guides. Objective 9: adds about for topic/entity coverage.
 */
function buildArticleSchema(context) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: context.h1Title || context.pageTitle,
    description: context.description || context.metaDescription,
    url: context.canonicalUrl,
    datePublished: context.datePublished || '2024-01-01',
    publisher: { '@type': 'Organization', name: 'GlobalSizeChart.com', url: BASE_URL },
    about: [
      { '@type': 'Thing', name: 'Shoe size conversion' },
      { '@type': 'Thing', name: 'Size chart' },
      { '@type': 'Thing', name: context.aboutTopic || 'Regional shoe sizes (US, UK, EU, Japan, CM)' }
    ]
  };
}

/**
 * Build QAPage schema (single prominent Q&A for deep FAQ blocks). Complements existing FAQPage.
 */
function buildQAPageSchema(context) {
  if (!context.firstFaqQuestion || !context.firstFaqAnswer) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: context.firstFaqQuestion,
      acceptedAnswer: { '@type': 'Answer', text: context.firstFaqAnswer }
    }
  };
}

/**
 * Build SoftwareApplication schema for converter tools. Objective 9 + Objective 7: no commercial claims (no price/offers).
 */
function buildSoftwareApplicationSchema(context) {
  const url = context.canonicalUrl || BASE_URL;
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: context.h1Title || 'Shoe Size Converter',
    applicationCategory: 'WebApplication',
    description: context.description || context.metaDescription || 'Convert shoe sizes between US, UK, EU, Japan, China, and CM.',
    url: context.canonicalUrl,
    potentialAction: { '@type': 'UseAction', target: { '@type': 'EntryPoint', urlTemplate: url }, name: 'Convert shoe size' }
  };
}

/**
 * Build WebPage schema. Objective 9 — mainEntity + potentialAction for rich snippets and SERP real estate.
 */
function buildWebPageSchema(context) {
  const url = context.canonicalUrl || BASE_URL;
  const actions = [
    { '@type': 'UseAction', target: { '@type': 'EntryPoint', urlTemplate: url }, name: 'Use converter' }
  ];
  if (context.canonicalUrl) {
    actions.push({ '@type': 'ReadAction', target: context.canonicalUrl });
  }
  const mainEntity = context.firstFaqQuestion && context.firstFaqAnswer
    ? { '@type': 'Question', name: context.firstFaqQuestion, acceptedAnswer: { '@type': 'Answer', text: context.firstFaqAnswer } }
    : { '@type': 'WebApplication', name: context.h1Title || 'Shoe Size Converter', url: context.canonicalUrl };
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: context.h1Title || context.pageTitle,
    description: context.description || context.metaDescription,
    url: context.canonicalUrl,
    publisher: { '@type': 'Organization', name: 'GlobalSizeChart.com', url: BASE_URL },
    mainEntity: mainEntity,
    potentialAction: actions
  };
}

/**
 * Build ItemList schema. Objective 9 — list of related conversions or regions for rich list snippets.
 * context.itemListElements: optional array of { name, url }; else uses default regions/steps.
 */
function buildItemListSchema(context) {
  const items = context.itemListElements || [
    { name: 'US shoe size', url: `${BASE_URL}/programmatic-pages/us-to-eu-shoe-size.html` },
    { name: 'UK shoe size', url: `${BASE_URL}/programmatic-pages/uk-to-us-shoe-size.html` },
    { name: 'EU shoe size', url: `${BASE_URL}/programmatic-pages/eu-to-us-shoe-size.html` },
    { name: 'Japan shoe size', url: `${BASE_URL}/programmatic-pages/japan-to-us-shoe-size.html` },
    { name: 'CM to size', url: `${BASE_URL}/programmatic-pages/cm-to-us-shoe-size.html` }
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: context.itemListName || 'Related size conversions',
    description: context.itemListDescription || 'Shoe size conversion tools by region.',
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: item.url
    }))
  };
}

/**
 * Objective 7 — Product entity schema. Allowed fields only: name, brand, category, size_range, description.
 * NO price, offers, availability, or affiliate links.
 */
function buildProductEntitySchema(product) {
  const name = product.name || [product.brand, product.product_type || product.category].filter(Boolean).join(' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Size reference';
  const description = product.description || `Sizing reference for ${(product.brand || '').replace(/\b\w/g, c => c.toUpperCase())} ${product.category || ''}. Use the brand size chart for the specific item.`;
  return {
    '@type': 'Product',
    name: name,
    ...(product.brand ? { brand: { '@type': 'Brand', name: String(product.brand).replace(/\b\w/g, c => c.toUpperCase()) } } : {}),
    ...(product.category ? { category: product.category } : {}),
    ...(product.size_range ? { size_range: product.size_range } : {}),
    description: description
  };
}

/**
 * Objective 7 — ItemList of Product entities (no commercial claims). Loads from affiliate_products.json,
 * outputs only name, brand, category, size_range, description per product.
 */
function buildProductItemListSchema(route, context) {
  let products = [];
  const fp = path.join(DATA_DIR, 'affiliate_products.json');
  if (fs.existsSync(fp)) {
    try {
      const raw = loadJson(fp);
      products = Array.isArray(raw) ? raw.slice(0, 5) : [];
    } catch (e) {
      products = [];
    }
  }
  if (products.length === 0) return null;
  const productSchemas = products.map(p => buildProductEntitySchema(p));
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: context.productItemListName || 'Sizing reference examples',
    description: context.productItemListDescription || 'Example brands and categories for size chart reference. Not a commercial listing.',
    numberOfItems: productSchemas.length,
    itemListElement: productSchemas.map((schema, i) => ({
      ...schema,
      position: i + 1
    }))
  };
}

/**
 * Objective 9 — Advanced Schema Stack: SoftwareApplication, FAQPage, HowTo, ItemList, BreadcrumbList, Article, WebPage.
 * BreadcrumbList and FAQPage are in template ({{BREADCRUMB_JSON_LD}}, {{FAQ_JSON_LD}}); this returns the rest + ItemList.
 * Interaction metrics: potentialAction, mainEntity, about on schemas for rich snippets, CTR, SERP real estate.
 */
function buildAdvancedSchemaStack(route, context, existing = {}) {
  const schemas = [];
  const type = route.type || (route.slug && route.semantic_category ? 'semantic' : null) || 'size_pair';
  const isSemantic = type === 'semantic';
  const isRegion = type === 'region';
  const hasConverter = context.hasConverter !== false && (isRegion || type === 'category' || type === 'size_pair');
  const hasMeasurement = context.hasMeasurement !== false;
  const hasFit = context.hasFit !== false;

  // WebPage — every page; includes mainEntity + potentialAction
  schemas.push(buildWebPageSchema(context));

  // HowTo: measurement + fit (when applicable); includes potentialAction
  if (hasMeasurement || hasFit || (isSemantic && ['measurement_guides', 'fit_guides'].includes(route.semantic_category))) {
    schemas.push(buildHowToSchema({
      howToName: context.howToName || (isSemantic && route.semantic_category === 'measurement_guides' ? 'How to measure your feet in CM' : 'How to measure your feet for shoe size conversion'),
      howToDescription: context.description || context.metaDescription,
      canonicalUrl: context.canonicalUrl
    }));
  }

  // Article — includes about (topic coverage)
  schemas.push(buildArticleSchema(context));

  // QAPage — first Q&A prominent (complements FAQPage); has mainEntity
  const qa = buildQAPageSchema(context);
  if (qa) schemas.push(qa);

  // SoftwareApplication — converter pages; includes potentialAction
  if (hasConverter) {
    schemas.push(buildSoftwareApplicationSchema(context));
  }

  // ItemList — related conversions / regions for list rich results
  schemas.push(buildItemListSchema(context));

  // Objective 7 — ItemList of Product entities (name, brand, category, size_range, description only; no price/offers/availability)
  const productItemList = buildProductItemListSchema(route, context);
  if (productItemList) schemas.push(productItemList);

  return schemas;
}

/**
 * Generate enhanced SERP schemas for a route (Phase 9 + Objective 9).
 * Returns array of JSON-LD objects: HowTo, Article, QAPage, SoftwareApplication, WebPage.
 * Does NOT include BreadcrumbList or FAQPage (those are in template as {{BREADCRUMB_JSON_LD}} and {{FAQ_JSON_LD}}).
 */
function generateEnhancedSERPSchema(route, context) {
  return buildAdvancedSchemaStack(route, context, { hasBreadcrumb: true, hasFaq: true });
}

/** Serialize schema objects to HTML script tags. Valid JSON-LD, one script per schema to avoid @graph complexity. */
function enhancedSERPSchemaToScriptTags(schemas) {
  if (!schemas || schemas.length === 0) return '';
  return schemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n  ');
}

// --- Phase 11: Commercial Intent Detection (Revenue Maximization) ---
let _commercialIntentConfig = null;
function loadCommercialIntentConfig() {
  if (_commercialIntentConfig) return _commercialIntentConfig;
  const fp = path.join(DATA_DIR, 'commercial_intent.json');
  if (fs.existsSync(fp)) {
    _commercialIntentConfig = loadJson(fp);
  } else {
    _commercialIntentConfig = { intent_categories: [], descriptions: {}, signals: {} };
  }
  return _commercialIntentConfig;
}

/**
 * Detect commercial intent for a route. Used for data-intent tagging (monetization layer).
 * Signals: brand routes, clothing pages, measurement pages, long-tail conversion, garment-specific.
 * @param {object} route - { type, category?, slug?, semantic_category?, ... }
 * @returns {{ primary: string|null, all: string[] }}
 */
function detectCommercialIntent(route) {
  const all = [];
  if (!route || !route.type) {
    return { primary: null, all: [] };
  }
  const type = route.type;

  if (type === 'brand_converter') {
    all.push('brand_specific', 'high_purchase');
  } else if (type === 'clothing_size_pair') {
    all.push('high_purchase', 'shopping_research');
    if (route.category && ['dresses', 'jackets', 'pants', 'tops'].includes(route.category)) {
      all.unshift('high_purchase');
    }
  } else if (type === 'measurement_converter') {
    all.push('measurement_confusion', 'fit_problem');
  } else if (type === 'region' || type === 'category') {
    all.push('comparison', 'shopping_research');
  } else if (type === 'size_pair' || type == null) {
    all.push('comparison', 'shopping_research');
  } else if (type === 'semantic') {
    const cat = route.semantic_category;
    if (cat === 'fit_guides') all.push('fit_problem');
    else if (cat === 'measurement_guides') all.push('measurement_confusion');
    else all.push('shopping_research');
  } else if (type === 'printable') {
    all.push('measurement_confusion', 'shopping_research');
  } else if (type === 'tool') {
    all.push('measurement_confusion', 'fit_problem');
  } else if (type === 'hub') {
    all.push('shopping_research');
  }

  const seen = new Set();
  const unique = all.filter(x => { if (seen.has(x)) return false; seen.add(x); return true; });
  const primary = unique.length ? unique[0] : null;
  return { primary, all: unique };
}

function getDataIntentAttr(route) {
  const result = detectCommercialIntent(route);
  return result.primary ? `data-intent="${escapeHtml(result.primary)}"` : '';
}

// --- Phase 11 Objective 2: Smart monetization modules (trust + dwell time, no ad code) ---
const MONETIZATION_DIR = path.join(ROOT, 'components', 'monetization');
const _monetizationModuleCache = {};

function loadMonetizationModule(name) {
  if (_monetizationModuleCache[name]) return _monetizationModuleCache[name];
  const fp = path.join(MONETIZATION_DIR, name + '.html');
  if (!fs.existsSync(fp)) return '';
  _monetizationModuleCache[name] = fs.readFileSync(fp, 'utf8').trim();
  return _monetizationModuleCache[name];
}

// --- Commercial content blocks (brand / clothing / measurement / high_purchase) ---
const COMMERCIAL_DIR = path.join(ROOT, 'components', 'commercial');
const _commercialModuleCache = {};
const { isAdsenseApprovalMode, getSafeMonetizationTitle, sanitizeForApprovalMode } = require('./adsense-approval-config.js');

function loadCommercialModule(name) {
  if (_commercialModuleCache[name]) return _commercialModuleCache[name];
  const fp = path.join(COMMERCIAL_DIR, name + '.html');
  if (!fs.existsSync(fp)) return '';
  _commercialModuleCache[name] = fs.readFileSync(fp, 'utf8').trim();
  return _commercialModuleCache[name];
}

function applySafeMonetizationTitle(html, titleIndex) {
  if (!isAdsenseApprovalMode()) return html;
  const safeTitle = getSafeMonetizationTitle(titleIndex);
  return html
    .replace(/<h3[^>]*class="[^"]*commercial-module__title[^"]*"[^>]*>[\s\S]*?<\/h3>/, '<h3 class="commercial-module__title">' + safeTitle + '</h3>')
    .replace(/<h3[^>]*class="[^"]*monetization-module__title[^"]*"[^>]*>[\s\S]*?<\/h3>/, '<h3 class="monetization-module__title">' + safeTitle + '</h3>');
}

/**
 * Build commercial content blocks HTML. Insert when: brand pages, clothing pages,
 * measurement pages, high_purchase intent pages. Auto-inserts 2–3 modules per context.
 * When AdSense approval mode is on, block titles are replaced with safe titles (Sizing Insights, Fit Considerations, Sizing Examples).
 */
function buildCommercialContentBlocks(route) {
  if (!route || !route.type) return '';
  const intent = detectCommercialIntent(route);
  const type = route.type;
  const isHighPurchase = intent.all && intent.all.includes('high_purchase');
  const moduleNames = [];

  if (type === 'brand_converter') {
    moduleNames.push('brand-fit-issues', 'why-sizes-vary', 'regional-fit-differences');
  } else if (type === 'clothing_size_pair') {
    moduleNames.push('why-sizes-vary', 'garment-cut-explainer', 'fit-problem-explainer');
  } else if (type === 'measurement_converter') {
    moduleNames.push('fit-problem-explainer', 'why-sizes-vary', 'regional-fit-differences');
  } else if (isHighPurchase) {
    moduleNames.push('why-sizes-vary', 'fit-problem-explainer');
  }

  if (moduleNames.length === 0) return '';
  const modules = moduleNames.map((name, i) => {
    let m = loadCommercialModule(name);
    if (m) m = applySafeMonetizationTitle(m, i);
    return m;
  }).filter(Boolean);
  if (modules.length === 0) return '';
  return '<section class="content-section commercial-modules" data-module="commercial-content">' + modules.map(m => '<div class="commercial-module-wrap">' + m + '</div>').join('') + '</section>';
}

/**
 * Build HTML for monetization modules to insert on this route.
 * Brand → brand_fit_warning + shopping_tip_box; Clothing → size_variability_notice + shopping_tip_box;
 * Measurement → measurement_precision_warning; High purchase intent → shopping_tip_box.
 */
function buildMonetizationModulesForRoute(route) {
  if (!route || !route.type) return '';
  const intent = detectCommercialIntent(route);
  const modules = [];
  const type = route.type;

  if (type === 'brand_converter') {
    let brandHtml = loadMonetizationModule('brand_fit_warning');
    if (brandHtml && route.brand) brandHtml = brandHtml.replace(/\{\{BRAND\}\}/g, escapeHtml(route.brand));
    if (brandHtml) brandHtml = applySafeMonetizationTitle(brandHtml, modules.length);
    if (brandHtml) modules.push(brandHtml);
    let shoppingTip = loadMonetizationModule('shopping_tip_box');
    if (shoppingTip) shoppingTip = applySafeMonetizationTitle(shoppingTip, modules.length);
    if (shoppingTip) modules.push(shoppingTip);
  } else if (type === 'clothing_size_pair') {
    let sizeVar = loadMonetizationModule('size_variability_notice');
    if (sizeVar) sizeVar = applySafeMonetizationTitle(sizeVar, modules.length);
    if (sizeVar) modules.push(sizeVar);
    let shoppingTip = loadMonetizationModule('shopping_tip_box');
    if (shoppingTip) shoppingTip = applySafeMonetizationTitle(shoppingTip, modules.length);
    if (shoppingTip) modules.push(shoppingTip);
  } else if (type === 'measurement_converter') {
    let precision = loadMonetizationModule('measurement_precision_warning');
    if (precision) precision = applySafeMonetizationTitle(precision, modules.length);
    if (precision) modules.push(precision);
  } else if (intent.all && intent.all.includes('high_purchase')) {
    let shoppingTip = loadMonetizationModule('shopping_tip_box');
    if (shoppingTip) shoppingTip = applySafeMonetizationTitle(shoppingTip, modules.length);
    if (shoppingTip) modules.push(shoppingTip);
  }

  if (modules.length === 0) return '';
  return '<section class="content-section monetization-modules" data-module="monetization">' + modules.map(m => '<div class="monetization-module-wrap">' + m + '</div>').join('') + '</section>';
}

// --- Phase 11 Objective 3: Session Depth Engine (+5 clicks target) ---
let _sessionDepthMeasurementRoutes = null;
let _sessionDepthClothingRoutes = null;
let _sessionDepthBrandRoutes = null;

/**
 * Generate session depth modules HTML: "People Also Convert", "Related Fit Problems",
 * "Try These Measurements", "Other Sizes Near Yours", "Same Brand — Different Region".
 * Injected near bottom of page to increase clicks per user.
 * @param {object} route - current page route
 * @param {object} opts - { pageType, basePath, programmaticRoutes?, semanticRoutes?, measurementRoutes?, clothingRoutes?, brandRoutes? }
 */
function generateSessionDepthModules(route, opts) {
  const currentFile = opts.currentFile || 'programmatic-pages/index.html';
  const pageType = opts.pageType || (route && route.type) || 'programmatic';
  const programmaticRoutes = opts.programmaticRoutes || [];
  let semanticRoutes = opts.semanticRoutes || [];
  let measurementRoutes = opts.measurementRoutes;
  let clothingRoutes = opts.clothingRoutes;
  let brandRoutes = opts.brandRoutes;

  if (!measurementRoutes && fs.existsSync(path.join(DATA_DIR, 'measurement_routes.json'))) {
    _sessionDepthMeasurementRoutes = _sessionDepthMeasurementRoutes || loadJson(path.join(DATA_DIR, 'measurement_routes.json'));
    measurementRoutes = _sessionDepthMeasurementRoutes;
  }
  if (!clothingRoutes && fs.existsSync(path.join(DATA_DIR, 'clothing_routes.json'))) {
    _sessionDepthClothingRoutes = _sessionDepthClothingRoutes || loadJson(path.join(DATA_DIR, 'clothing_routes.json'));
    clothingRoutes = _sessionDepthClothingRoutes;
  }
  if (!brandRoutes && fs.existsSync(path.join(DATA_DIR, 'brand_routes.json'))) {
    _sessionDepthBrandRoutes = _sessionDepthBrandRoutes || loadJson(path.join(DATA_DIR, 'brand_routes.json'));
    brandRoutes = _sessionDepthBrandRoutes;
  }
  measurementRoutes = measurementRoutes || [];
  clothingRoutes = clothingRoutes || [];
  brandRoutes = brandRoutes || [];

  const sections = [];
  const link = (targetPath, text) => `<li><a href="${escapeHtml(internalLinkBuilder.href(currentFile, targetPath))}">${escapeHtml(text)}</a></li>`;

  // 1. People Also Convert
  if (pageType === 'programmatic' || pageType === 'region' || pageType === 'category' || pageType === 'size_pair') {
    const type = route.type || 'size_pair';
    const others = programmaticRoutes.filter(r => r.slug && r.slug !== route.slug);
    const regionRoutes = others.filter(r => r.type === 'region').slice(0, 4);
    const categoryRoutes = others.filter(r => r.type === 'category').slice(0, 3);
    const sizePairRoutes = others.filter(r => (r.type === 'size_pair' || !r.type) && r.slug).slice(0, 6);
    const peopleLinks = [...regionRoutes, ...categoryRoutes, ...sizePairRoutes].slice(0, 8).map(r => {
      let label = r.slug ? r.slug.replace(/-/g, ' ') : r.slug;
      if (r.type === 'region' && r.from_region && r.to_region) label = getFromRegionLabel(r.from_region) + ' to ' + getFromRegionLabel(r.to_region);
      if (r.type === 'category' && r.gender) label = (r.gender === 'men' ? "Men's" : r.gender === 'women' ? "Women's" : "Kids'") + ' Shoe Size Converter';
      return link('programmatic-pages/' + r.slug + '.html', label);
    });
    if (peopleLinks.length) sections.push('<div class="session-depth-block"><h3 class="session-depth-block__title">People Also Convert</h3><ul class="session-depth-links">' + peopleLinks.join('') + '</ul></div>');
  } else if (pageType === 'clothing' && clothingRoutes.length) {
    const others = clothingRoutes.filter(r => r.type === 'clothing_size_pair' && r.slug !== route.slug).slice(0, 8);
    const peopleLinks = others.map(r => {
      const g = r.gender === 'men' ? "Men's" : r.gender === 'women' ? "Women's" : "Kids'";
      const cat = (r.category === 'tops' ? 'Tops' : r.category === 'pants' ? 'Pants' : r.category === 'dresses' ? 'Dresses' : r.category === 'jackets' ? 'Jackets' : r.category) || '';
      const label = `${g} ${getFromRegionLabel(r.from_region)} ${r.size} to ${getFromRegionLabel(r.to_region)} ${cat}`;
      return link('clothing/' + r.slug + '.html', label);
    });
    if (peopleLinks.length) sections.push('<div class="session-depth-block"><h3 class="session-depth-block__title">People Also Convert</h3><ul class="session-depth-links">' + peopleLinks.join('') + '</ul></div>');
  } else if (pageType === 'measurement' && measurementRoutes.length) {
    const others = measurementRoutes.filter(r => r.slug && r.slug !== route.slug).slice(0, 8);
    const peopleLinks = others.map(r => {
      const label = r.measurement_type === 'foot_cm' ? `${r.value_cm} cm to ${r.to_region} Shoe Size` : r.measurement_type === 'chest_cm' ? `${r.value_cm} cm chest to ${r.to_region}` : `${r.value_cm} cm waist to ${r.to_region}`;
      return link('measurement/' + r.slug + '.html', label);
    });
    if (peopleLinks.length) sections.push('<div class="session-depth-block"><h3 class="session-depth-block__title">People Also Convert</h3><ul class="session-depth-links">' + peopleLinks.join('') + '</ul></div>');
  } else if (pageType === 'brand' && brandRoutes.length) {
    const others = brandRoutes.filter(r => r.type === 'brand_converter' && r.slug !== route.slug).slice(0, 6);
    const peopleLinks = others.map(r => link('brands/' + r.slug + '.html', (r.brand || r.slug) + ' Size Guide'));
    if (peopleLinks.length) sections.push('<div class="session-depth-block"><h3 class="session-depth-block__title">People Also Convert</h3><ul class="session-depth-links">' + peopleLinks.join('') + '</ul></div>');
  }

  // 2. Related Fit Problems (semantic: fit_guides, measurement_guides)
  if (semanticRoutes.length) {
    const fitRelated = semanticRoutes.filter(r => r.type === 'semantic' && r.slug && r.slug !== route.slug);
    const fitFirst = fitRelated.filter(r => r.semantic_category === 'fit_guides').slice(0, 3);
    const measFirst = fitRelated.filter(r => r.semantic_category === 'measurement_guides').slice(0, 2);
    const rest = fitRelated.filter(r => !['fit_guides', 'measurement_guides'].includes(r.semantic_category)).slice(0, 3);
    const fitLinks = [...fitFirst, ...measFirst, ...rest].slice(0, 6).map(r => link('semantic/' + r.slug + '.html', r.title || r.slug.replace(/-/g, ' ')));
    if (fitLinks.length) sections.push('<div class="session-depth-block"><h3 class="session-depth-block__title">Related Fit Problems</h3><ul class="session-depth-links">' + fitLinks.join('') + '</ul></div>');
  }

  // 3. Try These Measurements (measurement converter pages)
  if (measurementRoutes.length && pageType !== 'measurement') {
    const value = route.value_cm || (route.size && parseFloat(route.size)) || 26;
    const num = typeof value === 'number' ? value : parseFloat(value) || 26;
    const nearby = measurementRoutes.filter(r => r.slug && r.slug !== route.slug).slice(0, 8);
    const tryLinks = nearby.map(r => {
      const label = r.measurement_type === 'foot_cm' ? `${r.value_cm} cm to ${r.to_region} shoe size` : r.measurement_type === 'chest_cm' ? `${r.value_cm} cm chest to ${r.to_region}` : `${r.value_cm} cm waist to ${r.to_region}`;
      return link('measurement/' + r.slug + '.html', label);
    });
    if (tryLinks.length) sections.push('<div class="session-depth-block"><h3 class="session-depth-block__title">Try These Measurements</h3><ul class="session-depth-links">' + tryLinks.join('') + '</ul></div>');
  }

  // 4. Other Sizes Near Yours
  if ((pageType === 'programmatic' || pageType === 'size_pair') && (route.type === 'size_pair' || !route.type) && route.from_region && route.to_region && route.size != null) {
    const sizeNum = parseFloat(route.size);
    const nearby = programmaticRoutes.filter(r => (r.type === 'size_pair' || !r.type) && r.from_region === route.from_region && r.to_region === route.to_region && r.gender === route.gender && r.slug !== route.slug);
    const withDist = nearby.map(r => ({ r, d: Math.abs(parseFloat(r.size) - sizeNum) })).sort((a, b) => a.d - b.d).slice(0, 7).map(x => x.r);
    const otherLinks = withDist.map(r => link('programmatic-pages/' + r.slug + '.html', getFromRegionLabel(r.from_region) + ' ' + r.size + ' to ' + getFromRegionLabel(r.to_region)));
    if (otherLinks.length) sections.push('<div class="session-depth-block"><h3 class="session-depth-block__title">Other Sizes Near Yours</h3><ul class="session-depth-links">' + otherLinks.join('') + '</ul></div>');
  } else if (pageType === 'clothing' && route.category && route.size != null) {
    const sizeNum = parseFloat(route.size);
    const nearby = clothingRoutes.filter(r => r.type === 'clothing_size_pair' && r.category === route.category && r.gender === route.gender && r.slug !== route.slug);
    const withDist = nearby.map(r => ({ r, d: Math.abs(parseFloat(r.size) - sizeNum) })).sort((a, b) => a.d - b.d).slice(0, 6).map(x => x.r);
    const otherLinks = withDist.map(r => link('clothing/' + r.slug + '.html', getFromRegionLabel(r.from_region) + ' ' + r.size + ' to ' + getFromRegionLabel(r.to_region)));
    if (otherLinks.length) sections.push('<div class="session-depth-block"><h3 class="session-depth-block__title">Other Sizes Near Yours</h3><ul class="session-depth-links">' + otherLinks.join('') + '</ul></div>');
  } else if (pageType === 'measurement' && route.value_cm != null) {
    const num = parseFloat(route.value_cm);
    const nearby = measurementRoutes.filter(r => r.slug !== route.slug && r.measurement_type === route.measurement_type);
    const withDist = nearby.map(r => ({ r, d: Math.abs(parseFloat(r.value_cm) - num) })).sort((a, b) => a.d - b.d).slice(0, 6).map(x => x.r);
    const otherLinks = withDist.map(r => link('measurement/' + r.slug + '.html', r.value_cm + ' cm to ' + r.to_region));
    if (otherLinks.length) sections.push('<div class="session-depth-block"><h3 class="session-depth-block__title">Other Sizes Near Yours</h3><ul class="session-depth-links">' + otherLinks.join('') + '</ul></div>');
  }

  // 5. Same Brand — Different Region (brand pages: other brand guides, same/different category)
  if (pageType === 'brand' && brandRoutes.length) {
    const others = brandRoutes.filter(r => r.type === 'brand_converter' && r.slug !== route.slug).slice(0, 6);
    const sameLinks = others.map(r => link('brands/' + r.slug + '.html', (r.brand || r.slug) + ' ' + (r.category === 'shoes' ? 'Shoe' : 'Clothing') + ' Guide'));
    if (sameLinks.length) sections.push('<div class="session-depth-block"><h3 class="session-depth-block__title">Same Brand — Different Region</h3><ul class="session-depth-links">' + sameLinks.join('') + '</ul></div>');
  }

  if (sections.length === 0) return '';
  return '<section class="content-section session-depth-modules" data-module="session-depth" data-session-depth="true" aria-label="Explore more conversions"><h2 class="session-depth-modules__heading">Explore more</h2><div class="session-depth-modules__grid">' + sections.join('') + '</div></section>';
}

// --- Phase 11 Objective 4: Conversion Loop Modules ---
/**
 * Build conversion loop section(s): contextual "If X didn't fit, try…" / "Measure again using CM…" / "Brand sizing runs small — check…".
 * Links to semantic pages, measurement tools, similar sizes, brand pages.
 */
function buildConversionLoopSection(route, opts) {
  const currentFile = opts.currentFile || 'programmatic-pages/index.html';
  const pageType = opts.pageType || (route && route.type) || 'programmatic';
  const programmaticRoutes = opts.programmaticRoutes || [];
  const semanticRoutes = opts.semanticRoutes || [];
  let measurementRoutes = opts.measurementRoutes;
  let clothingRoutes = opts.clothingRoutes;
  let brandRoutes = opts.brandRoutes;

  if (!measurementRoutes && fs.existsSync(path.join(DATA_DIR, 'measurement_routes.json'))) {
    measurementRoutes = _sessionDepthMeasurementRoutes || loadJson(path.join(DATA_DIR, 'measurement_routes.json'));
  }
  if (!clothingRoutes && fs.existsSync(path.join(DATA_DIR, 'clothing_routes.json'))) {
    clothingRoutes = _sessionDepthClothingRoutes || loadJson(path.join(DATA_DIR, 'clothing_routes.json'));
  }
  if (!brandRoutes && fs.existsSync(path.join(DATA_DIR, 'brand_routes.json'))) {
    brandRoutes = _sessionDepthBrandRoutes || loadJson(path.join(DATA_DIR, 'brand_routes.json'));
  }
  measurementRoutes = measurementRoutes || [];
  brandRoutes = brandRoutes || [];

  const link = (targetPath, text) => `<li><a href="${escapeHtml(internalLinkBuilder.href(currentFile, targetPath))}">${escapeHtml(text)}</a></li>`;

  const blocks = [];

  // Size pair: "If [FROM] [SIZE] didn't fit, try…"
  if ((pageType === 'programmatic' || pageType === 'size_pair') && (route.type === 'size_pair' || !route.type) && route.from_region && route.to_region && route.size != null) {
    const fromLabel = getFromRegionLabel(route.from_region);
    const sizeNum = parseFloat(route.size);
    const links = [];
    const nearby = programmaticRoutes.filter(r => (r.type === 'size_pair' || !r.type) && r.from_region === route.from_region && r.to_region === route.to_region && r.gender === route.gender && r.slug !== route.slug);
    const withDist = nearby.map(r => ({ r, d: Math.abs(parseFloat(r.size) - sizeNum) })).sort((a, b) => a.d - b.d).slice(0, 3).map(x => x.r);
    withDist.forEach(r => links.push(link('programmatic-pages/' + r.slug + '.html', fromLabel + ' ' + r.size + ' to ' + getFromRegionLabel(r.to_region))));
    const meas = semanticRoutes.find(r => r.semantic_category === 'measurement_guides');
    if (meas) links.push(link('semantic/' + meas.slug + '.html', 'How to measure your feet in CM'));
    const fit = semanticRoutes.find(r => r.semantic_category === 'fit_guides');
    if (fit) links.push(link('semantic/' + fit.slug + '.html', 'Common fit mistakes'));
    if (measurementRoutes.length) {
      const foot = measurementRoutes.find(r => r.measurement_type === 'foot_cm');
      if (foot) links.push(link('measurement/' + foot.slug + '.html', 'Convert cm to shoe size'));
    }
    links.push(link('tools/measurement-assistant.html', 'Measurement Assistant tool'));
    if (links.length) blocks.push('<div class="conversion-loop__block"><h3 class="conversion-loop__title">If ' + escapeHtml(fromLabel) + ' ' + escapeHtml(String(route.size)) + ' didn\'t fit, try…</h3><ul class="conversion-loop__links">' + links.slice(0, 6).join('') + '</ul></div>');
  }

  // Region/category: "Not sure of your size? Try…"
  if ((pageType === 'programmatic' || pageType === 'region' || pageType === 'category') && (route.type === 'region' || route.type === 'category')) {
    const links = [];
    semanticRoutes.filter(r => r.type === 'semantic' && (r.semantic_category === 'measurement_guides' || r.semantic_category === 'fit_guides')).slice(0, 2).forEach(r => links.push(link('semantic/' + r.slug + '.html', r.title || r.slug.replace(/-/g, ' '))));
    if (measurementRoutes.length) links.push(link('measurement/' + measurementRoutes[0].slug + '.html', 'Convert cm to shoe size'));
    links.push(link('tools/measurement-assistant.html', 'Measurement Assistant'));
    if (links.length) blocks.push('<div class="conversion-loop__block"><h3 class="conversion-loop__title">Not sure of your size? Try…</h3><ul class="conversion-loop__links">' + links.join('') + '</ul></div>');
  }

  // Clothing: "Size varies by brand — check…"
  if (pageType === 'clothing') {
    const links = [];
    semanticRoutes.filter(r => r.type === 'semantic').slice(0, 2).forEach(r => links.push(link('semantic/' + r.slug + '.html', r.title || r.slug.replace(/-/g, ' '))));
    if (brandRoutes.length) links.push(link('brands/' + brandRoutes[0].slug + '.html', (brandRoutes[0].brand || '') + ' size guide'));
    links.push(link('tools/measurement-assistant.html', 'Measurement Assistant'));
    links.push(link('clothing-size-converter.html', 'Clothing Size Converter'));
    if (links.length) blocks.push('<div class="conversion-loop__block"><h3 class="conversion-loop__title">Size varies by brand — check…</h3><ul class="conversion-loop__links">' + links.slice(0, 5).join('') + '</ul></div>');
  }

  // Brand: "Brand sizing runs small — check…"
  if (pageType === 'brand' && route.brand) {
    const links = [];
    const meas = semanticRoutes.find(r => r.semantic_category === 'measurement_guides');
    if (meas) links.push(link('semantic/' + meas.slug + '.html', 'How to measure in CM'));
    const fit = semanticRoutes.find(r => r.semantic_category === 'fit_guides');
    if (fit) links.push(link('semantic/' + fit.slug + '.html', 'Fit and sizing tips'));
    links.push(link('tools/measurement-assistant.html', 'Measurement Assistant'));
    brandRoutes.filter(r => r.slug !== route.slug).slice(0, 2).forEach(r => links.push(link('brands/' + r.slug + '.html', (r.brand || r.slug) + ' size guide')));
    if (links.length) blocks.push('<div class="conversion-loop__block"><h3 class="conversion-loop__title">' + escapeHtml(route.brand) + ' sizing runs small — check…</h3><ul class="conversion-loop__links">' + links.slice(0, 5).join('') + '</ul></div>');
  }

  // Measurement: "Measure again using CM…"
  if (pageType === 'measurement') {
    const links = [];
    const meas = semanticRoutes.find(r => r.semantic_category === 'measurement_guides');
    if (meas) links.push(link('semantic/' + meas.slug + '.html', 'How to measure your feet in CM'));
    links.push(link('tools/measurement-assistant.html', 'Measurement Assistant tool'));
    links.push(link('shoe-size-converter.html', 'Shoe Size Converter'));
    measurementRoutes.filter(r => r.slug !== route.slug).slice(0, 2).forEach(r => links.push(link('measurement/' + r.slug + '.html', r.value_cm + ' cm to ' + r.to_region)));
    if (links.length) blocks.push('<div class="conversion-loop__block"><h3 class="conversion-loop__title">Measure again using CM…</h3><ul class="conversion-loop__links">' + links.slice(0, 5).join('') + '</ul></div>');
  }

  if (blocks.length === 0) return '';
  return '<section class="conversion-loop content-section" data-module="conversion-loop" data-conversion-loop="true" aria-label="Next steps"><div class="conversion-loop__inner">' + blocks.join('') + '</div></section>';
}

// --- Phase 11 Objective 6: Behavioral Recommendation Engine ---
/**
 * buildBehavioralRecommendations(route, opts) — suggests next logical size, next region,
 * similar garment, measurement page, brand comparison. Output: <section class="next-step">.
 */
function buildBehavioralRecommendations(route, opts) {
  const currentFile = opts.currentFile || 'programmatic-pages/index.html';
  const pageType = opts.pageType || (route && route.type) || 'programmatic';
  let programmaticRoutes = opts.programmaticRoutes || [];
  const semanticRoutes = opts.semanticRoutes || [];
  let measurementRoutes = opts.measurementRoutes;
  let clothingRoutes = opts.clothingRoutes;
  let brandRoutes = opts.brandRoutes;

  if (!programmaticRoutes.length && fs.existsSync(path.join(DATA_DIR, 'programmatic_routes.json'))) {
    programmaticRoutes = loadJson(path.join(DATA_DIR, 'programmatic_routes.json'));
  }
  if (!measurementRoutes && fs.existsSync(path.join(DATA_DIR, 'measurement_routes.json'))) {
    measurementRoutes = _sessionDepthMeasurementRoutes || loadJson(path.join(DATA_DIR, 'measurement_routes.json'));
  }
  if (!clothingRoutes && fs.existsSync(path.join(DATA_DIR, 'clothing_routes.json'))) {
    clothingRoutes = _sessionDepthClothingRoutes || loadJson(path.join(DATA_DIR, 'clothing_routes.json'));
  }
  if (!brandRoutes && fs.existsSync(path.join(DATA_DIR, 'brand_routes.json'))) {
    brandRoutes = _sessionDepthBrandRoutes || loadJson(path.join(DATA_DIR, 'brand_routes.json'));
  }
  measurementRoutes = measurementRoutes || [];
  clothingRoutes = clothingRoutes || [];
  brandRoutes = brandRoutes || [];

  const link = (targetPath, text) => `<li><a href="${escapeHtml(internalLinkBuilder.href(currentFile, targetPath))}">${escapeHtml(text)}</a></li>`;

  const blocks = [];

  // --- Next logical size ---
  if ((pageType === 'programmatic' || pageType === 'size_pair') && (route.type === 'size_pair' || !route.type) && route.from_region && route.to_region && route.size != null && programmaticRoutes.length) {
    const [prevR, nextR] = findAdjacentSizes(route, programmaticRoutes);
    const fromLabel = getFromRegionLabel(route.from_region);
    const toLabel = getFromRegionLabel(route.to_region);
    const items = [];
    if (prevR) items.push(link('programmatic-pages/' + prevR.slug + '.html', fromLabel + ' ' + prevR.size + ' to ' + toLabel));
    if (nextR) items.push(link('programmatic-pages/' + nextR.slug + '.html', fromLabel + ' ' + nextR.size + ' to ' + toLabel));
    if (items.length) blocks.push('<div class="next-step__block"><h3 class="next-step__title">Next logical size</h3><ul class="next-step__links">' + items.join('') + '</ul></div>');
  } else if ((route.type === 'region' || route.type === 'category') && programmaticRoutes.length) {
    const sizePairs = programmaticRoutes.filter(r => (r.type === 'size_pair' || !r.type) && r.from_region && r.size != null);
    if (route.type === 'region') {
      const same = sizePairs.filter(r => r.from_region === route.from_region && r.to_region === route.to_region).slice(0, 3);
      const items = same.map(r => link('programmatic-pages/' + r.slug + '.html', getFromRegionLabel(r.from_region) + ' ' + r.size + ' to ' + getFromRegionLabel(r.to_region)));
      if (items.length) blocks.push('<div class="next-step__block"><h3 class="next-step__title">Next logical size</h3><ul class="next-step__links">' + items.join('') + '</ul></div>');
    } else {
      const same = sizePairs.filter(r => r.gender === route.gender).slice(0, 3);
      const items = same.map(r => link('programmatic-pages/' + r.slug + '.html', getFromRegionLabel(r.from_region) + ' ' + r.size + ' to ' + getFromRegionLabel(r.to_region)));
      if (items.length) blocks.push('<div class="next-step__block"><h3 class="next-step__title">Next logical size</h3><ul class="next-step__links">' + items.join('') + '</ul></div>');
    }
  }

  // --- Next region ---
  if (programmaticRoutes.length) {
    const regionRoutes = programmaticRoutes.filter(r => r.type === 'region');
    const otherRegions = route.type === 'region' ? regionRoutes.filter(r => r.slug !== route.slug) : regionRoutes;
    const items = otherRegions.slice(0, 4).map(r => link('programmatic-pages/' + r.slug + '.html', getFromRegionLabel(r.from_region) + ' to ' + getFromRegionLabel(r.to_region) + ' Shoe Size'));
    if (items.length) blocks.push('<div class="next-step__block"><h3 class="next-step__title">Next region</h3><ul class="next-step__links">' + items.join('') + '</ul></div>');
  }

  // --- Similar garment ---
  if (pageType === 'clothing' && clothingRoutes.length) {
    const others = clothingRoutes.filter(r => r.type === 'clothing_size_pair' && r.slug !== route.slug && (r.category === route.category || r.gender === route.gender)).slice(0, 4);
    const items = others.map(r => {
      const g = r.gender === 'men' ? "Men's" : r.gender === 'women' ? "Women's" : "Kids'";
      const cat = (r.category === 'tops' ? 'Tops' : r.category === 'pants' ? 'Pants' : r.category === 'dresses' ? 'Dresses' : r.category === 'jackets' ? 'Jackets' : r.category) || '';
      return link('clothing/' + r.slug + '.html', g + ' ' + getFromRegionLabel(r.from_region) + ' ' + r.size + ' to ' + getFromRegionLabel(r.to_region) + ' ' + cat);
    });
    if (items.length) blocks.push('<div class="next-step__block"><h3 class="next-step__title">Similar garment</h3><ul class="next-step__links">' + items.join('') + '</ul></div>');
  } else if ((pageType === 'programmatic' || pageType === 'size_pair' || route.type === 'region' || route.type === 'category') && clothingRoutes.length) {
    const sample = clothingRoutes.filter(r => r.type === 'clothing_size_pair').slice(0, 3);
    const items = sample.map(r => link('clothing/' + r.slug + '.html', (r.gender === 'women' ? "Women's" : r.gender === 'men' ? "Men's" : "Kids'") + ' ' + getFromRegionLabel(r.from_region) + ' ' + r.size + ' to ' + getFromRegionLabel(r.to_region)));
    items.push(link('clothing-size-converter.html', 'Clothing Size Converter'));
    if (items.length) blocks.push('<div class="next-step__block"><h3 class="next-step__title">Similar garment</h3><ul class="next-step__links">' + items.join('') + '</ul></div>');
  }

  // --- Measurement page ---
  if (measurementRoutes.length) {
    const foot = measurementRoutes.find(r => r.measurement_type === 'foot_cm');
    const sample = measurementRoutes.filter(r => r.slug).slice(0, 3);
    const items = [];
    if (foot) items.push(link('measurement/' + foot.slug + '.html', 'Convert cm to shoe size'));
    sample.filter(r => r.slug !== (foot && foot.slug)).forEach(r => {
      if (items.length >= 4) return;
      const label = r.measurement_type === 'foot_cm' ? r.value_cm + ' cm to ' + r.to_region + ' shoe' : r.measurement_type === 'chest_cm' ? r.value_cm + ' cm chest' : r.value_cm + ' cm waist';
      items.push(link('measurement/' + r.slug + '.html', label));
    });
    const measGuide = semanticRoutes.find(r => r.semantic_category === 'measurement_guides');
    if (measGuide) items.push(link('semantic/' + measGuide.slug + '.html', measGuide.title || 'How to measure'));
    if (items.length) blocks.push('<div class="next-step__block"><h3 class="next-step__title">Measurement page</h3><ul class="next-step__links">' + items.slice(0, 4).join('') + '</ul></div>');
  }

  // --- Brand comparison ---
  if (brandRoutes.length) {
    const sample = brandRoutes.filter(r => r.type === 'brand_converter').slice(0, 4);
    const items = sample.map(r => link('brands/' + r.slug + '.html', (r.brand || r.slug) + ' size guide'));
    if (items.length) blocks.push('<div class="next-step__block"><h3 class="next-step__title">Brand comparison</h3><ul class="next-step__links">' + items.join('') + '</ul></div>');
  }

  if (blocks.length === 0) return '';
  return '<section class="next-step content-section" data-module="behavioral-recommendations" aria-label="Recommended next steps"><h2 class="next-step__heading">Recommended next steps</h2><div class="next-step__inner">' + blocks.join('') + '</div></section>';
}

// --- Phase 11 Objective 7: High RPM Content Modules (time on page, scroll depth, ad viewability) ---
/**
 * Auto-inject "Fit Problems Explained", "Why Sizes Vary", "Brand Differences", "Regional Differences"
 * from semantic pages. Content = description snippet + read-more link.
 */
function buildHighRPMContentModules(route, opts) {
  const currentFile = opts.currentFile || 'programmatic-pages/index.html';
  const semanticRoutes = opts.semanticRoutes || [];
  let brandRoutes = opts.brandRoutes || [];
  if (!brandRoutes.length && fs.existsSync(path.join(DATA_DIR, 'brand_routes.json'))) {
    brandRoutes = _sessionDepthBrandRoutes || loadJson(path.join(DATA_DIR, 'brand_routes.json'));
  }
  brandRoutes = brandRoutes || [];

  const href = (targetPath) => internalLinkBuilder.href(currentFile, targetPath);

  function block(title, snippet, links) {
    if (!snippet && !links.length) return '';
    const linkHtml = links.length ? '<p class="high-rpm-module__read-more">' + links.map(l => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.text)}</a>`).join(' · ') + '</p>' : '';
    return '<div class="high-rpm-module"><h3 class="high-rpm-module__title">' + escapeHtml(title) + '</h3><p class="high-rpm-module__snippet">' + escapeHtml(snippet || '') + '</p>' + linkHtml + '</div>';
  }

  const modules = [];

  // 1. Fit Problems Explained — measurement_guides + sizing_myths
  const fitMeas = semanticRoutes.find(r => r.type === 'semantic' && r.semantic_category === 'measurement_guides');
  const fitMyths = semanticRoutes.find(r => r.type === 'semantic' && r.semantic_category === 'sizing_myths');
  const fitSnippet = [fitMeas && fitMeas.description, fitMyths && fitMyths.description].filter(Boolean).join(' ') || 'Fit issues often come from wrong measurements or mixing regional scales. Measure in CM and use our converter for your region.';
  const fitLinks = [];
  if (fitMeas) fitLinks.push({ href: href('semantic/' + fitMeas.slug + '.html'), text: fitMeas.title || 'How to measure' });
  if (fitMyths) fitLinks.push({ href: href('semantic/' + fitMyths.slug + '.html'), text: fitMyths.title || 'Common mistakes' });
  if (fitLinks.length || fitSnippet) modules.push(block('Fit Problems Explained', fitSnippet, fitLinks));

  // 2. Why Sizes Vary — sizing_standards + sizing_myths
  const whyStandards = semanticRoutes.find(r => r.type === 'semantic' && r.semantic_category === 'sizing_standards');
  const whyMyths = semanticRoutes.find(r => r.type === 'semantic' && r.semantic_category === 'sizing_myths');
  const whySnippet = [whyStandards && whyStandards.description, whyMyths && whyMyths.description].filter(Boolean).join(' ') || 'Sizing systems differ by country and brand. US, UK, EU, and Japan use different scales; conversion charts align them.';
  const whyLinks = [];
  if (whyStandards) whyLinks.push({ href: href('semantic/' + whyStandards.slug + '.html'), text: whyStandards.title || 'How sizing works' });
  if (whyMyths) whyLinks.push({ href: href('semantic/' + whyMyths.slug + '.html'), text: whyMyths.title || 'Sizing mistakes' });
  if (whyLinks.length || whySnippet) modules.push(block('Why Sizes Vary', whySnippet, whyLinks));

  // 3. Brand Differences — no semantic category; static copy + link to brand guides
  const brandSnippet = sanitizeForApprovalMode('Brands use different lasts and fit models. Nike often runs small; Adidas and Puma can differ by style. Always check the brand\'s size chart before buying.');
  const brandLinks = [{ href: href('brand-size-guides.html'), text: 'Brand size guides' }];
  if (brandRoutes.length) brandLinks.push({ href: href('brands/' + brandRoutes[0].slug + '.html'), text: (brandRoutes[0].brand || '') + ' size guide' });
  modules.push(block('Brand Differences', brandSnippet, brandLinks));

  // 4. Regional Differences — regional_differences
  const regional = semanticRoutes.filter(r => r.type === 'semantic' && r.semantic_category === 'regional_differences');
  const regionalSnippet = regional.length ? regional.map(r => r.description).filter(Boolean).join(' ') : 'EU, US, UK, and Japanese shoe sizes use different numbering systems. EU is often about 1–1.5 larger than US for the same length.';
  const regionalLinks = regional.slice(0, 3).map(r => ({ href: href('semantic/' + r.slug + '.html'), text: r.title || r.slug.replace(/-/g, ' ') }));
  if (!regionalLinks.length) regionalLinks.push({ href: href('semantic/why-eu-and-us-sizes-differ.html'), text: 'Why EU and US sizes differ' });
  modules.push(block('Regional Differences', regionalSnippet.slice(0, 320), regionalLinks));

  if (modules.length === 0) return '';
  return '<section class="high-rpm-modules content-section" data-module="high-rpm" aria-label="Fit and sizing explained"><h2 class="high-rpm-modules__heading">Fit and sizing explained</h2><div class="high-rpm-modules__grid">' + modules.filter(Boolean).join('') + '</div></section>';
}

function generatePage(route, template, shoeData, allRoutes, semanticRoutes = [], authorityGraph = {}) {
  const slug = route.slug;
  const fileName = slug + '.html';
  const currentFile = 'programmatic-pages/' + fileName;
  const canonicalUrl = `${BASE_URL}/programmatic-pages/${fileName}`;
  const breadcrumb = buildBreadcrumb(route, fileName);
  const sizingKnowledgeHtml = buildSizingKnowledgeSection(route, authorityGraph, semanticRoutes);
  const dataIntentAttr = getDataIntentAttr(route);

  let replacements;

  // TYPE B — Region converter (e.g. eu-to-us-shoe-size)
  if (route.type === 'region') {
    const fromLabel = getFromRegionLabel(route.from_region);
    const toLabel = getFromRegionLabel(route.to_region);
    const h1Title = `${fromLabel} to ${toLabel} Shoe Size Converter`;
    const pageTitle = `${fromLabel} to ${toLabel} Shoe Size Conversion Chart & Converter | GlobalSizeChart.com`;
    const introText = `Convert ${fromLabel} shoe sizes to ${toLabel} instantly. Enter your ${fromLabel} size above to see ${toLabel} and all other regional equivalents.`;
    const metaDescription = `Convert ${fromLabel} to ${toLabel} shoe size. Free converter for ${fromLabel} to ${toLabel} shoe sizes with fit tips and measurement guide.`;
    const keywords = `${fromLabel} to ${toLabel} shoe size, ${fromLabel} ${toLabel} converter, convert ${fromLabel} to ${toLabel}`;
    const conversionExplanation = `Use the converter above to convert any ${fromLabel} shoe size to ${toLabel}. Results also show UK, Japan, China, and CM equivalents. Fit can vary by brand; check the brand's size chart when possible.`;

    const regionFaqFirst = { question: `How do I convert ${fromLabel} shoe sizes to ${toLabel}?`, answer: `Use the converter above. Select your gender, choose ${fromLabel} as source, enter your size, and view ${toLabel} equivalents.` };
    const regionContext = { pageTitle, metaDescription, h1Title, canonicalUrl, fromLabel, toLabel, hasConverter: true, hasMeasurement: true, hasFit: true, firstFaqQuestion: regionFaqFirst.question, firstFaqAnswer: regionFaqFirst.answer };
    const regionEnhanced = enhancedSERPSchemaToScriptTags(generateEnhancedSERPSchema(route, regionContext));

    replacements = {
      '{{PAGE_TITLE}}': pageTitle,
      '{{META_DESCRIPTION}}': metaDescription.replace(/"/g, '&quot;'),
      '{{CANONICAL_URL}}': canonicalUrl,
      '{{KEYWORDS}}': keywords,
      '{{H1_TITLE}}': h1Title,
      '{{INTRO_TEXT}}': introText,
      '{{ORGANIZATION_JSON_LD}}': JSON.stringify(getOrganizationSchema()),
      '{{WEBSITE_JSON_LD}}': JSON.stringify(getWebSiteSchema()),
      '{{WEBPAGE_JSON_LD}}': JSON.stringify(getWebPageSchema({ name: pageTitle, description: metaDescription, url: canonicalUrl })),
      '{{BREADCRUMB_HTML}}': breadcrumb.html,
      '{{BREADCRUMB_JSON_LD}}': breadcrumb.jsonLd,
      '{{GENDER_OPTIONS}}': buildGenderOptions('men'),
      '{{FROM_REGION_OPTIONS}}': buildFromRegionOptions(route.from_region),
      '{{SIZE_VALUE}}': '',
      '{{CONVERSION_EXPLANATION}}': conversionExplanation,
      '{{FIT_GUIDE_SNIPPET}}': buildFitGuideSnippet(fromLabel, toLabel),
      '{{MEASUREMENT_GUIDE_SNIPPET}}': MEASUREMENT_GUIDE_SNIPPET,
      '{{FAQ_CONTENT}}': buildRegionFaqContent(fromLabel, toLabel),
      '{{FAQ_JSON_LD}}': buildRegionFaqJsonLd(fromLabel, toLabel),
      '{{ENHANCED_SERP_SCHEMAS}}': regionEnhanced,
      '{{SIZING_KNOWLEDGE_SECTION}}': sizingKnowledgeHtml,
      '{{RELATED_SIZE_GRID}}': generateRelatedGridForRegionOrCategory(route, allRoutes),
      '{{INTERNAL_LINK_GRAPH}}': buildInternalLinkGraph(route, allRoutes, semanticRoutes, currentFile),
      '{{REGION_CONVERTERS_SECTION}}': buildRegionConvertersSection(currentFile),
      '{{AUTHORITY_LINKS_SECTION}}': buildAuthorityLinksSection(currentFile),
      '{{CRAWL_DISCOVERY_LINKS}}': '',
      '{{DISCOVERY_GRID_LINKS}}': '',
      '{{INTERNAL_LINKS}}': '',
      '{{DATA_INTENT}}': dataIntentAttr,
      '{{CONVERSION_LOOP_MODULES}}': buildConversionLoopSection(route, { pageType: route.type || 'size_pair', programmaticRoutes: allRoutes, semanticRoutes, currentFile }),
      '{{BEHAVIORAL_RECOMMENDATIONS}}': buildBehavioralRecommendations(route, { pageType: route.type || 'size_pair', programmaticRoutes: allRoutes, semanticRoutes, currentFile }),
      '{{HIGH_RPM_CONTENT_MODULES}}': buildHighRPMContentModules(route, { semanticRoutes, currentFile }),
      '{{SESSION_DEPTH_MODULES}}': generateSessionDepthModules(route, { pageType: route.type || 'size_pair', programmaticRoutes: allRoutes, semanticRoutes, currentFile }),
      '{{COMMERCIAL_CONTENT_BLOCKS}}': buildCommercialContentBlocks(route)
    };
  }
  // TYPE C — Category (e.g. mens-shoe-size-converter)
  else if (route.type === 'category') {
    const gender = route.gender;
    const genderLabel = getGenderLabel(gender);
    const genderCap = gender === 'men' ? "Men's" : gender === 'women' ? "Women's" : "Kids'";
    const h1Title = `${genderCap} Shoe Size Converter`;
    const pageTitle = `${genderCap} Shoe Size Converter - US, UK, EU, JP, CM | GlobalSizeChart.com`;
    const introText = `Convert ${genderLabel} shoe sizes between US, UK, EU, Japan, China, and CM. Enter your size above to see all regional equivalents.`;
    const metaDescription = `${genderCap} shoe size converter. Convert ${genderLabel} sizes between US, UK, EU, Japan, China, and CM with fit tips and measurement guide.`;
    const keywords = `${genderLabel} shoe size converter, ${genderCap} shoe size, convert ${genderLabel} shoe size`;
    const conversionExplanation = `Use the converter above to convert ${genderLabel} shoe sizes across all regions. Select your current region and size to see US, UK, EU, Japan, China, and CM equivalents. Fit can vary by brand.`;

    const categoryFaqFirst = { question: `How do I convert ${genderLabel} shoe sizes?`, answer: `Use the converter above. Select your region and enter your ${genderLabel} size to see US, UK, EU, JP, CN, and CM equivalents.` };
    const categoryContext = { pageTitle, metaDescription, h1Title, canonicalUrl, genderLabel, hasConverter: true, hasMeasurement: true, hasFit: true, firstFaqQuestion: categoryFaqFirst.question, firstFaqAnswer: categoryFaqFirst.answer };
    const categoryEnhanced = enhancedSERPSchemaToScriptTags(generateEnhancedSERPSchema(route, categoryContext));

    replacements = {
      '{{PAGE_TITLE}}': pageTitle,
      '{{META_DESCRIPTION}}': metaDescription.replace(/"/g, '&quot;'),
      '{{CANONICAL_URL}}': canonicalUrl,
      '{{KEYWORDS}}': keywords,
      '{{H1_TITLE}}': h1Title,
      '{{INTRO_TEXT}}': introText,
      '{{ORGANIZATION_JSON_LD}}': JSON.stringify(getOrganizationSchema()),
      '{{WEBSITE_JSON_LD}}': JSON.stringify(getWebSiteSchema()),
      '{{WEBPAGE_JSON_LD}}': JSON.stringify(getWebPageSchema({ name: pageTitle, description: metaDescription, url: canonicalUrl })),
      '{{BREADCRUMB_HTML}}': breadcrumb.html,
      '{{BREADCRUMB_JSON_LD}}': breadcrumb.jsonLd,
      '{{GENDER_OPTIONS}}': buildGenderOptions(gender),
      '{{FROM_REGION_OPTIONS}}': buildFromRegionOptions('US'),
      '{{SIZE_VALUE}}': '',
      '{{CONVERSION_EXPLANATION}}': conversionExplanation,
      '{{FIT_GUIDE_SNIPPET}}': buildFitGuideSnippet('US', 'EU'),
      '{{MEASUREMENT_GUIDE_SNIPPET}}': MEASUREMENT_GUIDE_SNIPPET,
      '{{FAQ_CONTENT}}': buildCategoryFaqContent(genderLabel),
      '{{FAQ_JSON_LD}}': buildCategoryFaqJsonLd(genderLabel),
      '{{ENHANCED_SERP_SCHEMAS}}': categoryEnhanced,
      '{{SIZING_KNOWLEDGE_SECTION}}': sizingKnowledgeHtml,
      '{{RELATED_SIZE_GRID}}': generateRelatedGridForRegionOrCategory(route, allRoutes),
      '{{INTERNAL_LINK_GRAPH}}': buildInternalLinkGraph(route, allRoutes, semanticRoutes, currentFile),
      '{{REGION_CONVERTERS_SECTION}}': buildRegionConvertersSection(currentFile),
      '{{AUTHORITY_LINKS_SECTION}}': buildAuthorityLinksSection(currentFile),
      '{{CRAWL_DISCOVERY_LINKS}}': '',
      '{{DISCOVERY_GRID_LINKS}}': '',
      '{{INTERNAL_LINKS}}': '',
      '{{DATA_INTENT}}': dataIntentAttr,
      '{{CONVERSION_LOOP_MODULES}}': buildConversionLoopSection(route, { pageType: route.type || 'size_pair', programmaticRoutes: allRoutes, semanticRoutes, currentFile }),
      '{{BEHAVIORAL_RECOMMENDATIONS}}': buildBehavioralRecommendations(route, { pageType: route.type || 'size_pair', programmaticRoutes: allRoutes, semanticRoutes, currentFile }),
      '{{HIGH_RPM_CONTENT_MODULES}}': buildHighRPMContentModules(route, { semanticRoutes, currentFile }),
      '{{SESSION_DEPTH_MODULES}}': generateSessionDepthModules(route, { pageType: route.type || 'size_pair', programmaticRoutes: allRoutes, semanticRoutes, currentFile }),
      '{{COMMERCIAL_CONTENT_BLOCKS}}': buildCommercialContentBlocks(route)
    };
  }
  // TYPE A — Size pair (default)
  else {
    const fromLabel = getFromRegionLabel(route.from_region);
    const toLabel = getFromRegionLabel(route.to_region);
    const genderLabel = getGenderLabel(route.gender);

    const row = findShoeConversion(shoeData, route.gender, route.from_region, route.size);
    const toSize = row ? getTargetSize(row, route.to_region) : null;

    const h1Title = `${fromLabel} Size ${route.size} to ${toLabel} Shoe Size Converter`;
    const pageTitle = `${fromLabel} ${route.size} to ${toLabel} Shoe Size Conversion Chart & Converter | GlobalSizeChart.com`;
    const introText = `Convert ${fromLabel} shoe size ${route.size} to ${toLabel} sizes instantly. Get accurate ${genderLabel} conversions and see equivalent sizes in all regions.`;
    const metaDescription = `Convert ${fromLabel} ${route.size} to ${toLabel} shoe size instantly. ${toSize != null ? `Approximate equivalent: ${toLabel} ${toSize}. ` : ''}Includes fit tips and measurement guide.`;
    const keywords = `${fromLabel} ${route.size} to ${toLabel}, ${fromLabel} to ${toLabel} shoe size, convert ${fromLabel} ${route.size}, shoe size conversion`;

    const sizePairFaqQ = `What is ${fromLabel} ${route.size} in ${toLabel} shoes?`;
    const sizePairFaqA = toSize != null ? `${fromLabel} size ${route.size} typically converts to ${toLabel} size ${toSize}. Use the converter above for your exact gender.` : `Use the converter above to find your ${toLabel} equivalent for ${fromLabel} size ${route.size}.`;
    const sizePairContext = { pageTitle, metaDescription, h1Title, canonicalUrl, fromLabel, toLabel, genderLabel, hasConverter: true, hasMeasurement: true, hasFit: true, firstFaqQuestion: sizePairFaqQ, firstFaqAnswer: sizePairFaqA };
    const sizePairEnhanced = enhancedSERPSchemaToScriptTags(generateEnhancedSERPSchema(route, sizePairContext));

    replacements = {
      '{{PAGE_TITLE}}': pageTitle,
      '{{META_DESCRIPTION}}': metaDescription.replace(/"/g, '&quot;'),
      '{{CANONICAL_URL}}': canonicalUrl,
      '{{KEYWORDS}}': keywords,
      '{{H1_TITLE}}': h1Title,
      '{{INTRO_TEXT}}': introText,
      '{{ORGANIZATION_JSON_LD}}': JSON.stringify(getOrganizationSchema()),
      '{{WEBSITE_JSON_LD}}': JSON.stringify(getWebSiteSchema()),
      '{{WEBPAGE_JSON_LD}}': JSON.stringify(getWebPageSchema({ name: pageTitle, description: metaDescription, url: canonicalUrl })),
      '{{BREADCRUMB_HTML}}': breadcrumb.html,
      '{{BREADCRUMB_JSON_LD}}': breadcrumb.jsonLd,
      '{{GENDER_OPTIONS}}': buildGenderOptions(route.gender),
      '{{FROM_REGION_OPTIONS}}': buildFromRegionOptions(route.from_region),
      '{{SIZE_VALUE}}': String(route.size),
      '{{CONVERSION_EXPLANATION}}': buildConversionExplanation(route, toSize, fromLabel, toLabel, genderLabel),
      '{{FIT_GUIDE_SNIPPET}}': buildFitGuideSnippet(fromLabel, toLabel),
      '{{MEASUREMENT_GUIDE_SNIPPET}}': MEASUREMENT_GUIDE_SNIPPET,
      '{{FAQ_CONTENT}}': buildFaqContent(route, toSize, fromLabel, toLabel),
      '{{FAQ_JSON_LD}}': buildFaqJsonLd(route, toSize, fromLabel, toLabel),
      '{{ENHANCED_SERP_SCHEMAS}}': sizePairEnhanced,
      '{{SIZING_KNOWLEDGE_SECTION}}': sizingKnowledgeHtml,
      '{{RELATED_SIZE_GRID}}': generateRelatedSizeGrid(route, allRoutes),
      '{{INTERNAL_LINK_GRAPH}}': buildInternalLinkGraph(route, allRoutes, semanticRoutes, currentFile),
      '{{REGION_CONVERTERS_SECTION}}': buildRegionConvertersSection(currentFile),
      '{{AUTHORITY_LINKS_SECTION}}': buildAuthorityLinksSection(currentFile),
      '{{CRAWL_DISCOVERY_LINKS}}': '',
      '{{DISCOVERY_GRID_LINKS}}': '',
      '{{INTERNAL_LINKS}}': '',
      '{{DATA_INTENT}}': dataIntentAttr,
      '{{CONVERSION_LOOP_MODULES}}': buildConversionLoopSection(route, { pageType: route.type || 'size_pair', programmaticRoutes: allRoutes, semanticRoutes, currentFile }),
      '{{BEHAVIORAL_RECOMMENDATIONS}}': buildBehavioralRecommendations(route, { pageType: route.type || 'size_pair', programmaticRoutes: allRoutes, semanticRoutes, currentFile }),
      '{{HIGH_RPM_CONTENT_MODULES}}': buildHighRPMContentModules(route, { semanticRoutes, currentFile }),
      '{{SESSION_DEPTH_MODULES}}': generateSessionDepthModules(route, { pageType: route.type || 'size_pair', programmaticRoutes: allRoutes, semanticRoutes, currentFile }),
      '{{COMMERCIAL_CONTENT_BLOCKS}}': buildCommercialContentBlocks(route)
    };
  }

  let html = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    html = html.split(placeholder).join(value);
  }
  html = injectSemanticLinksIntoDocument(html, { isProgrammatic: true, currentSlug: slug });
  return { html, fileName };
}

/** Return { title, canonical, metaRobots } for a route (for indexability report). */
function getPageMeta(route) {
  const fileName = route.slug + '.html';
  const canonical = `${BASE_URL}/programmatic-pages/${fileName}`;
  const metaRobots = 'index, follow';

  if (route.type === 'region') {
    const fromLabel = getFromRegionLabel(route.from_region);
    const toLabel = getFromRegionLabel(route.to_region);
    const title = `${fromLabel} to ${toLabel} Shoe Size Conversion Chart & Converter | GlobalSizeChart.com`;
    return { title, canonical, metaRobots };
  }
  if (route.type === 'category') {
    const genderCap = route.gender === 'men' ? "Men's" : route.gender === 'women' ? "Women's" : "Kids'";
    const title = `${genderCap} Shoe Size Converter - US, UK, EU, JP, CM | GlobalSizeChart.com`;
    return { title, canonical, metaRobots };
  }
  const fromLabel = getFromRegionLabel(route.from_region);
  const toLabel = getFromRegionLabel(route.to_region);
  const title = `${fromLabel} ${route.size} to ${toLabel} Shoe Size Conversion Chart & Converter | GlobalSizeChart.com`;
  return { title, canonical, metaRobots };
}

const BUILD_DIR = path.join(ROOT, 'build');
const INDEXABILITY_REPORT_PATH = path.join(BUILD_DIR, 'indexability-report.json');

/**
 * Build-time indexability validation. Checks: meta robots index,follow; canonical to self;
 * robots.txt not blocking /eu-*, /us-*, /uk-*, /jp-*; no duplicate meta titles.
 * Writes build/indexability-report.json.
 */
function runIndexabilityChecks(routes) {
  const report = {
    missingCanonicals: [],
    duplicateTitles: [],
    blockedPages: [],
    missingMetaRobots: [],
    generatedAt: new Date().toISOString()
  };

  const titleToSlugs = {};
  const expectedCanonicalBase = `${BASE_URL}/programmatic-pages/`;

  for (const route of routes) {
    const meta = getPageMeta(route);
    const slug = route.slug;
    const pagePathForCheck = `/programmatic-pages/${slug}.html`;

    if (!meta.canonical || meta.canonical === BASE_URL + '/' || !meta.canonical.startsWith(expectedCanonicalBase) || meta.canonical !== `${BASE_URL}/programmatic-pages/${slug}.html`) {
      if (meta.canonical !== `${BASE_URL}/programmatic-pages/${slug}.html`) report.missingCanonicals.push({ slug, canonical: meta.canonical || '(missing)' });
    }
    if (!meta.metaRobots || meta.metaRobots.includes('noindex') || meta.metaRobots.includes('nofollow')) {
      report.missingMetaRobots.push({ slug, metaRobots: meta.metaRobots || '(missing)' });
    }
    titleToSlugs[meta.title] = titleToSlugs[meta.title] || [];
    titleToSlugs[meta.title].push(slug);
  }

  for (const [title, slugs] of Object.entries(titleToSlugs)) {
    if (slugs.length > 1) report.duplicateTitles.push({ title, slugs });
  }

  const robotsPath = path.join(ROOT, 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    const robotsTxt = fs.readFileSync(robotsPath, 'utf8');
    const disallows = [];
    for (const line of robotsTxt.split(/\r?\n/)) {
      const m = line.match(/^\s*Disallow:\s*(\S+)/i);
      if (m) disallows.push(m[1].trim());
    }
    for (const route of routes) {
      const pagePath = `/programmatic-pages/${route.slug}.html`;
      for (const disallow of disallows) {
        const rule = disallow.startsWith('/') ? disallow : '/' + disallow;
        if (pagePath.startsWith(rule)) {
          report.blockedPages.push({ slug: route.slug, path: pagePath, disallowRule: rule });
          break;
        }
      }
    }
  }

  ensureDir(BUILD_DIR);
  fs.writeFileSync(INDEXABILITY_REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  if (report.missingCanonicals.length) console.warn('[indexability] missing or wrong canonicals:', report.missingCanonicals.length);
  if (report.duplicateTitles.length) console.warn('[indexability] duplicate meta titles:', report.duplicateTitles.length);
  if (report.blockedPages.length) console.warn('[indexability] pages possibly blocked by robots.txt:', report.blockedPages.length);
  if (report.missingMetaRobots.length) console.warn('[indexability] missing or noindex/nofollow meta robots:', report.missingMetaRobots.length);

  return report;
}

// --- Phase 10: Clothing programmatic engine (type: clothing_size_pair) ---
const CLOTHING_CATEGORY_LABELS = { tops: 'Tops', pants: 'Pants', dresses: 'Dresses', jackets: 'Jackets' };
const CLOTHING_GENDER_LABELS = { men: "Men's", women: "Women's", kids: "Kids'" };

function findClothingConversion(clothingData, gender, category, fromRegion, size) {
  const g = clothingData[gender];
  if (!g) return null;
  const cat = category === 'jackets' ? 'tops' : category;
  const rows = g[cat];
  if (!rows) return null;
  const fromKey = fromRegion.toLowerCase();
  const sizeStr = String(size).trim();
  for (const row of rows) {
    const val = row[fromKey];
    if (val === undefined) continue;
    if (String(val) === sizeStr) return row;
    if (fromKey === 'us' && (row.uk === sizeStr || row.eu === sizeStr)) continue;
    if (parseFloat(val) === parseFloat(sizeStr)) return row;
  }
  return null;
}

function getClothingTargetSize(row, toRegion) {
  if (!row) return null;
  const key = toRegion.toLowerCase();
  const v = row[key];
  return v !== undefined ? v : null;
}

/**
 * Generate Phase 10 clothing programmatic pages from data/clothing_routes.json.
 * Each page: clothing converter CTA, body measurement explanation, fit differences, garment cut, related garments, shoe cross-link, semantic authority links.
 */
function generateClothingProgrammaticPages(clothingRoutes, clothingData, semanticRoutes, authorityGraph) {
  if (!clothingRoutes || clothingRoutes.length === 0) return [];
  ensureDir(CLOTHING_DIR);
  const generated = [];
  const semanticLinks = (semanticRoutes || []).filter(r => r.type === 'semantic').slice(0, 5);
  const brandRoutes = fs.existsSync(path.join(DATA_DIR, 'brand_routes.json')) ? loadJson(path.join(DATA_DIR, 'brand_routes.json')) : [];
  const programmaticRoutes = fs.existsSync(path.join(DATA_DIR, 'programmatic_routes.json')) ? loadJson(path.join(DATA_DIR, 'programmatic_routes.json')) : [];
  const measurementRoutes = fs.existsSync(path.join(DATA_DIR, 'measurement_routes.json')) ? loadJson(path.join(DATA_DIR, 'measurement_routes.json')) : [];

  for (const route of clothingRoutes) {
    if (route.type !== 'clothing_size_pair' || !route.slug) continue;

    const categoryLabel = CLOTHING_CATEGORY_LABELS[route.category] || route.category;
    const genderLabel = CLOTHING_GENDER_LABELS[route.gender] || route.gender;
    const fromLabel = getFromRegionLabel(route.from_region);
    const toLabel = getFromRegionLabel(route.to_region);
    const row = findClothingConversion(clothingData, route.gender, route.category, route.from_region, route.size);
    const toSize = row ? getClothingTargetSize(row, route.to_region) : null;

    const title = `${genderLabel} ${fromLabel} ${route.size} to ${toLabel} ${categoryLabel} Size`;
    const description = route.description || `Convert ${genderLabel} ${fromLabel} size ${route.size} to ${toLabel} for ${categoryLabel.toLowerCase()}. Body measurement guide and fit tips.`;
    const fileName = route.slug + '.html';
    const canonicalUrl = `${BASE_URL}/clothing/${fileName}`;

    const breadcrumbItems = [
      { name: 'Home', url: `${BASE_URL}/` },
      { name: 'Clothing Converter', url: `${BASE_URL}/clothing-size-converter.html` },
      { name: title, url: canonicalUrl }
    ];
    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url }))
    };
    const webPageJsonLd = getWebPageSchema({ name: title, description, url: canonicalUrl });
    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: description,
      url: canonicalUrl,
      datePublished: '2024-01-01',
      publisher: { '@id': ORGANIZATION_ID }
    };
    const dataIntentAttr = getDataIntentAttr(route);

    const relatedGarments = clothingRoutes.filter(r =>
      r.type === 'clothing_size_pair' && r.slug !== route.slug &&
      (r.category === route.category || r.gender === route.gender)
    ).slice(0, 12);
    const similarBrands = brandRoutes.filter(r => r.type === 'brand_converter' && r.slug).slice(0, 8).map(r => ({
      href: 'brands/' + r.slug + '.html',
      text: (r.brand || r.slug) + ' ' + (r.category === 'shoes' ? 'Shoe' : 'Clothing') + ' Size Guide'
    }));
    const fitProblems = (semanticRoutes || []).filter(sr => sr.slug && (sr.semantic_category === 'sizing_myths' || sr.semantic_category === 'measurement_guides' || /fit|mistake|measure/i.test(sr.title || sr.slug))).slice(0, 5).map(sr => ({
      href: 'semantic/' + sr.slug + '.html',
      text: sr.title || sr.slug.replace(/-/g, ' ')
    }));
    const alternativeRegions = [...programmaticRoutes.filter(r => r.type === 'region').slice(0, 4).map(r => ({ href: 'programmatic-pages/' + r.slug + '.html', text: getFromRegionLabel(r.from_region) + ' to ' + getFromRegionLabel(r.to_region) + ' Shoe Size' })), ...programmaticRoutes.filter(r => r.type === 'category').slice(0, 3).map(r => ({ href: 'programmatic-pages/' + r.slug + '.html', text: (r.gender === 'men' ? "Men's" : r.gender === 'women' ? "Women's" : "Kids'") + ' Shoe Size Converter' }))];
    const measurementRefinements = measurementRoutes.filter(r => r.slug).slice(0, 6).map(r => {
      const t = r.measurement_type === 'foot_cm' ? (r.value_cm + ' cm to ' + (r.to_region || 'US') + ' Shoe Size') : r.measurement_type === 'chest_cm' ? (r.value_cm + ' cm Chest to ' + (r.to_region || 'US') + ' Shirt') : (r.value_cm + ' cm Waist to ' + (r.to_region || 'EU') + ' Pants');
      return { href: 'measurement/' + r.slug + '.html', text: t };
    });
    const extraLinks = [
      ...relatedGarments.map(r => {
        const l = CLOTHING_CATEGORY_LABELS[r.category] || r.category;
        return { href: 'clothing/' + r.slug + '.html', text: CLOTHING_GENDER_LABELS[r.gender] + ' ' + getFromRegionLabel(r.from_region) + ' ' + r.size + ' to ' + getFromRegionLabel(r.to_region) + ' ' + l };
      }),
      ...similarBrands,
      ...fitProblems,
      ...alternativeRegions,
      ...measurementRefinements
    ];
    const currentFile = 'clothing/' + fileName;
    const H = (t) => internalLinkBuilder.href(currentFile, t);
    const internalLinksHtml = buildPhase10InternalLinksBlock(currentFile, semanticRoutes, extraLinks, 40);

    let body = '';
    body += `<section class="content-section"><h1>${escapeHtml(title)}</h1>`;
    body += '<div class="ad-slot ad-top" data-module="ad-slot" data-slot="top"></div>';
    body += `<p class="mb-lg">${escapeHtml(description)}${toSize != null ? ` ${fromLabel} ${route.size} converts to approximately ${toLabel} ${toSize} for ${categoryLabel.toLowerCase()}.` : ''} Use the clothing converter below to get all regional equivalents.</p>`;
    body += '<section class="content-section"><h2>Clothing converter tool</h2><p>Convert any clothing size between regions using our main tool:</p><p><a href="' + H('clothing-size-converter.html') + '" class="btn">Use Clothing Size Converter</a></p></section>';
    body += '<div class="ad-slot ad-inline" data-module="ad-slot" data-slot="inline"></div>';
    body += '<section class="content-section"><h2>Body measurement explanation</h2><p>Accurate conversion depends on your body measurements. For tops and jackets, measure your <strong>chest</strong> at the fullest part. For pants, use <strong>waist</strong> and <strong>hips</strong>. For dresses, use bust, waist, and hips. Record measurements in centimeters for the best match to EU and international size charts. Different brands use different fit models—when in doubt, refer to the brand\'s size chart.</p></section>';
    body += '<section class="content-section"><h2>Fit differences</h2><p>' + sanitizeForApprovalMode('US and UK sizing often use different base measurements; EU and Asian sizes may run smaller. <strong>US</strong> tends to be more relaxed; <strong>EU</strong> and <strong>Asian</strong> cuts are often slimmer. Consider sizing up when buying from European or Japanese brands if you prefer a looser fit.') + '</p></section>';
    body += '<section class="content-section"><h2>Garment cut explanation</h2><p>' + categoryLabel + ' sizing varies by cut: slim, regular, and relaxed. Letter sizes (XS, S, M, L) usually reflect chest or bust for tops and dresses; numeric sizes (e.g. 32, 8) often reflect waist or a combined scale. Jackets may follow suit sizing or outerwear-specific charts. Always check the brand\'s size guide for the specific garment.</p></section>';
    body += buildHighRPMContentModules(route, { semanticRoutes, currentFile });
    body += '<div class="ad-slot ad-inline" data-module="ad-slot" data-slot="mid"></div>';
    body += '<div class="fit-warning">' + buildMonetizationModulesForRoute(route) + buildCommercialContentBlocks(route) + '</div>';
    body += '<div class="recommendation-zone">' + buildConversionLoopSection(route, { pageType: 'clothing', clothingRoutes, semanticRoutes, currentFile }) + buildBehavioralRecommendations(route, { pageType: 'clothing', clothingRoutes, semanticRoutes, currentFile }) + generateSessionDepthModules(route, { pageType: 'clothing', clothingRoutes, semanticRoutes, currentFile }) + '</div>';
    body += '<div class="ad-slot ad-bottom" data-module="ad-slot" data-slot="bottom"></div>';
    body += '<div class="comparison-zone"><section class="content-section"><h2>Related links (same garment, hub, tools, guides)</h2><ul class="related-links">' + internalLinksHtml + '</ul></section></div>';
    body += '<section class="content-section"><h2>Shoe sizing</h2><p>Need shoe size conversion? We also convert shoe sizes between US, UK, EU, Japan, and CM:</p><ul><li><a href="' + H('shoe-size-converter.html') + '">Shoe Size Converter</a></li><li><a href="' + H('shoe-sizing-guides.html') + '">Shoe Sizing Guides</a></li><li><a href="' + H('shoe-size-pages.html') + '">Shoe Size Conversion Index</a></li></ul></section>';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonicalUrl}">
  <title>${escapeHtml(title)} | GlobalSizeChart.com</title>
  <link rel="stylesheet" href="${H('styles.css')}">
  <script type="application/ld+json">${JSON.stringify(getOrganizationSchema())}</script>
  <script type="application/ld+json">${JSON.stringify(getWebSiteSchema())}</script>
  <script type="application/ld+json">${JSON.stringify(webPageJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(articleJsonLd)}</script>
</head>
<body ${dataIntentAttr}>
  <header>
    <div class="header-content">
      <a href="${H('index.html')}" class="logo">GlobalSizeChart.com</a>
      <nav>
        <ul>
          <li><a href="${H('index.html')}">Home</a></li>
          <li><a href="${H('shoe-size-converter.html')}">Shoe Converter</a></li>
          <li><a href="${H('clothing-size-converter.html')}">Clothing Converter</a></li>
          <li><a href="${H('measurement-tools.html')}">Measurement Tools</a></li>
          <li><a href="${H('shoe-sizing-guides.html')}">Guides</a></li>
          <li><a href="${H('legal/about.html')}">About</a></li>
          <li><a href="${H('legal/contact.html')}">Contact</a></li>
          <li><a href="${H('legal/privacy.html')}">Privacy</a></li>
        </ul>
      </nav>
    </div>
  </header>
  <main>
    <div class="container">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${H('index.html')}">Home</a> &gt; <a href="${H('clothing-size-converter.html')}">Clothing Converter</a> &gt; <span>${escapeHtml(title)}</span></nav>
      ${body}
      <div class="ad-slot ad-sticky-mobile" data-module="ad-slot" data-slot="sticky-mobile"></div>
    </div>
  </main>
  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Converters</h3>
          <ul>
            <li><a href="${H('clothing-size-converter.html')}">Clothing Size Converter</a></li>
            <li><a href="${H('shoe-size-converter.html')}">Shoe Size Converter</a></li>
            <li><a href="${H('shoe-sizing-guides.html')}">Shoe Sizing Guides</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3>Information</h3>
          <ul>
            <li><a href="${H('legal/privacy.html')}">Privacy</a></li>
            <li><a href="${H('legal/terms.html')}">Terms</a></li>
            <li><a href="${H('legal/disclaimer.html')}">Disclaimer</a></li>
            <li><a href="${H('legal/editorial-policy.html')}">Editorial Policy</a></li>
            <li><a href="${H('legal/contact.html')}">Contact</a></li>
            <li><a href="${H('legal/about.html')}">About</a></li>
            <li><a href="${H('legal/ai-usage-disclosure.html')}">AI Disclosure</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 GlobalSizeChart.com. All rights reserved.</p>
      </div>
    </div>
  </footer>
  <script src="${H('app.js')}"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(CLOTHING_DIR, fileName), html, 'utf8');
    generated.push(fileName);
    console.log('  wrote clothing/' + fileName);
  }
  return generated;
}

// --- Phase 10: Brand converter engine (type: brand_converter) ---
const BRAND_SIZING_COPY = {
  'Nike': { philosophy: 'Nike uses US sizing as the base for most markets; international sizes are converted from US. Athletic shoes often run narrow and slightly small.', inconsistencies: 'Running vs. basketball vs. lifestyle models can vary. Women\'s and men\'s scales differ; kids use age-based sizing in some regions.', fit: 'Tends to run slightly small; many buyers size up half for a comfortable fit, especially in running.' },
  'Adidas': { philosophy: 'Adidas sizing is typically EU-based; US and UK sizes are derived from EU. Consistency across sport and lifestyle lines varies.', inconsistencies: 'EU to US conversion differs by product line. Originals vs. performance fit can vary.', fit: 'Often runs true to EU size; US customers may find half-size differences from standard US charts.' },
  'Puma': { philosophy: 'Puma uses EU sizing as primary. Conversion to US and UK is standardized but can differ by category.', inconsistencies: 'Suede and lifestyle vs. running may fit differently. Regional labels sometimes differ.', fit: 'Generally true to size for EU; slightly narrow in some styles.' },
  'Zara': { philosophy: 'Zara uses European (EU/ES) sizing for clothing. Cuts are often slim and fashion-forward.', inconsistencies: 'Sizing can vary significantly between collections and garment types. No universal conversion.', fit: 'Runs small compared to US; many shoppers size up one or two for a relaxed fit.' },
  'H&M': { philosophy: 'H&M uses EU sizing. Affordable fashion with European fit standards across men\'s, women\'s, and kids.', inconsistencies: 'Quality and consistency vary by line. Basic vs. premium lines may fit differently.', fit: 'Often runs small; EU size may feel one size smaller than US equivalent.' },
  'Shein': { philosophy: 'Shein uses Asian/EU-influenced sizing. Charts are provided per garment; conversion is not standardized.', inconsistencies: 'Sizing is highly inconsistent between items. Always check the product-specific size chart.', fit: 'Typically runs small. Reviews recommend sizing up; measure yourself and compare to chart.' },
  'Uniqlo': { philosophy: 'Uniqlo uses Japanese sizing with US, EU, and UK equivalents. Focus on consistent basics and technical wear.', inconsistencies: 'JP cm-based sizing is consistent; letter sizes (S/M/L) can differ from Western brands.', fit: 'Often runs slightly small in the shoulders and length; some size up for comfort.' },
  'New Balance': { philosophy: 'New Balance uses US sizing as primary. Wide width options (2E, 4E) are a key differentiator.', inconsistencies: 'US to UK and EU conversion is standard; width options vary by model.', fit: 'Generally true to US size; wide fits run roomy. Consider half size for narrow feet.' },
  'ASOS': { philosophy: 'ASOS is UK-based; sizes are in UK with US, EU, and AU equivalents. Multiple brands and own-label.', inconsistencies: 'Fit varies by brand and product. Own-brand vs. third-party sizing differs.', fit: 'UK sizing; often runs true to size. Check each product\'s size guide.' },
  "Levi's": { philosophy: 'Levi\'s uses US waist/inseam for jeans. Numbered waist (e.g. 32) and length (e.g. 30L) are standard.', inconsistencies: 'Fit (501, 511, etc.) changes how sizing feels. EU and UK use cm or local equivalents.', fit: 'Jeans often run true to waist; inseam is critical. Stretch vs. rigid fits differently.' }
};

function getBrandCopy(brand, category) {
  const key = brand.replace(/\s+/g, '').replace(/&/g, '');
  const copy = BRAND_SIZING_COPY[brand] || BRAND_SIZING_COPY[key] || {
    philosophy: `${brand} uses region-specific sizing. Check the brand\'s official size chart for the product you\'re buying.`,
    inconsistencies: 'Sizing can vary between product lines and regions. Always refer to the item-specific size guide.',
    fit: 'Fit tendencies vary by product. When in doubt, size up or check reviews.'
  };
  return copy;
}

/**
 * Generate Phase 10 brand converter pages from data/brand_routes.json.
 * Modules: brand sizing philosophy, known inconsistencies, fit tendencies, conversion tables, generic converter links, user fit warnings, semantic links.
 */
function generateBrandConverters(brandRoutes, semanticRoutes) {
  if (!brandRoutes || brandRoutes.length === 0) return [];
  ensureDir(BRANDS_DIR);
  const generated = [];
  const semanticLinks = (semanticRoutes || []).filter(r => r.type === 'semantic').slice(0, 5);

  for (const route of brandRoutes) {
    if (route.type !== 'brand_converter' || !route.slug) continue;

    const brand = route.brand || 'Brand';
    const category = route.category || 'shoes';
    const categoryLabel = category === 'shoes' ? 'Shoe' : 'Clothing';
    const regionLabel = getFromRegionLabel(route.region || 'US');
    const copy = getBrandCopy(brand, category);

    const title = `${brand} ${categoryLabel} Size Guide & Conversion`;
    const description = `${brand} size chart and conversion: ${category} sizing for ${regionLabel}, fit tips, and how to convert ${brand} sizes to US, UK, and EU.`;
    const fileName = route.slug + '.html';
    const canonicalUrl = `${BASE_URL}/brands/${fileName}`;

    const breadcrumbItems = [
      { name: 'Home', url: `${BASE_URL}/` },
      { name: category === 'shoes' ? 'Shoe Size Converter' : 'Clothing Size Converter', url: `${BASE_URL}/${category === 'shoes' ? 'shoe-size-converter' : 'clothing-size-converter'}.html` },
      { name: `${brand} Size Guide`, url: canonicalUrl }
    ];
    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url }))
    };
    const webPageJsonLd = getWebPageSchema({ name: title, description, url: canonicalUrl });
    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: description,
      url: canonicalUrl,
      datePublished: '2024-01-01',
      publisher: { '@id': ORGANIZATION_ID }
    };
    const dataIntentAttr = getDataIntentAttr(route);

    const conversionTable = category === 'shoes'
      ? `<table class="size-table" aria-label="Approximate shoe size conversion"><thead><tr><th>US</th><th>UK</th><th>EU</th></tr></thead><tbody><tr><td>7</td><td>6</td><td>40</td></tr><tr><td>8</td><td>7</td><td>41</td></tr><tr><td>9</td><td>8</td><td>42</td></tr><tr><td>10</td><td>9</td><td>43</td></tr><tr><td>11</td><td>10</td><td>44</td></tr></tbody></table>`
      : `<table class="size-table" aria-label="Approximate clothing size conversion"><thead><tr><th>US</th><th>UK</th><th>EU</th></tr></thead><tbody><tr><td>S</td><td>S</td><td>46</td></tr><tr><td>M</td><td>M</td><td>48</td></tr><tr><td>L</td><td>L</td><td>50</td></tr><tr><td>XL</td><td>XL</td><td>52</td></tr></tbody></table>`;

    const sameBrandLinks = brandRoutes.filter(r => r.type === 'brand_converter' && r.slug !== route.slug).map(r => ({
      href: 'brands/' + r.slug + '.html',
      text: (r.brand || r.slug) + ' ' + (r.category === 'shoes' ? 'Shoe' : 'Clothing') + ' Size Guide'
    }));
    const clothingRoutesForBrand = fs.existsSync(path.join(DATA_DIR, 'clothing_routes.json')) ? loadJson(path.join(DATA_DIR, 'clothing_routes.json')) : [];
    const programmaticRoutesForBrand = fs.existsSync(path.join(DATA_DIR, 'programmatic_routes.json')) ? loadJson(path.join(DATA_DIR, 'programmatic_routes.json')) : [];
    const measurementRoutesForBrand = fs.existsSync(path.join(DATA_DIR, 'measurement_routes.json')) ? loadJson(path.join(DATA_DIR, 'measurement_routes.json')) : [];
    const similarGarments = clothingRoutesForBrand.filter(r => r.type === 'clothing_size_pair' && r.slug).slice(0, 8).map(r => {
      const cat = r.category === 'tops' ? 'Tops' : r.category === 'pants' ? 'Pants' : r.category === 'dresses' ? 'Dresses' : r.category;
      const g = r.gender === 'men' ? "Men's" : r.gender === 'women' ? "Women's" : "Kids'";
      return { href: 'clothing/' + r.slug + '.html', text: g + ' ' + getFromRegionLabel(r.from_region) + ' ' + r.size + ' to ' + getFromRegionLabel(r.to_region) + ' ' + cat };
    });
    const fitProblemsBrand = (semanticRoutes || []).filter(sr => sr.slug && (sr.semantic_category === 'sizing_myths' || sr.semantic_category === 'measurement_guides' || /fit|mistake|measure/i.test(sr.title || sr.slug))).slice(0, 5).map(sr => ({
      href: 'semantic/' + sr.slug + '.html',
      text: sr.title || sr.slug.replace(/-/g, ' ')
    }));
    const alternativeRegionsBrand = [...programmaticRoutesForBrand.filter(r => r.type === 'region').slice(0, 4).map(r => ({ href: 'programmatic-pages/' + r.slug + '.html', text: getFromRegionLabel(r.from_region) + ' to ' + getFromRegionLabel(r.to_region) + ' Shoe Size' })), ...programmaticRoutesForBrand.filter(r => r.type === 'category').slice(0, 3).map(r => ({ href: 'programmatic-pages/' + r.slug + '.html', text: (r.gender === 'men' ? "Men's" : r.gender === 'women' ? "Women's" : "Kids'") + ' Shoe Size Converter' }))];
    const measurementRefinementsBrand = measurementRoutesForBrand.filter(r => r.slug).slice(0, 6).map(r => {
      const t = r.measurement_type === 'foot_cm' ? (r.value_cm + ' cm to ' + (r.to_region || 'US') + ' Shoe Size') : r.measurement_type === 'chest_cm' ? (r.value_cm + ' cm Chest to ' + (r.to_region || 'US') + ' Shirt') : (r.value_cm + ' cm Waist to ' + (r.to_region || 'EU') + ' Pants');
      return { href: 'measurement/' + r.slug + '.html', text: t };
    });
    const brandExtraLinks = [...sameBrandLinks, ...similarGarments, ...fitProblemsBrand, ...alternativeRegionsBrand, ...measurementRefinementsBrand];
    const currentFileBrand = 'brands/' + fileName;
    const HB = (t) => internalLinkBuilder.href(currentFileBrand, t);
    const brandInternalLinksHtml = buildPhase10InternalLinksBlock(currentFileBrand, semanticRoutes, brandExtraLinks, 40);

    let body = '';
    body += `<section class="content-section"><h1>${escapeHtml(title)}</h1>`;
    body += '<div class="ad-slot ad-top" data-module="ad-slot" data-slot="top"></div>';
    body += `<p class="mb-lg">${escapeHtml(description)} Use the sections below to understand ${brand} sizing, fit tendencies, and how to convert to your region. For exact conversions, use our generic converters linked at the bottom.</p>`;
    body += `<section class="content-section"><h2>Brand sizing philosophy</h2><p>${escapeHtml(copy.philosophy)}</p></section>`;
    body += `<section class="content-section"><h2>Known inconsistencies</h2><p>${escapeHtml(copy.inconsistencies)}</p></section>`;
    body += `<section class="content-section"><h2>Fit tendencies</h2><p>${escapeHtml(copy.fit)}</p></section>`;
    const categoryNoun = category === 'shoes' ? 'shoe' : 'clothing';
    body += `<section class="content-section"><h2>Conversion comparison</h2><p>Approximate ${categoryNoun} size equivalents (use our converters for exact conversions):</p>${conversionTable}</section>`;
    body += buildHighRPMContentModules(route, { semanticRoutes, brandRoutes, currentFile: currentFileBrand });
    body += '<div class="ad-slot ad-inline" data-module="ad-slot" data-slot="inline"></div>';
    body += '<section class="content-section"><h2>Generic converters</h2><p>Convert any size between regions using our tools:</p><ul><li><a href="' + HB('shoe-size-converter.html') + '">Shoe Size Converter</a></li><li><a href="' + HB('clothing-size-converter.html') + '">Clothing Size Converter</a></li><li><a href="' + HB('shoe-sizing-guides.html') + '">Shoe Sizing Guides</a></li></ul></section>';
    body += '<section class="content-section"><h2>User fit warnings</h2><p><strong>Always check the brand\'s official size chart</strong> for the specific product. Sizing can change by season and style. When between sizes, consider sizing up for comfort or ordering two sizes and returning one. Read recent customer reviews for fit notes.</p></section>';
    body += '<div class="ad-slot ad-inline" data-module="ad-slot" data-slot="mid"></div>';
    body += '<div class="fit-warning">' + buildMonetizationModulesForRoute(route) + buildCommercialContentBlocks(route) + '</div>';
    body += '<div class="recommendation-zone">' + buildConversionLoopSection(route, { pageType: 'brand', brandRoutes, semanticRoutes, currentFile: currentFileBrand }) + buildBehavioralRecommendations(route, { pageType: 'brand', brandRoutes, semanticRoutes, currentFile: currentFileBrand }) + generateSessionDepthModules(route, { pageType: 'brand', brandRoutes, semanticRoutes, currentFile: currentFileBrand }) + '</div>';
    body += '<div class="ad-slot ad-bottom" data-module="ad-slot" data-slot="bottom"></div>';
    body += '<div class="comparison-zone"><section class="content-section"><h2>Related links (same brand, hub, tools, guides)</h2><ul class="related-links">' + brandInternalLinksHtml + '</ul></section></div>';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonicalUrl}">
  <title>${escapeHtml(title)} | GlobalSizeChart.com</title>
  <link rel="stylesheet" href="${HB('styles.css')}">
  <script type="application/ld+json">${JSON.stringify(getOrganizationSchema())}</script>
  <script type="application/ld+json">${JSON.stringify(getWebSiteSchema())}</script>
  <script type="application/ld+json">${JSON.stringify(webPageJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(articleJsonLd)}</script>
</head>
<body ${dataIntentAttr}>
  <header>
    <div class="header-content">
      <a href="${HB('index.html')}" class="logo">GlobalSizeChart.com</a>
      <nav>
        <ul>
          <li><a href="${HB('index.html')}">Home</a></li>
          <li><a href="${HB('shoe-size-converter.html')}">Shoe Converter</a></li>
          <li><a href="${HB('clothing-size-converter.html')}">Clothing Converter</a></li>
          <li><a href="${HB('measurement-tools.html')}">Measurement Tools</a></li>
          <li><a href="${HB('shoe-sizing-guides.html')}">Guides</a></li>
          <li><a href="${HB('legal/about.html')}">About</a></li>
          <li><a href="${HB('legal/contact.html')}">Contact</a></li>
          <li><a href="${HB('legal/privacy.html')}">Privacy</a></li>
        </ul>
      </nav>
    </div>
  </header>
  <main>
    <div class="container">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${HB('index.html')}">Home</a> &gt; <a href="${HB((category === 'shoes' ? 'shoe-size-converter' : 'clothing-size-converter') + '.html')}">${escapeHtml(categoryLabel)} Converter</a> &gt; <span>${escapeHtml(brand)} Size Guide</span></nav>
      ${body}
      <div class="ad-slot ad-sticky-mobile" data-module="ad-slot" data-slot="sticky-mobile"></div>
    </div>
  </main>
  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Converters</h3>
          <ul>
            <li><a href="${HB('shoe-size-converter.html')}">Shoe Size Converter</a></li>
            <li><a href="${HB('clothing-size-converter.html')}">Clothing Size Converter</a></li>
            <li><a href="${HB('shoe-sizing-guides.html')}">Shoe Sizing Guides</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3>Information</h3>
          <ul>
            <li><a href="${HB('legal/privacy.html')}">Privacy</a></li>
            <li><a href="${HB('legal/terms.html')}">Terms</a></li>
            <li><a href="${HB('legal/disclaimer.html')}">Disclaimer</a></li>
            <li><a href="${HB('legal/editorial-policy.html')}">Editorial Policy</a></li>
            <li><a href="${HB('legal/contact.html')}">Contact</a></li>
            <li><a href="${HB('legal/about.html')}">About</a></li>
            <li><a href="${HB('legal/ai-usage-disclosure.html')}">AI Disclosure</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 GlobalSizeChart.com. All rights reserved.</p>
      </div>
    </div>
  </footer>
  <script src="${HB('app.js')}"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(BRANDS_DIR, fileName), html, 'utf8');
    generated.push(fileName);
    console.log('  wrote brands/' + fileName);
  }
  return generated;
}

/**
 * Find closest shoe size row by foot length (cm). Returns { row, rangeRows } for primary and adjacent sizes.
 */
function findShoeByCm(shoeData, gender, valueCm) {
  const arr = shoeData[gender];
  if (!arr || !arr.length) return null;
  let best = null;
  let bestDiff = Infinity;
  let bestIdx = -1;
  for (let i = 0; i < arr.length; i++) {
    const d = Math.abs(arr[i].cm - valueCm);
    if (d < bestDiff) {
      bestDiff = d;
      best = arr[i];
      bestIdx = i;
    }
  }
  if (!best) return null;
  const rangeRows = [best];
  if (bestIdx > 0) rangeRows.unshift(arr[bestIdx - 1]);
  if (bestIdx < arr.length - 1) rangeRows.push(arr[bestIdx + 1]);
  return { row: best, rangeRows };
}

/**
 * Find closest clothing size row by measurement (chest_cm or waist_cm).
 */
function findClothingByCm(clothingData, gender, category, valueCm, measurementKey) {
  const cat = category === 'tops' ? 'tops' : 'pants';
  const arr = clothingData[gender] && clothingData[gender][cat];
  if (!arr || !arr.length) return null;
  let best = null;
  let bestDiff = Infinity;
  let bestIdx = -1;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i][measurementKey];
    if (v == null || v === 0) continue;
    const d = Math.abs(v - valueCm);
    if (d < bestDiff) {
      bestDiff = d;
      best = arr[i];
      bestIdx = i;
    }
  }
  if (!best) return null;
  const rangeRows = [best];
  if (bestIdx > 0 && arr[bestIdx - 1][measurementKey]) rangeRows.unshift(arr[bestIdx - 1]);
  if (bestIdx < arr.length - 1 && arr[bestIdx + 1][measurementKey]) rangeRows.push(arr[bestIdx + 1]);
  return { row: best, rangeRows };
}

/**
 * Generate Phase 10 Objective 3: CM Measurement Master — measurement_converter pages.
 * Measurement-first UX, interactive measurement explanation, precision disclaimers,
 * measurement accuracy guide, conversion ranges, fit recommendation logic.
 */
function generateCMConverters(measurementRoutes, shoeData, clothingData, semanticRoutes = []) {
  if (!measurementRoutes || measurementRoutes.length === 0) return [];
  const routes = measurementRoutes.filter(r => r.type === 'measurement_converter' && r.slug);
  if (routes.length === 0) return [];
  ensureDir(MEASUREMENT_DIR);
  const generated = [];

  for (const route of routes) {
    const { measurement_type, value_cm, to_region, category, gender, slug } = route;
    const genderLabel = gender === 'women' ? "Women's" : gender === 'men' ? "Men's" : "Kids'";
    const toRegionLabel = REGION_LABELS[to_region] || to_region;
    const toKey = to_region.toLowerCase();

    let title = '';
    let description = '';
    let primarySize = null;
    let conversionRangeRows = [];
    let measurementLabel = '';
    let howToSteps = [];
    let accuracyGuide = '';
    let fitRecommendations = '';

    if (category === 'shoes' && measurement_type === 'foot_cm') {
      const result = findShoeByCm(shoeData, gender, value_cm);
      if (!result) continue;
      primarySize = result.row[toKey];
      conversionRangeRows = result.rangeRows;
      const cmLabel = value_cm % 1 === 0 ? `${value_cm} cm` : `${value_cm} cm`;
      measurementLabel = `${cmLabel} foot length`;
      title = `${value_cm} cm to ${to_region} Shoe Size`;
      description = `Convert ${value_cm} cm foot length to ${toRegionLabel} shoe size. ${genderLabel} conversion, measurement guide, and fit tips.`;
      howToSteps = [
        'Place a piece of paper against a wall on a hard floor.',
        'Stand with your heel touching the wall and mark the tip of your longest toe.',
        'Measure from the wall to the mark in centimeters.',
        'Repeat for both feet and use the larger measurement.'
      ];
      accuracyGuide = 'Foot length in cm is the most reliable input for shoe size conversion. Charts assume a standard toe allowance. Brand lasts vary; athletic and fashion shoes can differ. Measure in the evening when feet are slightly larger.';
      fitRecommendations = 'If your measurement falls between two sizes, size up for wide feet or athletic shoes. Size up for thick socks or orthotics. European and Asian brands often run smaller — consider trying one half size up.';
    } else if ((category === 'tops' || category === 'shirts') && measurement_type === 'chest_cm') {
      const result = findClothingByCm(clothingData, gender, 'tops', value_cm, 'chest_cm');
      if (!result) continue;
      primarySize = result.row[toKey];
      conversionRangeRows = result.rangeRows;
      measurementLabel = `${value_cm} cm chest`;
      title = `${value_cm} cm Chest to ${to_region} Shirt Size`;
      description = `Convert ${value_cm} cm chest to ${toRegionLabel} shirt size. ${genderLabel} conversion, how to measure, and fit advice.`;
      howToSteps = [
        'Measure around the fullest part of your chest, under the arms and across the shoulder blades.',
        'Keep the tape horizontal and snug but not tight.',
        'Record the measurement in centimeters.'
      ];
      accuracyGuide = 'Chest measurement is the primary reference for tops and shirts. Sleeve length and shoulder width are not reflected; check brand size charts for long torso or broad shoulders.';
      fitRecommendations = 'If between sizes, size up for a relaxed fit or layering. Slim-fit styles may require the smaller size. Check the brand\'s chest range for the specific garment.';
    } else if (category === 'pants' && measurement_type === 'waist_cm') {
      const result = findClothingByCm(clothingData, gender, 'pants', value_cm, 'waist_cm');
      if (!result) continue;
      primarySize = result.row[toKey];
      conversionRangeRows = result.rangeRows;
      measurementLabel = `${value_cm} cm waist`;
      title = `${value_cm} cm Waist to ${to_region} Pants Size`;
      description = `Convert ${value_cm} cm waist to ${toRegionLabel} pants size. ${genderLabel} conversion, measurement guide, and fit tips.`;
      howToSteps = [
        'Measure around your natural waist (above the navel, below the ribs).',
        'Keep the tape snug but not compressing the skin.',
        'Record the measurement in centimeters.'
      ];
      accuracyGuide = 'Waist in cm maps to standardized pants size charts. Rise (low, mid, high) and stretch content affect fit; always check the brand\'s size chart for the exact garment.';
      fitRecommendations = 'If between sizes, size up for comfort or high-waist styles. Stretch fabrics often allow the smaller size. Consider inseam and rise when ordering.';
    } else {
      continue;
    }

    const fileName = slug + '.html';
    const canonicalUrl = `${BASE_URL}/measurement/${fileName}`;
    const breadcrumbItems = [
      { name: 'Home', url: `${BASE_URL}/` },
      { name: category === 'shoes' ? 'Shoe Size Converter' : 'Clothing Size Converter', url: `${BASE_URL}/${category === 'shoes' ? 'shoe-size-converter' : 'clothing-size-converter'}.html` },
      { name: title, url: canonicalUrl }
    ];
    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url }))
    };
    const webPageJsonLd = getWebPageSchema({ name: title, description, url: canonicalUrl });
    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: description,
      url: canonicalUrl,
      datePublished: '2024-01-01',
      publisher: { '@id': ORGANIZATION_ID }
    };
    const howToJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to measure for ' + title,
      description: description,
      step: howToSteps.map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text }))
    };

    // Conversion range table
    let rangeTable = '<table class="size-table" aria-label="Conversion range"><thead><tr><th>Measurement</th><th>US</th><th>UK</th><th>EU</th></tr></thead><tbody>';
    const regionCols = ['us', 'uk', 'eu'];
    if (category === 'shoes') {
      for (const r of conversionRangeRows) {
        rangeTable += `<tr><td>${r.cm} cm</td><td>${r.us}</td><td>${r.uk}</td><td>${r.eu}</td></tr>`;
      }
    } else {
      const measKey = measurement_type === 'chest_cm' ? 'chest_cm' : 'waist_cm';
      for (const r of conversionRangeRows) {
        rangeTable += `<tr><td>${r[measKey]} cm</td><td>${escapeHtml(String(r.us))}</td><td>${escapeHtml(String(r.uk))}</td><td>${escapeHtml(String(r.eu))}</td></tr>`;
      }
    }
    rangeTable += '</tbody></table>';

    // Interactive measurement explanation (expandable / list)
    const howToHtml = '<ol class="measurement-steps">' + howToSteps.map(s => `<li>${escapeHtml(s)}</li>`).join('') + '</ol>';

    let body = '';
    body += `<section class="content-section measurement-hero"><h1>${escapeHtml(title)}</h1>`;
    body += '<div class="ad-slot ad-top" data-module="ad-slot" data-slot="top"></div>';
    body += `<p class="measurement-lead">Your measurement: <strong>${escapeHtml(measurementLabel)}</strong> → ${genderLabel} ${to_region} size: <strong>${escapeHtml(String(primarySize))}</strong></p>`;
    body += `<p class="mb-lg">Use this page to confirm your size from a CM measurement. See the conversion range and fit recommendations below.</p></section>`;

    body += '<section class="content-section"><h2>How to measure</h2><p>For accurate conversion, measure as follows:</p>' + howToHtml + '</section>';

    body += '<section class="content-section"><h2>Precision disclaimer</h2><p><strong>Conversions are approximate.</strong> Size charts vary by brand and country. This tool uses standard reference charts. Always check the retailer or brand size guide for the specific product. When between sizes, use the fit recommendations below or try both sizes if possible.</p></section>';

    const currentFileMeas = 'measurement/' + slug + '.html';
    body += buildHighRPMContentModules(route, { semanticRoutes, currentFile: currentFileMeas });

    body += '<section class="content-section"><h2>Measurement accuracy guide</h2><p>' + escapeHtml(accuracyGuide) + '</p></section>';

    body += '<section class="content-section"><h2>Conversion range</h2><p>Nearby measurements and their equivalent sizes (reference):</p>' + rangeTable + '</section>';
    body += '<div class="ad-slot ad-inline" data-module="ad-slot" data-slot="inline"></div>';

    body += '<section class="content-section"><h2>Fit recommendations</h2><p>' + escapeHtml(fitRecommendations) + '</p></section>';
    body += '<div class="ad-slot ad-inline" data-module="ad-slot" data-slot="mid"></div>';
    body += '<div class="fit-warning">' + buildMonetizationModulesForRoute(route) + buildCommercialContentBlocks(route) + '</div>';
    body += '<div class="recommendation-zone">' + buildConversionLoopSection(route, { pageType: 'measurement', measurementRoutes: routes, semanticRoutes, currentFile: currentFileMeas }) + buildBehavioralRecommendations(route, { pageType: 'measurement', measurementRoutes: routes, semanticRoutes, currentFile: currentFileMeas }) + generateSessionDepthModules(route, { pageType: 'measurement', measurementRoutes: routes, semanticRoutes, currentFile: currentFileMeas }) + '</div>';

    body += '<div class="ad-slot ad-bottom" data-module="ad-slot" data-slot="bottom"></div>';
    const measurementExtraLinks = routes.filter(r => r.slug !== slug).slice(0, 12).map(r => {
      const t = r.measurement_type === 'foot_cm' ? (r.value_cm + ' cm to ' + r.to_region + ' Shoe Size') : r.measurement_type === 'chest_cm' ? (r.value_cm + ' cm chest to ' + r.to_region + ' Shirt') : (r.value_cm + ' cm waist to ' + r.to_region + ' Pants');
      return { href: 'measurement/' + r.slug + '.html', text: t };
    });
    const brandRoutesMeas = fs.existsSync(path.join(DATA_DIR, 'brand_routes.json')) ? loadJson(path.join(DATA_DIR, 'brand_routes.json')) : [];
    const clothingRoutesMeas = fs.existsSync(path.join(DATA_DIR, 'clothing_routes.json')) ? loadJson(path.join(DATA_DIR, 'clothing_routes.json')) : [];
    const programmaticRoutesMeas = fs.existsSync(path.join(DATA_DIR, 'programmatic_routes.json')) ? loadJson(path.join(DATA_DIR, 'programmatic_routes.json')) : [];
    const similarBrandsMeas = brandRoutesMeas.filter(r => r.type === 'brand_converter' && r.slug).slice(0, 6).map(r => ({ href: 'brands/' + r.slug + '.html', text: (r.brand || r.slug) + ' ' + (r.category === 'shoes' ? 'Shoe' : 'Clothing') + ' Size Guide' }));
    const similarGarmentsMeas = clothingRoutesMeas.filter(r => r.type === 'clothing_size_pair' && r.slug).slice(0, 6).map(r => {
      const cat = r.category === 'tops' ? 'Tops' : r.category === 'pants' ? 'Pants' : r.category === 'dresses' ? 'Dresses' : r.category;
      const g = r.gender === 'men' ? "Men's" : r.gender === 'women' ? "Women's" : "Kids'";
      return { href: 'clothing/' + r.slug + '.html', text: g + ' ' + getFromRegionLabel(r.from_region) + ' ' + r.size + ' to ' + getFromRegionLabel(r.to_region) + ' ' + cat };
    });
    const fitProblemsMeas = (semanticRoutes || []).filter(sr => sr.slug && (sr.semantic_category === 'sizing_myths' || sr.semantic_category === 'measurement_guides' || /fit|mistake|measure/i.test(sr.title || sr.slug))).slice(0, 5).map(sr => ({ href: 'semantic/' + sr.slug + '.html', text: sr.title || sr.slug.replace(/-/g, ' ') }));
    const alternativeRegionsMeas = [...programmaticRoutesMeas.filter(r => r.type === 'region').slice(0, 4).map(r => ({ href: 'programmatic-pages/' + r.slug + '.html', text: getFromRegionLabel(r.from_region) + ' to ' + getFromRegionLabel(r.to_region) + ' Shoe Size' })), ...programmaticRoutesMeas.filter(r => r.type === 'category').slice(0, 3).map(r => ({ href: 'programmatic-pages/' + r.slug + '.html', text: (r.gender === 'men' ? "Men's" : r.gender === 'women' ? "Women's" : "Kids'") + ' Shoe Size Converter' }))];
    const measurementAllLinks = [...measurementExtraLinks, ...similarBrandsMeas, ...similarGarmentsMeas, ...fitProblemsMeas, ...alternativeRegionsMeas];
    const Hmeas = (t) => internalLinkBuilder.href(currentFileMeas, t);
    body += '<div class="comparison-zone"><section class="content-section"><h2>Related links (measurement converters, hub, tools, guides)</h2><ul class="related-links">' + buildPhase10InternalLinksBlock(currentFileMeas, semanticRoutes, measurementAllLinks, 40) + '</ul></section></div>';

    const dataIntentAttr = getDataIntentAttr(route);
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonicalUrl}">
  <title>${escapeHtml(title)} | GlobalSizeChart.com</title>
  <link rel="stylesheet" href="${Hmeas('styles.css')}">
  <script type="application/ld+json">${JSON.stringify(getOrganizationSchema())}</script>
  <script type="application/ld+json">${JSON.stringify(getWebSiteSchema())}</script>
  <script type="application/ld+json">${JSON.stringify(webPageJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(articleJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(howToJsonLd)}</script>
</head>
<body ${dataIntentAttr}>
  <header>
    <div class="header-content">
      <a href="${Hmeas('index.html')}" class="logo">GlobalSizeChart.com</a>
      <nav>
        <ul>
          <li><a href="${Hmeas('index.html')}">Home</a></li>
          <li><a href="${Hmeas('shoe-size-converter.html')}">Shoe Converter</a></li>
          <li><a href="${Hmeas('clothing-size-converter.html')}">Clothing Converter</a></li>
          <li><a href="${Hmeas('measurement-tools.html')}">Measurement Tools</a></li>
          <li><a href="${Hmeas('shoe-sizing-guides.html')}">Guides</a></li>
          <li><a href="${Hmeas('legal/about.html')}">About</a></li>
          <li><a href="${Hmeas('legal/contact.html')}">Contact</a></li>
          <li><a href="${Hmeas('legal/privacy.html')}">Privacy</a></li>
        </ul>
      </nav>
    </div>
  </header>
  <main class="main-content">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${Hmeas('index.html')}">Home</a> &gt; <a href="${Hmeas('shoe-size-converter.html')}">Shoe Converter</a> &gt; <span>${escapeHtml(title)}</span></nav>
    ${body}
    <div class="ad-slot ad-sticky-mobile" data-module="ad-slot" data-slot="sticky-mobile"></div>
  </main>
  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Information</h3>
          <ul>
            <li><a href="${Hmeas('legal/privacy.html')}">Privacy</a></li>
            <li><a href="${Hmeas('legal/terms.html')}">Terms</a></li>
            <li><a href="${Hmeas('legal/disclaimer.html')}">Disclaimer</a></li>
            <li><a href="${Hmeas('legal/editorial-policy.html')}">Editorial Policy</a></li>
            <li><a href="${Hmeas('legal/contact.html')}">Contact</a></li>
            <li><a href="${Hmeas('legal/about.html')}">About</a></li>
            <li><a href="${Hmeas('legal/ai-usage-disclosure.html')}">AI Disclosure</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} GlobalSizeChart.com. Conversions are approximate; check brand size charts.</p>
      </div>
    </div>
  </footer>
  <script src="${Hmeas('app.js')}"></script>
</body>
</html>`;

    fs.writeFileSync(path.join(MEASUREMENT_DIR, fileName), html, 'utf8');
    generated.push(fileName);
    console.log('  wrote measurement/' + fileName);
  }
  return generated;
}

/** Printer-optimized CSS for PDF export and print. */
const PRINTABLE_PAGE_CSS = `
  <link rel="stylesheet" href="../styles.css">
  <style>
    @media print {
      header, footer, .no-print, nav, .screen-only { display: none !important; }
      body { font-size: 11pt; margin: 0; padding: 12mm; background: #fff; color: #000; }
      .printable-content { max-width: none; }
      .printable-content h1 { page-break-after: avoid; }
      .printable-content h2 { page-break-after: avoid; }
      .printable-content section { page-break-inside: avoid; }
      .qr-block { break-inside: avoid; }
      a[href] { text-decoration: underline; }
      a[href]:after { content: " (" attr(href) ")"; font-size: 0.9em; color: #333; }
    }
    @media screen {
      .printable-content { max-width: 800px; margin: 0 auto; padding: 1rem; }
      .print-actions { margin: 1rem 0; }
    }
    .printable-content { padding: 1rem 0; }
    .qr-block { margin: 1rem 0; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; }
    .qr-block img { display: block; margin: 0.5rem 0; }
  </style>`;

/**
 * Build HowTo + Article + WebPage + BreadcrumbList JSON-LD for printable guides (Objective 9).
 */
function buildPrintableSchema(context) {
  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: context.headline,
    description: context.description,
    url: context.canonicalUrl,
    publisher: { '@type': 'Organization', name: 'GlobalSizeChart.com', url: BASE_URL }
  };
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: context.headline,
    description: context.description,
    url: context.canonicalUrl,
    datePublished: context.datePublished || '2024-01-01',
    publisher: { '@type': 'Organization', name: 'GlobalSizeChart.com', url: BASE_URL }
  };
  const howTo = context.howToSteps ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: context.howToName,
    description: context.howToDescription,
    step: context.howToSteps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text }))
  } : null;
  const breadcrumb = context.breadcrumbItems && context.breadcrumbItems.length ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: context.breadcrumbItems.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url }))
  } : null;
  return [webPage, breadcrumb, article, howTo].filter(Boolean).map(s => JSON.stringify(s));
}

/**
 * QR image URL for a given link (use with img src).
 */
function qrImageUrl(url) {
  return 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + encodeURIComponent(url);
}

/**
 * Generate Objective 4: Printable guides — printer-optimized, PDF-friendly, HowTo + Article schema, QR links to converters.
 */
function generatePrintableGuides(shoeData) {
  ensureDir(PRINTABLE_DIR);
  const generated = [];
  const shoeConverterUrl = `${BASE_URL}/shoe-size-converter.html`;
  const clothingConverterUrl = `${BASE_URL}/clothing-size-converter.html`;

  // --- 1. Foot Measuring Sheet ---
  const footSheet = {
    slug: 'foot-measuring-sheet',
    title: 'Foot Measuring Sheet',
    description: 'Printable guide to measure your foot length in cm for accurate shoe size conversion. Includes steps and QR link to shoe size converter.',
    howToSteps: [
      { name: 'Place paper', text: 'Place a piece of paper against a wall on a hard floor.' },
      { name: 'Stand and mark', text: 'Stand with your heel touching the wall. Mark the tip of your longest toe on the paper.' },
      { name: 'Measure', text: 'Measure from the wall to the mark in centimeters. Repeat for both feet and use the larger measurement.' },
      { name: 'Convert', text: 'Use our shoe size converter (scan QR below or visit online) to get your size in US, UK, EU, and more.' }
    ]
  };
  const footSchema = buildPrintableSchema({
    headline: footSheet.title,
    description: footSheet.description,
    canonicalUrl: `${BASE_URL}/printable/${footSheet.slug}.html`,
    howToName: 'How to measure your feet for shoe size',
    howToDescription: footSheet.description,
    howToSteps: footSheet.howToSteps,
    breadcrumbItems: [
      { name: 'Home', url: `${BASE_URL}/` },
      { name: 'Printable Guides', url: `${BASE_URL}/printable/foot-measuring-sheet.html` },
      { name: footSheet.title, url: `${BASE_URL}/printable/${footSheet.slug}.html` }
    ]
  });
  const footHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="description" content="${escapeHtml(footSheet.description)}">
  <link rel="canonical" href="${BASE_URL}/printable/${footSheet.slug}.html">
  <title>${escapeHtml(footSheet.title)} | GlobalSizeChart.com</title>
  ${PRINTABLE_PAGE_CSS}
  ${footSchema.map(s => `<script type="application/ld+json">${s}</script>`).join('\n  ')}
</head>
<body ${getDataIntentAttr({ type: 'printable' })}>
  <header class="screen-only">
    <div class="header-content">
      <a href="../index.html" class="logo">GlobalSizeChart.com</a>
      <nav><ul><li><a href="../index.html">Home</a></li><li><a href="../shoe-size-converter.html">Shoe Converter</a></li><li><a href="foot-measuring-sheet.html">Foot Sheet</a></li></ul></nav>
    </div>
  </header>
  <main class="printable-content">
    <nav class="breadcrumbs screen-only" aria-label="Breadcrumb"><a href="../index.html">Home</a> &gt; <a href="../printable-size-guides.html">Printable Guides</a> &gt; <span>${escapeHtml(footSheet.title)}</span></nav>
    <div class="print-actions screen-only"><button type="button" onclick="window.print()">Print / Save as PDF</button></div>
    <h1>${escapeHtml(footSheet.title)}</h1>
    <p>Use this sheet to measure your foot length in centimeters, then convert to your shoe size online.</p>
    <section>
      <h2>Measurement instructions</h2>
      <ol>
        <li>Place a piece of paper against a wall on a hard floor.</li>
        <li>Stand with your heel touching the wall. Mark the tip of your longest toe on the paper.</li>
        <li>Measure from the wall to the mark in centimeters. Repeat for both feet and use the larger measurement.</li>
        <li>Enter your measurement (in cm) into our shoe size converter to get US, UK, EU, and other sizes.</li>
      </ol>
    </section>
    <section class="qr-block">
      <h2>Convert your measurement online</h2>
      <p>Scan the QR code or visit the link to open our Shoe Size Converter:</p>
      <img src="${qrImageUrl(shoeConverterUrl)}" width="120" height="120" alt="QR code: Shoe Size Converter" />
      <p><strong>Link:</strong> <a href="${shoeConverterUrl}">${shoeConverterUrl}</a></p>
    </section>
  </main>
  <footer class="screen-only"><p>&copy; ${new Date().getFullYear()} GlobalSizeChart.com</p></footer>
</body>
</html>`;
  fs.writeFileSync(path.join(PRINTABLE_DIR, footSheet.slug + '.html'), footHtml, 'utf8');
  generated.push(footSheet.slug + '.html');
  console.log('  wrote printable/' + footSheet.slug + '.html');

  // --- 2. Clothing Measurement Chart ---
  const clothingSheet = {
    slug: 'clothing-measurement-chart',
    title: 'Clothing Measurement Chart',
    description: 'Printable guide to measure chest, waist, and hips in cm for clothing size conversion. Includes QR link to clothing size converter.',
    howToSteps: [
      { name: 'Chest', text: 'Measure around the fullest part of your chest, under the arms and across the shoulder blades. Keep the tape horizontal.' },
      { name: 'Waist', text: 'Measure around your natural waist (above the navel, below the ribs). Snug but not compressing.' },
      { name: 'Hips', text: 'Measure around the fullest part of your hips, keeping the tape horizontal.' },
      { name: 'Convert', text: 'Use our clothing size converter (scan QR below or visit online) to get your size in US, UK, EU.' }
    ]
  };
  const clothingSchema = buildPrintableSchema({
    headline: clothingSheet.title,
    description: clothingSheet.description,
    canonicalUrl: `${BASE_URL}/printable/${clothingSheet.slug}.html`,
    howToName: 'How to measure for clothing size',
    howToDescription: clothingSheet.description,
    howToSteps: clothingSheet.howToSteps,
    breadcrumbItems: [
      { name: 'Home', url: `${BASE_URL}/` },
      { name: 'Printable Guides', url: `${BASE_URL}/printable/${clothingSheet.slug}.html` },
      { name: clothingSheet.title, url: `${BASE_URL}/printable/${clothingSheet.slug}.html` }
    ]
  });
  const clothingHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="description" content="${escapeHtml(clothingSheet.description)}">
  <link rel="canonical" href="${BASE_URL}/printable/${clothingSheet.slug}.html">
  <title>${escapeHtml(clothingSheet.title)} | GlobalSizeChart.com</title>
  ${PRINTABLE_PAGE_CSS}
  ${clothingSchema.map(s => `<script type="application/ld+json">${s}</script>`).join('\n  ')}
</head>
<body ${getDataIntentAttr({ type: 'printable' })}>
  <header class="screen-only">
    <div class="header-content">
      <a href="../index.html" class="logo">GlobalSizeChart.com</a>
      <nav><ul><li><a href="../index.html">Home</a></li><li><a href="../clothing-size-converter.html">Clothing Converter</a></li><li><a href="clothing-measurement-chart.html">Clothing Chart</a></li></ul></nav>
    </div>
  </header>
  <main class="printable-content">
    <nav class="breadcrumbs screen-only" aria-label="Breadcrumb"><a href="../index.html">Home</a> &gt; <a href="../printable-size-guides.html">Printable Guides</a> &gt; <span>${escapeHtml(clothingSheet.title)}</span></nav>
    <div class="print-actions screen-only"><button type="button" onclick="window.print()">Print / Save as PDF</button></div>
    <h1>${escapeHtml(clothingSheet.title)}</h1>
    <p>Measure your chest, waist, and hips in centimeters and use our converter to find your size.</p>
    <section>
      <h2>Measurement instructions</h2>
      <ul>
        <li><strong>Chest:</strong> Around the fullest part of the chest, under the arms, tape horizontal.</li>
        <li><strong>Waist:</strong> Around your natural waist (above navel, below ribs). Snug but not tight.</li>
        <li><strong>Hips:</strong> Around the fullest part of the hips, tape horizontal.</li>
      </ul>
      <p>Record your measurements (cm) below, then use our converter online.</p>
      <table class="size-table" style="margin-top:1em;">
        <thead><tr><th>Measurement</th><th>Your (cm)</th></tr></thead>
        <tbody>
          <tr><td>Chest</td><td>__________</td></tr>
          <tr><td>Waist</td><td>__________</td></tr>
          <tr><td>Hips</td><td>__________</td></tr>
        </tbody>
      </table>
    </section>
    <section class="qr-block">
      <h2>Convert online</h2>
      <p>Scan the QR code or visit the link to open our Clothing Size Converter:</p>
      <img src="${qrImageUrl(clothingConverterUrl)}" width="120" height="120" alt="QR code: Clothing Size Converter" />
      <p><strong>Link:</strong> <a href="${clothingConverterUrl}">${clothingConverterUrl}</a></p>
    </section>
  </main>
  <footer class="screen-only"><p>&copy; ${new Date().getFullYear()} GlobalSizeChart.com</p></footer>
</body>
</html>`;
  fs.writeFileSync(path.join(PRINTABLE_DIR, clothingSheet.slug + '.html'), clothingHtml, 'utf8');
  generated.push(clothingSheet.slug + '.html');
  console.log('  wrote printable/' + clothingSheet.slug + '.html');

  // --- 3. Shoe Size Reference Chart ---
  const refTitle = 'Shoe Size Reference Chart';
  const refDescription = 'Printable US, UK, EU shoe size reference with foot length (cm). Use with our shoe size converter.';
  const menRows = (shoeData && shoeData.men) ? shoeData.men.filter((_, i) => i % 2 === 0).slice(0, 12) : [];
  const womenRows = (shoeData && shoeData.women) ? shoeData.women.filter((_, i) => i % 2 === 0).slice(0, 12) : [];
  let refTableHtml = '<section><h2>Men (approximate)</h2><table class="size-table"><thead><tr><th>US</th><th>UK</th><th>EU</th><th>cm</th></tr></thead><tbody>';
  for (const r of menRows) {
    refTableHtml += `<tr><td>${r.us}</td><td>${r.uk}</td><td>${r.eu}</td><td>${r.cm}</td></tr>`;
  }
  refTableHtml += '</tbody></table></section><section><h2>Women (approximate)</h2><table class="size-table"><thead><tr><th>US</th><th>UK</th><th>EU</th><th>cm</th></tr></thead><tbody>';
  for (const r of womenRows) {
    refTableHtml += `<tr><td>${r.us}</td><td>${r.uk}</td><td>${r.eu}</td><td>${r.cm}</td></tr>`;
  }
  refTableHtml += '</tbody></table></section>';
  const refSchema = buildPrintableSchema({
    headline: refTitle,
    description: refDescription,
    canonicalUrl: `${BASE_URL}/printable/shoe-size-reference-chart.html`,
    howToName: 'How to use the shoe size reference',
    howToDescription: refDescription,
    howToSteps: [
      { name: 'Find your cm', text: 'Measure your foot length in cm (see our Foot Measuring Sheet) or find your usual size in the table.' },
      { name: 'Convert', text: 'Use our online shoe size converter (QR below) for full conversion to all regions.' }
    ],
    breadcrumbItems: [
      { name: 'Home', url: `${BASE_URL}/` },
      { name: 'Printable Guides', url: `${BASE_URL}/printable/shoe-size-reference-chart.html` },
      { name: refTitle, url: `${BASE_URL}/printable/shoe-size-reference-chart.html` }
    ]
  });
  const refHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="description" content="${escapeHtml(refDescription)}">
  <link rel="canonical" href="${BASE_URL}/printable/shoe-size-reference-chart.html">
  <title>${escapeHtml(refTitle)} | GlobalSizeChart.com</title>
  ${PRINTABLE_PAGE_CSS}
  ${refSchema.map(s => `<script type="application/ld+json">${s}</script>`).join('\n  ')}
</head>
<body ${getDataIntentAttr({ type: 'printable' })}>
  <header class="screen-only">
    <div class="header-content">
      <a href="../index.html" class="logo">GlobalSizeChart.com</a>
      <nav><ul><li><a href="../index.html">Home</a></li><li><a href="../shoe-size-converter.html">Shoe Converter</a></li><li><a href="shoe-size-reference-chart.html">Reference Chart</a></li></ul></nav>
    </div>
  </header>
  <main class="printable-content">
    <nav class="breadcrumbs screen-only" aria-label="Breadcrumb"><a href="../index.html">Home</a> &gt; <a href="../printable-size-guides.html">Printable Guides</a> &gt; <span>${escapeHtml(refTitle)}</span></nav>
    <div class="print-actions screen-only"><button type="button" onclick="window.print()">Print / Save as PDF</button></div>
    <h1>${escapeHtml(refTitle)}</h1>
    <p>Reference table for US, UK, EU shoe sizes and foot length in cm. For full conversion use our online converter.</p>
    ${refTableHtml}
    <section class="qr-block">
      <h2>Full converter online</h2>
      <p>Scan the QR code or visit the link for the full Shoe Size Converter (all sizes and regions):</p>
      <img src="${qrImageUrl(shoeConverterUrl)}" width="120" height="120" alt="QR code: Shoe Size Converter" />
      <p><strong>Link:</strong> <a href="${shoeConverterUrl}">${shoeConverterUrl}</a></p>
    </section>
  </main>
  <footer class="screen-only"><p>&copy; ${new Date().getFullYear()} GlobalSizeChart.com</p></footer>
</body>
</html>`;
  fs.writeFileSync(path.join(PRINTABLE_DIR, 'shoe-size-reference-chart.html'), refHtml, 'utf8');
  generated.push('shoe-size-reference-chart.html');
  console.log('  wrote printable/shoe-size-reference-chart.html');

  return generated;
}

/**
 * Generate Objective 5: Interactive Measurement Tool — /tools/measurement-assistant.html
 * Foot calculator, clothing assistant, unit converter, dynamic size recommendation,
 * interactive visual guides, semantic explanation modules. Schema: SoftwareApplication, HowTo, FAQ.
 */
function generateMeasurementTools(shoeData, clothingData) {
  ensureDir(TOOLS_DIR);
  const canonicalUrl = `${BASE_URL}/tools/measurement-assistant.html`;
  const title = 'Measurement Assistant';
  const description = 'Interactive foot and clothing measurement calculator with inch/cm converter, size recommendations, and visual guides.';

  const breadcrumbItems = [
    { name: 'Home', url: `${BASE_URL}/` },
    { name: 'Sizing Guides', url: `${BASE_URL}/shoe-sizing-guides.html` },
    { name: title, url: canonicalUrl }
  ];
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url }))
  };
  const webPageSchema = getWebPageSchema({ name: title, description, url: canonicalUrl });
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    url: canonicalUrl,
    datePublished: '2024-01-01',
    publisher: { '@id': ORGANIZATION_ID }
  };
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Measurement Assistant',
    applicationCategory: 'WebApplication',
    description: description,
    url: canonicalUrl,
    featureList: 'Foot measurement calculator, clothing measurement assistant, unit converter (inch/cm), dynamic size recommendation, interactive visual guides',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
  };
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to use the Measurement Assistant',
    description: 'Enter your measurements in cm or inches to get shoe and clothing size recommendations.',
    step: [
      { '@type': 'HowToStep', position: 1, name: 'Use unit converter', text: 'Convert between inches and centimeters if needed (1 inch = 2.54 cm).' },
      { '@type': 'HowToStep', position: 2, name: 'Foot measurement', text: 'Enter your foot length in cm or inches and select gender to see US, UK, EU shoe size.' },
      { '@type': 'HowToStep', position: 3, name: 'Clothing measurements', text: 'Enter chest, waist, and hips in cm or inches; select gender and category for size recommendation.' },
      { '@type': 'HowToStep', position: 4, name: 'Review recommendation', text: 'Check the dynamic size recommendation summary. Always verify with the brand size chart.' }
    ]
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'How do I measure my foot for shoe size?', acceptedAnswer: { '@type': 'Answer', text: 'Measure from the back of your heel to the tip of your longest toe on a flat surface, with your weight on that foot. Use the larger foot if they differ.' } },
      { '@type': 'Question', name: 'How do I measure chest for clothing?', acceptedAnswer: { '@type': 'Answer', text: 'Measure around the fullest part of your chest, under your arms and across the shoulder blades. Keep the tape horizontal and snug but not tight.' } },
      { '@type': 'Question', name: 'Are these size recommendations accurate?', acceptedAnswer: { '@type': 'Answer', text: 'Recommendations are based on standard size charts. Brands vary; always check the retailer\'s size guide for the specific item.' } }
    ]
  };

  const shoeDataJson = JSON.stringify(shoeData || {});
  const clothingDataJson = JSON.stringify(clothingData || {});

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonicalUrl}">
  <title>${escapeHtml(title)} | GlobalSizeChart.com</title>
  <link rel="stylesheet" href="../styles.css">
  <style>
    .tool-section { margin: 1.5rem 0; padding: 1rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa; }
    .tool-section h2 { margin-top: 0; }
    .tool-row { margin: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .tool-row label { min-width: 100px; }
    .tool-row input, .tool-row select { padding: 0.35rem 0.5rem; }
    .recommendation-box { background: #e8f4f8; border: 1px solid #0a7ea4; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
    .recommendation-box h3 { margin-top: 0; }
    .visual-guide { max-width: 280px; margin: 1rem 0; }
    .visual-guide svg { width: 100%; height: auto; }
    .explanation-module { margin: 1rem 0; padding: 1rem; background: #fff; border-left: 4px solid #0a7ea4; }
    .faq-item { margin: 0.75rem 0; }
    .faq-item summary { cursor: pointer; font-weight: bold; }
  </style>
  <script type="application/ld+json">${JSON.stringify(getOrganizationSchema())}</script>
  <script type="application/ld+json">${JSON.stringify(getWebSiteSchema())}</script>
  <script type="application/ld+json">${JSON.stringify(webPageSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(softwareSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(howToSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
</head>
<body ${getDataIntentAttr({ type: 'tool' })}>
  <header>
    <div class="header-content">
      <a href="../index.html" class="logo">GlobalSizeChart.com</a>
      <nav>
        <ul>
          <li><a href="../index.html">Home</a></li>
          <li><a href="../shoe-size-converter.html">Shoe Converter</a></li>
          <li><a href="../clothing-size-converter.html">Clothing Converter</a></li>
          <li><a href="../measurement-tools.html">Measurement Tools</a></li>
          <li><a href="../shoe-sizing-guides.html">Guides</a></li>
          <li><a href="../legal/about.html">About</a></li>
          <li><a href="../legal/contact.html">Contact</a></li>
          <li><a href="../legal/privacy.html">Privacy</a></li>
        </ul>
      </nav>
    </div>
  </header>
  <main class="main-content" style="max-width: 900px; margin: 0 auto; padding: 1rem;">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a> &gt; <a href="../measurement-tools.html">Measurement Tools</a> &gt; <span>Measurement Assistant</span></nav>
    <h1>Measurement Assistant</h1>
    <p>Use the tools below to convert units, calculate shoe size from foot length, get clothing size recommendations, and see a combined size summary. All recommendations are approximate; always check the brand size chart.</p>

    <div class="recommendation-box" id="recommendation-box" aria-live="polite">
      <h3>Dynamic size recommendation</h3>
      <p id="recommendation-text">Enter measurements above to see your recommended sizes here.</p>
    </div>

    <section class="tool-section" id="unit-converter">
      <h2>Unit converter (inch / cm)</h2>
      <p class="explanation-module">Convert between inches and centimeters. 1 inch = 2.54 cm. Use this to enter your measurements in either unit.</p>
      <div class="tool-row">
        <label for="input-cm">Centimeters</label>
        <input type="number" id="input-cm" step="0.1" min="0" placeholder="cm" aria-label="Centimeters">
        <span>cm</span>
      </div>
      <div class="tool-row">
        <label for="input-in">Inches</label>
        <input type="number" id="input-in" step="0.01" min="0" placeholder="in" aria-label="Inches">
        <span>in</span>
      </div>
    </section>

    <section class="tool-section" id="foot-calculator">
      <h2>Foot measurement calculator</h2>
      <div class="visual-guide" aria-hidden="true">
        <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="60" cy="35" rx="45" ry="18" fill="none" stroke="#333" stroke-width="1.5"/>
          <line x1="15" y1="35" x2="105" y2="35" stroke="#0a7ea4" stroke-width="2" stroke-dasharray="4 2"/>
          <text x="60" y="52" text-anchor="middle" font-size="8" fill="#555">Measure heel to longest toe</text>
        </svg>
      </div>
      <div class="explanation-module">Enter your foot length (heel to longest toe). Measure in the evening when feet are slightly larger. Use the larger foot if they differ.</div>
      <div class="tool-row">
        <label for="foot-cm">Foot length (cm)</label>
        <input type="number" id="foot-cm" step="0.1" min="15" max="35" placeholder="e.g. 26" aria-label="Foot length in cm">
        <span>cm</span>
      </div>
      <div class="tool-row">
        <label for="foot-gender">Gender</label>
        <select id="foot-gender" aria-label="Gender for shoe size">
          <option value="men">Men</option>
          <option value="women">Women</option>
          <option value="kids">Kids</option>
        </select>
      </div>
      <div class="tool-row">
        <strong>Shoe size:</strong>
        <span id="shoe-result" aria-live="polite">—</span>
      </div>
    </section>

    <section class="tool-section" id="clothing-assistant">
      <h2>Clothing measurement assistant</h2>
      <div class="visual-guide" aria-hidden="true">
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 10 L65 25 L65 45 Q65 55 50 58 Q35 55 35 45 L35 25 Z" fill="none" stroke="#333" stroke-width="1.5"/>
          <line x1="50" y1="28" x2="50" y2="42" stroke="#0a7ea4" stroke-width="1.5" stroke-dasharray="3 2"/>
          <text x="50" y="25" text-anchor="middle" font-size="7" fill="#555">chest</text>
          <line x1="50" y1="48" x2="50" y2="58" stroke="#0a7ea4" stroke-width="1.5" stroke-dasharray="3 2"/>
          <text x="50" y="65" text-anchor="middle" font-size="7" fill="#555">waist</text>
          <ellipse cx="50" cy="85" rx="22" ry="12" fill="none" stroke="#333" stroke-width="1"/>
          <text x="50" y="100" text-anchor="middle" font-size="7" fill="#555">hips</text>
        </svg>
      </div>
      <div class="explanation-module">Chest: fullest part under arms. Waist: natural waist above navel. Hips: fullest part. Keep tape horizontal and snug but not tight.</div>
      <div class="tool-row">
        <label for="chest">Chest (cm)</label>
        <input type="number" id="chest" step="1" min="0" placeholder="—" aria-label="Chest in cm">
        <span>cm</span>
      </div>
      <div class="tool-row">
        <label for="waist">Waist (cm)</label>
        <input type="number" id="waist" step="1" min="0" placeholder="—" aria-label="Waist in cm">
        <span>cm</span>
      </div>
      <div class="tool-row">
        <label for="hips">Hips (cm)</label>
        <input type="number" id="hips" step="1" min="0" placeholder="—" aria-label="Hips in cm">
        <span>cm</span>
      </div>
      <div class="tool-row">
        <label for="cloth-gender">Gender</label>
        <select id="cloth-gender" aria-label="Gender for clothing">
          <option value="men">Men</option>
          <option value="women">Women</option>
        </select>
      </div>
      <div class="tool-row">
        <label for="cloth-category">Category</label>
        <select id="cloth-category" aria-label="Tops or pants">
          <option value="tops">Tops / Shirts</option>
          <option value="pants">Pants</option>
        </select>
      </div>
      <div class="tool-row">
        <strong>Recommended size:</strong>
        <span id="clothing-result" aria-live="polite">—</span>
      </div>
    </section>

    <section class="tool-section">
      <h2>Semantic explanation modules</h2>
      <details class="faq-item">
        <summary>How is foot length measured?</summary>
        <p>Foot length is measured from the back of the heel to the tip of the longest toe. Stand on a flat surface with your weight on the foot being measured. Measure both feet and use the larger value. Chart conversions assume a standard toe allowance; brand lasts vary.</p>
      </details>
      <details class="faq-item">
        <summary>What do chest, waist, and hips mean for clothing?</summary>
        <p><strong>Chest:</strong> Around the fullest part of the chest, under the arms, tape horizontal. <strong>Waist:</strong> Your natural waist, usually above the navel and below the ribs. <strong>Hips:</strong> Around the fullest part of the hips/seat. Keep the tape snug but not compressing.</p>
      </details>
      <details class="faq-item">
        <summary>Why do size recommendations vary by brand?</summary>
        <p>Size charts are not standardized globally. Different brands use different fit models, ease, and grading. Always use this tool as a starting point and check the retailer's size guide for the specific garment.</p>
      </details>
    </section>

    <section class="tool-section">
      <h2>Related tools</h2>
      <ul>
        <li><a href="../shoe-size-converter.html">Shoe Size Converter</a></li>
        <li><a href="../clothing-size-converter.html">Clothing Size Converter</a></li>
        <li><a href="../printable/foot-measuring-sheet.html">Printable Foot Measuring Sheet</a></li>
        <li><a href="../printable/clothing-measurement-chart.html">Printable Clothing Measurement Chart</a></li>
      </ul>
    </section>
  </main>
  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Converters</h3>
          <ul>
            <li><a href="../shoe-size-converter.html">Shoe Size Converter</a></li>
            <li><a href="../clothing-size-converter.html">Clothing Size Converter</a></li>
            <li><a href="../us-to-eu-size.html">US to EU Size</a></li>
            <li><a href="../uk-to-us-size.html">UK to US Size</a></li>
            <li><a href="../cm-to-us-shoe-size.html">CM to US Shoe Size</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3>Information</h3>
          <ul>
            <li><a href="../legal/privacy.html">Privacy</a></li>
            <li><a href="../legal/terms.html">Terms</a></li>
            <li><a href="../legal/disclaimer.html">Disclaimer</a></li>
            <li><a href="../legal/editorial-policy.html">Editorial Policy</a></li>
            <li><a href="../legal/contact.html">Contact</a></li>
            <li><a href="../legal/about.html">About</a></li>
            <li><a href="../legal/ai-usage-disclosure.html">AI Disclosure</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} GlobalSizeChart.com. Recommendations are approximate; check brand size charts.</p>
      </div>
    </div>
  </footer>
  <script>
(function() {
  var shoeData = ${shoeDataJson};
  var clothingData = ${clothingDataJson};
  var INCH_TO_CM = 2.54;

  var inputCm = document.getElementById('input-cm');
  var inputIn = document.getElementById('input-in');
  var footCm = document.getElementById('foot-cm');
  var footGender = document.getElementById('foot-gender');
  var shoeResult = document.getElementById('shoe-result');
  var chest = document.getElementById('chest');
  var waist = document.getElementById('waist');
  var hips = document.getElementById('hips');
  var clothGender = document.getElementById('cloth-gender');
  var clothCategory = document.getElementById('cloth-category');
  var clothingResult = document.getElementById('clothing-result');
  var recommendationText = document.getElementById('recommendation-text');

  function cmToIn(cm) { return cm == null || cm === '' ? '' : (Number(cm) / INCH_TO_CM).toFixed(2); }
  function inToCm(inVal) { return inVal == null || inVal === '' ? '' : (Number(inVal) * INCH_TO_CM).toFixed(1); }

  function syncUnitConverter() {
    var c = inputCm.value.trim();
    var i = inputIn.value.trim();
    if (this === inputCm && c !== '') { inputIn.value = cmToIn(c); footCm.value = c; }
    else if (this === inputIn && i !== '') { var cm = inToCm(i); inputCm.value = cm; footCm.value = cm; }
    updateFootResult(); updateRecommendation();
  }
  function syncFootToConverter() {
    var c = footCm.value.trim();
    if (c !== '') { inputCm.value = c; inputIn.value = cmToIn(c); }
  }
  inputCm.addEventListener('input', syncUnitConverter);
  inputIn.addEventListener('input', syncUnitConverter);
  footCm.addEventListener('input', syncFootToConverter);

  function findShoeSize(cmVal, gender) {
    var arr = shoeData[gender];
    if (!arr || !arr.length || cmVal === '' || isNaN(cmVal)) return null;
    var val = Number(cmVal);
    var best = null, bestDiff = Infinity;
    for (var i = 0; i < arr.length; i++) {
      var d = Math.abs(arr[i].cm - val);
      if (d < bestDiff) { bestDiff = d; best = arr[i]; }
    }
    return best;
  }

  function updateFootResult() {
    var cm = footCm.value.trim();
    var g = footGender.value;
    var row = findShoeSize(cm, g);
    if (!row) { shoeResult.textContent = '—'; return; }
    shoeResult.textContent = 'US ' + row.us + ', UK ' + row.uk + ', EU ' + row.eu;
  }
  footCm.addEventListener('input', updateFootResult);
  footGender.addEventListener('change', updateFootResult);

  function findClothingSize(chestVal, waistVal, hipsVal, gender, category) {
    var cat = clothingData[gender] && clothingData[gender][category];
    if (!cat || !cat.length) return null;
    var key = category === 'tops' ? 'chest_cm' : 'waist_cm';
    var val = category === 'tops' ? (chestVal !== '' && !isNaN(chestVal) ? Number(chestVal) : null) : (waistVal !== '' && !isNaN(waistVal) ? Number(waistVal) : null);
    if (val == null) return null;
    var best = null, bestDiff = Infinity;
    for (var i = 0; i < cat.length; i++) {
      var v = cat[i][key];
      if (v == null || v === 0) continue;
      var d = Math.abs(v - val);
      if (d < bestDiff) { bestDiff = d; best = cat[i]; }
    }
    return best;
  }

  function updateClothingResult() {
    var c = chest.value.trim(), w = waist.value.trim(), h = hips.value.trim();
    var g = clothGender.value, cat = clothCategory.value;
    var row = findClothingSize(c, w, h, g, cat);
    if (!row) { clothingResult.textContent = '—'; return; }
    clothingResult.textContent = 'US ' + row.us + ', UK ' + row.uk + ', EU ' + row.eu;
  }
  chest.addEventListener('input', updateClothingResult);
  waist.addEventListener('input', updateClothingResult);
  hips.addEventListener('input', updateClothingResult);
  clothGender.addEventListener('change', updateClothingResult);
  clothCategory.addEventListener('change', updateClothingResult);

  function updateRecommendation() {
    var parts = [];
    var cm = footCm.value.trim();
    var g = footGender.value;
    var shoeRow = findShoeSize(cm, g);
    if (shoeRow) parts.push('Shoe: US ' + shoeRow.us + ' / UK ' + shoeRow.uk + ' / EU ' + shoeRow.eu);
    var c = chest.value.trim(), w = waist.value.trim(), h = hips.value.trim();
    var clothRow = findClothingSize(c, w, h, clothGender.value, clothCategory.value);
    if (clothRow) parts.push('Clothing (' + clothCategory.value + '): US ' + clothRow.us + ' / UK ' + clothRow.uk + ' / EU ' + clothRow.eu);
    recommendationText.textContent = parts.length ? parts.join('. ') : 'Enter measurements above to see your recommended sizes here.';
  }
  footCm.addEventListener('input', updateRecommendation);
  footGender.addEventListener('change', updateRecommendation);
  chest.addEventListener('input', updateRecommendation);
  waist.addEventListener('input', updateRecommendation);
  hips.addEventListener('input', updateRecommendation);
  clothGender.addEventListener('change', updateRecommendation);
  clothCategory.addEventListener('change', updateRecommendation);
  updateFootResult();
  updateClothingResult();
  updateRecommendation();
})();
  </script>
</body>
</html>`;

  const fileName = 'measurement-assistant.html';
  fs.writeFileSync(path.join(TOOLS_DIR, fileName), html, 'utf8');
  console.log('  wrote tools/' + fileName);
  return [fileName];
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function buildProgrammaticIndexPage(routes) {
  const sizePairs = routes.filter(r => r.type === 'size_pair' || r.type == null);
  const regions = routes.filter(r => r.type === 'region');
  const categories = routes.filter(r => r.type === 'category');

  const link = (slug, label) => `<a href="programmatic-pages/${slug}.html">${label}</a>`;

  let body = '';
  const genderLabel = (g) => (g === 'men' ? "Men's" : g === 'women' ? "Women's" : "Kids'");

  // Size pairs: group by region pair (from → to), then by gender
  const byRegionPair = {};
  for (const r of sizePairs) {
    const key = `${r.from_region}-${r.to_region}`;
    if (!byRegionPair[key]) byRegionPair[key] = [];
    byRegionPair[key].push(r);
  }
  const pairOrder = ['EU-US', 'US-EU', 'US-UK', 'UK-US', 'JP-US', 'CM-US', 'EU-UK', 'CN-US'];
  const pairLabels = {};
  for (const r of sizePairs) {
    const key = `${r.from_region}-${r.to_region}`;
    if (!pairLabels[key]) pairLabels[key] = `${getFromRegionLabel(r.from_region)} → ${getFromRegionLabel(r.to_region)}`;
  }

  body += '<section class="content-section"><h2>Size pair conversions</h2><p>Single-size conversion pages, grouped by region pair and gender.</p>';
  const orderedPairs = [...new Set(sizePairs.map(r => `${r.from_region}-${r.to_region}`))];
  for (const key of orderedPairs) {
    const list = (byRegionPair[key] || []).sort((a, b) => (a.gender || '').localeCompare(b.gender || '') || parseFloat(a.size) - parseFloat(b.size));
    const label = pairLabels[key] || `${key.replace('-', ' → ')}`;
    body += `<h3 id="region-${key}">${label}</h3>`;
    const byGender = { men: [], women: [], kids: [] };
    for (const r of list) {
      (byGender[r.gender] || byGender.men).push(r);
    }
    for (const g of ['men', 'women', 'kids']) {
      const sub = (byGender[g] || []).sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
      if (sub.length === 0) continue;
      body += `<p><strong>${genderLabel(g)}</strong></p><ul>`;
      for (const r of sub) {
        body += `<li>${link(r.slug, `${getFromRegionLabel(r.from_region)} ${r.size} → ${getFromRegionLabel(r.to_region)}`)}</li>`;
      }
      body += '</ul>';
    }
  }
  body += '</section>';

  // Region converters
  body += '<section class="content-section"><h2>Region converters</h2><p>Convert any size between two regions.</p><ul>';
  for (const r of regions) {
    body += `<li>${link(r.slug, `${getFromRegionLabel(r.from_region)} → ${getFromRegionLabel(r.to_region)}`)}</li>`;
  }
  body += '</ul></section>';

  // Category converters
  body += '<section class="content-section"><h2>Category converters</h2><p>Gender-specific shoe size converters.</p><ul>';
  for (const r of categories) {
    body += `<li>${link(r.slug, `${genderLabel(r.gender)} Shoe Size Converter`)}</li>`;
  }
  body += '</ul></section>';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="description" content="Index of all programmatic size conversion pages. Grouped by region, size, and gender for crawl discovery.">
  <link rel="canonical" href="${BASE_URL}/programmatic-index.html">
  <title>Programmatic Index - All Conversion Pages | GlobalSizeChart.com</title>
  <link rel="stylesheet" href="styles.css">
  <script type="application/ld+json">${JSON.stringify(getOrganizationSchema())}</script>
  <script type="application/ld+json">${JSON.stringify(getWebSiteSchema())}</script>
  <script type="application/ld+json">${JSON.stringify(getWebPageSchema({ name: 'Programmatic Index', description: 'Index of all programmatic size conversion pages. Grouped by region, size, and gender for crawl discovery.', url: `${BASE_URL}/programmatic-index.html` }))}</script>
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL + '/' }, { '@type': 'ListItem', position: 2, name: 'Programmatic Index', item: BASE_URL + '/programmatic-index.html' }] })}</script>
</head>
<body ${getDataIntentAttr({ type: 'hub' })}>
  <header>
    <div class="header-content">
      <a href="index.html" class="logo">GlobalSizeChart.com</a>
      <nav>
        <ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="shoe-size-converter.html">Shoe Converter</a></li>
          <li><a href="clothing-size-converter.html">Clothing Converter</a></li>
          <li><a href="measurement-tools.html">Measurement Tools</a></li>
          <li><a href="shoe-sizing-guides.html">Guides</a></li>
          <li><a href="legal/about.html">About</a></li>
          <li><a href="legal/contact.html">Contact</a></li>
          <li><a href="legal/privacy.html">Privacy</a></li>
        </ul>
      </nav>
    </div>
  </header>
  <main>
    <div class="container">
      <section class="content-section">
        <h1>Programmatic Index</h1>
        <p>All generated conversion pages listed as text links, grouped by region, size, and gender. No JavaScript—crawler-friendly.</p>
      </section>
      ${body}
    </div>
  </main>
  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Converters</h3>
          <ul>
            <li><a href="shoe-size-converter.html">Shoe Size Converter</a></li>
            <li><a href="clothing-size-converter.html">Clothing Size Converter</a></li>
            <li><a href="us-to-eu-size.html">US to EU Size</a></li>
            <li><a href="uk-to-us-size.html">UK to US Size</a></li>
            <li><a href="cm-to-us-shoe-size.html">CM to US Shoe Size</a></li>
            <li><a href="programmatic-index.html">Programmatic Index</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3>Information</h3>
          <ul>
            <li><a href="legal/privacy.html">Privacy</a></li>
            <li><a href="legal/terms.html">Terms</a></li>
            <li><a href="legal/disclaimer.html">Disclaimer</a></li>
            <li><a href="legal/editorial-policy.html">Editorial Policy</a></li>
            <li><a href="legal/contact.html">Contact</a></li>
            <li><a href="legal/about.html">About</a></li>
            <li><a href="legal/ai-usage-disclosure.html">AI Disclosure</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 GlobalSizeChart.com. All rights reserved.</p>
      </div>
    </div>
  </footer>
  <script src="app.js"></script>
</body>
</html>`;
  return html;
}

/**
 * Topical hub: shoe-sizing-guides.html at project root.
 * Sections: Measurement Guides, Regional Differences, Fit & Comfort, Sizing Standards, Conversion Science, Common Mistakes.
 * Each section links to semantic pages. Includes breadcrumb, Article, and FAQ schema.
 */
function generateShoeSizingGuidesPage(semanticRoutes) {
  const canonicalUrl = `${BASE_URL}/shoe-sizing-guides.html`;
  const pageTitle = 'Shoe Sizing Guides | Measurement, Regional Differences & Conversion | GlobalSizeChart.com';
  const metaDescription = 'Guides to shoe sizing: how to measure your feet, why EU and US sizes differ, fit tips, sizing standards, and common mistakes. Links to all sizing articles.';

  const sectionConfig = [
    { id: 'measurement', title: 'Measurement Guides', categories: ['measurement_guides'] },
    { id: 'regional', title: 'Regional Differences', categories: ['regional_differences'] },
    { id: 'fit', title: 'Fit & Comfort', categories: ['fit_guides'], fallbackSlugs: ['common-shoe-sizing-mistakes'] },
    { id: 'standards', title: 'Sizing Standards', categories: ['sizing_standards'] },
    { id: 'conversion', title: 'Conversion Science', categories: ['sizing_standards', 'conversion_explanations'], fallbackSlugs: ['how-shoe-sizing-works', 'why-eu-and-us-sizes-differ'] },
    { id: 'mistakes', title: 'Common Mistakes', categories: ['sizing_myths'] }
  ];

  const routes = semanticRoutes || [];
  const byCategory = {};
  for (const r of routes) {
    if (r.type !== 'semantic' || !r.slug) continue;
    const c = r.semantic_category || 'sizing_standards';
    if (!byCategory[c]) byCategory[c] = [];
    byCategory[c].push(r);
  }

  let body = '';
  body += '<section class="content-section"><h1>Shoe Sizing Guides</h1>';
  body += '<p>Use these guides to understand how shoe sizes work, how to measure your feet, why sizes differ by region, and how to avoid common mistakes. Each section links to in-depth articles.</p></section>';

  for (const sec of sectionConfig) {
    const items = [];
    for (const cat of sec.categories) {
      for (const r of byCategory[cat] || []) items.push(r);
    }
    for (const slug of sec.fallbackSlugs || []) {
      const r = routes.find(x => x.slug === slug);
      if (r && !items.find(x => x.slug === r.slug)) items.push(r);
    }
    const uniq = items.filter((r, i, a) => a.findIndex(x => x.slug === r.slug) === i);
    body += `<section class="content-section" id="${sec.id}"><h2>${escapeHtml(sec.title)}</h2><ul>`;
    for (const r of uniq) {
      body += `<li><a href="semantic/${r.slug}.html">${escapeHtml(r.title || r.slug)}</a></li>`;
    }
    if (uniq.length === 0) body += '<li><a href="semantic/how-shoe-sizing-works.html">How Shoe Sizing Works</a></li>';
    body += '</ul></section>';
  }

  const breadcrumbItems = [
    { name: 'Home', url: `${BASE_URL}/` },
    { name: 'Shoe Converter', url: `${BASE_URL}/shoe-size-converter.html` },
    { name: 'Shoe Sizing Guides', url: canonicalUrl }
  ];
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url }))
  };

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Shoe Sizing Guides',
    description: metaDescription,
    url: canonicalUrl,
    datePublished: '2024-01-01',
    publisher: { '@id': ORGANIZATION_ID }
  };

  const webPageJsonLd = getWebPageSchema({ name: pageTitle, description: metaDescription, url: canonicalUrl });

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'What are shoe sizing guides?', acceptedAnswer: { '@type': 'Answer', text: 'Shoe sizing guides are articles that explain how sizing systems work (US, UK, EU, Japan, CM), how to measure your feet, why sizes differ by region, and how to avoid common conversion mistakes.' } },
      { '@type': 'Question', name: 'How do I measure my feet for shoe size?', acceptedAnswer: { '@type': 'Answer', text: 'Measure your foot length in centimeters: place your foot on paper against a wall, mark the longest toe, and measure from wall to mark. Use our measurement guide and converter for your equivalent size.' } },
      { '@type': 'Question', name: 'Why do EU and US shoe sizes differ?', acceptedAnswer: { '@type': 'Answer', text: 'EU and US use different scales and numbering. EU sizes are typically about 1–1.5 larger than US for the same length. Our regional differences guides explain each system.' } },
      { '@type': 'Question', name: 'Where can I find all sizing articles?', acceptedAnswer: { '@type': 'Answer', text: 'This page links to every guide: measurement, regional differences, fit and comfort, sizing standards, conversion science, and common mistakes. Use the sections above to jump to the topic you need.' } }
    ]
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <link rel="canonical" href="${canonicalUrl}">
  <title>${escapeHtml(pageTitle)}</title>
  <link rel="stylesheet" href="styles.css">
  <script type="application/ld+json">${JSON.stringify(getOrganizationSchema())}</script>
  <script type="application/ld+json">${JSON.stringify(getWebSiteSchema())}</script>
  <script type="application/ld+json">${JSON.stringify(webPageJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(articleJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(faqJsonLd)}</script>
</head>
<body ${getDataIntentAttr({ type: 'hub' })}>
  <header>
    <div class="header-content">
      <a href="index.html" class="logo">GlobalSizeChart.com</a>
      <nav>
        <ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="shoe-size-converter.html">Shoe Converter</a></li>
          <li><a href="clothing-size-converter.html">Clothing Converter</a></li>
          <li><a href="measurement-tools.html">Measurement Tools</a></li>
          <li><a href="shoe-sizing-guides.html">Guides</a></li>
          <li><a href="legal/about.html">About</a></li>
          <li><a href="legal/contact.html">Contact</a></li>
          <li><a href="legal/privacy.html">Privacy</a></li>
        </ul>
      </nav>
    </div>
  </header>
  <main>
    <div class="container">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> &gt; <a href="shoe-size-converter.html">Shoe Converter</a> &gt; <span>Shoe Sizing Guides</span></nav>
      ${body}
    </div>
  </main>
  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Converters</h3>
          <ul>
            <li><a href="shoe-size-converter.html">Shoe Size Converter</a></li>
            <li><a href="clothing-size-converter.html">Clothing Size Converter</a></li>
            <li><a href="shoe-sizing-guides.html">Shoe Sizing Guides</a></li>
            <li><a href="shoe-size-pages.html">Shoe Size Pages</a></li>
            <li><a href="programmatic-index.html">Programmatic Index</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3>Information</h3>
          <ul>
            <li><a href="legal/privacy.html">Privacy</a></li>
            <li><a href="legal/terms.html">Terms</a></li>
            <li><a href="legal/disclaimer.html">Disclaimer</a></li>
            <li><a href="legal/editorial-policy.html">Editorial Policy</a></li>
            <li><a href="legal/contact.html">Contact</a></li>
            <li><a href="legal/about.html">About</a></li>
            <li><a href="legal/ai-usage-disclosure.html">AI Disclosure</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 GlobalSizeChart.com. All rights reserved.</p>
      </div>
    </div>
  </footer>
  <script src="app.js"></script>
</body>
</html>`;
  return html;
}

/**
 * Programmatic Hub: shoe-size-pages.html at project root.
 * Sections: Men Sizes, Women Sizes, Kids Sizes (size_pair grouped by region pair), Region Converters, Category Converters.
 * Unique meta title/description, H1 "Complete Shoe Size Conversion Index", internal links to /, shoe-size-converter, clothing-size-converter.
 */
function generateProgrammaticHub(allRoutes) {
  const link = (slug, text) => `<a href="programmatic-pages/${slug}.html">${escapeHtml(text)}</a>`;

  const sizePairs = allRoutes.filter(r => r.type === 'size_pair' || (r.type == null && r.size != null));
  const regions = allRoutes.filter(r => r.type === 'region');
  const categories = allRoutes.filter(r => r.type === 'category');

  const byGender = { men: [], women: [], kids: [] };
  for (const r of sizePairs) {
    const g = r.gender || 'men';
    if (byGender[g]) byGender[g].push(r);
  }

  function sectionForGender(genderKey, title) {
    const list = byGender[genderKey] || [];
    if (list.length === 0) return '';

    const byPair = {};
    for (const r of list) {
      const key = `${r.from_region}-${r.to_region}`;
      if (!byPair[key]) byPair[key] = [];
      byPair[key].push(r);
    }
    const pairOrder = ['EU-US', 'US-EU', 'US-UK', 'UK-US', 'JP-US', 'CM-US', 'EU-UK', 'CN-US'];
    const pairLabels = {};
    for (const r of list) {
      const key = `${r.from_region}-${r.to_region}`;
      if (!pairLabels[key]) pairLabels[key] = `${getFromRegionLabel(r.from_region)} → ${getFromRegionLabel(r.to_region)}`;
    }

    let html = `<section class="content-section"><h2>${title}</h2>`;
    const keys = [...Object.keys(byPair)].sort((a, b) => {
      const ia = pairOrder.indexOf(a);
      const ib = pairOrder.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
    for (const key of keys) {
      const items = (byPair[key] || []).sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
      const label = pairLabels[key] || `${key.replace('-', ' → ')}`;
      html += `<h3 id="hub-${genderKey}-${key}">${label}</h3><ul>`;
      for (const r of items) {
        html += `<li>${link(r.slug, `${getFromRegionLabel(r.from_region)} ${r.size} → ${getFromRegionLabel(r.to_region)}`)}</li>`;
      }
      html += '</ul>';
    }
    html += '</section>';
    return html;
  }

  let body = '';

  body += '<section class="content-section"><h1>Complete Shoe Size Conversion Index</h1>';
  body += '<p>Browse all shoe size conversion pages. Start with the main <a href="index.html">home page</a>, <a href="shoe-size-converter.html">Shoe Size Converter</a>, or <a href="clothing-size-converter.html">Clothing Size Converter</a> for general tools.</p></section>';

  body += sectionForGender('men', 'Section 1 — Men Sizes');
  body += sectionForGender('women', 'Section 2 — Women Sizes');
  body += sectionForGender('kids', 'Section 3 — Kids Sizes');

  body += '<section class="content-section"><h2>Section 4 — Region Converters</h2><p>Convert any size between two regions.</p><ul>';
  for (const r of regions) {
    body += `<li>${link(r.slug, `${getFromRegionLabel(r.from_region)} → ${getFromRegionLabel(r.to_region)}`)}</li>`;
  }
  body += '</ul></section>';

  const genderLabel = (g) => (g === 'men' ? "Men's" : g === 'women' ? "Women's" : "Kids'");
  body += '<section class="content-section"><h2>Section 5 — Category Converters</h2><p>Gender-specific shoe size converters.</p><ul>';
  for (const r of categories) {
    body += `<li>${link(r.slug, `${genderLabel(r.gender)} Shoe Size Converter`)}</li>`;
  }
  body += '</ul></section>';

  const breadcrumbItems = [
    { name: 'Home', url: `${BASE_URL}/` },
    { name: 'Shoe Converter', url: `${BASE_URL}/shoe-size-converter.html` },
    { name: 'Shoe Size Pages', url: `${BASE_URL}/shoe-size-pages.html` }
  ];
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url }))
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="description" content="Complete shoe size conversion index: men's, women's, and kids' size charts by region (EU, US, UK, JP, CM). All conversion pages in one place.">
  <link rel="canonical" href="${BASE_URL}/shoe-size-pages.html">
  <title>Complete Shoe Size Conversion Index | GlobalSizeChart.com</title>
  <link rel="stylesheet" href="styles.css">
  <script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>
</head>
<body>
  <header>
    <div class="header-content">
      <a href="index.html" class="logo">GlobalSizeChart.com</a>
      <nav>
        <ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="shoe-size-converter.html">Shoe Converter</a></li>
          <li><a href="clothing-size-converter.html">Clothing Converter</a></li>
          <li><a href="measurement-tools.html">Measurement Tools</a></li>
          <li><a href="shoe-sizing-guides.html">Guides</a></li>
          <li><a href="legal/about.html">About</a></li>
          <li><a href="legal/contact.html">Contact</a></li>
          <li><a href="legal/privacy.html">Privacy</a></li>
        </ul>
      </nav>
    </div>
  </header>
  <main>
    <div class="container">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> &gt; <a href="shoe-size-converter.html">Shoe Converter</a> &gt; <span>Shoe Size Pages</span></nav>
      ${body}
    </div>
  </main>
  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Converters</h3>
          <ul>
            <li><a href="shoe-size-converter.html">Shoe Size Converter</a></li>
            <li><a href="clothing-size-converter.html">Clothing Size Converter</a></li>
            <li><a href="us-to-eu-size.html">US to EU Size</a></li>
            <li><a href="uk-to-us-size.html">UK to US Size</a></li>
            <li><a href="cm-to-us-shoe-size.html">CM to US Shoe Size</a></li>
            <li><a href="programmatic-index.html">Programmatic Index</a></li>
            <li><a href="shoe-size-pages.html">Shoe Size Pages Index</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3>Information</h3>
          <ul>
            <li><a href="legal/privacy.html">Privacy</a></li>
            <li><a href="legal/terms.html">Terms</a></li>
            <li><a href="legal/disclaimer.html">Disclaimer</a></li>
            <li><a href="legal/editorial-policy.html">Editorial Policy</a></li>
            <li><a href="legal/contact.html">Contact</a></li>
            <li><a href="legal/about.html">About</a></li>
            <li><a href="legal/ai-usage-disclosure.html">AI Disclosure</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 GlobalSizeChart.com. All rights reserved.</p>
      </div>
    </div>
  </footer>
  <script src="app.js"></script>
</body>
</html>`;
  return html;
}

// --- Objective 8: Master Hub Network — hubs with breadcrumb, FAQ, Article schema, deep internal linking ---
/**
 * Build a hub page HTML with breadcrumb schema, FAQ schema, Article schema, and deep internal links.
 * @param {object} opts - { slug, title, description, introParagraph, links: [{ href, text }], faq: [{ question, answer }], breadcrumbTail }
 */
function buildHubPage(opts) {
  const slug = opts.slug;
  const title = opts.title;
  const description = opts.description || opts.title;
  const intro = opts.introParagraph || `Use the links below to find the right size conversion or guide.`;
  const links = opts.links || [];
  const faq = opts.faq || [];
  const canonicalUrl = `${BASE_URL}/${slug}.html`;

  const breadcrumbItems = opts.breadcrumbTail
    ? [{ name: 'Home', url: `${BASE_URL}/` }, ...opts.breadcrumbTail]
    : [
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Hubs', url: `${BASE_URL}/shoe-size-pages.html` },
        { name: title, url: canonicalUrl }
      ];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url }))
  };

  const faqJsonLd = faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer }
    }))
  } : null;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    url: canonicalUrl,
    datePublished: '2024-01-01',
    publisher: { '@id': ORGANIZATION_ID }
  };

  const webPageJsonLd = getWebPageSchema({ name: title, description, url: canonicalUrl });

  const dataIntentAttr = getDataIntentAttr({ type: 'hub' });
  const linksHtml = links.map(l => `<li><a href="${escapeHtml(l.href)}">${escapeHtml(l.text)}</a></li>`).join('\n        ');
  const faqHtml = faq.map(q => `<div class="faq-item"><h3>${escapeHtml(q.question)}</h3><p>${escapeHtml(q.answer)}</p></div>`).join('\n      ');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonicalUrl}">
  <title>${escapeHtml(title)} | GlobalSizeChart.com</title>
  <link rel="stylesheet" href="styles.css">
  <script type="application/ld+json">${JSON.stringify(getOrganizationSchema())}</script>
  <script type="application/ld+json">${JSON.stringify(getWebSiteSchema())}</script>
  <script type="application/ld+json">${JSON.stringify(webPageJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(articleJsonLd)}</script>
  ${faqJsonLd ? `<script type="application/ld+json">${JSON.stringify(faqJsonLd)}</script>` : ''}
</head>
<body ${dataIntentAttr}>
  <header>
    <div class="header-content">
      <a href="index.html" class="logo">GlobalSizeChart.com</a>
      <nav>
        <ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="shoe-size-converter.html">Shoe Converter</a></li>
          <li><a href="clothing-size-converter.html">Clothing Converter</a></li>
          <li><a href="measurement-tools.html">Measurement Tools</a></li>
          <li><a href="shoe-sizing-guides.html">Guides</a></li>
          <li><a href="legal/about.html">About</a></li>
          <li><a href="legal/contact.html">Contact</a></li>
          <li><a href="legal/privacy.html">Privacy</a></li>
        </ul>
      </nav>
    </div>
  </header>
  <main>
    <div class="container">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> &gt; <a href="shoe-size-pages.html">Hubs</a> &gt; <span>${escapeHtml(title)}</span></nav>
      <section class="content-section">
        <h1>${escapeHtml(title)}</h1>
        <p class="mb-lg">${escapeHtml(intro)}</p>
      </section>
      <section class="content-section">
        <h2>All pages</h2>
        <ul class="hub-links">
        ${linksHtml}
        </ul>
      </section>
      <section class="content-section">
        <h2>Other hubs and converters</h2>
        <ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="shoe-size-converter.html">Shoe Size Converter</a></li>
          <li><a href="clothing-size-converter.html">Clothing Size Converter</a></li>
          <li><a href="shoe-size-pages.html">Shoe Size Pages Index</a></li>
          <li><a href="programmatic-index.html">Programmatic Index</a></li>
          <li><a href="shoe-sizing-guides.html">Shoe Sizing Guides</a></li>
          <li><a href="cm-measurement-converters.html">CM Measurement Converters</a></li>
          <li><a href="printable-size-guides.html">Printable Size Guides</a></li>
          <li><a href="measurement-tools.html">Measurement Tools</a></li>
        </ul>
      </section>
      ${faq.length > 0 ? `<section class="content-section" id="faq"><h2>Frequently Asked Questions</h2>${faqHtml}</section>` : ''}
    </div>
  </main>
  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Converters</h3>
          <ul>
            <li><a href="shoe-size-converter.html">Shoe Size Converter</a></li>
            <li><a href="clothing-size-converter.html">Clothing Size Converter</a></li>
            <li><a href="us-to-eu-size.html">US to EU Size</a></li>
            <li><a href="uk-to-us-size.html">UK to US Size</a></li>
            <li><a href="cm-to-us-shoe-size.html">CM to US Shoe Size</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3>Information</h3>
          <ul>
            <li><a href="legal/privacy.html">Privacy</a></li>
            <li><a href="legal/terms.html">Terms</a></li>
            <li><a href="legal/disclaimer.html">Disclaimer</a></li>
            <li><a href="legal/editorial-policy.html">Editorial Policy</a></li>
            <li><a href="legal/contact.html">Contact</a></li>
            <li><a href="legal/about.html">About</a></li>
            <li><a href="legal/ai-usage-disclosure.html">AI Disclosure</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} GlobalSizeChart.com. All rights reserved.</p>
      </div>
    </div>
  </footer>
  <script src="app.js"></script>
</body>
</html>`;
  return html;
}

function generateClothingSizePagesHub(clothingGenerated = [], clothingRoutes = []) {
  const slugToLabel = new Map((clothingRoutes || []).map(r => [r.slug + '.html', (r.description || r.slug).replace(/-/g, ' ').slice(0, 60)]));
  const links = (clothingGenerated || []).map(f => ({
    href: 'clothing/' + f,
    text: slugToLabel.get(f) || f.replace('.html', '').replace(/-/g, ' ')
  }));
  return buildHubPage({
    slug: 'clothing-size-pages',
    title: 'Clothing Size Pages',
    description: 'Index of all clothing size conversion pages. Convert US, UK, EU sizes for tops, pants, and dresses.',
    introParagraph: 'Browse all clothing size conversion pages. Convert between US, UK, and EU for men\'s, women\'s, and kids\' tops, pants, and dresses. Use the links below for direct conversion pages.',
    links,
    breadcrumbTail: [{ name: 'Clothing Converter', url: `${BASE_URL}/clothing-size-converter.html` }, { name: 'Clothing Size Pages', url: `${BASE_URL}/clothing-size-pages.html` }],
    faq: [
      { question: 'How do I convert US clothing size to EU?', answer: 'Use our clothing size converter or browse the specific conversion pages linked above. EU sizes often use different letter or number scales than US.' },
      { question: 'Are clothing sizes the same for men and women?', answer: 'No. Men\'s and women\'s clothing use different size scales. Use the gender-specific pages or the main clothing converter.' },
      { question: 'What measurements do I need for clothing size?', answer: 'Chest, waist, and hips in centimeters are the main measurements. See our printable measurement chart and measurement assistant tool.' }
    ]
  });
}

function generateBrandSizeGuidesHub(brandGenerated = [], brandRoutes = []) {
  const slugToBrand = new Map((brandRoutes || []).map(r => [r.slug + '.html', r.brand || r.slug]));
  const links = (brandGenerated || []).map(f => ({
    href: 'brands/' + f,
    text: slugToBrand.get(f) || f.replace('.html', '').replace(/-/g, ' ')
  }));
  return buildHubPage({
    slug: 'brand-size-guides',
    title: 'Brand Size Guides',
    description: 'Size guides and conversion tips for Nike, Adidas, Zara, H&M, and more. Brand-specific fit and conversion.',
    introParagraph: 'Find brand-specific size guides and conversion tips. Each guide covers fit philosophy, regional conversion, and how to convert that brand\'s sizes to US, UK, and EU.',
    links,
    breadcrumbTail: [{ name: 'Shoe & Clothing Converters', url: `${BASE_URL}/shoe-size-converter.html` }, { name: 'Brand Size Guides', url: `${BASE_URL}/brand-size-guides.html` }],
    faq: [
      { question: 'Do brand sizes differ from standard charts?', answer: 'Yes. Many brands run small or large. Our brand guides describe fit tendencies and how to convert to your region.' },
      { question: 'Which brands have size guides here?', answer: 'We cover Nike, Adidas, Puma, Zara, H&M, Shein, Uniqlo, New Balance, ASOS, and Levi\'s. Use the links above.' },
      { question: 'Should I size up or down for a brand?', answer: 'It depends on the brand. Each guide includes fit tips. When in doubt, check the brand\'s official size chart for the product.' }
    ]
  });
}

function generateCMMeasurementConvertersHub(measurementGenerated = [], regionRoutes = []) {
  const links = [];
  const regionLabels = { CM: 'CM', INCH: 'Inch', EU: 'EU', US: 'US', UK: 'UK', JP: 'Japan', CN: 'China', KR: 'Korea' };
  for (const r of regionRoutes || []) {
    if (r.type !== 'region' || !r.slug) continue;
    const from = regionLabels[r.from_region] || r.from_region;
    const to = regionLabels[r.to_region] || r.to_region;
    links.push({ href: 'programmatic-pages/' + r.slug + '.html', text: from + ' to ' + to + ' Shoe Size' });
  }
  for (const f of measurementGenerated || []) {
    links.push({ href: 'measurement/' + f, text: f.replace('.html', '').replace(/-/g, ' ') });
  }
  return buildHubPage({
    slug: 'cm-measurement-converters',
    title: 'CM Measurement Converters',
    description: 'Convert foot length, chest, and waist measurements in cm to US, UK, and EU sizes. Measurement-first conversion pages.',
    introParagraph: 'Use your body measurements in centimeters to find your size. These pages convert foot length (shoe size), chest (shirts), and waist (pants) in cm to US, EU, and UK sizes. Measure first, then use the matching page.',
    links,
    breadcrumbTail: [{ name: 'Shoe Size Converter', url: `${BASE_URL}/shoe-size-converter.html` }, { name: 'CM Measurement Converters', url: `${BASE_URL}/cm-measurement-converters.html` }],
    faq: [
      { question: 'How do I measure my foot in cm for shoe size?', answer: 'Place paper against a wall, stand with heel at the wall, mark the longest toe, and measure in cm. Use the larger foot. See our printable foot measuring sheet.' },
      { question: 'What is chest measurement for clothing?', answer: 'Measure around the fullest part of your chest, under the arms, with the tape horizontal. Use our clothing measurement chart for a printable guide.' },
      { question: 'Are these conversions accurate for all brands?', answer: 'Conversions are based on standard charts. Brands vary; always check the retailer size guide for the specific item.' }
    ]
  });
}

function generatePrintableSizeGuidesHub(printableGenerated = []) {
  const labels = {
    'foot-measuring-sheet.html': 'Foot Measuring Sheet',
    'clothing-measurement-chart.html': 'Clothing Measurement Chart',
    'shoe-size-reference-chart.html': 'Shoe Size Reference Chart'
  };
  const links = (printableGenerated || []).map(f => ({
    href: 'printable/' + f,
    text: labels[f] || f.replace('.html', '').replace(/-/g, ' ')
  }));
  return buildHubPage({
    slug: 'printable-size-guides',
    title: 'Printable Size Guides',
    description: 'Printable foot measuring sheet, clothing measurement chart, and shoe size reference. Print or save as PDF.',
    introParagraph: 'Download or print these guides to measure at home. Includes foot length instructions, body measurement chart for clothing, and a shoe size reference table. Each page has a QR code linking back to our converters.',
    links,
    breadcrumbTail: [{ name: 'Converters', url: `${BASE_URL}/shoe-size-converter.html` }, { name: 'Printable Size Guides', url: `${BASE_URL}/printable-size-guides.html` }],
    faq: [
      { question: 'Can I save these as PDF?', answer: 'Yes. Use your browser\'s Print option and choose "Save as PDF" to keep a copy.' },
      { question: 'How do I measure my foot for the sheet?', answer: 'Follow the steps on the foot measuring sheet: paper against wall, mark longest toe, measure in cm. Use the larger foot.' },
      { question: 'Do the printable guides work on mobile?', answer: 'Yes. You can view and print from a phone or tablet. For best results, use a ruler for measurements.' }
    ]
  });
}

function generateMeasurementToolsHub(toolGenerated = []) {
  const links = (toolGenerated || []).map(f => ({
    href: 'tools/' + f,
    text: f === 'measurement-assistant.html' ? 'Measurement Assistant Tool' : f.replace('.html', '').replace(/-/g, ' ')
  }));
  if (links.length === 0) links.push({ href: 'tools/measurement-assistant.html', text: 'Measurement Assistant Tool' });
  return buildHubPage({
    slug: 'measurement-tools',
    title: 'Measurement Tools',
    description: 'Interactive measurement assistant: foot and clothing calculator, inch/cm converter, and size recommendations.',
    introParagraph: 'Use our interactive Measurement Assistant to convert foot length and body measurements to shoe and clothing sizes. Includes unit converter (inch/cm), dynamic size recommendations, and visual guides.',
    links,
    breadcrumbTail: [{ name: 'Converters', url: `${BASE_URL}/shoe-size-converter.html` }, { name: 'Measurement Tools', url: `${BASE_URL}/measurement-tools.html` }],
    faq: [
      { question: 'What does the Measurement Assistant do?', answer: 'It converts foot length (cm or inches) to shoe size, and chest/waist/hips to clothing size. You get US, UK, and EU recommendations.' },
      { question: 'Is the tool free?', answer: 'Yes. All our converters and tools are free to use.' },
      { question: 'Can I use it on my phone?', answer: 'Yes. The Measurement Assistant works in your browser on desktop and mobile.' }
    ]
  });
}

// --- Phase 9: Semantic cluster pages (semantic support, authority, 20+ links per page) ---
const SEMANTIC_CATEGORIES = new Set(['measurement_guides', 'fit_guides', 'regional_differences', 'sizing_standards', 'conversion_explanations', 'sizing_myths', 'brand_variation_explainer']);
const MIN_SEMANTIC_INTERNAL_LINKS = 20;
const MIN_SEMANTIC_CONVERTERS = 5;
const MIN_SEMANTIC_SIZE_PAIRS = 5;
const MIN_SEMANTIC_OTHER_SEMANTIC = 3;
const MIN_PROGRAMMATIC_SEMANTIC_LINKS = 2;

// --- Topical authority graph (data/authority_graph.json): auto-link semantic ↔ programmatic, reinforce clusters ---
function loadAuthorityGraph() {
  const p = path.join(DATA_DIR, 'authority_graph.json');
  if (!fs.existsSync(p)) return {};
  try {
    const data = loadJson(p);
    return typeof data === 'object' && data !== null ? data : {};
  } catch (_) {
    return {};
  }
}

/** Map programmatic or semantic route to topic keys in the authority graph. */
function getTopicKeysForRoute(route) {
  const keys = [];
  if (!route) return keys;
  if (route.type === 'semantic') {
    const slug = (route.slug || '').toLowerCase();
    if (slug.includes('why-eu-and-us') || slug.includes('eu-and-us')) keys.push('eu_us_conversion', 'us_eu_conversion');
    if (slug.includes('how-uk-shoe') || slug.includes('uk-shoe-sizes-differ')) keys.push('uk_us_conversion', 'us_uk_conversion', 'uk_sizing');
    if (slug.includes('japanese-shoe')) keys.push('japan_conversion');
    if (slug.includes('how-to-measure-feet') || slug.includes('measure-feet-cm')) keys.push('cm_measurement', 'measurement_guides');
    if (slug.includes('how-shoe-sizing-works')) keys.push('sizing_standards');
    if (slug.includes('common-shoe-sizing-mistakes') || slug.includes('sizing-mistakes')) keys.push('sizing_myths');
    if (keys.length === 0) keys.push('sizing_standards');
  } else {
    if (route.type === 'region') {
      const from = (route.from_region || '').toUpperCase();
      const to = (route.to_region || '').toUpperCase();
      if (from === 'EU' && to === 'US') keys.push('eu_us_conversion');
      if (from === 'US' && to === 'EU') keys.push('us_eu_conversion');
      if (from === 'UK' && to === 'US') keys.push('uk_us_conversion');
      if (from === 'US' && to === 'UK') keys.push('us_uk_conversion');
      if (from === 'JP' && to === 'US') keys.push('japan_conversion');
      if (from === 'CM' && to === 'US') keys.push('cm_measurement');
      if (from === 'EU' && to === 'UK') keys.push('eu_uk_conversion');
    } else if (route.type === 'category') {
      keys.push('category_converters', 'sizing_standards');
    } else {
      const from = (route.from_region || '').toUpperCase();
      const to = (route.to_region || '').toUpperCase();
      if (from === 'EU' && to === 'US') keys.push('eu_us_conversion');
      if (from === 'US' && to === 'EU') keys.push('us_eu_conversion');
      if (from === 'UK' && to === 'US') keys.push('uk_us_conversion');
      if (from === 'US' && to === 'UK') keys.push('us_uk_conversion');
      if (from === 'JP' && to === 'US') keys.push('japan_conversion');
      if (from === 'CM' && to === 'US') keys.push('cm_measurement');
      if (from === 'EU' && to === 'UK') keys.push('eu_uk_conversion');
    }
  }
  return [...new Set(keys)];
}

/** Return { semantic: path[], programmatic: path[] } from authority graph for the given route. Paths are site-relative (e.g. /semantic/..., /programmatic-pages/...). */
function getAuthorityLinksFromGraph(route, graph) {
  const topicKeys = getTopicKeysForRoute(route);
  const semantic = [];
  const programmatic = [];
  const seenSemantic = new Set();
  const seenProgrammatic = new Set();
  for (const key of topicKeys) {
    const node = graph[key];
    if (!node || typeof node !== 'object') continue;
    const sem = node.semantic_support_pages || node.semantic || [];
    const prog = node.programmatic_pages || node.programmatic || [];
    for (const p of sem) {
      if (p && !seenSemantic.has(p)) { seenSemantic.add(p); semantic.push(p); }
    }
    for (const p of prog) {
      if (p && !seenProgrammatic.has(p)) { seenProgrammatic.add(p); programmatic.push(p); }
    }
  }
  return { semantic, programmatic };
}

/**
 * Build "Understanding This Conversion" section for Type A/B/C pages: 1–2 paragraph explanation
 * pulled from semantic cluster content, plus links to deeper semantic articles.
 * @param {object} route - programmatic route (region, category, or size_pair)
 * @param {object} authorityGraph - from loadAuthorityGraph()
 * @param {array} semanticRoutes - from semantic_routes.json
 * @returns {string} HTML fragment (paragraphs + list of links)
 */
function buildSizingKnowledgeSection(route, authorityGraph, semanticRoutes) {
  const graphLinks = getAuthorityLinksFromGraph(route, authorityGraph);
  const semanticPaths = graphLinks.semantic || [];
  const slugToRoute = new Map((semanticRoutes || []).map(r => [r.slug, r]));

  const articles = [];
  for (const sitePath of semanticPaths) {
    const m = sitePath.match(/\/semantic\/([^/]+)\.html$/);
    if (!m) continue;
    const slug = m[1];
    const sr = slugToRoute.get(slug);
    articles.push({ slug, title: sr ? (sr.title || slug.replace(/-/g, ' ')) : slug.replace(/-/g, ' '), description: sr ? sr.description : '' });
  }
  const defaultSemanticSlugs = ['how-shoe-sizing-works', 'common-shoe-sizing-mistakes', 'why-eu-and-us-sizes-differ', 'how-to-measure-feet-cm'];
  for (const slug of defaultSemanticSlugs) {
    if (articles.length >= MIN_PROGRAMMATIC_SEMANTIC_LINKS) break;
    if (articles.some(a => a.slug === slug)) continue;
    const sr = slugToRoute.get(slug);
    articles.push({ slug, title: sr ? (sr.title || slug.replace(/-/g, ' ')) : slug.replace(/-/g, ' '), description: sr ? sr.description : '' });
  }

  let p1 = '';
  let p2 = '';
  if (articles.length > 0) {
    p1 = articles[0].description || `Understanding how ${articles[0].title.toLowerCase()} helps you convert sizes accurately. Different regions use different scales and measurement methods.`;
    if (articles.length > 1) {
      p2 = `For more detail, read our guides on regional differences, how to measure your feet, and common sizing mistakes.`;
    } else {
      p2 = `For more detail on how sizing works across regions and how to measure your feet, see the articles below.`;
    }
  } else {
    p1 = 'Shoe sizing varies by region: US, UK, EU, Japan, and CM each use different scales. Conversion charts give approximate equivalents; always check the brand\'s size chart when possible.';
    p2 = 'Learn more about how sizing works and how to measure your feet for the best fit.';
  }

  const paragraphsHtml = `<p>${escapeHtml(p1)}</p>\n        <p>${escapeHtml(p2)}</p>`;
  const linksHtml = articles.length > 0
    ? `<ul class="sizing-knowledge-links">\n          ${articles.map(a => `<li><a href="../semantic/${a.slug}.html">${escapeHtml(a.title)}</a></li>`).join('\n          ')}\n        </ul>`
    : `<ul class="sizing-knowledge-links">\n          <li><a href="../semantic/how-shoe-sizing-works.html">How Shoe Sizing Works</a></li>\n          <li><a href="../semantic/common-shoe-sizing-mistakes.html">Common Shoe Sizing Mistakes</a></li>\n        </ul>`;

  return `${paragraphsHtml}\n        ${linksHtml}`;
}

/** Path prefix for pages under /clothing/ or /brands/ or /measurement/ (links to root, tools, printable). */
const LINK_PREFIX_FROM_SUBDIR = '../';

/**
 * Build 30+ internal links for pages in a subdir (clothing, brands, measurement).
 * currentFile = path from site root (e.g. 'clothing/foo.html', 'brands/bar.html'). All targetPaths are root-relative.
 */
function buildPhase10InternalLinksBlock(currentFile, semanticRoutes = [], extraLinks = [], maxTotal = 40) {
  const added = new Set();
  const links = [];
  const cur = currentFile || 'index.html';

  function add(targetPath, text) {
    const href = internalLinkBuilder.href(cur, targetPath);
    if (added.has(href)) return;
    added.add(href);
    links.push({ href, text });
  }

  add('index.html', 'Global Size Chart Home');
  add('shoe-size-converter.html', 'Shoe Size Converter');
  add('clothing-size-converter.html', 'Clothing Size Converter');
  add('shoe-size-pages.html', 'Shoe Size Pages Index');
  add('programmatic-index.html', 'Programmatic Index');
  add('shoe-sizing-guides.html', 'Shoe Sizing Guides');
  add('clothing-size-pages.html', 'Clothing Size Pages');
  add('brand-size-guides.html', 'Brand Size Guides');
  add('tools/measurement-assistant.html', 'Measurement Assistant Tool');
  add('tools/fit-assistant.html', 'Fit Assistant');
  add('printable/foot-measuring-sheet.html', 'Printable Foot Measuring Sheet');
  add('printable/clothing-measurement-chart.html', 'Printable Clothing Measurement Chart');
  add('printable/shoe-size-reference-chart.html', 'Printable Shoe Size Reference Chart');
  add('measurement/24-cm-to-us-shoe-size.html', '24 cm to US Shoe Size');
  add('measurement/26-cm-to-us-shoe-size.html', '26 cm to US Shoe Size');
  add('measurement/90cm-chest-to-us-shirt-size.html', '90 cm Chest to US Shirt');
  add('measurement/70cm-waist-to-eu-pants.html', '70 cm Waist to EU Pants');
  for (const sr of (semanticRoutes || []).slice(0, 12)) {
    if (links.length >= maxTotal) break;
    if (sr.slug) add('semantic/' + sr.slug + '.html', sr.title || sr.slug.replace(/-/g, ' '));
  }
  for (const x of extraLinks) {
    if (links.length >= maxTotal) break;
    add(x.href, x.text);
  }
  const out = links.slice(0, maxTotal);
  return out.map(l => `<li><a href="${escapeHtml(l.href)}">${escapeHtml(l.text)}</a></li>`).join('\n        ');
}

/**
 * Build internal links block for a semantic page: 20–35 links.
 * Categories: hub pages, tools, printable, measurement converters, semantic pages, region/category/size_pair.
 * Paths relative to /semantic/ (../ for root, ../programmatic-pages/, ../measurement/, ../tools/, ../printable/).
 */
function buildSemanticInternalLinks(semanticRoute, allSemanticRoutes, programmaticRoutes, authorityGraph = {}) {
  const added = new Set();
  const links = [];
  const MAX = 35;

  function add(href, text) {
    if (added.has(href)) return;
    added.add(href);
    links.push({ href, text });
  }

  add('../index.html', 'Global Size Chart Home');
  add('../shoe-sizing-guides.html', 'Shoe Sizing Guides');
  add('../shoe-size-converter.html', 'Shoe Size Converter');
  add('../clothing-size-converter.html', 'Clothing Size Converter');
  add('../programmatic-index.html', 'Programmatic Index');
  add('../shoe-size-pages.html', 'Shoe Size Pages Index');
  add('../tools/measurement-assistant.html', 'Measurement Assistant Tool');
  add('../printable/foot-measuring-sheet.html', 'Printable Foot Measuring Sheet');
  add('../printable/clothing-measurement-chart.html', 'Printable Clothing Measurement Chart');
  add('../printable/shoe-size-reference-chart.html', 'Printable Shoe Size Reference Chart');
  add('../measurement/24-cm-to-us-shoe-size.html', '24 cm to US Shoe Size');
  add('../measurement/90cm-chest-to-us-shirt-size.html', '90 cm Chest to US Shirt');
  add('../measurement/70cm-waist-to-eu-pants.html', '70 cm Waist to EU Pants');

  const graphLinks = getAuthorityLinksFromGraph(semanticRoute, authorityGraph);
  const slugToTitle = new Map((allSemanticRoutes || []).map(r => [r.slug, r.title || r.slug]));
  for (const sitePath of graphLinks.semantic) {
    if (links.length >= MAX) break;
    const m = sitePath.match(/\/semantic\/([^/]+\.html)$/);
    if (m && m[1] !== semanticRoute.slug + '.html') add(m[1], slugToTitle.get(m[1].replace(/\.html$/, '')) || m[1].replace(/\.html$/, '').replace(/-/g, ' '));
  }
  for (const sitePath of graphLinks.programmatic) {
    if (links.length >= MAX) break;
    const m = sitePath.match(/\/programmatic-pages\/([^/]+\.html)$/);
    if (m) add(`../programmatic-pages/${m[1]}`, m[1].replace(/\.html$/, '').replace(/-/g, ' '));
  }

  const regionRoutes = programmaticRoutes.filter(r => r.type === 'region');
  for (const r of regionRoutes) {
    if (links.length >= MAX) break;
    add(`../programmatic-pages/${r.slug}.html`, `${getFromRegionLabel(r.from_region)} to ${getFromRegionLabel(r.to_region)}`);
  }
  const categoryRoutes = programmaticRoutes.filter(r => r.type === 'category');
  for (const r of categoryRoutes) {
    if (links.length >= MAX) break;
    add(`../programmatic-pages/${r.slug}.html`, (r.gender === 'men' ? "Men's" : r.gender === 'women' ? "Women's" : "Kids'") + ' Shoe Size Converter');
  }

  const sizePairs = programmaticRoutes.filter(r => r.type === 'size_pair' || (r.type == null && r.size != null));
  sizePairs.sort((a, b) => `${a.from_region}-${a.to_region}`.localeCompare(`${b.from_region}-${b.to_region}`) || parseFloat(a.size) - parseFloat(b.size));
  for (let i = 0; i < Math.min(12, sizePairs.length); i++) {
    const r = sizePairs[i];
    if (links.length >= MAX) break;
    add(`../programmatic-pages/${r.slug}.html`, `${getFromRegionLabel(r.from_region)} ${r.size} to ${getFromRegionLabel(r.to_region)}`);
  }

  const otherSemantic = (allSemanticRoutes || []).filter(r => r.slug !== semanticRoute.slug);
  for (const r of otherSemantic) {
    if (links.length >= MAX) break;
    add(`${r.slug}.html`, r.title || r.slug);
  }

  const out = links.slice(0, MAX);
  return out.map(l => `<li><a href="${escapeHtml(l.href)}">${escapeHtml(l.text)}</a></li>`).join('\n        ');
}

/**
 * Generate Phase 9 semantic cluster pages. Output to /semantic/*.html.
 * Each page: strong H1, conversion references, measurement explanation, 20+ internal links (converters, size pairs, region, cluster).
 */
function generateSemanticClusterPages(semanticRoutes, programmaticRoutes, authorityGraph = {}) {
  if (!semanticRoutes || semanticRoutes.length === 0) return [];

  ensureDir(SEMANTIC_DIR);
  const generated = [];

  for (const route of semanticRoutes) {
    if (route.type !== 'semantic' || !route.slug) continue;

    const title = route.title || route.slug.replace(/-/g, ' ');
    const description = route.description || `Learn about ${title}. Conversion references and measurement guide.`;
    const fileName = route.slug + '.html';
    const canonicalUrl = `${BASE_URL}/semantic/${fileName}`;

    const internalLinksHtml = buildSemanticInternalLinks(route, semanticRoutes, programmaticRoutes, authorityGraph);
    const linkCount = (internalLinksHtml.match(/<li><a /g) || []).length;

    const intro = route.intro || `This guide explains ${title.toLowerCase()} and how it relates to shoe size conversion. Use the links below to convert between US, UK, EU, Japanese, and CM sizes.`;
    const measurementBlock = route.semantic_category === 'measurement_guides'
      ? '<p>Measure your foot length in centimeters for the most accurate conversion: place your foot on a piece of paper, mark heel and longest toe, then measure the distance. Use our <a href="../shoe-size-converter.html">shoe size converter</a> with your measurement.</p>'
      : '<p>For accurate conversion, measure your foot length in cm and use our <a href="../shoe-size-converter.html">shoe size converter</a> or specific <a href="../shoe-size-pages.html">size conversion pages</a>.</p>';

    const breadcrumbItems = [
      { name: 'Home', url: `${BASE_URL}/` },
      { name: 'Shoe Converter', url: `${BASE_URL}/shoe-size-converter.html` },
      { name: title, url: canonicalUrl }
    ];
    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url }))
    };

    const semanticContext = { pageTitle: title + ' | GlobalSizeChart.com', description, h1Title: title, canonicalUrl, hasConverter: false, hasMeasurement: route.semantic_category === 'measurement_guides', hasFit: route.semantic_category === 'fit_guides', datePublished: '2024-01-01' };
    const semanticEnhanced = enhancedSERPSchemaToScriptTags(generateEnhancedSERPSchema(route, semanticContext));
    const dataIntentAttr = getDataIntentAttr(route);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonicalUrl}">
  <title>${escapeHtml(title)} | GlobalSizeChart.com</title>
  <link rel="stylesheet" href="../styles.css">
  <script type="application/ld+json">${JSON.stringify(getOrganizationSchema())}</script>
  <script type="application/ld+json">${JSON.stringify(getWebSiteSchema())}</script>
  <script type="application/ld+json">${JSON.stringify(getWebPageSchema({ name: title, description, url: canonicalUrl }))}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>
  ${semanticEnhanced}
</head>
<body ${dataIntentAttr}>
  <header>
    <div class="header-content">
      <a href="../index.html" class="logo">GlobalSizeChart.com</a>
      <nav>
        <ul>
          <li><a href="../index.html">Home</a></li>
          <li><a href="../shoe-size-converter.html">Shoe Converter</a></li>
          <li><a href="../clothing-size-converter.html">Clothing Converter</a></li>
          <li><a href="../measurement-tools.html">Measurement Tools</a></li>
          <li><a href="../shoe-sizing-guides.html">Guides</a></li>
          <li><a href="../legal/about.html">About</a></li>
          <li><a href="../legal/contact.html">Contact</a></li>
          <li><a href="../legal/privacy.html">Privacy</a></li>
        </ul>
      </nav>
    </div>
  </header>
  <main>
    <div class="container">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a> &gt; <a href="/shoe-size-converter.html">Shoe Converter</a> &gt; <span>${escapeHtml(title)}</span></nav>
      <section class="content-section">
        <h1>${escapeHtml(title)}</h1>
        <p class="mb-lg">${intro}</p>
      </section>
      <section class="content-section">
        <h2>Conversion references</h2>
        <p>Use our converters to switch between regional sizes:</p>
        <ul>
          <li><a href="../shoe-size-converter.html">Shoe Size Converter</a></li>
          <li><a href="../clothing-size-converter.html">Clothing Size Converter</a></li>
          <li><a href="../programmatic-index.html">All conversion pages</a></li>
          <li><a href="../shoe-size-pages.html">Shoe size pages index</a></li>
        </ul>
      </section>
      <section class="content-section">
        <h2>Measurement and conversion</h2>
        ${measurementBlock}
      </section>
      <section class="content-section">
        <h2>Related size conversions and guides</h2>
        <p>Quick links to size-pair pages and regional converters (${linkCount}+ internal links):</p>
        <ul class="related-links">
        ${internalLinksHtml}
        </ul>
      </section>
    </div>
  </main>
  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Converters</h3>
          <ul>
            <li><a href="../shoe-size-converter.html">Shoe Size Converter</a></li>
            <li><a href="../clothing-size-converter.html">Clothing Size Converter</a></li>
            <li><a href="../programmatic-index.html">Programmatic Index</a></li>
            <li><a href="../shoe-size-pages.html">Shoe Size Pages</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3>Information</h3>
          <ul>
            <li><a href="../legal/privacy.html">Privacy</a></li>
            <li><a href="../legal/terms.html">Terms</a></li>
            <li><a href="../legal/disclaimer.html">Disclaimer</a></li>
            <li><a href="../legal/editorial-policy.html">Editorial Policy</a></li>
            <li><a href="../legal/contact.html">Contact</a></li>
            <li><a href="../legal/about.html">About</a></li>
            <li><a href="../legal/ai-usage-disclosure.html">AI Disclosure</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 GlobalSizeChart.com. All rights reserved.</p>
      </div>
    </div>
  </footer>
  <script src="../app.js"></script>
</body>
</html>`;

    const finalHtml = injectSemanticLinksIntoDocument(html, { isProgrammatic: false, currentSlug: route.slug });
    fs.writeFileSync(path.join(SEMANTIC_DIR, fileName), finalHtml, 'utf8');
    generated.push(fileName);
    console.log('  wrote semantic/' + fileName);
  }

  return generated;
}

// --- Phase 9: Automatic entity linking engine ---
const MAX_LINKS_PER_URL_PER_PAGE = 2;
// Longer phrases first so they match before shorter overlaps (e.g. "foot length in cm" before "foot length").
const ENTITY_LINK_KEYWORDS = [
  { phrase: 'foot length in centimeters', targets: [{ type: 'semantic', slug: 'how-to-measure-feet-cm' }, { type: 'region', slug: 'cm-to-us-shoe-size' }] },
  { phrase: 'Japanese sizing', targets: [{ type: 'semantic', slug: 'how-japanese-shoe-sizes-work' }, { type: 'region', slug: 'japan-to-us-shoe-size' }] },
  { phrase: 'EU shoe sizes', targets: [{ type: 'semantic', slug: 'why-eu-and-us-sizes-differ' }, { type: 'region', slug: 'eu-to-us-shoe-size' }] },
  { phrase: 'EU sizes', targets: [{ type: 'semantic', slug: 'why-eu-and-us-sizes-differ' }, { type: 'region', slug: 'eu-to-us-shoe-size' }] },
  { phrase: 'US sizing', targets: [{ type: 'semantic', slug: 'how-shoe-sizing-works' }, { type: 'region', slug: 'us-to-eu-shoe-size' }] },
  { phrase: 'CM measurement', targets: [{ type: 'semantic', slug: 'how-to-measure-feet-cm' }, { type: 'region', slug: 'cm-to-us-shoe-size' }] },
  { phrase: 'foot length in cm', targets: [{ type: 'semantic', slug: 'how-to-measure-feet-cm' }, { type: 'region', slug: 'cm-to-us-shoe-size' }] },
  { phrase: 'foot measurement', targets: [{ type: 'semantic', slug: 'how-to-measure-feet-cm' }] },
  { phrase: 'foot length', targets: [{ type: 'semantic', slug: 'how-to-measure-feet-cm' }] },
  { phrase: 'fit advice', targets: [{ type: 'semantic', slug: 'common-shoe-sizing-mistakes' }] },
  { phrase: 'fit guide', targets: [{ type: 'semantic', slug: 'common-shoe-sizing-mistakes' }] }
];

function getEntityLinkHref(target, routeData) {
  if (target.type === 'semantic') {
    return routeData.isProgrammatic ? '../semantic/' + target.slug + '.html' : (target.slug + '.html');
  }
  if (target.type === 'region' || target.type === 'category') {
    return routeData.isProgrammatic ? (target.slug + '.html') : '../programmatic-pages/' + target.slug + '.html';
  }
  if (target.type === 'converter') {
    return '../shoe-size-converter.html';
  }
  return '';
}

function isInsideAnchor(html, startIndex) {
  const before = html.substring(0, startIndex);
  const lastOpen = Math.max(before.lastIndexOf('<a '), before.lastIndexOf('<a>'));
  const lastClose = before.lastIndexOf('</a>');
  return lastOpen > lastClose;
}

/**
 * Inject semantic/converter/size-pair links into content by detecting keywords.
 * Rules: max 1 link per paragraph, no stacking, same URL at most twice per page.
 * @param {string} content - HTML fragment (e.g. main content)
 * @param {object} routeData - { isProgrammatic: boolean, currentSlug: string }
 * @returns {string} content with links injected
 */
function injectSemanticLinks(content, routeData) {
  const usedCount = Object.create(null);

  return content.replace(/(<p(?:\s[^>]*)?>)([\s\S]*?)(<\/p>)/gi, (match, openTag, inner, closeTag) => {
    let applied = false;
    for (const { phrase, targets } of ENTITY_LINK_KEYWORDS) {
      if (applied) break;
      const re = new RegExp(escapeRegex(phrase), 'i');
      const m = inner.match(re);
      if (!m) continue;
      const matchStart = inner.indexOf(m[0]);
      if (isInsideAnchor(inner, matchStart)) continue;

      for (const target of targets) {
        const href = getEntityLinkHref(target, routeData);
        if (!href || (target.slug && target.slug === routeData.currentSlug)) continue;
        if ((usedCount[href] || 0) >= MAX_LINKS_PER_URL_PER_PAGE) continue;

        const linked = inner.replace(re, (str) => `<a href="${escapeHtml(href)}">${escapeHtml(str)}</a>`);
        usedCount[href] = (usedCount[href] || 0) + 1;
        applied = true;
        return openTag + linked + closeTag;
      }
    }
    return match;
  });
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Run injectSemanticLinks on the <main> content of a full document.
 */
function injectSemanticLinksIntoDocument(html, routeData) {
  return html.replace(/(<main[^>]*>)([\s\S]*?)(<\/main>)/i, (_, openTag, mainContent, closeTag) => {
    return openTag + injectSemanticLinks(mainContent, routeData) + closeTag;
  });
}

// Static URLs included in every sitemap rebuild (no programmatic-pages here). Core → 1.0.
const SITEMAP_STATIC_URLS = [
  { loc: `${BASE_URL}/`, lastmod: '2024-01-01', changefreq: 'weekly', priority: '1.0' },
  { loc: `${BASE_URL}/shoe-size-converter.html`, lastmod: '2024-01-01', changefreq: 'weekly', priority: '1.0' },
  { loc: `${BASE_URL}/clothing-size-converter.html`, lastmod: '2024-01-01', changefreq: 'weekly', priority: '1.0' },
  { loc: `${BASE_URL}/us-to-eu-size.html`, lastmod: '2024-01-01', changefreq: 'monthly', priority: '1.0' },
  { loc: `${BASE_URL}/uk-to-us-size.html`, lastmod: '2024-01-01', changefreq: 'monthly', priority: '1.0' },
  { loc: `${BASE_URL}/cm-to-us-shoe-size.html`, lastmod: '2024-01-01', changefreq: 'monthly', priority: '1.0' },
  { loc: `${BASE_URL}/legal/about.html`, lastmod: '2024-01-01', changefreq: 'monthly', priority: '0.5' },
  { loc: `${BASE_URL}/legal/contact.html`, lastmod: '2024-01-01', changefreq: 'monthly', priority: '0.5' },
  { loc: `${BASE_URL}/legal/privacy.html`, lastmod: '2024-01-01', changefreq: 'yearly', priority: '0.3' },
  { loc: `${BASE_URL}/legal/terms.html`, lastmod: '2024-01-01', changefreq: 'yearly', priority: '0.3' }
];

function urlToSitemapEntry(entry) {
  return `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
}

function writeUrlsetSitemap(filePath, entries) {
  const body = entries.map(urlToSitemapEntry).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
  fs.writeFileSync(filePath, xml, 'utf8');
}

function writeSitemapIndex(filePath, sitemapUrls) {
  const today = new Date().toISOString().slice(0, 10);
  const body = sitemapUrls.map(loc => `  <sitemap>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
  fs.writeFileSync(filePath, xml, 'utf8');
}

function buildTieredSitemaps(routes, semanticFileNames = [], clothingFileNames = [], brandFileNames = [], measurementFileNames = [], printableFileNames = [], toolFileNames = []) {
  const today = new Date().toISOString().slice(0, 10);
  ensureDir(SITEMAPS_DIR);

  const sitemapBase = `${BASE_URL}/sitemaps`;

  // 1. Core — programmatic index, hubs, semantic cluster, clothing, brand, measurement, printable, tools pages
  const coreUrls = [
    ...SITEMAP_STATIC_URLS,
    { loc: `${BASE_URL}/programmatic-index.html`, lastmod: today, changefreq: 'weekly', priority: '1.0' },
    { loc: `${BASE_URL}/shoe-size-pages.html`, lastmod: today, changefreq: 'weekly', priority: '1.0' },
    { loc: `${BASE_URL}/shoe-sizing-guides.html`, lastmod: today, changefreq: 'weekly', priority: '0.9' },
    { loc: `${BASE_URL}/clothing-size-pages.html`, lastmod: today, changefreq: 'weekly', priority: '0.9' },
    { loc: `${BASE_URL}/brand-size-guides.html`, lastmod: today, changefreq: 'weekly', priority: '0.9' },
    { loc: `${BASE_URL}/cm-measurement-converters.html`, lastmod: today, changefreq: 'weekly', priority: '0.9' },
    { loc: `${BASE_URL}/printable-size-guides.html`, lastmod: today, changefreq: 'weekly', priority: '0.9' },
    { loc: `${BASE_URL}/measurement-tools.html`, lastmod: today, changefreq: 'weekly', priority: '0.9' }
  ];
  for (const fileName of semanticFileNames) {
    coreUrls.push({ loc: `${BASE_URL}/semantic/${fileName}`, lastmod: today, changefreq: 'monthly', priority: '0.7' });
  }
  for (const fileName of clothingFileNames) {
    coreUrls.push({ loc: `${BASE_URL}/clothing/${fileName}`, lastmod: today, changefreq: 'monthly', priority: '0.6' });
  }
  for (const fileName of brandFileNames) {
    coreUrls.push({ loc: `${BASE_URL}/brands/${fileName}`, lastmod: today, changefreq: 'monthly', priority: '0.6' });
  }
  for (const fileName of measurementFileNames) {
    coreUrls.push({ loc: `${BASE_URL}/measurement/${fileName}`, lastmod: today, changefreq: 'monthly', priority: '0.6' });
  }
  for (const fileName of printableFileNames) {
    coreUrls.push({ loc: `${BASE_URL}/printable/${fileName}`, lastmod: today, changefreq: 'monthly', priority: '0.6' });
  }
  for (const fileName of toolFileNames) {
    coreUrls.push({ loc: `${BASE_URL}/tools/${fileName}`, lastmod: today, changefreq: 'monthly', priority: '0.6' });
  }
  writeUrlsetSitemap(path.join(SITEMAPS_DIR, 'sitemap-core.xml'), coreUrls);

  // 2. Programmatic by type (max 500 URLs per file). Region → 0.8, Category → 0.7, Size pair → 0.6
  const sizePairRoutes = routes.filter(r => r.type === 'size_pair' || r.type == null);
  const regionRoutes = routes.filter(r => r.type === 'region');
  const categoryRoutes = routes.filter(r => r.type === 'category');

  const programmaticPriority = (route) => {
    if (route.type === 'region') return '0.8';
    if (route.type === 'category') return '0.7';
    return '0.6'; // size_pair or null
  };
  const toProgrammaticEntry = (route) => ({
    loc: `${BASE_URL}/programmatic-pages/${route.slug}.html`,
    lastmod: today,
    changefreq: 'monthly',
    priority: programmaticPriority(route)
  });

  const programmaticIndexRefs = [];

  // Size pairs — chunk if > 500
  const sizePairEntries = sizePairRoutes.map(toProgrammaticEntry);
  if (sizePairEntries.length > 0) {
    const numChunks = Math.ceil(sizePairEntries.length / MAX_URLS_PER_SITEMAP);
    for (let i = 0; i < sizePairEntries.length; i += MAX_URLS_PER_SITEMAP) {
      const chunk = sizePairEntries.slice(i, i + MAX_URLS_PER_SITEMAP);
      const chunkNum = Math.floor(i / MAX_URLS_PER_SITEMAP) + 1;
      const filename = numChunks === 1 ? 'sitemap-programmatic-sizepairs.xml' : `sitemap-programmatic-sizepairs-${chunkNum}.xml`;
      writeUrlsetSitemap(path.join(SITEMAPS_DIR, filename), chunk);
      programmaticIndexRefs.push(`${sitemapBase}/${filename}`);
    }
  }

  // Regions
  if (regionRoutes.length > 0) {
    writeUrlsetSitemap(path.join(SITEMAPS_DIR, 'sitemap-programmatic-regions.xml'), regionRoutes.map(toProgrammaticEntry));
    programmaticIndexRefs.push(`${sitemapBase}/sitemap-programmatic-regions.xml`);
  }

  // Categories
  if (categoryRoutes.length > 0) {
    writeUrlsetSitemap(path.join(SITEMAPS_DIR, 'sitemap-programmatic-categories.xml'), categoryRoutes.map(toProgrammaticEntry));
    programmaticIndexRefs.push(`${sitemapBase}/sitemap-programmatic-categories.xml`);
  }

  // 3. Programmatic index (references sizepairs + regions + categories)
  writeSitemapIndex(path.join(SITEMAPS_DIR, 'sitemap-programmatic.xml'), programmaticIndexRefs);

  // 4. Master sitemap index (core first, then programmatic)
  const masterRefs = [
    `${sitemapBase}/sitemap-core.xml`,
    `${sitemapBase}/sitemap-programmatic.xml`
  ];
  writeSitemapIndex(path.join(ROOT, 'sitemap.xml'), masterRefs);
}

// --- Objective 10: Indexability + scale safety ---
const PHASE10_REPORT_PATH = path.join(BUILD_DIR, 'phase10-report.json');
const HUB_PAGE_FILES = ['shoe-size-pages.html', 'clothing-size-pages.html', 'brand-size-guides.html', 'cm-measurement-converters.html', 'printable-size-guides.html', 'measurement-tools.html', 'programmatic-index.html', 'shoe-sizing-guides.html'];

/** Extract title, canonical, and meta robots from HTML string. */
function extractMetaFromHtml(html) {
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i) || html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i);
  const robotsMatch = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i);
  return {
    title: titleMatch ? titleMatch[1].trim() : null,
    canonical: canonicalMatch ? canonicalMatch[1].trim() : null,
    robotsContent: robotsMatch ? robotsMatch[1].trim() : null
  };
}

/**
 * Full indexability verification across all generated pages.
 * Verifies: no duplicate titles, no duplicate canonicals, no noindex tags.
 * @param {object} generated - { programmatic, semantic, clothing, brand, measurement, printable, tool }
 * @returns {object} - { duplicate_titles, duplicate_canonicals, noindex_pages, missing_canonicals, all_pages_meta }
 */
function runFullIndexabilityVerification(generated) {
  const allPages = [];
  const groups = [
    { dir: OUTPUT_DIR, files: generated.programmatic || [], urlPrefix: '/programmatic-pages/' },
    { dir: SEMANTIC_DIR, files: generated.semantic || [], urlPrefix: '/semantic/' },
    { dir: CLOTHING_DIR, files: generated.clothing || [], urlPrefix: '/clothing/' },
    { dir: BRANDS_DIR, files: generated.brand || [], urlPrefix: '/brands/' },
    { dir: MEASUREMENT_DIR, files: generated.measurement || [], urlPrefix: '/measurement/' },
    { dir: PRINTABLE_DIR, files: generated.printable || [], urlPrefix: '/printable/' },
    { dir: TOOLS_DIR, files: generated.tool || [], urlPrefix: '/tools/' }
  ];
  for (const { dir, files, urlPrefix } of groups) {
    for (const fileName of files) {
      const fp = path.join(dir, fileName);
      if (!fs.existsSync(fp)) continue;
      const html = fs.readFileSync(fp, 'utf8');
      const meta = extractMetaFromHtml(html);
      const pathUrl = urlPrefix + fileName;
      allPages.push({ path: pathUrl, filePath: fp, ...meta });
    }
  }
  for (const fileName of HUB_PAGE_FILES) {
    const fp = path.join(ROOT, fileName);
    if (!fs.existsSync(fp)) continue;
    const html = fs.readFileSync(fp, 'utf8');
    const meta = extractMetaFromHtml(html);
    allPages.push({ path: '/' + fileName, filePath: fp, ...meta });
  }

  const titleToPaths = {};
  const canonicalToPaths = {};
  const noindexPages = [];
  const missingCanonicals = [];

  for (const p of allPages) {
    if (p.title) {
      titleToPaths[p.title] = titleToPaths[p.title] || [];
      titleToPaths[p.title].push(p.path);
    }
    if (p.canonical) {
      canonicalToPaths[p.canonical] = canonicalToPaths[p.canonical] || [];
      canonicalToPaths[p.canonical].push(p.path);
    } else {
      missingCanonicals.push(p.path);
    }
    if (p.robotsContent && /noindex/i.test(p.robotsContent)) {
      noindexPages.push(p.path);
    }
  }

  const duplicate_titles = Object.entries(titleToPaths).filter(([, paths]) => paths.length > 1).map(([title, paths]) => ({ title, paths }));
  const duplicate_canonicals = Object.entries(canonicalToPaths).filter(([, paths]) => paths.length > 1).map(([canonical, paths]) => ({ canonical, paths }));

  return {
    duplicate_titles,
    duplicate_canonicals,
    noindex_pages: noindexPages,
    missing_canonicals: missingCanonicals,
    total_verified: allPages.length
  };
}

/** Ensure robots.txt contains Sitemap line; append if missing. */
function ensureRobotsTxtUpdated() {
  const robotsPath = path.join(ROOT, 'robots.txt');
  const sitemapLine = `Sitemap: ${BASE_URL}/sitemap.xml`;
  let content = fs.existsSync(robotsPath) ? fs.readFileSync(robotsPath, 'utf8') : '';
  if (!content.includes('Sitemap:') && !content.includes('sitemap.xml')) {
    content = content.trimEnd();
    if (content) content += '\n';
    content += sitemapLine + '\n';
    fs.writeFileSync(robotsPath, content, 'utf8');
    console.log('Updated robots.txt with Sitemap line.');
  }
}

/**
 * Build Phase 10 report: total page count, pages per route type, average internal links,
 * orphan detection, schema validation, hub coverage, crawl depth. Writes build/phase10-report.json.
 */
function runPhase10Report(opts) {
  const {
    programmaticGenerated = [],
    semanticGenerated = [],
    clothingGenerated = [],
    brandGenerated = [],
    measurementGenerated = [],
    printableGenerated = [],
    toolGenerated = [],
    indexability = {}
  } = opts;

  ensureDir(BUILD_DIR);

  const hubCount = HUB_PAGE_FILES.filter(f => fs.existsSync(path.join(ROOT, f))).length;
  const pagesPerRouteType = {
    programmatic: programmaticGenerated.length,
    semantic: semanticGenerated.length,
    clothing: clothingGenerated.length,
    brand: brandGenerated.length,
    measurement: measurementGenerated.length,
    printable: printableGenerated.length,
    tool: toolGenerated.length,
    hubs: hubCount
  };
  const totalPageCount = programmaticGenerated.length + semanticGenerated.length + clothingGenerated.length + brandGenerated.length + measurementGenerated.length + printableGenerated.length + toolGenerated.length + hubCount;

  const allLinkedPaths = new Set();
  const normalizePath = (href, baseDir) => {
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null;
    let p = href.replace(/^https?:\/\/[^/]+/, '').split('#')[0].trim();
    if (!p) return null;
    if (p.startsWith('/')) return p.replace(/\/index\.html?$/, '/') || '/index.html';
    if (p.startsWith('../')) {
      if (baseDir === 'programmatic-pages') p = '/' + p.replace(/^\.\.\//, '');
      else if (baseDir === 'semantic') p = '/' + p.replace(/^\.\.\//, '');
      else if (baseDir === 'clothing') p = '/clothing/' + p.replace(/^\.\.\//, '');
      else if (baseDir === 'brands') p = '/brands/' + p.replace(/^\.\.\//, '');
      else if (baseDir === 'measurement') p = '/measurement/' + p.replace(/^\.\.\//, '');
      else if (baseDir === 'printable') p = '/printable/' + p.replace(/^\.\.\//, '');
      else if (baseDir === 'tools') p = '/tools/' + p.replace(/^\.\.\//, '');
      else p = '/' + p.replace(/^\.\.\//, '');
    } else if (!p.startsWith('/')) {
      if (baseDir === 'semantic') p = '/semantic/' + p;
      else if (baseDir === 'programmatic-pages') p = '/programmatic-pages/' + p;
      else if (baseDir === 'clothing') p = '/clothing/' + p;
      else if (baseDir === 'brands') p = '/brands/' + p;
      else if (baseDir === 'measurement') p = '/measurement/' + p;
      else if (baseDir === 'printable') p = '/printable/' + p;
      else if (baseDir === 'tools') p = '/tools/' + p;
      else p = '/' + p;
    }
    return p.replace(/\/+/g, '/') || '/index.html';
  };

  let totalLinks = 0;
  let pageCountWithLinks = 0;
  const schemaValidation = {
    programmatic: { breadcrumb: 0, faq: 0, article_or_howto: 0, webpage: 0 },
    semantic: { breadcrumb: 0, article_or_howto: 0, webpage: 0 },
    clothing: { breadcrumb: 0, article: 0, webpage: 0 },
    brand: { breadcrumb: 0, article: 0, webpage: 0 },
    measurement: { breadcrumb: 0, article: 0, howto: 0, webpage: 0 },
    printable: { breadcrumb: 0, article: 0, howto: 0, webpage: 0 },
    tool: { breadcrumb: 0, faq: 0, howto: 0, software: 0, webpage: 0 },
    hubs: { breadcrumb: 0, article: 0, faq: 0, webpage: 0 }
  };

  const scanDir = (dir, fileNames, dirKey, baseDir) => {
    for (const fileName of fileNames) {
      const fp = path.join(dir, fileName);
      if (!fs.existsSync(fp)) continue;
      const html = fs.readFileSync(fp, 'utf8');
      const linkCount = (html.match(/<a\s+href=/gi) || []).length;
      totalLinks += linkCount;
      pageCountWithLinks++;
      (html.match(/<a\s+href=["']([^"']+)["']/gi) || []).forEach(h => {
        const m = h.match(/href=["']([^"']+)["']/i);
        if (m) {
          const norm = normalizePath(m[1], baseDir);
          if (norm) allLinkedPaths.add(norm);
        }
      });
      if (dirKey === 'programmatic') {
        if (html.includes('BreadcrumbList')) schemaValidation.programmatic.breadcrumb++;
        if (html.includes('FAQPage') || html.includes('"@type":"FAQPage"')) schemaValidation.programmatic.faq++;
        if (html.includes('"@type":"Article"') || html.includes('"@type":"HowTo"')) schemaValidation.programmatic.article_or_howto++;
        if (html.includes('"@type":"WebPage"')) schemaValidation.programmatic.webpage++;
      } else if (dirKey === 'semantic') {
        if (html.includes('BreadcrumbList')) schemaValidation.semantic.breadcrumb++;
        if (html.includes('"@type":"Article"') || html.includes('"@type":"HowTo"')) schemaValidation.semantic.article_or_howto++;
        if (html.includes('"@type":"WebPage"')) schemaValidation.semantic.webpage++;
      } else if (dirKey === 'clothing') {
        if (html.includes('BreadcrumbList')) schemaValidation.clothing.breadcrumb++;
        if (html.includes('"@type":"Article"')) schemaValidation.clothing.article++;
        if (html.includes('"@type":"WebPage"')) schemaValidation.clothing.webpage++;
      } else if (dirKey === 'brand') {
        if (html.includes('BreadcrumbList')) schemaValidation.brand.breadcrumb++;
        if (html.includes('"@type":"Article"')) schemaValidation.brand.article++;
        if (html.includes('"@type":"WebPage"')) schemaValidation.brand.webpage++;
      } else if (dirKey === 'measurement') {
        if (html.includes('BreadcrumbList')) schemaValidation.measurement.breadcrumb++;
        if (html.includes('"@type":"Article"')) schemaValidation.measurement.article++;
        if (html.includes('"@type":"HowTo"')) schemaValidation.measurement.howto++;
        if (html.includes('"@type":"WebPage"')) schemaValidation.measurement.webpage++;
      } else if (dirKey === 'printable') {
        if (html.includes('BreadcrumbList')) schemaValidation.printable.breadcrumb++;
        if (html.includes('"@type":"Article"')) schemaValidation.printable.article++;
        if (html.includes('"@type":"HowTo"')) schemaValidation.printable.howto++;
        if (html.includes('"@type":"WebPage"')) schemaValidation.printable.webpage++;
      } else if (dirKey === 'tool') {
        if (html.includes('BreadcrumbList')) schemaValidation.tool.breadcrumb++;
        if (html.includes('FAQPage') || html.includes('"@type":"FAQPage"')) schemaValidation.tool.faq++;
        if (html.includes('"@type":"HowTo"')) schemaValidation.tool.howto++;
        if (html.includes('SoftwareApplication') || html.includes('"@type":"SoftwareApplication"')) schemaValidation.tool.software++;
        if (html.includes('"@type":"WebPage"')) schemaValidation.tool.webpage++;
      }
    }
  };

  scanDir(OUTPUT_DIR, programmaticGenerated, 'programmatic', 'programmatic-pages');
  scanDir(SEMANTIC_DIR, semanticGenerated, 'semantic', 'semantic');
  scanDir(CLOTHING_DIR, clothingGenerated, 'clothing', 'clothing');
  scanDir(BRANDS_DIR, brandGenerated, 'brand', 'brands');
  scanDir(MEASUREMENT_DIR, measurementGenerated, 'measurement', 'measurement');
  scanDir(PRINTABLE_DIR, printableGenerated, 'printable', 'printable');
  scanDir(TOOLS_DIR, toolGenerated, 'tool', 'tools');

  for (const p of ['index.html', 'shoe-size-converter.html', 'shoe-sizing-guides.html', 'shoe-size-pages.html', 'programmatic-index.html', 'clothing-size-pages.html', 'brand-size-guides.html', 'cm-measurement-converters.html', 'printable-size-guides.html', 'measurement-tools.html']) {
    const fp = path.join(ROOT, p);
    if (!fs.existsSync(fp)) continue;
    const html = fs.readFileSync(fp, 'utf8');
    (html.match(/<a\s+href=["']([^"']+)["']/gi) || []).forEach(h => {
      const m = h.match(/href=["']([^"']+)["']/i);
      if (m) {
        const norm = normalizePath(m[1], '');
        if (norm) allLinkedPaths.add(norm);
      }
    });
    if (HUB_PAGE_FILES.includes(p)) {
      if (html.includes('BreadcrumbList')) schemaValidation.hubs.breadcrumb++;
      if (html.includes('"@type":"Article"')) schemaValidation.hubs.article++;
      if (html.includes('FAQPage') || html.includes('"@type":"FAQPage"')) schemaValidation.hubs.faq++;
      if (html.includes('"@type":"WebPage"')) schemaValidation.hubs.webpage++;
    }
  }

  const allProgrammaticPaths = new Set(programmaticGenerated.map(f => '/programmatic-pages/' + f));
  const allSemanticPaths = new Set(semanticGenerated.map(f => '/semantic/' + f));
  const allClothingPaths = new Set(clothingGenerated.map(f => '/clothing/' + f));
  const allBrandPaths = new Set(brandGenerated.map(f => '/brands/' + f));
  const allMeasurementPaths = new Set(measurementGenerated.map(f => '/measurement/' + f));
  const allPrintablePaths = new Set(printableGenerated.map(f => '/printable/' + f));
  const allToolPaths = new Set(toolGenerated.map(f => '/tools/' + f));
  const possibleOrphans = [...allProgrammaticPaths, ...allSemanticPaths, ...allClothingPaths, ...allBrandPaths, ...allMeasurementPaths, ...allPrintablePaths, ...allToolPaths];
  const orphan_pages = possibleOrphans.filter(p => {
    const normalized = p.replace(/\/+/g, '/');
    return !allLinkedPaths.has(normalized) && !allLinkedPaths.has(normalized.replace('.html', ''));
  });

  const hubCoverage = HUB_PAGE_FILES.map(name => {
    const fp = path.join(ROOT, name);
    if (!fs.existsSync(fp)) return { hub: name, links_to: [] };
    const html = fs.readFileSync(fp, 'utf8');
    const hrefs = (html.match(/<a\s+href=["']([^"']+)["']/gi) || []).map(h => (h.match(/href=["']([^"']+)["']/i) || [])[1]).filter(Boolean);
    const sections = new Set();
    for (const h of hrefs) {
      const norm = (h || '').replace(/^https?:\/\/[^/]+/, '');
      if (/semantic/.test(norm)) sections.add('semantic');
      if (/programmatic-pages/.test(norm)) sections.add('programmatic');
      if (/clothing/.test(norm)) sections.add('clothing');
      if (/brands/.test(norm)) sections.add('brands');
      if (/measurement/.test(norm)) sections.add('measurement');
      if (/printable/.test(norm)) sections.add('printable');
      if (/tools/.test(norm)) sections.add('tools');
    }
    return { hub: name, links_to: [...sections] };
  });

  const crawlDepthEstimation = {
    depth_0: 1,
    depth_1: hubCount + 2,
    depth_2: programmaticGenerated.length + semanticGenerated.length + clothingGenerated.length + brandGenerated.length + measurementGenerated.length + printableGenerated.length + toolGenerated.length
  };

  const averageInternalLinks = pageCountWithLinks > 0 ? Math.round((totalLinks / pageCountWithLinks) * 10) / 10 : 0;

  const report = {
    generatedAt: new Date().toISOString(),
    total_page_count: totalPageCount,
    pages_per_route_type: pagesPerRouteType,
    average_internal_links: averageInternalLinks,
    orphan_detection: { orphans: orphan_pages, count: orphan_pages.length },
    schema_validation: schemaValidation,
    hub_coverage: hubCoverage,
    crawl_depth_estimation: crawlDepthEstimation,
    indexability: {
      duplicate_titles: indexability.duplicate_titles || [],
      duplicate_canonicals: indexability.duplicate_canonicals || [],
      noindex_pages: indexability.noindex_pages || [],
      missing_canonicals: indexability.missing_canonicals || []
    },
    sitemap_rebuilt: true,
    robots_txt_updated: true
  };

  fs.writeFileSync(PHASE10_REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
  return report;
}

/**
 * Phase 9 validation: semantic/page counts, average internal links, orphan detection,
 * schema validation, cluster integrity. Writes build/phase9-report.json.
 */
function runPhase9Report(opts) {
  const {
    semanticGenerated = [],
    semanticRoutes = [],
    programmaticGenerated = [],
    programmaticRoutes = [],
    authorityGraph = {},
    indexabilityReport = {}
  } = opts;

  ensureDir(BUILD_DIR);
  const report = {
    generatedAt: new Date().toISOString(),
    semantic_page_count: semanticGenerated.length,
    average_internal_links: 0,
    orphan_pages: [],
    schema_validation: { semantic: { breadcrumb: 0, article_or_howto: 0 }, programmatic: { faq: 0, breadcrumb: 0 } },
    cluster_integrity: { authority_graph_used: false, authority_graph_topic_count: 0, semantic_links_requirements_met: false },
    sitemap_includes_semantic: false,
    duplicate_titles: (indexabilityReport.duplicateTitles || []).length,
    internal_links_increased: true
  };

  const allLinkedPaths = new Set();
  const normalizePath = (href, baseDir) => {
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null;
    let p = href.replace(/^https?:\/\/[^/]+/, '').split('#')[0].trim();
    if (!p) return null;
    if (p.startsWith('/')) return p.replace(/\/index\.html?$/, '/') || '/index.html';
    const base = baseDir || '';
    if (base.includes('semantic')) {
      if (p.startsWith('../')) p = p.replace(/^\.\.\//, '/');
      else if (!p.startsWith('/')) p = '/semantic/' + p;
    } else if (base.includes('programmatic-pages')) {
      if (p.startsWith('../')) p = '/' + p.replace(/^\.\.\//, '');
      else if (!p.startsWith('/')) p = '/programmatic-pages/' + p;
    } else {
      if (!p.startsWith('/')) p = '/' + p;
    }
    return p.replace(/\/+/g, '/') || '/index.html';
  };

  let totalSemanticLinks = 0;
  for (const fileName of semanticGenerated) {
    const fp = path.join(SEMANTIC_DIR, fileName);
    if (!fs.existsSync(fp)) continue;
    const html = fs.readFileSync(fp, 'utf8');
    const linkCount = (html.match(/<a\s+href=/gi) || []).length;
    totalSemanticLinks += linkCount;
    const hrefs = html.match(/<a\s+href=["']([^"']+)["']/gi) || [];
    for (const h of hrefs) {
      const m = h.match(/href=["']([^"']+)["']/i);
      if (m) {
        const norm = normalizePath(m[1], 'semantic');
        if (norm) allLinkedPaths.add(norm);
      }
    }
    if (html.includes('BreadcrumbList')) report.schema_validation.semantic.breadcrumb++;
    if (html.includes('"@type":"Article"') || html.includes('"@type":"HowTo"')) report.schema_validation.semantic.article_or_howto++;
  }
  report.average_internal_links = semanticGenerated.length > 0 ? Math.round((totalSemanticLinks / semanticGenerated.length) * 10) / 10 : 0;

  for (const fileName of programmaticGenerated) {
    const fp = path.join(OUTPUT_DIR, fileName);
    if (!fs.existsSync(fp)) continue;
    const html = fs.readFileSync(fp, 'utf8');
    const hrefs = html.match(/<a\s+href=["']([^"']+)["']/gi) || [];
    for (const h of hrefs) {
      const m = h.match(/href=["']([^"']+)["']/i);
      if (m) {
        const norm = normalizePath(m[1], 'programmatic-pages');
        if (norm) allLinkedPaths.add(norm);
      }
    }
    if (html.includes('FAQPage') || html.includes('"@type":"FAQPage"')) report.schema_validation.programmatic.faq++;
    if (html.includes('BreadcrumbList')) report.schema_validation.programmatic.breadcrumb++;
  }

  const corePages = ['index.html', 'shoe-size-converter.html', 'shoe-sizing-guides.html', 'shoe-size-pages.html', 'programmatic-index.html'];
  for (const p of corePages) {
    const fp = path.join(ROOT, p);
    if (!fs.existsSync(fp)) continue;
    const html = fs.readFileSync(fp, 'utf8');
    (html.match(/<a\s+href=["']([^"']+)["']/gi) || []).forEach(h => {
      const m = h.match(/href=["']([^"']+)["']/i);
      if (m) {
        const norm = normalizePath(m[1], '');
        if (norm) allLinkedPaths.add(norm);
      }
    });
  }

  const allSemanticPaths = new Set(semanticGenerated.map(f => '/semantic/' + f));
  const allProgrammaticPaths = new Set(programmaticGenerated.map(f => '/programmatic-pages/' + f));
  const possibleOrphans = [...allSemanticPaths, ...allProgrammaticPaths];
  for (const p of possibleOrphans) {
    const normalized = p.replace(/\/+/g, '/');
    if (!allLinkedPaths.has(normalized) && !allLinkedPaths.has(normalized.replace('.html', ''))) report.orphan_pages.push(p);
  }

  report.cluster_integrity.authority_graph_used = Object.keys(authorityGraph).filter(k => !k.startsWith('_')).length > 0;
  report.cluster_integrity.authority_graph_topic_count = Object.keys(authorityGraph).filter(k => !k.startsWith('_')).length;
  report.cluster_integrity.semantic_links_requirements_met = report.semantic_page_count === 0 || report.average_internal_links >= MIN_SEMANTIC_INTERNAL_LINKS;

  const coreSitemapPath = path.join(SITEMAPS_DIR, 'sitemap-core.xml');
  if (fs.existsSync(coreSitemapPath)) {
    const coreXml = fs.readFileSync(coreSitemapPath, 'utf8');
    report.sitemap_includes_semantic = semanticGenerated.every(f => coreXml.includes('/semantic/' + f));
  }

  fs.writeFileSync(path.join(BUILD_DIR, 'phase9-report.json'), JSON.stringify(report, null, 2), 'utf8');
  return report;
}

/**
 * Run the full Phase 10 generator. Accepts optional config; when omitted, loads from data files.
 * Used by generate-phase10-pages.js for mass route generation (1000+ pages).
 * @param {object} [config] - Optional. { programmaticRoutes, semanticRoutes, clothingRoutes, brandRoutes, measurementRoutes, shoeData, clothingData, authorityGraph }
 * @returns {{ totalPages: number, programmatic: string[], semantic: string[], clothing: string[], brand: string[], measurement: string[], printable: string[], tool: string[] }}
 */
function runPhase10Generator(config) {
  const shoeData = config && config.shoeData != null ? config.shoeData : loadJson(path.join(DATA_DIR, 'shoe_sizes.json'));
  const routes = config && config.programmaticRoutes != null ? config.programmaticRoutes : loadJson(path.join(DATA_DIR, 'programmatic_routes.json'));
  const template = fs.readFileSync(path.join(TEMPLATES_DIR, 'conversion-template.html'), 'utf8');

  const phase8Routes = routes.filter(r => r.type == null || PHASE8_TYPES.has(r.type));

  ensureDir(OUTPUT_DIR);

  const semanticRoutes = config && config.semanticRoutes != null ? config.semanticRoutes : (fs.existsSync(path.join(DATA_DIR, 'semantic_routes.json')) ? loadJson(path.join(DATA_DIR, 'semantic_routes.json')) : []);
  const authorityGraph = config && config.authorityGraph != null ? config.authorityGraph : loadAuthorityGraph();

  const generated = [];
  for (const route of phase8Routes) {
    const { html, fileName } = generatePage(route, template, shoeData, routes, semanticRoutes, authorityGraph);
    fs.writeFileSync(path.join(OUTPUT_DIR, fileName), html, 'utf8');
    generated.push(fileName);
    console.log('  wrote', fileName);
  }

  const indexHtml = buildProgrammaticIndexPage(routes);
  fs.writeFileSync(path.join(ROOT, 'programmatic-index.html'), indexHtml, 'utf8');
  console.log('  wrote programmatic-index.html');

  const hubHtml = generateProgrammaticHub(routes);
  fs.writeFileSync(path.join(ROOT, 'shoe-size-pages.html'), hubHtml, 'utf8');
  console.log('  wrote shoe-size-pages.html');

  const guidesHtml = generateShoeSizingGuidesPage(semanticRoutes);
  fs.writeFileSync(path.join(ROOT, 'shoe-sizing-guides.html'), guidesHtml, 'utf8');
  console.log('  wrote shoe-sizing-guides.html');

  const semanticGenerated = generateSemanticClusterPages(semanticRoutes, routes, authorityGraph);

  const clothingRoutes = config && config.clothingRoutes != null ? config.clothingRoutes : (fs.existsSync(path.join(DATA_DIR, 'clothing_routes.json')) ? loadJson(path.join(DATA_DIR, 'clothing_routes.json')) : []);
  const clothingData = config && config.clothingData != null ? config.clothingData : (fs.existsSync(path.join(DATA_DIR, 'clothing_sizes.json')) ? loadJson(path.join(DATA_DIR, 'clothing_sizes.json')) : {});
  const clothingGenerated = generateClothingProgrammaticPages(clothingRoutes, clothingData, semanticRoutes, authorityGraph);

  const brandRoutes = config && config.brandRoutes != null ? config.brandRoutes : (fs.existsSync(path.join(DATA_DIR, 'brand_routes.json')) ? loadJson(path.join(DATA_DIR, 'brand_routes.json')) : []);
  const brandGenerated = generateBrandConverters(brandRoutes, semanticRoutes);

  const measurementRoutes = config && config.measurementRoutes != null ? config.measurementRoutes : (fs.existsSync(path.join(DATA_DIR, 'measurement_routes.json')) ? loadJson(path.join(DATA_DIR, 'measurement_routes.json')) : []);
  const measurementGenerated = generateCMConverters(measurementRoutes, shoeData, clothingData, semanticRoutes);

  const printableGenerated = generatePrintableGuides(shoeData);

  const toolGenerated = generateMeasurementTools(shoeData, clothingData);

  fs.writeFileSync(path.join(ROOT, 'clothing-size-pages.html'), generateClothingSizePagesHub(clothingGenerated, clothingRoutes), 'utf8');
  console.log('  wrote clothing-size-pages.html');
  fs.writeFileSync(path.join(ROOT, 'brand-size-guides.html'), generateBrandSizeGuidesHub(brandGenerated, brandRoutes), 'utf8');
  console.log('  wrote brand-size-guides.html');
  fs.writeFileSync(path.join(ROOT, 'cm-measurement-converters.html'), generateCMMeasurementConvertersHub(measurementGenerated, routes.filter(r => r.type === 'region')), 'utf8');
  console.log('  wrote cm-measurement-converters.html');
  fs.writeFileSync(path.join(ROOT, 'printable-size-guides.html'), generatePrintableSizeGuidesHub(printableGenerated), 'utf8');
  console.log('  wrote printable-size-guides.html');
  fs.writeFileSync(path.join(ROOT, 'measurement-tools.html'), generateMeasurementToolsHub(toolGenerated), 'utf8');
  console.log('  wrote measurement-tools.html');

  buildTieredSitemaps(routes, semanticGenerated, clothingGenerated, brandGenerated, measurementGenerated, printableGenerated, toolGenerated);
  console.log('Built tiered sitemaps: sitemaps/sitemap-core.xml, sitemap-programmatic*.xml, sitemap.xml (index).');
  ensureRobotsTxtUpdated();

  if (clothingGenerated.length > 0) console.log('Phase 10: generated', clothingGenerated.length, 'clothing pages in clothing/');
  if (brandGenerated.length > 0) console.log('Phase 10: generated', brandGenerated.length, 'brand pages in brands/');
  if (measurementGenerated.length > 0) console.log('Phase 10 Objective 3: generated', measurementGenerated.length, 'measurement converter pages in measurement/');
  if (printableGenerated.length > 0) console.log('Objective 4: generated', printableGenerated.length, 'printable guides in printable/');
  if (toolGenerated.length > 0) console.log('Objective 5: generated', toolGenerated.length, 'tool(s) in tools/');

  const indexabilityReport = runIndexabilityChecks(phase8Routes);
  console.log('Indexability report: build/indexability-report.json');

  const indexabilityFull = runFullIndexabilityVerification({
    programmatic: generated,
    semantic: semanticGenerated,
    clothing: clothingGenerated,
    brand: brandGenerated,
    measurement: measurementGenerated,
    printable: printableGenerated,
    tool: toolGenerated
  });
  if (indexabilityFull.duplicate_titles.length) console.warn('[indexability] duplicate titles:', indexabilityFull.duplicate_titles.length);
  if (indexabilityFull.duplicate_canonicals.length) console.warn('[indexability] duplicate canonicals:', indexabilityFull.duplicate_canonicals.length);
  if (indexabilityFull.noindex_pages.length) console.warn('[indexability] pages with noindex:', indexabilityFull.noindex_pages.length);
  if (indexabilityFull.missing_canonicals.length) console.warn('[indexability] missing canonicals:', indexabilityFull.missing_canonicals.length);

  runPhase9Report({
    semanticGenerated,
    semanticRoutes,
    programmaticGenerated: generated,
    programmaticRoutes: phase8Routes,
    authorityGraph,
    indexabilityReport
  });
  console.log('Phase 9 report: build/phase9-report.json');

  runPhase10Report({
    programmaticGenerated: generated,
    semanticGenerated,
    clothingGenerated,
    brandGenerated,
    measurementGenerated,
    printableGenerated,
    toolGenerated,
    indexability: indexabilityFull
  });
  console.log('Phase 10 report: build/phase10-report.json');

  const { generatePhase11Report, generatePhase12Report } = require('./revenue-engine.js');
  generatePhase11Report({
    programmaticGenerated: generated,
    semanticGenerated,
    clothingGenerated,
    brandGenerated,
    measurementGenerated,
    printableGenerated,
    toolGenerated
  });
  console.log('Phase 11 report: build/phase11-report.json');
  generatePhase12Report({
    programmaticGenerated: generated,
    semanticGenerated,
    clothingGenerated,
    brandGenerated,
    measurementGenerated,
    toolGenerated
  });
  console.log('Phase 12 report: build/phase12-report.json');

  const { runValidator } = require('./adsense-layout-validator.js');
  const validatorResult = runValidator([
    path.join(ROOT, 'programmatic-pages'),
    path.join(ROOT, 'clothing'),
    path.join(ROOT, 'brands'),
    path.join(ROOT, 'measurement'),
    path.join(ROOT, 'semantic'),
    path.join(ROOT, 'tools')
  ]);
  if (validatorResult.warnings.length > 0) {
    console.log('\n--- AdSense Layout Validator (warnings) ---');
    validatorResult.warnings.forEach(w => console.warn('WARN', w));
    console.log(`--- ${validatorResult.warnings.length} warning(s) across ${validatorResult.filesChecked} file(s) ---\n`);
  } else {
    console.log('AdSense layout validator:', validatorResult.filesChecked, 'file(s) checked, no warnings.');
  }

  const hubCount = HUB_PAGE_FILES.filter(f => fs.existsSync(path.join(ROOT, f))).length;
  const totalPages = generated.length + semanticGenerated.length + clothingGenerated.length + brandGenerated.length + measurementGenerated.length + printableGenerated.length + toolGenerated.length + hubCount;
  console.log('Done. Total Phase 10 pages:', totalPages);
  return {
    totalPages,
    programmatic: generated,
    semantic: semanticGenerated,
    clothing: clothingGenerated,
    brand: brandGenerated,
    measurement: measurementGenerated,
    printable: printableGenerated,
    tool: toolGenerated
  };
}

function main() {
  console.log('Programmatic page generator — reading size data...');
  runPhase10Generator();
}

if (typeof require !== 'undefined' && require.main === module) {
  main();
} else {
  module.exports = {
    runPhase10Generator,
    loadJson,
    ensureDir,
    PHASE8_TYPES,
    DATA_DIR,
    ROOT,
    OUTPUT_DIR,
    SEMANTIC_DIR,
    CLOTHING_DIR,
    BRANDS_DIR,
    MEASUREMENT_DIR,
    PRINTABLE_DIR,
    TOOLS_DIR,
    SITEMAPS_DIR,
    BASE_URL,
    MAX_URLS_PER_SITEMAP
  };
}
