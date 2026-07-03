import { el, esc, toast } from '../dom.js';
import * as state from '../state.js';
import { openModal, closeModal } from '../modal.js';

// No explicit re-render calls needed anywhere below: every state.* mutation
// already calls commit(), which notifies main.js's subscription and
// triggers a full repaint.
function pickSplit(container, dateKey) {
  container.append(
    el('div', { class: 'card split-pick' }, [
      el('h2', {}, "What are you training?"),
      el('div', { class: 'split-grid' },
        state.getSplits().map((split) =>
          el('button', { class: 'split-btn', onclick: () => state.createSession(dateKey, split) }, split)
        )
      ),
    ])
  );
}

function setRow(session, ex, set) {
  return el('div', { class: 'set-row' }, [
    el('span', { class: 'set-vals' }, `${set.weight} kg × ${set.reps}`),
    el('button', { class: 'set-del', onclick: () => state.removeSet(session.id, ex.id, set.id) }, '✕'),
  ]);
}

function openAddSetModal(session, ex) {
  const wInput = el('input', { type: 'number', inputmode: 'decimal', placeholder: 'Weight (kg)', class: 'big-num' });
  const rInput = el('input', { type: 'number', inputmode: 'numeric', placeholder: 'Reps', class: 'big-num' });
  openModal({
    title: ex.name,
    body: [
      el('div', { class: 'field-row' }, [
        el('div', { class: 'field' }, [el('label', {}, 'Weight (kg)'), wInput]),
        el('div', { class: 'field' }, [el('label', {}, 'Reps'), rInput]),
      ]),
    ],
    foot: [
      el('button', { class: 'btn btn-primary', onclick: () => {
        const w = parseFloat(wInput.value), r = parseInt(rInput.value, 10);
        if (!w || !r) return;
        const { isPR } = state.checkPR(ex.name, w, r);
        state.addSet(session.id, ex.id, w, r);
        closeModal();
        if (isPR) toast('🏆 New PR — ' + ex.name);
      } }, 'Log set'),
    ],
  });
  setTimeout(() => wInput.focus(), 50);
}

function openAddExerciseModal(session) {
  const search = el('input', { type: 'text', placeholder: 'Search or add exercise…', class: 'search-input' });
  const list = el('div', { class: 'ex-pick-list' });
  const renderList = () => {
    list.innerHTML = '';
    const q = search.value.trim().toLowerCase();
    const all = state.getExercises();
    const matches = q ? all.filter((e) => e.name.toLowerCase().includes(q)) : all;
    matches.forEach((e) => {
      list.append(el('button', { class: 'ex-pick-item', onclick: () => {
        state.addExerciseToSession(session.id, e.name);
        closeModal();
      } }, e.name));
    });
    if (q && !all.some((e) => e.name.toLowerCase() === q)) {
      list.append(el('button', { class: 'ex-pick-item ex-pick-new', onclick: () => {
        const created = state.addExercise(search.value);
        if (created) {
          state.addExerciseToSession(session.id, created.name);
          closeModal();
        }
      } }, `+ Add "${esc(search.value.trim())}"`));
    }
  };
  search.addEventListener('input', renderList);
  openModal({ title: 'Add exercise', body: [search, list] });
  renderList();
  setTimeout(() => search.focus(), 50);
}

function renderExerciseCard(session, ex) {
  const bests = state.getBests();
  return el('div', { class: 'card ex-card' }, [
    el('div', { class: 'ex-card-head' }, [
      el('span', { class: 'ex-name' }, ex.name),
      el('button', { class: 'ex-remove', onclick: () => state.removeExerciseFromSession(session.id, ex.id) }, '✕'),
    ]),
    ex.sets.length
      ? el('div', { class: 'set-list' }, ex.sets.map((s) => setRow(session, ex, s)))
      : el('div', { class: 'empty-state' }, 'No sets yet'),
    el('button', { class: 'add-set-btn', onclick: () => openAddSetModal(session, ex) }, '+ Add set'),
    bests[ex.name] ? el('div', { class: 'ex-best' }, `Best: ${bests[ex.name].weight}kg × ${bests[ex.name].reps}`) : null,
  ]);
}

export function renderLog(container, dateKey) {
  const sessions = state.getSessionsForDate(dateKey);

  if (!sessions.length) {
    pickSplit(container, dateKey);
    return;
  }

  sessions.forEach((session) => {
    const prev = session.exercises.length === 0 ? state.findPreviousSessionForSplit(dateKey, session.split) : null;

    container.append(
      el('div', { class: 'card session-head' }, [
        el('div', { class: 'session-head-row' }, [
          el('h2', {}, session.split),
          el('button', { class: 'icon-btn-sm', onclick: () => {
            if (confirm('Delete this session?')) state.deleteSession(session.id);
          } }, '🗑'),
        ]),
        prev
          ? el('button', { class: 'quick-add-btn', onclick: () => state.copyExercisesFrom(session.id, prev) },
              `↻ Repeat ${prev.date} (${prev.exercises.length} exercises)`)
          : null,
      ])
    );

    session.exercises.forEach((ex) => container.append(renderExerciseCard(session, ex)));

    container.append(
      el('button', { class: 'add-food-btn', onclick: () => openAddExerciseModal(session) }, '+ Add exercise')
    );

    // Committing (and therefore re-rendering) on every keystroke would tear
    // down and rebuild this textarea mid-sentence, throwing the cursor to
    // the end — save on blur/enter instead, like a normal text field.
    const notes = el('textarea', {
      class: 'notes-area', placeholder: 'Notes (optional)…',
      onchange: (e) => state.setNotes(session.id, e.target.value),
    }, session.notes || '');

    container.append(
      el('div', { class: 'card' }, [el('h2', {}, 'Notes'), notes]),
      el('button', { class: 'btn btn-primary', onclick: () => {
        state.syncSession(session.id);
        toast('Session saved — syncing to Dashboard…');
      } }, '✓ Finish & sync session')
    );
  });
}
