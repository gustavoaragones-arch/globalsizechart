#!/usr/bin/env node
/**
 * Phase 21 — Crawl priority internal links
 * Injects "Popular conversions" block at top of <main> and before </footer> on all HTML pages.
 * Idempotent via data-crawl-priority-links.
 *
 * Usage: node scripts/internal-link-injector.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components']);

const TARGETS = [
  { path: '/shoe-size-converter.html', label: 'Shoe Size Converter' },
  { path: '/us-to-eu-size.html', label: 'US to EU Size' },
  { path: '/cm-to-us-shoe-size.html', label: 'CM to US Shoe Size' },
  { path: '/shoe-size-conversions/', label: 'Shoe size conversions' },
];

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

/** Relative href from current HTML file to site-root path like /foo.html or /dir/ */
function hrefTo(fromRel, toUrlPath) {
  const fromDir = path.dirname(path.join(ROOT, fromRel));
  let toFull;
  if (toUrlPath.endsWith('/')) {
    const seg = toUrlPath.replace(/^\//, '').replace(/\/$/, '');
    toFull = path.join(ROOT, seg, 'index.html');
  } else {
    toFull = path.join(ROOT, toUrlPath.replace(/^\//, ''));
  }
  if (!fs.existsSync(toFull)) {
    return toUrlPath.startsWith('/') ? `.${toUrlPath}` : toUrlPath;
  }
  let r = path.relative(fromDir, toFull);
  r = r.replace(/\\/g, '/');
  if (!r.startsWith('.')) r = `./${r}`;
  return r;
}

function injectForFile(rel) {
  const hrefs = TARGETS.map((t) => ({ ...t, href: hrefTo(rel, t.path) }));
  const mainItems = hrefs
    .map((t) => `    <li><a href="${t.href}">${t.label}</a></li>`)
    .join('\n');
  const footerItems = hrefs
    .map((t) => `    <li><a href="${t.href}">${t.label}</a></li>`)
    .join('\n');

  const mainBlock = `
  <section class="crawl-priority-links crawl-priority-links--main" data-crawl-priority-links="main" aria-label="Popular conversions">
    <h2>Popular conversions</h2>
    <ul>
${mainItems}
    </ul>
  </section>`;

  const footerBlock = `
  <section class="crawl-priority-links crawl-priority-links--footer" data-crawl-priority-links="footer" aria-label="Popular conversions">
    <h2>Popular conversions</h2>
    <ul>
${footerItems}
    </ul>
  </section>`;

  return { mainBlock, footerBlock };
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  let n = 0;
  for (const rel of walkHtmlFiles('.')) {
    const abs = path.join(ROOT, rel);
    let html = fs.readFileSync(abs, 'utf8');
    if (html.includes('data-crawl-priority-links=')) continue;

    const { mainBlock, footerBlock } = injectForFile(rel);

    if (!html.includes('<main')) continue;

    if (/<main[^>]*>/i.test(html)) {
      html = html.replace(/<main([^>]*)>/i, '<main$1>' + mainBlock);
    } else {
      continue;
    }

    if (/<\/footer>/i.test(html)) {
      html = html.replace(/<\/footer>/i, footerBlock + '\n  </footer>');
    } else {
      if (!dryRun) {
        console.warn('internal-link-injector: no </footer> in', rel);
      }
    }

    if (!dryRun) fs.writeFileSync(abs, html, 'utf8');
    n++;
  }
  console.log('internal-link-injector: %d pages updated%s', n, dryRun ? ' (dry-run)' : '');
}

main();
