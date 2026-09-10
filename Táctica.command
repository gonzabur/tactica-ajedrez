#!/bin/bash
# Doble clic para jugar en este Mac. Cierra la ventana de Terminal para parar.
cd "$(dirname "$0")" || exit 1

PUERTO=8765
while lsof -i :$PUERTO >/dev/null 2>&1; do PUERTO=$((PUERTO + 1)); done

echo "Táctica en http://localhost:$PUERTO"
echo "Cierra esta ventana cuando termines."
( sleep 1; open "http://localhost:$PUERTO/index.html" ) &
python3 -m http.server "$PUERTO" --bind 127.0.0.1
