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

  function create(board, handlers) {
    handlers = handlers || {};

    var game = null;
    var puzzle = null;
    var ply = 0;              // índice de la siguiente jugada esperada en puzzle.moves
    var finished = false;
    var failedHere = false;   // ya se ha fallado en este puzzle
    var usedHint = false;
    var timers = [];

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

    function refresh(animate) {
      board.setPosition(game.fen(), {
        animate: animate || null,
        check: checkSquare(),
        mate: game.in_checkmate()
      });
    }

    function handOverToPlayer() {
      board.setDests(destsMap());
      board.setInteractive(true);
      if (handlers.onTurn) handlers.onTurn(ply);
    }

    function lockBoard() {
      board.setInteractive(false);
      board.setDests({});
    }

    /** Arranca un puzzle nuevo. */
    function load(next) {
      clearTimers();
      puzzle = next;
      game = new window.Chess(next.fen);
      ply = 0;
      finished = false;
      failedHere = false;
      usedHint = false;

      // el jugador es el bando que NO mueve en el FEN original
      var playerColor = game.turn() === "w" ? "b" : "w";
      board.setOrientation(playerColor);
      lockBoard();
      board.setPosition(game.fen(), { lastMove: null, check: null });

      if (handlers.onLoad) handlers.onLoad(puzzle, playerColor);

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
      refresh(animate ? [move.from, move.to] : null);
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
        game.undo();
        failedHere = true;
        refresh(null);          // devuelve la pieza a su casilla
        board.flash(to, "wrong");
        board.shake();
        handOverToPlayer();
        if (handlers.onWrong) handlers.onWrong(move, puzzle);
        return;
      }

      lockBoard();
      refresh([move.from, move.to]);
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

    /** Enseña solo la jugada que tocaba y da el puzzle por fallado. Es lo que
     *  usan los modos rápidos: informa sin frenar la partida. */
    function revealNext() {
      if (finished || !puzzle || ply >= puzzle.moves.length) return;
      finished = true;
      failedHere = true;
      lockBoard();
      clearTimers();
      var expected = puzzle.moves[ply];
      applyUci(expected, true);
      board.flash(expected.slice(2, 4), "hint");
      later(function () {
        if (handlers.onRevealed) handlers.onRevealed(puzzle);
      }, 900);
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
      revealNext: revealNext,
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
