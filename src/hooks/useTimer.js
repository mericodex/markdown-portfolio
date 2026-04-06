import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer() {
  const [totalSeconds, setTotalSeconds] = useState(0);    // configured duration
  const [remaining, setRemaining]       = useState(0);    // seconds left
  const [running, setRunning]           = useState(false);
  const [finished, setFinished]         = useState(false);
  const intervalRef = useRef(null);

  const clear = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            setRunning(false);
            setFinished(true);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      clear();
    }
    return clear;
  }, [running, clear]);

  const start = useCallback((minutes) => {
    const secs = (minutes ?? Math.ceil(totalSeconds / 60)) * 60;
    if (minutes !== undefined) setTotalSeconds(secs);
    setRemaining(secs);
    setFinished(false);
    setRunning(true);
  }, [totalSeconds]);

  const pause = useCallback(() => setRunning(r => !r), []);

  const reset = useCallback(() => {
    setRunning(false);
    setFinished(false);
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  const dismiss = useCallback(() => {
    setFinished(false);
    setRunning(false);
    setRemaining(0);
    setTotalSeconds(0);
  }, []);

  const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 0;

  return { totalSeconds, remaining, running, finished, progress, start, pause, reset, dismiss };
}
