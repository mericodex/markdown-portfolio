import { useState } from 'react';
import { generateRecipes } from '../../services/claudeApi';
import { normaliseRecipe } from '../../utils/recipeParser';
import RecipeCard from './RecipeCard';
import useAppContext from '../../hooks/useAppContext';
import './recipes.css';

const CATEGORIES = ['All', 'Main Dish', 'Dessert', 'Starter', 'Quick Meal', 'Breakfast', 'Salad', 'Soup', 'Snack', 'Baking'];

export default function RecipesTab({ apiKey, settings }) {
  const { pantry } = useAppContext();
  const [mode, setMode]         = useState('craving');   // 'craving' | 'pantry' | 'surprise'
  const [craving, setCraving]   = useState('');
  const [category, setCategory] = useState('All');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [useAllPantry, setUseAllPantry]   = useState(true);
  const [recipes, setRecipes]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const pantryItems = pantry.items;

  function toggleItem(id) {
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setRecipes([]);
    try {
      const items = mode === 'pantry'
        ? (useAllPantry ? pantryItems : pantryItems.filter(i => selectedItems.has(i.id)))
        : [];
      const raw = await generateRecipes({ apiKey, mode, craving, pantryItems: items, category, settings });
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
      {/* Controls */}
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
            >
              {m.label}
            </button>
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
            <label className="pantry-checkbox-item" style={{paddingLeft:0, marginBottom:4}}>
              <input
                type="checkbox"
                checked={useAllPantry}
                onChange={e => setUseAllPantry(e.target.checked)}
              />
              <span>Use all pantry items ({pantryItems.length})</span>
            </label>
            {!useAllPantry && (
              <div className="pantry-checkboxes">
                {pantryItems.length === 0 && (
                  <p style={{fontSize:'var(--font-size-sm)',color:'var(--color-text-muted)'}}>
                    Add items to your pantry first.
                  </p>
                )}
                {pantryItems.map(item => (
                  <label key={item.id} className="pantry-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                    />
                    <span>{item.name} — {item.quantity} {item.unit}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category + generate */}
        <div className="category-row">
          <select
            className="select"
            style={{flex:1}}
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading || !canGenerate}
          >
            {loading ? <span className="spinner" /> : '✨ Generate'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="recipes-list">
        {error && <div className="recipes-error">{error}</div>}

        {loading && (
          <div className="recipes-loading">
            <div className="spinner" style={{width:40,height:40}} />
            <p>Cooking up recipe ideas just for you…</p>
          </div>
        )}

        {!loading && recipes.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">🍳</div>
            <p>Choose a mode above and tap <strong>Generate</strong> to get 4 personalised recipes.</p>
            <p style={{fontSize:'var(--font-size-xs)'}}>All recipes are filtered for breastfeeding safety.</p>
          </div>
        )}

        {recipes.map((recipe, i) => (
          <RecipeCard key={recipe.id} recipe={recipe} settings={settings} index={i} />
        ))}
      </div>
    </div>
  );
}
