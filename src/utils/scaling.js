/**
 * Scale ingredient quantities for a new serving count.
 * @param {Array} ingredients - Original ingredient list
 * @param {number} originalServings
 * @param {number} newServings
 * @returns {Array} scaled ingredients
 */
export function scaleIngredients(ingredients, originalServings, newServings) {
  if (!originalServings || originalServings === newServings) return ingredients;
  const factor = newServings / originalServings;
  return ingredients.map(ing => ({
    ...ing,
    quantity: parseFloat((ing.quantity * factor).toFixed(2))
  }));
}

/**
 * Convert a temperature value between °C and °F.
 */
export function convertTemp(value, from, to) {
  if (from === to) return value;
  if (from === 'C' && to === 'F') return Math.round(value * 9 / 5 + 32);
  if (from === 'F' && to === 'C') return Math.round((value - 32) * 5 / 9);
  return value;
}

/**
 * Convert weight/volume between metric and imperial.
 * Handles g↔oz, ml↔floz, kg↔lb.
 */
export function convertUnit(value, unit, system) {
  if (system === 'metric') return { value, unit };
  const conversions = {
    g:  { factor: 0.035274, unit: 'oz' },
    kg: { factor: 2.20462,  unit: 'lb' },
    ml: { factor: 0.033814, unit: 'fl oz' },
    l:  { factor: 33.814,   unit: 'fl oz' }
  };
  const conv = conversions[unit.toLowerCase()];
  if (!conv) return { value, unit };
  return { value: parseFloat((value * conv.factor).toFixed(2)), unit: conv.unit };
}
