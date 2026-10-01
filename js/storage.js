/**
 * Persistencia en el propio navegador (localStorage). Todo el progreso vive en
 * el dispositivo: no hay cuentas ni servidor.
 */
window.Store = (function () {
  var KEY = "tactica.v1";
  // El tema se guarda además suelto, para que el script de arranque de
  // index.html pueda leerlo sin analizar todo el progreso y evitar así el
  // parpadeo de fondo oscuro antes de que cargue la app.
  var THEME_KEY = "tactica.tema";
  var SEEN_CAP = 70000;     // cubre todo el banco (68.792 puzzles): solo son
                            // índices, así que no pesa nada de más recordarlos
  var HISTORY_CAP = 400;

  var defaults = {
    rating: 1200,
    solvedCount: 0,
    seen: [],
    records: { survival: 0, rush3: 0, rush5: 0, streak: 0 },
    // todas las puntuaciones por modo, para el ranking de hoy/semana/siempre:
    // [{ v: puntuación, t: cuándo }]
    scores: { survival: [], rush3: [], rush5: [] },
    stats: { solved: 0, failed: 0, byTheme: {}, days: {}, history: [] },
    settings: {
      sound: true, coords: true, autoNext: true, animations: true,
      theme: "auto",        // auto | light | dark
      board: "verde",
      pieces: "cburnett",
      section: "tactica"    // tactica | aperturas
    },
    // aperturas: las elegidas y, por cada línea ya aprendida, su caja del
    // repaso espaciado y la fecha en que vuelve a tocar
    openings: {
      selected: [],
      cards: {},             // id de línea -> { box: 0.., due: "AAAA-MM-DD" }
      learnedOn: {}          // día -> líneas nuevas aprendidas ese día
    },
    lastPlayed: null,
    // última partida de supervivencia o contrarreloj, para poder repasarla:
    // [{ i: índice del puzzle, ok: si se acertó }]
    lastRun: []
  };

  var state = load();
  var seenSet = {};
  for (var i = 0; i < state.seen.length; i++) seenSet[state.seen[i]] = 1;

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return clone(defaults);
      var saved = JSON.parse(raw);
      return merge(clone(defaults), saved);
    } catch (e) {
      return clone(defaults);
    }
  }

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function merge(base, extra) {
    for (var k in extra) {
      if (extra[k] && typeof extra[k] === "object" && !Array.isArray(extra[k]) && base[k]) {
        merge(base[k], extra[k]);
      } else if (extra[k] !== undefined) {
        base[k] = extra[k];
      }
    }
    return base;
  }

  var saveTimer = null;
  function save() {
    // se escribe agrupado: durante una racha se resuelven puzzles muy seguidos
    if (saveTimer) return;
    saveTimer = window.setTimeout(function () {
      saveTimer = null;
      try {
        window.localStorage.setItem(KEY, JSON.stringify(state));
      } catch (e) {
        // cuota llena: soltar la mitad del historial de vistos y reintentar
        state.seen = state.seen.slice(state.seen.length >> 1);
        try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e2) { /* nada que hacer */ }
      }
    }, 250);
  }

  function todayKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  function markSeen(index) {
    if (seenSet[index]) return;
    seenSet[index] = 1;
    state.seen.push(index);
    if (state.seen.length > SEEN_CAP) {
      var drop = state.seen.splice(0, state.seen.length - SEEN_CAP);
      for (var i = 0; i < drop.length; i++) delete seenSet[drop[i]];
    }
    save();
  }

  /** Registra el resultado de un puzzle en las estadísticas globales. */
  function record(puzzle, ok) {
    var s = state.stats;
    if (ok) s.solved++; else s.failed++;

    for (var i = 0; i < puzzle.themes.length; i++) {
      var t = puzzle.themes[i];
      var entry = s.byTheme[t] || (s.byTheme[t] = { ok: 0, ko: 0 });
      if (ok) entry.ok++; else entry.ko++;
    }

    var day = todayKey();
    s.days[day] = (s.days[day] || 0) + 1;
    state.lastPlayed = day;
    markSeen(puzzle.index);
    save();
  }

  function pushHistory(rating) {
    var h = state.stats.history;
    var last = h[h.length - 1];
    var now = Date.now();
    // se agrupan solo los cambios muy seguidos: así la curva tiene detalle
    // desde el primer día pero no crece sin control
    if (last && now - last.t < 20 * 1000) { last.r = rating; last.t = now; }
    else h.push({ t: now, r: rating });
    if (h.length > HISTORY_CAP) h.splice(0, h.length - HISTORY_CAP);
    save();
  }

  function setRating(value) {
    state.rating = Math.round(value);
    pushHistory(state.rating);
  }

  /** Guarda la partida recién terminada para la pantalla de revisión. */
  function setLastRun(entries) {
    state.lastRun = entries.slice(0, 200);
    save();
  }

  /** Cambia un ajuste y lo guarda. */
  function setSetting(key, value) {
    state.settings[key] = value;
    if (key === "theme") {
      try { window.localStorage.setItem(THEME_KEY, value); } catch (e) { /* modo privado */ }
    }
    save();
  }

  function setRecord(key, value) {
    if (value > (state.records[key] || 0)) {
      state.records[key] = value;
      save();
      return true;
    }
    return false;
  }

  /** Anota una puntuación de partida (supervivencia/contrarreloj) para el
   * ranking. Sin tope: son ~25 bytes por partida. */
  function pushScore(key, value) {
    var arr = state.scores[key] || (state.scores[key] = []);
    arr.push({ v: value, t: Date.now() });
    save();
  }

  /** Puesto de `value` entre las partidas guardadas de ese modo (1 = la
   * mejor; los empates comparten puesto), limitado a "day" (hoy, por fecha
   * de calendario), "week" (últimos 7 días naturales) o todo el historial. */
  function rankScore(key, value, scope) {
    var arr = state.scores[key] || [];
    var today = todayKey();
    var d = new Date();
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    var weekCutoff = d.getTime();
    var better = 0;
    for (var i = 0; i < arr.length; i++) {
      var e = arr[i];
      if (scope === "day" && todayKey(new Date(e.t)) !== today) continue;
      if (scope === "week" && e.t < weekCutoff) continue;
      if (e.v > value) better++;
    }
    return better + 1;
  }

  /**
   * Los temas con menos acierto, el mismo cálculo que alimenta la tarjeta
   * "Dónde flojeas" de la pantalla de progreso: solo cuenta un tema si ya
   * se ha intentado al menos `minAttempts` veces (si no, un solo fallo lo
   * pondría al 0% y distorsionaría la lista), ordenados de peor a mejor
   * acierto. `limit` recorta a los N peores; sin él devuelve todos los que
   * cumplen el mínimo.
   */
  function weakestThemes(minAttempts, limit) {
    var byTheme = state.stats.byTheme;
    var rows = [];
    for (var t in byTheme) {
      if (!window.THEMES.labels[t]) continue;
      var e = byTheme[t];
      var total = e.ok + e.ko;
      if (total < minAttempts) continue;
      rows.push({ id: t, n: total, pct: Math.round(e.ok / total * 100) });
    }
    rows.sort(function (a, b) { return a.pct - b.pct; });
    return limit ? rows.slice(0, limit) : rows;
  }

  /** Días consecutivos jugando, contando hasta hoy o hasta ayer. */
  function streak() {
    var days = state.stats.days;
    var d = new Date();
    if (!days[todayKey(d)]) d.setDate(d.getDate() - 1);
    var count = 0;
    while (days[todayKey(d)]) { count++; d.setDate(d.getDate() - 1); }
    return count;
  }

  function solvedToday() {
    return state.stats.days[todayKey()] || 0;
  }

  function reset() {
    state = clone(defaults);
    seenSet = {};
    try {
      window.localStorage.removeItem(KEY);
      window.localStorage.removeItem(THEME_KEY);
    } catch (e) { /* ignorar */ }
  }

  /** Todo el progreso como JSON, para guardarlo fuera del dispositivo. */
  function exportJson() {
    return JSON.stringify(state, null, 2);
  }

  /** Restaura el progreso desde un JSON de exportJson(). Lanza si el texto
   *  no tiene pinta de ser uno: mejor avisar que dejar a medias un progreso
   *  bueno con datos que no son de esta app. */
  function importJson(raw) {
    var parsed = JSON.parse(raw);
    if (typeof parsed.rating !== "number" || !parsed.stats || !parsed.settings) {
      throw new Error("No es un fichero de progreso de Táctica.");
    }
    state = merge(clone(defaults), parsed);
    seenSet = {};
    for (var i = 0; i < state.seen.length; i++) seenSet[state.seen[i]] = 1;
    save();
  }

  return {
    get state() { return state; },
    get seenSet() { return seenSet; },
    get settings() { return state.settings; },
    save: save,
    record: record,
    markSeen: markSeen,
    setRating: setRating,
    setRecord: setRecord,
    pushScore: pushScore,
    rankScore: rankScore,
    weakestThemes: weakestThemes,
    setSetting: setSetting,
    setLastRun: setLastRun,
    streak: streak,
    solvedToday: solvedToday,
    todayKey: todayKey,
    reset: reset,
    exportJson: exportJson,
    importJson: importJson
  };
})();
