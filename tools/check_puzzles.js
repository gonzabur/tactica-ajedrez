/**
 * Comprueba que todos los puzzles del banco se pueden reproducir de principio a
 * fin con el mismo motor que usa la app. Detecta datos corruptos, jugadas
 * ilegales o convenciones mal entendidas antes de que fallen en el móvil.
 *
 *   node tools/check_puzzles.js [nMuestras]
 */
const fs = require("fs");
const path = require("path");

const root = path.dirname(__dirname);

// chess.js es un script clásico: se evalúa a mano para sacar el constructor
const chessSrc = fs.readFileSync(path.join(root, "vendor", "chess.js"), "utf8");
const chessModule = { exports: {} };
new Function("exports", "module", chessSrc)(chessModule.exports, chessModule);
const Chess = chessModule.exports.Chess;

// data/puzzles.js asigna a window.PUZZLE_DATA
const dataSrc = fs.readFileSync(path.join(root, "data", "puzzles.js"), "utf8");
const scope = { window: {} };
new Function("window", dataSrc)(scope.window);
const DATA = scope.window.PUZZLE_DATA;

const rows = DATA.rows.split("\n");
const limit = process.argv[2] ? parseInt(process.argv[2], 10) : rows.length;

let checked = 0;
const problems = [];
const lengths = {};
let mateEnd = 0;

for (let i = 0; i < Math.min(limit, rows.length); i++) {
  const f = rows[i].split("\t");
  const [id, fen, movesRaw, rating] = f;
  const moves = movesRaw.split(" ");

  if (f.length !== 6) { problems.push(`${id}: ${f.length} campos en vez de 6`); continue; }

  let game;
  try {
    game = new Chess(fen);
  } catch (e) {
    problems.push(`${id}: FEN rechazado (${fen})`);
    continue;
  }
  if (game.fen().split(" ")[0] !== fen.split(" ")[0]) {
    problems.push(`${id}: el FEN no se cargó igual`);
    continue;
  }

  let ok = true;
  for (let m = 0; m < moves.length; m++) {
    const uci = moves[m];
    const move = game.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined
    });
    if (!move) {
      problems.push(`${id} (${rating}): jugada ilegal ${uci} en el índice ${m}`);
      ok = false;
      break;
    }
  }
  if (!ok) continue;

  lengths[moves.length] = (lengths[moves.length] || 0) + 1;
  if (game.in_checkmate()) mateEnd++;
  checked++;
}

console.log(`Comprobados ${checked.toLocaleString("es")} de ${Math.min(limit, rows.length).toLocaleString("es")} puzzles.`);
console.log(`Terminan en jaque mate: ${mateEnd.toLocaleString("es")} (${(mateEnd / checked * 100).toFixed(1)}%)`);
console.log("Longitud de la solución (nº de medias jugadas):");
Object.keys(lengths).map(Number).sort((a, b) => a - b).forEach((len) => {
  const paridad = len % 2 === 0 ? "par" : "IMPAR";
  console.log(`  ${String(len).padStart(2)} (${paridad}): ${lengths[len].toLocaleString("es")}`);
});

if (problems.length) {
  console.log(`\n${problems.length} PROBLEMAS:`);
  problems.slice(0, 20).forEach((p) => console.log("  " + p));
  process.exit(1);
}
console.log("\nSin problemas: todos los puzzles se reproducen correctamente.");
