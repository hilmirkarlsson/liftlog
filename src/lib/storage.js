import { EXERCISES } from "./exercises.js";

const KEY = "liftlog-data";

// Seeded so the app isn't blank on first install — these are Hilmir's
// actual known bests going in, not placeholder demo data.
const SEED_PRS = [
  { exercise: "Bench Press", weight: 110, reps: 1, date: "2026-01-01", seeded: true },
  { exercise: "Deadlift", weight: 190, reps: 1, date: "2026-01-01", seeded: true },
  { exercise: "Squat", weight: 160, reps: 1, date: "2026-01-01", seeded: true },
];

const DEFAULT_EXERCISES = EXERCISES.map(({ name }) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name,
}));

const DEFAULT_SPLITS = ["Chest", "Back", "Shoulders", "Biceps", "Triseps", "Abs", "Forearms", "Legs", "Rest day"];

function defaultData() {
  return {
    profile: {
      splits: DEFAULT_SPLITS,
    },
    exercises: DEFAULT_EXERCISES,
    sessions: [],
    seedPRs: SEED_PRS,
    // Latest coach plan: { plan, source: "ai"|"local", generatedAt, dataHash }
    coach: null,
    settings: {
      apiBase: "",
      anthropicApiKey: "",
    },
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    // fill in any keys added by later versions
    const merged = {
      ...defaultData(),
      ...parsed,
      profile: { ...defaultData().profile, ...(parsed.profile || {}) },
      settings: { ...defaultData().settings, ...(parsed.settings || {}) },
    };
    const oldDefaults = ["Back", "Chest & Shoulders", "Arms & Abs", "Legs"];
    if (JSON.stringify(merged.profile.splits) === JSON.stringify(oldDefaults)) merged.profile.splits = DEFAULT_SPLITS;
    // Union stored exercises with the (growing) default database, keeping the
    // stored entry (and its id) when names collide and appending user-added
    // exercises at the end.
    const byName = new Map(DEFAULT_EXERCISES.map((e) => [e.name.toLowerCase(), e]));
    for (const e of parsed.exercises || []) {
      if (e?.name) byName.set(e.name.toLowerCase(), e);
    }
    merged.exercises = [...byName.values()];
    return merged;
  } catch {
    return defaultData();
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}
