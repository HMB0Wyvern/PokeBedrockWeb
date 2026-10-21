// Catálogo de objetos para la página Objetos. Textos propios en español (resumidos de la wiki de PokeBedrock).
// Formato de cada objeto: [id de pokebedrock-res sin "pokeb:", para qué sirve, destacado?]
export type CatItem = [id: string, use: string, top?: boolean]
export type CatGroup = { title: string; intro?: string; items: CatItem[] }
export type Category = { id: string; title: string; icon: string; intro: string; groups: CatGroup[] }

export const CATALOG: Category[] = [
  {
    id: 'bayas',
    title: 'Bayas',
    icon: 'oran_berry',
    intro:
      'Las bayas se equipan a un Pokémon como cualquier objeto. En combate se la come sola en el momento justo (al quedarse con poca vida, al dormirse…) y desaparece: es de un solo uso. Las más útiles para empezar son la Baya Zidra (Sitrus) y la Baya Ziuela (Lum).',
    groups: [
      {
        title: 'Curan estados',
        intro: 'Se la come en cuanto sufre ese estado. La Ziuela vale para todos.',
        items: [
          ['lum_berry', 'Cura cualquier estado (dormido, paralizado, quemado, envenenado, congelado) y la confusión. La más versátil.', true],
          ['cheri_berry', 'Cura la parálisis.'],
          ['chesto_berry', 'Cura el sueño. Útil con Descanso (Rest): se duerme, recupera toda la vida y se despierta al momento.'],
          ['pecha_berry', 'Cura el envenenamiento.'],
          ['rawst_berry', 'Cura las quemaduras.'],
          ['aspear_berry', 'Cura la congelación.'],
          ['persim_berry', 'Cura la confusión.'],
          ['leppa_berry', 'Recupera 10 PP de un ataque que se haya quedado sin PP.'],
        ],
      },
      {
        title: 'Recuperan vida',
        intro: 'Se la come al quedarse con poca vida. Gratis y automática: ideal para cualquier Pokémon.',
        items: [
          ['sitrus_berry', 'Recupera ¼ de la vida al bajar de la mitad. La mejor de este grupo.', true],
          ['oran_berry', 'Recupera 10 PS. Solo sirve a niveles bajos.'],
          ['figy_berry', 'Recupera ⅓ de la vida al bajar de ¼. Confunde si al Pokémon no le gusta el sabor picante (depende de su naturaleza).'],
          ['wiki_berry', 'Como la Higog, pero confunde a quien no le guste el sabor seco.'],
          ['mago_berry', 'Como la Higog, pero confunde a quien no le guste el sabor dulce.'],
          ['aguav_berry', 'Como la Higog, pero confunde a quien no le guste el sabor amargo.'],
          ['iapapa_berry', 'Como la Higog, pero confunde a quien no le guste el sabor ácido.'],
          ['enigma_berry', 'Recupera ¼ de la vida tras recibir un golpe superefectivo.'],
        ],
      },
      {
        title: 'Reducen un golpe superefectivo',
        intro: 'Reducen a la mitad el primer golpe superefectivo de su tipo. Úsalas para tapar la peor debilidad de tu Pokémon: por ejemplo, Baya Caoca (Occa) en un tipo Planta contra el Fuego.',
        items: [
          ['occa_berry', 'Fuego.'], ['passho_berry', 'Agua.'], ['wacan_berry', 'Eléctrico.'], ['rindo_berry', 'Planta.'], ['yache_berry', 'Hielo.'],
          ['chople_berry', 'Lucha.'], ['kebia_berry', 'Veneno.'], ['shuca_berry', 'Tierra.'], ['coba_berry', 'Volador.'], ['payapa_berry', 'Psíquico.'],
          ['tanga_berry', 'Bicho.'], ['charti_berry', 'Roca.'], ['kasib_berry', 'Fantasma.'], ['haban_berry', 'Dragón.'], ['colbur_berry', 'Siniestro.'],
          ['babiri_berry', 'Acero.'], ['roseli_berry', 'Hada.'], ['chilan_berry', 'Normal (cualquier golpe Normal, aunque no sea superefectivo).'],
        ],
      },
      {
        title: 'Potencian en apuros',
        intro: 'Se activan al bajar de ¼ de vida (o al recibir un golpe) y suben una estadística. Para Pokémon que atacan mucho.',
        items: [
          ['liechi_berry', 'Sube el Ataque.'],
          ['petaya_berry', 'Sube el Ataque Especial.'],
          ['salac_berry', 'Sube la Velocidad.', true],
          ['ganlon_berry', 'Sube la Defensa.'],
          ['apicot_berry', 'Sube la Defensa Especial.'],
          ['lansat_berry', 'Más probabilidad de golpe crítico.'],
          ['starf_berry', 'Sube mucho una estadística al azar.'],
          ['micle_berry', 'El siguiente ataque acierta más.'],
          ['custap_berry', 'Ataca primero en el siguiente turno.'],
          ['kee_berry', 'Sube la Defensa al recibir un golpe físico.'],
          ['maranga_berry', 'Sube la Defensa Especial al recibir un golpe especial.'],
          ['jaboca_berry', 'Hace daño al rival que le golpee con un ataque físico.'],
          ['rowap_berry', 'Hace daño al rival que le golpee con un ataque especial.'],
        ],
      },
      {
        title: 'Bajan EVs (para reentrenar)',
        intro: 'Se usan desde la mochila. Quitan EVs de una estadística y suben la amistad. Sirven para corregir un Pokémon que ha ganado EVs donde no querías (mira la guía de IVs y EVs).',
        items: [
          ['pomeg_berry', 'Baja los EVs de PS.'],
          ['kelpsy_berry', 'Baja los EVs de Ataque.'],
          ['qualot_berry', 'Baja los EVs de Defensa.'],
          ['hondew_berry', 'Baja los EVs de Ataque Especial.'],
          ['grepa_berry', 'Baja los EVs de Defensa Especial.'],
          ['tamato_berry', 'Baja los EVs de Velocidad.'],
        ],
      },
    ],
  },
  {
    id: 'equipar',
    title: 'Para equipar',
    icon: 'leftovers',
    intro:
      'Cada Pokémon puede llevar un objeto equipado que actúa solo en combate. Muchos se compran con puntos de batalla en la Torre Batalla; las PokéParadas regalan algunos. Los marcados con ★ son los que más se usan.',
    groups: [
      {
        title: 'Más daño',
        items: [
          ['life_orb', 'Todos sus ataques pegan un 30 % más, pero pierde un poco de vida cada vez que ataca. Sin desventajas de bloqueo: el favorito para atacantes.', true],
          ['choice_band', 'Ataque ×1,5, pero solo puede usar el primer ataque que elija hasta que lo cambies de Pokémon. Para atacantes físicos.', true],
          ['choice_specs', 'Igual que la Cinta Elegida pero para Ataque Especial. Para atacantes especiales.', true],
          ['choice_scarf', 'Velocidad ×1,5 con el mismo bloqueo de ataque. Para que un Pokémon algo lento ataque primero.', true],
          ['expert_belt', 'Los ataques superefectivos pegan un 20 % más. Sin desventajas.'],
          ['muscle_band', 'Los ataques físicos pegan un 10 % más.'],
          ['wise_glasses', 'Los ataques especiales pegan un 10 % más.'],
          ['metronome', 'Si repite el mismo ataque varios turnos seguidos, cada vez pega más.'],
          ['loaded_dice', 'Los ataques de varios golpes (como Pedrada (Rock Blast)) golpean al menos 4 veces.'],
          ['scope_lens', 'Más probabilidad de golpe crítico (daño ×1,5).'],
          ['wide_lens', 'Sus ataques aciertan un 10 % más.'],
          ['zoom_lens', 'Si ataca después del rival, acierta un 20 % más.'],
          ['punching_glove', 'Los puñetazos pegan más y no cuentan como contacto.'],
          ['power_herb', 'Los ataques que necesitan cargar un turno (como Rayo Solar (Solar Beam)) salen al momento. Un solo uso.'],
        ],
      },
      {
        title: 'Aguantar más',
        items: [
          ['leftovers', 'Recupera 1/16 de su vida cada turno. Sirve a casi cualquier Pokémon.', true],
          ['assault_vest', 'Defensa Especial ×1,5, pero no puede usar ataques de estado. Para Pokémon que solo atacan.', true],
          ['eviolite', 'Defensa y Defensa Especial ×1,5 si al Pokémon aún le queda por evolucionar. Muy bueno en Pokémon como Chansey o Porygon2.', true],
          ['focus_sash', 'Si tiene la vida llena, sobrevive con 1 PS a un golpe que lo debilitaría. Un solo uso.', true],
          ['focus_band', 'Un 10 % de probabilidad de sobrevivir con 1 PS a un golpe que lo debilitaría.'],
          ['rocky_helmet', 'Quien le golpee con un ataque de contacto pierde 1/6 de su vida.'],
          ['black_sludge', 'Restos para tipos Veneno: recupera vida cada turno. A los demás tipos les hace daño.'],
          ['shell_bell', 'Recupera vida según el daño que hace.'],
          ['big_root', 'Los ataques que absorben vida (como Gigadrenado (Giga Drain)) curan más.'],
          ['air_balloon', 'Inmune a ataques de Tierra hasta que le golpeen.'],
          ['heavy_duty_boots', 'No le afectan las trampas del suelo (Púas, Trampa Rocas…).'],
          ['safety_goggles', 'Inmune a los polvos (Espora, Somnífero…) y al daño del clima.'],
          ['covert_cloak', 'Le protege de los efectos extra de los ataques rivales (retroceso, bajadas de estadísticas…).'],
          ['clear_amulet', 'El rival no le puede bajar las estadísticas.'],
          ['white_herb', 'Recupera las estadísticas que le hayan bajado. Un solo uso.'],
          ['mental_herb', 'Le libra de Mofa, Anulación y similares. Un solo uso.'],
          ['berry_juice', 'Recupera 20 PS al quedarse con poca vida. Un solo uso.'],
        ],
      },
      {
        title: 'Velocidad y cambios',
        items: [
          ['quick_claw', 'A veces ataca primero aunque sea más lento.'],
          ['eject_button', 'Al recibir un golpe, vuelve a tu equipo y sale otro Pokémon. Un solo uso.'],
          ['eject_pack', 'Si le bajan una estadística, vuelve a tu equipo. Un solo uso.'],
          ['red_card', 'Al recibir un golpe, obliga al rival a cambiar de Pokémon. Un solo uso.'],
          ['shed_shell', 'Puede cambiarse aunque el rival intente atraparlo.'],
          ['lagging_tail', 'Siempre ataca el último.'],
          ['iron_ball', 'Baja su Velocidad y le hace vulnerable a Tierra.'],
          ['float_stone', 'Reduce su peso a la mitad.'],
          ['room_service', 'Baja su Velocidad cuando hay Espacio Raro (Trick Room).'],
        ],
      },
      {
        title: 'Reacciones de un solo uso',
        items: [
          ['weakness_policy', 'Si recibe un golpe superefectivo y aguanta, sube mucho su Ataque y Ataque Especial.'],
          ['blunder_policy', 'Si falla un ataque, sube mucho su Velocidad.'],
          ['throat_spray', 'Tras usar un ataque de sonido, sube su Ataque Especial.'],
          ['cell_battery', 'Sube el Ataque al recibir un ataque Eléctrico.'],
          ['absorb_bulb', 'Sube el Ataque Especial al recibir un ataque de Agua.'],
          ['luminous_moss', 'Sube la Defensa Especial al recibir un ataque de Agua.'],
          ['snowball', 'Sube el Ataque al recibir un ataque de Hielo.'],
        ],
      },
      {
        title: 'Potenciadores de tipo',
        intro: 'Cada uno sube un 20 % los ataques de su tipo. Baratos y sin desventajas: buena opción mientras no tengas Vidasfera.',
        items: [
          ['charcoal', 'Fuego.'], ['mystic_water', 'Agua.'], ['magnet', 'Eléctrico.'], ['miracle_seed', 'Planta.'], ['never_melt_ice', 'Hielo.'],
          ['black_belt', 'Lucha.'], ['poison_barb', 'Veneno.'], ['soft_sand', 'Tierra.'], ['sharp_beak', 'Volador.'], ['twisted_spoon', 'Psíquico.'],
          ['silver_powder', 'Bicho.'], ['hard_stone', 'Roca.'], ['spell_tag', 'Fantasma.'], ['dragon_fang', 'Dragón.'], ['black_glasses', 'Siniestro.'],
          ['metal_coat', 'Acero (también sirve para evolucionar a Onix y Scyther).'], ['fairy_feather', 'Hada.'], ['silk_scarf', 'Normal.'],
        ],
      },
      {
        title: 'Gemas',
        intro: 'Un solo uso: el primer ataque de su tipo pega mucho más. Hay una por tipo.',
        items: [
          ['fire_gem', 'Fuego.'], ['water_gem', 'Agua.'], ['electric_gem', 'Eléctrico.'], ['grass_gem', 'Planta.'], ['ice_gem', 'Hielo.'], ['fighting_gem', 'Lucha.'],
          ['poison_gem', 'Veneno.'], ['ground_gem', 'Tierra.'], ['flying_gem', 'Volador.'], ['psychic_gem', 'Psíquico.'], ['bug_gem', 'Bicho.'], ['rock_gem', 'Roca.'],
          ['ghost_gem', 'Fantasma.'], ['dragon_gem', 'Dragón.'], ['dark_gem', 'Siniestro.'], ['steel_gem', 'Acero.'], ['fairy_gem', 'Hada.'], ['normal_gem', 'Normal.'],
        ],
      },
      {
        title: 'Clima, campos y pantallas',
        intro: 'Alargan de 5 a 8 turnos el efecto que ponga el propio Pokémon.',
        items: [
          ['heat_rock', 'Día Soleado (Sunny Day).'],
          ['damp_rock', 'Danza Lluvia (Rain Dance).'],
          ['icy_rock', 'Granizo y nieve.'],
          ['smooth_rock', 'Tormenta de Arena (Sandstorm).'],
          ['terrain_extender', 'Los campos (Eléctrico, Hierba, Niebla, Psíquico).'],
          ['light_clay', 'Reflejo (Reflect), Pantalla de Luz (Light Screen) y Velo Aurora (Aurora Veil).'],
          ['electric_seed', 'Sube la Defensa con Campo Eléctrico. Un solo uso.'],
          ['grassy_seed', 'Sube la Defensa con Campo de Hierba. Un solo uso.'],
          ['misty_seed', 'Sube la Defensa Especial con Campo de Niebla. Un solo uso.'],
          ['psychic_seed', 'Sube la Defensa Especial con Campo Psíquico. Un solo uso.'],
          ['utility_umbrella', 'No le afectan la lluvia ni el sol.'],
        ],
      },
      {
        title: 'Estados a propósito',
        items: [
          ['flame_orb', 'Quema a su portador. Solo para Pokémon con habilidades como Agallas (Guts), que se hacen más fuertes con estado.'],
          ['toxic_orb', 'Envenena gravemente a su portador. Para Pokémon con Antídoto (Poison Heal) o Agallas (Guts).'],
          ['sticky_barb', 'Le hace daño cada turno y se pega a quien le toque. Para pasárselo al rival con Truco (Trick).'],
        ],
      },
      {
        title: 'Solo para ciertos Pokémon',
        items: [
          ['light_ball', 'Pikachu: dobla su Ataque y Ataque Especial.'],
          ['thick_club', 'Cubone y Marowak: dobla su Ataque.'],
          ['leek', 'Farfetch\'d y Sirfetch\'d: muchos más golpes críticos.'],
          ['lucky_punch', 'Chansey: muchos más golpes críticos.'],
          ['metal_powder', 'Ditto: sube su Defensa.'],
          ['quick_powder', 'Ditto: dobla su Velocidad.'],
          ['soul_dew', 'Latios y Latias: potencia sus ataques Psíquico y Dragón.'],
          ['adamant_orb', 'Dialga: potencia sus ataques Dragón y Acero.'],
          ['lustrous_orb', 'Palkia: potencia sus ataques Dragón y Agua.'],
          ['griseous_orb', 'Giratina: potencia sus ataques Dragón y Fantasma.'],
          ['booster_energy', 'Pokémon Paradoja: activa su habilidad sin necesitar sol ni campo eléctrico.'],
        ],
      },
      {
        title: 'Otros',
        items: [
          ['amulet_coin', 'Dobla el dinero que ganas en combate.'],
          ['smoke_ball', 'Huye siempre de los combates contra salvajes.'],
          ['soothe_bell', 'Gana amistad más rápido (para evoluciones por amistad).'],
          ['binding_band', 'Los ataques que atrapan (como Constricción (Wrap)) hacen más daño.'],
          ['grip_claw', 'Los ataques que atrapan duran más turnos.'],
          ['bright_powder', 'Al rival le cuesta más acertarle.'],
          ['ring_target', 'Quita las inmunidades de tipo al portador.'],
          ['ability_shield', 'Nadie le puede cambiar ni anular la habilidad.'],
          ['protective_pads', 'No sufre efectos al tocar al rival (como el Casco Dentado).'],
          ['kings_rock', 'Sus ataques pueden hacer retroceder al rival. También hace evolucionar a Poliwhirl y Slowpoke por intercambio.'],
          ['razor_claw', 'Más golpes críticos. Hace evolucionar a Sneasel de noche.'],
          ['razor_fang', 'Sus ataques pueden hacer retroceder. Hace evolucionar a Gligar de noche.'],
        ],
      },
    ],
  },
  {
    id: 'entrenar',
    title: 'Subir de nivel y entrenar',
    icon: 'rare_candy',
    intro: 'Objetos para subir niveles más rápido y para mejorar las estadísticas de tus Pokémon. Los caramelos salen en cajas, PokéParadas y misiones.',
    groups: [
      {
        title: 'Experiencia',
        items: [
          ['lucky_egg', 'El Pokémon que lo lleva gana un 50 % más de experiencia. Las PokéParadas lo regalan.', true],
          ['exp_share', 'Los Pokémon del equipo que no combaten también ganan experiencia. Las PokéParadas lo regalan.', true],
          ['rare_candy', 'Sube un nivel al momento.', true],
          ['xs_exp_candy', 'Caramelo de experiencia muy pequeño.'],
          ['small_exp_candy', 'Caramelo de experiencia pequeño.'],
          ['medium_exp_candy', 'Caramelo de experiencia mediano.'],
          ['large_exp_candy', 'Caramelo de experiencia grande.'],
          ['xl_exp_candy', 'Caramelo de experiencia enorme.'],
        ],
      },
      {
        title: 'Objetos Poder (EVs)',
        intro: 'Mientras lo lleva, gana muchos más EVs de una estadística al derrotar Pokémon, pero va más lento. En la guardería, además, pasan ese IV al huevo.',
        items: [
          ['power_weight', 'PS.'], ['power_bracer', 'Ataque.'], ['power_belt', 'Defensa.'], ['power_lens', 'Ataque Especial.'], ['power_band', 'Defensa Especial.'], ['power_anklet', 'Velocidad.'],
        ],
      },
      {
        title: 'Vitaminas (EVs)',
        intro: 'Se usan desde la mochila y dan EVs en una estadística.',
        items: [
          ['hp_up', 'PS.'], ['protein', 'Ataque.'], ['iron', 'Defensa.'], ['calcium', 'Ataque Especial.'], ['zinc', 'Defensa Especial.'], ['carbos', 'Velocidad.'],
          ['pp_up', 'Sube los PP máximos de un ataque.'], ['pp_max', 'Sube al máximo los PP de un ataque.'],
        ],
      },
    ],
  },
  {
    id: 'medicinas',
    title: 'Medicinas',
    icon: 'potion',
    intro: 'Se usan desde la mochila, en combate o fuera de él. Las hierbas son más baratas pero bajan la amistad (no las uses en Pokémon que evolucionan por amistad). Fuera de combate, la Máquina de curación del Centro Pokémon lo cura todo gratis.',
    groups: [
      {
        title: 'Vida',
        items: [
          ['potion', 'Cura 20 PS.'], ['super_potion', 'Cura 60 PS.'], ['hyper_potion', 'Cura 120 PS.', true], ['max_potion', 'Cura toda la vida.'],
          ['fresh_water', 'Cura 30 PS.'], ['sodapop', 'Refresco.'], ['lemonade', 'Cura 70 PS.'], ['moomoo_milk', 'Cura 100 PS.'], ['ragecandybar', 'Cura 20 PS.'],
          ['energy_powder', 'Cura 60 PS. Baja la amistad.'], ['energy_root', 'Cura 200 PS. Baja la amistad.'],
        ],
      },
      {
        title: 'Revivir',
        items: [
          ['revive', 'Revive a un Pokémon debilitado con la mitad de la vida.', true], ['max_revive', 'Revive con toda la vida.'], ['revival_herb', 'Revive con toda la vida. Baja la amistad.'],
        ],
      },
      {
        title: 'Estados',
        items: [
          ['fullrestore', 'Cura toda la vida y cualquier estado.', true], ['full_heal', 'Cura cualquier estado.'], ['heal_powder', 'Cura cualquier estado. Baja la amistad.'],
          ['antidote', 'Cura el envenenamiento.'], ['paralyze_heal', 'Cura la parálisis.'], ['awakening', 'Despierta.'], ['burn_heal', 'Cura las quemaduras.'], ['ice_heal', 'Descongela.'],
        ],
      },
      {
        title: 'PP',
        items: [['ether', 'Recupera 10 PP de un ataque.'], ['max_ether', 'Recupera todos los PP de un ataque.'], ['elixir', 'Recupera 10 PP de todos los ataques.'], ['max_elixir', 'Recupera todos los PP de todos los ataques.']],
      },
    ],
  },
  {
    id: 'evolucion',
    title: 'Evolución',
    icon: 'fire_stone',
    intro: 'Las piedras se usan desde la mochila sobre el Pokémon. Los objetos "de intercambio" se equipan y el Pokémon evoluciona al intercambiarlo en la Máquina de intercambio. En la ficha de cada Pokémon verás exactamente qué necesita.',
    groups: [
      {
        title: 'Piedras',
        items: [
          ['fire_stone', 'Vulpix, Growlithe, Eevee (Flareon)…'], ['water_stone', 'Poliwhirl, Shellder, Staryu, Eevee (Vaporeon)…'], ['thunder_stone', 'Pikachu, Eevee (Jolteon), Eelektrik…'],
          ['leaf_stone', 'Gloom, Weepinbell, Exeggcute, Eevee (Leafeon)…'], ['moon_stone', 'Nidorina, Nidorino, Clefairy, Jigglypuff, Skitty, Munna.'], ['sun_stone', 'Gloom (Bellossom), Sunkern, Cottonee, Petilil, Helioptile.'],
          ['shiny_stone', 'Togetic, Roselia, Minccino, Floette.'], ['dusk_stone', 'Murkrow, Misdreavus, Lampent, Doublade.'], ['dawn_stone', 'Kirlia macho (Gallade), Snorunt hembra (Froslass).'], ['ice_stone', 'Eevee (Glaceon), Vulpix de Alola, Sandshrew de Alola, Cetoddle.'],
        ],
      },
      {
        title: 'Por intercambio (equipado)',
        items: [
          ['dragon_scale', 'Seadra → Kingdra.'], ['dubious_disc', 'Porygon2 → Porygon-Z.'], ['electirizer', 'Electabuzz → Electivire.'], ['magmarizer', 'Magmar → Magmortar.'],
          ['up_grade', 'Porygon → Porygon2.'], ['prism_scale', 'Feebas → Milotic.'], ['protector', 'Rhydon → Rhyperior.'], ['reaper_cloth', 'Dusclops → Dusknoir.'],
          ['sachet', 'Spritzee → Aromatisse.'], ['whipped_dream', 'Swirlix → Slurpuff.'], ['metal_coat', 'Onix → Steelix, Scyther → Scizor.'], ['kings_rock', 'Poliwhirl → Politoed, Slowpoke → Slowking.'],
          ['deep_sea_tooth', 'Clamperl → Huntail.'], ['deep_sea_scale', 'Clamperl → Gorebyss.'],
        ],
      },
      {
        title: 'Otros objetos de evolución',
        items: [
          ['oval_stone', 'Happiny: subir de nivel de día llevándola.'], ['razor_fang', 'Gligar: subir de nivel de noche llevándolo.'], ['razor_claw', 'Sneasel: subir de nivel de noche llevándola.'],
          ['sweet_apple', 'Applin → Flapple.'], ['tart_apple', 'Applin → Appletun.'], ['syrupy_apple', 'Applin → Dipplin.'], ['cracked_pot', 'Sinistea → Polteageist.'], ['chipped_pot', 'Sinistea (forma Genuina) → Polteageist.'],
          ['unremarkable_teacup', 'Poltchageist (forma Imitación).'], ['masterpiece_teacup', 'Poltchageist (forma Opulenta).'], ['auspicious_armor', 'Charcadet → Armarouge.'], ['malicious_armor', 'Charcadet → Ceruledge.'],
          ['galarica_cuff', 'Slowpoke de Galar → Slowbro de Galar.'], ['galarica_wreath', 'Slowpoke de Galar → Slowking de Galar.'], ['peat_block', 'Ursaring → Ursaluna.'], ['black_augurite', 'Scyther → Kleavor.'],
          ['leaders_crest', 'Bisharp → Kingambit.'], ['metal_alloy', 'Duraludon → Archaludon.'], ['strawberry_sweet', 'Milcery → Alcremie.'], ['everstone', 'Lo contrario: impide que evolucione.'],
        ],
      },
    ],
  },
  {
    id: 'crianza',
    title: 'Crianza',
    icon: 'destiny_knot',
    intro: 'Se equipan a los padres antes de dejarlos en la guardería. Controlan qué hereda el huevo.',
    groups: [
      {
        title: 'Herencia',
        items: [
          ['destiny_knot', 'El huevo hereda 5 de los 6 IVs de los padres. El más importante para criar Pokémon buenos.', true],
          ['everstone', 'El huevo hereda la naturaleza del padre que la lleva.', true],
          ['mirror_herb', 'Copia las subidas de estadísticas del rival una vez. Sirve también para pasar movimientos huevo.'],
        ],
      },
      {
        title: 'Inciensos (bebés)',
        intro: 'Algunos Pokémon bebé solo nacen si un padre lleva su incienso. En combate, potencian un tipo.',
        items: [
          ['sea_incense', 'Agua. Para Azurill.'], ['wave_incense', 'Agua. Para Mantyke.'], ['rose_incense', 'Planta. Para Budew.'], ['rock_incense', 'Roca. Para Bonsly.'],
          ['odd_incense', 'Psíquico. Para Mime Jr.'], ['lax_incense', 'Al rival le cuesta acertar. Para Wynaut.'], ['pure_incense', 'Menos encuentros salvajes. Para Chingling.'],
        ],
      },
    ],
  },
]

/** Objetos recomendables para equipar, por id de Showdown (lo usa la web en las fichas y en el equipo). */
export const RECOMMENDABLE = ['lifeorb', 'choiceband', 'choicespecs', 'choicescarf', 'leftovers', 'assaultvest', 'eviolite', 'focussash', 'rockyhelmet', 'blacksludge', 'expertbelt', 'lumberry', 'sitrusberry', 'weaknesspolicy', 'heavydutyboots', 'loadeddice', 'luckyegg', 'expshare', 'charcoal', 'mysticwater', 'magnet', 'miracleseed', 'nevermeltice', 'blackbelt', 'poisonbarb', 'softsand', 'sharpbeak', 'twistedspoon', 'silverpowder', 'hardstone', 'spelltag', 'dragonfang', 'blackglasses', 'metalcoat', 'fairyfeather', 'silkscarf', 'flameorb', 'toxicorb', 'lightball', 'thickclub', 'salacberry', 'whiteherb', 'muscleband', 'wiseglasses', 'scopelens', 'widelens']
