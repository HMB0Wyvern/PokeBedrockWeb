import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useData } from '../App'
import type { Mon } from '../lib/data'
import { APRICORNS, BALLS, catchChance, STATUS_ES, throwsFor90, type CatchInput, type Status } from '../lib/catch'
import { spawnRows } from '../lib/spawn'
import { Bilingual, Icon, LightBadge, MonPicker, Panel, Toggle, TypeChip, Unverified } from '../components/ui'

const EFFECTS = [
  { id: 'debilitar', label: 'Dejar a 1 PS', why: 'Bajarle la vida sin debilitarlo multiplica la probabilidad hasta casi ×3.' },
  { id: 'dormir', label: 'Dormir (×2,5)', why: 'El mejor estado para capturar.' },
  { id: 'paralizar', label: 'Paralizar (×1,5)', why: 'Dura todo el combate.' },
  { id: 'envenenar', label: 'Envenenar (×1,5)', why: 'Ojo: le va quitando vida y puede debilitarlo.' },
  { id: 'quemar', label: 'Quemar (×1,5)', why: 'Ojo: le va quitando vida y puede debilitarlo.' },
]

export default function Catch() {
  const data = useData()
  const [params] = useSearchParams()
  const initial = data.byId.get(params.get('p') ?? '') ?? data.byId.get('breloom')!
  return (
    <div className="space-y-5">
      <h1 className="font-pixel text-3xl">Capturar</h1>
      <Calculator initial={initial} />
      <Plan />
      <Kit />
      <BallsSection />
    </div>
  )
}

function Calculator({ initial }: { initial: Mon }) {
  const data = useData()
  const [mon, setMon] = useState<Mon>(initial)
  const [hp, setHp] = useState(100)
  const [status, setStatus] = useState<Status>('none')
  const [turn, setTurn] = useState(1)
  const [night, setNight] = useState(false)
  const [water, setWater] = useState(false)
  const [owned, setOwned] = useState(false)
  const [charm, setCharm] = useState(false)
  const [level, setLevel] = useState(Math.round((initial.lv[0] + initial.lv[1]) / 2) || 20)

  const input: CatchInput = { captureRate: mon.cr ?? 45, hpPct: hp, status, turn, night, water, owned, level, types: mon.types, baseSpeed: mon.stats[5], weightKg: mon.wt, charm, ultraBeast: mon.tags.includes('Ultra Beast') }
  const ranked = BALLS.map((b) => ({ b, p: catchChance(input, b) })).sort((a, b) => b.p - a.p || Number(a.b.id === 'master') - Number(b.b.id === 'master'))
  const best = ranked.find((r) => r.b.id !== 'master')!
  const poke = ranked.find((r) => r.b.id === 'poke')!

  return (
    <Panel title="Calculadora de captura">
      <div className="grid lg:grid-cols-[minmax(0,420px)_1fr] gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-ink-dim">Pokémon</label>
            <MonPicker data={data} value={mon} onChange={(m) => { setMon(m); setLevel(Math.round((m.lv[0] + m.lv[1]) / 2) || 20) }} />
            <div className="flex items-center gap-2 mt-2">
              <Icon id={mon.id} />
              <Link to={`/pokemon/${mon.id}`} className="font-semibold underline">{mon.es}</Link>
              {mon.types.map((t) => <TypeChip key={t} type={t} small />)}
              <span className="ml-auto text-sm text-ink-dim">Tasa: <b className="font-pixel text-ink">{mon.cr}</b></span>
            </div>
          </div>
          <div>
            <label className="text-sm text-ink-dim flex justify-between"><span>Vida que le queda</span><b className="font-pixel text-ink">{hp} %</b></label>
            <input type="range" min={1} max={100} value={hp} onChange={(e) => setHp(+e.target.value)} className="w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-ink-dim">Estado</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="w-full bg-screen border-2 border-black px-2 py-1.5">
                {Object.entries(STATUS_ES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-ink-dim">Turno del combate</label>
              <input type="number" min={1} max={30} value={turn} onChange={(e) => setTurn(Math.max(1, +e.target.value))} className="w-full bg-screen border-2 border-black px-2 py-1.5 font-pixel" />
            </div>
            <div>
              <label className="text-sm text-ink-dim">Su nivel</label>
              <input type="number" min={1} max={100} value={level} onChange={(e) => setLevel(Math.max(1, +e.target.value))} className="w-full bg-screen border-2 border-black px-2 py-1.5 font-pixel" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Toggle on={night} onClick={() => setNight(!night)}>☾ Es de noche</Toggle>
            <Toggle on={water} onClick={() => setWater(!water)}>≈ Está en el agua</Toggle>
            <Toggle on={owned} onClick={() => setOwned(!owned)}>✓ Ya lo tengo</Toggle>
            <Toggle on={charm} onClick={() => setCharm(!charm)}>✦ Amuleto Captura</Toggle>
          </div>
        </div>

        <div>
          <motion.div key={best.b.id + Math.round(best.p * 100)} initial={{ scale: 0.97, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-4 bg-screen border-2 border-black p-3 mb-3 mc-bevel">
            <img src={best.b.icon} alt="" className="pixelated w-14 h-14" />
            <div>
              <div className="text-sm text-ink-dim">Mejor opción ahora</div>
              <div className="font-pixel text-2xl">{best.b.es} <span className="text-base text-ink-dim">({best.b.en})</span></div>
              <div className="text-sm">
                <b className="font-pixel text-xl" style={{ color: color(best.p) }}>{pct(best.p)}</b> por lanzamiento · {throwsFor90(best.p) === Infinity ? '—' : `${throwsFor90(best.p)} lanzamientos para un 90 %`}
                {best.b.id !== 'poke' && <span className="text-ink-dim"> · Poké Ball: {pct(poke.p)}</span>}
              </div>
            </div>
          </motion.div>
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-sm">
              <thead className="font-pixel text-xs text-ink-dim text-left"><tr><th className="pb-1">Ball</th><th>Probabilidad</th><th className="text-right">Para 90 %</th><th className="hidden md:table-cell pl-3">Cuándo sirve</th></tr></thead>
              <tbody>
                {ranked.map(({ b, p }) => (
                  <tr key={b.id} className="border-t border-screen-3">
                    <td className="py-1 pr-2 whitespace-nowrap"><img src={b.icon} alt="" className="pixelated w-6 h-6 inline mr-1" /><Bilingual es={b.es} en={b.en} /></td>
                    <td className="py-1 pr-2 w-[40%]">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 flex-1 bg-screen border border-black"><motion.div className="h-full" animate={{ width: `${p * 100}%` }} style={{ background: color(p) }} /></div>
                        <span className="font-pixel w-12 text-right">{pct(p)}</span>
                      </div>
                    </td>
                    <td className="py-1 text-right font-pixel">{throwsFor90(p) === Infinity ? '—' : throwsFor90(p)}</td>
                    <td className="py-1 pl-3 text-ink-dim hidden md:table-cell">{b.rule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink-dim mt-2">Multiplicadores del código real de PokeBedrock (wiki oficial). La tasa de captura de cada especie es la estándar de los juegos y la fórmula es la clásica: tómalo como una estimación.</p>
        </div>
      </div>
    </Panel>
  )
}

const pct = (p: number) => `${p >= 0.995 ? 100 : p < 0.01 ? (p * 100).toFixed(1) : Math.round(p * 100)} %`
const color = (p: number) => (p > 0.5 ? '#66bb6a' : p > 0.2 ? '#ffca28' : '#ef5350')

function Plan() {
  const steps = [
    { t: 'Turno 1: Veloz Ball', d: 'Lánzala nada más empezar, sin atacar. Multiplica ×5: es la mejor Ball para casi todo.' },
    { t: 'Si escapa: bájale la vida', d: 'Usa Falso Tortazo (False Swipe) o tu ataque más flojo hasta dejarlo en rojo. Falso Tortazo nunca lo debilita.' },
    { t: 'Duérmelo o paralízalo', d: 'Espora (Spore) o Somnífero (Sleep Powder) duermen (×2,5). Onda Trueno (Thunder Wave) o Paralizador (Stun Spore) paralizan (×1,5).' },
    { t: 'Remata con la Ball adecuada', d: 'De noche, Ocaso Ball (×3). Contra Bicho o Agua, Malla Ball (×3,5). Si el combate se alarga, Turno Ball. Si no, Poké Ball: la Super y la Ultra Ball NO son mejores en PokeBedrock.' },
  ]
  return (
    <Panel title="Plan de captura">
      <ol className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
        {steps.map((s, i) => (
          <li key={i} className="bg-screen border-2 border-black p-3">
            <div className="font-pixel text-dex-red-light text-2xl">{i + 1}</div>
            <div className="font-bold">{s.t}</div>
            <p className="text-sm text-ink-dim mt-1">{s.d}</p>
          </li>
        ))}
      </ol>
      <p className="text-sm text-ink-dim mt-3">Extras que se multiplican: Amuleto Captura (Catching Charm) en la mano secundaria ×2. Contra Ultraentes todo es ×0,1 salvo la Ente Ball (Beast Ball).</p>
    </Panel>
  )
}

function Kit() {
  const data = useData()
  const [effect, setEffect] = useState('dormir')
  const [onlyWild, setOnlyWild] = useState(true)
  const teamIds = new Set(data.team.party.map((p) => p.species))
  const entries = data.kit.filter((k) => k.effect === effect)

  const teamHas = useMemo(() => {
    const out: { member: string; move: string; level: number | null; knows: boolean }[] = []
    for (const k of data.kit) for (const [id, lv] of k.learners) if (teamIds.has(id)) {
      const member = data.team.party.find((p) => p.species === id)!
      const knows = member.moves.includes(k.move)
      if (lv !== null || knows) out.push({ member: id, move: k.move, level: lv, knows })
    }
    return out
  }, [data])

  return (
    <Panel title="Kit del capturador: qué Pokémon llevar">
      <p className="mb-3 text-ink-dim">Lleva en el equipo un Pokémon que deje al rival con poca vida y otro (o el mismo) que lo duerma o paralice. Estos son los que aprenden cada ataque.</p>
      {teamHas.length > 0 && (
        <div className="bg-screen border-2 border-black p-3 mb-4">
          <div className="font-pixel text-sm mb-1">En tu equipo</div>
          <ul className="text-sm space-y-0.5">
            {teamHas.map((t) => {
              const mv = data.moves[t.move]
              const mon = data.byId.get(t.member)!
              const member = data.team.party.find((p) => p.species === t.member)!
              return (
                <li key={t.member + t.move}>
                  <b>{mon.es}</b>: <Bilingual es={mv.es} en={mv.en} /> —{' '}
                  {t.knows ? <span className="text-good">ya lo sabe</span> : t.level !== null ? (t.level <= member.level ? <span className="text-good">puede aprenderlo ya (nivel {t.level})</span> : <span>al nivel {t.level} (está en el {member.level})</span>) : <span className="text-ink-dim">con MT</span>}
                </li>
              )
            })}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-3">
        {EFFECTS.map((e) => <Toggle key={e.id} on={effect === e.id} onClick={() => setEffect(e.id)}>{e.label}</Toggle>)}
        <span className="mx-1" />
        <Toggle on={onlyWild} onClick={() => setOnlyWild(!onlyWild)}>Solo los que aparecen salvajes</Toggle>
      </div>
      <p className="text-sm text-ink-dim mb-3">{EFFECTS.find((e) => e.id === effect)?.why}</p>
      <div className="space-y-4">
        {entries.map((k) => {
          const mv = data.moves[k.move]
          const learners = k.learners
            .map(([id, lv]) => ({ mon: data.byId.get(id)!, lv }))
            .filter((x) => x.mon && !x.mon.tags.length && (!onlyWild || x.mon.sp.length) && !x.mon.id.includes('mega') && !x.mon.id.includes('gmax'))
          const byLevel = learners.filter((x) => x.lv !== null).sort((a, b) => a.lv! - b.lv!)
          const byTm = learners.filter((x) => x.lv === null)
          return (
            <div key={k.move} className="bg-screen border-2 border-black p-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-pixel text-lg">{mv.es}</span>
                <span className="text-ink-dim">({mv.en})</span>
                <TypeChip type={mv.type} small />
                <span className="text-sm text-ink-dim">{k.note}</span>
              </div>
              <div className="text-sm text-ink-dim mt-1">Por nivel: {byLevel.length} · Con MT o tutor: {byTm.length}</div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2 mt-2">
                {byLevel.slice(0, 12).map(({ mon, lv }) => <LearnerCard key={mon.id} mon={mon} lv={lv} />)}
              </div>
              {byTm.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-led">Ver los {byTm.length} que lo aprenden con MT o tutor</summary>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {byTm.map(({ mon }) => <Link key={mon.id} to={`/pokemon/${mon.id}`} className="text-sm bg-screen-3 px-1.5 hover:bg-dex-red">{mon.es}</Link>)}
                  </div>
                </details>
              )}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

function LearnerCard({ mon, lv }: { mon: Mon; lv: number | null }) {
  const data = useData()
  const first = spawnRows(data, mon)[0]
  return (
    <Link to={`/pokemon/${mon.id}`} className="flex items-center gap-2 bg-screen-2 border border-black p-1.5 hover:border-dex-red-light">
      <Icon id={mon.id} size={1} />
      <div className="min-w-0 text-sm">
        <div><b>{mon.es}</b> <span className="font-pixel text-led">Nv. {lv}</span></div>
        <div className="text-xs text-ink-dim truncate">{first ? <>{first.label} · <LightBadge l={first.light} /></> : 'Por evolución'}</div>
      </div>
    </Link>
  )
}

function BallsSection() {
  return (
    <div className="grid xl:grid-cols-2 gap-5">
      <Panel title="Balls: cuál fabricar">
        <ul className="space-y-2">
          {BALLS.filter((b) => b.id !== 'master').map((b) => (
            <li key={b.id} className="flex items-start gap-3">
              <img src={b.icon} alt="" className="pixelated w-8 h-8" />
              <div className="flex-1">
                <Bilingual es={b.es} en={b.en} className="font-semibold" />
                <p className="text-sm text-ink-dim">{b.rule}</p>
                {b.recipe && (
                  <p className="text-sm">Tapa: {b.recipe} {!b.recipeVerified && <Unverified>Receta de Pixelmon, sin verificar</Unverified>}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="text-sm text-ink-dim mt-3">Fabricación (sin forma fija): tapa + botón de piedra + base de hierro. La base son 3 lingotes de hierro en fila y salen 5. Cocina los bonguris en horno, ahumador o fogata antes de hacer la tapa.</p>
      </Panel>
      <Panel title="Bonguris: qué cultivar">
        <table className="w-full text-sm">
          <thead className="font-pixel text-xs text-ink-dim text-left"><tr><th className="pb-1">#</th><th>Color</th><th>Dónde crece</th><th>Para qué</th></tr></thead>
          <tbody>
            {APRICORNS.map((a) => (
              <tr key={a.color} className="border-t border-screen-3 align-top">
                <td className="py-1.5 font-pixel">{a.priority}</td>
                <td className="py-1.5 pr-2 whitespace-nowrap"><span className="inline-block w-3.5 h-3.5 mr-1.5 align-middle border-2 border-black" style={{ background: a.hex }} />{a.color}</td>
                <td className="py-1.5 pr-2">{a.biomes}</td>
                <td className="py-1.5 text-ink-dim">{a.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm text-ink-dim mt-3">El árbol tiene 4 fases; en la última, clic derecho para cosechar. A veces da un brote: llévatelo a tu base. El Bosque de flores da azul, verde y rosa a la vez. Proporción recomendada: la mitad rojos, y el resto azules y amarillos a partes iguales.</p>
        <p className="text-sm mt-1"><Unverified>Comprueba si un brote crece fuera de su bioma</Unverified></p>
      </Panel>
    </div>
  )
}
