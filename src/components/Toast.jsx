import { useEffect } from 'react';
import './Toast.css';

/**
 * Props:
 *  message   – string to display
 *  action    – { label, onClick } optional undo button
 *  onDismiss – called after timeout or when user dismisses
 *  duration  – ms before auto-dismiss (default 4000)
 */
export default function Toast({ message, action, onDismiss, duration = 4000 }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  if (!message) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-message">{message}</span>
      <div className="toast-actions">
        {action && (
          <button className="toast-action" onClick={() => { action.onClick(); onDismiss(); }}>
            {action.label}
          </button>
        )}
        <button className="toast-dismiss" onClick={onDismiss} aria-label="Dismiss">✕</button>
      </div>
    </div>
  );
}
