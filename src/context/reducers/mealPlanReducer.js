const DAYS  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
export { DAYS as MEAL_DAYS, MEALS as MEAL_TYPES };

function emptyWeekData() {
  const data = {};
  DAYS.forEach(day => {
    data[day] = {};
    MEALS.forEach(meal => { data[day][meal] = []; });
  });
  return data;
}

function newWeek(label) {
  return { id: crypto.randomUUID(), label, data: emptyWeekData() };
}

export const initialMealPlanState = {
  weeks: [{ id: 'week-1', label: 'Week 1', data: emptyWeekData() }],
  activeWeekId: 'week-1'
};

// Helper: apply updater fn to the target week's data
function updateWeek(state, weekId, updater) {
  return {
    ...state,
    weeks: state.weeks.map(w =>
      w.id === weekId ? { ...w, data: updater(w.data) } : w
    )
  };
}

export function mealPlanReducer(state, action) {
  // Legacy migration: old state had { week: {...} } instead of { weeks, activeWeekId }
  if (!state.weeks) {
    state = {
      weeks: [{ id: 'week-1', label: 'Week 1', data: migrateLegacyWeek(state.week) }],
      activeWeekId: 'week-1'
    };
  }

  const targetWeekId = action.weekId ?? state.activeWeekId;

  switch (action.type) {
    // ── Week management ──────────────────────────────────────────────────
    case 'ADD_WEEK': {
      const label = action.label ?? `Week ${state.weeks.length + 1}`;
      const w = newWeek(label);
      return { ...state, weeks: [...state.weeks, w], activeWeekId: w.id };
    }
    case 'REMOVE_WEEK': {
      if (state.weeks.length <= 1) return state;
      const weeks = state.weeks.filter(w => w.id !== action.id);
      const activeWeekId = state.activeWeekId === action.id ? weeks[0].id : state.activeWeekId;
      return { ...state, weeks, activeWeekId };
    }
    case 'RENAME_WEEK': {
      return {
        ...state,
        weeks: state.weeks.map(w => w.id === action.id ? { ...w, label: action.label } : w)
      };
    }
    case 'SET_ACTIVE_WEEK': {
      return { ...state, activeWeekId: action.id };
    }
    case 'DUPLICATE_WEEK': {
      const src = state.weeks.find(w => w.id === action.id);
      if (!src) return state;
      const copy = { ...newWeek(`${src.label} (copy)`), data: JSON.parse(JSON.stringify(src.data)) };
      return { ...state, weeks: [...state.weeks, copy], activeWeekId: copy.id };
    }

    // ── Meal items ───────────────────────────────────────────────────────
    case 'ADD_MEAL_ITEM': {
      const { day, meal, item } = action;
      return updateWeek(state, targetWeekId, data => ({
        ...data,
        [day]: { ...data[day], [meal]: [...(data[day]?.[meal] ?? []), { id: crypto.randomUUID(), ...item }] }
      }));
    }
    case 'REMOVE_MEAL_ITEM': {
      const { day, meal, itemId } = action;
      return updateWeek(state, targetWeekId, data => ({
        ...data,
        [day]: { ...data[day], [meal]: (data[day]?.[meal] ?? []).filter(i => i.id !== itemId) }
      }));
    }
    case 'UPDATE_MEAL_ITEM': {
      const { day, meal, itemId, updates } = action;
      return updateWeek(state, targetWeekId, data => ({
        ...data,
        [day]: { ...data[day], [meal]: (data[day]?.[meal] ?? []).map(i => i.id === itemId ? { ...i, ...updates } : i) }
      }));
    }
    case 'CLEAR_DAY': {
      return updateWeek(state, targetWeekId, data => ({
        ...data,
        [action.day]: Object.fromEntries(MEALS.map(m => [m, []]))
      }));
    }
    case 'CLEAR_WEEK': {
      return updateWeek(state, targetWeekId, () => emptyWeekData());
    }
    default:
      return state;
  }
}

// Migrate old { Mon: {...}, ... } day-key format → new full-day-name format
function migrateLegacyWeek(oldWeek) {
  if (!oldWeek) return emptyWeekData();
  const LEGACY_MAP = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };
  const data = emptyWeekData();
  Object.entries(oldWeek).forEach(([key, meals]) => {
    const fullDay = LEGACY_MAP[key] ?? key;
    if (data[fullDay]) data[fullDay] = { ...data[fullDay], ...meals };
  });
  return data;
}
