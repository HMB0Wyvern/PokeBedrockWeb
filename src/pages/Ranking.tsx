import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useData } from '../App'
import type { Data, Mon } from '../lib/data'
import { GRADE_INFO, GRADES, gradeRank } from '../lib/build'
import { STAT_ES, TYPE_ES, TYPES } from '../lib/poke'
import { Bilingual, GradeBadge, Icon, Panel, Stars, Tabs, Toggle, TypeChip } from '../components/ui'

type TabId = 'mejores' | 'tipo' | 'stats' | 'habilidades'
const TABS = [['mejores', 'Los mejores'], ['tipo', 'Por tipo'], ['stats', 'Por estadística'], ['habilidades', 'Habilidades top']] as const

/** Primer Pokémon de la línea evolutiva que aparece salvaje (lo que hay que capturar). */
function catchable(data: Data, mon: Mon): Mon | null {
  let c: Mon | undefined = mon
  while (c) {
    if (c.sp.length) return c
    c = c.pre ? data.byId.get(c.pre) : undefined
  }
  return null
}

const isForm = (m: Mon) => ['mega', 'gmax', 'totem', 'forma'].includes(m.obtain) || /-(mega|gmax|totem|primal)/.test(m.sprite)

export default function Ranking() {
  const data = useData()
  const [params, setParams] = useSearchParams()
  const tab = (TABS.some(([k]) => k === params.get('t')) ? params.get('t') : 'mejores') as TabId
  const [wildOnly, setWildOnly] = useState(true)
  const [legends, setLegends] = useState(false)
  const [type, setType] = useState<string | null>(null)

  // Pokémon totalmente evolucionados (lo que vas a usar), con filtros
  const pool = useMemo(
    () =>
      data.index.filter((m) => !m.fin.length && !isForm(m) && (legends || !m.tags.length) && (!wildOnly || catchable(data, m)) && (!type || m.types.includes(type))),
    [data, wildOnly, legends, type],
  )
  const ranked = useMemo(() => [...pool].sort((a, b) => gradeRank(a.grade) - gradeRank(b.grade) || b.bst - a.bst), [pool])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-pixel text-3xl">Los mejores</h1>
          <p className="text-ink-dim">Qué Pokémon merece la pena tener, ordenados por nivel competitivo y estadísticas.</p>
        </div>
        <Tabs tabs={TABS} value={tab} onChange={(t) => setParams(t === 'mejores' ? {} : { t }, { replace: true })} />
      </div>

      {tab !== 'habilidades' && (
        <div className="screen p-3 flex flex-wrap items-center gap-2">
          <Toggle on={wildOnly} onClick={() => setWildOnly(!wildOnly)}>Solo los que puedo capturar</Toggle>
          <Toggle on={legends} onClick={() => setLegends(!legends)}>Incluir legendarios</Toggle>
          {tab === 'mejores' && (
            <>
              <span className="w-px h-6 bg-black mx-1" />
              <Toggle on={!type} onClick={() => setType(null)}>Todos los tipos</Toggle>
              {TYPES.map((t) => (
                <button key={t} aria-pressed={type === t} onClick={() => setType(type === t ? null : t)} className={`transition-opacity ${type && type !== t ? 'opacity-40 hover:opacity-80' : ''}`}>
                  <TypeChip type={t} small />
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {tab === 'mejores' && <Best data={data} ranked={ranked} />}
      {tab === 'tipo' && <ByType pool={pool} />}
      {tab === 'stats' && <ByStat pool={pool} />}
      {tab === 'habilidades' && <TopAbilities data={data} />}
    </div>
  )
}

function CatchHint({ data, mon }: { data: Data; mon: Mon }) {
  const c = catchable(data, mon)
  if (!c) return <span className="text-ink-dim">No sale salvaje</span>
  if (c.id === mon.id) return <span className="text-good">Sale salvaje</span>
  return <span>Captura a <Link to={`/pokemon/${c.id}`} className="text-led underline">{c.es}</Link></span>
}

function Best({ data, ranked }: { data: Data; ranked: Mon[] }) {
  const [shown, setShown] = useState(60)
  const podium = ranked.slice(0, 3)
  const byGrade = GRADES.map((g) => ({ g, n: ranked.filter((m) => m.grade === g).length }))
  return (
    <>
      <div className="grid md:grid-cols-3 gap-4">
        {podium.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Link to={`/pokemon/${m.id}`} className="screen p-4 flex items-center gap-4 hover:border-dex-red-light">
              <span className="font-pixel text-4xl text-ink-dim w-10">{i + 1}</span>
              <Icon id={m.id} size={2.5} />
              <div className="min-w-0">
                <div className="font-pixel text-xl truncate">{m.es}</div>
                <div className="flex gap-1 my-1">{m.types.map((t) => <TypeChip key={t} type={t} small />)}</div>
                <div className="text-sm"><CatchHint data={data} mon={m} /></div>
              </div>
              <span className="ml-auto"><GradeBadge g={m.grade} big /></span>
            </Link>
          </motion.div>
        ))}
      </div>

      <Panel title={`${ranked.length} Pokémon`} right={
        <div className="hidden md:flex items-center gap-3 text-sm text-ink-dim">
          {byGrade.map(({ g, n }) => <span key={g} className="inline-flex items-center gap-1"><GradeBadge g={g} /> {n}</span>)}
        </div>
      }>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full text-left">
            <thead className="font-pixel text-xs text-ink-dim">
              <tr>
                <th className="pb-2 w-10">#</th>
                <th className="pb-2">Pokémon</th>
                <th className="pb-2">Nota</th>
                <th className="pb-2 hidden md:table-cell">Estadísticas</th>
                <th className="pb-2 text-right">Total</th>
                <th className="pb-2 pl-4">Cómo conseguirlo</th>
              </tr>
            </thead>
            <tbody>
              {ranked.slice(0, shown).map((m, i) => (
                <tr key={m.id} className="border-t border-screen-3 hover:bg-screen/60">
                  <td className="py-1.5 font-pixel text-ink-dim">{i + 1}</td>
                  <td className="py-1.5">
                    <Link to={`/pokemon/${m.id}`} className="flex items-center gap-2">
                      <Icon id={m.id} size={1} />
                      <span className="font-semibold">{m.es}</span>
                      <span className="hidden sm:flex gap-1">{m.types.map((t) => <TypeChip key={t} type={t} small />)}</span>
                    </Link>
                  </td>
                  <td className="py-1.5"><GradeBadge g={m.grade} /></td>
                  <td className="py-1.5 hidden md:table-cell"><MiniStats mon={m} /></td>
                  <td className="py-1.5 text-right font-pixel">{m.bst}</td>
                  <td className="py-1.5 pl-4 text-sm"><CatchHint data={data} mon={m} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {shown < ranked.length && <button className="mc-btn px-4 py-1.5 mt-3" onClick={() => setShown(shown + 60)}>Ver más</button>}
        <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-5 gap-2 text-sm">
          {GRADES.map((g) => <div key={g} className="flex items-start gap-2"><GradeBadge g={g} /><span className="text-ink-dim">{GRADE_INFO[g].text}</span></div>)}
        </div>
        <p className="text-xs text-ink-dim mt-2">La nota sale de las clasificaciones de Smogon que usa Showdown, el simulador de combate de PokeBedrock. Sin nota = no se juega en competitivo (suele ser flojo).</p>
      </Panel>
    </>
  )
}

/** Seis barritas verticales con las estadísticas (una sola tinta, la más alta resaltada). */
function MiniStats({ mon }: { mon: Mon }) {
  const max = Math.max(...mon.stats)
  return (
    <span className="inline-flex items-end gap-[2px] h-6" title={mon.stats.map((s, i) => `${STAT_ES[i]} ${s}`).join(' · ')}>
      {mon.stats.map((s, i) => (
        <span key={i} className="w-2 rounded-t-[2px]" style={{ height: `${Math.max(8, (s / 180) * 100)}%`, background: s === max ? 'var(--color-led)' : '#4f8fb3' }} />
      ))}
    </span>
  )
}

function ByType({ pool }: { pool: Mon[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3">
      {TYPES.map((t) => {
        const top = pool.filter((m) => m.types.includes(t)).sort((a, b) => gradeRank(a.grade) - gradeRank(b.grade) || b.bst - a.bst).slice(0, 5)
        return (
          <section key={t} className="screen p-3">
            <div className="flex items-center justify-between mb-2"><TypeChip type={t} /><span className="text-xs text-ink-dim">Top 5</span></div>
            <ol className="space-y-1">
              {top.map((m, i) => (
                <li key={m.id}>
                  <Link to={`/pokemon/${m.id}`} className="flex items-center gap-2 hover:bg-screen-3 px-1">
                    <span className="font-pixel text-ink-dim w-3">{i + 1}</span>
                    <Icon id={m.id} size={0.8} />
                    <span className="text-sm font-semibold truncate flex-1">{m.es}</span>
                    <GradeBadge g={m.grade} />
                  </Link>
                </li>
              ))}
              {!top.length && <li className="text-sm text-ink-dim">Ninguno con estos filtros</li>}
            </ol>
          </section>
        )
      })}
      <p className="text-xs text-ink-dim sm:col-span-full">Nombres de tipo: {TYPES.map((t) => TYPE_ES[t]).join(', ')}.</p>
    </div>
  )
}

function ByStat({ pool }: { pool: Mon[] }) {
  const STATS = [
    { i: 5, title: 'Los más rápidos', hint: 'Atacan primero.' },
    { i: 1, title: 'Más Ataque', hint: 'Los que más pegan con ataques físicos.' },
    { i: 3, title: 'Más Ataque Especial', hint: 'Los que más pegan con ataques especiales.' },
    { i: 0, title: 'Más vida (PS)', hint: 'Aguantan mucho.' },
    { i: 2, title: 'Más Defensa', hint: 'Aguantan golpes físicos.' },
    { i: 4, title: 'Más Defensa Especial', hint: 'Aguantan golpes especiales.' },
  ]
  return (
    <div className="grid lg:grid-cols-2 2xl:grid-cols-3 gap-5">
      {STATS.map(({ i, title, hint }) => {
        const top = [...pool].sort((a, b) => b.stats[i] - a.stats[i]).slice(0, 10)
        const max = top[0]?.stats[i] ?? 1
        return (
          <Panel key={i} title={title} right={<span className="text-xs text-ink-dim">{hint}</span>}>
            <ol className="space-y-1.5">
              {top.map((m) => (
                <li key={m.id}>
                  <Link to={`/pokemon/${m.id}`} className="grid grid-cols-[32px_minmax(90px,140px)_1fr_36px] items-center gap-2 hover:bg-screen-3/50" title={`${STAT_ES[i]}: ${m.stats[i]}`}>
                    <Icon id={m.id} size={0.8} />
                    <span className="text-sm font-semibold truncate">{m.es}</span>
                    <span className="h-3 bg-screen"><motion.span className="block h-full rounded-r-[4px]" style={{ background: '#4f8fb3' }} initial={{ width: 0 }} animate={{ width: `${(m.stats[i] / max) * 100}%` }} transition={{ duration: 0.5 }} /></span>
                    <span className="font-pixel text-right">{m.stats[i]}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </Panel>
        )
      })}
    </div>
  )
}

function TopAbilities({ data }: { data: Data }) {
  const [shown, setShown] = useState(30)
  const list = useMemo(() => {
    const holders = new Map<string, Mon[]>()
    for (const m of data.index) {
      if (isForm(m) || m.tags.length) continue
      for (const a of m.abil) holders.set(a, [...(holders.get(a) ?? []), m])
    }
    return Object.entries(data.abilities)
      .filter(([id, a]) => (a.rating ?? 0) >= 3 && holders.has(id))
      .map(([id, a]) => ({ id, a, mons: holders.get(id)!.filter((m) => !m.fin.length).sort((x, y) => gradeRank(x.grade) - gradeRank(y.grade) || y.bst - x.bst) }))
      .filter((x) => x.mons.length)
      .sort((x, y) => (y.a.rating ?? 0) - (x.a.rating ?? 0) || y.mons.length - x.mons.length)
  }, [data])
  return (
    <Panel title="Las habilidades más útiles" right={<span className="text-sm text-ink-dim">y qué Pokémon las tienen</span>}>
      <div className="grid xl:grid-cols-2 gap-3">
        {list.slice(0, shown).map(({ id, a, mons }) => (
          <div key={id} className="bg-screen border-2 border-black p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Bilingual es={a.es} en={a.en} className="font-semibold" />
              <Stars n={a.rating ?? 0} />
            </div>
            {a.desc && <p className="text-sm text-ink-dim mt-1">{a.desc}</p>}
            <div className="flex flex-wrap gap-1 mt-2">
              {mons.slice(0, 10).map((m) => (
                <Link key={m.id} to={`/pokemon/${m.id}?tab=usar`} title={m.es} className="flex items-center gap-1 px-1 bg-screen-2 border border-black hover:border-dex-red-light text-xs">
                  <Icon id={m.id} size={0.6} /> {m.es}
                </Link>
              ))}
              {mons.length > 10 && <span className="text-xs text-ink-dim self-center">+{mons.length - 10}</span>}
            </div>
          </div>
        ))}
      </div>
      {shown < list.length && <button className="mc-btn px-4 py-1.5 mt-3" onClick={() => setShown(shown + 30)}>Ver más</button>}
      <p className="text-xs text-ink-dim mt-3">Estrellas: valoración de Showdown (5 = cambia el combate por sí sola). Solo se muestran las de 3 estrellas o más.</p>
    </Panel>
  )
}
