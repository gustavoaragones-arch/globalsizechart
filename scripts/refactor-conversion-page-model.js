#!/usr/bin/env node
/**
 * One-shot migration: unified conversion page model (no Quick answer block,
 * single FAQ styling, card grids for nav link lists, why-vary info cards).
 *
 *   node scripts/refactor-conversion-page-model.js
 *   node scripts/refactor-conversion-page-model.js --dry-run
 */

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry-run");

const PREFIXES = [
  "programmatic-pages/",
  "measurement/",
  "clothing/",
  "shoe-size-conversion-chart/",
  "us/",
  "uk/",
  "eu/",
  "ca/",
];

const ROOT_FILES = new Set(["shoe-size-converter.html", "clothing-size-converter.html"]);

const THIN_WHY_RE =
  /<section class="why-sizes-vary content-section"[^>]*aria-labelledby="aeo-why-h2"[^>]*>\s*<h2 id="aeo-why-h2">Why Sizes May Vary<\/h2>\s*<p>Shoe and clothing sizes can vary between brands due to manufacturing differences, materials, and regional sizing standards\.<\/p>\s*<\/section>/gi;

const WHY_VARY_REPLACE = `<section class="content-section why-vary-cards" aria-labelledby="aeo-why-h2">
        <h2 id="aeo-why-h2">Why sizes don’t line up everywhere</h2>
        <div class="card-grid">
          <article class="info-card">
            <h3>Different scales</h3>
            <p>US, UK, EU, and JP labels rarely describe the same foot length in millimeters.</p>
          </article>
          <article class="info-card">
            <h3>Brand lasts</h3>
            <p>Two brands can label the same length differently based on shape and materials.</p>
          </article>
          <article class="info-card">
            <h3>Use centimeters</h3>
            <p>Measuring both feet in cm is the most reliable way to cross-check any chart.</p>
          </article>
        </div>
      </section>`;

function walkHtml(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".git") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtml(full, out);
    else if (ent.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function shouldProcess(abs) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, "/");
  if (rel.includes("/legal/") || rel.startsWith("components/")) return false;
  if (ROOT_FILES.has(rel)) return true;
  return PREFIXES.some((p) => rel.startsWith(p));
}

function ulToNavGrid($, $ul) {
  const $grid = $('<div class="card-grid nav-card-grid"></div>');
  $ul.find("> li > a").each((_, a) => {
    const $a = $(a);
    const href = $a.attr("href") || "#";
    const $tile = $("<a></a>").addClass("nav-card").attr("href", href);
    $tile.append($("<span></span>").addClass("nav-card__label").text($a.text().trim() || "Open"));
    $grid.append($tile);
  });
  if ($grid.children().length) $ul.replaceWith($grid);
}

function processHtml(html) {
  const $ = cheerio.load(html, { decodeEntities: false });
  let changed = false;

  if ($("section.ai-answer-block").length) {
    $("section.ai-answer-block").remove();
    changed = true;
  }

  if ($("section[data-ai-faq-block]").length) {
    $("section[data-ai-faq-block]").remove();
    changed = true;
  }

  if ($("section#faq").length && $("section.ai-faq-expansion").length) {
    $("section.ai-faq-expansion").remove();
    changed = true;
  }

  if ($("section#faq").length && $("#aeo-faq-block").length) {
    $("#aeo-faq-block").remove();
    changed = true;
  }

  $("section.region-converters-block ul.hub-links").each((_, el) => {
    ulToNavGrid($, $(el));
    changed = true;
  });

  $("section.authority-links-block ul.hub-links").each((_, el) => {
    ulToNavGrid($, $(el));
    changed = true;
  });

  $("ul.session-depth-links, ul.next-step__links, ul.conversion-loop__links").each((_, el) => {
    ulToNavGrid($, $(el));
    changed = true;
  });

  $("section#faq").each((_, el) => {
    const $s = $(el);
    if (!$s.hasClass("faq-section--cards")) {
      $s.addClass("faq-section--cards");
      changed = true;
    }
  });

  $("h3.next-step__title").each((_, el) => {
    const $h = $(el);
    if ($h.text().trim() === "Similar garment") {
      $h.text("Men's, women's & kids'");
      changed = true;
    }
  });

  $("section.region-converters-block > h2").each((_, el) => {
    const $h = $(el);
    if ($h.text().trim() === "Region Converters") {
      $h.text("Regional & conversion pages");
      changed = true;
    }
  });

  $("section.authority-links-block > h2").each((_, el) => {
    const $h = $(el);
    if ($h.text().trim() === "Authority Links") {
      $h.text("Key navigation");
      changed = true;
    }
  });

  let out = $.root().html();
  if (!out) return { html, changed: false };

  const next = out.replace(THIN_WHY_RE, () => {
    changed = true;
    return WHY_VARY_REPLACE;
  });
  if (next !== out) out = next;

  const dt = html.match(/^<!DOCTYPE[^>]*>\s*/i);
  if (dt && !String(out).trim().toLowerCase().startsWith("<!doctype")) {
    out = dt[0] + out;
  }

  return { html: out, changed };
}

function main() {
  const files = walkHtml(ROOT).filter(shouldProcess);
  let n = 0;
  for (const abs of files) {
    const rel = path.relative(ROOT, abs);
    let html = fs.readFileSync(abs, "utf8");
    if (!html.includes("<body")) continue;
    const { html: next, changed } = processHtml(html);
    if (!changed) continue;
    n++;
    if (!DRY) fs.writeFileSync(abs, next, "utf8");
  }
  console.log("refactor-conversion-page-model: updated %d files%s", n, DRY ? " (dry-run)" : "");
}

main();
