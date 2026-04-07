import MealSlot from './MealSlot';
import ShareButton from '../../components/ShareButton';
import { MEAL_DAYS, MEAL_TYPES } from '../../context/reducers/mealPlanReducer';
import useAppContext from '../../hooks/useAppContext';
import './mealplan.css';

function getMealPlanShareText(week) {
  return MEAL_DAYS.map(day => {
    const meals = MEAL_TYPES.map(meal => {
      const items = week[day]?.[meal] ?? [];
      if (!items.length) return null;
      return `  ${meal}: ${items.map(i => `${i.label} (${i.portion})`).join(', ')}`;
    }).filter(Boolean);
    if (!meals.length) return `${day}: (nothing planned)`;
    return `${day}:\n${meals.join('\n')}`;
  }).join('\n\n');
}

export default function MealPlanTab({ apiKey }) {
  const { mealPlan, mealPlanDispatch } = useAppContext();

  function handleClearDay(day) {
    if (!window.confirm(`Clear all meals for ${day}?`)) return;
    mealPlanDispatch({ type: 'CLEAR_DAY', day });
  }

  function handleClearWeek() {
    if (!window.confirm('Clear the entire week?')) return;
    mealPlanDispatch({ type: 'CLEAR_WEEK' });
  }

  function handlePrint() {
    const prev = document.title;
    document.title = 'Meal Plan';
    window.print();
    document.title = prev;
  }

  return (
    <div className="mealplan-tab">
      <div className="mealplan-toolbar">
        <span className="mealplan-toolbar-title">Meal Plan</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <ShareButton title="My Meal Plan" getText={() => getMealPlanShareText(mealPlan.week)} />
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}>🖨 Print</button>
          <button className="btn btn-secondary btn-sm" onClick={handleClearWeek}>🗑 Clear</button>
        </div>
      </div>

      <div className="mealplan-scroll">
        <div className="mealplan-grid">
          {MEAL_DAYS.map(day => (
            <div key={day} className="mealplan-day-col">
              <div className="mealplan-day-header">
                <span>{day}</span>
                <button className="mealplan-day-clear" onClick={() => handleClearDay(day)}>Clear</button>
              </div>
              {MEAL_TYPES.map(meal => (
                <MealSlot key={meal} day={day} meal={meal} apiKey={apiKey} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
