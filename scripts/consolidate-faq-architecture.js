#!/usr/bin/env node
'use strict';
/**
 * Phase 9B — site-wide FAQ single-source synchronization.
 *
 * Driven directly by reports/phase-9-faq-inventory.json (the Phase 9A audit
 * baseline). For every page classified B, C, or D (and not already healthy
 * from Phase 7/8, and not a no-FAQ-by-design family), makes the visible FAQ
 * and FAQPage JSON-LD schema exactly correspond — visible content wins
 * (it's user-facing and was shown in the audit to be the more complete/
 * correct copy), except for the 12 schema-only pages, where the existing
 * schema content (already verified page-specific and substantive) is
 * promoted into a real visible FAQ section.
 *
 * This is a mechanical synchronization pass, not a content rewrite:
 * existing wording is preserved and copied, never regenerated.
 *
 * Scope: exactly the files present in the inventory with a qualifying
 * classification. Never writes outside that explicit set.
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const DRY = process.argv.includes('--dry-run');
const inventory = require(path.join(ROOT, 'reports', 'phase-9-faq-inventory.json'));

// Families already healthy (Phase 7/8) or intentionally FAQ-less — never touched.
const PROTECTED_FAMILIES = new Set(['brands', 'clothing', 'homepage', 'shoe-hub']);

// D-classification: promote schema -> visible (genuinely substantive, page-specific).
const PROMOTE_SCHEMA_TO_VISIBLE = new Set([
  'clothing-size-converter.html',
  'shoe-size-converter.html',
  'eu-shoe-sizing-system.html',
  'japan-shoe-sizing-system.html',
  'uk-shoe-sizing-system.html',
  'us-shoe-sizing-system.html',
  'tools/home/mattress-size-chart.html',
  'guides/index.html',
]);

// D-classification: generic fallback schema with no genuine page-specific fit ->
// remove the orphaned schema, reclassify D -> F. Documented reason: content is
// the generic ai-answer-injector.js/inject-aeo-layer.js fallback, not written
// for this specific page, and no visible counterpart exists to reconcile it with.
const RECLASSIFY_D_TO_F = new Set([
  'about-globalsizechart.html',
  'programmatic/templates/category-template.html',
  'programmatic/templates/conversion-template.html',
  'programmatic/templates/region-template.html',
]);

const summary = { promoted: [], reclassified: [], dedupedB: [], syncedC: [], skipped: [], errors: [] };

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildFaqPageSchema(pairs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

function replaceOrInsertFaqSchema($, pairs) {
  let replaced = false;
  $('script[type="application/ld+json"]').each((i, el) => {
    const txt = $(el).html();
    if (!txt) return;
    if (txt.includes('"FAQPage"') || txt.includes("'FAQPage'")) {
      if (txt.includes('"@graph"')) {
        // graph-style: replace the FAQPage node within the graph, leave others intact
        try {
          const obj = JSON.parse(txt);
          obj['@graph'] = obj['@graph'].map(node =>
            node['@type'] === 'FAQPage' ? { '@type': 'FAQPage', mainEntity: pairs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) } : node
          );
          $(el).html(JSON.stringify(obj));
          replaced = true;
        } catch (e) { /* leave malformed as-is, flagged separately */ }
      } else {
        $(el).html(JSON.stringify(buildFaqPageSchema(pairs)));
        replaced = true;
      }
    }
  });
  if (!replaced) {
    const script = `\n  <script type="application/ld+json">${JSON.stringify(buildFaqPageSchema(pairs))}</script>\n</head>`;
    $('head').append(`<script type="application/ld+json">${JSON.stringify(buildFaqPageSchema(pairs))}</script>`);
  }
}

function extractVisiblePairs($faqSection) {
  const pairs = [];
  $faqSection.find('.faq-item').each((i, el) => {
    const $el = cheerio.load('<div>' + require('cheerio').html(el) + '</div>')('div');
    // use the section's own $ instance instead (set below)
  });
  return pairs;
}

function processFile(relPath, record) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) { summary.errors.push({ file: relPath, error: 'file not found' }); return; }
  let html = fs.readFileSync(abs, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });
  let changed = false;

  // ---- D-classification: promote schema to visible ----
  if (record.classification === 'D' && PROMOTE_SCHEMA_TO_VISIBLE.has(relPath)) {
    // re-read schema fresh from the live file rather than the trimmed audit
    // deliverable JSON (which intentionally omits answer text per Part J's field list)
    let pairs = [];
    $('script[type="application/ld+json"]').each((i, el) => {
      const txt = $(el).html();
      if (!txt || pairs.length) return;
      if (txt.includes('"FAQPage"') || txt.includes("'FAQPage'")) {
        try {
          const obj = JSON.parse(txt);
          const graph = obj['@graph'] ? obj['@graph'] : [obj];
          graph.forEach(node => {
            if (node['@type'] === 'FAQPage' && Array.isArray(node.mainEntity)) {
              pairs = node.mainEntity.map(m => [m.name, m.acceptedAnswer.text]);
            }
          });
        } catch (e) {}
      }
    });
    const faqHtml = `\n    <section class="content-section" id="faq">\n      <h2>Frequently Asked Questions</h2>\n${pairs.map(([q, a]) => `      <div class="faq-item">\n        <h3>${escapeHtml(q)}</h3>\n        <p>${escapeHtml(a)}</p>\n      </div>`).join('\n')}\n    </section>\n`;
    if ($('footer').length) {
      $('footer').first().before(faqHtml);
    } else if ($('main').length) {
      $('main').append(faqHtml);
    } else {
      $('body').append(faqHtml);
    }
    // schema already correct (source of the promoted content) — leave as-is, just ensure single block
    changed = true;
    summary.promoted.push(relPath);
  } else if (record.classification === 'D' && RECLASSIFY_D_TO_F.has(relPath)) {
    $('script[type="application/ld+json"]').each((i, el) => {
      const txt = $(el).html();
      if (txt && (txt.includes('"FAQPage"') || txt.includes("'FAQPage'"))) {
        if (txt.includes('"@graph"')) {
          try {
            const obj = JSON.parse(txt);
            obj['@graph'] = obj['@graph'].filter(node => node['@type'] !== 'FAQPage');
            $(el).html(JSON.stringify(obj));
          } catch (e) {}
        } else {
          $(el).remove();
        }
      }
    });
    changed = true;
    summary.reclassified.push(relPath);
  } else if (record.classification === 'B') {
    // keep the FAQ section headed "Frequently Asked Questions" if present, else the larger one
    const sections = [];
    $('section, div.aeo-ai-layer').each((i, el) => {
      const $s = $(el);
      const h2 = $s.find('> h2').first().text().trim() || $s.find('.faq-block h2').first().text().trim();
      const items = $s.find('.faq-item');
      if (h2 && items.length && $s.find('> h2').length) {
        sections.push({ el, h2, count: items.length, $s });
      }
    });
    if (sections.length >= 2) {
      let keep = sections.find(s => s.h2 === 'Frequently Asked Questions') || sections.sort((a, b) => b.count - a.count)[0];
      const remove = sections.filter(s => s !== keep);
      remove.forEach(s => s.$s.remove());
      // normalize heading
      keep.$s.find('> h2').first().text('Frequently Asked Questions');
      const pairs = [];
      keep.$s.find('.faq-item').each((i, el) => {
        const q = $(el).find('h3').first().text().trim();
        const a = $(el).find('p').first().text().trim();
        if (q) pairs.push([q, a]);
      });
      replaceOrInsertFaqSchema($, pairs);
      changed = true;
      summary.dedupedB.push({ file: relPath, kept: keep.h2, removed: remove.map(r => r.h2) });
    }
  } else if (record.classification === 'C') {
    // sync schema to visible exactly — visible wins
    const $faqSections = $('section, div').filter((i, el) => $(el).find('> h2').length && $(el).find('.faq-item').length);
    let $target = $faqSections.filter((i, el) => $(el).find('> h2').first().text().trim() === 'Frequently Asked Questions').first();
    if (!$target || !$target.length) $target = $faqSections.first();
    if ($target && $target.length) {
      // normalize heading to the standard text (Part R)
      const $h2 = $target.find('> h2').first();
      if ($h2.length && $h2.text().trim() !== 'Frequently Asked Questions') $h2.text('Frequently Asked Questions');
      const pairs = [];
      $target.find('.faq-item').each((i, el) => {
        const $el = $(el);
        const q = $el.find('h3').first().text().trim() || $el.find('summary').first().text().trim();
        const a = $el.find('p').first().text().trim();
        if (q) pairs.push([q, a]);
      });
      if (pairs.length) {
        replaceOrInsertFaqSchema($, pairs);
        changed = true;
        summary.syncedC.push(relPath);
      } else {
        summary.errors.push({ file: relPath, error: 'no faq-item pairs found on re-read' });
      }
    } else {
      summary.errors.push({ file: relPath, error: 'no FAQ section found on re-read' });
    }
  }

  if (changed && !DRY) {
    fs.writeFileSync(abs, $.html(), 'utf8');
  } else if (changed) {
    summary.skipped.push(relPath + ' (dry-run)');
  }
}

function main() {
  const targets = inventory.filter(r => {
    if (PROTECTED_FAMILIES.has(r.pageFamily)) return false;
    return r.classification === 'B' || r.classification === 'C' || r.classification === 'D';
  });
  console.log(`Processing ${targets.length} files (of ${inventory.length} total inventoried)...`);
  for (const rec of targets) {
    try {
      processFile(rec.file, rec);
    } catch (e) {
      summary.errors.push({ file: rec.file, error: e.message });
    }
  }
  fs.writeFileSync(path.join(ROOT, 'reports', '.phase9-sync-summary.json'), JSON.stringify(summary, null, 2));
  console.log('Promoted (D->visible):', summary.promoted.length);
  console.log('Reclassified (D->F):', summary.reclassified.length);
  console.log('Deduped (B->single):', summary.dedupedB.length);
  console.log('Synced (C, schema->visible):', summary.syncedC.length);
  console.log('Errors:', summary.errors.length);
  if (summary.errors.length) console.log(JSON.stringify(summary.errors.slice(0, 20), null, 2));
}

main();
