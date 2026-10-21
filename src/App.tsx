import { Component, createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { HashRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { loadData, useAsync, type Data, type Team } from './lib/data'
import { Icon, TypeChip, useMonSearch, VerdictBadge } from './components/ui'
import Home from './pages/Home'
import Pokedex from './pages/Pokedex'
import PokemonPage from './pages/PokemonPage'
import Where from './pages/Where'
import Catch from './pages/Catch'
import TeamPage from './pages/Team'
import Ranking from './pages/Ranking'
import Items from './pages/Items'
import Battle from './pages/Battle'
import Guides from './pages/Guides'
import Breed from './pages/Breed'

const DataCtx = createContext<Data | null>(null)
export const useData = () => useContext(DataCtx)!

// Equipo editable: el de data/my-team.json es el de base; si alguien lo edita, se guarda solo en su navegador
const TEAM_KEY = 'pb.team'
type TeamApi = { custom: boolean; save: (t: Team) => void; reset: () => void }
const TeamCtx = createContext<TeamApi | null>(null)
export const useTeamEditor = () => useContext(TeamCtx)!
function readSavedTeam(): Team | null {
  try {
    const s = localStorage.getItem(TEAM_KEY)
    return s ? (JSON.parse(s) as Team) : null
  } catch {
    return null
  }
}

const NAV = [
  { to: '/', label: 'Inicio', icon: '⌂' },
  { to: '/capturar', label: 'Capturar', icon: '◓' },
  { to: '/donde', label: '¿Qué hay aquí?', icon: '⌖' },
  { to: '/pokedex', label: 'Pokédex', icon: '▦' },
  { to: '/ranking', label: 'Los mejores', icon: '★' },
  { to: '/equipo', label: 'Mi equipo', icon: '♟' },
  { to: '/combatir', label: 'Combatir', icon: '⚔' },
  { to: '/criar', label: 'Criar', icon: '◯' },
  { to: '/objetos', label: 'Objetos', icon: '◈' },
  { to: '/guias', label: 'Guías', icon: '✎' },
]

function Lights() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-14 h-14 rounded-full bg-white p-1 border-4 border-black">
        <div className="w-full h-full rounded-full bg-led border-2 border-black relative overflow-hidden">
          <div className="absolute top-1 left-1.5 w-3 h-3 rounded-full bg-white/70" />
        </div>
      </div>
      <div className="flex gap-1.5 mt-1">
        {['#ef5350', '#ffee58', '#66bb6a'].map((c) => <span key={c} className="w-3.5 h-3.5 rounded-full border-2 border-black" style={{ background: c }} />)}
      </div>
    </div>
  )
}

function GlobalSearch() {
  const data = useData()
  const fuse = useMonSearch(data)
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const ref = useRef<HTMLInputElement>(null)
  const results = q.trim() ? fuse.search(q, { limit: 8 }).map((r) => r.item) : []
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const go = (id: string) => {
    nav(`/pokemon/${id}`)
    setQ('')
    ref.current?.blur()
  }
  return (
    <div className="relative w-full max-w-xl">
      <div className="flex items-center gap-2 bg-screen border-2 border-black px-3 py-2 mc-bevel">
        <span className="font-pixel text-ink-dim">⌕</span>
        <input
          ref={ref}
          value={q}
          onChange={(e) => { setQ(e.target.value); setSel(0) }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setSel((s) => Math.min(s + 1, results.length - 1))
            if (e.key === 'ArrowUp') setSel((s) => Math.max(s - 1, 0))
            if (e.key === 'Enter' && results[sel]) go(results[sel].id)
            if (e.key === 'Escape') setQ('')
          }}
          placeholder="Busca el Pokémon que te has encontrado (español o inglés)…"
          className="bg-transparent outline-none flex-1 placeholder:text-ink-dim"
        />
        <kbd className="hidden md:inline font-pixel text-[11px] text-ink-dim border border-ink-dim/40 px-1">Ctrl K</kbd>
      </div>
      <AnimatePresence>
        {results.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute z-40 mt-1 w-full screen max-h-[70vh] overflow-auto scroll-thin">
            {results.map((m, i) => (
              <li key={m.id}>
                <button onMouseDown={() => go(m.id)} onMouseEnter={() => setSel(i)} className={`w-full flex items-center gap-3 px-3 py-1.5 text-left ${i === sel ? 'bg-screen-3' : ''}`}>
                  <Icon id={m.id} size={1} />
                  <span className="font-semibold">{m.es}</span>
                  {m.name !== m.es && <span className="text-ink-dim text-sm">{m.name}</span>}
                  <span className="ml-auto flex items-center gap-1">
                    {m.types.map((t) => <TypeChip key={t} type={t} small />)}
                    <VerdictBadge v={m.verdict} />
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

function Shell() {
  const data = useData()
  const loc = useLocation()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [loc.pathname])
  const wikiDate = data.meta.sources.wiki?.date?.slice(0, 10)
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="hidden lg:flex flex-col gap-6 sticky top-0 h-screen bg-dex-red border-r-4 border-dex-red-dark p-5 mc-bevel">
        <Lights />
        <div>
          <div className="font-pixel text-2xl leading-none text-white" style={{ textShadow: '3px 3px 0 #5a1010' }}>PokéBedrock</div>
          <div className="font-pixel text-sm text-white/80 mt-1">Pokédex de bolsillo</div>
        </div>
        <nav className="flex flex-col gap-2">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `mc-btn px-3 py-2 text-left flex items-center gap-2 ${isActive ? 'active' : ''}`}>
              <span className="w-5 text-center">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto text-xs text-white/80 space-y-1">
          <p>Datos de la wiki oficial a {wikiDate}.</p>
          <p>Actualizar: <code className="font-pixel">npm run update-data</code></p>
        </div>
      </aside>
      <div className="min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 lg:px-8 py-3 bg-[#14161b]/90 backdrop-blur border-b-2 border-black">
          <span className="lg:hidden font-pixel text-dex-red-light text-lg">PB</span>
          <GlobalSearch />
        </header>
        <main className="px-4 lg:px-8 py-6 max-w-[1800px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={loc.pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <Routes location={loc}>
                <Route path="/" element={<Home />} />
                <Route path="/pokedex" element={<Pokedex />} />
                <Route path="/pokemon/:id" element={<PokemonPage />} />
                <Route path="/donde" element={<Where />} />
                <Route path="/capturar" element={<Catch />} />
                <Route path="/equipo" element={<TeamPage />} />
                <Route path="/ranking" element={<Ranking />} />
                <Route path="/objetos" element={<Items />} />
                <Route path="/combatir" element={<Battle />} />
                <Route path="/guias" element={<Guides />} />
                <Route path="/criar" element={<Breed />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex overflow-x-auto scroll-thin bg-dex-red border-t-4 border-dex-red-dark">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `shrink-0 min-w-[76px] flex-1 px-1 py-2 text-center text-white text-xs font-pixel whitespace-nowrap ${isActive ? 'bg-dex-red-dark' : ''}`}>
            <div className="text-lg leading-none">{n.icon}</div>
            {n.label.replace('¿Qué hay aquí?', 'Aquí')}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function Loading({ error }: { error?: Error }) {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <motion.div animate={{ rotate: [0, -15, 15, -10, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} className="mx-auto w-16 h-16 rounded-full border-4 border-black overflow-hidden">
          <div className="h-1/2 bg-dex-red" />
          <div className="h-1/2 bg-white" />
        </motion.div>
        <p className="font-pixel mt-4">{error ? `Error: ${error.message}` : 'Cargando la Pokédex…'}</p>
      </div>
    </div>
  )
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="p-6 font-pixel">
        <p className="text-bad text-xl">Algo ha fallado al mostrar esta página.</p>
        <pre className="mt-3 text-sm whitespace-pre-wrap text-ink-dim">{this.state.error.message}{'\n'}{this.state.error.stack}</pre>
        <button className="mc-btn px-3 py-1 mt-4" onClick={() => { this.setState({ error: null }); location.hash = '#/' }}>Volver al inicio</button>
      </div>
    )
  }
}

export default function App() {
  const { data, error } = useAsync(loadData, [])
  const [saved, setSaved] = useState<Team | null>(readSavedTeam)
  const value = useMemo(() => (data ? { ...data, team: saved ?? data.team } : null), [data, saved])
  const api = useMemo<TeamApi>(() => ({
    custom: saved !== null,
    save: (t) => {
      const next = { ...t, updatedAt: new Date().toISOString().slice(0, 10), source: 'Editado en este navegador' }
      setSaved(next)
      try { localStorage.setItem(TEAM_KEY, JSON.stringify(next)) } catch { /* sin almacenamiento */ }
    },
    reset: () => {
      setSaved(null)
      try { localStorage.removeItem(TEAM_KEY) } catch { /* sin almacenamiento */ }
    },
  }), [saved])
  if (!value) return <Loading error={error} />
  return (
    <ErrorBoundary>
      <DataCtx.Provider value={value}>
        <TeamCtx.Provider value={api}>
          <HashRouter>
            <Shell />
          </HashRouter>
        </TeamCtx.Provider>
      </DataCtx.Provider>
    </ErrorBoundary>
  )
}
