/**
 * Phase 13 — Brand Size Database (VERY HIGH IMPACT)
 * Creates authority pages under /brands/: nike-size-guide.html, adidas-size-guide.html, etc.
 *
 * Structure per page:
 *   - Brand sizing differences
 *   - EU vs US discrepancies
 *   - Fit type (narrow/wide)
 *   - Real-world fit tips
 *   - Links to converters
 *   - Internal links to size-pair pages
 *
 * Google LOVES brand queries.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(path.join(__dirname, '..'));
const BRANDS_DIR = path.join(ROOT, 'brands');
const BASE_URL = 'https://globalsizechart.com';

const BRANDS = [
  { slug: 'nike-size-guide', name: 'Nike', focus: 'shoes' },
  { slug: 'adidas-size-guide', name: 'Adidas', focus: 'shoes' },
  { slug: 'zara-size-guide', name: 'Zara', focus: 'clothing' },
  { slug: 'hm-size-guide', name: 'H&M', focus: 'clothing' },
  { slug: 'new-balance-size-guide', name: 'New Balance', focus: 'shoes' },
  { slug: 'puma-size-guide', name: 'Puma', focus: 'shoes' },
  { slug: 'reebok-size-guide', name: 'Reebok', focus: 'shoes' },
  { slug: 'vans-size-guide', name: 'Vans', focus: 'shoes' },
  { slug: 'converse-size-guide', name: 'Converse', focus: 'shoes' },
  { slug: 'asics-size-guide', name: 'ASICS', focus: 'shoes' }
];

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Per-brand copy for the four authority sections. */
function getBrandCopy(brand) {
  const name = brand.name;
  const isShoe = brand.focus === 'shoes';
  const defaults = {
    sizingDifferences: `${name} uses its own fit models and lasts; sizes often differ from generic conversion charts. ${isShoe ? 'Shoes' : 'Clothing'} may run small or large depending on the line.`,
    euVsUs: `EU and US sizing don't align 1:1. ${name} products sold in Europe may be labeled in EU sizes; when buying from the US site you'll see US sizes. Use our converters below to translate between regions.`,
    fitType: `${name} offers regular and sometimes narrow or wide options for ${isShoe ? 'footwear' : 'apparel'}. Check the product page for width (e.g. narrow/wide) and compare to your usual fit.`,
    fitTips: `Measure yourself and compare to ${name}'s official size chart for the specific item. When between sizes, many buyers size up for comfort. Read recent customer reviews for fit notes.`
  };
  const overrides = {
    'Nike': { fitType: 'Nike shoes often run narrow and slightly short; many buyers go half a size up. Width options exist for some running models.' },
    'Adidas': { fitType: 'Adidas tends to run true to size with a medium width; some running and soccer styles run long. Check product-specific fit notes.' },
    'Zara': { sizingDifferences: 'Zara uses European sizing; items often run small compared to US. Dresses and tops may be cut slim.' },
    'H&M': { sizingDifferences: 'H&M uses EU sizing; conversion to US/UK can vary by category. Fast-fashion cuts often run small—consider sizing up.' },
    'New Balance': { fitType: 'New Balance is known for wide width availability (2E, 4E). Standard width runs true to size for many.' },
    'Puma': { fitType: 'Puma shoes typically run true to size with a medium width; some lifestyle models run slightly large.' },
    'Reebok': { fitType: 'Reebok athletic shoes often run true to size; classic styles may run slightly large. Width options available for some lines.' },
    'Vans': { fitType: 'Vans sneakers often run true to size but can feel snug at first; they tend to break in. Consider half size up for a relaxed fit.' },
    'Converse': { fitType: 'Converse Chuck Taylors often run large; many buyers size down half. Newer lines may fit differently—check reviews.' },
    'ASICS': { fitType: 'ASICS running shoes come in multiple widths. Standard (D) runs true to size; consider wide (2E) if you have wider feet.' }
  };
  const o = overrides[name] || {};
  return {
    sizingDifferences: o.sizingDifferences ?? defaults.sizingDifferences,
    euVsUs: o.euVsUs ?? defaults.euVsUs,
    fitType: o.fitType ?? defaults.fitType,
    fitTips: o.fitTips ?? defaults.fitTips
  };
}

/** Shared internal links block: converters + size-pair pages. */
function getConverterAndSizePairLinks() {
  return `
      <section class="content-section">
        <h2>Converters</h2>
        <p>Use our tools to convert between regions and measurements:</p>
        <ul>
          <li><a href="../shoe-size-converter.html">Shoe Size Converter</a></li>
          <li><a href="../clothing-size-converter.html">Clothing Size Converter</a></li>
          <li><a href="../cm-to-us-shoe-size.html">CM to US Shoe Size</a></li>
          <li><a href="../us-to-eu-size.html">US to EU Size</a></li>
          <li><a href="../uk-to-us-size.html">UK to US Size</a></li>
          <li><a href="../measurement-tools.html">Measurement Tools</a></li>
          <li><a href="../shoe-sizing-guides.html">Shoe Sizing Guides</a></li>
        </ul>
      </section>
      <section class="content-section">
        <h2>Size conversion pages</h2>
        <p>Direct links to specific conversion pages:</p>
        <ul>
          <li><a href="../programmatic-pages/eu-to-us-shoe-size.html">EU to US Shoe Size</a></li>
          <li><a href="../programmatic-pages/us-to-eu-shoe-size.html">US to EU Shoe Size</a></li>
          <li><a href="../programmatic-pages/uk-to-us-shoe-size.html">UK to US Shoe Size</a></li>
          <li><a href="../programmatic-pages/us-to-uk-shoe-size.html">US to UK Shoe Size</a></li>
          <li><a href="../measurement/24-cm-to-us-shoe-size.html">24 cm to US Shoe Size</a></li>
          <li><a href="../measurement/26-cm-to-us-shoe-size.html">26 cm to US Shoe Size</a></li>
          <li><a href="../measurement/90cm-chest-to-us-shirt-size.html">90 cm Chest to US Shirt</a></li>
          <li><a href="../clothing/clothing-men-tops-L-EU-to-US.html">Men's EU L to US Tops</a></li>
          <li><a href="../shoe-size-pages.html">Shoe Size Pages Index</a></li>
          <li><a href="../clothing-size-pages.html">Clothing Size Pages</a></li>
        </ul>
      </section>`;
}

function generateBrandSizeGuidePage(brand) {
  const copy = getBrandCopy(brand);
  const title = `${brand.name} Size Guide`;
  const description = `${brand.name} size guide: brand sizing differences, EU vs US discrepancies, fit type (narrow/wide), and real-world fit tips. Convert ${brand.name} sizes with our tools.`;
  const canonicalUrl = `${BASE_URL}/brands/${brand.slug}.html`;

  const breadcrumbItems = [
    { name: 'Home', url: `${BASE_URL}/` },
    { name: 'Brand Size Guides', url: `${BASE_URL}/brand-size-guides.html` },
    { name: title, url: canonicalUrl }
  ];
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url }))
  };
  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: description,
    url: canonicalUrl,
    publisher: { '@id': `${BASE_URL}/#organization` },
    isPartOf: { '@id': `${BASE_URL}/#website` }
  };
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    url: canonicalUrl,
    datePublished: '2024-01-01',
    publisher: { '@id': `${BASE_URL}/#organization` }
  };

  const otherBrands = BRANDS.filter(b => b.slug !== brand.slug).slice(0, 6);

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
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', '@id': BASE_URL + '/#organization', name: 'GlobalSizeChart.com', url: BASE_URL, logo: BASE_URL + '/logo.png', email: 'contact@globalsizechart.com' })}</script>
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', '@id': BASE_URL + '/#website', name: 'GlobalSizeChart.com', url: BASE_URL, publisher: { '@id': BASE_URL + '/#organization' } })}</script>
  <script type="application/ld+json">${JSON.stringify(webPage)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(article)}</script>
</head>
<body data-intent="brand_specific">
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
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a> &gt; <a href="../brand-size-guides.html">Brand Size Guides</a> &gt; <span>${escapeHtml(title)}</span></nav>

      <section class="content-section">
        <h1>${escapeHtml(title)}</h1>
        <p class="mb-lg">${escapeHtml(description)} Use the sections below to understand how ${escapeHtml(brand.name)} sizes compare to standard charts, EU vs US differences, fit width, and real-world fit tips. For exact conversions, use our converters linked at the bottom.</p>
      </section>

      <section class="content-section">
        <h2>Brand sizing differences</h2>
        <p>${escapeHtml(copy.sizingDifferences)}</p>
      </section>

      <section class="content-section">
        <h2>EU vs US discrepancies</h2>
        <p>${escapeHtml(copy.euVsUs)}</p>
      </section>

      <section class="content-section">
        <h2>Fit type (narrow / wide)</h2>
        <p>${escapeHtml(copy.fitType)}</p>
      </section>

      <section class="content-section">
        <h2>Real-world fit tips</h2>
        <p>${escapeHtml(copy.fitTips)}</p>
      </section>
${getConverterAndSizePairLinks()}

      <section class="content-section">
        <h2>Other brand guides</h2>
        <ul>
          ${otherBrands.map(b => `<li><a href="${b.slug}.html">${escapeHtml(b.name)} Size Guide</a></li>`).join('\n          ')}
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
            <li><a href="../shoe-sizing-guides.html">Shoe Sizing Guides</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3>Information</h3>
          <ul>
            <li><a href="../legal/privacy.html">Privacy</a></li>
            <li><a href="../legal/terms.html">Terms</a></li>
            <li><a href="../legal/about.html">About</a></li>
            <li><a href="../legal/contact.html">Contact</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} GlobalSizeChart.com. Always check the brand's official size chart for the product.</p>
      </div>
    </div>
  </footer>
  <script src="../app.js"></script>
</body>
</html>`;

  return html;
}

function run() {
  ensureDir(BRANDS_DIR);
  const generated = [];
  for (const brand of BRANDS) {
    const html = generateBrandSizeGuidePage(brand);
    const filePath = path.join(BRANDS_DIR, brand.slug + '.html');
    fs.writeFileSync(filePath, html, 'utf8');
    generated.push(brand.slug + '.html');
    console.log('  wrote brands/' + brand.slug + '.html');
  }
  return generated;
}

if (require.main === module) {
  run();
}

module.exports = { run, BRANDS, generateBrandSizeGuidePage };
