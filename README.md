# Táctica

Aplicación web de puzzles de ajedrez, sin límite diario y sin conexión. Pensada
primero para el iPhone: se toca para mover, se instala en la pantalla de inicio
y funciona en el metro.

**17.403 puzzles** incluidos en el propio proyecto, de rating 500 a 2900,
sacados de la base de datos abierta de Lichess.

## Modos

| Modo | Qué es |
|---|---|
| **Supervivencia** | Empieza fácil y sube de dificultad con cada acierto. Tres fallos y se acaba. Guarda récord. |
| **Contrarreloj** | Lo mismo con reloj de 3 o 5 minutos. |
| **Clasificado** | Puzzles ajustados a tu rating, que sube o baja según aciertes. Es el que mide tu nivel. |
| **Entrenamiento** | Eliges tema (horquilla, clavada, finales de torres, mate en 2, aperturas…) y dificultad. Con pistas y solución. |
| **Aleatorio** | Dentro de Entrenamiento: un motivo distinto en cada puzzle y sin saber cuál toca. Recorre los 39 motivos antes de repetir ninguno, así que también salen los raros. |
| **Revisión** | Al terminar una partida de Supervivencia o Contrarreloj puedes repasar uno a uno los puzzles jugados, filtrando por los que fallaste, y volver a intentarlos sin prisa. |
| **Progreso** | Evolución del rating, precisión por tema, récords y calendario de actividad. |

El nivel **Exigente** del entrenamiento sirve puzzles por encima de tu rating y
mueve ese listón según vayas acertando, de modo que la exigencia se mantenga a
medida que mejoras. Es el único nivel del entrenamiento que cuenta para tu
rating. En equilibrio acierta alrededor del 40% y sirve puzzles unos 75 puntos
por encima de tu nivel; los números están en `CHALLENGE_*`, en `js/modes.js`,
con la explicación de por qué son esos.

Todo el progreso se guarda en el navegador del dispositivo. No hay cuentas ni
servidor.

## Cómo usarla

**En el Mac.** Doble clic en `Táctica.command`. Arranca un servidor local y abre
el navegador. Para cerrarla, cierra la ventana de Terminal.

**En el iPhone.** Abre la dirección donde esté publicada, dale a Compartir →
«Añadir a pantalla de inicio». A partir de ahí se abre como una app, a pantalla
completa y sin barra del navegador.

**Sin nada de lo anterior.** `dist/tactica.html` es la app entera en un solo
fichero: se puede abrir con doble clic, copiar a un pendrive o guardar en
iCloud Drive.

## Estructura

```
index.html               la página; carga todo lo demás
css/styles.css           todos los estilos
js/
  data.js                índice del banco de puzzles (por rating y por tema)
  board.js               tablero: dibujo, arrastre táctil, coronación
  puzzle.js              resolución de un puzzle y respuestas del rival
  modes.js               reglas de cada modo de juego
  play.js                pantalla de juego
  app.js                 navegación y pantallas de inicio, temas y progreso
  themes.js              nombres y explicaciones de los temas, en castellano
  storage.js             progreso guardado en el dispositivo
  rating.js              cálculo del rating estilo Elo
  sound.js               efectos de sonido sintetizados (sin ficheros de audio)
  pieces.js              generado — las piezas en SVG
data/puzzles.js          generado — el banco de puzzles
vendor/chess.js          reglas del ajedrez (chess.js 0.12.1, BSD)
sw.js                    caché para funcionar sin conexión
tools/                   scripts para regenerar los datos y empaquetar
dist/                    generado — la app en un solo fichero
```

## Regenerar los datos

Los ficheros generados ya están en el repositorio; solo hace falta rehacerlos
para cambiar el banco de puzzles.

```bash
python3 tools/build_puzzles.py --download   # descarga Lichess y reconstruye el banco
python3 tools/build_pieces.py               # reempaqueta las piezas
python3 tools/build_icons.py                # regenera los iconos
python3 tools/build_single.py               # rehace dist/
node    tools/check_puzzles.js              # comprueba que todos son jugables
```

`build_puzzles.py` acepta `--per-band` y `--theme-min` para hacer el banco más
grande o más pequeño. Con los valores por omisión salen unos 17.000 puzzles y
1,7 MB.

**Importante:** al cambiar cualquier fichero de la app hay que subir
`CACHE_VERSION` en `sw.js`, o los dispositivos que ya la tengan guardada
seguirán usando la versión antigua.

## Créditos y licencias

- Puzzles: [base de datos abierta de Lichess](https://database.lichess.org/#puzzles) (CC0).
- Piezas: juego «cburnett» de Colin M. L. Burnett (CC BY-SA 3.0).
- Reglas del ajedrez: [chess.js](https://github.com/jhlywa/chess.js) 0.12.1 (BSD).
