import { useState, useEffect, useCallback } from 'react';

/** Direct FPL API (often blocked by CORS from static hosts). */
const FPL_DIRECT = 'https://fantasy.premierleague.com/api';

/**
 * Build-time `VITE_FPL_PROXY_URL` = Cloudflare Worker origin, no trailing slash.
 * Example: https://tclot-fpl-proxy.yourname.workers.dev
 */
function fplApiBase() {
  const raw = import.meta.env.VITE_FPL_PROXY_URL;
  if (raw != null && String(raw).trim() !== '') {
    return String(raw).replace(/\/$/, '');
  }
  return FPL_DIRECT;
}

function shirtUrl(teamId) {
  if (teamId == null) return null;
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamId}-1.png`;
}

function badgeUrl(teamCode) {
  if (teamCode == null) return null;
  return `https://resources.premierleague.com/premierleague/badges/50/t${teamCode}.png`;
}

function mapPickRows(picks, liveByElementId, elementById, teamById, typeById) {
  return (picks || []).map((p) => {
    const el = elementById[p.element];
    const tm = el ? teamById[el.team] : null;
    const typ = el ? typeById[el.element_type] : null;
    const st = liveByElementId[p.element] || {};
    const mins = st.minutes ?? 0;
    const pts = st.total_points ?? 0;
    const bps = st.bps ?? 0;
    const bonus = st.bonus ?? 0;
    return {
      element: p.element,
      web_name: el?.web_name ?? `Player #${p.element}`,
      teamShort: tm?.short_name ?? '—',
      posSingular: typ?.singular_name_short ?? '—',
      shirtUrl: shirtUrl(el?.team),
      badgeUrl: badgeUrl(tm?.code),
      minutes: mins,
      total_points: pts,
      bps,
      bonus,
      multiplier: p.multiplier ?? 1,
      is_captain: !!p.is_captain,
      is_vice_captain: !!p.is_vice_captain,
      pickPosition: p.position,
    };
  });
}

/**
 * Live GW data from official FPL APIs (browser fetch).
 * @param {{ teams: Array<{ id: number, teamName: string, fplEntryId: number | null }>, gameweek: number | null, enabled: boolean }} opts
 */
export function useLiveScores({ teams, gameweek, enabled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventSnapshot, setEventSnapshot] = useState(null);
  const [squads, setSquads] = useState([]);

  const load = useCallback(async () => {
    if (!enabled || gameweek == null || !teams?.length) return;

    setLoading(true);
    setError(null);

    try {
      const api = fplApiBase();
      const bootRes = await fetch(`${api}/bootstrap-static/`);
      if (!bootRes.ok) {
        throw new Error(`bootstrap-static HTTP ${bootRes.status}`);
      }
      const boot = await bootRes.json();
      const evs = boot.events || [];
      setEvents(evs);
      const ev = evs.find((e) => e.id === gameweek);
      setEventSnapshot(ev ?? { id: gameweek, name: `Gameweek ${gameweek}` });

      const elementById = Object.fromEntries(
        (boot.elements || []).map((e) => [e.id, e])
      );
      const teamById = Object.fromEntries(
        (boot.teams || []).map((t) => [t.id, t])
      );
      const typeById = Object.fromEntries(
        (boot.element_types || []).map((t) => [t.id, t])
      );

      const liveRes = await fetch(`${api}/event/${gameweek}/live/`);
      if (!liveRes.ok) {
        throw new Error(`event/live HTTP ${liveRes.status}`);
      }
      const liveJson = await liveRes.json();
      const liveByElementId = Object.fromEntries(
        (liveJson.elements || []).map((row) => [row.id, row.stats || {}])
      );

      const squadList = await Promise.all(
        teams.map(async (t) => {
          if (t.fplEntryId == null) {
            return {
              leagueEntryId: t.id,
              teamName: t.teamName,
              fplEntryId: null,
              error:
                'Missing FPL entry id in league data (need real details.json with entry_id).',
              starters: [],
              bench: [],
              gwPoints: null,
              autoSubs: [],
            };
          }

          const url = `${api}/entry/${t.fplEntryId}/event/${gameweek}/picks/`;
          const pr = await fetch(url);
          if (!pr.ok) {
            return {
              leagueEntryId: t.id,
              teamName: t.teamName,
              fplEntryId: t.fplEntryId,
              error: `Picks HTTP ${pr.status}`,
              starters: [],
              bench: [],
              gwPoints: null,
              autoSubs: [],
            };
          }
          const picksPayload = await pr.json();
          const picks = picksPayload.picks || [];
          const rows = mapPickRows(
            picks,
            liveByElementId,
            elementById,
            teamById,
            typeById
          );
          const starters = rows.filter((r) => r.pickPosition <= 11);
          const bench = rows.filter((r) => r.pickPosition > 11);

          return {
            leagueEntryId: t.id,
            teamName: t.teamName,
            fplEntryId: t.fplEntryId,
            error: null,
            starters,
            bench,
            gwPoints: picksPayload.entry_history?.points ?? null,
            pointsOnBench: picksPayload.entry_history?.points_on_bench ?? null,
            autoSubs: picksPayload.automatic_subs || [],
          };
        })
      );

      setSquads(squadList);
      setLastUpdated(new Date().toISOString());
    } catch (e) {
      setError(e?.message || String(e));
      setSquads([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, gameweek, teams]);

  useEffect(() => {
    if (enabled && gameweek != null) {
      void load();
    }
  }, [enabled, gameweek, load]);

  return {
    loading,
    error,
    refresh: load,
    lastUpdated,
    events,
    eventSnapshot,
    squads,
  };
}
