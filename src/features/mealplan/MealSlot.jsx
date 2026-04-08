import { memo, useState } from 'react';
import Modal from '../../components/Modal';
import useAppContext from '../../hooks/useAppContext';
import { suggestMeal } from '../../services/claudeApi';

const PORTIONS = ['1 portion', '½ portion', '2 portions', 'Side'];
const MEAL_CATS = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Any'];

const MealSlot = memo(function MealSlot({ day, meal, apiKey, weekId, weekData }) {
  const { mealPlanDispatch, cookbook, pantry, mealPlan } = useAppContext();
  const items = weekData?.[day]?.[meal] ?? [];

  const [showAdd, setShowAdd]         = useState(false);
  const [addType, setAddType]         = useState('recipe'); // 'recipe' | 'library' | 'custom'
  const [recipeId, setRecipeId]       = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [portion, setPortion]         = useState('1 portion');
  const [suggesting, setSuggesting]   = useState(false);

  // Library tab state
  const library    = mealPlan.library ?? [];
  const [libFilter, setLibFilter]     = useState(meal); // default filter = current meal type
  const [selectedLibId, setSelectedLibId] = useState('');

  const filteredLib = libFilter === 'All'
    ? library
    : library.filter(t => t.category === libFilter || t.category === 'Any');

  function dispatch(type, extra = {}) {
    mealPlanDispatch({ type, day, meal, weekId, ...extra });
  }

  function resetForm() {
    setCustomLabel('');
    setRecipeId('');
    setSelectedLibId('');
    setPortion('1 portion');
    setAddType('recipe');
    setLibFilter(meal);
  }

  function handleAdd() {
    let label, recipeIdToUse, typeToUse;

    if (addType === 'recipe') {
      const r = cookbook.recipes.find(r => r.id === recipeId);
      if (!r) return;
      label = r.title;
      recipeIdToUse = recipeId;
      typeToUse = 'recipe';
    } else if (addType === 'library') {
      const t = library.find(t => t.id === selectedLibId);
      if (!t) return;
      label = t.label;
      recipeIdToUse = t.recipeId || undefined;
      typeToUse = t.recipeId ? 'recipe' : 'custom';
    } else {
      label = customLabel.trim();
      if (!label) return;
      typeToUse = 'custom';
    }

    dispatch('ADD_MEAL_ITEM', {
      item: { type: typeToUse, recipeId: recipeIdToUse, label, portion }
    });
    setShowAdd(false);
    resetForm();
  }

  const isAddDisabled =
    addType === 'recipe'  ? !recipeId :
    addType === 'library' ? !selectedLibId :
    !customLabel.trim();

  async function handleAISuggest(e) {
    e.stopPropagation();
    setSuggesting(true);
    try {
      const s = await suggestMeal({
        apiKey, day, mealType: meal,
        existingRecipes: cookbook.recipes,
        pantryItems: pantry.items
      });
      dispatch('ADD_MEAL_ITEM', {
        item: { type: s.type ?? 'custom', label: s.label, portion: s.portion ?? '1 portion' }
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
          >{suggesting ? '…' : '✨'}</button>
        </div>

        {items.map(item => (
          <div key={item.id} className="meal-slot-item">
            <span className="meal-slot-item-text">{item.label}</span>
            <span className="meal-slot-item-portion">{item.portion}</span>
            <button
              className="meal-slot-item-remove"
              onClick={() => dispatch('REMOVE_MEAL_ITEM', { itemId: item.id })}
              aria-label="Remove"
            >✕</button>
          </div>
        ))}

        <button className="meal-slot-add" onClick={() => { resetForm(); setShowAdd(true); }}>+ Add</button>
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={`${day} — ${meal}`}>
        {/* Tab switcher */}
        <div className="add-meal-tabs">
          {[
            { id: 'recipe',  label: '📖 Cookbook' },
            { id: 'library', label: '📚 Library' },
            { id: 'custom',  label: '✏️ Custom' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`add-meal-tab${addType === tab.id ? ' active' : ''}`}
              onClick={() => setAddType(tab.id)}
            >{tab.label}</button>
          ))}
        </div>

        {/* ── From Cookbook ── */}
        {addType === 'recipe' && (
          <div className="form-group">
            <label className="label">Recipe</label>
            <select className="select" value={recipeId} onChange={e => setRecipeId(e.target.value)}>
              <option value="">— choose a recipe —</option>
              {cookbook.recipes.map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── From Library ── */}
        {addType === 'library' && (
          <div>
            <div className="lib-filter-row">
              {MEAL_CATS.map(cat => (
                <button
                  key={cat}
                  className={`lib-filter-chip${libFilter === cat ? ' active' : ''}`}
                  onClick={() => setLibFilter(cat)}
                >{cat}</button>
              ))}
            </div>
            {filteredLib.length === 0 ? (
              <p className="lib-empty-msg">
                {library.length === 0
                  ? 'Your library is empty. Use "Meal Library" in the toolbar to add meals.'
                  : 'No meals match this filter.'}
              </p>
            ) : (
              <div className="lib-pick-list">
                {filteredLib.map(t => {
                  const linkedRecipe = t.recipeId
                    ? cookbook.recipes.find(r => r.id === t.recipeId)
                    : null;
                  return (
                    <div
                      key={t.id}
                      className={`lib-pick-item${selectedLibId === t.id ? ' selected' : ''}`}
                      onClick={() => setSelectedLibId(t.id)}
                    >
                      <div className="lib-pick-info">
                        <span className="lib-pick-name">{t.label}</span>
                        {linkedRecipe && (
                          <span className="lib-pick-recipe">📖 {linkedRecipe.title}</span>
                        )}
                      </div>
                      <span className="lib-pick-cat">{t.category}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Custom ── */}
        {addType === 'custom' && (
          <div className="form-group">
            <label className="label">Meal description</label>
            <input
              className="input"
              placeholder="e.g. Avocado toast with eggs"
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
          </div>
        )}

        {/* Portion */}
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
          disabled={isAddDisabled}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Add to {meal}
        </button>
      </Modal>
    </>
  );
});

export default MealSlot;
