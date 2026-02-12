/**
 * Authority Hub Pages — shoe-size-guides, clothing-size-guides, brand-sizing-guides, measurement-guides.
 * Each hub links: converters, programmatic pages, articles, tools, printables.
 * Run: node generators/generate-authority-hubs.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(path.join(__dirname, '..'));
const BASE_URL = 'https://globalsizechart.com';

const SHARED_NAV = `
        <ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="shoe-size-converter.html">Shoe Converter</a></li>
          <li><a href="clothing-size-converter.html">Clothing Converter</a></li>
          <li><a href="measurement-tools.html">Measurement Tools</a></li>
          <li><a href="shoe-sizing-guides.html">Guides</a></li>
          <li><a href="legal/about.html">About</a></li>
          <li><a href="legal/contact.html">Contact</a></li>
          <li><a href="legal/privacy.html">Privacy</a></li>
        </ul>`;

const SHARED_FOOTER = `
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
            <li><a href="legal/contact.html">Contact</a></li>
            <li><a href="legal/about.html">About</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom"><p>&copy; 2026 GlobalSizeChart.com. All rights reserved.</p></div>
    </div>
  </footer>`;

const AUTHORITY_HUBS_BLOCK = `
      <section class="content-section">
        <h2>Authority hub pages</h2>
        <p>These four hubs organize the same resources by theme: shoe sizing, clothing sizing, brand-specific guides, and measurement. Use the one that matches your task, or jump between them for converters, articles, tools, and printables.</p>
        <ul>
          <li><a href="shoe-size-guides.html">Shoe Size Guides</a></li>
          <li><a href="clothing-size-guides.html">Clothing Size Guides</a></li>
          <li><a href="brand-sizing-guides.html">Brand Sizing Guides</a></li>
          <li><a href="measurement-guides.html">Measurement Guides</a></li>
        </ul>
      </section>`;

/** 800–1200 words of structured content per hub (intro + H2 sections). Inserted above link blocks. */
const BODY_CONTENT = {
  shoe: `
      <section class="content-section">
        <h1>Shoe Size Guides</h1>
        <p>Understanding shoe sizes across regions is the first step to ordering the right fit. US, UK, EU, Japan, and China each use different numbering systems and reference lengths, so a "9" in one country is not the same as a "9" in another. Shopping across borders or buying from brands that label in a single region makes conversion essential—and getting it wrong means returns, discomfort, or wasted money. This hub brings together everything you need: an explanation of how international shoe sizing works, why sizes differ between regions and brands, how width systems fit in, and when to rely on a conversion chart versus measuring your feet. Below the guide you'll find converters for quick lookups, programmatic conversion pages for specific size pairs, in-depth articles on measurement and regional differences, interactive calculators, and printable charts. Use the content above to build your understanding; use the links below to convert, measure, and print.</p>
      </section>
      <section class="content-section">
        <h2>How International Shoe Sizing Systems Work</h2>
        <p>Most systems are built on a standard foot length, usually in centimeters or a regional last. The <strong>US</strong> system uses different scales for men, women, and kids: men's sizes start around 1 and step in half sizes; women's run about 1.5–2 sizes higher for the same length. <strong>UK</strong> sizes are typically one size down from US men's (e.g. US 9 ≈ UK 8). <strong>EU</strong> (Paris point) sizes use a formula based on length in cm and produce numbers in the mid-30s to mid-40s for adults. <strong>Japan</strong> and <strong>China</strong> often use cm-based or EU-like numbering. Because there is no single global standard, conversion charts and tools map one system to another using agreed reference lengths; small variations exist between chart publishers and brands. Kids' sizes follow yet another scale and transition into adult sizing around the early teens.</p>
      </section>
      <section class="content-section">
        <h2>Why Sizes Differ Between Regions</h2>
        <p>Historical standards, last shapes, and target markets all contribute. The UK and US diverged early; EU adopted the Paris point. Manufacturing hubs (e.g. Asia) may label in EU or local cm. Brands also "grade" sizes differently—some add more toe room, others build snugger. So even after converting, a US 9 in one brand can fit like a US 9.5 in another. Knowing your <em>foot length in cm</em> gives you a stable reference: you can compare any size table or chart to that number and see which regional size corresponds, then adjust for brand if needed.</p>
      </section>
      <section class="content-section">
        <h2>Width Systems Explained</h2>
        <p>Length is only half the story. Width (narrow, standard, wide) is expressed differently by region. In the US, men's standard width is often "D" and women's "B," with "2E" or "EE" for wide and "B" or "C" for narrow in men's. UK and EU sometimes use single letters or terms like "narrow" and "wide" without a universal code. Not every style comes in multiple widths; athletic and work brands (e.g. New Balance, ASICS) often offer more width options. If you need wide or narrow, use our <a href="foot-width-calculator.html">foot width calculator</a> and then filter by width when shopping.</p>
      </section>
      <section class="content-section">
        <h2>Common Sizing Mistakes</h2>
        <p>Assuming US and EU are the same number, guessing without measuring, or using the wrong gender/category (men's vs women's vs kids) leads to wrong sizes. Measuring in the morning when feet are smaller, or using a too-short ruler, also causes errors. Many people forget to measure both feet and use the larger; others ignore width and blame "bad sizing" when the length was right but the shoe was too narrow. Best practice: measure both feet in the evening, use the larger length, and convert with a chart or tool that asks for gender and region. For kids, use a kids-specific chart or calculator because the scale is different from adult sizes.</p>
      </section>
      <section class="content-section">
        <h2>When to Use a Conversion Chart vs Measurement</h2>
        <p>Use a <strong>conversion chart or converter</strong> when you already know your size in one region (e.g. US 9) and need the equivalent in another (e.g. EU 42). Use <strong>measurement</strong> when you don't know your size, your feet have changed, or you're buying from a brand that only lists cm. Measuring gives you a number (e.g. 26 cm) that you can plug into any converter or chart; it's the most reliable baseline. Below we link to both: converters and programmatic conversion pages for quick lookups, and measurement guides, calculators, and printables for when you start from foot length.</p>
      </section>`,
  clothing: `
      <section class="content-section">
        <h1>Clothing Size Guides</h1>
        <p>Clothing sizing is even less standardized than shoe sizing. A US "Medium" or EU "38" can mean different chest and waist measurements depending on the country, brand, and garment type. Letter sizes (XS–XXL) and numeric sizes (32, 34, 36…) do not align across markets, and many brands grade their own blocks, so a size that fits in one label may be too tight or too loose in another. This hub explains how international clothing sizing works, why sizes differ between regions and brands, common fit problems and how to avoid them, and when to use a size chart or body measurement instead of guessing. Below the guide we link to converters, programmatic conversion pages, articles on fit and brands that run small or large, measurement tools, and printable charts—so you can establish your baseline size and then confirm against the retailer's chart for the specific item.</p>
      </section>
      <section class="content-section">
        <h2>How International Clothing Sizing Works</h2>
        <p><strong>US</strong> and <strong>UK</strong> often use letter sizes (XS–XXL) for tops and numeric waist/inseam for pants; <strong>EU</strong> uses numbers (32–50+ for pants, 34–50 for tops) that don't match US numbers 1:1. Asian markets may use height-based sizing (e.g. 160, 170) or EU-style numbers. Dresses and outerwear have their own progressions. There is no single global standard: each region (and often each brand) defines S, M, L or 36, 38, 40 by different body measurements and ease. Conversion charts map approximate equivalents, but fit still varies by cut and brand.</p>
      </section>
      <section class="content-section">
        <h2>Why Sizes Differ Between Regions and Brands</h2>
        <p>Historical standards, fit preferences (slim vs relaxed), and target demographics all play a role. European cuts often run slimmer than US; Asian sizing frequently runs smaller. Fast fashion and private-label brands may use their own grading. "Vanity sizing"—labeling garments with smaller numbers than the actual measurements—is common in some markets. So a US 8 in one brand can fit like a US 6 in another. The only reliable approach is to compare your <em>body measurements</em> (chest, waist, hips, inseam) to the brand's size chart for the specific item.</p>
      </section>
      <section class="content-section">
        <h2>Common Clothing Fit Problems</h2>
        <p>Shoulders too tight, waist too loose, sleeves too short, or hips too narrow are often due to buying by letter or number without checking the chart. Men's and women's sizing use different scales; unisex or "one size" items may not fit everyone. Fabric stretch and cut (regular, slim, relaxed) also change fit. Measuring yourself and using a <a href="clothing-size-converter.html">clothing size converter</a> or the brand's chart reduces guesswork. When in doubt, size up for comfort or order two sizes if returns are easy.</p>
      </section>
      <section class="content-section">
        <h2>When to Use a Size Chart vs Body Measurement</h2>
        <p>Use a <strong>size chart or converter</strong> when you know your size in one region (e.g. US M) and need the equivalent in another (e.g. EU 40), or when you want a starting point. Use <strong>body measurement</strong> when the brand publishes measurements in cm or inches for each size—then compare your chest, waist, and hips (and inseam for pants) to the size that best matches. For the best accuracy, always measure yourself with a soft tape and use the brand's chart for the specific product. Below we link to converters, measurement tools, and printable charts so you can convert and measure with confidence.</p>
      </section>`,
  brand: `
      <section class="content-section">
        <h1>Brand Sizing Guides</h1>
        <p>Even after you know your "standard" size in US, UK, or EU, brands often deviate. Nike may run narrow; Zara may run small; Levi's jeans have their own waist and length logic. Generic conversion charts give you a starting point, but they cannot account for each brand's fit model, last, or grading. This hub ties together brand-specific guides, conversion tools, and fit strategy: how to use conversion charts and your own measurements together with a brand's size chart, when to size up or down, and when to trust the brand chart over a converter. Below you'll find converters to get your baseline size, programmatic conversion pages for regional pairs, articles on brands that run small or large and common sizing problems, calculators and the Measurement Assistant, printables, and direct links to our dedicated pages for Nike, Adidas, Zara, H&M, New Balance, and others.</p>
      </section>
      <section class="content-section">
        <h2>How Brand Sizing Differs From Standard Charts</h2>
        <p>Standard conversion charts assume an "average" last or block. Brands use their own fit models, target markets, and grading. A brand may design for a narrower heel, a roomier toe box, or a longer inseam. So your converted "US 9" or "EU 42" is a starting point—not a guarantee. Brand size guides and our dedicated brand pages describe whether that brand tends to run true to size, small, or large, and in which categories (e.g. running vs lifestyle). Always cross-check the brand's official size chart for the product you're buying.</p>
      </section>
      <section class="content-section">
        <h2>Why Some Brands Run Small or Large</h2>
        <p>Design intent, manufacturing tolerances, and market expectations all play a role. Athletic brands may build in more room for movement; fashion brands may cut slimmer. Asian-market or fast-fashion lines often run smaller than US/EU equivalents. "Running small" usually means you need to size up from your usual number; "running large" means you might size down. Our articles on <a href="brands-that-run-small.html">brands that run small</a> and <a href="brands-that-run-large.html">brands that run large</a> summarize common patterns. Combined with your measured size and the brand's chart, you can make a better choice.</p>
      </section>
      <section class="content-section">
        <h2>Using Conversion With Brand Charts</h2>
        <p>Step 1: Get your baseline size from our <a href="shoe-size-converter.html">shoe</a> or <a href="clothing-size-converter.html">clothing</a> converter (using your measurement or current size). Step 2: Open the brand's size guide for the specific item. Step 3: Compare the chart's measurements (e.g. foot length in cm, chest in cm) to your numbers. If the brand runs small, consider the next size up; if it runs large, you may be able to go down. Step 4: When possible, read recent reviews for fit notes. This hub links to both generic converters and our brand-specific guides so you can do both in one place.</p>
      </section>
      <section class="content-section">
        <h2>When to Trust the Brand Chart Over a Converter</h2>
        <p>Converters are best for translating between regions (e.g. "What is US 9 in EU?"). For final purchase decisions, the brand's own chart is authoritative: it reflects how that product was graded. If the brand lists foot length in cm or body measurements per size, use those. If the brand only shows US or EU sizes, use our converter to get the equivalent, then apply any "runs small/large" guidance from our brand guides or reviews. Below we list all brand guides plus converters, articles, tools, and printables in one place.</p>
      </section>`,
  measurement: `
      <section class="content-section">
        <h1>Measurement Guides</h1>
        <p>Accurate measurement is the foundation of correct sizing. Whether you're converting foot length to shoe size or chest and waist to clothing size, starting with a reliable number in centimeters (or inches) removes guesswork and reduces returns. Size labels (US 9, EU 42, M, L) are derived from length or girth; if you don't know your current size in a given region, or if you're buying from a brand that only publishes cm, measuring gives you a universal input. This hub explains why measurement comes first, how foot and body measurements map to sizes, when to use cm versus inches, common measurement mistakes and how to avoid them, and when to re-measure versus relying on a converter. Below we link to converters, programmatic conversion pages, how-to articles, interactive calculators, and printable rulers and sheets—so you can measure once and use the result across any chart or tool.</p>
      </section>
      <section class="content-section">
        <h2>Why Measurement Comes First</h2>
        <p>Size numbers (US 9, EU 42) are derived from length or girth. If you don't know your current size in a given region, or if you're buying from a brand that only publishes cm, measuring gives you a universal input. Foot length in cm maps to men's, women's, and kids' shoe sizes across regions; chest, waist, and hip in cm map to clothing sizes. Once you have those numbers, you can use any chart or converter. Measuring also catches changes: feet and body can change with age, weight, or activity, so re-measuring periodically improves accuracy.</p>
      </section>
      <section class="content-section">
        <h2>How Foot and Body Measurements Map to Sizes</h2>
        <p><strong>Foot length</strong> (heel to longest toe, in cm) is the standard input for shoe size conversion. Charts and formulas assign a US, UK, EU, or Japan size to each length (or half-length). <strong>Body measurements</strong>—chest, waist, hips, sometimes inseam and sleeve—are compared to a size chart's ranges to pick a clothing size. There is no single "official" mapping; different publishers and brands use slightly different tables. Our tools and charts use widely accepted reference data; for critical fits, compare your measurement to the brand's own chart when available.</p>
      </section>
      <section class="content-section">
        <h2>When to Measure in CM vs Inches</h2>
        <p>Most international size charts and converters use <strong>centimeters</strong>. If you measure in inches, convert (1 inch = 2.54 cm) or use a tool that accepts both. Our <a href="tools/measurement-assistant.html">Measurement Assistant</a> and <a href="foot-measurement-calculator.html">Foot Measurement Calculator</a> support cm and inches. For consistency and to match EU/Asian charts, measuring in cm is simplest. Printable rulers and foot-measuring sheets on this site are in cm; print at 100% scale for accuracy.</p>
      </section>
      <section class="content-section">
        <h2>Avoiding Common Measurement Mistakes</h2>
        <p>Measure feet in the evening when they're slightly larger; stand with weight even; use the larger foot. For clothing, keep the tape snug but not compressing, and parallel to the floor. Don't assume an old size is still correct. Using a stretched or inaccurate ruler, or measuring over thick clothing, skews results. Our <a href="how-to-measure-feet.html">How to Measure Your Feet</a> and printable sheets walk you through step-by-step. Once you have a good number, store it and use it with any converter or chart.</p>
      </section>
      <section class="content-section">
        <h2>When to Use a Converter vs Measuring Again</h2>
        <p>Use a <strong>converter</strong> when you already have a size in one region or a measurement in cm and need the equivalent size elsewhere. Use <strong>measurement</strong> when you've never sized yourself, your size may have changed, or you're switching to a system that relies on cm. If you're unsure, measure: it takes a few minutes and gives you a reliable baseline. Below we list converters, programmatic conversion pages, how-to guides, interactive calculators, and printables so you can measure once and convert with confidence.</p>
      </section>`
};

const HUBS = [
  {
    slug: 'shoe-size-guides.html',
    title: 'Shoe Size Guides',
    bodyKey: 'shoe',
    description: 'Central hub for shoe sizing: converters, programmatic conversion pages, how-to articles, calculators, and printable charts. US, UK, EU, Japan, CM.',
    breadcrumb: 'Shoe Size Guides',
    faq: [
      { q: 'Is US shoe size the same as EU?', a: 'No. US and EU use different scales. For example, a US men\'s 9 is roughly equivalent to EU 42–42.5. The numbers don\'t match 1:1, so always use a conversion chart or converter and select the correct gender (men\'s, women\'s, or kids).' },
      { q: 'Should I measure my feet in cm or inches for shoe size?', a: 'Measuring in centimeters is recommended because most international size charts and our converters use cm. If you measure in inches, multiply by 2.54 to get cm, or use a tool that accepts both. Measure both feet in the evening and use the larger length.' },
      { q: 'Why do I get different shoe sizes for men vs women for the same foot length?', a: 'US and UK use separate scales for men and women. The same foot length (e.g. 26 cm) corresponds to a smaller number in men\'s (e.g. US 9) and a larger number in women\'s (e.g. US 10) because the scales start at different points. Always choose the category that matches the shoes you\'re buying.' },
      { q: 'What is the difference between shoe width letters (D, 2E, etc.)?', a: 'In the US, D is standard width for men and B for women. 2E or EE is wide; B or C can be narrow for men. Not all brands offer multiple widths. Use our foot width calculator with your length and ball circumference to see if you need narrow, standard, or wide, then filter by width when shopping.' },
      { q: 'Can I use the same shoe size for all brands?', a: 'Not always. Brands grade sizes differently—some run small or large. Your converted size is a starting point. Check our brand sizing guides and the brand\'s own size chart for the product. When in doubt, size up for comfort or order two sizes if returns are easy.' }
    ],
    sections: {
      converters: {
        title: 'Converters',
        intro: 'Use these tools when you know a size in one region and need the equivalent in another, or when you have a foot length in cm and want US, UK, EU, or Japan sizes in one step. The main shoe size converter accepts any input; the CM and regional converters are quick lookups for common pairs.',
        links: [
          { href: 'shoe-size-converter.html', text: 'Shoe Size Converter' },
          { href: 'cm-to-us-shoe-size.html', text: 'CM to US Shoe Size' },
          { href: 'us-to-eu-size.html', text: 'US to EU Size' },
          { href: 'uk-to-us-size.html', text: 'UK to US Size' }
        ]
      },
      programmatic: {
        title: 'Programmatic pages',
        intro: 'We publish single-size conversion pages (e.g. EU 42 to US, US 9 to UK, 26 cm to US) for crawlability and direct linking. The programmatic index lists all of them; the shoe-size and men\'s/women\'s/kids indices group by category. Use these when you need a dedicated URL for one conversion.',
        links: [
          { href: 'programmatic-index.html', text: 'Programmatic Index (all conversion pages)' },
          { href: 'shoe-size-pages.html', text: 'Shoe Size Pages Index' },
          { href: 'mens-shoe-size-pages.html', text: "Men's Shoe Size Pages" },
          { href: 'womens-shoe-size-pages.html', text: "Women's Shoe Size Pages" },
          { href: 'kids-shoe-size-pages.html', text: "Kids Shoe Size Pages" }
        ]
      },
      articles: {
        title: 'Articles & guides',
        intro: 'In-depth guides cover how to measure your feet, how to measure in cm, foot width and shoe fit, why EU and US differ, how UK and Japanese sizing work, and common mistakes. Use these to understand the systems before converting or buying.',
        links: [
          { href: 'how-to-measure-feet.html', text: 'How to Measure Your Feet' },
          { href: 'how-to-measure-in-cm.html', text: 'How to Measure in CM' },
          { href: 'foot-width-guide.html', text: 'Foot Width Guide' },
          { href: 'shoe-fit-guide.html', text: 'Shoe Fit Guide' },
          { href: 'semantic/how-to-measure-feet-cm.html', text: 'How to Measure Your Feet in CM' },
          { href: 'semantic/why-eu-and-us-sizes-differ.html', text: 'Why EU and US Shoe Sizes Differ' },
          { href: 'semantic/how-uk-shoe-sizes-differ.html', text: 'How UK Shoe Sizes Differ' },
          { href: 'semantic/how-japanese-shoe-sizes-work.html', text: 'How Japanese Shoe Sizes Work' },
          { href: 'semantic/common-shoe-sizing-mistakes.html', text: 'Common Shoe Sizing Mistakes' },
          { href: 'semantic/how-shoe-sizing-works.html', text: 'How Shoe Sizing Works' },
          { href: 'shoe-sizing-guides.html', text: 'Shoe Sizing Guides (legacy)' }
        ]
      },
      tools: {
        title: 'Tools',
        intro: 'Interactive calculators take your foot length (and for the width calculator, circumference at the ball) and return US, UK, EU, and Japan sizes. The kids calculator adds age-range and next-size guidance. The Measurement Assistant combines foot and clothing conversion in one place.',
        links: [
          { href: 'foot-measurement-calculator.html', text: 'Foot Measurement Calculator' },
          { href: 'kids-growth-size-calculator.html', text: 'Kids Growth & Shoe Size Calculator' },
          { href: 'foot-width-calculator.html', text: 'Foot Width Calculator' },
          { href: 'tools/measurement-assistant.html', text: 'Measurement Assistant' }
        ]
      },
      printables: {
        title: 'Printables',
        intro: 'Print or save as PDF: EU/US shoe size reference chart, kids shoe size guide, foot measuring sheet, and printable cm ruler. Use these for at-home measuring and to keep a size reference when shopping online.',
        links: [
          { href: 'printable-size-charts.html', text: 'Printable Size Charts' },
          { href: 'printable-size-guides.html', text: 'Printable Size Guides' },
          { href: 'printable/shoe-size-reference-chart.html', text: 'EU/US Shoe Size Reference Chart' },
          { href: 'printable/kids-size-guide.html', text: 'Kids Shoe Size Guide' },
          { href: 'printable/foot-measuring-sheet.html', text: 'Foot Measuring Sheet' },
          { href: 'printable/cm-ruler.html', text: 'Printable CM Ruler' }
        ]
      }
    }
  },
  {
    slug: 'clothing-size-guides.html',
    title: 'Clothing Size Guides',
    bodyKey: 'clothing',
    description: 'Central hub for clothing sizing: converters, conversion pages, fit articles, measurement tools, and printable charts. US, UK, EU.',
    breadcrumb: 'Clothing Size Guides',
    faq: [
      { q: 'How do US and EU clothing sizes compare?', a: 'They don\'t align 1:1. A US Medium (M) is roughly EU 38–40 for tops, but the exact mapping depends on the garment type (tops, pants, dresses) and brand. Use our clothing size converter and then check the retailer\'s size chart for the specific item.' },
      { q: 'What body measurements do I need for clothing size?', a: 'For tops: chest (fullest part under arms) and often waist and hips. For pants: waist and inseam, and sometimes hips. Measure with a soft tape, keep it horizontal and snug but not tight. Our Measurement Assistant and printable clothing chart guide you through it.' },
      { q: 'Why does the same size fit differently in different brands?', a: 'Brands use different fit models, ease (room in the garment), and grading. European and Asian brands often run slimmer than US. Some brands use vanity sizing (smaller numbers for the same measurements). Always compare your measurements to the brand\'s size chart for that product.' },
      { q: 'Should I size up or down when buying from another region?', a: 'Start with a converter to get your equivalent size, then read the brand\'s chart and any "runs small/large" notes. When in doubt, size up for comfort—especially for tops and dresses. For pants, waist and inseam on the chart matter more than the letter or number.' },
      { q: 'Where can I find a printable clothing size chart?', a: 'We offer a printable clothing measurement chart that explains how to measure chest, waist, and hips and how to use those numbers with size charts. See the Printables section on this page for the link, and use it together with our clothing size converter.' }
    ],
    sections: {
      converters: {
        title: 'Converters',
        intro: 'These tools convert between US, UK, and EU clothing sizes and (where applicable) body measurements. Use them to get a baseline size, then confirm with the retailer\'s size guide for the specific garment.',
        links: [
          { href: 'clothing-size-converter.html', text: 'Clothing Size Converter' },
          { href: 'shoe-size-converter.html', text: 'Shoe Size Converter' }
        ]
      },
      programmatic: {
        title: 'Programmatic pages',
        intro: 'Our programmatic index and clothing size pages list conversion pages by region and category. Use these when you need a direct link to a specific conversion (e.g. for bookmarking or sharing).',
        links: [
          { href: 'programmatic-index.html', text: 'Programmatic Index' },
          { href: 'clothing-size-pages.html', text: 'Clothing Size Pages' }
        ]
      },
      articles: {
        title: 'Articles & guides',
        intro: 'In-depth articles explain how clothing sizes differ globally, common fit problems, and which brands tend to run small or large. Use these to avoid returns and choose the right size strategy.',
        links: [
          { href: 'how-clothing-sizes-differ-globally.html', text: 'How Clothing Sizes Differ Globally' },
          { href: 'common-sizing-problems.html', text: 'Common Sizing Problems' },
          { href: 'clothing-fit-problems.html', text: 'Clothing Fit Problems' },
          { href: 'brands-that-run-small.html', text: 'Brands That Run Small' },
          { href: 'brands-that-run-large.html', text: 'Brands That Run Large' }
        ]
      },
      tools: {
        title: 'Tools',
        intro: 'The Measurement Assistant accepts chest, waist, and hip measurements and suggests clothing sizes; the Foot Measurement Calculator supports shoe sizing. Use these when you have measurements and want a recommended size before checking the brand chart.',
        links: [
          { href: 'tools/measurement-assistant.html', text: 'Measurement Assistant (foot + clothing)' },
          { href: 'foot-measurement-calculator.html', text: 'Foot Measurement Calculator' },
          { href: 'measurement-tools.html', text: 'Measurement Tools hub' }
        ]
      },
      printables: {
        title: 'Printables',
        intro: 'Print or save as PDF: clothing measurement chart, shoe size reference, and foot measuring sheet. Handy for at-home measuring and for keeping a size reference when shopping.',
        links: [
          { href: 'printable-size-charts.html', text: 'Printable Size Charts' },
          { href: 'printable-size-guides.html', text: 'Printable Size Guides' },
          { href: 'printable/clothing-measurement-chart.html', text: 'Clothing Measurement Chart' },
          { href: 'printable/shoe-size-reference-chart.html', text: 'Shoe Size Reference Chart' },
          { href: 'printable/foot-measuring-sheet.html', text: 'Foot Measuring Sheet' }
        ]
      }
    }
  },
  {
    slug: 'brand-sizing-guides.html',
    title: 'Brand Sizing Guides',
    bodyKey: 'brand',
    description: 'Central hub for brand-specific sizing: Nike, Adidas, Zara, H&M, and more. Converters, programmatic pages, articles, tools, and printables.',
    breadcrumb: 'Brand Sizing Guides',
    faq: [
      { q: 'Do Nike and Adidas use the same shoe sizes?', a: 'They both use US, UK, and EU labeling, but fit can differ. Nike often runs slightly narrow; Adidas is often true to size. Use our converters to get your base size, then check our Nike and Adidas size guides and the brand\'s chart for the specific shoe.' },
      { q: 'Why do some brands run small or large?', a: 'Brands use different lasts (shoe molds), fit models, and target markets. Athletic brands may add room for movement; fashion brands may cut slimmer. Our articles on brands that run small and brands that run large summarize common patterns so you can decide whether to size up or down.' },
      { q: 'Should I trust the brand size chart or a conversion chart?', a: 'Use both. A conversion chart gives you the equivalent size in another region (e.g. US 9 = EU 42). The brand\'s own chart is authoritative for how that product was graded. If the brand lists measurements (e.g. foot length in cm), compare your measurement to the chart directly.' },
      { q: 'Which brands have dedicated size guides on this site?', a: 'We have guides for Nike, Adidas, Zara, H&M, New Balance, Puma, Reebok, Vans, Converse, ASICS, and others. See the Brand size guides section on this page for the full list. Each guide covers fit tendencies and how to convert to your region.' },
      { q: 'How do I use my measurements with a brand that only shows EU sizes?', a: 'Measure your foot (or body for clothing) in cm. Use our converter to get your equivalent US, UK, and EU size. Then compare that to the brand\'s EU chart. If the brand runs small, consider the next size up; if it runs large, you may be able to size down.' }
    ],
    sections: {
      converters: {
        title: 'Converters',
        intro: 'Establish your base size with these converters (shoe and clothing), then compare to each brand\'s size chart. Enter your measurement or current size to get US, UK, and EU equivalents before applying brand-specific fit advice.',
        links: [
          { href: 'shoe-size-converter.html', text: 'Shoe Size Converter' },
          { href: 'clothing-size-converter.html', text: 'Clothing Size Converter' },
          { href: 'cm-to-us-shoe-size.html', text: 'CM to US Shoe Size' }
        ]
      },
      programmatic: {
        title: 'Programmatic pages',
        intro: 'Single-size conversion pages (e.g. EU 42 to US, US 9 to UK) are listed in the programmatic index and in shoe and clothing page indices. Use these for quick lookups or when you need a URL for a specific conversion.',
        links: [
          { href: 'programmatic-index.html', text: 'Programmatic Index' },
          { href: 'shoe-size-pages.html', text: 'Shoe Size Pages' },
          { href: 'clothing-size-pages.html', text: 'Clothing Size Pages' }
        ]
      },
      articles: {
        title: 'Articles & guides',
        intro: 'Our Brand Sizing Guide explains how to use brand charts with conversion; articles on brands that run small or large and common sizing problems help you decide when to size up or down.',
        links: [
          { href: 'brand-sizing-guide.html', text: 'Brand Sizing Guide (how to use brand charts)' },
          { href: 'brands-that-run-small.html', text: 'Brands That Run Small' },
          { href: 'brands-that-run-large.html', text: 'Brands That Run Large' },
          { href: 'common-sizing-problems.html', text: 'Common Sizing Problems' }
        ]
      },
      tools: {
        title: 'Tools',
        intro: 'Foot and width calculators plus the Measurement Assistant give you a baseline size from your measurements. Use these before comparing to a brand\'s chart so you know your standard size and can apply "runs small/large" guidance correctly.',
        links: [
          { href: 'foot-measurement-calculator.html', text: 'Foot Measurement Calculator' },
          { href: 'foot-width-calculator.html', text: 'Foot Width Calculator' },
          { href: 'tools/measurement-assistant.html', text: 'Measurement Assistant' },
          { href: 'measurement-tools.html', text: 'Measurement Tools' }
        ]
      },
      printables: {
        title: 'Printables',
        intro: 'Printable EU/US shoe and clothing measurement charts help you measure at home and keep a size reference. Print or save as PDF and use with the brand\'s chart for the item you\'re buying.',
        links: [
          { href: 'printable-size-charts.html', text: 'Printable Size Charts' },
          { href: 'printable-size-guides.html', text: 'Printable Size Guides' },
          { href: 'printable/shoe-size-reference-chart.html', text: 'EU/US Shoe Size Chart' },
          { href: 'printable/clothing-measurement-chart.html', text: 'Clothing Measurement Chart' }
        ]
      },
      brands: {
        title: 'Brand size guides',
        intro: 'Dedicated pages for each brand cover fit tendencies, EU vs US discrepancies, and when to size up or down. Start with the main Brand Size Guides index, or jump to a brand below.',
        links: [
          { href: 'brand-size-guides.html', text: 'Brand Size Guides (all brands)' },
          { href: 'brands/nike-size-guide.html', text: 'Nike Size Guide' },
          { href: 'brands/adidas-size-guide.html', text: 'Adidas Size Guide' },
          { href: 'brands/zara-size-guide.html', text: 'Zara Size Guide' },
          { href: 'brands/hm-size-guide.html', text: 'H&M Size Guide' },
          { href: 'brands/new-balance-size-guide.html', text: 'New Balance Size Guide' },
          { href: 'brands/puma-size-guide.html', text: 'Puma Size Guide' },
          { href: 'brands/reebok-size-guide.html', text: 'Reebok Size Guide' },
          { href: 'brands/vans-size-guide.html', text: 'Vans Size Guide' },
          { href: 'brands/converse-size-guide.html', text: 'Converse Size Guide' },
          { href: 'brands/asics-size-guide.html', text: 'ASICS Size Guide' }
        ]
      }
    }
  },
  {
    slug: 'measurement-guides.html',
    title: 'Measurement Guides',
    bodyKey: 'measurement',
    description: 'Central hub for measurement: how to measure feet and body, converters, programmatic pages, calculators, and printable rulers and charts.',
    breadcrumb: 'Measurement Guides',
    faq: [
      { q: 'What is the best way to measure my foot for shoe size?', a: 'Place a piece of paper against a wall on a hard floor. Stand with your heel touching the wall and mark the tip of your longest toe. Measure from the wall to the mark in centimeters. Do both feet and use the larger value. Measure in the evening when feet are slightly larger. Our how-to-measure guides and printable foot sheet walk you through it.' },
      { q: 'Should I measure in centimeters or inches?', a: 'Centimeters are recommended because most international size charts and our converters use cm. If you have inches, multiply by 2.54 to get cm. Our Measurement Assistant and Foot Measurement Calculator accept both; the printable cm ruler is in cm—print at 100% scale for accuracy.' },
      { q: 'How do I measure my chest, waist, and hips for clothing?', a: 'Chest: around the fullest part, under the arms, tape horizontal. Waist: around your natural waist (above navel, below ribs). Hips: around the fullest part of your hips. Keep the tape snug but not compressing. Our printable clothing measurement chart and Measurement Assistant guide you step-by-step.' },
      { q: 'Why did my converted size change from last time?', a: 'Feet and body can change with weight, age, or activity. If you haven\'t measured recently, re-measure and use the new number. Also ensure you selected the correct gender and category (men\'s, women\'s, kids) in the converter, since the scales differ.' },
      { q: 'Can I use a printable ruler for accurate cm measurement?', a: 'Yes. We provide a printable cm ruler; print at 100% (actual size) with no scaling so the markings are true to scale. Use it with our foot measuring sheet or any length you need to measure. Check your print dialog for "Actual size" or "100% scale."' }
    ],
    sections: {
      converters: {
        title: 'Converters',
        intro: 'Enter a measurement (e.g. foot length in cm) or an existing size to get US, UK, EU, and other equivalents. These tools use the same reference data as our programmatic conversion pages for consistency across the site.',
        links: [
          { href: 'shoe-size-converter.html', text: 'Shoe Size Converter' },
          { href: 'clothing-size-converter.html', text: 'Clothing Size Converter' },
          { href: 'cm-to-us-shoe-size.html', text: 'CM to US Shoe Size' },
          { href: 'cm-measurement-converters.html', text: 'CM Measurement Converters' }
        ]
      },
      programmatic: {
        title: 'Programmatic pages',
        intro: 'Programmatic conversion pages offer one page per size or measurement (e.g. 26 cm to US, inch to EU). The index lists all such pages; sample links below cover common measurement-based conversions.',
        links: [
          { href: 'programmatic-index.html', text: 'Programmatic Index' },
          { href: 'programmatic-pages/cm-to-us-shoe-size.html', text: 'CM to US Shoe Size' },
          { href: 'programmatic-pages/cm-to-eu-shoe-size.html', text: 'CM to EU Shoe Size' },
          { href: 'programmatic-pages/inch-to-us-shoe-size.html', text: 'Inch to US Shoe Size' }
        ]
      },
      articles: {
        title: 'Articles & guides',
        intro: 'Step-by-step guides explain how to measure your feet and body, how to measure in cm, and how to interpret width and fit. Use these before using a converter or calculator so you have accurate input.',
        links: [
          { href: 'how-to-measure-feet.html', text: 'How to Measure Your Feet' },
          { href: 'how-to-measure-in-cm.html', text: 'How to Measure in CM' },
          { href: 'foot-width-guide.html', text: 'Foot Width Guide' },
          { href: 'shoe-fit-guide.html', text: 'Shoe Fit Guide' },
          { href: 'semantic/how-to-measure-feet-cm.html', text: 'How to Measure Your Feet in CM' }
        ]
      },
      tools: {
        title: 'Tools',
        intro: 'Interactive calculators accept your foot length (and optionally width or circumference) and return shoe sizes; the Measurement Assistant handles both foot and body measurements. Use these for instant conversion after you have measured.',
        links: [
          { href: 'foot-measurement-calculator.html', text: 'Foot Measurement Calculator' },
          { href: 'kids-growth-size-calculator.html', text: 'Kids Growth & Shoe Size Calculator' },
          { href: 'foot-width-calculator.html', text: 'Foot Width Calculator' },
          { href: 'tools/measurement-assistant.html', text: 'Measurement Assistant' },
          { href: 'measurement-tools.html', text: 'Measurement Tools hub' }
        ]
      },
      printables: {
        title: 'Printables',
        intro: 'Printable foot measuring sheet, cm ruler, clothing measurement chart, and kids size guide let you measure at home with accurate references. Print at 100% scale for the ruler; use the sheets with our converters for full conversion.',
        links: [
          { href: 'printable-size-charts.html', text: 'Printable Size Charts' },
          { href: 'printable-size-guides.html', text: 'Printable Size Guides' },
          { href: 'printable/foot-measuring-sheet.html', text: 'Foot Measuring Sheet' },
          { href: 'printable/cm-ruler.html', text: 'Printable CM Ruler' },
          { href: 'printable/clothing-measurement-chart.html', text: 'Clothing Measurement Chart' },
          { href: 'printable/kids-size-guide.html', text: 'Kids Shoe Size Guide' }
        ]
      }
    }
  }
];

function sectionHtml(sec) {
  if (!sec) return '';
  const items = sec.links.map(l => `<li><a href="${l.href}">${l.text.replace(/&/g, '&amp;')}</a></li>`).join('\n          ');
  return `
      <section class="content-section">
        <h2>${sec.title}</h2>
        <p>${sec.intro}</p>
        <ul class="hub-links">
          ${items}
        </ul>
      </section>`;
}

function faqSchemaJson(hub) {
  if (!hub.faq || !hub.faq.length) return '';
  const mainEntity = hub.faq.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a }
  }));
  return JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity });
}

function faqSectionHtml(hub) {
  if (!hub.faq || !hub.faq.length) return '';
  const items = hub.faq.map(({ q, a }) => `
        <div class="faq-item">
          <h3>${q.replace(/&/g, '&amp;')}</h3>
          <p>${a.replace(/&/g, '&amp;')}</p>
        </div>`).join('');
  return `
      <section class="content-section" id="faq">
        <h2>Frequently Asked Questions</h2>
        ${items}
      </section>`;
}

function buildHub(hub) {
  const canonical = BASE_URL + '/' + hub.slug;
  const bc = [
    { position: 1, name: 'Home', item: BASE_URL + '/' },
    { position: 2, name: hub.breadcrumb, item: canonical }
  ];
  const bcJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: bc.map(b => ({ '@type': 'ListItem', position: b.position, name: b.name, item: b.item }))
  });
  const faqJson = faqSchemaJson(hub);
  const order = ['converters', 'programmatic', 'articles', 'tools', 'printables', 'brands'];
  let sectionsHtml = '';
  for (const key of order) {
    if (hub.sections[key]) sectionsHtml += sectionHtml(hub.sections[key]);
  }
  const mainContent = hub.bodyKey
    ? BODY_CONTENT[hub.bodyKey]
    : `<section class="content-section"><h1>${hub.title}</h1><p class="mb-lg">${hub.description}</p></section>`;
  const faqBlock = faqSectionHtml(hub);
  const faqSchemaScript = faqJson ? `\n  <script type="application/ld+json">${faqJson}</script>` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <meta name="description" content="${hub.description.replace(/"/g, '&quot;')}">
  <link rel="canonical" href="${canonical}">
  <title>${hub.title} | GlobalSizeChart.com</title>
  <link rel="stylesheet" href="styles.css">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","@id":"${BASE_URL}/#organization","name":"GlobalSizeChart.com","url":"${BASE_URL}"}</script>
  <script type="application/ld+json">${bcJson}</script>${faqSchemaScript}
</head>
<body data-intent="shopping_research">
  <header>
    <div class="header-content">
      <a href="index.html" class="logo">GlobalSizeChart.com</a>
      <nav>${SHARED_NAV}
      </nav>
    </div>
  </header>
  <main>
    <div class="container">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> &gt; <span>${hub.breadcrumb.replace(/&/g, '&amp;')}</span></nav>
${mainContent}
${sectionsHtml}${faqBlock}${AUTHORITY_HUBS_BLOCK}
    </div>
  </main>${SHARED_FOOTER}
  <script src="app.js"></script>
</body>
</html>`;
}

function run() {
  for (const hub of HUBS) {
    const html = buildHub(hub);
    fs.writeFileSync(path.join(ROOT, hub.slug), html, 'utf8');
    console.log('Wrote', hub.slug);
  }
  console.log('Done. Four authority hubs created.');
}

run();
