export const DEFAULT_COOKBOOKS = [
  { id: 'default',           name: 'Cookbook',    color: '#2C2C2E', emoji: '📚', tagline: 'All my favourites' },
  { id: 'default-main',      name: 'Main Dishes', color: '#4A1A0A', emoji: '🍽️', tagline: 'Hearty mains' },
  { id: 'default-desserts',  name: 'Desserts',    color: '#5C2A00', emoji: '🍰', tagline: 'Sweet indulgences' },
  { id: 'default-breakfast', name: 'Breakfast',   color: '#1A2840', emoji: '☀️', tagline: 'Morning favourites' },
];

export const initialCookbookState = {
  cookbooks: DEFAULT_COOKBOOKS,
  recipes: [],   // { id, cookbookId, title, description, ingredients, steps, nutrition, tags, servings, photo, cookTime, prepTime, cost, dateAdded }
  history: []    // undo stack
};

const MAX_HISTORY = 15;

function snapshot(state) {
  return { cookbooks: state.cookbooks, recipes: state.recipes };
}

export function cookbookReducer(state, action) {
  switch (action.type) {
    case 'CREATE_COOKBOOK': {
      return {
        ...state,
        history: [...state.history.slice(-MAX_HISTORY), snapshot(state)],
        cookbooks: [...state.cookbooks, {
          id: action.id ?? crypto.randomUUID(),
          name: action.name,
          color: action.color ?? '#2C2C2E',
          emoji: action.emoji ?? '📖',
          tagline: action.tagline ?? ''
        }]
      };
    }
    case 'UPDATE_COOKBOOK': {
      return {
        ...state,
        cookbooks: state.cookbooks.map(cb =>
          cb.id === action.id ? { ...cb, ...action.updates } : cb
        )
      };
    }
    case 'DELETE_COOKBOOK': {
      return {
        ...state,
        history: [...state.history.slice(-MAX_HISTORY), snapshot(state)],
        cookbooks: state.cookbooks.filter(cb => cb.id !== action.id),
        recipes: state.recipes.filter(r => r.cookbookId !== action.id)
      };
    }
    case 'REORDER_COOKBOOKS': {
      // action.ids = ordered array of cookbook IDs
      const idMap = new Map(state.cookbooks.map(cb => [cb.id, cb]));
      return {
        ...state,
        cookbooks: action.ids.map(id => idMap.get(id)).filter(Boolean)
      };
    }
    case 'MIGRATE_DEFAULT_COOKBOOKS': {
      // Only run if the user still has only the old single "My Recipes" cookbook
      if (state.cookbooks.length !== 1 || state.cookbooks[0].name !== 'My Recipes') return state;
      return {
        ...state,
        cookbooks: DEFAULT_COOKBOOKS,
        // remap old recipes to 'default' cookbook id (it was already 'default')
      };
    }
    case 'ADD_RECIPE': {
      const recipe = {
        id: action.recipe.id ?? crypto.randomUUID(),
        cookbookId: action.recipe.cookbookId ?? 'default',
        dateAdded: new Date().toISOString(),
        ...action.recipe
      };
      return {
        ...state,
        history: [...state.history.slice(-MAX_HISTORY), snapshot(state)],
        recipes: [...state.recipes, recipe]
      };
    }
    case 'UPDATE_RECIPE': {
      return {
        ...state,
        recipes: state.recipes.map(r =>
          r.id === action.id ? { ...r, ...action.updates } : r
        )
      };
    }
    case 'DELETE_RECIPE': {
      return {
        ...state,
        history: [...state.history.slice(-MAX_HISTORY), snapshot(state)],
        recipes: state.recipes.filter(r => r.id !== action.id)
      };
    }
    case 'MOVE_RECIPE': {
      return {
        ...state,
        recipes: state.recipes.map(r =>
          r.id === action.id ? { ...r, cookbookId: action.cookbookId } : r
        )
      };
    }
    case 'UNDO': {
      if (!state.history.length) return state;
      const prev = state.history[state.history.length - 1];
      return {
        ...state,
        ...prev,
        history: state.history.slice(0, -1)
      };
    }
    default:
      return state;
  }
}
