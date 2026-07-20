import { useMemo, useState } from "react";
import { useLiftLog } from "../lib/state.jsx";
import { daysBetween, formatDisplayDate, todayKey } from "../lib/util.js";
import { muscleActivation, MUSCLE_LABELS } from "../lib/muscles.js";
import MuscleMap from "../components/MuscleMap.jsx";

const HEADLINE_LIFTS = ["Bench Press", "Deadlift", "Squat"];

function SectionTitle({ children }) {
  return <h2 className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-ink-muted">{children}</h2>;
}

function MuscleCard() {
  const { getSessions } = useLiftLog();
  const [selected, setSelected] = useState(null);
  const { activation, stats } = useMemo(() => muscleActivation(getSessions()), [getSessions]);
  const detail = selected ? stats[selected] : null;

  return (
    <div className="rounded-2xl border border-line p-4">
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle>Training activation · last 7 days</SectionTitle>
        <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
          Lower
          <span className="h-2 w-10 rounded-full bg-gradient-to-r from-[#e8e8e8] to-activation" />
          Higher
        </div>
      </div>
      <p className="mb-3 text-xs text-ink-muted">Red shows recently trained muscles and set volume—not soreness.</p>
      <MuscleMap activation={activation} selected={selected} onPick={(g) => setSelected(g === selected ? null : g)} />
      <div className="mt-3 border-t border-line pt-3">
        {detail ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-ink">{MUSCLE_LABELS[selected]}</div>
              <div className="text-xs text-ink-muted">
                {detail.lastTrained
                  ? `Last trained ${formatDisplayDate(detail.lastTrained)}`
                  : "Not trained in the last week"}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg font-bold tabular-nums">{detail.sets}</div>
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink-muted">Sets / 7d</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-xs text-ink-muted">Tap a muscle for details</div>
        )}
      </div>
    </div>
  );
}

function PRTiles() {
  const { getBests } = useLiftLog();
  const bests = getBests();
  return (
    <div>
      <SectionTitle>Personal records</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        {HEADLINE_LIFTS.map((name) => {
          const b = bests[name];
          return (
            <div key={name} className="rounded-2xl border border-line p-3 text-center">
              <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-ink-muted">{name}</div>
              <div className="mt-1 font-mono text-2xl font-extrabold tabular-nums">{b ? b.weight : "—"}</div>
              <div className="text-[10px] text-ink-muted">{b ? `kg × ${b.reps}` : "no data"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VolumeBars() {
  const { getSessions } = useLiftLog();
  const today = todayKey();
  const weeks = useMemo(() => {
    const buckets = Array.from({ length: 8 }, () => 0);
    for (const s of getSessions()) {
      const ago = daysBetween(s.date, today);
      const w = Math.floor(ago / 7);
      if (w < 0 || w > 7) continue;
      buckets[7 - w] += s.exercises.reduce(
        (m, ex) => m + ex.sets.reduce((v, set) => v + set.weight * set.reps, 0),
        0
      );
    }
    return buckets;
  }, [getSessions, today]);
  const max = Math.max(...weeks, 1);

  return (
    <div className="rounded-2xl border border-line p-4">
      <div className="flex items-baseline justify-between">
        <SectionTitle>Weekly volume</SectionTitle>
        <span className="font-mono text-sm font-bold tabular-nums">
          {Math.round(weeks[7]).toLocaleString()} kg
        </span>
      </div>
      <div className="flex h-24 items-end gap-1.5">
        {weeks.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`w-full rounded-t-sm ${i === 7 ? "bg-ink" : "bg-border-strong"}`}
              style={{ height: `${Math.max(2, (v / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[9px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
        <span>8 wks ago</span>
        <span>This week</span>
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
  const H = 120;
  const PAD = 8;
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

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <path d={path} fill="none" stroke="#0a0a0a" strokeWidth="2" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill="#0a0a0a" />
      ))}
    </svg>
  );
}

function TrendCard() {
  const { getBests, getExercises, historyForExercise } = useLiftLog();
  const bests = getBests();
  const names = useMemo(() => getExercises().map((e) => e.name), [getExercises]);
  const [selected, setSelected] = useState("Bench Press");
  const points = historyForExercise(selected);
  const best = bests[selected];

  return (
    <div className="rounded-2xl border border-line p-4">
      <SectionTitle>Estimated 1RM trend</SectionTitle>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="mb-3 w-full rounded-xl border border-border-input bg-surface-input px-3 py-2.5 text-sm font-semibold outline-none focus:border-ink"
      >
        {names.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <LineChart points={points} />
      <div className="mt-2 text-xs text-ink-muted">
        {best
          ? `Best est. 1RM ${Math.round(best.e1rm)}kg — from ${best.weight}kg × ${best.reps}`
          : "No sets logged for this exercise yet"}
      </div>
    </div>
  );
}

export default function Stats() {
  return (
    <div className="flex flex-col gap-4">
      <MuscleCard />
      <PRTiles />
      <VolumeBars />
      <TrendCard />
    </div>
  );
}
