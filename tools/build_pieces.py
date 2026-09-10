#!/usr/bin/env python3
"""Empaqueta los SVG de las piezas en un unico js/pieces.js.

Asi el tablero no hace 12 peticiones extra y la app entera se puede empaquetar
en un solo fichero cuando haga falta. Las piezas son el juego "cburnett" de
Colin M. L. Burnett (CC BY-SA 3.0), tal y como lo distribuye Lichess.
"""

import json
import os
import re

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(HERE, "assets", "pieces")
OUT = os.path.join(HERE, "js", "pieces.js")

NAMES = ["wK", "wQ", "wR", "wB", "wN", "wP", "bK", "bQ", "bR", "bB", "bN", "bP"]


def main():
    pieces = {}
    for name in NAMES:
        with open(os.path.join(SRC, f"{name}.svg"), encoding="utf-8") as fh:
            svg = fh.read().strip()
        svg = re.sub(r"\s+", " ", svg)
        # el tablero controla el tamano: que el SVG llene siempre su casilla
        svg = svg.replace(
            "<svg ", '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" ', 1
        )
        pieces[name] = svg

    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("// Generado por tools/build_pieces.py -- no editar a mano.\n")
        fh.write("// Piezas 'cburnett' de Colin M. L. Burnett, CC BY-SA 3.0.\n")
        fh.write("window.PIECE_SVG = ")
        json.dump(pieces, fh, ensure_ascii=False, indent=0)
        fh.write(";\n")

    print(f"Escrito {OUT} ({os.path.getsize(OUT) / 1024:.1f} KB, {len(pieces)} piezas)")


if __name__ == "__main__":
    main()
