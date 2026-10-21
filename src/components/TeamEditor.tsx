import { useMemo, useRef, useState } from 'react'
import { useData, useTeamEditor } from '../App'
import { loadDetail, useAsync, type Box, type BoxMon, type Data, type Team, type TeamMember } from '../lib/data'
import { hpAt } from '../lib/battle'
import { Icon, MonPicker, Panel } from './ui'

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))

/** Objetos que tiene sentido equipar (catálogo: equipar, bayas, entrenar), ordenados por nombre. */
function useHoldable(data: Data) {
  return useMemo(() => {
    const ids = new Set<string>()
    for (const c of data.itemcats) if (['equipar', 'bayas', 'entrenar', 'mega'].includes(c.id)) for (const g of c.groups) for (const it of g.items) ids.add(it.id)
    for (const p of data.team.party) if (p.heldItem) ids.add(p.heldItem)
    return [...ids].filter((id) => data.items[id]).sort((a, b) => data.items[a].es.localeCompare(data.items[b].es))
  }, [data])
}

export default function TeamEditor({ onClose }: { onClose: () => void }) {
  const data = useData()
  const api = useTeamEditor()
  const [team, setTeam] = useState<Team>(() => clone(data.team))
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const setMember = (i: number, m: TeamMember) => setTeam((t) => ({ ...t, party: t.party.map((x, j) => (j === i ? m : x)) }))
  const addMember = (species: string) => {
    const mon = data.byId.get(species)!
    const lv = 5
    setTeam((t) => ({ ...t, party: [...t.party, { species, level: lv, gender: null, hp: [hpAt(mon, lv), hpAt(mon, lv)], moves: [] }] }))
  }
  const setBox = (i: number, b: Box) => setTeam((t) => ({ ...t, boxes: t.boxes.map((x, j) => (j === i ? b : x)) }))

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(team, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'mi-equipo-pokebedrock.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const importJson = async (f: File) => {
    try {
      const t = JSON.parse(await f.text()) as Team
      if (!Array.isArray(t.party)) throw new Error('formato')
      t.boxes ??= []
      t.party = t.party.filter((p) => data.byId.has(p.species))
      setTeam(t)
      setMsg('Importado. Pulsa "Guardar" para usarlo.')
    } catch {
      setMsg('Ese archivo no es un equipo válido.')
    }
  }

  return (
    <Panel title="Editar mi equipo y mis cajas" right={<button className="mc-btn px-3 py-1" onClick={onClose}>Cerrar</button>}>
      <p className="text-sm text-ink-dim mb-3">Los cambios se guardan <b>solo en este navegador</b>. Para pasarlos a otro dispositivo, usa Exportar e Importar.</p>

      <h3 className="font-pixel text-lg mb-2">Equipo ({team.party.length}/6)</h3>
      <div className="grid xl:grid-cols-2 gap-3">
        {team.party.map((m, i) => (
          <MemberEditor key={`${m.species}-${i}`} m={m} onChange={(x) => setMember(i, x)} onRemove={() => setTeam((t) => ({ ...t, party: t.party.filter((_, j) => j !== i) }))} />
        ))}
      </div>
      {team.party.length < 6 && (
        <div className="mt-3 max-w-md">
          <MonPicker data={data} onChange={(mon) => addMember(mon.id)} placeholder="Añadir un Pokémon al equipo…" />
        </div>
      )}

      <h3 className="font-pixel text-lg mt-6 mb-2">Cajas</h3>
      <p className="text-sm text-ink-dim mb-2">Pulsa ♂/♀/? para indicar el género (importante para criar). La × lo quita.</p>
      <div className="space-y-3">
        {team.boxes.map((b, bi) => (
          <BoxEditor key={bi} box={b} onChange={(x) => setBox(bi, x)} onRemove={() => setTeam((t) => ({ ...t, boxes: t.boxes.filter((_, j) => j !== bi) }))} />
        ))}
      </div>
      <button className="mc-btn px-3 py-1 mt-3" onClick={() => setTeam((t) => ({ ...t, boxes: [...t.boxes, { name: `Caja ${t.boxes.length + 1}`, purpose: '', mons: [] }] }))}>+ Nueva caja</button>

      <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-screen-3">
        <button className="mc-btn active px-4 py-1.5" onClick={() => { api.save(team); onClose() }}>Guardar</button>
        <button className="mc-btn px-3 py-1.5" onClick={exportJson}>Exportar</button>
        <button className="mc-btn px-3 py-1.5" onClick={() => fileRef.current?.click()}>Importar</button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        <button className="mc-btn px-3 py-1.5" onClick={() => setTeam((t) => ({ ...t, party: [], boxes: [{ name: 'Caja 1', purpose: '', mons: [] }] }))}>Empezar de cero</button>
        {api.custom && <button className="mc-btn px-3 py-1.5 ml-auto" onClick={() => { api.reset(); onClose() }}>Volver al equipo de base</button>}
        {msg && <span className="text-sm text-warn w-full">{msg}</span>}
      </div>
    </Panel>
  )
}

function MemberEditor({ m, onChange, onRemove }: { m: TeamMember; onChange: (m: TeamMember) => void; onRemove: () => void }) {
  const data = useData()
  const mon = data.byId.get(m.species)!
  const holdable = useHoldable(data)
  const { data: detail } = useAsync(() => loadDetail(m.species), [m.species])
  const learnset = useMemo(() => {
    if (!detail) return []
    const ids = new Set([...detail.moves.lvl.map(([, id]) => id), ...detail.moves.tm, ...detail.moves.tutor, ...detail.moves.egg, ...m.moves])
    return [...ids].filter((id) => data.moves[id]).sort((a, b) => data.moves[a].es.localeCompare(data.moves[b].es))
  }, [detail, data, m.moves])
  const setLevel = (level: number) => {
    const max = hpAt(mon, level)
    onChange({ ...m, level, hp: [Math.min(max, m.hp[0] === m.hp[1] ? max : m.hp[0]), max] })
  }
  const sel = 'bg-screen border-2 border-black px-1 py-1 text-sm w-full'
  return (
    <div className="bg-screen border-2 border-black p-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Icon id={mon.id} size={1} />
        <span className="font-semibold">{mon.es}</span>
        <label className="text-sm">Nv. <input type="number" min={1} max={100} value={m.level} onChange={(e) => setLevel(Math.max(1, Math.min(100, Number(e.target.value) || 1)))} className="w-14 bg-screen-2 border border-black px-1" /></label>
        <label className="text-sm">PS <input type="number" min={0} max={m.hp[1]} value={m.hp[0]} onChange={(e) => onChange({ ...m, hp: [Math.max(0, Math.min(m.hp[1], Number(e.target.value) || 0)), m.hp[1]] })} className="w-14 bg-screen-2 border border-black px-1" />/{m.hp[1]}</label>
        <GenderToggle g={m.gender} onChange={(gender) => onChange({ ...m, gender })} />
        <button onClick={onRemove} className="ml-auto text-bad text-sm underline">Quitar</button>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <select key={i} className={sel} value={m.moves[i] ?? ''} onChange={(e) => {
            const moves = [...m.moves]
            moves[i] = e.target.value
            onChange({ ...m, moves: moves.filter(Boolean) })
          }}>
            <option value="">— Ataque {i + 1} —</option>
            {learnset.map((id) => <option key={id} value={id}>{data.moves[id].es}{data.moves[id].en !== data.moves[id].es ? ` (${data.moves[id].en})` : ''}</option>)}
          </select>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1">
        <select className={sel} value={m.heldItem ?? ''} onChange={(e) => onChange({ ...m, heldItem: e.target.value || undefined })}>
          <option value="">Sin objeto</option>
          {holdable.map((id) => <option key={id} value={id}>{data.items[id].es}{data.items[id].en !== data.items[id].es ? ` (${data.items[id].en})` : ''}</option>)}
        </select>
        <select className={sel} value={m.ability ?? ''} onChange={(e) => onChange({ ...m, ability: e.target.value || undefined })}>
          <option value="">Habilidad: ¿?</option>
          {detail?.abilities.map((a) => <option key={a.id} value={a.id}>{data.abilities[a.id]?.es ?? a.id}{data.abilities[a.id]?.en ? ` (${data.abilities[a.id].en})` : ''}</option>)}
        </select>
        <select className={sel} value={m.nature ?? ''} onChange={(e) => onChange({ ...m, nature: e.target.value || undefined })}>
          <option value="">Naturaleza: ¿?</option>
          {data.natures.map((n) => <option key={n.id} value={n.id}>{n.es} ({n.en})</option>)}
        </select>
      </div>
    </div>
  )
}

function GenderToggle({ g, onChange }: { g?: 'M' | 'F' | null; onChange: (g: 'M' | 'F' | null) => void }) {
  const next = g === 'M' ? 'F' : g === 'F' ? null : 'M'
  return (
    <button onClick={() => onChange(next)} title="Cambiar género" className={`font-pixel w-6 h-6 border border-black ${g === 'M' ? 'bg-led/30 text-led' : g === 'F' ? 'bg-[#f48fb1]/30 text-[#f48fb1]' : 'bg-screen-2 text-ink-dim'}`}>
      {g === 'M' ? '♂' : g === 'F' ? '♀' : '?'}
    </button>
  )
}

function BoxEditor({ box, onChange, onRemove }: { box: Box; onChange: (b: Box) => void; onRemove: () => void }) {
  const data = useData()
  const setMon = (i: number, m: BoxMon) => onChange({ ...box, mons: box.mons.map((x, j) => (j === i ? m : x)) })
  return (
    <div className="bg-screen border-2 border-black p-2">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <input value={box.name} onChange={(e) => onChange({ ...box, name: e.target.value })} className="font-pixel bg-screen-2 border border-black px-1 w-28" />
        <input value={box.purpose} placeholder="Para qué es (opcional)" onChange={(e) => onChange({ ...box, purpose: e.target.value })} className="bg-screen-2 border border-black px-1 text-sm flex-1 min-w-40" />
        <button onClick={onRemove} className="text-bad text-sm underline">Borrar caja</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {box.mons.map((m, i) => {
          const mon = m.species ? data.byId.get(m.species) : undefined
          return (
            <span key={i} className="inline-flex items-center gap-1 bg-screen-2 border border-black pr-1">
              {mon ? <Icon id={mon.id} size={0.6} /> : <span className="px-1 text-warn text-xs">?</span>}
              <span className="text-sm">{mon?.es ?? m.label ?? '¿?'}</span>
              <GenderToggle g={m.gender} onChange={(gender) => setMon(i, { ...m, gender })} />
              <button onClick={() => onChange({ ...box, mons: box.mons.filter((_, j) => j !== i) })} className="text-ink-dim hover:text-bad px-0.5" title="Quitar">×</button>
            </span>
          )
        })}
      </div>
      {box.mons.length < 30 && (
        <div className="mt-2 max-w-sm">
          <MonPicker data={data} onChange={(mon) => onChange({ ...box, mons: [...box.mons, { species: mon.id }] })} placeholder="Añadir a esta caja…" />
        </div>
      )}
    </div>
  )
}
