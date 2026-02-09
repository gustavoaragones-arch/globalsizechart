#!/usr/bin/env node
/**
 * AdSense Approval Mode — Phase 12.5
 * Reads config/adsense_approval_mode.json.
 * When TRUE: affiliate links disabled, product modules informational only,
 * no commercial CTA text (buy/shop/deal), monetization blocks use safe titles.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'adsense_approval_mode.json');

let _config = null;

function loadConfig() {
  if (_config !== null) return _config;
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      _config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      return _config;
    }
  } catch (_) {}
  _config = { adsense_approval_mode: false, monetization_block_titles: ['Sizing Insights', 'Fit Considerations', 'Sizing Examples'] };
  return _config;
}

function isAdsenseApprovalMode() {
  const c = loadConfig();
  return c.adsense_approval_mode === true;
}

function getSafeMonetizationTitles() {
  const c = loadConfig();
  return Array.isArray(c.monetization_block_titles) && c.monetization_block_titles.length
    ? c.monetization_block_titles
    : ['Sizing Insights', 'Fit Considerations', 'Sizing Examples'];
}

function getSafeMonetizationTitle(index) {
  const titles = getSafeMonetizationTitles();
  return titles[index % titles.length];
}

const CTA_PATTERNS = [
  [/\bbuying\b/gi, 'ordering'],
  [/\bbuy\b/gi, 'order'],
  [/\bshopping\b/gi, 'browsing'],
  [/\bshop\b/gi, 'browse'],
  [/\bdeals?\b/gi, 'offers'],
  [/\bshop\s+now\b/gi, 'see size chart'],
  [/\bbuy\s+now\b/gi, 'check size']
];

function sanitizeForApprovalMode(text) {
  if (!text || typeof text !== 'string') return text;
  if (!isAdsenseApprovalMode()) return text;
  let out = text;
  for (const [regex, repl] of CTA_PATTERNS) {
    out = out.replace(regex, repl);
  }
  return out;
}

module.exports = {
  loadConfig,
  isAdsenseApprovalMode,
  getSafeMonetizationTitles,
  getSafeMonetizationTitle,
  sanitizeForApprovalMode,
  CONFIG_PATH
};
