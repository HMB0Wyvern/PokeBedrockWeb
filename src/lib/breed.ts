import type { Data, Detail, Mon } from './data'
import { howLearn } from './build'
import { moveScore } from './team'

export const EGG_ES: Record<string, string> = {
  Monster: 'Monstruo', 'Water 1': 'Agua 1', 'Water 2': 'Agua 2', 'Water 3': 'Agua 3', Bug: 'Bicho', Flying: 'Volador', Field: 'Campo', Fairy: 'Hada',
  Grass: 'Planta', 'Human-Like': 'Humanoide', Mineral: 'Mineral', Amorphous: 'Amorfo', Dragon: 'Dragón', Ditto: 'Ditto', Undiscovered: 'Desconocido',
}

/** Bebés que solo nacen si un padre lleva un incienso; si no, nace la especie siguiente. */
export const INCENSE: Record<string, { item: string; otherwise: string }> = {
  azurill: { item: 'sea_incense', otherwise: 'marill' },
  wynaut: { item: 'lax_incense', otherwise: 'wobbuffet' },
  budew: { item: 'rose_incense', otherwise: 'roselia' },
  chingling: { item: 'pure_incense', otherwise: 'chimecho' },
  bonsly: { item: 'rock_incense', otherwise: 'sudowoodo' },
  mimejr: { item: 'odd_incense', otherwise: 'mrmime' },
  happiny: { item: 'luck_incense', otherwise: 'chansey' },
  munchlax: { item: 'full_incense', otherwise: 'snorlax' },
  mantyke: { item: 'wave_incense', otherwise: 'mantine' },
}

export const canBreed = (m: Mon) => m.eg.length > 0 && !m.eg.includes('Undiscovered')
export const isDitto = (m: Mon) => m.eg.includes('Ditto')
export const canBeMother = (m: Mon) => m.gr !== null && m.gr > 0
export const canBeFather = (m: Mon) => m.gr !== null && m.gr < 1

/** Primera forma de la línea evolutiva (lo que sale del huevo). */
export function eggSpecies(data: Data, m: Mon): Mon {
  let c = m
  while (c.pre) {
    const p = data.byId.get(c.pre)
    if (!p) break
    c = p
  }
  return c
}

export function genderText(m: Mon) {
  if (m.gr === null) return 'Sin género'
  if (m.gr === 0) return 'Solo machos'
  if (m.gr === 1) return 'Solo hembras'
  return `${Math.round((1 - m.gr) * 100)} % ♂ · ${Math.round(m.gr * 100)} % ♀`
}

export const hatchSpeed = (hc: number | null) => (hc == null ? '—' : hc <= 10 ? 'Rápida' : hc <= 20 ? 'Normal' : hc <= 30 ? 'Lenta' : 'Muy lenta')

export type PairResult = { ok: boolean; why: string; baby?: Mon; incense?: { item: string; otherwise: Mon | undefined } }

/** ¿Pueden criar juntos? La madre decide la especie (o el que no es Ditto). */
export function checkPair(data: Data, mother: Mon, father: Mon): PairResult {
  for (const m of [mother, father]) {
    if (!canBreed(m)) return { ok: false, why: `${m.es} es del grupo huevo Desconocido (legendarios, bebés y similares): no puede criar.` }
  }
  if (isDitto(mother) && isDitto(father)) return { ok: false, why: 'Dos Ditto no pueden criar entre sí.' }
  const nonDitto = isDitto(mother) ? father : isDitto(father) ? mother : null
  let base: Mon
  if (nonDitto) {
    base = nonDitto
  } else {
    if (mother.gr === null || father.gr === null) return { ok: false, why: `${(mother.gr === null ? mother : father).es} no tiene género: solo puede criar con Ditto.` }
    if (!canBeMother(mother)) return { ok: false, why: `${mother.es} solo puede ser macho: ponlo como padre.` }
    if (!canBeFather(father)) return { ok: false, why: `${father.es} solo puede ser hembra: ponlo como madre.` }
    const shared = mother.eg.filter((g) => father.eg.includes(g))
    if (!shared.length) return { ok: false, why: `No comparten grupo huevo (${mother.eg.map((g) => EGG_ES[g] ?? g).join('/')} vs ${father.eg.map((g) => EGG_ES[g] ?? g).join('/')}).` }
    base = mother
  }
  const baby = eggSpecies(data, base)
  const inc = INCENSE[baby.id]
  const why = nonDitto ? `Con Ditto, nace la especie de ${nonDitto.es}.` : `Comparten el grupo huevo ${mother.eg.filter((g) => father.eg.includes(g)).map((g) => EGG_ES[g] ?? g).join(' y ')}. Nace la especie de la madre.`
  if (inc) return { ok: true, why, baby, incense: { item: inc.item, otherwise: data.byId.get(inc.otherwise) } }
  return { ok: true, why, baby }
}

/** Otros Pokémon de una lista con los que puede criar (en cualquier papel, géneros por confirmar). */
export function partnersIn(data: Data, m: Mon, pool: Mon[]) {
  return pool.filter((p) => p !== m && (checkPair(data, m, p).ok || checkPair(data, p, m).ok))
}

// ---------- Parejas recomendadas ----------
export type Owned = { key: string; mon: Mon; box: string; gender?: 'M' | 'F' | null; rarity?: number }
export type PairTag = 'equipo' | 'capturar' | 'debil'
export type EggMovePick = { id: string; how: string; kit?: string }
export type Pair = {
  target: Mon
  mother: Owned
  father: Owned | null
  baby: Mon
  final: Mon
  tags: PairTag[]
  reasons: string[]
  capture: string | null
  eggMoves: EggMovePick[]
  warns: string[]
  needsDitto: boolean
  alt: Mon[]
  incense?: { item: string; otherwise: Mon | undefined }
  score: number
  /** Modo ideas: pareja de ejemplo con Pokémon salvajes, no con los tuyos */
  ideas?: boolean
}

const KIT_EFFECT_ES: Record<string, string> = { debilitar: 'dejar a 1 PS', dormir: 'dormir', paralizar: 'paralizar' }

/** Línea evolutiva desde el bebé hasta la forma final indicada. */
export function lineOf(data: Data, final: Mon): Mon[] {
  const out: Mon[] = []
  let c: Mon | undefined = final
  while (c) {
    out.unshift(c)
    c = c.pre ? data.byId.get(c.pre) : undefined
  }
  return out
}

/** Forma final de la misma región (Koffing → Weezing, no Weezing de Galar). */
export function finalOf(data: Data, m: Mon) {
  if (!m.fin.length) return m
  const fins = m.fin.map((f) => data.byId.get(f)!).filter(Boolean)
  const regional = (x: Mon) => /-(alola|galar|hisui|paldea)/.test(x.sprite)
  return fins.find((f) => regional(f) === regional(m)) ?? fins[0] ?? m
}

/**
 * Para cada especie que tienes (y puede ser madre), la mejor pareja que ya tienes,
 * qué sale, por qué merece la pena y qué movimientos huevo puede pasar el padre.
 */
export function planPairs(
  data: Data,
  owned: Owned[],
  details: Map<string, Detail>,
  weakTypes: string[],
  resists: (m: Mon, t: string) => boolean,
  gradeText: (m: Mon) => string | null,
  opts: { targets?: Set<string>; ideas?: boolean } = {},
): Pair[] {
  const hasDitto = owned.some((o) => isDitto(o.mon))
  const ditto = owned.find((o) => isDitto(o.mon)) ?? null
  const kitMoves = new Map(data.kit.filter((k) => KIT_EFFECT_ES[k.effect]).map((k) => [k.move, k]))
  const seen = new Set<string>()
  const pairs: Pair[] = []
  for (const m of owned) {
    if (seen.has(m.mon.id) || !canBreed(m.mon) || isDitto(m.mon) || (opts.targets && !opts.targets.has(m.mon.id))) continue
    seen.add(m.mon.id)
    const baby = eggSpecies(data, m.mon)
    const final = finalOf(data, m.mon)
    const lineMons = lineOf(data, final)
    const babyDetail = details.get(baby.id)
    const needsDitto = !canBeMother(m.mon)
    const motherEntry = owned.find((o) => o.mon.id === m.mon.id && o.gender !== 'M') ?? m

    // Candidatos a padre: comparten grupo y pueden ser machos (o Ditto)
    const cands = owned.filter((o) => o.key !== motherEntry.key && o.gender !== 'F' && (needsDitto ? isDitto(o.mon) : checkPair(data, m.mon, o.mon).ok))
    const valuable = (f: Owned): EggMovePick[] => {
      const fd = details.get(f.mon.id)
      if (!babyDetail || !fd || isDitto(f.mon)) return []
      return babyDetail.moves.egg
        .map((id) => ({ id, how: howLearn(fd, id), mv: data.moves[id], kit: kitMoves.get(id) }))
        .filter((x) => x.how && x.mv && (x.kit || moveScore(final, x.mv) >= 110))
        .sort((a, b) => Number(!!b.kit) - Number(!!a.kit) || moveScore(final, b.mv) - moveScore(final, a.mv))
        .slice(0, 3)
        .map((x) => ({ id: x.id, how: x.how!, kit: x.kit ? KIT_EFFECT_ES[x.kit.effect] : undefined }))
    }
    const scored = cands.map((f) => ({ f, moves: valuable(f), s: valuable(f).length * 10 + (f.mon.id === m.mon.id ? 3 : 0) + (f.box === 'Caja 3' ? 1 : 0) + (f.gender === 'M' ? 5 : 0) - (f.box === 'Equipo' ? 8 : 0) - (f.rarity ?? 0) * 3 }))
    scored.sort((a, b) => b.s - a.s)
    const best = scored[0]
    const father = needsDitto ? ditto : best?.f ?? null

    // Por qué
    const tags: PairTag[] = []
    const reasons: string[] = []
    const g = gradeText(final)
    if (final.grade && ['S', 'A', 'B'].includes(final.grade) || ['top', 'muybueno'].includes(final.verdict)) {
      tags.push('equipo')
      reasons.push(g ?? `Llega a ser ${final.es}, con ${final.bst} puntos de estadísticas.`)
    }
    let capture: string | null = null
    for (const k of kitMoves.values()) {
      const hit = lineMons.map((lm) => ({ lm, lv: k.learners.find(([id, lv]) => id === lm.id && lv != null)?.[1] })).find((x) => x.lv != null)
      if (hit) { capture = `${hit.lm.es} aprende ${data.moves[k.move]?.es ?? k.move} (${data.moves[k.move]?.en}) al nivel ${hit.lv}: sirve para ${KIT_EFFECT_ES[k.effect]} al capturar.`; break }
    }
    const kitEgg = best?.moves.find((x) => x.kit)
    if (!capture && kitEgg && !needsDitto) capture = `Si el padre sabe ${data.moves[kitEgg.id].es} (${data.moves[kitEgg.id].en}), ${baby.es} nace sabiéndolo: sirve para ${kitEgg.kit} al capturar.`
    if (capture) { tags.push('capturar'); reasons.push(capture) }
    const covers = weakTypes.filter((t) => resists(final, t))
    if (covers.length) { tags.push('debil'); reasons.push(`${final.es} resiste ${covers.map((t) => TYPE_NAMES[t] ?? t).join(', ')}: tipos que hacen daño a varios de tu equipo.`) }
    if (!reasons.length) reasons.push(`${final.es} es flojo (${final.bst} de estadísticas). Solo para la Pokédex o las misiones de Eclosión.`)

    // Avisos de género
    const warns: string[] = []
    if (opts.ideas) {
      if (father) warns.push(father.mon.id === m.mon.id ? `Captura un macho y una hembra de ${m.mon.es}.` : `Captura una hembra de ${m.mon.es} y un macho de ${father.mon.es}.`)
    } else if (needsDitto) warns.push(m.mon.gr === null ? `${m.mon.es} no tiene género: solo puede criar con un Ditto.` : `${m.mon.es} siempre es macho: para sacar huevos de ${baby.es} necesitas un Ditto.`)
    else {
      if (motherEntry.gender !== 'F' && m.mon.gr! < 1) warns.push(`Tu ${m.mon.es} tiene que ser hembra (lo son el ${Math.round(m.mon.gr! * 100)} %). Míralo en el PC.`)
      if (father && father.gender !== 'M' && !isDitto(father.mon) && father.mon.gr! > 0) warns.push(`Tu ${father.mon.es} tiene que ser macho (lo son el ${Math.round((1 - father.mon.gr!) * 100)} %).`)
      if (!father) warns.push(`No tienes ningún Pokémon de su grupo huevo (${m.mon.eg.map((x) => EGG_ES[x] ?? x).join(' / ')}). Captura otro o consigue un Ditto.`)
    }
    const inc = INCENSE[baby.id]
    const score = (final.grade ? 6 - ['S', 'A', 'B', 'C', 'D'].indexOf(final.grade) : 0) * 10 + final.bst / 20 + (capture ? 15 : 0) + covers.length * 5 - (needsDitto && !hasDitto ? 40 : 0) - (father ? 0 : 40)
    pairs.push({
      target: m.mon, mother: motherEntry, father, baby, final, tags, reasons, capture,
      eggMoves: needsDitto ? [] : best?.moves ?? [], warns, needsDitto: needsDitto && !hasDitto,
      alt: scored.slice(1, 6).map((x) => x.f.mon).filter((x, i, a) => a.findIndex((y) => y.id === x.id) === i && x.id !== father?.mon.id),
      ...(inc ? { incense: { item: inc.item, otherwise: data.byId.get(inc.otherwise) } } : {}),
      score,
      ideas: opts.ideas,
    })
  }
  return pairs.sort((a, b) => b.score - a.score)
}

const TYPE_NAMES: Record<string, string> = {
  normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico', grass: 'Planta', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro', steel: 'Acero', fairy: 'Hada',
}
