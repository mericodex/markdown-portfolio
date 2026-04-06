import './TagPill.css';

export default function TagPill({ label, onRemove, active, onClick, color }) {
  return (
    <span
      className={`tag-pill${active ? ' tag-pill-active' : ''}${onClick ? ' tag-pill-clickable' : ''}`}
      style={color ? { '--tag-color': color } : undefined}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
    >
      {label}
      {onRemove && (
        <button
          className="tag-pill-remove"
          onClick={e => { e.stopPropagation(); onRemove(); }}
          aria-label={`Remove ${label}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
