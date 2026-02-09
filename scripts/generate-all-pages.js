#!/usr/bin/env node
/**
 * Regenerate all static pages (programmatic, clothing, brands, semantic, measurement, tools, printable, hubs).
 * Delegates to the Phase 10 generator which uses generate-programmatic-pages.js.
 * Phase 10 runs prebuild link validation before build finishes; build is blocked if 10+ missing targets.
 *
 * Usage: node scripts/generate-all-pages.js
 */

require('./generate-phase10-pages.js');
