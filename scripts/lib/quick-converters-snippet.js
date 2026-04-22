'use strict';

/**
 * Single canonical "Quick Converters" block (absolute / paths).
 * Used by generators, injectors, and batch standardization — do not duplicate markup elsewhere.
 */
const QUICK_CONVERTERS_HTML = `<section class="card">
  <h2>Quick Converters</h2>

  <div class="grid grid-3">

  <a href="/tools/shoe-size-converter.html" class="card-link">
    <h3>Shoe Size Converter</h3>
    <p>Convert shoe sizes between US, UK, EU, Japan, China, and CM.</p>
  </a>

  <a href="/tools/clothing-size-converter.html" class="card-link">
    <h3>Clothing Size Converter</h3>
    <p>Convert clothing sizes for tops, pants, and dresses across regions.</p>
  </a>

  <a href="/measurement/cm-to-us.html" class="card-link">
    <h3>CM to US Shoe Size</h3>
    <p>Convert foot length in centimeters to US shoe sizes.</p>
  </a>

  <a href="/measurement/us-to-eu.html" class="card-link">
    <h3>US to EU Size</h3>
    <p>Convert US sizes to European sizing standards.</p>
  </a>

  <a href="/measurement/uk-to-us.html" class="card-link">
    <h3>UK to US Size</h3>
    <p>Convert UK sizes to US equivalents.</p>
  </a>

  <a href="/measurement/eu-to-us.html" class="card-link">
    <h3>EU to US Size</h3>
    <p>Convert European sizes to US sizing.</p>
  </a>

  <a href="/tools/home/mattress-size-chart.html" class="card-link">
    <h3>Mattress Size Chart</h3>
    <p>Compare mattress sizes across US, UK, and EU.</p>
  </a>

  <a href="/measurement/" class="card-link">
    <h3>Measurement Tools</h3>
    <p>Explore unit conversions and measurement standards.</p>
  </a>

</div>
</section>`;

function mainHasQuickConverters($, $main) {
  return (
    $main.find('section.card').filter((_, el) => $(el).find('> h2').first().text().trim() === 'Quick Converters').length > 0
  );
}

module.exports = { QUICK_CONVERTERS_HTML, mainHasQuickConverters };
