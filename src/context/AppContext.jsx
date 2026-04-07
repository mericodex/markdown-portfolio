import { createContext, useReducer, useEffect } from 'react';
import { cookbookReducer, initialCookbookState } from './reducers/cookbookReducer';
import { pantryReducer, initialPantryState } from './reducers/pantryReducer';
import { mealPlanReducer, initialMealPlanState } from './reducers/mealPlanReducer';
import { shoppingReducer, initialShoppingState } from './reducers/shoppingReducer';
import { loadState, saveState } from '../services/storage';

export const AppContext = createContext(null);

const STORAGE_KEY = 'mamas-kitchen-v1';

function mergeWithDefaults(saved, defaults) {
  if (!saved) return defaults;
  return { ...defaults, ...saved };
}

export function AppProvider({ children }) {
  // Load persisted state once on mount
  const persisted = loadState(STORAGE_KEY) ?? {};

  const [cookbook, cookbookDispatch] = useReducer(
    cookbookReducer,
    mergeWithDefaults(persisted.cookbook, initialCookbookState)
  );
  const [pantry, pantryDispatch] = useReducer(
    pantryReducer,
    mergeWithDefaults(persisted.pantry, initialPantryState)
  );
  const [mealPlan, mealPlanDispatch] = useReducer(
    mealPlanReducer,
    mergeWithDefaults(persisted.mealPlan, initialMealPlanState)
  );
  const [shopping, shoppingDispatch] = useReducer(
    shoppingReducer,
    mergeWithDefaults(persisted.shopping, initialShoppingState)
  );

  // Persist on every state change
  useEffect(() => {
    saveState(STORAGE_KEY, { cookbook, pantry, mealPlan, shopping });
  }, [cookbook, pantry, mealPlan, shopping]);

  // Migrate users who have only the old "My Recipes" default cookbook
  useEffect(() => {
    cookbookDispatch({ type: 'MIGRATE_DEFAULT_COOKBOOKS' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Settings live separately so they don't trigger full re-saves
  // They are read/written directly from localStorage by SettingsTab via useLocalStorage

  const value = {
    cookbook, cookbookDispatch,
    pantry, pantryDispatch,
    mealPlan, mealPlanDispatch,
    shopping, shoppingDispatch,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
