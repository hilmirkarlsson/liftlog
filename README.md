# LiftLog

Local-first strength training logbook — PWA, no build step, no backend required to use it.

## What it does

- Log sessions by split (Back / Chest & Shoulders / Arms & Abs / Legs), each with exercises and sets (weight × reps)
- "Repeat last session" copies the exercise list from your last session of the same split
- Automatic PR detection using estimated 1RM (Epley formula), seeded with known bests (Bench 110kg, Deadlift 190kg, Squat 160kg)
- Progress tab: PR banner + per-exercise trend chart
- Fully offline — all data in localStorage

## Dashboard / Obsidian sync (optional)

Settings → paste your Dashboard API base URL (same one `Dashboard`'s `app.js` uses). Finished sessions
(tap "Finish & sync session") POST to `{API}/api/log-workout`, which the Dashboard backend fans out to:
- A JSON file in the workout Drive folder (so Dashboard can show it)
- A `## Workout` section appended to today's Obsidian daily note

If sync fails (offline, wrong URL, server down) the session stays queued locally and retries automatically —
logging a workout never depends on the network being up.
