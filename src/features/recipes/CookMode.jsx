import { useState, useEffect } from 'react';
import './CookMode.css';

export default function CookMode({ recipe, onClose }) {
  const [step, setStep] = useState(0);
  const steps = recipe?.steps ?? [];
  const total = steps.length;

  // Request wake lock to keep screen on
  useEffect(() => {
    let wakeLock = null;
    async function acquire() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch {}
    }
    acquire();
    return () => { wakeLock?.release?.(); };
  }, []);

  if (!recipe) return null;

  return (
    <div className="cook-mode" onClick={() => step < total - 1 && setStep(s => s + 1)}>
      <div className="cook-mode-header">
        <button className="cook-mode-close" onClick={e => { e.stopPropagation(); onClose(); }}>✕ Exit</button>
        <span className="cook-mode-title">{recipe.title}</span>
        <span className="cook-mode-progress">{step + 1} / {total}</span>
      </div>

      <div className="cook-mode-step-bar">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`cook-step-dot${i === step ? ' active' : i < step ? ' done' : ''}`}
            onClick={e => { e.stopPropagation(); setStep(i); }}
          />
        ))}
      </div>

      <div className="cook-mode-content">
        <div className="cook-step-number">Step {step + 1}</div>
        <div className="cook-step-text">{steps[step]}</div>
      </div>

      <div className="cook-mode-nav" onClick={e => e.stopPropagation()}>
        <button
          className="btn btn-secondary"
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
        >← Back</button>
        {step < total - 1 ? (
          <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
            Next →
          </button>
        ) : (
          <button className="btn btn-primary" onClick={onClose}>
            🎉 Done!
          </button>
        )}
      </div>

      <p className="cook-mode-tap-hint">Tap screen to advance</p>
    </div>
  );
}
