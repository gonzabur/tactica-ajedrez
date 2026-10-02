/**
 * Aperturas: repertorio elegido, repaso espaciado y los modos de juego que
 * usa play.js (aprender y repasar).
 *
 * Didáctica: lo nuevo se aprende de una apertura en una (pocas líneas al
 * día, terminando una apertura antes de empezar la siguiente) y lo ya
 * aprendido se repasa mezclado, cuando le toca a cada línea. Cada acierto
 * a la primera alarga el intervalo; un fallo lo devuelve al principio.
 */
window.Openings = (function () {
  var INTERVALS = [1, 3, 7, 21, 60];   // días hasta el siguiente repaso, por caja
  var NEW_PER_DAY = 3;                  // líneas nuevas recomendadas al día
  var START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  function st() { return window.Store.state.openings; }
  function today() { return window.Store.todayKey(); }
  function daysFromToday(n) {
    var d = new Date();
    d.setDate(d.getDate() + n);
    return window.Store.todayKey(d);
  }

  function all() { return window.OPENINGS || []; }
  function byId(id) {
    for (var i = 0; i < all().length; i++) if (all()[i].id === id) return all()[i];
    return null;
  }
  function selected() {
    return st().selected.map(byId).filter(Boolean);
  }
  /** { opening, line } de una línea por su id. */
  function findLine(lineId) {
    var ops = all();
    for (var i = 0; i < ops.length; i++) {
      for (var j = 0; j < ops[i].lines.length; j++) {
        if (ops[i].lines[j].id === lineId) return { opening: ops[i], line: ops[i].lines[j] };
      }
    }
    return null;
  }

  function isSelected(id) { return st().selected.indexOf(id) >= 0; }
  function toggle(id) {
    var list = st().selected;
    var at = list.indexOf(id);
    if (at >= 0) list.splice(at, 1); else list.push(id);
    window.Store.save();
  }

  function card(lineId) { return st().cards[lineId] || null; }

  /** Estado de una línea: nueva, pendiente hoy, o cuándo vuelve. */
  function status(lineId) {
    var c = card(lineId);
    if (!c) return { kind: "new" };
    if (c.due <= today()) return { kind: "due" };
    return { kind: "later", due: c.due, box: c.box };
  }

  /** Líneas aprendidas de las aperturas elegidas (todas, toque o no repaso). */
  function learnedItems() {
    var out = [];
    selected().forEach(function (op) {
      op.lines.forEach(function (line) {
        if (card(line.id)) out.push({ opening: op, line: line });
      });
    });
    return out;
  }

  /** De las aprendidas, aquellas a las que hoy toca repaso. */
  function dueItems() {
    return learnedItems().filter(function (it) { return card(it.line.id).due <= today(); });
  }

  /** La siguiente línea por aprender: termina una apertura antes de la otra. */
  function nextToLearn() {
    var ops = selected();
    for (var i = 0; i < ops.length; i++) {
      for (var j = 0; j < ops[i].lines.length; j++) {
        if (!card(ops[i].lines[j].id)) return { opening: ops[i], line: ops[i].lines[j] };
      }
    }
    return null;
  }

  function learnedToday() { return st().learnedOn[today()] || 0; }

  function markLearned(lineId) {
    if (card(lineId)) return;
    st().cards[lineId] = { box: 0, due: today() };   // se repasa ya hoy, mezclada
    st().learnedOn[today()] = learnedToday() + 1;
    window.Store.save();
  }

  /** Apunta el resultado de un repaso: a la primera sube de caja; si no, a la 0. */
  function grade(lineId, clean) {
    var c = card(lineId);
    if (!c) return;
    c.box = clean ? Math.min(c.box + 1, INTERVALS.length - 1) : 0;
    c.due = daysFromToday(clean ? INTERVALS[c.box] : 1);
    window.Store.save();
  }

  /** Progreso de una apertura: líneas aprendidas y dominadas (caja 3+). */
  function progress(op) {
    var learned = 0, solid = 0;
    op.lines.forEach(function (l) {
      var c = card(l.id);
      if (c) learned++;
      if (c && c.box >= 3) solid++;
    });
    return { learned: learned, solid: solid, total: op.lines.length };
  }

  /**
   * Huecos del repertorio: con negras hace falta respuesta a 1.e4 y a 1.d4.
   * Devuelve frases listas para mostrar.
   */
  function gaps() {
    var ops = selected();
    if (!ops.length) return [];
    var out = [];
    var white = ops.filter(function (o) { return o.color === "w"; });
    var black = ops.filter(function (o) { return o.color === "b"; });
    if (!white.length) out.push("Te falta una apertura con blancas.");
    var vsE4 = black.some(function (o) { return o.against === "e4"; });
    var vsD4 = black.some(function (o) { return o.against === "d4"; });
    if (!vsE4) out.push("Con negras te falta una respuesta a 1.e4.");
    if (!vsD4) out.push("Con negras te falta una respuesta a 1.d4.");
    return out;
  }

  /** Línea -> el "puzzle" que entiende PuzzlePlayer. */
  function toPuzzle(item) {
    var game = new window.Chess();
    var uci = item.line.moves.map(function (san) {
      var m = game.move(san);
      return m.from + m.to + (m.promotion || "");
    });
    return {
      fen: START,
      moves: uci,
      playerFirst: item.opening.color === "w",
      opening: item.opening,
      line: item.line
    };
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // --- modos para play.js -------------------------------------------------

  /** Notas: la de la jugada que llevó a la posición que se está viendo. Si
   *  esa jugada no tiene (o es la posición inicial), la idea de la línea. */
  function noteAt(puzzle, moveIndex) {
    if (!puzzle || !puzzle.line) return "";
    var note = moveIndex >= 0 && puzzle.line.notes && puzzle.line.notes[moveIndex];
    return note || puzzle.line.name + ". " + puzzle.line.idea;
  }

  /**
   * Aprender: la línea se juega guiada (se marca la jugada a hacer y se
   * explica cada una). Sin `lineId` va encadenando las siguientes por
   * aprender; con él, solo esa línea.
   */
  function learn(lineId) {
    var current = null;
    var count = 0;
    var single = lineId ? findLine(lineId) : null;
    var served = false;

    return {
      id: "openings-learn",
      title: "Aprender",
      backTo: single ? "#/aperturas/" + single.opening.id : "#/",
      subtitle: single ? single.opening.name : "Líneas nuevas",
      allowRetry: true,
      allowHint: false,
      autoNext: false,
      guided: true,
      notes: true,
      lives: 0,
      timed: 0,
      affectsRating: false,

      next: function () {
        if (single) {
          if (served) return null;
          served = true;
          current = single;
        } else {
          current = nextToLearn();
        }
        return current ? toPuzzle(current) : null;
      },

      loadText: function (puzzle) {
        return puzzle.opening.name + " · " + puzzle.line.name;
      },

      noteAt: noteAt,

      result: function (res) {
        markLearned(res.puzzle.line.id);
        count++;
        return { text: "¡Línea completa!" };
      },

      hud: function () {
        if (!current) return [];
        var p = progress(current.opening);
        return [
          { label: "Apertura", value: current.opening.name },
          { label: "Aprendidas", value: p.learned + "/" + p.total }
        ];
      },

      finish: function () {
        return {
          headline: single ? "Línea repasada" : "No quedan líneas nuevas",
          score: count,
          rows: [["Líneas aprendidas hoy", learnedToday()]]
        };
      }
    };
  }

  /**
   * Repasar: todas las líneas a las que hoy toca, mezcladas. Cuenta solo el
   * primer intento de cada una; si se falla, vuelve a salir al final de la
   * sesión hasta que se haga bien.
   */
  function review() {
    // Sin nada pendiente, repaso libre: todas las aprendidas. Ahí acertar no
    // adelanta el calendario (sería hacer trampas al espaciado), pero fallar
    // sí cuenta: la línea vuelve a la caja 0.
    var free = !dueItems().length;
    var queue = shuffle(free ? learnedItems() : dueItems());
    var total = queue.length;
    var graded = {};
    var firstTry = 0;
    var current = null;
    var playing = false;   // ¿hay una línea a medias?

    return {
      id: "openings-review",
      title: free ? "Repaso libre" : "Repasar",
      subtitle: "Aperturas",
      allowRetry: true,
      allowHint: true,
      autoNext: false,   // se para al acabar: ahí se enseña el nombre de la variante
      lives: 0,
      timed: 0,
      affectsRating: false,

      next: function () {
        current = queue.shift() || null;
        playing = !!current;
        return current ? toPuzzle(current) : null;
      },

      loadText: function (puzzle) { return puzzle.opening.name; },

      result: function (res) {
        var id = res.puzzle.line.id;
        playing = false;
        if (!graded[id]) {
          graded[id] = true;
          if (!free || !res.clean) grade(id, res.clean);
          if (res.clean) firstTry++;
        }
        if (!res.clean) queue.push(current);   // otra vuelta antes de terminar
        return { text: res.clean ? "¡Correcto!" : "Volverá a salir al final" };
      },

      hud: function () {
        return [
          { label: "Quedan", value: String(queue.length + (playing ? 1 : 0)) },
          { label: "A la primera", value: firstTry + "/" + Object.keys(graded).length }
        ];
      },

      finish: function () {
        return {
          headline: total ? "Repaso terminado" : "Nada que repasar hoy",
          score: firstTry,
          rows: total ? [["Líneas repasadas", total], ["A la primera", firstTry]] : []
        };
      }
    };
  }

  return {
    all: all,
    byId: byId,
    findLine: findLine,
    selected: selected,
    isSelected: isSelected,
    toggle: toggle,
    status: status,
    dueItems: dueItems,
    learnedItems: learnedItems,
    nextToLearn: nextToLearn,
    learnedToday: learnedToday,
    markLearned: markLearned,
    grade: grade,
    progress: progress,
    gaps: gaps,
    learn: learn,
    review: review,
    NEW_PER_DAY: NEW_PER_DAY,
    INTERVALS: INTERVALS
  };
})();
