#!/bin/bash
# Publica los cambios de Táctica en GitHub Pages.
#
#   ./tools/publicar.sh "Descripción del cambio"
#
# Hace lo que es fácil olvidar en cada release: rehacer dist/, y sincronizar
# los valores que dependen unos de otros -- CACHE_VERSION del service worker,
# el "?v=" del CSS (para que un iPhone con la app ya instalada no se quede
# con el CSS viejo pese a todo lo demás) y el commit que se muestra en
# Ajustes -- sin eso, los móviles que ya tienen la app instalada se quedan
# con la versión vieja.

set -e
cd "$(dirname "$0")/.."

echo "· Rehaciendo dist/ ..."
python3 tools/build_single.py

# El CSS es el fichero que más veces se ha quedado pegado en caché en iOS:
# una URL nueva por versión es la única forma fiable de evitarlo. Se deriva
# del contenido, así que solo cambia cuando el CSS cambia de verdad.
CSS_V=$(shasum css/styles.css | cut -c1-8)
sed -i '' "s|css/styles\.css?v=[a-f0-9]*|css/styles.css?v=$CSS_V|" index.html sw.js

git add -A
if git diff --cached --quiet; then
  echo "No hay nada que publicar."
  exit 0
fi
git commit -q -m "${1:-Actualiza Táctica}"

# El commit mostrado en Ajustes es el que se acaba de crear, así que hace
# falta un segundo commit para rellenarlo -- no se puede saber el hash antes
# de que el commit exista.
COMMIT=$(git rev-parse --short HEAD)
sed -i '' "s|var BUILD = \".*\";|var BUILD = \"$COMMIT\";|" index.html
sed -i '' "s|window.APP_COMMIT = \".*\";|window.APP_COMMIT = \"$COMMIT\";|" js/version.js

# La versión de caché se deriva del contenido final de la app (ya con el
# commit relleno): solo cambia cuando algo ha cambiado de verdad.
HUELLA=$(cat index.html css/styles.css js/*.js data/puzzles.js \
              vendor/chess.js manifest.webmanifest | shasum | cut -c1-8)
sed -i '' "s|^const CACHE_VERSION = .*|const CACHE_VERSION = \"tactica-$HUELLA\";|" sw.js
echo "· Versión de caché: tactica-$HUELLA"

git add sw.js index.html js/version.js
git commit -q -m "Sincroniza versión de caché y commit mostrado en Ajustes ($COMMIT)"

git push -q origin main
echo "· Subido. GitHub tarda un minuto en servir la versión nueva."

URL=$(gh repo view --json homepageUrl -q .homepageUrl 2>/dev/null || true)
[ -n "$URL" ] && echo "· $URL"
