import { useState, useEffect } from 'react';

const DATA_BASE = `${import.meta.env.BASE_URL}data`;

async function fetchJSON(path) {
  const res = await fetch(`${DATA_BASE}/${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

export function useLeagueData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const details = await fetchJSON('details.json');
        setData(processLeagueData(details));
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { data, error, loading };
}

function processLeagueData(details) {
  const teams = Object.fromEntries(
    details.league_entries.map((e) => [e.id, { ...e }])
  );

  const standings = (details.standings || []).map((s) => ({
    ...s,
    teamName: teams[s.league_entry]?.entry_name ?? 'Unknown',
    manager: `${teams[s.league_entry]?.player_first_name ?? ''} ${teams[s.league_entry]?.player_last_name ?? ''}`.trim(),
  }));

  // Form table: last 10 gameweeks
  const LAST_N = 10;
  const finished = (details.matches || []).filter((m) => m.finished);
  const maxGw = finished.length ? Math.max(...finished.map((m) => m.event)) : 0;
  const formGws = Array.from({ length: LAST_N }, (_, i) => maxGw - LAST_N + 1 + i);
  const formMatches = finished.filter((m) => formGws.includes(m.event));

  const form = Object.fromEntries(
    details.league_entries.map((e) => [e.id, { W: 0, D: 0, L: 0 }])
  );

  for (const m of formMatches) {
    const p1 = m.league_entry_1_points;
    const p2 = m.league_entry_2_points;
    const e1 = m.league_entry_1;
    const e2 = m.league_entry_2;
    if (p1 > p2) {
      form[e1].W += 1;
      form[e2].L += 1;
    } else if (p1 < p2) {
      form[e1].L += 1;
      form[e2].W += 1;
    } else {
      form[e1].D += 1;
      form[e2].D += 1;
    }
  }

  const formTable = details.league_entries
    .map((e) => {
      const { W, D, L } = form[e.id];
      return {
        teamName: e.entry_name,
        id: e.id,
        W,
        D,
        L,
        pts: 3 * W + D,
      };
    })
    .sort((a, b) => b.pts - a.pts || b.W - a.W);

  return {
    league: details.league,
    standings,
    formTable,
    formGwRange: formGws.length ? `${formGws[0]}-${formGws[formGws.length - 1]}` : null,
  };
}
