const BASE = 'https://world.openfoodfacts.org/api/v0/product';

// Map Open Food Facts categories to our pantry categories
function mapCategory(offCategory = '') {
  const cat = offCategory.toLowerCase();
  if (cat.includes('dairy') || cat.includes('beverage') || cat.includes('meat') || cat.includes('fish'))
    return 'Fridge';
  if (cat.includes('frozen')) return 'Freezer';
  if (cat.includes('spice') || cat.includes('herb') || cat.includes('seasoning')) return 'Spices';
  if (cat.includes('fruit') || cat.includes('vegetable') || cat.includes('produce')) return 'Fresh Produce';
  return 'Cupboard';
}

export async function lookupBarcode(barcode) {
  const res = await fetch(`${BASE}/${barcode}.json`);
  if (!res.ok) throw new Error(`Network error ${res.status}`);
  const data = await res.json();
  if (data.status !== 1) throw new Error('Product not found');

  const p = data.product;
  return {
    name: p.product_name || p.abbreviated_product_name || 'Unknown product',
    category: mapCategory(p.categories ?? ''),
    unit: p.quantity?.includes('ml') ? 'ml' : 'g',
    brand: p.brands ?? '',
    quantity: parseInt(p.quantity ?? '0', 10) || 0
  };
}
