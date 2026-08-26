'use strict';
// Phase 10C-1 — copies an explicit allowlist of public-facing top-level
// entries into dist/, the intended future Cloudflare Pages build output
// directory. Everything not on the allowlist stays in the repository for
// the generator pipeline to keep using, but is never copied here, and
// therefore never deployed once dist/ becomes the served tree.
//
// This is a fail-CLOSED allowlist, not a denylist: the copy step below
// only ever walks the PUBLIC_DIRS/PUBLIC_LOOSE_FILES/root-*.html sets —
// it never walks the repository and skips known-bad entries. The
// EXCLUDED_* sets exist only so this script can positively recognize
// "yes, I've seen this, it's deliberately non-public" and refuse to
// silently proceed if a repo-root item exists in neither list — that is
// a self-check, not the inclusion mechanism.
//
// See reports/phase-10c-cloudflare-serving-architecture-audit.md for the
// full classification and rationale behind every entry below, and
// reports/phase-10c-build-output-implementation.md for this script's
// certification results.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'dist');

const PUBLIC_DIRS = [
  'ai', 'brands', 'ca', 'eu', 'uk', 'us', 'clothing', 'data',
  'eu-to-us-shoe-size', 'uk-to-us-shoe-size', 'us-to-eu-shoe-size',
  'us-to-uk-shoe-size', 'guides', 'images', 'kids-shoe-size-chart',
  'kids-shoe-size-pages', 'mens-shoe-size-chart', 'mens-shoe-size-pages',
  'womens-shoe-size-chart', 'womens-shoe-size-pages', 'shoe-size-pages',
  'knowledge', 'legal', 'measurement', 'printable', 'programmatic-pages',
  'semantic', 'shoe-size-conversion-chart', 'shoe-size-conversions',
  'sitemap', 'sitemaps', 'tools', 'widget',
];

const PUBLIC_LOOSE_FILES = [
  'app.js', 'styles.css', 'robots.txt', 'sitemap.xml', '_headers',
  '_redirects', 'BingSiteAuth.xml',
];

// Recognized-and-deliberately-excluded — used ONLY by the self-check in
// assertNoUnclassifiedTopLevelItems(), never by the copy walk itself.
const EXCLUDED_DIRS = new Set([
  'authority', 'build', 'cloudflare', 'components', 'config', 'docs',
  'generators', 'programmatic', 'reports', 'scripts', 'utils',
  '.git', '.github', 'node_modules',
  'dist', // this script's own output, present from a prior run
]);

const EXCLUDED_FILES = new Set([
  'package.json', 'package-lock.json', 'CHECK-OUTPUT-REQUIRED.md',
  'PERFORMANCE-RULES.md', 'search-console-indexing-list.txt',
  '.gitignore', '.DS_Store', '.nojekyll',
]);

// OS-metadata filenames (same set as .gitignore's "OS files" section):
// never real site content, and never present in Cloudflare's own git
// clone, but this script must not depend on that — a stray untracked
// file on a local disk must not silently end up in dist/ either.
const OS_ARTIFACT_NAMES = new Set([
  '.DS_Store', 'Thumbs.db', 'ehthumbs.db', '.Spotlight-V100', '.Trashes',
]);
function isOsArtifact(name) {
  return OS_ARTIFACT_NAMES.has(name) || name.startsWith('._');
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

// --- Part 2 self-check: every top-level repo entry must be explicitly
// recognized as either public or deliberately excluded. Anything else
// halts the build rather than silently defaulting either way. ---
function assertNoUnclassifiedTopLevelItems() {
  const knownDirs = new Set([...PUBLIC_DIRS, ...EXCLUDED_DIRS]);
  const unclassified = [];
  for (const entry of fs.readdirSync(ROOT)) {
    const full = path.join(ROOT, entry);
    const lst = fs.lstatSync(full);
    if (lst.isDirectory()) {
      if (!knownDirs.has(entry)) unclassified.push(`dir: ${entry}`);
    } else {
      if (entry.endsWith('.html')) continue; // covered by the *.html rule
      if (PUBLIC_LOOSE_FILES.includes(entry)) continue;
      if (EXCLUDED_FILES.has(entry)) continue;
      unclassified.push(`file: ${entry}`);
    }
  }
  if (unclassified.length) {
    fail(
      'unclassified top-level item(s) found — refusing to guess:\n  ' +
      unclassified.join('\n  ') +
      '\nAdd each to PUBLIC_DIRS/PUBLIC_LOOSE_FILES (if public) or ' +
      'EXCLUDED_DIRS/EXCLUDED_FILES (if not) before rebuilding.'
    );
  }
}

// --- Part 10: every destination write must stay inside OUT. ---
function assertInsideOut(destPath) {
  const resolved = path.resolve(destPath);
  const outWithSep = OUT.endsWith(path.sep) ? OUT : OUT + path.sep;
  if (resolved !== OUT && !resolved.startsWith(outWithSep)) {
    fail(`destination path escapes dist/: ${destPath}`);
  }
}

// --- Part 4 + Part 3.12: refuse symlinks anywhere in the copied tree,
// at any depth, rather than silently dereferencing or skipping them. ---
function copyRecursive(src, dest, label) {
  const lst = fs.lstatSync(src);

  if (lst.isSymbolicLink()) {
    const target = fs.readlinkSync(src);
    const resolvedTarget = path.resolve(path.dirname(src), target);
    const insideRepo = resolvedTarget.startsWith(ROOT + path.sep);
    fail(
      `symlink encountered inside an allowlisted path — refusing to copy automatically.\n` +
      `  source: ${path.relative(ROOT, src)}\n` +
      `  target: ${target}\n` +
      `  target resolves inside repository: ${insideRepo}\n` +
      `  Automatic copying is unsafe here because a symlink could point outside the ` +
      `allowlist (publishing something never reviewed) or outside the repository ` +
      `entirely (publishing arbitrary filesystem content, or failing unpredictably ` +
      `in Cloudflare's build container, which will not have the same filesystem ` +
      `layout as this machine). Resolve manually: replace the symlink with a real ` +
      `file/directory, or explicitly special-case it in this script with a ` +
      `reviewed justification.`
    );
  }

  if (lst.isDirectory()) {
    assertInsideOut(dest);
    fs.mkdirSync(dest, { recursive: true });
    let count = 0;
    for (const entry of fs.readdirSync(src)) {
      if (entry === '.git' || entry === 'node_modules') {
        fail(`unexpected '${entry}' found nested inside allowlisted path ${label} — refusing to copy.`);
      }
      if (isOsArtifact(entry)) continue;
      count += copyRecursive(path.join(src, entry), path.join(dest, entry), label);
    }
    return count;
  }

  if (lst.isFile()) {
    assertInsideOut(dest);
    fs.copyFileSync(src, dest);
    return 1;
  }

  fail(`unexpected filesystem entry type at ${src} (neither file, directory, nor symlink).`);
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function main() {
  assertNoUnclassifiedTopLevelItems();

  // Safety check before any destructive removal: OUT must resolve to
  // exactly <ROOT>/dist, never anything computed incorrectly.
  if (path.basename(OUT) !== 'dist' || path.dirname(OUT) !== ROOT) {
    fail(`refusing to remove computed output path, does not match expected <ROOT>/dist: ${OUT}`);
  }
  if (fs.existsSync(OUT)) {
    if (fs.lstatSync(OUT).isSymbolicLink()) {
      fail(`${OUT} is a symlink, refusing to rm -rf through it.`);
    }
    fs.rmSync(OUT, { recursive: true, force: true });
  }
  fs.mkdirSync(OUT, { recursive: true });

  let totalFiles = 0;
  const categoryCounts = {};

  for (const dir of PUBLIC_DIRS) {
    const src = path.join(ROOT, dir);
    if (!fs.existsSync(src)) {
      fail(`allowlisted directory missing from source: ${dir}`);
    }
    const n = copyRecursive(src, path.join(OUT, dir), dir);
    categoryCounts[dir] = n;
    totalFiles += n;
  }

  for (const file of PUBLIC_LOOSE_FILES) {
    const src = path.join(ROOT, file);
    if (!fs.existsSync(src)) {
      fail(`allowlisted file missing from source: ${file}`);
    }
    const lst = fs.lstatSync(src);
    if (lst.isSymbolicLink()) {
      fail(`allowlisted root file ${file} is a symlink — refusing to copy automatically (see symlink-safety policy above).`);
    }
    const dest = path.join(OUT, file);
    assertInsideOut(dest);
    fs.copyFileSync(src, dest);
    totalFiles += 1;
  }

  let htmlCount = 0;
  for (const entry of fs.readdirSync(ROOT)) {
    if (!entry.endsWith('.html')) continue;
    const full = path.join(ROOT, entry);
    const lst = fs.lstatSync(full);
    if (lst.isSymbolicLink()) {
      fail(`root HTML file ${entry} is a symlink — refusing to copy automatically (see symlink-safety policy above).`);
    }
    if (!lst.isFile()) continue;
    const dest = path.join(OUT, entry);
    assertInsideOut(dest);
    fs.copyFileSync(full, dest);
    htmlCount += 1;
  }
  categoryCounts['*.html (root)'] = htmlCount;
  totalFiles += htmlCount;

  // Part 9: full inventory (relative path, size, SHA-256), written OUTSIDE
  // dist/ and outside the repo's served tree entirely.
  const inventory = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, entry);
      const lst = fs.lstatSync(full);
      if (lst.isDirectory()) { walk(full); continue; }
      const rel = path.relative(OUT, full);
      inventory.push({ path: rel, bytes: lst.size, sha256: sha256(full) });
    }
  })(OUT);

  const inventoryDir = '/private/tmp/claude-501/-Users-gus-Documents-APPS-globalsizechart/4285c84c-4684-4712-941e-5c92c63185d6/scratchpad/phase10c';
  fs.mkdirSync(inventoryDir, { recursive: true });
  const inventoryPath = path.join(inventoryDir, 'dist-inventory.json');
  fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));

  const totalBytes = inventory.reduce((s, f) => s + f.bytes, 0);
  const overallHash = crypto.createHash('sha256')
    .update(inventory.map(f => `${f.path}\t${f.sha256}\t${f.bytes}`).join('\n'))
    .digest('hex');

  console.log(`Copied ${totalFiles} files into dist/ (expected ${inventory.length} files in inventory: ${totalFiles === inventory.length ? 'match' : 'MISMATCH'}).`);
  console.log(`Total bytes: ${totalBytes}`);
  console.log(`Inventory written to: ${inventoryPath}`);
  console.log(`Overall inventory hash (sorted path+sha256+bytes): ${overallHash}`);
  console.log('Category counts:', JSON.stringify(categoryCounts, null, 2));
}

main();
