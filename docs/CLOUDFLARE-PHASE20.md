# Phase 20 — Cloudflare optimization layer

## Goals

- **Edge cache hit rate:** ~0% → **60–90%** (after rules + warm-up)
- **Fewer origin requests**, faster repeat visits
- **Compression & images** via Cloudflare dashboard
- **robots.txt** aligned with allowed AI/search bots

## Repo artifacts

| Path | Purpose |
|------|---------|
| `cloudflare/cache-rules.md` | Cache Everything for `.html` and trailing `/`, bypass `/api/` & `/admin/`, Brotli, Polish, verification |
| `cloudflare/BOT-AND-SECURITY.md` | Optional bot/WAF notes vs `robots.txt` |
| `scripts/add-cache-headers.js` | Injects `<meta http-equiv="Cache-Control" content="public, max-age=86400">` into HTML |
| `scripts/optimize-assets.js` | Lazy-load images, strip dead `<script src>`, optional inline small CSS (≤16KB) |
| `scripts/check-cache.js` | POST-deploy: checks `cf-cache-status: HIT` |

## NPM scripts

```bash
npm run build:cache-headers   # inject meta cache hint into all HTML
npm run optimize:assets       # lazy images + dead script cleanup
npm run build:cf              # headers then assets (order matters minimally)
npm run verify:cache          # hit production URL; needs network
```

## Deploy checklist

1. **Cloudflare:** Apply rules in `cloudflare/cache-rules.md` (Cache Everything, TTLs, bypass).
2. **Dashboard:** Brotli, Auto Minify (HTML/CSS/JS), Polish Lossy, WebP.
3. **Build:** `npm run build:cf` before or as part of static deploy.
4. **Verify:** `npm run verify:cache` (second request often `HIT` first time `MISS`).

## Note on `cf-cache-status`

- First request after purge: often **MISS** or **EXPIRED**.
- Repeat the same URL: should become **HIT** when rules apply.
