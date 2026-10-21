import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useData } from '../App'
import type { CatalogItem, Data } from '../lib/data'
import { TYPE_BOOST } from '../lib/build'
import { normalize, TYPE_ES } from '../lib/poke'
import { takenMult } from '../lib/team'
import { Bilingual, Icon, Panel, Tabs, Unverified } from '../components/ui'
import { BALLS, OTHER_BALLS } from '../lib/catch'

const RESIST: Record<string, string> = {
  occa: 'fire', passho: 'water', wacan: 'electric', rindo: 'grass', yache: 'ice', chople: 'fighting', kebia: 'poison', shuca: 'ground', coba: 'flying',
  payapa: 'psychic', tanga: 'bug', charti: 'rock', kasib: 'ghost', haban: 'dragon', colbur: 'dark', babiri: 'steel', roseli: 'fairy', chilan: 'normal',
}
const BOOST_TYPE = Object.fromEntries(Object.entries(TYPE_BOOST).map(([t, sid]) => [sid, t]))

/** Para qué miembros del equipo es útil un objeto (potenciadores, gemas y bayas de resistencia). */
function teamUse(data: Data, id: string): { who: string[]; why: string } | null {
  const raw = id.replace('pokeb:', '')
  const party = data.team.party.map((m) => ({ m, mon: data.byId.get(m.species)! })).filter((x) => x.mon)
  const atkType = BOOST_TYPE[raw.replace(/_/g, '')] ?? (raw.endsWith('_gem') ? raw.slice(0, -4) : null)
  if (atkType) {
    const who = party.filter(({ m }) => m.moves.some((mv) => data.moves[mv]?.type === atkType && data.moves[mv].cat !== 'estado')).map(({ mon }) => mon.es)
    return who.length ? { who, why: `tiene ataques de tipo ${TYPE_ES[atkType]}` } : null
  }
  const berry = raw.match(/^([a-z]+)_berry$/)?.[1]
  const resist = berry && RESIST[berry]
  if (resist) {
    const who = party.filter(({ m, mon }) => takenMult(data, mon, resist, m.ability) > 1).map(({ mon }) => mon.es)
    return who.length ? { who, why: `es débil a ${TYPE_ES[resist]}` } : null
  }
  return null
}

export default function Items() {
  const data = useData()
  const [params, setParams] = useSearchParams()
  const cats = data.itemcats
  const isBalls = params.get('c') === 'balls'
  const cat = cats.find((c) => c.id === params.get('c')) ?? cats[0]
  const [q, setQ] = useState('')
  const held = new Set(data.team.party.map((p) => p.heldItem).filter(Boolean))

  const search = useMemo(() => {
    const n = normalize(q.trim())
    if (n.length < 2) return null
    const out: { item: CatalogItem; group: string; cat: string }[] = []
    for (const c of cats) for (const g of c.groups) for (const it of g.items) {
      const info = data.items[it.id]
      if (info && (normalize(info.es).includes(n) || normalize(info.en).includes(n) || normalize(it.use).includes(n))) out.push({ item: it, group: g.title, cat: c.title })
    }
    return out
  }, [q, cats, data])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-pixel text-3xl">Objetos</h1>
          <p className="text-ink-dim">Qué hace cada objeto, cuáles merecen la pena y para quién de tu equipo.</p>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar objeto (español o inglés)…" className="bg-screen border-2 border-black px-3 py-2 w-full sm:w-80 outline-none focus:border-dex-red-light" />
      </div>

      {search ? (
        <Panel title={`${search.length} resultados`}>
          <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-2">
            {search.map(({ item, group, cat: c }) => <ItemCard key={item.id + group} data={data} item={item} held={held.has(item.id)} note={`${c} · ${group}`} />)}
          </div>
        </Panel>
      ) : (
        <>
          <Tabs
            tabs={[
              ['balls', <span className="inline-flex items-center gap-1.5"><img src={BALLS.find((b) => b.id === 'poke')!.icon} alt="" className="pixelated w-5 h-5" />Poké Balls</span>] as const,
              ...cats.map((c) => [c.id, <span className="inline-flex items-center gap-1.5">{c.icon && <img src={c.icon} alt="" className="pixelated w-5 h-5" />}{c.title}</span>] as const),
            ]}
            value={isBalls ? 'balls' : cat.id}
            onChange={(c) => setParams({ c }, { replace: true })}
          />
          {isBalls ? <BallsTab /> : <motion.div key={cat.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="screen p-4 text-ink-dim">{cat.intro}</div>
            {cat.groups.map((g) => (
              <Panel key={g.title} title={g.title}>
                {g.intro && <p className="text-sm text-ink-dim -mt-1 mb-3">{g.intro}</p>}
                <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2">
                  {[...g.items].sort((a, b) => Number(!!b.top) - Number(!!a.top)).map((it) => <ItemCard key={it.id} data={data} item={it} held={held.has(it.id)} />)}
                </div>
              </Panel>
            ))}
          </motion.div>}
        </>
      )}
    </div>
  )
}

function ItemCard({ data, item, held, note }: { data: Data; item: CatalogItem; held: boolean; note?: string }) {
  const info = data.items[item.id]
  if (!info) return null
  const use = teamUse(data, item.id)
  const owner = data.team.party.find((p) => p.heldItem === item.id)
  const base = item.base ? data.byId.get(item.base) : undefined
  return (
    <div className={`flex gap-3 p-2 border-2 ${item.top ? 'border-warn/70 bg-warn/5' : 'border-black bg-screen'}`}>
      <div className="w-10 h-10 shrink-0 grid place-items-center bg-screen-3/60">
        {info.icon ? <img src={info.icon} alt="" loading="lazy" className="pixelated w-8 h-8" /> : <span className="text-ink-dim">?</span>}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2">
          <Bilingual es={info.es} en={info.en} className="font-semibold" />
          {item.top && <span className="font-pixel text-xs text-warn" title="De los más útiles">★ Top</span>}
        </div>
        {base ? (
          <p className="text-sm text-ink-dim">
            Para <Link to={`/pokemon/${item.mega ?? base.id}`} className="text-led underline inline-flex items-center gap-1"><Icon id={base.id} size={0.5} />{base.es}</Link>
          </p>
        ) : (
          <p className="text-sm text-ink-dim">{item.use}</p>
        )}
        {note && <p className="text-xs text-ink-dim/70">{note}</p>}
        {held && owner && <p className="text-xs text-good mt-0.5">Lo lleva tu {data.byId.get(owner.species)?.es}</p>}
        {use && <p className="text-xs text-led mt-0.5">Útil para {use.who.join(', ')}: {use.why}.</p>}
      </div>
    </div>
  )
}

function BallRow({ icon, es, en, rule, top, children }: { icon: string; es: string; en: string; rule: string; top?: boolean; children?: React.ReactNode }) {
  return (
    <div className={`flex gap-3 p-2 border-2 ${top ? 'border-warn/70 bg-warn/5' : 'border-black bg-screen'}`}>
      <div className="w-10 h-10 shrink-0 grid place-items-center bg-screen-3/60"><img src={icon} alt="" loading="lazy" className="pixelated w-8 h-8" /></div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2">
          <Bilingual es={es} en={en} className="font-semibold" />
          {top && <span className="font-pixel text-xs text-warn">★ Top</span>}
        </div>
        <p className="text-sm text-ink-dim">{rule}</p>
        {children}
      </div>
    </div>
  )
}

function BallsTab() {
  const grid = 'grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2'
  return (
    <motion.div key="balls" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="screen p-4 text-ink-dim">
        Hay 28 Balls. En PokeBedrock la <b>Super Ball (Great Ball)</b> y la <b>Ultra Ball</b> capturan <b>igual que una Poké Ball</b>, así que lo que manda es la Ball <b>especial</b> según la situación.
        Para saber cuál lanzar contra un Pokémon concreto, usa la <Link to="/capturar" className="text-led underline">calculadora de Capturar</Link>.
      </div>
      <Panel title="Las que merecen la pena">
        <p className="text-sm text-ink-dim -mt-1 mb-3">De mejor a peor en general. Tapa = bonguris cocinados que necesitas.</p>
        <div className={grid}>
          {BALLS.map((b) => (
            <BallRow key={b.id} {...b}>
              {b.recipe && <p className="text-sm">Tapa: {b.recipe} {!b.recipeVerified && <Unverified>Receta de Pixelmon, sin verificar</Unverified>}</p>}
              {b.always && <p className="text-sm">No se fabrica.</p>}
            </BallRow>
          ))}
        </div>
      </Panel>
      <Panel title="El resto (casi todas son de colección)">
        <div className={grid}>
          {OTHER_BALLS.map((b) => (
            <BallRow key={b.id} {...b}>
              <p className="text-sm">{b.craft ? 'Se fabrica (receta en el libro de recetas del juego).' : 'No se fabrica.'} {!b.verified && <Unverified />}</p>
            </BallRow>
          ))}
        </div>
      </Panel>
      <div className="grid xl:grid-cols-2 gap-5">
        <Panel title="Cómo fabricar una Ball">
          <ol className="list-decimal pl-5 space-y-1.5 text-sm">
            <li><b>Base de hierro (Iron Base)</b>: 3 lingotes de hierro en fila en la mesa de trabajo → salen <b>5</b>.</li>
            <li><b>Cocina los bonguris</b> del color que pida la tapa en un horno, ahumador o fogata.</li>
            <li><b>Tapa</b>: pon los bonguris cocinados en la mesa de trabajo.</li>
            <li><b>Ball</b>: tapa + <b>botón de piedra</b> + base de hierro, en cualquier posición.</li>
          </ol>
          <table className="w-full text-sm mt-3">
            <thead className="font-pixel text-xs text-ink-dim text-left"><tr><th className="pb-1">Tapa</th><th>Bonguris cocinados</th><th>Salen</th></tr></thead>
            <tbody>
              {[['Poké Ball', '3 rojos', '5'], ['Super Ball (Great Ball)', '2 azules + 1 rojo', '3'], ['Ultra Ball', '2 negros + 1 amarillo', '1']].map(([a, b, c]) => (
                <tr key={a} className="border-t border-screen-3"><td className="py-1.5 pr-2">{a}</td><td className="pr-2">{b}</td><td className="font-pixel">{c}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm text-ink-dim mt-3">22 de las 28 tienen receta completa. No se fabrican: Master, Ente (Beast), Gloria (Cherish), Ensueño (Dream), GS y la tapa de la Parque (Park). Dónde crece cada bonguri: en <Link to="/capturar" className="text-led underline">Capturar</Link>.</p>
        </Panel>
        <Panel title="Qué multiplica la captura (además de la Ball)">
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><b>Dormido o congelado</b>: ×2,5. <b>Paralizado, envenenado o quemado</b>: ×1,5.</li>
            <li><b>Amuleto Captura (Catching Charm)</b> en la mano secundaria: ×2.</li>
            <li>Encuentros al caminar (hierba alta): ×1,5.</li>
            <li>Menos PS = más fácil. Bájalo al mínimo sin debilitarlo.</li>
            <li><b>Ultraentes</b>: ×0,1 con cualquier Ball salvo la Ente Ball (Beast Ball).</li>
          </ul>
        </Panel>
        <Panel title="Pokédex y Geodex">
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li><b>Pokédex</b>: en la mesa de trabajo, <span className="font-pixel">hierro · panel de cristal · hierro</span> / <span className="font-pixel">tinte rojo · batería · tinte rojo</span> / <span className="font-pixel">hierro · redstone · hierro</span>. Se puede teñir de 15 colores, o de arcoíris rodeándola de tintes.</li>
            <li><b>Geodex</b>: se fabrica con un <b>ancla de reaparición</b>. Busca un bioma que ya hayas encontrado y te pone una flecha si está a menos de 500 bloques. Guarda hasta 5 biomas.</li>
            <li><b>Geodex+</b>: igual, pero hasta 700 bloques y 10 biomas.</li>
          </ul>
        </Panel>
      </div>
    </motion.div>
  )
}
