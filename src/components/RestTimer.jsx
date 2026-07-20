// Rest timer between sets: logging a set starts a countdown chip pinned
// above the tab bar. Tap +30 to extend, ✕ to dismiss.
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const RestContext = createContext({ startRest: () => {}, addTime: () => {}, stopRest: () => {}, secondsLeft: 0 });

export function RestTimerProvider({ children }) {
  const [endsAt, setEndsAt] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endsAt]);

  const secondsLeft = endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 0;

  useEffect(() => {
    if (endsAt && secondsLeft === 0) {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      const id = setTimeout(() => setEndsAt(null), 3000);
      return () => clearTimeout(id);
    }
  }, [endsAt, secondsLeft]);

  const startRest = useCallback((seconds = 90) => setEndsAt(Date.now() + seconds * 1000), []);
  const addTime = useCallback(() => setEndsAt((e) => (e ? e + 30000 : Date.now() + 30000)), []);
  const stopRest = useCallback(() => setEndsAt(null), []);

  return (
    <RestContext.Provider value={{ startRest, addTime, stopRest, secondsLeft, active: !!endsAt }}>
      {children}
    </RestContext.Provider>
  );
}

export function useRestTimer() {
  return useContext(RestContext);
}

export function RestChip() {
  const { active, secondsLeft, addTime, stopRest } = useRestTimer();
  if (!active) return null;
  const m = Math.floor(secondsLeft / 60);
  const s = String(secondsLeft % 60).padStart(2, "0");
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink px-4 py-2.5 text-white">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Rest</span>
        <span className="min-w-12 text-center font-mono text-lg font-bold tabular-nums">
          {secondsLeft === 0 ? "GO" : `${m}:${s}`}
        </span>
        <button type="button" onClick={addTime} className="rounded-full border border-white/30 px-2.5 py-0.5 text-xs font-semibold">
          +30
        </button>
        <button type="button" onClick={stopRest} aria-label="Dismiss rest timer" className="text-white/60 hover:text-white">
          ✕
        </button>
      </div>
    </div>
  );
}
