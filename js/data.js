/**
 * Capa de acceso al banco de puzzles.
 *
 * data/puzzles.js entrega un unico bloque de texto ordenado por rating. Aqui se
 * indexa una sola vez al arrancar (ratings + listas por tema) y cada puzzle se
 * parsea solo cuando se va a jugar, para que el arranque en movil sea rapido.
 */
window.Data = (function () {
  var rows = [];            // linea cruda por puzzle, ordenadas por rating
  var ratings = null;       // Int16Array paralela a rows
  var themeIds = [];        // nombres de tema segun el indice del fichero
  var openingIds = [];
  var byTheme = {};         // tema -> array de indices (ascendente en rating)
  var loaded = false;

  function init() {
    if (loaded) return;
    var raw = window.PUZZLE_DATA;
    if (!raw) throw new Error("No se ha cargado data/puzzles.js");

    themeIds = raw.themes;
    openingIds = raw.openings;
    rows = raw.rows.split("\n");
    ratings = new Int16Array(rows.length);

    for (var i = 0; i < themeIds.length; i++) byTheme[themeIds[i]] = [];

    for (var r = 0; r < rows.length; r++) {
      var line = rows[r];
      // saltar los tres primeros campos (id, fen, jugadas) sin partir la cadena
      var a = line.indexOf("\t");
      var b = line.indexOf("\t", a + 1);
      var c = line.indexOf("\t", b + 1);
      var d = line.indexOf("\t", c + 1);
      var e = line.indexOf("\t", d + 1);

      ratings[r] = parseInt(line.slice(c + 1, d), 10);

      var themeField = line.slice(d + 1, e);
      var start = 0;
      while (start <= themeField.length) {
        var comma = themeField.indexOf(",", start);
        if (comma === -1) comma = themeField.length;
        var idx = parseInt(themeField.slice(start, comma), 10);
        if (!isNaN(idx)) byTheme[themeIds[idx]].push(r);
        start = comma + 1;
      }
    }

    loaded = true;
  }

  /** Convierte una linea cruda en el objeto que consume el resto de la app. */
  function get(index) {
    var f = rows[index].split("\t");
    return {
      index: index,
      id: f[0],
      fen: f[1],
      moves: f[2].split(" "),
      rating: parseInt(f[3], 10),
      themes: f[4] ? f[4].split(",").map(function (n) { return themeIds[+n]; }) : [],
      opening: f[5] ? openingIds[+f[5]] : null,
      url: "https://lichess.org/training/" + f[0]
    };
  }

  /** Primer indice cuyo rating es >= valor (busqueda binaria sobre `ratings`). */
  function lowerBound(value) {
    var lo = 0, hi = ratings.length;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (ratings[mid] < value) lo = mid + 1; else hi = mid;
    }
    return lo;
  }

  /** Igual pero sobre una lista de indices ya filtrada (por ejemplo, un tema). */
  function lowerBoundIn(list, value) {
    var lo = 0, hi = list.length;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (ratings[list[mid]] < value) lo = mid + 1; else hi = mid;
    }
    return lo;
  }

  /**
   * Elige un puzzle al azar dentro de una ventana de rating, ensanchandola si
   * hace falta hasta encontrar alguno que el jugador no haya visto todavia.
   * `exclude` es un objeto usado como conjunto de indices ya jugados.
   */
  function pick(opts) {
    var target = opts.rating;
    var span = opts.span || 60;
    var exclude = opts.exclude || {};
    var list = opts.theme ? byTheme[opts.theme] : null;
    if (opts.theme && (!list || !list.length)) return null;

    for (var attempt = 0; attempt < 7; attempt++) {
      var lo = target - span, hi = target + span;
      var from, to;
      if (list) {
        from = lowerBoundIn(list, lo);
        to = lowerBoundIn(list, hi + 1);
      } else {
        from = lowerBound(lo);
        to = lowerBound(hi + 1);
      }

      var size = to - from;
      if (size > 0) {
        // sondeo aleatorio: barato cuando casi todo esta sin jugar
        for (var probe = 0; probe < Math.min(size, 40); probe++) {
          var at = from + Math.floor(Math.random() * size);
          var idx = list ? list[at] : at;
          if (!exclude[idx]) return get(idx);
        }
        // ventana muy gastada: recorrerla entera antes de ensancharla
        var free = [];
        for (var k = from; k < to; k++) {
          var kd = list ? list[k] : k;
          if (!exclude[kd]) free.push(kd);
        }
        if (free.length) return get(free[Math.floor(Math.random() * free.length)]);
      }
      span = Math.round(span * 1.8) + 40;
    }

    // todo visto en ese rango: reciclar el mas cercano al objetivo
    var pool = list || null;
    var fallbackFrom = pool ? lowerBoundIn(pool, target - 400) : lowerBound(target - 400);
    var fallbackTo = pool ? lowerBoundIn(pool, target + 400) : lowerBound(target + 400);
    if (fallbackTo <= fallbackFrom) return pool && pool.length ? get(pool[0]) : get(0);
    var pickAt = fallbackFrom + Math.floor(Math.random() * (fallbackTo - fallbackFrom));
    return get(pool ? pool[pickAt] : pickAt);
  }

  function themeCount(theme) {
    return byTheme[theme] ? byTheme[theme].length : 0;
  }

  /** Rango de rating disponible para un tema, para acotar los selectores. */
  function themeRange(theme) {
    var list = byTheme[theme];
    if (!list || !list.length) return null;
    return { min: ratings[list[0]], max: ratings[list[list.length - 1]] };
  }

  return {
    init: init,
    get: get,
    pick: pick,
    themeCount: themeCount,
    themeRange: themeRange,
    get count() { return rows.length; },
    get ratingMin() { return ratings ? ratings[0] : 0; },
    get ratingMax() { return ratings ? ratings[ratings.length - 1] : 0; }
  };
})();
