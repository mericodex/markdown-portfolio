import { useState } from 'react';
import Modal from '../../components/Modal';
import ImportModal from './ImportModal';
import CookbookDetail from './CookbookDetail';
import Toast from '../../components/Toast';
import AddRecipeModal from '../../components/AddRecipeModal';
import useAppContext from '../../hooks/useAppContext';
import './cookbook.css';

const PRESET_COLORS = [
  '#c0392b','#1a6b8a','#d35400','#7d3c98',
  '#1e6b3c','#c07a2b','#2980b9','#e74c3c',
  '#16a085','#8e44ad'
];

export default function CookbookTab({ apiKey, settings }) {
  const { cookbook, cookbookDispatch } = useAppContext();
  const [activeBook, setActiveBook]     = useState(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [showImport, setShowImport]     = useState(false);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [toast, setToast]               = useState(null);
  const [editingBook, setEditingBook] = useState(null);

  // Create / edit form state
  const [form, setForm] = useState({ name: '', color: PRESET_COLORS[0], emoji: '📖', targetBook: 'default' });

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
          <button className="btn btn-secondary btn-sm" onClick={() => setShowImport(true)}>
            📥 Import
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAddRecipe(true)}>
            ✏️ Add Recipe
          </button>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            + New Cookbook
          </button>
        </div>
      </div>

      {/* Cookbooks grid */}
      <div className="cookbooks-grid">
        {cookbook.cookbooks.map(book => {
          const count = cookbook.recipes.filter(r => r.cookbookId === book.id).length;
          return (
            <div key={book.id} className="cookbook-card" onClick={() => setActiveBook(book)}>
              <div className="cookbook-card-cover" style={{ background: book.color }}>
                <span className="cookbook-cover-emoji">{book.emoji ?? '📖'}</span>
                {book.tagline && <span className="cookbook-cover-tagline">{book.tagline}</span>}
              </div>
              <div className="cookbook-card-footer">
                <div className="cookbook-card-name">{book.name}</div>
                <div className="cookbook-card-count">{count} recipe{count !== 1 ? 's' : ''}</div>
                <div className="cookbook-card-menu">
                  <button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={e => openEdit(book, e)}>
                    ✏️
                  </button>
                  <button className="btn btn-danger btn-sm" style={{flex:1}} onClick={e => handleDeleteBook(book, e)}>
                    🗑
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {cookbook.cookbooks.length === 0 && (
          <div className="empty-state" style={{gridColumn:'1/-1'}}>
            <div className="empty-icon">📚</div>
            <p>No cookbooks yet. Create one to start saving recipes!</p>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title={editingBook ? 'Edit Cookbook' : 'New Cookbook'}
      >
        <div className="form-group">
          <label className="label">Name</label>
          <input
            className="input"
            placeholder="e.g. Weeknight Dinners"
            value={form.name}
            onChange={e => setForm(f => ({...f, name: e.target.value}))}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="label">Emoji Icon</label>
          <input
            className="input"
            maxLength={2}
            value={form.emoji}
            onChange={e => setForm(f => ({...f, emoji: e.target.value}))}
            style={{width:60}}
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
                onClick={() => setForm(f => ({...f, color: c}))}
              />
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSaveBook} disabled={!form.name.trim()}>
          {editingBook ? 'Save Changes' : 'Create Cookbook'}
        </button>
      </Modal>

      {/* Import modal */}
      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
        apiKey={apiKey}
      />

      {/* Add recipe manually */}
      <AddRecipeModal
        isOpen={showAddRecipe}
        onClose={() => setShowAddRecipe(false)}
        defaultCookbookId={cookbook.cookbooks[0]?.id}
      />
    </div>
  );
}
