import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as storage from "./storage.js";
import { uid, estimated1RM } from "./util.js";
import { drainQueue, fetchRemoteSessions, pendingCount, queueAllSessions, queueSync } from "./sync.js";
import { buildLocalPlan, buildTrainingSummary, coachDataHash, coachReadiness } from "./coach.js";
import { generateAiPlan } from "./ai.js";

const LiftLogContext = createContext(null);

export function LiftLogProvider({ children }) {
  const [data, setData] = useState(() => storage.load());
  const [syncStatus, setSyncStatus] = useState({ state: "syncing", message: "Checking Drive sync" });

  // Best-effort nudge against iOS Safari purging localStorage for
  // home-screen-installed apps that go a few days without being opened.
  // Not honored everywhere, but harmless where it isn't.
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function syncFromDashboard() {
      queueAllSessions(data.sessions);
      await drainQueue();
      const remoteSessions = await fetchRemoteSessions();
      if (cancelled) return;
      if (!remoteSessions.length) {
        setSyncStatus({ state: pendingCount() ? "pending" : "synced", message: pendingCount() ? `${pendingCount()} waiting to sync` : "Synced with Drive" });
        return;
      }

      setData((prev) => {
        const byId = new Map(prev.sessions.map((session) => [String(session.id), session]));
        let changed = false;

        for (const session of remoteSessions) {
          if (!session?.id) continue;
          const key = String(session.id);
          if (!byId.has(key)) {
            byId.set(key, session);
            changed = true;
          }
        }

        if (!changed) return prev;
        const next = { ...prev, sessions: Array.from(byId.values()) };
        storage.save(next);
        queueAllSessions(next.sessions);
        return next;
      });
      setSyncStatus({ state: "synced", message: pendingCount() ? `${pendingCount()} waiting to sync` : "Synced with Drive" });
    }

    syncFromDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  // Every mutation replaces `data` with a new object and persists it in the
  // same tick. A second optional arg names the session that was just touched,
  // so it can be pushed to the backend right away instead of only at
  // "Finish & sync": a session interrupted mid-workout still has whatever
  // was logged before the interruption recoverable from the server.
  const mutate = useCallback((fn, syncSessionId) => {
    setData((prev) => {
      const next = structuredClone(prev);
      fn(next);
      storage.save(next);
      if (syncSessionId) {
        const session = next.sessions.find((s) => s.id === syncSessionId);
        if (session) queueSync(session);
      } else {
        queueAllSessions(next.sessions);
      }
      drainQueue().then(() => {
        setSyncStatus({ state: pendingCount() ? "pending" : "synced", message: pendingCount() ? `${pendingCount()} waiting to sync` : "Synced with Drive" });
      });
      return next;
    });
  }, []);

  const syncNow = useCallback(async () => {
    setSyncStatus({ state: "syncing", message: "Syncing with Drive" });
    queueAllSessions(data.sessions);
    const res = await drainQueue();
    const pending = pendingCount();
    setSyncStatus({ state: pending ? "pending" : "synced", message: pending ? `${pending} waiting to sync` : "Synced with Drive" });
    return res;
  }, [data.sessions]);

  // Regenerate the coach plan. Uses the AI when a key is set (unless
  // preferLocal), and always falls back to the on-device engine so the
  // coach works offline. Throws only if the AI path fails explicitly.
  const refreshCoach = useCallback(
    async ({ preferLocal = false } = {}) => {
      const apiKey = data.settings.anthropicApiKey?.trim();
      const dataHash = coachDataHash(data.sessions);
      const useAi = !preferLocal && !!apiKey;
      let plan;
      let source;
      if (useAi) {
        plan = await generateAiPlan(apiKey, buildTrainingSummary(data));
        source = "ai";
      } else {
        plan = buildLocalPlan(data);
        source = "local";
      }
      mutate((d) => {
        d.coach = { plan, source, generatedAt: Date.now(), dataHash };
      });
      return { plan, source };
    },
    [data, mutate]
  );

  const actions = useMemo(() => {
    const getSession = (d, id) => d.sessions.find((s) => s.id === id);

    return {
      updateSettings(partial) {
        mutate((d) => Object.assign(d.settings, partial));
      },

      addExercise(name) {
        const trimmed = name.trim();
        if (!trimmed) return null;
        const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + uid().slice(0, 4);
        const entry = { id, name: trimmed };
        mutate((d) => d.exercises.push(entry));
        return entry;
      },

      createSession(dateKeyStr, split) {
        const session = { id: uid(), date: dateKeyStr, split, notes: "", exercises: [], createdAt: Date.now() };
        mutate((d) => d.sessions.push(session), session.id);
        return session;
      },

      deleteSession(id) {
        mutate((d) => {
          const idx = d.sessions.findIndex((s) => s.id === id);
          if (idx !== -1) d.sessions.splice(idx, 1);
        });
      },

      addExerciseToSession(sessionId, exerciseName) {
        mutate((d) => {
          const session = getSession(d, sessionId);
          if (session) session.exercises.push({ id: uid(), name: exerciseName, sets: [] });
        }, sessionId);
      },

      removeExerciseFromSession(sessionId, exId) {
        mutate((d) => {
          const session = getSession(d, sessionId);
          if (session) session.exercises = session.exercises.filter((e) => e.id !== exId);
        }, sessionId);
      },

      addSet(sessionId, exId, weight, reps) {
        mutate((d) => {
          const session = getSession(d, sessionId);
          const ex = session?.exercises.find((e) => e.id === exId);
          if (ex) ex.sets.push({ id: uid(), weight: Number(weight) || 0, reps: Number(reps) || 0 });
        }, sessionId);
      },

      removeSet(sessionId, exId, setId) {
        mutate((d) => {
          const session = getSession(d, sessionId);
          const ex = session?.exercises.find((e) => e.id === exId);
          if (ex) ex.sets = ex.sets.filter((s) => s.id !== setId);
        }, sessionId);
      },

      setNotes(sessionId, notes) {
        mutate((d) => {
          const session = getSession(d, sessionId);
          if (session) session.notes = notes;
        }, sessionId);
      },

      copyExercisesFrom(sessionId, sourceSession) {
        mutate((d) => {
          const session = getSession(d, sessionId);
          if (!session || !sourceSession) return;
          for (const ex of sourceSession.exercises) {
            session.exercises.push({ id: uid(), name: ex.name, sets: [] });
          }
        }, sessionId);
      },

      // Start a session from the coach's plan for this split.
      addCoachTargetsToSession(sessionId, targetGroup) {
        mutate((d) => {
          const session = getSession(d, sessionId);
          if (!session || !targetGroup) return;
          const have = new Set(session.exercises.map((e) => e.name));
          for (const t of targetGroup.exercises) {
            if (!have.has(t.name)) session.exercises.push({ id: uid(), name: t.name, sets: [] });
          }
        }, sessionId);
      },

      syncSession(sessionId) {
        const session = getSession(data, sessionId);
        if (session) queueSync(session);
      },
    };
  }, [mutate, data]);

  // Derived reads — computed straight off current `data`.
  const derived = useMemo(() => {
    function getSplits() {
      return data.profile.splits;
    }
    function getExercises() {
      return data.exercises;
    }
    function getSettings() {
      return data.settings;
    }
    function getState() {
      return data;
    }
    function getSyncStatus() {
      return syncStatus;
    }
    function getCoach() {
      return data.coach;
    }
    function getCoachReadiness() {
      return coachReadiness(data.sessions);
    }
    function isCoachStale() {
      return !!data.coach && data.coach.dataHash !== coachDataHash(data.sessions);
    }
    function getSessions() {
      return [...data.sessions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
    }
    function getSessionsForDate(dateKeyStr) {
      return data.sessions.filter((s) => s.date === dateKeyStr);
    }
    function getSession(id) {
      return data.sessions.find((s) => s.id === id);
    }
    // Finds the most recent earlier session (any date before dateKeyStr)
    // that logged this exact split, so "repeat last session" has something
    // to copy.
    function findPreviousSessionForSplit(dateKeyStr, split) {
      return (
        data.sessions
          .filter((s) => s.split === split && s.date < dateKeyStr)
          .sort((a, b) => (a.date < b.date ? 1 : -1))[0] || null
      );
    }
    // Best-known e1RM per exercise across all logged sets plus the seeded
    // baseline PRs, so day-one users still see accurate bests.
    function getBests() {
      const bests = {};
      for (const seed of data.seedPRs) {
        bests[seed.exercise] = {
          weight: seed.weight,
          reps: seed.reps,
          date: seed.date,
          e1rm: estimated1RM(seed.weight, seed.reps),
          seeded: true,
        };
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
    // Returns { isPR, previousBest } for a set about to be logged, used to
    // give immediate "new PR" feedback right when the set is entered.
    function checkPR(exerciseName, weight, reps) {
      const bests = getBests();
      const e1rm = estimated1RM(weight, reps);
      const prev = bests[exerciseName];
      return { isPR: !prev || e1rm > prev.e1rm, previousBest: prev || null, e1rm };
    }
    function historyForExercise(exerciseName) {
      const points = [];
      for (const seed of data.seedPRs) {
        if (seed.exercise === exerciseName) {
          points.push({ date: seed.date, e1rm: estimated1RM(seed.weight, seed.reps), weight: seed.weight, reps: seed.reps });
        }
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

    return {
      getSplits,
      getExercises,
      getSettings,
      getSyncStatus,
      getState,
      getCoach,
      getCoachReadiness,
      isCoachStale,
      getSessions,
      getSessionsForDate,
      getSession,
      findPreviousSessionForSplit,
      getBests,
      checkPR,
      historyForExercise,
    };
  }, [data, syncStatus]);

  const value = useMemo(
    () => ({ ...derived, ...actions, syncNow, refreshCoach }),
    [derived, actions, syncNow, refreshCoach]
  );

  return <LiftLogContext.Provider value={value}>{children}</LiftLogContext.Provider>;
}

export function useLiftLog() {
  const ctx = useContext(LiftLogContext);
  if (!ctx) throw new Error("useLiftLog must be used within a LiftLogProvider");
  return ctx;
}
