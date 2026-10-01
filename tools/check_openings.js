#!/usr/bin/env node
/**
 * Comprueba data/openings.js:
 *   1. que todas las jugadas son legales (chess.js),
 *   2. qué nombre le da la base de aperturas de Lichess a cada línea,
 *   3. la evaluación de Stockfish (local) tras cada jugada, y avisa si una
 *      jugada NUESTRA empeora mucho la posición.
 *
 *   node tools/check_openings.js [id-de-apertura]
 *   node tools/check_openings.js --pos "e4 e5 Nf3" […]   (3 mejores jugadas)
 *
 * Las evaluaciones y la base de nombres se guardan en tools/.cache.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { Chess } = require("../vendor/chess.js");

const ROOT = path.join(__dirname, "..");
const CACHE = path.join(__dirname, ".cache");
const DROP = 60; // centipeones que puede perder una jugada nuestra sin aviso

fs.mkdirSync(CACHE, { recursive: true });

function loadOpenings() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, "data/openings.js"), "utf8"), ctx);
  return ctx.window.OPENINGS;
}

async function ecoTable() {
  const file = path.join(CACHE, "eco.json");
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  const byFen = {};
  for (const f of ["a", "b", "c", "d", "e"]) {
    const res = await fetch(`https://raw.githubusercontent.com/lichess-org/chess-openings/master/${f}.tsv`);
    const rows = (await res.text()).trim().split("\n").slice(1);
    for (const row of rows) {
      const [eco, name, pgn] = row.split("\t");
      const g = new Chess();
      g.load_pgn(pgn);
      byFen[epd(g.fen())] = `${eco} ${name}`;
    }
  }
  fs.writeFileSync(file, JSON.stringify(byFen));
  return byFen;
}

// FEN sin los contadores de jugadas: la misma posición llegue como llegue
function epd(fen) { return fen.split(" ").slice(0, 4).join(" "); }

// --- motor: Stockfish local ------------------------------------------------
// (brew install stockfish). La nube de Lichess limita mucho las consultas.

const DEPTH = 20;
const STOCKFISH = ["/opt/homebrew/bin/stockfish", "/usr/local/bin/stockfish"]
  .find((p) => fs.existsSync(p)) || "stockfish";

const evalCache = (() => {
  const file = path.join(CACHE, "evals-stockfish.json");
  const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  return { data, save: () => fs.writeFileSync(file, JSON.stringify(data)) };
})();

let engine = null;
function startEngine() {
  const proc = require("child_process").spawn(STOCKFISH);
  let buffer = "";
  let waiter = null;
  proc.stdout.on("data", (chunk) => {
    buffer += chunk;
    let nl;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (waiter) waiter(line);
    }
  });
  const send = (cmd) => proc.stdin.write(cmd + "\n");
  send("setoption name Threads value 4");
  send("setoption name Hash value 256");
  engine = {
    /** Las `multipv` mejores jugadas: [{ cp (desde las blancas), pv: [uci…] }] */
    analyse(fen, multipv) {
      return new Promise((resolve) => {
        const lines = [];
        const whiteToMove = fen.split(" ")[1] === "w";
        waiter = (line) => {
          const m = line.match(/ multipv (\d+) .*score (cp|mate) (-?\d+).* pv (.*)$/);
          if (m && line.includes(` depth ${DEPTH} `)) {
            let cp = m[2] === "mate" ? (+m[3] > 0 ? 10000 : -10000) : +m[3];
            if (!whiteToMove) cp = -cp;
            lines[+m[1] - 1] = { cp, pv: m[4].split(" ") };
          }
          if (line.startsWith("bestmove")) { waiter = null; resolve(lines.filter(Boolean)); }
        };
        send("setoption name MultiPV value " + (multipv || 1));
        send("position fen " + fen);
        send("go depth " + DEPTH);
      });
    },
    quit() { send("quit"); }
  };
}

/** Evaluación en centipeones desde el punto de vista de las blancas. */
async function evaluate(fen) {
  const key = epd(fen);
  if (key in evalCache.data) return evalCache.data[key];
  if (!engine) startEngine();
  const lines = await engine.analyse(fen);
  const value = lines.length ? lines[0].cp : null;
  evalCache.data[key] = value;
  evalCache.save();
  return value;
}

/** Modo sondeo: node tools/check_openings.js --pos "e4 e5 Nf3 …" ["…"] */
async function probe(sequences) {
  for (const seq of sequences) {
    const g = new Chess();
    const bad = seq.split(" ").find((m) => !g.move(m));
    if (bad) { console.log(`${seq}  ✗ ilegal: ${bad}`); continue; }
    if (!engine) startEngine();
    const lines = await engine.analyse(g.fen(), 3);
    const out = lines.map((l) => {
      const t = new Chess(g.fen());
      const san = l.pv.slice(0, 4).map((u) => {
        const mv = t.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
        return mv ? mv.san : u;
      });
      return `${fmt(l.cp)} ${san.join(" ")}`;
    });
    console.log(`${seq}\n    ${out.join("  |  ")}`);
  }
}

function fmt(cp) {
  if (cp === null) return "  ?  ";
  if (Math.abs(cp) >= 10000) return cp > 0 ? " +M  " : " -M  ";
  return (cp >= 0 ? "+" : "") + (cp / 100).toFixed(2);
}

async function main() {
  if (process.argv[2] === "--pos") {
    await probe(process.argv.slice(3));
    engine && engine.quit();
    return;
  }
  const only = process.argv[2];
  const eco = await ecoTable();
  let problems = 0;

  for (const op of loadOpenings()) {
    if (only && op.id !== only) continue;
    const sign = op.color === "w" ? 1 : -1;
    console.log(`\n=== ${op.name} (${op.color === "w" ? "blancas" : "negras"})`);

    for (const line of op.lines) {
      console.log(`\n--- ${line.name}  [${line.id}]`);
      const g = new Chess();
      let prev = await evaluate(g.fen());
      let lastName = null;

      for (let i = 0; i < line.moves.length; i++) {
        const san = line.moves[i];
        const mv = g.move(san);
        if (!mv) {
          console.log(`  ✗ ILEGAL: jugada ${i} "${san}"`);
          problems++;
          break;
        }
        const cp = await evaluate(g.fen());
        const ours = (i % 2 === 0) === (op.color === "w");
        const name = eco[epd(g.fen())];
        if (name) lastName = name;

        let flag = "";
        if (ours && cp !== null && prev !== null && (prev - cp) * sign > DROP) {
          flag = `  ⚠ nuestra jugada pierde ${((prev - cp) * sign / 100).toFixed(2)}`;
          problems++;
        } else if (!ours && cp !== null && prev !== null && (cp - prev) * sign > DROP) {
          flag = `  (error del rival: +${((cp - prev) * sign / 100).toFixed(2)} para nosotros)`;
        }
        const num = Math.floor(i / 2) + 1 + (i % 2 ? "…" : ".");
        const note = line.notes && line.notes[i] ? "  ✎" : "";
        console.log(`  ${num.padEnd(4)} ${san.padEnd(6)} ${fmt(cp)}${note}${flag}`);
        prev = cp;
      }
      if (line.notes) {
        for (const k of Object.keys(line.notes)) {
          if (+k >= line.moves.length) { console.log(`  ✗ nota en la jugada ${k}, que no existe`); problems++; }
        }
      }
      console.log(`  Lichess: ${lastName || "(sin nombre)"}`);
    }
  }
  console.log(problems ? `\n${problems} aviso(s)` : "\nSin avisos");
  process.exitCode = problems ? 1 : 0;
  if (engine) engine.quit();
}

main();
