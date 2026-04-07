import { useState } from 'react';
import Modal from '../../components/Modal';
import { importRecipeFromUrl, importRecipeFromText, importRecipeFromPhoto } from '../../services/claudeApi';
import { normaliseRecipe } from '../../utils/recipeParser';

const MANUAL_BLANK = {
  title: '', description: '', prepTime: '', cookTime: '', servings: '4',
  tags: '', ingredientsRaw: '', stepsRaw: '',
  calories: '', protein: '', carbs: '', fat: '', fibre: '', sugar: ''
};

export default function ImportModal({ isOpen, onClose, onImport, apiKey }) {
  const [mode, setMode] = useState('url');   // 'url' | 'photo' | 'manual'
  const [url, setUrl]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [manual, setManual]   = useState(MANUAL_BLANK);

  async function handleUrlImport() {
    setLoading(true); setError(null);
    try {
      const recipe = await importRecipeFromUrl({ apiKey, url });
      onImport(normaliseRecipe(recipe));
      onClose();
    } catch (e) {
      setError(e.message ?? 'Could not import from URL. Try pasting the recipe text instead, or use the photo option.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';
      const recipe = await importRecipeFromPhoto({ apiKey, photoBase64: base64, mimeType });
      onImport(normaliseRecipe(recipe));
      onClose();
    } catch (e) {
      setError(e.message ?? 'Could not extract recipe from photo.');
    } finally {
      setLoading(false);
    }
  }

  function handleManualSave() {
    const recipe = normaliseRecipe({
      title: manual.title,
      description: manual.description,
      prepTime: Number(manual.prepTime) || 0,
      cookTime: Number(manual.cookTime) || 0,
      servings: Number(manual.servings) || 4,
      tags: manual.tags.split(',').map(t => t.trim()).filter(Boolean),
      ingredients: manual.ingredientsRaw.split('\n').filter(Boolean).map(line => {
        const parts = line.split(' ');
        const qty = parseFloat(parts[0]) || 0;
        const unit = isNaN(parseFloat(parts[1])) && parts[1] ? parts[1] : '';
        const name = unit ? parts.slice(2).join(' ') : parts.slice(1).join(' ');
        return { name: name || line, quantity: qty, unit };
      }),
      steps: manual.stepsRaw.split('\n').filter(Boolean),
      nutrition: {
        calories: Number(manual.calories) || 0,
        protein:  Number(manual.protein)  || 0,
        carbs:    Number(manual.carbs)    || 0,
        fat:      Number(manual.fat)      || 0,
        fibre:    Number(manual.fibre)    || 0,
        sugar:    Number(manual.sugar)    || 0,
      }
    });
    onImport(recipe);
    onClose();
  }

  const mField = (k, label, type='text', placeholder='') => (
    <div className="form-group">
      <label className="label">{label}</label>
      <input
        className="input"
        type={type}
        placeholder={placeholder}
        value={manual[k]}
        onChange={e => setManual(m => ({...m, [k]: e.target.value}))}
      />
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Recipe" size="lg">
      {/* Mode tabs */}
      <div style={{display:'flex', gap:8, marginBottom:20}}>
        {[
          { id:'url',    label:'🔗 From URL' },
          { id:'photo',  label:'📸 From Photo' },
          { id:'manual', label:'✏️ Manual Entry' },
        ].map(m => (
          <button
            key={m.id}
            className={`btn btn-sm ${mode === m.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode(m.id)}
          >{m.label}</button>
        ))}
      </div>

      {error && <div className="recipes-error" style={{marginBottom:16}}>{error}</div>}

      {/* URL */}
      {mode === 'url' && (
        <div>
          <div className="form-group">
            <label className="label">Recipe URL</label>
            <input
              className="input"
              type="url"
              placeholder="https://www.example.com/recipe..."
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleUrlImport} disabled={!url || loading}>
            {loading ? <><span className="spinner" style={{width:16,height:16}} /> Importing…</> : 'Import Recipe'}
          </button>
        </div>
      )}

      {/* Photo */}
      {mode === 'photo' && (
        <div>
          <p style={{fontSize:'var(--font-size-sm)',color:'var(--color-text-muted)',marginBottom:12}}>
            Take a photo or upload an image of a recipe from a book, card, or screen.
          </p>
          <label className="btn btn-secondary" style={{cursor:'pointer'}}>
            📸 Choose Photo
            <input type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handlePhotoImport} />
          </label>
          {loading && <div style={{marginTop:16,display:'flex',gap:8,alignItems:'center'}}><span className="spinner" />Reading recipe from photo…</div>}
        </div>
      )}

      {/* Manual */}
      {mode === 'manual' && (
        <div>
          {mField('title', 'Recipe Title', 'text', 'e.g. Mama\'s Chicken Soup')}
          {mField('description', 'Description')}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
            {mField('prepTime', 'Prep (min)', 'number')}
            {mField('cookTime', 'Cook (min)', 'number')}
            {mField('servings', 'Servings', 'number')}
          </div>
          {mField('tags', 'Tags (comma-separated)', 'text', 'Main Dish, Quick Meal')}
          <div className="form-group">
            <label className="label">Ingredients (one per line: qty unit name)</label>
            <textarea
              className="input"
              rows={5}
              placeholder={"300 g chicken breast\n2 cups flour\n1 tsp salt"}
              value={manual.ingredientsRaw}
              onChange={e => setManual(m => ({...m, ingredientsRaw: e.target.value}))}
              style={{resize:'vertical'}}
            />
          </div>
          <div className="form-group">
            <label className="label">Steps (one per line)</label>
            <textarea
              className="input"
              rows={5}
              placeholder={"Preheat oven to 180°C.\nMix dry ingredients."}
              value={manual.stepsRaw}
              onChange={e => setManual(m => ({...m, stepsRaw: e.target.value}))}
              style={{resize:'vertical'}}
            />
          </div>
          <p className="label" style={{marginBottom:8}}>Nutrition (per serving)</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {['calories','protein','carbs','fat','fibre','sugar'].map(k => (
              <div key={k} className="form-group" style={{marginBottom:0}}>
                <label className="label">{k}</label>
                <input className="input" type="number" value={manual[k]} onChange={e => setManual(m=>({...m,[k]:e.target.value}))} />
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{marginTop:16}} onClick={handleManualSave} disabled={!manual.title}>
            Save Recipe
          </button>
        </div>
      )}
    </Modal>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
