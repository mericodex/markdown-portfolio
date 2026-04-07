import { useState } from 'react';
import { generateRecipes } from '../../services/claudeApi';
import { normaliseRecipe } from '../../utils/recipeParser';
import RecipeCard from './RecipeCard';
import ShareButton from '../../components/ShareButton';
import AddRecipeModal from '../../components/AddRecipeModal';
import useAppContext from '../../hooks/useAppContext';
import './recipes.css';

const CATEGORIES = ['All', 'Main Dish', 'Dessert', 'Starter', 'Quick Meal', 'Breakfast', 'Salad', 'Soup', 'Snack', 'Baking'];

const PRESET_DIETARY = [
  'Gluten Free', 'Dairy Free', 'Diabetic Friendly', 'Breastfeeding Safe',
  'Vegan', 'Vegetarian', 'Low Carb', 'High Protein', 'Nut Free', 'Low Sodium',
];

function getShareText(recipes) {
  if (!recipes.length) return '';
  return recipes.map(r => {
    const ings  = r.ingredients?.map(i => `  - ${i.quantity} ${i.unit} ${i.name}`).join('\n') ?? '';
    const steps = r.steps?.map((s, i) => `  ${i + 1}. ${s}`).join('\n') ?? '';
    return `${r.title}\nPrep: ${r.prepTime}min | Cook: ${r.cookTime}min | Serves: ${r.servings}\n\nIngredients:\n${ings}\n\nMethod:\n${steps}`;
  }).join('\n\n---\n\n');
}

export default function RecipesTab({ apiKey, settings }) {
  const { pantry } = useAppContext();

  const [mode, setMode]             = useState('craving');
  const [craving, setCraving]       = useState('');
  const [category, setCategory]     = useState('All');
  const [selectedItems, setSelectedItems]   = useState(new Set());
  const [useAllPantry, setUseAllPantry]     = useState(true);

  // Dietary filters — preset + custom
  const [dietaryFilters, setDietaryFilters] = useState([]);
  const [showDietary, setShowDietary]       = useState(false);
  const [customFilter, setCustomFilter]     = useState('');

  const [recipes, setRecipes]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [showAddRecipe, setShowAddRecipe] = useState(false);

  const pantryItems = pantry.items;

  function toggleItem(id) {
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleDietary(opt) {
    setDietaryFilters(prev =>
      prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]
    );
  }

  function addCustomFilter() {
    const val = customFilter.trim();
    if (!val || dietaryFilters.includes(val)) { setCustomFilter(''); return; }
    setDietaryFilters(prev => [...prev, val]);
    setCustomFilter('');
  }

  function removeFilter(opt) {
    setDietaryFilters(prev => prev.filter(x => x !== opt));
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setRecipes([]);
    try {
      const items = mode === 'pantry'
        ? (useAllPantry ? pantryItems : pantryItems.filter(i => selectedItems.has(i.id)))
        : [];
      const raw = await generateRecipes({ apiKey, mode, craving, pantryItems: items, category, dietaryFilters, settings });
      setRecipes(Array.isArray(raw) ? raw.map(normaliseRecipe) : []);
    } catch (e) {
      setError(e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = mode === 'craving' ? craving.trim().length > 0
    : mode === 'pantry' ? (useAllPantry ? pantryItems.length > 0 : selectedItems.size > 0)
    : true;

  return (
    <div className="recipes-tab">
      <div className="recipes-controls">
        {/* Mode selector */}
        <div className="recipes-mode-tabs">
          {[
            { id: 'craving',  label: '💭 By Craving' },
            { id: 'pantry',   label: '🥕 From Pantry' },
            { id: 'surprise', label: '🎲 Surprise Me' },
          ].map(m => (
            <button
              key={m.id}
              className={`mode-tab-btn${mode === m.id ? ' active' : ''}`}
              onClick={() => setMode(m.id)}
            >{m.label}</button>
          ))}
        </div>

        {/* Craving input */}
        {mode === 'craving' && (
          <div className="recipes-input-row">
            <input
              className="input"
              placeholder="e.g. something cheesy and comforting..."
              value={craving}
              onChange={e => setCraving(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canGenerate && handleGenerate()}
            />
          </div>
        )}

        {/* Pantry selector */}
        {mode === 'pantry' && (
          <div>
            <label className="pantry-checkbox-item" style={{ paddingLeft: 0, marginBottom: 4 }}>
              <input type="checkbox" checked={useAllPantry} onChange={e => setUseAllPantry(e.target.checked)} />
              <span>Use all pantry items ({pantryItems.length})</span>
            </label>
            {!useAllPantry && (
              <div className="pantry-checkboxes">
                {pantryItems.length === 0 && (
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Add items to your pantry first.</p>
                )}
                {pantryItems.map(item => (
                  <label key={item.id} className="pantry-checkbox-item">
                    <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => toggleItem(item.id)} />
                    <span>{item.name} — {item.quantity} {item.unit}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dietary filters */}
        <div>
          <button
            className={`btn btn-sm ${showDietary ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowDietary(s => !s)}
          >
            🥗 Dietary Filters {dietaryFilters.length > 0 ? `(${dietaryFilters.length} active)` : ''}
          </button>

          {showDietary && (
            <div className="dietary-panel">
              {/* Preset checkboxes */}
              <div className="dietary-options">
                {PRESET_DIETARY.map(opt => (
                  <label key={opt} className="pantry-checkbox-item">
                    <input type="checkbox" checked={dietaryFilters.includes(opt)} onChange={() => toggleDietary(opt)} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>

              {/* Custom filter input */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  className="input"
                  placeholder="Add your own filter… e.g. Low FODMAP"
                  value={customFilter}
                  onChange={e => setCustomFilter(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomFilter()}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-secondary btn-sm" onClick={addCustomFilter} disabled={!customFilter.trim()}>
                  + Add
                </button>
              </div>
            </div>
          )}

          {/* Active filter tags */}
          {dietaryFilters.length > 0 && (
            <div className="active-filters">
              {dietaryFilters.map(f => (
                <span key={f} className="active-filter-tag">
                  {f}
                  <button onClick={() => removeFilter(f)}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Category + generate */}
        <div className="category-row">
          <select className="select" style={{ flex: 1 }} value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || !canGenerate}>
            {loading ? <span className="spinner" /> : '✨ Generate'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="recipes-list">
        {error && <div className="recipes-error">{error}</div>}

        {loading && (
          <div className="recipes-loading">
            <div className="spinner" style={{ width: 40, height: 40 }} />
            <p>Cooking up recipe ideas just for you…</p>
          </div>
        )}

        {!loading && recipes.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">🍳</div>
            <p>Choose a mode above and tap <strong>Generate</strong> to get 4 recipes.</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => setShowAddRecipe(true)}>
              ✏️ Add a recipe manually
            </button>
          </div>
        )}

        {recipes.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddRecipe(true)}>
              ✏️ Add Recipe
            </button>
            <ShareButton title="My Recipes" getText={() => getShareText(recipes)} />
          </div>
        )}

        {recipes.map((recipe, i) => (
          <RecipeCard key={recipe.id} recipe={recipe} settings={settings} index={i} />
        ))}
      </div>

      <AddRecipeModal isOpen={showAddRecipe} onClose={() => setShowAddRecipe(false)} />
    </div>
  );
}
