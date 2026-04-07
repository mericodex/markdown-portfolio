import { useState } from 'react';
import ShareButton from '../../components/ShareButton';
import NutritionPanel from './NutritionPanel';
import AddRecipeModal from '../../components/AddRecipeModal';
import { scaleIngredients } from '../../utils/scaling';
import { formatTime } from '../../utils/formatters';
import useAppContext from '../../hooks/useAppContext';
import './RecipeDetailPage.css';

export default function RecipeDetailPage({ recipe: initialRecipe, onBack, showSaveButton = true, settings, allowEdit = false }) {
  const { cookbook, cookbookDispatch } = useAppContext();

  // recipe may be updated via edit, so track locally
  const [recipe, setRecipe] = useState(initialRecipe);
  const [showEdit, setShowEdit]     = useState(false);

  const [servings, setServings]     = useState(recipe.servings ?? 4);
  const [checked, setChecked]       = useState(() => (recipe.ingredients ?? []).map(() => false));
  const [donestep, setDoneStep]     = useState(() => (recipe.steps ?? []).map(() => false));
  const [saved, setSaved]           = useState(false);
  const [targetBook, setTargetBook] = useState(cookbook.cookbooks[0]?.id ?? 'default');
  const [showSavePanel, setShowSavePanel] = useState(false);

  // recipe is in the cookbook if it has an id stored in cookbook.recipes
  const inCookbook = cookbook.recipes.some(r => r.id === recipe.id);
  const canEditDelete = allowEdit || inCookbook;

  function handleDelete() {
    if (!window.confirm(`Delete "${recipe.title}"?`)) return;
    cookbookDispatch({ type: 'DELETE_RECIPE', id: recipe.id });
    onBack();
  }

  const scaledIngredients = scaleIngredients(recipe.ingredients ?? [], recipe.servings ?? 4, servings);

  function toggleIngredient(i) {
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v));
  }

  function toggleStep(i) {
    setDoneStep(prev => prev.map((v, idx) => idx === i ? !v : v));
  }

  function handleSave() {
    cookbookDispatch({ type: 'ADD_RECIPE', recipe: { ...recipe, cookbookId: targetBook, servings } });
    setSaved(true);
    setShowSavePanel(false);
    setTimeout(() => setSaved(false), 3000);
  }

  function getShareText() {
    const ings = scaledIngredients.map(i => `  - ${i.quantity} ${i.unit} ${i.name}`).join('\n');
    const steps = recipe.steps?.map((s, i) => `  ${i + 1}. ${s}`).join('\n') ?? '';
    return `${recipe.title}\nPrep: ${recipe.prepTime}min | Cook: ${recipe.cookTime}min | Serves: ${servings}\n\n${recipe.description ?? ''}\n\nIngredients:\n${ings}\n\nMethod:\n${steps}`;
  }

  const allChecked = checked.length > 0 && checked.every(Boolean);

  return (
    <>
    <AddRecipeModal
      isOpen={showEdit}
      onClose={() => setShowEdit(false)}
      editRecipe={recipe}
      onSaved={updated => setRecipe(r => ({ ...r, ...updated }))}
    />

    <div className="rdp-page">
      {/* Hero */}
      <div className="rdp-hero">
        <button className="rdp-back-btn" onClick={onBack} aria-label="Back">
          ← Back
        </button>
        <div className="rdp-hero-actions">
          <ShareButton title={recipe.title} getText={getShareText} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'transparent', fontSize: '0.75rem', padding: '6px 12px' }} />
          {canEditDelete && (
            <button className="rdp-hero-action-btn" onClick={() => setShowEdit(true)}>✏️ Edit</button>
          )}
          {canEditDelete && (
            <button className="rdp-hero-action-btn rdp-hero-action-delete" onClick={handleDelete}>🗑</button>
          )}
        </div>
        <div className="rdp-hero-content">
          {recipe.tags?.length > 0 && (
            <span className="rdp-hero-category">{recipe.tags[0]}</span>
          )}
          <h1 className="rdp-hero-title">{recipe.title}</h1>
        </div>
      </div>

      <div className="rdp-body">
        {/* Meta row */}
        <div className="rdp-meta-grid">
          <div className="rdp-meta-cell">
            <span className="rdp-meta-label">Serving size</span>
            <div className="rdp-servings-control">
              <button className="rdp-servings-btn" onClick={() => setServings(s => Math.max(1, s - 1))}>−</button>
              <span className="rdp-servings-val">{servings}</span>
              <button className="rdp-servings-btn" onClick={() => setServings(s => s + 1)}>+</button>
            </div>
          </div>
          <div className="rdp-meta-cell">
            <span className="rdp-meta-label">Prep time</span>
            <span className="rdp-meta-value">{formatTime(recipe.prepTime)}</span>
          </div>
          <div className="rdp-meta-cell">
            <span className="rdp-meta-label">Cook time</span>
            <span className="rdp-meta-value">{formatTime(recipe.cookTime)}</span>
          </div>
          {recipe.description && (
            <div className="rdp-meta-cell rdp-meta-full">
              <span className="rdp-meta-label">Description</span>
              <span className="rdp-meta-value" style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
                {recipe.description}
              </span>
            </div>
          )}
        </div>

        {/* Ingredients */}
        <div className="rdp-section">
          <div className="rdp-section-header">
            <h2 className="rdp-section-title">Ingredients</h2>
            {checked.length > 0 && (
              <button
                className="rdp-clear-btn"
                onClick={() => setChecked((recipe.ingredients ?? []).map(() => false))}
              >
                Reset
              </button>
            )}
          </div>
          <p className="rdp-section-hint">Tap to tick off as you add each ingredient</p>
          <ul className="rdp-ingredients">
            {scaledIngredients.map((ing, i) => (
              <li
                key={i}
                className={`rdp-ingredient${checked[i] ? ' rdp-ingredient-done' : ''}`}
                onClick={() => toggleIngredient(i)}
              >
                <span className={`rdp-check-circle${checked[i] ? ' rdp-check-circle-done' : ''}`}>
                  {checked[i] ? '✓' : ''}
                </span>
                <span className="rdp-ing-qty">{ing.quantity} {ing.unit}</span>
                <span className="rdp-ing-name">{ing.name}</span>
              </li>
            ))}
          </ul>
          {allChecked && (
            <div className="rdp-all-checked">All ingredients ready!</div>
          )}
        </div>

        {/* Steps */}
        <div className="rdp-section">
          <div className="rdp-section-header">
            <h2 className="rdp-section-title">Directions</h2>
            {donestep.some(Boolean) && (
              <button
                className="rdp-clear-btn"
                onClick={() => setDoneStep((recipe.steps ?? []).map(() => false))}
              >
                Reset
              </button>
            )}
          </div>
          <p className="rdp-section-hint">Tap a step to mark your progress</p>
          <ol className="rdp-steps">
            {recipe.steps?.map((step, i) => (
              <li
                key={i}
                className={`rdp-step${donestep[i] ? ' rdp-step-done' : ''}`}
                onClick={() => toggleStep(i)}
              >
                <span className={`rdp-step-num${donestep[i] ? ' rdp-step-num-done' : ''}`}>{i + 1}</span>
                <span className="rdp-step-text">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Nutrition */}
        {recipe.nutrition && (
          <div className="rdp-section">
            <h2 className="rdp-section-title">Nutrition</h2>
            <p className="rdp-section-hint">Per serving</p>
            <NutritionPanel nutrition={recipe.nutrition} servings={servings} />
          </div>
        )}

        {/* Actions */}
        <div className="rdp-actions">
          {showSaveButton && !saved && (
            <button className="btn btn-primary" onClick={() => setShowSavePanel(p => !p)}>
              🔖 Save to Cookbook
            </button>
          )}
          {saved && <span className="rdp-saved-msg">✓ Saved to cookbook!</span>}
        </div>

        {showSavePanel && (
          <div className="rdp-save-panel">
            <label className="label">Save to</label>
            <select className="select" value={targetBook} onChange={e => setTargetBook(e.target.value)}>
              {cookbook.cookbooks.map(cb => (
                <option key={cb.id} value={cb.id}>{cb.name}</option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" onClick={handleSave} style={{ marginTop: 10 }}>
              Save Recipe
            </button>
          </div>
        )}

        <div style={{ height: 'calc(var(--tab-bar-height) + 24px)' }} />
      </div>
    </div>
    </>
  );
}
