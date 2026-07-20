import { useEffect, useState } from "react";
import { useLiftLog } from "../lib/state.jsx";
import { useToast } from "../lib/toast.jsx";
import { useRestTimer } from "../components/RestTimer.jsx";
import { targetFromPlan } from "../lib/coach.js";
import { primaryMuscleLabels } from "../lib/muscles.js";
import { CATEGORIES, exerciseCategory } from "../lib/exercises.js";
import { daysBetween, todayKey } from "../lib/util.js";
import Modal from "../components/Modal.jsx";

function sessionTotals(session) {
  let volume = 0;
  let sets = 0;
  for (const ex of session.exercises)
    for (const s of ex.sets) {
      volume += (s.weight || 0) * (s.reps || 0);
      sets += 1;
    }
  return { volume, sets };
}

// Black live-summary bar: duration ticks while the workout is today's.
function SessionSummary({ session }) {
  const { volume, sets } = sessionTotals(session);
  const isToday = session.date === todayKey();
  const [, tick] = useState(0);

  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [isToday]);

  let duration = "—";
  if (isToday && session.createdAt) {
    const s = Math.max(0, Math.floor((Date.now() - session.createdAt) / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    duration = h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}:${String(s % 60).padStart(2, "0")}`;
  }

  const Cell = ({ label, value }) => (
    <div className="flex-1 text-center">
      <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">{label}</div>
      <div className="mt-0.5 font-mono text-lg font-bold tabular-nums">{value}</div>
    </div>
  );

  return (
    <div className="flex items-center divide-x divide-white/15 rounded-2xl bg-ink py-3 text-white">
      <Cell label="Duration" value={duration} />
      <Cell label="Volume" value={`${Math.round(volume).toLocaleString()} kg`} />
      <Cell label="Sets" value={sets} />
    </div>
  );
}

function Stepper({ value, onChange, step, format }) {
  const num = parseFloat(value) || 0;
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(format(Math.max(0, num - step)))}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line text-lg font-bold text-ink-secondary transition-colors hover:border-ink"
      >
        −
      </button>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full min-w-0 rounded-xl border border-border-input bg-surface-input text-center text-xl font-bold outline-none focus:border-ink"
      />
      <button
        type="button"
        onClick={() => onChange(format(num + step))}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line text-lg font-bold text-ink-secondary transition-colors hover:border-ink"
      >
        +
      </button>
    </div>
  );
}

function AddSetModal({ session, exercise, target, onClose }) {
  const { addSet, checkPR } = useLiftLog();
  const { startRest } = useRestTimer();
  const showToast = useToast();
  const lastSet = exercise.sets[exercise.sets.length - 1] || null;
  // Pre-fill: repeat the last set if there is one, otherwise the coach target.
  const [weight, setWeight] = useState(
    lastSet ? String(lastSet.weight) : target?.weight != null ? String(target.weight) : ""
  );
  const [reps, setReps] = useState(lastSet ? String(lastSet.reps) : target ? String(target.reps) : "");

  function submit() {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps, 10);
    if (!r) return;
    const { isPR } = checkPR(exercise.name, w, r);
    addSet(session.id, exercise.id, w, r);
    startRest();
    onClose();
    if (isPR) showToast("New PR — " + exercise.name);
  }

  return (
    <Modal
      title={exercise.name}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={submit}
          className="w-full rounded-xl bg-ink py-3.5 text-center text-sm font-bold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
        >
          Log set
        </button>
      }
    >
      {target ? (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-line px-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">Coach target</span>
          <span className="font-mono text-sm font-bold">
            {target.sets}×{target.reps}
            {target.weight != null ? ` @ ${target.weight}kg` : ""}
          </span>
        </div>
      ) : null}
      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">Weight · kg</div>
          <Stepper value={weight} onChange={setWeight} step={2.5} format={(n) => String(Math.round(n * 10) / 10)} />
        </div>
        <div>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">Reps</div>
          <Stepper value={reps} onChange={setReps} step={1} format={(n) => String(Math.round(n))} />
        </div>
      </div>
    </Modal>
  );
}

function ExerciseRow({ exercise, onPick }) {
  return (
    <button
      type="button"
      onClick={() => onPick(exercise.name)}
      className="border-b border-line px-1 py-3 text-left text-sm font-medium last:border-b-0 hover:bg-surface-muted"
    >
      {exercise.name}
    </button>
  );
}

function AddExerciseModal({ session, onClose }) {
  const { getExercises, addExercise, addExerciseToSession } = useLiftLog();
  const [query, setQuery] = useState("");
  const all = getExercises();
  const q = query.trim().toLowerCase();
  const matches = q ? all.filter((e) => e.name.toLowerCase().includes(q)) : all;
  const exactMatch = all.some((e) => e.name.toLowerCase() === q);

  // Grouped browse when not searching; flat results while typing.
  const groups = q
    ? null
    : [...CATEGORIES, "Custom"]
        .map((cat) => ({ cat, items: all.filter((e) => exerciseCategory(e.name) === cat) }))
        .filter((g) => g.items.length);

  function pick(name) {
    addExerciseToSession(session.id, name);
    onClose();
  }

  function createAndPick() {
    const created = addExercise(query);
    if (created) pick(created.name);
  }

  return (
    <Modal title="Add exercise" onClose={onClose}>
      <input
        type="text"
        autoFocus
        placeholder="Search or add exercise…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-3 w-full rounded-xl border border-border-input bg-surface-input px-3 py-2.5 outline-none focus:border-ink"
      />
      <div className="flex max-h-[55dvh] flex-col overflow-y-auto">
        {groups
          ? groups.map(({ cat, items }) => (
              <div key={cat}>
                <div className="sticky top-0 bg-surface py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-ink-muted">
                  {cat}
                </div>
                <div className="flex flex-col">
                  {items.map((e) => (
                    <ExerciseRow key={e.id} exercise={e} onPick={pick} />
                  ))}
                </div>
              </div>
            ))
          : matches.map((e) => <ExerciseRow key={e.id} exercise={e} onPick={pick} />)}
        {q && !exactMatch ? (
          <button
            type="button"
            onClick={createAndPick}
            className="px-1 py-3 text-left text-sm font-bold underline underline-offset-2"
          >
            + Add "{query.trim()}"
          </button>
        ) : null}
      </div>
    </Modal>
  );
}

function ExerciseCard({ session, exercise }) {
  const { getBests, getCoach, removeSet, removeExerciseFromSession } = useLiftLog();
  const [addingSet, setAddingSet] = useState(false);
  const best = getBests()[exercise.name];
  const target = targetFromPlan(getCoach()?.plan, session.split, exercise.name);
  const muscles = primaryMuscleLabels(exercise.name, session.split);

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-ink">{exercise.name}</div>
          {muscles.length ? (
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
              {muscles.join(" · ")}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => removeExerciseFromSession(session.id, exercise.id)}
          className="rounded-full p-1 text-ink-muted transition-colors hover:text-danger"
          aria-label={`Remove ${exercise.name}`}
        >
          ✕
        </button>
      </div>

      {target ? (
        <div className="mb-2 text-[11px] font-semibold text-ink-secondary">
          Target {target.sets}×{target.reps}
          {target.weight != null ? ` @ ${target.weight}kg` : ""}
        </div>
      ) : null}

      {exercise.sets.length ? (
        <div className="mb-3 flex flex-col">
          {exercise.sets.map((s, i) => (
            <div key={s.id} className="flex items-center justify-between border-b border-line py-2 last:border-b-0">
              <div className="flex items-baseline gap-3">
                <span className="w-5 font-mono text-xs font-bold text-ink-muted">{i + 1}</span>
                <span className="font-mono text-sm font-bold tabular-nums">
                  {s.weight} <span className="text-xs font-medium text-ink-muted">kg</span> × {s.reps}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeSet(session.id, exercise.id, s.id)}
                className="text-ink-muted hover:text-danger"
                aria-label="Remove set"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-3 py-1 text-sm text-ink-muted">No sets yet</div>
      )}

      <button
        type="button"
        onClick={() => setAddingSet(true)}
        className="w-full rounded-xl border border-ink py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-ink hover:text-white"
      >
        + Add set
      </button>

      {best ? (
        <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
          Best {best.weight > 0 ? `${best.weight}kg` : "BW"} × {best.reps}
        </div>
      ) : null}

      {addingSet ? (
        <AddSetModal session={session} exercise={exercise} target={target} onClose={() => setAddingSet(false)} />
      ) : null}
    </div>
  );
}

function SessionCard({ session, dateKey }) {
  const { deleteSession, findPreviousSessionForSplit, copyExercisesFrom, addCoachTargetsToSession, getCoach, setNotes, syncSession } = useLiftLog();
  const showToast = useToast();
  const [addingExercise, setAddingExercise] = useState(false);
  const [notes, setNotesLocal] = useState(session.notes || "");

  const prev = session.exercises.length === 0 ? findPreviousSessionForSplit(dateKey, session.split) : null;
  const coachGroup =
    session.exercises.length === 0
      ? getCoach()?.plan.targets.find((t) => t.split === session.split) || null
      : null;

  function finish() {
    syncSession(session.id);
    showToast("Session saved");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight text-ink">{session.split}</h2>
        <button
          type="button"
          onClick={() => {
            if (confirm("Delete this session?")) deleteSession(session.id);
          }}
          className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted underline underline-offset-2 hover:text-danger"
        >
          Delete
        </button>
      </div>

      <SessionSummary session={session} />

      {coachGroup ? (
        <button
          type="button"
          onClick={() => {
            addCoachTargetsToSession(session.id, coachGroup);
            showToast("Coach plan loaded");
          }}
          className="w-full rounded-xl bg-ink py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
        >
          Start from coach plan · {coachGroup.exercises.length} exercises
        </button>
      ) : null}
      {prev ? (
        <button
          type="button"
          onClick={() => copyExercisesFrom(session.id, prev)}
          className="w-full rounded-xl border border-line py-3 text-xs font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:border-ink"
        >
          Repeat {prev.date} · {prev.exercises.length} exercises
        </button>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {session.exercises.map((ex) => (
          <ExerciseCard key={ex.id} session={session} exercise={ex} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setAddingExercise(true)}
        className="rounded-2xl border border-dashed border-border-strong py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-ink-secondary transition-colors hover:border-ink hover:text-ink"
      >
        + Add exercise
      </button>

      <textarea
        placeholder="Notes…"
        value={notes}
        onChange={(e) => setNotesLocal(e.target.value)}
        onBlur={(e) => setNotes(session.id, e.target.value)}
        rows={2}
        className="w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-ink"
      />

      <button
        type="button"
        onClick={finish}
        className="rounded-2xl bg-ink py-4 text-center text-sm font-bold uppercase tracking-[0.25em] text-white transition-opacity hover:opacity-90"
      >
        Finish workout
      </button>

      {addingExercise ? <AddExerciseModal session={session} onClose={() => setAddingExercise(false)} /> : null}
    </div>
  );
}

function WeekStrip() {
  const { getSessions } = useLiftLog();
  const today = todayKey();
  const week = getSessions().filter(
    (s) => daysBetween(s.date, today) <= 6 && s.exercises.some((ex) => ex.sets.length)
  );
  const volume = week.reduce(
    (n, s) => n + s.exercises.reduce((m, ex) => m + ex.sets.reduce((v, set) => v + set.weight * set.reps, 0), 0),
    0
  );
  return (
    <div className="flex items-center justify-between rounded-2xl border border-line px-4 py-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">Last 7 days</span>
      <span className="font-mono text-sm font-bold tabular-nums">
        {week.length} workout{week.length === 1 ? "" : "s"} · {Math.round(volume).toLocaleString()} kg
      </span>
    </div>
  );
}

function SplitPickerModal({ dateKey, onClose }) {
  const { getSplits, createSession, getCoach, findPreviousSessionForSplit } = useLiftLog();
  const coachTargets = getCoach()?.plan.targets || [];
  const [selectedSplits, setSelectedSplits] = useState([]);

  function toggleSplit(split) {
    setSelectedSplits((current) => {
      if (current.includes(split)) return current.filter((item) => item !== split);
      if (split === "Rest day") return [split];
      return [...current.filter((item) => item !== "Rest day"), split];
    });
  }

  function startWorkout() {
    if (!selectedSplits.length) return;
    createSession(dateKey, selectedSplits.join(" + "));
    onClose();
  }

  return (
    <Modal
      title="What are you training?"
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={startWorkout}
          disabled={!selectedSplits.length}
          className="w-full rounded-xl bg-ink py-3.5 text-center text-sm font-bold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {selectedSplits.length ? `Start workout · ${selectedSplits.length} selected` : "Select training"}
        </button>
      }
    >
      <div className="flex max-h-[60dvh] flex-col overflow-y-auto">
        {getSplits().map((split) => {
          const planned = coachTargets.some((t) => t.split === split);
          const prev = findPreviousSessionForSplit(dateKey, split);
          const isSelected = selectedSplits.includes(split);
          return (
            <button
              key={split}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleSplit(split)}
              className={`flex items-center justify-between border-b border-line px-3 py-3.5 text-left transition-colors last:border-b-0 ${
                isSelected ? "bg-ink text-white" : "hover:bg-surface-muted"
              }`}
            >
              <span className={`text-sm font-bold uppercase tracking-[0.15em] ${isSelected ? "text-white" : "text-ink"}`}>
                {split}
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${isSelected ? "text-white/65" : "text-ink-muted"}`}>
                {isSelected ? "Selected" : planned ? "Coach plan ready" : prev ? `Last ${prev.date}` : ""}
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

function SplitPicker({ dateKey }) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <WeekStrip />
      <button
        type="button"
        onClick={() => setPicking(true)}
        className="rounded-2xl bg-ink py-5 text-center text-sm font-bold uppercase tracking-[0.25em] text-white transition-opacity hover:opacity-90"
      >
        + Start workout
      </button>
      <p className="text-center text-xs text-ink-muted">Pick what you're training from the popup.</p>
      {picking ? <SplitPickerModal dateKey={dateKey} onClose={() => setPicking(false)} /> : null}
    </div>
  );
}

export default function Log({ dateKey }) {
  const { getSessionsForDate } = useLiftLog();
  const sessions = getSessionsForDate(dateKey);

  if (!sessions.length) return <SplitPicker dateKey={dateKey} />;

  return (
    <div className="flex flex-col gap-6">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} dateKey={dateKey} />
      ))}
    </div>
  );
}
