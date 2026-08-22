#!/usr/bin/env node
'use strict';
/**
 * RETIRED — Phase 9B.
 *
 * This script used to append a separate "More questions" FAQ block
 * (heading text distinct from "Frequently Asked Questions", items marked
 * data-ai-generated) to programmatic-pages/*.html. That is exactly the
 * kind of independent, competing FAQ surface the Phase 9 site-wide FAQ
 * architecture consolidation eliminated: every page must have exactly one
 * visible FAQ, sourced from the same canonical data as its FAQPage schema.
 *
 * The Phase 9A audit found this script dormant (only one test-stub file
 * in the entire population carried its marker), but still reachable via
 * `npm run ai:faqs`. Per the Phase 9B implementation directive, this
 * command must not silently regenerate legacy FAQ content if invoked —
 * it now fails loudly and explains why, rather than running quietly.
 *
 * Do not re-enable this script's original behavior. If a page family
 * genuinely needs additional FAQ content, add it to that family's
 * canonical FAQ data source (see scripts/generate-programmatic-pages.js's
 * buildFaqPairs / buildRegionFaqPairs / buildCategoryFaqPairs) so it is
 * rendered through the single visible+schema renderer, not as a second
 * independent block.
 */
console.error(
  '\ngenerate-faqs: RETIRED (Phase 9B).\n' +
  'This script previously appended a duplicate "More questions" FAQ block\n' +
  'outside the canonical single-FAQ architecture. It has been intentionally\n' +
  'disabled rather than left dormant. See scripts/generate-faqs.js and\n' +
  'reports/phase-9-faq-architecture-remediation.md for details.\n'
);
process.exit(1);
