/**
 * Rating del jugador, estilo Elo.
 *
 * Cada puzzle trae el rating con el que la comunidad de Lichess lo ha calibrado,
 * así que basta con tratarlo como un rival. El factor K empieza alto para que
 * los primeros puzzles te coloquen rápido en tu nivel y luego se estabiliza.
 */
window.Rating = (function () {
  var MIN = 400;
  var MAX = 3000;

  function expected(player, puzzleRating) {
    return 1 / (1 + Math.pow(10, (puzzleRating - player) / 400));
  }

  function kFactor(solvedCount) {
    if (solvedCount < 20) return 60;
    if (solvedCount < 60) return 36;
    if (solvedCount < 200) return 24;
    return 16;
  }

  /**
   * Devuelve el nuevo rating y la variación. `score` es 1 si se resolvió a la
   * primera y 0 si hubo fallo o se pidió ayuda.
   */
  function update(player, puzzleRating, score, solvedCount) {
    var k = kFactor(solvedCount);
    var delta = k * (score - expected(player, puzzleRating));
    // los puzzles muy por debajo de tu nivel no deben regalar puntos ni hundirte
    delta = Math.max(-40, Math.min(40, delta));
    var next = Math.max(MIN, Math.min(MAX, player + delta));
    return { rating: next, delta: Math.round(next - player) };
  }

  /** Dificultad objetivo para el modo clasificado: un pelín por encima. */
  function targetFor(player) {
    return Math.max(MIN, Math.min(MAX, Math.round(player + 30)));
  }

  return { update: update, expected: expected, targetFor: targetFor, MIN: MIN, MAX: MAX };
})();
