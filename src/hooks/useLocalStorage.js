import { useState } from 'react';

export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = (newValue) => {
    const toStore = typeof newValue === 'function' ? newValue(value) : newValue;
    setValue(toStore);
    try {
      localStorage.setItem(key, JSON.stringify(toStore));
    } catch {}
  };

  return [value, set];
}
