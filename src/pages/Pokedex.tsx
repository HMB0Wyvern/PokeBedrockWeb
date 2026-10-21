import { useEffect, useMemo, useRef, useState } from 'react'
import { useData } from '../App'
import type { Verdict } from '../lib/data'
import { normalize, TYPES, VERDICT } from '../lib/poke'
import { MonCard, Panel, Toggle, TypeChip } from '../components/ui'

type Sort = 'num' | 'final' | 'bst' | 'name'
const PAGE = 60

export default function Pokedex() {
  const data = useData()
  const [q, setQ] = useState('')
  const [types, setTypes] = useState<string[]>([])
  const [verdicts, setVerdicts] = useState<Verdict[]>([])
  const [onlyWild, setOnlyWild] = useState(true)
  const [showForms, setShowForms] = useState(false)
  const [legend, setLegend] = useState<'todos' | 'sin' | 'solo'>('todos')
  const [sort, setSort] = useState<Sort>('num')
  const [shown, setShown] = useState(PAGE)
  const sentinel = useRef<HTMLDivElement>(null)

  const list = useMemo(() => {
    const nq = normalize(q.trim())
    const out = data.index.filter((m) => {
      if (nq && !normalize(m.es).includes(nq) && !normalize(m.name).includes(nq) && String(m.num) !== nq) return false
      if (types.length && !types.every((t) => m.types.includes(t))) return false
      if (verdicts.length && !verdicts.includes(m.verdict)) return false
      if (onlyWild && !m.sp.length) return false
      if (!showForms && (['mega', 'gmax', 'totem', 'forma'].includes(m.obtain) || /-(mega|gmax|totem)/.test(m.sprite))) return false
      if (legend === 'sin' && m.tags.length) return false
      if (legend === 'solo' && !m.tags.length) return false
      return true
    })
    const cmp: Record<Sort, (a: typeof out[0], b: typeof out[0]) => number> = {
      num: (a, b) => a.num - b.num,
      final: (a, b) => b.finalBst - a.finalBst || a.num - b.num,
      bst: (a, b) => b.bst - a.bst,
      name: (a, b) => a.es.localeCompare(b.es, 'es'),
    }
    return out.sort(cmp[sort])
  }, [data, q, types, verdicts, onlyWild, showForms, legend, sort])

  useEffect(() => { setShown(PAGE) }, [list])
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((e) => e[0].isIntersecting && setShown((s) => s + PAGE), { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

  return (
    <div className="space-y-5">
      <h1 className="font-pixel text-3xl">Pokédex</h1>
      <Panel>
        <div className="space-y-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar por nombre o número…" className="w-full bg-screen border-2 border-black px-3 py-2 outline-none" />
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-sm text-ink-dim w-20">Tipo</span>
            {TYPES.map((t) => (
              <button key={t} onClick={() => toggle(types, t, setTypes)} className={`transition-opacity ${types.length && !types.includes(t) ? 'opacity-40' : ''}`}>
                <TypeChip type={t} />
              </button>
            ))}
            {types.length > 0 && <button className="text-sm text-led underline ml-2" onClick={() => setTypes([])}>Quitar</button>}
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-sm text-ink-dim w-20">Veredicto</span>
            {(Object.keys(VERDICT) as Verdict[]).map((v) => <Toggle key={v} on={verdicts.includes(v)} onClick={() => toggle(verdicts, v, setVerdicts)}>{VERDICT[v].label}</Toggle>)}
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-sm text-ink-dim w-20">Mostrar</span>
            <Toggle on={onlyWild} onClick={() => setOnlyWild(!onlyWild)}>Solo salvajes</Toggle>
            <Toggle on={showForms} onClick={() => setShowForms(!showForms)}>Megas y formas</Toggle>
            <Toggle on={legend === 'sin'} onClick={() => setLegend(legend === 'sin' ? 'todos' : 'sin')}>Sin legendarios</Toggle>
            <Toggle on={legend === 'solo'} onClick={() => setLegend(legend === 'solo' ? 'todos' : 'solo')}>Solo legendarios</Toggle>
            <span className="text-sm text-ink-dim ml-4">Ordenar</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="bg-screen border-2 border-black px-2 py-1">
              <option value="num">Número</option>
              <option value="final">Mejor evolución final</option>
              <option value="bst">Estadísticas actuales</option>
              <option value="name">Nombre</option>
            </select>
          </div>
        </div>
      </Panel>
      <div className="font-pixel text-ink-dim">{list.length} Pokémon</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2">
        {list.slice(0, shown).map((m) => <MonCard key={m.id} mon={m} extra={m.fin.length ? `Final: ${m.fin.map((f) => data.byId.get(f)?.es).join(' / ')} (${m.finalBst})` : `Total ${m.bst}`} />)}
      </div>
      <div ref={sentinel} className="h-4" />
    </div>
  )
}
