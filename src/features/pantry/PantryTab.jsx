import { useState, useMemo } from 'react';
import AddItemModal from './AddItemModal';
import Toast from '../../components/Toast';
import TagPill from '../../components/TagPill';
import { formatExpiry, formatCurrency } from '../../utils/formatters';
import { PANTRY_CATEGORIES } from '../../context/reducers/pantryReducer';
import useAppContext from '../../hooks/useAppContext';
import './pantry.css';

const SORT_OPTIONS = ['Default', 'A–Z', 'Expiry Date'];

export default function PantryTab({ apiKey, settings }) {
  const { pantry, pantryDispatch } = useAppContext();
  const [showAdd, setShowAdd]     = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [catFilter, setCatFilter] = useState('All');
  const [sortBy, setSortBy]       = useState('Default');
  const [search, setSearch]       = useState('');
  const [toast, setToast]         = useState(null);

  const filtered = useMemo(() => {
    let items = pantry.items;
    if (catFilter !== 'All') items = items.filter(i => i.category === catFilter);
    if (search) items = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === 'A–Z')         items = [...items].sort((a,b) => a.name.localeCompare(b.name));
    if (sortBy === 'Expiry Date')  items = [...items].sort((a,b) => {
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    });
    return items;
  }, [pantry.items, catFilter, sortBy, search]);

  // Category counts
  const catCounts = useMemo(() => {
    const counts = { All: pantry.items.length };
    PANTRY_CATEGORIES.forEach(c => {
      counts[c] = pantry.items.filter(i => i.category === c).length;
    });
    return counts;
  }, [pantry.items]);

  function handleDelete(id) {
    pantryDispatch({ type: 'DELETE_ITEM', id });
    setToast({ message: 'Item removed', action: { label: 'Undo', onClick: () => pantryDispatch({ type: 'UNDO' }) } });
  }

  function handleEdit(item) {
    setEditItem(item);
    setShowAdd(true);
  }

  function handleSave(item) {
    if (editItem) {
      pantryDispatch({ type: 'UPDATE_ITEM', id: editItem.id, updates: item });
      setEditItem(null);
    } else {
      pantryDispatch({ type: 'ADD_ITEM', item });
    }
  }

  function closeModal() {
    setShowAdd(false);
    setEditItem(null);
  }

  return (
    <div className="pantry-tab">
      {toast && <Toast message={toast.message} action={toast.action} onDismiss={() => setToast(null)} />}

      {/* Toolbar */}
      <div className="pantry-toolbar">
        <input
          className="input pantry-search"
          placeholder="🔍 Search pantry…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="select" style={{width:'auto'}} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          {SORT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Category filter */}
      <div className="pantry-category-tabs">
        {['All', ...PANTRY_CATEGORIES].map(cat => (
          <TagPill
            key={cat}
            label={`${cat} (${catCounts[cat] ?? 0})`}
            active={catFilter === cat}
            onClick={() => setCatFilter(cat)}
          />
        ))}
      </div>

      {/* Items list */}
      <div className="pantry-list">
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🥕</div>
            <p>{search ? 'No items match your search.' : 'Your pantry is empty. Tap + to add items!'}</p>
          </div>
        )}
        {filtered.map(item => {
          const expiry = item.expiryDate ? formatExpiry(item.expiryDate) : null;
          return (
            <div key={item.id} className="pantry-item">
              <div className="pantry-item-main">
                <div className="pantry-item-name">{item.name}</div>
                <div className="pantry-item-meta">
                  {item.quantity} {item.unit}
                  {item.portions ? ` · ${item.portions} portions` : ''}
                  {item.costPerUnit ? ` · ${formatCurrency(item.costPerUnit * item.quantity, settings?.currency)}` : ''}
                </div>
                <div className="pantry-item-badges">
                  <span className="badge badge-blue">{item.category}</span>
                  {expiry && (
                    <span className={`badge badge-${expiry.color}`}>{expiry.label}</span>
                  )}
                </div>
              </div>
              <div className="pantry-item-actions">
                <button className="btn btn-secondary btn-icon btn-sm" onClick={() => handleEdit(item)} title="Edit">✏️</button>
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(item.id)} title="Delete">🗑</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAB */}
      <button className="pantry-fab" onClick={() => setShowAdd(true)} aria-label="Add pantry item">+</button>

      <AddItemModal
        isOpen={showAdd}
        onClose={closeModal}
        onSave={handleSave}
        editItem={editItem}
        apiKey={apiKey}
      />
    </div>
  );
}
