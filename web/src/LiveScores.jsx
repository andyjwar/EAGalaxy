import { useMemo } from 'react';
import { TeamAvatar } from './TeamAvatar';
import { useLiveScores } from './useLiveScores';

function KitThumb({ shirtUrl, badgeUrl, teamShort }) {
  const src = shirtUrl || badgeUrl;
  if (!src) {
    return (
      <span className="live-kit-fallback" title={teamShort}>
        {teamShort?.slice(0, 3) ?? '?'}
      </span>
    );
  }
  return (
    <img
      className="live-kit-img"
      src={src}
      alt=""
      loading="lazy"
      onError={(e) => {
        const img = e.currentTarget;
        if (shirtUrl && badgeUrl && img.src.includes(String(shirtUrl))) {
          img.src = badgeUrl;
        }
      }}
    />
  );
}

function PicksTable({ rows }) {
  if (!rows.length) return <p className="muted muted--tight">No picks</p>;
  return (
    <div className="table-scroll">
      <table className="live-picks-table">
        <thead>
          <tr>
            <th className="live-picks-col-player">Player</th>
            <th className="live-picks-col-pos">Pos</th>
            <th className="live-picks-col-num" title="Minutes">
              Mins
            </th>
            <th className="live-picks-col-num">Pts</th>
            <th className="live-picks-col-num" title="Bonus points system">
              BPS
            </th>
            <th className="live-picks-col-num" title="Bonus points (often provisional until final)">
              Bonus
            </th>
            <th className="live-picks-col-flag" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.element}>
              <td>
                <div className="live-player-cell">
                  <KitThumb
                    shirtUrl={r.shirtUrl}
                    badgeUrl={r.badgeUrl}
                    teamShort={r.teamShort}
                  />
                  <div>
                    <div className="live-player-name">{r.web_name}</div>
                    <div className="muted live-player-club">{r.teamShort}</div>
                  </div>
                </div>
              </td>
              <td className="tabular">{r.posSingular}</td>
              <td className="tabular">{r.minutes}</td>
              <td className="tabular">
                <strong>{r.total_points * r.multiplier}</strong>
                {r.multiplier > 1 ? (
                  <span className="muted"> ({r.total_points}×{r.multiplier})</span>
                ) : null}
              </td>
              <td className="tabular">{r.bps}</td>
              <td className="tabular">{r.bonus}</td>
              <td className="live-picks-flags">
                {r.is_captain ? (
                  <span className="live-cap" title="Captain">
                    C
                  </span>
                ) : null}
                {r.is_vice_captain ? (
                  <span className="live-vc muted" title="Vice-captain">
                    V
                  </span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * @param {{ teams: Array<{ id: number, teamName: string, fplEntryId: number | null }>, gameweek: number, onGameweekChange: (n: number) => void, teamLogoMap: object }}
 */
function proxyHostLabel() {
  const raw = import.meta.env.VITE_FPL_PROXY_URL;
  if (raw == null || String(raw).trim() === '') return null;
  try {
    return new URL(String(raw).trim()).host;
  } catch {
    return null;
  }
}

export function LiveScores({ teams, gameweek, onGameweekChange, teamLogoMap }) {
  const { loading, error, refresh, lastUpdated, events, eventSnapshot, squads } =
    useLiveScores({
      teams,
      gameweek,
      enabled: true,
    });

  const proxyHost = proxyHostLabel();

  const allMissingFplId =
    teams?.length > 0 && teams.every((t) => t.fplEntryId == null);

  const gwOptions = useMemo(() => {
    return (events || [])
      .filter((e) => e && e.id >= 1 && e.id <= 38)
      .map((e) => ({
        id: e.id,
        label: e.name || `GW ${e.id}`,
        finished: e.finished,
        is_current: e.is_current,
        is_next: e.is_next,
      }));
  }, [events]);

  const metaLine = eventSnapshot
    ? [
        eventSnapshot.finished ? 'Finished' : 'In progress / upcoming',
        eventSnapshot.is_current ? '· FPL current GW' : '',
        eventSnapshot.is_next ? '· FPL next GW' : '',
      ]
        .filter(Boolean)
        .join(' ')
    : '';

  return (
    <div className="dashboard-stack live-scores-root">
      <section className="tile tile--compact" aria-labelledby="live-heading">
        <h2 id="live-heading" className="tile-title tile-title--sm">
          Live scores
        </h2>
        <p className="tile-hint muted tile-hint--tight">
          Pulled on each visit / refresh — starting XI vs bench (positions 1–11 vs 12–15), minutes,
          points, BPS and bonus (bonus can stay provisional until the round is final).
        </p>

        {proxyHost ? (
          <p className="muted muted--tight live-proxy-ok" role="status">
            <strong>Proxy active in this build:</strong> <code>{proxyHost}</code> (requests go here,
            not straight to FPL — avoids CORS on static hosting).
          </p>
        ) : (
          <div className="data-banner data-banner--error" role="alert">
            <strong>No proxy in this JavaScript build.</strong> <code>VITE_FPL_PROXY_URL</code> was
            empty when the site was built, so the browser calls FPL directly and usually gets{' '}
            <em>Failed to fetch</em> on GitHub Pages. Fix: add the secret, then{' '}
            <strong>re-run the deploy workflow</strong> (push a commit or Actions → Run workflow).
            Check <code>deploy-check.json</code> on the site — <code>liveProxyConfigured</code> should
            be <code>true</code>.
          </div>
        )}

        {allMissingFplId ? (
          <div className="data-banner" role="status">
            <strong>No FPL entry ids</strong> — sample/demo <code>details.json</code> omits{' '}
            <code>entry_id</code> on each team. Ingest your real draft league so each manager has an{' '}
            <code>entry_id</code> (the number from the FPL game URL).
          </div>
        ) : null}

        <div className="live-toolbar">
          <label className="live-gw-label">
            <span className="muted">Gameweek</span>
            <select
              className="live-gw-select"
              value={gameweek}
              onChange={(e) => onGameweekChange(Number(e.target.value))}
            >
              {gwOptions.length ? (
                gwOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                    {o.finished ? ' ✓' : ''}
                    {o.is_current ? ' (current)' : ''}
                  </option>
                ))
              ) : (
                <option value={gameweek}>GW {gameweek}</option>
              )}
            </select>
          </label>
          <button
            type="button"
            className="live-refresh-btn"
            onClick={() => void refresh()}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh from FPL'}
          </button>
        </div>

        {metaLine ? <p className="muted live-meta">{metaLine}</p> : null}
        {lastUpdated ? (
          <p className="muted muted--tight live-updated">
            Last fetch: {new Date(lastUpdated).toLocaleString()}
          </p>
        ) : null}

        {error ? (
          <div className="data-banner data-banner--error" role="alert">
            <strong>Could not load live data.</strong> {error}{' '}
            <span className="muted">
              On GitHub Pages, set <code>VITE_FPL_PROXY_URL</code> to your Worker (see{' '}
              <code>web/workers/fpl-proxy/README.md</code>) and redeploy.
            </span>
          </div>
        ) : null}
      </section>

      {squads.map((squad) => (
        <section
          key={squad.leagueEntryId}
          className="tile tile--compact live-squad-tile"
          aria-labelledby={`live-squad-${squad.leagueEntryId}`}
        >
          <div className="live-squad-head">
            <h3 id={`live-squad-${squad.leagueEntryId}`} className="live-squad-title">
              <TeamAvatar
                entryId={squad.leagueEntryId}
                name={squad.teamName}
                size="sm"
                logoMap={teamLogoMap}
              />
              <span>{squad.teamName}</span>
            </h3>
            <div className="live-squad-meta tabular">
              {squad.gwPoints != null ? (
                <span className="live-squad-pts">
                  <strong>{squad.gwPoints}</strong> GW pts
                </span>
              ) : null}
              {squad.pointsOnBench != null ? (
                <span className="muted">Bench: {squad.pointsOnBench} pts</span>
              ) : null}
            </div>
          </div>

          {squad.error ? (
            <p className="muted">{squad.error}</p>
          ) : (
            <>
              {squad.autoSubs?.length ? (
                <div className="live-auto-subs muted" role="status">
                  <strong>Auto subs:</strong>{' '}
                  {squad.autoSubs.map((a) => {
                    const all = [...squad.starters, ...squad.bench];
                    const nameIn =
                      all.find((r) => r.element === a.element_in)?.web_name ??
                      `#${a.element_in}`;
                    const nameOut =
                      all.find((r) => r.element === a.element_out)?.web_name ??
                      `#${a.element_out}`;
                    return (
                      <span key={`${a.element_in}-${a.element_out}`} className="live-auto-sub-pair">
                        {nameIn} ↔ {nameOut}
                      </span>
                    );
                  })}
                </div>
              ) : null}
              <h4 className="live-lineup-heading">Starting XI</h4>
              <PicksTable rows={squad.starters} />
              <h4 className="live-lineup-heading live-lineup-heading--bench">Bench</h4>
              <PicksTable rows={squad.bench} />
            </>
          )}
        </section>
      ))}
    </div>
  );
}
