#!/usr/bin/env node
/**
 * Verify Cloudflare cache headers on a deployed URL.
 * Expects cf-cache-status: HIT on repeat requests (first may be MISS).
 *
 * Usage:
 *   node scripts/check-cache.js [url]
 *   VERIFY_CACHE_URL=https://globalsizechart.com/shoe-size-converter.html node scripts/check-cache.js
 *
 * Exit code 0 if at least one response has cf-cache-status: HIT (after optional warm-up).
 */

const DEFAULT_URL = process.env.VERIFY_CACHE_URL || 'https://globalsizechart.com/';

async function fetchHeaders(url, method = 'GET') {
  const res = await fetch(url, {
    method,
    redirect: 'follow',
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'GlobalSizeChart-cache-check/1.0',
    },
  });
  const headers = {};
  res.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });
  return { status: res.status, headers, url: res.url };
}

async function main() {
  const url = process.argv[2] || DEFAULT_URL;
  console.log(`Checking: ${url}\n`);

  let hit = false;
  const rounds = 2;

  for (let i = 1; i <= rounds; i++) {
    const { status, headers, url: finalUrl } = await fetchHeaders(url);
    const cf = headers['cf-cache-status'] || '(missing)';
    const age = headers['age'] || '-';
    const cacheControl = headers['cache-control'] || '-';

    console.log(`Request ${i}/${rounds} → ${status} ${finalUrl}`);
    console.log(`  cf-cache-status: ${cf}`);
    console.log(`  age: ${age}`);
    console.log(`  cache-control: ${cacheControl}`);

    if (String(cf).toUpperCase() === 'HIT') {
      hit = true;
    }
    if (i < rounds) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log('');
  if (hit) {
    console.log('OK: cf-cache-status was HIT at least once (edge cache working).');
    process.exit(0);
  }

  console.warn(
    'Note: No HIT yet — first requests are often MISS/DYNAMIC/EXPIRED until the edge caches the asset.'
  );
  console.warn('Retry after a few seconds, or confirm Cache Rules (Cache Everything for .html) in Cloudflare.');
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
