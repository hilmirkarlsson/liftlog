// The coach engine. Watches every set and exercise you log, and once a week
// of data exists it (a) tells you what to improve and (b) calculates per-
// exercise targets for your next session of each split, building on how you
// have actually been training (progressive overload off your real numbers).
//
// Everything in this file is deterministic and runs on-device, so the coach
// works fully offline. When an Anthropic API key is set, ai.js sends the
// same summary to Claude for a smarter plan in the identical shape — the UI
// renders both the same way.
import { daysBetween, estimated1RM, roundToPlate, todayKey } from "./util.js";

export const READY_DAYS = 7;
export const READY_SESSIONS = 3;

function loggedSessions(sessions) {
  return sessions.filter(
    (s) => s.split !== "Rest day" && s.exercises.some((ex) => ex.sets.length > 0)
  );
}

// Gate: the coach unlocks after a week of tracking with a few real sessions.
export function coachReadiness(sessions) {
  const logged = loggedSessions(sessions);
  const dates = [...new Set(logged.map((s) => s.date))].sort();
  const daysTracked = dates.length ? daysBetween(dates[0], todayKey()) + 1 : 0;
  const setsLogged = logged.reduce(
    (n, s) => n + s.exercises.reduce((m, ex) => m + ex.sets.length, 0),
    0
  );
  return {
    ready: daysTracked >= READY_DAYS && logged.length >= READY_SESSIONS,
    daysTracked: Math.min(daysTracked, READY_DAYS),
    sessionsLogged: Math.min(logged.length, READY_SESSIONS),
    setsLogged,
    daysNeeded: READY_DAYS,
    sessionsNeeded: READY_SESSIONS,
  };
}

// A cheap content hash of everything the plan depends on, so we know when a
// cached plan has gone stale (new sets logged since it was generated).
export function coachDataHash(sessions) {
  const text = JSON.stringify(
    loggedSessions(sessions).map((s) => [
      s.date,
      s.split,
      s.exercises.map((ex) => [ex.name, ex.sets.map((set) => [set.weight, set.reps])]),
    ])
  );
  let h = 0;
  for (let i = 0; i < text.length; i++) h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  return String(h);
}

// Per-exercise history: appearances ordered oldest → newest, each with the
// session's best e1RM, top weight, set count, and average reps.
function exerciseHistory(sessions) {
  const bySplit = {};
  const byExercise = {};
  const ordered = [...loggedSessions(sessions)].sort((a, b) => (a.date < b.date ? -1 : 1));

  for (const session of ordered) {
    bySplit[session.split] = session;
    for (const ex of session.exercises) {
      if (!ex.sets.length) continue;
      const bestE1rm = Math.max(...ex.sets.map((s) => estimated1RM(s.weight, s.reps)));
      const topWeight = Math.max(...ex.sets.map((s) => s.weight));
      const avgReps = ex.sets.reduce((n, s) => n + s.reps, 0) / ex.sets.length;
      (byExercise[ex.name] ||= []).push({
        date: session.date,
        split: session.split,
        bestE1rm,
        topWeight,
        sets: ex.sets.length,
        avgReps,
        volume: ex.sets.reduce((n, s) => n + s.weight * s.reps, 0),
      });
    }
  }
  return { bySplit, byExercise };
}

function trendFor(appearances) {
  if (appearances.length < 2) return "new";
  const last = appearances[appearances.length - 1];
  const prev = appearances[appearances.length - 2];
  if (last.bestE1rm > prev.bestE1rm + 0.5) return "progressing";
  // Stalled = three straight appearances with no e1RM improvement.
  if (appearances.length >= 3) {
    const [a, b, c] = appearances.slice(-3);
    if (c.bestE1rm <= a.bestE1rm + 0.5 && b.bestE1rm <= a.bestE1rm + 0.5) return "stalled";
  }
  return "holding";
}

function isBodyweight(appearances) {
  return appearances.every((a) => a.topWeight === 0);
}

// Progressive-overload target for one exercise, built off the most recent
// session that included it.
function targetForExercise(name, appearances) {
  const last = appearances[appearances.length - 1];
  const trend = trendFor(appearances);
  const sets = Math.max(3, last.sets);

  if (isBodyweight(appearances)) {
    return {
      name,
      sets,
      reps: Math.max(1, Math.round(last.avgReps) + 1),
      weight: null,
      note: "Bodyweight — add a rep per set.",
    };
  }

  if (trend === "stalled") {
    if (appearances.length >= 4) {
      const [a, b, c, d] = appearances.slice(-4);
      if (d.bestE1rm <= a.bestE1rm + 0.5 && c.bestE1rm <= a.bestE1rm + 0.5 && b.bestE1rm <= a.bestE1rm + 0.5) {
        return {
          name,
          sets,
          reps: 10,
          weight: Math.max(2.5, roundToPlate(last.topWeight * 0.9)),
          note: "Stalled 4 sessions — deload ~10% and rebuild with clean reps.",
        };
      }
    }
    return {
      name,
      sets,
      reps: Math.min(12, Math.round(last.avgReps) + 1),
      weight: last.topWeight,
      note: "Stalled — same weight, squeeze out one more rep per set.",
    };
  }

  if (last.avgReps >= 10) {
    const bump = last.topWeight >= 100 ? 5 : 2.5;
    return {
      name,
      sets,
      reps: 8,
      weight: roundToPlate(last.topWeight + bump),
      note: `Hit ${Math.round(last.avgReps)} reps last time — add ${bump}kg and reset to 8s.`,
    };
  }

  return {
    name,
    sets,
    reps: Math.min(12, Math.round(last.avgReps) + 1),
    weight: last.topWeight,
    note: "Same weight, one more rep per set than last time.",
  };
}

// Compact summary of recent training — feeds both the local plan and the AI
// prompt, so the model reasons over exactly what the local engine sees.
export function buildTrainingSummary(data) {
  const sessions = loggedSessions(data.sessions);
  const { byExercise } = exerciseHistory(data.sessions);
  const today = todayKey();
  const recent = sessions
    .filter((s) => daysBetween(s.date, today) <= 28)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  return {
    today,
    splits: data.profile.splits.filter((s) => s !== "Rest day"),
    recentSessions: recent.map((s) => ({
      date: s.date,
      split: s.split,
      exercises: s.exercises
        .filter((ex) => ex.sets.length)
        .map((ex) => ({
          name: ex.name,
          sets: ex.sets.map((set) => `${set.weight}kg x ${set.reps}`),
        })),
      notes: s.notes || undefined,
    })),
    exerciseTrends: Object.fromEntries(
      Object.entries(byExercise).map(([name, apps]) => [name, trendFor(apps)])
    ),
    knownBests: data.seedPRs.map((p) => `${p.exercise}: ${p.weight}kg x ${p.reps}`),
  };
}

// The deterministic plan — same shape as the AI plan so the UI is agnostic.
export function buildLocalPlan(data) {
  const sessions = loggedSessions(data.sessions);
  const { bySplit, byExercise } = exerciseHistory(data.sessions);
  const today = todayKey();
  const insights = [];

  // What to improve: stalled lifts.
  const stalled = Object.entries(byExercise)
    .filter(([, apps]) => trendFor(apps) === "stalled")
    .map(([name]) => name);
  if (stalled.length) {
    insights.push({
      area: "Stalled lifts",
      observation: `${stalled.join(", ")} ${stalled.length === 1 ? "hasn't" : "haven't"} improved in estimated 1RM for 3+ sessions.`,
      recommendation: "Hold the weight and add reps, or take a small deload and rebuild — grinding the same numbers isn't adding stimulus.",
    });
  }

  // What to improve: splits you've been skipping.
  const neglected = Object.entries(bySplit)
    .filter(([, s]) => daysBetween(s.date, today) >= 10)
    .map(([split, s]) => `${split} (${daysBetween(s.date, today)} days ago)`);
  if (neglected.length) {
    insights.push({
      area: "Neglected muscle groups",
      observation: `Not trained recently: ${neglected.join(", ")}.`,
      recommendation: "Slot these back in before adding extra volume to the groups you already train often.",
    });
  }

  // What to improve: weekly consistency.
  const lastTwoWeeks = sessions.filter((s) => daysBetween(s.date, today) <= 14).length;
  if (lastTwoWeeks / 2 < 3) {
    insights.push({
      area: "Consistency",
      observation: `Averaging ${(lastTwoWeeks / 2).toFixed(1)} sessions/week over the last two weeks.`,
      recommendation: "Aim for at least 3 sessions a week — frequency beats perfect programming.",
    });
  }

  // What to improve: rep ranges outside the hypertrophy sweet spot.
  const lowRep = Object.entries(byExercise)
    .filter(([, apps]) => apps[apps.length - 1].avgReps < 5 && !isBodyweight(apps))
    .map(([name]) => name);
  if (lowRep.length) {
    insights.push({
      area: "Rep ranges",
      observation: `${lowRep.join(", ")} averaging under 5 reps per set.`,
      recommendation: "Fine for strength peaking, but spend most sets in the 6–12 range if the goal is muscle.",
    });
  }

  // Volume trend week-over-week.
  const vol = (from, to) =>
    sessions
      .filter((s) => daysBetween(s.date, today) >= from && daysBetween(s.date, today) < to)
      .reduce((n, s) => n + s.exercises.reduce((m, ex) => m + ex.sets.reduce((v, set) => v + set.weight * set.reps, 0), 0), 0);
  const thisWeek = vol(0, 7);
  const lastWeek = vol(7, 14);
  if (lastWeek > 0 && thisWeek < lastWeek * 0.7) {
    insights.push({
      area: "Training volume",
      observation: `This week's volume (${Math.round(thisWeek).toLocaleString()}kg) is well below last week's (${Math.round(lastWeek).toLocaleString()}kg).`,
      recommendation: "If it isn't a planned deload, get the missing sessions back in.",
    });
  }

  if (!insights.length) {
    insights.push({
      area: "Keep going",
      observation: "Training is consistent and your lifts are trending up.",
      recommendation: "Keep adding small amounts of weight or reps each session — the plan below does that for you.",
    });
  }

  // Targets: for each split trained in the last 3 weeks, project the next
  // session from its most recent one.
  const targets = Object.entries(bySplit)
    .filter(([, s]) => daysBetween(s.date, today) <= 21)
    .sort(([, a], [, b]) => (a.date < b.date ? -1 : 1))
    .map(([split, session]) => ({
      split,
      exercises: session.exercises
        .filter((ex) => ex.sets.length && byExercise[ex.name])
        .map((ex) => targetForExercise(ex.name, byExercise[ex.name])),
    }))
    .filter((t) => t.exercises.length);

  const progressing = Object.values(byExercise).filter((apps) => trendFor(apps) === "progressing").length;
  return {
    weeklyFocus: stalled.length
      ? `Break the stall on ${stalled[0]} — everything else keeps its normal progression.`
      : `${progressing} lift${progressing === 1 ? " is" : "s are"} trending up. Chase the small weekly increments below.`,
    insights,
    targets,
  };
}

// Convenience for the Log view: look up the coach's target for one exercise
// of one split from a stored plan.
export function targetFromPlan(plan, split, exerciseName) {
  if (!plan) return null;
  const group = plan.targets.find((t) => t.split === split);
  return group?.exercises.find((e) => e.name === exerciseName) || null;
}
