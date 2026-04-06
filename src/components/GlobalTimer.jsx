import { useState, useEffect } from 'react';
import { formatCountdown } from '../utils/formatters';
import './GlobalTimer.css';

const FLASH_COLORS = ['#e74c3c','#f39c12','#27ae60','#2980b9','#8e44ad','#e74c3c'];

export default function GlobalTimer({ timer }) {
  const { remaining, running, finished, progress, start, pause, reset, dismiss } = timer;
  const [minutes, setMinutes] = useState('');
  const [flashColor, setFlashColor] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Flash effect when finished
  useEffect(() => {
    if (!finished) { setFlashColor(null); return; }
    let i = 0;
    const id = setInterval(() => {
      setFlashColor(FLASH_COLORS[i % FLASH_COLORS.length]);
      i++;
      if (i > 18) { clearInterval(id); setFlashColor(null); }
    }, 250);
    // Vibrate if supported
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
    return () => clearInterval(id);
  }, [finished]);

  const handleStart = () => {
    const m = parseInt(minutes, 10);
    if (m > 0) { start(m); setMinutes(''); setExpanded(false); }
  };

  const isActive = running || remaining > 0 || finished;

  if (!isActive && !expanded) {
    return (
      <div className="global-timer global-timer-collapsed">
        <button className="timer-open-btn" onClick={() => setExpanded(true)} title="Set timer">
          ⏱ Timer
        </button>
      </div>
    );
  }

  return (
    <div
      className={`global-timer${finished ? ' timer-finished' : ''}`}
      style={flashColor ? { background: flashColor } : undefined}
    >
      {isActive ? (
        <div className="timer-active">
          <div className="timer-progress-bar">
            <div className="timer-progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="timer-row">
            <span className="timer-display">{formatCountdown(remaining)}</span>
            <div className="timer-controls">
              <button className="btn btn-sm btn-secondary" onClick={pause}>
                {running ? '⏸' : '▶'}
              </button>
              <button className="btn btn-sm btn-secondary" onClick={reset}>↺</button>
              <button className="btn btn-sm btn-secondary" onClick={() => { dismiss(); setExpanded(false); }}>✕</button>
            </div>
          </div>
          {finished && <div className="timer-done-msg">⏰ Timer finished!</div>}
        </div>
      ) : (
        <div className="timer-setup">
          <input
            className="timer-input"
            type="number"
            min="1"
            max="999"
            placeholder="mins"
            value={minutes}
            onChange={e => setMinutes(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
          />
          <button className="btn btn-primary btn-sm" onClick={handleStart} disabled={!minutes}>
            Start ⏱
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setExpanded(false)}>✕</button>
        </div>
      )}
    </div>
  );
}
