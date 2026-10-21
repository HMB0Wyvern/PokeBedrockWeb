import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useData, useTeamEditor } from '../App'
import TeamEditor from '../components/TeamEditor'
import { loadDetail, useAsync, type Detail, type Mon, type TeamMember } from '../lib/data'
import { multLabel, TYPE_COLOR, TYPE_ES } from '../lib/poke'
import { spawnRows } from '../lib/spawn'
import { nextMoves, pendingEvolution, recruits, suggestUpgrades, takenMult, teamCoverage, teamWeaknesses } from '../lib/team'
import { recommendItems, recommendNature } from '../lib/build'
import { Art, Bilingual, CAT_ES, Icon, ItemBySid, ItemName, LightBadge, MoveTag, Panel, TypeChip, VerdictBadge } from '../components/ui'

export default function TeamPage() {
  const data = useData()
  const party = data.team.party.map((member) => ({ member, mon: data.byId.get(member.species)! })).filter((x) => x.mon)
  const { data: details } = useAsync(() => Promise.all(party.map((p) => loadDetail(p.mon.id))), [data])
  const api = useTeamEditor()
  const [editing, setEditing] = useState(false)
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-pixel text-3xl">Mi equipo</h1>
        <span className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-ink-dim">Actualizado: {data.team.updatedAt} · {data.team.source}</span>
          <button className="mc-btn px-3 py-1.5" aria-pressed={editing} onClick={() => setEditing(!editing)}>✎ Editar equipo y cajas</button>
        </span>
      </div>
      {editing && <TeamEditor onClose={() => setEditing(false)} />}
      {!party.length && !editing && <Panel><p className="text-ink-dim">Tu equipo está vacío. Pulsa "Editar equipo y cajas" para añadir tus Pokémon.</p></Panel>}
      <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
        {party.map((p, i) => <MemberCard key={p.member.species} {...p} detail={details?.[i]} index={i} />)}
      </div>
      <Weaknesses party={party} />
      <Coverage />
      <Recruits party={party} />
      <Panel title="Cómo actualizar tu equipo">
        <p className="text-ink-dim">
          {api.custom
            ? 'Estás usando tu propio equipo, guardado en este navegador. Cámbialo con "Editar equipo y cajas".'
            : 'Este es el equipo de base de la web. Si no es el tuyo, pulsa "Editar equipo y cajas", pon tus Pokémon y guárdalo: se queda solo en tu navegador.'}
        </p>
      </Panel>
    </div>
  )
}

const LEVELING = new Set(['pokeb:lucky_egg', 'pokeb:exp_share'])

/** Objeto y naturaleza ideales comparados con lo que lleva ahora. */
function IdealBuild({ member, mon, detail }: { member: TeamMember; mon: Mon; detail: Detail }) {
  const data = useData()
  const picks = recommendItems(mon, detail.sets[0])
  const best = picks.find((p) => data.itemKey.get(p.sid) !== member.heldItem)
  const hasIdeal = picks[0] && data.itemKey.get(picks[0].sid) === member.heldItem
  const nat = recommendNature(mon, detail.sets[0])
  const nature = data.natures.find((n) => n.id === nat.id)
  return (
    <div className="bg-screen border border-black p-2 space-y-2">
      <div className="font-pixel text-xs text-ink-dim">Lo ideal para él</div>
      {hasIdeal ? <p className="text-sm text-good">Ya lleva el mejor objeto.</p> : best && (
        <ItemBySid data={data} sid={best.sid}>
          {best.why}
          {member.heldItem && LEVELING.has(member.heldItem) && <span className="block text-warn">Mientras lo subes de nivel, el objeto de experiencia que lleva está bien.</span>}
        </ItemBySid>
      )}
      {nature && (
        <p className="text-sm">
          Naturaleza: <Bilingual es={nature.es} en={nature.en} className="font-semibold" /> <span className="text-good">+{nature.plusEs}</span> <span className="text-bad">−{nature.minusEs}</span>
          {member.nature && member.nature !== nat.id && <span className="text-ink-dim"> · la suya: {data.natures.find((n) => n.id === member.nature)?.es ?? member.nature}</span>}
        </p>
      )}
      <Link to={`/pokemon/${mon.fin.length ? mon.fin[0] : mon.id}?tab=usar`} className="text-xs text-led underline">Ver cómo usarlo →</Link>
    </div>
  )
}

function MemberCard({ member, mon, detail, index }: { member: TeamMember; mon: Mon; detail?: Detail; index: number }) {
  const data = useData()
  const item = member.heldItem ? data.items[member.heldItem] : undefined
  const upgrades = detail ? suggestUpgrades(data, member, mon, detail) : []
  const upgradeFrom = new Set(upgrades.map((u) => u.from))
  const next = detail ? nextMoves(detail, member.level) : []
  const evos = detail ? pendingEvolution(detail, mon.id) : []
  const weak = Object.fromEntries(Object.keys(TYPE_ES).map((t) => [t, takenMult(data, mon, t, member.ability)]))
  const weakList = Object.entries(weak).filter(([, m]) => m > 1).sort((a, b) => b[1] - a[1])
  const hpPct = (member.hp[0] / member.hp[1]) * 100
  return (
    <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="screen p-4 space-y-3">
      <div className="flex gap-3">
        <Link to={`/pokemon/${mon.id}`} className="shrink-0 w-24 h-24 grid place-items-center bg-screen border-2 border-black mc-bevel hover:border-dex-red-light">
          <Art mon={mon} className="w-20 h-20" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <Link to={`/pokemon/${mon.id}`} className="font-pixel text-2xl hover:text-dex-red-light">{mon.es}</Link>
            <span className="font-pixel text-led">Nv. {member.level}</span>
            {member.gender && <span className={member.gender === 'M' ? 'text-led' : 'text-[#f48fb1]'}>{member.gender === 'M' ? '♂' : '♀'}</span>}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">{mon.types.map((t) => <TypeChip key={t} type={t} small />)}<VerdictBadge v={mon.verdict} /></div>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-ink-dim"><span>PS</span><span className="font-pixel">{member.hp[0]}/{member.hp[1]}</span></div>
            <div className="h-2 bg-screen border border-black"><motion.div className="h-full" initial={{ width: 0 }} animate={{ width: `${hpPct}%` }} style={{ background: hpPct > 50 ? '#66bb6a' : hpPct > 20 ? '#ffca28' : '#ef5350' }} /></div>
          </div>
        </div>
      </div>

      {item && (
        <div className="bg-screen border border-black p-2">
          <div className="font-pixel text-xs text-ink-dim mb-1">Objeto equipado</div>
          <ItemName item={item} withDesc />
        </div>
      )}
      {detail && <IdealBuild member={member} mon={mon} detail={detail} />}

      <div>
        <div className="font-pixel text-xs text-ink-dim mb-1">Ataques</div>
        <ul className="grid grid-cols-1 gap-1">
          {member.moves.map((id) => {
            const mv = data.moves[id]
            if (!mv) return <li key={id}>{id}</li>
            return (
              <li key={id} title={mv.desc} className={`flex items-center justify-between gap-2 bg-screen border px-2 py-1 ${upgradeFrom.has(id) ? 'border-warn/70' : 'border-black'}`}>
                <MoveTag mv={mv} />
                <span className="text-xs text-ink-dim whitespace-nowrap">{CAT_ES[mv.cat]} · <span className="font-pixel">{mv.pow > 1 ? mv.pow : '—'}</span></span>
              </li>
            )
          })}
        </ul>
      </div>

      {upgrades.length > 0 && (
        <div className="bg-warn/10 border border-warn/50 p-2">
          <div className="font-pixel text-xs text-warn mb-1">Puedes mejorarlo ya (desde "Editar movimientos")</div>
          <ul className="text-sm space-y-1">
            {upgrades.map((u) => (
              <li key={u.from}>
                <Bilingual es={data.moves[u.from].es} en={data.moves[u.from].en} /> <span className="font-pixel text-warn">→</span>{' '}
                <b><Bilingual es={data.moves[u.to].es} en={data.moves[u.to].en} /></b>
                <span className="text-ink-dim"> ({data.moves[u.to].pow}). {u.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {evos.length > 0 && (
        <div className="text-sm">
          <span className="font-pixel text-xs text-ink-dim">Evoluciona: </span>
          {evos.map((e) => {
            const to = data.byId.get(e.id)
            return (
              <span key={e.id} className="inline-flex items-center gap-1 mr-2">
                <Icon id={e.id} size={1} /> <b>{to?.es}</b> <span className="text-ink-dim">— {e.how}</span>
              </span>
            )
          })}
        </div>
      )}

      {next.length > 0 && (
        <div className="text-sm">
          <div className="font-pixel text-xs text-ink-dim mb-1">Próximos ataques</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {next.map(([lv, id]) => data.moves[id] && (
              <span key={id + lv}><span className="font-pixel text-led">Nv. {lv}</span> <MoveTag mv={data.moves[id]} /></span>
            ))}
          </div>
        </div>
      )}

      {weakList.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 text-sm">
          <span className="font-pixel text-xs text-ink-dim mr-1">Débil a</span>
          {weakList.map(([t, m]) => <span key={t} className="inline-flex items-center gap-0.5"><TypeChip type={t} small /><span className="font-pixel text-xs text-bad">{multLabel(m)}</span></span>)}
        </div>
      )}
    </motion.article>
  )
}

function Weaknesses({ party }: { party: { member: TeamMember; mon: Mon }[] }) {
  const data = useData()
  const rows = teamWeaknesses(data, party).filter((r) => r.weak > 0 || r.resist > 0)
  const danger = rows.filter((r) => r.weak >= 3 || r.mults.some((m) => m >= 4)).sort((a, b) => b.weak - a.weak)
  return (
    <Panel title="Debilidades del equipo">
      {danger.length > 0 && (
        <p className="mb-3">
          <b className="text-bad">Puntos peligrosos:</b>{' '}
          {danger.map((d) => <span key={d.type} className="inline-flex items-center gap-1 mr-3"><TypeChip type={d.type} small /> afecta a {d.weak} de {party.length}{d.mults.some((m) => m >= 4) ? ' (alguno ×4)' : ''}</span>)}
        </p>
      )}
      <div className="overflow-x-auto scroll-thin">
        <table className="text-sm">
          <thead>
            <tr>
              <th />
              {party.map(({ mon }) => <th key={mon.id} className="px-1"><Icon id={mon.id} size={1} /></th>)}
              <th className="font-pixel text-xs text-ink-dim px-2">Débiles</th>
              <th className="font-pixel text-xs text-ink-dim px-2">Resisten</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.type} className="border-t border-screen-3">
                <td className="pr-2 py-0.5"><TypeChip type={r.type} small /></td>
                {r.mults.map((m, i) => (
                  <td key={i} className="text-center font-pixel px-1" style={{ color: m > 1 ? '#ef5350' : m < 1 ? '#66bb6a' : '#596273', background: m >= 4 ? 'rgb(239 83 80 / .2)' : undefined }}>
                    {m === 1 ? '·' : multLabel(m)}
                  </td>
                ))}
                <td className={`text-center font-pixel ${r.weak >= 3 ? 'text-bad' : ''}`}>{r.weak}</td>
                <td className="text-center font-pixel text-good">{r.resist}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-dim mt-2">Rojo: recibe más daño. Verde: recibe menos. Si un Pokémon puede tener una habilidad que lo hace inmune (p. ej. Levitación (Levitate)), solo se cuenta cuando todas sus habilidades posibles lo hacen.</p>
    </Panel>
  )
}

function Coverage() {
  const data = useData()
  const cov = teamCoverage(data, data.team.party)
  const missing = cov.filter((c) => !c.by.length)
  return (
    <Panel title="Contra qué tipos pegas fuerte">
      <div className="flex flex-wrap gap-1.5">
        {cov.map((c) => (
          <span key={c.type} title={c.by.length ? `Superefectivo con: ${c.by.map((t) => TYPE_ES[t]).join(', ')}` : 'Ningún ataque de tu equipo le pega superefectivo'} className={`inline-flex items-center gap-1 px-1 border ${c.by.length ? 'border-good/50' : 'border-bad/60 opacity-70'}`}>
            <TypeChip type={c.type} small />
            <span className="font-pixel text-xs">{c.by.length ? '✓' : '✗'}</span>
          </span>
        ))}
      </div>
      {missing.length > 0 && <p className="text-sm text-ink-dim mt-2">Con tus ataques actuales no pegas superefectivo a: {missing.map((m) => TYPE_ES[m.type]).join(', ')}.</p>}
    </Panel>
  )
}

function Recruits({ party }: { party: { member: TeamMember; mon: Mon }[] }) {
  const data = useData()
  const weakTypes = useMemo(() => teamWeaknesses(data, party).filter((w) => w.weak >= 3 || w.mults.some((m) => m >= 4)).sort((a, b) => b.weak - a.weak).map((w) => w.type), [data, party])
  const list = useMemo(() => recruits(data, weakTypes, new Set(party.map((p) => p.mon.id)), 12), [data, weakTypes, party])
  if (!weakTypes.length) return null
  return (
    <Panel title="Qué capturar para reforzar el equipo">
      <p className="text-ink-dim mb-3">
        Pokémon que aparecen salvajes, son buenos (o lo serán al evolucionar) y resisten {weakTypes.map((t) => <span key={t} className="mx-0.5"><TypeChip type={t} small /></span>)}.
      </p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
        {list.map(({ mon, finalMon, covers }) => {
          const where = spawnRows(data, mon).find((r) => !r.dubious)
          return (
            <Link key={mon.id} to={`/pokemon/${mon.id}`} className="flex gap-2 bg-screen border-2 border-black p-2 hover:border-dex-red-light">
              <Icon id={mon.id} />
              <div className="min-w-0 text-sm">
                <div className="font-semibold">{mon.es}{finalMon.id !== mon.id && <span className="text-ink-dim"> → {finalMon.es}</span>} <VerdictBadge v={mon.verdict} /></div>
                <div className="flex flex-wrap gap-1 my-0.5">{finalMon.types.map((t) => <TypeChip key={t} type={t} small />)}</div>
                <div className="text-xs text-ink-dim">Resiste: {covers.map((t) => <span key={t} style={{ color: TYPE_COLOR[t] }} className="mr-1">{TYPE_ES[t]}</span>)}</div>
                {where && <div className="text-xs text-ink-dim truncate">{where.label} · <LightBadge l={where.light} /></div>}
              </div>
            </Link>
          )
        })}
      </div>
    </Panel>
  )
}
