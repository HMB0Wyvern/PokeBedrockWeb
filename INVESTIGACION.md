# Investigación para la web de PokeBedrock (21/10/2026)

Complementa a `BRIEF-pokebedrock-web.md`: lo que se encontró al descargar y analizar las fuentes, incluidas las **correcciones al briefing**. Los repositorios están en `_sources/` (no se editan; los regenera el pipeline).

## 1. Correcciones al briefing

| El briefing dice | En realidad |
|---|---|
| Fuente: `github.com/pokebedrock/wiki` | **La copia de GitHub está desactualizada** (último commit 03/04/2026). La buena es **Forgejo `git.pokebedrock.com/pokebedrock/wiki`** (18/10/2026, actualización Halloween 5.7.2). |
| Los ataques traen poder y quién los aprende | **No traen el poder** (`basePower`). El poder sale de `moves.ts` de Showdown; quién los aprende, del índice inverso de los Pokémon. |
| Nombres en español → PokeAPI | Mejor: **`pokebedrock-res/texts/es_ES.lang`**, los textos oficiales del juego en español con el 100 % de cobertura (ataques, habilidades, objetos, naturalezas, las 372 MT…). PokeAPI solo para nombres de especie y categoría. |
| La calculadora usa `capture_rate` | **Ninguna fuente de PokeBedrock lo tiene** → PokeAPI `pokemon_species.csv` (valores estándar; se marcan como estimación). |
| Peso Ball por peso | La wiki no trae el peso → `pokedex.ts` de Showdown (`weightkg`). |
| Grupos huevo | No están en la wiki → `pokedex.ts` de Showdown (`eggGroups`). |
| ¿`/pokebuilder` cambia IVs y naturaleza? | **Sí**: IVs (10 fichas por punto, botón "Maximizar todos los IVs"), EVs (1 ficha por punto, reinicio 250), habilidad (250), naturaleza, género, variocolor, Ball, tamaño y nivel. Fichas en `pokebedrock.com/shop/tokens`. |
| Recetas de tapas especiales | La wiki confirma que **22 de 28 Balls tienen receta**, pero solo publica 3. El resto está en el pack de comportamiento, que es **privado**. Siguen sin verificar. |
| Sprites `textures/sprites/default/<id>.png` | Son **iconos de 40×30 px**. `sprites/dark/` son **siluetas**, no variocolores. |

Las afirmaciones del kit de captura del briefing están **verificadas** con los datos (Paras Espora al 22, Shroomish Paralizador al 5, Ralts Hipnosis al 9, Luxio Onda Trueno al 42, Falso Tortazo en Scyther 8 / Axew 6 / Cubone 8 / Nincada 10 / Karrablast 12 / Gallade 23).

## 2. Fuentes de datos

| Fuente | Qué aporta |
|---|---|
| **wiki** (Forgejo) `assets/content/en/pokemon/*.json` | 1328 entradas (1025 especies + formas): tipos, estadísticas, habilidades, nivel salvaje, ataques, **spawns**, **objetos que suelta**, **evoluciones** con condiciones |
| **wiki** `docs/en/**` + `posts/` | Mecánicas del servidor (Balls, objetos, guardería, misiones, gimnasios, torre, cajas, máquinas, fósiles, comandos). `docs/es` es una copia sin traducir |
| **pokebedrock-showdown** (Forgejo) | El simulador real (v0.1.24, 9.ª gen): peso, grupos huevo, poder de ataques, tabla de tipos, naturalezas, objetos |
| **pokebedrock-res** (Forgejo) | `es_ES.lang` (**español**), catálogo de objetos, texturas de objetos y Balls |
| **pokemon-behaviors** | **41 Pokémon montables** (tierra, aire, agua) |
| **Mojang bedrock-samples** | Etiquetas de los 89 biomas vanilla → traducir reglas de spawn a biomas reales |
| **PokeAPI** (CSV) | Tasa de captura y nombres de especie en español |

**No hay API pública** de jugador, equipo o PC.

## 3. Detalles de los datos
- Los ids de la wiki coinciden 1:1 con los de Showdown.
- `genderRatio`: ausente = sin género; `{M:0, F:0}` = 50/50.
- 108 legendarios/singulares **sí aparecen salvajes**. Las **Megas también aparecen salvajes** (misión Cazador de Megas).
- 226 entradas sin spawn: Gigamax, dominantes, formas de combate, **fósiles**, Mewtwo (Máquina de clonación).
- `brightness` es **nivel de luz**, no hora: `[0,7]` = de noche **o en cuevas**; `[7,15]` = de día.
- Rareza: el 70 % de los spawns son "muy raro", así que la etiqueta sola dice poco.
- ⚠️ **8 reglas de spawn (~170 apariciones) no coinciden con ningún bioma real** (`soulsand_vally`, `ice_plain`, `plains+flower_forest`…). La web las marca como "spawn dudoso".
- **372 MT** como objetos (MT54 = Falso Tortazo). Dónde se consiguen: sin documentar. Los **Tutores de movimientos** son NPC con lista fija a cambio de objetos.

## 4. Decisiones (21/10/2026)
- Uso principal en **PC**, adaptable a móvil.
- Español primero; **ataques siempre ES + EN**; objetos y habilidades "Español (English)".
- Iconos de PokeBedrock en listas + ilustraciones de Showdown en la ficha.
- Sincronización: capturas en `sync/` → Claude actualiza `data/my-team.json`. Sin backend.
- Sin pack beta: recetas, tiendas y MT quedan "sin verificar".
- Prioridades: capturar > qué buscar y dónde > ¿merece la pena? > mi equipo. Sin noticias.
- Estilo: Pokédex roja con aspecto Minecraft.
- **Porcentaje del PC (resuelto)**: `IVs (46,24 %)` con IVs 25/5/16/12/11/17 → 86/186. EVs sobre 510.

## 5. Pendiente de comprobar en el juego
- [ ] Recetas de las tapas de Balls especiales.
- [ ] Dónde se consiguen las MT (sobre todo MT54 Falso Tortazo) y dónde están los Tutores.
- [ ] Cómo se consigue el Amuleto Captura (Catching Charm).
- [ ] Qué venden la Torre Batalla y las PokéParadas y a qué precio.
- [ ] Si los brotes de bonguri crecen fuera de su bioma.
- [ ] Si los spawns "dudosos" aparecen de verdad.
