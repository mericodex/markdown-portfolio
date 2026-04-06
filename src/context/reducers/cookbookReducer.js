export const initialCookbookState = {
  cookbooks: [
    { id: 'default', name: 'My Recipes', color: '#c0392b', emoji: '🍳', tagline: 'Home cooked with love' }
  ],
  recipes: [],   // { id, cookbookId, title, description, ingredients, steps, nutrition, tags, servings, photo, cookTime, prepTime, cost, dateAdded }
  history: []    // undo stack — array of previous { cookbooks, recipes } snapshots
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
          color: action.color ?? '#c0392b',
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
