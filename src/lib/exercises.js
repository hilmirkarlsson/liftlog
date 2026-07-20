// The exercise database: every default exercise with its category (for the
// grouped picker) and muscle mapping (for the activation heatmap and chips).
// [name, category, primary muscles, secondary muscles]
const DB = [
  // Chest
  ["Bench Press", "Chest", ["chest"], ["triceps", "shoulders"]],
  ["Incline Barbell Press", "Chest", ["chest"], ["shoulders", "triceps"]],
  ["Incline Dumbbell Press", "Chest", ["chest"], ["shoulders", "triceps"]],
  ["Flat Dumbbell Press", "Chest", ["chest"], ["triceps", "shoulders"]],
  ["Decline Bench Press", "Chest", ["chest"], ["triceps"]],
  ["Machine Chest Press", "Chest", ["chest"], ["triceps", "shoulders"]],
  ["Cable Fly", "Chest", ["chest"], ["shoulders"]],
  ["Dumbbell Fly", "Chest", ["chest"], []],
  ["Pec Deck", "Chest", ["chest"], []],
  ["Push-up", "Chest", ["chest"], ["triceps", "shoulders", "abs"]],
  ["Dips", "Chest", ["triceps"], ["chest", "shoulders"]],

  // Shoulders
  ["Overhead Press", "Shoulders", ["shoulders"], ["triceps"]],
  ["Seated Dumbbell Press", "Shoulders", ["shoulders"], ["triceps"]],
  ["Arnold Press", "Shoulders", ["shoulders"], ["triceps"]],
  ["Machine Shoulder Press", "Shoulders", ["shoulders"], ["triceps"]],
  ["Lateral Raise", "Shoulders", ["shoulders"], []],
  ["Cable Lateral Raise", "Shoulders", ["shoulders"], []],
  ["Front Raise", "Shoulders", ["shoulders"], []],
  ["Rear Delt Fly", "Shoulders", ["shoulders"], ["traps"]],
  ["Face Pull", "Shoulders", ["shoulders"], ["traps"]],
  ["Upright Row", "Shoulders", ["shoulders"], ["traps", "biceps"]],

  // Back
  ["Deadlift", "Back", ["lowerback", "hamstrings"], ["glutes", "traps", "forearms"]],
  ["Rack Pull", "Back", ["lowerback", "traps"], ["glutes", "forearms"]],
  ["Barbell Row", "Back", ["lats"], ["biceps", "traps", "lowerback"]],
  ["Pendlay Row", "Back", ["lats"], ["traps", "biceps"]],
  ["Dumbbell Row", "Back", ["lats"], ["biceps", "traps"]],
  ["Chest Supported Row", "Back", ["lats"], ["traps", "biceps"]],
  ["T-Bar Row", "Back", ["lats"], ["traps", "biceps"]],
  ["Seated Cable Row", "Back", ["lats"], ["biceps", "traps"]],
  ["Pull-up", "Back", ["lats"], ["biceps", "forearms"]],
  ["Chin-up", "Back", ["lats"], ["biceps"]],
  ["Lat Pulldown", "Back", ["lats"], ["biceps"]],
  ["Close Grip Pulldown", "Back", ["lats"], ["biceps"]],
  ["Straight Arm Pulldown", "Back", ["lats"], ["triceps"]],
  ["Barbell Shrug", "Back", ["traps"], ["forearms"]],
  ["Dumbbell Shrug", "Back", ["traps"], ["forearms"]],
  ["Back Extension", "Back", ["lowerback"], ["glutes", "hamstrings"]],
  ["Good Morning", "Back", ["lowerback", "hamstrings"], ["glutes"]],

  // Biceps
  ["Barbell Curl", "Biceps", ["biceps"], ["forearms"]],
  ["EZ Bar Curl", "Biceps", ["biceps"], ["forearms"]],
  ["Dumbbell Curl", "Biceps", ["biceps"], ["forearms"]],
  ["Hammer Curl", "Biceps", ["biceps"], ["forearms"]],
  ["Incline Dumbbell Curl", "Biceps", ["biceps"], []],
  ["Preacher Curl", "Biceps", ["biceps"], []],
  ["Cable Curl", "Biceps", ["biceps"], ["forearms"]],
  ["Concentration Curl", "Biceps", ["biceps"], []],
  ["Spider Curl", "Biceps", ["biceps"], []],

  // Triceps
  ["Skull Crusher", "Triceps", ["triceps"], []],
  ["Close Grip Bench Press", "Triceps", ["triceps"], ["chest", "shoulders"]],
  ["Cable Tricep Pushdown", "Triceps", ["triceps"], []],
  ["Rope Pushdown", "Triceps", ["triceps"], []],
  ["Overhead Tricep Extension", "Triceps", ["triceps"], []],
  ["Dumbbell Kickback", "Triceps", ["triceps"], []],
  ["Machine Dip", "Triceps", ["triceps"], ["chest"]],

  // Forearms
  ["Wrist Curl", "Forearms", ["forearms"], []],
  ["Reverse Wrist Curl", "Forearms", ["forearms"], []],
  ["Reverse Curl", "Forearms", ["forearms"], ["biceps"]],
  ["Farmer's Carry", "Forearms", ["forearms"], ["traps", "abs"]],
  ["Dead Hang", "Forearms", ["forearms"], ["lats"]],

  // Legs
  ["Squat", "Legs", ["quads"], ["glutes", "lowerback"]],
  ["Front Squat", "Legs", ["quads"], ["glutes", "abs"]],
  ["Hack Squat", "Legs", ["quads"], ["glutes"]],
  ["Leg Press", "Legs", ["quads"], ["glutes"]],
  ["Bulgarian Split Squat", "Legs", ["quads"], ["glutes", "hamstrings"]],
  ["Walking Lunge", "Legs", ["quads"], ["glutes", "hamstrings"]],
  ["Leg Extension", "Legs", ["quads"], []],
  ["Romanian Deadlift", "Legs", ["hamstrings"], ["glutes", "lowerback"]],
  ["Stiff Leg Deadlift", "Legs", ["hamstrings"], ["glutes", "lowerback"]],
  ["Leg Curl", "Legs", ["hamstrings"], []],
  ["Seated Leg Curl", "Legs", ["hamstrings"], []],
  ["Hip Thrust", "Legs", ["glutes"], ["hamstrings"]],
  ["Glute Bridge", "Legs", ["glutes"], ["hamstrings"]],
  ["Cable Glute Kickback", "Legs", ["glutes"], []],
  ["Hip Abduction", "Legs", ["glutes"], []],
  ["Hip Adduction", "Legs", ["quads"], []],
  ["Calf Raise", "Legs", ["calves"], []],
  ["Seated Calf Raise", "Legs", ["calves"], []],

  // Abs
  ["Plank", "Abs", ["abs"], ["obliques"]],
  ["Side Plank", "Abs", ["obliques"], ["abs"]],
  ["Crunch", "Abs", ["abs"], []],
  ["Cable Crunch", "Abs", ["abs"], []],
  ["Sit-up", "Abs", ["abs"], []],
  ["Decline Sit-up", "Abs", ["abs"], []],
  ["Hanging Leg Raise", "Abs", ["abs"], ["obliques", "forearms"]],
  ["Lying Leg Raise", "Abs", ["abs"], []],
  ["Russian Twist", "Abs", ["obliques"], ["abs"]],
  ["Ab Wheel Rollout", "Abs", ["abs"], ["obliques", "lats"]],
  ["Cable Woodchopper", "Abs", ["obliques"], ["abs"]],
];

export const EXERCISES = DB.map(([name, category, primary, secondary]) => ({ name, category, primary, secondary }));

export const CATEGORIES = ["Chest", "Shoulders", "Back", "Biceps", "Triceps", "Forearms", "Legs", "Abs"];

export const EXERCISE_MUSCLES = Object.fromEntries(
  EXERCISES.map((e) => [e.name, { primary: e.primary, secondary: e.secondary }])
);

const CATEGORY_BY_NAME = Object.fromEntries(EXERCISES.map((e) => [e.name, e.category]));

export function exerciseCategory(name) {
  return CATEGORY_BY_NAME[name] || "Custom";
}
