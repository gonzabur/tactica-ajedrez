#!/usr/bin/env python3
"""Genera una variante con volumen ("Relieve") del juego de piezas cburnett.

No es una copia de ningún set comercial: es una paleta de tonos planos con
transición dura entre bandas (blanco/gris claro para blancas; gris claro,
gris medio y gris oscuro para negras), aplicada sobre las piezas de cburnett,
que ya están bajo GPLv2+ y por tanto se pueden modificar y redistribuir con
la misma licencia.

Decisiones de diseño, por orden de cómo se llegó a ellas:

  1. Un degradado en el propio relleno (no un filtro de iluminado tipo
     feDiffuseLighting/feSpecularLighting) es lo que da volumen real: esos
     filtros solo "ven" los bordes de una silueta, porque el canal alfa es
     constante por dentro, así que el interior se queda plano.

  2. El degradado usa gradientUnits="userSpaceOnUse" con las MISMAS
     coordenadas para toda la pieza, en vez de objectBoundingBox (que
     recalcula el ángulo de luz por cada elemento por separado). Si no, la
     dirección de la luz podía variar entre el cuerpo y la base de una misma
     pieza.

  3. La banda de luz ocupa más área que la de sombra (aprox. 65/35, no
     50/50): con un reparto igual, piezas anchas y poco altas como la torre
     se veían partidas en dos mitades iguales en vez de tener una sombra
     lateral creíble.

  4. En negras, el gris MEDIO es el que domina el cuerpo; el gris claro y el
     oscuro son solo filos estrechos en los bordes (luz/sombra), no bandas
     del mismo ancho que la base -- así es como chess.com trata sus piezas
     negras, y es el pedido explícito de esta variante.

  5. Las 5 bolitas de la corona de la Dama no pueden llevar el degradado
     lineal del resto: por su tamaño, cada una cae en una fase distinta del
     degradado y el resultado es inconsistente entre ellas (algunas casi
     planas, alguna con un corte diagonal feo). Llevan su propio degradado
     RADIAL, centrado en cada una, con luz arriba a la izquierda.

  6. Las piezas negras parten del MISMO dibujo que las blancas (wX.svg), no
     del bX.svg original -- que tiene pequeñas diferencias de geometría
     (radio de las bolitas distinto, algunos detalles sin contorno) por ser
     un dibujo aparte del mismo autor. Partir siempre de wX.svg garantiza
     que ambos colores comparten exactamente la misma silueta, y simplifica
     el código: ya no hace falta un tratamiento especial por cada pieza que
     en negro no llevaba fill explícito (bQ, bR, bP heredaban el negro por
     defecto de SVG, sin atributo propio).

  7. Único caso especial: el "ojo" del caballo (wN) va en fill="#000" en el
     dibujo original, como color de contraste FIJO contra el cuerpo, no como
     parte del cuerpo en sí. Si heredara el degradado del cuerpo, en la
     pieza negra se fundiría con él. Se mantiene sólido: negro en la pieza
     clara (igual que el original) y el tono de luz de la paleta oscura en
     la pieza oscura, para que siga contrastando -- tal como el propio
     cburnett hace en bN, donde ese detalle va en gris claro.
"""

import os
import re

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(HERE, "assets", "pieces", "cburnett")
OUT_DIR = os.path.join(HERE, "assets", "pieces", "cburnett3d")

# Solo se usan los dibujos blancos: son la base compartida por ambos colores.
BASE_NAMES = ["K", "Q", "R", "B", "N", "P"]

PALETTE = dict(
    white_light="#ffffff", white_shadow="#aeaeb8",
    black_highlight="#aeaeb8", black_base="#3a3a42", black_shadow="#121214",
)

# Coordenadas de luz, absolutas dentro del viewBox 0-45: luz desde la
# izquierda y ligeramente desde arriba, como corresponde a un sólido de
# revolución visto de perfil (la variación es sobre todo horizontal).
X1, Y1, X2, Y2 = 6, 15, 39, 25

# Centros y radio de las 5 bolitas de la corona de la Dama, decodificados de
# su <path> original ("M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0m16.5-4.5a2 2 0 1
# 1-4 0..."): cada subtrazo "a2 2 0 1 1" dibuja un círculo de radio 2.
Q_DOTS = [(6, 12), (14, 8.5), (22.5, 7.5), (31, 9), (39, 12)]
Q_DOT_R = 2


def _stops_white(light, shadow):
    return (f'<stop offset="0" stop-color="{light}"/>'
            f'<stop offset="0.62" stop-color="{light}"/>'
            f'<stop offset="0.72" stop-color="{shadow}"/>'
            f'<stop offset="1" stop-color="{shadow}"/>')


def _stops_black(highlight, base, shadow):
    return (f'<stop offset="0" stop-color="{highlight}"/>'
            f'<stop offset="0.1" stop-color="{highlight}"/>'
            f'<stop offset="0.18" stop-color="{base}"/>'
            f'<stop offset="0.8" stop-color="{base}"/>'
            f'<stop offset="0.88" stop-color="{shadow}"/>'
            f'<stop offset="1" stop-color="{shadow}"/>')


def _linear_grad(gid, stops):
    return (f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" '
            f'x1="{X1}" y1="{Y1}" x2="{X2}" y2="{Y2}">{stops}</linearGradient>')


def _dot_radial_white(gid, light, shadow):
    return (f'<radialGradient id="{gid}" cx="0.32" cy="0.3" r="0.85">'
            f'<stop offset="0" stop-color="{light}"/>'
            f'<stop offset="0.55" stop-color="{light}"/>'
            f'<stop offset="1" stop-color="{shadow}"/>'
            f'</radialGradient>')


def _dot_radial_black(gid, highlight, base, shadow):
    return (f'<radialGradient id="{gid}" cx="0.32" cy="0.3" r="0.9">'
            f'<stop offset="0" stop-color="{highlight}"/>'
            f'<stop offset="0.3" stop-color="{highlight}"/>'
            f'<stop offset="0.55" stop-color="{base}"/>'
            f'<stop offset="1" stop-color="{shadow}"/>'
            f'</radialGradient>')


DEFS = (
    _linear_grad("gW", _stops_white(PALETTE["white_light"], PALETTE["white_shadow"]))
    + _linear_grad("gB", _stops_black(PALETTE["black_highlight"], PALETTE["black_base"], PALETTE["black_shadow"]))
    + _dot_radial_white("gW-dot", PALETTE["white_light"], PALETTE["white_shadow"])
    + _dot_radial_black("gB-dot", PALETTE["black_highlight"], PALETTE["black_base"], PALETTE["black_shadow"])
)


def apply_relief(svg, base_letter, dark):
    """svg es siempre el dibujo BLANCO (wX.svg); dark dice si hay que
    pintarlo con la paleta oscura (para generar la pieza "negra") o clara."""
    body = re.sub(r"^<svg[^>]*>", "", svg)
    body = re.sub(r"</svg>\s*$", "", body).strip()

    if base_letter == "Q":
        dots_path = re.search(r'<path d="M8 12a2 2[^"]*"/>', body)
        assert dots_path, "no se encontró el path de las bolitas en wQ"
        dot_grad = "gB-dot" if dark else "gW-dot"
        circles = "".join(
            f'<circle cx="{cx}" cy="{cy}" r="{Q_DOT_R}" fill="url(#{dot_grad})"/>'
            for cx, cy in Q_DOTS
        )
        body = body[:dots_path.start()] + circles + body[dots_path.end():]

    body_grad = "gB" if dark else "gW"
    body = body.replace('fill="#fff"', f'fill="url(#{body_grad})"')

    if base_letter == "N":
        # el ojo: color de contraste fijo, no el gradiente del cuerpo
        eye_color = PALETTE["black_highlight"] if dark else "#000000"
        body = body.replace('fill="#000"', f'fill="{eye_color}"')

    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">'
        f"<defs>{DEFS}</defs>{body}</svg>"
    )


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for letter in BASE_NAMES:
        with open(os.path.join(SRC, f"w{letter}.svg"), encoding="utf-8") as fh:
            svg = fh.read().strip()
        for color, dark in (("w", False), ("b", True)):
            out = apply_relief(svg, letter, dark)
            with open(os.path.join(OUT_DIR, f"{color}{letter}.svg"), "w", encoding="utf-8") as fh:
                fh.write(out)
    print(f"Escritas 12 piezas con relieve en {OUT_DIR}")


if __name__ == "__main__":
    main()
