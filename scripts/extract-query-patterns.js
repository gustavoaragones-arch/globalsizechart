#!/usr/bin/env node
/**
 * Phase 19 — Query Pattern Harvester
 * Scans HTML pages; extracts titles, H2/H3 text, FAQ question headings.
 * Outputs normalized, deduplicated patterns to /data/query-patterns.json
 */
const fs = require('fs');
const path = require('path');
const { ROOT, walkHtmlFiles, normalizePattern, stripTags } = require('./lib/ai-engine-utils');

const OUT = path.join(ROOT, 'data', 'query-patterns.json');

function extractFromHtml(html) {
  const patterns = new Set();

  const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleM) {
    const t = normalizePattern(stripTags(titleM[1]));
    if (t.length > 3) patterns.add(t);
  }

  const h2h3 = html.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi);
  for (const m of h2h3) {
    const t = normalizePattern(stripTags(m[1]));
    if (t.length > 5 && t.length < 200) patterns.add(t);
  }

  const faqItems = html.matchAll(/<div[^>]*class="[^"]*faq-item[^"]*"[^>]*>[\s\S]*?<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi);
  for (const m of faqItems) {
    const t = normalizePattern(stripTags(m[1]));
    if (t.length > 5 && t.length < 200) patterns.add(t);
  }

  const faqSectionH3 = html.matchAll(/<section[^>]*class="[^"]*faq[^"]*"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/gi);
  for (const m of faqSectionH3) {
    const t = normalizePattern(stripTags(m[1]));
    if (t.length > 5 && t.length < 200) patterns.add(t);
  }

  return patterns;
}

function main() {
  const all = new Set();
  for (const rel of walkHtmlFiles('.')) {
    const full = path.join(ROOT, rel);
    let html;
    try {
      html = fs.readFileSync(full, 'utf8');
    } catch {
      continue;
    }
    extractFromHtml(html).forEach((p) => all.add(p));
  }

  const patterns = [...all].sort((a, b) => a.localeCompare(b));
  const payload = {
    patterns,
    generatedAt: new Date().toISOString(),
    version: 1,
    count: patterns.length,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), 'utf8');
  console.log('extract-query-patterns: %d unique patterns → %s', patterns.length, OUT);
}

main();
