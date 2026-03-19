#!/usr/bin/env node
/**
 * Phase 19 — AI Citation Signal Scoring
 * Scores each page for citation-readiness; writes /data/ai-signals.json
 */
const fs = require('fs');
const path = require('path');
const { ROOT, walkHtmlFiles, relPathToUrlPath } = require('./lib/ai-engine-utils');

const OUT = path.join(ROOT, 'data', 'ai-signals.json');

function scorePage(html) {
  let score = 0;
  const reasons = [];

  if (/faq-block|faq-section|id=["']faq["']|class=["'][^"']*faq-item/.test(html)) {
    score += 2;
    reasons.push('faq_block');
  }
  if (/class=["'][^"']*ai-answer|class=["']ai-answer/.test(html)) {
    score += 3;
    reasons.push('ai_answer');
  }
  if (/<table[\s>]/.test(html)) {
    score += 1;
    reasons.push('table');
  }
  const hrefCount = (html.match(/<a\s+[^>]*href=["']([^"']+)["']/gi) || []).length;
  if (hrefCount >= 5) {
    score += 1;
    reasons.push('internal_links');
  }
  const hasFaqSchema = /"FAQPage"|'FAQPage'/.test(html);
  const hasArticleSchema = /"Article"|'Article'/.test(html) && /application\/ld\+json/.test(html);
  if (hasFaqSchema && hasArticleSchema) {
    score += 2;
    reasons.push('faq_article_schema');
  } else if (hasFaqSchema || hasArticleSchema) {
    score += 1;
    reasons.push('partial_schema');
  }

  let status = 'low-citation-probability';
  if (score >= 8) status = 'high-citation-probability';
  else if (score >= 5) status = 'medium-citation-probability';

  return { score, status, reasons };
}

function main() {
  const pages = {};
  for (const rel of walkHtmlFiles('.')) {
    const full = path.join(ROOT, rel);
    let html;
    try {
      html = fs.readFileSync(full, 'utf8');
    } catch {
      continue;
    }
    const urlPath = relPathToUrlPath(rel);
    const { score, status, reasons } = scorePage(html);
    pages[urlPath] = {
      score,
      status,
      reasons,
      file: rel.replace(/\\/g, '/'),
    };
  }

  const payload = {
    pages,
    generatedAt: new Date().toISOString(),
    version: 1,
    summary: {
      high: Object.values(pages).filter((p) => p.status === 'high-citation-probability').length,
      medium: Object.values(pages).filter((p) => p.status === 'medium-citation-probability').length,
      low: Object.values(pages).filter((p) => p.status === 'low-citation-probability').length,
    },
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), 'utf8');
  console.log(
    'ai-signal-scoring: %d pages, high=%d medium=%d low=%d → %s',
    Object.keys(pages).length,
    payload.summary.high,
    payload.summary.medium,
    payload.summary.low,
    OUT
  );
}

main();
