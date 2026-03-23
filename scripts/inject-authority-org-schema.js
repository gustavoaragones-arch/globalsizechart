#!/usr/bin/env node
/**
 * Phase 23 — Inject Organization JSON-LD with sameAs (Reddit / Quora placeholders).
 * Skips pages that already include data-authority-org-global.
 *
 * Edit placeholders in ORG_JSON below, then run:
 *   node scripts/inject-authority-org-schema.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components', 'authority/generated']);

/** Supplemental org node (sameAs / social). Replace placeholders before deploy. No @id to avoid colliding with existing #organization blocks. */
const ORG_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'GlobalSizeChart',
  url: 'https://globalsizechart.com',
  logo: 'https://globalsizechart.com/logo.png',
  sameAs: [
    'https://www.reddit.com/user/REPLACE_WITH_YOUR_REDDIT_USERNAME',
    'https://www.quora.com/profile/REPLACE_WITH_YOUR_QUORA_PROFILE',
  ],
};

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

function main() {
  const dry = process.argv.includes('--dry-run');
  const scriptTag = `
  <script type="application/ld+json" data-authority-org-global="1">
  ${JSON.stringify(ORG_LD, null, 2)}
  </script>`;

  let n = 0;
  for (const rel of walkHtmlFiles('.')) {
    const abs = path.join(ROOT, rel);
    let html = fs.readFileSync(abs, 'utf8');
    if (html.includes('data-authority-org-global')) continue;
    if (html.includes('data-authority-sameas')) continue;
    html = html.replace(/<\/head>/i, scriptTag + '\n</head>');
    if (!dry) fs.writeFileSync(abs, html, 'utf8');
    n++;
  }
  console.log('inject-authority-org-schema: %d pages updated%s', n, dry ? ' (dry-run)' : '');
}

main();
