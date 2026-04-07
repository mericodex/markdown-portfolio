import { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTimer } from './hooks/useTimer';
import GlobalTimer from './components/GlobalTimer';
import RecipesTab    from './features/recipes/RecipesTab';
import AdjustmentTab from './features/adjustment/AdjustmentTab';
import CookbookTab   from './features/cookbook/CookbookTab';
import MealPlanTab   from './features/mealplan/MealPlanTab';
import PantryTab     from './features/pantry/PantryTab';
import ShoppingTab   from './features/shopping/ShoppingTab';
import SettingsTab   from './features/settings/SettingsTab';
import './App.css';

// Reordered: Recipes > Adjust > Pantry > Meal Plan > Cookbook > Shopping
const TABS = [
  { id: 'recipes',  label: 'Recipes',   icon: '🍳' },
  { id: 'adjust',   label: 'Adjust',    icon: '✏️' },
  { id: 'pantry',   label: 'Pantry',    icon: '🥕' },
  { id: 'mealplan', label: 'Meal Plan', icon: '📅' },
  { id: 'cookbook', label: 'Cookbook',  icon: '📖' },
  { id: 'shopping', label: 'Shopping',  icon: '🛒' },
];

function LogoSVG() {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="18" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M13 14c0-2.76 2.24-5 5-5s5 2.24 5 5v2H13v-2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M10 16h16v12a6 6 0 01-12 0V16z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M25 10c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <line x1="22" y1="13" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function BurgerMenu({ isOpen, onClose, apiKey, settings, setSettings, onApiKeyReset, setActiveTab }) {
  if (!isOpen) return null;
  return (
    <>
      <div className="burger-backdrop" onClick={onClose} />
      <div className="burger-drawer">
        <div className="burger-drawer-header">
          <span className="burger-drawer-title">Mama's Kitchen</span>
          <button className="burger-close" onClick={onClose} aria-label="Close menu">✕</button>
        </div>
        <nav className="burger-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className="burger-nav-item"
              onClick={() => { setActiveTab(tab.id); onClose(); }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="burger-divider" />
        <button
          className="burger-nav-item"
          onClick={() => { setActiveTab('settings'); onClose(); }}
        >
          <span>⚙️</span>
          <span>Settings</span>
        </button>
      </div>
    </>
  );
}

function SetupScreen({ onSave }) {
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  return (
    <div className="setup-screen">
      <div className="setup-logo">👩‍🍳</div>
      <h1>Welcome to Mama's Kitchen</h1>
      <p>Your AI-powered recipe companion. Generate recipes, manage your pantry, plan meals, and more. Enter your Anthropic API key to get started.</p>
      <div className="api-input-row">
        <input
          className="input"
          type={show ? 'text' : 'password'}
          placeholder="sk-ant-..."
          value={key}
          onChange={e => setKey(e.target.value)}
          autoComplete="off"
        />
        <button className="btn btn-secondary btn-sm" onClick={() => setShow(s => !s)}>
          {show ? '🙈' : '👁'}
        </button>
      </div>
      <button
        className="btn btn-primary"
        disabled={!key.startsWith('sk-ant-')}
        onClick={() => onSave(key.trim())}
      >
        Get Cooking →
      </button>
      <p className="setup-hint">
        Get an API key at console.anthropic.com. Your key is stored only on this device.
      </p>
    </div>
  );
}

function AppShell() {
  const [activeTab, setActiveTab] = useState('recipes');
  const [menuOpen, setMenuOpen]   = useState(false);
  const [apiKey, setApiKey]       = useLocalStorage('mk-api-key', '');
  const [settings, setSettings]   = useLocalStorage('mk-settings', {
    palette: 'rose',
    temperatureUnit: 'C',
    measurementSystem: 'metric',
    currency: 'ZAR',
    recipeFontSize: 'M'
  });

  const timer = useTimer();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showBanner, setShowBanner]       = useState(false);

  useEffect(() => {
    document.documentElement.dataset.palette = settings.palette ?? 'rose';
  }, [settings.palette]);

  useEffect(() => {
    const handler = e => { e.preventDefault(); setInstallPrompt(e); setShowBanner(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
    setShowBanner(false);
  };

  if (!apiKey) return <SetupScreen onSave={setApiKey} />;

  const sharedProps = { apiKey, settings, setSettings };

  return (
    <div className="app-wrapper">
      {/* Sticky header */}
      <header className="app-header">
        <button
          className="burger-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <span className="burger-line" />
          <span className="burger-line" />
          <span className="burger-line" />
        </button>

        <div className="app-header-center">
          <div className="app-header-titles">
            <div className="app-header-title">Mama's Kitchen</div>
            <div className="app-header-subtitle">AI Recipe Companion</div>
          </div>
        </div>

        {/* Spacer to balance burger button */}
        <div style={{ width: 40 }} />
      </header>

      <BurgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        apiKey={apiKey}
        settings={settings}
        setSettings={setSettings}
        onApiKeyReset={() => setApiKey('')}
        setActiveTab={setActiveTab}
      />

      {showBanner && (
        <div className="pwa-banner">
          <span className="pwa-banner-text">📱 Add to your home screen for the full app experience!</span>
          <button onClick={handleInstall}>Install</button>
          <button className="pwa-banner-dismiss" onClick={() => setShowBanner(false)}>✕</button>
        </div>
      )}

      <GlobalTimer timer={timer} />

      <main className="app-main">
        {activeTab === 'recipes'  && <RecipesTab    {...sharedProps} timer={timer} />}
        {activeTab === 'adjust'   && <AdjustmentTab {...sharedProps} />}
        {activeTab === 'pantry'   && <PantryTab     {...sharedProps} />}
        {activeTab === 'mealplan' && <MealPlanTab   {...sharedProps} />}
        {activeTab === 'cookbook' && <CookbookTab   {...sharedProps} />}
        {activeTab === 'shopping' && <ShoppingTab   {...sharedProps} />}
        {activeTab === 'settings' && <SettingsTab   {...sharedProps} onApiKeyReset={() => setApiKey('')} />}
      </main>

      <nav className="tab-bar" role="navigation" aria-label="Main navigation">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className="tab-btn-icon">{tab.icon}</span>
            <span className="tab-btn-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
