# Cloudflare cache rules — GlobalSizeChart

Goal: raise **edge cache hit rate** from ~0% to **60–90%** for static HTML and assets.

## 1. Force static HTML caching (primary)

Create **Cache Rules** (or **Page Rules** on older plans) in order:

### Rule 1 — Static pages (HTML + directory indexes)

**When incoming requests match…**

- **Custom expression** (recommended):

  ```
  (http.request.uri.path contains ".html") or (ends_with(http.request.uri.path, "/"))
  ```

  Or use the **URI Path** UI: *contains* `.html` **OR** *ends with* `/`

**Then…**

| Setting | Value |
|--------|--------|
| **Cache eligibility** | Eligible for cache |
| **Cache level** | **Cache Everything** (required for HTML default-off on some zones) |
| **Edge TTL** | **1 month** (2,592,000 s) |
| **Browser TTL** | **1 day** (86,400 s) |
| **Respect origin Cache-Control** | Optional: **Off** if origin does not send strong headers yet; once origin sends `public, max-age=86400`, you can enable to align with meta + headers. |

> **Order:** Place this rule **above** bypass rules so static HTML is matched first.

---

## 2. Bypass only dynamic paths

### Rule 2 — API

**Match:** URI Path **contains** `/api/`

**Then:** **Bypass cache** (cache eligibility: bypass)

### Rule 3 — Admin

**Match:** URI Path **contains** `/admin/`

**Then:** **Bypass cache**

> If this site has **no** `/api/` or `/admin/` routes yet, these rules are harmless and ready for future use.

---

## 3. Compression (dashboard)

**Speed → Optimization → Content Optimization**

| Option | Setting |
|--------|---------|
| **Brotli** | **ON** |
| **Auto Minify** | **HTML**, **CSS**, **JS** — **ON** |

> Minify only affects text served through Cloudflare; keep readable source in git.

---

## 4. Image optimization (dashboard)

**Speed → Optimization → Images**

| Option | Setting |
|--------|---------|
| **Polish** | **Lossy** (or Lossless if you need pixel-perfect) |
| **WebP / AVIF** | Enable **WebP** (and AVIF if available on your plan) |

---

## 5. Origin / HTML hints (repo)

This repo includes:

- `scripts/add-cache-headers.js` — injects  
  `<meta http-equiv="Cache-Control" content="public, max-age=86400">`  
  into static HTML (browser hint; **edge behavior is controlled by Cloudflare rules above**).

Prefer **Cache-Control** and **CDN-Cache-Control** at the **origin** or **Transform Rules** for authoritative TTLs once you have an origin that can set headers.

---

## 6. Optional: bad bots (Security → Bots)

- **Block** or **challenge** aggressive / abusive scrapers per Cloudflare Bot Fight Mode / Super Bot Fight Mode (plan-dependent).
- **Allow** verified good crawlers, e.g. **Googlebot**, **Bingbot**, **OAI-SearchBot**.

See `cloudflare/BOT-AND-SECURITY.md` for a short checklist.

---

## 7. Verify after deploy

```bash
npm run verify:cache
```

Expect `cf-cache-status: HIT` on **repeat** requests to the same URL (first request may be `MISS` or `EXPIRED`).

---

## Expected outcome

| Metric | Expected |
|--------|----------|
| Cache hit rate | **60–90%** at edge (after warm-up) |
| Requests to origin | **Lower** |
| TTFB / repeat visits | **Faster** |
