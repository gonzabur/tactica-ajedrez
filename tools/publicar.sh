#!/bin/bash
# Publica los cambios de Táctica en GitHub Pages.
#
#   ./tools/publicar.sh "Descripción del cambio"
#
# Además de subir, hace lo que es fácil olvidar: rehacer dist/ y cambiar la
# versión de caché del service worker, sin lo cual los móviles que ya tienen la
# app instalada seguirían usando la versión antigua.

set -e
cd "$(dirname "$0")/.."

echo "· Rehaciendo dist/ ..."
python3 tools/build_single.py

# La versión de caché se deriva del contenido de la app: solo cambia cuando algo
# ha cambiado de verdad, así que no se invalida la caché sin motivo.
HUELLA=$(cat index.html css/styles.css js/*.js data/puzzles.js \
              vendor/chess.js manifest.webmanifest | shasum | cut -c1-8)
sed -i '' "s|^const CACHE_VERSION = .*|const CACHE_VERSION = \"tactica-$HUELLA\";|" sw.js
echo "· Versión de caché: tactica-$HUELLA"

git add -A
if git diff --cached --quiet; then
  echo "No hay nada que publicar."
  exit 0
fi

git commit -q -m "${1:-Actualiza Táctica}"
git push -q origin main
echo "· Subido. GitHub tarda un minuto en servir la versión nueva."

URL=$(gh repo view --json homepageUrl -q .homepageUrl 2>/dev/null || true)
[ -n "$URL" ] && echo "· $URL"
