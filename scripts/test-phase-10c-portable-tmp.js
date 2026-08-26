'use strict';
// Regression test for the Cloudflare Pages build failure caused by
// scripts/build-public-dir.js hardcoding this developer's local Claude
// Code scratchpad path as its inventory output directory. Cloudflare's
// Linux build container has no such path, so mkdirSync threw EACCES and
// the build failed outright.
//
// Two independent checks:
//   1. Static source scan — the exact failure signature (a literal
//      developer/session-specific path string in the script source)
//      can never reappear undetected.
//   2. Dynamic simulated-environment run — spawns the real script as a
//      real child process with TMPDIR redirected to a freshly created,
//      distinctly-named directory standing in for "some other machine's
//      temp root" (this is how Node's os.tmpdir() actually varies across
//      environments, including Cloudflare's build container), and proves
//      the script honors that redirection rather than falling back to
//      anything fixed.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'build-public-dir.js');

const FORBIDDEN_SUBSTRINGS = ['/Users/', 'claude-501', '/private/tmp/claude-'];

let failures = 0;
function check(label, condition, detail) {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    console.error(`FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    failures += 1;
  }
}

// --- 1. Static source scan ---
const source = fs.readFileSync(SCRIPT, 'utf8');
for (const needle of FORBIDDEN_SUBSTRINGS) {
  check(
    `source does not contain forbidden substring ${JSON.stringify(needle)}`,
    !source.includes(needle)
  );
}

// --- 2. Dynamic simulated-environment run ---
const simulatedTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'simulated-other-machine-tmp-'));

// D: prove the simulated tmp root is actually writable before trusting
// a successful build run as evidence of anything.
const probePath = path.join(simulatedTmp, '.writable-probe');
fs.writeFileSync(probePath, 'ok');
check('simulated tmp root is writable', fs.readFileSync(probePath, 'utf8') === 'ok');
fs.rmSync(probePath);

const result = spawnSync('node', [SCRIPT], {
  cwd: ROOT,
  encoding: 'utf8',
  env: { ...process.env, TMPDIR: simulatedTmp },
});

check('build script exits 0 under a redirected TMPDIR', result.status === 0, `exit code ${result.status}, stderr: ${result.stderr}`);

const stdout = result.stdout || '';
for (const needle of FORBIDDEN_SUBSTRINGS) {
  check(
    `build output does not contain forbidden substring ${JSON.stringify(needle)}`,
    !stdout.includes(needle)
  );
}

const inventoryLine = stdout.split('\n').find(l => l.startsWith('Inventory written to: '));
check('build output reports an inventory path', Boolean(inventoryLine), stdout);

if (inventoryLine) {
  const reportedPath = inventoryLine.replace('Inventory written to: ', '').trim();
  const resolvedSimulatedTmp = fs.realpathSync(simulatedTmp);
  const resolvedReportedDir = fs.realpathSync(path.dirname(reportedPath));
  check(
    'reported inventory path lives under the redirected TMPDIR (proves the script actually used os.tmpdir(), not a fixed path)',
    resolvedReportedDir.startsWith(resolvedSimulatedTmp),
    `reported: ${reportedPath}, expected under: ${resolvedSimulatedTmp}`
  );
  check('reported inventory file actually exists', fs.existsSync(reportedPath));
  if (fs.existsSync(reportedPath)) {
    const parsed = JSON.parse(fs.readFileSync(reportedPath, 'utf8'));
    check('inventory file is valid JSON array with entries', Array.isArray(parsed) && parsed.length > 0);
  }
}

fs.rmSync(simulatedTmp, { recursive: true, force: true });

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
