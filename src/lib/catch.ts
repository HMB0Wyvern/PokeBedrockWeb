// Probabilidad de captura con los multiplicadores de PokeBedrock (wiki: items/poke-balls).
// La fórmula base es la estándar de los juegos (4 comprobaciones de sacudida); el resultado es una estimación.

export type CatchInput = {
  captureRate: number
  hpPct: number // 1–100
  status: Status
  turn: number
  night: boolean
  water: boolean
  owned: boolean
  level: number
  types: string[]
  baseSpeed: number
  weightKg: number
  charm: boolean
  ultraBeast: boolean
}
export type Status = 'none' | 'sleep' | 'freeze' | 'paralysis' | 'poison' | 'burn'

export const STATUS_ES: Record<Status, string> = {
  none: 'Sin estado',
  sleep: 'Dormido (×2,5)',
  freeze: 'Congelado (×2,5)',
  paralysis: 'Paralizado (×1,5)',
  poison: 'Envenenado (×1,5)',
  burn: 'Quemado (×1,5)',
}
const STATUS_MULT: Record<Status, number> = { none: 1, sleep: 2.5, freeze: 2.5, paralysis: 1.5, poison: 1.5, burn: 1.5 }

export type Ball = {
  id: string
  es: string
  en: string
  icon: string
  rule: string
  recipe?: string
  recipeVerified?: boolean
  mult: (i: CatchInput) => number
  rateBonus?: (i: CatchInput) => number
  always?: boolean
  top?: boolean
}

const icon = (f: string) => `https://git.pokebedrock.com/pokebedrock/pokebedrock-res/raw/branch/main/textures/items/ball/${f}.png`

export const BALLS: Ball[] = [
  { id: 'quick', top: true, es: 'Veloz Ball', en: 'Quick Ball', icon: icon('quick_ball'), rule: '×5 si la lanzas en el turno 1.', recipe: 'Azul + amarillo + azul', mult: (i) => (i.turn <= 1 ? 5 : 1) },
  { id: 'dusk', top: true, es: 'Ocaso Ball', en: 'Dusk Ball', icon: icon('dusk_ball'), rule: '×3 de noche.', recipe: 'Verde + negro + verde', mult: (i) => (i.night ? 3 : 1) },
  { id: 'fast', es: 'Rapid Ball', en: 'Fast Ball', icon: icon('fast_ball'), rule: '×4 si su Velocidad base es 100 o más.', recipe: 'Rojo + amarillo + rojo', mult: (i) => (i.baseSpeed >= 100 ? 4 : 1) },
  { id: 'net', es: 'Malla Ball', en: 'Net Ball', icon: icon('net_ball'), rule: '×3,5 contra tipo Bicho o Agua.', recipe: 'Negro + azul + negro', mult: (i) => (i.types.includes('bug') || i.types.includes('water') ? 3.5 : 1) },
  { id: 'dive', es: 'Buceo Ball', en: 'Dive Ball', icon: icon('dive_ball'), rule: '×3,5 si está en el agua.', recipe: 'Azul + rosa + azul', mult: (i) => (i.water ? 3.5 : 1) },
  { id: 'repeat', es: 'Acopio Ball', en: 'Repeat Ball', icon: icon('repeat_ball'), rule: '×3,5 si ya tienes esa especie.', mult: (i) => (i.owned ? 3.5 : 1) },
  { id: 'nest', es: 'Nido Ball', en: 'Nest Ball', icon: icon('nest_ball'), rule: 'Mejor cuanto menor sea su nivel (por debajo de 30).', recipe: 'Verde + amarillo + verde', mult: (i) => (i.level < 30 ? 1 + (40 - i.level) / 10 : 1) },
  { id: 'timer', top: true, es: 'Turno Ball', en: 'Timer Ball', icon: icon('timer_ball'), rule: 'Mejora cada turno: ×(1 + 0,3 × turno), máximo ×4.', recipe: 'Rojo + negro + blanco', mult: (i) => Math.min(1 + 0.3 * i.turn, 4) },
  {
    id: 'heavy', es: 'Peso Ball', en: 'Heavy Ball', icon: icon('heavy_ball'), rule: 'Suma o resta a la tasa de captura según el peso.', recipe: 'Azul + azul + azul', mult: () => 1,
    rateBonus: (i) => (i.weightKg >= 409.6 ? 40 : i.weightKg >= 307.2 ? 30 : i.weightKg >= 205 ? 20 : i.weightKg >= 102.4 ? 0 : -20),
  },
  { id: 'poke', es: 'Poké Ball', en: 'Poké Ball', icon: icon('poke_ball'), rule: '×1. La más barata: 3 bonguris rojos = 5 tapas.', recipe: '3 rojos (salen 5)', recipeVerified: true, mult: () => 1 },
  { id: 'great', es: 'Super Ball', en: 'Great Ball', icon: icon('great_ball'), rule: '×1: igual que la Poké Ball en PokeBedrock. No merece la pena.', recipe: '2 azules + 1 rojo (salen 3)', recipeVerified: true, mult: () => 1 },
  { id: 'ultra', es: 'Ultra Ball', en: 'Ultra Ball', icon: icon('ultra_ball'), rule: '×1: igual que la Poké Ball en PokeBedrock. No merece la pena.', recipe: '2 negros + 1 amarillo (sale 1)', recipeVerified: true, mult: () => 1 },
  { id: 'master', es: 'Master Ball', en: 'Master Ball', icon: icon('master_ball'), rule: 'Captura siempre. Sale en cajas.', mult: () => 1, always: true },
]

export function catchChance(i: CatchInput, ball: Ball) {
  if (ball.always) return 1
  const rate = Math.max(1, Math.min(255, i.captureRate + (ball.rateBonus?.(i) ?? 0)))
  const maxHp = 100
  const hp = Math.max(1, Math.min(100, i.hpPct))
  let a = ((3 * maxHp - 2 * hp) * rate * ball.mult(i)) / (3 * maxHp)
  a *= STATUS_MULT[i.status]
  if (i.charm) a *= 2
  if (i.ultraBeast) a *= 0.1
  if (a >= 255) return 1
  const b = 65536 / Math.pow(255 / a, 0.1875)
  return Math.pow(b / 65536, 4)
}

/** Balls que no cambian la captura en PokeBedrock (o casi): solo para coleccionar o casos raros. craft = tiene receta de tapa. */
export const OTHER_BALLS: { id: string; es: string; en: string; icon: string; rule: string; craft: boolean; verified?: boolean }[] = [
  { id: 'love', es: 'Amor Ball', en: 'Love Ball', icon: icon('love_ball'), rule: '×8 si ya llevas uno de la misma especie y de género opuesto (y ninguno es sin género).', craft: true, verified: true },
  { id: 'park', es: 'Parque Ball', en: 'Park Ball', icon: icon('park_ball'), rule: 'Captura siempre, como la Master Ball. Existe receta de la Ball, pero la tapa no se puede fabricar.', craft: false, verified: true },
  { id: 'beast', es: 'Ente Ball', en: 'Beast Ball', icon: icon('beast_ball'), rule: 'La única que no sufre el ×0,1 contra Ultraentes. No se fabrica.', craft: false, verified: true },
  { id: 'premier', es: 'Honor Ball', en: 'Premier Ball', icon: icon('premier_ball'), rule: '×1. Solo estética (blanca).', craft: true, verified: true },
  { id: 'level', es: 'Nivel Ball', en: 'Level Ball', icon: icon('level_ball'), rule: '×1 en PokeBedrock: el bonus por nivel no está programado.', craft: true, verified: true },
  { id: 'moon', es: 'Luna Ball', en: 'Moon Ball', icon: icon('moon_ball'), rule: '×1 en PokeBedrock: el bonus no está programado.', craft: true, verified: true },
  { id: 'lure', es: 'Cebo Ball', en: 'Lure Ball', icon: icon('lure_ball'), rule: '×1 en PokeBedrock: el bonus de pesca no está programado.', craft: true, verified: true },
  { id: 'heal', es: 'Sana Ball', en: 'Heal Ball', icon: icon('heal_ball'), rule: '×1. En los juegos cura al Pokémon capturado.', craft: true, verified: true },
  { id: 'friend', es: 'Amigo Ball', en: 'Friend Ball', icon: icon('friend_ball'), rule: '×1 al capturar. En los juegos sube la amistad.', craft: true },
  { id: 'luxury', es: 'Lujo Ball', en: 'Luxury Ball', icon: icon('luxury_ball'), rule: '×1 al capturar. En los juegos sube la amistad más rápido.', craft: true },
  { id: 'sport', es: 'Competi Ball', en: 'Sport Ball', icon: icon('sport_ball'), rule: '×1. Estética.', craft: true, verified: true },
  { id: 'safari', es: 'Safari Ball', en: 'Safari Ball', icon: icon('safari_ball'), rule: '×1. Te las da el guía de la Zona Safari.', craft: true, verified: true },
  { id: 'dream', es: 'Ensueño Ball', en: 'Dream Ball', icon: icon('dream_ball'), rule: '×1. No se fabrica.', craft: false, verified: true },
  { id: 'cherish', es: 'Gloria Ball', en: 'Cherish Ball', icon: icon('cherish_ball'), rule: '×1. De eventos; no se fabrica.', craft: false, verified: true },
  { id: 'gs', es: 'GS Ball', en: 'GS Ball', icon: icon('gs_ball'), rule: '×1. Coleccionable; no se fabrica.', craft: false, verified: true },
]

/** Lanzamientos necesarios para tener un 90 % de probabilidad acumulada. */
export const throwsFor90 = (p: number) => (p >= 1 ? 1 : p <= 0 ? Infinity : Math.ceil(Math.log(0.1) / Math.log(1 - p)))

export const APRICORNS = [
  { color: 'Rojo', hex: '#e53935', biomes: 'Llanuras, bosque y bosque nevado', use: 'Poké Ball (la base de todo), Rapid Ball, Turno Ball', priority: 1 },
  { color: 'Azul', hex: '#1e88e5', biomes: 'Bosque de flores', use: 'Veloz Ball, Malla Ball, Buceo Ball, Peso Ball', priority: 2 },
  { color: 'Amarillo', hex: '#fdd835', biomes: 'Jungla', use: 'Veloz Ball, Rapid Ball, Nido Ball', priority: 3 },
  { color: 'Verde', hex: '#43a047', biomes: 'Bosque de flores', use: 'Ocaso Ball, Nido Ball', priority: 4 },
  { color: 'Negro', hex: '#424242', biomes: 'Bosque oscuro', use: 'Ocaso Ball, Malla Ball', priority: 5 },
  { color: 'Blanco', hex: '#f5f5f5', biomes: 'Bosque de abedules', use: 'Turno Ball', priority: 6 },
  { color: 'Rosa', hex: '#f48fb1', biomes: 'Bosque de flores', use: 'Buceo Ball, Amor Ball', priority: 7 },
]
