export const initialShoppingState = {
  lists: [
    { id: 'default', name: 'Weekly Shop', items: [] }
  ],
  // items: { id, name, quantity, unit, checked, recipeId? }
  history: []
};

const MAX_HISTORY = 15;

function snapshot(state) {
  return { lists: state.lists };
}

export function shoppingReducer(state, action) {
  switch (action.type) {
    case 'CREATE_LIST': {
      return {
        ...state,
        lists: [...state.lists, {
          id: crypto.randomUUID(),
          name: action.name,
          items: []
        }]
      };
    }
    case 'RENAME_LIST': {
      return {
        ...state,
        lists: state.lists.map(l =>
          l.id === action.id ? { ...l, name: action.name } : l
        )
      };
    }
    case 'DELETE_LIST': {
      return {
        ...state,
        history: [...state.history.slice(-MAX_HISTORY), snapshot(state)],
        lists: state.lists.filter(l => l.id !== action.id)
      };
    }
    case 'ADD_ITEMS': {
      // action.listId, action.items: array of item objects
      return {
        ...state,
        lists: state.lists.map(l => {
          if (l.id !== action.listId) return l;
          const newItems = action.items.map(item => ({
            id: crypto.randomUUID(),
            checked: false,
            ...item
          }));
          return { ...l, items: [...l.items, ...newItems] };
        })
      };
    }
    case 'TOGGLE_ITEM': {
      return {
        ...state,
        lists: state.lists.map(l => {
          if (l.id !== action.listId) return l;
          return {
            ...l,
            items: l.items.map(i =>
              i.id === action.itemId ? { ...i, checked: !i.checked } : i
            )
          };
        })
      };
    }
    case 'REMOVE_ITEM': {
      return {
        ...state,
        history: [...state.history.slice(-MAX_HISTORY), snapshot(state)],
        lists: state.lists.map(l => {
          if (l.id !== action.listId) return l;
          return { ...l, items: l.items.filter(i => i.id !== action.itemId) };
        })
      };
    }
    case 'REMOVE_CHECKED': {
      return {
        ...state,
        history: [...state.history.slice(-MAX_HISTORY), snapshot(state)],
        lists: state.lists.map(l => {
          if (l.id !== action.listId) return l;
          return { ...l, items: l.items.filter(i => !i.checked) };
        })
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
