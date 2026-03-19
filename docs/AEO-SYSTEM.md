# AI / AEO content layer

## What was added

- **Reusable HTML patterns** in `/components/`: `faq-block.html`, `ai-answer.html`, `author.html`, `why-sizes-vary.html` (reference / copy-paste; not loaded via JS).
- **CSS** in `styles.css`: `.faq-block`, `.ai-answer`, `.author-box`, `.aeo-see-also`, `.aeo-ai-layer`, `.aeo-comparison-table`.
- **Hubs**: `/knowledge/` and `/guides/` (static HTML, full content in source).
- **`robots.txt`**: explicit `Allow: /` for `OAI-SearchBot`, `GPTBot`, and `Bingbot` (plus existing `User-agent: *` and sitemap).
- **Sitemap generator**: ignores `/components/` so fragment templates are not URLs; scans `/knowledge/`, `/guides/`, `/semantic/`, etc. automatically.

## Batch injection

- `npm run inject:aeo` → `scripts/inject-aeo-layer.js`  
  Inserts before `</main>`: Quick Answer, Why sizes vary, optional FAQ block (if no existing `#faq` / `.faq-block` / `.faq-section`), author box, See also links.  
  Adds **FAQPage** + **Article** JSON-LD in `<head>` when missing (Article uses **Albor Digital Team** as `author`).

**Skipped manually** (curated): `index.html`, `shoe-size-converter.html`, `clothing-size-converter.html`, `knowledge/index.html`, `guides/index.html`.  
**Skipped** if already: `data-aeo-ai-layer`, `class="author-box"`, or `class="ai-answer"`.

## Maintenance

- **New HTML pages**: run `npm run inject:aeo` then `npm run build:sitemaps` before deploy.
- **Optional head patch** (only if needed): `node scripts/patch-aeo-article-head.js` adds Article with author when head lacks both Albor and an existing Article type.

## Images

- Prefer descriptive `alt` text, e.g. `alt="EU 42 to US men's shoe size conversion reference"`. Site is mostly text/tools; add alts when adding charts or screenshots.

## Validation

- Use [Google Rich Results Test](https://search.google.com/test/rich-results) on sample URLs.
- Confirm `robots.txt` and `sitemap.xml` in Search Console.
