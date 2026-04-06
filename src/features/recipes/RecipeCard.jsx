import { useState, useRef } from 'react';
import NutritionPanel from './NutritionPanel';
import CookMode from './CookMode';
import TagPill from '../../components/TagPill';
import { scaleIngredients } from '../../utils/scaling';
import { formatTime } from '../../utils/formatters';
import useAppContext from '../../hooks/useAppContext';

const COOKBOOK_COLORS = ['#c0392b','#1a6b8a','#d35400','#7d3c98','#1e6b3c','#c07a2b','#2980b9'];

export default function RecipeCard({ recipe, settings, index, showSaveButton = true }) {
  const { cookbook, cookbookDispatch } = useAppContext();
  const [expanded, setExpanded]   = useState(false);
  const [servings, setServings]   = useState(recipe.servings ?? 4);
  const [cookMode, setCookMode]   = useState(false);
  const [saved, setSaved]         = useState(false);
  const [targetBook, setTargetBook] = useState(cookbook.cookbooks[0]?.id ?? 'default');
  const [showSavePanel, setShowSavePanel] = useState(false);
  const photoRef = useRef(null);

  const scaledIngredients = scaleIngredients(recipe.ingredients ?? [], recipe.servings ?? 4, servings);

  function handleSave() {
    cookbookDispatch({
      type: 'ADD_RECIPE',
      recipe: { ...recipe, cookbookId: targetBook, servings }
    });
    setSaved(true);
    setShowSavePanel(false);
    setTimeout(() => setSaved(false), 3000);
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      // In a real implementation this would call updateRecipe; here we show it inline
    };
    reader.readAsDataURL(file);
  }

  function handlePrint() {
    const prev = document.title;
    document.title = recipe.title;
    window.print();
    document.title = prev;
  }

  return (
    <>
      {cookMode && <CookMode recipe={{ ...recipe, steps: recipe.steps }} onClose={() => setCookMode(false)} />}

      <div className={`recipe-card card${expanded ? ' recipe-card-expanded' : ''}`}>
        {/* Card header — always visible */}
        <button
          className="recipe-card-header"
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
        >
          <div className="recipe-card-header-left">
            <span className="recipe-card-index">{index + 1}</span>
            <div>
              <div className="recipe-card-title">{recipe.title}</div>
              <div className="recipe-card-meta">
                {formatTime(recipe.prepTime + recipe.cookTime)} &middot; {recipe.servings} servings
              </div>
            </div>
          </div>
          <div className="recipe-card-header-right">
            {recipe.breastfeedingSafe && (
              <span className="badge badge-green recipe-bf-badge" title="Breastfeeding safe">🤱 BF Safe</span>
            )}
            <span className="recipe-card-chevron">{expanded ? '▲' : '▼'}</span>
          </div>
        </button>

        {/* Tags row */}
        {recipe.tags?.length > 0 && (
          <div className="recipe-tags">
            {recipe.tags.map(tag => <TagPill key={tag} label={tag} />)}
          </div>
        )}

        {/* Expanded content */}
        {expanded && (
          <div className="recipe-card-body">
            {/* Description */}
            {recipe.description && (
              <p className="recipe-description">{recipe.description}</p>
            )}

            {/* Breastfeeding note */}
            {recipe.breastfeedingNotes && (
              <div className="recipe-bf-note">
                <span>🤱</span>
                <span>{recipe.breastfeedingNotes}</span>
              </div>
            )}

            {/* Servings adjuster */}
            <div className="servings-row">
              <span className="label" style={{marginBottom:0}}>Servings</span>
              <div className="servings-controls">
                <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setServings(s => Math.max(1, s - 1))}>−</button>
                <span className="servings-count">{servings}</span>
                <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setServings(s => s + 1)}>+</button>
              </div>
            </div>

            {/* Ingredients */}
            <div className="recipe-section">
              <h4 className="recipe-section-title">Ingredients</h4>
              <ul className="ingredients-list">
                {scaledIngredients.map((ing, i) => (
                  <li key={i} className="ingredient-item">
                    <span className="ingredient-qty">{ing.quantity} {ing.unit}</span>
                    <span className="ingredient-name">{ing.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Steps */}
            <div className="recipe-section">
              <h4 className="recipe-section-title">Method</h4>
              <ol className="steps-list">
                {recipe.steps?.map((step, i) => (
                  <li key={i} className="step-item">{step}</li>
                ))}
              </ol>
            </div>

            {/* Nutrition */}
            <div className="recipe-section">
              <h4 className="recipe-section-title">Nutrition (per serving)</h4>
              <NutritionPanel nutrition={recipe.nutrition} servings={servings} />
            </div>

            {/* Action bar */}
            <div className="recipe-actions">
              <button className="btn btn-primary btn-sm" onClick={() => setCookMode(true)}>
                👩‍🍳 Cook Mode
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
                🖨 Print
              </button>
              {showSaveButton && (
                <button
                  className={`btn btn-sm ${saved ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => setShowSavePanel(p => !p)}
                >
                  {saved ? '✓ Saved!' : '🔖 Save'}
                </button>
              )}
            </div>

            {/* Save to cookbook panel */}
            {showSavePanel && (
              <div className="save-panel">
                <label className="label">Save to cookbook</label>
                <select
                  className="select"
                  value={targetBook}
                  onChange={e => setTargetBook(e.target.value)}
                >
                  {cookbook.cookbooks.map(cb => (
                    <option key={cb.id} value={cb.id}>{cb.name}</option>
                  ))}
                </select>
                <button className="btn btn-primary btn-sm" onClick={handleSave} style={{marginTop:8}}>
                  Save Recipe
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
