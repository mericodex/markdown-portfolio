import { useState } from 'react';
import Modal from './Modal';
import useAppContext from '../hooks/useAppContext';
import { normaliseRecipe } from '../utils/recipeParser';

const BLANK_INGREDIENT = { name: '', quantity: '', unit: 'g' };
const BLANK_STEP = '';
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

export default function AddRecipeModal({ isOpen, onClose, defaultCookbookId }) {
  const { cookbook, cookbookDispatch } = useAppContext();
  const [form, setForm] = useState({ ...BLANK_FORM, cookbookId: defaultCookbookId ?? cookbook.cookbooks[0]?.id ?? '' });
  const [saved, setSaved] = useState(false);

  function setField(k, v) {
    setForm(f => ({ ...f, [k]: v }));
  }

  // ── Ingredient helpers ──
  function setIngredient(i, key, value) {
    setForm(f => {
      const ings = [...f.ingredients];
      ings[i] = { ...ings[i], [key]: value };
      return { ...f, ingredients: ings };
    });
  }
  function addIngredient() {
    setForm(f => ({ ...f, ingredients: [...f.ingredients, { ...BLANK_INGREDIENT }] }));
  }
  function removeIngredient(i) {
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }));
  }

  // ── Step helpers ──
  function setStep(i, value) {
    setForm(f => {
      const steps = [...f.steps];
      steps[i] = value;
      return { ...f, steps };
    });
  }
  function addStep() {
    setForm(f => ({ ...f, steps: [...f.steps, ''] }));
  }
  function removeStep(i) {
    setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }));
  }

  function handleSave() {
    if (!form.title.trim()) return;
    const recipe = normaliseRecipe({
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

    cookbookDispatch({ type: 'ADD_RECIPE', recipe });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setForm({ ...BLANK_FORM, cookbookId: form.cookbookId });
      onClose();
    }, 1200);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Recipe" size="xl">
      {saved && (
        <div style={{ background: '#d4edda', color: '#155724', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>
          ✓ Recipe saved to cookbook!
        </div>
      )}

      {/* Basic info */}
      <div className="form-group">
        <label className="label">Recipe Title *</label>
        <input className="input" placeholder="e.g. Creamy Chicken Pasta" value={form.title} onChange={e => setField('title', e.target.value)} autoFocus />
      </div>

      <div className="form-group">
        <label className="label">Description</label>
        <input className="input" placeholder="Short description of the dish" value={form.description} onChange={e => setField('description', e.target.value)} />
      </div>

      <div className="form-group">
        <label className="label">Make / Method Style</label>
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

      {/* Ingredients */}
      <div className="form-group">
        <label className="label">Ingredients</label>
        {form.ingredients.map((ing, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 32px', gap: 6, marginBottom: 6 }}>
            <input
              className="input"
              placeholder="Ingredient name"
              value={ing.name}
              onChange={e => setIngredient(i, 'name', e.target.value)}
            />
            <input
              className="input"
              type="number"
              placeholder="Qty"
              value={ing.quantity}
              onChange={e => setIngredient(i, 'quantity', e.target.value)}
            />
            <select className="select" value={ing.unit} onChange={e => setIngredient(i, 'unit', e.target.value)}>
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
            <button
              className="btn btn-danger btn-sm btn-icon"
              onClick={() => removeIngredient(i)}
              disabled={form.ingredients.length === 1}
              style={{ padding: '0 8px' }}
            >✕</button>
          </div>
        ))}
        <button className="btn btn-secondary btn-sm" onClick={addIngredient} style={{ marginTop: 4 }}>
          + Add Ingredient
        </button>
      </div>

      <div className="divider" />

      {/* Steps */}
      <div className="form-group">
        <label className="label">Instructions</label>
        {form.steps.map((step, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 32px', gap: 6, marginBottom: 6, alignItems: 'start' }}>
            <span style={{
              width: 24, height: 24, background: 'var(--color-primary)', color: '#fff',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, marginTop: 10, flexShrink: 0
            }}>{i + 1}</span>
            <textarea
              className="input"
              rows={2}
              placeholder={`Step ${i + 1}…`}
              value={step}
              onChange={e => setStep(i, e.target.value)}
              style={{ resize: 'vertical' }}
            />
            <button
              className="btn btn-danger btn-sm btn-icon"
              onClick={() => removeStep(i)}
              disabled={form.steps.length === 1}
              style={{ padding: '0 8px', marginTop: 8 }}
            >✕</button>
          </div>
        ))}
        <button className="btn btn-secondary btn-sm" onClick={addStep} style={{ marginTop: 4 }}>
          + Add Step
        </button>
      </div>

      <div className="divider" />

      {/* Nutrition */}
      <div className="form-group">
        <label className="label">Nutrition (per serving — leave blank if unknown)</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[['calories','Calories (kcal)'],['protein','Protein (g)'],['carbs','Carbs (g)'],['fat','Fat (g)'],['fibre','Fibre (g)'],['sugar','Sugar (g)']].map(([k, lbl]) => (
            <div key={k} className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">{lbl}</label>
              <input className="input" type="number" min="0" value={form[k]} onChange={e => setField(k, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="divider" />

      {/* Save to */}
      <div className="form-group">
        <label className="label">Save to Cookbook</label>
        <select className="select" value={form.cookbookId} onChange={e => setField('cookbookId', e.target.value)}>
          {cookbook.cookbooks.map(cb => (
            <option key={cb.id} value={cb.id}>{cb.emoji ?? '📖'} {cb.name}</option>
          ))}
        </select>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={!form.title.trim() || saved}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {saved ? '✓ Saved!' : '🔖 Save Recipe to Cookbook'}
      </button>
    </Modal>
  );
}
