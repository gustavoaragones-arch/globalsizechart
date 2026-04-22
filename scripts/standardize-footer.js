#!/usr/bin/env node
/**
 * Footer drift control: marker-wrapped master in scripts/lib/master-footer.html
 *
 *   node scripts/standardize-footer.js           — update HTML files
 *   node scripts/standardize-footer.js --check    — verify only (no writes)
 *
 * Skips components/*.html (fragments, no document body).
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MASTER_PATH = path.join(__dirname, "lib", "master-footer.html");
const MARKER_START = "<!-- FOOTER:START -->";
const MARKER_END = "<!-- FOOTER:END -->";

function loadMasterBlock() {
  const raw = fs.readFileSync(MASTER_PATH, "utf8");
  return raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n+$/, "");
}

/** Set at the start of each run (write or check). */
let MASTER_BLOCK = "";

function normalizeCompare(s) {
  return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trimEnd();
}

function countLiteral(hay, needle) {
  let n = 0;
  let i = 0;
  while ((i = hay.indexOf(needle, i)) !== -1) {
    n++;
    i += needle.length;
  }
  return n;
}

function walkHtmlFiles(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".git") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtmlFiles(full, out);
    else if (ent.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function shouldProcess(absPath) {
  const rel = path.relative(ROOT, absPath);
  return !rel.startsWith(`components${path.sep}`);
}

/** Remove every <footer>...</footer> only inside <body> (never modify <head>). */
function removeFootersInBody(html) {
  const bodyOpen = html.match(/<body\b[^>]*>/i);
  const bodyClose = html.toLowerCase().lastIndexOf("</body>");
  if (bodyOpen && bodyClose !== -1 && bodyClose > bodyOpen.index) {
    const head = html.slice(0, bodyOpen.index + bodyOpen[0].length);
    const tail = html.slice(bodyClose);
    let mid = html.slice(bodyOpen.index + bodyOpen[0].length, bodyClose);
    let prev;
    do {
      prev = mid;
      mid = mid.replace(/<footer\b[\s\S]*?<\/footer>/i, "");
    } while (mid !== prev);
    return head + mid + tail;
  }
  let out = html;
  let prev;
  do {
    prev = out;
    out = out.replace(/<footer\b[\s\S]*?<\/footer>/i, "");
  } while (out !== prev);
  return out;
}

function lastBodyCloseIndex(html) {
  const matches = [...html.matchAll(/<\/body>/gi)];
  if (!matches.length) return -1;
  return matches[matches.length - 1].index;
}

function extractMarkedBlock(html) {
  const re = /<!-- FOOTER:START -->[\s\S]*?<!-- FOOTER:END -->/;
  const m = html.match(re);
  return m ? m[0] : null;
}

/** After write: exactly one marker pair and a footer element. */
function assertFooterInvariant(html) {
  const sc = countLiteral(html, MARKER_START);
  const ec = countLiteral(html, MARKER_END);
  if (sc !== 1 || ec !== 1) {
    return { ok: false, message: `expected 1 ${MARKER_START} and 1 ${MARKER_END}, got START=${sc} END=${ec}` };
  }
  const footerTags = html.match(/<footer\b/gi) || [];
  if (footerTags.length !== 1) {
    return { ok: false, message: `expected exactly one <footer>, got ${footerTags.length}` };
  }
  const block = extractMarkedBlock(html);
  if (!block) {
    return { ok: false, message: "could not extract region between footer markers" };
  }
  return { ok: true, block };
}

function processWrite(absPath) {
  let html = fs.readFileSync(absPath, "utf8");
  if (!/<body\b/i.test(html)) return { skip: true };

  const original = html;
  const hasMarkers = html.includes(MARKER_START);

  if (hasMarkers) {
    const sc = countLiteral(html, MARKER_START);
    const ec = countLiteral(html, MARKER_END);
    if (sc !== 1 || ec !== 1) {
      return { error: `${path.relative(ROOT, absPath)}: invalid markers START=${sc} END=${ec}` };
    }
    const currentBlock = extractMarkedBlock(html);
    if (!currentBlock) {
      return { error: `${path.relative(ROOT, absPath)}: could not read marker region` };
    }
    if (normalizeCompare(currentBlock) !== normalizeCompare(MASTER_BLOCK)) {
      const next = html.replace(/<!-- FOOTER:START -->[\s\S]*?<!-- FOOTER:END -->/m, MASTER_BLOCK);
      const afterBlock = extractMarkedBlock(next);
      if (!afterBlock || normalizeCompare(afterBlock) !== normalizeCompare(MASTER_BLOCK)) {
        return { error: `${path.relative(ROOT, absPath)}: marker replace failed` };
      }
      html = next;
    }
  } else {
    html = removeFootersInBody(html);
    const idx = lastBodyCloseIndex(html);
    if (idx === -1) {
      return { error: `${path.relative(ROOT, absPath)}: missing </body>` };
    }
    const before = html.slice(0, idx);
    const after = html.slice(idx);
    html = `${before.trimEnd()}\n\n${MASTER_BLOCK}\n${after}`;
  }

  const inv = assertFooterInvariant(html);
  if (!inv.ok) {
    return { error: `${path.relative(ROOT, absPath)}: ${inv.message}` };
  }
  if (normalizeCompare(inv.block) !== normalizeCompare(MASTER_BLOCK)) {
    return { error: `${path.relative(ROOT, absPath)}: footer block does not match master` };
  }

  if (html !== original) fs.writeFileSync(absPath, html, "utf8");
  return { ok: true, changed: html !== original };
}

function processCheck(absPath) {
  const html = fs.readFileSync(absPath, "utf8");
  if (!/<body\b/i.test(html)) return { skip: true };

  const rel = path.relative(ROOT, absPath);
  const sc = countLiteral(html, MARKER_START);
  const ec = countLiteral(html, MARKER_END);
  if (sc !== 1 || ec !== 1) {
    return { mismatch: true, rel, reason: `markers START=${sc} END=${ec}` };
  }
  const footerTags = html.match(/<footer\b/gi) || [];
  if (footerTags.length !== 1) {
    return { mismatch: true, rel, reason: `expected one <footer>, got ${footerTags.length}` };
  }
  const block = extractMarkedBlock(html);
  if (!block) {
    return { mismatch: true, rel, reason: "unparseable marker region" };
  }
  if (normalizeCompare(block) !== normalizeCompare(MASTER_BLOCK)) {
    return { mismatch: true, rel, reason: "content differs from scripts/lib/master-footer.html" };
  }
  return { ok: true };
}

function runWrite() {
  MASTER_BLOCK = loadMasterBlock();
  const files = walkHtmlFiles(ROOT).filter(shouldProcess);
  const errors = [];
  let changed = 0;
  let skipped = 0;

  for (const absPath of files) {
    try {
      const r = processWrite(absPath);
      if (r.skip) skipped++;
      else if (r.error) errors.push(r.error);
      else if (r.changed) changed++;
    } catch (e) {
      errors.push(`${path.relative(ROOT, absPath)}: ${e}`);
    }
  }

  console.log(`Processed ${files.length} HTML files. Updated: ${changed}. Skipped: ${skipped}.`);
  if (errors.length) {
    console.error("Errors:\n", errors.join("\n"));
    process.exit(1);
  }

  const mismatches = [];
  for (const absPath of files) {
    const r = processCheck(absPath);
    if (r.skip) continue;
    if (r.mismatch) mismatches.push(`${r.rel}: ${r.reason}`);
  }
  if (mismatches.length) {
    console.error("Post-check failed:\n", mismatches.join("\n"));
    process.exit(1);
  }
  console.log("Validation OK: markers, footer, and master match on every page.");
}

function runCheck() {
  MASTER_BLOCK = loadMasterBlock();
  const files = walkHtmlFiles(ROOT).filter(shouldProcess);
  const mismatches = [];
  let skipped = 0;

  for (const absPath of files) {
    try {
      const r = processCheck(absPath);
      if (r.skip) skipped++;
      else if (r.mismatch) mismatches.push(`${r.rel}: ${r.reason}`);
    } catch (e) {
      mismatches.push(`${path.relative(ROOT, absPath)}: ${e}`);
    }
  }

  console.log(`Checked ${files.length} HTML files (skipped ${skipped} without <body>).`);
  if (mismatches.length) {
    console.error("Mismatches:\n", mismatches.join("\n"));
    process.exit(1);
  }
  console.log("OK: all footers match master.");
}

const isCheck = process.argv.includes("--check");
if (isCheck) runCheck();
else runWrite();
