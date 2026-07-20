import { useMemo, useState } from "react";
import { useLiftLog } from "../lib/state.jsx";

const HEADLINE_LIFTS = ["Bench Press", "Deadlift", "Squat"];

function PRBanner({ bests }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
      <h2 className="mb-3 font-semibold text-ink">Personal Records</h2>
      <div className="grid grid-cols-3 gap-2.5">
        {HEADLINE_LIFTS.map((name) => {
          const b = bests[name];
          return (
            <div key={name} className="rounded-lg bg-surface-muted p-3 text-center">
              <div className="mb-1 text-xs font-medium text-ink-muted">{name}</div>
              <div className="text-xl font-bold text-ink">{b ? `${b.weight}kg` : "—"}</div>
              <div className="text-xs text-ink-muted">{b ? `× ${b.reps}` : "not logged yet"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LineChart({ points }) {
  if (points.length < 2) {
    return (
      <div className="py-6 text-center text-sm text-ink-muted">
        {points.length ? "Log one more session to see a trend" : "No data yet"}
      </div>
    );
  }
  const W = 320;
  const H = 140;
  const PAD = 10;
  const values = points.map((p) => p.e1rm);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (W - PAD * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = PAD + i * stepX;
    const y = H - PAD - ((p.e1rm - min) / range) * (H - PAD * 2);
    return [x, y];
  });
  const path = coords.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
  const area = `${path} L${coords[coords.length - 1][0]},${H - PAD} L${coords[0][0]},${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <path d={area} fill="var(--color-accent-soft)" stroke="none" />
      <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill="var(--color-accent)" />
      ))}
    </svg>
  );
}

export default function Progress() {
  const { getBests, getExercises, historyForExercise } = useLiftLog();
  const bests = getBests();
  const names = useMemo(() => getExercises().map((e) => e.name), [getExercises]);
  const [selected, setSelected] = useState("Bench Press");

  const points = historyForExercise(selected);
  const best = bests[selected];

  return (
    <div className="flex flex-col gap-4">
      <PRBanner bests={bests} />
      <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-3 font-semibold text-ink">Estimated 1RM trend</h2>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="mb-3 w-full rounded-lg border border-border-input bg-surface-input px-3 py-2 outline-none focus:border-accent"
        >
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <LineChart points={points} />
        <div className="mt-2 text-sm text-ink-muted">
          {best ? `Best est. 1RM: ${Math.round(best.e1rm)}kg (from ${best.weight}kg × ${best.reps})` : "No sets logged for this exercise yet"}
        </div>
      </div>
    </div>
  );
}
