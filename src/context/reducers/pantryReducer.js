export const initialPantryState = {
  items: [],  // { id, name, quantity, unit, portions, category, expiryDate, costPerUnit, photo, dateAdded }
  history: []
};

const CATEGORIES = ['Fridge', 'Freezer', 'Cupboard', 'Spices', 'Fresh Produce', 'Other'];
export { CATEGORIES as PANTRY_CATEGORIES };

const MAX_HISTORY = 15;

function snapshot(state) {
  return { items: state.items };
}

export function pantryReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const item = {
        id: crypto.randomUUID(),
        dateAdded: new Date().toISOString(),
        category: 'Other',
        ...action.item
      };
      return {
        ...state,
        history: [...state.history.slice(-MAX_HISTORY), snapshot(state)],
        items: [...state.items, item]
      };
    }
    case 'UPDATE_ITEM': {
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id ? { ...i, ...action.updates } : i
        )
      };
    }
    case 'DELETE_ITEM': {
      return {
        ...state,
        history: [...state.history.slice(-MAX_HISTORY), snapshot(state)],
        items: state.items.filter(i => i.id !== action.id)
      };
    }
    case 'UNDO': {
      if (!state.history.length) return state;
      const prev = state.history[state.history.length - 1];
      return { ...state, ...prev, history: state.history.slice(0, -1) };
    }
    default:
      return state;
  }
}
