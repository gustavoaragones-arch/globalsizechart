#!/usr/bin/env node
/**
 * Phase 19 — Internal link booster
 * Injects a "Related (high-value)" block with links toward top-scoring URLs from ai-signals.json.
 * Targets pages with score < 6; skips if data-internal-link-boost present.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, walkHtmlFiles, relPathToUrlPath } = require('./lib/ai-engine-utils');

const SIGNALS = path.join(ROOT, 'data', 'ai-signals.json');

function hrefFromTo(fromRel, toUrlPath) {
  const toRel = toUrlPath.replace(/^\//, '');
  const fromDir = path.dirname(path.join(ROOT, fromRel));
  const toFull = path.join(ROOT, toRel);
  let r = path.relative(fromDir, toFull);
  r = r.replace(/\\/g, '/');
  if (!r.startsWith('.')) r = './' + r;
  return r;
}

function anchorText(urlPath) {
  const base = urlPath.replace(/^\//, '').replace(/\.html$/, '').replace(/\//g, ' ');
  return base.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 60);
}

function main() {
  if (!fs.existsSync(SIGNALS)) {
    console.error('internal-link-optimizer: missing %s — run ai-signal-scoring.js first', SIGNALS);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(SIGNALS, 'utf8'));
  const entries = Object.entries(data.pages || {}).sort((a, b) => b[1].score - a[1].score);
  let top = entries
    .filter(([, v]) => v.score >= 8)
    .slice(0, 8)
    .map(([url]) => url);

  if (top.length === 0) {
    top = entries.slice(0, 5).map(([url]) => url);
  }

  let n = 0;
  for (const rel of walkHtmlFiles('.')) {
    const full = path.join(ROOT, rel);
    let html = fs.readFileSync(full, 'utf8');
    if (html.includes('data-internal-link-boost')) continue;

    const urlPath = relPathToUrlPath(rel);
    const info = data.pages[urlPath];
    if (!info || info.score > 7) continue;

    const targets = top.filter((u) => u !== urlPath).slice(0, 3);
    if (targets.length === 0) continue;

    const links = targets
      .map((t) => `<a href="${hrefFromTo(rel, t)}">${anchorText(t)}</a>`)
      .join(' · ');

    const block = `
      <section class="content-section internal-link-boost" data-internal-link-boost="true" aria-label="Related high-value pages">
        <h2>Related</h2>
        <p>High-traffic reference pages: ${links}</p>
      </section>`;

    if (!html.includes('</main>')) continue;
    html = html.replace(/<\/main>/i, `${block}\n  </main>`);
    fs.writeFileSync(full, html, 'utf8');
    n++;
  }
  console.log('internal-link-optimizer: injected boost block into %d low-score pages', n);
}

main();
