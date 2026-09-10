/**
 * Navegación y pantallas que no son de juego. La ruta vive en el hash de la
 * URL, así que el botón "atrás" del móvil funciona sin más.
 */
window.App = (function () {
  var root = null;
  var currentRoute = "";

  // --- utilidades --------------------------------------------------------

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function screen(className, html) {
    root.className = "screen " + className;
    root.innerHTML = html;
    root.scrollTop = 0;
  }

  function on(selector, handler) {
    root.querySelectorAll(selector).forEach(function (el) {
      el.addEventListener("click", handler);
    });
  }

  function go(hash) { window.location.hash = hash; }

  function backHeader(title, hash) {
    return '<header class="head">' +
      '<button class="icon-btn" data-nav="' + (hash || "#/") + '" aria-label="Volver">←</button>' +
      "<h1>" + esc(title) + "</h1><span class=\"head-spacer\"></span></header>";
  }

  function wireNav() {
    on("[data-nav]", function (e) {
      go(e.currentTarget.getAttribute("data-nav"));
    });
  }

  // --- inicio ------------------------------------------------------------

  function home() {
    var st = window.Store.state;
    var today = window.Store.solvedToday();
    var streak = window.Store.streak();
    var records = st.records;

    screen("screen-home",
      '<header class="home-head">' +
        "<h1>Táctica</h1>" +
        '<button class="icon-btn" data-nav="#/ajustes" aria-label="Ajustes">⚙</button>' +
      "</header>" +

      '<section class="rating-card" data-nav="#/progreso">' +
        '<div class="rating-main">' +
          '<span class="rating-label">Tu rating</span>' +
          '<span class="rating-value">' + st.rating + "</span>" +
        "</div>" +
        sparkline(st.stats.history) +
        '<div class="rating-foot">' +
          '<span><b>' + today + "</b> hoy</span>" +
          '<span><b>' + st.stats.solved + "</b> resueltos</span>" +
          '<span><b>' + streak + "</b> días seguidos</span>" +
        "</div>" +
      "</section>" +

      '<div class="mode-grid">' +
        modeCard("#/supervivencia", "Supervivencia", "De fácil a imposible. 3 fallos.",
                 "survival", records.survival ? "Récord " + records.survival : "") +
        modeCard("#/clasificado", "Clasificado", "Puzzles a tu nivel exacto.",
                 "rated", "") +
        modeCard("#/temas", "Entrenamiento", "Aperturas, finales, clavadas, mates…",
                 "themes", "") +
        modeCard("#/contrarreloj", "Contrarreloj", "Todos los que puedas en 3 o 5 minutos.",
                 "rush", records.rush3 || records.rush5
                   ? "Récord " + Math.max(records.rush3, records.rush5) : "") +
      "</div>" +

      (st.lastRun && st.lastRun.length
        ? '<button class="link-row" data-nav="#/revision">Revisar la última partida' +
          "<span>›</span></button>"
        : "") +
      '<button class="link-row" data-nav="#/progreso">Ver mi progreso<span>›</span></button>'
    );
    wireNav();
  }

  function modeCard(hash, title, desc, kind, badge) {
    return '<button class="mode-card mode-' + kind + '" data-nav="' + hash + '">' +
      '<span class="mode-icon" aria-hidden="true">' + modeIcon(kind) + "</span>" +
      '<span class="mode-text"><b>' + esc(title) + "</b><small>" + esc(desc) + "</small></span>" +
      (badge ? '<span class="mode-badge">' + esc(badge) + "</span>" : "") +
      "</button>";
  }

  function modeIcon(kind) {
    return { survival: "♞", rated: "♛", themes: "♜", rush: "♝" }[kind] || "♟";
  }

  /** Mini gráfica de la evolución del rating. */
  function sparkline(history) {
    if (!history || history.length < 2) {
      return '<div class="spark empty">Resuelve unos cuantos para ver tu evolución</div>';
    }
    var pts = history.slice(-60);
    var values = pts.map(function (p) { return p.r; });
    var min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    var range = Math.max(40, max - min);
    var mid = (min + max) / 2;
    min = mid - range / 2; max = mid + range / 2;

    var w = 100, h = 34;
    var d = pts.map(function (p, i) {
      var x = pts.length === 1 ? 0 : (i / (pts.length - 1)) * w;
      var y = h - ((p.r - min) / (max - min)) * h;
      return (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }).join(" ");

    return '<svg class="spark" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" ' +
      'aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  // --- temas -------------------------------------------------------------

  function themes() {
    var html = backHeader("Entrenamiento");
    html += '<p class="lead">Elige qué quieres practicar. Cada bloque agrupa puzzles con el mismo motivo, para que el patrón se te quede grabado.</p>';

    // El aleatorio va primero y destacado: es el que más se parece a jugar.
    html += '<button class="mode-card mode-random" data-nav="#/tema/aleatorio">' +
      '<span class="mode-icon" aria-hidden="true">⚄</span>' +
      '<span class="mode-text"><b>Aleatorio</b>' +
      "<small>Un motivo distinto cada vez, sin saber cuál toca</small></span>" +
      '<span class="mode-badge">Recomendado</span></button>' +
      '<h2 class="section-title">O elige un motivo concreto</h2>';

    window.THEMES.groups.forEach(function (group) {
      var items = group.themes.filter(function (t) { return window.Data.themeCount(t) > 0; });
      if (!items.length) return;
      html += '<section class="theme-group"><h2>' + esc(group.name) + "</h2>" +
        '<p class="group-hint">' + esc(group.hint) + "</p><div class=\"theme-list\">";
      items.forEach(function (t) {
        var stats = window.Store.state.stats.byTheme[t];
        var total = stats ? stats.ok + stats.ko : 0;
        html += '<button class="theme-item" data-nav="#/tema/' + t + '">' +
          "<b>" + esc(window.THEMES.name(t)) + "</b>" +
          '<span class="theme-meta">' + window.Data.themeCount(t) + " puzzles" +
          (total ? " · " + Math.round(stats.ok / total * 100) + "% acierto" : "") +
          "</span></button>";
      });
      html += "</div></section>";
    });

    screen("screen-list", html);
    wireNav();
  }

  function themeDetail(themeId) {
    if (themeId === window.Modes.randomId) { randomDetail(); return; }
    if (!window.THEMES.labels[themeId]) { go("#/temas"); return; }
    var stats = window.Store.state.stats.byTheme[themeId];
    var total = stats ? stats.ok + stats.ko : 0;

    screen("screen-list",
      backHeader(window.THEMES.name(themeId), "#/temas") +
      '<p class="lead">' + esc(window.THEMES.desc(themeId)) + "</p>" +
      '<div class="stat-strip">' +
        '<div><b>' + window.Data.themeCount(themeId) + "</b><span>disponibles</span></div>" +
        '<div><b>' + (stats ? stats.ok : 0) + "</b><span>resueltos</span></div>" +
        '<div><b>' + (total ? Math.round(stats.ok / total * 100) + "%" : "—") + "</b><span>acierto</span></div>" +
      "</div>" +
      levelSection(themeId)
    );
    wireNav();
  }

  /** El modo aleatorio no tiene tema propio, así que se describe aparte. */
  function randomDetail() {
    var st = window.Store.state;
    screen("screen-list",
      backHeader("Aleatorio", "#/temas") +
      '<p class="lead">Un motivo distinto en cada puzzle y sin saber cuál toca. Es lo más parecido a una partida de verdad: ahí tampoco te avisan de que viene una clavada. Antes de repetir motivo pasan todos los demás, así que también salen los raros.</p>' +
      '<div class="stat-strip">' +
        "<div><b>" + window.Modes.motifPool().length + "</b><span>motivos</span></div>" +
        "<div><b>" + st.rating + "</b><span>tu rating</span></div>" +
        "<div><b>" + st.stats.solved + "</b><span>resueltos</span></div>" +
      "</div>" +
      levelSection(window.Modes.randomId)
    );
    wireNav();
  }

  function levelSection(themeId) {
    return '<h2 class="section-title">Dificultad</h2>' +
      '<div class="level-list">' +
        levelButton(themeId, "exigente", "Exigente",
          "Empieza por encima de tu nivel y se mueve según aciertes. Cuenta para tu rating.", true) +
        levelButton(themeId, "facil", "Fácil",
          "Por debajo de tu nivel, para coger el patrón") +
        levelButton(themeId, "medio", "A tu nivel",
          "Ajustado a tu rating actual") +
        levelButton(themeId, "todos", "Mezclado",
          "De todo, sin filtrar por dificultad") +
      "</div>";
  }

  function levelButton(themeId, level, name, desc, featured) {
    return '<button class="level-item' + (featured ? " featured" : "") + '" ' +
      'data-nav="#/tema/' + themeId + "/" + level + '">' +
      "<b>" + esc(name) + (featured ? "<em>recomendado</em>" : "") + "</b>" +
      "<small>" + esc(desc) + "</small><span>›</span></button>";
  }

  // --- contrarreloj ------------------------------------------------------

  function rushMenu() {
    var r = window.Store.state.records;
    screen("screen-list",
      backHeader("Contrarreloj") +
      '<p class="lead">Tantos puzzles como puedas antes de que se acabe el tiempo. Tres fallos también terminan la partida.</p>' +
      '<div class="level-list">' +
        '<button class="level-item" data-nav="#/contrarreloj/3"><b>3 minutos</b>' +
          "<small>" + (r.rush3 ? "Tu récord: " + r.rush3 : "Sin récord todavía") + "</small><span>›</span></button>" +
        '<button class="level-item" data-nav="#/contrarreloj/5"><b>5 minutos</b>' +
          "<small>" + (r.rush5 ? "Tu récord: " + r.rush5 : "Sin récord todavía") + "</small><span>›</span></button>" +
      "</div>"
    );
    wireNav();
  }

  // --- revisión de la última partida --------------------------------------

  var runFilter = "todos";

  /** Lista los puzzles de la última partida de supervivencia o contrarreloj. */
  function reviewList() {
    var run = window.Store.state.lastRun || [];

    if (!run.length) {
      screen("screen-list",
        backHeader("Revisión") +
        '<p class="lead">Aquí aparecerán los puzzles en cuanto termines una partida de Supervivencia o Contrarreloj, para que puedas repasar sobre todo los que fallaste.</p>' +
        '<div class="level-list">' +
          '<button class="level-item" data-nav="#/supervivencia"><b>Jugar a Supervivencia</b><span>›</span></button>' +
        "</div>");
      wireNav();
      return;
    }

    var fallos = run.filter(function (e) { return !e.ok; }).length;
    var visibles = runFilter === "fallos"
      ? run.filter(function (e) { return !e.ok; })
      : run;

    var html = backHeader("Revisión") +
      '<p class="lead">Última partida: <b>' + run.length + "</b> puzzles, " +
      "<b>" + (run.length - fallos) + "</b> acertados y <b>" + fallos + "</b> fallados. " +
      "Toca cualquiera para volver a intentarlo con calma.</p>";

    if (fallos && fallos < run.length) {
      html += '<div class="filter-row">' +
        filterChip("todos", "Todos (" + run.length + ")") +
        filterChip("fallos", "Solo fallos (" + fallos + ")") +
        "</div>";
    }

    html += '<div class="run-list">';
    run.forEach(function (entry, i) {
      if (visibles.indexOf(entry) === -1) return;
      var puzzle = window.Data.get(entry.i);
      var tema = window.THEMES.ranked(puzzle.themes)[0];
      html += '<button class="run-item ' + (entry.ok ? "ok" : "ko") + '" ' +
        'data-nav="#/revision/' + i + '">' +
        '<span class="run-num">' + (i + 1) + "</span>" +
        '<span class="run-mark" aria-hidden="true">' + (entry.ok ? "✓" : "✗") + "</span>" +
        '<span class="run-text"><b>' + esc(tema ? window.THEMES.name(tema) : "Puzzle") + "</b>" +
        "<small>dificultad " + puzzle.rating +
        (entry.ok ? "" : " · lo fallaste") + "</small></span>" +
        '<span class="run-go" aria-hidden="true">›</span></button>';
    });
    html += "</div>";

    screen("screen-list", html);
    wireNav();

    on("[data-filter]", function (e) {
      runFilter = e.currentTarget.getAttribute("data-filter");
      reviewList();
    });
  }

  function filterChip(id, label) {
    return '<button class="filter-chip' + (runFilter === id ? " on" : "") + '" ' +
      'data-filter="' + id + '">' + esc(label) + "</button>";
  }

  // --- progreso ----------------------------------------------------------

  function progress() {
    var st = window.Store.state;
    var s = st.stats;
    var total = s.solved + s.failed;

    var themeRows = Object.keys(s.byTheme)
      .filter(function (t) { return window.THEMES.labels[t] && s.byTheme[t].ok + s.byTheme[t].ko >= 4; })
      .map(function (t) {
        var e = s.byTheme[t];
        return { id: t, n: e.ok + e.ko, pct: Math.round(e.ok / (e.ok + e.ko) * 100) };
      })
      .sort(function (a, b) { return a.pct - b.pct; });

    var weakest = themeRows.slice(0, 6);
    // los fuertes solo tienen sentido si no son los mismos que los débiles
    var strongest = themeRows.length >= 10
      ? themeRows.slice().reverse().slice(0, 6)
      : [];

    screen("screen-list",
      backHeader("Tu progreso") +
      '<section class="progress-hero">' +
        '<div class="rating-value big">' + st.rating + "</div>" +
        '<div class="rating-label">rating de puzzles</div>' +
        sparkline(s.history) +
      "</section>" +

      '<div class="stat-strip">' +
        "<div><b>" + s.solved + "</b><span>resueltos</span></div>" +
        "<div><b>" + (total ? Math.round(s.solved / total * 100) + "%" : "—") + "</b><span>acierto</span></div>" +
        "<div><b>" + window.Store.streak() + "</b><span>días seguidos</span></div>" +
      "</div>" +

      '<h2 class="section-title">Récords</h2>' +
      '<div class="stat-strip">' +
        "<div><b>" + st.records.survival + "</b><span>supervivencia</span></div>" +
        "<div><b>" + st.records.rush3 + "</b><span>3 min</span></div>" +
        "<div><b>" + st.records.rush5 + "</b><span>5 min</span></div>" +
      "</div>" +

      '<h2 class="section-title">Actividad</h2>' + heatmap(s.days) +

      (weakest.length
        ? '<h2 class="section-title">Dónde flojeas</h2><p class="group-hint">Los temas con menos acierto: aquí es donde más vas a ganar.</p>' + bars(weakest)
        : '<p class="lead">Cuando lleves unos cuantos puzzles verás aquí en qué temas fallas más.</p>') +

      (strongest.length && strongest[0].pct > 0
        ? '<h2 class="section-title">Lo que llevas mejor</h2>' + bars(strongest)
        : "") +

      '<button class="link-row" data-nav="#/ajustes">Ajustes<span>›</span></button>'
    );
    wireNav();
  }

  function bars(rows) {
    return '<div class="bars">' + rows.map(function (r) {
      return '<div class="bar-row"><span class="bar-name">' + esc(window.THEMES.name(r.id)) + "</span>" +
        '<span class="bar-track"><span class="bar-fill" style="width:' + r.pct + '%"></span></span>' +
        '<span class="bar-pct">' + r.pct + "%</span></div>";
    }).join("") + "</div>";
  }

  /** Rejilla de actividad de las últimas 12 semanas. */
  function heatmap(days) {
    var cells = [];
    var d = new Date();
    d.setHours(12, 0, 0, 0);
    // retroceder hasta el lunes de hace 11 semanas
    var offset = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - offset - 11 * 7);

    for (var w = 0; w < 12; w++) {
      for (var day = 0; day < 7; day++) {
        var key = window.Store.todayKey(d);
        var n = days[key] || 0;
        var level = n === 0 ? 0 : n < 5 ? 1 : n < 15 ? 2 : n < 30 ? 3 : 4;
        cells.push('<i class="hm l' + level + '" title="' + key + ": " + n + ' puzzles"></i>');
        d.setDate(d.getDate() + 1);
      }
    }
    return '<div class="heatmap">' + cells.join("") + "</div>" +
      '<div class="heatmap-legend"><span>menos</span><i class="hm l0"></i><i class="hm l1"></i>' +
      '<i class="hm l2"></i><i class="hm l3"></i><i class="hm l4"></i><span>más</span></div>';
  }

  // --- aspecto -----------------------------------------------------------

  var BOARDS = [
    { id: "verde",   name: "Verde" },
    { id: "madera",  name: "Madera" },
    { id: "azul",    name: "Azul" },
    { id: "pizarra", name: "Pizarra" },
    { id: "lavanda", name: "Lavanda" },
    { id: "noche",   name: "Noche" }
  ];

  var THEME_OPTIONS = [
    { id: "auto",  name: "Automático" },
    { id: "light", name: "Claro" },
    { id: "dark",  name: "Oscuro" }
  ];

  /** Tema efectivo: "automático" se resuelve mirando el ajuste del sistema. */
  function resolvedTheme() {
    var choice = window.Store.settings.theme || "auto";
    if (choice === "light" || choice === "dark") return choice;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light" : "dark";
  }

  /** Estampa tema y tablero en <html>, de donde cuelga toda la paleta. */
  function applyAppearance() {
    var theme = resolvedTheme();
    var root = document.documentElement;
    root.setAttribute("data-ui-theme", theme);
    root.setAttribute("data-board", window.Store.settings.board || "verde");

    // que la barra de estado del móvil acompañe al fondo de la app
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f1f3f6" : "#12141a");
  }

  // --- ajustes -----------------------------------------------------------

  function settings() {
    var s = window.Store.settings;
    var pieceSet = window.PIECE_SETS[s.pieces] || window.PIECE_SETS.cburnett;

    screen("screen-list",
      backHeader("Ajustes") +
      '<div class="switch-list">' +
        toggle("sound", "Sonido", "Efectos al mover y al acertar", s.sound) +
        toggle("coords", "Coordenadas", "Letras y números en el borde del tablero", s.coords) +
      "</div>" +

      '<h2 class="section-title">Aspecto</h2>' +

      '<h3 class="pref-label">Tema</h3>' +
      '<div class="segmented">' + THEME_OPTIONS.map(function (t) {
        return '<button data-theme="' + t.id + '"' +
          (s.theme === t.id ? ' class="on"' : "") + ">" + esc(t.name) + "</button>";
      }).join("") + "</div>" +
      '<p class="credit-line">Automático sigue el modo claro u oscuro de tu iPhone.</p>' +

      '<h3 class="pref-label">Color del tablero</h3>' +
      '<div class="picker-grid">' + BOARDS.map(function (b) {
        return '<button class="picker-item' + (s.board === b.id ? " on" : "") + '" ' +
          'data-board-pick="' + b.id + '" data-board="' + b.id + '">' +
          '<span class="swatch" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
          "<span>" + esc(b.name) + "</span></button>";
      }).join("") + "</div>" +

      '<h3 class="pref-label">Piezas</h3>' +
      '<div class="picker-grid">' + window.PIECE_SET_ORDER.map(function (id) {
        var set = window.PIECE_SETS[id];
        return '<button class="picker-item' + (s.pieces === id ? " on" : "") + '" ' +
          'data-pieces="' + id + '">' +
          '<span class="piece-preview" aria-hidden="true">' +
          "<i>" + set.pieces.wN + "</i><i>" + set.pieces.bQ + "</i></span>" +
          "<span>" + esc(set.name) + "</span></button>";
      }).join("") + "</div>" +
      '<p class="credit-line" id="piece-credit">' + esc(pieceSet.credit) + "</p>" +

      '<h2 class="section-title">Tu rating</h2>' +
      '<p class="group-hint">Si ya sabes más o menos tu nivel, ajústalo aquí y la app te servirá puzzles adecuados desde el principio.</p>' +
      '<div class="rating-set">' +
        '<button class="btn ghost" data-adj="-100">−100</button>' +
        '<span class="rating-value" id="rating-now">' + window.Store.state.rating + "</span>" +
        '<button class="btn ghost" data-adj="100">+100</button>' +
      "</div>" +

      '<h2 class="section-title">Datos</h2>' +
      '<button class="btn danger wide" data-act="reset">Borrar todo mi progreso</button>' +
      '<p class="credits">Puzzles de la base de datos abierta de <b>Lichess</b> (CC0). ' +
      "Reglas de ajedrez con chess.js (BSD). Los juegos de piezas son obra de " +
      "distintos autores, cada uno con su licencia; el del juego elegido aparece " +
      "arriba, junto al selector.</p>"
    );
    wireNav();

    on("[data-toggle]", function (e) {
      var key = e.currentTarget.getAttribute("data-toggle");
      window.Store.setSetting(key, !window.Store.settings[key]);
      if (key === "sound") window.Sound.setEnabled(window.Store.settings[key]);
      e.currentTarget.classList.toggle("on", window.Store.settings[key]);
      e.currentTarget.setAttribute("aria-checked", String(window.Store.settings[key]));
    });

    on("[data-theme]", function (e) {
      window.Store.setSetting("theme", e.currentTarget.getAttribute("data-theme"));
      applyAppearance();
      settings();      // se repinta para que la opción marcada sea la nueva
    });

    on("[data-board-pick]", function (e) {
      window.Store.setSetting("board", e.currentTarget.getAttribute("data-board-pick"));
      applyAppearance();
      settings();
    });

    on("[data-pieces]", function (e) {
      window.Store.setSetting("pieces", e.currentTarget.getAttribute("data-pieces"));
      settings();
    });

    on("[data-adj]", function (e) {
      var delta = parseInt(e.currentTarget.getAttribute("data-adj"), 10);
      var next = Math.max(window.Rating.MIN, Math.min(window.Rating.MAX,
        window.Store.state.rating + delta));
      window.Store.setRating(next);
      root.querySelector("#rating-now").textContent = next;
    });

    on('[data-act="reset"]', function () {
      if (!window.confirm("Se borrará tu rating, tus récords y todas las estadísticas. ¿Seguro?")) return;
      window.Store.reset();
      applyAppearance();
      go("#/");
    });
  }

  function toggle(key, title, desc, value) {
    return '<button class="switch' + (value ? " on" : "") + '" role="switch" ' +
      'aria-checked="' + !!value + '" data-toggle="' + key + '">' +
      '<span class="switch-text"><b>' + esc(title) + "</b><small>" + esc(desc) + "</small></span>" +
      '<span class="switch-knob" aria-hidden="true"></span></button>';
  }

  // --- enrutado ----------------------------------------------------------

  function modeForRoute(route) {
    var parts = route.replace(/^#\/?/, "").split("/");
    switch (parts[0]) {
      case "clasificado": return window.Modes.rated();
      case "supervivencia": return window.Modes.survival();
      case "contrarreloj":
        return parts[1] ? window.Modes.rush(parseInt(parts[1], 10)) : null;
      case "tema":
        return parts[2] ? window.Modes.theme(parts[1], parts[2]) : null;
      case "revision":
        return parts[1] ? window.Modes.review(parseInt(parts[1], 10)) : null;
      default: return null;
    }
  }

  function route() {
    var hash = window.location.hash || "#/";
    currentRoute = hash;
    window.Play.stop();

    var mode = modeForRoute(hash);
    if (mode) { window.Play.start(root, mode); return; }

    var parts = hash.replace(/^#\/?/, "").split("/");
    switch (parts[0]) {
      case "temas": themes(); break;
      case "tema": themeDetail(parts[1]); break;
      case "contrarreloj": rushMenu(); break;
      case "revision": reviewList(); break;
      case "progreso": progress(); break;
      case "ajustes": settings(); break;
      default: home();
    }
  }

  function replay() {
    var mode = modeForRoute(currentRoute);
    if (mode) window.Play.start(root, mode);
    else go("#/");
  }

  function boot() {
    root = document.getElementById("app");
    try {
      window.Data.init();
    } catch (e) {
      root.innerHTML = '<div class="fatal"><h1>No se han podido cargar los puzzles</h1>' +
        "<p>" + esc(e.message) + "</p></div>";
      return;
    }

    applyAppearance();
    // en modo automático hay que reaccionar si el sistema cambia de tema
    // mientras la app está abierta
    if (window.matchMedia) {
      var query = window.matchMedia("(prefers-color-scheme: light)");
      var onChange = function () {
        if ((window.Store.settings.theme || "auto") === "auto") applyAppearance();
      };
      if (query.addEventListener) query.addEventListener("change", onChange);
      else if (query.addListener) query.addListener(onChange);   // Safari antiguo
    }

    window.Sound.setEnabled(window.Store.settings.sound);
    document.addEventListener("pointerdown", function once() {
      window.Sound.unlock();
      document.removeEventListener("pointerdown", once);
    });

    window.addEventListener("hashchange", route);
    route();
    document.body.classList.remove("loading");
  }

  return { boot: boot, replay: replay, route: route };
})();

document.addEventListener("DOMContentLoaded", window.App.boot);
