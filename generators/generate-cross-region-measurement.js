/**
 * Cross-region measurement hub pages (Japan, China, Korea to US/EU).
 * Output: programmatic-pages/ (region type). Same layout as converters, related grid, breadcrumbs, authority links.
 *
 * Minimum pages: japan-cm-to-us, china-cm-to-eu, korea-cm-to-us.
 * Plus missing region hubs from Step 1: china-to-eu, china-to-us, eu-to-japan, japan-to-eu, us-to-japan.
 */

function getRoutes() {
  return [
    { type: 'region', slug: 'japan-cm-to-us', category: 'shoes', from_region: 'JP', to_region: 'US' },
    { type: 'region', slug: 'china-cm-to-eu', category: 'shoes', from_region: 'CN', to_region: 'EU' },
    { type: 'region', slug: 'korea-cm-to-us', category: 'shoes', from_region: 'KR', to_region: 'US' },
    { type: 'region', slug: 'china-to-eu-shoe-size', category: 'shoes', from_region: 'CN', to_region: 'EU' },
    { type: 'region', slug: 'china-to-us-shoe-size', category: 'shoes', from_region: 'CN', to_region: 'US' },
    { type: 'region', slug: 'eu-to-japan-shoe-size', category: 'shoes', from_region: 'EU', to_region: 'JP' },
    { type: 'region', slug: 'japan-to-eu-shoe-size', category: 'shoes', from_region: 'JP', to_region: 'EU' },
    { type: 'region', slug: 'us-to-japan-shoe-size', category: 'shoes', from_region: 'US', to_region: 'JP' }
  ];
}

module.exports = { getRoutes };
