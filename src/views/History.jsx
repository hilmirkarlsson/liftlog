import { useState } from "react";
import { useLiftLog } from "../lib/state.jsx";
import { formatDisplayDate } from "../lib/util.js";
import Modal from "../components/Modal.jsx";

function totalVolume(session) {
  let v = 0;
  for (const ex of session.exercises) for (const s of ex.sets) v += (s.weight || 0) * (s.reps || 0);
  return Math.round(v);
}

function SessionDetailModal({ session, onClose }) {
  const { deleteSession } = useLiftLog();
  return (
    <Modal
      title={`${session.split} · ${formatDisplayDate(session.date)}`}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={() => {
            if (confirm("Delete this session?")) {
              deleteSession(session.id);
              onClose();
            }
          }}
          className="w-full rounded-xl border border-danger/30 py-3 text-center font-semibold text-danger transition-colors hover:bg-danger/10"
        >
          Delete session
        </button>
      }
    >
      {session.exercises.length ? (
        <div className="flex flex-col gap-3">
          {session.exercises.map((ex) => (
            <div key={ex.id}>
              <div className="font-medium text-ink">{ex.name}</div>
              <div className="text-sm text-ink-muted">
                {ex.sets.length ? ex.sets.map((s) => `${s.weight}kg×${s.reps}`).join("  ·  ") : "—"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-2 text-sm text-ink-muted">No exercises logged</div>
      )}
    </Modal>
  );
}

export default function History() {
  const { getSessions } = useLiftLog();
  const sessions = getSessions();
  const [selected, setSelected] = useState(null);

  if (!sessions.length) {
    return (
      <div className="rounded-xl border border-line bg-surface p-4 text-sm text-ink-muted shadow-card">
        No sessions logged yet — head to Log to start one.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        {sessions.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelected(s)}
            className="flex w-full items-center justify-between border-b border-line px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-muted"
          >
            <div>
              <div className="font-medium text-ink">{s.split}</div>
              <div className="text-sm text-ink-muted">{formatDisplayDate(s.date)}</div>
            </div>
            <div className="flex flex-col items-end gap-0.5 text-xs text-ink-muted">
              <span>{s.exercises.length} {s.exercises.length === 1 ? "exercise" : "exercises"}</span>
              <span>{totalVolume(s).toLocaleString()} kg vol</span>
            </div>
          </button>
        ))}
      </div>
      {selected ? <SessionDetailModal session={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}
