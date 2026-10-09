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
  var INTERVALS = [1, 2, 4, 7, 10];   // días hasta el siguiente repaso, por caja
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

  /** Historial de la línea: cuenta solo el primer intento de cada repaso. */
  function tally(lineId, clean) {
    var c = card(lineId);
    if (!c) return;
    c.tries = (c.tries || 0) + 1;
    if (clean) c.ok = (c.ok || 0) + 1;
    window.Store.save();
  }

  /** "mañana", "en 4 días"… para la fecha en que vuelve una línea. */
  function whenText(due) {
    var n = Math.round((new Date(due) - new Date(today())) / 864e5);
    return n <= 0 ? "hoy" : n === 1 ? "mañana" : "en " + n + " días";
  }

  function esc(text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;");
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

  /** Flechas del plan de una línea, listas para el tablero (ver data/openings.js). */
  function planArrows(line) {
    return (line.arrows || []).map(function (a) {
      var kind = a.charAt(0) === "x" ? "attack" : a.charAt(0) === "o" ? "opp" : "own";
      var sq = kind === "own" ? a : a.slice(1);
      return { from: sq.slice(0, 2), to: sq.slice(2, 4), kind: kind };
    });
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
   * Aprender una línea son cuatro pasadas, siempre:
   *
   *   0. guiada: se marca la jugada a hacer y se explica cada una;
   *   1-3. tres de memoria ("ahora inténtalo tú"), sin marca. Si el jugador
   *      se atasca, play.js le va destapando la jugada: primero parpadea la
   *      pieza y luego también el destino. Esa ayuda llega cada vez más
   *      tarde (HINT_AFTER), para que cada pasada exija un poco más.
   *
   * Sacarla de memoria nada más verla es lo que la fija; por eso la línea no
   * cuenta como aprendida hasta terminar las pasadas. Sin `lineId` va
   * encadenando las siguientes por aprender; con él, solo esa línea.
   */
  // Por intento: segundos sin mover hasta marcar la pieza y hasta marcar también el destino
  var HINT_AFTER = [[5, 10], [10, 15], [15, 20]];
  var ATTEMPTS = HINT_AFTER.length;

  function learn(lineId) {
    var current = null;
    var count = 0;
    var single = lineId ? findLine(lineId) : null;
    var served = false;
    var stage = 0;         // pasada que se está jugando: 0 guiada, 1..ATTEMPTS de memoria
    var repeat = false;    // la siguiente pasada es de la misma línea

    return {
      id: "openings-learn",
      title: "Aprender",
      backTo: single ? "#/aperturas/" + single.opening.id : "#/",
      subtitle: single ? single.opening.name : "Líneas nuevas",
      allowRetry: true,
      allowHint: false,
      autoNext: false,
      get guided() { return stage === 0; },
      get hintAfter() { return stage === 0 ? null : HINT_AFTER[stage - 1]; },
      get playingNote() {
        return stage === 0 ? "" : "De memoria. Si te atascas, se irá marcando la jugada.";
      },
      notes: true,
      lives: 0,
      timed: 0,
      affectsRating: false,

      next: function () {
        if (repeat) {
          repeat = false;
        } else if (single) {
          if (served) return null;
          served = true;
          current = single;
          stage = 0;
        } else {
          current = nextToLearn();
          stage = 0;
        }
        return current ? toPuzzle(current) : null;
      },

      loadText: function (puzzle) {
        return stage === 0 ? puzzle.opening.name + " · " + puzzle.line.name
          : "De memoria: intento " + stage + " de " + ATTEMPTS;
      },

      noteAt: noteAt,

      result: function (res) {
        if (stage < ATTEMPTS) {
          stage++; repeat = true;
          return {
            text: stage === 1 ? "Ahora inténtalo tú" : "Bien. Otra vez, de memoria",
            nextLabel: "Intento " + stage + " de " + ATTEMPTS
          };
        }
        markLearned(res.puzzle.line.id);
        count++;
        return { text: "¡Línea aprendida!" };
      },

      hud: function () {
        if (!current) return [];
        var p = progress(current.opening);
        return [
          { label: "Apertura", value: current.opening.name },
          stage === 0
            ? { label: "Aprendidas", value: p.learned + "/" + p.total }
            : { label: "De memoria", value: stage + "/" + ATTEMPTS }
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

  /** Repaso de hoy dejado a medias, con las líneas que le quedan; o null. */
  function pendingReview() {
    var s = st().review;
    if (!s || s.day !== today() || !s.order) return null;
    var items = s.ids.map(findLine).filter(function (it) { return it && card(it.line.id); });
    return items.length
      ? { free: s.free, items: items, order: s.order, marks: s.marks }
      : null;
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
    // Si hoy se dejó un repaso a medias (flecha de volver, app cerrada), se
    // sigue donde estaba: con solo mirar qué toca hoy se perderían las líneas
    // falladas (ya apuntadas para mañana) y el repaso libre empezaría de cero.
    var s = pendingReview();
    var free = s ? s.free : !dueItems().length;
    var queue = s ? s.items : shuffle(free ? learnedItems() : dueItems());
    // order: las líneas del repaso, en su orden de salida (un segmento de la
    // barra cada una). marks: cómo salió el primer intento, "ok" o "ko".
    var order = s ? s.order : queue.map(function (it) { return it.line.id; });
    var marks = s ? s.marks : {};
    var total = order.length;
    var current = null;
    var playing = false;   // ¿hay una línea a medias?
    // Una fallada vuelve al final como al aprenderla: ATTEMPTS pasadas de
    // memoria con pistas. stage es la pasada (0 = repaso normal); repeat, que
    // la siguiente pasada es de la misma línea.
    var stage = 0;
    var repeat = false;

    function firstTry() {
      return order.filter(function (id) { return marks[id] === "ok"; }).length;
    }

    /** Resumen final: cada línea con su resultado, su historial y cuándo vuelve. */
    function detail() {
      var groups = [];
      order.map(findLine).filter(Boolean).forEach(function (it) {
        var g = groups.filter(function (x) { return x.op === it.opening; })[0];
        if (!g) groups.push(g = { op: it.opening, rows: [] });
        var c = card(it.line.id) || {};
        var ok = marks[it.line.id] === "ok";
        var inner = '<i class="' + (ok ? "ok" : "ko") + '">' + (ok ? "✓" : "✗") + "</i>" +
          "<span><b>" + esc(it.line.name) + "</b><small>" +
            (c.tries ? (c.ok || 0) + " de " + c.tries + " a la primera · " +
              Math.round((c.ok || 0) / c.tries * 100) + " %" : "") + "</small></span>" +
          "<em>" + (c.due ? whenText(c.due) : "") + (ok ? "" : " ›") + "</em>";
        // las falladas se pueden tocar para volver a ver la línea
        g.rows.push(ok ? '<div class="res-row">' + inner + "</div>"
          : '<button class="res-row" data-go="#/aperturas/linea/' + it.line.id + '">' + inner + "</button>");
      });
      return groups.length ? '<div class="res-list">' + groups.map(function (g) {
        return "<h3>" + esc(g.op.name) + "</h3>" + g.rows.join("");
      }).join("") + "</div>" : "";
    }

    function remember() {
      var ids = (playing || repeat ? [current] : []).concat(queue).map(function (it) { return it.line.id; });
      if (ids.length) {
        st().review = { day: today(), free: free, ids: ids, order: order, marks: marks };
      } else delete st().review;
      window.Store.save();
    }

    return {
      id: "openings-review",
      title: free ? "Repaso libre" : "Repasar",
      subtitle: "Aperturas",
      allowRetry: true,
      allowHint: true,
      autoNext: false,   // se para al acabar: ahí se enseña el nombre de la variante
      notes: true,       // y el plan que sigue, en la caja de las notas
      get hintAfter() { return stage ? HINT_AFTER[stage - 1] : null; },
      // al repetir una fallada también se dice qué apertura es, como en la primera pasada
      get turnText() { return current ? current.opening.name : ""; },
      get playingNote() {
        return stage ? "De memoria. Si te atascas, se irá marcando la jugada." : "";
      },
      lives: 0,
      timed: 0,
      affectsRating: false,

      next: function () {
        if (repeat) {
          repeat = false;
        } else {
          current = queue.shift() || null;
          stage = current && marks[current.line.id] === "ko" ? 1 : 0;
        }
        playing = !!current;
        remember();
        return current ? toPuzzle(current) : null;
      },

      loadText: function (puzzle) {
        return stage ? "De memoria: intento " + stage + " de " + ATTEMPTS : puzzle.opening.name;
      },

      result: function (res) {
        var id = res.puzzle.line.id;
        var first = !marks[id];
        playing = false;
        if (stage) {   // repitiendo una fallada: aquí equivocarse ya no cuenta
          var last = stage === ATTEMPTS;
          if (!last) { stage++; repeat = true; }
          remember();
          return last ? { text: "¡Hecha! Vuelve " + whenText(card(id).due) }
            : { text: "Bien. Otra vez, de memoria", nextLabel: "Intento " + stage + " de " + ATTEMPTS };
        }
        if (first) {
          marks[id] = res.clean ? "ok" : "ko";
          tally(id, res.clean);
          if (!free || !res.clean) grade(id, res.clean);
        }
        if (!res.clean) queue.push(current);   // otra vuelta antes de terminar
        remember();
        // en el repaso libre acertar no mueve la fecha: se dice cuándo le toca
        return { text: res.clean
          ? "¡Correcto! " + (free && first ? "Le toca " : "Vuelve ") + whenText(card(id).due)
          : "Volverá a salir al final. Después, mañana" };
      },

      /** Barra con un segmento por línea, en vez de casillas con números. */
      hudHtml: function () {
        var cur = playing || repeat ? current.line.id : null;
        var again = queue.concat(cur ? [current] : []).filter(function (it) {
          return marks[it.line.id] === "ko";
        }).length;
        var done = Object.keys(marks).length + (cur && !marks[cur] ? 1 : 0);
        return '<div class="hud-review"><div class="seg-bar">' +
          order.map(function (id) {
            return '<i class="' + (id === cur ? "now" : marks[id] || "") + '"></i>';
          }).join("") + "</div>" +
          '<div class="seg-info"><span>' +
            (cur && stage ? "De memoria " + stage + "/" + ATTEMPTS : "Línea " + Math.max(done, 1) + " de " + total) +
          "</span><span>" + (again ? again + " por repetir" : "") + "</span></div></div>";
      },

      finish: function () {
        return {
          headline: total ? "Repaso terminado" : "Nada que repasar hoy",
          score: firstTry(),
          rows: total ? [["Líneas repasadas", total], ["A la primera", firstTry()]] : [],
          detailHtml: detail()
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
    pendingReview: pendingReview,
    learnedItems: learnedItems,
    nextToLearn: nextToLearn,
    learnedToday: learnedToday,
    markLearned: markLearned,
    grade: grade,
    progress: progress,
    gaps: gaps,
    planArrows: planArrows,
    learn: learn,
    review: review,
    NEW_PER_DAY: NEW_PER_DAY,
    INTERVALS: INTERVALS
  };
})();
