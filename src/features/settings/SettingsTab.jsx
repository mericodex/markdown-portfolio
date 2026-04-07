import { useLocalStorage } from '../../hooks/useLocalStorage';
import './settings.css';

const PALETTES = [
  { id: 'rose',     name: 'Atelier', color: '#1A1A1A' },
  { id: 'ocean',    name: 'Ocean',   color: '#0F3D52' },
  { id: 'sunset',   name: 'Sunset',  color: '#8B2500' },
  { id: 'lavender', name: 'Violet',  color: '#4A2272' },
  { id: 'forest',   name: 'Forest',  color: '#16502E' },
];

export default function SettingsTab({ apiKey, settings, setSettings, onApiKeyReset }) {
  const [showKey, setShowKey] = useLocalStorage('mk-show-key', false);

  function update(key, value) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    // Apply palette immediately
    if (key === 'palette') document.documentElement.dataset.palette = value;
  }

  const maskedKey = apiKey
    ? apiKey.slice(0, 8) + '•'.repeat(Math.max(0, apiKey.length - 12)) + apiKey.slice(-4)
    : '—';

  return (
    <div className="settings-tab">
      {/* Appearance */}
      <div className="settings-section">
        <div className="settings-section-title">Appearance</div>

        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <div className="settings-row-label">Colour Palette</div>
          <div className="palette-swatches">
            {PALETTES.map(p => (
              <div
                key={p.id}
                className={`palette-swatch${settings?.palette === p.id ? ' selected' : ''}`}
                onClick={() => update('palette', p.id)}
              >
                <div className="palette-swatch-dot" style={{ background: p.color }} />
                <span className="palette-swatch-name">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Units */}
      <div className="settings-section">
        <div className="settings-section-title">Units &amp; Measurements</div>

        <div className="settings-row">
          <div>
            <div className="settings-row-label">Temperature</div>
          </div>
          <div className="toggle-switch">
            {['C', 'F'].map(unit => (
              <button
                key={unit}
                className={`toggle-option${settings?.temperatureUnit === unit ? ' active' : ''}`}
                onClick={() => update('temperatureUnit', unit)}
              >°{unit}</button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row-label">Measurements</div>
          </div>
          <div className="toggle-switch">
            {[{ id:'metric', label:'Metric' }, { id:'imperial', label:'Imperial' }].map(m => (
              <button
                key={m.id}
                className={`toggle-option${settings?.measurementSystem === m.id ? ' active' : ''}`}
                onClick={() => update('measurementSystem', m.id)}
              >{m.label}</button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row-label">Currency</div>
            <div className="settings-row-desc">Used in cost estimates</div>
          </div>
          <select
            className="select"
            style={{ width: 'auto' }}
            value={settings?.currency ?? 'ZAR'}
            onChange={e => update('currency', e.target.value)}
          >
            <option value="ZAR">ZAR (R)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>
      </div>

      {/* Recipe display */}
      <div className="settings-section">
        <div className="settings-section-title">Recipe Display</div>

        <div className="settings-row">
          <div className="settings-row-label">Default Font Size</div>
          <div className="toggle-switch">
            {['XS', 'S', 'M', 'L', 'XL'].map(sz => (
              <button
                key={sz}
                className={`toggle-option${settings?.recipeFontSize === sz ? ' active' : ''}`}
                onClick={() => update('recipeFontSize', sz)}
              >{sz}</button>
            ))}
          </div>
        </div>
      </div>

      {/* API Key */}
      <div className="settings-section">
        <div className="settings-section-title">AI Settings</div>

        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          <div className="settings-row-label">Anthropic API Key</div>
          <div className="api-key-display" style={{ width: '100%' }}>
            <span className="api-key-masked">{showKey ? apiKey : maskedKey}</span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowKey(s => !s)}
            >
              {showKey ? '🙈' : '👁'}
            </button>
          </div>
          <button className="btn btn-danger btn-sm" onClick={onApiKeyReset}>
            🔑 Reset API Key
          </button>
        </div>
      </div>

      {/* About */}
      <div className="settings-section">
        <div className="settings-section-title">About</div>
        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            <strong>Mama's Kitchen</strong> v1.0<br />
            An AI-powered recipe companion. All AI features are powered by Anthropic's Claude API using your personal key.<br /><br />
            Your data is stored locally on this device only — nothing is sent to any server except Claude API calls.
          </p>
        </div>
      </div>
    </div>
  );
}
