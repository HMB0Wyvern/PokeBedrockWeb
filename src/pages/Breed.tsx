import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useData } from '../App'
import { loadDetail, useAsync, type Data, type Mon } from '../lib/data'
import { checkPair, canBeFather, canBeMother, canBreed, EGG_ES, eggSpecies, finalOf, genderText, hatchSpeed, isDitto, lineOf, planPairs, type Pair, type PairTag } from '../lib/breed'
import { spawnRows } from '../lib/spawn'
import { GRADE_INFO, gradeRank, howLearn, recommendNature } from '../lib/build'
import { moveScore, takenMult, teamWeaknesses } from '../lib/team'
import { Bilingual, GradeBadge, Icon, MonPicker, MoveTag, Panel, TypeChip, Unverified, VerdictBadge } from '../components/ui'

type Entry = { key: string; mon: Mon; box: string; gender?: 'M' | 'F' | null; note?: string; label?: string; rarity?: number }

/** Todo lo que tienes: equipo (con género conocido) + cajas. */
function useCollection(data: Data) {
  return useMemo(() => {
    const out: Entry[] = []
    data.team.party.forEach((p, i) => {
      const mon = data.byId.get(p.species)
      if (mon) out.push({ key: `e${i}`, mon, box: 'Equipo', gender: p.gender })
    })
    data.team.boxes.forEach((b, bi) => b.mons.forEach((m, i) => {
      const mon = m.species ? data.byId.get(m.species) : undefined
      if (mon) out.push({ key: `b${bi}-${i}`, mon, box: b.name, gender: m.gender, note: m.note })
    }))
    return out
  }, [data])
}

export default function Breed() {
  const data = useData()
  const col = useCollection(data)
  const [mother, setMother] = useState<Mon | undefined>()
  const [father, setFather] = useState<Mon | undefined>()
  const pick = (m: Mon) => {
    // Primer clic: madre (o padre si solo puede ser macho); segundo: el otro
    if (!mother && canBeMother(m)) setMother(m)
    else if (!father && (canBeFather(m) || isDitto(m))) setFather(m)
    else if (canBeMother(m) || isDitto(m)) setMother(m)
    else setFather(m)
    document.getElementById('planificador')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const usePair = (p: Pair) => {
    setMother(p.mother.mon)
    setFather(p.father?.mon)
    document.getElementById('planificador')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-pixel text-3xl">Criar</h1>
        <p className="text-ink-dim">Las parejas que puedes montar con lo que ya tienes, qué sale de cada una y por qué merece la pena.</p>
      </div>
      <Steps />
      <PairList col={col} onUse={usePair} />
      <h2 className="font-pixel text-2xl pt-4">Hacerlo a mano</h2>
      <Boxes col={col} onPick={pick} />
      <Planner mother={mother} father={father} setMother={setMother} setFather={setFather} col={col} />
    </div>
  )
}

function Steps() {
  return (
    <details className="screen p-4 group">
      <summary className="cursor-pointer font-pixel text-lg flex items-center gap-2">
        <span className="inline-block w-2.5 h-2.5 bg-dex-red-light" />¿Primera vez? Así funciona criar <span className="text-sm text-ink-dim font-sans">(pulsa para ver)</span>
      </summary>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3 mt-3 text-sm">
        <div className="bg-screen border-2 border-black p-3">
          <div className="font-pixel mb-1">1. La pareja</div>
          <p className="text-ink-dim">Un macho y una hembra del mismo <b>grupo huevo</b> (pueden ser especies distintas). <b>Del huevo sale la especie de la madre</b>, en su primera forma: una Espathra madre da un Flittle. Ditto sirve de pareja para casi todos.</p>
        </div>
        <div className="bg-screen border-2 border-black p-3">
          <div className="font-pixel mb-1">2. La guardería</div>
          <p className="text-ink-dim"><code className="font-pixel text-warn">/warp</code> → Guardería → habla con la <b>Ayudante de crianza</b> → "Añadir Pokémon" con los dos. Sigue jugando: cuando haya huevo aparecerá <b>"¡Recoger huevos!"</b>.</p>
        </div>
        <div className="bg-screen border-2 border-black p-3">
          <div className="font-pixel mb-1">3. Eclosionar el huevo</div>
          <p className="text-ink-dim">El huevo va a tu <b>equipo</b> (no al PC). <b>Camina</b> con él: en su resumen pasa de "no muestra señales" a "se mueve", luego "se escuchan sonidos" y nace. Cada especie tarda más o menos (lo ves en cada pareja). Los <b>Potenciadores de pasos de huevo</b> lo aceleran.</p>
        </div>
        <div className="bg-screen border-2 border-black p-3">
          <div className="font-pixel mb-1">4. Recoge a los padres</div>
          <p className="text-ink-dim">Cuando termines, sácalos de la guardería. El juego avisa de que los que se quedan allí pueden pasar a "abandonados" y <b>los pierdes</b>. <Unverified>Tiempo exacto</Unverified></p>
        </div>
      </div>
      <p className="text-xs text-ink-dim mt-3">No crían: legendarios, singulares, ultraentes, paradojas, bebés (como Azurill) ni Pokémon castrados. Objetos útiles: <Bilingual es="Lazo Destino" en="Destiny Knot" /> (mejores IVs) y <Bilingual es="Piedra Eterna" en="Everstone" /> (pasa la naturaleza). <Link to="/guias?g=crianza" className="text-led underline">Guía completa</Link></p>
    </details>
  )
}

type Filter = 'todas' | PairTag
const FILTERS: readonly (readonly [Filter, string])[] = [['todas', 'Las mejores'], ['equipo', '★ Para mi equipo'], ['capturar', '◓ Para capturar'], ['debil', '✚ Tapar debilidades']]
const TAG_INFO: Record<PairTag, { label: string; cls: string }> = {
  equipo: { label: '★ Para tu equipo', cls: 'bg-warn text-black' },
  capturar: { label: '◓ Para capturar', cls: 'bg-led text-black' },
  debil: { label: '✚ Tapa debilidades', cls: 'bg-good text-black' },
}

/** Parejas de ejemplo con Pokémon salvajes fáciles de encontrar (para quien no tenga cajas). */
function useIdeas(data: Data) {
  return useMemo(() => {
    const where = (m: Mon) => {
      const r = spawnRows(data, m).find((x) => !x.dubious)
      return r ? `${r.label}${r.light === 'dia' ? ' ☀' : r.light === 'noche' ? ' ☾' : ''}` : 'Salvaje'
    }
    const rar = (m: Mon) => Math.min(...m.sp.map((x) => x[3]))
    const wild = data.index.filter((m) => m.sp.length && !m.tags.length && m.obtain === 'salvaje' && canBreed(m) && !isDitto(m) && !/-(mega|gmax|totem|primal)/.test(m.sprite))
    const kitIds = new Set(data.kit.filter((k) => ['debilitar', 'dormir', 'paralizar'].includes(k.effect)).flatMap((k) => k.learners.filter(([, lv]) => lv != null).map(([id]) => id)))
    const byBaby = new Map<string, Mon>()
    for (const m of wild) {
      if (!canBeMother(m)) continue
      const fin = finalOf(data, m)
      const strong = (fin.grade && 'SAB'.includes(fin.grade)) || fin.verdict === 'top'
      const kit = lineOf(data, fin).some((x) => kitIds.has(x.id))
      if (!strong && !kit) continue
      const baby = eggSpecies(data, m).id
      const cur = byBaby.get(baby)
      if (!cur || rar(m) < rar(cur)) byBaby.set(baby, m)
    }
    const targets = [...byBaby.values()]
      .sort((a, b) => gradeRank(finalOf(data, a).grade) - gradeRank(finalOf(data, b).grade) || finalOf(data, b).bst - finalOf(data, a).bst)
      .slice(0, 70)
    const owned: Entry[] = []
    const fatherIds = new Set<string>()
    for (const t of targets) {
      owned.push({ key: `t-${t.id}`, mon: t, box: where(t), gender: 'F', rarity: rar(t) })
      const fathers = wild.filter((f) => canBeFather(f) && checkPair(data, t, f).ok).sort((a, b) => Number(b.id === t.id) - Number(a.id === t.id) || rar(a) - rar(b)).slice(0, 3)
      for (const f of fathers) {
        if (fatherIds.has(f.id)) continue
        fatherIds.add(f.id)
        owned.push({ key: `f-${f.id}`, mon: f, box: where(f), gender: 'M', rarity: rar(f) })
      }
    }
    return { owned, targets: new Set(targets.map((t) => t.id)) }
  }, [data])
}

function PairList({ col, onUse }: { col: Entry[]; onUse: (p: Pair) => void }) {
  const data = useData()
  const ideas = useIdeas(data)
  const hasBoxes = col.some((e) => e.box !== 'Equipo' && canBreed(e.mon))
  const [mode, setMode] = useState<'mine' | 'ideas'>(hasBoxes ? 'mine' : 'ideas')
  const [filter, setFilter] = useState<Filter>('todas')
  const [showAll, setShowAll] = useState(false)
  const owned = mode === 'mine' ? col : ideas.owned
  const ids = useMemo(() => [...new Set(owned.flatMap((e) => [e.mon.id, eggSpecies(data, e.mon).id]))], [owned, data])
  const { data: detailList } = useAsync(() => Promise.all(ids.map((id) => loadDetail(id))), [ids.join()])
  const pairs = useMemo(() => {
    if (!detailList) return []
    const details = new Map(detailList.map((d) => [d.id, d]))
    const party = data.team.party.map((m) => ({ member: m, mon: data.byId.get(m.species)! })).filter((x) => x.mon)
    const weak = teamWeaknesses(data, party).filter((w) => w.weak >= 3 || w.mults.some((m) => m >= 4)).map((w) => w.type)
    return planPairs(data, owned, details, weak, (m, t) => takenMult(data, m, t) < 1, (m) => {
      const g = m.grade ?? m.fgrade
      return g ? `Llega a ser ${m.es}, nota ${g}: ${GRADE_INFO[g].text}` : null
    }, mode === 'ideas' ? { targets: ideas.targets, ideas: true } : {})
  }, [detailList, data, owned, mode, ideas])
  const ready = pairs.filter((p) => p.father && !p.needsDitto)
  const blocked = pairs.filter((p) => !p.father || p.needsDitto)
  const shown = (filter === 'todas' ? ready : ready.filter((p) => p.tags.includes(filter)))
  const list = showAll ? shown : shown.slice(0, 12)
  return (
    <Panel title={mode === 'mine' ? 'Parejas que puedes montar ya' : 'Ideas: Pokémon buenos para criar'} right={<span className="text-sm text-ink-dim">{ready.length} parejas</span>}>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button aria-pressed={mode === 'mine'} onClick={() => { setMode('mine'); setShowAll(false) }} className="mc-btn px-3 py-1.5">Con mis Pokémon</button>
        <button aria-pressed={mode === 'ideas'} onClick={() => { setMode('ideas'); setShowAll(false) }} className="mc-btn px-3 py-1.5">Ideas: qué capturar para criar</button>
      </div>
      <p className="text-sm text-ink-dim mb-3">
        {mode === 'mine'
          ? <>Parejas con los Pokémon de tu equipo y tus cajas. Si no son los tuyos, ponlos en <Link to="/equipo" className="text-led underline">Mi equipo → Editar</Link>.</>
          : 'Parejas de ejemplo con Pokémon salvajes fáciles de encontrar: captura la hembra y el macho que se indican (debajo de cada uno, dónde sale) y críalos.'}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {FILTERS.map(([k, l]) => (
          <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)} className="mc-btn px-3 py-1.5">
            {l} <span className="opacity-70">({k === 'todas' ? ready.length : ready.filter((p) => p.tags.includes(k as PairTag)).length})</span>
          </button>
        ))}
      </div>
      {!detailList && <p className="text-ink-dim">Calculando parejas…</p>}
      <div className="grid xl:grid-cols-2 gap-4">
        {list.map((p, i) => <PairCard key={p.target.id} p={p} rank={i + 1} onUse={() => onUse(p)} />)}
      </div>
      {shown.length > list.length && <button className="mc-btn px-4 py-1.5 mt-4" onClick={() => setShowAll(true)}>Ver las {shown.length - list.length} restantes</button>}
      {detailList && !shown.length && <p className="text-ink-dim">Ninguna pareja con este filtro.</p>}
      {blocked.length > 0 && (
        <details className="mt-5">
          <summary className="cursor-pointer font-pixel text-ink-dim">No puedes criarlos todavía ({blocked.length})</summary>
          <ul className="mt-2 grid md:grid-cols-2 xl:grid-cols-3 gap-2 text-sm">
            {blocked.map((p) => (
              <li key={p.target.id} className="flex items-start gap-2 bg-screen border border-black p-2">
                <Icon id={p.target.id} size={0.8} />
                <span><b>{p.target.es}</b>: <span className="text-ink-dim">{p.warns[0]}</span></span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Panel>
  )
}

function Who({ mon, label, sub }: { mon: Mon; label: string; sub?: string }) {
  return (
    <Link to={`/pokemon/${mon.id}`} className="flex flex-col items-center text-center w-20 shrink-0 group">
      <span className="text-[11px] text-ink-dim">{label}</span>
      <span className="grid place-items-center w-16 h-12 bg-screen border-2 border-black group-hover:border-dex-red-light"><Icon id={mon.id} /></span>
      <span className="text-xs font-semibold leading-tight mt-0.5">{mon.es}</span>
      {sub && <span className="text-[10px] text-ink-dim">{sub}</span>}
    </Link>
  )
}

function PairCard({ p, rank, onUse }: { p: Pair; rank: number; onUse: () => void }) {
  const data = useData()
  const g = p.final.grade ?? p.final.fgrade
  const nat = recommendNature(p.final)
  const nature = data.natures.find((n) => n.id === nat.id)
  const incItem = p.incense && data.items[`pokeb:${p.incense.item}`]
  const steps: React.ReactNode[] = []
  if (p.eggMoves.length && p.father) steps.push(<>Opcional, antes de dejarlos: enséñale a {p.father.mon.es} {p.eggMoves.map((m, i) => <span key={m.id}>{i > 0 && ' o '}<b>{data.moves[m.id].es}</b> ({m.how})</span>)}. Así {p.baby.es} nacerá sabiéndolo.</>)
  if (p.incense) steps.push(<>Equipa a un padre {incItem ? <Bilingual es={incItem.es} en={incItem.en} className="font-semibold" /> : p.incense.item}; si no, nace {p.incense.otherwise?.es}.</>)
  steps.push(<>Opcional: <b>Lazo Destino</b> al de mejores IVs y <b>Piedra Eterna</b> al que tenga naturaleza {nature ? <b>{nature.es}</b> : 'buena'} (la ideal para {p.final.es}).</>)
  steps.push(<>Deja a <b>{p.mother.mon.es}</b> (madre) y a <b>{p.father?.mon.es}</b> (padre) en la guardería.</>)
  steps.push(<>Recoge el huevo y camina con él en tu equipo. Eclosión: <b>{hatchSpeed(p.baby.hc)}</b>.</>)
  steps.push(<>Cuando tengas los huevos que quieras, saca a los padres de la guardería.</>)
  return (
    <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(rank, 8) * 0.03 }} className="bg-screen border-2 border-black p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-pixel text-ink-dim mr-1">#{rank}</span>
        {p.tags.map((t) => <span key={t} className={`font-pixel text-xs px-1.5 py-0.5 mc-bevel ${TAG_INFO[t].cls}`}>{TAG_INFO[t].label}</span>)}
        <button onClick={onUse} className="ml-auto text-xs text-led underline">Abrir en el planificador</button>
      </div>

      {/* Quién + quién → qué sale */}
      <div className="flex items-center gap-1 overflow-x-auto scroll-thin pb-1">
        <Who mon={p.mother.mon} label="♀ Madre" sub={p.mother.box} />
        <span className="font-pixel text-2xl text-ink-dim">+</span>
        {p.father && <Who mon={p.father.mon} label={isDitto(p.father.mon) ? 'Ditto' : '♂ Padre'} sub={p.father.box} />}
        <span className="font-pixel text-xl text-ink-dim px-1">→</span>
        <div className="flex flex-col items-center w-14 shrink-0">
          <span className="text-[11px] text-ink-dim">Huevo</span>
          <span className="text-3xl leading-none">🥚</span>
          <span className="text-[10px] text-ink-dim">{hatchSpeed(p.baby.hc)}</span>
        </div>
        <span className="font-pixel text-xl text-ink-dim px-1">→</span>
        <Who mon={p.baby} label="Nace" />
        {p.final.id !== p.baby.id && <><span className="font-pixel text-xl text-led px-1">→</span><Who mon={p.final} label="Evoluciona a" /></>}
        {g && <span className="ml-2 shrink-0"><GradeBadge g={g} big /></span>}
      </div>

      <div>
        <div className="font-pixel text-sm mb-1">Por qué merece la pena</div>
        <ul className="text-sm space-y-0.5">{p.reasons.map((r) => <li key={r}>• {r}</li>)}</ul>
      </div>

      {p.warns.length > 0 && <div className={`text-sm ${p.ideas ? 'text-led' : 'text-warn'}`}>{p.warns.map((w) => <p key={w}>{p.ideas ? '◓' : '⚠'} {w}</p>)}</div>}

      <details>
        <summary className="cursor-pointer font-pixel text-sm text-led">Qué tengo que hacer</summary>
        <ol className="text-sm space-y-1 mt-2 list-decimal pl-5">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        {p.alt.length > 0 && (
          <div className="mt-3">
            <div className="text-sm text-ink-dim mb-1">Si {p.father?.mon.es} no es macho, también te vale como padre:</div>
            <div className="flex flex-wrap gap-1.5">
              {p.alt.map((a) => (
                <Link key={a.id} to={`/pokemon/${a.id}`} className="flex items-center gap-1.5 pr-2 bg-screen-2 border-2 border-black hover:border-dex-red-light text-sm">
                  <Icon id={a.id} size={0.8} /><span className="font-semibold">{a.es}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </details>
    </motion.article>
  )
}

function Boxes({ col, onPick }: { col: Entry[]; onPick: (m: Mon) => void }) {
  const data = useData()
  return (
    <Panel title="Mis cajas" right={<span className="text-xs text-ink-dim">Pulsa un Pokémon para usarlo en el planificador</span>}>
      <div className="grid xl:grid-cols-3 gap-4">
        {data.team.boxes.map((b, bi) => (
          <section key={b.name} className={`bg-screen border-2 border-black p-2 ${b.purpose === 'Prescindibles' ? 'opacity-80' : ''}`}>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="font-pixel">{b.name}</h3>
              <span className="text-xs text-ink-dim">{b.purpose}</span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: 30 }, (_, i) => {
                const slot = b.mons[i]
                const e = col.find((x) => x.key === `b${bi}-${i}`)
                if (!slot) return <div key={i} className="aspect-square bg-screen-2/60 border border-black/50" />
                if (!e) return (
                  <div key={i} title={slot.note} className="aspect-square grid place-items-center bg-warn/10 border border-warn/60 text-[10px] text-warn text-center leading-tight p-0.5">{slot.label ?? '?'}</div>
                )
                const breedable = canBreed(e.mon)
                return (
                  <button key={i} onClick={() => onPick(e.mon)} title={`${e.mon.es}${breedable ? ` · ${e.mon.eg.map((g) => EGG_ES[g] ?? g).join(' / ')}` : ' · no puede criar'}${e.note ? ` · ${e.note}` : ''}`}
                    className={`relative aspect-square grid place-items-center border hover:border-dex-red-light hover:bg-screen-3 ${breedable ? 'bg-screen-2 border-black' : 'bg-bad/10 border-bad/40'}`}>
                    <Icon id={e.mon.id} size={0.9} />
                    {e.note && <span className="absolute top-0 right-0.5 text-warn text-xs">!</span>}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
      <p className="text-xs text-ink-dim mt-2">Fondo rojo = no puede criar. "!" = dato por confirmar (pasa el ratón). {data.team.boxesNote}</p>
    </Panel>
  )
}

function Slot({ label, mon, set, col, filter }: { label: string; mon?: Mon; set: (m: Mon | undefined) => void; col: Entry[]; filter: (m: Mon) => boolean }) {
  const data = useData()
  const options = [...new Map(col.filter((e) => canBreed(e.mon) && filter(e.mon)).map((e) => [e.mon.id, e.mon])).values()]
  return (
    <div className="bg-screen border-2 border-black p-3 space-y-2">
      <div className="flex items-center justify-between"><span className="font-pixel">{label}</span>{mon && <button className="text-xs text-ink-dim underline" onClick={() => set(undefined)}>Quitar</button>}</div>
      <MonPicker data={data} value={mon} onChange={set} placeholder="Cualquier Pokémon (o elige abajo)…" />
      {mon && <div className="text-xs text-ink-dim">{genderText(mon)} · Grupo huevo: {mon.eg.map((g) => EGG_ES[g] ?? g).join(' / ') || '—'}</div>}
      <div className="flex flex-wrap gap-1 max-h-28 overflow-auto scroll-thin">
        {options.map((m) => (
          <button key={m.id} onClick={() => set(m)} title={m.es} aria-pressed={mon?.id === m.id} className="px-1 bg-screen-2 border border-black hover:border-dex-red-light aria-pressed:border-good">
            <Icon id={m.id} size={0.6} />
          </button>
        ))}
      </div>
    </div>
  )
}

function Planner({ mother, father, setMother, setFather, col }: { mother?: Mon; father?: Mon; setMother: (m?: Mon) => void; setFather: (m?: Mon) => void; col: Entry[] }) {
  const data = useData()
  const res = mother && father ? checkPair(data, mother, father) : null
  return (
    <section id="planificador" className="scroll-mt-24">
      <Panel title="Planificador de pareja">
        <div className="grid lg:grid-cols-[1fr_1fr_1.4fr] gap-4 items-start">
          <Slot label="♀ Madre (o con Ditto)" mon={mother} set={setMother} col={col} filter={(m) => canBeMother(m) || isDitto(m)} />
          <Slot label="♂ Padre (o Ditto)" mon={father} set={setFather} col={col} filter={(m) => canBeFather(m) || isDitto(m)} />
          <div>
            {!res && <p className="text-ink-dim">Elige madre y padre (o pulsa Pokémon en tus cajas) y te digo si pueden criar, qué nace y qué objetos ponerles.</p>}
            {res && !res.ok && <div className="p-3 border-2 border-bad bg-bad/10"><div className="font-pixel text-bad text-lg">No pueden criar</div><p className="text-sm mt-1">{res.why}</p></div>}
            {res?.ok && res.baby && <PairResult mother={mother!} father={father!} baby={res.baby} why={res.why} incense={res.incense} />}
          </div>
        </div>
      </Panel>
    </section>
  )
}

function PairResult({ mother, father, baby, why, incense }: { mother: Mon; father: Mon; baby: Mon; why: string; incense?: { item: string; otherwise: Mon | undefined } }) {
  const data = useData()
  const fin = finalOf(data, baby)
  const { data: bd } = useAsync(() => loadDetail(baby.id), [baby.id])
  const dad = isDitto(father) ? undefined : father
  const { data: fd } = useAsync(() => (dad ? loadDetail(dad.id) : Promise.resolve(undefined)), [dad?.id])
  const { data: finDetail } = useAsync(() => loadDetail(fin.id), [fin.id])
  const nat = recommendNature(fin, finDetail?.sets[0])
  const nature = data.natures.find((n) => n.id === nat.id)
  const eggMoves = useMemo(() => {
    if (!bd) return []
    return bd.moves.egg
      .map((id) => ({ id, mv: data.moves[id], score: data.moves[id] ? moveScore(fin, data.moves[id]) : 0 }))
      .filter((x) => x.mv)
      .sort((a, b) => b.score - a.score)
  }, [bd, data, fin])
  const incItem = incense && data.items[`pokeb:${incense.item}`]
  return (
    <motion.div key={mother.id + father.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="p-3 border-2 border-good bg-good/10">
        <div className="font-pixel text-good text-lg">¡Pueden criar!</div>
        <p className="text-sm">{why}</p>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <Link to={`/pokemon/${baby.id}`} className="flex items-center gap-2 bg-screen border-2 border-black px-2 py-1 hover:border-dex-red-light">
            <Icon id={baby.id} /> <div><div className="text-xs text-ink-dim">Nace</div><div className="font-semibold">{baby.es}</div></div>
          </Link>
          {fin.id !== baby.id && <span className="font-pixel text-led">→</span>}
          {fin.id !== baby.id && (
            <Link to={`/pokemon/${fin.id}?tab=usar`} className="flex items-center gap-2 bg-screen border-2 border-black px-2 py-1 hover:border-dex-red-light">
              <Icon id={fin.id} /> <div><div className="text-xs text-ink-dim">Llega a ser</div><div className="font-semibold">{fin.es}</div></div>
            </Link>
          )}
          <span className="flex items-center gap-1"><VerdictBadge v={baby.verdict} /><GradeBadge g={fin.grade} /></span>
          <span className="text-sm text-ink-dim">Eclosión: <b>{hatchSpeed(baby.hc)}</b></span>
        </div>
        {incense && <p className="text-sm text-warn mt-2">Para que nazca {baby.es}, un padre debe llevar {incItem ? <Bilingual es={incItem.es} en={incItem.en} className="font-semibold" /> : incense.item}. Sin él, nace {incense.otherwise?.es}.</p>}
      </div>

      <div className="bg-screen border-2 border-black p-3 text-sm space-y-1">
        <div className="font-pixel mb-1">Objetos para los padres</div>
        <p>• <Bilingual es="Lazo Destino" en="Destiny Knot" className="font-semibold" /> en el padre con <b>mejores IVs</b> (el % de IVs del PC).</p>
        {nature && <p>• <Bilingual es="Piedra Eterna" en="Everstone" className="font-semibold" /> en el que tenga naturaleza <Bilingual es={nature.es} en={nature.en} className="font-semibold" /> (<span className="text-good">+{nature.plusEs}</span> <span className="text-bad">−{nature.minusEs}</span>), la ideal para {fin.es}. Si ninguno la tiene, no hace falta.</p>}
        <p className="text-ink-dim">• Si no los tienes, se compran o salen de cajas. <Link to="/objetos?c=crianza" className="text-led underline">Ver objetos de crianza</Link></p>
      </div>

      {eggMoves.length > 0 && (
        <div className="bg-screen border-2 border-black p-3">
          <div className="font-pixel mb-1">Movimientos huevo de {baby.es}</div>
          <p className="text-xs text-ink-dim mb-2">Solo los aprende si el <b>padre</b> los sabe al criar (o con la <Bilingual es="Hierba Copia" en="Mirror Herb" /> en la guardería). Ordenados de más a menos útiles para {fin.es}.</p>
          <ul className="space-y-1 max-h-64 overflow-auto scroll-thin pr-1">
            {eggMoves.map(({ id, mv }) => {
              const how = fd ? howLearn(fd, id) : null
              return (
                <li key={id} className="flex flex-wrap items-center gap-2 text-sm" title={mv.desc}>
                  <MoveTag mv={mv} />
                  <TypeChip type={mv.type} small />
                  <span className="text-xs text-ink-dim">{mv.pow > 1 ? mv.pow : 'Estado'}</span>
                  <span className={`ml-auto text-xs ${how ? 'text-good' : 'text-ink-dim'}`}>{dad ? (how ? `${dad.es} lo aprende (${how})` : `${dad.es} no lo aprende`) : 'Ditto no pasa movimientos'}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
