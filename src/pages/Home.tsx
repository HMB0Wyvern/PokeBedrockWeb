import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useData } from '../App'
import { spawnRows } from '../lib/spawn'
import { Icon, LightBadge, Panel, TypeChip, useObjetivos, VerdictBadge } from '../components/ui'

const QUICK = [
  { to: '/capturar', title: 'Capturar', text: 'Qué Ball usar, cómo debilitarlo y qué Pokémon llevar para capturar.', icon: '◓' },
  { to: '/donde', title: '¿Qué hay aquí?', text: 'Elige el bioma donde estás y te digo qué merece la pena buscar.', icon: '⌖' },
  { to: '/pokedex', title: 'Pokédex', text: 'Los 1025 Pokémon con filtros por tipo y veredicto.', icon: '▦' },
  { to: '/equipo', title: 'Mi equipo', text: 'Tu equipo, qué mejorar ya y qué capturar para reforzarlo.', icon: '♟' },
  { to: '/ranking', title: 'Los mejores', text: 'Los Pokémon top, por tipo y por estadística, y las mejores habilidades.', icon: '★' },
  { to: '/combatir', title: 'Combatir', text: 'A quién sacar contra un rival o un gimnasio, y la tabla de tipos.', icon: '⚔' },
  { to: '/criar', title: 'Criar', text: 'Paso a paso para sacar huevos y qué parejas puedes hacer con tus cajas.', icon: '◯' },
  { to: '/objetos', title: 'Objetos', text: 'Bayas, objetos para equipar, medicinas, evolución y megapiedras.', icon: '◈' },
  { to: '/guias', title: 'Guías', text: 'Tipos, estadísticas, naturalezas, IVs y EVs, estados, crianza…', icon: '✎' },
]

export default function Home() {
  const data = useData()
  const obj = useObjetivos()
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-pixel text-4xl">¡Hola, entrenador!</h1>
        <p className="text-ink-dim mt-1">¿Te has encontrado un Pokémon? Escríbelo arriba (o pulsa <kbd className="font-pixel">Ctrl K</kbd>) y te digo si merece la pena, dónde sale y cómo capturarlo.</p>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {QUICK.map((q, i) => (
          <motion.div key={q.to} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={q.to} className="block h-full bg-dex-red hover:bg-dex-red-light border-4 border-dex-red-dark p-4 mc-bevel transition-colors">
              <div className="font-pixel text-3xl text-white">{q.icon}</div>
              <div className="font-pixel text-xl text-white mt-1">{q.title}</div>
              <p className="text-white/85 text-sm mt-1">{q.text}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <Panel title="Tu equipo" right={<Link to="/equipo" className="text-sm text-led underline">Ver análisis →</Link>}>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
          {data.team.party.map((p) => {
            const m = data.byId.get(p.species)
            if (!m) return null
            return (
              <Link key={p.species} to={`/pokemon/${m.id}`} className="bg-screen border-2 border-black p-2 hover:border-dex-red-light text-center">
                <div className="grid place-items-center"><Icon id={m.id} /></div>
                <div className="font-semibold">{m.es}</div>
                <div className="font-pixel text-led text-sm">Nv. {p.level}</div>
                <div className="flex justify-center gap-1 mt-1">{m.types.map((t) => <TypeChip key={t} type={t} small />)}</div>
              </Link>
            )
          })}
        </div>
      </Panel>

      <Panel title="Mis objetivos">
        {obj.list.length === 0 ? (
          <p className="text-ink-dim">Aún no tienes objetivos. En la ficha de cualquier Pokémon pulsa "☆ Añadir a objetivos" y aquí verás dónde y cuándo buscarlo.</p>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {obj.list.map((id) => {
              const m = data.byId.get(id)
              if (!m) return null
              const where = spawnRows(data, m).filter((r) => !r.dubious).slice(0, 2)
              return (
                <div key={id} className="flex gap-2 bg-screen border-2 border-black p-2">
                  <Link to={`/pokemon/${id}`}><Icon id={id} /></Link>
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="flex items-center gap-2"><Link to={`/pokemon/${id}`} className="font-semibold underline">{m.es}</Link><VerdictBadge v={m.verdict} /></div>
                    {where.length ? where.map((w, i) => <div key={i} className="text-xs text-ink-dim truncate">{w.label} · <LightBadge l={w.light} /></div>) : <div className="text-xs text-ink-dim">No aparece salvaje</div>}
                  </div>
                  <button onClick={() => obj.toggle(id)} className="text-ink-dim hover:text-bad self-start" title="Quitar">✕</button>
                </div>
              )
            })}
          </div>
        )}
      </Panel>
    </div>
  )
}
