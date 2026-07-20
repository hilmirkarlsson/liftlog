// Maps exercises to muscle groups and computes a recency-weighted activation
// heatmap (0..1 per group) from logged sessions — this drives the red
// highlights on the body figure in Stats.
import { daysBetween, todayKey } from "./util.js";

export const MUSCLE_LABELS = {
  shoulders: "Shoulders",
  chest: "Chest",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  abs: "Abs",
  obliques: "Obliques",
  traps: "Traps",
  lats: "Lats",
  lowerback: "Lower back",
  glutes: "Glutes",
  quads: "Quads",
  hamstrings: "Hamstrings",
  calves: "Calves",
};

// primary counts full, secondary counts half.
const EXERCISE_MUSCLES = {
  "Bench Press": { primary: ["chest"], secondary: ["triceps", "shoulders"] },
  "Incline Dumbbell Press": { primary: ["chest"], secondary: ["shoulders", "triceps"] },
  "Overhead Press": { primary: ["shoulders"], secondary: ["triceps"] },
  "Dips": { primary: ["triceps"], secondary: ["chest", "shoulders"] },
  "Deadlift": { primary: ["lowerback", "hamstrings"], secondary: ["glutes", "traps", "forearms"] },
  "Barbell Row": { primary: ["lats"], secondary: ["biceps", "traps"] },
  "Pull-up": { primary: ["lats"], secondary: ["biceps", "forearms"] },
  "Lat Pulldown": { primary: ["lats"], secondary: ["biceps"] },
  "Face Pull": { primary: ["shoulders"], secondary: ["traps"] },
  "Squat": { primary: ["quads"], secondary: ["glutes", "lowerback"] },
  "Leg Press": { primary: ["quads"], secondary: ["glutes"] },
  "Romanian Deadlift": { primary: ["hamstrings"], secondary: ["glutes", "lowerback"] },
  "Leg Curl": { primary: ["hamstrings"], secondary: [] },
  "Calf Raise": { primary: ["calves"], secondary: [] },
  "Barbell Curl": { primary: ["biceps"], secondary: ["forearms"] },
  "Hammer Curl": { primary: ["biceps"], secondary: ["forearms"] },
  "Skull Crusher": { primary: ["triceps"], secondary: [] },
  "Cable Tricep Pushdown": { primary: ["triceps"], secondary: [] },
  "Plank": { primary: ["abs"], secondary: ["obliques"] },
  "Hanging Leg Raise": { primary: ["abs"], secondary: ["obliques"] },
  "Cable Crunch": { primary: ["abs"], secondary: [] },
};

// Fallback for user-added exercises: infer from the session's split.
const SPLIT_MUSCLES = {
  Chest: { primary: ["chest"], secondary: ["shoulders", "triceps"] },
  Back: { primary: ["lats"], secondary: ["traps", "biceps", "lowerback"] },
  Shoulders: { primary: ["shoulders"], secondary: ["traps"] },
  Biceps: { primary: ["biceps"], secondary: ["forearms"] },
  Triseps: { primary: ["triceps"], secondary: [] },
  Abs: { primary: ["abs"], secondary: ["obliques"] },
  Forearms: { primary: ["forearms"], secondary: [] },
  Legs: { primary: ["quads"], secondary: ["hamstrings", "glutes", "calves"] },
};

export function musclesFor(exerciseName, split) {
  return EXERCISE_MUSCLES[exerciseName] || SPLIT_MUSCLES[split] || { primary: [], secondary: [] };
}

export function primaryMuscleLabels(exerciseName, split) {
  return musclesFor(exerciseName, split).primary.map((g) => MUSCLE_LABELS[g]);
}

// Heatmap over the last `days`: each set scores its muscles (1 primary,
// 0.5 secondary) scaled by how recent the session was, then everything is
// normalized to the hottest group.
export function muscleActivation(sessions, days = 7) {
  const today = todayKey();
  const raw = {};
  const stats = {};
  for (const g of Object.keys(MUSCLE_LABELS)) {
    raw[g] = 0;
    stats[g] = { sets: 0, lastTrained: null };
  }

  for (const session of sessions) {
    const ago = daysBetween(session.date, today);
    if (ago < 0 || ago > days) continue;
    const decay = 1 - ago / (days + 1);
    for (const ex of session.exercises) {
      if (!ex.sets.length) continue;
      const { primary, secondary } = musclesFor(ex.name, session.split);
      for (const g of primary) {
        raw[g] += ex.sets.length * decay;
        stats[g].sets += ex.sets.length;
        if (!stats[g].lastTrained || session.date > stats[g].lastTrained) stats[g].lastTrained = session.date;
      }
      for (const g of secondary) {
        raw[g] += ex.sets.length * decay * 0.5;
        if (!stats[g].lastTrained || session.date > stats[g].lastTrained) stats[g].lastTrained = session.date;
      }
    }
  }

  const max = Math.max(...Object.values(raw));
  const activation = {};
  for (const g of Object.keys(raw)) activation[g] = max > 0 ? raw[g] / max : 0;
  return { activation, stats };
}
