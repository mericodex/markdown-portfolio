import { useState } from 'react';
import Modal from '../../components/Modal';
import BarcodeScanner from './BarcodeScanner';
import { identifyPantryItem } from '../../services/claudeApi';
import { PANTRY_CATEGORIES } from '../../context/reducers/pantryReducer';

const BLANK = {
  name: '', quantity: '', unit: 'g', portions: '',
  category: 'Cupboard', expiryDate: '', costPerUnit: '', photo: null
};

export default function AddItemModal({ isOpen, onClose, onSave, editItem, apiKey }) {
  const [form, setForm]         = useState(editItem ?? BLANK);
  const [showBarcode, setShowBarcode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError]       = useState(null);

  // Reset form when modal opens with new editItem
  const isEdit = !!editItem;

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
    } catch (e) {
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
    onSave({
      ...form,
      quantity: Number(form.quantity) || 0,
      portions: Number(form.portions) || 0,
      costPerUnit: Number(form.costPerUnit) || 0
    });
    setForm(BLANK);
    onClose();
  }

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
          <BarcodeScanner
            onResult={handleBarcodeResult}
            onError={msg => setError(msg)}
          />
        </div>
      )}

      <div className="divider" />

      {field('name', 'Item Name', 'text', 'e.g. Chicken Breast')}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {field('quantity', 'Quantity', 'number', '300')}
        <div className="form-group">
          <label className="label">Unit</label>
          <select className="select" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
            {['g', 'kg', 'ml', 'l', 'each', 'bunch', 'pack', 'tsp', 'tbsp', 'cup'].map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {field('portions', 'Portions', 'number', '4')}
        {field('costPerUnit', 'Cost (ZAR)', 'number', '0.00')}
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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
