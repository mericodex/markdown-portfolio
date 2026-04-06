import { useEffect, useRef } from 'react';
import './Modal.css';

export default function Modal({ isOpen, onClose, title, children, size = 'md', hideClose = false }) {
  const dialogRef = useRef(null);

  // Focus trap + close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const el = dialogRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    first?.focus();

    function handleKey(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
        }
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`modal-panel modal-${size}`}
      >
        <div className="modal-header">
          {title && <h2 id="modal-title" className="modal-title">{title}</h2>}
          {!hideClose && (
            <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
          )}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
