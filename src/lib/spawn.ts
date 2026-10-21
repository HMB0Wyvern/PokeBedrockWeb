import type { Data, Light, Mon } from './data'

export type SpawnRow = { rule: number; label: string; biomes: string[]; dubious: boolean; light: Light; loc: string; rarity: number }

export function spawnRows(data: Data, mon: Mon): SpawnRow[] {
  const seen = new Set<string>()
  const out: SpawnRow[] = []
  for (const [rule, light, loc, rarity] of mon.sp) {
    const key = `${rule}|${light}|${loc}`
    if (seen.has(key)) continue
    seen.add(key)
    const r = data.rules[rule]
    out.push({ rule, label: r.label, biomes: r.biomes, dubious: r.dubious, light, loc, rarity })
  }
  return out.sort((a, b) => a.rarity - b.rarity || Number(a.dubious) - Number(b.dubious))
}

/** ¿Este spawn sirve para el bioma, la luz y el lugar elegidos? */
export function spawnMatches(data: Data, sp: Mon['sp'][number], biome: string | null, light: Light | 'todas', loc: string | 'todos') {
  const [rule, l, lc] = sp
  if (biome && !data.rules[rule].biomes.includes(biome)) return false
  if (light !== 'todas' && l !== 'siempre' && l !== light) return false
  if (loc !== 'todos' && lc !== loc) return false
  return true
}

export function biomeName(data: Data, id: string) {
  return data.biomes.find((b) => b.id === id)?.es ?? id
}
