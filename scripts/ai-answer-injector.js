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
const { decodeBasicEntities } = require('./lib/ai-answer-generate');

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
    if (html.includes('data-data-sources')) continue;

    const urlPath = relPathToUrlPath(rel);
    const canonical =
      html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ||
      `https://globalsizechart.com${urlPath === '/' ? '/' : urlPath}`;
    const title = extractTitle(html);
    const topic = title.split('|')[0].trim();

    /* Page model: no separate "Quick answer" block — lead stays in intro / meta only. */
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
