import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Fuse from 'fuse.js'
import type { Data, Grade, Item, Light, Mon, Move, Verdict } from '../lib/data'
import { GRADE_INFO, levelLabel, percentile } from '../lib/build'
import { artUrls, iconUrl, LIGHT_ES, RARITY_COLOR, RARITY_ES, STAT_ES, TYPE_COLOR, TYPE_ES, VERDICT } from '../lib/poke'

export function TypeChip({ type, small }: { type: string; small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center font-pixel uppercase tracking-wide text-white mc-bevel ${small ? 'px-1.5 py-0 text-[11px]' : 'px-2 py-0.5 text-xs'}`}
      style={{ background: TYPE_COLOR[type], textShadow: '1px 1px 0 rgb(0 0 0 / .5)' }}
    >
      {TYPE_ES[type] ?? type}
    </span>
  )
}

export function VerdictBadge({ v, big }: { v: Verdict; big?: boolean }) {
  const d = VERDICT[v]
  return (
    <span
      title={d.text}
      className={`inline-flex items-center gap-1 font-pixel text-black mc-bevel ${big ? 'px-3 py-1 text-base' : 'px-1.5 py-0 text-xs'}`}
      style={{ background: d.color }}
    >
      {v === 'top' ? '★ ' : ''}
      {d.label}
    </span>
  )
}

export function RarityBadge({ r }: { r: number }) {
  return (
    <span className="font-pixel text-xs px-1.5 border-2" style={{ borderColor: RARITY_COLOR[r], color: RARITY_COLOR[r] }}>
      {RARITY_ES[r]}
    </span>
  )
}

export function LightBadge({ l }: { l: Light }) {
  const d = LIGHT_ES[l]
  return (
    <span title={d.hint} className="text-sm whitespace-nowrap">
      <span className={l === 'dia' ? 'text-warn' : l === 'noche' ? 'text-led' : 'text-ink-dim'}>{d.icon}</span> {d.label}
    </span>
  )
}

export function Icon({ id, size = 2, className = '' }: { id: string; size?: number; className?: string }) {
  return <img src={iconUrl(id)} alt="" loading="lazy" width={40 * size} height={30 * size} className={`pixelated ${className}`} style={{ width: 40 * size, height: 30 * size }} />
}

export function Art({ mon, className = '' }: { mon: Mon; className?: string }) {
  const urls = useMemo(() => artUrls(mon), [mon])
  const [i, setI] = useState(0)
  useEffect(() => { setI(0) }, [mon.id])
  const isIcon = i === urls.length - 1
  return <img src={urls[i]} alt={mon.es} onError={() => setI((x) => Math.min(x + 1, urls.length - 1))} className={`${isIcon ? 'pixelated' : ''} object-contain ${className}`} />
}

export function Panel({ title, children, className = '', right }: { title?: ReactNode; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={`screen p-4 ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-pixel text-lg text-ink flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-dex-red-light" />
            {title}
          </h2>
          {right}
        </div>
      )}
      {children}
    </motion.section>
  )
}

export function Bilingual({ es, en, className = '' }: { es: string; en?: string; className?: string }) {
  return (
    <span className={className}>
      {es}
      {en && en !== es && <span className="text-ink-dim font-normal"> ({en})</span>}
    </span>
  )
}

export function MoveTag({ mv }: { mv: Move }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-2.5 h-2.5 shrink-0 mc-bevel" style={{ background: TYPE_COLOR[mv.type] }} />
      <Bilingual es={mv.es} en={mv.en} className="font-semibold" />
    </span>
  )
}

export const CAT_ES = { fisico: 'Físico', especial: 'Especial', estado: 'Estado' }

export function MoveRow({ mv, left, highlight }: { mv: Move; left?: ReactNode; highlight?: boolean }) {
  return (
    <tr className={`border-t border-screen-3 ${highlight ? 'bg-good/10' : ''}`} title={mv.desc}>
      {left !== undefined && <td className="py-1.5 pr-2 font-pixel text-ink-dim whitespace-nowrap">{left}</td>}
      <td className="py-1.5 pr-2"><MoveTag mv={mv} /></td>
      <td className="py-1.5 pr-2"><TypeChip type={mv.type} small /></td>
      <td className="py-1.5 pr-2 text-sm text-ink-dim">{CAT_ES[mv.cat]}</td>
      <td className="py-1.5 pr-2 font-pixel text-right">{mv.pow > 1 ? mv.pow : '—'}</td>
      <td className="py-1.5 pr-2 font-pixel text-right text-ink-dim">{mv.acc ?? '—'}</td>
      <td className="py-1.5 text-sm text-ink-dim hidden xl:table-cell">{mv.desc}</td>
    </tr>
  )
}

export function MoveTable({ rows }: { rows: { mv: Move; left?: ReactNode; key: string; highlight?: boolean }[] }) {
  const hasLeft = rows.some((r) => r.left !== undefined)
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full text-left">
        <thead className="font-pixel text-xs text-ink-dim">
          <tr>
            {hasLeft && <th className="pb-1">Nv.</th>}
            <th className="pb-1">Ataque</th>
            <th className="pb-1">Tipo</th>
            <th className="pb-1">Clase</th>
            <th className="pb-1 text-right">Poder</th>
            <th className="pb-1 text-right">Prec.</th>
            <th className="pb-1 hidden xl:table-cell">Efecto</th>
          </tr>
        </thead>
        <tbody>{rows.map((r) => <MoveRow key={r.key} mv={r.mv} left={hasLeft ? r.left : undefined} highlight={r.highlight} />)}</tbody>
      </table>
    </div>
  )
}

export function ItemName({ item, withDesc }: { item: Item; withDesc?: boolean }) {
  return (
    <span className="inline-flex items-start gap-2">
      {item.icon && <img src={item.icon} alt="" className="pixelated w-8 h-8 shrink-0" loading="lazy" />}
      <span>
        <Bilingual es={item.es} en={item.en} className="font-semibold" />
        {withDesc && item.desc && <span className="block text-sm text-ink-dim">{item.desc}</span>}
      </span>
    </span>
  )
}

const STAT_COLOR = ['#ef5350', '#ffa726', '#ffee58', '#42a5f5', '#66bb6a', '#ec407a']
export function StatBars({ stats }: { stats: number[] }) {
  return (
    <div className="space-y-1.5">
      {stats.map((s, i) => (
        <div key={i} className="grid grid-cols-[86px_40px_1fr] items-center gap-2 text-sm">
          <span className="text-ink-dim">{STAT_ES[i]}</span>
          <span className="font-pixel text-right">{s}</span>
          <div className="h-3 bg-screen border border-black">
            <motion.div className="h-full" style={{ background: STAT_COLOR[i] }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, (s / 200) * 100)}%` }} transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeOut' }} />
          </div>
        </div>
      ))}
      <div className="grid grid-cols-[86px_40px_1fr] gap-2 text-sm pt-1 border-t border-screen-3">
        <span className="text-ink-dim">Total</span>
        <span className="font-pixel text-right">{stats.reduce((a, b) => a + b, 0)}</span>
      </div>
    </div>
  )
}

export function MonCard({ mon, extra, compact }: { mon: Mon; extra?: ReactNode; compact?: boolean }) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.18 }}>
      <Link to={`/pokemon/${mon.id}`} className="group flex items-center gap-3 p-2 bg-screen border-2 border-black hover:border-dex-red-light hover:-translate-y-0.5 transition-transform mc-bevel">
        <div className="shrink-0 grid place-items-center w-[80px] h-[60px] bg-screen-3/60 group-hover:bg-screen-3">
          <Icon id={mon.id} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-pixel text-ink-dim text-xs">#{String(mon.num).padStart(4, '0')}</span>
            <span className="font-bold truncate">{mon.es}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {mon.types.map((t) => <TypeChip key={t} type={t} small />)}
            {!compact && <VerdictBadge v={mon.verdict} />}
            {!compact && <GradeBadge g={mon.grade ?? mon.fgrade} />}
          </div>
          {extra && <div className="mt-1 text-sm text-ink-dim">{extra}</div>}
        </div>
      </Link>
    </motion.div>
  )
}

const OBJ_KEY = 'pb.objetivos'
export function useObjetivos() {
  const [list, setList] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(OBJ_KEY) ?? '[]')
    } catch {
      return []
    }
  })
  useEffect(() => {
    const onStorage = () => {
      try {
        setList(JSON.parse(localStorage.getItem(OBJ_KEY) ?? '[]'))
      } catch { /* sin almacenamiento */ }
    }
    window.addEventListener('pb-objetivos', onStorage)
    return () => window.removeEventListener('pb-objetivos', onStorage)
  }, [])
  const save = (next: string[]) => {
    setList(next)
    try {
      localStorage.setItem(OBJ_KEY, JSON.stringify(next))
      window.dispatchEvent(new Event('pb-objetivos'))
    } catch { /* sin almacenamiento */ }
  }
  return {
    list,
    has: (id: string) => list.includes(id),
    toggle: (id: string) => save(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]),
  }
}

export function useMonSearch(data: Data) {
  return useMemo(() => new Fuse(data.index, { keys: [{ name: 'es', weight: 2 }, 'name', 'id'], threshold: 0.3, ignoreLocation: true }), [data])
}

/** Selector de Pokémon con búsqueda (español o inglés). */
export function MonPicker({ data, value, onChange, placeholder = 'Busca un Pokémon…' }: { data: Data; value?: Mon; onChange: (m: Mon) => void; placeholder?: string }) {
  const fuse = useMonSearch(data)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const results = q ? fuse.search(q, { limit: 8 }).map((r) => r.item) : []
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 bg-screen border-2 border-black px-2 py-1">
        {value && !q && <Icon id={value.id} size={1} />}
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={value && !q ? value.es : placeholder}
          className="bg-transparent outline-none flex-1 py-1 placeholder:text-ink"
        />
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full screen max-h-80 overflow-auto scroll-thin">
          {results.map((m) => (
            <li key={m.id}>
              <button className="w-full flex items-center gap-2 px-2 py-1 hover:bg-screen-3 text-left" onClick={() => { onChange(m); setQ(''); setOpen(false) }}>
                <Icon id={m.id} size={1} />
                <span className="font-semibold">{m.es}</span>
                <span className="ml-auto flex gap-1">{m.types.map((t) => <TypeChip key={t} type={t} small />)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className="mc-btn px-3 py-1 text-sm">
      {children}
    </button>
  )
}

export function Unverified({ children = 'Sin verificar' }: { children?: ReactNode }) {
  return <span className="font-pixel text-[11px] px-1.5 bg-warn/15 text-warn border border-warn/60" title="No viene de una fuente oficial de PokeBedrock: compruébalo en el juego">{children}</span>
}

export function GradeBadge({ g, big, title }: { g: Grade | null; big?: boolean; title?: string }) {
  if (!g) return null
  const d = GRADE_INFO[g]
  return (
    <span title={title ?? `Nivel competitivo ${g}: ${d.text}`} className={`inline-grid place-items-center font-pixel text-black mc-bevel ${big ? 'w-12 h-12 text-3xl' : 'w-6 h-6 text-sm'}`} style={{ background: d.color }}>
      {g}
    </span>
  )
}

/** Valoración 0–5 en estrellas (las de Showdown van de -1 a 5). */
export function Stars({ n, max = 5 }: { n: number; max?: number }) {
  const v = Math.max(0, Math.min(max, n))
  return (
    <span className="font-pixel tracking-tight whitespace-nowrap" title={`${v} de ${max}`} aria-label={`${v} de ${max}`}>
      <span className="text-warn">{'★'.repeat(Math.floor(v))}{v % 1 >= 0.5 ? '½' : ''}</span>
      <span className="text-ink-dim/40">{'★'.repeat(max - Math.ceil(v))}</span>
    </span>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: readonly (readonly [T, ReactNode])[]; value: T; onChange: (t: T) => void }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1.5">
      {tabs.map(([k, l]) => (
        <button key={k} role="tab" aria-selected={value === k} aria-pressed={value === k} onClick={() => onChange(k)} className="mc-btn px-3 py-1.5">
          {l}
        </button>
      ))}
    </div>
  )
}

/** Objeto por id de Showdown, con icono y nombre "Español (English)". */
export function ItemBySid({ data, sid, children, withDesc }: { data: Data; sid: string; children?: ReactNode; withDesc?: boolean }) {
  const key = data.itemKey.get(sid)
  const it = key ? data.items[key] : undefined
  if (!it) return <span className="font-semibold">{sid}</span>
  return (
    <span className="inline-flex items-start gap-2">
      {it.icon ? <img src={it.icon} alt="" className="pixelated w-8 h-8 shrink-0" loading="lazy" /> : <span className="w-8 h-8 shrink-0" />}
      <span>
        <Bilingual es={it.es} en={it.en} className="font-semibold" />
        {children && <span className="block text-sm text-ink-dim">{children}</span>}
        {!children && withDesc && it.desc && <span className="block text-sm text-ink-dim">{it.desc}</span>}
      </span>
    </span>
  )
}

/** Estadísticas con barra, nivel (Muy alto…) y comparación con el resto de Pokémon. */
export function StatProfile({ data, mon }: { data: Data; mon: Mon }) {
  const rows = mon.stats.map((s, i) => ({ i, s, p: percentile(data, i, s) }))
  const best = [...rows].sort((a, b) => b.p - a.p)[0]
  const worst = [...rows].sort((a, b) => a.p - b.p)[0]
  const totalP = percentile(data, 6, mon.bst)
  return (
    <div>
      <div className="space-y-2">
        {rows.map(({ i, s, p }) => (
          <div key={i} className="grid grid-cols-[84px_36px_1fr_150px] items-center gap-2 text-sm" title={`${STAT_ES[i]} ${s}: más alta que el ${p} % de los Pokémon totalmente evolucionados`}>
            <span className="text-ink-dim">{STAT_ES[i]}</span>
            <span className="font-pixel text-right">{s}</span>
            <div className="relative h-4 bg-screen">
              <motion.div className="h-full rounded-r-[4px]" style={{ background: i === best.i ? 'var(--color-led)' : '#4f8fb3' }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, (s / 200) * 100)}%` }} transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }} />
            </div>
            <span className="text-xs whitespace-nowrap"><b className="font-pixel text-sm">{levelLabel(p)}</b> <span className="text-ink-dim">· {p} %</span></span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[84px_36px_1fr_150px] items-center gap-2 text-sm pt-2 mt-2 border-t border-screen-3">
        <span className="text-ink-dim">Total</span>
        <span className="font-pixel text-right">{mon.bst}</span>
        <span />
        <span className="text-xs"><b className="font-pixel text-sm">{levelLabel(totalP)}</b> <span className="text-ink-dim">· {totalP} %</span></span>
      </div>
      <div className="flex flex-wrap gap-2 mt-3 text-sm">
        <span className="px-2 py-1 bg-screen border border-black">Punto fuerte: <b>{STAT_ES[best.i]}</b></span>
        <span className="px-2 py-1 bg-screen border border-black">Punto débil: <b>{STAT_ES[worst.i]}</b></span>
        <span className="px-2 py-1 bg-screen border border-black">Ataca mejor con: <b>{mon.stats[1] >= mon.stats[3] ? 'ataques físicos' : 'ataques especiales'}</b></span>
      </div>
      <p className="text-xs text-ink-dim mt-2">El % compara con todos los Pokémon totalmente evolucionados: 90 % = mejor que 9 de cada 10.</p>
    </div>
  )
}
