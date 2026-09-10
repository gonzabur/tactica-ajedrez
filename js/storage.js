/**
 * Persistencia en el propio navegador (localStorage). Todo el progreso vive en
 * el dispositivo: no hay cuentas ni servidor.
 */
window.Store = (function () {
  var KEY = "tactica.v1";
  var SEEN_CAP = 9000;      // puzzles recordados como vistos antes de reciclar
  var HISTORY_CAP = 400;

  var defaults = {
    rating: 1200,
    solvedCount: 0,
    seen: [],
    records: { survival: 0, rush3: 0, rush5: 0, streak: 0 },
    stats: { solved: 0, failed: 0, byTheme: {}, days: {}, history: [] },
    settings: { sound: true, coords: true, autoNext: true, animations: true },
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

  function setRecord(key, value) {
    if (value > (state.records[key] || 0)) {
      state.records[key] = value;
      save();
      return true;
    }
    return false;
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
    try { window.localStorage.removeItem(KEY); } catch (e) { /* ignorar */ }
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
    setLastRun: setLastRun,
    streak: streak,
    solvedToday: solvedToday,
    todayKey: todayKey,
    reset: reset
  };
})();
