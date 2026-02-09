#!/usr/bin/env node
/**
 * AdSense Layout Validator — Phase 12.5
 * Verifies layout compliance for AdSense approval:
 * - Content before monetization modules
 * - No ad-slot above navigation
 * - No ad-slot near clickable converter buttons
 * - No deceptive UI blocks
 * - No misleading product positioning
 * - Monetization modules visually distinct
 *
 * Outputs warnings during build. Does not modify files.
 * Usage: node scripts/adsense-layout-validator.js [dir1] [dir2] ...
 * Default: programmatic-pages, clothing, brands, measurement, semantic, tools
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const DEFAULT_DIRS = [
  path.join(ROOT, 'programmatic-pages'),
  path.join(ROOT, 'clothing'),
  path.join(ROOT, 'brands'),
  path.join(ROOT, 'measurement'),
  path.join(ROOT, 'semantic'),
  path.join(ROOT, 'tools')
];

const MIN_CONTENT_CHARS_BEFORE_FIRST_AD = 80;
const MIN_CHARS_BETWEEN_AD_AND_CONVERTER_BUTTON = 200;
const DECEPTIVE_CLASS_PATTERNS = [
  /class="[^"]*(?:^|\s)(?:content|article|main-content|editorial)(?:\s|")/,
  /class="[^"]*(?:^|\s)(?:download|submit|continue|next)(?:\s|")[^"]*ad-slot/,
  /ad-slot[^>]*class="[^"]*content[^"]*"/
];
const MONETIZATION_DISTINCT_CLASSES = ['ad-slot', 'commercial-context', 'monetization-module', 'affiliate-module', 'commercial-module'];

function listHtml(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.html')).map(f => path.join(dir, f));
}

function findPosition(html, regex) {
  const m = html.match(regex);
  return m ? m.index : -1;
}

function findAllPositions(html, regex) {
  const positions = [];
  let m;
  const r = new RegExp(regex.source, 'gi');
  while ((m = r.exec(html)) !== null) positions.push(m.index);
  return positions;
}

/**
 * Validate a single HTML file. Returns array of warning strings.
 */
function validateFile(html, filePath) {
  const relPath = path.relative(ROOT, filePath);
  const warnings = [];
  const lower = html.toLowerCase();

  const headerEnd = html.indexOf('</header>');
  const mainStart = html.indexOf('<main');
  const firstAdSlot = html.search(/<[^>]*\bdata-module\s*=\s*["']ad-slot["'][^>]*>|class="[^"]*ad-slot[^"]*"[^>]*data-slot/i);
  const firstMonetization = html.search(/data-module\s*=\s*["']ad-slot["']|monetization-module|commercial-module-wrap|affiliate-module/i);
  const converterForm = html.search(/<form[^>]*class="[^"]*converter-form[^"]*"|id="shoeConverter"|id="clothingConverter"/i);
  const converterButton = html.search(/<button[^>]*type\s*=\s*["']submit["'][^>]*class="[^"]*btn[^"]*"|class="[^"]*btn[^"]*"[^>]*type\s*=\s*["']submit["']/i);
  const firstParagraph = html.search(/<p[^>]*>/);
  const firstH1 = html.search(/<h1[^>]*>/);

  // --- 1. Content before monetization modules ---
  if (firstAdSlot >= 0 || firstMonetization >= 0) {
    const firstMonet = firstAdSlot >= 0 && (firstMonetization < 0 || firstAdSlot <= firstMonetization)
      ? firstAdSlot
      : firstMonetization;
    const bodyStart = Math.max(html.indexOf('</header>'), html.indexOf('<main'), 0);
    const contentBefore = firstMonet > bodyStart ? html.slice(bodyStart, firstMonet) : '';
    const hasH1 = /<h1[^>]*>[\s\S]*?<\/h1>/.test(contentBefore);
    const hasP = /<p[^>]*>[\s\S]{10,}<\/p>/.test(contentBefore);
    const visibleContent = contentBefore.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (visibleContent.length < MIN_CONTENT_CHARS_BEFORE_FIRST_AD && !hasP) {
      warnings.push(`[${relPath}] Content before monetization: first ad/monetization appears with very little visible content before it (${visibleContent.length} chars after header/main). Add at least one short paragraph before the first ad slot.`);
    }
    if (!hasH1 && mainStart >= 0 && firstMonet > mainStart && !hasP) {
      warnings.push(`[${relPath}] Content before monetization: ensure a heading (h1) and some paragraph content appear before the first ad.`);
    }
  }

  // --- 2. No ad-slot above navigation ---
  if (firstAdSlot >= 0 && headerEnd >= 0 && firstAdSlot < headerEnd) {
    warnings.push(`[${relPath}] Ad above navigation: first ad-slot appears before </header>. Move ad slots below the main navigation.`);
  }
  const navStart = html.indexOf('<nav');
  if (firstAdSlot >= 0 && navStart >= 0 && firstAdSlot < navStart) {
    warnings.push(`[${relPath}] Ad above navigation: first ad-slot appears before <nav>. Keep navigation above all ad placements.`);
  }

  // --- 3. No ad-slot near clickable converter buttons ---
  const adSlotPositions = findAllPositions(html, /<[^>]*\b(?:data-module\s*=\s*["']ad-slot["']|class="[^"]*ad-slot[^"]*")[^>]*>/i);
  const primaryButtonPos = converterButton >= 0 ? converterButton : converterForm;
  if (primaryButtonPos >= 0) {
    for (const adPos of adSlotPositions) {
      if (adPos < primaryButtonPos) {
        const gap = primaryButtonPos - adPos;
        if (gap < MIN_CHARS_BETWEEN_AD_AND_CONVERTER_BUTTON) {
          warnings.push(`[${relPath}] Ad near converter button: an ad-slot is only ${gap} characters before the converter form/button. Keep at least ${MIN_CHARS_BETWEEN_AD_AND_CONVERTER_BUTTON} chars of content between ad and primary CTA.`);
          break;
        }
      } else {
        const gap = adPos - primaryButtonPos;
        if (gap < MIN_CHARS_BETWEEN_AD_AND_CONVERTER_BUTTON) {
          warnings.push(`[${relPath}] Ad near converter button: an ad-slot appears ${gap} characters after the converter button. Add more content between primary CTA and ad.`);
          break;
        }
      }
    }
  }

  // --- 4. No deceptive UI blocks ---
  for (const pattern of DECEPTIVE_CLASS_PATTERNS) {
    if (pattern.test(html)) {
      warnings.push(`[${relPath}] Deceptive UI: ad or monetization block may use class names that resemble content/buttons. Use clearly distinct classes (e.g. ad-slot, commercial-context).`);
      break;
    }
  }
  const adSlotTags = html.match(/<[^>]*ad-slot[^>]*>/gi) || [];
  for (const tag of adSlotTags) {
    if (/class="[^"]*content[^"]*"/i.test(tag) && !/commercial-context|ad-slot/.test(tag)) {
      warnings.push(`[${relPath}] Deceptive UI: ad-slot element has class "content" without commercial/ad identifier.`);
      break;
    }
  }

  // --- 5. No misleading product positioning ---
  const affiliateOrProduct = html.match(/<[^>]*(?:affiliate-module|product-context|product-recommendation)[^>]*>/gi) || [];
  const hasProductBlock = /affiliate-module|product-recommendation|measurement-based-products|fit-specific-products|brand-recommended-products/i.test(html);
  if (hasProductBlock) {
    const hasDisclosure = /affiliate-module|commercial-module|sizing examples|reference only|educational/i.test(html);
    const looksLikeEditorial = html.includes('class="content-section"') && html.includes('affiliate-module') && !html.includes('aria-label="Sizing examples"') && !html.includes('data-module="product-recommendation"');
    if (looksLikeEditorial && !hasDisclosure) {
      warnings.push(`[${relPath}] Misleading product positioning: product/affiliate block may look like editorial content. Add aria-label or title (e.g. "Sizing examples") and ensure affiliate-module class is present.`);
    }
  }

  // --- 6. Monetization modules visually distinct ---
  const monetizationBlocks = html.match(/<[^>]*(?:ad-slot|monetization-module|commercial-context|affiliate-module|commercial-module)[^>]*>/gi) || [];
  for (const tag of monetizationBlocks) {
    const hasDistinct = MONETIZATION_DISTINCT_CLASSES.some(c => new RegExp(c, 'i').test(tag));
    if (!hasDistinct) {
      warnings.push(`[${relPath}] Monetization not distinct: monetization-related element lacks clear identifying class (ad-slot, commercial-context, monetization-module, affiliate-module, commercial-module).`);
      break;
    }
  }
  if (adSlotTags.length > 0) {
    for (const tag of adSlotTags) {
      if (!/commercial-context|ad-slot|data-slot|data-module/i.test(tag)) {
        warnings.push(`[${relPath}] Ad slot should be wrapped in .commercial-context or have data-module="ad-slot" and data-slot for clarity.`);
        break;
      }
    }
  }

  return warnings;
}

/**
 * Run validator on directories. Returns { warnings: [], filesChecked: n }.
 */
function runValidator(dirList) {
  const allWarnings = [];
  let filesChecked = 0;
  const dirs = dirList && dirList.length ? dirList : DEFAULT_DIRS;

  for (const dir of dirs) {
    const files = listHtml(dir);
    for (const filePath of files) {
      try {
        const html = fs.readFileSync(filePath, 'utf8');
        const w = validateFile(html, filePath);
        allWarnings.push(...w);
        filesChecked += 1;
      } catch (e) {
        allWarnings.push(`[${path.relative(ROOT, filePath)}] Error reading file: ${e.message}`);
      }
    }
  }

  return { warnings: allWarnings, filesChecked: filesChecked };
}

/**
 * Main: run and print warnings during build.
 */
function main() {
  const dirs = process.argv.slice(2).map(d => path.isAbsolute(d) ? d : path.join(process.cwd(), d));
  const result = runValidator(dirs.length ? dirs : null);

  if (result.warnings.length > 0) {
    console.log('\n--- AdSense Layout Validator (warnings) ---');
    result.warnings.forEach(w => console.warn('WARN', w));
    console.log(`--- ${result.warnings.length} warning(s) across ${result.filesChecked} file(s) ---\n`);
    process.exitCode = 1;
  } else {
    console.log(`AdSense layout validator: ${result.filesChecked} file(s) checked, no warnings.`);
  }
  return result;
}

if (typeof require !== 'undefined' && require.main === module) {
  main();
}

module.exports = { validateFile, runValidator };
