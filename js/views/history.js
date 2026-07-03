import { el } from '../dom.js';
import * as state from '../state.js';
import { openModal, closeModal } from '../modal.js';
import { formatDisplayDate } from '../util.js';

function totalVolume(session) {
  let v = 0;
  for (const ex of session.exercises) for (const s of ex.sets) v += (s.weight || 0) * (s.reps || 0);
  return Math.round(v);
}

function openDetail(session) {
  openModal({
    title: session.split + ' · ' + formatDisplayDate(session.date),
    body: session.exercises.length
      ? session.exercises.map((ex) =>
          el('div', { class: 'detail-ex' }, [
            el('div', { class: 'detail-ex-name' }, ex.name),
            el('div', { class: 'detail-ex-sets' }, ex.sets.map((s) => `${s.weight}kg×${s.reps}`).join('  ·  ') || '—'),
          ])
        )
      : [el('div', { class: 'empty-state' }, 'No exercises logged')],
    foot: [
      el('button', { class: 'btn btn-danger', onclick: () => {
        if (confirm('Delete this session?')) { state.deleteSession(session.id); closeModal(); }
      } }, 'Delete session'),
    ],
  });
}

export function renderHistory(container) {
  const sessions = state.getSessions();
  if (!sessions.length) {
    container.append(el('div', { class: 'card empty-state' }, 'No sessions logged yet — head to Log to start one.'));
    return;
  }
  container.append(
    el('div', { class: 'card', style: 'padding:0;overflow:hidden;' },
      sessions.map((s) =>
        el('button', { class: 'history-row', onclick: () => openDetail(s) }, [
          el('div', { class: 'history-row-main' }, [
            el('div', { class: 'history-row-split' }, s.split),
            el('div', { class: 'history-row-date' }, formatDisplayDate(s.date)),
          ]),
          el('div', { class: 'history-row-meta' }, [
            el('span', {}, s.exercises.length + (s.exercises.length === 1 ? ' exercise' : ' exercises')),
            el('span', {}, totalVolume(s).toLocaleString() + ' kg vol'),
          ]),
        ])
      )
    )
  );
}
