# Briefing para Claude Code: web de referencia de PokeBedrock

> Documento de arranque. Contiene lo que ya se ha investigado y verificado (octubre de 2026) y lo que queda por comprobar.
> **Claude Code debe explorar a fondo las fuentes indicadas**, porque este documento es un punto de partida, no la información completa.

---

## 1. Objetivo

Una web personal (en español) que sirva como **Pokédex y asistente de PokeBedrock**, el addon y servidor de Pokémon para Minecraft Bedrock. Las mecánicas de combate son las de la 9.ª generación.

El usuario apenas conoce Pokémon. La web tiene que responder rápido, sobre todo desde el móvil, a estas preguntas:

1. **¿Qué es este Pokémon y merece la pena?** Tipo, debilidades, potencia de su evolución final y un veredicto claro.
2. **¿Qué hay en este bioma, de día o de noche?** Para saber qué buscar y dónde.
3. **¿Con qué lo capturo?** La mejor Ball, qué estado provocarle y qué Pokémon "capturador" llevar.
4. **¿Qué saco contra este rival?** Asistente de combate basado en los tipos y en el equipo del usuario.
5. **¿Para qué sirve este objeto y cómo lo consigo?**
6. **¿Cómo está mi equipo/PC?** Con sincronización rápida a partir de capturas de pantalla o vídeo (ver la sección 6).

Prioridades: datos oficiales y actualizables, que sea muy usable, que funcione bien en móvil (OnePlus 15, Android), temática Pokémon y animaciones suaves.

---

## 2. Fuentes de datos (verificadas)

### 2.1 Fuente principal: el repositorio de la wiki oficial
- **GitHub:** `https://github.com/pokebedrock/wiki` (licencia MIT), con espejo en `https://git.pokebedrock.com/pokebedrock/wiki`.
- Es la wiki pública editable de pokebedrock.com y está en mantenimiento activo.
- **Datos estructurados (JSON), uno por entrada:**
  - `assets/content/en/pokemon/<id>.json`: hay **1328 entradas**, contando formas Mega, Gmax, Totem y regionales.
  - `assets/content/en/moves/<id>.json`: hay **953 ataques**.
- **Manifests ya generados por la wiki:**
  - `build/content/{en,es}/pokemon-manifest.json`
  - `build/content/{en,es}/moves-manifest.json`
  - `build/content/{en,es}/move-learners-manifest.json`
  - ⚠️ El manifest `es` **sigue teniendo los nombres y descripciones en inglés**. Ver la sección 2.3.
- **Documentación en Markdown:** `docs/en/**` y `docs/es/**`. Contiene objetos, mecánicas de captura, guardería, cajas, misiones, gimnasios, comandos, FAQ, etc.
- URL raw de ejemplo: `https://raw.githubusercontent.com/pokebedrock/wiki/main/assets/content/en/pokemon/breloom.json`

**Estructura de un JSON de Pokémon** (comprobada con `breloom.json`):
```json
{
  "name": "Breloom",
  "description": "...",
  "types": ["grass", "fighting"],
  "tags": [],                       // "Mythical", "Sub-Legendary", "Restricted Legendary", "Ultra Beast", "Paradox"
  "genderRatio": {"M": 0, "F": 0},
  "abilities": {"0": "Effect Spore", "1": "Poison Heal", "H": "Technician"},
  "evYield": {"hp":0,"atk":2,"def":0,"spa":0,"spd":0,"spe":0},
  "base_experience": 161,
  "base_happiness": 50,
  "growth_rate": "fluctuating",
  "level_range": [23, 65],          // nivel en estado salvaje
  "moves": [{"move":"spore","learnMethod":"level-up","level_learned_at":1}, {"move":"falseswipe","learnMethod":"machine"}],
  "stats": {"hp":60,"atk":130,"def":80,"spa":60,"spd":60,"spe":70},
  "spawn_rules": [{"biome":"mooshroom_island","brightness":[7,15],"location":"land","rarity":"ultra-rare"}],
  "drops": [{"typeId":"pokeb:big_root","countRange":[1,1],"chance":5}],
  "evolutions": [],                 // en otras fichas: el disparador (nivel, objeto, intercambio, de día...) y el objeto
  "sortOrder": 386
}
```
Notas sobre los campos:
- `brightness` es el nivel de luz de Minecraft. `0–7` significa oscuro (noche o cueva) y `7–15` iluminado (de día).
- `location` puede ser `land`, `underground` o `seafloor`.
- `rarity` puede ser `common`, `uncommon`, `rare` o `ultra-rare`.
- Los biomas son etiquetas de Bedrock combinadas con `+` (por ejemplo `animal+forest+roofed`).
- `learnMethod` puede ser `level-up`, `machine` (MT), `tutor` o `egg`. Un mismo ataque puede aparecer varias veces con métodos distintos.
- Las fichas de ataques incluyen precisión, PP, categoría, tipo, prioridad, flags y la lista de Pokémon que lo aprenden.

### 2.2 Recursos gráficos (repositorio de recursos)
- `https://git.pokebedrock.com/pokebedrock/pokebedrock-res`, con `pokemon.json`, `items.json`, `textures/` y `texts/` (idiomas).
- Sprites: `.../raw/branch/main/textures/sprites/default/<id>.png`
- Iconos de tipo: `.../raw/branch/main/textures/items/held_items/machines/<tipo>.png`
- ⚠️ Este repositorio tiene un **LICENSE con copyright**. Revisarlo antes de redistribuir. Para una web personal o privada, lo razonable es enlazar en vez de copiar, o usarlo solo en local.
- Revisar `texts/` por si hay un `es_ES.lang` con los nombres de objetos traducidos.

### 2.3 Nombres en español
La wiki no tiene traducciones. Opciones:
- **PokeAPI** (`pokeapi.co`): `pokemon-species/<n>` → `names[]` con `language.name == "es"`, y lo mismo para `move/<id>` e `item/<id>`. Hay que mapear por nombre o número nacional. Lo mejor es **generarlo una sola vez durante el build y guardarlo en caché**.
- WikiDex como referencia manual.
- La búsqueda tiene que funcionar **en español y en inglés**, porque en el juego los nombres pueden salir en inglés.

### 2.4 Mecánicas que la wiki no cubre (completar con fuentes estándar)
- **Tabla de tipos (gen 9)** y **naturalezas** (+10 % / −10 %): son estándar. Fuente sugerida: `smogon/pokemon-showdown` (`data/typechart.ts`, `data/natures.ts`). Las descripciones de ataques de la wiki parecen sacadas de Showdown, así que encaja.
- **Fórmula de estadísticas** (base + IV + EV + naturaleza + nivel): fórmula estándar de las generaciones 3 a 9.

### 2.5 Lo que NO está publicado (marcarlo como "sin verificar" en la web)
- **Recetas de las tapas de Balls especiales.** La wiki solo da tres: Poké Ball (3 rojos, salen 5), Super Ball (2 azules y 1 rojo, salen 3) y Ultra Ball (2 negros y 1 amarillo, sale 1). Coinciden con las de Pixelmon, así que probablemente el resto también. Tabla Pixelmon:
  - Veloz: azul, amarillo, azul.
  - Ocaso: verde, negro, verde.
  - Malla: negro, azul, negro.
  - Rapid: rojo, amarillo, rojo.
  - Nido: verde, amarillo, verde.
  - Buceo: azul, rosa, azul.
  - Turno: rojo, negro, blanco.
  - Peso: azul, azul, azul.
  - Amor: rosa, rosa, rosa.
  - Lujo: blanco, rojo, negro.
  - Recuerdo: blanco, rojo, blanco.
  - Cura: blanco, rosa, blanco.

  Fuente: progameguides.com/minecraft/how-to-get-poke-balls-in-pixelmon. **El usuario las comprobará en el juego.**
- **Dónde se consiguen las MT (máquinas técnicas)** en PokeBedrock: investigar en la wiki, las tiendas, la Torre Batalla y Discord.
- **Si existe una API de jugador** (equipo o PC). No he encontrado ninguna pública. Investigar `pokebedrock.com/login` y lo que muestra el perfil (`/player "nombre"` en el juego).

---

## 3. Datos de mecánicas ya extraídos de la wiki oficial

### 3.1 Captura (código real de PokeBedrock, página `items/poke-balls`)
- La probabilidad depende de `capture_rate` de la especie y de la vida restante.
- **Estados:** dormido o congelado ×2,5; paralizado, envenenado, gravemente envenenado o quemado ×1,5.
- **Amuleto Captura** en la mano secundaria: ×2.
- Encuentros por pasos: ×1,5.
- **La Super Ball y la Ultra Ball tienen ×1, igual que la Poké Ball.** ← Dato importante.
- Master Ball y Park Ball capturan siempre.
- Ultraentes: ×0,1 con cualquier Ball salvo la Ente Ball.
- **Balls especiales:**
  - Veloz: ×5 en el turno 1.
  - Rapid: ×4 si la velocidad base es 100 o más.
  - Peso: por tramos de peso (409,6 kg → +40; 307,2 → +30; 205 → +20; 102,4 → sin cambio; menos → −20, con mínimo 1).
  - Acopio: ×3,5 si ya tienes la especie.
  - Malla: ×3,5 contra Bicho o Agua.
  - Buceo: ×3,5 si el objetivo está en el agua.
  - Nido: 1 + (40 − nivel) / 10 si el nivel es menor de 30.
  - Amor: ×8 con la misma especie y sexo opuesto.
  - Ocaso: ×3 de noche.
  - Turno: mín(1 + 0,3 × turno, 4).
  - La bonificación de la Cebo Ball no está implementada.
  - Nivel, Luna, Ensueño, Cura, Safari, Competi, Honor, Gloria y GS: ×1.
- **Fabricación:** tapa + botón de piedra + base de hierro, sin forma fija. La base son 3 lingotes de hierro en fila y salen 5. Los bonguris se cocinan en horno, ahumador o fogata antes de hacer la tapa.
- **Geodex** (lleva un ancla de reaparición en la receta): busca biomas ya encontrados. Muestra una flecha a menos de 500 bloques y guarda 5 biomas. El Geodex+ llega a 700 bloques y guarda 10.

### 3.2 Bonguris (página `items/organic`)
| Color | Bioma |
|---|---|
| Negro | Bosque oscuro |
| Azul, rosa, verde | Bosque de flores |
| Rojo | Llanuras, bosque nevado, bosque |
| Amarillo | Jungla |
| Blanco | Bosque de abedules |

El árbol tiene 4 fases. En la fase 4 se cosecha con clic derecho y da bonguris y, a veces, un brote.

La página también describe las bayas: de estado, de pellizco (curan al bajar de cierta vida), de EV, las que reducen daño por tipo y las que suben estadísticas.

### 3.3 Objetos equipables (página `items/held`)
Hay tablas completas por función:
- Elegidos (Cinta, Gafas y Pañuelo Elegido), Vidasfera, Cinta Experto.
- Restos, Lodo Negro, Banda Focus, Chaleco Asalto, Mineral Evolutivo.
- Objetos que potencian un tipo, gemas, objetos exclusivos de especie y objetos Recio (EV).

Muchos se compran con **puntos de batalla en la Torre Batalla**.

### 3.4 Dónde se consiguen las cosas
- **Torre Batalla:** 15 entrenadores con dificultad creciente. Paga puntos de batalla (`/scores list`). Su tienda vende piedras megaevolutivas, objetos de combate, caramelos de experiencia y objetos de evolución. Requiere cierto nivel de entrenador (TXP).
- **PokéStops**, en las zonas de `/warp` y delante de los gimnasios: Repartir Exp, Huevo Suerte, objetos de combate y Poké Balls.
- **Cajas (crates):** Poké, Super, Ultra y Master, más las de Pokémon aleatorio, shiny y legendario. Las llaves salen de misiones, eventos y la tienda web.
- **Objetos que sueltan los Pokémon:** el campo `drops` de cada ficha. → **Crear un índice inverso objeto → Pokémon que lo suelta.**
- **Otras vías:** casa de subastas `/ah` y las 16 tiendas del Distrito Comercial (PokéDollars).
- **Misiones (`/quests`):** minería, tala, excavación, granjero, cosechador, Geodex, criador, evoluciones, eclosiones, cazador de legendarios (unas 4–6 h entre apariciones por jugador), cazador de Megas y Campeón Elemental.

### 3.5 Guardería
- Se necesita macho + hembra, o cualquier Pokémon + Ditto, de la misma especie o del mismo grupo huevo. La cría sale de la especie de la madre.
- **Lazo Destino:** la cría hereda 5 IV de los padres.
- **Piedra Eterna:** hereda la naturaleza.
- **Objetos Recio:** fijan un IV concreto.
- No pueden criar: legendarios, singulares, ultraentes, paradójicos ni bebés.

### 3.6 Gimnasios (página `features/gyms`)
- **15 gimnasios por tipo:** Psíquico, Fantasma, Eléctrico, Dragón, Volador, Roca, Hada, Siniestro, Fuego, Planta, Tierra, Normal, Veneno, Acero y Agua.
- **Alto Mando:** Eléctrico, Hada, Bicho y Dragón.
- La misión de líderes de gimnasio está desactivada; se combate directamente con los entrenadores.
- **Dificultad de los entrenadores NPC (1–5):** 1 elige casi al azar; 5 planifica varios turnos por delante.

### 3.7 Otros
- **Temporadas:** el mundo se reinicia más o menos una vez al año. **Solo se conservan 12 Pokémon.** → Añadir a la web una lista de "Pokémon a conservar".
- **Comandos útiles:** `/warp`, `/home`, `/wild`, `/quests`, `/scores list`, `/pokebuilder`, `/ah`, `/player "nombre"`, `/battle leave`, `/playtime rewards`.

---

## 4. Secciones propuestas

1. **Inicio:** buscador grande (español e inglés) y accesos rápidos a Capturar, Combatir, Mi equipo y Bioma.
2. **Pokédex:**
   - Filtros: tipo, total de estadísticas (BST) de la especie y de su evolución final, rareza, bioma, día o noche, `location`, etiqueta de legendario, "aprende el ataque X" y "suelta el objeto X".
   - Tarjeta: sprite, tipos, debilidades calculadas (×4 / ×2 / ×½ / ×0) y una **insignia de veredicto** según el BST de la forma final: ≥600 top; 500–599 muy bueno; 450–499 aceptable; menos de 450 de relleno. La insignia tiene que poder ajustarse.
3. **Ficha de Pokémon:**
   - Estadísticas en barras animadas y cadena evolutiva con sus disparadores.
   - Dónde aparece, en una tabla de bioma, luz y rareza en lenguaje claro ("de noche en pantanos").
   - Ataques por nivel y por MT, habilidades explicadas y objetos que suelta.
   - "Rival peligroso para mi equipo": cruzar sus tipos con los del equipo del usuario.
4. **¿Qué hay aquí?:** eliges bioma, momento del día y superficie, subsuelo o agua, y te da una lista ordenada por veredicto y rareza.
5. **Capturar:**
   - Calculadora: especie, vida restante, estado, Ball, turno y si es de noche → probabilidad estimada por lanzamiento → **recomienda Ball y estrategia**.
   - **Kit del capturador:** Pokémon que aprenden Falso Tortazo, Espora, Somnífero, Onda Trueno, Hipnosis, Paralizador o Bostezo, sacados de las fichas de ataques. Para cada uno: a qué nivel o con qué MT lo aprende y dónde aparece.
   - Recordatorios: Espora no afecta a tipo Planta ni a quien tenga la habilidad Funda o las Gafas Protectoras; Onda Trueno no afecta a tipo Tierra.
6. **Combatir:** asistente "rival → qué saco y qué ataque uso" con mi equipo y respuesta en 3 líneas. La lógica completa está en la sección 8 de este documento.
7. **Mi equipo y PC:**
   - Equipo + cajas.
   - Análisis de cobertura ofensiva y debilidades compartidas.
   - Sugerencias de qué buscar y lista de "conservar en el reinicio" (12 Pokémon).
8. **Objetos:** buscador; cada objeto con qué hace, cómo conseguirlo (Torre, PokéStop, drops, cajas) y a quién se lo pondría (sugerencia).
9. **Bonguris y Balls:** colores, biomas, recetas (marcadas como sin verificar), prioridades de cultivo y multiplicadores.
10. **Guías cortas:** tipos, IV/EV/naturalezas, cría, misiones, gimnasios, comandos y temporadas. Lenguaje para novatos y siempre con ejemplos.
11. **Objetivos y lista de deseos:** Pokémon que quiero conseguir, con su "dónde y cuándo".

---

## 5. Pipeline de datos

- Script de build (Node o TypeScript) que:
  1. Clona o actualiza `pokebedrock/wiki`. Usar `git` mejor que pedir miles de URLs raw.
  2. Normaliza a un modelo propio y calcula: BST, **evolución final y su BST**, cadenas evolutivas (inversas también), índice de quién aprende cada ataque, índice bioma → Pokémon, índice objeto → quién lo suelta y debilidades por combinación de tipos.
  3. Mezcla los nombres en español (PokeAPI, guardados en caché).
  4. Genera JSON estáticos divididos (por ejemplo un índice ligero y un detalle bajo demanda) para que cargue rápido en el móvil.
  5. Guarda el **commit y la fecha de la wiki** para mostrar "Datos actualizados a …".
- Actualización: comando `npm run update-data` y, si se aloja en GitHub Pages, una GitHub Action programada (semanal).

---

## 6. Sincronizar mi equipo sin escribirlo a mano

No he encontrado ninguna API pública de jugador. Opciones, de la más simple a la más cómoda:

- **A. Capturas de pantalla → Claude Code (sin infraestructura).**
  - El usuario deja capturas del resumen de cada Pokémon (o un vídeo) en una carpeta `sync/`.
  - Claude Code las lee, extrae los datos con un esquema JSON fijo y actualiza `data/my-team.json`.
  - Para vídeo: extraer fotogramas con `ffmpeg -i video.mp4 -vf fps=1 frames/%03d.png` y descartar los repetidos.
- **B. Botón "Sincronizar" en la web.**
  - Subes capturas o un vídeo; con `ffmpeg.wasm` se extraen fotogramas en el navegador.
  - Se envían a la **API de Claude con visión** a través de un backend mínimo: Cloudflare Worker o función serverless. **La API key nunca va en el frontend.**
  - Salida estructurada (JSON schema). Antes de guardar se muestra un **diff** para confirmar.
  - Coste: revisar los precios actuales en docs.claude.com. Una imagen suele costar del orden de unos pocos miles de tokens de entrada. Calcular el coste por sincronización y mostrarlo.
- **C. OCR local (Tesseract).** Gratis pero menos fiable con la interfaz de Minecraft. Solo como alternativa.
- **Extra para móvil:** convertir la web en PWA con **Web Share Target**, para poder compartir una captura desde la galería de Android directamente a "Sincronizar".

**Modelo de datos de "mi Pokémon":** especie (id de la wiki), mote, nivel, naturaleza, habilidad, IV (en el formato que muestre el juego, ver la sección 9), EV, 4 ataques, objeto, shiny, Ball, ubicación (equipo o caja y hueco), fecha de captura y notas.

---

## 7. Stack y diseño

- El usuario conoce **React**. Propuesta: **Vite + React + TypeScript**, Tailwind, **Framer Motion** para las animaciones y Fuse.js para la búsqueda difusa. Web estática, que se puede publicar en **GitHub Pages** (el usuario ya lo usa en otro proyecto). Mis datos en IndexedDB o localStorage, con exportación e importación en JSON.
- **Diseño:**
  - Pensado primero para móvil y responsive.
  - Colores oficiales por tipo como chips, tarjetas estilo Pokédex y modo oscuro.
  - Animaciones suaves: entrada de tarjetas, barras de estadísticas que se llenan y transiciones entre páginas. Respetar `prefers-reduced-motion`.
  - Navegación con barra inferior en móvil y lateral en escritorio.
  - Buscador siempre accesible.
  - Accesible: contraste suficiente, zonas de toque grandes y que no dependa solo del color.
- Rendimiento: sprites con carga diferida, listas virtualizadas (1328 entradas) y JSON divididos.

---

## 8. Equipo actual del usuario y lógica del asistente de combate

**Equipo (a fecha de 21/10/2026):**
- Reshiram Nv28 (Dragón/Fuego) con Periscopio.
- Quilava Nv33 (Fuego) con Periscopio.
- Luxio Nv26 (Eléctrico) con Huevo Suerte.
- Rhyhorn Nv34 (Tierra/Roca) con Telescopio.
- Koffing Nv31 (Veneno) con Repartir Exp.
- Lokix Nv31 (Bicho/Siniestro) con Banda Focus.

Ataques: ver el prompt del asistente que tiene el usuario. Debilidad clara del equipo: el Agua (Rhyhorn recibe ×4 y Quilava ×2).

**Reglas del asistente (versión resumida):**
1. Calcular la ventaja de tipos en los dos sentidos. Priorizar el ataque superefectivo que además sea del mismo tipo que el Pokémon (STAB, +50 %).
2. Si el rival me hace ×2 o ×4 y es más rápido, cambiar a un Pokémon que resista.
3. Contra salvajes fáciles, sacar a los débiles para repartir experiencia.
4. Para capturar: el ataque más débil o Falso Tortazo, más dormir o paralizar. Recomendar Ball según la sección 3.1.
5. Contra entrenadores o en PvP: tener en cuenta que el rival puede cambiar de Pokémon y avisar de su ataque más peligroso.
6. Tener en cuenta las **habilidades que cambian inmunidades**. Ejemplo real: Dachsbun, con Cuerpo Horneado, es inmune al Fuego y sube la Defensa si le golpean con él.
7. Responder siempre en el formato Saca / Usa / Ojo y con los **nombres de los ataques en español**.

---

## 9. Cosas que el usuario verificará en el juego (mostrarlas como pendientes)

- [ ] Qué significa el **porcentaje** junto a cada estadística en el PC (ha visto valores entre el 30 % y el 80 %). Hipótesis: es el IV en porcentaje (31 = 100 %).
- [ ] Las recetas de las tapas de Balls especiales (sección 2.5).
- [ ] Si un brote de bonguri crece fuera de su bioma.
- [ ] Cómo se consigue el Amuleto Captura y las MT (sobre todo Falso Tortazo).
- [ ] Si `/pokebuilder` permite modificar IV o naturaleza y qué cuesta.

---

## 10. Prompt inicial sugerido para Claude Code

```
Lee BRIEF-pokebedrock-web.md entero. Después:
1. Explora a fondo el repo github.com/pokebedrock/wiki (assets/content, build/content, docs) y git.pokebedrock.com/pokebedrock/pokebedrock-res. Documenta en DATA.md todos los campos y cualquier dato que no esté en el brief (objetos, MT, evoluciones especiales, recetas, tiendas).
2. Propón la arquitectura (Vite+React+TS+Tailwind+Framer Motion, estática) y el pipeline de datos de la sección 5. Espera mi visto bueno antes de construir.
3. Construye primero: Pokédex + Ficha + "¿Qué hay aquí?" + Capturar (calculadora + kit del capturador). Después Combatir, Mi equipo con sincronización (opción A), Objetos, Bonguris y Guías.
4. Todo en español; búsqueda en español e inglés. Marca como "sin verificar" lo que no venga de la wiki oficial.
```
