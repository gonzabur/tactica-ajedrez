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
      interactive: false,
      coords: options.coords !== false
    };

    var els = {};          // casilla -> elemento de la pieza
    var drag = null;

    root.classList.add("board");
    root.innerHTML =
      '<div class="board-squares"></div>' +
      '<div class="board-marks"></div>' +
      '<div class="board-pieces"></div>' +
      '<div class="board-promo" hidden></div>';
    var squaresLayer = root.querySelector(".board-squares");
    var marksLayer = root.querySelector(".board-marks");
    var piecesLayer = root.querySelector(".board-pieces");
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
          html += '<div class="sq ' + ((vf + vr) % 2 ? "dark" : "light") + '"></div>';
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

    function renderPieces() {
      piecesLayer.innerHTML = "";
      els = {};
      for (var sq in state.pieces) {
        var el = document.createElement("div");
        el.className = "piece";
        el.innerHTML = window.PIECE_SVG[state.pieces[sq]];
        place(el, sq);
        piecesLayer.appendChild(el);
        els[sq] = el;
      }
    }

    function renderMarks() {
      marksLayer.innerHTML = "";
      var frag = document.createDocumentFragment();

      function mark(sq, cls) {
        var el = document.createElement("div");
        el.className = "mark " + cls;
        place(el, sq);
        frag.appendChild(el);
      }

      if (state.lastMove) {
        mark(state.lastMove[0], "last");
        mark(state.lastMove[1], "last");
      }
      if (state.check) mark(state.check, state.mate ? "mate" : "check");
      if (state.selected) mark(state.selected, "selected");

      if (state.selected && state.interactive) {
        var dests = state.dests[state.selected] || [];
        for (var i = 0; i < dests.length; i++) {
          mark(dests[i], state.pieces[dests[i]] ? "capture" : "dest");
        }
      }
      marksLayer.appendChild(frag);
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

      if (state.selected === sq) { deselect(); return; }
      select(sq);

      drag = {
        from: sq, el: els[sq], pointerId: ev.pointerId,
        startX: ev.clientX, startY: ev.clientY, active: false, over: null
      };
      try { root.setPointerCapture(ev.pointerId); } catch (e) { /* puntero ya liberado */ }
    }

    function onPointerMove(ev) {
      if (!drag || ev.pointerId !== drag.pointerId) return;
      var dx = ev.clientX - drag.startX, dy = ev.clientY - drag.startY;
      if (!drag.active && Math.abs(dx) + Math.abs(dy) < 6) return;

      if (!drag.active) {
        drag.active = true;
        drag.el.classList.add("dragging");
      }
      ev.preventDefault();

      var rect = root.getBoundingClientRect();
      var size = rect.width / 8;
      // en pantallas táctiles la pieza se levanta para que el dedo no la tape
      var lift = COARSE ? size * 0.9 : 0;
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

      if (!d.active) return;   // fue un toque simple: la casilla queda seleccionada
      d.el.classList.remove("dragging");
      place(d.el, d.from);

      var rect = root.getBoundingClientRect();
      var lift = COARSE ? rect.width / 8 * 0.9 : 0;
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
        btn.innerHTML = window.PIECE_SVG[color + kind];
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

        delete els[from];
        els[to] = mover;
        mover.classList.add("above");
        place(mover, to);

        state.pieces = next;
        window.setTimeout(function () { syncPieces(next); }, 190);
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
      },

      flip: function () {
        api.setOrientation(state.orientation === "w" ? "b" : "w");
      },

      setCoords: function (on) {
        state.coords = !!on;
        drawCoords();
      },

      /** Marca visual de acierto o error sobre una casilla. */
      flash: function (sq, kind) {
        var el = document.createElement("div");
        el.className = "mark flash-" + kind;
        place(el, sq);
        marksLayer.appendChild(el);
        window.setTimeout(function () { el.remove(); }, 700);
      },

      shake: function () {
        root.classList.remove("shake");
        void root.offsetWidth;   // reinicia la animación
        root.classList.add("shake");
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
