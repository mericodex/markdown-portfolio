import { useState } from 'react';
import { adjustRecipe } from '../../services/claudeApi';
import './adjustment.css';

const QUICK_QUESTIONS = [
  'Make it dairy-free',
  'Reduce calories',
  'Make it gluten-free',
  'Make it diabetic friendly',
  'Make it vegan',
  'Reduce cooking time',
  'Make it higher protein',
  'Suggest ingredient substitutions',
  'Increase fibre content',
  'Make it nut-free',
];

export default function AdjustmentTab({ apiKey }) {
  const [recipe, setRecipe]   = useState('');
  const [question, setQuestion] = useState('');
  const [photo, setPhoto]     = useState(null);    // { base64, url, mimeType }
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function handleAsk() {
    if (!recipe.trim() && !photo) return;
    setLoading(true);
    setResponse('');
    setError(null);
    try {
      const result = await adjustRecipe({
        apiKey,
        recipe,
        question,
        photoBase64: photo?.base64
      });
      setResponse(result);
    } catch (e) {
      setError(e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      setPhoto({
        base64: dataUrl.split(',')[1],
        url: dataUrl,
        mimeType: file.type || 'image/jpeg'
      });
    };
    reader.readAsDataURL(file);
  }

  function clearPhoto() { setPhoto(null); }

  const canSubmit = (recipe.trim() || photo) && !loading;

  return (
    <div className="adjustment-tab">
      <div className="adjustment-input-area">
        <textarea
          className="input"
          rows={4}
          placeholder="Paste or type a recipe here…"
          value={recipe}
          onChange={e => setRecipe(e.target.value)}
        />

        {/* Photo */}
        <div className="adjustment-photo-row">
          {!photo ? (
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              📸 Add Recipe Photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
            </label>
          ) : (
            <>
              <img src={photo.url} alt="Recipe" className="adjustment-photo-preview" />
              <button className="btn btn-secondary btn-sm" onClick={clearPhoto}>✕ Remove Photo</button>
            </>
          )}
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            or take a photo of a recipe book/card
          </span>
        </div>

        {/* Quick question chips */}
        <div className="adjustment-chips">
          {QUICK_QUESTIONS.map(q => (
            <button
              key={q}
              className="adjustment-chip"
              onClick={() => setQuestion(q)}
            >{q}</button>
          ))}
        </div>

        {/* Question input + submit */}
        <div className="adjustment-question">
          <input
            className="input"
            placeholder="Ask a specific question…"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canSubmit && handleAsk()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={handleAsk} disabled={!canSubmit}>
            {loading ? <span className="spinner" /> : '✨ Ask'}
          </button>
        </div>
      </div>

      <div className="adjustment-result">
        {error && <div className="recipes-error">{error}</div>}

        {loading && (
          <div className="adjustment-loading">
            <div className="spinner" style={{ width: 36, height: 36 }} />
            <p>Analysing your recipe…</p>
          </div>
        )}

        {!loading && !response && !error && (
          <div className="empty-state">
            <div className="empty-icon">✏️</div>
            <p>Paste a recipe above and ask a question like "make it dairy-free" or "is this breastfeeding safe?"</p>
          </div>
        )}

        {response && (
          <div className="adjustment-response">{response}</div>
        )}
      </div>
    </div>
  );
}
