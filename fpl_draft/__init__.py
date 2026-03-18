"""FPL Draft data utilities for loading and analyzing ingested league data."""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"


def load_json(name: str) -> dict:
    """Load a JSON file from the data directory."""
    path = DATA_DIR / f"{name}.json"
    if not path.exists():
        raise FileNotFoundError(f"Run ingest.py first to fetch data. Missing: {path}")
    with open(path) as f:
        return json.load(f)


def get_standings(data_dir: Path = None) -> list[dict]:
    """Get league standings from ingested details."""
    data_dir = data_dir or DATA_DIR
    with open(data_dir / "details.json") as f:
        details = json.load(f)
    return details.get("standings", [])


def get_league_entries(data_dir: Path = None) -> list[dict]:
    """Get league entries (teams) from ingested details."""
    data_dir = data_dir or DATA_DIR
    with open(data_dir / "details.json") as f:
        details = json.load(f)
    return details.get("league_entries", [])


def get_matches(data_dir: Path = None) -> list[dict]:
    """Get H2H matches from ingested details."""
    data_dir = data_dir or DATA_DIR
    with open(data_dir / "details.json") as f:
        details = json.load(f)
    return details.get("matches", [])


def get_player_ownership(data_dir: Path = None) -> list[dict]:
    """Get which players are owned by which teams (element_status)."""
    data_dir = data_dir or DATA_DIR
    with open(data_dir / "element_status.json") as f:
        data = json.load(f)
    return data.get("element_status", [])


def get_transactions(data_dir: Path = None) -> list[dict]:
    """Get draft picks, waiver moves, and trades."""
    data_dir = data_dir or DATA_DIR
    with open(data_dir / "transactions.json") as f:
        data = json.load(f)
    return data.get("transactions", []) if isinstance(data, dict) else data
