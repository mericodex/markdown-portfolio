import { useState, useEffect } from 'react';
import Modal from './Modal';
import useAppContext from '../hooks/useAppContext';
import { normaliseRecipe } from '../utils/recipeParser';

const BLANK_INGREDIENT = { name: '', quantity: '', unit: 'g' };
const UNITS = ['g', 'kg', 'ml', 'l', 'each', 'bunch', 'pack', 'oz', 'lb', 'tsp', 'tbsp', 'cup'];

const BLANK_FORM = {
  title: '', description: '', make: '',
  prepTime: '', cookTime: '', servings: '4', portions: '',
  tags: '',
  ingredients: [{ ...BLANK_INGREDIENT }],
  steps: [''],
  calories: '', protein: '', carbs: '', fat: '', fibre: '', sugar: '',
  cookbookId: ''
};

function recipeToForm(recipe) {
  return {
    title:       recipe.title ?? '',
    description: recipe.description ?? '',
    make:        recipe.make ?? '',
    prepTime:    String(recipe.prepTime ?? ''),
    cookTime:    String(recipe.cookTime ?? ''),
    servings:    String(recipe.servings ?? '4'),
    portions:    String(recipe.portions ?? ''),
    tags:        (recipe.tags ?? []).join(', '),
    ingredients: recipe.ingredients?.length
      ? recipe.ingredients.map(i => ({ name: i.name ?? '', quantity: String(i.quantity ?? ''), unit: i.unit ?? 'g' }))
      : [{ ...BLANK_INGREDIENT }],
    steps:       recipe.steps?.length ? [...recipe.steps] : [''],
    calories:    String(recipe.nutrition?.calories ?? ''),
    protein:     String(recipe.nutrition?.protein  ?? ''),
    carbs:       String(recipe.nutrition?.carbs    ?? ''),
    fat:         String(recipe.nutrition?.fat      ?? ''),
    fibre:       String(recipe.nutrition?.fibre    ?? ''),
    sugar:       String(recipe.nutrition?.sugar    ?? ''),
    cookbookId:  recipe.cookbookId ?? '',
  };
}

// editRecipe: if provided, we're editing; otherwise adding new
export default function AddRecipeModal({ isOpen, onClose, defaultCookbookId, editRecipe, onSaved }) {
  const { cookbook, cookbookDispatch } = useAppContext();
  const isEdit = !!editRecipe;

  const [form, setForm] = useState(BLANK_FORM);
  const [saved, setSaved] = useState(false);

  // Reset form when modal opens or editRecipe changes
  useEffect(() => {
    if (!isOpen) return;
    if (isEdit) {
      setForm(recipeToForm(editRecipe));
    } else {
      setForm({ ...BLANK_FORM, cookbookId: defaultCookbookId ?? cookbook.cookbooks[0]?.id ?? '' });
    }
    setSaved(false);
  }, [isOpen, editRecipe]); // eslint-disable-line react-hooks/exhaustive-deps

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function setIngredient(i, key, value) {
    setForm(f => {
      const ings = [...f.ingredients];
      ings[i] = { ...ings[i], [key]: value };
      return { ...f, ingredients: ings };
    });
  }
  function addIngredient() { setForm(f => ({ ...f, ingredients: [...f.ingredients, { ...BLANK_INGREDIENT }] })); }
  function removeIngredient(i) { setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) })); }

  function setStep(i, value) {
    setForm(f => { const steps = [...f.steps]; steps[i] = value; return { ...f, steps }; });
  }
  function addStep() { setForm(f => ({ ...f, steps: [...f.steps, ''] })); }
  function removeStep(i) { setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) })); }

  function handleSave() {
    if (!form.title.trim()) return;
    const recipeData = normaliseRecipe({
      title:       form.title,
      description: form.description,
      make:        form.make,
      prepTime:    Number(form.prepTime) || 0,
      cookTime:    Number(form.cookTime) || 0,
      servings:    Number(form.servings) || 4,
      portions:    Number(form.portions) || 0,
      tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
      ingredients: form.ingredients
        .filter(i => i.name.trim())
        .map(i => ({ name: i.name, quantity: parseFloat(i.quantity) || 0, unit: i.unit })),
      steps: form.steps.filter(s => s.trim()),
      nutrition: {
        calories: Number(form.calories) || 0,
        protein:  Number(form.protein)  || 0,
        carbs:    Number(form.carbs)    || 0,
        fat:      Number(form.fat)      || 0,
        fibre:    Number(form.fibre)    || 0,
        sugar:    Number(form.sugar)    || 0,
      },
      cookbookId: form.cookbookId || cookbook.cookbooks[0]?.id || 'default'
    });

    if (isEdit) {
      cookbookDispatch({ type: 'UPDATE_RECIPE', id: editRecipe.id, updates: recipeData });
    } else {
      cookbookDispatch({ type: 'ADD_RECIPE', recipe: recipeData });
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
      if (onSaved) onSaved({ ...editRecipe, ...recipeData });
    }, 1000);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Recipe' : 'Add New Recipe'} size="xl">
      {saved && (
        <div style={{ background: '#D4EDDA', color: '#1A5230', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
          ✓ {isEdit ? 'Recipe updated!' : 'Recipe saved to cookbook!'}
        </div>
      )}

      <div className="form-group">
        <label className="label">Recipe Title *</label>
        <input className="input" placeholder="e.g. Creamy Chicken Pasta" value={form.title} onChange={e => setField('title', e.target.value)} autoFocus />
      </div>

      <div className="form-group">
        <label className="label">Description</label>
        <input className="input" placeholder="Short description of the dish" value={form.description} onChange={e => setField('description', e.target.value)} />
      </div>

      <div className="form-group">
        <label className="label">Method Style</label>
        <input className="input" placeholder="e.g. Stovetop, Baked, Slow Cooker, Air Fryer" value={form.make} onChange={e => setField('make', e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[['prepTime','Prep (min)'],['cookTime','Cook (min)'],['servings','Servings'],['portions','Portions']].map(([k, lbl]) => (
          <div key={k} className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">{lbl}</label>
            <input className="input" type="number" min="0" value={form[k]} onChange={e => setField(k, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="form-group" style={{ marginTop: 8 }}>
        <label className="label">Tags (comma-separated)</label>
        <input className="input" placeholder="Main Dish, Quick Meal, Family Favourite" value={form.tags} onChange={e => setField('tags', e.target.value)} />
      </div>

      <div className="divider" />

      <div className="form-group">
        <label className="label">Ingredients</label>
        {form.ingredients.map((ing, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 32px', gap: 6, marginBottom: 6 }}>
            <input className="input" placeholder="Ingredient name" value={ing.name} onChange={e => setIngredient(i, 'name', e.target.value)} />
            <input className="input" type="number" placeholder="Qty" value={ing.quantity} onChange={e => setIngredient(i, 'quantity', e.target.value)} />
            <select className="select" value={ing.unit} onChange={e => setIngredient(i, 'unit', e.target.value)}>
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
            <button className="btn btn-danger btn-sm btn-icon" onClick={() => removeIngredient(i)} disabled={form.ingredients.length === 1} style={{ padding: '0 8px' }}>✕</button>
          </div>
        ))}
        <button className="btn btn-secondary btn-sm" onClick={addIngredient} style={{ marginTop: 4 }}>+ Add Ingredient</button>
      </div>

      <div className="divider" />

      <div className="form-group">
        <label className="label">Instructions</label>
        {form.steps.map((step, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 32px', gap: 6, marginBottom: 6, alignItems: 'start' }}>
            <span style={{ width: 24, height: 24, background: 'var(--color-primary)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, marginTop: 10, flexShrink: 0 }}>{i + 1}</span>
            <textarea className="input" rows={2} placeholder={`Step ${i + 1}…`} value={step} onChange={e => setStep(i, e.target.value)} style={{ resize: 'vertical' }} />
            <button className="btn btn-danger btn-sm btn-icon" onClick={() => removeStep(i)} disabled={form.steps.length === 1} style={{ padding: '0 8px', marginTop: 8 }}>✕</button>
          </div>
        ))}
        <button className="btn btn-secondary btn-sm" onClick={addStep} style={{ marginTop: 4 }}>+ Add Step</button>
      </div>

      <div className="divider" />

      <div className="form-group">
        <label className="label">Nutrition (per serving — optional)</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[['calories','Calories'],['protein','Protein (g)'],['carbs','Carbs (g)'],['fat','Fat (g)'],['fibre','Fibre (g)'],['sugar','Sugar (g)']].map(([k, lbl]) => (
            <div key={k} className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">{lbl}</label>
              <input className="input" type="number" min="0" value={form[k]} onChange={e => setField(k, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="divider" />

      {!isEdit && (
        <div className="form-group">
          <label className="label">Save to Cookbook</label>
          <select className="select" value={form.cookbookId} onChange={e => setField('cookbookId', e.target.value)}>
            {cookbook.cookbooks.map(cb => (
              <option key={cb.id} value={cb.id}>{cb.emoji ?? '📖'} {cb.name}</option>
            ))}
          </select>
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={!form.title.trim() || saved}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {saved ? '✓ Done!' : isEdit ? '💾 Save Changes' : '🔖 Save Recipe'}
      </button>
    </Modal>
  );
}
