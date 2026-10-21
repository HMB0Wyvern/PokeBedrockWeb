# Web de PokeBedrock: instrucciones para Claude

- **Responder SIEMPRE en español.** Nombres de objetos, habilidades y ataques: "Español (English)", p. ej. "Periscopio (Scope Lens)".
- No dar consejos de juego en el chat: esa información debe mostrarla la web.
- Contexto: `BRIEF-pokebedrock-web.md` (briefing original) e `INVESTIGACION.md` (fuentes, correcciones y decisiones). Si se contradicen, manda `INVESTIGACION.md`.
- `_sources/` = repos descargados. Solo lectura; los regenera `npm run update-data`.

## Usuario
Hispanohablante, sabe React, apenas sabe de Pokémon. Textos de la web sencillos y con ejemplos. Usa sobre todo **PC** (pantalla de 2560 px), a veces el móvil.

## Prioridades
1. **Capturar**: mejor Ball, estados, kit del capturador, bonguris.
2. **Qué buscar y dónde**: bioma + luz + lugar → Pokémon.
3. **¿Merece la pena?**: veredicto según el total de su evolución final.
4. **Mi equipo y cómo mejorarlo**.
5. Los mejores (ranking), Combatir, Objetos (con bayas), Guías. **Sin sección de noticias.**

## Proyecto
- Vite + React 19 + TypeScript + Tailwind v4 + Motion + Fuse.js. Rutas con HashRouter (vale para GitHub Pages).
- `npm run dev` → http://localhost:5173 · `npm run build` → `dist/`.
- `npm run data` regenera `public/data/*.json` desde `_sources/` (`scripts/build-data.ts`).
- `npm run update-data` actualiza `_sources/` (wiki, showdown y res de Forgejo; behaviors; Mojang; PokeAPI) y regenera.
- Lógica: `src/lib/catch.ts` (Balls y probabilidad), `src/lib/team.ts` (mejoras, debilidades, reclutas), `src/lib/spawn.ts`, `src/lib/build.ts` (nota S–D, rol, objetos/naturaleza/EVs recomendados, percentiles), `src/lib/battle.ts` (cálculo de daño).
- Catálogo de objetos con textos propios en español: `scripts/items-catalog.ts` → `itemcats.json`.
- Nota competitiva: tiers de Smogon de `showdown/data/formats-data.ts` (en National Dex, "RU" es cajón de sastre y no cuenta). Valoración de habilidades: `rating` de `abilities.ts`. Sets: `random-battles/gen9/sets.json` (y gen7 de reserva).
- Cuidado: en Chrome reciente `window.scrollTo` devuelve una promesa; nunca devolver expresiones desde `useEffect`.

## Sincronizar el equipo
El usuario deja capturas en `sync/` (PC: nivel, habilidad, naturaleza, IVs/EVs; "Editar movimientos": ataques; barra del equipo: niveles y PS). Actualizar `data/my-team.json` (ids en formato Showdown, p. ej. `focusband`, `thunderfang`) y ejecutar `npm run data`. Campos opcionales: `nature`, `ability` (id), `ivs`, `evs` (listas de 6).
- Cajas: `boxes` = `[{ name, purpose, mons: [{ species | null, gender?, note?, label? }] }]` (orden de izquierda a derecha, 6 por fila). Las usa la página Criar (`src/lib/breed.ts`).
- Porcentaje del PC: `IVs (x %)` = suma de IVs / 186; `EVs (x %)` = suma de EVs / 510.

## Decisiones
- Estilo: **Pokédex roja con aspecto Minecraft** (fuente pixel, bordes en relieve, animaciones suaves, respeta `prefers-reduced-motion`).
- Nombres en español desde `_sources/res/texts/es_ES.lang`; **ataques siempre ES + EN** (en el juego el menú de ataques sale en inglés). Búsqueda bilingüe.
- Sprites: iconos de PokeBedrock (40×30) en listas + ilustraciones de Showdown en la ficha.
- Sin backend. Lo que no venga de fuente oficial → marcar "Sin verificar".
