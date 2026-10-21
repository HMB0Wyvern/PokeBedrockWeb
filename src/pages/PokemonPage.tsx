import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useData } from '../App'
import { loadDetail, useAsync, type Chain, type Data, type Detail, type Mon, type MoveSet } from '../lib/data'
import { ABILITY_IMMUNITY, defenseProfile, LOC_ES, multLabel, OBTAIN_ES, STAT_ES, TYPE_ES, VERDICT } from '../lib/poke'
import { computedMoves, evPlan, GRADE_INFO, howLearn, rankAbilities, recommendItems, recommendNature, roleOf, ROLE_ES } from '../lib/build'
import { BALLS, catchChance, type CatchInput } from '../lib/catch'
import { spawnRows } from '../lib/spawn'
import { takenMult } from '../lib/team'
import { Art, Bilingual, CAT_ES, GradeBadge, Icon, ItemBySid, ItemName, LightBadge, MoveTable, MoveTag, Panel, RarityBadge, Stars, StatProfile, Tabs, TypeChip, Unverified, useObjetivos, VerdictBadge } from '../components/ui'

export default function PokemonPage() {
  const { id = '' } = useParams()
  const data = useData()
  const mon = data.byId.get(id)
  const { data: detail } = useAsync(() => loadDetail(id), [id])
  if (!mon) return <Panel title="No encontrado">No existe ese Pokémon en la Pokédex de PokeBedrock.</Panel>
  return <MonView key={id} mon={mon} detail={detail} />
}

type TabId = 'resumen' | 'usar' | 'combate' | 'ataques' | 'mas'
const TABS = [['resumen', 'Resumen'], ['usar', '★ Cómo usarlo'], ['combate', 'Debilidades y equipo'], ['ataques', 'Ataques'], ['mas', 'Evolución y más']] as const

function MonView({ mon, detail }: { mon: Mon; detail?: Detail }) {
  const data = useData()
  const obj = useObjetivos()
  const [params, setParams] = useSearchParams()
  const tab = (TABS.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'resumen') as TabId
  const setTab = (t: TabId) => setParams(t === 'resumen' ? {} : { tab: t }, { replace: true })
  const finals = mon.fin.map((f) => data.byId.get(f)!).filter(Boolean)
  const legend = mon.tags[0]
  const g = mon.grade ?? mon.fgrade
  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} className="shrink-0 w-48 h-48 grid place-items-center bg-screen border-2 border-black mc-bevel">
            <Art mon={mon} className="w-44 h-44" />
          </motion.div>
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <div className="font-pixel text-ink-dim">#{String(mon.num).padStart(4, '0')} {detail?.genus ? `· ${detail.genus}` : ''}</div>
              <h1 className="font-pixel text-4xl leading-tight">
                {mon.es} {mon.name !== mon.es && <span className="text-xl text-ink-dim">({mon.name})</span>}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {mon.types.map((t) => <TypeChip key={t} type={t} />)}
                {legend && <span className="font-pixel text-xs px-2 py-0.5 bg-dex-red mc-bevel">{LEGEND_ES[legend] ?? legend}</span>}
                {mon.ride && <span className="font-pixel text-xs px-2 py-0.5 bg-screen-3 mc-bevel">Montable ({mon.ride})</span>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <VerdictBadge v={mon.verdict} big />
              <span className="text-ink-dim">{VERDICT[mon.verdict].text}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => obj.toggle(mon.id)} aria-pressed={obj.has(mon.id)} className="mc-btn px-3 py-1.5">
                {obj.has(mon.id) ? '★ En mis objetivos' : '☆ Añadir a objetivos'}
              </button>
              <Link to={`/capturar?p=${mon.id}`} className="mc-btn px-3 py-1.5">◓ Calcular captura</Link>
              <Link to={`/combatir?r=${mon.id}`} className="mc-btn px-3 py-1.5">⚔ ¿Cómo le gano?</Link>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <Fact k="Tasa de captura" v={mon.cr ?? '—'} hint="De 3 (muy difícil) a 255 (muy fácil). Valor estándar de los juegos." />
              <Fact k="Nivel salvaje" v={mon.sp.length ? `${mon.lv[0]}–${mon.lv[1]}` : '—'} />
              <Fact k="Peso" v={`${mon.wt} kg`} />
              <Fact k="Velocidad base" v={mon.stats[5]} hint="Rapid Ball ×4 si es 100 o más" />
            </dl>
          </div>
          {g && (
            <div className="shrink-0 bg-screen border-2 border-black p-3 w-full md:w-56 text-center space-y-1">
              <div className="text-xs text-ink-dim">Nivel competitivo{!mon.grade ? ' (al evolucionar)' : ''}</div>
              <div className="flex justify-center"><GradeBadge g={g} big /></div>
              <p className="text-xs text-ink-dim">{GRADE_INFO[g].text}</p>
              <Link to="/ranking" className="text-xs text-led underline">Ver los mejores →</Link>
            </div>
          )}
        </div>
      </Panel>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'resumen' && (
        <div className="grid xl:grid-cols-2 gap-5">
          <div className="space-y-5">
            <WorthIt mon={mon} finals={finals} />
            <WhereSection mon={mon} />
            <CatchSection mon={mon} />
          </div>
          <div className="space-y-5">
            <Panel title="Estadísticas"><StatProfile data={data} mon={mon} /></Panel>
            {detail && <QuickBuild mon={mon} detail={detail} onMore={() => setTab('usar')} />}
          </div>
        </div>
      )}
      {tab === 'usar' && (detail ? <BuildSection mon={mon} detail={detail} /> : <Panel>Cargando…</Panel>)}
      {tab === 'combate' && (
        <div className="grid xl:grid-cols-2 gap-5">
          <Weakness mon={mon} />
          <VsTeam mon={mon} />
        </div>
      )}
      {tab === 'ataques' && detail && <Moves detail={detail} mon={mon} />}
      {tab === 'mas' && detail && (
        <div className="grid xl:grid-cols-2 gap-5">
          <div className="space-y-5">
            <Evolution detail={detail} current={mon.id} />
            {detail.desc && <Panel title="Entrada de la Pokédex"><p className="text-ink-dim italic">{detail.desc}</p></Panel>}
          </div>
          <div className="space-y-5">
            <MoreFacts mon={mon} detail={detail} />
            {detail.drops.length > 0 && <Drops detail={detail} />}
          </div>
        </div>
      )}
    </div>
  )
}

/** Resumen corto de "Cómo usarlo" para la pestaña principal. */
function QuickBuild({ mon, detail, onMore }: { mon: Mon; detail: Detail; onMore: () => void }) {
  const data = useData()
  const set = detail.sets[0]
  const abil = rankAbilities(data, detail)[0]
  const item = recommendItems(mon, set)[0]
  const nat = recommendNature(mon, set)
  const nature = data.natures.find((n) => n.id === nat.id)
  return (
    <Panel title="Lo mejor para él" right={<button onClick={onMore} className="text-sm text-led underline">Ver todo →</button>}>
      <dl className="grid sm:grid-cols-3 gap-2">
        <div className="bg-screen border-2 border-black p-2">
          <dt className="text-xs text-ink-dim mb-1">Mejor habilidad</dt>
          <dd><Bilingual es={abil?.a?.es ?? abil?.id ?? '—'} en={abil?.a?.en} className="font-semibold" /><div><Stars n={abil?.rating ?? 0} /></div></dd>
        </div>
        <div className="bg-screen border-2 border-black p-2">
          <dt className="text-xs text-ink-dim mb-1">Mejor objeto</dt>
          <dd>{item ? <ItemBySid data={data} sid={item.sid} /> : '—'}</dd>
        </div>
        <div className="bg-screen border-2 border-black p-2">
          <dt className="text-xs text-ink-dim mb-1">Naturaleza</dt>
          <dd>{nature && <><Bilingual es={nature.es} en={nature.en} className="font-semibold" /><div className="text-xs"><span className="text-good">+{nature.plusEs}</span> <span className="text-bad">−{nature.minusEs}</span></div></>}</dd>
        </div>
      </dl>
    </Panel>
  )
}

function BuildSection({ mon, detail }: { mon: Mon; detail: Detail }) {
  const data = useData()
  const [si, setSi] = useState(0)
  const set: MoveSet | undefined = detail.sets[si]
  const role = roleOf(mon, set)
  const roleInfo = ROLE_ES[role] ?? { es: role, text: '' }
  const moves = set ? set.moves : computedMoves(data, mon, detail)
  const items = recommendItems(mon, set)
  const nat = recommendNature(mon, set)
  const nature = data.natures.find((n) => n.id === nat.id)
  const evs = evPlan(mon, set)
  const abil = rankAbilities(data, detail)
  const finals = mon.fin.map((f) => data.byId.get(f)!).filter(Boolean)
  return (
    <div className="space-y-5">
      {finals.length > 0 && (
        <div className="screen p-3 flex flex-wrap items-center gap-2 text-sm">
          <span>Aún evoluciona. Lo importante es cómo usar su forma final:</span>
          {finals.map((f) => <Link key={f.id} to={`/pokemon/${f.id}?tab=usar`} className="mc-btn px-2 py-0.5 inline-flex items-center gap-1"><Icon id={f.id} size={0.75} /> {f.es}</Link>)}
        </div>
      )}
      <div className="grid xl:grid-cols-2 gap-5">
        <Panel title="Su papel en el equipo" right={detail.sets.length > 1 ? (
          <div className="flex flex-wrap gap-1">{detail.sets.map((s, i) => <button key={i} aria-pressed={si === i} onClick={() => setSi(i)} className="mc-btn px-2 py-0.5 text-sm">{ROLE_ES[s.role]?.es ?? s.role}</button>)}</div>
        ) : undefined}>
          <div className="font-pixel text-2xl text-led">{roleInfo.es}</div>
          <p className="text-ink-dim mt-1">{roleInfo.text}</p>
          <h3 className="font-pixel mt-4 mb-2">Ataques recomendados {set && set.moves.length > 4 && <span className="text-sm text-ink-dim font-sans">(elige 4 de estos)</span>}</h3>
          <ul className="space-y-1.5">
            {moves.map((id) => {
              const mv = data.moves[id]
              if (!mv) return null
              const how = howLearn(detail, id)
              return (
                <li key={id} className="flex flex-wrap items-center gap-2" title={mv.desc}>
                  <MoveTag mv={mv} />
                  <TypeChip type={mv.type} small />
                  <span className="text-xs text-ink-dim">{CAT_ES[mv.cat]}{mv.pow > 1 ? ` · ${mv.pow}` : ''}</span>
                  <span className={`ml-auto font-pixel text-xs px-1.5 border ${how ? 'border-good/60 text-good' : 'border-bad/60 text-bad'}`}>{how ?? 'No lo aprende aquí'}</span>
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-ink-dim mt-3">
            {set ? 'Basado en los sets que usa el simulador Showdown (el mismo motor de combate de PokeBedrock).' : 'Calculado con sus ataques más fuertes de tipos distintos.'} "Nv." = lo aprende subiendo de nivel; "MT" = con máquina técnica; "Tutor" = Tutor de movimientos.
          </p>
        </Panel>

        <Panel title="Habilidades (de mejor a peor)">
          <ul className="space-y-3">
            {abil.map(({ slot, id, a, used, rating }, i) => (
              <li key={slot} className={`p-2 border-2 ${i === 0 ? 'border-good/70 bg-good/5' : 'border-black bg-screen'}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Bilingual es={a?.es ?? id} en={a?.en} className="font-semibold" />
                  <Stars n={rating} />
                  {used && <span className="font-pixel text-xs px-1.5 bg-good text-black">Recomendada</span>}
                  {slot === 'H' && <span className="font-pixel text-xs text-warn" title="Habilidad oculta: se puede cambiar con /pokebuilder (250 fichas)">Oculta</span>}
                </div>
                {a?.desc && <p className="text-sm text-ink-dim mt-1">{a.desc}</p>}
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-dim mt-2">Estrellas: utilidad general de la habilidad según Showdown. Se puede cambiar con <code>/pokebuilder</code> (250 fichas).</p>
        </Panel>

        <Panel title="Objetos que ponerle">
          <ol className="space-y-3">
            {items.map((it, i) => (
              <li key={it.sid} className="flex gap-3 items-start">
                <span className="font-pixel text-xl text-ink-dim w-6 shrink-0">{i + 1}.</span>
                <ItemBySid data={data} sid={it.sid}>{it.why}</ItemBySid>
              </li>
            ))}
          </ol>
          <p className="text-xs text-ink-dim mt-3">Muchos se compran con puntos de batalla en la Torre Batalla. <Link to="/objetos" className="text-led underline">Ver todos los objetos →</Link></p>
        </Panel>

        <Panel title="Naturaleza y EVs">
          {nature && (
            <div className="flex flex-wrap items-baseline gap-2">
              <Bilingual es={nature.es} en={nature.en} className="font-pixel text-2xl" />
              <span className="text-good">+{nature.plusEs}</span>
              <span className="text-bad">−{nature.minusEs}</span>
            </div>
          )}
          <p className="text-ink-dim mt-1">{nat.why}</p>
          <h3 className="font-pixel mt-4 mb-1">Dónde poner los EVs</h3>
          <div className="flex flex-wrap gap-2">
            {evs.stats.map((s) => <span key={s} className="px-2 py-1 bg-screen border-2 border-black font-semibold">{STAT_ES[s]} <span className="font-pixel text-ink-dim">252</span></span>)}
          </div>
          <p className="text-ink-dim mt-1">{evs.why}</p>
          <p className="text-xs text-ink-dim mt-3">La naturaleza se cambia con <code>/pokebuilder</code>. Los EVs se ganan derrotando Pokémon, con vitaminas o con <code>/pokebuilder</code>. <Link to="/guias?g=ivs" className="text-led underline">¿Qué son los EVs?</Link></p>
        </Panel>
      </div>
    </div>
  )
}

function MoreFacts({ mon, detail }: { mon: Mon; detail: Detail }) {
  const evs = Object.entries(detail.ev).filter(([, v]) => v > 0)
  const EV_ES: Record<string, string> = { hp: 'PS', atk: 'Ataque', def: 'Defensa', spa: 'At. Esp.', spd: 'Def. Esp.', spe: 'Velocidad' }
  return (
    <Panel title="Más datos">
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Fact k="EVs que da al derrotarlo" v={<span className="text-base">{evs.map(([k, v]) => `${v} ${EV_ES[k] ?? k}`).join(', ') || '—'}</span>} />
        <Fact k="Grupos huevo" v={<span className="text-base">{detail.eggGroups.join(', ') || '—'}</span>} />
        <Fact k="Género" v={<span className="text-base">{detail.gender ? `${Math.round(detail.gender.M * 100)} % ♂ · ${Math.round(detail.gender.F * 100)} % ♀` : 'Sin género'}</span>} />
        <Fact k="Altura" v={`${detail.height} m`} />
        <Fact k="Tier de Smogon" v={mon.tier ?? '—'} hint="Clasificación competitiva: Uber > OU > UU > RU > NU > PU > ZU. NFE = aún evoluciona." />
        <Fact k="Cómo se consigue" v={<span className="text-base">{OBTAIN_ES[mon.obtain]}</span>} />
      </dl>
    </Panel>
  )
}

const LEGEND_ES: Record<string, string> = { 'Sub-Legendary': 'Legendario', 'Restricted Legendary': 'Legendario mayor', Mythical: 'Singular', 'Ultra Beast': 'Ultraente', Paradox: 'Paradoja' }

function Fact({ k, v, hint }: { k: string; v: React.ReactNode; hint?: string }) {
  return (
    <div className="bg-screen border border-black px-2 py-1" title={hint}>
      <dt className="text-ink-dim text-xs">{k}</dt>
      <dd className="font-pixel text-lg">{v}</dd>
    </div>
  )
}

function WorthIt({ mon, finals }: { mon: Mon; finals: Mon[] }) {
  return (
    <Panel title="¿Merece la pena?">
      <p className="mb-3">
        {finals.length ? (
          <>Lo que importa es en qué se convierte. Su evolución final suma <b className="font-pixel">{mon.finalBst}</b> puntos de estadísticas (él ahora {mon.bst}).</>
        ) : (
          <>No evoluciona más. Suma <b className="font-pixel">{mon.bst}</b> puntos de estadísticas.</>
        )}{' '}
        Referencia: 600+ top · 500–599 muy bueno · 450–499 aceptable · menos, relleno.
        {(mon.grade ?? mon.fgrade) && <> También cuenta su nivel competitivo (<b className="font-pixel">{mon.grade ?? mon.fgrade}</b>): con nota S o A sube a Top aunque sus números sean más bajos.</>}
      </p>
      {finals.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {finals.map((f) => (
            <Link key={f.id} to={`/pokemon/${f.id}`} className="flex items-center gap-2 bg-screen border-2 border-black px-2 py-1 hover:border-dex-red-light">
              <Icon id={f.id} size={1} />
              <span className="font-semibold">{f.es}</span>
              <span className="font-pixel text-ink-dim">{f.bst}</span>
              <VerdictBadge v={f.verdict} />
            </Link>
          ))}
        </div>
      )}
      <p className="text-sm text-ink-dim mt-3">Aunque sea flojo, captúralo con Poké Balls baratas: las misiones de Evoluciones y Campeón Elemental piden muchas especies distintas y dan llaves de cajas.</p>
    </Panel>
  )
}

function WhereSection({ mon }: { mon: Mon }) {
  const data = useData()
  const rows = spawnRows(data, mon)
  if (!rows.length)
    return (
      <Panel title="Dónde conseguirlo">
        <p>{OBTAIN_ES[mon.obtain]}.</p>
        {mon.obtain === 'evolucion' && <EvolvesFromHint mon={mon} />}
      </Panel>
    )
  return (
    <Panel title="Dónde aparece" right={<span className="text-sm text-ink-dim">Nivel {mon.lv[0]}–{mon.lv[1]}</span>}>
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full text-left text-sm">
          <thead className="font-pixel text-xs text-ink-dim"><tr><th className="pb-1">Bioma</th><th>Cuándo</th><th>Dónde</th><th>Rareza</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-screen-3 align-top">
                <td className="py-1.5 pr-2">
                  <span className="font-semibold">{r.label}</span>
                  {r.biomes.length > 1 && <span className="block text-xs text-ink-dim">{r.biomes.length} biomas: {r.biomes.slice(0, 4).map((b) => data.biomes.find((x) => x.id === b)?.es ?? b).join(', ')}{r.biomes.length > 4 ? '…' : ''}</span>}
                  {r.dubious && <span className="block mt-0.5"><Unverified>Spawn dudoso: no coincide con ningún bioma real</Unverified></span>}
                </td>
                <td className="py-1.5 pr-2"><LightBadge l={r.light} /></td>
                <td className="py-1.5 pr-2">{LOC_ES[r.loc] ?? r.loc}</td>
                <td className="py-1.5"><RarityBadge r={r.rarity} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-dim mt-2">"De noche" en realidad significa poca luz: también vale en cuevas o bajo tierra a cualquier hora.</p>
    </Panel>
  )
}

function EvolvesFromHint({ mon }: { mon: Mon }) {
  const data = useData()
  const { data: d } = useAsync(() => loadDetail(mon.id), [mon.id])
  if (!d?.from) return null
  const pre = data.byId.get(d.from.id)
  return pre ? <p className="mt-2">Evoluciona de <Link className="text-led underline" to={`/pokemon/${pre.id}`}>{pre.es}</Link>: {d.from.how}.</p> : null
}

function CatchSection({ mon }: { mon: Mon }) {
  const scenarios: { label: string; input: Partial<CatchInput> }[] = [
    { label: 'Turno 1, vida llena', input: { hpPct: 100, turn: 1 } },
    { label: 'Poca vida (10 %) + dormido', input: { hpPct: 10, status: 'sleep', turn: 4 } },
    { label: 'Poca vida + dormido, de noche', input: { hpPct: 10, status: 'sleep', turn: 4, night: true } },
  ]
  if (mon.cr == null) return null
  const base: CatchInput = { captureRate: mon.cr, hpPct: 100, status: 'none', turn: 1, night: false, water: false, owned: false, level: Math.round((mon.lv[0] + mon.lv[1]) / 2), types: mon.types, baseSpeed: mon.stats[5], weightKg: mon.wt, charm: false, ultraBeast: mon.tags.includes('Ultra Beast') }
  const usable = BALLS.filter((b) => b.id !== 'master' && b.id !== 'great' && b.id !== 'ultra' && b.id !== 'repeat')
  return (
    <Panel title="Cómo capturarlo" right={<Link to={`/capturar?p=${mon.id}`} className="text-sm text-led underline">Calculadora completa →</Link>}>
      <div className="grid sm:grid-cols-3 gap-2">
        {scenarios.map((s) => {
          const input = { ...base, ...s.input }
          const ranked = usable.map((b) => ({ b, p: catchChance(input, b) })).sort((a, b) => b.p - a.p)
          const best = ranked[0]
          return (
            <div key={s.label} className="bg-screen border-2 border-black p-2">
              <div className="text-xs text-ink-dim mb-1">{s.label}</div>
              <div className="flex items-center gap-2">
                <img src={best.b.icon} alt="" className="pixelated w-8 h-8" />
                <div>
                  <div className="font-semibold leading-tight">{best.b.es}</div>
                  <div className="font-pixel text-xl" style={{ color: best.p > 0.5 ? '#66bb6a' : best.p > 0.2 ? '#ffca28' : '#ef5350' }}>{Math.round(best.p * 100)} %</div>
                </div>
              </div>
              <div className="text-xs text-ink-dim mt-1">Poké Ball normal: {Math.round(ranked.find((r) => r.b.id === 'poke')!.p * 100)} %</div>
            </div>
          )
        })}
      </div>
      <p className="text-sm text-ink-dim mt-2">
        {mon.types.includes('grass') ? 'Ojo: es tipo Planta, así que Espora, Somnífero y Paralizador no le afectan. Usa Hipnosis, Bostezo u Onda Trueno.' : 'Duérmelo con Espora o Somnífero para multiplicar ×2,5.'}{' '}
        {mon.types.includes('ground') && 'Es tipo Tierra: Onda Trueno no le afecta.'}
      </p>
    </Panel>
  )
}

function bestMoveVs(data: Data, moves: string[], attacker: Mon, target: Mon) {
  let best: { id: string; mult: number; score: number } | null = null
  for (const id of moves) {
    const mv = data.moves[id]
    if (!mv || mv.cat === 'estado' || mv.pow <= 1) continue
    const mult = takenMult(data, target, mv.type)
    const score = mult * mv.pow * (attacker.types.includes(mv.type) ? 1.5 : 1)
    if (!best || score > best.score) best = { id, mult, score }
  }
  return best
}

function VsTeam({ mon }: { mon: Mon }) {
  const data = useData()
  const party = data.team.party.map((m) => ({ member: m, own: data.byId.get(m.species)! })).filter((x) => x.own)
  return (
    <Panel title="Contra mi equipo">
      <ul className="space-y-1.5">
        {party.map(({ member, own }) => {
          const best = bestMoveVs(data, member.moves, own, mon)
          const threat = Math.max(...mon.types.map((t) => takenMult(data, own, t, member.ability)))
          return (
            <li key={member.species} className="flex flex-wrap items-center gap-2 text-sm">
              <Icon id={own.id} size={1} />
              <span className="font-semibold w-24">{own.es}</span>
              {best ? (
                <span>
                  Le pega <b className={best.mult > 1 ? 'text-good' : best.mult < 1 ? 'text-bad' : ''}>{multLabel(best.mult)}</b> con <Bilingual es={data.moves[best.id].es} en={data.moves[best.id].en} />
                </span>
              ) : <span className="text-ink-dim">Sin ataques que hagan daño</span>}
              {threat > 1 && <span className="text-bad">· Cuidado: sus tipos le hacen {multLabel(threat)}</span>}
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-ink-dim mt-2">Calculado con los tipos de sus ataques; el rival puede tener ataques de otros tipos.</p>
    </Panel>
  )
}

function Weakness({ mon }: { mon: Mon }) {
  const data = useData()
  const prof = defenseProfile(data.chart, mon.types)
  const groups: [string, number[]][] = [['Muy débil', [4]], ['Débil', [2]], ['Resiste', [0.5, 0.25]], ['Inmune', [0]]]
  const abilNotes = mon.abil.map((a) => ({ a, imm: ABILITY_IMMUNITY[a] })).filter((x) => x.imm)
  return (
    <Panel title="Debilidades">
      <div className="space-y-2">
        {groups.map(([label, ms]) => {
          const ts = Object.entries(prof).filter(([, m]) => ms.includes(m))
          if (!ts.length) return null
          return (
            <div key={label} className="flex flex-wrap items-center gap-1.5">
              <span className="w-24 text-sm text-ink-dim">{label}</span>
              {ts.map(([t, m]) => (
                <span key={t} className="inline-flex items-center gap-1">
                  <TypeChip type={t} small />
                  <span className="font-pixel text-xs text-ink-dim">{multLabel(m)}</span>
                </span>
              ))}
            </div>
          )
        })}
      </div>
      {abilNotes.map(({ a, imm }) => (
        <p key={a} className="text-sm text-warn mt-2">
          Si tiene la habilidad {data.abilities[a]?.es ?? a} ({data.abilities[a]?.en ?? a}), {imm.mult === 0 ? 'es inmune' : 'recibe la mitad de daño'} a {TYPE_ES[imm.type]}.
        </p>
      ))}
      <p className="text-xs text-ink-dim mt-2">Úsalo así: sácale un Pokémon con ataques de los tipos de "Débil".</p>
    </Panel>
  )
}

function ChainNode({ node, current }: { node: Chain; current: string }) {
  const data = useData()
  const m = data.byId.get(node.id)
  if (!m) return null
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2">
      <Link to={`/pokemon/${m.id}`} className={`flex flex-col items-center px-2 py-1 border-2 ${m.id === current ? 'border-dex-red-light bg-screen-3' : 'border-black bg-screen'} hover:border-dex-red-light`}>
        <Icon id={m.id} />
        <span className="text-sm font-semibold">{m.es}</span>
        <VerdictBadge v={m.verdict} />
      </Link>
      {node.evos.length > 0 && (
        <div className="flex flex-col gap-2">
          {node.evos.map((e) => (
            <div key={e.id} className="flex flex-col md:flex-row md:items-center gap-2">
              <div className="text-xs text-ink-dim max-w-44 md:text-center">
                <span className="font-pixel text-led">→</span> {e.how}
              </div>
              <ChainNode node={e} current={current} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Evolution({ detail, current }: { detail: Detail; current: string }) {
  if (!detail.chain.evos.length) return <Panel title="Evolución"><p className="text-ink-dim">No evoluciona.</p></Panel>
  return (
    <Panel title="Evolución">
      <div className="overflow-x-auto scroll-thin pb-1"><ChainNode node={detail.chain} current={current} /></div>
    </Panel>
  )
}

function Drops({ detail }: { detail: Detail }) {
  const data = useData()
  return (
    <Panel title="Objetos que suelta">
      <ul className="space-y-2">
        {detail.drops.map((d) => (
          <li key={d.item} className="flex items-center justify-between gap-2">
            <ItemName item={data.items[d.item] ?? { es: d.item, en: d.item }} withDesc />
            <span className="font-pixel text-sm text-ink-dim whitespace-nowrap">{d.n[0] === d.n[1] ? d.n[0] : `${d.n[0]}–${d.n[1]}`} · {d.chance} %</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function Moves({ detail, mon }: { detail: Detail; mon: Mon }) {
  const data = useData()
  const [tab, setTab] = useState<'lvl' | 'tm' | 'tutor' | 'egg'>('lvl')
  const teamMember = data.team.party.find((p) => p.species === mon.id)
  const rows = useMemo(() => {
    if (tab === 'lvl') return detail.moves.lvl.map(([lv, id], i) => ({ key: `${id}${i}`, mv: data.moves[id], left: lv <= 1 ? '1' : lv, highlight: teamMember?.moves.includes(id) }))
    return detail.moves[tab].map((id) => ({ key: id, mv: data.moves[id], highlight: teamMember?.moves.includes(id) }))
  }, [tab, detail, data, teamMember])
  const tabs = [['lvl', 'Por nivel'], ['tm', 'Con MT'], ['tutor', 'Tutor'], ['egg', 'Huevo']] as const
  return (
    <Panel title="Ataques" right={
      <div className="flex gap-1">
        {tabs.map(([k, l]) => <button key={k} aria-pressed={tab === k} onClick={() => setTab(k)} className="mc-btn px-2 py-0.5 text-sm">{l} ({k === 'lvl' ? detail.moves.lvl.length : detail.moves[k].length})</button>)}
      </div>
    }>
      {tab === 'tm' && <p className="text-sm text-ink-dim mb-2">Dónde se consiguen las MT en PokeBedrock aún no está documentado. <Unverified /></p>}
      <MoveTable rows={rows.filter((r) => r.mv)} />
      <p className="text-xs text-ink-dim mt-2">Pasa el ratón por un ataque para ver su efecto. En verde, los que tu Pokémon ya sabe.</p>
    </Panel>
  )
}
