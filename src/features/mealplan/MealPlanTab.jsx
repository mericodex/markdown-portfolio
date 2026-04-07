import { useState, useRef } from 'react';
import MealSlot from './MealSlot';
import ShareButton from '../../components/ShareButton';
import { MEAL_DAYS, MEAL_TYPES } from '../../context/reducers/mealPlanReducer';
import useAppContext from '../../hooks/useAppContext';
import './mealplan.css';

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

export default function MealPlanTab({ apiKey }) {
  const { mealPlan, mealPlanDispatch } = useAppContext();
  const [editingId, setEditingId]   = useState(null);
  const [editLabel, setEditLabel]   = useState('');
  const weekTabsRef = useRef(null);

  const activeWeek = mealPlan.weeks.find(w => w.id === mealPlan.activeWeekId) ?? mealPlan.weeks[0];
  const weekData   = activeWeek?.data ?? {};

  function addWeek() {
    mealPlanDispatch({ type: 'ADD_WEEK' });
    // scroll week tab bar to the end after render
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
              {/* Rename / remove only when tab is active */}
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

    </div>
  );
}
