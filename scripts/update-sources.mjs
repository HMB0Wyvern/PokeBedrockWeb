// Descarga o actualiza las fuentes de datos en _sources/ (clones superficiales y parciales).
// Uso: npm run update-data
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const SRC = path.resolve(import.meta.dirname, '..', '_sources')
fs.mkdirSync(SRC, { recursive: true })

const REPOS = [
  { dir: 'wiki', url: 'https://git.pokebedrock.com/pokebedrock/wiki.git' },
  { dir: 'showdown', url: 'https://git.pokebedrock.com/pokebedrock/pokebedrock-showdown.git', sparse: ['/*.md', '/data/', '/package.json'] },
  { dir: 'res', url: 'https://git.pokebedrock.com/pokebedrock/pokebedrock-res.git', sparse: ['/*.json', '/*.md', '/texts/', '/textures/item_texture.json'] },
  { dir: 'pokemon-behaviors', url: 'https://github.com/pokebedrock/pokemon-behaviors.git' },
  { dir: 'mojang-samples', url: 'https://github.com/Mojang/bedrock-samples.git', sparse: ['/behavior_pack/biomes/', '/resource_pack/texts/es_ES.lang', '/resource_pack/texts/en_US.lang'] },
]
const git = (args, cwd = SRC) => execFileSync('git', args, { cwd, stdio: 'inherit' })

for (const r of REPOS) {
  const dest = path.join(SRC, r.dir)
  console.log(`\n== ${r.dir}`)
  if (!fs.existsSync(dest)) {
    git(['clone', '--depth', '1', ...(r.sparse ? ['--filter=blob:none', '--sparse'] : []), r.url, r.dir])
    if (r.sparse) git(['sparse-checkout', 'set', '--no-cone', ...r.sparse], dest)
  } else {
    git(['fetch', '--depth', '1', 'origin'], dest)
    git(['reset', '--hard', 'FETCH_HEAD'], dest)
  }
}

const PA = path.join(SRC, 'pokeapi')
fs.mkdirSync(PA, { recursive: true })
for (const f of ['pokemon_species', 'pokemon_species_names']) {
  const res = await fetch(`https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/${f}.csv`)
  if (!res.ok) throw new Error(`PokeAPI ${f}: ${res.status}`)
  fs.writeFileSync(path.join(PA, `${f}.csv`), await res.text())
  console.log(`PokeAPI ${f}.csv OK`)
}
