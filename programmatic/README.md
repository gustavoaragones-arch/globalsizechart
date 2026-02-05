# Programmatic SEO Pages

Static page generator for high-intent conversion landing pages (e.g. `eu-42-to-us-shoe-size.html`).

## Usage

From project root:

```bash
node scripts/generate-programmatic-pages.js
```

- Reads size data: `data/shoe_sizes.json`, `data/programmatic_routes.json`
- Uses `programmatic/templates/conversion-template.html`
- Writes HTML to `programmatic-pages/`
- Updates `sitemap.xml` with generated URLs

## Adding routes

Edit `data/programmatic_routes.json` and add objects:

```json
{
  "slug": "eu-42-to-us-shoe-size",
  "category": "shoes",
  "gender": "men",
  "from_region": "EU",
  "to_region": "US",
  "size": "42"
}
```

Then run `node scripts/generate-programmatic-pages.js` again.

## Templates

- **conversion-template.html** – Full conversion page: prefilled converter, contextual explanation, fit guide snippet, measurement guide snippet, dynamic FAQ, JSON-LD schema, related links, canonical. Used by the generator.
- **region-template.html** – Stub for region-focused landing pages (future).
- **category-template.html** – Stub for category pages e.g. kids converter (future).

## Deployment

Generated files in `programmatic-pages/` are static HTML. Deploy with the rest of the site (e.g. Cloudflare Pages). No server-side rendering.
