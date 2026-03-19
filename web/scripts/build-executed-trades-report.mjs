#!/usr/bin/env node
/**
 * Build a Markdown table of executed (processed) trades for a draft league.
 * Not used by the web app — run manually: node web/scripts/build-executed-trades-report.mjs
 *
 * Env: LEAGUE_ID (default 6802), OUT (default reports/executed-trades-<id>.md)
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '../..')
const leagueId = process.env.LEAGUE_ID || process.env.FPL_LEAGUE_ID || '6802'
const defaultOut = join(repoRoot, 'reports', `executed-trades-${leagueId}.md`)
const outPath = process.env.OUT || defaultOut

/** Draft API: processed / accepted trades use state "p". */
const EXECUTED_STATES = new Set(['p'])

function loadJSON(path) {
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

function fmtIso(s) {
  if (!s) return '—'
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? s : d.toISOString().slice(0, 19).replace('T', ' ')
}

async function main() {
  const detailsPath = join(repoRoot, 'web/public/league-data/details.json')
  const miniPath = join(repoRoot, 'web/public/league-data/fpl-mini.json')

  const details = loadJSON(detailsPath)
  const mini = loadJSON(miniPath)
  const elemById = Object.fromEntries(
    (mini?.elements || []).map((e) => [e.id, e])
  )
  const teamById = Object.fromEntries(
    (mini?.teams || []).map((t) => [t.id, t])
  )

  const entryName = new Map()
  for (const e of details?.league_entries || []) {
    if (e?.entry_id != null) entryName.set(e.entry_id, e.entry_name ?? `Entry ${e.entry_id}`)
  }

  const plLabel = (id) => {
    const el = elemById[id]
    if (!el) return `#${id}`
    const tm = teamById[el.team]
    const club = tm?.short_name ? ` (${tm.short_name})` : ''
    return `${el.web_name}${club}`
  }

  const url = `https://draft.premierleague.com/api/draft/league/${leagueId}/trades`
  const res = await fetch(url)
  if (!res.ok) {
    console.error(`Fetch failed ${res.status}: ${url}`)
    process.exit(1)
  }
  const payload = await res.json()
  const all = payload.trades || []
  const executed = all.filter((t) => EXECUTED_STATES.has(t.state))

  const lines = []
  lines.push(`# Executed trades — league ${leagueId}`)
  lines.push('')
  lines.push(
    `Generated: ${new Date().toISOString().slice(0, 19)}Z · Source: [draft trades API](${url})`
  )
  lines.push('')
  lines.push(
    '**Note:** Rows use API `state === "p"` (processed). Other states (e.g. proposed / rejected) are omitted.'
  )
  lines.push('')
  if (executed.length === 0) {
    lines.push('*No processed trades returned.*')
  } else {
    lines.push('| GW | Trade ID | Offered by | Accepted by | Offered sends | Offered receives |')
    lines.push('| --- | --- | --- | --- | --- | --- |')
    for (const t of executed.sort((a, b) => a.event - b.event || a.id - b.id)) {
      const offerer = entryName.get(t.offered_entry) ?? `entry ${t.offered_entry}`
      const receiver = entryName.get(t.received_entry) ?? `entry ${t.received_entry}`
      const items = t.tradeitem_set || []
      const outs = items.map((x) => plLabel(x.element_out)).join('; ')
      const ins = items.map((x) => plLabel(x.element_in)).join('; ')
      lines.push(
        `| ${t.event} | ${t.id} | ${offerer} | ${receiver} | ${outs} | ${ins} |`
      )
    }
    lines.push('')
    lines.push('### Detail (mirror sides)')
    for (const t of executed.sort((a, b) => a.event - b.event || a.id - b.id)) {
      const offerer = entryName.get(t.offered_entry) ?? `entry ${t.offered_entry}`
      const receiver = entryName.get(t.received_entry) ?? `entry ${t.received_entry}`
      lines.push('')
      lines.push(`#### GW ${t.event} — trade ${t.id}`)
      lines.push(`- **${offerer}** (offered) · **${receiver}** (accepted)`)
      lines.push(`- Offer time: ${fmtIso(t.offer_time)} · Response: ${fmtIso(t.response_time)}`)
      const items = t.tradeitem_set || []
      for (const x of items) {
        lines.push(
          `  - ${offerer}: out **${plLabel(x.element_out)}** → in **${plLabel(x.element_in)}**`
        )
        lines.push(
          `  - ${receiver}: out **${plLabel(x.element_in)}** → in **${plLabel(x.element_out)}**`
        )
      }
    }
  }
  lines.push('')

  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, lines.join('\n'), 'utf8')
  console.log(`Wrote ${executed.length} executed trade(s) → ${outPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
