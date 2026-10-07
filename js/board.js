/**
 * Tablero interactivo.
 *
 * Pensado para dedo antes que para ratón: se puede jugar tocando origen y
 * destino, o arrastrando la pieza (que se levanta por encima del dedo para no
 * quedar tapada). No sabe nada de reglas de ajedrez: quien lo usa le pasa el
 * mapa de jugadas legales con setDests().
 */
window.Board = (function () {
  var FILES = "abcdefgh";
  var COARSE = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  /**
   * Geometría del arrastre táctil, donde todo tiene que encajar a la vez.
   *
   * La pieza se dibuja por encima del dedo para no quedar tapada, y se suelta
   * donde está la PIEZA, que es con lo que se apunta. Ese alzado no puede ser
   * grande: con casi una casilla, arrastrar una casilla hacia arriba apenas
   * movía el dedo (la pieza ya estaba allí), y entonces ningún umbral podía
   * distinguir ese arrastre de un simple pulso del pulgar.
   *
   * Con un alzado de un tercio de casilla las dos cosas conviven:
   *   · arrastrar una casilla arriba mueve el dedo ~0,65 casillas, de sobra;
   *   · un pulso de pulgar deja el dedo dentro de la casilla de origen, y ahí
   *     el gesto se resuelve como toque y no mueve nada.
   */
  var LIFT = 0.35;        // alzado de la pieza sobre el dedo, en casillas
  var DRAG_START = 0.3;   // recorrido para dar el gesto por arrastre

  function liftFor(boardWidth) { return COARSE ? boardWidth / 8 * LIFT : 0; }

  // Duración del desplazamiento de una pieza. Tiene que coincidir con la
  // transición de `.piece` en css/styles.css: si se cambia una, hay que
  // cambiar la otra.
  var PIECE_MOVE_MS = 280;

  function squareName(file, rank) { return FILES[file] + (rank + 1); }
  function fileOf(sq) { return FILES.indexOf(sq[0]); }
  function rankOf(sq) { return parseInt(sq[1], 10) - 1; }

  /** Lee el campo de piezas de un FEN a un objeto { e4: "wP", ... }. */
  function parseFen(fen) {
    var out = {};
    var rows = fen.split(" ")[0].split("/");
    for (var r = 0; r < 8; r++) {
      var rank = 7 - r, file = 0, row = rows[r];
      for (var i = 0; i < row.length; i++) {
        var ch = row[i];
        if (ch >= "1" && ch <= "8") {
          file += +ch;
        } else {
          var color = ch === ch.toUpperCase() ? "w" : "b";
          out[squareName(file, rank)] = color + ch.toUpperCase();
          file++;
        }
      }
    }
    return out;
  }

  function create(root, options) {
    options = options || {};

    var state = {
      orientation: "w",
      pieces: {},          // casilla -> "wP"
      dests: {},           // casilla origen -> [casillas destino]
      selected: null,
      lastMove: null,      // [origen, destino]
      check: null,         // casilla del rey en jaque
      mate: false,         // ...y si además es mate, que se vea distinto
      guide: null,         // [origen, destino] de la jugada que hay que hacer (aprender)
      arrows: [],          // flechas numeradas del plan: [{ from, to, kind }]
      hint: null,          // pista fija que parpadea: { from, to } (to puede faltar)
      interactive: false,
      coords: options.coords !== false,
      pieceSet: options.pieces || "cburnett"
    };

    var els = {};          // casilla -> elemento de la pieza
    var drag = null;

    root.classList.add("board");
    root.innerHTML =
      '<div class="board-squares"></div>' +
      '<div class="board-marks"></div>' +
      '<div class="board-pieces"></div>' +
      '<svg class="board-arrows" viewBox="0 0 8 8" aria-hidden="true"></svg>' +
      '<div class="board-flash"></div>' +
      '<div class="board-promo" hidden></div>';
    var squaresLayer = root.querySelector(".board-squares");
    var marksLayer = root.querySelector(".board-marks");
    var piecesLayer = root.querySelector(".board-pieces");
    var arrowsLayer = root.querySelector(".board-arrows");
    // Capa aparte para los destellos de acierto/fallo/pista: viven más tiempo
    // que una jugada y `renderMarks()` reconstruye `marksLayer` por completo
    // en cada jugada (incluida la que ellos mismos acaban de motivar), así que
    // si compartieran capa se borrarían al instante, antes de que se vean.
    var flashLayer = root.querySelector(".board-flash");
    var promoLayer = root.querySelector(".board-promo");

    buildSquares();

    // --- geometría ------------------------------------------------------

    /** Posición visual (0..7 desde la esquina superior izquierda) de una casilla. */
    function viewPos(sq) {
      var f = fileOf(sq), r = rankOf(sq);
      return state.orientation === "w" ? [f, 7 - r] : [7 - f, r];
    }

    function place(el, sq) {
      var p = viewPos(sq);
      el.style.transform = "translate(" + p[0] * 100 + "%," + p[1] * 100 + "%)";
    }

    /** Casilla bajo un punto de la pantalla, o null si cae fuera del tablero. */
    function squareAt(clientX, clientY) {
      var rect = root.getBoundingClientRect();
      var x = (clientX - rect.left) / rect.width * 8;
      var y = (clientY - rect.top) / rect.height * 8;
      if (x < 0 || x >= 8 || y < 0 || y >= 8) return null;
      var vf = Math.floor(x), vr = Math.floor(y);
      return state.orientation === "w"
        ? squareName(vf, 7 - vr)
        : squareName(7 - vf, vr);
    }

    // --- dibujo ---------------------------------------------------------

    function buildSquares() {
      var html = "";
      for (var vr = 0; vr < 8; vr++) {
        for (var vf = 0; vf < 8; vf++) {
          // mismo transform que place(): así no hay redondeo de grid por un
          // lado y de transform por otro que las desalinee un par de píxeles
          html += '<div class="sq ' + ((vf + vr) % 2 ? "dark" : "light") +
            '" style="transform:translate(' + vf * 100 + "%," + vr * 100 + '%)"></div>';
        }
      }
      squaresLayer.innerHTML = html;
      drawCoords();
    }

    function drawCoords() {
      root.querySelectorAll(".coord").forEach(function (n) { n.remove(); });
      if (!state.coords) return;
      var frag = document.createDocumentFragment();
      for (var i = 0; i < 8; i++) {
        var file = state.orientation === "w" ? FILES[i] : FILES[7 - i];
        var rank = state.orientation === "w" ? 8 - i : i + 1;

        var f = document.createElement("div");
        f.className = "coord coord-file " + (i % 2 ? "on-light" : "on-dark");
        f.textContent = file;
        f.style.left = i * 12.5 + "%";
        frag.appendChild(f);

        var r = document.createElement("div");
        r.className = "coord coord-rank " + (i % 2 ? "on-dark" : "on-light");
        r.textContent = rank;
        r.style.top = i * 12.5 + "%";
        frag.appendChild(r);
      }
      squaresLayer.appendChild(frag);
    }

    /** SVG de una pieza en el juego activo, con vuelta atrás si no existe. */
    function svgFor(piece) {
      var set = window.PIECE_SETS[state.pieceSet] || window.PIECE_SETS.cburnett;
      return set.pieces[piece];
    }

    function renderPieces() {
      piecesLayer.innerHTML = "";
      els = {};
      for (var sq in state.pieces) {
        var el = document.createElement("div");
        el.className = "piece";
        el.innerHTML = svgFor(state.pieces[sq]);
        place(el, sq);
        piecesLayer.appendChild(el);
        els[sq] = el;
      }
    }

    function renderMarks() {
      marksLayer.innerHTML = "";
      var frag = document.createDocumentFragment();

      // El resaltado se pinta distinto según el color de la casilla: un mismo
      // amarillo translúcido sobre crema y sobre verde da dos colores que no
      // se parecen en nada.
      function mark(sq, cls) {
        var el = document.createElement("div");
        var dark = (fileOf(sq) + rankOf(sq)) % 2 === 0;
        el.className = "mark " + cls + (dark ? " on-dark" : " on-light");
        place(el, sq);
        frag.appendChild(el);
      }

      if (state.lastMove) {
        mark(state.lastMove[0], "last");
        mark(state.lastMove[1], "last");
      }
      if (state.check) mark(state.check, state.mate ? "mate" : "check");
      if (state.guide) {
        mark(state.guide[0], "guide");
        mark(state.guide[1], "guide");
      }
      if (state.selected) mark(state.selected, "selected");

      if (state.selected && state.interactive) {
        var dests = state.dests[state.selected] || [];
        for (var i = 0; i < dests.length; i++) {
          mark(dests[i], state.pieces[dests[i]] ? "capture" : "dest");
        }
      }
      marksLayer.appendChild(frag);
    }

    /**
     * Flechas del plan, al estilo de ChessBase: trazo grueso y liso, en L
     * para el caballo (primero el tramo largo), con el número de orden en
     * el arranque. Todo en unidades de casilla (el viewBox es 8×8), así que
     * escala solo con el tablero.
     */
    function renderArrows() {
      var START = 0.3, SHAFT = 0.2, HEAD_W = 0.5, HEAD_L = 0.38;
      var shafts = "", badges = "";
      function n(v) { return Math.round(v * 1000) / 1000; }

      state.arrows.forEach(function (a, i) {
        var pa = viewPos(a.from), pb = viewPos(a.to);
        var A = [pa[0] + 0.5, pa[1] + 0.5], B = [pb[0] + 0.5, pb[1] + 0.5];
        var dx = B[0] - A[0], dy = B[1] - A[1];
        var knight = Math.abs(dx) + Math.abs(dy) === 3 && dx !== 0 && dy !== 0;
        // el codo del caballo: se recorre primero el tramo de dos casillas
        var C = knight ? (Math.abs(dy) > Math.abs(dx) ? [A[0], B[1]] : [B[0], A[1]]) : null;

        var first = C || B;
        var len1 = Math.sqrt(Math.pow(first[0] - A[0], 2) + Math.pow(first[1] - A[1], 2));
        var S = [A[0] + (first[0] - A[0]) / len1 * START, A[1] + (first[1] - A[1]) / len1 * START];

        var prev = C || S;
        var len2 = Math.sqrt(Math.pow(B[0] - prev[0], 2) + Math.pow(B[1] - prev[1], 2));
        var u = [(B[0] - prev[0]) / len2, (B[1] - prev[1]) / len2];
        var base = [B[0] - u[0] * HEAD_L, B[1] - u[1] * HEAD_L];
        var px = -u[1] * HEAD_W / 2, py = u[0] * HEAD_W / 2;

        shafts += '<g class="arrow ' + a.kind + '">' +
          '<path d="M' + n(S[0]) + " " + n(S[1]) +
            (C ? " L" + n(C[0]) + " " + n(C[1]) : "") +
            // un pelo dentro de la punta, para que no quede rendija entre ambas
            " L" + n(base[0] + u[0] * 0.02) + " " + n(base[1] + u[1] * 0.02) +
            '" stroke-width="' + SHAFT + '"/>' +
          '<polygon points="' + n(B[0]) + "," + n(B[1]) + " " +
            n(base[0] + px) + "," + n(base[1] + py) + " " +
            n(base[0] - px) + "," + n(base[1] - py) + '"/></g>';
        badges += '<g class="arrow-num ' + a.kind + '">' +
          '<circle cx="' + n(S[0]) + '" cy="' + n(S[1]) + '" r="0.17"/>' +
          '<text x="' + n(S[0]) + '" y="' + n(S[1]) + '" dy="0.35em">' + (i + 1) + "</text></g>";
      });
      // los números van al final para que ninguna flecha los tape
      arrowsLayer.innerHTML = shafts + badges;
    }

    /**
     * Pista que no se va sola: parpadea hasta que se quite. Vive en la capa
     * de destellos y no en la de marcas porque esa se reconstruye con cada
     * toque, y el parpadeo volvería a empezar cada vez que se toca una pieza.
     */
    var hintEls = [];
    function renderHint() {
      hintEls.forEach(function (el) { el.remove(); });
      hintEls = [];
      if (!state.hint) return;
      [[state.hint.from, "hint-hold"], [state.hint.to, "hint-hold to"]].forEach(function (h) {
        if (!h[0]) return;
        var el = document.createElement("div");
        el.className = "mark " + h[1];
        place(el, h[0]);
        flashLayer.appendChild(el);
        hintEls.push(el);
      });
    }

    // --- interacción ----------------------------------------------------

    function canMoveFrom(sq) {
      return state.interactive && state.dests[sq] && state.dests[sq].length > 0;
    }

    function select(sq) {
      state.selected = sq;
      renderMarks();
    }

    function deselect() {
      if (state.selected === null) return;
      state.selected = null;
      renderMarks();
    }

    function tryMove(from, to) {
      var dests = state.dests[from] || [];
      if (dests.indexOf(to) === -1) return false;
      deselect();

      var piece = state.pieces[from];
      var promoRank = piece[0] === "w" ? "8" : "1";
      if (piece[1] === "P" && to[1] === promoRank) {
        askPromotion(from, to, piece[0]);
        return true;
      }
      if (options.onMove) options.onMove(from, to, null);
      return true;
    }

    function onPointerDown(ev) {
      if (!state.interactive || ev.button === 1 || ev.button === 2) return;
      if (!promoLayer.hidden) return;
      var sq = squareAt(ev.clientX, ev.clientY);
      if (!sq) return;

      // segundo toque: si es un destino válido, se completa la jugada
      if (state.selected && state.selected !== sq) {
        if (tryMove(state.selected, sq)) { ev.preventDefault(); return; }
      }

      if (!canMoveFrom(sq)) { deselect(); return; }
      ev.preventDefault();

      // Si ya estaba elegida, el segundo toque la suelta... pero eso no puede
      // decidirse aquí: desde una pieza elegida también se empieza a arrastrar.
      // Se apunta y se resuelve al levantar el dedo.
      var wasSelected = state.selected === sq;
      select(sq);

      drag = {
        from: sq, el: els[sq], pointerId: ev.pointerId,
        startX: ev.clientX, startY: ev.clientY, active: false, over: null,
        wasSelected: wasSelected
      };
      try { root.setPointerCapture(ev.pointerId); } catch (e) { /* puntero ya liberado */ }
    }

    function onPointerMove(ev) {
      if (!drag || ev.pointerId !== drag.pointerId) return;
      var dx = ev.clientX - drag.startX, dy = ev.clientY - drag.startY;
      var boardWidth = root.getBoundingClientRect().width;
      if (!drag.active &&
          Math.sqrt(dx * dx + dy * dy) < (COARSE ? boardWidth / 8 * DRAG_START : 5)) {
        return;
      }

      if (!drag.active) {
        drag.active = true;
        drag.el.classList.add("dragging");
      }
      ev.preventDefault();

      var rect = root.getBoundingClientRect();
      var size = rect.width / 8;
      // en pantallas táctiles la pieza se levanta para que el dedo no la tape
      var lift = liftFor(rect.width);
      var x = ev.clientX - rect.left - size / 2;
      var y = ev.clientY - rect.top - size / 2 - lift;
      drag.el.style.transform = "translate(" + (x / size * 100) + "%," + (y / size * 100) + "%)";

      var over = squareAt(ev.clientX, ev.clientY + (COARSE ? -lift : 0));
      if (over !== drag.over) {
        drag.over = over;
        var prev = marksLayer.querySelector(".mark.hover");
        if (prev) prev.remove();
        if (over && (state.dests[drag.from] || []).indexOf(over) !== -1) {
          var el = document.createElement("div");
          el.className = "mark hover";
          place(el, over);
          marksLayer.appendChild(el);
        }
      }
    }

    function onPointerUp(ev) {
      if (!drag || ev.pointerId !== drag.pointerId) return;
      var d = drag;
      drag = null;
      try { root.releasePointerCapture(ev.pointerId); } catch (e) { /* ya liberado */ }

      var hover = marksLayer.querySelector(".mark.hover");
      if (hover) hover.remove();

      if (!d.active) {
        // toque simple: elige la pieza, o la suelta si ya lo estaba
        if (d.wasSelected) deselect();
        return;
      }
      d.el.classList.remove("dragging");
      place(d.el, d.from);

      var rect = root.getBoundingClientRect();

      // Si el dedo no ha llegado a salir de la casilla de origen, no hubo
      // intención de mover: fue un pulso. Esta es la guarda que de verdad
      // corta las jugadas fantasma, porque mira la geometría del tablero y no
      // una distancia suelta en píxeles.
      if (squareAt(ev.clientX, ev.clientY) === d.from) {
        select(d.from);
        return;
      }

      // Se suelta donde está la PIEZA, que es lo que el jugador ve y con lo
      // que apunta, no donde está el dedo.
      var lift = liftFor(rect.width);
      var target = squareAt(ev.clientX, ev.clientY - lift);
      if (target && target !== d.from) {
        if (!tryMove(d.from, target)) deselect();
      } else {
        deselect();
      }
    }

    function onPointerCancel(ev) {
      if (!drag || ev.pointerId !== drag.pointerId) return;
      drag.el.classList.remove("dragging");
      place(drag.el, drag.from);
      drag = null;
      deselect();
    }

    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerup", onPointerUp);
    root.addEventListener("pointercancel", onPointerCancel);
    root.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    // iOS: pese a touch-action:none, dos toques rápidos sobre una pieza que
    // se puede mover (las que al elegirlas pintan marcas nuevas) lanzaban el
    // gesto de ampliar y el tablero vibraba. Cancelar el toque nativo lo
    // corta; el tablero funciona con pointer events, que siguen llegando.
    // Los botones de promoción usan click, que sin el toque no llegaría.
    root.addEventListener("touchstart", function (ev) {
      if (!promoLayer.contains(ev.target)) ev.preventDefault();
    }, { passive: false });

    // --- coronación -----------------------------------------------------

    function askPromotion(from, to, color) {
      var pos = viewPos(to);
      var order = ["Q", "N", "R", "B"];
      var downwards = pos[1] === 0;   // se despliega hacia abajo si corona arriba

      promoLayer.innerHTML = "";
      promoLayer.hidden = false;

      order.forEach(function (kind, i) {
        var btn = document.createElement("button");
        btn.className = "promo-choice";
        btn.type = "button";
        btn.setAttribute("aria-label", pieceName(kind));
        btn.innerHTML = svgFor(color + kind);
        var row = downwards ? i : 7 - i;
        btn.style.transform = "translate(" + pos[0] * 100 + "%," + row * 100 + "%)";
        btn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          promoLayer.hidden = true;
          if (options.onMove) options.onMove(from, to, kind.toLowerCase());
        });
        promoLayer.appendChild(btn);
      });

      promoLayer.addEventListener("pointerdown", function cancel(ev) {
        if (ev.target.closest(".promo-choice")) return;
        promoLayer.hidden = true;
        promoLayer.removeEventListener("pointerdown", cancel);
        renderMarks();
      });
    }

    function pieceName(kind) {
      return { Q: "Dama", R: "Torre", B: "Alfil", N: "Caballo" }[kind];
    }

    // --- API pública ----------------------------------------------------

    var api = {
      /** Coloca una posición. Con `opts.animate = [origen, destino]` desliza la
       *  pieza en lugar de saltar, incluidos enroque y captura al paso. */
      setPosition: function (fen, opts) {
        opts = opts || {};
        var next = parseFen(fen);
        var from = opts.animate && opts.animate[0];
        var to = opts.animate && opts.animate[1];
        var mover = from ? els[from] : null;

        state.lastMove = opts.lastMove || (from ? [from, to] : null);
        state.check = opts.check || null;
        state.mate = !!opts.mate;

        if (!mover) {
          state.pieces = next;
          renderPieces();
          renderMarks();
          return;
        }

        // `opts.simple` se usa para deshacer visualmente un intento fallido: la
        // pieza vuelve a su casilla de origen, y esa "jugada" no es una jugada
        // de ajedrez de verdad, así que no hay que buscarle captura ni mirar si
        // parece un enroque (podría serlo por coincidencia de geometría si el
        // intento fallido FUE un enroque, y entonces movería una torre que no
        // toca). Lo que quede descuadrado lo corrige el renderPieces() de abajo.
        if (!opts.simple) {
          var moving = state.pieces[from];

          // pieza capturada en el destino, o el peón comido al paso
          var takenSq = state.pieces[to] ? to : null;
          if (!takenSq && moving[1] === "P" && from[0] !== to[0]) {
            takenSq = to[0] + from[1];
          }
          if (takenSq && els[takenSq]) {
            var taken = els[takenSq];
            delete els[takenSq];
            taken.classList.add("taken");
            window.setTimeout(function () { taken.remove(); }, 180);
          }

          // enroque: la torre acompaña al rey en la misma animación
          if (moving[1] === "K" && Math.abs(fileOf(to) - fileOf(from)) === 2) {
            var short = fileOf(to) > fileOf(from);
            var rookFrom = (short ? "h" : "a") + from[1];
            var rookTo = (short ? "f" : "d") + from[1];
            if (els[rookFrom]) {
              var rook = els[rookFrom];
              delete els[rookFrom];
              els[rookTo] = rook;
              place(rook, rookTo);
            }
          }
        }

        delete els[from];
        els[to] = mover;
        mover.classList.add("above");
        place(mover, to);

        state.pieces = next;
        // debe ser mayor que la duración de la transición de .piece en el CSS,
        // para no reconstruir el DOM a medio camino de la animación
        window.setTimeout(function () { syncPieces(next); }, PIECE_MOVE_MS + 20);
        renderMarks();
      },

      /** Redibuja desde cero para asegurar que el DOM refleja el FEN exacto. */
      resync: function () { renderPieces(); renderMarks(); },

      setDests: function (map) {
        state.dests = map || {};
        renderMarks();
      },

      setInteractive: function (on) {
        state.interactive = !!on;
        root.classList.toggle("board-locked", !on);
        if (!on) deselect();
      },

      setOrientation: function (color) {
        state.orientation = color === "b" ? "b" : "w";
        drawCoords();
        for (var sq in els) place(els[sq], sq);
        renderMarks();
        renderArrows();
        renderHint();
      },

      flip: function () {
        api.setOrientation(state.orientation === "w" ? "b" : "w");
      },

      setCoords: function (on) {
        state.coords = !!on;
        drawCoords();
      },

      /** Cambia el juego de piezas y las vuelve a dibujar en el sitio. */
      setPieces: function (id) {
        if (!window.PIECE_SETS[id]) return;
        state.pieceSet = id;
        renderPieces();
      },

      /** Marca fija de la jugada que toca hacer (null para quitarla). */
      setGuide: function (move) {
        state.guide = move || null;
        renderMarks();
      },

      /** Flechas numeradas del plan (lista vacía o null para quitarlas). */
      setArrows: function (list) {
        state.arrows = list || [];
        renderArrows();
      },

      /** Insignia de acierto/fallo/pista sobre una casilla, ajena a renderMarks(). */
      flash: function (sq, kind) {
        var el = document.createElement("div");
        el.className = "mark flash-" + kind;
        place(el, sq);
        flashLayer.appendChild(el);
        window.setTimeout(function () { el.remove(); }, 700);
      },

      /** Quita cualquier insignia pendiente. Hay que llamarlo al cargar un
       *  puzzle nuevo: si no, la del último acierto del puzzle anterior puede
       *  sobrevivir su propio timeout de 700ms y quedar superpuesta sobre las
       *  piezas del siguiente (más probable cuanto más rápido se auto-avanza,
       *  como en Supervivencia). */
      clearFlashes: function () {
        flashLayer.innerHTML = "";
        state.hint = null;
        hintEls = [];
      },

      /** Pista fija: parpadea la casilla `from` y, a contratiempo, `to` (si
       *  se da). Sin argumentos se quita. */
      setHint: function (from, to) {
        var next = from ? { from: from, to: to || null } : null;
        var same = next && state.hint && next.from === state.hint.from && next.to === state.hint.to;
        if (same || (!next && !state.hint)) return;   // no reiniciar el parpadeo sin motivo
        state.hint = next;
        renderHint();
      },

      get orientation() { return state.orientation; },
      pieceAt: function (sq) { return state.pieces[sq] || null; }
    };

    /** Tras la animación redibuja desde el FEN, que es la fuente de la verdad:
     *  así la coronación y cualquier caso raro quedan siempre bien. */
    function syncPieces(expected) {
      if (state.pieces !== expected) return;   // ya ha empezado otra jugada
      renderPieces();
    }

    return api;
  }

  return { create: create, parseFen: parseFen };
})();
