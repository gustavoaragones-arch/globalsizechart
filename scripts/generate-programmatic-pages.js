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

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const TEMPLATES_DIR = path.join(ROOT, 'programmatic', 'templates');
const OUTPUT_DIR = path.join(ROOT, 'programmatic-pages');
const BASE_URL = 'https://globalsizechart.com';

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

function generatePage(route, template, shoeData, allRoutes) {
  const slug = route.slug;
  const fileName = slug + '.html';
  const canonicalUrl = `${BASE_URL}/programmatic-pages/${fileName}`;

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

    replacements = {
      '{{PAGE_TITLE}}': pageTitle,
      '{{META_DESCRIPTION}}': metaDescription.replace(/"/g, '&quot;'),
      '{{CANONICAL_URL}}': canonicalUrl,
      '{{KEYWORDS}}': keywords,
      '{{H1_TITLE}}': h1Title,
      '{{INTRO_TEXT}}': introText,
      '{{GENDER_OPTIONS}}': buildGenderOptions('men'),
      '{{FROM_REGION_OPTIONS}}': buildFromRegionOptions(route.from_region),
      '{{SIZE_VALUE}}': '',
      '{{CONVERSION_EXPLANATION}}': conversionExplanation,
      '{{FIT_GUIDE_SNIPPET}}': buildFitGuideSnippet(fromLabel, toLabel),
      '{{MEASUREMENT_GUIDE_SNIPPET}}': MEASUREMENT_GUIDE_SNIPPET,
      '{{FAQ_CONTENT}}': buildRegionFaqContent(fromLabel, toLabel),
      '{{FAQ_JSON_LD}}': buildRegionFaqJsonLd(fromLabel, toLabel),
      '{{INTERNAL_LINKS}}': buildInternalLinks(route, allRoutes)
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

    replacements = {
      '{{PAGE_TITLE}}': pageTitle,
      '{{META_DESCRIPTION}}': metaDescription.replace(/"/g, '&quot;'),
      '{{CANONICAL_URL}}': canonicalUrl,
      '{{KEYWORDS}}': keywords,
      '{{H1_TITLE}}': h1Title,
      '{{INTRO_TEXT}}': introText,
      '{{GENDER_OPTIONS}}': buildGenderOptions(gender),
      '{{FROM_REGION_OPTIONS}}': buildFromRegionOptions('US'),
      '{{SIZE_VALUE}}': '',
      '{{CONVERSION_EXPLANATION}}': conversionExplanation,
      '{{FIT_GUIDE_SNIPPET}}': buildFitGuideSnippet('US', 'EU'),
      '{{MEASUREMENT_GUIDE_SNIPPET}}': MEASUREMENT_GUIDE_SNIPPET,
      '{{FAQ_CONTENT}}': buildCategoryFaqContent(genderLabel),
      '{{FAQ_JSON_LD}}': buildCategoryFaqJsonLd(genderLabel),
      '{{INTERNAL_LINKS}}': buildInternalLinks(route, allRoutes)
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

    replacements = {
      '{{PAGE_TITLE}}': pageTitle,
      '{{META_DESCRIPTION}}': metaDescription.replace(/"/g, '&quot;'),
      '{{CANONICAL_URL}}': canonicalUrl,
      '{{KEYWORDS}}': keywords,
      '{{H1_TITLE}}': h1Title,
      '{{INTRO_TEXT}}': introText,
      '{{GENDER_OPTIONS}}': buildGenderOptions(route.gender),
      '{{FROM_REGION_OPTIONS}}': buildFromRegionOptions(route.from_region),
      '{{SIZE_VALUE}}': String(route.size),
      '{{CONVERSION_EXPLANATION}}': buildConversionExplanation(route, toSize, fromLabel, toLabel, genderLabel),
      '{{FIT_GUIDE_SNIPPET}}': buildFitGuideSnippet(fromLabel, toLabel),
      '{{MEASUREMENT_GUIDE_SNIPPET}}': MEASUREMENT_GUIDE_SNIPPET,
      '{{FAQ_CONTENT}}': buildFaqContent(route, toSize, fromLabel, toLabel),
      '{{FAQ_JSON_LD}}': buildFaqJsonLd(route, toSize, fromLabel, toLabel),
      '{{INTERNAL_LINKS}}': buildInternalLinks(route, allRoutes)
    };
  }

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

// Static URLs included in every sitemap rebuild (no programmatic-pages here)
const SITEMAP_STATIC_URLS = [
  { loc: `${BASE_URL}/`, lastmod: '2024-01-01', changefreq: 'weekly', priority: '1.0' },
  { loc: `${BASE_URL}/shoe-size-converter.html`, lastmod: '2024-01-01', changefreq: 'weekly', priority: '0.9' },
  { loc: `${BASE_URL}/clothing-size-converter.html`, lastmod: '2024-01-01', changefreq: 'weekly', priority: '0.9' },
  { loc: `${BASE_URL}/us-to-eu-size.html`, lastmod: '2024-01-01', changefreq: 'monthly', priority: '0.8' },
  { loc: `${BASE_URL}/uk-to-us-size.html`, lastmod: '2024-01-01', changefreq: 'monthly', priority: '0.8' },
  { loc: `${BASE_URL}/cm-to-us-shoe-size.html`, lastmod: '2024-01-01', changefreq: 'monthly', priority: '0.8' },
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

function rebuildSitemap(generatedFiles) {
  const today = new Date().toISOString().slice(0, 10);
  const programmaticEntries = generatedFiles.map(f => ({
    loc: `${BASE_URL}/programmatic-pages/${f}`,
    lastmod: today,
    changefreq: 'monthly',
    priority: '0.7'
  }));

  const allEntries = [
    ...SITEMAP_STATIC_URLS.map(urlToSitemapEntry),
    ...programmaticEntries.map(urlToSitemapEntry)
  ].join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries}
</urlset>
`;

  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf8');
}

function main() {
  console.log('Programmatic page generator — reading size data...');

  const shoeData = loadJson(path.join(DATA_DIR, 'shoe_sizes.json'));
  const routes = loadJson(path.join(DATA_DIR, 'programmatic_routes.json'));
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

  rebuildSitemap(generated);
  console.log('Rebuilt sitemap.xml: static URLs +', generated.length, 'programmatic URLs.');
  console.log('Done. Generated', generated.length, 'pages in programmatic-pages/');
}

main();
