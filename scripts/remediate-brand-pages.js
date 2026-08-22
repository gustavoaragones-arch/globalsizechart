#!/usr/bin/env node
'use strict';
/**
 * Phase 7 — Brand page UX + content architecture remediation.
 *
 * Canonical source for brands/*.html structure going forward. Scoped
 * exclusively to the brands/ directory; never touches any other family.
 *
 * Why a dedicated script rather than patching the historical injectors
 * (ai-answer-injector.js, inject-aeo-layer.js, fix-ai-layout.js,
 * revenue-engine.js, generate-programmatic-pages.js): each of those
 * scripts also produces output for hundreds of non-brand pages
 * (programmatic-pages/, measurement/, other root pages). Patching them
 * directly risks the exact "unrelated page families changed unexpectedly"
 * hard-stop this phase must avoid. This script reads the CURRENT 20 brand
 * files, reuses their existing genuine brand-specific content (never
 * inventing new claims), and writes back only those 20 files.
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const BRANDS_DIR = path.join(ROOT, 'brands');
const DRY = process.argv.includes('--dry-run');

// ---- Brand registry (name, category) — derived from filenames, verified manually ----
const BRAND_OF = {
  'adidas-eu-to-us-shoe-sizing.html': { brand: 'Adidas', category: 'shoes' },
  'adidas-size-guide.html': { brand: 'Adidas', category: 'shoes' },
  'asics-size-guide.html': { brand: 'ASICS', category: 'shoes' },
  'asos-size-guide.html': { brand: 'ASOS', category: 'clothing' },
  'converse-size-guide.html': { brand: 'Converse', category: 'shoes' },
  'hm-size-converter.html': { brand: 'H&M', category: 'clothing' },
  'hm-size-guide.html': { brand: 'H&M', category: 'clothing' },
  'levis-jeans-size-guide.html': { brand: "Levi's", category: 'clothing' },
  'new-balance-shoe-size-chart.html': { brand: 'New Balance', category: 'shoes' },
  'new-balance-size-guide.html': { brand: 'New Balance', category: 'shoes' },
  'nike-shoe-size-chart.html': { brand: 'Nike', category: 'shoes' },
  'nike-size-guide.html': { brand: 'Nike', category: 'shoes' },
  'puma-shoe-size-chart.html': { brand: 'Puma', category: 'shoes' },
  'puma-size-guide.html': { brand: 'Puma', category: 'shoes' },
  'reebok-size-guide.html': { brand: 'Reebok', category: 'shoes' },
  'shein-size-converter.html': { brand: 'Shein', category: 'clothing' },
  'uniqlo-size-guide.html': { brand: 'Uniqlo', category: 'clothing' },
  'vans-size-guide.html': { brand: 'Vans', category: 'shoes' },
  'zara-clothing-size-guide.html': { brand: 'Zara', category: 'clothing' },
  'zara-size-guide.html': { brand: 'Zara', category: 'clothing' },
};

// ---- Converter markup, copied verbatim from the certified dedicated converter pages ----
// (shoe-size-converter.html #shoeConverter / clothing-size-converter.html #clothingConverter)
// Relative asset paths adjusted for brands/ (one level deep, same as before: ../).
function shoeConverterHtml() {
  return `<div class="converter-wrapper"><div class="converter-card"><form class="converter-form" id="shoeConverter">
          <div class="form-group">
            <label for="gender">Gender</label>
            <select name="gender" id="gender" required>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="kids">Kids</option>
            </select>
          </div>
          <div class="form-group">
            <label for="fromRegion">From Region</label>
            <select name="fromRegion" id="fromRegion" required>
              <option value="US">United States (US)</option>
              <option value="UK">United Kingdom (UK)</option>
              <option value="EU">European Union (EU)</option>
              <option value="JP">Japan (JP)</option>
              <option value="CN">China (CN)</option>
              <option value="CM">Centimeters (CM)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="sizeInput">Size</label>
            <input type="number" name="size" id="sizeInput" min="0" max="60" step="0.5" placeholder="Enter numeric size (e.g. 9 or 42)" inputmode="decimal">
            <p class="size-input-helper">Enter a valid size for your selected region.</p>
            <p class="converter-error" id="shoe-size-error" role="alert" aria-live="polite" style="display: none;"></p>
          </div>
          <input type="hidden" name="category" value="shoes">
        </form><div class="auto-note">Results update automatically as you select options</div><div class="results result-box">
          <h3>Converted Sizes</h3>
          <div class="results-grid"></div>
          <p class="converter-trust-bar">Independent conversion tool — not an official brand calculator. Fit may vary by brand, width, and foot shape.</p>
        </div></div></div>`;
}
function clothingConverterHtml() {
  return `<div class="converter-wrapper"><div class="converter-card"><form class="converter-form" id="clothingConverter">
          <div class="form-group">
            <label for="gender">Gender</label>
            <select name="gender" id="gender" required>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="kids">Kids</option>
            </select>
          </div>
          <div class="form-group">
            <label for="clothingCategory">Category</label>
            <select name="clothingCategory" id="clothingCategory" required>
              <option value="tops">Tops</option>
              <option value="pants">Pants</option>
              <option value="dresses">Dresses</option>
            </select>
          </div>
          <div class="form-group">
            <label for="fromRegion">From Region</label>
            <select name="fromRegion" id="fromRegion" required>
              <option value="US">United States (US)</option>
              <option value="UK">United Kingdom (UK)</option>
              <option value="EU">European Union (EU)</option>
              <option value="JP">Japan (JP)</option>
              <option value="CN">China (CN)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="clothing-size-input">Size</label>
            <input type="text" name="size" id="clothing-size-input" maxlength="6" placeholder="Enter standard size (XS–XXXL or 32–48)">
            <p class="converter-error" id="clothing-size-error" role="alert" aria-live="polite" style="display: none;"></p>
          </div>
          <input type="hidden" name="category" value="clothing">
          <input type="hidden" name="toRegion" id="toRegion" value="">
        </form><div class="auto-note">Results update automatically as you select options</div><div class="results result-box">
          <h3>Converted Sizes</h3>
          <div class="results-grid"></div>
          <p class="converter-trust-bar">Independent conversion tool — not an official brand calculator. Fit may vary by brand, cut, and fabric.</p>
        </div></div></div>`;
}

function extractFacts($) {
  const facts = [];
  $('main section.content-section, main section').each((i, el) => {
    const $el = $(el);
    const h2 = $el.find('> h2').first().text().trim();
    const p = $el.find('> p').first().text().trim();
    if (h2 && p) facts.push({ h2, p });
  });
  return facts;
}
function factByHeading($ , re) {
  const facts = extractFacts($);
  return facts.find(f => re.test(f.h2));
}

function buildIntro(brand, category, $) {
  const philosophy = factByHeading($, /brand sizing (philosophy|differences)/i);
  const fitTendency = factByHeading($, /fit tendenc|fit type/i);
  const noun = category === 'shoes' ? 'shoe' : 'clothing';
  let sentence2 = '';
  if (fitTendency) {
    // Reuse the existing, already-authored fit-tendency fact verbatim as the second sentence.
    sentence2 = ' ' + fitTendency.p;
  } else if (philosophy) {
    sentence2 = ' ' + philosophy.p;
  }
  return `Shopping ${brand} from another country? This page converts ${brand} ${noun} sizes to your region and explains how ${brand}'s sizing tends to run.${sentence2}`;
}

function buildFaq(brand, category, $) {
  const facts = extractFacts($);
  const fitFact = facts.find(f => /fit tendenc|fit type|real-world fit|user fit warning/i.test(f.h2));
  const inconsistencyFact = facts.find(f => /known inconsistenc|eu vs us/i.test(f.h2));
  const philosophyFact = facts.find(f => /brand sizing (philosophy|differences)/i.test(f.h2));
  const noun = category === 'shoes' ? 'shoe' : 'clothing';
  const fieldName = category === 'shoes' ? 'gender, region, and size' : 'gender, category, region, and size';

  const qa = [];
  qa.push({
    q: 'How do I use this converter?',
    a: `Select your ${fieldName} above. The converted sizes for other regions appear automatically — no separate submit step needed.`,
  });
  if (fitFact) {
    qa.push({
      q: `Does ${brand} run true to size?`,
      a: fitFact.p,
    });
  }
  if (philosophyFact && philosophyFact !== fitFact) {
    qa.push({
      q: `How does ${brand} sizing compare to standard charts?`,
      a: philosophyFact.p,
    });
  }
  if (inconsistencyFact && inconsistencyFact !== fitFact && inconsistencyFact !== philosophyFact) {
    qa.push({
      q: `Does ${brand} sizing vary by product line?`,
      a: inconsistencyFact.p,
    });
  }
  qa.push({
    q: `Should I check ${brand}'s official size chart too?`,
    a: `Yes. This converter gives a standardized international equivalent, but individual ${noun} items can run differently by style or season — checking ${brand}'s own size chart for the specific product reduces the chance of a return.`,
  });
  qa.push({
    q: 'Why do international sizes differ in the first place?',
    a: 'Each region built its sizing system independently, using different measurement models. Anchoring to a physical measurement (foot length in cm for shoes, body measurements for clothing) is the most reliable way to compare across regions.',
  });
  return qa.slice(0, 5);
}

function collectNavLinks($, currentFile) {
  const seen = new Map(); // href -> {href, text}
  const selectors = [
    '.conversion-loop a', '.next-step a', '.session-depth-modules a',
    '.high-rpm-module a', '.related-links a', 'h2:contains("Related links") ~ ul a',
    'h2:contains("Size conversion pages") ~ ul a', 'h2:contains("Other brand guides") ~ ul a',
    'h2:contains("Converters") ~ ul a', 'h2:contains("Generic converters") ~ ul a',
  ];
  selectors.forEach(sel => {
    try {
      $(sel).each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;
        if (!seen.has(href)) seen.set(href, { href, text });
      });
    } catch (e) { /* :contains selector safe-guard */ }
  });
  return seen;
}

// Curated destination descriptions (user-facing "why useful"), keyed by href pattern.
function describeDestination(href, text) {
  if (/shoe-size-converter\.html$/.test(href)) return { title: 'Shoe Size Converter', desc: 'Convert any shoe size across US, UK, EU, Japan, China, and CM.' };
  if (/clothing-size-converter\.html$/.test(href)) return { title: 'Clothing Size Converter', desc: 'Convert tops, pants, and dress sizes across regions.' };
  if (/measurement-assistant\.html$/.test(href)) return { title: 'Measurement Assistant', desc: 'Step-by-step help measuring your foot or body accurately.' };
  if (/fit-assistant\.html$/.test(href)) return { title: 'Fit Assistant', desc: 'Get fit guidance based on your measurements.' };
  if (/how-to-measure-feet-cm\.html$/.test(href)) return { title: 'How to Measure Your Feet in CM', desc: 'The most reliable way to cross-check any size chart.' };
  if (/how-shoe-sizing-works\.html$/.test(href)) return { title: 'How Shoe Sizing Works', desc: 'Understand how regional shoe sizing systems are built.' };
  if (/why-eu-and-us-sizes-differ\.html$/.test(href)) return { title: 'Why EU and US Shoe Sizes Differ', desc: 'The historical and manufacturing reasons sizes vary.' };
  if (/common-shoe-sizing-mistakes\.html$/.test(href)) return { title: 'Common Shoe Sizing Mistakes', desc: 'Avoid the most frequent measuring and ordering errors.' };
  if (/shoe-sizing-guides\.html$/.test(href) || /brand-size-guides\.html$/.test(href)) return { title: 'Brand Size Guides', desc: 'Compare sizing across more brands.' };
  const brandMatch = href.match(/^([a-z0-9-]+)-(?:shoe-size-chart|size-guide|eu-to-us-shoe-sizing|size-converter|clothing-size-guide)\.html$/);
  if (brandMatch) {
    const label = text || brandMatch[1];
    return { title: label, desc: `See sizing and conversion details for ${label.replace(/ (Size|Shoe) Guide.*/i, '')}.` };
  }
  if (/measurement\//.test(href)) return { title: text || 'Measurement conversion', desc: 'Convert a specific centimeter measurement to a size.' };
  if (/clothing\//.test(href)) return { title: text || 'Clothing size conversion', desc: 'A specific clothing size conversion example.' };
  if (/programmatic-pages\//.test(href)) return { title: text || 'Region-to-region shoe size', desc: 'Convert between two specific regions.' };
  return { title: text || href, desc: '' };
}

const SHOE_BRAND_FILES = new Set(['adidas-eu-to-us-shoe-sizing.html', 'adidas-size-guide.html', 'asics-size-guide.html', 'converse-size-guide.html', 'new-balance-shoe-size-chart.html', 'new-balance-size-guide.html', 'nike-shoe-size-chart.html', 'nike-size-guide.html', 'puma-shoe-size-chart.html', 'puma-size-guide.html', 'reebok-size-guide.html', 'vans-size-guide.html']);
const CLOTHING_BRAND_FILES = new Set(['asos-size-guide.html', 'hm-size-converter.html', 'hm-size-guide.html', 'levis-jeans-size-guide.html', 'shein-size-converter.html', 'uniqlo-size-guide.html', 'zara-clothing-size-guide.html', 'zara-size-guide.html']);

function buildNavCards($, category, currentFile) {
  const raw = collectNavLinks($, category);
  const items = Array.from(raw.values()).filter(it => it.href.split('/').pop() !== currentFile);
  const sameCategoryBrandFiles = category === 'shoes' ? SHOE_BRAND_FILES : CLOTHING_BRAND_FILES;
  // Priority order: converters, measurement guides, same-category brand comparisons,
  // cross-category brand comparisons, then specific examples.
  const priority = (href) => {
    const base = href.split('/').pop();
    if (/^(shoe-size-converter|clothing-size-converter)\.html$/.test(base)) return 0;
    if (/measurement-assistant/.test(href)) return 1;
    if (/how-to-measure/.test(href)) return 2;
    const isBrandGuide = /-size-guide\.html$|-shoe-size-chart\.html$|-shoe-sizing\.html$|-size-converter\.html$|-clothing-size-guide\.html$/.test(href);
    if (isBrandGuide && sameCategoryBrandFiles.has(base)) return 3;
    if (/how-shoe-sizing-works|why-eu-and-us|fit-assistant/.test(href)) return 4;
    if (isBrandGuide) return 5;
    if (/measurement\//.test(href)) return 6;
    if (/clothing\//.test(href) || /programmatic-pages\//.test(href)) return 7;
    return 8;
  };
  items.sort((a, b) => priority(a.href) - priority(b.href));
  const cards = [];
  const usedTitles = new Set();
  for (const it of items) {
    const d = describeDestination(it.href, it.text);
    if (!d.desc) continue; // skip anything we can't describe usefully
    if (usedTitles.has(d.title)) continue;
    usedTitles.add(d.title);
    cards.push({ href: it.href, title: d.title, desc: d.desc });
    if (cards.length >= 7) break;
  }
  return cards;
}

function verifyLinkExists(href, brandsDir) {
  // href is relative to brands/ (e.g. "../shoe-size-converter.html" or "nike-size-guide.html")
  const resolved = path.normalize(path.join(brandsDir, href));
  return fs.existsSync(resolved);
}

function processFile(file, before) {
  const filePath = path.join(BRANDS_DIR, file);
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });
  const { brand, category } = BRAND_OF[file];

  const h1 = $('h1').first().text().trim();
  const removed = { quickAnswer: 0, commonQuestions: 0, whySizesMayVary: 0, oldNav: [], monetizationDup: 0 };

  // 1. Remove "Quick answer" block entirely (§6)
  $('.ai-answer-block').each((i, el) => { removed.quickAnswer++; $(el).remove(); });

  // 2. Remove the duplicate first paragraph if it equals the meta description (§7)
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  $('main p.mb-lg').each((i, el) => {
    const t = $(el).text().trim();
    if (t === metaDesc.trim() || t.startsWith(metaDesc.trim().slice(0, 40))) $(el).remove();
  });

  // Gather facts + nav links BEFORE removing sections (need original content)
  const facts = extractFacts($);
  const navCards = buildNavCards($, category, file);

  // 3. Remove "Common questions" ai-faq-block (§14)
  $('.ai-faq-block').each((i, el) => { removed.commonQuestions++; $(el).remove(); });

  // 4. Remove thin "Why Sizes May Vary" (§18)
  $('.why-sizes-vary').each((i, el) => { removed.whySizesMayVary++; $(el).remove(); });

  // 5. Remove old stacked navigation systems (§9, §13) — record what's removed for the link inventory
  $('.conversion-loop, .next-step, .session-depth-modules').each((i, el) => {
    removed.oldNav.push($(el).attr('class'));
    $(el).remove();
  });
  $('main').find('section').filter((i, el) => /related links/i.test($(el).find('> h2').first().text())).each((i, el) => {
    removed.oldNav.push('related-links-section');
    $(el).remove();
  });
  // Remove the old per-list-section link blocks (Converters / Size conversion pages / Other brand guides / Generic converters)
  $('main').find('section.content-section').filter((i, el) => {
    const h2 = $(el).find('> h2').first().text().trim();
    return /^(Converters|Size conversion pages|Other brand guides|Generic converters|Conversion comparison)$/i.test(h2);
  }).each((i, el) => { removed.oldNav.push($(el).find('> h2').first().text().trim()); $(el).remove(); });

  // 6. Consolidate monetization/commercial modules (§21) — keep one, remove the rest
  const monetizationAsides = $('.monetization-module, .commercial-module');
  let keptAside = null;
  monetizationAsides.each((i, el) => {
    const text = $(el).text();
    if (!keptAside || text.length > $(keptAside).text().length) keptAside = el;
  });
  if (keptAside) {
    const keptHtml = $.html(keptAside);
    monetizationAsides.each((i, el) => { removed.monetizationDup++; });
    $('.monetization-modules, .commercial-modules').remove();
    $('.fit-warning').each((i, el) => {
      // fit-warning wraps the monetization/commercial sections on Template A — replace its contents with just the kept aside
      $(el).empty().append(keptHtml);
    });
  }

  // 7. Rewrite keyword-stuffed "Fit and sizing explained" card copy (§19, §20)
  const CARD_REWRITES = {
    'Regional Differences': 'Regional shoe sizing systems evolved independently, so the same foot length gets a different number in the US, UK, EU, and Japan. Comparing foot length in centimeters is the most reliable way to check a size across regions.',
    'Why Sizes Vary': `${category === 'shoes' ? 'Shoe' : 'Clothing'} sizing systems were built independently by region, so a size label alone can’t be compared directly across countries. Anchoring to a physical measurement is the reliable way to translate between them.`,
    'Fit Problems Explained': category === 'shoes'
      ? 'Most fit issues come down to measurement, not the size itself. Measuring your foot length in centimeters and comparing it against the chart removes most of the guesswork.'
      : 'Most fit issues come down to measurement, not the size itself. Taking accurate body measurements and comparing them against the chart removes most of the guesswork.',
  };
  $('.high-rpm-module__title').each((i, el) => {
    const title = $(el).text().trim();
    if (CARD_REWRITES[title]) {
      $(el).siblings('.high-rpm-module__snippet').text(CARD_REWRITES[title]);
    }
  });

  // 7b. Remove now-empty wrapper divs left behind by nav-block removal (§9, §13)
  $('.recommendation-zone, .comparison-zone').each((i, el) => {
    if (!$(el).text().trim() && $(el).children().length === 0) $(el).remove();
  });

  // 8. Build new intro + converter block, insert after H1
  const intro = buildIntro(brand, category, $);
  const converterHtml = category === 'shoes' ? shoeConverterHtml() : clothingConverterHtml();
  const $mainH1Section = $('main h1').first().parent();
  $('main h1').first().after(`<p class="lead brand-intro">${intro}</p><section class="converter-section" aria-label="${brand} size converter">${converterHtml}</section>`);

  // 9. Trim fact sections to the genuinely substantive ones, remove the rest of the old content-section list blocks already removed above
  // (Brand sizing philosophy/differences, Known inconsistencies, Fit tendencies/type, Real-world fit tips/User fit warnings kept as-is if still present)

  // 10. Build unified NAVIGATION CARD block: "Explore more size guides"
  const navHtml = `<section class="card nav-explore-more">
  <h2>Explore more size guides</h2>
  <div class="grid grid-3">
${navCards.map(c => `  <a href="${c.href}" class="card-link">
    <h3>${c.title}</h3>
    <p>${c.desc}</p>
  </a>`).join('\n')}
  </div>
</section>`;

  // Remove any leftover empty aeo-ai-layer wrapper, then insert unified nav before the FAQ block
  const $aeoLayer = $('.aeo-ai-layer');
  if ($aeoLayer.length) {
    $aeoLayer.before(navHtml);
  } else {
    $('main').append(navHtml);
  }

  // 11. Consolidate FAQ (§14-17): keep exactly one, rebuild both visible + schema from same data
  const faqData = buildFaq(brand, category, $);
  $('.faq-block').remove(); // remove old aeo FAQ; we rebuild fresh from canonical data
  const faqHtml = `<section class="content-section faq-block" id="faq">
      <h2>Frequently Asked Questions</h2>
${faqData.map(qa => `      <div class="faq-item">
        <h3>${qa.q}</h3>
        <p>${qa.a}</p>
      </div>`).join('\n')}
    </section>`;
  if ($aeoLayer.length) {
    $aeoLayer.replaceWith(faqHtml);
  } else {
    $('main').append(faqHtml);
  }

  // Rebuild FAQPage schema from the same canonical data (§16/§17)
  $('script[type="application/ld+json"]').each((i, el) => {
    const txt = $(el).html();
    if (txt && txt.includes('"FAQPage"')) {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqData.map(qa => ({
          '@type': 'Question', name: qa.q,
          acceptedAnswer: { '@type': 'Answer', text: qa.a },
        })),
      };
      $(el).html(JSON.stringify(schema));
    }
  });

  const finalHtml = $.html();
  return { finalHtml, meta: { brand, category, h1, removed, faqData, navCards, intro } };
}

// ---- Main ----
const files = fs.readdirSync(BRANDS_DIR).filter(f => f.endsWith('.html')).sort();
const summary = {};
for (const f of files) {
  const { finalHtml, meta } = processFile(f);
  summary[f] = meta;
  if (!DRY) {
    fs.writeFileSync(path.join(BRANDS_DIR, f), finalHtml);
  }
}
fs.writeFileSync(path.join(__dirname, '..', 'reports', '.phase7-remediation-summary.json'), JSON.stringify(summary, null, 2));
console.log(`Processed ${files.length} brand files. Dry run: ${DRY}`);
for (const f of files) {
  const m = summary[f];
  console.log(`${f}: removed quickAnswer=${m.removed.quickAnswer} commonQuestions=${m.removed.commonQuestions} whySizesMayVary=${m.removed.whySizesMayVary} oldNav=${m.removed.oldNav.length} faqCount=${m.faqData.length} navCards=${m.navCards.length}`);
}
