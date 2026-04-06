import { useState, useMemo } from 'react';
import RecipeCard from '../recipes/RecipeCard';
import TagPill from '../../components/TagPill';
import Toast from '../../components/Toast';
import { generateCookbookCover } from '../../services/claudeApi';
import { formatCurrency } from '../../utils/formatters';
import useAppContext from '../../hooks/useAppContext';

const FONT_SIZES = { XS: '12px', S: '14px', M: '16px', L: '18px', XL: '20px' };
const SORT_OPTIONS = ['Default', 'A–Z', 'Newest'];

export default function CookbookDetail({ cookbook, onBack, apiKey, settings }) {
  const { cookbook: cbState, cookbookDispatch, shopping, shoppingDispatch } = useAppContext();
  const [search, setSearch]   = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy]   = useState('Default');
  const [fontSize, setFontSize] = useState(settings?.recipeFontSize ?? 'M');
  const [toast, setToast]     = useState(null);
  const [loadingCover, setLoadingCover] = useState(false);

  const recipes = useMemo(() => {
    let list = cbState.recipes.filter(r => r.cookbookId === cookbook.id);
    if (search) list = list.filter(r =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.ingredients?.some(i => i.name.toLowerCase().includes(search.toLowerCase()))
    );
    if (tagFilter) list = list.filter(r => r.tags?.includes(tagFilter));
    if (sortBy === 'A–Z')    list = [...list].sort((a,b) => a.title.localeCompare(b.title));
    if (sortBy === 'Newest') list = [...list].sort((a,b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    return list;
  }, [cbState.recipes, cookbook.id, search, tagFilter, sortBy]);

  const allTags = useMemo(() => {
    const tags = new Set();
    cbState.recipes.filter(r => r.cookbookId === cookbook.id).forEach(r => r.tags?.forEach(t => tags.add(t)));
    return [...tags];
  }, [cbState.recipes, cookbook.id]);

  const totalCost = useMemo(() => {
    return recipes.reduce((sum, r) => {
      const cost = r.ingredients?.reduce((s, ing) => s + (ing.costPerUnit ?? 0) * (ing.quantity ?? 0), 0) ?? 0;
      return sum + cost;
    }, 0);
  }, [recipes]);

  function handleDelete(id) {
    cookbookDispatch({ type: 'DELETE_RECIPE', id });
    setToast({ message: 'Recipe removed', action: { label: 'Undo', onClick: () => cookbookDispatch({ type: 'UNDO' }) } });
  }

  function handleAddToShopping(recipe) {
    const items = recipe.ingredients?.map(i => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
      recipeId: recipe.id
    })) ?? [];
    shoppingDispatch({ type: 'ADD_ITEMS', listId: shopping.lists[0]?.id ?? 'default', items });
    setToast({ message: `Added ${items.length} ingredients to shopping list` });
  }

  async function handleGenerateCover() {
    setLoadingCover(true);
    try {
      const cover = await generateCookbookCover({ apiKey, cookbookName: cookbook.name, recipes });
      cookbookDispatch({ type: 'UPDATE_COOKBOOK', id: cookbook.id, updates: { emoji: cover.emoji, tagline: cover.tagline } });
    } catch {}
    setLoadingCover(false);
  }

  function handlePrint() {
    const prev = document.title;
    document.title = cookbook.name;
    window.print();
    document.title = prev;
  }

  const fontPx = FONT_SIZES[fontSize] ?? '16px';

  return (
    <div className="cookbook-detail" style={{ fontSize: fontPx }}>
      {toast && (
        <Toast
          message={toast.message}
          action={toast.action}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="cookbook-detail-header" style={{ background: cookbook.color ?? 'var(--color-primary)' }}>
        <button className="btn btn-sm" style={{color:'#fff',background:'rgba(255,255,255,0.2)'}} onClick={onBack}>
          ← Back
        </button>
        <div className="cookbook-detail-title-row">
          <span className="cookbook-detail-emoji">{cookbook.emoji ?? '📖'}</span>
          <div>
            <div className="cookbook-detail-name">{cookbook.name}</div>
            {cookbook.tagline && <div className="cookbook-detail-tagline">{cookbook.tagline}</div>}
          </div>
        </div>
        <div className="cookbook-detail-actions">
          <button
            className="btn btn-sm"
            style={{color:'#fff',background:'rgba(255,255,255,0.2)'}}
            onClick={handleGenerateCover}
            disabled={loadingCover}
          >
            {loadingCover ? <span className="spinner" style={{width:14,height:14}} /> : '✨'} AI Cover
          </button>
          <button className="btn btn-sm" style={{color:'#fff',background:'rgba(255,255,255,0.2)'}} onClick={handlePrint}>
            🖨 Print All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="cookbook-filters">
        <input
          className="input"
          placeholder="🔍 Search recipes or ingredients…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="cookbook-filter-row">
          <select className="select" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{flex:1}}>
            {SORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <div className="font-size-row">
            {Object.keys(FONT_SIZES).map(sz => (
              <button
                key={sz}
                className={`btn btn-sm ${fontSize === sz ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFontSize(sz)}
                style={{padding:'4px 8px'}}
              >{sz}</button>
            ))}
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="cookbook-tags-filter">
            <TagPill
              label="All"
              active={!tagFilter}
              onClick={() => setTagFilter('')}
            />
            {allTags.map(tag => (
              <TagPill
                key={tag}
                label={tag}
                active={tagFilter === tag}
                onClick={() => setTagFilter(t => t === tag ? '' : tag)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="cookbook-stats">
        <span>{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</span>
        {totalCost > 0 && <span>Est. cost: {formatCurrency(totalCost, settings?.currency)}</span>}
      </div>

      {/* Recipe list */}
      <div className="cookbook-recipes-list">
        {recipes.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <p>No recipes yet. Generate some on the Recipes tab and save them here!</p>
          </div>
        )}
        {recipes.map((recipe, i) => (
          <div key={recipe.id} className="cookbook-recipe-item">
            <RecipeCard recipe={recipe} settings={settings} index={i} showSaveButton={false} />
            <div className="cookbook-recipe-controls">
              <button className="btn btn-secondary btn-sm" onClick={() => handleAddToShopping(recipe)}>
                🛒 Add to Shopping
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(recipe.id)}>
                🗑 Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
