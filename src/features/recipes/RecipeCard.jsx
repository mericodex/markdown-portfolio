import { useState } from 'react';
import NutritionPanel from './NutritionPanel';
import CookMode from './CookMode';
import TagPill from '../../components/TagPill';
import ShareButton from '../../components/ShareButton';
import { scaleIngredients } from '../../utils/scaling';
import { formatTime } from '../../utils/formatters';
import useAppContext from '../../hooks/useAppContext';

export default function RecipeCard({ recipe, settings, index, showSaveButton = true }) {
  const { cookbook, cookbookDispatch } = useAppContext();
  const [expanded, setExpanded]     = useState(false);
  const [servings, setServings]     = useState(recipe.servings ?? 4);
  const [cookMode, setCookMode]     = useState(false);
  const [saved, setSaved]           = useState(false);
  const [targetBook, setTargetBook] = useState(cookbook.cookbooks[0]?.id ?? 'default');
  const [showSavePanel, setShowSavePanel] = useState(false);

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

  function handlePrint() {
    const prev = document.title;
    document.title = recipe.title;
    window.print();
    document.title = prev;
  }

  function getShareText() {
    const ings = scaledIngredients.map(i => `  - ${i.quantity} ${i.unit} ${i.name}`).join('\n');
    const steps = recipe.steps?.map((s, i) => `  ${i + 1}. ${s}`).join('\n') ?? '';
    const nutrition = recipe.nutrition
      ? `\nNutrition (per serving): ${recipe.nutrition.calories}kcal | Protein: ${recipe.nutrition.protein}g | Carbs: ${recipe.nutrition.carbs}g | Fat: ${recipe.nutrition.fat}g`
      : '';
    return `${recipe.title}\nPrep: ${recipe.prepTime}min | Cook: ${recipe.cookTime}min | Serves: ${servings}\n\n${recipe.description ?? ''}\n\nIngredients:\n${ings}\n\nMethod:\n${steps}${nutrition}`;
  }

  return (
    <>
      {cookMode && <CookMode recipe={recipe} onClose={() => setCookMode(false)} />}

      <div className={`recipe-card card${expanded ? ' recipe-card-expanded' : ''}`}>
        {/* Card header */}
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
            {recipe.description && (
              <p className="recipe-description">{recipe.description}</p>
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
              <ShareButton title={recipe.title} getText={getShareText} />
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
