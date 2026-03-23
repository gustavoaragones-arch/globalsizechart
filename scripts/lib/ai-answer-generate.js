/**
 * Phase 22 — AI citation: quotable one-line answers for conversion pages.
 */

/**
 * @param {{ from: string, to: string, value: string, result: string, cm?: string|null }} p
 */
function articleFor(region) {
  const r = String(region).toUpperCase();
  if (/^[AEIOU]/.test(r)) return 'An';
  return 'A';
}

function generateAnswer({ from, to, value, result, cm }) {
  const res = String(result).replace(/\.$/, '').trim();
  const hasCm = cm != null && String(cm).trim() !== '';
  const cmNum = hasCm ? String(cm).replace(/[^\d.]/g, '') : '';
  const a = articleFor(from);
  if (cmNum) {
    return `${a} ${from} shoe size ${value} converts to ${to} size ${res} and measures approximately ${cmNum} cm in foot length.`;
  }
  return `${a} ${from} shoe size ${value} converts to ${to} size ${res}. Typical foot length for this label is often about 25–29 cm depending on brand—measure your foot in cm for the best match.`;
}

/**
 * Parse "EU size 42 converts approximately to US men's size 9" style paragraphs.
 */
function parseConversionGuideParagraph(text) {
  const t = text.replace(/\s+/g, ' ').trim();
  let m = t.match(
    /^(EU|US|UK|JP|CN|Japan|China)\s+size\s+(\d+(?:\.\d+)?)\s+converts\s+approximately\s+to\s+(US|UK|EU|JP|CN)\s+(?:men'?s|women'?s|kids'?)?\s*size\s+(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?)/i
  );
  if (m) {
    return {
      from: m[1].toUpperCase().replace('JAPAN', 'JP'),
      value: m[2],
      to: m[3].toUpperCase(),
      result: m[4],
    };
  }
  m = t.match(
    /^(CM|cm)\s+(\d+(?:\.\d+)?)\s+converts\s+approximately\s+to\s+(US|UK|EU)\s+(?:men'?s|women'?s|kids'?)?\s*size\s+(\d+(?:\.\d+)?)/i
  );
  if (m) {
    return { from: 'CM', value: m[2], to: m[3].toUpperCase(), result: m[4] };
  }
  m = t.match(
    /^(US|UK|EU)\s+size\s+(\d+(?:\.\d+)?)\s+converts\s+approximately\s+to\s+(EU|US|UK)\s+size\s+(\d+(?:\.\d+)?)/i
  );
  if (m) {
    return { from: m[1].toUpperCase(), value: m[2], to: m[3].toUpperCase(), result: m[4] };
  }
  return null;
}

/** Pull first sentence from Conversion Guide section */
function extractConversionGuideParagraph(html) {
  const m = html.match(
    /<h2[^>]*>\s*Conversion Guide\s*<\/h2>\s*<p>([^<]+)<\/p>/i
  );
  return m ? m[1].trim() : null;
}

/** Find cm like "26.5 cm" or "26 cm" in visible HTML */
function extractCmFromHtml(html) {
  const m = html.match(/(\d+(?:\.\d+)?)\s*cm\b/i);
  return m ? m[1] : null;
}

/** Strip HTML entities for text */
function decodeBasicEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

module.exports = {
  generateAnswer,
  articleFor,
  parseConversionGuideParagraph,
  extractConversionGuideParagraph,
  extractCmFromHtml,
  decodeBasicEntities,
};
