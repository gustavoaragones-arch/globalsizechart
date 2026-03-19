#!/usr/bin/env node
/**
 * Phase 19 — AI Citation Engine (orchestrator)
 * Runs the full pipeline in order. Use: node scripts/ai-citation-engine.js
 * Or: npm run build:ai
 */
const { spawnSync } = require('child_process');
const path = require('path');

const STEPS = [
  'extract-query-patterns.js',
  'ai-signal-scoring.js',
  'generate-faqs.js',
  'optimize-answers.js',
  'internal-link-optimizer.js',
  'generate-ai-pages.js',
];

function main() {
  const root = path.resolve(__dirname, '..');
  for (const step of STEPS) {
    const script = path.join(__dirname, step);
    console.log('\n>>> %s\n', step);
    const r = spawnSync(process.execPath, [script], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env },
    });
    if (r.status !== 0) {
      console.error('ai-citation-engine: failed at %s', step);
      process.exit(r.status || 1);
    }
  }
  console.log('\n>>> Regenerating sitemaps…\n');
  const sm = spawnSync(process.execPath, [path.join(__dirname, 'generate-sitemaps.js')], {
    cwd: root,
    stdio: 'inherit',
  });
  if (sm.status !== 0) process.exit(sm.status || 1);
  console.log('\nai-citation-engine: complete.');
}

main();
