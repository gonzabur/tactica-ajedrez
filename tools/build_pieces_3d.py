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

  8. Rey, Torre, Alfil y Caballo llevan una base propia (KING_BODY,
     ROOK_BODY, BISHOP_BODY, KNIGHT_BODY, más abajo) en vez de partir de
     wK/wR/wB/wN.svg tal cual: la base de esas 4 piezas es el mismo pie
     acampanado de la Dama (BASE_OUTLINE, solo su banda más baja, no las 3
     bandas completas del collar), trasplantado y ajustado a mano pieza por
     pieza tras muchas rondas de prueba. Dama y Peón sí siguen leyendo su
     wQ.svg/wP.svg original sin tocar. El degradado (gradientUnits=
     "userSpaceOnUse") sigue dando una dirección de luz consistente aunque
     alguna pieza use su propio <g transform="translate(...)">, porque el
     transform desplaza a la vez la geometría y el sistema de coordenadas
     en el que se evalúa el degradado -- el resultado es el mismo que si se
     hubiera "horneado" el desplazamiento directamente en los números.
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

# El pie que se trasplanta a Rey/Torre/Alfil/Caballo: solo la banda más baja
# de la base de la Dama (el pie acampanado en sí, no las 2 bandas de arriba
# que son la transición cuello/cintura -- ver commit anterior para el
# análisis completo). Path calcado del segundo <path> de anillos de wQ.svg
# ("M12 33.5c6-1 15-1 21 0") como borde superior, cerrando el resto con los
# propios segmentos del contorno ondulado original de wQ.svg.
BASE_OUTLINE = (
    "M12 33.5"
    "C10.5 34.5 10.5 36 10.5 36"
    "C9 37.5 11 38.5 11 38.5"
    "C17.5 39.5 27.5 39.5 34 38.5"
    "C34 38.5 35.5 37.5 34 36"
    "C34 36 34.5 34.5 33 33.5"
    "C27 32.5 18 32.5 12 33.5"
    "Z"
)
BASE_X0, BASE_Y0 = 12, 33.5


def _base_svg(x0, y0):
    """El pie de la Dama sin reescalar -- mismo tamaño exacto que en la
    propia Dama, solo trasladado a (x0,y0) (su esquina superior izquierda)."""
    t = f"translate({x0 - BASE_X0},{y0 - BASE_Y0})"
    return f'<g transform="{t}"><path fill="#fff" stroke-linecap="butt" d="{BASE_OUTLINE}"/></g>'


# Rey: se conserva el cuerpo original (brazos, corona, cintura recta con su
# primer anillo) hasta donde tocaba el segundo anillo (32.5,33.5)/(11.5,33.5)
# -- ancho 21, igual que el pie de la Dama -- así encajan sin ajustar nada.
KING_BODY = (
    '<path stroke-linejoin="miter" d="M22.5 11.63V6M20 8h5"/>'
    '<path fill="#fff" stroke-linecap="butt" stroke-linejoin="miter" '
    'd="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/>'
    '<path fill="#fff" stroke-linecap="butt" '
    'd="M32.5 33.5v-3.5s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4'
    '-3 6 5 10 5 10V33.5"/>'
    '<path d="M11.5 30c5.5-3 15.5-3 21 0"/>'
    + _base_svg(11.5, 33.5)
)

# Torre: cuerpo y almenas originales, con dos arreglos -- el path de las
# almenas empezaba en el punto equivocado en el wR.svg de partida (se
# corrigió a mano), y los techos de las 3 almenas se recalcularon para que
# formen un arco continuo (la central, más alta, casi plana; las laterales
# inclinadas hacia el centro). Todas las líneas horizontales llevan la
# misma curvatura suave que el borde del pie. Todo el conjunto se desplaza
# 2 unidades hacia abajo (translate) para que la franja de solape con el
# pie no se vea tan ancha -- el pie en sí NO se desplaza.
ROOK_BODY = (
    '<g transform="translate(0,2)">'
    '<path fill="#fff" stroke-linecap="butt" '
    'd="M11 14V9c1.33-.5 2.67-.9 4-1.15V11c1.25-1 3.75-1 5 0V7.1c1.25-.3 3.75-.3 5 0V11'
    'c1.25-1 3.75-1 5 0V7.85c1.33.25 2.67.75 4 1.15v5"/>'
    '<path fill="#fff" d="m34 14-3 3c-4.25-1-12.75-1-17 0l-3-3"/>'
    '<path fill="#fff" stroke-linecap="butt" stroke-linejoin="miter" '
    'd="M31 17v12.5c-4.25-1-12.75-1-17 0V17"/>'
    '<path stroke-linejoin="miter" d="M11 14c5.75-1 17.25-1 23 0"/>'
    '<path fill="#fff" stroke-linecap="butt" '
    'd="m31 29.5 1.5 2.5c-5-1-15-1-20 0l1.5-2.5"/>'
    '<path fill="#fff" stroke-linecap="butt" '
    'd="M12 36v-4c5.25-1 15.75-1 21 0v4c-5.25-1-15.75-1-21 0Z"/>'
    "</g>"
    + _base_svg(12, 33.5)
)

# Alfil: cúpula, cuello y el zigzag original entre cuello y cinturón, tal
# cual wB.svg (sin ninguna curva de más). Desde los dos puntos donde ese
# cuerpo toca el cinturón (30,30) y (15,30) bajan dos líneas rectas a 40°
# desde la vertical (no verticales) hasta el nivel del pie, terminando
# justo dentro de su borde (33/12) en vez de sobre él.
BISHOP_BODY = (
    '<path fill="#fff" stroke-linecap="butt" '
    'd="M32.937 33.5L30 30c0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5'
    ' 0 0-2.5 1.5-2.5 4L12.063 33.5"/>'
    '<path fill="#fff" d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/>'
    '<path stroke-linejoin="miter" d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5"/>'
    + _base_svg(12, 33.5)
)

# Caballo: no tenía base propia (solo la línea de suelo original), así que
# el pie de la Dama se superpone entero, anclado a la altura (y=33.5) donde
# su borde inferior cae justo en la antigua línea de suelo (y=39). A esa
# altura el lomo (curva derecha) y la quijada (curva izquierda) SÍ cruzan
# muy cerca de las esquinas del pie, así que ambas curvas se recortaron con
# partición exacta de Bezier (no a ojo) para terminar justo en esa esquina.
# El lomo y la quijada van en UN SOLO <path> (unidos por una línea recta a
# lo largo de y=33.5, donde ya se solapan con el pie) en vez de dos <path>
# sueltos: cada uno por separado, al ser una curva abierta, se cerraba solo
# con una línea recta larga entre sus dos extremos (de (22,10) a (38,33.5))
# para poder rellenarse -- eso creaba un triángulo de sombra visible de más
# cruzando el cuello en cuanto el relleno pasó de blanco liso a degradado.
KNIGHT_BODY = (
    '<path fill="#fff" stroke-linecap="butt" '
    'd="M22 10c9.52 0.91 15.35 6.75 15.97 23.5L16.88 33.5c2.79-3.44 7.55-5.08 6.12-15.5"/>'
    '<path fill="#fff" '
    'd="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3'
    "-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 "
    '1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"/>'
    '<path fill="#000" '
    'd="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0m5.433-9.75a.5 1.5 30 1 1-.866-.5'
    '.5 1.5 30 1 1 .866.5"/>'
    + _base_svg(16.88, 33.5)
)

CUSTOM_BODIES = {"K": KING_BODY, "R": ROOK_BODY, "B": BISHOP_BODY, "N": KNIGHT_BODY}


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


def _linear_grad(gid, stops, x1=X1, y1=Y1, x2=X2, y2=Y2):
    return (f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" '
            f'x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{stops}</linearGradient>')


# El Alfil es más estrecho/centrado que el resto: su punto más a la
# izquierda (cúpula + pie) nunca llega a proyectarse dentro de la banda de
# brillo 0-0.1 de la pieza negra (cae sobre t=~0.25 en la recta X1,Y1-X2,Y2
# compartida), así que esa banda le queda completamente fuera y la pieza
# negra sale sin brillo. En vez de tocar la recta compartida (que sí
# funciona bien para el resto), el Alfil usa su propia recta -- misma
# pendiente, reencuadrada para que su propio extremo más oscuro (t=0) y más
# claro (t=1) caigan justo en sus dos extremos reales.
BISHOP_X1, BISHOP_Y1, BISHOP_X2, BISHOP_Y2 = 14, 17.5, 39, 25


def _dot_radial_white(gid, light, mid, shadow):
    return (f'<radialGradient id="{gid}" cx="0.32" cy="0.3" r="0.85">'
            f'<stop offset="0" stop-color="{light}"/>'
            f'<stop offset="0.3" stop-color="{light}"/>'
            f'<stop offset="0.55" stop-color="{mid}"/>'
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
    + _linear_grad("gW-B", _stops_white(PALETTE["white_light"], PALETTE["white_shadow"]),
                   BISHOP_X1, BISHOP_Y1, BISHOP_X2, BISHOP_Y2)
    + _linear_grad("gB-B", _stops_black(PALETTE["black_highlight"], PALETTE["black_base"], PALETTE["black_shadow"]),
                   BISHOP_X1, BISHOP_Y1, BISHOP_X2, BISHOP_Y2)
    # las bolitas blancas llevan la misma sombra (mismo tramo final
    # base->shadow) que las negras, en vez de solo aclarar hacia un gris
    # claro apenas distinguible del blanco.
    + _dot_radial_white("gW-dot", PALETTE["white_light"], PALETTE["black_base"], PALETTE["black_shadow"])
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

    if base_letter == "B":
        body_grad = "gB-B" if dark else "gW-B"
    else:
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


def _load_svg(letter):
    """Rey/Torre/Alfil/Caballo usan su propia base (ver punto 8 más arriba);
    Dama y Peón siguen leyendo su wX.svg original de cburnett sin tocar."""
    if letter in CUSTOM_BODIES:
        body = CUSTOM_BODIES[letter]
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">'
            f'<g fill="none" fill-rule="evenodd" stroke="#000" stroke-linecap="round" '
            f'stroke-linejoin="round" stroke-width="1.5">{body}</g></svg>'
        )
    with open(os.path.join(SRC, f"w{letter}.svg"), encoding="utf-8") as fh:
        return fh.read().strip()


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for letter in BASE_NAMES:
        svg = _load_svg(letter)
        for color, dark in (("w", False), ("b", True)):
            out = apply_relief(svg, letter, dark)
            with open(os.path.join(OUT_DIR, f"{color}{letter}.svg"), "w", encoding="utf-8") as fh:
                fh.write(out)
    print(f"Escritas 12 piezas con relieve en {OUT_DIR}")


if __name__ == "__main__":
    main()
