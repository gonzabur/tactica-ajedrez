#!/usr/bin/env python3
"""Genera una variante con volumen ("Relieve") del juego de piezas cburnett.

No es una copia de ningún set comercial: es una técnica genérica de sombreado
(gradiente de luz + brillo especular en los bordes + sombra proyectada)
aplicada sobre las piezas planas de cburnett, que ya están bajo GPLv2+ y por
tanto se pueden modificar y redistribuir con la misma licencia.

Cada pieza original rellena su cuerpo con "#fff" (blancas) o "#000" (negras) --
salvo la torre, la dama y el peón negros, que no llevan fill explícito y
heredan el negro por defecto de SVG. Este script:

  1. Sustituye esos rellenos planos por un degradado diagonal (claro arriba a
     la izquierda, oscuro abajo a la derecha), que es lo que da la sensación
     de volumen -- un filtro por sí solo no puede hacer esto porque el canal
     alfa de una silueta rellena es constante por dentro, y por eso los
     filtros de iluminado SVG (feDiffuseLighting/feSpecularLighting) solo
     "ven" los bordes, no el interior.
  2. Envuelve la pieza en un filtro que añade un brillo especular en esos
     bordes (el reflejo de "plástico pulido") y una sombra proyectada suave.

Los pequeños detalles que el propio autor original ya dibujó en gris claro
sobre las piezas negras (el ojo del caballo, el filo de una diagonal) se
quedan intactos: no llevan "#fff" ni "#000", así que la sustitución no los
toca.
"""

import os
import re

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(HERE, "assets", "pieces", "cburnett")
OUT_DIR = os.path.join(HERE, "assets", "pieces", "cburnett3d")

NAMES = ["wK", "wQ", "wR", "wB", "wN", "wP", "bK", "bQ", "bR", "bB", "bN", "bP"]

# IDs simples a propósito: build_pieces.py namespacea cada juego con su propio
# prefijo al empaquetarlo (igual que hace con celtic o spatial), así que aquí
# no hace falta -- y si algún día se inspecciona una pieza suelta, se lee mejor.
DEFS_TEMPLATE = """<linearGradient id="gW" x1="0.2" y1="0.05" x2="0.7" y2="1">
<stop offset="0" stop-color="#ffffff"/><stop offset="0.55" stop-color="#f0f0f0"/><stop offset="1" stop-color="#c7c7cf"/>
</linearGradient>
<linearGradient id="gB" x1="0.2" y1="0.05" x2="0.7" y2="1">
<stop offset="0" stop-color="#5f5f66"/><stop offset="0.5" stop-color="#28282c"/><stop offset="1" stop-color="#050505"/>
</linearGradient>
<filter id="edge" x="-40%" y="-40%" width="180%" height="180%">
<feDropShadow dx="0" dy="1.2" stdDeviation="1" flood-color="#000" flood-opacity="0.4"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="0.9" result="blur"/>
<feSpecularLighting in="blur" surfaceScale="3.5" specularConstant="0.8" specularExponent="20" lighting-color="#ffffff" result="spec">
<fePointLight x="-30" y="-55" z="45"/>
</feSpecularLighting>
<feComposite in="spec" in2="SourceAlpha" operator="in" result="specClip"/>
<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="specClip"/></feMerge>
</filter>"""


def apply_relief(svg, name):
    """Sustituye los rellenos planos por los degradados y aplica el filtro."""
    color = "gW" if name[0] == "w" else "gB"

    body = re.sub(r"^<svg[^>]*>", "", svg)
    body = re.sub(r"</svg>\s*$", "", body).strip()

    replaced = [False]

    def sub_fill(pattern, grad):
        def _do(m):
            replaced[0] = True
            return f'fill="url(#{grad})"'
        return re.sub(pattern, _do, body)

    body = sub_fill(r'fill="#fff"', "gW")
    body = re.sub(r'fill="#000"', lambda m: (replaced.__setitem__(0, True) or 'fill="url(#gB)"'), body)

    if not replaced[0]:
        # bR, bQ y bP: ningún path lleva fill explícito, así que el color
        # base hay que dárselo al primer <g> o <path> de la pieza.
        body = re.sub(r"^<(g|path)\b", rf'<\1 fill="url(#{color})"', body, count=1)

    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">'
        f"<defs>{DEFS_TEMPLATE}</defs>"
        f'<g filter="url(#edge)">{body}</g>'
        f"</svg>"
    )


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for name in NAMES:
        with open(os.path.join(SRC, f"{name}.svg"), encoding="utf-8") as fh:
            svg = fh.read().strip()
        out = apply_relief(svg, name)
        with open(os.path.join(OUT_DIR, f"{name}.svg"), "w", encoding="utf-8") as fh:
            fh.write(out)
    print(f"Escritas 12 piezas con relieve en {OUT_DIR}")


if __name__ == "__main__":
    main()
