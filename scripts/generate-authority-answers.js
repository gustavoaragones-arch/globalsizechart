#!/usr/bin/env node
/**
 * Phase 23 — External authority seeding: Reddit- and Quora-style answers from programmatic pages.
 *
 * Outputs:
 *   authority/generated/reddit/{slug}.md
 *   authority/generated/quora/{slug}.md
 *   authority/seed-content/reddit-answers.md
 *   authority/seed-content/quora-answers.md
 *
 * Env: MAX_SEED=100 (default, max entries to process)
 *
 * Usage: node scripts/generate-authority-answers.js
 */

const fs = require('fs');
const path = require('path');
const {
  generateAnswer,
  parseConversionGuideParagraph,
  extractConversionGuideParagraph,
  extractCmFromHtml,
  decodeBasicEntities,
} = require('./lib/ai-answer-generate');

const ROOT = path.resolve(__dirname, '..');
const PROG = path.join(ROOT, 'programmatic-pages');
const OUT_REDDIT = path.join(ROOT, 'authority', 'generated', 'reddit');
const OUT_QUORA = path.join(ROOT, 'authority', 'generated', 'quora');
const SEED = path.join(ROOT, 'authority', 'seed-content');
const BASE = 'https://globalsizechart.com';

const LIMIT = Math.max(1, Math.min(Number(process.env.MAX_SEED || 100), 5000));

function listProgrammaticHtml() {
  if (!fs.existsSync(PROG)) return [];
  return fs
    .readdirSync(PROG)
    .filter((f) => f.endsWith('.html'))
    .sort()
    .slice(0, LIMIT);
}

function extractH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? decodeBasicEntities(m[1].replace(/<[^>]+>/g, '').trim()) : '';
}

function extractMetaDescription(html) {
  const m = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  return m ? decodeBasicEntities(m[1]) : '';
}

function buildFacts(html) {
  const guide = extractConversionGuideParagraph(html);
  let cm = extractCmFromHtml(html.slice(0, 15000));
  let summary = '';
  if (guide) {
    const parsed = parseConversionGuideParagraph(guide);
    if (parsed) {
      summary = generateAnswer({
        from: parsed.from,
        to: parsed.to,
        value: parsed.value,
        result: parsed.result,
        cm,
      });
    } else {
      summary = guide.replace(/\s+/g, ' ').trim();
    }
  }
  if (!summary) {
    summary = extractMetaDescription(html) || extractH1(html);
  }
  return { summary, cm: cm || null };
}

function buildQuestion(h1) {
  const clean = h1.replace(/\s*\|.*$/i, '').replace(/\s+Converter\s*$/i, '').trim();
  if (/[?]$/.test(clean)) return clean;
  return `How do I interpret ${clean} for shoe sizing?`;
}

function redditMarkdown({ slug, url, q, summary }) {
  const first = summary.split('.')[0];
  return `# ${slug} — Reddit-ready

**Thread-style Q:**
${q}

**A (casual tone — weeks 1–2: post WITHOUT links to avoid spam signals):**

${first}. I’ve found CM-based conversion is the most reliable when brands don’t match label-for-label — measure foot length and map from there.

**Source (add after week 3 on ~20–30% of posts):**
${url}

---
*Phase 23. See \`authority/REDDIT-STRATEGY.md\`.*
`;
}

function quoraMarkdown({ slug, url, q, summary }) {
  const lead = summary.endsWith('.') ? summary : `${summary}.`;
  return `# ${slug} — Quora-ready

**Question:**
${q}

**Answer (longer format; include link):**

${lead}

Sizing still varies by brand and width, so measuring foot length in centimeters and comparing to a length-based chart is more accurate than a single number alone.

**Full conversion page:**
${url}

---
*Phase 23. See \`authority/QUORA-STRATEGY.md\`.*
`;
}

function ensureDirs() {
  [OUT_REDDIT, OUT_QUORA, SEED].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

function main() {
  ensureDirs();
  const files = listProgrammaticHtml();
  const redditChunks = [];
  const quoraChunks = [];
  let n = 0;

  for (const file of files) {
    const slug = file.replace(/\.html$/, '');
    const abs = path.join(PROG, file);
    const html = fs.readFileSync(abs, 'utf8');
    const h1 = extractH1(html);
    const q = buildQuestion(h1);
    const { summary } = buildFacts(html);
    const url = `${BASE}/programmatic-pages/${file}`;

    fs.writeFileSync(
      path.join(OUT_REDDIT, `${slug}.md`),
      redditMarkdown({ slug, url, q, summary }),
      'utf8'
    );
    fs.writeFileSync(
      path.join(OUT_QUORA, `${slug}.md`),
      quoraMarkdown({ slug, url, q, summary }),
      'utf8'
    );

    redditChunks.push(
      `### Q: ${q}\n\n**A:**\n${summary}\n\nI’ve found that using a CM-based conversion is the most reliable across brands.\n\n**Source:**\n${url}\n`
    );
    quoraChunks.push(
      `### Q: ${q}\n\n**A:**\n\n${summary}\n\nHowever, sizing varies slightly by brand, so using centimeter measurements is more accurate when you can measure your foot.\n\n**Full conversion chart:**\n${url}\n`
    );
    n++;
  }

  const date = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    path.join(SEED, 'reddit-answers.md'),
    `# Reddit seed pack (combined)\n\nGenerated ${date}. **${n}** entries from programmatic conversions.\n\n**Posting:** Weeks 1–2 answer **without** links; week 3+ add source on ~20–30% of posts. See \`authority/REDDIT-STRATEGY.md\`.\n\n---\n\n${redditChunks.join('\n---\n\n')}`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(SEED, 'quora-answers.md'),
    `# Quora seed pack (combined)\n\nGenerated ${date}. **${n}** entries. Include canonical link in each answer. See \`authority/QUORA-STRATEGY.md\`.\n\n---\n\n${quoraChunks.join('\n---\n\n')}`,
    'utf8'
  );

  console.log(
    'generate-authority-answers: %d pages → authority/generated/{reddit,quora}/ + authority/seed-content/*.md',
    n
  );
}

main();
