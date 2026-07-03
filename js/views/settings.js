import { el, toast } from '../dom.js';
import * as state from '../state.js';
import { drainQueue, pendingCount } from '../sync.js';

function exportData() {
  const blob = new Blob([JSON.stringify(state.getState(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: 'liftlog-backup-' + new Date().toISOString().slice(0, 10) + '.json' });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function renderSettings(container) {
  const settings = state.getSettings();

  const apiInput = el('input', {
    type: 'url', placeholder: 'https://…', value: settings.apiBase || '',
    onchange: (e) => state.updateSettings({ apiBase: e.target.value.trim() }),
  });

  const syncStatus = el('div', { class: 'muted' }, pendingCount() + ' session(s) waiting to sync');

  container.append(
    el('div', { class: 'card' }, [
      el('h2', {}, 'Dashboard sync'),
      el('div', { class: 'muted', style: 'margin-bottom:10px;' },
        'Paste your Dashboard API URL (the same one app.js uses — local network address or Railway, whichever is live) to push finished sessions to your Health card and Obsidian daily note.'),
      el('div', { class: 'field' }, [el('label', {}, 'API base URL'), apiInput]),
      syncStatus,
      el('button', { class: 'btn btn-secondary', style: 'margin-top:10px;', onclick: async () => {
        toast('Syncing…');
        const res = await drainQueue();
        syncStatus.textContent = pendingCount() + ' session(s) waiting to sync';
        if (res) toast(res.synced + ' synced, ' + res.pending + ' still pending');
      } }, 'Sync now'),
    ]),
    el('div', { class: 'card' }, [
      el('h2', {}, 'Exercises'),
      el('div', { class: 'ex-manage-list' },
        state.getExercises().map((ex) => el('div', { class: 'ex-manage-row' }, ex.name))
      ),
      el('button', { class: 'quick-add-btn', onclick: () => {
        const name = prompt('New exercise name:');
        if (name) state.addExercise(name);
      } }, '+ Add exercise'),
    ]),
    el('div', { class: 'card' }, [
      el('h2', {}, 'Training split'),
      el('div', { class: 'muted' }, state.getSplits().join(' · ')),
    ]),
    el('div', { class: 'card' }, [
      el('h2', {}, 'Backup'),
      el('button', { class: 'btn btn-secondary', onclick: exportData }, 'Export data (JSON)'),
    ])
  );
}
