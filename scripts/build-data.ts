// Genera public/data/*.json a partir de _sources/ (wiki, showdown, res, mojang-samples, pokeapi, pokemon-behaviors).
// Uso: npm run data
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { BIOMES_ES, BIOME_GROUPS } from './biomes-es'
import { CATALOG, RECOMMENDABLE } from './items-catalog'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, '_sources')
const OUT = path.join(ROOT, 'public', 'data')

const readJson = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'))
const writeJson = (p: string, data: unknown) => {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(data))
}
const toId = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0)

function loadLang(p: string) {
  const map = new Map<string, string>()
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i < 0) continue
    map.set(line.slice(0, i), line.slice(i + 1).split('\t#')[0].replace(/§./g, '').trim())
  }
  return map
}

function readCsv(p: string) {
  const [head, ...rows] = fs.readFileSync(p, 'utf8').trim().split(/\r?\n/)
  const cols = head.split(',')
  return rows.map((r) => {
    const v = r.split(',')
    return Object.fromEntries(cols.map((c, i) => [c, v[i]]))
  })
}

function gitInfo(dir: string) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%H|%cI'], { cwd: dir }).toString().trim()
    const [commit, date] = out.split('|')
    return { commit: commit.slice(0, 10), date }
  } catch {
    return null
  }
}

async function importTs(rel: string) {
  return import(pathToFileURL(path.join(SRC, rel)).href)
}

// ---------- Fuentes ----------
const esLang = loadLang(path.join(SRC, 'res/texts/es_ES.lang'))
const enLang = loadLang(path.join(SRC, 'res/texts/en_US.lang'))
const mcEs = loadLang(path.join(SRC, 'mojang-samples/resource_pack/texts/es_ES.lang'))

const { Pokedex } = await importTs('showdown/data/pokedex.ts')
const { Moves } = await importTs('showdown/data/moves.ts')
const { TypeChart } = await importTs('showdown/data/typechart.ts')
const { Natures } = await importTs('showdown/data/natures.ts')
const { Items } = await importTs('showdown/data/items.ts')
const { Abilities } = await importTs('showdown/data/abilities.ts')
const { FormatsData } = await importTs('showdown/data/formats-data.ts')
const sets9 = readJson(path.join(SRC, 'showdown/data/random-battles/gen9/sets.json'))
const sets7 = readJson(path.join(SRC, 'showdown/data/random-battles/gen7/sets.json'))

const species = readCsv(path.join(SRC, 'pokeapi/pokemon_species.csv'))
const captureByNum = new Map(species.map((s) => [Number(s.id), Number(s.capture_rate)]))
const babyByNum = new Map(species.map((s) => [Number(s.id), s.is_baby === '1']))
const hatchByNum = new Map(species.map((s) => [Number(s.id), Number(s.hatch_counter)]))
const esNameByNum = new Map<number, string>()
const genusByNum = new Map<number, string>()
for (const r of readCsv(path.join(SRC, 'pokeapi/pokemon_species_names.csv'))) {
  if (r.local_language_id === '7') {
    esNameByNum.set(Number(r.pokemon_species_id), r.name)
    if (r.genus) genusByNum.set(Number(r.pokemon_species_id), r.genus)
  }
}

// ---------- Tipos ----------
const TYPES = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']
const cap = (t: string) => t[0].toUpperCase() + t.slice(1)
// chart[atacante][defensor] = multiplicador
const chart: Record<string, Record<string, number>> = {}
for (const atk of TYPES) {
  chart[atk] = {}
  for (const def of TYPES) {
    const code = TypeChart[def].damageTaken[cap(atk)]
    chart[atk][def] = code === 1 ? 2 : code === 2 ? 0.5 : code === 3 ? 0 : 1
  }
}

// ---------- Objetos ----------
const resItems: Record<string, string> = JSON.parse(fs.readFileSync(path.join(SRC, 'res/items.json'), 'utf8').replace(/^\s*\/\/.*$/gm, ''))
const itemTextures = JSON.parse(fs.readFileSync(path.join(SRC, 'res/textures/item_texture.json'), 'utf8').replace(/^\s*\/\/.*$/gm, '')).texture_data
const RES_RAW = 'https://git.pokebedrock.com/pokebedrock/pokebedrock-res/raw/branch/main/'

type ItemOut = { es: string; en: string; desc?: string; icon?: string }
const items: Record<string, ItemOut> = {}
function itemInfo(fullId: string): ItemOut {
  if (items[fullId]) return items[fullId]
  const [ns, raw] = fullId.includes(':') ? fullId.split(':') : ['pokeb', fullId]
  const sid = toId(raw)
  let es = '', en = '', desc: string | undefined, icon: string | undefined
  if (ns === 'pokeb') {
    es = esLang.get(`item.pokeb:${raw}`) ?? esLang.get(`showdown.items.${sid}.name`) ?? ''
    en = enLang.get(`item.pokeb:${raw}`) ?? Items[sid]?.name ?? ''
    desc = esLang.get(`showdown.items.${sid}.shortDesc`) ?? esLang.get(`showdown.items.${sid}.desc`)
    const tex = itemTextures[resItems[fullId] ?? raw]?.textures
    if (typeof tex === 'string') icon = RES_RAW + tex + '.png'
  } else {
    es = mcEs.get(`item.${raw}.name`) ?? mcEs.get(`tile.${raw}.name`) ?? mcEs.get(`item.${raw}`) ?? ''
  }
  const pretty = raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  items[fullId] = { es: es || en || pretty, en: en || pretty, ...(desc ? { desc } : {}), ...(icon ? { icon } : {}) }
  return items[fullId]
}
// Objetos de showdown (equipables) con id pokeb: equivalente
const showdownToPokeb = new Map<string, string>()
for (const id of Object.keys(resItems)) if (id.startsWith('pokeb:')) showdownToPokeb.set(toId(id.slice(6)), id)

// ---------- Ataques ----------
const moveEs = (id: string) => esLang.get(`showdown.moves.${id}.name`)
type MoveOut = { en: string; es: string; type: string; cat: string; pow: number; acc: number | null; pp: number; pri: number; desc?: string; hits?: number; recoil?: boolean; selfKo?: boolean }
const moves: Record<string, MoveOut> = {}
function moveInfo(id: string) {
  if (moves[id]) return moves[id]
  const m = Moves[id]
  if (!m) return null
  moves[id] = {
    en: m.name,
    es: moveEs(id) ?? m.name,
    type: m.type.toLowerCase(),
    cat: m.category === 'Physical' ? 'fisico' : m.category === 'Special' ? 'especial' : 'estado',
    pow: m.basePower ?? 0,
    acc: m.accuracy === true ? null : m.accuracy,
    pp: m.pp,
    pri: m.priority ?? 0,
    desc: esLang.get(`showdown.moves.${id}.shortDesc`) ?? esLang.get(`showdown.moves.${id}.desc`),
    ...(m.multihit ? { hits: Array.isArray(m.multihit) ? (m.multihit[0] === 2 && m.multihit[1] === 5 ? 3.1 : (m.multihit[0] + m.multihit[1]) / 2) : m.multihit } : {}),
    ...(m.recoil || m.mindBlownRecoil ? { recoil: true } : {}),
    ...(m.selfdestruct === 'always' ? { selfKo: true } : {}),
  }
  return moves[id]
}

// ---------- Biomas ----------
const biomeTags: Record<string, Set<string>> = {}
const BDIR = path.join(SRC, 'mojang-samples/behavior_pack/biomes')
for (const f of fs.readdirSync(BDIR)) {
  const b = readJson(path.join(BDIR, f))['minecraft:biome']
  const id = b.description.identifier.replace('minecraft:', '')
  const tags = new Set<string>(b.components?.['minecraft:tags']?.tags ?? [])
  tags.add(id)
  biomeTags[id] = tags
}
const biomes = Object.keys(biomeTags)
  .sort()
  .map((id) => ({ id, es: BIOMES_ES[id]?.[0] ?? id, group: BIOMES_ES[id]?.[1] ?? 'especial' }))

const TAG_ES: Record<string, string> = {
  animal: 'con animales', monster: 'con monstruos', overworld: 'superficie', forest: 'bosque', ocean: 'océano', deep: 'profundo', warm: 'cálido', lukewarm: 'templado', cold: 'frío', frozen: 'helado', ice: 'hielo', taiga: 'taiga', desert: 'desierto', jungle: 'jungla', roofed: 'bosque oscuro', mesa: 'badlands', river: 'río', plains: 'llanuras', savanna: 'sabana', swamp: 'pantano', beach: 'playa', mountain: 'montaña', hills: 'colinas', nether: 'Nether', mega: 'pinos gigantes', rare: 'raro', birch: 'abedul', the_end: 'End', mooshroom_island: 'isla champiñón', mountains: 'montañas', pale_garden: 'jardín pálido', cherry_grove: 'cerezal', meadow: 'pradera', mangrove_swamp: 'manglar', flower_forest: 'bosque de flores', extreme_hills: 'colinas escarpadas', snowy_slopes: 'laderas nevadas', frozen_peaks: 'picos congelados', lush_caves: 'cuevas frondosas', basalt_deltas: 'deltas de basalto', warped_forest: 'bosque distorsionado', crimson_forest: 'bosque carmesí',
}
type Rule = { raw: string; biomes: string[]; dubious: boolean; label: string }
const rules: Rule[] = []
const ruleIndex = new Map<string, number>()
function ruleId(raw: string) {
  if (ruleIndex.has(raw)) return ruleIndex.get(raw)!
  const need = raw.split('+')
  const hits = Object.entries(biomeTags).filter(([, t]) => need.every((n) => t.has(n))).map(([id]) => id)
  // Nombre legible: los biomas reales si son pocos; si no, las etiquetas traducidas (sin las genéricas)
  const names = [...new Set(hits.map((h) => BIOMES_ES[h]?.[0].replace(/ \(variante\)| \(antiguo\)/, '') ?? h))]
  const tagLabel = need.filter((n) => !['animal', 'monster', 'overworld'].includes(n)).map((n) => BIOMES_ES[n]?.[0] ?? TAG_ES[n] ?? n.replace(/_/g, ' ')).join(' + ')
  const label = names.length && names.length <= 3 ? names.join(', ') : cap(tagLabel || 'superficie')
  rules.push({ raw, biomes: hits, dubious: hits.length === 0, label })
  ruleIndex.set(raw, rules.length - 1)
  return rules.length - 1
}

// ---------- Montables ----------
const rideSrc = fs.readFileSync(path.join(SRC, 'pokemon-behaviors/src/data/rideables.ts'), 'utf8')
const rideable: Record<string, string> = {}
let section = ''
for (const line of rideSrc.split(/\r?\n/)) {
  const s = line.match(/\/\/\s*(Land|Air|Water) Mounts/)
  if (s) section = { Land: 'tierra', Air: 'aire', Water: 'agua' }[s[1]]!
  const m = line.match(/^\s{2}([a-z0-9_]+): \{/)
  if (m && section) rideable[m[1]] = section
}

// ---------- Pokémon ----------
const PDIR = path.join(SRC, 'wiki/assets/content/en/pokemon')
const wiki: Record<string, any> = {}
for (const f of fs.readdirSync(PDIR)) wiki[f.replace('.json', '')] = readJson(path.join(PDIR, f))
const ids = Object.keys(wiki)

const evolvesFrom: Record<string, { from: string; evo: any }> = {}
for (const id of ids) for (const e of wiki[id].evolutions ?? []) {
  const to = e.typeId.replace('pokemon:', '')
  if (wiki[to] && !evolvesFrom[to]) evolvesFrom[to] = { from: id, evo: e }
}
function finals(id: string, seen = new Set<string>()): string[] {
  if (seen.has(id)) return [id]
  seen.add(id)
  const next = (wiki[id].evolutions ?? []).map((e: any) => e.typeId.replace('pokemon:', '')).filter((t: string) => wiki[t])
  return next.length ? [...new Set(next.flatMap((n: string) => finals(n, seen)))] : [id]
}
const root = (id: string): string => (evolvesFrom[id] ? root(evolvesFrom[id].from) : id)

const TIME_ES: Record<string, string> = { day: 'de día', night: 'de noche', evening: 'al atardecer', dusk: 'al anochecer' }
function evoText(e: any): string {
  const it = (id: string) => { const i = itemInfo(id); return `${i.es}${i.en && i.en !== i.es ? ` (${i.en})` : ''}` }
  const parts: string[] = []
  switch (e.trigger) {
    case 'level': parts.push(e.level ? `Nivel ${e.level}` : 'Subir de nivel'); break
    case 'useItem': parts.push(`Usar ${e.itemAmount ? e.itemAmount + '× ' : ''}${it(e.item)}`); break
    case 'levelHappiness': parts.push('Subir de nivel con mucha amistad'); break
    case 'levelMove': { const m = moveInfo(e.moveId); parts.push(`Subir de nivel sabiendo ${m ? `${m.es} (${m.en})` : e.move}${e.moveUseTimes ? ` (usarlo ${e.moveUseTimes} veces)` : ''}`); break }
    case 'levelHold': parts.push(`Subir de nivel equipado con ${it(e.item)}`); break
    case 'trade': parts.push(`Intercambio en la Máquina de intercambio${e.item ? ` equipado con ${it(e.item)}` : ''}${e.tradeSpecies ? ` por un ${e.tradeSpecies}` : ''}`); break
    case 'steps': parts.push(`Caminar ${e.steps} pasos con él fuera`); break
    case 'levelExtra': parts.push(e.level ? `Nivel ${e.level}` : 'Subir de nivel'); break
    default: parts.push(e.conditionString ? `Especial: ${e.conditionString}` : 'Condición especial')
  }
  if (e.level && e.trigger !== 'level' && e.trigger !== 'levelExtra') parts.push(`desde nivel ${e.level}`)
  if (e.time) parts.push(TIME_ES[e.time] ?? e.time)
  if (e.gender) parts.push(e.gender === 'M' ? 'solo machos' : 'solo hembras')
  if (e.weather) parts.push(e.weather === 'Rain' ? 'lloviendo' : e.weather)
  if (e.partySpecies) parts.push(`con ${e.partySpecies.join('/')} en el equipo`)
  if (e.partyType) parts.push(`con un tipo ${e.partyType} en el equipo`)
  if (e.partyForms) parts.push('con un Pokémon de Hisui en el equipo')
  if (e.knownMoveType) parts.push(`sabiendo un ataque de tipo ${e.knownMoveType}`)
  if (e.minAffection) parts.push('con mucho afecto')
  if (e.moonPhase) parts.push('con luna llena')
  if (e.biomes) parts.push(`en ${[...new Set(e.biomes.map((b: string) => BIOMES_ES[b.replace('minecraft:', '')]?.[0] ?? b))].slice(0, 3).join(', ')}`)
  if (e.nickName) parts.push(`con el mote "${e.nickName}"`)
  if (e.statusEffect === 'brn') parts.push('estando quemado')
  if (e.relativePhysicalStats !== undefined) parts.push(e.relativePhysicalStats === 1 ? 'con Ataque > Defensa' : e.relativePhysicalStats === -1 ? 'con Ataque < Defensa' : 'con Ataque = Defensa')
  if (e.ability) parts.push(`con la habilidad ${e.ability}`)
  if (['levelExtra', 'other'].includes(e.trigger) && e.conditionString && !parts.some((p) => p.startsWith('Especial'))) parts.push(`(${e.conditionString})`)
  return parts.join(', ')
}

const FOSSILS = new Set([138, 139, 140, 141, 142, 345, 346, 347, 348, 408, 409, 410, 411, 564, 565, 566, 567, 566, 696, 697, 698, 699, 880, 881, 882, 883])
function esName(id: string, w: any, sd: any) {
  const base = esNameByNum.get(sd.num) ?? sd.baseSpecies ?? w.name
  if (!sd.forme) return base
  const f: string = sd.forme
  if (f === 'Mega') return `Mega-${base}`
  if (f.startsWith('Mega-')) return `Mega-${base} ${f.slice(5)}`
  if (f === 'Gmax') return `${base} Gigamax`
  if (f.startsWith('Alola')) return `${base} de Alola`
  if (f.startsWith('Galar')) return `${base} de Galar`
  if (f.startsWith('Hisui')) return `${base} de Hisui`
  if (f.startsWith('Paldea')) return `${base} de Paldea${f.length > 6 ? ' (' + f.slice(7) + ')' : ''}`
  if (f.includes('Totem')) return `${base} dominante`
  return `${base} (${f})`
}
function spriteId(sd: any) {
  const base = toId(sd.baseSpecies ?? sd.name)
  return sd.forme ? `${base}-${toId(sd.forme)}` : base
}
const verdict = (bst: number) => (bst >= 600 ? 'top' : bst >= 500 ? 'muybueno' : bst >= 450 ? 'aceptable' : 'relleno')
const LIGHT = (b: number[]) => (b[0] >= 7 ? 'dia' : b[1] <= 7 ? 'noche' : 'siempre')
const LOC: Record<string, string> = { land: 'tierra', underground: 'subsuelo', seafloor: 'fondo', 'surface-water': 'agua', 'lava-floor': 'lava' }
const RAR: Record<string, number> = { common: 0, uncommon: 1, rare: 2, 'ultra-rare': 3 }

// Nivel competitivo (tiers de Smogon en Showdown) → nota S/A/B/C/D
const GRADE: Record<string, string> = { AG: 'S', Uber: 'S', OU: 'A', UUBL: 'A', UU: 'B', RUBL: 'B', RU: 'C', NUBL: 'C', NU: 'C', PUBL: 'D', PU: 'D', ZUBL: 'D', ZU: 'D' }
const GRADE_ORDER = ['S', 'A', 'B', 'C', 'D']
function tierOf(id: string): string | null {
  const f = FormatsData[id]
  if (!f) return null
  // En National Dex, "RU" es el cajón de sastre (todo lo que no llega a UU): solo cuenta si lo dice el tier de 9.ª gen
  const nd = f.natDexTier?.replace(/[()]/g, '')
  const cands = [nd === 'RU' ? null : nd, f.tier?.replace(/[()]/g, '')].filter((t) => t && GRADE[t]) as string[]
  cands.sort((a: string, b: string) => GRADE_ORDER.indexOf(GRADE[a]) - GRADE_ORDER.indexOf(GRADE[b]))
  if (cands.length) return cands[0]
  return [f.natDexTier, f.tier].some((t) => t === 'NFE' || t === 'LC') ? 'NFE' : null
}
const gradeOf = (id: string) => GRADE[tierOf(id) ?? ''] ?? null
const bestGrade = (gs: (string | null)[]) => gs.filter(Boolean).sort((a, b) => GRADE_ORDER.indexOf(a!) - GRADE_ORDER.indexOf(b!))[0] ?? null
const VORD = ['top', 'muybueno', 'aceptable', 'relleno']
const gradeVerdict: Record<string, string> = { S: 'top', A: 'top', B: 'muybueno' }

const index: any[] = []
const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']
for (const id of ids) {
  const w = wiki[id]
  const sd = Pokedex[id]
  const fin = finals(id)
  const bst = sum(w.stats)
  const finalBst = Math.max(...fin.map((f) => sum(wiki[f].stats)))
  const spawns = (w.spawn_rules ?? []).map((s: any) => [ruleId(s.biome), LIGHT(s.brightness), LOC[s.location] ?? s.location, RAR[s.rarity] ?? 3])
  let obtain = 'otro'
  const ancestorSpawns = (() => { let c = evolvesFrom[id]?.from; while (c) { if (wiki[c].spawn_rules?.length) return true; c = evolvesFrom[c]?.from } return false })()
  if (spawns.length) obtain = 'salvaje'
  else if (id.includes('gmax')) obtain = 'gmax'
  else if (sd.forme?.startsWith('Mega')) obtain = 'mega'
  else if (sd.forme?.includes('Totem')) obtain = 'totem'
  else if (ancestorSpawns) obtain = 'evolucion'
  else if (FOSSILS.has(sd.num)) obtain = 'fosil'
  else if (id === 'mewtwo') obtain = 'clonacion'
  else if (sd.forme) obtain = 'forma'
  else if (w.tags?.length) obtain = 'especial'
  index.push({
    id,
    num: sd.num,
    name: w.name,
    es: esName(id, w, sd),
    types: w.types,
    stats: STAT_KEYS.map((k) => w.stats[k]),
    bst,
    fin: fin.filter((f) => f !== id),
    finalBst,
    verdict: (() => { const g = bestGrade((fin.length ? fin : [id]).map(gradeOf)); const a = verdict(finalBst), b = (g && gradeVerdict[g]) || 'relleno'; return VORD.indexOf(a) <= VORD.indexOf(b) ? a : b })(),
    tier: tierOf(id),
    grade: gradeOf(id),
    fgrade: bestGrade((fin.length ? fin : [id]).map(gradeOf)),
    pre: evolvesFrom[id]?.from ?? null,
    eg: sd.eggGroups ?? [],
    // Proporción de hembras: null = sin género
    gr: w.genderRatio === undefined ? null : w.genderRatio.M === 0 && w.genderRatio.F === 0 ? 0.5 : w.genderRatio.F,
    hc: hatchByNum.get(sd.num) ?? null,
    tags: w.tags ?? [],
    cr: captureByNum.get(sd.num) ?? null,
    wt: sd.weightkg,
    lv: w.level_range,
    sp: spawns,
    obtain,
    sprite: spriteId(sd),
    ride: rideable[id] ?? null,
    baby: babyByNum.get(sd.num) ?? false,
    abil: Object.values(w.abilities ?? {}).map((a: any) => toId(a)),
    sort: w.sortOrder,
  })
}
index.sort((a, b) => a.num - b.num || a.sort - b.sort)

// ---------- Habilidades ----------
const abilities: Record<string, { es: string; en: string; desc?: string; rating: number | null }> = {}
function abilityInfo(name: string) {
  const id = toId(name)
  if (!abilities[id]) abilities[id] = {
    en: name,
    es: esLang.get(`showdown.abilities.${id}.name`) ?? name,
    desc: esLang.get(`showdown.abilities.${id}.shortDesc`) ?? esLang.get(`showdown.abilities.${id}.desc`),
    rating: Abilities[id]?.rating ?? null,
  }
  return id
}

// ---------- Detalle por Pokémon ----------
function chainTree(id: string): any {
  return {
    id,
    evos: (wiki[id].evolutions ?? []).map((e: any) => ({ to: e.typeId.replace('pokemon:', ''), how: evoText(e) })).filter((e: any) => wiki[e.to]).map((e: any) => ({ ...chainTree(e.to), how: e.how })),
  }
}
// Sets de combates aleatorios de Showdown: roles, ataques y habilidades que usan los jugadores
function setsFor(id: string) {
  const src = sets9[id] ? sets9 : sets7[id] ? sets7 : null
  if (!src) return []
  return src[id].sets.map((st: any) => ({
    role: st.role,
    moves: st.movepool.map(toId).filter((m: string) => moveInfo(m)),
    abil: (st.abilities ?? []).map((a: string) => abilityInfo(a)),
    tera: (st.teraTypes ?? []).map((t: string) => t.toLowerCase()),
  }))
}
fs.rmSync(path.join(OUT, 'pokemon'), { recursive: true, force: true })
for (const id of ids) {
  const w = wiki[id]
  const sd = Pokedex[id]
  const lvl: [number, string][] = []
  const tm = new Set<string>(), tutor = new Set<string>(), egg = new Set<string>()
  for (const m of w.moves ?? []) {
    if (!moveInfo(m.move)) continue
    if (m.learnMethod === 'level-up') lvl.push([m.level_learned_at ?? 1, m.move])
    else if (m.learnMethod === 'machine') tm.add(m.move)
    else if (m.learnMethod === 'tutor') tutor.add(m.move)
    else if (m.learnMethod === 'egg') egg.add(m.move)
  }
  lvl.sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1]))
  const abil = Object.entries(w.abilities ?? {}).map(([slot, name]) => ({ slot, id: abilityInfo(name as string) }))
  writeJson(path.join(OUT, 'pokemon', `${id}.json`), {
    id,
    desc: w.description,
    genus: genusByNum.get(sd.num) ?? null,
    abilities: abil,
    ev: w.evYield,
    growth: w.growth_rate,
    gender: w.genderRatio === undefined ? null : w.genderRatio.M === 0 && w.genderRatio.F === 0 ? { M: 0.5, F: 0.5 } : w.genderRatio,
    eggGroups: sd.eggGroups ?? [],
    height: sd.heightm,
    weight: sd.weightkg,
    from: evolvesFrom[id] ? { id: evolvesFrom[id].from, how: evoText(evolvesFrom[id].evo) } : null,
    chain: chainTree(root(id)),
    moves: { lvl, tm: [...tm].sort(), tutor: [...tutor].sort(), egg: [...egg].sort() },
    drops: (w.drops ?? []).map((d: any) => ({ item: d.typeId, n: d.countRange, chance: d.chance })),
    sets: setsFor(id),
  })
  for (const d of w.drops ?? []) itemInfo(d.typeId)
}

// ---------- Kit del capturador ----------
const KIT: { move: string; effect: string; note?: string }[] = [
  { move: 'falseswipe', effect: 'debilitar', note: 'Deja al rival con 1 PS como mínimo: nunca lo debilita.' },
  { move: 'spore', effect: 'dormir', note: 'Precisión 100 %. No afecta a tipo Planta ni a quien lleve Gafas Protectoras (Safety Goggles).' },
  { move: 'sleeppowder', effect: 'dormir', note: 'Precisión 75 %. No afecta a tipo Planta.' },
  { move: 'hypnosis', effect: 'dormir', note: 'Precisión 60 %.' },
  { move: 'sing', effect: 'dormir', note: 'Precisión 55 %.' },
  { move: 'grasswhistle', effect: 'dormir', note: 'Precisión 55 %.' },
  { move: 'lovelykiss', effect: 'dormir', note: 'Precisión 75 %.' },
  { move: 'yawn', effect: 'dormir', note: 'Duerme al rival al turno siguiente.' },
  { move: 'stunspore', effect: 'paralizar', note: 'Precisión 75 %. No afecta a tipo Planta.' },
  { move: 'thunderwave', effect: 'paralizar', note: 'Precisión 90 %. No afecta a tipo Tierra ni Eléctrico.' },
  { move: 'glare', effect: 'paralizar', note: 'Precisión 100 %.' },
  { move: 'nuzzle', effect: 'paralizar', note: 'Hace poco daño y siempre paraliza. No afecta a tipo Tierra.' },
  { move: 'poisonpowder', effect: 'envenenar', note: 'No afecta a tipo Planta, Veneno ni Acero.' },
  { move: 'poisongas', effect: 'envenenar', note: 'No afecta a tipo Veneno ni Acero.' },
  { move: 'toxic', effect: 'envenenar', note: 'No afecta a tipo Veneno ni Acero.' },
  { move: 'willowisp', effect: 'quemar', note: 'Precisión 85 %. No afecta a tipo Fuego.' },
]
const kit = KIT.map((k) => {
  moveInfo(k.move)
  const learners: [string, number | null][] = []
  for (const id of ids) {
    const lv = (wiki[id].moves ?? []).filter((m: any) => m.move === k.move)
    if (!lv.length) continue
    const byLevel = lv.find((m: any) => m.learnMethod === 'level-up')
    learners.push([id, byLevel ? byLevel.level_learned_at ?? 1 : null])
  }
  return { ...k, learners }
})

// ---------- Naturalezas ----------
const STAT_ES: Record<string, string> = { atk: 'Ataque', def: 'Defensa', spa: 'At. Esp.', spd: 'Def. Esp.', spe: 'Velocidad' }
const natures = Object.entries(Natures).map(([id, n]: [string, any]) => ({
  id, en: n.name, es: esLang.get(`forms.pc.nature.${id}`) ?? n.name, plus: n.plus ?? null, minus: n.minus ?? null,
  plusEs: n.plus ? STAT_ES[n.plus] : null, minusEs: n.minus ? STAT_ES[n.minus] : null,
}))

// ---------- Equipo ----------
const team = readJson(path.join(ROOT, 'data/my-team.json'))
for (const p of team.party) {
  if (p.heldItem) {
    const pid = showdownToPokeb.get(p.heldItem) ?? `pokeb:${p.heldItem}`
    p.heldItem = pid
    itemInfo(pid)
  }
  p.moves.forEach((m: string) => moveInfo(m))
}
// Equipables conocidos por showdown (para la página de objetos y el equipo)
for (const [sid, pid] of showdownToPokeb) if (Items[sid]) itemInfo(pid)

// ---------- Catálogo de objetos ----------
const missing: string[] = []
const itemcats = CATALOG.map((c) => ({
  ...c,
  icon: itemInfo(`pokeb:${c.icon}`).icon,
  groups: c.groups.map((g) => ({
    ...g,
    items: g.items.filter(([id]) => (resItems[`pokeb:${id}`] !== undefined || itemTextures[id] ? true : (missing.push(id), false))).map(([id, use, top]) => { itemInfo(`pokeb:${id}`); return { id: `pokeb:${id}`, use, ...(top ? { top: true } : {}) } }),
  })),
}))
// Megapiedras: las que existen en PokeBedrock
const megaGroup = { title: 'Megapiedras', intro: 'Con el Mega-Aro (Mega Ring), el Pokémon que la lleva puede megaevolucionar una vez por combate: cambia de aspecto y sube mucho sus estadísticas. Se compran con puntos de batalla en la Torre Batalla.', items: [] as any[] }
for (const [sid, it] of Object.entries<any>(Items)) {
  if (!it.megaStone || typeof it.megaStone !== 'string') continue
  const pid = showdownToPokeb.get(sid)
  if (!pid) continue
  itemInfo(pid)
  const megaId = toId(it.megaStone)
  megaGroup.items.push({ id: pid, use: `${index.find((m) => m.id === toId(it.megaEvolves))?.es ?? it.megaEvolves}`, mega: megaId, base: toId(it.megaEvolves) })
}
itemcats.push({ id: 'mega', title: 'Megapiedras', icon: itemInfo('pokeb:mega_ring').icon, intro: megaGroup.intro, groups: [{ ...megaGroup, items: megaGroup.items.sort((a, b) => a.use.localeCompare(b.use)) }] } as any)
for (const sid of RECOMMENDABLE) {
  const pid = showdownToPokeb.get(sid)
  if (pid) itemInfo(pid)
  else missing.push(sid)
}
if (missing.length) console.warn(`Objetos del catálogo que no existen en PokeBedrock (se omiten): ${missing.join(', ')}`)

// ---------- Salida ----------
writeJson(path.join(OUT, 'itemcats.json'), itemcats)
writeJson(path.join(OUT, 'index.json'), index)
writeJson(path.join(OUT, 'moves.json'), moves)
writeJson(path.join(OUT, 'abilities.json'), abilities)
writeJson(path.join(OUT, 'items.json'), items)
writeJson(path.join(OUT, 'biomes.json'), { biomes, groups: BIOME_GROUPS, rules })
writeJson(path.join(OUT, 'types.json'), { types: TYPES, chart })
writeJson(path.join(OUT, 'natures.json'), natures)
writeJson(path.join(OUT, 'kit.json'), kit)
writeJson(path.join(OUT, 'team.json'), team)
writeJson(path.join(OUT, 'meta.json'), {
  generatedAt: new Date().toISOString(),
  sources: {
    wiki: gitInfo(path.join(SRC, 'wiki')),
    showdown: gitInfo(path.join(SRC, 'showdown')),
    res: gitInfo(path.join(SRC, 'res')),
    behaviors: gitInfo(path.join(SRC, 'pokemon-behaviors')),
    mojang: gitInfo(path.join(SRC, 'mojang-samples')),
  },
})
console.log(`Pokémon ${index.length} · ataques ${Object.keys(moves).length} · objetos ${Object.keys(items).length} · reglas de spawn ${rules.length} (${rules.filter((r) => r.dubious).length} dudosas) · habilidades ${Object.keys(abilities).length}`)
