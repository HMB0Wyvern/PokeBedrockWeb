import type { Data, Detail, Mon, Move, TeamMember } from './data'
import { ABILITY_IMMUNITY, effectiveness, TYPES } from './poke'

/** Valor de un ataque para este Pokémon: poder × golpes × STAB × si usa su mejor estadística × precisión. */
export function moveScore(mon: Mon, mv: Move) {
  if (mv.cat === 'estado' || mv.pow <= 1 || mv.selfKo) return 0
  const stab = mon.types.includes(mv.type) ? 1.5 : 1
  const [, atk, , spa] = mon.stats
  const best = atk >= spa ? 'fisico' : 'especial'
  const ratio = mv.cat === best ? 1 : Math.min(atk, spa) / Math.max(atk, spa)
  return mv.pow * (mv.hits ?? 1) * stab * ratio * ((mv.acc ?? 100) / 100) * (mv.recoil ? 0.8 : 1)
}

export type Upgrade = { from: string; to: string; gain: number; reason: string }

/**
 * Ataques mejores que ya puede aprender por nivel (hasta su nivel actual).
 * 1.º sustituye ataques por otros más fuertes del mismo tipo.
 * 2.º si dos ataques comparten tipo, cambia el más flojo por uno de su propio tipo (STAB).
 * Nunca toca ataques de estado ni de prioridad (p. ej. Ataque Rápido).
 */
export function suggestUpgrades(data: Data, member: TeamMember, mon: Mon, detail: Detail): Upgrade[] {
  const known = new Set(member.moves)
  const learnable = [...new Set(detail.moves.lvl.filter(([lv]) => lv <= member.level).map(([, id]) => id))].filter((id) => !known.has(id) && data.moves[id] && moveScore(mon, data.moves[id]) > 0)
  const current = member.moves
    .map((id) => ({ id, mv: data.moves[id], score: data.moves[id] ? moveScore(mon, data.moves[id]) : 0 }))
    .filter((c) => c.mv && c.mv.cat !== 'estado' && c.mv.pri <= 0)
    .sort((a, b) => a.score - b.score)
  const used = new Set<string>()
  const replaced = new Set<string>()
  const out: Upgrade[] = []
  const finalTypes = () => member.moves.map((id) => out.find((u) => u.from === id)?.to ?? id).map((id) => data.moves[id]?.type)

  const pick = (cur: (typeof current)[number], ok: (mv: Move) => boolean) => {
    let best: { id: string; score: number } | null = null
    for (const id of learnable) {
      if (used.has(id)) continue
      const mv = data.moves[id]
      const sc = moveScore(mon, mv)
      if (ok(mv) && sc > cur.score * 1.15 && sc > (best?.score ?? 0)) best = { id, score: sc }
    }
    if (!best) return
    used.add(best.id)
    replaced.add(cur.id)
    const mv = data.moves[best.id]
    const reason = [
      mon.types.includes(mv.type) && !mon.types.includes(cur.mv.type) ? 'Es de su tipo: pega un 50 % más.' : '',
      cur.mv.cat !== mv.cat ? `Usa su ${mv.cat === 'fisico' ? 'Ataque' : 'Ataque Especial'}, que es su mejor estadística.` : '',
      mv.type === cur.mv.type && mv.cat === cur.mv.cat ? 'Mismo tipo, más potente.' : '',
      best.id === 'eruption' || best.id === 'waterspout' ? 'Ojo: pierde fuerza cuanta menos vida le quede.' : '',
      mv.recoil ? 'Ojo: le quita algo de vida al usarlo.' : '',
    ].filter(Boolean).join(' ')
    out.push({ from: cur.id, to: best.id, gain: Math.round(best.score - cur.score), reason })
  }

  const bestCat = mon.stats[1] >= mon.stats[3] ? 'fisico' : 'especial'
  for (const cur of current) pick(cur, (mv) => mv.type === cur.mv.type && (mv.cat === cur.mv.cat || mv.cat === bestCat))
  for (const cur of current) {
    if (replaced.has(cur.id)) continue
    const dupes = finalTypes().filter((t) => t === cur.mv.type).length
    if (dupes >= 2) pick(cur, (mv) => mon.types.includes(mv.type) && !finalTypes().includes(mv.type))
  }
  return out
}

export function nextMoves(detail: Detail, level: number, n = 4) {
  return detail.moves.lvl.filter(([lv]) => lv > level).slice(0, n)
}

export function pendingEvolution(detail: Detail, id: string) {
  const find = (c: Detail['chain']): Detail['chain'] | null => (c.id === id ? c : c.evos.map(find).find(Boolean) ?? null)
  return find(detail.chain)?.evos ?? []
}

/** Multiplicador que recibe un Pokémon contra un tipo, teniendo en cuenta su habilidad si se conoce o si todas sus habilidades coinciden. */
export function takenMult(data: Data, mon: Mon, atk: string, ability?: string) {
  let m = effectiveness(data.chart, atk, mon.types)
  const abil = ability ? [ability] : mon.abil
  const imm = abil.map((a) => ABILITY_IMMUNITY[a]).filter((x) => x && x.type === atk)
  if (imm.length && imm.length === abil.length) m *= imm[0].mult
  return m
}

export function teamWeaknesses(data: Data, members: { mon: Mon; member: TeamMember }[]) {
  return TYPES.map((t) => {
    const mults = members.map(({ mon, member }) => takenMult(data, mon, t, member.ability))
    return { type: t, mults, weak: mults.filter((m) => m > 1).length, resist: mults.filter((m) => m < 1).length }
  })
}

/** Tipos a los que el equipo pega superefectivo con los ataques que tiene ahora. */
export function teamCoverage(data: Data, members: TeamMember[]) {
  const atkTypes = new Set<string>()
  for (const m of members) for (const id of m.moves) {
    const mv = data.moves[id]
    if (mv && mv.cat !== 'estado' && mv.pow > 0) atkTypes.add(mv.type)
  }
  return TYPES.map((def) => ({ type: def, by: [...atkTypes].filter((a) => data.chart[a][def] > 1) }))
}

/** Candidatos a capturar que tapan las debilidades del equipo. */
export function recruits(data: Data, weakTypes: string[], exclude: Set<string>, limit = 12) {
  if (!weakTypes.length) return []
  return data.index
    .filter((m) => m.sp.length && !m.tags.length && !exclude.has(m.id) && (m.verdict === 'top' || m.verdict === 'muybueno'))
    .map((m) => {
      // Valora la línea evolutiva final: lo que importa es en qué se convierte
      const finalMon = m.fin.length ? data.byId.get(m.fin[0]) ?? m : m
      const covers = weakTypes.filter((t) => takenMult(data, finalMon, t) < 1)
      return { mon: m, finalMon, covers }
    })
    .filter((x) => x.covers.length > 0)
    .sort((a, b) => b.covers.length - a.covers.length || b.mon.finalBst - a.mon.finalBst)
    .filter((x, i, arr) => arr.findIndex((y) => y.finalMon.id === x.finalMon.id) === i)
    .slice(0, limit)
}
