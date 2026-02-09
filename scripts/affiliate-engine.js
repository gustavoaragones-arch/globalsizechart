#!/usr/bin/env node
/**
 * Phase 12 — Affiliate product matching engine (structure only).
 * Matches affiliate_products.json to page routes; no tracking, no live links.
 *
 * Usage: require('./affiliate-engine') then matchProductsToPage(route)
 * Returns: { related_products: Array<product> }
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const AFFILIATE_PATH = path.join(DATA_DIR, 'affiliate_products.json');

const DEFAULT_MAX_PRODUCTS = 8;

let _productsCache = null;

function loadAffiliateProducts() {
  if (_productsCache) return _productsCache;
  if (!fs.existsSync(AFFILIATE_PATH)) {
    _productsCache = [];
    return _productsCache;
  }
  const raw = fs.readFileSync(AFFILIATE_PATH, 'utf8');
  _productsCache = JSON.parse(raw);
  return _productsCache;
}

function normalizeBrand(brand) {
  if (!brand || typeof brand !== 'string') return '';
  return brand.toLowerCase().trim().replace(/\s+/g, ' ');
}

function normalizeCategory(cat) {
  if (!cat || typeof cat !== 'string') return '';
  return cat.toLowerCase().trim();
}

/** Map route category (clothing) to product_type / category in affiliate data. */
function routeCategoryToProductType(routeCategory) {
  const c = normalizeCategory(routeCategory);
  if (['tops', 'pants', 'jackets', 'dresses'].includes(c)) return c;
  if (c === 'shoes') return 'shoes';
  if (c === 'clothing') return null; // generic clothing, match any product_type
  return c;
}

/** Prefer region from route: to_region (user target) or from_region. */
function getPreferredRegions(route) {
  const set = new Set();
  if (route.to_region) set.add(String(route.to_region).toUpperCase());
  if (route.from_region) set.add(String(route.from_region).toUpperCase());
  if (route.region) set.add(String(route.region).toUpperCase());
  return Array.from(set);
}

/** Resolve route gender for matching; 'all' matches any. */
function getRouteGenders(route) {
  const g = (route && route.gender) || 'men';
  if (g === 'all') return ['men', 'women', 'kids'];
  return [g];
}

/**
 * Match affiliate products to the current page route.
 * Rules: brand pages → same brand; clothing pages → same garment type;
 * measurement pages → measurement-based suggestions; gender match; region preference.
 *
 * @param {object} route - Page route: { type, brand?, category?, gender?, from_region?, to_region?, region?, measurement_type? }
 * @param {{ maxProducts?: number }} opts - Optional: maxProducts (default 8)
 * @returns {{ related_products: Array<object> }}
 */
function matchProductsToPage(route, opts = {}) {
  const products = loadAffiliateProducts();
  const maxProducts = opts.maxProducts != null ? opts.maxProducts : DEFAULT_MAX_PRODUCTS;

  if (!route || !route.type || !products.length) {
    return { related_products: [] };
  }

  const preferredRegions = getPreferredRegions(route);
  const routeGenders = getRouteGenders(route);
  const type = route.type;

  /** Score a product for this route (higher = better). */
  function score(product) {
    let score = (product.confidence_score != null ? product.confidence_score : 0.5);
    const pBrand = normalizeBrand(product.brand);
    const pCategory = normalizeCategory(product.category);
    const pGender = product.gender && routeGenders.includes(product.gender) ? 1 : (product.gender === 'all' || !product.gender ? 0.5 : 0);
    const pRegion = !product.region ? 0.5 : preferredRegions.includes(String(product.region).toUpperCase()) ? 1 : 0.3;

    if (type === 'brand_converter' && route.brand) {
      const routeBrand = normalizeBrand(route.brand);
      if (pBrand === routeBrand) score += 1.5;
      else if (pBrand !== 'generic') score -= 1;
    }

    if (type === 'clothing_size_pair' && route.category) {
      const wantType = routeCategoryToProductType(route.category);
      if (wantType && (product.product_type === wantType || pCategory === 'clothing')) score += 1;
      if (pCategory === 'clothing') score += 0.3;
    }

    if (type === 'measurement_converter') {
      const cat = normalizeCategory(route.category);
      if (cat === 'shoes' && (pCategory === 'shoes' || product.product_type === 'measurement_based')) score += 0.8;
      if (['tops', 'pants', 'jackets', 'dresses'].includes(cat) && (pCategory === cat || pCategory === 'clothing' || product.product_type === 'measurement_based')) score += 0.8;
    }

    if (type === 'size_pair' || type === 'region' || type === 'category') {
      const routeCat = normalizeCategory(route.category);
      if (routeCat === 'shoes' && pCategory === 'shoes') score += 0.7;
    }

    score += pGender * 0.4 + pRegion * 0.3;
    return score;
  }

  let candidates = products.slice();

  if (type === 'brand_converter' && route.brand) {
    const routeBrand = normalizeBrand(route.brand);
    candidates = candidates.filter(p => normalizeBrand(p.brand) === routeBrand || normalizeBrand(p.brand) === 'generic');
  }

  if (type === 'clothing_size_pair' && route.category) {
    const wantType = routeCategoryToProductType(route.category);
    if (wantType) {
      candidates = candidates.filter(p =>
        normalizeCategory(p.category) === 'clothing' &&
        (p.product_type === wantType || p.product_type === 'measurement_based')
      );
    } else {
      candidates = candidates.filter(p => normalizeCategory(p.category) === 'clothing');
    }
  }

  if (type === 'measurement_converter') {
    const cat = normalizeCategory(route.category);
    if (cat === 'shoes') {
      candidates = candidates.filter(p => normalizeCategory(p.category) === 'shoes' || p.product_type === 'measurement_based');
    } else if (['tops', 'pants', 'jackets', 'dresses'].includes(cat)) {
      candidates = candidates.filter(p =>
        normalizeCategory(p.category) === 'clothing' ||
        p.category === cat ||
        p.product_type === 'measurement_based'
      );
    }
  }

  if (type === 'size_pair' || type === 'region' || type === 'category') {
    const routeCat = normalizeCategory(route.category);
    if (routeCat === 'shoes') {
      candidates = candidates.filter(p => normalizeCategory(p.category) === 'shoes');
    }
  }

  if (routeGenders.length && routeGenders[0] !== 'all') {
    candidates = candidates.filter(p => !p.gender || p.gender === 'all' || routeGenders.includes(p.gender));
  }

  const scored = candidates.map(p => ({ product: p, score: score(p) }));
  scored.sort((a, b) => b.score - a.score);
  const related_products = scored.slice(0, maxProducts).map(x => x.product);

  return { related_products };
}

module.exports = {
  loadAffiliateProducts,
  matchProductsToPage
};
