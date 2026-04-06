/**
 * Ensures a recipe object from the AI has all required fields,
 * falling back to sensible defaults for any missing ones.
 */
export function normaliseRecipe(raw) {
  return {
    id: raw.id ?? crypto.randomUUID(),
    title: raw.title ?? 'Untitled Recipe',
    description: raw.description ?? '',
    prepTime: Number(raw.prepTime ?? 10),
    cookTime: Number(raw.cookTime ?? 20),
    servings: Number(raw.servings ?? 4),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    ingredients: normaliseIngredients(raw.ingredients),
    steps: Array.isArray(raw.steps) ? raw.steps.filter(Boolean) : [],
    nutrition: normaliseNutrition(raw.nutrition),
    breastfeedingSafe: raw.breastfeedingSafe !== false,
    breastfeedingNotes: raw.breastfeedingNotes ?? '',
    photo: raw.photo ?? null,
    cookbookId: raw.cookbookId ?? null,
    dateAdded: raw.dateAdded ?? null
  };
}

function normaliseIngredients(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(i => ({
    name: i.name ?? 'ingredient',
    quantity: Number(i.quantity ?? 0),
    unit: i.unit ?? ''
  }));
}

function normaliseNutrition(raw) {
  const defaults = { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sugar: 0 };
  if (!raw || typeof raw !== 'object') return defaults;
  return {
    calories: Number(raw.calories ?? 0),
    protein: Number(raw.protein ?? 0),
    carbs: Number(raw.carbs ?? 0),
    fat: Number(raw.fat ?? 0),
    fibre: Number(raw.fibre ?? 0),
    sugar: Number(raw.sugar ?? 0)
  };
}
