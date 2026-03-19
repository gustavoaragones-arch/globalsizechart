#!/usr/bin/env node
/**
 * Phase 19 — Answer optimization
 * Replaces long first paragraph in .ai-answer with a concise line (≤25 words) when possible.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, walkHtmlFiles } = require('./lib/ai-engine-utils');

function wordCount(s) {
  return s.replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(Boolean).length;
}

function buildShortAnswer(rel) {
  const norm = rel.replace(/\\/g, '/');
  const m = norm.match(/eu-(\d+(?:\.\d+)?)-to-us-shoe-size/i);
  if (m) return `EU ${m[1]} equals US men’s size 9 on typical men’s charts; women’s and kids’ scales differ.`;
  const uk = norm.match(/uk-(\d+(?:\.\d+)?)-to-us-shoe-size/i);
  if (uk) return `UK ${uk[1]} maps to the closest US size by foot length; confirm gender in the converter.`;
  const us = norm.match(/us-(\d+(?:\.\d+)?)-to-uk-shoe-size/i);
  if (us) return `US ${us[1]} maps to the closest UK size by foot length; confirm gender in the converter.`;
  const cm = norm.match(/cm-([\d.]+)-to-us-shoe-size/i);
  if (cm) return `${cm[1]} cm maps to a US label via length; brand fit may still vary.`;
  return null;
}

function optimizeHtml(html, rel) {
  if (!/class="[^"]*ai-answer/.test(html)) return html;
  if (html.includes('data-ai-answer-optimized="true"')) return html;

  const short = buildShortAnswer(rel);
  if (!short) return html;

  const secRe = /(<section\b[^>]*\bclass="[^"]*ai-answer[^"]*"[^>]*)(>[\s\S]*?<\/section>)/i;
  const m = html.match(secRe);
  if (!m) return html;
  const inner = m[2];
  const pMatch = inner.match(/(<p\b[^>]*>)([\s\S]*?)(<\/p>)/i);
  if (!pMatch) return html;
  if (wordCount(pMatch[2]) <= 25) return html;

  const newOpen = m[1].includes('data-ai-answer-optimized')
    ? m[1]
    : m[1].replace(/>$/, ' data-ai-answer-optimized="true">');
  const newInner = inner.replace(
    /(<p\b[^>]*>)([\s\S]*?)(<\/p>)/i,
    `$1${short}$3`
  );
  return html.replace(secRe, newOpen + newInner);
}

function main() {
  let n = 0;
  for (const rel of walkHtmlFiles('.')) {
    const full = path.join(ROOT, rel);
    let html = fs.readFileSync(full, 'utf8');
    const next = optimizeHtml(html, rel);
    if (next !== html) {
      fs.writeFileSync(full, next, 'utf8');
      n++;
    }
  }
  console.log('optimize-answers: updated %d pages', n);
}

main();
