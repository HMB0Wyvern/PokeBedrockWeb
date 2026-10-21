import { useMemo, useState } from 'react'
import { useData } from '../App'
import type { Light, Mon } from '../lib/data'
import { LIGHT_ES, LOC_ES, VERDICT } from '../lib/poke'
import { spawnMatches } from '../lib/spawn'
import { takenMult, teamWeaknesses } from '../lib/team'
import { MonCard, Panel, RarityBadge, Toggle, useObjetivos } from '../components/ui'

const VORDER = { top: 0, muybueno: 1, aceptable: 2, relleno: 3 }
const BIOME_KEY = 'pb.donde.bioma'

export default function Where() {
  const data = useData()
  const obj = useObjetivos()
  const [biome, setBiome] = useState<string>(() => {
    try { return localStorage.getItem(BIOME_KEY) ?? 'forest' } catch { return 'forest' }
  })
  const [light, setLight] = useState<Light | 'todas'>('todas')
  const [loc, setLoc] = useState<string>('todos')
  const [hideLegend, setHideLegend] = useState(false)
  const pickBiome = (b: string) => {
    setBiome(b)
    try { localStorage.setItem(BIOME_KEY, b) } catch { /* sin almacenamiento */ }
  }

  const weakTypes = useMemo(() => {
    const members = data.team.party.map((m) => ({ member: m, mon: data.byId.get(m.species)! })).filter((x) => x.mon)
    return teamWeaknesses(data, members).filter((w) => w.weak >= 3 || w.mults.some((m) => m >= 4)).map((w) => w.type)
  }, [data])

  const results = useMemo(() => {
    const out: { mon: Mon; rarity: number; lights: Set<Light>; locs: Set<string> }[] = []
    for (const mon of data.index) {
      if (hideLegend && mon.tags.length) continue
      const hits = mon.sp.filter((s) => spawnMatches(data, s, biome, light, loc))
      if (!hits.length) continue
      out.push({ mon, rarity: Math.min(...hits.map((h) => h[3])), lights: new Set(hits.map((h) => h[1])), locs: new Set(hits.map((h) => h[2])) })
    }
    return out.sort((a, b) => VORDER[a.mon.verdict] - VORDER[b.mon.verdict] || b.mon.finalBst - a.mon.finalBst || a.rarity - b.rarity)
  }, [data, biome, light, loc, hideLegend])

  const groups = Object.entries(data.biomeGroups).map(([g, label]) => ({ g, label, biomes: data.biomes.filter((b) => b.group === g) })).filter((x) => x.biomes.length)
  const byVerdict = (['top', 'muybueno', 'aceptable', 'relleno'] as const).map((v) => ({ v, items: results.filter((r) => r.mon.verdict === v) }))
  const biomeEs = data.biomes.find((b) => b.id === biome)?.es

  return (
    <div className="space-y-5">
      <h1 className="font-pixel text-3xl">¿Qué hay aquí?</h1>
      <Panel title="¿Dónde estás?">
        <div className="grid lg:grid-cols-[1fr_auto] gap-4">
          <div className="space-y-2 max-h-72 overflow-auto scroll-thin pr-2">
            {groups.map(({ g, label, biomes }) => (
              <div key={g} className="flex flex-wrap items-center gap-1.5">
                <span className="w-44 text-sm text-ink-dim shrink-0">{label}</span>
                {biomes.map((b) => (
                  <button key={b.id} onClick={() => pickBiome(b.id)} aria-pressed={biome === b.id} className="mc-btn px-2 py-0.5 text-sm">{b.es}</button>
                ))}
              </div>
            ))}
          </div>
          <div className="space-y-3 lg:w-72">
            <div>
              <div className="text-sm text-ink-dim mb-1">Luz</div>
              <div className="flex flex-wrap gap-1.5">
                <Toggle on={light === 'todas'} onClick={() => setLight('todas')}>Cualquiera</Toggle>
                <Toggle on={light === 'dia'} onClick={() => setLight('dia')}>☀ Día</Toggle>
                <Toggle on={light === 'noche'} onClick={() => setLight('noche')}>☾ Noche / cueva</Toggle>
              </div>
            </div>
            <div>
              <div className="text-sm text-ink-dim mb-1">Lugar</div>
              <div className="flex flex-wrap gap-1.5">
                <Toggle on={loc === 'todos'} onClick={() => setLoc('todos')}>Todos</Toggle>
                {Object.entries(LOC_ES).map(([k, v]) => <Toggle key={k} on={loc === k} onClick={() => setLoc(k)}>{v}</Toggle>)}
              </div>
            </div>
            <Toggle on={hideLegend} onClick={() => setHideLegend(!hideLegend)}>Ocultar legendarios</Toggle>
          </div>
        </div>
        <p className="text-xs text-ink-dim mt-3">{LIGHT_ES.noche.hint} Los spawns "dudosos" de la wiki (que no coinciden con ningún bioma real) no se muestran aquí.</p>
      </Panel>

      <Panel title={`${results.length} Pokémon en ${biomeEs}`} right={weakTypes.length ? <span className="text-sm text-ink-dim">✚ = tapa una debilidad de tu equipo</span> : undefined}>
        {results.length === 0 && <p className="text-ink-dim">No aparece nada con estos filtros.</p>}
        <div className="space-y-5">
          {byVerdict.map(({ v, items }) => items.length > 0 && (
            <div key={v}>
              <h3 className="font-pixel mb-2" style={{ color: VERDICT[v].color }}>{VERDICT[v].label} · {items.length}</h3>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2">
                {items.map(({ mon, rarity, lights, locs }) => {
                  const finalMon = mon.fin.length ? data.byId.get(mon.fin[0]) ?? mon : mon
                  const covers = weakTypes.filter((t) => takenMult(data, finalMon, t) < 1)
                  return (
                    <MonCard key={mon.id} mon={mon} extra={
                      <span className="flex flex-wrap items-center gap-x-2">
                        <RarityBadge r={rarity} />
                        {mon.tags.length > 0 && <span className="font-pixel text-xs text-dex-red-light" title="Legendario: aparece muy pocas veces (unas 4–6 h entre apariciones)">Legendario</span>}
                        <span>{[...lights].map((l) => LIGHT_ES[l].icon).join(' ')}</span>
                        <span className="text-xs">{[...locs].map((l) => LOC_ES[l]).join(', ')}</span>
                        {covers.length > 0 && <span className="text-good font-pixel" title="Resiste tipos que hacen daño a gran parte de tu equipo">✚</span>}
                        {obj.has(mon.id) && <span className="text-warn">★</span>}
                      </span>
                    } />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
