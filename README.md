[![competition](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/hqnsyhrn/gta6-trophy-guide-01-v4/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/hqnsyhrn/gta6-trophy-guide-01-v4/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Platinum Log — GTA VI Trophy Guide & Tracker

The best offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI: every trophy with its official name, description and grade, a guide in our own words that cites its sources on every step, a 5-stage roadmap to the platinum, missable flags built from the official descriptions, and a tracker that saves progress in the browser.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. The app is static files under `app/` and works with the network off — it fetches nothing at run time except its own files.

## What is inside

- **Tracker** — all 55 trophies (1 Platinum, 2 Gold, 6 Silver, 46 Bronze; 28 PSN-hidden) with checklist saved in localStorage, Export/Import JSON, share-link hash (`#earned=…`), filters (story, missable, collectibles, activities, online, PSN-hidden, disputed, not earned), grade filter, search and sort, spoiler shield (ON by default), progress per grade, collectible counters with steppers, and a missable-first Next Up panel.
- **Roadmap** — 5 stages (8/21/20/4/2 trophies) with every meta claim and every step cited, plus a Missable Watch rail (1 possibly missable + 8 at risk, each with its last chance and citations).
- **Missables** — Trophy × Chapter grid with the last-chance cell per trophy, watch notes with citations, and story gates per chapter (mission names + trophy chips).
- **Sources** — 35 real sources from 21 sites, each read 20 Nov 2026 and cited by at least one real guide step, plus a Trophy × Source matrix.
- **Honesty** — 29 disputes shown both ways (A vs B + "Our call"), only 3 unconfirmed trophies, and an audit strip computed from the data itself (steps cited, backed by 2+ sources, source and site counts).
- **Corrections vs earlier drafts** — Master of None lists the true nine activities (fishing, hunting, golf, shooting range, pool, basketball, arcade game, winning a race, stunt); bowling and darts are not on the list. The Shootist names both ranges (Griffin, northwestern Vice City; Rodgers Ranch, northeast of Port Gellhorn), 18 + 24 golds, and the $5 Waiver Pass.

## Screenshots

The four screenshots in `screenshots/` are real renders of the app taken with headless Chromium at 1280×900. They are taken with the spoiler shield forced OFF for the shot only, via `?shot=1…4` (the app itself still defaults to shield ON). In shot mode with no saved progress, a small demo progress set is shown so the progress meter is visible; the default app state is untouched.

## Files

- `main.ts` — entrypoint: copies `app/` and `screenshots/` to `/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `dossier.json` with the kit's `buildDossier`.
- `app/index.html`, `app/style.css`, `app/app.js` — the app.
- `app/data/trophies.json` — the 55 trophies with cited guides, disputes and counters.
- `app/data/sources.json` — the 35 sources.
- `app/data/roadmap.json` — roadmap stages, meta claims, missable watch and story gates.
- `screenshots/` — 1-cover (Tracker), 2-roadmap, 3-missables, 4-sources.

---

<sub>Entered on [make.fun](https://make.fun/?ref=gta6-trophy-guide-01&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
