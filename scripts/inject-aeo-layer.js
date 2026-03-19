#!/usr/bin/env node
/**
 * Injects AI/AEO HTML layer (Quick Answer, Why sizes vary, optional FAQ block,
 * author box, See also) before </main> on static HTML pages.
 *
 * Also adds Article + FAQPage JSON-LD in <head> when missing (Albor Digital Team / FAQPage).
 *
 * Skips: node_modules, .git, scripts, sitemaps, components.
 * Skips files that already contain data-aeo-ai-layer.
 *
 * Usage: node scripts/inject-aeo-layer.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components']);

function* walkHtmlFiles(dir, prefix = '') {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return;
  const entries = fs.readdirSync(full, { withFileTypes: true });
  for (const ent of entries) {
    const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
    if (ent.isDirectory()) {
      if (IGNORE_DIRS.has(ent.name)) continue;
      yield* walkHtmlFiles(path.join(dir, ent.name), rel);
    } else if (ent.isFile() && ent.name.endsWith('.html')) {
      yield rel;
    }
  }
}

function pathPrefix(relPath) {
  const depth = relPath.split('/').length - 1;
  return depth <= 0 ? '' : '../'.repeat(depth);
}

function stripTitle(raw) {
  return raw
    .replace(/\s*\|\s*GlobalSizeChart\.com.*$/i, '')
    .replace(/\s*\|\s*Global Size Chart.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? stripTitle(m[1]) : 'Global Size Chart';
}

function extractCanonical(html) {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return m ? m[1] : null;
}

function formatDate(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function quickAnswerFromTitle(title, lower) {
  if (/shoe|size|eu|us|uk|cm|jp|convert/i.test(lower)) {
    return `${escapeHtml(title)}: this page is part of Global Size Chart’s international sizing reference. Use the on-page converter or charts to map between US, UK, EU, JP, and centimeters, anchored to foot length where applicable.`;
  }
  return `${escapeHtml(title)}: Global Size Chart helps you compare international clothing and shoe labels using standardized length-based references. Check linked guides for measurement tips.`;
}

function buildBodyLayer(prefix, quickAnswer, includeFaqBlock) {
  const p = prefix;
  const faq = includeFaqBlock
    ? `
      <section class="faq-block content-section" id="aeo-faq-block">
        <h2>Frequently Asked Questions</h2>
        <div class="faq-item">
          <h3>What is EU 42 in US shoe size?</h3>
          <p>EU 42 typically converts to US men's size 9 and US women's size 10.5, depending on brand and width. Use any converter on this page when available.</p>
        </div>
        <div class="faq-item">
          <h3>Are EU and US shoe sizes the same?</h3>
          <p>No. The <strong>EU sizing system</strong> and <strong>US shoe sizing scale</strong> use different scales. <strong>International shoe size conversion</strong> is most reliable when you anchor to <strong>foot length in cm</strong>.</p>
        </div>
      </section>`
    : '';

  return `
      <div class="aeo-ai-layer" data-aeo-ai-layer>
      <section class="ai-answer content-section" aria-labelledby="aeo-qa-h2">
        <h2 id="aeo-qa-h2">Quick Answer</h2>
        <p>${quickAnswer}</p>
      </section>
      <section class="why-sizes-vary content-section" aria-labelledby="aeo-why-h2">
        <h2 id="aeo-why-h2">Why Sizes May Vary</h2>
        <p>Shoe and clothing sizes can vary between brands due to manufacturing differences, materials, and regional sizing standards.</p>
      </section>${faq}
      <section class="author-box content-section" aria-label="Author">
        <p><strong>Author:</strong> Albor Digital Team</p>
        <p>Global Size Chart is operated by Albor Digital, specializing in international sizing systems and conversion tools.</p>
      </section>
      <section class="aeo-see-also content-section">
        <h2>See also</h2>
        <p>
          <a href="${p}shoe-size-converter.html">Shoe Size Converter</a> ·
          <a href="${p}knowledge/">Knowledge hub</a> ·
          <a href="${p}guides/">Guides</a> ·
          <a href="${p}measurement-standards.html">Measurement standards</a>
        </p>
      </section>
      </div>
`;
}

function injectHeadSchemas(html, headline, pageUrl, dateModified) {
  let out = html;
  if (!/Albor Digital Team/.test(out)) {
    const article = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline,
      author: { '@type': 'Person', name: 'Albor Digital Team' },
      publisher: { '@type': 'Organization', name: 'Global Size Chart', url: 'https://globalsizechart.com' },
      datePublished: '2026-01-01',
      dateModified,
      url: pageUrl,
    };
    const script = `  <script type="application/ld+json">${JSON.stringify(article)}</script>\n`;
    out = out.replace(/<\/head>/i, `${script}</head>`);
  }
  if (!/"@type"\s*:\s*"FAQPage"/.test(out) && !/'@type'\s*:\s*'FAQPage'/.test(out)) {
    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is EU 42 in US shoe size?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "EU 42 typically converts to US men's size 9 and US women's size 10.5; brand and width affect fit.",
          },
        },
        {
          '@type': 'Question',
          name: 'Are EU and US shoe sizes the same?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. EU and US use different scales; use foot length in cm or a trusted converter for equivalents.',
          },
        },
      ],
    };
    const script = `  <script type="application/ld+json">${JSON.stringify(faq)}</script>\n`;
    out = out.replace(/<\/head>/i, `${script}</head>`);
  }
  return out;
}

const SKIP_FILES = new Set([
  'index.html',
  'shoe-size-converter.html',
  'clothing-size-converter.html',
  'knowledge/index.html',
  'guides/index.html',
]);

function processFile(relPath) {
  const full = path.join(ROOT, relPath);
  let html = fs.readFileSync(full, 'utf8');
  if (SKIP_FILES.has(relPath.replace(/\\/g, '/'))) return { skip: true, reason: 'curated manually' };
  if (html.includes('data-aeo-ai-layer')) return { skip: true, reason: 'already has layer' };
  if (html.includes('class="author-box"') || html.includes("class='author-box'")) return { skip: true, reason: 'has author-box' };
  if (html.includes('class="ai-answer') || html.includes("class='ai-answer")) return { skip: true, reason: 'has ai-answer' };

  const idx = html.lastIndexOf('</main>');
  if (idx === -1) return { skip: true, reason: 'no </main>' };

  const prefix = pathPrefix(relPath);
  const title = extractTitle(html);
  const lower = title.toLowerCase();
  const quickAnswer = quickAnswerFromTitle(title, lower);

  const hasFaq =
    /\bid=["']faq["']/.test(html) ||
    /class=["'][^"']*faq-block/.test(html) ||
    /class=["'][^"']*faq-section/.test(html);
  const layer = buildBodyLayer(prefix, quickAnswer, !hasFaq);

  const stat = fs.statSync(full);
  const dateModified = formatDate(stat.mtimeMs);
  const canonical = extractCanonical(html);
  const pageUrl = canonical || `https://globalsizechart.com/${relPath.replace(/\\/g, '/')}`;

  /* Head schemas BEFORE body injection so "Albor Digital Team" in body does not skip Article. */
  html = injectHeadSchemas(html, title, pageUrl, dateModified);

  html = html.slice(0, idx) + layer + html.slice(idx);

  fs.writeFileSync(full, html, 'utf8');
  return { skip: false };
}

function main() {
  let updated = 0;
  let skipped = 0;
  for (const rel of walkHtmlFiles('.')) {
    const r = processFile(rel);
    if (r.skip) skipped++;
    else updated++;
  }
  console.log('AEO layer: updated %d files, skipped %d', updated, skipped);
}

main();
