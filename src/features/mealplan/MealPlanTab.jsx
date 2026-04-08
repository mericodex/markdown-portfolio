import { useState, useRef } from 'react';
import MealSlot from './MealSlot';
import ShareButton from '../../components/ShareButton';
import Modal from '../../components/Modal';
import { MEAL_DAYS, MEAL_TYPES } from '../../context/reducers/mealPlanReducer';
import useAppContext from '../../hooks/useAppContext';
import './mealplan.css';

const LIBRARY_CATS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Any'];

function getShareText(week, label) {
  const lines = [`📅 ${label}\n`];
  MEAL_DAYS.forEach(day => {
    const meals = MEAL_TYPES.map(meal => {
      const items = week[day]?.[meal] ?? [];
      if (!items.length) return null;
      return `  ${meal}: ${items.map(i => `${i.label} (${i.portion})`).join(', ')}`;
    }).filter(Boolean);
    lines.push(`${day}:\n${meals.length ? meals.join('\n') : '  (nothing planned)'}`);
  });
  return lines.join('\n\n');
}

function MealLibraryModal({ isOpen, onClose, library, dispatch, recipes }) {
  const [newLabel, setNewLabel]     = useState('');
  const [newCat, setNewCat]         = useState('Any');
  const [newRecipeId, setNewRecipeId] = useState('');

  function handleAdd() {
    const label = newLabel.trim();
    if (!label) return;
    dispatch({
      type: 'ADD_MEAL_TEMPLATE',
      template: { label, category: newCat, recipeId: newRecipeId || null }
    });
    setNewLabel('');
    setNewCat('Any');
    setNewRecipeId('');
  }

  const grouped = LIBRARY_CATS.reduce((acc, cat) => {
    acc[cat] = library.filter(t => t.category === cat);
    return acc;
  }, {});

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Meal Library">
      {/* Add form */}
      <div className="lib-add-section">
        <div className="lib-add-title">Add Meal Template</div>
        <div className="form-group">
          <label className="label">Meal name</label>
          <input
            className="input"
            placeholder="e.g. Overnight Oats"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="label">Category</label>
            <select className="select" value={newCat} onChange={e => setNewCat(e.target.value)}>
              {LIBRARY_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 2 }}>
            <label className="label">Linked recipe (optional)</label>
            <select className="select" value={newRecipeId} onChange={e => setNewRecipeId(e.target.value)}>
              <option value="">No linked recipe</option>
              {recipes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleAdd}
          disabled={!newLabel.trim()}
        >+ Add to Library</button>
      </div>

      {/* Template list grouped by category */}
      {library.length === 0 ? (
        <p className="lib-empty-msg">Your library is empty. Add your first meal template above.</p>
      ) : (
        <div className="lib-manage-list">
          {LIBRARY_CATS.map(cat => {
            const items = grouped[cat];
            if (!items.length) return null;
            return (
              <div key={cat} className="lib-manage-group">
                <div className="lib-manage-group-title">{cat}</div>
                {items.map(t => {
                  const linked = t.recipeId ? recipes.find(r => r.id === t.recipeId) : null;
                  return (
                    <div key={t.id} className="lib-manage-item">
                      <div className="lib-manage-item-info">
                        <span className="lib-manage-item-name">{t.label}</span>
                        {linked && <span className="lib-manage-item-recipe">📖 {linked.title}</span>}
                      </div>
                      <button
                        className="lib-manage-item-delete"
                        onClick={() => dispatch({ type: 'DELETE_MEAL_TEMPLATE', id: t.id })}
                        title="Remove"
                        aria-label="Remove"
                      >✕</button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

export default function MealPlanTab({ apiKey }) {
  const { mealPlan, mealPlanDispatch, cookbook } = useAppContext();
  const [editingId, setEditingId]   = useState(null);
  const [editLabel, setEditLabel]   = useState('');
  const [showLibrary, setShowLibrary] = useState(false);
  const weekTabsRef = useRef(null);

  const activeWeek = mealPlan.weeks.find(w => w.id === mealPlan.activeWeekId) ?? mealPlan.weeks[0];
  const weekData   = activeWeek?.data ?? {};
  const library    = mealPlan.library ?? [];

  function addWeek() {
    mealPlanDispatch({ type: 'ADD_WEEK' });
    setTimeout(() => {
      if (weekTabsRef.current) weekTabsRef.current.scrollLeft = weekTabsRef.current.scrollWidth;
    }, 50);
  }

  function startEdit(w, e) {
    e.stopPropagation();
    setEditingId(w.id);
    setEditLabel(w.label);
  }

  function commitEdit(id) {
    if (editLabel.trim()) mealPlanDispatch({ type: 'RENAME_WEEK', id, label: editLabel.trim() });
    setEditingId(null);
  }

  function removeWeek(id, e) {
    e.stopPropagation();
    if (!window.confirm('Remove this week and all its meals?')) return;
    mealPlanDispatch({ type: 'REMOVE_WEEK', id });
  }

  function clearDay(day) {
    if (!window.confirm(`Clear all meals for ${day}?`)) return;
    mealPlanDispatch({ type: 'CLEAR_DAY', day, weekId: activeWeek.id });
  }

  function clearWeek() {
    if (!window.confirm('Clear all meals for this week?')) return;
    mealPlanDispatch({ type: 'CLEAR_WEEK', weekId: activeWeek.id });
  }

  function handlePrint() {
    const prev = document.title;
    document.title = activeWeek?.label ?? 'Meal Plan';
    window.print();
    document.title = prev;
  }

  return (
    <div className="mealplan-tab">

      {/* ── Week tabs ── */}
      <div className="mealplan-weeks-bar">
        <div className="mealplan-weeks-scroll" ref={weekTabsRef}>
          {mealPlan.weeks.map(w => (
            <button
              key={w.id}
              className={`mealplan-week-tab${w.id === mealPlan.activeWeekId ? ' active' : ''}`}
              onClick={() => mealPlanDispatch({ type: 'SET_ACTIVE_WEEK', id: w.id })}
            >
              {editingId === w.id ? (
                <input
                  className="mealplan-week-tab-input"
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  onBlur={() => commitEdit(w.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitEdit(w.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onClick={e => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <span className="mealplan-week-tab-label">{w.label}</span>
              )}
              {w.id === mealPlan.activeWeekId && editingId !== w.id && (
                <span className="mealplan-week-tab-actions">
                  <span
                    className="mealplan-week-tab-btn"
                    onClick={e => startEdit(w, e)}
                    title="Rename week"
                  >✏️</span>
                  {mealPlan.weeks.length > 1 && (
                    <span
                      className="mealplan-week-tab-btn"
                      onClick={e => removeWeek(w.id, e)}
                      title="Remove week"
                    >✕</span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
        <button className="mealplan-add-week-btn" onClick={addWeek} title="Add a new week">
          + Week
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="mealplan-toolbar">
        <span className="mealplan-toolbar-title">{activeWeek?.label ?? 'Meal Plan'}</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowLibrary(true)}>
            📚 Library{library.length > 0 ? ` (${library.length})` : ''}
          </button>
          <ShareButton
            title={activeWeek?.label ?? 'Meal Plan'}
            getText={() => getShareText(weekData, activeWeek?.label ?? 'Meal Plan')}
          />
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}>🖨</button>
          <button className="btn btn-secondary btn-sm" onClick={clearWeek}>🗑 Clear</button>
        </div>
      </div>

      {/* ── Vertical day list ── */}
      <div className="mealplan-body">
        {MEAL_DAYS.map(day => (
          <div key={day} className="mealplan-day-section">
            <div className="mealplan-day-header">
              <span className="mealplan-day-name">{day}</span>
              <button className="mealplan-day-clear-btn" onClick={() => clearDay(day)}>
                Clear
              </button>
            </div>
            <div className="mealplan-day-meals">
              {MEAL_TYPES.map(meal => (
                <MealSlot
                  key={meal}
                  day={day}
                  meal={meal}
                  apiKey={apiKey}
                  weekId={activeWeek?.id}
                  weekData={weekData}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Meal Library modal ── */}
      <MealLibraryModal
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        library={library}
        dispatch={mealPlanDispatch}
        recipes={cookbook.recipes}
      />

    </div>
  );
}
