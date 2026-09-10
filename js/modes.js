/**
 * Modos de juego. Cada uno decide qué puzzle toca ahora, qué pasa al acertar o
 * fallar y qué se muestra en el marcador. La pantalla de juego (play.js) solo
 * los orquesta, así que añadir un modo nuevo no toca la interfaz.
 */
window.Modes = (function () {

  /** Conjunto de puzzles a evitar: los ya vistos más los de esta partida. */
  function exclusions() {
    var seen = window.Store.seenSet;
    var local = Object.create(null);
    for (var k in seen) local[k] = 1;
    return local;
  }

  // --- Clasificado ------------------------------------------------------

  function rated() {
    var exclude = exclusions();
    var session = { solved: 0, failed: 0, delta: 0, start: window.Store.state.rating };

    return {
      id: "rated",
      title: "Clasificado",
      allowRetry: true,
      allowHint: true,
      autoNext: false,
      lives: 0,
      timed: 0,
      affectsRating: true,

      next: function () {
        var target = window.Rating.targetFor(window.Store.state.rating);
        var puzzle = window.Data.pick({ rating: target, span: 90, exclude: exclude });
        if (puzzle) exclude[puzzle.index] = 1;
        return puzzle;
      },

      result: function (res) {
        var score = res.clean ? 1 : 0;
        var st = window.Store.state;
        var up = window.Rating.update(st.rating, res.puzzle.rating, score, st.solvedCount);
        window.Store.setRating(up.rating);
        st.solvedCount++;
        if (res.clean) session.solved++; else session.failed++;
        session.delta += up.delta;
        window.Store.record(res.puzzle, res.clean);
        window.Store.save();
        return { over: false, delta: up.delta };
      },

      hud: function () {
        return [
          { label: "Tu rating", value: String(window.Store.state.rating),
            trend: session.delta },
          { label: "Sesión", value: session.solved + "/" + (session.solved + session.failed) }
        ];
      },

      summary: function () { return session; }
    };
  }

  // --- Entrenamiento por tema -------------------------------------------

  var LEVELS = {
    facil:   { name: "Fácil",     span: 250, at: function (r) { return Math.max(600, r - 400); } },
    medio:   { name: "A tu nivel", span: 180, at: function (r) { return r; } },
    dificil: { name: "Difícil",   span: 220, at: function (r) { return Math.min(2900, r + 350); } },
    todos:   { name: "Todos",     span: 1200, at: function (r) { return r; } }
  };

  function theme(themeId, levelId) {
    var level = LEVELS[levelId] || LEVELS.medio;
    var exclude = exclusions();
    var session = { solved: 0, failed: 0 };

    return {
      id: "theme",
      title: window.THEMES.name(themeId),
      subtitle: level.name,
      themeId: themeId,
      allowRetry: true,
      allowHint: true,
      autoNext: false,
      lives: 0,
      timed: 0,
      affectsRating: false,

      next: function () {
        var puzzle = window.Data.pick({
          rating: level.at(window.Store.state.rating),
          span: level.span,
          theme: themeId,
          exclude: exclude
        });
        if (puzzle) exclude[puzzle.index] = 1;
        return puzzle;
      },

      result: function (res) {
        if (res.clean) session.solved++; else session.failed++;
        window.Store.record(res.puzzle, res.clean);
        return { over: false };
      },

      hud: function () {
        var total = session.solved + session.failed;
        return [
          { label: "Resueltos", value: String(session.solved) },
          { label: "Acierto", value: total ? Math.round(session.solved / total * 100) + "%" : "—" }
        ];
      },

      summary: function () { return session; }
    };
  }

  // --- Supervivencia y contrarreloj -------------------------------------

  /**
   * Escalada compartida: se arranca claramente por debajo del nivel del jugador
   * y cada acierto sube el listón, igual que el modo supervivencia de chess.com.
   */
  function ladder(opts) {
    var exclude = exclusions();
    var base = Math.max(600, Math.min(1000, window.Store.state.rating - 450));
    var step = opts.step || 34;
    var state = { solved: 0, missed: 0, best: 0, lives: opts.lives, streak: 0, bestStreak: 0 };

    return {
      id: opts.id,
      title: opts.title,
      subtitle: opts.subtitle || "",
      allowRetry: false,
      allowHint: false,
      autoNext: true,
      lives: opts.lives,
      timed: opts.seconds || 0,
      affectsRating: false,

      next: function () {
        var target = Math.min(2900, Math.round(base + state.solved * step));
        var puzzle = window.Data.pick({ rating: target, span: 70, exclude: exclude });
        if (puzzle) exclude[puzzle.index] = 1;
        return puzzle;
      },

      result: function (res) {
        if (res.clean) {
          state.solved++;
          state.streak++;
          if (state.streak > state.bestStreak) state.bestStreak = state.streak;
        } else {
          state.missed++;
          state.streak = 0;
          state.lives--;
        }
        window.Store.record(res.puzzle, res.clean);
        return { over: state.lives <= 0 };
      },

      timeUp: function () { return { over: true }; },

      hud: function () {
        return [
          { label: "Resueltos", value: String(state.solved) },
          { label: "Vidas",
            value: state.lives > 0
              ? '<span class="hearts">' + "♥".repeat(state.lives) + "</span>"
              : "—",
            danger: state.lives <= 1 }
        ];
      },

      finish: function () {
        var key = opts.recordKey;
        var isRecord = window.Store.setRecord(key, state.solved);
        if (state.bestStreak > (window.Store.state.records.streak || 0)) {
          window.Store.setRecord("streak", state.bestStreak);
        }
        return {
          score: state.solved,
          missed: state.missed,
          bestStreak: state.bestStreak,
          record: isRecord,
          best: window.Store.state.records[key],
          topRating: Math.min(2900, Math.round(base + state.solved * step))
        };
      },

      summary: function () { return state; }
    };
  }

  function survival() {
    return ladder({
      id: "survival", title: "Supervivencia", subtitle: "3 fallos y se acaba",
      lives: 3, recordKey: "survival", step: 34
    });
  }

  function rush(minutes) {
    return ladder({
      id: "rush" + minutes, title: "Contrarreloj", subtitle: minutes + " minutos",
      lives: 3, seconds: minutes * 60, recordKey: "rush" + minutes, step: 30
    });
  }

  return { rated: rated, theme: theme, survival: survival, rush: rush, levels: LEVELS };
})();
