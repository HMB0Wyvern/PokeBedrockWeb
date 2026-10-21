import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useData } from '../App'
import type { CatalogItem, Data } from '../lib/data'
import { TYPE_BOOST } from '../lib/build'
import { normalize, TYPE_ES } from '../lib/poke'
import { takenMult } from '../lib/team'
import { Bilingual, Icon, Panel, Tabs } from '../components/ui'

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
            tabs={cats.map((c) => [c.id, <span className="inline-flex items-center gap-1.5">{c.icon && <img src={c.icon} alt="" className="pixelated w-5 h-5" />}{c.title}</span>] as const)}
            value={cat.id}
            onChange={(c) => setParams({ c }, { replace: true })}
          />
          <motion.div key={cat.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="screen p-4 text-ink-dim">{cat.intro}</div>
            {cat.groups.map((g) => (
              <Panel key={g.title} title={g.title}>
                {g.intro && <p className="text-sm text-ink-dim -mt-1 mb-3">{g.intro}</p>}
                <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2">
                  {[...g.items].sort((a, b) => Number(!!b.top) - Number(!!a.top)).map((it) => <ItemCard key={it.id} data={data} item={it} held={held.has(it.id)} />)}
                </div>
              </Panel>
            ))}
          </motion.div>
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
