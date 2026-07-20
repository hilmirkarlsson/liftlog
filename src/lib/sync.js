// Best-effort push to the Dashboard backend (/api/log-workout), which fans
// the session out to Google Drive (so the Dashboard Health card can show it)
// and appends it to today's Obsidian daily note. LiftLog works fully
// offline without this — a failed push just gets retried later, it never
// blocks logging a workout.
const QUEUE_KEY = "liftlog-sync-queue";

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
  } catch {
    return [];
  }
}
function saveQueue(q) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch {}
}

// The Dashboard backend on Railway — same URL the Dashboard's app.js uses.
// A pasted Settings value overrides it; the default makes sync work out of
// the box on every device instead of silently posting to a dead relative URL.
const DEFAULT_API_BASE = "https://dashboard-production-100b.up.railway.app";

function apiBase() {
  try {
    return (
      (JSON.parse(localStorage.getItem("liftlog-data")) || {}).settings?.apiBase?.trim() || DEFAULT_API_BASE
    );
  } catch {
    return DEFAULT_API_BASE;
  }
}

async function pushOne(session) {
  const endpoint = apiBase().replace(/\/$/, "") + "/api/log-workout";
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export function queueSync(session) {
  const q = getQueue();
  const key = String(session.id || "");
  const next = key ? q.filter((item) => String(item.id || "") !== key) : q;
  next.push(session);
  saveQueue(next);
  drainQueue();
}

export function queueAllSessions(sessions) {
  const q = getQueue();
  const byId = new Map(q.map((session) => [String(session.id || ""), session]));
  for (const session of sessions || []) {
    if (session?.id) byId.set(String(session.id), session);
  }
  saveQueue([...byId.values()]);
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

export async function fetchRemoteSessions() {
  try {
    const endpoint = apiBase().replace(/\/$/, "") + "/api/liftlog-history";
    const r = await fetch(endpoint, { cache: "no-store" });
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data.sessions) ? data.sessions : [];
  } catch {
    return [];
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", drainQueue);
}
