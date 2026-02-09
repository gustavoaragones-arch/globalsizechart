/**
 * Measurement-core region converter hubs (complement to cm-converters).
 * Ensures measurement-focused hub pages exist in programmatic-pages/.
 * Same layout as converters, related grid, breadcrumbs, authority links.
 *
 * Can return additional region routes or measurement_converter routes that are missing.
 * Core measurement hubs are covered by generate-cm-converters; this module can add
 * any extra measurement hub routes required for coverage.
 */

function getRoutes() {
  return [
    // Additional measurement-related region hubs if any (e.g. uk-to-eu for measurement flow)
    { type: 'region', slug: 'uk-to-eu-shoe-size', category: 'shoes', from_region: 'UK', to_region: 'EU' }
  ];
}

module.exports = { getRoutes };
