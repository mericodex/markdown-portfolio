import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import BarcodeScanner from './BarcodeScanner';
import { identifyPantryItem } from '../../services/claudeApi';
import { PANTRY_CATEGORIES } from '../../context/reducers/pantryReducer';

const BLANK = {
  name: '', quantity: '', unit: 'g', portions: '',
  category: 'Cupboard', expiryDate: '',
  costMode: 'total',   // 'total' | 'per_kg'
  costRate: '',        // what the user types
  totalCost: 0,        // calculated/stored value
  photo: null
};

function calcTotalCost(form) {
  const rate = parseFloat(form.costRate) || 0;
  if (!rate) return 0;
  if (form.costMode === 'total') return rate;
  // per_kg mode: convert quantity to kg then multiply
  const qty = parseFloat(form.quantity) || 0;
  const unit = form.unit;
  let kg = qty;
  if (unit === 'g')  kg = qty / 1000;
  if (unit === 'mg') kg = qty / 1_000_000;
  if (unit === 'lb') kg = qty * 0.453592;
  if (unit === 'oz') kg = qty * 0.0283495;
  // per_lb mode if imperial
  if (form.costMode === 'per_lb') {
    const lb = unit === 'kg' ? qty * 2.20462
             : unit === 'g'  ? qty * 0.00220462
             : unit === 'oz' ? qty / 16
             : qty;
    return rate * lb;
  }
  return rate * kg;
}

export default function AddItemModal({ isOpen, onClose, onSave, editItem, apiKey, settings }) {
  const isImperial = settings?.measurementSystem === 'imperial';
  const weightLabel = isImperial ? 'lb' : 'kg';

  const [form, setForm]               = useState(editItem ? toFormState(editItem) : BLANK);
  const [showBarcode, setShowBarcode] = useState(false);
  const [aiLoading, setAiLoading]     = useState(false);
  const [error, setError]             = useState(null);

  // Sync form when editItem changes (fixes blank fields on edit)
  useEffect(() => {
    setForm(editItem ? toFormState(editItem) : BLANK);
    setShowBarcode(false);
    setError(null);
  }, [editItem, isOpen]);

  const isEdit = !!editItem;
  const costModeLabel = form.costMode === 'per_kg'
    ? `Per ${weightLabel}`
    : form.costMode === 'per_lb' ? 'Per lb' : 'Total Cost';

  const previewCost = calcTotalCost(form);

  function field(k, label, type = 'text', placeholder = '') {
    return (
      <div className="form-group">
        <label className="label">{label}</label>
        <input
          className="input"
          type={type}
          placeholder={placeholder}
          value={form[k] ?? ''}
          onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
        />
      </div>
    );
  }

  async function handlePhotoId(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiLoading(true);
    setError(null);
    try {
      const base64 = await fileToBase64(file);
      const result = await identifyPantryItem({ apiKey, photoBase64: base64, mimeType: file.type });
      setForm(f => ({ ...f, name: result.name, category: result.category, unit: result.unit }));
    } catch {
      setError('Could not identify item. Please fill in manually.');
    } finally {
      setAiLoading(false);
    }
  }

  function handleBarcodeResult(product) {
    setForm(f => ({
      ...f,
      name: product.name,
      category: product.category,
      unit: product.unit,
      quantity: product.quantity || f.quantity
    }));
    setShowBarcode(false);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    const totalCost = calcTotalCost(form);
    onSave({
      name:        form.name,
      quantity:    parseFloat(form.quantity) || 0,
      unit:        form.unit,
      portions:    parseFloat(form.portions) || 0,
      category:    form.category,
      expiryDate:  form.expiryDate,
      costMode:    form.costMode,
      costRate:    parseFloat(form.costRate) || 0,
      totalCost,
      photo:       form.photo ?? null,
    });
    setForm(BLANK);
    onClose();
  }

  const costModes = isImperial
    ? [{ id: 'total', label: 'Total Cost' }, { id: 'per_lb', label: 'Per lb' }]
    : [{ id: 'total', label: 'Total Cost' }, { id: 'per_kg', label: 'Per kg' }];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Item' : 'Add Pantry Item'} size="lg">
      {error && <div className="recipes-error" style={{ marginBottom: 12 }}>{error}</div>}

      {/* Photo ID / Barcode row */}
      {!isEdit && (
        <div className="pantry-id-row">
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
            {aiLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '📸'} Photo ID
            <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoId} />
          </label>
          <button
            className={`btn btn-sm ${showBarcode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowBarcode(b => !b)}
          >
            📊 Barcode
          </button>
        </div>
      )}

      {showBarcode && (
        <div style={{ marginBottom: 16 }}>
          <BarcodeScanner onResult={handleBarcodeResult} onError={msg => setError(msg)} />
        </div>
      )}

      <div className="divider" />

      {field('name', 'Item Name', 'text', 'e.g. Chicken Breast')}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {field('quantity', 'Quantity', 'number', '300')}
        <div className="form-group">
          <label className="label">Unit</label>
          <select className="select" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
            {['g', 'kg', 'ml', 'l', 'each', 'bunch', 'pack', 'oz', 'lb', 'tsp', 'tbsp', 'cup'].map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {field('portions', 'Portions', 'number', '4')}

      {/* Cost section */}
      <div className="form-group">
        <label className="label">Cost</label>
        <div className="toggle-switch" style={{ marginBottom: 8, display: 'inline-flex' }}>
          {costModes.map(m => (
            <button
              key={m.id}
              type="button"
              className={`toggle-option${form.costMode === m.id ? ' active' : ''}`}
              onClick={() => setForm(f => ({ ...f, costMode: m.id }))}
            >
              {m.label}
            </button>
          ))}
        </div>
        <input
          className="input"
          type="number"
          step="0.01"
          placeholder={form.costMode === 'total' ? 'e.g. 45.00 (total paid)' : `e.g. 56.99 (per ${weightLabel})`}
          value={form.costRate}
          onChange={e => setForm(f => ({ ...f, costRate: e.target.value }))}
        />
        {previewCost > 0 && (
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', marginTop: 4 }}>
            💰 Cost for this item: R {previewCost.toFixed(2)}
          </p>
        )}
      </div>

      <div className="form-group">
        <label className="label">Category</label>
        <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
          {PANTRY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {field('expiryDate', 'Expiry Date', 'date')}

      <button className="btn btn-primary" onClick={handleSave} disabled={!form.name.trim()}>
        {isEdit ? 'Save Changes' : 'Add to Pantry'}
      </button>
    </Modal>
  );
}

// Convert stored item back to form state for editing
function toFormState(item) {
  return {
    name:       item.name ?? '',
    quantity:   item.quantity != null ? String(item.quantity) : '',
    unit:       item.unit ?? 'g',
    portions:   item.portions != null ? String(item.portions) : '',
    category:   item.category ?? 'Cupboard',
    expiryDate: item.expiryDate ?? '',
    costMode:   item.costMode ?? 'total',
    costRate:   item.costRate != null ? String(item.costRate) : item.totalCost != null ? String(item.totalCost) : '',
    totalCost:  item.totalCost ?? 0,
    photo:      item.photo ?? null,
  };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
