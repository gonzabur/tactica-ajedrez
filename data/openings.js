/**
 * Repertorio de aperturas.
 *
 * Cada apertura tiene varias líneas: la principal y las respuestas más
 * habituales del rival. Las jugadas van en notación algebraica inglesa
 * (la que entiende chess.js) desde la posición inicial. `notes` explica
 * las jugadas importantes: la clave es el índice de la jugada en `moves`
 * (0 = 1.e4, 1 = 1…e5, 2 = 2.Nf3…).
 *
 * `arrows` son las flechas del plan que se dibujan al terminar la línea, en
 * el orden en que se numeran (como mucho cuatro). Cada una es casilla de
 * origen y de destino sobre la posición final: "f1e1" es una jugada propia,
 * con "o" delante ("od6g3") una jugada del rival y con "x" ("xc4f7") una
 * pieza propia que presiona esa casilla sin moverse. Las jugadas se encadenan:
 * "b1d2", "d2f1" es el mismo caballo dando dos saltos.
 *
 * Comprobación (legalidad, nombres y motor): node tools/check_openings.js
 */
window.OPENINGS = [
  {
    id: "italiana",
    name: "Italiana",
    color: "w",
    style: "Tranquila y de desarrollo",
    summary:
      "Desarrollas rápido, pones el alfil apuntando a f7 (el punto débil del " +
      "negro, solo lo defiende el rey) y preparas d4 con calma. Pocas trampas " +
      "que memorizar y planes muy claros: es de las mejores para aprender.",
    lines: [
      {
        id: "italiana-principal",
        name: "Giuoco Pianissimo",
        idea: "La línea principal: c3 y d3 para montar un centro sólido y luego enrocar.",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d3", "d6", "O-O"],
        arrows: ["f1e1", "a2a4", "b1d2", "d2f1"],
        notes: {
          0: "Ocupa el centro y abre paso a la dama y al alfil de casillas blancas.",
          2: "Desarrolla atacando el peón de e5: el negro tiene que defenderlo.",
          4: "El alfil se coloca en su mejor diagonal, apuntando a f7.",
          6: "Prepara d4 para quedarse con dos peones en el centro, y abre a la dama el camino a b3, donde también presiona f7.",
          8: "Versión tranquila: en vez de abrir ya con d4, sujeta e4 y deja el cambio en el centro para más adelante, cuando todo esté desarrollado.",
          10: "Rey a salvo. Los siguientes pasos típicos: Re1, a4 para dar una casilla al alfil y el caballo por d2 hacia f1 y g3."
        }
      },
      {
        id: "italiana-dos-caballos",
        name: "Dos Caballos con d3",
        idea: "Si el negro saca el caballo en vez del alfil, no te compliques: d3 y el mismo plan.",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "d3", "Be7", "O-O", "O-O", "Re1"],
        arrows: ["c2c3", "h2h3", "b1d2", "xc4f7"],
        notes: {
          5: "El negro ataca e4. Aquí existe 4.Ng5, atacando f7, que lleva a líneas muy afiladas (como el famoso Hígado Frito) que hay que saberse de memoria.",
          6: "Defiende e4 y mantiene la partida tranquila: el mismo tipo de posición que en la línea principal.",
          10: "La torre apoya e4 y se prepara para cuando se abra la columna. Luego suele venir c3, h3 y el caballo por d2."
        }
      },
      {
        id: "italiana-dos-caballos-transpone",
        name: "Dos Caballos con …Bc5",
        idea: "Si el negro saca después el alfil a c5, se vuelve a la línea principal.",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "d3", "Bc5", "c3"],
        arrows: ["e1g1", "f1e1", "b1d2", "xc4f7"],
        notes: {
          7: "El negro saca el alfil a su casilla activa.",
          8: "Con c3 llegamos a la misma posición de la línea principal por otro orden de jugadas: el plan es idéntico."
        }
      },
      {
        id: "italiana-filidor",
        name: "Si el negro juega 2…d6 (Filidor)",
        idea: "El negro defiende e5 con un peón en vez de con el caballo. Ocupa el centro con d4.",
        moves: ["e4", "e5", "Nf3", "d6", "d4", "exd4", "Nxd4", "Nf6", "Nc3", "Be7", "Be2", "O-O", "O-O"],
        arrows: ["c1e3", "of8e8", "d1d2", "a1d1"],
        notes: {
          3: "La Filidor: sólida pero algo pasiva, encierra al alfil de e7.",
          4: "Aprovecha que el negro no presiona d4 y reta el centro enseguida.",
          6: "Recupera el peón con el caballo en el centro: más espacio para las blancas.",
          10: "Aquí el alfil va a e2 y no a c4. Con el caballo en c3 y el alfil en c4, el negro tiene el truco …Nxe4 y …d5 (ataca a la vez al alfil y al caballo) y recupera la pieza.",
          12: "Desarrollo completo con más espacio: posición cómoda sin riesgos."
        }
      },
      {
        id: "italiana-petrov",
        name: "Si el negro juega 2…Nf6 (Petrov)",
        idea: "El negro contraataca e4 en vez de defender e5. Toma en e5 y no copies jugadas.",
        moves: ["e4", "e5", "Nf3", "Nf6", "Nxe5", "d6", "Nf3", "Nxe4", "d4", "d5", "Bd3"],
        arrows: ["xd3e4", "e1g1", "c2c4", "f1e1"],
        notes: {
          3: "La Petrov: en vez de defender e5, ataca e4.",
          4: "Toma el peón. El negro no puede copiar con …Nxe4 (mira la línea de la trampa).",
          5: "Lo correcto: primero echa al caballo, y solo después recupera el peón de e4.",
          6: "El caballo vuelve a casa, no hay nada mejor.",
          8: "Ocupa el centro y deja el caballo de e4 como un blanco fijo.",
          10: "Ataca el caballo de e4 y se prepara para enrocar. Posición equilibrada, con juego fácil: enroque, c4 y Re1 contra e4."
        }
      },
      {
        id: "italiana-petrov-trampa",
        name: "Petrov: la trampa de copiar",
        idea: "Si el negro toma en e4 enseguida, Qe2 le pone en apuros: gana la dama si se descuida, y si no, un peón.",
        moves: ["e4", "e5", "Nf3", "Nf6", "Nxe5", "Nxe4", "Qe2", "Qe7", "Qxe4", "d6", "d4"],
        arrows: ["od6e5", "d4e5", "b1c3", "c1f4"],
        notes: {
          5: "Una imprecisión: copiar la jugada del blanco. No pierde nada si el negro se defiende bien, pero es muy fácil equivocarse.",
          6: "Clava el caballo de e4 contra el rey. Si el negro lo retira con 4…Nf6??, 5.Nc6+ es jaque descubierto de la dama y el caballo ataca a la dama negra: se pierde la dama.",
          7: "La única defensa: contraclavar con la dama.",
          8: "Se come el caballo. El negro recuperará la pieza en e5.",
          10: "Tras …dxe5 dxe5 las blancas se quedan con un peón de más. El negro tiene algo de desarrollo a cambio, así que no está ganado, pero sí es una posición cómoda."
        }
      }
    ]
  },

  {
    id: "londres",
    name: "Londres",
    color: "w",
    style: "Un sistema: la misma estructura contra casi todo",
    summary:
      "Más que una apertura es un esquema: d4, alfil a f4, e3, Nf3, c3 y el " +
      "caballo a d2. Se monta casi igual haga lo que haga el negro, así que hay " +
      "muy poca teoría que memorizar. A cambio, hay que conocer tres o cuatro " +
      "respuestas típicas del negro.",
    lines: [
      {
        id: "londres-principal",
        name: "Contra …d5, …e6 y …c5",
        idea: "El esquema completo: triángulo de peones c3-d4-e3 y el alfil de f4 fuera de la cadena.",
        moves: ["d4", "d5", "Bf4", "Nf6", "e3", "e6", "Nf3", "c5", "c3", "Nc6", "Nbd2", "Bd6", "Bg3"],
        arrows: ["od6g3", "h2g3", "f1d3", "f3e5"],
        notes: {
          0: "Ocupa el centro. A partir de aquí, casi siempre las mismas jugadas.",
          2: "La seña de identidad: el alfil sale antes de jugar e3, para que no se quede encerrado detrás de los peones.",
          4: "Sujeta d4 y abre paso al otro alfil.",
          7: "El negro ataca d4, su forma más habitual de pelear contra la Londres.",
          8: "Con c3 el centro queda firme: el triángulo c3-d4-e3 es muy difícil de romper.",
          10: "El caballo va a d2 y no a c3, porque c3 ya lo ocupa el peón. Desde d2 apoya el avance e4 y puede ir a f3 o e5.",
          12: "El negro ofrece cambiar alfiles. No lo aceptes: retírate a g3. Si toma, hxg3 y tu torre gana la columna h abierta. Después: Bd3, enroque y a menudo el caballo a e5."
        }
      },
      {
        id: "londres-bd6",
        name: "Contra un …Bd6 temprano",
        idea: "El negro quiere cambiar tu alfil bueno. Se retira a g3 y el plan sigue igual.",
        moves: ["d4", "d5", "Bf4", "Nf6", "e3", "e6", "Nf3", "Bd6", "Bg3", "O-O", "Bd3"],
        arrows: ["xd3h7", "e1g1", "b1d2", "c2c3"],
        notes: {
          7: "El negro planta el alfil frente al tuyo para cambiarlo.",
          8: "A g3: el alfil sigue en su diagonal. Si el negro cambia con …Bxg3, hxg3 abre la columna h para tu torre y te deja un buen centro.",
          10: "El otro alfil a su mejor casilla, apuntando al enroque negro. Sigue enroque, Nbd2 y c3."
        }
      },
      {
        id: "londres-db6",
        name: "Contra …Qb6 (ataque a b2)",
        idea: "Al sacar el alfil a f4, b2 se queda sin defensa. La dama a b3 lo defiende y ofrece cambiar.",
        moves: ["d4", "d5", "Bf4", "c5", "e3", "Nc6", "c3", "Qb6", "Qb3", "c4", "Qc2"],
        arrows: ["xc2e4", "b1d2", "g1f3", "e3e4"],
        notes: {
          3: "El negro presiona d4 desde el principio.",
          7: "La amenaza típica contra la Londres: el alfil de c1 ya no defiende b2 y la dama negra lo ataca.",
          8: "Defiende b2 y ofrece cambiar damas. Si el negro cambia con …Qxb3, axb3 y tu torre gana la columna a: posición cómoda sin damas.",
          9: "El negro gana espacio atacando a tu dama y deja de presionar d4.",
          10: "Desde c2 la dama controla e4. El plan ahora es preparar el avance e4 para romper la cadena negra."
        }
      },
      {
        id: "londres-fianchetto",
        name: "Contra el fianchetto (…g6 y …Bg7)",
        idea: "Contra el esquema de la India de rey: mismo desarrollo, pero juega h3 antes de enrocar.",
        moves: ["d4", "Nf6", "Bf4", "g6", "e3", "Bg7", "Nf3", "O-O", "Be2", "d6", "h3"],
        arrows: ["of6h5", "f4h2", "e1g1"],
        notes: {
          3: "El negro coloca el alfil en g7, en la gran diagonal: es el esquema de la India de rey.",
          8: "Desarrollo sencillo. (Bd3 también vale.)",
          10: "La clave: casilla h2 para tu alfil. El negro suele jugar …Nh5 para cambiarlo, y ahora basta Bh2. Sin h3, ante …Nh5 tendrías que irte a g5, donde te perseguirá con …h6 y …g5, o dejarte cambiar el alfil."
        }
      }
    ]
  },

  {
    id: "gambito-dama",
    name: "Gambito de dama",
    color: "w",
    style: "Clásica: presión en el centro",
    summary:
      "Con 2.c4 ofreces un peón de flanco para quitarle al negro su peón central " +
      "de d5. No es un gambito de verdad: si el negro lo toma, lo recuperas sin " +
      "problemas. Da posiciones sólidas con un plan claro: presionar d5 y ganar " +
      "espacio en el centro.",
    lines: [
      {
        id: "gambito-dama-declinado",
        name: "Gambito de dama declinado (2…e6)",
        idea: "El negro sostiene d5 con …e6. Desarrollo clásico con el alfil a g5, que clava el caballo.",
        moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3"],
        arrows: ["xg5f6", "a1c1", "f1d3", "c4d5"],
        notes: {
          2: "Ataca d5 desde el flanco. Si el negro toma, recuperarás el peón.",
          3: "La respuesta más sólida: sostiene d5 con otro peón.",
          4: "Más presión sobre d5.",
          6: "Clava el caballo que defiende d5 contra la dama.",
          8: "Asegura d4 y abre la diagonal al alfil de f1.",
          10: "Desarrollo completo. Plan típico: Rc1, Bd3 y el cambio cxd5 en el momento oportuno."
        }
      },
      {
        id: "gambito-dama-elefante",
        name: "Declinado: la trampa del elefante",
        idea: "Si el negro juega …Nbd7, no tomes en d5 con el caballo: pierdes una pieza.",
        moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Nbd7", "cxd5", "exd5", "e3"],
        arrows: ["xg5f6", "f1d3", "g1f3", "e1g1"],
        notes: {
          7: "El caballo tapa la dama… y prepara una trampa.",
          8: "Normal: cambia en d5 para aclarar el centro.",
          9: "Ahora parece que el peón de d5 cae, porque solo lo defiende el caballo clavado de f6. No lo toques: 6.Nxd5?? Nxd5! 7.Bxd8 Bb4+ 8.Qd2 Bxd2+ 9.Kxd2 Kxd8, y el negro gana una pieza.",
          10: "Lo correcto: seguir desarrollando. La clavada en f6 sigue siendo molesta para el negro."
        }
      },
      {
        id: "gambito-dama-eslava",
        name: "Defensa eslava (2…c6)",
        idea: "El negro sostiene d5 con …c6 para sacar su alfil a f5. Juega e3 y persigue el alfil con Nh4.",
        moves: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "e3", "Bf5", "Nc3", "e6", "Nh4"],
        arrows: ["xh4f5", "of5g6", "h4g6"],
        notes: {
          3: "La Eslava: sostiene d5 sin encerrar su alfil de casillas blancas.",
          6: "Defiende c4 con el alfil de f1: si el negro toma en c4, lo recuperas enseguida.",
          7: "El negro saca el alfil antes de jugar …e6, justo lo que buscaba con …c6.",
          10: "El caballo persigue al alfil de f5. Si el negro no quiere perderlo, tiene que retirarlo; si deja que lo cambies, te quedas con la pareja de alfiles."
        }
      },
      {
        id: "gambito-dama-aceptado",
        name: "Gambito de dama aceptado (2…dxc4)",
        idea: "El negro toma el peón. Desarrolla con calma y recupéralo con el alfil.",
        moves: ["d4", "d5", "c4", "dxc4", "Nf3", "Nf6", "e3", "e6", "Bxc4", "c5", "O-O"],
        arrows: ["d1e2", "f1d1", "e3e4"],
        notes: {
          3: "El negro acepta el peón, pero a cambio deja el centro a las blancas.",
          4: "Sin prisa: el peón de c4 no se puede mantener.",
          6: "Abre la diagonal del alfil hacia c4.",
          8: "Recuperas el peón con desarrollo.",
          10: "Rey a salvo. Posición cómoda con un plan claro: Qe2, Rd1 y el avance e4."
        }
      },
      {
        id: "gambito-dama-albin",
        name: "Contragambito Albin (2…e5)",
        idea: "Un contragambito agresivo. Toma el peón y no juegues e3: hay una trampa famosa.",
        moves: ["d4", "d5", "c4", "e5", "dxe5", "d4", "Nf3", "Nc6", "g3"],
        arrows: ["f1g2", "b1d2", "e1g1"],
        notes: {
          3: "El Albin: el negro entrega un peón para ganar espacio.",
          4: "Toma el peón.",
          5: "El peón de d4 molesta, pero no lo ataques con e3: pierdes la ventaja y entras en terreno de trampas. Tras 4.e3 Bb4+ 5.Bd2 dxe3, si tomas el alfil con 6.Bxb4?? viene exf2+ 7.Ke2 fxg1=N+!: el peón corona en caballo con jaque y el negro gana (la trampa de Lasker).",
          6: "Desarrollo natural, y defiende el peón de e5.",
          8: "El alfil irá a g2, a la gran diagonal. Luego Nbd2, enroque y el peón de más."
        }
      }
    ]
  },

  {
    id: "ruy-lopez",
    name: "Ruy López (Española)",
    color: "w",
    style: "Clásica y de maniobras",
    summary:
      "La apertura más estudiada del ajedrez. El alfil va a b5 a presionar al " +
      "caballo que defiende e5, y esa presión dura toda la apertura mientras " +
      "preparas c3 y d4. Tiene más líneas que la Italiana, pero los planes se " +
      "repiten: enroque, Re1, c3, h3 y d4, y el caballo por d2 y f1 hasta g3.",
    lines: [
      {
        id: "ruy-lopez-principal",
        name: "Cerrada",
        idea: "La línea principal: enroca, defiende e4 con Re1 y prepara d4 con c3 y h3.",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7",
                "Re1", "b5", "Bb3", "d6", "c3", "O-O", "h3"],
        arrows: ["d2d4", "b1d2", "d2f1", "f1g3"],
        notes: {
          4: "La Española: el alfil presiona al caballo que defiende e5. Todavía no gana el peón (tras Bxc6 y Nxe5 el negro lo recupera con …Qd4), pero la presión no desaparece.",
          5: "El negro pregunta al alfil qué quiere hacer.",
          6: "Retírate sin soltar la presión sobre el caballo.",
          8: "No hace falta defender e4: si el negro lo toma, lo recuperas abriendo el centro con d4 (mira la línea Abierta).",
          10: "Ahora e4 está defendido, y con eso la amenaza ya es de verdad: Bxc6 seguido de Nxe5 gana un peón.",
          11: "Por eso el negro echa al alfil.",
          12: "El alfil acaba en la misma diagonal que en la Italiana, apuntando a f7.",
          14: "Prepara d4 y deja libre c2 para el alfil si el negro lo ataca con …Na5.",
          16: "Evita …Bg4, que clavaría el caballo que sostiene d4. Lo siguiente es d4, y el caballo de b1 viaja por d2 y f1 hasta g3."
        }
      },
      {
        id: "ruy-lopez-berlinesa",
        name: "Berlinesa (3…Nf6) con d3",
        idea: "El negro ataca e4 de entrada. Defiéndelo con d3 y juega el mismo esquema, sin entrar en el final de la Berlinesa.",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6", "d3", "Bc5", "c3", "O-O", "O-O", "d6", "Nbd2"],
        arrows: ["f1e1", "d2f1", "f1g3", "h2h3"],
        notes: {
          5: "La Berlinesa: una de las defensas más sólidas que existen.",
          6: "Defiende e4 y conserva todas las piezas. La alternativa 4.O-O Nxe4 lleva a un final sin damas muy teórico, famoso por lo difícil que es ganarlo.",
          8: "Prepara d4 y da al alfil la retirada por a4 hasta c2.",
          12: "El caballo empieza su viaje habitual: d2, f1 y g3. Con Re1 y h3 completas el esquema de la línea principal."
        }
      },
      {
        id: "ruy-lopez-abierta",
        name: "Abierta (5…Nxe4)",
        idea: "Si el negro se come el peón de e4, abre el centro con d4 y lo recuperas con ventaja de espacio.",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Nxe4",
                "d4", "b5", "Bb3", "d5", "dxe5", "Be6", "c3"],
        arrows: ["b3c2", "xc2e4", "b1d2"],
        notes: {
          9: "La Abierta: el negro acepta el peón que dejaste sin defender.",
          10: "Abre el centro mientras el rey negro sigue en e8. Re1 también recupera el peón, pero d4 da más.",
          11: "El negro echa al alfil para poder sostener su caballo con …d5.",
          14: "Peón recuperado. El de e5 te da espacio en el flanco de rey, y el caballo de e4, que parece fuerte, será tu objetivo.",
          16: "Abre c2 para el alfil, que desde ahí ataca al caballo de e4, y controla d4. Luego Nbd2 para cambiarlo."
        }
      },
      {
        id: "ruy-lopez-steinitz-diferida",
        name: "Steinitz diferida (4…d6) y el Arca de Noé",
        idea: "Contra …a6 y …d6, prepara d4 con c3: así esquivas la trampa más famosa de la Española.",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "d6", "c3", "Bd7", "d4", "g6", "O-O"],
        arrows: ["f1e1", "b1d2", "d2f1"],
        notes: {
          7: "El negro defiende e5 con el peón. Su caballo queda clavado por tu alfil.",
          8: "Primero c3. Si juegas d4 ya, viene el Arca de Noé: 5.d4 b5 6.Bb3 Nxd4 7.Nxd4 exd4 y, si tomas con la dama (8.Qxd4??), los peones avanzan con …c5 y …c4 y encierran al alfil de b3.",
          9: "Deshace la clavada.",
          10: "Ahora sí: centro de dos peones, y si el negro cambia recapturas con el peón de c3.",
          12: "Rey a salvo y centro fuerte. Sigue con Re1 y el caballo por d2 y f1."
        }
      },
      {
        id: "ruy-lopez-steinitz",
        name: "Steinitz (3…d6)",
        idea: "Si el negro defiende e5 con el peón enseguida, ocupa el centro con d4 sin preparar nada.",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "d6", "d4", "Bd7", "Nc3", "exd4", "Nxd4"],
        arrows: ["e1g1", "xb5c6", "f1e1"],
        notes: {
          5: "La Steinitz: sólida pero pasiva, muy frecuente entre aficionados. El caballo de c6 queda clavado.",
          6: "Aquí no hay Arca de Noé, porque el negro no ha jugado …a6 y no tiene …b5. Así que d4 directo, amenazando ganar el peón de e5.",
          7: "Deshace la clavada y sostiene el caballo.",
          8: "Desarrolla y mantiene la tensión en el centro.",
          10: "Caballo centralizado y más espacio: posición cómoda. Enroca y decide después si cambias en c6."
        }
      },
      {
        id: "ruy-lopez-clasica",
        name: "Clásica (3…Bc5)",
        idea: "El negro saca el alfil a c5. Prepara d4 con c3 y avanza ganando un tiempo sobre ese alfil.",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Bc5", "c3", "Nf6", "O-O", "O-O", "d4", "Bb6", "Re1"],
        arrows: ["h2h3", "b1d2", "d2f1"],
        notes: {
          5: "Desarrollo natural, como en la Italiana, pero el alfil será un blanco para tu peón d.",
          6: "Prepara d4.",
          8: "Enroca antes de romper: no hay prisa.",
          10: "Ataca el alfil y ocupa el centro. Si el negro toma (…exd4 cxd4), te quedas con dos peones centrales y e5 en la recámara.",
          12: "Sostiene e4 para mantener el centro. Luego h3 y el caballo por d2 y f1."
        }
      },
      {
        id: "ruy-lopez-schliemann",
        name: "Gambito Schliemann (3…f5)",
        idea: "El negro ataca tu centro por el flanco. No aceptes el lío: d3, recaptura con el peón y enroca.",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "f5", "d3", "fxe4", "dxe4", "Nf6", "O-O"],
        arrows: ["of6e4", "d1e2", "xe2e4"],
        notes: {
          5: "El Schliemann (o Jaenisch): agresivo y lleno de trampas. Se ve mucho a nivel de club.",
          6: "La respuesta tranquila: sostiene e4 y evita las líneas afiladas de 4.Nc3.",
          8: "Recaptura con el peón: mantienes tu peón en e4 y se abre la columna d para tu dama.",
          10: "Rey a salvo. El rey negro queda más expuesto: su peón f ya no tapa la diagonal a2–g8. Si se come el peón (…Nxe4?), Qe2 ataca al caballo y quedas con clara ventaja."
        }
      }
    ]
  },

  {
    id: "caro-kann",
    name: "Caro-Kann",
    color: "b",
    against: "e4",
    style: "Sólida: estructura firme y pocos riesgos",
    summary:
      "Con 1…c6 preparas …d5 para pelear por el centro sin encerrar tu alfil " +
      "de casillas blancas, que suele salir a f5 o g4 antes de jugar …e6. " +
      "Estructura de peones muy sana y finales cómodos: el blanco tiene que " +
      "arriesgar para ganar.",
    lines: [
      {
        id: "caro-kann-avance",
        name: "Variante del avance (3.e5)",
        idea: "El blanco gana espacio con e5. Saca el alfil a f5 antes de …e6 y ataca la cadena con …c5.",
        moves: ["e4", "c6", "d4", "d5", "e5", "Bf5", "Nf3", "e6", "Be2", "c5"],
        arrows: ["xc5d4", "b8c6", "d8b6", "xc6d4"],
        notes: {
          1: "Prepara …d5 sin tapar al alfil de c8.",
          3: "Pelea por el centro: el peón de e4 está atacado.",
          5: "Lo más importante de la Caro-Kann: el alfil sale ANTES de jugar …e6, que lo encerraría.",
          7: "Ahora sí: …e6 completa la cadena y abre paso al alfil de f8.",
          9: "Ataca la base de la cadena blanca (d4). Es el plan típico contra el avance: presionar d4 con …c5, …Nc6 y …Qb6."
        }
      },
      {
        id: "caro-kann-clasica",
        name: "Variante clásica (3.Nc3 dxe4)",
        idea: "Tomas en e4, sacas el alfil a f5 y, cuando te lo persigan, a g6. Ojo al avance h4-h5.",
        moves: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5", "Ng3", "Bg6", "h4", "h6"],
        arrows: ["oh4h5", "g6h7", "b8d7", "g8f6"],
        notes: {
          5: "Cambia en e4: el blanco no puede mantener su peón.",
          7: "El alfil sale con tiempo, atacando al caballo.",
          9: "La única buena: cualquier otra casilla para el alfil deja al blanco claramente mejor.",
          10: "El blanco amenaza h5, que encerraría tu alfil.",
          11: "Imprescindible: da una casilla de escape al alfil (h7). Sin …h6, tras h5 el alfil se queda sin sitio."
        }
      },
      {
        id: "caro-kann-cambio",
        name: "Variante del cambio (3.exd5)",
        idea: "Estructura simétrica. Desarrolla con naturalidad y saca el alfil a g4.",
        moves: ["e4", "c6", "d4", "d5", "exd5", "cxd5", "Bd3", "Nc6", "c3", "Nf6", "Bf4", "Bg4"],
        arrows: ["od1b3", "d8d7", "e7e6", "f8d6"],
        notes: {
          5: "Recaptura con el peón de c: los dos bandos quedan con la misma estructura.",
          7: "Desarrollo y presión sobre d4.",
          9: "Otra pieza más fuera y control de e4.",
          11: "El alfil sale activo antes de …e6, como siempre en la Caro-Kann."
        }
      },
      {
        id: "caro-kann-panov",
        name: "Ataque Panov (4.c4)",
        idea: "El blanco ataca d5 con c4 para jugar con un peón aislado. Desarrollo rápido y bloqueo de d5.",
        moves: ["e4", "c6", "d4", "d5", "exd5", "cxd5", "c4", "Nf6", "Nc3", "e6", "Nf3", "Be7"],
        arrows: ["e8g8", "b8c6", "xc6d4"],
        notes: {
          6: "El blanco busca juego activo a cambio de que su peón de d4 acabe aislado.",
          7: "Defiende d5 con una pieza.",
          9: "Sostiene d5. Aquí sí conviene …e6: lo importante es enrocar rápido.",
          11: "Desarrollo y enroque a la vista. Tu plan: bloquear la casilla d5 y, a la larga, presionar el peón aislado de d4."
        }
      },
      {
        id: "caro-kann-dos-caballos",
        name: "Dos caballos (2.Nc3 y 3.Nf3)",
        idea: "El blanco desarrolla caballos sin jugar d4. Saca el alfil a g4 y cámbialo por el caballo.",
        moves: ["e4", "c6", "Nc3", "d5", "Nf3", "Bg4", "h3", "Bxf3", "Qxf3", "e6"],
        arrows: ["g8f6", "f8e7", "e8g8"],
        notes: {
          5: "Clava el caballo, que es el que defiende e5 y d4.",
          6: "El blanco pregunta al alfil.",
          7: "Cámbialo. Retirarse a h5 parece natural, pero el blanco gana terreno con g4 y la posición se le pone cómoda.",
          9: "Estructura sólida. El blanco tiene la pareja de alfiles, pero tú vas más rápido en desarrollo: …Nf6, …Be7 y enroque."
        }
      }
    ]
  },

  {
    id: "e5",
    name: "1…e5 (Abierta)",
    color: "b",
    against: "e4",
    style: "Clásica: juego abierto y desarrollo rápido",
    summary:
      "Respondes al peón del centro con otro peón del centro. Es la respuesta " +
      "más natural y la que mejor enseña los principios: desarrollar piezas, " +
      "controlar el centro y enrocar pronto. Hay que conocer qué hacer contra " +
      "las tres jugadas principales del blanco en la tercera jugada.",
    lines: [
      {
        id: "e5-italiana",
        name: "Contra la Italiana (3.Bc4)",
        idea: "Saca el alfil a c5, igual que el blanco: posición equilibrada y sin trampas raras.",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d3", "d6"],
        arrows: ["e8g8", "a7a6", "c5a7"],
        notes: {
          1: "Pelea por el centro con la misma jugada.",
          3: "Defiende e5 desarrollando.",
          5: "El alfil a su mejor diagonal, apuntando a f2, el punto débil del blanco. Además, así evitas el Hígado Frito, que solo aparece tras 3…Nf6 4.Ng5.",
          7: "Ataca e4.",
          9: "Sujeta e5 y abre al alfil de c8. Luego: enroque, …a6 para dar una casilla al alfil y juego tranquilo de maniobras. Ojo si el blanco ataca el alfil con b4: antes de enrocar, retíralo a b6."
        }
      },
      {
        id: "e5-evans",
        name: "Contra el gambito Evans (4.b4)",
        idea: "El blanco entrega un peón para ganar tiempo. Tómalo y retira el alfil a a5.",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4", "Bxb4", "c3", "Ba5"],
        arrows: ["od2d4", "e5d4", "oe1g1", "g8e7"],
        notes: {
          6: "El gambito Evans: un peón a cambio de jugar c3 y d4 con ganancia de tiempo.",
          7: "Acéptalo: tomar es lo mejor.",
          8: "Ataca al alfil y prepara d4.",
          9: "Retirada a a5, desde donde sigue clavando por la diagonal. No te aferres al peón: si el blanco abre el centro, desarrolla rápido y enroca; devolver el peón está bien."
        }
      },
      {
        id: "e5-espanola",
        name: "Contra la Española (3.Bb5)",
        idea: "Pregunta al alfil con …a6 y desarrolla con …Nf6 y …Be7: la Española cerrada.",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7"],
        arrows: ["b7b5", "oa4b3", "d7d6", "e8g8"],
        notes: {
          4: "La Española: el alfil ataca al caballo que defiende e5.",
          5: "Pregunta al alfil. Tomar en c6 y luego en e5 no gana el peón todavía (mira la línea del cambio).",
          7: "Desarrolla atacando e4.",
          8: "El blanco no defiende e4 directamente: si …Nxe4, recupera el peón con Re1 o d4.",
          9: "Desarrollo sólido y enroque a la vista. Luego …b5 para quitarte el alfil de encima y …d6."
        }
      },
      {
        id: "e5-espanola-cambio",
        name: "Española: variante del cambio (4.Bxc6)",
        idea: "El blanco cambia el alfil por tu caballo. Recaptura hacia el centro y defiende e5 con …f6.",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Bxc6", "dxc6", "O-O", "f6"],
        arrows: ["od2d4", "e5d4", "of3d4", "c6c5"],
        notes: {
          7: "Recaptura hacia el centro y abre las líneas de tu dama y tu alfil. A cambio de los peones doblados tienes la pareja de alfiles.",
          8: "Lo correcto. Si el blanco toma ya el peón con 5.Nxe5?, la dama a d4 ataca a la vez al caballo y al peón de e4, y lo recuperas.",
          9: "Defiende e5 de forma sólida. Si el blanco rompe con d4, cambia peones y echa al caballo con …c5; si no, desarrolla el alfil a d6 o e6."
        }
      },
      {
        id: "e5-escocesa",
        name: "Contra la Escocesa (3.d4)",
        idea: "El blanco abre el centro enseguida. Toma, saca el caballo y responde al avance e5 con la dama.",
        moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Nf6", "Nxc6", "bxc6", "e5", "Qe7"],
        arrows: ["xe7e5", "od1e2", "f6d5"],
        notes: {
          4: "La Escocesa: el blanco abre el centro de inmediato.",
          5: "Toma: no puedes mantener e5.",
          7: "Ataca e4 y desarrolla.",
          9: "Recaptura hacia el centro: el peón de c6 ayudará a jugar …d5.",
          10: "El blanco ataca tu caballo.",
          11: "No hace falta retirarlo: la dama clava el peón de e5 contra el rey blanco, así que no puede tomar el caballo. Tras 7.Qe2 (que deshace la clavada) el caballo va a d5."
        }
      }
    ]
  },

  {
    id: "escandinava",
    name: "Escandinava",
    color: "b",
    against: "e4",
    style: "Directa y con muy poca teoría",
    summary:
      "Con 1…d5 atacas e4 desde la primera jugada y eres tú quien elige la " +
      "apertura: el blanco casi siempre toma, tu dama recaptura y se retira a " +
      "a5. A cambio del tiempo que pierde la dama, montas una estructura como " +
      "la de la Caro-Kann (…c6, …Bf5, …e6), muy fácil de jugar.",
    lines: [
      {
        id: "escandinava-principal",
        name: "Principal (3…Qa5)",
        idea: "Dama a a5, caballo a f6, …c6 para darle retirada y el alfil fuera antes de …e6.",
        moves: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5", "d4", "Nf6", "Nf3", "c6", "Bc4", "Bf5"],
        arrows: ["e7e6", "oc1d2", "oc3d5", "a5d8"],
        notes: {
          1: "La Escandinava: atacas e4 de inmediato.",
          3: "Recuperas el peón. La dama sale pronto y el blanco va a ganar un tiempo atacándola.",
          5: "La casilla clásica. Desde a5 la dama está segura y, en cuanto el blanco juegue d4, deja clavado al caballo de c3.",
          7: "Desarrolla y controla d5 y e4.",
          9: "La jugada clave: abre la retirada de la dama por c7 o d8 y controla d5.",
          11: "El alfil sale antes de …e6, como en la Caro-Kann. Luego …e6 y …Nbd7. Si tras Bd2 el caballo blanco salta a d5 descubriendo el alfil sobre tu dama, vuelve a d8: para eso jugaste …c6."
        }
      },
      {
        id: "escandinava-tranquila",
        name: "Si el blanco juega tranquilo (Bc4 y d3)",
        idea: "El mismo esquema. En cuanto aparezca Bd2 apuntando a tu dama, retírala a c7.",
        moves: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5", "Bc4", "Nf6", "d3", "c6", "Bd2", "Qc7"],
        arrows: ["c8f5", "e7e6", "b8d7"],
        notes: {
          8: "El blanco no ocupa el centro con d4: posición más tranquila.",
          9: "Como siempre, la retirada para la dama.",
          10: "El alfil apunta a tu dama a través del caballo: cualquier salto de ese caballo sería un ataque descubierto.",
          11: "No esperes a que salte: la dama se quita de la línea. Desde c7 sigue activa. Luego …Bf5 o …Bg4, …e6 y …Nbd7."
        }
      },
      {
        id: "escandinava-3nf3",
        name: "Si el blanco no ataca la dama (3.Nf3)",
        idea: "Aprovecha el tiempo: alfil a g4, caballo a c6 y enroque largo para presionar d4.",
        moves: ["e4", "d5", "exd5", "Qxd5", "Nf3", "Bg4", "Be2", "Nc6", "d4", "O-O-O"],
        arrows: ["xd5d4", "e7e5", "ob1c3", "d5a5"],
        notes: {
          4: "El blanco se guarda Nc3, a menudo para echar a la dama con c4.",
          5: "Clava el caballo. La dama se queda en el centro mientras nadie la ataque.",
          7: "Desarrolla apuntando a d4.",
          9: "La torre se suma a la presión sobre d4, y luego viene …e5. Si atacan a la dama con Nc3, va a a5; si es con c4, a f5."
        }
      },
      {
        id: "escandinava-avance",
        name: "Si el blanco avanza (2.e5)",
        idea: "Te regala una Caro-Kann mejorada: alfil a f5, …e6 y …c5 de una sola jugada.",
        moves: ["e4", "d5", "e5", "Bf5", "d4", "e6", "Nf3", "c5"],
        arrows: ["xc5d4", "b8c6", "d8b6"],
        notes: {
          2: "El blanco no toma: cierra el centro, pero no te crea ningún problema.",
          3: "El alfil sale antes de …e6.",
          5: "Cadena de peones sana, con el alfil ya fuera.",
          7: "Atacas la base del centro blanco. En la Caro-Kann este peón tarda dos jugadas en llegar a c5 (…c6 y …c5); aquí, una. Luego …Nc6 y …Qb6."
        }
      },
      {
        id: "escandinava-2nc3",
        name: "Si el blanco defiende con 2.Nc3",
        idea: "Avanza …d4 ganando un tiempo sobre el caballo y monta el centro con …e5.",
        moves: ["e4", "d5", "Nc3", "d4", "Nce2", "e5", "Ng3", "Be6"],
        arrows: ["xe6c4", "b8c6", "d8d7", "e8c8"],
        notes: {
          2: "El blanco defiende e4 con el caballo en vez de tomar.",
          3: "Ganas espacio y echas al caballo.",
          5: "Peones en d4 y e5: ya tienes más espacio que el blanco.",
          7: "Controla c4 para que el alfil blanco no se instale ahí. Luego …Nc6 y …Qd7, con enroque largo."
        }
      }
    ]
  },

  {
    id: "siciliana-dragon",
    name: "Siciliana Dragón",
    color: "b",
    against: "e4",
    style: "Agresiva: desequilibrio y ataques en flancos opuestos",
    summary:
      "Con 1…c5 peleas por el centro desde el flanco y creas una posición " +
      "desequilibrada desde la primera jugada. En la Dragón el alfil va a g7, " +
      "donde apunta por toda la gran diagonal hacia el flanco de dama blanco. " +
      "Es la más ambiciosa del catálogo y también la que más teoría pide: " +
      "algunas líneas son más largas que en el resto.",
    lines: [
      {
        id: "dragon-clasica",
        name: "Variante clásica (6.Be2)",
        idea: "El esquema de la Dragón contra el desarrollo tranquilo: fianchetto y enroque rápido.",
        moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6", "Be2", "Bg7", "O-O", "O-O"],
        arrows: ["b8c6", "xc6d4", "c8d7", "a8c8"],
        notes: {
          1: "La Siciliana: controlas d4 desde el flanco y evitas la simetría.",
          3: "Prepara …Nf6 sin que e5 te moleste.",
          5: "Cambias un peón de flanco por uno central: a la larga tendrás más peones en el centro.",
          7: "Ataca e4 con tiempo.",
          9: "La Dragón: el alfil irá a g7.",
          11: "El alfil del dragón, apuntando hacia d4 y el flanco de dama blanco.",
          13: "Rey a salvo. Tu plan: …Nc6, …Be6 o …Bd7 y presión en la columna c con …Rc8."
        }
      },
      {
        id: "dragon-yugoslavo",
        name: "Ataque yugoslavo (6.Be3, 7.f3 y 8.Qd2)",
        idea: "El blanco enrocará largo y lanzará sus peones contra tu rey. Tú atacas el suyo: gana el más rápido.",
        moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6", "Be3", "Bg7", "f3", "O-O", "Qd2", "Nc6"],
        arrows: ["c8d7", "a8c8", "c6e5", "e5c4"],
        notes: {
          10: "Prepara Qd2 y Bh6 para cambiar tu alfil del dragón.",
          12: "Sujeta e4 y prepara el avance g4-h4-h5 contra tu rey.",
          13: "Enroca igualmente: tu rey estará bajo ataque, pero el alfil de g7 lo protege.",
          15: "Desarrollo y presión sobre d4. A partir de aquí todo es velocidad: …Bd7, …Rc8 y …Ne5-c4 contra el rey blanco, que estará en c1."
        }
      },
      {
        id: "dragon-alapin",
        name: "Contra la Alapin (2.c3)",
        idea: "El blanco prepara d4 con c3. Ataca e4 con el caballo y, tras e5, colócalo en d5.",
        moves: ["e4", "c5", "c3", "Nf6", "e5", "Nd5", "d4", "cxd4", "Nf3", "Nc6"],
        arrows: ["oc3d4", "d7d6", "xc6d4"],
        notes: {
          2: "La Alapin: el blanco quiere un centro de peones con d4.",
          3: "Ataca e4 de inmediato: el blanco no puede defenderlo con Nc3 porque c3 está ocupado.",
          5: "El caballo se instala en d5, una casilla central muy buena.",
          9: "Desarrollo y presión sobre d4. Posición equilibrada y fácil de jugar."
        }
      },
      {
        id: "dragon-morra",
        name: "Contra el gambito Smith-Morra (3.c3)",
        idea: "El blanco ofrece un peón. No te compliques: …Nf6 y se llega a la posición de la Alapin.",
        moves: ["e4", "c5", "d4", "cxd4", "c3", "Nf6", "e5", "Nd5"],
        arrows: ["oc3d4", "d7d6", "og1f3", "b8c6"],
        notes: {
          4: "El gambito Smith-Morra: un peón a cambio de desarrollo rápido.",
          5: "En vez de tomar en c3, ataca e4. Así evitas todas las trampas del gambito.",
          7: "Lo mismo que contra la Alapin: el caballo en d5. Si el blanco recupera en d4, es la misma posición."
        }
      },
      {
        id: "dragon-moscu",
        name: "Contra 3.Bb5+ (Moscú)",
        idea: "Jaque de alfil: tápalo con el tuyo y cambia. Posición sencilla.",
        moves: ["e4", "c5", "Nf3", "d6", "Bb5+", "Bd7", "Bxd7+", "Qxd7"],
        arrows: ["b8c6", "g8f6", "g7g6", "f8g7"],
        notes: {
          4: "El blanco evita la teoría con un jaque.",
          5: "Tapa el jaque desarrollando.",
          7: "Recaptura con la dama. Luego …Nc6, …Nf6 y …g6 con el esquema de siempre."
        }
      },
      {
        id: "dragon-cerrada",
        name: "Contra la Siciliana cerrada (2.Nc3 y g3)",
        idea: "El blanco no abre con d4. Mismo esquema: fianchetto en g7.",
        moves: ["e4", "c5", "Nc3", "Nc6", "g3", "g6", "Bg2", "Bg7", "d3", "d6"],
        arrows: ["e7e6", "g8e7", "e8g8", "b7b5"],
        notes: {
          2: "La cerrada: el blanco juega despacio y suele atacar luego con f4.",
          5: "Tu fianchetto, como en la Dragón.",
          9: "Esquema completo. Plan típico: …e6 o …e5, …Nge7, enroque y avance …b5 en el flanco de dama."
        }
      }
    ]
  },

  {
    id: "gambito-dama-declinado",
    name: "Gambito de dama declinado",
    color: "b",
    against: "d4",
    style: "Sólida y clásica",
    summary:
      "Contra 1.d4 respondes 1…d5 y, si el blanco juega 2.c4, sostienes el " +
      "centro con …e6. Desarrollo sencillo (…Nf6, …Be7, enroque) y una " +
      "estructura que aguanta casi todo. El precio: tu alfil de c8 queda algo " +
      "encerrado y tendrás que liberarlo más adelante con …c5 o …b6.",
    lines: [
      {
        id: "gdd-principal",
        name: "Línea principal (4.Bg5)",
        idea: "Desarrollo clásico: …Be7 para deshacer la clavada, enroque y …h6 para preguntar al alfil.",
        moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "h6"],
        arrows: ["xh6g5", "og5h4", "b7b6", "c8b7"],
        notes: {
          1: "Ocupa el centro igual que el blanco.",
          3: "Sostiene d5 con un peón. Tu alfil de c8 queda tapado: es el precio de la solidez.",
          5: "Defiende d5 otra vez y desarrolla.",
          7: "Deshace la clavada del caballo de f6 contra tu dama.",
          9: "Rey a salvo.",
          11: "Pregunta al alfil: o se retira a h4 o cambia por tu caballo. Luego, para liberar tu juego: …b6 y el alfil a b7, o el avance …c5."
        }
      },
      {
        id: "gdd-cambio",
        name: "Variante del cambio (4.cxd5)",
        idea: "El blanco cambia en d5. Recaptura con el peón de e: tu alfil de c8 queda libre.",
        moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "cxd5", "exd5", "Bg5", "c6", "e3", "Be7"],
        arrows: ["e8g8", "b8d7", "f8e8", "oa1b1"],
        notes: {
          6: "El blanco cambia para fijar la estructura.",
          7: "Recaptura con el peón de e: se abre la diagonal de tu alfil de c8, que ya no está encerrado.",
          9: "Refuerza d5 y deja libre la casilla c7 para tu dama.",
          11: "Desarrollo y enroque. El blanco suele atacar en el flanco de dama (el «ataque de minorías» con b4-b5); tu juego está en el centro y en el flanco de rey."
        }
      },
      {
        id: "gdd-londres",
        name: "Contra la Londres (2.Bf4)",
        idea: "Si el blanco no juega c4: …c5, …Nc6 y la dama a b6 contra b2, que el alfil de f4 dejó sin defensa.",
        moves: ["d4", "d5", "Bf4", "Nf6", "e3", "c5", "c3", "Nc6", "Nd2", "Qb6"],
        arrows: ["xb6b2", "od1b3", "c5c4"],
        notes: {
          2: "El sistema Londres: el alfil sale antes de e3.",
          5: "Ataca d4 desde el principio, la mejor forma de incomodar a la Londres.",
          7: "Más presión sobre d4.",
          9: "La jugada molesta: con el alfil en f4, nadie defiende b2. El blanco tiene que gastar tiempo con la dama (Qb3 o Qc2)."
        }
      }
    ]
  },

  {
    id: "eslava",
    name: "Eslava",
    color: "b",
    against: "d4",
    style: "Sólida, hermana de la Caro-Kann",
    summary:
      "Sostienes d5 con …c6 en vez de con …e6, así que tu alfil de casillas " +
      "blancas no queda encerrado: sale a f5 antes de cerrar con …e6. La " +
      "estructura es la de la Caro-Kann y los planes se parecen. Lo único " +
      "delicado es el orden: cuándo puede salir el alfil y cuándo conviene " +
      "tomar en c4.",
    lines: [
      {
        id: "eslava-principal",
        name: "Principal (…dxc4 y …Bf5)",
        idea: "Con los dos caballos blancos fuera, toma en c4; tras a4, alfil a f5 y …e6.",
        moves: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4", "a4", "Bf5", "e3", "e6"],
        arrows: ["of1c4", "f8b4", "b8d7", "e8g8"],
        notes: {
          3: "La Eslava: defiendes d5 sin encerrar el alfil de c8.",
          5: "Desarrolla. El alfil todavía no: el orden importa.",
          7: "Con el caballo en c3, sacar ya el alfil permitiría cxd5 y Qb3 contra b7 y d5. Mejor tomar: amenazas quedarte el peón con …b5.",
          8: "El blanco impide …b5, pero a cambio deja un agujero en b4.",
          9: "Ahora sí. El alfil controla e4, la casilla a la que el blanco quiere avanzar.",
          11: "Estructura completa. El blanco recupera el peón con Bxc4 y tú sigues con …Bb4 (al agujero), …Nbd7 y enroque."
        }
      },
      {
        id: "eslava-lenta",
        name: "Eslava lenta (4.e3)",
        idea: "Si el blanco juega e3 antes de sacar el caballo de dama, el alfil ya puede salir a f5.",
        moves: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "e3", "Bf5", "Nc3", "e6"],
        arrows: ["of3h4", "f5g6", "oh4g6", "h7g6"],
        notes: {
          6: "El blanco defiende c4 y encierra su propio alfil de c1: tomar en c4 ya no tiene gracia.",
          7: "Sin el caballo en c3 el alfil puede salir: si el blanco prueba cxd5 y Qb3, basta defender b7 con …Qc7.",
          9: "Estructura completa. Si persiguen al alfil con Nh4, retíralo a g6: si lo cambian, recapturas con el peón h y tu torre gana una columna."
        }
      },
      {
        id: "eslava-3nc3",
        name: "Si el caballo de dama sale antes (3.Nc3)",
        idea: "Con este orden el alfil no debe salir: …e6 y esquema Semieslavo.",
        moves: ["d4", "d5", "c4", "c6", "Nc3", "Nf6", "e3", "e6", "Nf3", "Nbd7"],
        arrows: ["f8d6", "e8g8", "d5c4", "b7b5"],
        notes: {
          4: "Otro orden: el caballo de dama sale primero y presiona d5.",
          6: "El blanco sostiene c4.",
          7: "Aquí …Bf5 es impreciso: tras cxd5 cxd5 Qb3 la dama ataca b7 y d5 a la vez y el alfil tiene que volver a c8. Con …e6 entras en la Semieslava, muy sólida.",
          9: "Luego …Bd6 y enroque. El alfil de c8 saldrá más tarde por b7, después de …dxc4 y …b5."
        }
      },
      {
        id: "eslava-cambio",
        name: "Variante del cambio (3.cxd5)",
        idea: "Posición simétrica: caballos a f6 y c6, y el alfil a f5 antes de …e6.",
        moves: ["d4", "d5", "c4", "c6", "cxd5", "cxd5", "Nc3", "Nf6", "Nf3", "Nc6", "Bf4", "Bf5"],
        arrows: ["oe2e3", "e7e6", "od1b3", "f8b4"],
        notes: {
          4: "El blanco cambia y la estructura queda simétrica. Tiene fama de tablas, pero hay que jugarla con cuidado.",
          5: "Recaptura con el peón para mantener el tuyo en d5.",
          9: "Sin peón en c6, el caballo va a su mejor casilla.",
          11: "Alfil fuera antes de …e6. Si el blanco ataca b7 con Qb3 después de …e6, la respuesta es …Bb4, clavando el caballo. Si Qb3 llega ya, antes de que juegues …e6, no defiendas b7: echa a la dama con …Na5."
        }
      },
      {
        id: "eslava-londres",
        name: "Contra la Londres (2.Bf4)",
        idea: "Si el blanco no juega c4: …c5, …Nc6 y la dama a b6 contra b2, que el alfil de f4 dejó sin defensa.",
        moves: ["d4", "d5", "Bf4", "Nf6", "e3", "c5", "c3", "Nc6", "Nd2", "Qb6"],
        arrows: ["xb6b2", "od1b3", "c5c4"],
        notes: {
          2: "El sistema Londres: el alfil sale antes de e3. Aquí no hay Eslava que valga, porque el blanco no ataca d5.",
          5: "Ataca d4 desde el principio, la mejor forma de incomodar a la Londres.",
          7: "Más presión sobre d4.",
          9: "La jugada molesta: con el alfil en f4, nadie defiende b2. El blanco tiene que gastar tiempo con la dama (Qb3 o Qc2)."
        }
      }
    ]
  },

  {
    id: "india-de-rey",
    name: "India de rey",
    color: "b",
    against: "d4",
    style: "Dinámica: dejas el centro al blanco y luego lo atacas",
    summary:
      "Dejas que el blanco ocupe el centro con sus peones, colocas el alfil " +
      "en g7 (fianchetto), enrocas y luego golpeas ese centro con …e5 o …c5. " +
      "Lleva a posiciones con mucha lucha: ideal si te gusta atacar. El " +
      "esquema es casi siempre el mismo: …Nf6, …g6, …Bg7, …d6 y enroque.",
    lines: [
      {
        id: "idr-clasica",
        name: "Variante clásica (5.Nf3 y 6.Be2)",
        idea: "El esquema completo y luego el golpe …e5 contra el centro.",
        moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2", "e5"],
        arrows: ["xe5d4", "od4d5", "f6h5", "f7f5"],
        notes: {
          1: "Controla e4 sin comprometer todavía tus peones centrales.",
          3: "Prepara el fianchetto.",
          5: "El alfil en g7 vigila la gran diagonal y el centro desde lejos.",
          6: "El blanco ocupa el centro con tres peones: se lo has permitido a propósito.",
          7: "Sujeta e5 y abre la diagonal del alfil de c8.",
          9: "Rey a salvo antes de abrir el juego.",
          11: "El golpe típico de la India de rey: atacas d4. Luego, si el blanco cierra con d5, tu plan es …Nh5 o …Ne8 y el avance …f5 contra su rey."
        }
      },
      {
        id: "idr-samisch",
        name: "Sämisch (5.f3)",
        idea: "El blanco refuerza e4 con f3. Aquí el golpe bueno es …c5, no …e5.",
        moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "f3", "O-O", "Be3", "c5", "Nge2", "Nc6"],
        arrows: ["od4d5", "c6e5", "a7a6", "b7b5"],
        notes: {
          8: "El blanco sujeta e4 y suele preparar Qd2, Bh6 y enroque largo para atacar tu rey.",
          9: "Enroca de todas formas: tu rey está seguro detrás del alfil de g7.",
          11: "Contra la Sämisch, el golpe es …c5 y no …e5 (con …e5 el blanco queda claramente mejor). Si el blanco toma el peón con 7.dxc5 dxc5 8.Qxd8 Rxd8 9.Bxc5, juega 9…Nc6: con tus piezas tan activas, la posición está igualada aunque tengas un peón menos.",
          13: "Desarrollo y presión sobre d4. Si el blanco avanza con d5, el caballo va a e5 y tu juego está en el flanco de dama con …a6 y …b5."
        }
      },
      {
        id: "idr-londres",
        name: "Contra la Londres (2.Bf4)",
        idea: "Mismo esquema. Si el blanco enroca sin jugar antes h3, …Nh5 caza su alfil de f4.",
        moves: ["d4", "Nf6", "Bf4", "g6", "e3", "Bg7", "Nf3", "O-O", "Be2", "d6", "O-O", "Nh5"],
        arrows: ["of4g5", "h7h6", "og5h4", "g6g5"],
        notes: {
          2: "La Londres: no hay c4, así que el blanco no ocupa el centro con peones.",
          5: "Tu esquema de siempre.",
          9: "Prepara …e5 y deja preparado el truco del caballo.",
          11: "El caballo ataca al alfil de f4, que no puede retirarse a h2 porque el blanco no jugó h3. O se va a g5, y lo persigues con …h6 y …g5 ganando espacio, o se deja cambiar y te quedas con la pareja de alfiles."
        }
      }
    ]
  }
];
