import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
