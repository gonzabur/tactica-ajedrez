/**
 * Controla la resolución de un puzzle sobre el tablero.
 *
 * Convención de la base de Lichess: el FEN es la posición ANTES de la jugada
 * del rival que plantea el problema, y moves[0] es esa jugada. Se reproduce
 * automáticamente al empezar; a partir de ahí el jugador mueve en los índices
 * pares y el rival responde en los impares.
 */
window.PuzzlePlayer = (function () {
  var OPPONENT_DELAY = 420;
  // Tiempo que se ve la pieza asentada en la casilla equivocada, con el
  // badge de fallo, antes de que empiece a volver a su sitio.
  var WRONG_MOVE_PAUSE = 550;

  function create(board, handlers) {
    handlers = handlers || {};

    var game = null;
    var puzzle = null;
    var ply = 0;              // índice de la siguiente jugada esperada en puzzle.moves
    var finished = false;
    var failedHere = false;   // ya se ha fallado en este puzzle
    var usedHint = false;
    var timers = [];

    // Línea de la partida: cada entrada es una posición ya alcanzada. La 0 es
    // el planteamiento, antes incluso de la jugada del rival. `viewAt` puede
    // quedarse atrás cuando se navega con las flechas; mientras eso pasa el
    // tablero no admite jugadas.
    var line = [];
    var viewAt = 0;
    var awaiting = false;   // ¿toca mover al jugador?
    var startInfo = { number: 1, side: "w" };

    function later(fn, ms) {
      var id = window.setTimeout(fn, ms);
      timers.push(id);
      return id;
    }

    function clearTimers() {
      timers.forEach(window.clearTimeout);
      timers = [];
    }

    function uciOf(move) {
      return move.from + move.to + (move.promotion || "");
    }

    /** Casilla del rey que está en jaque, para resaltarla. */
    function checkSquare() {
      if (!game.in_check()) return null;
      var turn = game.turn();
      var rows = game.board();
      for (var r = 0; r < 8; r++) {
        for (var f = 0; f < 8; f++) {
          var p = rows[r][f];
          if (p && p.type === "k" && p.color === turn) {
            return "abcdefgh"[f] + (8 - r);
          }
        }
      }
      return null;
    }

    function destsMap() {
      var map = {};
      var moves = game.moves({ verbose: true });
      for (var i = 0; i < moves.length; i++) {
        (map[moves[i].from] = map[moves[i].from] || []).push(moves[i].to);
      }
      return map;
    }

    /** Apunta en la línea la jugada recién hecha sobre `game` y la pinta. */
    function record(move, animate) {
      line.push({
        fen: game.fen(),
        san: move.san,
        from: move.from,
        to: move.to,
        checkSq: checkSquare(),
        mate: game.in_checkmate()
      });
      viewAt = line.length - 1;
      refresh(animate ? [move.from, move.to] : null);
      if (handlers.onLine) handlers.onLine(line, viewAt);
    }

    /** Pinta una posición cualquiera de la línea, sin animación. */
    function renderAt(index) {
      var step = line[index];
      board.setPosition(step.fen, {
        lastMove: step.from ? [step.from, step.to] : null,
        check: step.checkSq,
        mate: step.mate
      });
    }

    /** El tablero solo acepta jugadas si estás en la posición actual. */
    function syncInteractive() {
      if (awaiting && viewAt === line.length - 1) {
        board.setDests(destsMap());
        board.setInteractive(true);
      } else {
        board.setInteractive(false);
        board.setDests({});
      }
    }

    function goTo(index) {
      if (index < 0 || index >= line.length || index === viewAt) return;
      viewAt = index;
      renderAt(viewAt);
      syncInteractive();
      if (handlers.onLine) handlers.onLine(line, viewAt);
    }

    function refresh(animate) {
      board.setPosition(game.fen(), {
        animate: animate || null,
        check: checkSquare(),
        mate: game.in_checkmate()
      });
    }

    function handOverToPlayer() {
      awaiting = true;
      syncInteractive();
      if (handlers.onTurn) handlers.onTurn(ply);
    }

    function lockBoard() {
      awaiting = false;
      board.setInteractive(false);
      board.setDests({});
    }

    /** Arranca un puzzle nuevo. */
    function load(next) {
      clearTimers();
      board.clearFlashes();   // ninguna insignia del puzzle anterior debe sobrevivir
      puzzle = next;
      game = new window.Chess(next.fen);
      ply = 0;
      finished = false;
      failedHere = false;
      usedHint = false;

      // el número de jugada y el bando salen del propio FEN: hacen falta para
      // escribir la notación con la numeración real de la partida
      var fields = next.fen.split(" ");
      startInfo = { side: fields[1] || "w", number: parseInt(fields[5], 10) || 1 };

      line = [{ fen: game.fen(), san: null, from: null, to: null,
                checkSq: checkSquare(), mate: false }];
      viewAt = 0;

      // el jugador es el bando que NO mueve en el FEN original
      var playerColor = game.turn() === "w" ? "b" : "w";
      board.setOrientation(playerColor);
      lockBoard();
      board.setPosition(game.fen(), { lastMove: null, check: null });

      if (handlers.onLoad) handlers.onLoad(puzzle, playerColor);
      if (handlers.onLine) handlers.onLine(line, viewAt);

      // la jugada que plantea el problema, con un respiro para verla llegar
      later(function () {
        applyUci(puzzle.moves[0], true);
        ply = 1;
        handOverToPlayer();
      }, OPPONENT_DELAY);
    }

    function applyUci(uci, animate) {
      var move = game.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.length > 4 ? uci[4] : undefined
      });
      if (!move) return null;
      record(move, animate);
      if (handlers.onMovePlayed) handlers.onMovePlayed(move, game);
      return move;
    }

    /** Jugada del usuario desde el tablero. */
    function onUserMove(from, to, promotion) {
      if (finished || !puzzle) return;

      var expected = puzzle.moves[ply];
      var move = game.move({ from: from, to: to, promotion: promotion || "q" });
      if (!move) return;   // ilegal: el tablero no debería permitirlo

      var played = uciOf(move);
      // Lichess acepta cualquier mate como solución válida aunque no sea la línea
      var isMate = game.in_checkmate();
      var correct = played === expected || isMate;

      if (!correct) {
        failedHere = true;
        // se bloquea YA: el tablero está a medio camino de una animación de
        // regreso durante los próximos ~830ms y no debe admitir otro toque
        lockBoard();
        var wrongFen = game.fen();     // la posición tal cual queda el intento
        game.undo();                   // el motor vuelve a la posición correcta
        var back = line[viewAt];       // a dónde hay que volver visualmente

        // se ve la jugada completa, como cualquier otra: la pieza llega a su
        // casilla y se resalta igual que un acierto, y ahí se posa el aviso
        // de que no era esa
        board.setPosition(wrongFen, { animate: [move.from, move.to],
          lastMove: [move.from, move.to] });
        board.flash(move.to, "wrong");

        // el regreso se registra con later(): si mientras tanto se pide la
        // solución, clearTimers() lo cancela y reveal() toma el tablero, que
        // es lo correcto. handlers.onWrong se avisa aquí, no antes, porque en
        // los modos sin reintento dispara fail() -> clearTimers(), y si eso
        // ocurriera ANTES de esta animación se cancelaría a sí misma.
        later(function () {
          board.setPosition(back.fen, {
            animate: [move.to, move.from],
            simple: true,
            lastMove: back.from ? [back.from, back.to] : null,
            check: back.checkSq,
            mate: back.mate
          });
          handOverToPlayer();
          if (handlers.onWrong) handlers.onWrong(move, puzzle);
        }, WRONG_MOVE_PAUSE);
        return;
      }

      lockBoard();
      record(move, true);
      board.flash(to, "right");

      // un mate fuera de la línea principal también da el puzzle por resuelto
      if (isMate && played !== expected) { succeed(); return; }

      ply++;
      if (ply >= puzzle.moves.length) { succeed(); return; }

      if (handlers.onProgress) handlers.onProgress(ply, puzzle.moves.length);

      later(function () {
        applyUci(puzzle.moves[ply], true);
        ply++;
        if (ply >= puzzle.moves.length) succeed();
        else handOverToPlayer();
      }, OPPONENT_DELAY);
    }

    function succeed() {
      finished = true;
      lockBoard();
      if (handlers.onSolved) {
        handlers.onSolved({
          puzzle: puzzle,
          clean: !failedHere && !usedHint,
          failed: failedHere,
          hinted: usedHint,
          mate: game.in_checkmate()
        });
      }
    }

    /** Marca la pieza que hay que mover, sin decir a dónde. */
    function hint() {
      if (finished || !puzzle || ply >= puzzle.moves.length) return;
      usedHint = true;
      board.flash(puzzle.moves[ply].slice(0, 2), "hint");
      if (handlers.onHint) handlers.onHint();
    }

    /** Reproduce lo que queda de solución y da el puzzle por fallado. */
    function reveal() {
      if (finished || !puzzle) return;
      finished = true;
      failedHere = true;
      lockBoard();
      clearTimers();

      var step = function () {
        if (ply >= puzzle.moves.length) {
          if (handlers.onRevealed) handlers.onRevealed(puzzle);
          return;
        }
        applyUci(puzzle.moves[ply], true);
        ply++;
        later(step, 520);
      };
      later(step, 200);
    }

    /** Da el puzzle por fallado y pasa página sin destapar nada. Lo usan los
     *  modos sin reintento: la solución se guarda para la revisión, que es
     *  donde se puede mirar con calma. */
    function fail() {
      if (finished || !puzzle) return;
      finished = true;
      failedHere = true;
      lockBoard();
      clearTimers();
      later(function () {
        if (handlers.onFailed) handlers.onFailed(puzzle);
      }, 480);
    }

    /** Vuelve a la posición de partida del puzzle actual. */
    function restart() {
      if (puzzle) load(puzzle);
    }

    return {
      load: load,
      onUserMove: onUserMove,
      hint: hint,
      reveal: reveal,
      fail: fail,
      back: function () { goTo(viewAt - 1); },
      forward: function () { goTo(viewAt + 1); },
      goTo: goTo,
      get line() { return line; },
      get viewIndex() { return viewAt; },
      get atLive() { return viewAt === line.length - 1; },
      get startInfo() { return startInfo; },
      restart: restart,
      stop: function () { clearTimers(); lockBoard(); finished = true; },
      get puzzle() { return puzzle; },
      get solved() { return finished; },
      get failedHere() { return failedHere; },
      get movesLeft() { return puzzle ? Math.ceil((puzzle.moves.length - ply) / 2) : 0; }
    };
  }

  return { create: create };
})();
