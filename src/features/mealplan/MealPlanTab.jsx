import MealSlot from './MealSlot';
import { MEAL_DAYS, MEAL_TYPES } from '../../context/reducers/mealPlanReducer';
import useAppContext from '../../hooks/useAppContext';
import './mealplan.css';

export default function MealPlanTab({ apiKey }) {
  const { mealPlanDispatch } = useAppContext();

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
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}>🖨 Print</button>
          <button className="btn btn-secondary btn-sm" onClick={handleClearWeek}>🗑 Clear Week</button>
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
