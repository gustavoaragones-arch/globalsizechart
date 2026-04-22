#!/usr/bin/env node
/**
 * Replaces every full-page HTML footer with scripts/lib/master-footer.html
 * and strips legacy pre-footer blocks (data-sources, see also, related, etc.).
 * Skips components/*.html (fragments, no document body).
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MASTER_PATH = path.join(__dirname, "lib", "master-footer.html");
const MASTER_FOOTER = fs.readFileSync(MASTER_PATH, "utf8").replace(/\n$/, "");

const LEGACY_PATTERNS = [
  /<section class="publisher-trust content-section"[^>]*>[\s\S]*?<\/section>/gi,
  /<section class="data-sources content-section"[^>]*>[\s\S]*?<\/section>/gi,
  /<section class="aeo-see-also content-section"[^>]*>[\s\S]*?<\/section>/gi,
  /<section class="content-section internal-link-boost"[^>]*>[\s\S]*?<\/section>/gi,
  /<p class="ai-answer-see-also"[^>]*>[\s\S]*?<\/p>/gi,
];

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

function stripLegacy(html) {
  let out = html;
  for (const re of LEGACY_PATTERNS) {
    out = out.replace(re, "");
  }
  return out;
}

/** First broken batch inserted <footer> inside <head>; remove only there. */
function removeFooterFromHead(html) {
  const hi = html.toLowerCase().indexOf("</head>");
  if (hi === -1) return html;
  const headPart = html.slice(0, hi);
  const afterHead = html.slice(hi);
  return headPart.replace(/<footer\b[\s\S]*?<\/footer>/gi, "") + afterHead;
}

function removeAllFooters(html) {
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

function insertMasterFooter(html) {
  const idx = lastBodyCloseIndex(html);
  if (idx === -1) return null;
  const before = html.slice(0, idx);
  const after = html.slice(idx);
  // Do not use a trailing-regex over the whole document (head JSON can break `</script>` pairing).
  const appScript = /<script[^>]*\bapp\.js[^>]*>\s*<\/script>/gi;
  const hits = [...before.matchAll(appScript)];
  if (hits.length) {
    const last = hits[hits.length - 1];
    const ins = last.index;
    return `${before.slice(0, ins)}\n\n${MASTER_FOOTER}\n${before.slice(ins)}${after}`;
  }
  return `${before.trimEnd()}\n\n${MASTER_FOOTER}\n${after}`;
}

function normalizeFooterForCompare(html) {
  const match = html.match(/<footer\b[\s\S]*?<\/footer>/i);
  if (!match) return "";
  return match[0].replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function processFile(absPath) {
  let html = fs.readFileSync(absPath, "utf8");
  if (!/<body\b/i.test(html)) return { skip: true, reason: "no body" };

  const original = html;
  html = stripLegacy(html);
  html = removeFooterFromHead(html);
  html = removeAllFooters(html);
  const next = insertMasterFooter(html);
  if (!next) return { skip: true, reason: "no </body>" };

  const footers = next.match(/<footer\b/gi) || [];
  if (footers.length !== 1) {
    return { error: `expected 1 footer, got ${footers.length}` };
  }

  if (next !== original) fs.writeFileSync(absPath, next, "utf8");
  return { ok: true, changed: next !== original };
}

function main() {
  const files = walkHtmlFiles(ROOT).filter(shouldProcess);
  const errors = [];
  let changed = 0;
  let skipped = 0;

  for (const absPath of files) {
    try {
      const r = processFile(absPath);
      if (r.skip) skipped++;
      else if (r.error) errors.push({ file: path.relative(ROOT, absPath), ...r });
      else {
        if (r.changed) changed++;
      }
    } catch (e) {
      errors.push({ file: path.relative(ROOT, absPath), error: String(e) });
    }
  }

  console.log(`Processed ${files.length} HTML files. Updated: ${changed}. Skipped: ${skipped}.`);
  if (errors.length) {
    console.error("Errors:", errors);
    process.exit(1);
  }

  // Post-validation: single footer, byte match to master
  const masterNorm = normalizeFooterForCompare(`<!DOCTYPE html><html><body>\n${MASTER_FOOTER}\n</body></html>`);
  for (const absPath of files) {
    if (!shouldProcess(absPath)) continue;
    const html = fs.readFileSync(absPath, "utf8");
    if (!/<body\b/i.test(html)) continue;
    const n = (html.match(/<footer\b/gi) || []).length;
    if (n !== 1) {
      console.error("Validation failed:", path.relative(ROOT, absPath), "footer count", n);
      process.exit(1);
    }
    if (normalizeFooterForCompare(html) !== masterNorm) {
      console.error("Validation failed footer mismatch:", path.relative(ROOT, absPath));
      process.exit(1);
    }
  }
  console.log("Validation OK: every full HTML page has identical footer.");
}

main();
