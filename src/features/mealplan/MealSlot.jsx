import { memo, useState } from 'react';
import Modal from '../../components/Modal';
import useAppContext from '../../hooks/useAppContext';
import { suggestMeal } from '../../services/claudeApi';

const PORTIONS = ['1 portion', '½ portion', '2 portions', 'Side'];

const MealSlot = memo(function MealSlot({ day, meal, apiKey }) {
  const { mealPlan, mealPlanDispatch, cookbook, pantry } = useAppContext();
  const items = mealPlan.week[day]?.[meal] ?? [];

  const [showAdd, setShowAdd]   = useState(false);
  const [addType, setAddType]   = useState('recipe');   // 'recipe' | 'custom'
  const [recipeId, setRecipeId] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [portion, setPortion]   = useState('1 portion');
  const [suggesting, setSuggesting] = useState(false);

  function handleAdd() {
    const label = addType === 'recipe'
      ? cookbook.recipes.find(r => r.id === recipeId)?.title ?? 'Recipe'
      : customLabel;
    if (!label) return;
    mealPlanDispatch({
      type: 'ADD_MEAL_ITEM',
      day, meal,
      item: { type: addType, recipeId: addType === 'recipe' ? recipeId : undefined, label, portion }
    });
    setShowAdd(false);
    setCustomLabel('');
    setRecipeId('');
    setPortion('1 portion');
  }

  async function handleAISuggest(e) {
    e.stopPropagation();
    setSuggesting(true);
    try {
      const suggestion = await suggestMeal({
        apiKey,
        day, mealType: meal,
        existingRecipes: cookbook.recipes,
        pantryItems: pantry.items
      });
      mealPlanDispatch({
        type: 'ADD_MEAL_ITEM',
        day, meal,
        item: { type: suggestion.type ?? 'custom', label: suggestion.label, portion: suggestion.portion ?? '1 portion' }
      });
    } catch {}
    setSuggesting(false);
  }

  return (
    <>
      <div className="mealplan-meal-slot">
        <div className="meal-slot-header">
          <span className="meal-slot-label">{meal}</span>
          <button
            className="meal-slot-ai-btn"
            onClick={handleAISuggest}
            disabled={suggesting}
            title="AI Suggest"
          >
            {suggesting ? '…' : '✨'}
          </button>
        </div>

        {items.map(item => (
          <div key={item.id} className="meal-slot-item">
            <span className="meal-slot-item-text">{item.label}</span>
            <span className="meal-slot-item-portion">{item.portion}</span>
            <button
              className="meal-slot-item-remove"
              onClick={() => mealPlanDispatch({ type: 'REMOVE_MEAL_ITEM', day, meal, itemId: item.id })}
              aria-label="Remove"
            >✕</button>
          </div>
        ))}

        <button className="meal-slot-add" onClick={() => setShowAdd(true)}>+ Add</button>
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={`${day} – ${meal}`}>
        {/* Type toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button
            className={`btn btn-sm ${addType === 'recipe' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAddType('recipe')}
          >📖 From Cookbook</button>
          <button
            className={`btn btn-sm ${addType === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAddType('custom')}
          >✏️ Custom</button>
        </div>

        {addType === 'recipe' ? (
          <div className="form-group">
            <label className="label">Recipe</label>
            <select className="select" value={recipeId} onChange={e => setRecipeId(e.target.value)}>
              <option value="">— choose a recipe —</option>
              {cookbook.recipes.map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="form-group">
            <label className="label">Meal description</label>
            <input
              className="input"
              placeholder="e.g. Avocado toast with eggs"
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              autoFocus
            />
          </div>
        )}

        <div className="form-group">
          <label className="label">Portion</label>
          <div className="portion-options">
            {PORTIONS.map(p => (
              <button
                key={p}
                className={`portion-btn${portion === p ? ' selected' : ''}`}
                onClick={() => setPortion(p)}
              >{p}</button>
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={addType === 'recipe' ? !recipeId : !customLabel}
        >
          Add to {meal}
        </button>
      </Modal>
    </>
  );
});

export default MealSlot;
