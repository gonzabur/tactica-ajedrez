#!/usr/bin/env python3
"""Genera el icono de la app (SVG) y sus versiones PNG.

Los PNG hacen falta para el icono de la pantalla de inicio del iPhone, que no
acepta SVG. Se rasterizan con qlmanage, que viene de serie en macOS.
"""

import os
import re
import shutil
import subprocess
import tempfile

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(HERE, "assets")
SIZES = [180, 192, 512]        # 180 = pantalla de inicio de iOS

ICON_TEMPLATE = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8cbd72"/>
      <stop offset="1" stop-color="#5f8a49"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g opacity="0.13">
    <rect x="0"   y="0"   width="128" height="128" fill="#ffffff"/>
    <rect x="256" y="0"   width="128" height="128" fill="#ffffff"/>
    <rect x="128" y="128" width="128" height="128" fill="#ffffff"/>
    <rect x="384" y="128" width="128" height="128" fill="#ffffff"/>
    <rect x="0"   y="256" width="128" height="128" fill="#ffffff"/>
    <rect x="256" y="256" width="128" height="128" fill="#ffffff"/>
    <rect x="128" y="384" width="128" height="128" fill="#ffffff"/>
    <rect x="384" y="384" width="128" height="128" fill="#ffffff"/>
  </g>
  <g transform="translate(78 74) scale(7.9)">{piece}</g>
</svg>
"""


def inner_svg(path):
    """Devuelve el contenido de un SVG sin su etiqueta <svg> exterior."""
    with open(path, encoding="utf-8") as fh:
        svg = fh.read()
    body = re.sub(r"^.*?<svg[^>]*>", "", svg, flags=re.S)
    return re.sub(r"</svg>\s*$", "", body).strip()


def main():
    piece = inner_svg(os.path.join(ASSETS, "pieces", "wN.svg"))
    icon_path = os.path.join(ASSETS, "icon.svg")
    with open(icon_path, "w", encoding="utf-8") as fh:
        fh.write(ICON_TEMPLATE.format(piece=piece))
    print(f"Escrito {icon_path}")

    if not shutil.which("qlmanage"):
        print("qlmanage no disponible: se omiten los PNG")
        return

    for size in SIZES:
        with tempfile.TemporaryDirectory() as tmp:
            subprocess.run(
                ["qlmanage", "-t", "-s", str(size), "-o", tmp, icon_path],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False,
            )
            made = os.path.join(tmp, "icon.svg.png")
            if not os.path.exists(made):
                print(f"  no se pudo generar el PNG de {size}px")
                continue
            dest = os.path.join(ASSETS, f"icon-{size}.png")
            shutil.copyfile(made, dest)
            print(f"  {os.path.basename(dest)} ({os.path.getsize(dest) / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
