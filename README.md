# FPL Draft League Data Ingestion

Fetch and store all data from your [Fantasy Premier League Draft](https://draft.premierleague.com) league for analysis, dashboards, or custom tools.

## Quick Start

### 1. Find your League ID

- Open your league in a browser: `https://draft.premierleague.com/league`
- Your league ID is in the URL: `draft.premierleague.com/league/**12345**`
- Or open DevTools → Network tab while loading the league page and look for requests to `.../league/XXXXX/details`

### 2. Install

```bash
cd TCLOT
pip install -r requirements.txt
```

### 3. Ingest data

```bash
python ingest.py 12345
```

Or use an environment variable:

```bash
export LEAGUE_ID=12345
python ingest.py
```

### 4. Export to CSV (optional)

```bash
python export_csv.py
```

Exports will be in the `exports/` folder.

## What gets fetched

| File | Description |
|------|-------------|
| `details.json` | League info, teams, standings, H2H matches |
| `element_status.json` | Which players are owned by which teams |
| `transactions.json` | Draft picks, waiver moves, trades |
| `bootstrap_draft.json` | Draft player pool and settings |
| `bootstrap_fpl.json` | Full FPL player/team data (names, stats) |
| `fixtures.json` | Premier League fixture list |

All data is saved under `data/`.

## Data structure

- **Standings**: Rank, total points, gameweek points
- **League entries**: Team names, manager names, waiver order
- **Element status**: Player ID → owner (entry_id)
- **Transactions**: Transfers, draft picks, trades with timestamps

Merge `element_status` with `bootstrap_fpl.elements` to get player names and stats. Use `league_entries` to map `entry_id` to team names.

## Example: Load in Python

```python
from pathlib import Path
import json

with open("data/details.json") as f:
    details = json.load(f)

standings = details["standings"]
teams = {e["id"]: e["entry_name"] for e in details["league_entries"]}

for s in standings:
    print(f"#{s['rank']} {teams[s['league_entry']]}: {s['total']} pts")
```

## Website

A simple web dashboard to view standings and form:

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173. The site reads from `data/` — re-run `ingest.py` to refresh, then restart the dev server (or run `npm run dev` which copies data automatically).

Build for production: `npm run build` (output in `web/dist/`).

## Notes

- No login required: league data is publicly accessible if you have the league ID.
- The FPL Draft API is unofficial; structure may change between seasons.
