import { useState } from "react";
import { useLiftLog } from "../lib/state.jsx";
import { useToast } from "../lib/toast.jsx";
import { targetFromPlan } from "../lib/coach.js";
import Modal from "../components/Modal.jsx";

function AddSetModal({ session, exercise, target, onClose }) {
  const { addSet, checkPR } = useLiftLog();
  const showToast = useToast();
  // Pre-fill with the coach's target so hitting the plan is one tap.
  const [weight, setWeight] = useState(target?.weight != null ? String(target.weight) : "");
  const [reps, setReps] = useState(target ? String(target.reps) : "");

  function submit() {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if ((!w && w !== 0) || !r) return;
    const { isPR } = checkPR(exercise.name, w || 0, r);
    addSet(session.id, exercise.id, w || 0, r);
    onClose();
    if (isPR) showToast("🏆 New PR — " + exercise.name);
  }

  return (
    <Modal
      title={exercise.name}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={submit}
          className="w-full rounded-xl bg-accent py-3 text-center font-semibold text-white transition-opacity hover:opacity-90"
        >
          Log set
        </button>
      }
    >
      {target ? (
        <div className="mb-3 rounded-lg bg-accent-soft px-3 py-2 text-sm font-medium text-accent">
          🎯 Coach target: {target.sets}×{target.reps}
          {target.weight != null ? ` @ ${target.weight}kg` : ""}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-secondary">Weight (kg)</span>
          <input
            type="number"
            inputMode="decimal"
            autoFocus
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="rounded-lg border border-border-input bg-surface-input px-3 py-2.5 text-lg font-semibold outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-secondary">Reps</span>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="rounded-lg border border-border-input bg-surface-input px-3 py-2.5 text-lg font-semibold outline-none focus:border-accent"
          />
        </label>
      </div>
    </Modal>
  );
}

function AddExerciseModal({ session, onClose }) {
  const { getExercises, addExercise, addExerciseToSession } = useLiftLog();
  const [query, setQuery] = useState("");
  const all = getExercises();
  const q = query.trim().toLowerCase();
  const matches = q ? all.filter((e) => e.name.toLowerCase().includes(q)) : all;
  const exactMatch = all.some((e) => e.name.toLowerCase() === q);

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
        className="mb-3 w-full rounded-lg border border-border-input bg-surface-input px-3 py-2.5 outline-none focus:border-accent"
      />
      <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
        {matches.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => pick(e.name)}
            className="rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-muted-alt"
          >
            {e.name}
          </button>
        ))}
        {q && !exactMatch ? (
          <button
            type="button"
            onClick={createAndPick}
            className="rounded-lg px-3 py-2.5 text-left font-medium text-accent transition-colors hover:bg-accent-soft"
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

  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-ink">{exercise.name}</span>
        <button
          type="button"
          onClick={() => removeExerciseFromSession(session.id, exercise.id)}
          className="rounded-full p-1 text-ink-muted transition-colors hover:bg-surface-muted-alt hover:text-danger"
          aria-label={`Remove ${exercise.name}`}
        >
          ✕
        </button>
      </div>

      {target ? (
        <div className="mb-2 rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent">
          🎯 Target: {target.sets}×{target.reps}
          {target.weight != null ? ` @ ${target.weight}kg` : ""}
        </div>
      ) : null}

      {exercise.sets.length ? (
        <div className="mb-3 flex flex-col gap-1.5">
          {exercise.sets.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2">
              <span className="text-sm font-medium">{s.weight} kg × {s.reps}</span>
              <button
                type="button"
                onClick={() => removeSet(session.id, exercise.id, s.id)}
                className="text-ink-muted hover:text-danger"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-3 py-2 text-sm text-ink-muted">No sets yet</div>
      )}

      <button
        type="button"
        onClick={() => setAddingSet(true)}
        className="w-full rounded-lg border border-dashed border-border-strong py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-accent hover:text-accent"
      >
        + Add set
      </button>

      {best ? (
        <div className="mt-2 text-xs text-ink-muted">Best: {best.weight}kg × {best.reps}</div>
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
    showToast("Session saved — syncing to Dashboard…");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">{session.split}</h2>
          <button
            type="button"
            onClick={() => {
              if (confirm("Delete this session?")) deleteSession(session.id);
            }}
            className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-surface-muted-alt hover:text-danger"
          >
            🗑
          </button>
        </div>
        {coachGroup ? (
          <button
            type="button"
            onClick={() => {
              addCoachTargetsToSession(session.id, coachGroup);
              showToast("🎯 Coach plan loaded");
            }}
            className="mt-3 w-full rounded-lg bg-accent py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            🎯 Start from coach plan ({coachGroup.exercises.length} exercises)
          </button>
        ) : null}
        {prev ? (
          <button
            type="button"
            onClick={() => copyExercisesFrom(session.id, prev)}
            className="mt-3 w-full rounded-lg bg-accent-soft py-2 text-sm font-medium text-accent transition-opacity hover:opacity-90"
          >
            ↻ Repeat {prev.date} ({prev.exercises.length} exercises)
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {session.exercises.map((ex) => (
          <ExerciseCard key={ex.id} session={session} exercise={ex} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setAddingExercise(true)}
        className="rounded-xl border border-dashed border-border-strong py-3 text-sm font-medium text-ink-secondary transition-colors hover:border-accent hover:text-accent"
      >
        + Add exercise
      </button>

      <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-2 font-semibold text-ink">Notes</h2>
        <textarea
          placeholder="Notes (optional)…"
          value={notes}
          onChange={(e) => setNotesLocal(e.target.value)}
          onBlur={(e) => setNotes(session.id, e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-border-input bg-surface-input px-3 py-2 outline-none focus:border-accent"
        />
      </div>

      <button
        type="button"
        onClick={finish}
        className="rounded-xl bg-accent py-3 text-center font-semibold text-white transition-opacity hover:opacity-90"
      >
        ✓ Finish & sync session
      </button>

      {addingExercise ? <AddExerciseModal session={session} onClose={() => setAddingExercise(false)} /> : null}
    </div>
  );
}

function SplitPicker({ dateKey }) {
  const { getSplits, createSession } = useLiftLog();
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
      <h2 className="mb-3 font-semibold text-ink">What are you training?</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {getSplits().map((split) => (
          <button
            key={split}
            type="button"
            onClick={() => createSession(dateKey, split)}
            className="rounded-lg border border-line bg-surface-muted py-3 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
          >
            {split}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Log({ dateKey }) {
  const { getSessionsForDate } = useLiftLog();
  const sessions = getSessionsForDate(dateKey);

  if (!sessions.length) return <SplitPicker dateKey={dateKey} />;

  return (
    <div className="flex flex-col gap-4">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} dateKey={dateKey} />
      ))}
    </div>
  );
}
