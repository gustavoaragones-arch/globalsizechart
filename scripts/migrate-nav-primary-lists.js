#!/usr/bin/env node
/**
 * Replace list-based nav blocks (gender charts + regional hub) with card-grid nav-primary.
 * Structure matches product spec; hrefs use live site paths (see constants).
 *
 *   node scripts/migrate-nav-primary-lists.js
 *   node scripts/migrate-nav-primary-lists.js --dry-run
 */

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry-run");

const IGNORE = new Set(["node_modules", ".git", "scripts", "sitemaps", "components"]);

const GENDER_SNIPPET = `
<section class="card-grid nav-primary">
  <a class="card" href="/mens-shoe-size-chart/">
    <h3>Men's sizes</h3>
    <p>View full men's size conversions.</p>
  </a>

  <a class="card" href="/womens-shoe-size-chart/">
    <h3>Women's sizes</h3>
    <p>Explore women's size charts.</p>
  </a>

  <a class="card" href="/kids-shoe-size-chart/">
    <h3>Kids' sizes</h3>
    <p>Find accurate sizing for children.</p>
  </a>
</section>`;

const REGIONAL_SNIPPET = `
<section class="card-grid nav-primary">
  <a class="card" href="/us/">
    <h3>US sizing</h3>
  </a>

  <a class="card" href="/uk/">
    <h3>UK sizing</h3>
  </a>

  <a class="card" href="/eu/">
    <h3>EU sizing</h3>
  </a>

  <a class="card" href="/shoe-size-pages.html">
    <h3>All size pages</h3>
  </a>
</section>`;

function walkHtml(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtml(full, out);
    else if (ent.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function normTitle(t) {
  return String(t).replace(/\s+/g, " ").trim();
}

function processHtml(html) {
  const $ = cheerio.load(html, { decodeEntities: false });
  let changed = false;

  $("section").each((_, el) => {
    const $sec = $(el);
    const $h2 = $sec.children("h2").first();
    if (!$h2.length) return;
    if (!$sec.find("ul").length) return;

    const title = normTitle($h2.text());

    const isGender =
      title.includes("Men's") &&
      title.includes("Women's") &&
      title.includes("Kids'") &&
      title.toLowerCase().includes("shoe size chart");

    const isRegional =
      title.includes("Regional") && title.includes("Conversion") && title.includes("Pages");

    if (!isGender && !isRegional) return;

    $sec.replaceWith((isGender ? GENDER_SNIPPET : REGIONAL_SNIPPET).trim());
    changed = true;
  });

  if (!changed) return { html, changed: false };

  let out = $.root().html();
  const dt = html.match(/^<!DOCTYPE[^>]*>\s*/i);
  if (dt && out && !String(out).trim().toLowerCase().startsWith("<!doctype")) {
    out = dt[0] + out;
  }
  return { html: out || html, changed: true };
}

function main() {
  const files = walkHtml(ROOT);
  let n = 0;
  for (const abs of files) {
    const html = fs.readFileSync(abs, "utf8");
    if (!html.includes("<body")) continue;
    const { html: next, changed } = processHtml(html);
    if (!changed) continue;
    n++;
    if (!DRY) fs.writeFileSync(abs, next, "utf8");
  }
  console.log("migrate-nav-primary-lists: updated %d files%s", n, DRY ? " (dry-run)" : "");
}

main();
