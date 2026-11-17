# Hyrox Prep

A mobile-first training app for Hyrox: a periodised plan to race day, plus logs for workouts, lifts, food and bodyweight, and progress charts.
Static, no build step, no dependencies. Data is stored only in the browser (localStorage). Use **Settings → Export backup** regularly.

Run locally: `python3 -m http.server 8000` from the repo root, then open http://localhost:8000/hyrox/.
On Netlify it is served at `/hyrox/`. On a phone, use "Add to Home Screen" to install it like an app (works offline).

## The plan

Built from your race date, training days (3–6), long-day (Sat/Sun), 5K time and 1RMs. Phases are counted back from race week:

| Phase | When | Focus |
|---|---|---|
| Base | first ~45% | easy volume, station technique, strength 4×6 @ 70–75% |
| Build | rest until 5 weeks out | threshold runs, compromised running, half sims, strength 4×5 @ 77–82% |
| Peak | 4–2 weeks out | race-pace 1 km repeats, full stations, full simulation 3 weeks out, strength 3×3 @ 85% |
| Taper | last 2 weeks | volume down, intensity kept; race-week primer and shakeout |

Every 4th Base/Build week is a deload. A 5-day week is: Mon lower-body strength, Tue intervals, Wed station circuit,
Thu upper-body strength + wall balls/carries, Sat long run or simulation. 6 days adds a Friday easy run; 4 and 3 days use one full-body lift.
Run paces come from the 5K time (threshold ≈ 5K pace + 12 s/km, Hyrox race pace + 35 s/km, easy + 80 s/km); without one, sessions use RPE.

## Files

- `app.js`: plan generator (`buildSession`, `weekTemplate`, `getPlan`), views, forms, SVG charts
- `styles.css`: light/dark tokens and layout
- `sw.js`, `manifest.webmanifest`, `icon.svg`: offline + installable
