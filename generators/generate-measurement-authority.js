/**
 * Measurement Authority Layer — top-funnel pages for how-to and measurement traffic.
 * Generates:
 *   how-to-measure-feet.html
 *   how-to-measure-in-cm.html
 *   foot-width-guide.html
 *   shoe-fit-guide.html
 * Each page includes: diagrams (SVG), step-by-step, printable rulers, conversion examples.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(path.join(__dirname, '..'));
const BASE_URL = 'https://globalsizechart.com';

const NAV = `
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
      </nav>`;

const FOOTER = `
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
        <p>&copy; 2026 GlobalSizeChart.com. All rights reserved.</p>
      </div>
    </div>
  </footer>`;

/** SVG: foot outline with length line (heel to longest toe) */
const SVG_FOOT_LENGTH = `<figure class="measurement-diagram" aria-label="Foot length measurement">
  <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg" width="280" height="140" role="img">
    <title>Where to measure foot length: from heel to longest toe</title>
    <ellipse cx="100" cy="55" rx="42" ry="28" fill="none" stroke="#333" stroke-width="2"/>
    <line x1="58" y1="55" x2="142" y2="55" stroke="#c00" stroke-width="2" stroke-dasharray="4 2"/>
    <circle cx="58" cy="55" r="3" fill="#c00"/>
    <circle cx="142" cy="55" r="3" fill="#c00"/>
    <text x="100" y="88" text-anchor="middle" font-size="11" fill="#333">Heel → Longest toe (measure this in cm)</text>
  </svg>
  <figcaption>Measure from the back of the heel to the tip of your longest toe.</figcaption>
</figure>`;

/** SVG: foot with width line */
const SVG_FOOT_WIDTH = `<figure class="measurement-diagram" aria-label="Foot width measurement">
  <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg" width="280" height="140" role="img">
    <title>Where to measure foot width: widest part of forefoot</title>
    <ellipse cx="100" cy="55" rx="42" ry="28" fill="none" stroke="#333" stroke-width="2"/>
    <line x1="85" y1="35" x2="115" y2="75" stroke="#06c" stroke-width="2" stroke-dasharray="4 2"/>
    <circle cx="85" cy="35" r="3" fill="#06c"/>
    <circle cx="115" cy="75" r="3" fill="#06c"/>
    <text x="100" y="88" text-anchor="middle" font-size="11" fill="#333">Widest part (ball of foot)</text>
  </svg>
  <figcaption>Measure the widest part of your foot, usually across the ball.</figcaption>
</figure>`;

/** SVG: ruler in cm */
const SVG_RULER_CM = `<figure class="measurement-diagram" aria-label="Ruler in centimeters">
  <svg viewBox="0 0 260 50" xmlns="http://www.w3.org/2000/svg" width="320" height="60" role="img">
    <title>Printable ruler reference in centimeters</title>
    <rect x="10" y="15" width="240" height="12" fill="#f5f5f5" stroke="#333" stroke-width="1"/>
    <line x1="10" y1="15" x2="10" y2="27" stroke="#333" stroke-width="1"/>
    <line x1="34" y1="18" x2="34" y2="27" stroke="#333"/>
    <line x1="58" y1="15" x2="58" y2="27" stroke="#333" stroke-width="1"/>
    <line x1="82" y1="18" x2="82" y2="27" stroke="#333"/>
    <line x1="106" y1="15" x2="106" y2="27" stroke="#333" stroke-width="1"/>
    <line x1="130" y1="18" x2="130" y2="27" stroke="#333"/>
    <line x1="154" y1="15" x2="154" y2="27" stroke="#333" stroke-width="1"/>
    <line x1="178" y1="18" x2="178" y2="27" stroke="#333"/>
    <line x1="202" y1="15" x2="202" y2="27" stroke="#333" stroke-width="1"/>
    <line x1="226" y1="18" x2="226" y2="27" stroke="#333"/>
    <line x1="250" y1="15" x2="250" y2="27" stroke="#333" stroke-width="1"/>
    <text x="10" y="42" font-size="10" fill="#333">0</text><text x="58" y="42" font-size="10" fill="#333">2</text>
    <text x="106" y="42" font-size="10" fill="#333">4</text><text x="154" y="42" font-size="10" fill="#333">6</text>
    <text x="202" y="42" font-size="10" fill="#333">8</text><text x="250" y="42" font-size="10" fill="#333">10 cm</text>
  </svg>
  <figcaption>Use a ruler or our printable sheet to read length in cm.</figcaption>
</figure>`;

function breadcrumbList(pageName, slug) {
  return [
    { position: 1, name: 'Home', item: BASE_URL + '/' },
    { position: 2, name: 'Measurement Tools', item: BASE_URL + '/measurement-tools.html' },
    { position: 3, name: pageName, item: BASE_URL + '/' + slug }
  ];
}

function buildPage(config) {
  const { slug, title, description, breadcrumbName, mainContent, howToSteps } = config;
  const canonical = BASE_URL + '/' + slug;
  const bc = breadcrumbList(breadcrumbName, slug);
  const bcJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: bc.map((b, i) => ({
      '@type': 'ListItem',
      position: b.position,
      name: b.name,
      item: b.item
    }))
  });
  const articleJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    url: canonical,
    datePublished: '2024-01-01',
    publisher: { '@id': BASE_URL + '/#organization' }
  });
  const howToJson = howToSteps ? JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    description: description,
    step: howToSteps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text }))
  }) : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="description" content="${description.replace(/"/g, '&quot;')}">
  <link rel="canonical" href="${canonical}">
  <title>${title.replace(/&/g, '&amp;')} | GlobalSizeChart.com</title>
  <link rel="stylesheet" href="styles.css">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","@id":"${BASE_URL}/#organization","name":"GlobalSizeChart.com","url":"${BASE_URL}","logo":"${BASE_URL}/logo.png","email":"contact@globalsizechart.com"}</script>
  <script type="application/ld+json">${bcJson}</script>
  <script type="application/ld+json">${articleJson}</script>
  ${howToJson ? `<script type="application/ld+json">${howToJson}</script>` : ''}
</head>
<body data-intent="measurement_confusion">
  <header>
    <div class="header-content">
      <a href="index.html" class="logo">GlobalSizeChart.com</a>${NAV}
    </div>
  </header>
  <main>
    <div class="container">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> &gt; <a href="measurement-tools.html">Measurement Tools</a> &gt; <span>${breadcrumbName.replace(/&/g, '&amp;')}</span></nav>
${mainContent}
    </div>
  </main>${FOOTER}
  <script src="app.js"></script>
</body>
</html>`;
}

const PAGES = [
  {
    slug: 'how-to-measure-feet.html',
    title: 'How to Measure Your Feet',
    description: 'Step-by-step guide to measuring your feet for shoe size: diagrams, printable ruler, and conversion examples for US, UK, and EU.',
    breadcrumbName: 'How to Measure Your Feet',
    howToSteps: [
      { name: 'Place paper', text: 'Place a piece of paper on a hard floor against a wall.' },
      { name: 'Stand and mark', text: 'Stand with your heel touching the wall. Mark the tip of your longest toe on the paper.' },
      { name: 'Measure length', text: 'Measure from the wall (heel) to the mark in centimeters. Repeat for both feet and use the larger measurement.' },
      { name: 'Convert to size', text: 'Use our shoe size converter with your cm measurement to get US, UK, and EU sizes.' }
    ],
    mainContent: `
      <section class="content-section">
        <h1>How to Measure Your Feet</h1>
        <p class="mb-lg">Measuring your feet correctly is the best way to get an accurate shoe size. Follow the steps below and use our printable sheet and converter to find your size in US, UK, EU, and more.</p>
      </section>
      <section class="content-section">
        <h2>Where to measure</h2>
        <p>Measure <strong>foot length</strong> from the back of your heel to the tip of your longest toe (usually the big toe). Use the diagram below as a reference.</p>
        ${SVG_FOOT_LENGTH}
      </section>
      <section class="content-section">
        <h2>Step-by-step instructions</h2>
        <ol class="steps-list">
          <li>Place a piece of paper on a hard, flat floor with one end against a wall.</li>
          <li>Stand on the paper with your heel touching the wall. Weight should be even.</li>
          <li>Mark the paper at the tip of your longest toe (use a pencil held vertically).</li>
          <li>Measure from the wall to the mark in <strong>centimeters</strong>. Use a ruler or our printable sheet.</li>
          <li>Repeat for the other foot. Use the <strong>larger</strong> measurement for shoe size.</li>
          <li>Convert your measurement using our <a href="shoe-size-converter.html">Shoe Size Converter</a> or <a href="cm-to-us-shoe-size.html">CM to US Shoe Size</a> tool.</li>
        </ol>
      </section>
      <section class="content-section">
        <h2>Printable rulers and sheets</h2>
        <p>Print a foot-measuring sheet at home for accurate results:</p>
        <ul>
          <li><a href="printable/foot-measuring-sheet.html">Foot Measuring Sheet</a> — includes instructions and space to mark and measure</li>
          <li><a href="printable-size-guides.html">Printable Size Guides</a> — foot sheet, clothing chart, and shoe reference</li>
        </ul>
      </section>
      <section class="content-section">
        <h2>Conversion examples</h2>
        <p>After measuring in cm, use these tools for your equivalent size:</p>
        <table class="conversion-examples">
          <thead><tr><th>Foot length (cm)</th><th>Approx. US men</th><th>Approx. EU</th><th>Tool</th></tr></thead>
          <tbody>
            <tr><td>24 cm</td><td>7</td><td>40</td><td><a href="measurement/24-cm-to-us-shoe-size.html">24 cm → US</a></td></tr>
            <tr><td>26 cm</td><td>9</td><td>42</td><td><a href="measurement/26-cm-to-us-shoe-size.html">26 cm → US</a></td></tr>
            <tr><td>28 cm</td><td>11</td><td>44</td><td><a href="measurement/28-cm-to-us-shoe-size.html">28 cm → US</a></td></tr>
          </tbody>
        </table>
        <p>For any measurement, use the <a href="shoe-size-converter.html">Shoe Size Converter</a> or <a href="tools/measurement-assistant.html">Measurement Assistant</a>.</p>
      </section>
      <section class="content-section">
        <h2>Related guides</h2>
        <ul>
          <li><a href="how-to-measure-in-cm.html">How to Measure in CM</a></li>
          <li><a href="foot-width-guide.html">Foot Width Guide</a></li>
          <li><a href="shoe-fit-guide.html">Shoe Fit Guide</a></li>
          <li><a href="measurement-tools.html">Measurement Tools</a></li>
        </ul>
      </section>`
  },
  {
    slug: 'how-to-measure-in-cm.html',
    title: 'How to Measure in CM',
    description: 'How to measure your feet in centimeters for shoe size: step-by-step, diagrams, printable ruler, and cm to US/UK/EU conversion examples.',
    breadcrumbName: 'How to Measure in CM',
    howToSteps: [
      { name: 'Use paper and wall', text: 'Place paper on a hard floor against a wall. Stand with heel to the wall.' },
      { name: 'Mark longest toe', text: 'Mark the tip of your longest toe on the paper.' },
      { name: 'Measure in cm', text: 'Measure from wall to mark in centimeters. Use the larger of both feet.' },
      { name: 'Convert cm to size', text: 'Enter your cm length in our shoe size converter to get US, UK, EU, and other regional sizes.' }
    ],
    mainContent: `
      <section class="content-section">
        <h1>How to Measure in CM</h1>
        <p class="mb-lg">Measuring in centimeters gives you a single, reliable number to convert to any regional shoe size (US, UK, EU, Japan). Follow the steps and use our printable ruler or sheet, then convert with the examples below.</p>
      </section>
      <section class="content-section">
        <h2>Why measure in cm?</h2>
        <p>Foot length in cm is the same everywhere. Shoe size numbers (US 9, EU 42, UK 8) differ by region. If you know your length in cm, you can convert accurately to any system using our <a href="shoe-size-converter.html">Shoe Size Converter</a>.</p>
        ${SVG_RULER_CM}
      </section>
      <section class="content-section">
        <h2>Step-by-step: measure your feet in cm</h2>
        <ol class="steps-list">
          <li>Place a sheet of paper on a hard floor, one short edge against a wall.</li>
          <li>Stand on the paper with your heel firmly against the wall.</li>
          <li>With a pencil held vertically, mark the paper at the tip of your longest toe.</li>
          <li>Step off and measure the distance from the wall to the mark in <strong>centimeters</strong>.</li>
          <li>Repeat for the other foot. Use the <strong>larger</strong> value.</li>
          <li>Convert: use <a href="cm-to-us-shoe-size.html">CM to US Shoe Size</a> or the full <a href="shoe-size-converter.html">Shoe Size Converter</a>.</li>
        </ol>
      </section>
      <section class="content-section">
        <h2>Printable rulers and measuring sheets</h2>
        <p>For accurate cm measurements at home:</p>
        <ul>
          <li><a href="printable/foot-measuring-sheet.html">Foot Measuring Sheet</a> — printable page with instructions and space to measure in cm</li>
          <li><a href="printable-size-guides.html">Printable Size Guides</a> — all printable guides (foot, clothing, shoe reference)</li>
        </ul>
      </section>
      <section class="content-section">
        <h2>Conversion examples (cm to shoe size)</h2>
        <p>Common foot lengths in cm and approximate conversions:</p>
        <table class="conversion-examples">
          <thead><tr><th>Foot length (cm)</th><th>US men</th><th>US women</th><th>UK</th><th>EU</th></tr></thead>
          <tbody>
            <tr><td>24 cm</td><td>7</td><td>8</td><td>6</td><td>40</td></tr>
            <tr><td>25 cm</td><td>8</td><td>9</td><td>7</td><td>41</td></tr>
            <tr><td>26 cm</td><td>9</td><td>10</td><td>8</td><td>42</td></tr>
            <tr><td>27 cm</td><td>10</td><td>11</td><td>9</td><td>43</td></tr>
            <tr><td>28 cm</td><td>11</td><td>12</td><td>10</td><td>44</td></tr>
          </tbody>
        </table>
        <p>These are approximate. For your exact measurement use <a href="shoe-size-converter.html">Shoe Size Converter</a>, <a href="cm-to-us-shoe-size.html">CM to US Shoe Size</a>, or <a href="programmatic-pages/cm-to-eu-shoe-size.html">CM to EU Shoe Size</a>.</p>
      </section>
      <section class="content-section">
        <h2>Related guides</h2>
        <ul>
          <li><a href="how-to-measure-feet.html">How to Measure Your Feet</a></li>
          <li><a href="foot-width-guide.html">Foot Width Guide</a></li>
          <li><a href="shoe-fit-guide.html">Shoe Fit Guide</a></li>
          <li><a href="measurement-tools.html">Measurement Tools</a></li>
        </ul>
      </section>`
  },
  {
    slug: 'foot-width-guide.html',
    title: 'Foot Width Guide',
    description: 'How to measure foot width, narrow vs wide fit, and which shoe brands suit wide or narrow feet. Diagrams and conversion tips.',
    breadcrumbName: 'Foot Width Guide',
    howToSteps: null,
    mainContent: `
      <section class="content-section">
        <h1>Foot Width Guide</h1>
        <p class="mb-lg">Foot width affects fit as much as length. This guide explains where to measure width, how to tell if you need narrow or wide shoes, and how to use our measurement tools for the best fit.</p>
      </section>
      <section class="content-section">
        <h2>Where to measure foot width</h2>
        <p>Measure the <strong>widest part</strong> of your foot, usually across the ball (the joint behind your toes). Use a tape measure or wrap a string and measure against a ruler.</p>
        ${SVG_FOOT_WIDTH}
      </section>
      <section class="content-section">
        <h2>Step-by-step: measure foot width</h2>
        <ol class="steps-list">
          <li>Stand on a piece of paper with weight even on both feet.</li>
          <li>Wrap a flexible tape (or string) around the widest part of your foot—across the ball.</li>
          <li>Mark where the tape overlaps, or measure the string length; read the circumference in cm.</li>
          <li>Alternatively, trace both feet and measure the widest point of each trace in cm. Use the larger value.</li>
          <li>Compare to brand size charts: many list width (e.g. narrow, standard, wide / D, 2E, 4E in US).</li>
        </ol>
      </section>
      <section class="content-section">
        <h2>Narrow vs wide feet</h2>
        <p>If standard shoes feel tight across the ball or you get rubbing, you may need <strong>wide</strong> widths. If shoes feel loose and slip, you may need <strong>narrow</strong>. Many brands offer width options (e.g. New Balance, ASICS). Use our <a href="shoe-fit-guide.html">Shoe Fit Guide</a> for fit tips by style.</p>
      </section>
      <section class="content-section">
        <h2>Printable and conversion tools</h2>
        <ul>
          <li><a href="printable/foot-measuring-sheet.html">Foot Measuring Sheet</a> — measure length; note width on your own if needed</li>
          <li><a href="printable-size-guides.html">Printable Size Guides</a> — all printables</li>
          <li><a href="shoe-size-converter.html">Shoe Size Converter</a> — convert length to size; check brand charts for width</li>
          <li><a href="tools/measurement-assistant.html">Measurement Assistant</a> — foot and body measurements</li>
        </ul>
      </section>
      <section class="content-section">
        <h2>Conversion examples</h2>
        <p>Length (cm) drives numeric size; width is often separate (e.g. US D vs 2E). Use length to get your base size, then choose narrow/wide from the brand:</p>
        <ul>
          <li><a href="cm-to-us-shoe-size.html">CM to US Shoe Size</a> — base size from foot length</li>
          <li><a href="shoe-size-converter.html">Shoe Size Converter</a> — US, UK, EU from cm or size</li>
        </ul>
      </section>
      <section class="content-section">
        <h2>Related guides</h2>
        <ul>
          <li><a href="how-to-measure-feet.html">How to Measure Your Feet</a></li>
          <li><a href="how-to-measure-in-cm.html">How to Measure in CM</a></li>
          <li><a href="shoe-fit-guide.html">Shoe Fit Guide</a></li>
          <li><a href="measurement-tools.html">Measurement Tools</a></li>
        </ul>
      </section>`
  },
  {
    slug: 'shoe-fit-guide.html',
    title: 'Shoe Fit Guide',
    description: 'How to get the best shoe fit: length, width, toe room, and when to size up or down. Links to measurement tools and conversion examples.',
    breadcrumbName: 'Shoe Fit Guide',
    howToSteps: null,
    mainContent: `
      <section class="content-section">
        <h1>Shoe Fit Guide</h1>
        <p class="mb-lg">A good fit depends on both length and width, plus toe room and how the shoe is meant to fit (e.g. snug vs relaxed). This guide covers how to use your measurements and our tools to choose the right size.</p>
      </section>
      <section class="content-section">
        <h2>Length and toe room</h2>
        <p>Your shoe size should allow about <strong>1–1.5 cm (roughly ½ inch)</strong> between your longest toe and the end of the shoe. Measure your foot length in cm and convert to size; that gives you the starting point.</p>
        ${SVG_FOOT_LENGTH}
      </section>
      <section class="content-section">
        <h2>Step-by-step: getting the right fit</h2>
        <ol class="steps-list">
          <li>Measure your foot length in cm using our <a href="how-to-measure-feet.html">How to Measure Your Feet</a> guide.</li>
          <li>Convert to your usual system with the <a href="shoe-size-converter.html">Shoe Size Converter</a> or <a href="cm-to-us-shoe-size.html">CM to US Shoe Size</a>.</li>
          <li>Check the brand’s size chart—some run small or large. When in doubt, size up for comfort.</li>
          <li>Consider width: if you have wide feet, see our <a href="foot-width-guide.html">Foot Width Guide</a> and choose brands that offer wide widths.</li>
          <li>Read fit notes and reviews for the specific model; athletic, dress, and casual shoes fit differently.</li>
        </ol>
      </section>
      <section class="content-section">
        <h2>When to size up or down</h2>
        <p><strong>Size up</strong> if: you’re between sizes, you have wide feet, or the brand runs small. <strong>Size down</strong> only if the brand is known to run large (e.g. some casual sneakers). Use our <a href="shoe-sizing-guides.html">Shoe Sizing Guides</a> and brand guides for fit tips.</p>
      </section>
      <section class="content-section">
        <h2>Printable rulers and measurement tools</h2>
        <ul>
          <li><a href="printable/foot-measuring-sheet.html">Foot Measuring Sheet</a> — printable sheet to measure length</li>
          <li><a href="printable-size-guides.html">Printable Size Guides</a> — foot, clothing, and shoe reference</li>
          <li><a href="tools/measurement-assistant.html">Measurement Assistant</a> — interactive foot and body conversion</li>
        </ul>
      </section>
      <section class="content-section">
        <h2>Conversion examples</h2>
        <p>Convert your measured length or current size to other regions:</p>
        <table class="conversion-examples">
          <thead><tr><th>From</th><th>To</th><th>Tool</th></tr></thead>
          <tbody>
            <tr><td>cm</td><td>US / UK / EU</td><td><a href="shoe-size-converter.html">Shoe Size Converter</a></td></tr>
            <tr><td>US</td><td>EU</td><td><a href="us-to-eu-size.html">US to EU Size</a></td></tr>
            <tr><td>UK</td><td>US</td><td><a href="uk-to-us-size.html">UK to US Size</a></td></tr>
            <tr><td>cm</td><td>US</td><td><a href="cm-to-us-shoe-size.html">CM to US Shoe Size</a></td></tr>
          </tbody>
        </table>
      </section>
      <section class="content-section">
        <h2>Related guides</h2>
        <ul>
          <li><a href="how-to-measure-feet.html">How to Measure Your Feet</a></li>
          <li><a href="how-to-measure-in-cm.html">How to Measure in CM</a></li>
          <li><a href="foot-width-guide.html">Foot Width Guide</a></li>
          <li><a href="measurement-tools.html">Measurement Tools</a></li>
          <li><a href="shoe-sizing-guides.html">Shoe Sizing Guides</a></li>
        </ul>
      </section>`
  }
];

function run() {
  for (const page of PAGES) {
    const html = buildPage(page);
    const outPath = path.join(ROOT, page.slug);
    fs.writeFileSync(outPath, html, 'utf8');
    console.log('Wrote', page.slug);
  }
  console.log('Done. Update measurement-tools.html to add links to these pages.');
}

run();
