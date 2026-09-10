/**
 * Catálogo de temas: nombre en castellano y una explicación corta de cada
 * motivo, que se muestra al elegir entrenamiento y al resolver el puzzle.
 * Las claves son los identificadores que usa la base de datos de Lichess.
 */
window.THEMES = (function () {
  var labels = {
    // --- Fases de la partida ---
    opening: ["Aperturas", "Táctica en las primeras jugadas, cuando el desarrollo aún no ha terminado."],
    middlegame: ["Medio juego", "La fase más rica: piezas desarrolladas y planes en marcha."],
    endgame: ["Finales", "Pocas piezas sobre el tablero, donde el rey pasa a ser una pieza activa."],
    pawnEndgame: ["Finales de peones", "Solo reyes y peones: el cálculo exacto y la oposición lo deciden todo."],
    rookEndgame: ["Finales de torres", "Los más frecuentes de la práctica; la actividad manda sobre el material."],
    knightEndgame: ["Finales de caballos", "Maniobras lentas donde cada tiempo cuenta."],
    bishopEndgame: ["Finales de alfiles", "Diagonales largas, casillas de color y peones bloqueados."],
    queenEndgame: ["Finales de damas", "Jaques continuos y peones pasados corriendo a coronar."],
    queenRookEndgame: ["Finales de dama y torre", "Material pesado: la seguridad del rey sigue siendo crítica."],

    // --- Motivos tácticos ---
    fork: ["Horquilla", "Una sola pieza ataca dos objetivos a la vez."],
    pin: ["Clavada", "Una pieza no puede moverse porque detrás hay algo más valioso."],
    skewer: ["Enfilada", "Como la clavada pero al revés: la pieza valiosa está delante y al moverse deja caer la de atrás."],
    discoveredAttack: ["Ataque descubierto", "Al apartar una pieza se destapa el ataque de la que estaba detrás."],
    doubleCheck: ["Jaque doble", "Dos piezas dan jaque a la vez: el rey está obligado a moverse."],
    deflection: ["Desviación", "Obligar a una pieza a abandonar la casilla o la tarea que estaba cubriendo."],
    attraction: ["Atracción", "Arrastrar una pieza enemiga a una casilla donde se la puede castigar."],
    interference: ["Interferencia", "Cortar la línea de defensa entre dos piezas enemigas."],
    clearance: ["Despeje", "Liberar una casilla o una línea para que entre otra pieza propia."],
    capturingDefender: ["Eliminar al defensor", "Quitar de en medio la pieza que sostenía toda la defensa."],
    trappedPiece: ["Pieza atrapada", "Una pieza enemiga se queda sin casillas y cae."],
    hangingPiece: ["Pieza colgada", "Hay material sin defender listo para llevárselo."],
    intermezzo: ["Jugada intermedia", "Antes de la recaptura evidente se cuela una jugada con amenaza mayor."],
    sacrifice: ["Sacrificio", "Entregar material a cambio de un ataque decisivo."],
    quietMove: ["Jugada tranquila", "Sin jaques ni capturas: la amenaza silenciosa que no tiene respuesta."],
    defensiveMove: ["Defensa", "Encontrar el único recurso que salva la posición."],
    zugzwang: ["Zugzwang", "El rival está obligado a jugar y cualquier jugada empeora su posición."],
    xRayAttack: ["Ataque de rayos X", "Una pieza actúa a través de otra sobre la casilla clave."],
    advancedPawn: ["Peón avanzado", "Un peón cerca de coronar decide la partida."],
    promotion: ["Coronación", "Llevar el peón a la última fila y transformarlo."],
    underPromotion: ["Subcoronación", "Coronar en caballo, torre o alfil porque la dama no vale."],
    enPassant: ["Captura al paso", "La captura especial del peón que muchos olvidan."],
    castling: ["Enroque", "El enroque como recurso táctico, no solo defensivo."],

    // --- Mates ---
    mate: ["Mate", "Posiciones que terminan en jaque mate."],
    mateIn1: ["Mate en 1", "Una sola jugada y se acabó. Ideal para calentar."],
    mateIn2: ["Mate en 2", "Dos jugadas: la clave suele ser la primera, tranquila o de sacrificio."],
    mateIn3: ["Mate en 3", "Ya hay que calcular la respuesta del rival."],
    mateIn4: ["Mate en 4", "Secuencias forzadas largas."],
    mateIn5: ["Mate en 5", "Cálculo profundo y visualización."],
    backRankMate: ["Mate del pasillo", "El rey ahogado por sus propios peones en la última fila."],
    smotheredMate: ["Mate de la coz", "El caballo remata al rey rodeado de sus piezas."],
    anastasiaMate: ["Mate de Anastasia", "Caballo y torre atrapan al rey contra la banda."],
    arabianMate: ["Mate árabe", "La pareja clásica de torre y caballo en la esquina."],
    bodenMate: ["Mate de Boden", "Dos alfiles cruzados sobre el rey enrocado."],
    dovetailMate: ["Mate de la cola de golondrina", "La dama remata con el rey bloqueado por los suyos."],
    hookMate: ["Mate del gancho", "Torre, caballo y peón tejiendo la red."],
    doubleBishopMate: ["Mate de los dos alfiles", "Las dos diagonales cerrando la jaula."],

    // --- Ataque ---
    kingsideAttack: ["Ataque al enroque corto", "Asalto contra el rey enrocado en el flanco de rey."],
    queensideAttack: ["Ataque en el flanco de dama", "Ofensiva por el otro lado del tablero."],
    exposedKing: ["Rey expuesto", "El rey sin cobertura es el objetivo."],

    // --- Longitud ---
    oneMove: ["De una jugada", "Puzzles de una sola jugada, rápidos."],
    short: ["Cortos", "Dos jugadas tuyas. El formato más habitual."],
    long: ["Largos", "Tres jugadas tuyas."],
    veryLong: ["Muy largos", "Cuatro jugadas o más: cálculo de verdad."]
  };

  var groups = [
    {
      id: "tacticas", name: "Motivos tácticos",
      hint: "Los patrones que se repiten en todas las partidas",
      themes: ["fork", "pin", "skewer", "discoveredAttack", "deflection", "attraction",
               "capturingDefender", "hangingPiece", "trappedPiece", "sacrifice",
               "interference", "clearance", "intermezzo", "quietMove", "doubleCheck",
               "xRayAttack", "zugzwang", "defensiveMove"]
    },
    {
      id: "mates", name: "Mates",
      hint: "Del mate en 1 a los patrones clásicos con nombre propio",
      themes: ["mateIn1", "mateIn2", "mateIn3", "mateIn4", "mateIn5", "backRankMate",
               "smotheredMate", "arabianMate", "anastasiaMate", "bodenMate",
               "hookMate", "dovetailMate", "doubleBishopMate"]
    },
    {
      id: "fases", name: "Fases de la partida",
      hint: "Aperturas, medio juego y finales por tipo de pieza",
      themes: ["opening", "middlegame", "endgame", "pawnEndgame", "rookEndgame",
               "bishopEndgame", "knightEndgame", "queenEndgame", "queenRookEndgame"]
    },
    {
      id: "ataque", name: "Ataque al rey",
      hint: "Cuando toca lanzarse a por el rey enemigo",
      themes: ["kingsideAttack", "queensideAttack", "exposedKing"]
    },
    {
      id: "peones", name: "Peones y jugadas especiales",
      hint: "Coronaciones, capturas al paso y enroques tácticos",
      themes: ["advancedPawn", "promotion", "underPromotion", "enPassant", "castling"]
    },
    {
      id: "longitud", name: "Por longitud",
      hint: "Elige cuánto quieres calcular",
      themes: ["oneMove", "short", "long", "veryLong"]
    }
  ];

  // Temas ciertos pero poco informativos: describen la fase o la longitud,
  // no el truco del puzzle. Se relegan al final.
  var GENERIC = {
    opening: 1, middlegame: 1, endgame: 1, mate: 1,
    oneMove: 1, short: 1, long: 1, veryLong: 1
  };

  function name(id) { return labels[id] ? labels[id][0] : id; }
  function desc(id) { return labels[id] ? labels[id][1] : ""; }

  /** Temas conocidos de un puzzle, del más revelador al más genérico. */
  function ranked(list) {
    return list
      .filter(function (id) { return labels[id]; })
      .sort(function (a, b) { return (GENERIC[a] || 0) - (GENERIC[b] || 0); });
  }

  return { groups: groups, name: name, desc: desc, ranked: ranked, labels: labels };
})();
