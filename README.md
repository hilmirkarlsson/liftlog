# LiftLog

Local-first strength training logbook with an AI coach — rebuilt on the Personal OS app
template (Vite + React 19 + Tailwind 4, the shared light/blue Dashboard theme).

## What it does

- Log sessions by split (Chest / Back / Shoulders / … / Legs), each with exercises and sets (weight × reps)
- "Repeat last session" copies the exercise list from your last session of the same split
- Automatic PR detection using estimated 1RM (Epley formula), seeded with known bests (Bench 110kg, Deadlift 190kg, Squat 160kg)
- Progress tab: PR banner + per-exercise trend chart
- Fully offline — all data in localStorage (same `liftlog-data` key as v1, so existing data carries over)

## AI Coach

The Coach tab tracks every set and exercise you log. After **a week of tracking** (7 days,
3+ real sessions) it unlocks and:

- tells you **what to improve** — stalled lifts, skipped muscle groups, consistency, rep
  ranges, volume swings — grounded in your actual numbers
- **calculates targets for your next session** of each split, building on how you've been
  training (progressive overload: +2.5kg when you hit the top of a rep range, extra reps at
  the same weight otherwise, deload after a long stall)
- surfaces those targets in the Log tab: a "Start from coach plan" button on new sessions,
  a 🎯 target line on each exercise card, and pre-filled weight/reps when you add a set

Two engines, one plan shape:

- **On-device** (default): deterministic analysis, works fully offline.
- **Claude** (smart AI): paste your Anthropic API key in Settings and the same training
  summary is sent to Claude (`claude-opus-4-8`, structured JSON output) for a smarter plan.
  The key lives only in your browser's localStorage and is sent only to the Anthropic API.

The plan is cached with a hash of your training data, so the Coach tab flags when new sets
make it stale and worth regenerating.

## Development

```sh
npm install
npm run dev     # local dev server
npm run build   # production build in dist/
```

## Dashboard / Obsidian sync (optional)

Settings → paste your Dashboard API base URL (same one `Dashboard`'s `app.js` uses). Finished sessions
(tap "Finish & sync session") POST to `{API}/api/log-workout`, which the Dashboard backend fans out to:
- A JSON file in the workout Drive folder (so Dashboard can show it)
- A `## Workout` section appended to today's Obsidian daily note

If sync fails (offline, wrong URL, server down) the session stays queued locally and retries automatically —
logging a workout never depends on the network being up.
