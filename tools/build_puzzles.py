#!/usr/bin/env python3
"""
Construye el banco de puzzles de la app a partir de la base de datos abierta de
Lichess (licencia CC0): https://database.lichess.org/#puzzles

Uso tipico:

    python3 tools/build_puzzles.py --download          # descarga y construye
    python3 tools/build_puzzles.py --csv /ruta/al.csv  # usa un CSV ya descompimido

El fichero completo son ~305 MB comprimidos (~6,1 M de puzzles) y se descarga
entero: un prefijo mas pequeno basta para las franjas de rating intermedias,
pero las mas altas (2800+, nivel de gran maestro) son tan escasas en la base
que hace falta el fichero completo para no quedarse corto ahi.

Salida: data/puzzles.js  -> un unico fichero ordenado por rating, con formato
linea a linea:  id \t fen \t jugadas(uci) \t rating \t indices-de-tema \t indice-apertura
"""

import argparse
import csv
import os
import random
import subprocess
import sys
from collections import defaultdict

CSV_URL = "https://database.lichess.org/lichess_db_puzzle.csv.zst"

# --- Criterios de calidad -------------------------------------------------
MIN_PLAYS = 60         # puzzles jugados suficientes veces (rating fiable)
MIN_POPULARITY = 85    # % de votos positivos de la comunidad
MAX_RATING_DEV = 90    # desviacion del rating: cuanto menor, mas asentado

RATING_MIN = 500
RATING_MAX = 2900
BAND = 100             # ancho de cada franja de dificultad

# Temas que son metadatos de la partida de origen, no motivos de ajedrez.
NON_THEMES = {"master", "masterVsMaster", "superGM", "advantage", "crushing", "equality"}

# Temas que la app ofrece como entrenamiento dirigido y que hay que garantizar.
CURATED_THEMES = [
    # fase de la partida
    "opening", "middlegame", "endgame",
    "pawnEndgame", "rookEndgame", "knightEndgame", "bishopEndgame",
    "queenEndgame", "queenRookEndgame",
    # motivos tacticos
    "fork", "pin", "skewer", "discoveredAttack", "doubleCheck", "deflection",
    "attraction", "interference", "clearance", "capturingDefender",
    "trappedPiece", "hangingPiece", "intermezzo", "sacrifice", "quietMove",
    "defensiveMove", "zugzwang", "xRayAttack", "advancedPawn", "promotion",
    "underPromotion", "enPassant", "castling",
    # mates
    "mateIn1", "mateIn2", "mateIn3", "mateIn4", "mateIn5", "mate",
    "backRankMate", "smotheredMate", "anastasiaMate", "arabianMate",
    "bodenMate", "dovetailMate", "hookMate", "doubleBishopMate",
    # ataque
    "kingsideAttack", "queensideAttack", "exposedKing",
    # longitud
    "oneMove", "short", "long", "veryLong",
]


class Reservoir:
    """Muestreo de reservorio: mantiene k elementos aleatorios de un flujo
    de tamano desconocido sin cargarlo entero en memoria."""

    __slots__ = ("k", "items", "seen", "rng")

    def __init__(self, k, rng):
        self.k = k
        self.items = []
        self.seen = 0
        self.rng = rng

    def offer(self, item):
        self.seen += 1
        if len(self.items) < self.k:
            self.items.append(item)
        else:
            j = self.rng.randrange(self.seen)
            if j < self.k:
                self.items[j] = item


def download_sample(dest_dir):
    """Descarga el fichero completo de Lichess (~305 MB) y lo descomprime."""
    os.makedirs(dest_dir, exist_ok=True)
    zst = os.path.join(dest_dir, "lichess_puzzles.zst")
    csv_path = os.path.join(dest_dir, "lichess_puzzles.csv")

    if not os.path.exists(csv_path):
        print(f"Descargando {CSV_URL} (~305 MB) ...")
        subprocess.run(["curl", "-#", "-o", zst, CSV_URL], check=True)
        print("Descomprimiendo ...")
        with open(csv_path, "wb") as out:
            subprocess.run(["zstd", "-dc", zst], stdout=out, check=True)
        os.remove(zst)
    else:
        print(f"Reutilizando {csv_path}")
    return csv_path


def collect(csv_path, per_band, theme_min, seed):
    """Recorre el CSV una sola vez y va reteniendo muestras por franja de
    rating y por tema, con memoria acotada."""
    rng = random.Random(seed)
    bands = defaultdict(lambda: Reservoir(per_band * 3, rng))
    themes = {t: Reservoir(theme_min * 3, rng) for t in CURATED_THEMES}

    total = kept = 0
    with open(csv_path, newline="", encoding="utf-8", errors="replace") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            total += 1
            try:
                rating = int(row["Rating"])
                plays = int(row["NbPlays"])
                pop = int(row["Popularity"])
                dev = int(row["RatingDeviation"])
            except (TypeError, ValueError, KeyError):
                continue  # fila con algun campo vacio o mal formado

            if not (RATING_MIN <= rating <= RATING_MAX):
                continue
            if plays < MIN_PLAYS or pop < MIN_POPULARITY or dev > MAX_RATING_DEV:
                continue

            row_themes = [t for t in (row["Themes"] or "").split() if t not in NON_THEMES]
            if not row_themes:
                continue

            fen = row["FEN"]
            moves = row["Moves"]
            if not fen or not moves or len(moves.split()) < 2:
                continue

            opening = (row.get("OpeningTags") or "").split()
            item = (
                row["PuzzleId"],
                fen,
                moves,
                rating,
                row_themes,
                opening[0] if opening else "",
            )
            kept += 1

            bands[rating // BAND].offer(item)
            for t in row_themes:
                res = themes.get(t)
                if res is not None:
                    res.offer(item)

    print(f"Leidas {total:,} filas; {kept:,} superan el filtro de calidad.")
    return bands, themes


def select(bands, themes, per_band, theme_min, seed):
    """Elige la muestra final: reparto uniforme por dificultad y despues
    relleno por tema para que ningun entrenamiento se quede corto."""
    rng = random.Random(seed + 1)
    chosen = {}

    for band_key in sorted(bands):
        pool = bands[band_key].items
        rng.shuffle(pool)
        for item in pool[:per_band]:
            chosen[item[0]] = item

    added = 0
    for theme in CURATED_THEMES:
        have = sum(1 for it in chosen.values() if theme in it[4])
        if have >= theme_min:
            continue
        pool = [it for it in themes[theme].items if it[0] not in chosen]
        # repartir el relleno por dificultad, no solo por el centro de la campana
        pool.sort(key=lambda it: (it[3], it[0]))
        need = theme_min - have
        if pool:
            step = max(1, len(pool) // max(need, 1))
            for it in pool[::step][:need]:
                chosen[it[0]] = it
                added += 1

    print(f"Seleccionados {len(chosen):,} puzzles ({added:,} anadidos para cubrir temas).")
    return sorted(chosen.values(), key=lambda it: (it[3], it[0]))


def write_js(puzzles, out_path):
    """Escribe data/puzzles.js: cabecera con catalogos + bloque de texto plano
    ordenado por rating (una linea por puzzle)."""
    theme_ids = sorted({t for it in puzzles for t in it[4]})
    theme_pos = {t: i for i, t in enumerate(theme_ids)}
    opening_ids = sorted({it[5] for it in puzzles if it[5]})
    opening_pos = {o: i for i, o in enumerate(opening_ids)}

    lines = []
    for pid, fen, moves, rating, tlist, opening in puzzles:
        tidx = ",".join(str(theme_pos[t]) for t in sorted(tlist, key=theme_pos.get))
        oidx = str(opening_pos[opening]) if opening else ""
        lines.append(f"{pid}\t{fen}\t{moves}\t{rating}\t{tidx}\t{oidx}")

    body = "\n".join(lines)
    if "`" in body or "\\" in body or "${" in body:
        raise SystemExit("Caracter inesperado en los datos: revisar el escapado.")

    ratings = [it[3] for it in puzzles]
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write("// Generado por tools/build_puzzles.py -- no editar a mano.\n")
        fh.write("// Puzzles de la base de datos abierta de Lichess (CC0).\n")
        fh.write("window.PUZZLE_DATA = {\n")
        fh.write("  version: 1,\n")
        fh.write(f"  count: {len(puzzles)},\n")
        fh.write(f"  ratingMin: {ratings[0]},\n")
        fh.write(f"  ratingMax: {ratings[-1]},\n")
        fh.write(f"  themes: {list_js(theme_ids)},\n")
        fh.write(f"  openings: {list_js(opening_ids)},\n")
        fh.write("  rows: `")
        fh.write(body)
        fh.write("`\n};\n")

    size = os.path.getsize(out_path)
    print(f"Escrito {out_path} ({size / 1024 / 1024:.2f} MB, {len(puzzles):,} puzzles)")
    return theme_ids, theme_pos


def list_js(values):
    return "[" + ",".join('"' + v.replace('"', '\\"') + '"' for v in values) + "]"


def report(puzzles, theme_ids):
    counts = defaultdict(int)
    for it in puzzles:
        for t in it[4]:
            counts[t] += 1
    print("\nCobertura por tema entrenable:")
    for t in CURATED_THEMES:
        print(f"  {t:22s} {counts.get(t, 0):6,d}")

    print("\nReparto por dificultad:")
    bands = defaultdict(int)
    for it in puzzles:
        bands[it[3] // 200 * 200] += 1
    for b in sorted(bands):
        print(f"  {b:4d}-{b + 199:4d}  {bands[b]:6,d}  {'#' * (bands[b] // 60)}")


def main():
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--csv", help="CSV de puzzles de Lichess ya descomprimido")
    ap.add_argument("--download", action="store_true", help="descargar la muestra de Lichess")
    ap.add_argument("--cache-dir", default=os.path.join(here, ".cache"))
    ap.add_argument("--out", default=os.path.join(here, "data", "puzzles.js"))
    ap.add_argument("--per-band", type=int, default=2400, help=f"puzzles por franja de {BAND} puntos")
    ap.add_argument("--theme-min", type=int, default=880, help="minimo garantizado por tema")
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()

    csv_path = args.csv
    if not csv_path:
        if not args.download:
            sys.exit("Indica --csv RUTA o usa --download")
        csv_path = download_sample(args.cache_dir)
    if not os.path.exists(csv_path):
        sys.exit(f"No existe {csv_path}")

    csv.field_size_limit(1 << 20)
    bands, themes = collect(csv_path, args.per_band, args.theme_min, args.seed)
    puzzles = select(bands, themes, args.per_band, args.theme_min, args.seed)
    theme_ids, _ = write_js(puzzles, args.out)
    report(puzzles, theme_ids)


if __name__ == "__main__":
    main()
