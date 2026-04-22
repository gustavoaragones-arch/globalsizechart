#!/usr/bin/env node
/**
 * Injects a compact AEO layer (why sizes vary as info cards + key navigation tiles)
 * before </main> on static HTML pages.
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

function buildBodyLayer(prefix) {
  const p = prefix;
  return `
      <div class="aeo-ai-layer" data-aeo-ai-layer>
      <section class="content-section why-vary-cards" aria-labelledby="aeo-why-h2">
        <h2 id="aeo-why-h2">Why sizes don’t line up everywhere</h2>
        <div class="card-grid">
          <article class="info-card">
            <h3>Different scales</h3>
            <p>US, UK, EU, and JP labels rarely describe the same foot length in millimeters.</p>
          </article>
          <article class="info-card">
            <h3>Brand lasts</h3>
            <p>Two brands can label the same length differently based on shape and materials.</p>
          </article>
          <article class="info-card">
            <h3>Use centimeters</h3>
            <p>Measuring both feet in cm is the most reliable way to cross-check any chart.</p>
          </article>
        </div>
      </section>
      <section class="content-section" aria-label="Key tools">
        <h2>Key navigation</h2>
        <div class="card-grid nav-card-grid">
          <a class="nav-card" href="${p}shoe-size-converter.html"><span class="nav-card__label">Shoe size converter</span></a>
          <a class="nav-card" href="${p}clothing-size-converter.html"><span class="nav-card__label">Clothing size converter</span></a>
          <a class="nav-card" href="${p}knowledge/"><span class="nav-card__label">Knowledge hub</span></a>
          <a class="nav-card" href="${p}guides/"><span class="nav-card__label">Guides</span></a>
          <a class="nav-card" href="${p}measurement-standards.html"><span class="nav-card__label">Measurement standards</span></a>
        </div>
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
  if (html.includes('class="ai-answer') || html.includes("class='ai-answer")) return { skip: true, reason: 'has ai-answer' };

  const idx = html.lastIndexOf('</main>');
  if (idx === -1) return { skip: true, reason: 'no </main>' };

  const prefix = pathPrefix(relPath);
  const title = extractTitle(html);
  const layer = buildBodyLayer(prefix);

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
