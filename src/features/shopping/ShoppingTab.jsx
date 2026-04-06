import { useState } from 'react';
import Toast from '../../components/Toast';
import Modal from '../../components/Modal';
import useAppContext from '../../hooks/useAppContext';
import './shopping.css';

export default function ShoppingTab({ settings }) {
  const { shopping, shoppingDispatch, cookbook } = useAppContext();
  const [activeListId, setActiveListId] = useState(shopping.lists[0]?.id ?? null);
  const [newItem, setNewItem]           = useState('');
  const [newListName, setNewListName]   = useState('');
  const [showNewList, setShowNewList]   = useState(false);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState(new Set());
  const [toast, setToast]               = useState(null);

  const activeList = shopping.lists.find(l => l.id === activeListId);
  const checkedCount = activeList?.items.filter(i => i.checked).length ?? 0;

  function addItem() {
    if (!newItem.trim() || !activeListId) return;
    shoppingDispatch({
      type: 'ADD_ITEMS',
      listId: activeListId,
      items: [{ name: newItem.trim(), quantity: '', unit: '' }]
    });
    setNewItem('');
  }

  function createList() {
    if (!newListName.trim()) return;
    shoppingDispatch({ type: 'CREATE_LIST', name: newListName.trim() });
    setNewListName('');
    setShowNewList(false);
  }

  function deleteList(id) {
    if (!window.confirm('Delete this list?')) return;
    shoppingDispatch({ type: 'DELETE_LIST', id });
    if (activeListId === id) setActiveListId(shopping.lists.find(l => l.id !== id)?.id ?? null);
    setToast({ message: 'List deleted', action: { label: 'Undo', onClick: () => shoppingDispatch({ type: 'UNDO' }) } });
  }

  function removeChecked() {
    if (!activeListId) return;
    shoppingDispatch({ type: 'REMOVE_CHECKED', listId: activeListId });
    setToast({ message: `${checkedCount} item${checkedCount !== 1 ? 's' : ''} removed`, action: { label: 'Undo', onClick: () => shoppingDispatch({ type: 'UNDO' }) } });
  }

  function addFromRecipe() {
    const recipe = cookbook.recipes.find(r => r.id === selectedRecipe);
    if (!recipe || !activeListId) return;
    const items = recipe.ingredients
      .filter(i => selectedIngredients.has(i.name))
      .map(i => ({ name: i.name, quantity: String(i.quantity), unit: i.unit, recipeId: recipe.id }));
    shoppingDispatch({ type: 'ADD_ITEMS', listId: activeListId, items });
    setShowAddRecipe(false);
    setSelectedRecipe('');
    setSelectedIngredients(new Set());
    setToast({ message: `Added ${items.length} ingredients` });
  }

  function handlePrint() {
    const prev = document.title;
    document.title = activeList?.name ?? 'Shopping List';
    window.print();
    document.title = prev;
  }

  const recipeForModal = cookbook.recipes.find(r => r.id === selectedRecipe);

  return (
    <div className="shopping-tab">
      {toast && <Toast message={toast.message} action={toast.action} onDismiss={() => setToast(null)} />}

      {/* Toolbar */}
      <div className="shopping-toolbar">
        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', flex: 1 }}>Shopping</span>
        <button className="btn btn-secondary btn-sm" onClick={handlePrint}>🖨 Print</button>
        <button className="btn btn-primary btn-sm" onClick={() => setShowNewList(true)}>+ List</button>
      </div>

      {/* List tabs */}
      <div className="shopping-list-tabs">
        {shopping.lists.map(l => (
          <button
            key={l.id}
            className={`shopping-list-tab${activeListId === l.id ? ' active' : ''}`}
            onClick={() => setActiveListId(l.id)}
          >
            {l.name}
            <span
              className="shopping-list-tab-delete"
              onClick={e => { e.stopPropagation(); deleteList(l.id); }}
              role="button"
              tabIndex={0}
            >✕</span>
          </button>
        ))}
        {shopping.lists.length === 0 && (
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            No lists yet
          </span>
        )}
      </div>

      {activeList && (
        <>
          {/* Quick add */}
          <div className="shopping-add-row">
            <input
              className="input"
              placeholder="Add item…"
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary btn-sm" onClick={addItem} disabled={!newItem.trim()}>Add</button>
          </div>

          {/* Actions bar */}
          <div className="shopping-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddRecipe(true)}>
              📖 From Recipe
            </button>
            {checkedCount > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={removeChecked}>
                🗑 Remove Ticked ({checkedCount})
              </button>
            )}
          </div>

          {/* Items */}
          <div className="shopping-items">
            {activeList.items.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🛒</div>
                <p>This list is empty. Add items above or import from a recipe!</p>
              </div>
            )}
            {activeList.items.map(item => (
              <div key={item.id} className={`shopping-item${item.checked ? ' checked' : ''}`}>
                <button
                  className="shopping-item-check"
                  onClick={() => shoppingDispatch({ type: 'TOGGLE_ITEM', listId: activeList.id, itemId: item.id })}
                  aria-label="Toggle item"
                >
                  {item.checked && '✓'}
                </button>
                <span className="shopping-item-text">{item.name}</span>
                {(item.quantity || item.unit) && (
                  <span className="shopping-item-qty">{item.quantity} {item.unit}</span>
                )}
                <button
                  className="shopping-item-delete"
                  onClick={() => shoppingDispatch({ type: 'REMOVE_ITEM', listId: activeList.id, itemId: item.id })}
                  aria-label="Remove item"
                >✕</button>
              </div>
            ))}
          </div>
        </>
      )}

      {!activeList && shopping.lists.length === 0 && (
        <div className="empty-state" style={{ flex: 1 }}>
          <div className="empty-icon">🛒</div>
          <p>Create a shopping list to get started!</p>
          <button className="btn btn-primary" onClick={() => setShowNewList(true)}>+ Create List</button>
        </div>
      )}

      {/* New list modal */}
      <Modal isOpen={showNewList} onClose={() => setShowNewList(false)} title="New Shopping List">
        <div className="form-group">
          <label className="label">List Name</label>
          <input
            className="input"
            placeholder="e.g. Weekly Shop"
            value={newListName}
            onChange={e => setNewListName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createList()}
            autoFocus
          />
        </div>
        <button className="btn btn-primary" onClick={createList} disabled={!newListName.trim()}>
          Create List
        </button>
      </Modal>

      {/* Add from recipe modal */}
      <Modal isOpen={showAddRecipe} onClose={() => setShowAddRecipe(false)} title="Add from Recipe" size="lg">
        <div className="form-group">
          <label className="label">Choose Recipe</label>
          <select className="select" value={selectedRecipe} onChange={e => { setSelectedRecipe(e.target.value); setSelectedIngredients(new Set()); }}>
            <option value="">— select a recipe —</option>
            {cookbook.recipes.map(r => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        </div>

        {recipeForModal && (
          <>
            <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedIngredients(new Set(recipeForModal.ingredients.map(i => i.name)))}
              >Select All</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedIngredients(new Set())}>
                Clear
              </button>
            </div>
            <div className="pantry-checkboxes">
              {recipeForModal.ingredients.map(ing => (
                <label key={ing.name} className="pantry-checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedIngredients.has(ing.name)}
                    onChange={() => {
                      setSelectedIngredients(prev => {
                        const next = new Set(prev);
                        next.has(ing.name) ? next.delete(ing.name) : next.add(ing.name);
                        return next;
                      });
                    }}
                  />
                  <span>{ing.quantity} {ing.unit} {ing.name}</span>
                </label>
              ))}
            </div>
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={addFromRecipe}
              disabled={selectedIngredients.size === 0}
            >
              Add {selectedIngredients.size} Ingredient{selectedIngredients.size !== 1 ? 's' : ''}
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}
