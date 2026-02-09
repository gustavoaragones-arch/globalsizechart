#!/usr/bin/env node
/**
 * Objective 8 — Affiliate Activation Layer (disabled mode).
 *
 * When affiliate_mode = false: all links resolve to "#affiliate-placeholder".
 * Future toggle (affiliate_mode = true) will activate real affiliate links.
 *
 * Usage:
 *   const { affiliate_mode, getAffiliateUrl } = require('./affiliate-activation.js');
 *   const href = getAffiliateUrl(product);  // "#affiliate-placeholder" when disabled
 */

const { isAdsenseApprovalMode } = require('./adsense-approval-config.js');

/** When false, all affiliate links are "#affiliate-placeholder". When AdSense approval mode is on, always false. */
const affiliate_mode = !isAdsenseApprovalMode() && false;

const PLACEHOLDER_URL = '#affiliate-placeholder';

/**
 * Resolve the href for an affiliate link.
 * When affiliate_mode is false, always returns "#affiliate-placeholder".
 * When true (future), may return product.real_url or similar.
 *
 * @param {object} [product] - Optional product from affiliate_products (may have placeholder_url, or future real_url).
 * @returns {string} URL to use for the link (placeholder or future real affiliate URL).
 */
function getAffiliateUrl(product) {
  if (!affiliate_mode) return PLACEHOLDER_URL;
  if (product && product.placeholder_url) return product.placeholder_url;
  return PLACEHOLDER_URL;
}

/**
 * Whether affiliate links are currently active (real URLs).
 */
function isAffiliateActive() {
  return affiliate_mode === true;
}

module.exports = {
  affiliate_mode,
  getAffiliateUrl,
  isAffiliateActive,
  PLACEHOLDER_URL
};
