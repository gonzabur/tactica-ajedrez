#!/usr/bin/env python3
"""Empaqueta los juegos de piezas en un único js/pieces.js.

Así el tablero no hace decenas de peticiones extra y la app entera se puede
empaquetar en un solo fichero.

Cuidado con los identificadores: varios juegos definen degradados con ids
cortísimos (id="a", id="b") y los repiten en las doce piezas. Como en el tablero
conviven las 32 a la vez dentro del mismo documento, el navegador se queda con
la primera definición de cada id y las piezas negras acaban pintándose con el
degradado de las blancas. Por eso aquí se les pone a todos un prefijo único.

Los SVG originales se descargan del repositorio de Lichess:
    https://github.com/lichess-org/lila/tree/master/public/piece
"""

import json
import os
import re

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(HERE, "assets", "pieces")
OUT = os.path.join(HERE, "js", "pieces.js")

NAMES = ["wK", "wQ", "wR", "wB", "wN", "wP", "bK", "bQ", "bR", "bB", "bN", "bP"]

# Juegos incluidos, en el orden en que aparecen en Ajustes. El crédito se
# muestra en la propia app: son obras de otros y hay que citarlas.
SETS = [
    ("cburnett", "Clásicas",     "Colin M. L. Burnett · GPLv2+"),
    ("merida",   "Mérida",       "Armando Hernández Marroquín · GPLv2+"),
    ("chessnut", "Nítidas",      "Alexis Luengas · Apache 2.0"),
    ("celtic",   "Celtas",       "Maurizio Monge · MIT"),
    ("spatial",  "Espaciales",   "Maurizio Monge · MIT"),
    ("totoy",    "Trazo",        "Kosal Sen · CC BY 4.0"),
]


def namespace_ids(svg, prefix):
    """Prefija cada id del SVG y las referencias que apuntan a él."""
    ids = set(re.findall(r'\bid="([^"]+)"', svg))
    for old in sorted(ids, key=len, reverse=True):
        new = prefix + old
        svg = svg.replace(f'id="{old}"', f'id="{new}"')
        svg = svg.replace(f"url(#{old})", f"url(#{new})")
        svg = svg.replace(f'href="#{old}"', f'href="#{new}"')
    return svg


def load_piece(set_id, name):
    path = os.path.join(SRC, set_id, f"{name}.svg")
    with open(path, encoding="utf-8") as fh:
        svg = fh.read().strip()
    svg = re.sub(r"\s+", " ", svg)
    svg = namespace_ids(svg, f"{set_id}-{name}-")
    # el tablero decide el tamaño: la pieza siempre llena su casilla
    return svg.replace(
        "<svg ", '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" ', 1
    )


def main():
    sets = {}
    order = []
    for set_id, label, credit in SETS:
        folder = os.path.join(SRC, set_id)
        if not os.path.isdir(folder):
            print(f"  falta el juego {set_id}, se omite")
            continue
        sets[set_id] = {
            "name": label,
            "credit": credit,
            "pieces": {n: load_piece(set_id, n) for n in NAMES},
        }
        order.append(set_id)
        size = sum(len(v) for v in sets[set_id]["pieces"].values()) / 1024
        print(f"  {set_id:10s} {label:12s} {size:6.1f} KB")

    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("// Generado por tools/build_pieces.py -- no editar a mano.\n")
        fh.write("// Juegos de piezas de terceros; el crédito de cada uno va dentro\n")
        fh.write("// y se muestra en la pantalla de Ajustes.\n")
        fh.write("window.PIECE_SET_ORDER = ")
        json.dump(order, fh, ensure_ascii=False)
        fh.write(";\nwindow.PIECE_SETS = ")
        json.dump(sets, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write(";\n")

    print(f"\nEscrito {OUT} ({os.path.getsize(OUT) / 1024:.1f} KB, {len(sets)} juegos)")


if __name__ == "__main__":
    main()
