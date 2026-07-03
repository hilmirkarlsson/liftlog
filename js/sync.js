// Best-effort push to the Dashboard backend (/api/log-workout), which fans
// the session out to Google Drive (so the Dashboard Health card can show it)
// and appends it to today's Obsidian daily note. LiftLog works fully
// offline without this — a failed push just gets retried later, it never
// blocks logging a workout.
const QUEUE_KEY = 'liftlog-sync-queue';

function getQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch { return []; }
}
function saveQueue(q) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch {}
}

function apiBase() {
  try { return (JSON.parse(localStorage.getItem('liftlog-data')) || {}).settings?.apiBase || ''; } catch { return ''; }
}

async function pushOne(session) {
  const base = apiBase();
  if (!base) return false;
  try {
    const r = await fetch(base.replace(/\/$/, '') + '/api/log-workout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export function queueSync(session) {
  const q = getQueue();
  q.push(session);
  saveQueue(q);
  drainQueue();
}

export async function drainQueue() {
  let q = getQueue();
  if (!q.length) return;
  const remaining = [];
  for (const session of q) {
    const ok = await pushOne(session);
    if (!ok) remaining.push(session);
  }
  saveQueue(remaining);
  return { synced: q.length - remaining.length, pending: remaining.length };
}

export function pendingCount() {
  return getQueue().length;
}

window.addEventListener('online', drainQueue);
