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

  var RANDOM_ID = "aleatorio";
  var WEAK_ID = "debil";
  var WEAK_MIN_ATTEMPTS = 4;   // igual que el umbral de "Dónde flojeas"
  var WEAK_COUNT = 6;          // los mismos 6 temas que ahí se muestran

  /**
   * Niveles de dificultad. "Exigente" es el interesante: en vez de fijar un
   * rating, apunta un escalón por encima del tuyo y va moviendo ese escalón
   * según cómo lo lleves, de modo que la exigencia se mantenga a medida que
   * mejoras. Además cuenta para tu rating, para que el progreso sea real y no
   * se pierda al cerrar la app.
   */
  var LEVELS = {
    exigente: { name: "Exigente", adaptive: true, span: 130 },
    facil:    { name: "Fácil",    span: 250,  at: function (r) { return Math.max(600, r - 400); } },
    medio:    { name: "A tu nivel", span: 180, at: function (r) { return r; } },
    todos:    { name: "Mezclado", span: 1200, at: function (r) { return r; } }
  };

  // Cuánto se aprieta al empezar y cuánto se mueve el listón con cada
  // resultado.
  //
  // El listón deja de moverse cuando aciertas UP/(UP+DOWN) de las veces, así
  // que esa fracción es la que fija la exigencia real: 25 y 18 la dejan en el
  // 42%. Traducido a rating, son unos +57 puntos por encima del tuyo, que es
  // donde se aprende: cuesta, pero sale. Si subes o bajas estos números,
  // comprueba antes esa fracción; con un DOWN mayor que UP el listón acaba
  // cayendo por debajo de tu nivel y el modo deja de ser exigente.
  //
  // El mínimo de 0 es la garantía de que nunca sirve puzzles más fáciles que
  // tu rating, por mala que sea la racha.
  var CHALLENGE_START = 60;
  var CHALLENGE_UP = 25;
  var CHALLENGE_DOWN = 18;
  var CHALLENGE_MIN = 0;
  var CHALLENGE_MAX = 300;

  /**
   * Motivos que entran en el modo aleatorio: los que enseñan un truco. Se
   * dejan fuera los de fase (aperturas, finales) y los de longitud, que no
   * son patrones que reconocer sino descripciones de la posición.
   */
  function motifPool() {
    var pool = [];
    window.THEMES.groups.forEach(function (group) {
      if (group.id === "fases" || group.id === "longitud") return;
      group.themes.forEach(function (t) {
        if (window.Data.themeCount(t) > 0) pool.push(t);
      });
    });
    return pool;
  }

  /**
   * Los temas donde menos aciertas, mismo cálculo y mismo umbral que la
   * tarjeta "Dónde flojeas" de la pantalla de progreso -- para que jugar
   * este modo sea literalmente "practica lo que esa pantalla te dice que
   * te falla". Vacío hasta que haya al menos un tema con WEAK_MIN_ATTEMPTS
   * intentos.
   */
  function weakPool() {
    return window.Store.weakestThemes(WEAK_MIN_ATTEMPTS, WEAK_COUNT)
      .map(function (row) { return row.id; });
  }

  function shuffled(list) {
    var out = list.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  /**
   * Entrenamiento sobre un tema concreto, o sobre uno distinto cada vez si se
   * pasa "aleatorio". En ese caso se recorre toda la baraja de motivos antes
   * de repetir ninguno, así que también salen los raros.
   */
  function theme(themeId, levelId) {
    var level = LEVELS[levelId] || LEVELS.exigente;
    var random = themeId === RANDOM_ID;
    var weak = themeId === WEAK_ID;
    var exclude = exclusions();
    var session = { solved: 0, failed: 0, delta: 0 };
    var challenge = CHALLENGE_START;
    var deck = [];

    function nextMotif() {
      if (!deck.length) deck = shuffled(weak ? weakPool() : motifPool());
      return deck.pop();
    }

    function target() {
      var rating = window.Store.state.rating;
      if (!level.adaptive) return level.at(rating);
      return Math.max(window.Rating.MIN,
        Math.min(window.Rating.MAX, rating + challenge));
    }

    return {
      id: random ? "random" : (weak ? "weak" : "theme"),
      title: random ? "Aleatorio" : (weak ? "Donde flojeas" : window.THEMES.name(themeId)),
      subtitle: level.name,
      themeId: themeId,
      allowRetry: true,
      allowHint: true,
      autoNext: false,
      lives: 0,
      timed: 0,
      affectsRating: !!level.adaptive,

      next: function () {
        var puzzle = window.Data.pick({
          rating: target(),
          span: level.span,
          theme: (random || weak) ? nextMotif() : themeId,
          exclude: exclude
        });
        if (puzzle) exclude[puzzle.index] = 1;
        return puzzle;
      },

      result: function (res) {
        if (res.clean) session.solved++; else session.failed++;
        window.Store.record(res.puzzle, res.clean);

        var out = { over: false };
        if (level.adaptive) {
          // el listón se mueve con el resultado, para no dejarte ni ahogado
          // ni cómodo
          challenge = Math.max(CHALLENGE_MIN, Math.min(CHALLENGE_MAX,
            challenge + (res.clean ? CHALLENGE_UP : -CHALLENGE_DOWN)));

          var st = window.Store.state;
          var up = window.Rating.update(st.rating, res.puzzle.rating,
                                        res.clean ? 1 : 0, st.solvedCount);
          window.Store.setRating(up.rating);
          st.solvedCount++;
          session.delta += up.delta;
          out.delta = up.delta;
        }
        window.Store.save();
        return out;
      },

      hud: function () {
        var total = session.solved + session.failed;
        if (level.adaptive) {
          return [
            { label: "Tu rating", value: String(window.Store.state.rating),
              trend: session.delta },
            { label: "Sesión", value: session.solved + "/" + total }
          ];
        }
        return [
          { label: "Resueltos", value: String(session.solved) },
          { label: "Acierto", value: total ? Math.round(session.solved / total * 100) + "%" : "—" }
        ];
      },

      summary: function () { return session; }
    };
  }

  // --- Supervivencia y contrarreloj -------------------------------------

  // El corazón va dibujado y no como carácter ♥ porque los perdidos se pintan
  // con el borde punteado, y a un glifo de fuente no se le puede hacer eso.
  var HEART = "M12 20.6l-1.3-1.2C5.4 14.8 2 11.7 2 8.1 2 5.4 4.2 3.2 6.9 3.2" +
    "c1.6 0 3.1.7 4.1 1.9L12 6.3l1-1.2c1-1.2 2.5-1.9 4.1-1.9 2.7 0 4.9 2.2 4.9 4.9" +
    " 0 3.6-3.4 6.7-8.7 11.3L12 20.6z";

  /**
   * Las vidas gastadas dejan su hueco marcado en vez de desaparecer, para que
   * de un vistazo se lea cuántas quedan *de cuántas*.
   */
  function heartsHtml(left, total) {
    var out = "";
    for (var i = 0; i < total; i++) {
      var spent = i >= left;
      out += '<svg class="heart' + (spent ? " spent" : "") + '" viewBox="0 0 24 24">' +
        '<path d="' + HEART + '" ' +
        (spent
          // guion casi nulo + punta redonda = puntos, no rayas
          ? 'fill="none" stroke="currentColor" stroke-width="2.6" ' +
            'stroke-dasharray="0.01 3.7" stroke-linecap="round"'
          : 'fill="currentColor"') +
        "/></svg>";
    }
    return '<span class="hearts" role="img" aria-label="' +
      left + " de " + total + ' vidas">' + out + "</span>";
  }

  /**
   * Escalada compartida: se arranca claramente por debajo del nivel del jugador
   * y cada acierto sube el listón, igual que el modo supervivencia de chess.com.
   */
  function ladder(opts) {
    var exclude = exclusions();
    var base = Math.max(600, Math.min(1000, window.Store.state.rating - 450));
    var step = opts.step || 34;
    var state = { solved: 0, missed: 0, best: 0, lives: opts.lives, streak: 0, bestStreak: 0 };
    var played = [];   // todos los puzzles de la partida, para poder repasarla

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
        played.push({ i: res.puzzle.index, ok: !!res.clean });
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
          { label: "Vidas", value: heartsHtml(state.lives, opts.lives),
            danger: state.lives <= 1 }
        ];
      },

      finish: function () {
        window.Store.setLastRun(played);
        var key = opts.recordKey;
        var isRecord = window.Store.setRecord(key, state.solved);
        window.Store.pushScore(key, state.solved);
        if (state.bestStreak > (window.Store.state.records.streak || 0)) {
          window.Store.setRecord("streak", state.bestStreak);
        }
        return {
          score: state.solved,
          missed: state.missed,
          bestStreak: state.bestStreak,
          record: isRecord,
          best: window.Store.state.records[key],
          bestWeek: window.Store.bestScore(key, "week"),
          bestToday: window.Store.bestScore(key, "day"),
          topRating: Math.min(2900, Math.round(base + state.solved * step)),
          review: played.length
        };
      },

      summary: function () { return state; }
    };
  }

  function survival() {
    return ladder({
      id: "survival", title: "Supervivencia", subtitle: "3 fallos y se acaba",
      lives: 3, recordKey: "survival", step: 36
    });
  }

  function rush(minutes) {
    return ladder({
      id: "rush" + minutes, title: "Contrarreloj", subtitle: minutes + " minutos",
      lives: 3, seconds: minutes * 60, recordKey: "rush" + minutes, step: 32
    });
  }

  // --- Revisión de la última partida ------------------------------------

  /**
   * Recorre los puzzles de la última partida de supervivencia o contrarreloj,
   * empezando por el que se indique. Aquí no hay prisa ni vidas: se puede
   * volver a intentar, pedir pista y ver la solución, que es de lo que se
   * trata al repasar un fallo.
   *
   * `filter` debe coincidir con el que esté aplicado en la lista: si se entra
   * desde "Solo fallos", "Siguiente" tiene que llevar al siguiente fallo y no
   * al siguiente de toda la tanda.
   *
   * `startAt` es la posición dentro de la tanda completa, que es como los
   * enlaza la lista, y aquí se traduce a la posición dentro del recorrido.
   */
  function review(startAt, filter) {
    var run = window.Store.state.lastRun || [];
    var onlyFailed = filter === "fallos";

    // posiciones de la tanda que forman el recorrido, en orden
    var route = [];
    for (var i = 0; i < run.length; i++) {
      if (!onlyFailed || !run[i].ok) route.push(i);
    }

    var at = 0;
    while (at < route.length - 1 && route[at] < (startAt | 0)) at++;
    var showing = -1;

    return {
      id: "review",
      title: "Revisión",
      subtitle: onlyFailed ? "Solo los fallados" : "Última partida",
      allowRetry: true,
      allowHint: true,
      autoNext: false,
      lives: 0,
      timed: 0,
      affectsRating: false,
      backTo: "#/revision",

      next: function () {
        if (at >= route.length) return null;
        showing = at++;
        return window.Data.get(run[route[showing]].i);
      },

      // repasar no vuelve a contar: esos puzzles ya se anotaron al jugarlos
      result: function () { return { over: false }; },

      onExhausted: function () { window.location.hash = "#/revision"; },

      hud: function () {
        var entry = run[route[showing]] || {};
        return [
          { label: "Puzzle", value: (showing + 1) + " de " + route.length },
          { label: "En la partida", value: entry.ok ? "Acertaste" : "Fallaste",
            danger: !entry.ok }
        ];
      }
    };
  }

  return {
    rated: rated, theme: theme, survival: survival, rush: rush,
    review: review, levels: LEVELS, randomId: RANDOM_ID, motifPool: motifPool,
    weakId: WEAK_ID, weakPool: weakPool
  };
})();
