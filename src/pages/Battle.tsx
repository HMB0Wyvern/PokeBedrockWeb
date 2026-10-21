import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useData } from '../App'
import { loadDetail, useAsync, type Data, type Mon, type TeamMember } from '../lib/data'
import { bestAttack, hitsToKo, hpAt, likelyMoves, statAt } from '../lib/battle'
import { defenseProfile, multLabel, TYPE_COLOR, TYPE_ES, TYPES } from '../lib/poke'
import { recruits, takenMult } from '../lib/team'
import { Bilingual, Icon, MonCard, MonPicker, MoveTag, Panel, Tabs, TypeChip } from '../components/ui'

type TabId = 'rival' | 'gimnasios' | 'tabla'
const TABS = [['rival', '⚔ Contra un Pokémon'], ['gimnasios', 'Gimnasios'], ['tabla', 'Tabla de tipos']] as const

const GYMS: { name: string; type: string; elite?: boolean }[] = [
  { name: 'Lyra', type: 'psychic' }, { name: 'Quinn', type: 'ghost' }, { name: 'Morgan', type: 'electric' }, { name: 'Henry', type: 'dragon' },
  { name: 'Amelia', type: 'flying' }, { name: 'Amy', type: 'rock' }, { name: 'Alex', type: 'fairy' }, { name: 'Líder Siniestro', type: 'dark' },
  { name: 'Líder Fuego', type: 'fire' }, { name: 'Líder Planta', type: 'grass' }, { name: 'Líder Tierra', type: 'ground' }, { name: 'Líder Normal', type: 'normal' },
  { name: 'Líder Veneno', type: 'poison' }, { name: 'Líder Acero', type: 'steel' }, { name: 'Líder Agua', type: 'water' },
  { name: 'Alto Mando Eléctrico', type: 'electric', elite: true }, { name: 'Alto Mando Hada', type: 'fairy', elite: true }, { name: 'Alto Mando Bicho', type: 'bug', elite: true }, { name: 'Jeice Zelinsky', type: 'dragon', elite: true },
]

export default function Battle() {
  const [params, setParams] = useSearchParams()
  const tab = (TABS.some(([k]) => k === params.get('t')) ? params.get('t') : 'rival') as TabId
  const setTab = (t: TabId) => {
    const next = new URLSearchParams(params)
    if (t === 'rival') next.delete('t')
    else next.set('t', t)
    setParams(next, { replace: true })
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-pixel text-3xl">Combatir</h1>
          <p className="text-ink-dim">A quién sacar y qué ataque usar contra cada rival.</p>
        </div>
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
      </div>
      {tab === 'rival' && <VsRival />}
      {tab === 'gimnasios' && <Gyms />}
      {tab === 'tabla' && <TypeTable />}
    </div>
  )
}

function party(data: Data) {
  return data.team.party.map((m) => ({ member: m, mon: data.byId.get(m.species)! })).filter((x) => x.mon)
}

type Row = ReturnType<typeof matchup>
function matchup(data: Data, member: TeamMember, mine: Mon, rival: Mon, rivalLv: number, rivalMoves: string[]) {
  const me = { mon: mine, level: member.level, ability: member.ability }
  const them = { mon: rival, level: rivalLv }
  const myBest = bestAttack(data, me, them, member.moves)
  const theirBest = bestAttack(data, them, me, rivalMoves)
  const mySpe = statAt(mine.stats[5], member.level)
  const theirSpe = statAt(rival.stats[5], rivalLv)
  const faster = mySpe > theirSpe ? 1 : mySpe === theirSpe ? 0 : -1
  const myHits = myBest ? hitsToKo(myBest.dmg.minPct) : Infinity
  // Daño del rival respecto a la vida que le queda ahora a tu Pokémon
  const curHp = member.hp[0]
  const theirPctNow = theirBest ? (theirBest.dmg.max / Math.max(1, curHp)) * 100 : 0
  const theirHits = theirBest ? hitsToKo(theirPctNow) : Infinity
  const wins = myHits < theirHits || (myHits === theirHits && faster > 0)
  const score = (wins ? 10 : 0) + Math.min(theirHits, 6) - Math.min(myHits, 6) + faster * 0.5
  const verdict = myHits === Infinity ? 'Evítalo' : wins && myHits <= 2 ? 'Muy buena opción' : wins ? 'Buena opción' : theirHits <= 1 ? 'Evítalo' : 'Arriesgado'
  return { member, mine, myBest, theirBest, faster, myHits, theirHits, curHp, maxHp: member.hp[1], theirPctNow, score, verdict, mySpe, theirSpe }
}

const VERDICT_COLOR: Record<string, string> = { 'Muy buena opción': '#66bb6a', 'Buena opción': '#9ccc65', Arriesgado: '#ffca28', Evítalo: '#ef5350' }

function VsRival() {
  const data = useData()
  const [params, setParams] = useSearchParams()
  const rival = data.byId.get(params.get('r') ?? '') ?? undefined
  const team = party(data)
  const avg = Math.round(team.reduce((a, x) => a + x.member.level, 0) / Math.max(1, team.length))
  const defLv = rival ? (rival.sp.length ? Math.round((rival.lv[0] + rival.lv[1]) / 2) : avg) : avg
  const [lvState, setLv] = useState<{ id?: string; lv: number }>({ lv: defLv })
  const level = lvState.id === rival?.id ? lvState.lv : defLv
  const { data: detail } = useAsync(() => (rival ? loadDetail(rival.id) : Promise.resolve(undefined)), [rival?.id])
  const rivalMoves = useMemo(() => (detail && rival ? likelyMoves(detail, level) : []), [detail, rival, level])
  const rows = useMemo(
    () => (rival && detail ? team.map(({ member, mon }) => matchup(data, member, mon, rival, level, rivalMoves)).sort((a, b) => b.score - a.score) : []),
    [data, team, rival, detail, level, rivalMoves],
  )
  const pick = (m: Mon) => setParams({ r: m.id }, { replace: true })

  return (
    <div className="space-y-5">
      <Panel title="¿Contra quién luchas?">
        <div className="grid md:grid-cols-[1fr_280px] gap-4 items-start">
          <MonPicker data={data} value={rival} onChange={pick} placeholder="Escribe el Pokémon rival…" />
          <label className="block">
            <span className="text-sm text-ink-dim">Nivel del rival: <b className="font-pixel text-ink">{level}</b></span>
            <input type="range" min={1} max={100} value={level} onChange={(e) => setLv({ id: rival?.id, lv: Number(e.target.value) })} className="w-full" />
          </label>
        </div>
        {!rival && <p className="text-ink-dim mt-3">Busca el Pokémon con el que te has encontrado y te digo a quién sacar.</p>}
      </Panel>

      {rival && (
        <div className="grid 2xl:grid-cols-[380px_1fr] gap-5 items-start">
          <RivalCard data={data} rival={rival} level={level} moves={rivalMoves} />
          <div className="space-y-5">
            {rows[0] && rows[0].verdict !== 'Evítalo' && (
              <motion.div key={rival.id + level} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="screen p-4 flex flex-wrap items-center gap-4 border-good/80">
                <Icon id={rows[0].mine.id} size={2} />
                <div>
                  <div className="text-sm text-ink-dim">Saca a</div>
                  <div className="font-pixel text-3xl">{rows[0].mine.es}</div>
                </div>
                {rows[0].myBest && (
                  <div>
                    <div className="text-sm text-ink-dim">y usa</div>
                    <div className="text-lg"><MoveTag mv={rows[0].myBest.mv} /></div>
                  </div>
                )}
                <div className="ml-auto text-right">
                  <div className="text-sm text-ink-dim">Lo debilita en</div>
                  <div className="font-pixel text-3xl text-good">{rows[0].myHits === 1 ? '1 golpe' : `${rows[0].myHits} golpes`}</div>
                </div>
              </motion.div>
            )}
            <Panel title="Tu equipo contra él" right={<span className="text-xs text-ink-dim hidden md:inline">Ordenado de mejor a peor opción</span>}>
              <div className="space-y-2">
                {rows.map((r, i) => <MatchRow key={r.member.species} r={r} rival={rival} i={i} />)}
              </div>
              <p className="text-xs text-ink-dim mt-3">
                Estimación con IVs medios y sin EVs ni objetos; el daño real varía un poco. La vida de tu equipo es la de tu última sincronización. Los ataques del rival son los 4 últimos que aprende por nivel (lo normal en salvajes y entrenadores).
              </p>
            </Panel>
          </div>
        </div>
      )}
    </div>
  )
}

function RivalCard({ data, rival, level, moves }: { data: Data; rival: Mon; level: number; moves: string[] }) {
  const prof = defenseProfile(data.chart, rival.types)
  const weak = Object.entries(prof).filter(([, m]) => m > 1).sort((a, b) => b[1] - a[1])
  const resist = Object.entries(prof).filter(([, m]) => m < 1).sort((a, b) => a[1] - b[1])
  return (
    <Panel title="El rival">
      <MonCard mon={rival} extra={<span>Nivel {level} · {hpAt(rival, level)} PS aprox.</span>} />
      <h3 className="font-pixel mt-4 mb-1 text-sm">Débil a (úsalos)</h3>
      <div className="flex flex-wrap gap-1.5">{weak.map(([t, m]) => <span key={t} className="inline-flex items-center gap-1"><TypeChip type={t} small /><span className="font-pixel text-xs text-good">{multLabel(m)}</span></span>)}</div>
      <h3 className="font-pixel mt-3 mb-1 text-sm">Resiste (evítalos)</h3>
      <div className="flex flex-wrap gap-1.5">{resist.map(([t, m]) => <span key={t} className="inline-flex items-center gap-1"><TypeChip type={t} small /><span className="font-pixel text-xs text-bad">{multLabel(m)}</span></span>)}</div>
      <h3 className="font-pixel mt-3 mb-1 text-sm">Sus ataques probables</h3>
      <ul className="space-y-1">
        {moves.map((id) => data.moves[id] && (
          <li key={id} className="flex items-center gap-2 text-sm" title={data.moves[id].desc}>
            <MoveTag mv={data.moves[id]} />
            <span className="ml-auto font-pixel text-xs text-ink-dim">{data.moves[id].pow > 1 ? data.moves[id].pow : 'Estado'}</span>
          </li>
        ))}
      </ul>
      <Link to={`/pokemon/${rival.id}`} className="inline-block text-sm text-led underline mt-3">Ver su ficha →</Link>
    </Panel>
  )
}

function DmgBar({ min, max, color }: { min: number; max: number; color: string }) {
  return (
    <div className="relative h-3 bg-screen" title={`${Math.round(min)}–${Math.round(max)} %`}>
      <motion.div className="absolute inset-y-0 left-0 opacity-50 rounded-r-[4px]" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, max)}%` }} />
      <motion.div className="absolute inset-y-0 left-0 rounded-r-[4px]" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, min)}%` }} />
    </div>
  )
}

function MatchRow({ r, rival, i }: { r: Row; rival: Mon; i: number }) {
  const hitsTxt = (n: number) => (n === Infinity ? 'nunca' : n === 1 ? '1 golpe' : `${n} golpes`)
  return (
    <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="grid lg:grid-cols-[190px_1fr_1fr_120px] gap-3 items-center bg-screen border-2 border-black p-2">
      <div className="flex items-center gap-2">
        <Icon id={r.mine.id} size={1} />
        <div>
          <div className="font-semibold">{r.mine.es}</div>
          <div className="text-xs text-ink-dim">Nv. {r.member.level} · {r.curHp}/{r.maxHp} PS</div>
        </div>
      </div>
      <div className="text-sm">
        <div className="text-xs text-ink-dim">Tu mejor ataque</div>
        {r.myBest ? (
          <>
            <div className="flex flex-wrap items-center gap-x-2"><MoveTag mv={r.myBest.mv} /><span className={`font-pixel text-xs ${r.myBest.dmg.eff > 1 ? 'text-good' : r.myBest.dmg.eff < 1 ? 'text-bad' : 'text-ink-dim'}`}>{multLabel(r.myBest.dmg.eff)}</span></div>
            <DmgBar min={r.myBest.dmg.minPct} max={r.myBest.dmg.maxPct} color="#66bb6a" />
            <div className="text-xs text-ink-dim">{Math.round(r.myBest.dmg.minPct)}–{Math.round(r.myBest.dmg.maxPct)} % de su vida · lo tumba en {hitsTxt(r.myHits)}</div>
          </>
        ) : <div className="text-ink-dim">No le hace daño</div>}
      </div>
      <div className="text-sm">
        <div className="text-xs text-ink-dim">Lo peor que te puede hacer</div>
        {r.theirBest ? (
          <>
            <div className="flex flex-wrap items-center gap-x-2"><MoveTag mv={r.theirBest.mv} /><span className={`font-pixel text-xs ${r.theirBest.dmg.eff > 1 ? 'text-bad' : 'text-ink-dim'}`}>{multLabel(r.theirBest.dmg.eff)}</span></div>
            <DmgBar min={r.theirBest.dmg.minPct} max={r.theirBest.dmg.maxPct} color="#ef5350" />
            <div className="text-xs text-ink-dim">{Math.round(r.theirBest.dmg.maxPct)} % de tu vida máx. · con tu vida actual te tumba en {hitsTxt(r.theirHits)}</div>
          </>
        ) : <div className="text-ink-dim">Sus ataques no te hacen daño</div>}
      </div>
      <div className="text-right">
        <div className="font-pixel text-sm px-2 py-0.5 inline-block text-black mc-bevel" style={{ background: VERDICT_COLOR[r.verdict] }}>{r.verdict}</div>
        <div className="text-xs text-ink-dim mt-1">{r.faster > 0 ? `Atacas primero (${r.mySpe} vs ${r.theirSpe})` : r.faster < 0 ? `${rival.es} ataca primero` : 'Misma velocidad'}</div>
      </div>
    </motion.div>
  )
}

function Gyms() {
  const data = useData()
  const [sel, setSel] = useState(GYMS[0])
  const team = party(data)
  const rows = team.map(({ member, mon }) => {
    const def = takenMult(data, mon, sel.type, member.ability)
    let best: { id: string; mult: number } | null = null
    for (const id of member.moves) {
      const mv = data.moves[id]
      if (!mv || mv.cat === 'estado' || mv.pow <= 1) continue
      const mult = data.chart[mv.type][sel.type]
      if (!best || mult * (mon.types.includes(mv.type) ? 1.5 : 1) > best.mult) best = { id, mult }
    }
    const score = (best?.mult ?? 0) * 2 - def * 2
    return { member, mon, def, best, score }
  }).sort((a, b) => b.score - a.score)
  const exclude = new Set(team.map((x) => x.mon.id))
  const helpers = recruits(data, [sel.type], exclude, 6)
  return (
    <div className="grid xl:grid-cols-[320px_1fr] gap-5 items-start">
      <Panel title="Elige gimnasio">
        <ul className="space-y-1">
          {GYMS.map((g) => (
            <li key={g.name}>
              <button onClick={() => setSel(g)} aria-pressed={sel === g} className="mc-btn w-full px-2 py-1 flex items-center justify-between gap-2 text-left">
                <span>{g.name}{g.elite && <span className="text-xs opacity-80"> · Alto Mando</span>}</span>
                <TypeChip type={g.type} small />
              </button>
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-dim mt-3">Lista de entrenadores de la wiki de PokeBedrock. Necesitas nivel de entrenador (TXP) para algunos.</p>
      </Panel>
      <div className="space-y-5">
        <Panel title={<>Contra {sel.name} <TypeChip type={sel.type} /></>}>
          <p className="text-ink-dim mb-3">Sus Pokémon serán sobre todo de tipo {TYPE_ES[sel.type]}. Lleva a los de arriba y deja en el banquillo a los de abajo.</p>
          <div className="space-y-2">
            {rows.map(({ member, mon, def, best }) => (
              <div key={member.species} className="flex flex-wrap items-center gap-3 bg-screen border-2 border-black p-2">
                <Icon id={mon.id} size={1} />
                <span className="font-semibold w-28">{mon.es}</span>
                <span className="text-sm">
                  {best && best.mult > 1 ? <>Le pega <b className="text-good">{multLabel(best.mult)}</b> con <Bilingual es={data.moves[best.id].es} en={data.moves[best.id].en} /></> : <span className="text-ink-dim">Sin ataques superefectivos</span>}
                </span>
                <span className={`ml-auto text-sm ${def > 1 ? 'text-bad' : def < 1 ? 'text-good' : 'text-ink-dim'}`}>
                  {def > 1 ? `Recibe ${multLabel(def)}: cuidado` : def < 1 ? `Recibe ${multLabel(def)}: aguanta bien` : 'Daño normal'}
                </span>
              </div>
            ))}
          </div>
        </Panel>
        {helpers.length > 0 && (
          <Panel title="Pokémon que te ayudarían" right={<span className="text-sm text-ink-dim">Resisten el tipo {TYPE_ES[sel.type]}</span>}>
            <div className="grid sm:grid-cols-2 2xl:grid-cols-3 gap-2">
              {helpers.map(({ mon, finalMon }) => <MonCard key={mon.id} mon={mon} extra={finalMon.id !== mon.id ? `Evoluciona a ${finalMon.es}` : undefined} />)}
            </div>
          </Panel>
        )}
      </div>
    </div>
  )
}

function TypeTable() {
  const data = useData()
  const [hover, setHover] = useState<{ a: string; d: string } | null>(null)
  const cell = (m: number) => (m === 0 ? { bg: '#111', txt: '0' } : m > 1 ? { bg: '#2e7d32', txt: '2' } : m < 1 ? { bg: '#8e2424', txt: '½' } : { bg: 'transparent', txt: '' })
  return (
    <Panel title="Tabla de tipos" right={<span className="text-sm text-ink-dim">Fila = tipo del ataque · Columna = tipo del Pokémon que lo recibe</span>}>
      <div className="overflow-x-auto scroll-thin">
        <table className="border-collapse text-xs" onMouseLeave={() => setHover(null)}>
          <thead>
            <tr>
              <th className="p-1 text-left text-ink-dim font-normal">Ataque ↓ / Defensa →</th>
              {TYPES.map((d) => (
                <th key={d} className="p-0.5" style={{ opacity: hover && hover.d !== d ? 0.5 : 1 }}>
                  <div className="w-9 h-16 flex items-end justify-center"><span className="font-pixel text-[10px] text-white px-0.5 [writing-mode:vertical-rl] rotate-180 mc-bevel" style={{ background: TYPE_COLOR[d] }}>{TYPE_ES[d]}</span></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TYPES.map((a) => (
              <tr key={a}>
                <th className="p-0.5 text-left" style={{ opacity: hover && hover.a !== a ? 0.5 : 1 }}><TypeChip type={a} small /></th>
                {TYPES.map((d) => {
                  const m = data.chart[a][d]
                  const c = cell(m)
                  const hl = hover && (hover.a === a || hover.d === d)
                  return (
                    <td key={d} onMouseEnter={() => setHover({ a, d })} title={`${TYPE_ES[a]} contra ${TYPE_ES[d]}: ${multLabel(m)}`} className={`w-9 h-8 text-center font-pixel border border-black/60 ${hl ? 'outline outline-1 outline-white/40' : ''}`} style={{ background: c.bg, opacity: hover && !hl ? 0.55 : 1 }}>
                      {c.txt}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-4 mt-3 text-sm">
        <span className="inline-flex items-center gap-1.5"><span className="w-4 h-4 inline-block" style={{ background: '#2e7d32' }} /> 2 = superefectivo (doble daño)</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-4 h-4 inline-block" style={{ background: '#8e2424' }} /> ½ = poco efectivo</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-4 h-4 inline-block border border-ink-dim" style={{ background: '#111' }} /> 0 = no le afecta</span>
        <span className="text-ink-dim">Vacío = daño normal. Si el Pokémon tiene dos tipos, se multiplican (2 × 2 = ×4).</span>
      </div>
      {hover && <p className="mt-2 font-pixel">{TYPE_ES[hover.a]} → {TYPE_ES[hover.d]}: {multLabel(data.chart[hover.a][hover.d])}</p>}
    </Panel>
  )
}
