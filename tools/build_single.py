#!/usr/bin/env python3
"""Empaqueta toda la app (HTML + CSS + JS + puzzles + piezas) en un solo fichero.

Genera dos versiones:

  dist/tactica.html           HTML completo y autónomo. Se puede abrir con doble
                              clic, copiar a un pendrive o mandárselo por correo.
  dist/tactica-artifact.html  Solo el contenido, sin <html>/<head>/<body>, que es
                              lo que espera el publicador de artifacts.

Ninguna de las dos usa service worker: eso solo tiene sentido en la versión
servida desde una carpeta (index.html).
"""

import base64
import os
import re

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(HERE, "dist")

TITLE = "Táctica"


def read(*parts):
    with open(os.path.join(HERE, *parts), encoding="utf-8") as fh:
        return fh.read()


def guard(js, origin):
    """Un '</script>' dentro del código cerraría la etiqueta antes de tiempo."""
    if "</script" in js.lower():
        raise SystemExit(f"{origin} contiene '</script>': hay que escaparlo")
    return js


def collect():
    """Devuelve (estilos, scripts) leyendo lo que index.html enlaza, en su orden."""
    html = read("index.html")

    css = guard(read("css", "styles.css"), "styles.css")
    inline_style = re.search(r"<style>(.*?)</style>", html, re.S)
    if inline_style:
        css += "\n" + inline_style.group(1).strip()

    scripts = []
    for src in re.findall(r'<script src="([^"]+)"></script>', html):
        scripts.append((src, guard(read(*src.split("/")), src)))
    return css, scripts


def theme_bootstrap():
    """El script que estampa el tema antes del primer pintado. Va marcado con
    id="tema-inicial" en index.html porque el empaquetado debe conservarlo, a
    diferencia del registro del service worker, que aquí no tiene sentido."""
    html = read("index.html")
    found = re.search(r'<script id="tema-inicial">(.*?)</script>', html, re.S)
    if not found:
        raise SystemExit("falta el script tema-inicial en index.html")
    return found.group(1).strip()


def body(icon_data_uri=None):
    css, scripts = collect()
    parts = [
        f"<title>{TITLE}</title>",
        "<script>\n" + guard(theme_bootstrap(), "tema-inicial") + "\n</script>",
        "<style>\n" + css + "\n</style>",
    ]
    if icon_data_uri:
        parts.append(f'<link rel="apple-touch-icon" href="{icon_data_uri}">')
    parts.append('<div id="app"></div>')
    parts.append(
        '<div class="boot"><div class="boot-icon">♞</div><p>Cargando puzzles…</p></div>'
    )
    # el <body> lo pone el contenedor, así que la clase de carga se añade aquí
    parts.append("<script>document.body.classList.add('loading');</script>")
    for src, code in scripts:
        parts.append(f"<!-- {src} -->\n<script>\n{code}\n</script>")
    return "\n\n".join(parts)


def main():
    os.makedirs(DIST, exist_ok=True)

    with open(os.path.join(HERE, "assets", "icon-180.png"), "rb") as fh:
        icon = "data:image/png;base64," + base64.b64encode(fh.read()).decode("ascii")

    artifact = body()
    standalone = (
        "<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n"
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no">\n'
        '<meta name="theme-color" content="#12141a">\n'
        '<meta name="apple-mobile-web-app-capable" content="yes">\n'
        '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
        f'<meta name="apple-mobile-web-app-title" content="Táctica">\n'
        f'<link rel="apple-touch-icon" href="{icon}">\n'
        "</head>\n<body class=\"loading\">\n" + artifact + "\n</body>\n</html>\n"
    )

    for name, content in (("tactica-artifact.html", artifact), ("tactica.html", standalone)):
        path = os.path.join(DIST, name)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(content)
        print(f"{name}: {os.path.getsize(path) / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    main()
