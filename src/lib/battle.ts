import type { Data, Detail, Mon, Move } from './data'
import { takenMult } from './team'

/** Estadística real a un nivel, con IVs medios (15) y sin EVs, naturaleza neutra. */
export function statAt(base: number, level: number, isHp = false, iv = 15, ev = 0) {
  const core = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100)
  return isHp ? core + level + 10 : core + 5
}
export const hpAt = (mon: Mon, level: number) => statAt(mon.stats[0], level, true)

export type Side = { mon: Mon; level: number; ability?: string }

/** Daño de un ataque (sin críticos ni objetos). Devuelve el rango en % de la vida máxima del defensor. */
export function damage(data: Data, atk: Side, def: Side, mv: Move) {
  if (mv.cat === 'estado' || mv.pow <= 1) return null
  const phys = mv.cat === 'fisico'
  const A = statAt(atk.mon.stats[phys ? 1 : 3], atk.level)
  const D = statAt(def.mon.stats[phys ? 2 : 4], def.level)
  const eff = takenMult(data, def.mon, mv.type, def.ability)
  const base = Math.floor(Math.floor((Math.floor((2 * atk.level) / 5 + 2) * mv.pow * A) / D) / 50) + 2
  const stab = atk.mon.types.includes(mv.type) ? 1.5 : 1
  const hits = mv.hits ?? 1
  const acc = (mv.acc ?? 100) / 100
  const max = Math.floor(base * stab * eff) * hits
  const min = Math.floor(max * 0.85)
  const hp = hpAt(def.mon, def.level)
  return { min, max, minPct: (min / hp) * 100, maxPct: (max / hp) * 100, eff, acc, hp }
}

/** Golpes necesarios para debilitar (con el daño mínimo). */
export const hitsToKo = (pct: number) => (pct <= 0 ? Infinity : Math.ceil(100 / pct))

/** Mejor ataque (más daño esperado) de una lista. */
export function bestAttack(data: Data, atk: Side, def: Side, moves: string[]) {
  let best: { id: string; mv: Move; dmg: NonNullable<ReturnType<typeof damage>> } | null = null
  for (const id of moves) {
    const mv = data.moves[id]
    if (!mv) continue
    const d = damage(data, atk, def, mv)
    if (!d) continue
    if (!best || d.maxPct * d.acc > best.dmg.maxPct * best.dmg.acc) best = { id, mv, dmg: d }
  }
  return best
}

/** Ataques que probablemente tenga un Pokémon salvaje o de entrenador: los 4 últimos aprendidos por nivel. */
export function likelyMoves(detail: Detail, level: number) {
  const ids = detail.moves.lvl.filter(([lv]) => lv <= level).map(([, id]) => id)
  return [...new Set(ids.reverse())].slice(0, 4)
}
