#!/usr/bin/env node
/**
 * GlobalSizeChart.com - Programmatic SEO Page Generator
 * Reads programmatic_routes.json, injects content into conversion-template.html,
 * outputs static HTML to programmatic-pages/ and updates sitemap.xml.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const TEMPLATES_DIR = path.join(ROOT, 'programmatic', 'templates');
const OUTPUT_DIR = path.join(ROOT, 'programmatic-pages');
const BASE_URL = 'https://globalsizechart.com';

const structuralModules = require('./programmatic-structural-modules.js');
const internalLinkBuilder = require('../utils/internalLinkBuilder.js');
const ORGANIZATION_ID = `${BASE_URL}/#organization`;
const WEBSITE_ID = `${BASE_URL}/#website`;

function getOrganizationSchema() {
  return { '@context': 'https://schema.org', '@type': 'Organization', '@id': ORGANIZATION_ID, name: 'GlobalSizeChart.com', url: BASE_URL, logo: `${BASE_URL}/logo.png`, email: 'contact@globalsizechart.com' };
}
function getWebSiteSchema() {
  return { '@context': 'https://schema.org', '@type': 'WebSite', '@id': WEBSITE_ID, name: 'GlobalSizeChart.com', url: BASE_URL, publisher: { '@id': ORGANIZATION_ID } };
}
function getWebPageSchema(opts) {
  return { '@context': 'https://schema.org', '@type': 'WebPage', name: opts.name || 'GlobalSizeChart.com', description: opts.description, url: opts.url || BASE_URL, publisher: { '@id': ORGANIZATION_ID }, isPartOf: { '@id': WEBSITE_ID } };
}
function getBreadcrumbJsonLd(items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url })) };
}

const REGION_LABELS = {
  US: 'United States (US)',
  UK: 'United Kingdom (UK)',
  EU: 'European Union (EU)',
  JP: 'Japan (JP)',
  CN: 'China (CN)',
  CM: 'Centimeters (CM)'
};

const REGION_NAMES = {
  US: 'US',
  UK: 'UK',
  EU: 'EU',
  JP: 'Japan',
  CN: 'China',
  CM: 'CM'
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

function buildConversionExplanation(route, toSize, fromLabel, toLabel, genderLabel) {
  const size = route.size;
  if (toSize !== null && toSize !== undefined) {
    return `${fromLabel} size ${size} converts approximately to ${toLabel} ${genderLabel} size ${toSize}. Use the converter above to see all regional equivalents and confirm your fit.`;
  }
  return `${fromLabel} size ${size} can be converted to ${toLabel} sizes using the tool above. Sizing varies by brand; always check the brand's size chart when possible.`;
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
  const a3 = 'No. Shoe sizes vary by country and brand. Conversion charts give approximate equivalents; always check the brand\'s size chart when buying.';

  const q4 = 'Should I size up or down?';
  const a4 = 'It depends on the brand. European and Asian brands often run smaller. If between sizes or buying athletic shoes, consider sizing up. Check reviews and the brand\'s fit guide.';

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

function buildInternalLinks(route, allRoutes, currentFile) {
  const from = route.from_region;
  const to = route.to_region;
  const size = route.size;
  const cur = currentFile || 'programmatic-pages/' + route.slug + '.html';
  const href = (targetPath) => internalLinkBuilder.href(cur, targetPath);

  const links = [];

  // Neighboring sizes same from/to (same directory: programmatic-pages/)
  const samePair = allRoutes.filter(r => r.from_region === from && r.to_region === to && r.gender === route.gender);
  samePair.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
  const idx = samePair.findIndex(r => String(r.size) === String(size));
  if (idx >= 0) {
    if (idx > 0) links.push({ href: href('programmatic-pages/' + samePair[idx - 1].slug + '.html'), text: `${getFromRegionLabel(from)} ${samePair[idx - 1].size} to ${getFromRegionLabel(to)}` });
    if (idx < samePair.length - 1) links.push({ href: href('programmatic-pages/' + samePair[idx + 1].slug + '.html'), text: `${getFromRegionLabel(from)} ${samePair[idx + 1].size} to ${getFromRegionLabel(to)}` });
  }

  // Main converters (root-relative targets)
  links.push({ href: href('shoe-size-converter.html'), text: 'Shoe Size Converter' });
  links.push({ href: href('clothing-size-converter.html'), text: 'Clothing Size Converter' });
  links.push({ href: href('us-to-eu-size.html'), text: 'US to EU Size' });
  links.push({ href: href('index.html'), text: 'Global Size Chart Home' });

  return links.map(l => `<li><a href="${l.href}">${l.text}</a></li>`).join('\n          ');
}

const MEASUREMENT_SNIPPET = `
        <p>Measure your foot length in centimeters for the most accurate conversion:</p>
        <ol>
          <li>Place a piece of paper against a wall on a hard floor.</li>
          <li>Stand with your heel touching the wall and mark the tip of your longest toe.</li>
          <li>Measure from the wall to the mark in centimeters.</li>
          <li>Repeat for both feet and use the larger measurement.</li>
        </ol>
        <p>Foot length in CM is the most reliable reference across all regional sizing systems.</p>`;

function generatePage(route, template, shoeData, allRoutes) {
  const fromLabel = getFromRegionLabel(route.from_region);
  const toLabel = getFromRegionLabel(route.to_region);
  const genderLabel = getGenderLabel(route.gender);

  const row = findShoeConversion(shoeData, route.gender, route.from_region, route.size);
  const toSize = row ? getTargetSize(row, route.to_region) : null;

  const slug = route.slug;
  const fileName = slug + '.html';
  const canonicalUrl = `${BASE_URL}/programmatic-pages/${fileName}`;

  const h1Title = `${fromLabel} Size ${route.size} to ${toLabel} Shoe Size Converter`;
  const pageTitle = `${fromLabel} ${route.size} to ${toLabel} Shoe Size Conversion Chart & Converter | GlobalSizeChart.com`;
  const introText = `Convert ${fromLabel} shoe size ${route.size} to ${toLabel} sizes instantly. Get accurate ${genderLabel} conversions and see equivalent sizes in all regions.`;
  const metaDescription = `Convert ${fromLabel} ${route.size} to ${toLabel} shoe size instantly. ${toSize != null ? `Approximate equivalent: ${toLabel} ${toSize}. ` : ''}Includes fit tips and measurement guide.`;
  const keywords = `${fromLabel} ${route.size} to ${toLabel}, ${fromLabel} to ${toLabel} shoe size, convert ${fromLabel} ${route.size}, shoe size conversion`;

  const breadcrumb = structuralModules.buildProgrammaticBreadcrumb(route, route.slug + '.html', BASE_URL);
  const replacements = {
    '{{PAGE_TITLE}}': pageTitle,
    '{{META_DESCRIPTION}}': metaDescription.replace(/"/g, '&quot;'),
    '{{CANONICAL_URL}}': canonicalUrl,
    '{{KEYWORDS}}': keywords,
    '{{H1_TITLE}}': h1Title,
    '{{INTRO_TEXT}}': introText,
    '{{ORGANIZATION_JSON_LD}}': JSON.stringify(getOrganizationSchema()),
    '{{WEBSITE_JSON_LD}}': JSON.stringify(getWebSiteSchema()),
    '{{WEBPAGE_JSON_LD}}': JSON.stringify(getWebPageSchema({ name: pageTitle, description: metaDescription, url: canonicalUrl })),
    '{{BREADCRUMB_JSON_LD}}': breadcrumb.jsonLd,
    '{{BREADCRUMB_HTML}}': breadcrumb.html,
    '{{GENDER_OPTIONS}}': buildGenderOptions(route.gender),
    '{{FROM_REGION_OPTIONS}}': buildFromRegionOptions(route.from_region),
    '{{SIZE_VALUE}}': String(route.size),
    '{{CONVERSION_EXPLANATION}}': buildConversionExplanation(route, toSize, fromLabel, toLabel, genderLabel),
    '{{MEASUREMENT_GUIDE_SNIPPET}}': MEASUREMENT_SNIPPET,
    '{{FAQ_CONTENT}}': buildFaqContent(route, toSize, fromLabel, toLabel),
    '{{FAQ_JSON_LD}}': buildFaqJsonLd(route, toSize, fromLabel, toLabel),
    '{{ENHANCED_SERP_SCHEMAS}}': '',
    '{{SIZING_KNOWLEDGE_SECTION}}': '',
    '{{RELATED_SIZE_GRID}}': structuralModules.getRelatedSizeGridHtml(route, allRoutes, getFromRegionLabel, 20),
    '{{INTERNAL_LINK_GRAPH}}': buildInternalLinks(route, allRoutes, 'programmatic-pages/' + fileName),
    '{{REGION_CONVERTERS_SECTION}}': structuralModules.getRegionConvertersSectionHtml('programmatic-pages/' + fileName),
    '{{AUTHORITY_LINKS_SECTION}}': structuralModules.getAuthorityLinksSectionHtml('programmatic-pages/' + fileName),
    '{{CRAWL_DISCOVERY_LINKS}}': '',
    '{{DISCOVERY_GRID_LINKS}}': '',
    '{{INTERNAL_LINKS}}': buildInternalLinks(route, allRoutes, 'programmatic-pages/' + fileName),
    '{{DATA_INTENT}}': '',
    '{{CONVERSION_LOOP_MODULES}}': '',
    '{{BEHAVIORAL_RECOMMENDATIONS}}': '',
    '{{HIGH_RPM_CONTENT_MODULES}}': '',
    '{{SESSION_DEPTH_MODULES}}': '',
    '{{COMMERCIAL_CONTENT_BLOCKS}}': ''
  };

  let html = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    html = html.split(placeholder).join(value);
  }
  return { html, fileName };
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function updateSitemap(generatedFiles) {
  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  let xml = fs.readFileSync(sitemapPath, 'utf8');
  // Remove existing programmatic-pages URLs so re-runs don't duplicate
  xml = xml.replace(/\s*<url>\s*<loc>https:\/\/[^<]*\/programmatic-pages\/[^<]+<\/loc>[\s\S]*?<\/url>/g, '');
  const today = new Date().toISOString().slice(0, 10);
  const urlEntries = generatedFiles.map(f => {
    const loc = `${BASE_URL}/programmatic-pages/${f}`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('\n');

  const insertBefore = '</urlset>';
  if (xml.includes(insertBefore)) {
    xml = xml.replace(insertBefore, urlEntries + '\n' + insertBefore);
  }
  fs.writeFileSync(sitemapPath, xml, 'utf8');
}

function main() {
  console.log('Loading data...');
  const routes = loadJson(path.join(DATA_DIR, 'programmatic_routes.json'));
  const shoeData = loadJson(path.join(DATA_DIR, 'shoe_sizes.json'));
  const template = fs.readFileSync(path.join(TEMPLATES_DIR, 'conversion-template.html'), 'utf8');

  ensureDir(OUTPUT_DIR);

  const generated = [];
  for (const route of routes) {
    const { html, fileName } = generatePage(route, template, shoeData, routes);
    const outPath = path.join(OUTPUT_DIR, fileName);
    fs.writeFileSync(outPath, html, 'utf8');
    generated.push(fileName);
    console.log('  wrote', fileName);
  }

  updateSitemap(generated);
  console.log('Updated sitemap.xml with', generated.length, 'programmatic URLs.');
  console.log('Done. Generated', generated.length, 'pages in programmatic-pages/');
}

main();
