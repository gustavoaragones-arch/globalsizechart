#!/usr/bin/env node
/**
 * Wrap h1 + intro + converter into <section class="hero-tool"> with
 * <p class="lead"> and <div class="converter-wrapper"><div class="converter-card">…</div></div>.
 *
 *   node scripts/migrate-hero-tool.js
 *   node scripts/migrate-hero-tool.js --dry-run
 */

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry-run");

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "scripts",
  "sitemaps",
  "components",
]);

function walkHtml(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtml(full, out);
    else if (ent.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function stripRedundantToolHeading($, $root) {
  $root.find("> h2").each((_, el) => {
    const t = $(el).text().trim().toLowerCase();
    if (
      (t.includes("interactive") && t.includes("converter")) ||
      t === "size converter"
    ) {
      $(el).remove();
    }
  });
}

/** Home hub: section.hero > .container > h1 + intro ps + section.converter-card. */
function migrateHeroNestedConverter($) {
  const $main = $("main").first();
  if (!$main.length || $main.find("section.hero-tool").length) return false;

  const $hero = $main.children("section.hero").first();
  if (!$hero.length) return false;

  const $inner = $hero.children("div.container").first();
  if (!$inner.length) return false;

  const $card = $inner.children("section.converter-card").first();
  if (!$card.length) return false;

  const $heroTool = $('<section class="hero-tool"></section>');
  const prevs = $card
    .prevAll()
    .toArray()
    .reverse()
    .filter((el) => el.type === "tag");
  for (const el of prevs) {
    $heroTool.append($(el));
  }

  const $firstLead = $heroTool.children("p").first();
  if ($firstLead.length) {
    $firstLead.removeClass("muted").addClass("lead");
  }

  stripRedundantToolHeading($, $card);

  const $wrap = $('<div class="converter-wrapper"></div>');
  const $innerCard = $('<div class="converter-card"></div>');
  while ($card.contents().length) {
    const n = $card.contents().first();
    if (n[0] && n[0].type === "text" && !String(n[0].data).trim()) {
      n.remove();
      continue;
    }
    $innerCard.append(n);
  }
  $wrap.append($innerCard);
  $heroTool.append($wrap);
  $card.remove();

  const $newOuter = $('<div class="container"></div>').append($heroTool);
  $hero.replaceWith($newOuter);
  return true;
}

/** Region hub: section.hero (h1) + div.container > converter-card (h2 + form). */
function migrateRegionHub($) {
  const $main = $("main").first();
  if (!$main.length) return false;
  if ($main.find("section.hero-tool").length) return false;

  const $heroBlock = $main.children("section.hero").first();
  const $container = $main
    .children("div.container")
    .filter((_, el) => $(el).children("section.converter-card").length > 0)
    .first();
  if (!$heroBlock.length || !$container.length) return false;

  const $card = $container.children("section.converter-card").first();
  if (!$card.length) return false;
  const $h1 = $heroBlock.find("h1").first();
  if (!$h1.length) return false;
  if (!$card.find("form.converter-form").length) return false;

  const $heroTool = $('<section class="hero-tool"></section>');
  $h1.appendTo($heroTool);

  const $lead = $heroBlock.find("p.lead, p.intro, p.mb-lg").first();
  if ($lead.length) {
    $lead.removeClass("mb-lg intro").addClass("lead");
    $lead.appendTo($heroTool);
  }
  $heroBlock.remove();

  stripRedundantToolHeading($, $card);

  const $wrap = $('<div class="converter-wrapper"></div>');
  const $inner = $('<div class="converter-card"></div>');
  while ($card.contents().length) {
    const n = $card.contents().first();
    if (n[0] && n[0].type === "text" && !String(n[0].data).trim()) {
      n.remove();
      continue;
    }
    $inner.append(n);
  }
  $wrap.append($inner);
  $heroTool.append($wrap);

  const $prevAd = $container.prev("div.ad-container");
  if ($prevAd.length) {
    $wrap.prepend($prevAd);
  }

  $card.replaceWith($heroTool);
  return true;
}

/** Standard: first section.converter-card in main .container with h1 + form or CTA. */
function migrateStandardHero($) {
  const $main = $("main").first();
  if (!$main.length) return false;
  if ($main.find("section.hero-tool").length) return false;

  let $container = $main.children(".container").first();
  if (!$container.length) $container = $main.find(".container").first();
  if (!$container.length) return false;

  const $card = $container.children("section.converter-card").first();
  if (!$card.length) return false;

  const $h1 = $card.children("h1").first();
  if (!$h1.length) return false;

  const hasTool =
    $card.find("form.converter-form").length > 0 || $card.find("a.btn").length > 0;
  if (!hasTool) return false;

  const $hero = $('<section class="hero-tool"></section>');
  $h1.appendTo($hero);

  const $intro = $card.children("p.mb-lg, p.intro").first();
  if ($intro.length) {
    $intro.removeClass("mb-lg intro").addClass("lead");
    $intro.appendTo($hero);
  }

  stripRedundantToolHeading($, $card);

  const $wrap = $('<div class="converter-wrapper"></div>');
  const $inner = $('<div class="converter-card"></div>');
  while ($card.contents().length) {
    const n = $card.contents().first();
    if (n[0] && n[0].type === "text" && !String(n[0].data).trim()) {
      n.remove();
      continue;
    }
    $inner.append(n);
  }
  $wrap.append($inner);
  $hero.append($wrap);
  $card.replaceWith($hero);
  return true;
}

/** shoe-size-conversion-chart: h1+intro in content-section, converter in following converter-card. */
function migrateChartHub($) {
  const $container = $("main .container").first();
  if (!$container.length) return false;
  if ($container.find("section.hero-tool").length) return false;

  const $introSec = $container
    .children("section.content-section")
    .filter((_, el) => {
      const $el = $(el);
      return (
        $el.children("h1").length > 0 &&
        $el.children("p.intro, p.mb-lg").length > 0
      );
    })
    .first();

  const $card = $introSec.length ? $introSec.nextAll("section.converter-card").first() : $();
  if (!$introSec.length || !$card.length) return false;

  const $h1 = $introSec.children("h1").first();
  const $intro = $introSec.children("p.intro, p.mb-lg").first();
  if (!$h1.length) return false;

  const $hero = $('<section class="hero-tool"></section>');
  $h1.appendTo($hero);
  if ($intro.length) {
    $intro.removeClass("mb-lg intro").addClass("lead");
    $intro.appendTo($hero);
  }
  $introSec.remove();

  stripRedundantToolHeading($, $card);

  const $wrap = $('<div class="converter-wrapper"></div>');
  const $inner = $('<div class="converter-card"></div>');
  while ($card.contents().length) {
    const n = $card.contents().first();
    if (n[0] && n[0].type === "text" && !String(n[0].data).trim()) {
      n.remove();
      continue;
    }
    $inner.append(n);
  }
  $wrap.append($inner);
  $hero.append($wrap);
  $card.replaceWith($hero);
  return true;
}

function processFile(abs) {
  let html = fs.readFileSync(abs, "utf8");
  if (!html.includes("converter-card") || html.includes("hero-tool")) {
    return { changed: false, html };
  }
  const rel = path.relative(ROOT, abs).replace(/\\/g, "/");
  const $ = cheerio.load(html, { decodeEntities: false });
  let changed = false;
  if (rel === "shoe-size-conversion-chart/index.html") {
    if (migrateChartHub($)) changed = true;
  } else if (migrateHeroNestedConverter($)) {
    changed = true;
  } else if (migrateRegionHub($)) {
    changed = true;
  } else if (migrateStandardHero($)) {
    changed = true;
  }
  if (!changed) return { changed: false, html };

  let out = $.root().html();
  const dt = html.match(/^<!DOCTYPE[^>]*>\s*/i);
  if (dt && out && !String(out).trim().toLowerCase().startsWith("<!doctype")) {
    out = dt[0] + out;
  }
  return { changed: true, html: out || html };
}

function main() {
  const files = walkHtml(ROOT);
  let n = 0;
  for (const abs of files) {
    const { changed, html } = processFile(abs);
    if (!changed) continue;
    n++;
    if (!DRY) fs.writeFileSync(abs, html, "utf8");
  }
  console.log("migrate-hero-tool: updated %d files%s", n, DRY ? " (dry-run)" : "");
}

main();
