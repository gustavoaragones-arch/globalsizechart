#!/usr/bin/env node
/**
 * Static HTML optimizations to reduce requests and defer non-critical work:
 * - Add loading="lazy" to <img> without loading/decoding (optional: skip first N images per file)
 * - Inline linked CSS only when file size <= MAX_INLINE_CSS (default 16KB) — large shared styles.css stays external
 * - Remove <script src="..."> when the target file does not exist (broken refs)
 *
 * Skips: node_modules, .git, scripts, sitemaps, components.
 *
 * Usage:
 *   node scripts/optimize-assets.js [--dry-run] [--lazy-images] [--strip-dead-scripts] [--inline-small-css]
 * Defaults: all optimizations on except --inline-small-css (opt-in; avoids bloating every HTML with 30KB+ CSS)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', '.git', 'scripts', 'sitemaps', 'components']);

const MAX_INLINE_CSS = Number(process.env.MAX_INLINE_CSS || 16384);

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

function resolveFromHtml(htmlDir, href) {
  if (!href || /^(https?:|\/\/|data:|mailto:)/i.test(href)) return null;
  const clean = href.split('?')[0].split('#')[0];
  const abs = path.normalize(path.join(htmlDir, clean));
  if (!abs.startsWith(ROOT)) return null;
  return abs;
}

function addLazyLoading(html) {
  let n = 0;
  const out = html.replace(/<img\b([^>]*)>/gi, (full, attrs) => {
    if (/\bloading\s*=/i.test(attrs)) return full;
    n++;
    return `<img${attrs} loading="lazy">`;
  });
  return { html: out, count: n };
}

function stripDeadScripts(html, htmlDir) {
  let removed = 0;
  const out = html.replace(
    /<script\s+([^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*)>\s*<\/script>/gi,
    (full, _a, src) => {
      const abs = resolveFromHtml(htmlDir, src);
      if (abs && fs.existsSync(abs)) return full;
      if (abs && !fs.existsSync(abs)) {
        removed++;
        return '';
      }
      // external URL — keep
      return full;
    }
  );
  return { html: out, removed };
}

function inlineSmallStylesheets(html, htmlDir) {
  let inlined = 0;
  const linkRe =
    /<link\s+[^>]*rel\s*=\s*["']stylesheet["'][^>]*href\s*=\s*["']([^"']+)["'][^>]*\/?>|<link\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*rel\s*=\s*["']stylesheet["'][^>]*\/?>/gi;

  const out = html.replace(linkRe, (full, href1, href2) => {
    const href = href1 || href2;
    if (!href || /^(https?:|\/\/)/i.test(href)) return full;
    const abs = resolveFromHtml(htmlDir, href);
    if (!abs || !fs.existsSync(abs)) return full;
    const stat = fs.statSync(abs);
    if (!stat.isFile() || stat.size > MAX_INLINE_CSS) return full;
    const css = fs.readFileSync(abs, 'utf8');
    inlined++;
    const base = path.basename(abs);
    return `<style data-inlined-from="${base}">\n${css}\n</style>`;
  });
  return { html: out, inlined };
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const lazyImages = process.argv.includes('--no-lazy-images') ? false : true;
  const stripDead = process.argv.includes('--no-strip-dead-scripts') ? false : true;
  const inlineCss = process.argv.includes('--inline-small-css');

  const files = walkHtmlFiles();
  let filesChanged = 0;
  let lazyAdds = 0;
  let deadScripts = 0;
  let cssInlined = 0;

  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    const htmlDir = path.dirname(abs);
    let html = fs.readFileSync(abs, 'utf8');
    const original = html;

    if (lazyImages) {
      const r = addLazyLoading(html);
      html = r.html;
      lazyAdds += r.count;
    }
    if (stripDead) {
      const r = stripDeadScripts(html, htmlDir);
      html = r.html;
      deadScripts += r.removed;
    }
    if (inlineCss) {
      const r = inlineSmallStylesheets(html, htmlDir);
      html = r.html;
      cssInlined += r.inlined;
    }

    if (html !== original) {
      if (!dryRun) fs.writeFileSync(abs, html, 'utf8');
      filesChanged++;
    }
  }

  console.log(
    `optimize-assets: ${filesChanged} files written` +
      (dryRun ? ' (dry-run)' : '') +
      ` | lazy attrs: +${lazyAdds}, dead scripts removed: ${deadScripts}, small CSS inlined: ${cssInlined}` +
      (inlineCss ? '' : ' (use --inline-small-css to inline CSS ≤ ' + MAX_INLINE_CSS + ' bytes)')
  );
}

main();
