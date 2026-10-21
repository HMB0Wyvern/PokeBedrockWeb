import type { Data, Light, Mon, Verdict } from './data'

export const TYPE_ES: Record<string, string> = {
  normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico', grass: 'Planta', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro', steel: 'Acero', fairy: 'Hada',
}
export const TYPE_COLOR: Record<string, string> = {
  normal: '#9fa19f', fire: '#e62829', water: '#2980ef', electric: '#fac000', grass: '#3fa129', ice: '#3dcef3', fighting: '#ff8000', poison: '#9141cb', ground: '#915121', flying: '#81b9ef', psychic: '#ef4179', bug: '#91a119', rock: '#afa981', ghost: '#704170', dragon: '#5060e1', dark: '#624d4e', steel: '#60a1b8', fairy: '#ef70ef',
}
export const TYPES = Object.keys(TYPE_ES)

export const VERDICT: Record<Verdict, { label: string; color: string; text: string }> = {
  top: { label: 'Top', color: '#ffca28', text: 'De lo mejor del juego. Captúralo sí o sí.' },
  muybueno: { label: 'Muy bueno', color: '#66bb6a', text: 'Muy buena opción para tu equipo.' },
  aceptable: { label: 'Aceptable', color: '#4fc3f7', text: 'Sirve, pero hay opciones mejores.' },
  relleno: { label: 'Relleno', color: '#90a4ae', text: 'Flojo. Captúralo solo para misiones o la Pokédex.' },
}

export const LIGHT_ES: Record<Light, { label: string; icon: string; hint: string }> = {
  dia: { label: 'De día', icon: '☀', hint: 'Con luz (nivel de luz 7–15): de día al aire libre.' },
  noche: { label: 'De noche o en cuevas', icon: '☾', hint: 'Con poca luz (nivel 0–7): de noche, o en cuevas y bajo tierra a cualquier hora.' },
  siempre: { label: 'Siempre', icon: '◐', hint: 'Con cualquier luz.' },
}
export const LOC_ES: Record<string, string> = { tierra: 'En tierra', subsuelo: 'Bajo tierra', fondo: 'Fondo del agua', agua: 'Superficie del agua', lava: 'En lava' }
export const RARITY_ES = ['Común', 'Poco común', 'Raro', 'Muy raro']
export const RARITY_COLOR = ['#9ccc65', '#4fc3f7', '#ba68c8', '#ffa726']

export const OBTAIN_ES: Record<string, string> = {
  salvaje: 'Aparece en estado salvaje',
  evolucion: 'Solo evolucionando',
  fosil: 'Fósil: excava en estructuras, límpialo en el Limpiador de fósiles y revívelo en la Máquina de fósiles',
  clonacion: 'Máquina de clonación (con una pestaña de Mew)',
  mega: 'Megaevolución: solo en combate, con su megapiedra',
  gmax: 'Forma Gigamax: aún no disponible en el servidor',
  totem: 'Forma dominante: no se captura',
  forma: 'Forma especial (cambia en combate o con un objeto)',
  especial: 'No aparece en estado salvaje: cajas, eventos o recompensas',
  otro: 'Forma de otra especie',
}

export const STAT_ES = ['PS', 'Ataque', 'Defensa', 'At. Esp.', 'Def. Esp.', 'Velocidad']

const SD = 'https://play.pokemonshowdown.com/sprites/'
export const iconUrl = (id: string) => `https://git.pokebedrock.com/pokebedrock/pokebedrock-res/raw/branch/main/textures/sprites/default/${id}.png`
export const artUrls = (m: Mon) => [`${SD}home-centered/${m.sprite}.png`, `${SD}dex/${m.sprite}.png`, `${SD}gen5/${m.sprite}.png`, iconUrl(m.id)]

/** Habilidades que anulan o reducen un tipo (para avisos en debilidades). */
export const ABILITY_IMMUNITY: Record<string, { type: string; mult: number }> = {
  levitate: { type: 'ground', mult: 0 },
  eartheater: { type: 'ground', mult: 0 },
  flashfire: { type: 'fire', mult: 0 },
  wellbakedbody: { type: 'fire', mult: 0 },
  waterabsorb: { type: 'water', mult: 0 },
  stormdrain: { type: 'water', mult: 0 },
  dryskin: { type: 'water', mult: 0 },
  voltabsorb: { type: 'electric', mult: 0 },
  lightningrod: { type: 'electric', mult: 0 },
  motordrive: { type: 'electric', mult: 0 },
  sapsipper: { type: 'grass', mult: 0 },
  thickfat: { type: 'fire', mult: 0.5 },
  heatproof: { type: 'fire', mult: 0.5 },
  purifyingsalt: { type: 'ghost', mult: 0.5 },
}

export function effectiveness(chart: Data['chart'], atk: string, defTypes: string[]) {
  return defTypes.reduce((m, d) => m * (chart[atk]?.[d] ?? 1), 1)
}

export function defenseProfile(chart: Data['chart'], defTypes: string[]) {
  const out: Record<string, number> = {}
  for (const t of TYPES) out[t] = effectiveness(chart, t, defTypes)
  return out
}

export const multLabel = (m: number) => (m === 0 ? '×0' : m === 0.25 ? '×¼' : m === 0.5 ? '×½' : `×${m}`)

export const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
