#!/usr/bin/env node
/**
 * Phase 19 — Auto FAQ expansion
 * Appends 3 templated FAQ items (with data-ai-generated) before </main> if not already expanded.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, walkHtmlFiles, stripTags } = require('./lib/ai-engine-utils');

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? stripTags(m[1]).replace(/\s*\|\s*GlobalSizeChart\.com.*$/i, '').trim() : 'Size conversion';
}

function buildFaqHtml(title) {
  const short = title.slice(0, 80);
  return `
      <section class="faq-block content-section ai-faq-expansion" data-ai-faq-expanded="true" aria-label="Additional FAQs">
        <h2>More questions</h2>
        <div class="faq-item" data-ai-generated="true">
          <h3>Is this conversion the same for every brand?</h3>
          <p>Charts show standardized length mapping; fit still varies by brand last, width, and materials. Check the brand’s own chart when possible.</p>
        </div>
        <div class="faq-item" data-ai-generated="true">
          <h3>What foot length is this based on?</h3>
          <p>Our tool maps sizes through a centimeter (foot length) baseline. Measuring your foot in cm is the most reliable cross-check.</p>
        </div>
        <div class="faq-item" data-ai-generated="true">
          <h3>Do men’s and women’s scales differ for this label?</h3>
          <p>Yes. Men’s, women’s, and kids’ shoe lines use different progressions—always pick the right gender in the converter.</p>
        </div>
        <div class="faq-item" data-ai-generated="true">
          <h3>Where can I read more about ${short}?</h3>
          <p>See our <a href="/knowledge/">knowledge hub</a>, <a href="/guides/">guides</a>, and <a href="/measurement-standards.html">measurement standards</a> for deeper context.</p>
        </div>
      </section>`;
}

function main() {
  if (process.env.SKIP_FAQ_EXPAND === '1') {
    console.log('generate-faqs: skipped (SKIP_FAQ_EXPAND=1)');
    return;
  }
  const max = parseInt(process.env.MAX_FAQ_PAGES || '500', 10);
  const dry = process.argv.includes('--dry-run');
  let n = 0;
  for (const rel of walkHtmlFiles('.')) {
    if (n >= max) break;
    const norm = rel.replace(/\\/g, '/');
    if (!norm.startsWith('programmatic-pages/')) continue;
    const full = path.join(ROOT, rel);
    let html = fs.readFileSync(full, 'utf8');
    if (html.includes('data-ai-faq-expanded')) continue;
    if (!html.includes('</main>')) continue;

    const title = extractTitle(html);
    const block = buildFaqHtml(title);
    html = html.replace(/<\/main>/i, `${block}\n  </main>`);
    if (!dry) fs.writeFileSync(full, html, 'utf8');
    n++;
  }
  console.log('generate-faqs: %s %d programmatic pages (MAX_FAQ_PAGES=%s)', dry ? 'dry-run' : 'appended expansion to', n, max);
}

main();
