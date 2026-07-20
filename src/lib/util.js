export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function todayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export function addDays(dateKeyStr, n) {
  const [y, m, d] = dateKeyStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
}

export function daysBetween(a, b) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((new Date(by, bm - 1, bd) - new Date(ay, am - 1, ad)) / 86400000);
}

export function formatDisplayDate(dateKeyStr) {
  const [y, m, d] = dateKeyStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const isToday = dateKeyStr === todayKey();
  const isYesterday = dateKeyStr === addDays(todayKey(), -1);
  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

// Estimated 1-rep max (Epley) — used to compare sets of different rep ranges
// on a level footing when deciding if a set is a new PR.
export function estimated1RM(weight, reps) {
  if (!weight || !reps) return 0;
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

export function roundToPlate(weight) {
  return Math.round(weight / 2.5) * 2.5;
}
