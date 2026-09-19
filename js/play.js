/**
 * Pantalla de juego. Es la misma para todos los modos: recibe un objeto de
 * modes.js y se limita a pedirle puzzles, contarle resultados y pintar su
 * marcador.
 */
window.Play = (function () {
  var mode = null;
  var board = null;
  var player = null;
  var root = null;
  var els = {};
  var clock = null;
  var secondsLeft = 0;
  var puzzleClock = null;
  var puzzleSecondsLeft = 0;
  var over = false;
  var pending = null;      // temporizador del salto al siguiente puzzle

  var TEMPLATE =
    '<header class="play-head">' +
      '<button class="icon-btn" data-act="exit" aria-label="Salir">←</button>' +
      '<div class="play-title"><h1></h1><span class="sub"></span></div>' +
      '<button class="icon-btn" data-act="flip" aria-label="Girar el tablero">⇅</button>' +
    '</header>' +
    '<div class="hud"></div>' +
    '<div class="board-wrap"><div class="board-host"></div></div>' +
    '<div class="movebar">' +
      '<button class="nav-btn" data-act="back" aria-label="Jugada anterior">‹</button>' +
      '<div class="moves"></div>' +
      '<button class="nav-btn" data-act="fwd" aria-label="Jugada siguiente">›</button>' +
    "</div>" +
    '<footer class="play-foot">' +
      '<p class="status"></p>' +
      // El hueco de las etiquetas del puzzle existe desde el principio, aunque
      // esté vacío: si apareciera al resolver, el pie crecería y el tablero se
      // recolocaría hacia arriba justo cuando estás mirándolo.
      '<div class="puzzle-info"></div>' +
      '<div class="actions"></div>' +
    '</footer>' +
    '<div class="gameover" hidden></div>';

  function start(container, selected) {
    stop();
    mode = selected;
    over = false;
    root = container;
    root.className = "screen screen-play";
    root.innerHTML = TEMPLATE;

    els = {
      title: root.querySelector(".play-title h1"),
      sub: root.querySelector(".play-title .sub"),
      hud: root.querySelector(".hud"),
      host: root.querySelector(".board-host"),
      status: root.querySelector(".status"),
      info: root.querySelector(".puzzle-info"),
      actions: root.querySelector(".actions"),
      gameover: root.querySelector(".gameover"),
      movebar: root.querySelector(".movebar"),
      moves: root.querySelector(".moves"),
      back: root.querySelector('[data-act="back"]'),
      fwd: root.querySelector('[data-act="fwd"]')
    };

    els.title.textContent = mode.title;
    els.sub.textContent = mode.subtitle || "";

    root.querySelector('[data-act="exit"]').addEventListener("click", function () {
      window.location.hash = mode.backTo || "#/";
    });
    root.querySelector('[data-act="flip"]').addEventListener("click", function () {
      board.flip();
    });

    board = window.Board.create(els.host, {
      coords: window.Store.settings.coords,
      pieces: window.Store.settings.pieces,
      onMove: function (from, to, promo) {
        window.Sound.unlock();
        player.onUserMove(from, to, promo);
      }
    });

    player = window.PuzzlePlayer.create(board, {
      onLoad: onPuzzleLoad,
      onMovePlayed: onMovePlayed,
      onWrong: onWrong,
      onSolved: onSolved,
      onRevealed: onRevealed,
      onFailed: onRevealed,
      onLine: renderMoves,
      onProgress: function () { setStatus("¡Bien! Sigue.", "good"); }
    });

    els.back.addEventListener("click", function () { player.back(); });
    els.fwd.addEventListener("click", function () { player.forward(); });
    els.moves.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-ply]");
      if (btn) player.goTo(parseInt(btn.getAttribute("data-ply"), 10));
    });
    document.addEventListener("keydown", onKey);

    if (mode.timed) startClock(mode.timed);
    renderHud();
    nextPuzzle();
  }

  function onKey(ev) {
    if (!player) return;
    if (ev.key === "ArrowLeft") { player.back(); ev.preventDefault(); }
    if (ev.key === "ArrowRight") { player.forward(); ev.preventDefault(); }
  }

  function stop() {
    document.removeEventListener("keydown", onKey);
    if (player) player.stop();
    if (clock) { window.clearInterval(clock); clock = null; }
    stopPuzzleClock();
    if (pending) { window.clearTimeout(pending); pending = null; }
    player = null;
    board = null;
    mode = null;
  }

  // --- ciclo de puzzles --------------------------------------------------

  function nextPuzzle() {
    var puzzle = mode.next();
    if (!puzzle) {
      if (mode.onExhausted) { mode.onExhausted(); return; }
      finish({ reason: "sin-puzzles" });
      return;
    }
    player.load(puzzle);
  }

  function onPuzzleLoad(puzzle, color) {
    setStatus(color === "w" ? "Juegan las blancas" : "Juegan las negras", "turn " + color);
    renderActions("playing");
    if (mode.puzzleSeconds) startPuzzleClock(mode.puzzleSeconds);
    renderHud();
  }

  function onMovePlayed(move, game) {
    if (!window.Store.settings.sound) return;
    if (game.in_check()) window.Sound.check();
    else if (move.captured) window.Sound.capture();
    else window.Sound.move();
  }

  function onWrong() {
    if (window.Store.settings.sound) window.Sound.wrong();
    if (mode.allowRetry) {
      setStatus("No es esa. Prueba otra vez.", "bad");
      return;
    }
    setStatus("Fallo. Podrás repasarlo al terminar.", "bad");
    player.fail();
  }

  function onSolved(res) {
    stopPuzzleClock();
    if (window.Store.settings.sound) {
      if (res.mate) window.Sound.win(); else window.Sound.right();
    }
    var outcome = mode.result(res) || {};
    renderHud();

    if (outcome.over) { finish(mode.finish ? mode.finish() : {}); return; }

    if (res.clean) {
      setStatus(deltaText(res.mate ? "¡Jaque mate!" : "¡Resuelto!", outcome.delta), "good");
    } else {
      setStatus(deltaText(res.mate
        ? "Jaque mate, pero con ayuda."
        : "Resuelto, pero con ayuda.", outcome.delta), "meh");
    }

    if (mode.autoNext) {
      pending = window.setTimeout(nextPuzzle, 1000);
    } else {
      renderActions("solved", res.puzzle);
    }
  }

  /** Tras enseñar la solución: cuenta el fallo y sigue. */
  function onRevealed(puzzle) {
    stopPuzzleClock();
    var outcome = mode.result({ puzzle: puzzle, clean: false, failed: true }) || {};
    renderHud();
    if (outcome.over) { finish(mode.finish ? mode.finish() : {}); return; }
    if (mode.autoNext) {
      pending = window.setTimeout(nextPuzzle, 500);
    } else {
      setStatus("Esta era la solución.", "bad");
      renderActions("solved", puzzle);
    }
  }

  function deltaText(base, delta) {
    if (delta === undefined || delta === null || !mode.affectsRating) return base;
    return base + "  " + (delta >= 0 ? "+" : "") + delta;
  }

  /**
   * Notación de lo jugado, con la numeración real de la partida: el puzzle
   * empieza a media partida, así que el número sale del FEN y no de cero.
   * Cada jugada es pulsable para saltar a esa posición.
   */
  function renderMoves(line, viewAt) {
    var info = player.startInfo;
    var html = "";

    for (var i = 1; i < line.length; i++) {
      var ply = (i - 1) + (info.side === "b" ? 1 : 0);
      var white = ply % 2 === 0;
      var number = info.number + Math.floor(ply / 2);

      // el número solo delante de las blancas; si el puzzle arranca con negras,
      // la primera jugada se escribe "23…" como es costumbre
      if (white) html += '<span class="mv-num">' + number + ".</span>";
      else if (i === 1) html += '<span class="mv-num">' + number + "…</span>";

      html += '<button class="mv' + (i === viewAt ? " on" : "") + '" ' +
        'data-ply="' + i + '">' + line[i].san + "</button>";
    }

    // vacío mientras no hay jugadas: son 400 ms y un texto ahí solo parpadea
    els.moves.innerHTML = html;
    els.back.disabled = viewAt <= 0;
    els.fwd.disabled = viewAt >= line.length - 1;
    // mientras se mira atrás, la flecha de volver se destaca
    els.movebar.classList.toggle("browsing", viewAt < line.length - 1);

    var actual = els.moves.querySelector(".mv.on");
    if (actual) {
      // se centra a mano para no arrastrar el desplazamiento de la página
      els.moves.scrollLeft =
        actual.offsetLeft - els.moves.clientWidth / 2 + actual.offsetWidth / 2;
    }
  }

  // --- marcador y controles ---------------------------------------------

  function renderHud() {
    var items = mode.hud ? mode.hud() : [];
    if (mode.timed) {
      items = [{ label: "Tiempo", value: formatTime(secondsLeft), danger: secondsLeft <= 15 }]
        .concat(items);
    }
    if (mode.puzzleSeconds) {
      items = items.concat([{ label: "Puzzle", value: String(puzzleSecondsLeft), danger: puzzleSecondsLeft <= 10 }]);
    }
    els.hud.innerHTML = items.map(function (item) {
      return '<div class="hud-item' + (item.danger ? " danger" : "") + '">' +
        '<span class="hud-label">' + item.label + "</span>" +
        '<span class="hud-value">' + item.value + "</span>" +
        (item.trend ? '<span class="hud-trend ' + (item.trend >= 0 ? "up" : "down") + '">' +
          (item.trend >= 0 ? "+" : "") + item.trend + "</span>" : "") +
        "</div>";
    }).join("");
  }

  function renderActions(phase, puzzle) {
    var html = "";
    if (phase === "playing") {
      if (mode.allowHint) {
        html += '<button class="btn ghost" data-act="hint">Pista</button>';
        html += '<button class="btn ghost" data-act="solution">Ver solución</button>';
      } else {
        html += '<span class="hint-note">Sin ayudas en este modo</span>';
      }
    } else if (phase === "solved") {
      html += '<button class="btn primary wide" data-act="next">Siguiente</button>';
    }
    els.actions.innerHTML = html;

    if (phase === "solved" && puzzle) renderPuzzleInfo(puzzle);
    else els.info.innerHTML = "";

    els.actions.querySelectorAll("[data-act]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var act = btn.getAttribute("data-act");
        if (act === "hint") { player.hint(); setStatus("Mueve esa pieza.", "meh"); }
        if (act === "solution") { player.reveal(); }
        if (act === "next") { nextPuzzle(); }
      });
    });
  }

  /** Al resolver, se muestran los motivos del puzzle: es donde se aprende. */
  function renderPuzzleInfo(puzzle) {
    var interesting = window.THEMES.ranked(puzzle.themes).slice(0, 3);
    if (!interesting.length) return;

    els.info.innerHTML =
      '<div class="chips">' + interesting.map(function (t) {
        return '<span class="chip">' + window.THEMES.name(t) + "</span>";
      }).join("") + '<span class="chip muted">' + puzzle.rating + "</span></div>" +
      '<p class="theme-desc">' + window.THEMES.desc(interesting[0]) + "</p>";
  }

  function setStatus(text, kind) {
    els.status.textContent = text;
    els.status.className = "status " + (kind || "");
  }

  // --- reloj -------------------------------------------------------------

  function startClock(seconds) {
    secondsLeft = seconds;
    clock = window.setInterval(function () {
      secondsLeft--;
      if (secondsLeft <= 5 && secondsLeft > 0 && window.Store.settings.sound) window.Sound.tick();
      renderHud();
      if (secondsLeft <= 0) {
        window.clearInterval(clock);
        clock = null;
        player.stop();
        finish(mode.finish ? mode.finish() : {}, "Se acabó el tiempo");
      }
    }, 1000);
  }

  function formatTime(total) {
    var m = Math.floor(total / 60), s = total % 60;
    return m + ":" + String(s).padStart(2, "0");
  }

  /** Cuenta atrás por puzzle (contrarreloj): si se agota, se da por fallado
   *  igual que una jugada equivocada, sin destapar la solución. */
  function startPuzzleClock(seconds) {
    stopPuzzleClock();
    puzzleSecondsLeft = seconds;
    puzzleClock = window.setInterval(function () {
      puzzleSecondsLeft--;
      renderHud();
      if (puzzleSecondsLeft <= 0) {
        stopPuzzleClock();
        player.fail();
      }
    }, 1000);
  }

  function stopPuzzleClock() {
    if (puzzleClock) { window.clearInterval(puzzleClock); puzzleClock = null; }
  }

  // --- fin de partida ----------------------------------------------------

  function finish(summary, headline) {
    if (over) return;
    over = true;
    if (clock) { window.clearInterval(clock); clock = null; }
    if (pending) { window.clearTimeout(pending); pending = null; }
    player.stop();
    board.setInteractive(false);

    if (window.Store.settings.sound) {
      if (summary.record) window.Sound.win(); else window.Sound.lose();
    }
    window.Store.save();

    var rows = [];
    if (summary.score !== undefined) rows.push(["Resueltos", summary.score]);
    if (summary.bestStreak) rows.push(["Mejor racha", summary.bestStreak]);
    if (summary.topRating) rows.push(["Dificultad alcanzada", summary.topRating]);
    if (summary.best !== undefined) rows.push(["Tu récord", summary.best]);
    if (summary.bestWeek !== undefined) rows.push(["Mejor de la semana", summary.bestWeek]);
    if (summary.bestToday !== undefined) rows.push(["Mejor del día", summary.bestToday]);

    els.gameover.hidden = false;
    els.gameover.innerHTML =
      '<div class="gameover-card">' +
        (summary.record ? '<div class="record-badge">¡Récord nuevo!</div>' : "") +
        "<h2>" + (headline || "Fin de la partida") + "</h2>" +
        (summary.score !== undefined ? '<div class="big-score">' + summary.score + "</div>" : "") +
        '<dl class="summary">' + rows.map(function (r) {
          return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>";
        }).join("") + "</dl>" +
        '<div class="gameover-actions">' +
          '<button class="btn primary wide" data-act="again">Otra vez</button>' +
          (summary.review
            ? '<button class="btn ghost wide" data-act="review">Revisar los ' +
              summary.review + " puzzles</button>"
            : "") +
          '<button class="btn ghost wide" data-act="home">Volver al inicio</button>' +
        "</div>" +
      "</div>";

    els.gameover.querySelector('[data-act="again"]').addEventListener("click", function () {
      window.App.replay();
    });
    els.gameover.querySelector('[data-act="home"]').addEventListener("click", function () {
      window.location.hash = "#/";
    });
    var revisar = els.gameover.querySelector('[data-act="review"]');
    if (revisar) {
      revisar.addEventListener("click", function () { window.location.hash = "#/revision"; });
    }
  }

  return {
    start: start,
    stop: stop,
    /** Puzzle en curso. Útil para depurar desde la consola. */
    get puzzle() { return player ? player.puzzle : null; }
  };
})();
