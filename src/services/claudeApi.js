// In dev, route through Vite proxy to avoid CORS/firewall blocks
const API_URL = import.meta.env.DEV
  ? '/api/anthropic/v1/messages'
  : 'https://api.anthropic.com/v1/messages';
const MODEL   = 'claude-opus-4-6';

async function callClaude(apiKey, systemPrompt, userContent, maxTokens = 2000) {
  const key = (apiKey ?? '').trim();
  if (!key) {
    throw new Error('No API key set. Go to Settings and enter your Anthropic API key.');
  }

  const messages = Array.isArray(userContent)
    ? [{ role: 'user', content: userContent }]
    : [{ role: 'user', content: userContent }];

  // Only send the browser header when calling the API directly (not through proxy)
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
  };
  if (!import.meta.env.DEV) {
    headers['anthropic-dangerous-allow-browser'] = 'true';
  }

  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system: systemPrompt, messages })
    });
  } catch (networkErr) {
    throw new Error(
      'Could not reach the Anthropic API. Check your internet connection, and make sure no firewall or antivirus is blocking requests to api.anthropic.com.'
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message ?? '';
    if (res.status === 401) throw new Error('API key rejected. Go to Settings and enter a valid Anthropic API key.');
    if (res.status === 429) throw new Error('Rate limit hit. Wait a moment and try again.');
    if (res.status === 400) throw new Error(`Bad request: ${msg}`);
    throw new Error(msg || `API error ${res.status}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

// ── Recipe Generation ──────────────────────────────────────────────────────

const SYSTEM_RECIPE = `You are a helpful recipe assistant.
Respond ONLY with valid JSON — no markdown fences, no explanations outside the JSON.
Format each recipe as:
{
  "title": "Recipe Name",
  "description": "1-2 sentence description",
  "prepTime": 10,
  "cookTime": 20,
  "servings": 4,
  "tags": ["Main Dish", "Quick Meal"],
  "ingredients": [{"name": "chicken breast", "quantity": 300, "unit": "g"}],
  "steps": ["Step 1 text", "Step 2 text"],
  "nutrition": {"calories": 350, "protein": 28, "carbs": 32, "fat": 12, "fibre": 4, "sugar": 6}
}
Return an array of exactly 4 recipe objects.`;

export async function generateRecipes({ apiKey, mode, craving, pantryItems, category, dietaryFilters = [], settings }) {
  let userMsg = '';
  if (mode === 'craving') {
    userMsg = `Generate 4 recipes based on this craving: "${craving}".`;
  } else if (mode === 'pantry') {
    const ingredients = pantryItems.map(i => `${i.name} (${i.quantity} ${i.unit ?? ''})`).join(', ');
    userMsg = `Generate 4 recipes using some or all of these pantry ingredients: ${ingredients}.`;
  } else {
    userMsg = `Generate 4 completely surprising and delicious recipes — be creative!`;
  }
  if (category && category !== 'All') userMsg += ` Category: ${category}.`;
  if (dietaryFilters.length > 0) userMsg += ` Dietary requirements: ${dietaryFilters.join(', ')}.`;
  if (settings?.measurementSystem === 'imperial') userMsg += ' Use imperial measurements (oz, lbs, cups, °F).';
  userMsg += ' Return a JSON array of exactly 4 recipes.';

  const text = await callClaude(apiKey, SYSTEM_RECIPE, userMsg, 3000);
  try {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Could not parse recipe response. Please try again.');
  }
}

// ── Recipe Adjustment ─────────────────────────────────────────────────────

export async function adjustRecipe({ apiKey, recipe, question, photoBase64 }) {
  const systemPrompt = `You are a knowledgeable recipe assistant specialising in healthy substitutions, dietary adaptations, and nutritional improvements. Give clear, practical suggestions.`;

  const userContent = photoBase64
    ? [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: photoBase64 }
        },
        {
          type: 'text',
          text: question
            ? `For the recipe in this image: ${question}`
            : 'Please read this recipe and suggest improvements, including nutritional notes and any substitutions.'
        }
      ]
    : `Recipe:\n${recipe}\n\nQuestion: ${question || 'How can I make this recipe more nutritious and suggest any useful substitutions?'}`;

  return callClaude(apiKey, systemPrompt, userContent, 1500);
}

// ── Cookbook AI Cover ─────────────────────────────────────────────────────

export async function generateCookbookCover({ apiKey, cookbookName, recipes }) {
  const titles = recipes.slice(0, 10).map(r => r.title).join(', ');
  const prompt = `Create a charming cookbook cover description for a cookbook called "${cookbookName}" containing recipes like: ${titles || 'various home recipes'}.
Return JSON: { "emoji": "🍳", "tagline": "A short, heartwarming tagline under 12 words", "style": "brief description of the cover aesthetic" }`;
  const text = await callClaude(apiKey, 'You create whimsical, warm cookbook cover descriptions.', prompt, 200);
  try {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { emoji: '📖', tagline: cookbookName, style: 'Classic' };
  }
}

// ── Meal Plan AI Suggest ──────────────────────────────────────────────────

export async function suggestMeal({ apiKey, day, mealType, existingRecipes, pantryItems }) {
  const recipeNames = existingRecipes.slice(0, 20).map(r => r.title).join(', ');
  const pantryNames = pantryItems.slice(0, 10).map(i => i.name).join(', ');
  const prompt = `Suggest a single ${mealType} meal for ${day}.
Available cookbook recipes: ${recipeNames || 'none'}.
Available pantry items: ${pantryNames || 'general pantry'}.
Return JSON: { "label": "Meal name or recipe title", "type": "recipe" or "custom", "portion": "1 portion" }`;
  const text = await callClaude(apiKey, 'You are a helpful meal planning assistant.', prompt, 200);
  try {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { label: 'Healthy meal suggestion', type: 'custom', portion: '1 portion' };
  }
}

// ── Pantry Photo ID ───────────────────────────────────────────────────────

export async function identifyPantryItem({ apiKey, photoBase64, mimeType = 'image/jpeg' }) {
  const userContent = [
    {
      type: 'image',
      source: { type: 'base64', media_type: mimeType, data: photoBase64 }
    },
    {
      type: 'text',
      text: 'Identify the food item in this photo. Return JSON: { "name": "item name", "category": "Fridge|Freezer|Cupboard|Spices|Fresh Produce|Other", "unit": "g|ml|each|bunch|pack" }'
    }
  ];
  const text = await callClaude(apiKey, 'You identify food items from photos accurately.', userContent, 200);
  try {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { name: 'Unknown item', category: 'Other', unit: 'each' };
  }
}

// ── Import recipe from URL ────────────────────────────────────────────────

export async function importRecipeFromUrl({ apiKey, url }) {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
  ];

  let html = '';
  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
      if (res.ok) { html = await res.text(); break; }
    } catch { /* try next */ }
  }

  if (!html) {
    throw new Error('Could not load the page through any proxy. Try pasting the recipe text manually instead.');
  }

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 5000);

  return importRecipeFromText({ apiKey, text });
}

export async function importRecipeFromText({ apiKey, text }) {
  const systemPrompt = `Extract a structured recipe from the provided text. Return valid JSON matching this schema exactly:
{ "title":"", "description":"", "prepTime":0, "cookTime":0, "servings":4, "tags":[], "ingredients":[{"name":"","quantity":0,"unit":""}], "steps":[], "nutrition":{"calories":0,"protein":0,"carbs":0,"fat":0,"fibre":0,"sugar":0} }`;
  const result = await callClaude(apiKey, systemPrompt, `Extract this recipe:\n\n${text.slice(0, 4000)}`, 2000);
  try {
    const cleaned = result.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Could not extract recipe from text. Please try pasting a different format.');
  }
}

// ── Import recipe from photo ──────────────────────────────────────────────

export async function importRecipeFromPhoto({ apiKey, photoBase64, mimeType = 'image/jpeg' }) {
  const systemPrompt = `Extract a structured recipe from the photo of a recipe book or card. Return valid JSON matching this schema exactly:
{ "title":"", "description":"", "prepTime":0, "cookTime":0, "servings":4, "tags":[], "ingredients":[{"name":"","quantity":0,"unit":""}], "steps":[], "nutrition":{"calories":0,"protein":0,"carbs":0,"fat":0,"fibre":0,"sugar":0} }`;
  const userContent = [
    { type: 'image', source: { type: 'base64', media_type: mimeType, data: photoBase64 } },
    { type: 'text', text: 'Extract the recipe from this image.' }
  ];
  const result = await callClaude(apiKey, systemPrompt, userContent, 2000);
  try {
    const cleaned = result.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Could not extract recipe from photo.');
  }
}
