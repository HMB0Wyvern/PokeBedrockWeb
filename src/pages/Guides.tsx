import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useData } from '../App'
import type { Data } from '../lib/data'
import { Bilingual, Panel, TypeChip } from '../components/ui'

type Guide = { id: string; title: string; icon: string; body: (data: Data) => ReactNode }

const H = ({ children }: { children: ReactNode }) => <h3 className="font-pixel text-lg mt-5 mb-2 text-led">{children}</h3>
const Tip = ({ children }: { children: ReactNode }) => <div className="my-3 p-3 border-l-4 border-good bg-good/10 text-sm">{children}</div>
const Warn = ({ children }: { children: ReactNode }) => <div className="my-3 p-3 border-l-4 border-warn bg-warn/10 text-sm">{children}</div>
const Code = ({ children }: { children: ReactNode }) => <code className="font-pixel text-warn bg-black/30 px-1">{children}</code>

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto scroll-thin my-2">
      <table className="w-full text-left text-sm">
        <thead className="font-pixel text-xs text-ink-dim"><tr>{head.map((h) => <th key={h} className="pb-1 pr-3">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-screen-3 align-top">{r.map((c, j) => <td key={j} className="py-1.5 pr-3">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

const GUIDES: Guide[] = [
  {
    id: 'empezar',
    title: 'Primeros pasos',
    icon: '⌂',
    body: () => (
      <>
        <p>PokeBedrock es Minecraft Bedrock con Pokémon. Te mueves por el mundo, los Pokémon aparecen según el bioma, la luz y el lugar, y los combates usan Showdown (el mismo motor que el simulador de Pokémon más usado).</p>
        <H>Comandos que vas a usar</H>
        <Table head={['Comando', 'Para qué']} rows={[
          [<Code>/warp</Code>, 'Ir a la zona de inicio, gimnasios, tiendas, cajas…'],
          [<Code>/home</Code>, 'Guardar tu casa o volver a ella.'],
          [<Code>/wild</Code>, 'Ir a un sitio al azar del mundo salvaje.'],
          [<Code>/back</Code>, 'Volver a donde estabas.'],
          [<Code>/quests</Code>, 'Ver las misiones (dan llaves de cajas y dinero).'],
          [<Code>/scores list</Code>, 'Ver tus llaves de cajas y puntos de batalla.'],
          [<Code>/pokebuilder</Code>, 'Cambiar IVs, EVs, naturaleza, habilidad… con fichas.'],
          [<Code>/claim manage</Code>, 'Gestionar tu terreno protegido.'],
          [<Code>/battle leave</Code>, 'Salir de un combate atascado.'],
          [<Code>/playtime rewards</Code>, 'Recoger premios por tiempo jugado.'],
          [<Code>/ah</Code>, 'Casa de subastas (comprar y vender a otros jugadores).'],
        ]} />
        <H>Sitios que visitar</H>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Centro Pokémon</b>: la Máquina de curación cura a todo tu equipo gratis.</li>
          <li><b>PokéParadas</b>: delante de gimnasios y lugares de la zona de inicio. Regalan Poké Balls, Huevo Suerte (Lucky Egg), Repartir Exp (Exp Share) y objetos de combate.</li>
          <li><b>Distrito comercial</b>: 16 tiendas que venden por PokéDólares.</li>
          <li><b>Guardería</b>: para criar huevos. <Link to="/guias?g=crianza" className="text-led underline">Ver guía</Link>.</li>
          <li><b>Torre Batalla</b> y <b>gimnasios</b>: <Link to="/guias?g=servidor" className="text-led underline">ver guía</Link>.</li>
        </ul>
        <Warn>Cada temporada (más o menos una vez al año) el mundo se reinicia y <b>solo conservas 12 Pokémon</b>. Ten pensado cuáles guardarías.</Warn>
      </>
    ),
  },
  {
    id: 'tipos',
    title: 'Tipos y daño',
    icon: '◆',
    body: () => (
      <>
        <p>Cada Pokémon tiene 1 o 2 tipos, y cada ataque tiene 1 tipo. Cuando un ataque golpea, su tipo se compara con los del rival:</p>
        <ul className="list-disc pl-5 space-y-1 my-2">
          <li><b className="text-good">Superefectivo (×2)</b>: por ejemplo, Agua contra Fuego.</li>
          <li><b className="text-bad">Poco efectivo (×½)</b>: Fuego contra Agua.</li>
          <li><b>No afecta (×0)</b>: Normal contra Fantasma.</li>
          <li>Con dos tipos se multiplica: un ataque de Hielo contra un Pokémon Dragón/Volador hace <b>×4</b>.</li>
        </ul>
        <Tip>Ejemplo: contra un <TypeChip type="water" small /> usa ataques <TypeChip type="electric" small /> o <TypeChip type="grass" small />. La <Link to="/combatir?t=tabla" className="text-led underline">tabla de tipos</Link> los tiene todos.</Tip>
        <H>STAB: +50 % si el ataque es de tu tipo</H>
        <p>Si un Pokémon usa un ataque de su mismo tipo, pega un 50 % más. Por eso un Typhlosion (Fuego) pega mucho más con Lanzallamas (Flamethrower) que con un ataque Normal del mismo poder.</p>
        <H>Físico o especial</H>
        <p>Los ataques <b>físicos</b> usan el Ataque de quien ataca y la Defensa del rival. Los <b>especiales</b> usan el Ataque Especial y la Defensa Especial. Mira qué estadística tiene más alta tu Pokémon y dale ataques de esa clase. La ficha de cada Pokémon te lo dice en "Ataca mejor con".</p>
        <H>Ataques de estado</H>
        <p>No hacen daño: duermen, paralizan, suben tus estadísticas o bajan las del rival. Para capturar son clave: <Link to="/guias?g=estados" className="text-led underline">ver estados</Link>.</p>
      </>
    ),
  },
  {
    id: 'stats',
    title: 'Estadísticas',
    icon: '▤',
    body: () => (
      <>
        <Table head={['Estadística', 'Qué hace']} rows={[
          ['PS', 'La vida. Al llegar a 0, el Pokémon se debilita.'],
          ['Ataque', 'Fuerza de los ataques físicos.'],
          ['Defensa', 'Aguante contra ataques físicos.'],
          ['At. Esp.', 'Fuerza de los ataques especiales.'],
          ['Def. Esp.', 'Aguante contra ataques especiales.'],
          ['Velocidad', 'Quién ataca primero en cada turno.'],
        ]} />
        <p className="mt-2">Las <b>estadísticas base</b> son fijas para cada especie: es lo que muestran la Pokédex y las fichas. Su suma (el "total") es la forma rápida de saber si una especie es fuerte: 600 o más es top; menos de 450, flojo.</p>
        <p className="mt-2">Las estadísticas reales de tu Pokémon salen de las base + su nivel + sus <Link to="/guias?g=ivs" className="text-led underline">IVs, EVs</Link> y su <Link to="/guias?g=naturalezas" className="text-led underline">naturaleza</Link>.</p>
        <Tip>En la ficha de cada Pokémon verás si cada estadística es "Muy alta" o "Baja" comparada con el resto, y su nota competitiva (S, A, B, C, D) en <Link to="/ranking" className="text-led underline">Los mejores</Link>.</Tip>
      </>
    ),
  },
  {
    id: 'naturalezas',
    title: 'Naturalezas',
    icon: '☯',
    body: (data) => (
      <>
        <p>Cada Pokémon tiene una naturaleza que sube un 10 % una estadística y baja un 10 % otra (algunas son neutras). Elige una que suba lo que usa y baje lo que no usa: un atacante físico no necesita At. Esp.</p>
        <Tip>Se cambia con <Code>/pokebuilder</Code>. En "Cómo usarlo" de cada ficha tienes la recomendada.</Tip>
        <Table head={['Naturaleza', 'Sube', 'Baja']} rows={data.natures.map((n) => [
          <Bilingual es={n.es} en={n.en} className="font-semibold" />,
          n.plusEs ? <span className="text-good">+{n.plusEs}</span> : <span className="text-ink-dim">—</span>,
          n.minusEs ? <span className="text-bad">−{n.minusEs}</span> : <span className="text-ink-dim">—</span>,
        ])} />
        <H>Las más usadas</H>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Firme (Adamant)</b>: +Ataque −At. Esp. Para atacantes físicos.</li>
          <li><b>Alegre (Jolly)</b>: +Velocidad −At. Esp. Atacantes físicos rápidos.</li>
          <li><b>Modesta (Modest)</b>: +At. Esp. −Ataque. Atacantes especiales.</li>
          <li><b>Miedosa (Timid)</b>: +Velocidad −Ataque. Atacantes especiales rápidos.</li>
          <li><b>Osada (Bold)</b> y <b>Serena (Calm)</b>: para Pokémon que aguantan.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ivs',
    title: 'IVs y EVs',
    icon: '✦',
    body: () => (
      <>
        <H>IVs: los "genes"</H>
        <p>Cada Pokémon nace con un valor de 0 a 31 en cada estadística. Un 31 es perfecto. A nivel 100, cada punto de IV es un punto más en esa estadística. No cambian solos: se mejoran con <Code>/pokebuilder</Code> (10 fichas por punto, con un botón "Maximizar todos los IVs") o criando con el Lazo Destino (Destiny Knot).</p>
        <Tip>En el PC del juego ves "IVs (46 %)": es la suma de sus IVs dividida entre 186 (6 × 31). Por encima del 70 % es un buen ejemplar.</Tip>
        <H>EVs: el entrenamiento</H>
        <p>Se ganan derrotando Pokémon: cada especie da EVs en una estadística concreta (lo verás en "Evolución y más" → "EVs que da al derrotarlo"). Máximo <b>252 por estadística</b> y <b>510 en total</b>. A nivel 100, cada 4 EVs es un punto más.</p>
        <ul className="list-disc pl-5 space-y-1 my-2">
          <li><b>Cómo conseguirlos rápido</b>: derrota muchos Pokémon que den el EV que quieres, con un Objeto Poder (Power Item) equipado; o usa vitaminas (Proteína, Calcio…); o <Code>/pokebuilder</Code> (1 ficha por punto).</li>
          <li><b>Cómo quitarlos</b>: las bayas EV (Grana, Algama, Ispero, Meluce, Uvav, Tamate) o el reinicio de <Code>/pokebuilder</Code> (250 fichas).</li>
          <li>Lo normal es <b>252 + 252 + 4</b>: dos estadísticas al máximo. Cada ficha te dice cuáles en "Cómo usarlo".</li>
        </ul>
        <p>En el PC, "EVs (x %)" es la suma de EVs entre 510.</p>
        <p className="mt-2"><Link to="/objetos?c=entrenar" className="text-led underline">Ver Objetos Poder y vitaminas →</Link></p>
      </>
    ),
  },
  {
    id: 'estados',
    title: 'Estados alterados',
    icon: '☣',
    body: () => (
      <>
        <p>Un Pokémon solo puede tener un estado a la vez. Sirven para ganar combates y, sobre todo, para <b>capturar</b>: un Pokémon dormido es mucho más fácil de atrapar.</p>
        <Table head={['Estado', 'En combate', 'Al capturar']} rows={[
          [<b>Dormido</b>, 'No puede atacar durante 1–3 turnos.', <b className="text-good">×2,5</b>],
          [<b>Congelado</b>, 'No puede atacar hasta descongelarse (20 % cada turno).', <b className="text-good">×2,5</b>],
          [<b>Paralizado</b>, 'Velocidad a la mitad y un 25 % de no poder moverse.', <b className="text-good">×1,5</b>],
          [<b>Quemado</b>, 'Pierde 1/16 de vida cada turno y sus ataques físicos pegan la mitad.', <b className="text-good">×1,5</b>],
          [<b>Envenenado</b>, 'Pierde 1/8 de vida cada turno (gravemente: cada vez más).', <b className="text-good">×1,5</b>],
          [<b>Confuso</b>, 'A veces se golpea a sí mismo. Dura unos turnos.', <span className="text-ink-dim">No ayuda</span>],
        ]} />
        <Warn>Quemar o envenenar a un Pokémon salvaje le va quitando vida: ¡vigila que no se debilite antes de capturarlo! Dormir o paralizar es más seguro.</Warn>
        <p>Los Pokémon que enseñan estos ataques están en <Link to="/capturar" className="text-led underline">Capturar → Kit del capturador</Link>. Para curar los estados de los tuyos: <Link to="/objetos?c=bayas" className="text-led underline">bayas</Link> y <Link to="/objetos?c=medicinas" className="text-led underline">medicinas</Link>.</p>
      </>
    ),
  },
  {
    id: 'niveles',
    title: 'Subir de nivel rápido',
    icon: '▲',
    body: () => (
      <>
        <ul className="list-disc pl-5 space-y-2">
          <li><b>Huevo Suerte (Lucky Egg)</b>: +50 % de experiencia al que lo lleva. Equípaselo al que más quieras subir.</li>
          <li><b>Repartir Exp (Exp Share)</b>: el equipo entero gana experiencia aunque no combata.</li>
          <li><b>Caramelos Raros y Caramelos Exp</b>: salen en cajas, PokéParadas y misiones. Guárdalos para los Pokémon que más uses.</li>
          <li><b>Zona EXP/EV</b> de la zona de inicio: entrenadores para ganar experiencia y EVs una vez desbloqueados con tu nivel de entrenador (TXP).</li>
          <li><b>Pelea contra Pokémon de tu nivel o algo más alto</b>: dan más experiencia.</li>
        </ul>
        <Tip>Tus Pokémon aprenden ataques nuevos al subir de nivel. En <Link to="/equipo" className="text-led underline">Mi equipo</Link> ves cuáles vienen y si mejoran a los que tienen.</Tip>
      </>
    ),
  },
  {
    id: 'evolucion',
    title: 'Evolucionar',
    icon: '➜',
    body: () => (
      <>
        <p>Cada ficha de Pokémon te dice exactamente cómo evoluciona (pestaña "Evolución y más"). Las formas habituales:</p>
        <Table head={['Forma', 'Ejemplo']} rows={[
          ['Subir a cierto nivel', 'Charmander → Charmeleon al nivel 16.'],
          ['Usar una piedra', 'Pikachu + Piedra Trueno (Thunder Stone) → Raichu.'],
          ['Intercambio', 'Intercámbialo en la Máquina de intercambio, a veces llevando un objeto (Haunter → Gengar; Onix + Revestimiento Metálico (Metal Coat) → Steelix).'],
          ['Amistad', 'Subir de nivel con mucha amistad (Golbat → Crobat). El Cascabel Alivio (Soothe Bell) ayuda.'],
          ['Hora del día', 'Eevee con amistad: de día Espeon, de noche Umbreon.'],
          ['Saber un ataque', 'Subir de nivel sabiendo un ataque concreto.'],
        ]} />
        <Warn>La Piedra Eterna (Everstone) equipada impide evolucionar. Úsala si quieres que un Pokémon se quede como está.</Warn>
        <p><Link to="/objetos?c=evolucion" className="text-led underline">Ver todos los objetos de evolución →</Link></p>
      </>
    ),
  },
  {
    id: 'habilidades',
    title: 'Habilidades',
    icon: '✧',
    body: () => (
      <>
        <p>Cada Pokémon tiene una habilidad que actúa sola. Algunas son muy potentes (Levitación (Levitate) le hace inmune a Tierra; Potencia (Huge Power) dobla su Ataque) y otras casi no hacen nada.</p>
        <ul className="list-disc pl-5 space-y-1 my-2">
          <li>Cada especie puede tener 1 o 2 habilidades normales y una <b>oculta</b>, más rara.</li>
          <li>Se puede cambiar con <Code>/pokebuilder</Code> (250 fichas).</li>
          <li>En cada ficha, "Cómo usarlo" ordena sus habilidades de mejor a peor con estrellas.</li>
        </ul>
        <p><Link to="/ranking?t=habilidades" className="text-led underline">Ver las habilidades más útiles →</Link></p>
      </>
    ),
  },
  {
    id: 'crianza',
    title: 'Crianza y huevos',
    icon: '◯',
    body: () => (
      <>
        <p>Deja dos Pokémon compatibles en la guardería y vuelve más tarde a por un huevo.</p>
        <ul className="list-disc pl-5 space-y-1 my-2">
          <li>Un macho y una hembra de la misma especie, o del mismo <b>grupo huevo</b> (sale en la ficha → "Evolución y más").</li>
          <li><b>Ditto</b> cría con casi cualquiera, incluso los que no tienen género.</li>
          <li>El bebé es de la especie de la <b>madre</b>.</li>
          <li>Los legendarios, singulares, ultraentes, paradojas y bebés no pueden criar.</li>
        </ul>
        <Table head={['Objeto en un padre', 'Efecto']} rows={[
          [<Bilingual es="Lazo Destino" en="Destiny Knot" className="font-semibold" />, 'El huevo hereda 5 de los 6 IVs de los padres.'],
          [<Bilingual es="Piedra Eterna" en="Everstone" className="font-semibold" />, 'El huevo hereda la naturaleza de ese padre.'],
          ['Objetos Poder', 'Pasan siempre un IV concreto de ese padre.'],
        ]} />
        <Tip>Combinando Lazo Destino y Piedra Eterna, en pocas generaciones tendrás Pokémon con buenos IVs y la naturaleza que quieres.</Tip>
      </>
    ),
  },
  {
    id: 'servidor',
    title: 'Misiones, torre y gimnasios',
    icon: '♜',
    body: () => (
      <>
        <H>Misiones (/quests)</H>
        <p>Dan llaves de cajas, PokéDólares y objetos. Las más rentables al principio:</p>
        <ul className="list-disc pl-5 space-y-1 my-2">
          <li><b>Geodex</b>: visitar biomas. Empiézala el primer día.</li>
          <li><b>Evoluciones</b> y <b>Campeón Elemental</b>: evolucionar muchas especies y tipos. Por eso merece la pena capturar de todo.</li>
          <li><b>Leñador</b>, <b>Minero</b>, <b>Granjero</b>: tareas de Minecraft que se hacen solas mientras juegas.</li>
          <li><b>Cazador de Megas</b>: luchar contra Pokémon Mega salvajes. <b>Cazador de legendarios</b>: encontrar legendarios (unas 4–6 h entre apariciones).</li>
        </ul>
        <H>Torre Batalla</H>
        <p>15 entrenadores seguidos, cada vez más difíciles. Cada victoria da puntos de batalla (<Code>/scores list</Code>) para su tienda: megapiedras, objetos de combate, caramelos de experiencia y objetos de evolución. Necesita nivel de entrenador (TXP).</p>
        <H>Gimnasios</H>
        <p>15 gimnasios por tipo y 4 del Alto Mando. En <Link to="/combatir?t=gimnasios" className="text-led underline">Combatir → Gimnasios</Link> te digo a quién llevar a cada uno.</p>
        <H>Dificultad de los entrenadores</H>
        <Table head={['Nivel', 'Cómo juega']} rows={[
          ['1', 'Elige ataques casi al azar.'], ['2', 'Prefiere ataques superefectivos.'], ['3', 'Elige con cabeza, cambia de Pokémon y se potencia.'], ['4', 'Como el 3, pero predice lo que vas a hacer.'], ['5', 'Planea varios turnos. El más difícil.'],
        ]} />
        <H>Cajas</H>
        <p>Las llaves salen en misiones y eventos (también se venden en la web). Dan caramelos, Poké Balls, dinero, bloques de terreno y Pokémon aleatorios.</p>
      </>
    ),
  },
]

export default function Guides() {
  const data = useData()
  const [params, setParams] = useSearchParams()
  const g = GUIDES.find((x) => x.id === params.get('g')) ?? GUIDES[0]
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-pixel text-3xl">Guías</h1>
        <p className="text-ink-dim">Lo básico de Pokémon y de PokeBedrock, explicado sin rodeos.</p>
      </div>
      <div className="grid lg:grid-cols-[260px_1fr] gap-5 items-start">
        <nav className="screen p-2 lg:sticky lg:top-24 flex lg:flex-col gap-1 overflow-x-auto scroll-thin">
          {GUIDES.map((x) => (
            <button key={x.id} onClick={() => setParams({ g: x.id }, { replace: true })} aria-pressed={g.id === x.id} className="mc-btn px-3 py-1.5 text-left whitespace-nowrap flex items-center gap-2">
              <span className="w-5 text-center">{x.icon}</span>{x.title}
            </button>
          ))}
        </nav>
        <motion.div key={g.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <Panel title={g.title}>
            <div className="max-w-4xl leading-relaxed">{g.body(data)}</div>
          </Panel>
        </motion.div>
      </div>
    </div>
  )
}
