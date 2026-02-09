/**
 * Gender-specific measurement/CM converter hub pages.
 * Output: programmatic-pages/ (region type). Same layout as converters, related grid, breadcrumbs, authority links.
 *
 * Minimum pages: women-cm-to-us, men-cm-to-eu, kids-cm-to-us.
 * Implemented as region hubs (CM→US, CM→EU) with distinct slugs for discoverability.
 */

function getRoutes() {
  return [
    { type: 'region', slug: 'women-cm-to-us', category: 'shoes', from_region: 'CM', to_region: 'US' },
    { type: 'region', slug: 'men-cm-to-eu', category: 'shoes', from_region: 'CM', to_region: 'EU' },
    { type: 'region', slug: 'kids-cm-to-us', category: 'shoes', from_region: 'CM', to_region: 'US' }
  ];
}

module.exports = { getRoutes };
