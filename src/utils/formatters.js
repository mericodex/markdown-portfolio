/**
 * Format a currency amount in ZAR (or whatever currency is configured).
 */
export function formatCurrency(amount, currency = 'ZAR') {
  if (amount == null || isNaN(amount)) return '—';
  if (currency === 'ZAR') return `R ${Number(amount).toFixed(2)}`;
  try {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

/**
 * Format time in minutes to a human-readable string.
 */
export function formatTime(minutes) {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Format a countdown in seconds to mm:ss.
 */
export function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format expiry date to a human-readable string with days remaining.
 */
export function formatExpiry(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
  if (diff < 0)  return { label: 'Expired',         color: 'red' };
  if (diff === 0) return { label: 'Expires today',   color: 'red' };
  if (diff <= 2)  return { label: `${diff}d left`,   color: 'orange' };
  if (diff <= 7)  return { label: `${diff}d left`,   color: 'yellow' };
  return               { label: `${diff}d left`,     color: 'green' };
}

/**
 * Capitalise first letter.
 */
export function capitalise(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
