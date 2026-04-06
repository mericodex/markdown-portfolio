// Meal plan: 7 days × 4 meal slots
// slots[dayIndex][mealType] = [{ id, type:'recipe'|'custom', recipeId?, label, portion }]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
export { DAYS as MEAL_DAYS, MEALS as MEAL_TYPES };

function emptyWeek() {
  const week = {};
  DAYS.forEach(day => {
    week[day] = {};
    MEALS.forEach(meal => { week[day][meal] = []; });
  });
  return week;
}

export const initialMealPlanState = {
  week: emptyWeek()
};

export function mealPlanReducer(state, action) {
  switch (action.type) {
    case 'ADD_MEAL_ITEM': {
      const { day, meal, item } = action;
      const newItem = { id: crypto.randomUUID(), ...item };
      return {
        ...state,
        week: {
          ...state.week,
          [day]: {
            ...state.week[day],
            [meal]: [...(state.week[day]?.[meal] ?? []), newItem]
          }
        }
      };
    }
    case 'REMOVE_MEAL_ITEM': {
      const { day, meal, itemId } = action;
      return {
        ...state,
        week: {
          ...state.week,
          [day]: {
            ...state.week[day],
            [meal]: state.week[day][meal].filter(i => i.id !== itemId)
          }
        }
      };
    }
    case 'UPDATE_MEAL_ITEM': {
      const { day, meal, itemId, updates } = action;
      return {
        ...state,
        week: {
          ...state.week,
          [day]: {
            ...state.week[day],
            [meal]: state.week[day][meal].map(i =>
              i.id === itemId ? { ...i, ...updates } : i
            )
          }
        }
      };
    }
    case 'CLEAR_DAY': {
      return {
        ...state,
        week: {
          ...state.week,
          [action.day]: Object.fromEntries(MEALS.map(m => [m, []]))
        }
      };
    }
    case 'SET_WEEK': {
      return { ...state, week: action.week };
    }
    case 'CLEAR_WEEK': {
      return { ...state, week: emptyWeek() };
    }
    default:
      return state;
  }
}
