const KEY = 'liftlog-data';

// Seeded so the app isn't blank on first install — these are Hilmir's
// actual known bests going in, not placeholder demo data.
const SEED_PRS = [
  { exercise: 'Bench Press', weight: 110, reps: 1, date: '2026-01-01', seeded: true },
  { exercise: 'Deadlift', weight: 190, reps: 1, date: '2026-01-01', seeded: true },
  { exercise: 'Squat', weight: 160, reps: 1, date: '2026-01-01', seeded: true },
];

const DEFAULT_EXERCISES = [
  'Bench Press', 'Incline Dumbbell Press', 'Overhead Press', 'Dips',
  'Deadlift', 'Barbell Row', 'Pull-up', 'Lat Pulldown', 'Face Pull',
  'Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Curl', 'Calf Raise',
  'Barbell Curl', 'Hammer Curl', 'Skull Crusher', 'Cable Tricep Pushdown',
  'Plank', 'Hanging Leg Raise', 'Cable Crunch',
].map((name) => ({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name }));

function defaultData() {
  return {
    profile: {
      splits: ['Back', 'Chest & Shoulders', 'Arms & Abs', 'Legs'],
    },
    exercises: DEFAULT_EXERCISES,
    sessions: [],
    seedPRs: SEED_PRS,
    settings: {
      apiBase: '',
    },
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    // fill in any keys added by later versions
    return { ...defaultData(), ...parsed };
  } catch {
    return defaultData();
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}
