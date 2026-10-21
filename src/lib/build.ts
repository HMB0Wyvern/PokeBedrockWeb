import type { Data, Detail, Grade, Mon, MoveSet } from './data'
import { moveScore } from './team'

/** Notas competitivas (según los tiers de Smogon que usa Showdown). */
export const GRADE_INFO: Record<Grade, { color: string; label: string; text: string }> = {
  S: { color: '#ffca28', label: 'S', text: 'De los más fuertes que existen (Uber).' },
  A: { color: '#66bb6a', label: 'A', text: 'Muy fuerte: de lo más usado en combates serios (OU).' },
  B: { color: '#4fc3f7', label: 'B', text: 'Bueno: muy usado un escalón por debajo (UU).' },
  C: { color: '#b0bec5', label: 'C', text: 'Normal: funciona, pero hay opciones mejores (RU/NU).' },
  D: { color: '#78909c', label: 'D', text: 'Flojo en combates serios (PU/ZU). Puede servir para la aventura.' },
}
export const GRADES: Grade[] = ['S', 'A', 'B', 'C', 'D']
export const gradeRank = (g: Grade | null) => (g ? GRADES.indexOf(g) : 9)

/** Roles de los sets de Showdown, explicados. */
export const ROLE_ES: Record<string, { es: string; text: string }> = {
  'Fast Attacker': { es: 'Atacante rápido', text: 'Ataca primero y pega fuerte. Entra, golpea y busca debilitar rápido.' },
  'Bulky Attacker': { es: 'Atacante resistente', text: 'Aguanta golpes y devuelve daño. Menos rápido, pero difícil de tumbar.' },
  'Setup Sweeper': { es: 'Se potencia y arrasa', text: 'Usa un turno para subir sus estadísticas (p. ej. Danza Espada) y luego barre al equipo rival.' },
  'Bulky Setup': { es: 'Resistente que se potencia', text: 'Aguanta mientras sube sus estadísticas y después ataca.' },
  'Fast Bulky Setup': { es: 'Rápido que se potencia', text: 'Rápido y aguantador: se potencia y ataca.' },
  'Bulky Support': { es: 'Apoyo resistente', text: 'Aguanta, cura, pone estados y ayuda al equipo más que atacar.' },
  'Fast Support': { es: 'Apoyo rápido', text: 'Actúa primero para poner estados o preparar el terreno.' },
  Wallbreaker: { es: 'Rompemuros', text: 'Pega muy fuerte para tumbar incluso a los Pokémon más resistentes.' },
  'AV Pivot': { es: 'Atacante con Chaleco Asalto', text: 'Solo ataques de daño y un Chaleco Asalto para aguantar golpes especiales.' },
  'Tera Blast user': { es: 'Se potencia y arrasa', text: 'Sube sus estadísticas y luego ataca.' },
  Staller: { es: 'Apoyo resistente', text: 'Aguanta mucho y desgasta al rival con estados.' },
  'Doubles Support': { es: 'Apoyo', text: 'Ayuda al equipo más que atacar.' },
}

const SETUP = ['Setup Sweeper', 'Bulky Setup', 'Fast Bulky Setup', 'Tera Blast user']
const SUPPORT = ['Bulky Support', 'Fast Support', 'Staller', 'Doubles Support']
const BULKY = ['Bulky Attacker', 'AV Pivot']

export const isPhysical = (mon: Mon) => mon.stats[1] >= mon.stats[3]

/** Rol del Pokémon: el de su primer set, o deducido de sus estadísticas. */
export function roleOf(mon: Mon, set?: MoveSet): string {
  if (set) return set.role
  const [hp, atk, def, spa, spd, spe] = mon.stats
  const off = Math.max(atk, spa)
  if (spe >= 90 && off >= 80) return 'Fast Attacker'
  if (off >= 100) return hp + def + spd > 270 ? 'Bulky Attacker' : 'Wallbreaker'
  if (hp + def + spd >= 280 && off < 85) return 'Bulky Support'
  return 'Bulky Attacker'
}

export const TYPE_BOOST: Record<string, string> = {
  fire: 'charcoal', water: 'mysticwater', electric: 'magnet', grass: 'miracleseed', ice: 'nevermeltice', fighting: 'blackbelt', poison: 'poisonbarb', ground: 'softsand', flying: 'sharpbeak',
  psychic: 'twistedspoon', bug: 'silverpowder', rock: 'hardstone', ghost: 'spelltag', dragon: 'dragonfang', dark: 'blackglasses', steel: 'metalcoat', fairy: 'fairyfeather', normal: 'silkscarf',
}

export type ItemPick = { sid: string; why: string }

/** Objetos recomendados (ids de Showdown) para un Pokémon y un set. */
export function recommendItems(mon: Mon, set?: MoveSet): ItemPick[] {
  const role = roleOf(mon, set)
  const phys = isPhysical(mon)
  const spe = mon.stats[5]
  const out: ItemPick[] = []
  const add = (sid: string, why: string) => { if (!out.some((o) => o.sid === sid)) out.push({ sid, why }) }
  const abil = set?.abil.slice(0, 1) ?? []
  if (['pikachu'].includes(mon.id)) add('lightball', 'Exclusivo de Pikachu: dobla su Ataque y Ataque Especial.')
  if (['cubone', 'marowak', 'marowakalola'].includes(mon.id)) add('thickclub', 'Exclusivo de Cubone y Marowak: dobla su Ataque.')
  if (mon.fin.length && !mon.baby) add('eviolite', 'Mientras no evolucione, sube sus dos defensas ×1,5.')
  if (abil.includes('guts')) add('flameorb', 'Con su habilidad Agallas (Guts), quemarse le sube el Ataque.')
  if (abil.includes('poisonheal')) add('toxicorb', 'Con Antídoto (Poison Heal), el veneno le cura cada turno.')
  const band = phys ? 'choiceband' : 'choicespecs'
  const bandWhy = `Su ${phys ? 'Ataque' : 'Ataque Especial'} ×1,5. Pega muchísimo, pero repite el mismo ataque hasta que lo cambies.`
  if (role === 'Fast Attacker') {
    add('lifeorb', 'Todos sus ataques un 30 % más fuertes sin bloquearle ataques. Pierde un poco de vida al atacar.')
    add(band, bandWhy)
    if (spe >= 60 && spe < 110) add('choicescarf', 'Velocidad ×1,5 para adelantar a rivales más rápidos.')
  } else if (role === 'Wallbreaker') {
    add(band, bandWhy)
    add('lifeorb', 'Un 30 % más de daño sin bloquearle ataques.')
  } else if (SETUP.includes(role)) {
    add('lifeorb', 'Tras potenciarse, un 30 % más de daño.')
    add('lumberry', 'Si le duermen o paralizan mientras se potencia, se cura al momento.')
    add('leftovers', 'Recupera vida cada turno mientras se potencia.')
  } else if (BULKY.includes(role)) {
    add('assaultvest', 'Defensa Especial ×1,5. Ideal porque solo usa ataques de daño.')
    add('leftovers', 'Recupera vida cada turno.')
    if (mon.stats[2] >= 90) add('rockyhelmet', 'Daña a quien le golpee con contacto.')
  } else if (SUPPORT.includes(role)) {
    if (mon.types.includes('poison')) add('blacksludge', 'Como Restos, pero para tipo Veneno: recupera vida cada turno.')
    else add('leftovers', 'Recupera vida cada turno: le permite aguantar mucho más.')
    add('rockyhelmet', 'Castiga a quien le golpee con contacto.')
    add('sitrusberry', 'Se cura ¼ de la vida al bajar de la mitad.')
  }
  const boost = TYPE_BOOST[mon.types[0]]
  if (role !== 'Bulky Support' && boost) add(boost, `Alternativa barata: sus ataques de tipo ${mon.types[0] === 'normal' ? 'Normal' : 'principal'} un 20 % más fuertes.`)
  if (out.length < 3) add('leftovers', 'Recupera vida cada turno: sirve a casi cualquiera.')
  return out.slice(0, 4)
}

/** Naturaleza recomendada (id de Showdown). */
export function recommendNature(mon: Mon, set?: MoveSet): { id: string; why: string } {
  const role = roleOf(mon, set)
  const phys = isPhysical(mon)
  const fast = ['Fast Attacker', 'Fast Support', 'Fast Bulky Setup'].includes(role) || (SETUP.includes(role) && mon.stats[5] >= 90)
  if (SUPPORT.includes(role)) {
    const weakDef = mon.stats[2] < mon.stats[4]
    if (weakDef) return phys ? { id: 'impish', why: 'Sube la Defensa (su punto débil) y baja el At. Esp., que no usa.' } : { id: 'bold', why: 'Sube la Defensa (su punto débil) y baja el Ataque, que no usa.' }
    return phys ? { id: 'careful', why: 'Sube la Def. Esp. y baja el At. Esp., que no usa.' } : { id: 'calm', why: 'Sube la Def. Esp. y baja el Ataque, que no usa.' }
  }
  if (fast) return phys ? { id: 'jolly', why: 'Sube la Velocidad y baja el At. Esp., que no usa.' } : { id: 'timid', why: 'Sube la Velocidad y baja el Ataque, que no usa.' }
  return phys ? { id: 'adamant', why: 'Sube el Ataque y baja el At. Esp., que no usa.' } : { id: 'modest', why: 'Sube el At. Esp. y baja el Ataque, que no usa.' }
}

/** Dónde poner los EVs (índices de estadística). */
export function evPlan(mon: Mon, set?: MoveSet): { stats: number[]; why: string } {
  const role = roleOf(mon, set)
  const main = isPhysical(mon) ? 1 : 3
  if (SUPPORT.includes(role)) {
    const d = mon.stats[2] < mon.stats[4] ? 2 : 4
    return { stats: [0, d], why: 'Más vida y más aguante en su defensa más floja.' }
  }
  if (BULKY.includes(role) || (SETUP.includes(role) && mon.stats[5] < 80)) return { stats: [0, main], why: 'Vida para aguantar y fuerza para pegar.' }
  return { stats: [main, 5], why: 'Toda la fuerza y velocidad posibles: atacar primero y fuerte.' }
}

/** Habilidades del Pokémon ordenadas de mejor a peor. */
export function rankAbilities(data: Data, detail: Detail) {
  const used = new Set(detail.sets.flatMap((s) => s.abil))
  return detail.abilities
    .map(({ slot, id }) => ({ slot, id, a: data.abilities[id], used: used.has(id), rating: data.abilities[id]?.rating ?? 0 }))
    .sort((x, y) => Number(y.used) - Number(x.used) || y.rating - x.rating)
}

/** Cómo aprende un ataque este Pokémon en PokeBedrock. */
export function howLearn(detail: Detail, id: string): string | null {
  const lv = detail.moves.lvl.find(([, m]) => m === id)
  if (lv) return lv[0] <= 1 ? 'Nv. 1' : `Nv. ${lv[0]}`
  if (detail.moves.tm.includes(id)) return 'MT'
  if (detail.moves.tutor.includes(id)) return 'Tutor'
  if (detail.moves.egg.includes(id)) return 'Huevo'
  return null
}

/** Si no hay set de Showdown: los 4 ataques más fuertes que puede aprender, de tipos distintos, priorizando los de su tipo. */
export function computedMoves(data: Data, mon: Mon, detail: Detail, n = 4) {
  const all = [...new Set([...detail.moves.lvl.map(([, id]) => id), ...detail.moves.tm, ...detail.moves.tutor])]
  const scored = all.map((id) => ({ id, mv: data.moves[id], score: data.moves[id] ? moveScore(mon, data.moves[id]) : 0 })).filter((x) => x.score > 0 && !['eruption', 'waterspout', 'hyperbeam', 'gigaimpact', 'focuspunch', 'lastresort'].includes(x.id))
  scored.sort((a, b) => b.score - a.score)
  const out: typeof scored = []
  for (const s of scored) {
    if (out.length >= n) break
    if (out.some((o) => o.mv.type === s.mv.type)) continue
    out.push(s)
  }
  return out.map((o) => o.id)
}

// ---------- Percentiles de estadísticas ----------
let pools: number[][] | null = null
/** % de Pokémon totalmente evolucionados con esa estadística más baja. */
export function percentile(data: Data, stat: number, value: number) {
  pools ??= [0, 1, 2, 3, 4, 5, 6].map((i) =>
    data.index.filter((m) => !m.fin.length && !['mega', 'gmax', 'totem'].includes(m.obtain)).map((m) => (i === 6 ? m.bst : m.stats[i])).sort((a, b) => a - b),
  )
  const arr = pools[stat]
  let lo = 0
  while (lo < arr.length && arr[lo] < value) lo++
  return Math.round((lo / arr.length) * 100)
}
export const levelLabel = (p: number) => (p >= 85 ? 'Muy alto' : p >= 60 ? 'Alto' : p >= 35 ? 'Normal' : p >= 15 ? 'Bajo' : 'Muy bajo')
