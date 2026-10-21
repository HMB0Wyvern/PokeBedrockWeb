import { useEffect, useState } from 'react'

export type Light = 'dia' | 'noche' | 'siempre'
export type Spawn = [rule: number, light: Light, loc: string, rarity: number]

export type Mon = {
  id: string
  num: number
  name: string
  es: string
  types: string[]
  stats: number[]
  bst: number
  fin: string[]
  finalBst: number
  verdict: Verdict
  tags: string[]
  cr: number | null
  wt: number
  lv: [number, number]
  sp: Spawn[]
  obtain: string
  sprite: string
  ride: string | null
  baby: boolean
  abil: string[]
  /** Tier de Smogon (OU, UU…), 'NFE' si aún evoluciona */
  tier: string | null
  /** Nota competitiva S/A/B/C/D de este Pokémon y la mejor de su evolución final */
  grade: Grade | null
  fgrade: Grade | null
  /** De qué evoluciona */
  pre: string | null
  /** Grupos huevo (nombres de Showdown) */
  eg: string[]
  /** Proporción de hembras (0–1); null = sin género */
  gr: number | null
  /** Ciclos de eclosión (más = tarda más) */
  hc: number | null
}
export type Grade = 'S' | 'A' | 'B' | 'C' | 'D'
export type Verdict = 'top' | 'muybueno' | 'aceptable' | 'relleno'

export type Move = { en: string; es: string; type: string; cat: 'fisico' | 'especial' | 'estado'; pow: number; acc: number | null; pp: number; pri: number; desc?: string; hits?: number; recoil?: boolean; selfKo?: boolean }
export type Item = { es: string; en: string; desc?: string; icon?: string }
export type Ability = { es: string; en: string; desc?: string; rating: number | null }
export type MoveSet = { role: string; moves: string[]; abil: string[]; tera: string[] }
export type CatalogItem = { id: string; use: string; top?: boolean; mega?: string; base?: string }
export type ItemCategory = { id: string; title: string; icon?: string; intro: string; groups: { title: string; intro?: string; items: CatalogItem[] }[] }
export type Rule = { raw: string; biomes: string[]; dubious: boolean; label: string }
export type Biome = { id: string; es: string; group: string }
export type KitEntry = { move: string; effect: string; note?: string; learners: [string, number | null][] }
export type Nature = { id: string; en: string; es: string; plusEs: string | null; minusEs: string | null }
export type TeamMember = {
  species: string
  level: number
  gender: 'M' | 'F' | null
  hp: [number, number]
  heldItem?: string
  moves: string[]
  movesConfirmed?: boolean
  notes?: string
  nature?: string
  ability?: string
  ivs?: number[]
  evs?: number[]
}
export type BoxMon = { species: string | null; label?: string; note?: string; gender?: 'M' | 'F' | null }
export type Box = { name: string; purpose: string; mons: BoxMon[] }
export type Team = { updatedAt: string; source: string; party: TeamMember[]; boxes: Box[]; boxesNote?: string }
export type Detail = {
  id: string
  desc: string
  genus: string | null
  abilities: { slot: string; id: string }[]
  ev: Record<string, number>
  growth: string
  gender: { M: number; F: number } | null
  eggGroups: string[]
  height: number
  weight: number
  from: { id: string; how: string } | null
  chain: Chain
  moves: { lvl: [number, string][]; tm: string[]; tutor: string[]; egg: string[] }
  drops: { item: string; n: [number, number]; chance: number }[]
  sets: MoveSet[]
}
export type Chain = { id: string; how?: string; evos: Chain[] }

export type Data = {
  index: Mon[]
  byId: Map<string, Mon>
  moves: Record<string, Move>
  items: Record<string, Item>
  /** id de Showdown (p. ej. "leftovers") → clave en items ("pokeb:leftovers") */
  itemKey: Map<string, string>
  itemcats: ItemCategory[]
  abilities: Record<string, Ability>
  biomes: Biome[]
  biomeGroups: Record<string, string>
  rules: Rule[]
  chart: Record<string, Record<string, number>>
  kit: KitEntry[]
  natures: Nature[]
  team: Team
  meta: { generatedAt: string; sources: Record<string, { commit: string; date: string } | null> }
}

const base = import.meta.env.BASE_URL + 'data/'
const get = (f: string) => fetch(base + f).then((r) => {
  if (!r.ok) throw new Error(`No se pudo cargar ${f}`)
  return r.json()
})

let cache: Promise<Data> | null = null
export function loadData(): Promise<Data> {
  cache ??= Promise.all(['index.json', 'moves.json', 'items.json', 'abilities.json', 'biomes.json', 'types.json', 'kit.json', 'natures.json', 'team.json', 'meta.json', 'itemcats.json'].map(get)).then(
    ([index, moves, items, abilities, biomes, types, kit, natures, team, meta, itemcats]) => ({
      index,
      byId: new Map((index as Mon[]).map((m) => [m.id, m])),
      moves,
      items,
      itemKey: new Map(Object.keys(items).filter((k) => k.startsWith('pokeb:')).map((k) => [k.slice(6).replace(/[^a-z0-9]/g, ''), k])),
      itemcats,
      abilities,
      biomes: biomes.biomes,
      biomeGroups: biomes.groups,
      rules: biomes.rules,
      chart: types.chart,
      kit,
      natures,
      team,
      meta,
    }),
  )
  return cache
}

const detailCache = new Map<string, Promise<Detail>>()
export function loadDetail(id: string) {
  if (!detailCache.has(id)) detailCache.set(id, get(`pokemon/${id}.json`))
  return detailCache.get(id)!
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data?: T; error?: Error }>({})
  useEffect(() => {
    let alive = true
    setState({})
    fn().then((data) => alive && setState({ data }), (error) => alive && setState({ error }))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}
