import { useState, useMemo, useRef } from 'react';
import Modal from '../../components/Modal';
import ImportModal from './ImportModal';
import CookbookDetail from './CookbookDetail';
import Toast from '../../components/Toast';
import AddRecipeModal from '../../components/AddRecipeModal';
import useAppContext from '../../hooks/useAppContext';
import './cookbook.css';

const PRESET_COLORS = [
  '#2C2C2E','#4A1A0A','#5C2A00','#1A2840',
  '#1A4A2A','#4A2A5A','#1A3A5A','#5A1A2A',
  '#3A3020','#1A3A3A'
];

const SORT_OPTIONS = ['Default', 'A–Z', 'Manual'];

export default function CookbookTab({ apiKey, settings }) {
  const { cookbook, cookbookDispatch } = useAppContext();
  const [activeBook, setActiveBook]     = useState(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [showImport, setShowImport]     = useState(false);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [toast, setToast]               = useState(null);
  const [editingBook, setEditingBook]   = useState(null);
  const [sortMode, setSortMode]         = useState('Default');

  // Drag-and-drop state
  const dragId    = useRef(null);
  const dragOver  = useRef(null);

  const [form, setForm] = useState({ name: '', color: PRESET_COLORS[0], emoji: '📖' });

  const sortedBooks = useMemo(() => {
    if (sortMode === 'A–Z') return [...cookbook.cookbooks].sort((a, b) => a.name.localeCompare(b.name));
    return cookbook.cookbooks; // Default and Manual both use current array order
  }, [cookbook.cookbooks, sortMode]);

  function openCreate() {
    setForm({ name: '', color: PRESET_COLORS[0], emoji: '📖' });
    setEditingBook(null);
    setShowCreate(true);
  }

  function openEdit(book, e) {
    e.stopPropagation();
    setForm({ name: book.name, color: book.color, emoji: book.emoji ?? '📖' });
    setEditingBook(book);
    setShowCreate(true);
  }

  function handleSaveBook() {
    if (!form.name.trim()) return;
    if (editingBook) {
      cookbookDispatch({ type: 'UPDATE_COOKBOOK', id: editingBook.id, updates: { name: form.name, color: form.color, emoji: form.emoji } });
    } else {
      cookbookDispatch({ type: 'CREATE_COOKBOOK', name: form.name, color: form.color, emoji: form.emoji });
    }
    setShowCreate(false);
  }

  function handleDeleteBook(book, e) {
    e.stopPropagation();
    if (!window.confirm(`Delete "${book.name}" and all its recipes?`)) return;
    cookbookDispatch({ type: 'DELETE_COOKBOOK', id: book.id });
    setToast({ message: `"${book.name}" deleted`, action: { label: 'Undo', onClick: () => cookbookDispatch({ type: 'UNDO' }) } });
  }

  function handleImport(recipe) {
    cookbookDispatch({ type: 'ADD_RECIPE', recipe: { ...recipe, cookbookId: cookbook.cookbooks[0]?.id ?? 'default' } });
    setToast({ message: `"${recipe.title}" imported!` });
  }

  // ── Drag-and-drop handlers (Manual mode only) ──────────────────────────
  function handleDragStart(e, id) {
    dragId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, id) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOver.current = id;
  }

  function handleDrop(e) {
    e.preventDefault();
    if (!dragId.current || dragId.current === dragOver.current) return;
    const ids = cookbook.cookbooks.map(cb => cb.id);
    const fromIdx = ids.indexOf(dragId.current);
    const toIdx   = ids.indexOf(dragOver.current);
    if (fromIdx < 0 || toIdx < 0) return;
    const reordered = [...ids];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, dragId.current);
    cookbookDispatch({ type: 'REORDER_COOKBOOKS', ids: reordered });
    dragId.current   = null;
    dragOver.current = null;
  }

  if (activeBook) {
    return (
      <CookbookDetail
        cookbook={activeBook}
        onBack={() => setActiveBook(null)}
        apiKey={apiKey}
        settings={settings}
      />
    );
  }

  return (
    <div className="cookbook-tab">
      {toast && <Toast message={toast.message} action={toast.action} onDismiss={() => setToast(null)} />}

      {/* Toolbar */}
      <div className="cookbook-toolbar">
        <span className="cookbook-toolbar-title">My Cookbooks</span>
        <div className="cookbook-toolbar-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowImport(true)}>📥 Import</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAddRecipe(true)}>✏️ Add Recipe</button>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>+ New</button>
        </div>
      </div>

      {/* Sort toggle */}
      <div className="cookbook-sort-bar">
        <span className="cookbook-sort-label">Order by</span>
        <div className="toggle-switch">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt}
              className={`toggle-option${sortMode === opt ? ' active' : ''}`}
              onClick={() => setSortMode(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
        {sortMode === 'Manual' && (
          <span className="cookbook-sort-hint">Drag cards to reorder</span>
        )}
      </div>

      {/* Cookbooks grid */}
      <div className="cookbooks-grid">
        {sortedBooks.map(book => {
          const count = cookbook.recipes.filter(r => r.cookbookId === book.id).length;
          const isDraggable = sortMode === 'Manual';
          return (
            <div
              key={book.id}
              className={`cookbook-card${isDraggable ? ' cookbook-card-draggable' : ''}`}
              onClick={() => !isDraggable && setActiveBook(book)}
              draggable={isDraggable}
              onDragStart={isDraggable ? e => handleDragStart(e, book.id) : undefined}
              onDragOver={isDraggable ? e => handleDragOver(e, book.id) : undefined}
              onDrop={isDraggable ? handleDrop : undefined}
            >
              <div className="cookbook-card-cover" style={{ background: book.color }}>
                <span className="cookbook-cover-emoji">{book.emoji ?? '📖'}</span>
                {book.tagline && <span className="cookbook-cover-tagline">{book.tagline}</span>}
                {isDraggable && <span className="cookbook-drag-handle">⠿</span>}
              </div>
              <div className="cookbook-card-footer">
                <div className="cookbook-card-name">{book.name}</div>
                <div className="cookbook-card-count">{count} recipe{count !== 1 ? 's' : ''}</div>
                <div className="cookbook-card-menu">
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={e => openEdit(book, e)}>✏️</button>
                  <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={e => handleDeleteBook(book, e)}>🗑</button>
                  {!isDraggable && (
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); setActiveBook(book); }}>→</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {cookbook.cookbooks.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="empty-icon">📚</div>
            <p>No cookbooks yet. Create one to start saving recipes!</p>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={editingBook ? 'Edit Cookbook' : 'New Cookbook'}>
        <div className="form-group">
          <label className="label">Name</label>
          <input
            className="input"
            placeholder="e.g. Weeknight Dinners"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="label">Emoji Icon</label>
          <input
            className="input"
            maxLength={2}
            value={form.emoji}
            onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
            style={{ width: 60 }}
          />
        </div>
        <div className="form-group">
          <label className="label">Cover Colour</label>
          <div className="color-swatches">
            {PRESET_COLORS.map(c => (
              <div
                key={c}
                className={`color-swatch${form.color === c ? ' selected' : ''}`}
                style={{ background: c }}
                onClick={() => setForm(f => ({ ...f, color: c }))}
              />
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSaveBook} disabled={!form.name.trim()}>
          {editingBook ? 'Save Changes' : 'Create Cookbook'}
        </button>
      </Modal>

      <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} onImport={handleImport} apiKey={apiKey} />

      <AddRecipeModal isOpen={showAddRecipe} onClose={() => setShowAddRecipe(false)} defaultCookbookId={cookbook.cookbooks[0]?.id} />
    </div>
  );
}
