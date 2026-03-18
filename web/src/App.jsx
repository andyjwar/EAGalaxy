import { useLeagueData } from './useLeagueData'
import './App.css'

function App() {
  const { data, error, loading } = useLeagueData()

  if (loading) {
    return (
      <div className="app">
        <header className="header">
          <h1>Loading…</h1>
        </header>
        <main className="main" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <header className="header">
          <h1>FPL Draft League</h1>
        </header>
        <main className="main">
          <div className="error-box">
            <p>{error}</p>
            <p className="hint">Run <code>python3 ingest.py &lt;LEAGUE_ID&gt;</code> then restart the dev server.</p>
          </div>
        </main>
      </div>
    )
  }

  const { league, standings, formTable, formGwRange } = data

  return (
    <div className="app">
      <header className="header">
        <h1>{league?.name ?? 'FPL Draft League'}</h1>
        <p className="subtitle">Head-to-head results & form</p>
      </header>

      <main className="main">
        <section className="card">
          <h2>Standings</h2>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Team</th>
                <th>Manager</th>
                <th className="num">Pts</th>
                <th className="num">W-D-L</th>
                <th className="num">For</th>
                <th className="num">Against</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => (
                <tr key={s.league_entry}>
                  <td>{s.rank}</td>
                  <td className="team">{s.teamName}</td>
                  <td className="muted">{s.manager}</td>
                  <td className="num"><strong>{s.total}</strong></td>
                  <td className="num">{s.matches_won}-{s.matches_drawn}-{s.matches_lost}</td>
                  <td className="num">{s.points_for?.toLocaleString()}</td>
                  <td className="num">{s.points_against?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h2>Form (last 10 gameweeks)</h2>
          {formGwRange && <p className="muted form-sub">GW {formGwRange}</p>}
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Team</th>
                <th className="num">W</th>
                <th className="num">D</th>
                <th className="num">L</th>
                <th className="num">Pts</th>
              </tr>
            </thead>
            <tbody>
              {formTable.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td className="team">{r.teamName}</td>
                  <td className="num">{r.W}</td>
                  <td className="num">{r.D}</td>
                  <td className="num">{r.L}</td>
                  <td className="num"><strong>{r.pts}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="footer">
          <p>Data from <a href="https://draft.premierleague.com" target="_blank" rel="noopener noreferrer">draft.premierleague.com</a>. Refresh by re-running <code>ingest.py</code>.</p>
        </footer>
      </main>
    </div>
  )
}

export default App
