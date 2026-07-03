import * as storage from './storage.js';
import { uid, estimated1RM } from './util.js';
import { queueSync } from './sync.js';

const data = storage.load();
const listeners = new Set();

function persist() { storage.save(data); }
function notify() { for (const fn of listeners) fn(); }
function commit() { persist(); notify(); }

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState() { return data; }
export function getSplits() { return data.profile.splits; }
export function getExercises() { return data.exercises; }
export function getSettings() { return data.settings; }

export function updateSettings(partial) {
  Object.assign(data.settings, partial);
  commit();
}

export function addExercise(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + uid().slice(0, 4);
  const entry = { id, name: trimmed };
  data.exercises.push(entry);
  commit();
  return entry;
}

export function getSessions() {
  return [...data.sessions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
}

export function getSessionsForDate(dateKeyStr) {
  return data.sessions.filter((s) => s.date === dateKeyStr);
}

export function getSession(id) {
  return data.sessions.find((s) => s.id === id);
}

export function createSession(dateKeyStr, split) {
  const session = {
    id: uid(),
    date: dateKeyStr,
    split,
    notes: '',
    exercises: [],
    createdAt: Date.now(),
  };
  data.sessions.push(session);
  commit();
  return session;
}

export function deleteSession(id) {
  const idx = data.sessions.findIndex((s) => s.id === id);
  if (idx === -1) return;
  data.sessions.splice(idx, 1);
  commit();
}

export function addExerciseToSession(sessionId, exerciseName) {
  const session = getSession(sessionId);
  if (!session) return;
  session.exercises.push({ id: uid(), name: exerciseName, sets: [] });
  commit();
}

export function removeExerciseFromSession(sessionId, exId) {
  const session = getSession(sessionId);
  if (!session) return;
  session.exercises = session.exercises.filter((e) => e.id !== exId);
  commit();
}

export function addSet(sessionId, exId, weight, reps) {
  const session = getSession(sessionId);
  if (!session) return;
  const ex = session.exercises.find((e) => e.id === exId);
  if (!ex) return;
  ex.sets.push({ id: uid(), weight: Number(weight) || 0, reps: Number(reps) || 0 });
  commit();
}

export function removeSet(sessionId, exId, setId) {
  const session = getSession(sessionId);
  if (!session) return;
  const ex = session.exercises.find((e) => e.id === exId);
  if (!ex) return;
  ex.sets = ex.sets.filter((s) => s.id !== setId);
  commit();
}

export function setNotes(sessionId, notes) {
  const session = getSession(sessionId);
  if (!session) return;
  session.notes = notes;
  commit();
}

// Finds the most recent earlier session (any date before dateKeyStr) that
// logged this exact split, so "repeat last session" has something to copy.
export function findPreviousSessionForSplit(dateKeyStr, split) {
  return data.sessions
    .filter((s) => s.split === split && s.date < dateKeyStr)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0] || null;
}

export function copyExercisesFrom(sessionId, sourceSession) {
  const session = getSession(sessionId);
  if (!session || !sourceSession) return;
  for (const ex of sourceSession.exercises) {
    session.exercises.push({ id: uid(), name: ex.name, sets: [] });
  }
  commit();
}

// Best-known e1RM per exercise across all logged sets plus the seeded
// baseline PRs, so day-one users still see accurate bests.
export function getBests() {
  const bests = {};
  for (const seed of data.seedPRs) {
    bests[seed.exercise] = { weight: seed.weight, reps: seed.reps, date: seed.date, e1rm: estimated1RM(seed.weight, seed.reps), seeded: true };
  }
  for (const session of data.sessions) {
    for (const ex of session.exercises) {
      for (const set of ex.sets) {
        const e1rm = estimated1RM(set.weight, set.reps);
        const cur = bests[ex.name];
        if (!cur || e1rm > cur.e1rm) {
          bests[ex.name] = { weight: set.weight, reps: set.reps, date: session.date, e1rm, seeded: false };
        }
      }
    }
  }
  return bests;
}

// Returns { isPR, previousBest } for a set about to be logged, used to give
// immediate "new PR" feedback right when the set is entered.
export function checkPR(exerciseName, weight, reps) {
  const bests = getBests();
  const e1rm = estimated1RM(weight, reps);
  const prev = bests[exerciseName];
  return { isPR: !prev || e1rm > prev.e1rm, previousBest: prev || null, e1rm };
}

export function historyForExercise(exerciseName) {
  const points = [];
  for (const seed of data.seedPRs) {
    if (seed.exercise === exerciseName) points.push({ date: seed.date, e1rm: estimated1RM(seed.weight, seed.reps), weight: seed.weight, reps: seed.reps });
  }
  for (const session of data.sessions) {
    for (const ex of session.exercises) {
      if (ex.name !== exerciseName) continue;
      for (const set of ex.sets) {
        points.push({ date: session.date, e1rm: estimated1RM(set.weight, set.reps), weight: set.weight, reps: set.reps });
      }
    }
  }
  return points.sort((a, b) => (a.date < b.date ? -1 : 1));
}

// Every state mutation above already called commit(); attaching the sync
// queue here too would double-fire, so views call this explicitly right
// after actions that represent "session is done" (see log.js finish button).
export function syncSession(sessionId) {
  const session = getSession(sessionId);
  if (session) queueSync(session);
}
