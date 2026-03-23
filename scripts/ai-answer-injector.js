#!/usr/bin/env node
/**
 * Phase 22 — AI Citation Engine: extractable answer block + FAQ + schema + data sources.
 * Targets: crawl tiers high & medium, plus all /programmatic-pages/ (excludes /legal/).
 *
 * Usage: node scripts/ai-answer-injector.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { relPathToUrlPath } = require('./lib/ai-engine-utils');
const { getPriorityTier } = require('./crawl-priority-map');
const {
  generateAnswer,
  parseConversionGuideParagraph,
  extractConversionGuideParagraph,
  extractCmFromHtml,
  decodeBasicEntities,
} = require('./lib/ai-answer-generate');

const ROOT = path.resolve(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components']);
const AUTHOR_PATH = path.join(ROOT, 'data', 'author.json');

function walkHtmlFiles(dir = '.', prefix = '') {
  const out = [];
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return out;
  for (const ent of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
    if (ent.isDirectory()) {
      if (IGNORE_DIRS.has(ent.name)) continue;
      out.push(...walkHtmlFiles(path.join(dir, ent.name), rel));
    } else if (ent.isFile() && ent.name.endsWith('.html')) {
      out.push(rel.replace(/\\/g, '/'));
    }
  }
  return out;
}

function shouldInjectAiCitation(relPath) {
  const p = relPathToUrlPath(relPath);
  if (p.startsWith('/legal/')) return false;
  const tier = getPriorityTier(p);
  if (tier === 'high' || tier === 'medium') return true;
  if (p.includes('/programmatic-pages/')) return true;
  return false;
}

function hrefTo(fromRel, toUrlPath) {
  const clean = toUrlPath.replace(/^\//, '');
  const fromDir = path.dirname(path.join(ROOT, fromRel));
  const toFull = path.join(ROOT, clean);
  let r = path.relative(fromDir, toFull);
  r = r.replace(/\\/g, '/');
  if (!r.startsWith('.')) r = `./${r}`;
  return r;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeBasicEntities(m[1].replace(/\s*\|.*$/i, '').trim()) : 'Global Size Chart';
}

function extractMetaDescription(html) {
  const m = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  return m ? decodeBasicEntities(m[1]) : '';
}

function buildProgrammaticAnswer(html, relPath) {
  const guide = extractConversionGuideParagraph(html);
  if (!guide) {
    const desc = extractMetaDescription(html);
    if (desc) return desc.split('. ').slice(0, 2).join('. ') + (desc.endsWith('.') ? '' : '.');
    return null;
  }
  const parsed = parseConversionGuideParagraph(guide);
  let cm = extractCmFromHtml(html.slice(0, 12000));
  if (!cm) {
    const faqCm = html.match(/"text":"[^"]*(\d+\.?\d*)\s*cm/i);
    if (faqCm) cm = faqCm[1];
  }
  if (parsed) {
    return generateAnswer({
      from: parsed.from,
      to: parsed.to,
      value: parsed.value,
      result: parsed.result,
      cm,
    });
  }
  return guide.length > 320 ? guide.slice(0, 317) + '…' : guide;
}

function buildGenericAnswer(html) {
  const desc = extractMetaDescription(html);
  if (desc && desc.length > 40) {
    const parts = desc.split(/(?<=[.!?])\s+/).slice(0, 2);
    return parts.join(' ');
  }
  const t = extractTitle(html);
  return `${t}: use this page’s tools and charts for international size conversion; measure foot or body length in centimeters when possible for the closest match.`;
}

function buildFaqBlocks(topicSnippet, isProgrammatic) {
  const t = escapeHtml(topicSnippet.slice(0, 80));
  if (isProgrammatic) {
    return `
  <section class="ai-faq-block" data-ai-faq-block="1" aria-label="Common questions">
    <h2>Common questions</h2>
    <h3>Is this conversion the same for every brand?</h3>
    <p>No—brands use different lasts and fits. Use this chart as a starting point and check the brand’s own size guide when you can.</p>
    <h3>How accurate are shoe size conversions?</h3>
    <p>Standard tables map foot length across regions; real fit still varies by width, materials, and design. Measuring your foot in cm is the most reliable cross-check.</p>
    <h3>Where does the centimeter value come from?</h3>
    <p>We anchor sizes to typical foot-length ranges used in international sizing references; always measure both feet and use the longer one.</p>
  </section>`;
  }
  return `
  <section class="ai-faq-block" data-ai-faq-block="1" aria-label="Common questions">
    <h2>Common questions</h2>
    <h3>How should I use this converter?</h3>
    <p>Pick your region and size, then read the equivalents. When in doubt, measure in centimeters and compare to the brand chart.</p>
    <h3>Why do sizes differ between countries?</h3>
    <p>Each region uses its own scale; mapping through foot length (cm) reduces error.</p>
    <h3>More on ${t}</h3>
    <p>See linked guides on this site for measurement tips and regional differences.</p>
  </section>`;
}

function buildDataSourcesBlock() {
  return `
      <section class="data-sources content-section" data-data-sources="1" aria-label="Data sources">
        <h2>Data sources</h2>
        <ul>
          <li>ISO and regional footwear sizing references (length-based mapping)</li>
          <li>Published brand size charts (e.g. Nike, Adidas) for cross-checks—not endorsements</li>
          <li>International measurement and apparel sizing studies (public summaries)</li>
        </ul>
      </section>`;
}

function buildSeeAlso(relPath) {
  const cm = hrefTo(relPath, '/cm-to-us-shoe-size.html');
  const shoe = hrefTo(relPath, '/shoe-size-converter.html');
  return `<p class="ai-answer-see-also"><strong>See also:</strong> <a href="${cm}">CM to US converter</a> · <a href="${shoe}">Shoe size converter</a> · <a href="${hrefTo(relPath, '/measurement-standards.html')}">Measurement standards</a></p>`;
}

function injectAfterFirstH1InMain(html, insert) {
  const mainRe = /<main[^>]*>/i;
  const mm = html.match(mainRe);
  if (!mm) return null;
  const start = mm.index + mm[0].length;
  const slice = html.slice(start);
  const h1m = slice.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
  if (!h1m) return null;
  const pos = start + h1m.index + h1m[0].length;
  return html.slice(0, pos) + '\n' + insert + html.slice(pos);
}

function injectBeforeAeoOrMainEnd(html, block) {
  if (html.includes('data-data-sources')) return html;
  const marker = '<div class="aeo-ai-layer"';
  const idx = html.indexOf(marker);
  if (idx !== -1) {
    return html.slice(0, idx) + block + '\n\n      ' + html.slice(idx);
  }
  return html.replace(/<\/main>/i, (m) => block + '\n\n  ' + m);
}

function injectHeadParts(html, articleLd) {
  if (html.includes('data-ai-citation-ld')) return html;
  const script = `
  <script type="application/ld+json" data-ai-citation-ld="1">
${JSON.stringify(articleLd, null, 2)}
  </script>`;
  return html.replace(/<\/head>/i, script + '\n</head>');
}

function injectAuthorMeta(html, authorName) {
  if (html.includes('data-author-entity')) return html;
  const meta = `  <meta name="author" content="${escapeHtml(authorName)}" data-author-entity="1">\n`;
  return html.replace(/(<meta\s+name=["']viewport["'][^>]*>)/i, `$1\n${meta}`);
}

function buildArticleGraph({ headline, url, dateModified, authorName, faqPairs, includeFaq }) {
  const graph = [
    {
      '@type': 'Article',
      headline,
      author: { '@type': 'Organization', name: authorName },
      dateModified,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    },
  ];
  if (includeFaq && faqPairs && faqPairs.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqPairs.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    });
  }
  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

function hasFaqPageLd(html) {
  return /"@type"\s*:\s*"FAQPage"/.test(html) || /'@type'\s*:\s*'FAQPage'/.test(html);
}

function hasArticleLd(html) {
  return /"@type"\s*:\s*"Article"/.test(html) || /'@type'\s*:\s*'Article'/.test(html);
}

/** Avoid duplicate Article/FAQ when page already has full JSON-LD stack */
function shouldInjectCitationLd(html) {
  if (html.includes('data-ai-citation-ld')) return false;
  if (hasArticleLd(html) && hasFaqPageLd(html)) return false;
  return true;
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const author = JSON.parse(fs.readFileSync(AUTHOR_PATH, 'utf8'));
  const authorName = author.name;
  const today = new Date().toISOString().slice(0, 10);

  let updated = 0;
  for (const rel of walkHtmlFiles('.')) {
    if (!shouldInjectAiCitation(rel)) continue;
    const abs = path.join(ROOT, rel);
    let html = fs.readFileSync(abs, 'utf8');
    if (html.includes('data-ai-answer-block')) continue;

    const urlPath = relPathToUrlPath(rel);
    const canonical =
      html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ||
      `https://globalsizechart.com${urlPath === '/' ? '/' : urlPath}`;
    const isProgrammatic = rel.includes('programmatic-pages/');

    let answerText = isProgrammatic ? buildProgrammaticAnswer(html, rel) : buildGenericAnswer(html);
    if (!answerText) answerText = buildGenericAnswer(html);

    const title = extractTitle(html);
    const topic = title.split('|')[0].trim();

    const bodyBlock = `
        <section class="ai-answer-block" data-ai-answer-block="1" data-ai-answer="1" aria-label="Quick answer">
          <p><strong>Quick answer:</strong></p>
          <p>${escapeHtml(answerText)}</p>
          ${buildSeeAlso(rel)}
        </section>${buildFaqBlocks(topic, isProgrammatic)}`;

    let next = injectAfterFirstH1InMain(html, bodyBlock);
    if (!next) {
      console.warn('ai-answer-injector: skip (no h1 in main):', rel);
      continue;
    }
    html = next;

    html = injectBeforeAeoOrMainEnd(html, buildDataSourcesBlock());

    const faqPairs = [
      ['Is this conversion the same for every brand?', 'No—brands use different lasts and fits.'],
      ['How accurate are shoe size conversions?', 'Standard tables map foot length; fit still varies by width and design.'],
    ];
    const includeFaqGraph = !hasFaqPageLd(html);
    const articleLd = buildArticleGraph({
      headline: topic,
      url: canonical,
      dateModified: today,
      authorName,
      faqPairs,
      includeFaq: includeFaqGraph,
    });

    html = injectAuthorMeta(html, authorName);
    if (shouldInjectCitationLd(html)) {
      html = injectHeadParts(html, articleLd);
    }

    if (!dryRun) fs.writeFileSync(abs, html, 'utf8');
    updated++;
  }

  console.log('ai-answer-injector: %d pages updated%s', updated, dryRun ? ' (dry-run)' : '');
}

main();
