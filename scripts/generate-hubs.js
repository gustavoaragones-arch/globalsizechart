#!/usr/bin/env node
/**
 * Regenerate hub pages (and full site). Run the Phase 10 generator so all hub HTML
 * (shoe-size-pages.html, brand-size-guides.html, measurement-tools.html, shoe-sizing-guides.html,
 * etc.) is regenerated from templates.
 *
 * After running this, run fix-orphans to add links to any orphan pages:
 *   node scripts/fix-orphans.js
 *
 * Usage: node scripts/generate-hubs.js
 */

require('./generate-phase10-pages.js');
