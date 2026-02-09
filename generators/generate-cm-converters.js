/**
 * CM and inch-based region converter hubs.
 * Output: programmatic-pages/ (region type). Same layout as converters, related grid, breadcrumbs, authority links.
 * Auto-registered in hubs and sitemap when merged into programmatic routes.
 *
 * Minimum pages: cm-to-eu-shoe-size, cm-to-us-shoe-size, cm-to-uk-shoe-size, inch-to-eu-shoe-size, inch-to-us-shoe-size.
 */

function getRoutes() {
  return [
    { type: 'region', slug: 'cm-to-eu-shoe-size', category: 'shoes', from_region: 'CM', to_region: 'EU' },
    { type: 'region', slug: 'cm-to-us-shoe-size', category: 'shoes', from_region: 'CM', to_region: 'US' },
    { type: 'region', slug: 'cm-to-uk-shoe-size', category: 'shoes', from_region: 'CM', to_region: 'UK' },
    { type: 'region', slug: 'inch-to-eu-shoe-size', category: 'shoes', from_region: 'INCH', to_region: 'EU' },
    { type: 'region', slug: 'inch-to-us-shoe-size', category: 'shoes', from_region: 'INCH', to_region: 'US' }
  ];
}

module.exports = { getRoutes };
