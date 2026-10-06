# Táctica

**▶ https://gonzabur.github.io/tactica-ajedrez/**

Aplicación web de ajedrez con dos secciones: **Táctica** (puzzles) y
**Aperturas** (un repertorio que se aprende y se repasa). Sin límite diario, sin
cuentas y sin conexión. Pensada primero para el iPhone: se toca para mover, se
instala en la pantalla de inicio y funciona en el metro.

**68.782 puzzles** incluidos en el propio proyecto, de rating 500 a 2900,
sacados de la base de datos abierta de Lichess, y **11 aperturas con 54 líneas**
explicadas jugada a jugada.

El título de la pantalla de inicio es un desplegable: desde ahí se cambia entre
las dos secciones.

## Táctica: modos

| Modo | Qué es |
|---|---|
| **Supervivencia** | Empieza fácil y sube de dificultad con cada acierto. Tres fallos y se acaba. Guarda récord. |
| **Contrarreloj** | Lo mismo con reloj de 3 o 5 minutos, y 30 segundos como mucho por puzzle: si se agotan, cuenta como fallo. |
| **Clasificado** | Puzzles ajustados a tu rating, que sube o baja según aciertes. Es el que mide tu nivel. |
| **Entrenamiento** | Eliges tema (horquilla, clavada, finales de torres, mate en 2, aperturas…) y dificultad. Con pistas y solución. |
| **Aleatorio** | Dentro de Entrenamiento: un motivo distinto en cada puzzle y sin saber cuál toca. Recorre los 39 motivos antes de repetir ninguno, así que también salen los raros. |
| **Revisión** | Al terminar una partida de Supervivencia o Contrarreloj puedes repasar uno a uno los puzzles jugados, filtrando por los que fallaste, y volver a intentarlos sin prisa. Al fallar durante la partida **no se enseña la solución**, precisamente para que el repaso siga siendo un examen. |
| **Donde flojeas** | Dentro de Entrenamiento: solo los motivos en los que menos aciertas, según tus propias estadísticas. Bloqueado hasta que hay datos suficientes. |
| **Progreso** | Evolución del rating, precisión por tema, récords y calendario de actividad. |

Al terminar una partida de Supervivencia o Contrarreloj se muestra el puesto que
ocupa entre **tus** partidas de hoy, de la semana y de siempre, la racha más
larga, el puzzle más difícil resuelto y el tiempo medio por problema. El ranking
es personal: no hay servidor contra el que compararse.

## Aperturas

La idea es un repertorio pequeño que de verdad se recuerde, no un catálogo que
se mira una vez.

1. **Elegir.** Del catálogo se escogen unas pocas: dos o tres con blancas y, con
   negras, una respuesta a 1.e4 y otra a 1.d4. Cada apertura dice de qué estilo
   es y qué se busca con ella. Si al repertorio le falta algo (por ejemplo, no
   hay nada contra 1.d4), la app lo avisa.
2. **Aprender.** Cada línea se juega guiada sobre el tablero: se marca la jugada
   que toca y se explica por qué se hace. Después hay que repetirla de memoria
   («ahora inténtalo tú»): si pasan 10 segundos sin mover parpadea la pieza, y
   a los 15 también la casilla de destino. Si ese intento sale limpio, la línea
   queda aprendida; si hubo pista o fallo, se pide un segundo. Las líneas
   nuevas van de una apertura en una, terminando una antes de empezar la
   siguiente, y se recomiendan tres al día como mucho.
3. **Repasar.** Lo aprendido vuelve mezclado y ya sin guía, con repetición
   espaciada: una línea hecha bien a la primera tarda cada vez más en volver
   (1, 3, 7, 21 y 60 días); un fallo la devuelve al principio y además la hace
   salir otra vez al final de la sesión. Al terminar cada línea se muestra el
   nombre de la variante y el plan que sigue. Si hoy no toca nada, hay repaso
   libre de todo lo aprendido.

Al completar una línea, tanto al aprender como al repasar, el plan que sigue se
dibuja sobre el tablero con **flechas numeradas** en el orden en que se juegan:
naranja para tus jugadas, rojo para una pieza tuya que presiona una casilla y
azul para la respuesta habitual del rival. Están escritas a mano en el campo
`arrows` de cada línea y `tests.html` comprueba que todas son jugadas legales.

| Con blancas | Con negras contra 1.e4 | Con negras contra 1.d4 |
|---|---|---|
| Italiana | Caro-Kann | Gambito de dama declinado |
| Londres | 1…e5 (Abierta) | Eslava |
| Gambito de dama | Escandinava | India de rey |
| Ruy López (Española) | Siciliana Dragón | |

Las líneas están escritas a mano en `data/openings.js`. `tools/check_openings.js`
comprueba que todas las jugadas son legales, qué nombre da a cada línea la base
de aperturas de Lichess y, con un Stockfish local, que ninguna jugada propia
empeora la posición.

## Común a toda la app

En **Ajustes** se puede elegir tema claro u oscuro (o dejarlo en automático,
siguiendo al sistema), entre seis colores de tablero y entre siete juegos de
piezas. Uno de ellos, «Relieve», no es un juego descargado: `tools/build_pieces_3d.py`
toma las piezas planas de cburnett y les aplica un degradado de luz más un
filtro de brillo especular y sombra proyectada, dando un efecto de volumen
sin depender de ningún set con licencia dudosa (el estilo con sombreado tipo
chess.com es un diseño suyo, no algo que se pueda copiar). `build_pieces.py`
lo regenera solo si hace falta.

El nivel **Exigente** del entrenamiento sirve puzzles por encima de tu rating y
mueve ese listón según vayas acertando, de modo que la exigencia se mantenga a
medida que mejoras. Es el único nivel del entrenamiento que cuenta para tu
rating. En equilibrio acierta alrededor del 40% y sirve puzzles unos 75 puntos
por encima de tu nivel; los números están en `CHALLENGE_*`, en `js/modes.js`,
con la explicación de por qué son esos.

Bajo el tablero, en todos los modos, hay una barra con la notación de lo
jugado y flechas para retroceder y avanzar. La numeración es la real de la
partida de origen, que se saca del FEN. Cada jugada es pulsable para saltar a
esa posición; mientras se mira hacia atrás el tablero no admite jugadas y la
flecha de avanzar se pinta de color, que es el camino de vuelta. También
funcionan las flechas del teclado.

El zoom de pellizco está desactivado a propósito: en un tablero casi nunca es
intencionado y se dispara al apoyar el pulgar mientras se mueve una pieza. Como
Safari de iOS ignora `user-scalable=no` desde iOS 10, se hace cancelando los
gestos en `blockPinchZoom()` (`js/app.js`). Quien necesite ampliar tiene el zoom
del sistema en los ajustes de accesibilidad de iOS.

En horizontal la pantalla de juego pasa a dos columnas, con el tablero a todo
el alto.

Todo el progreso se guarda en el navegador del dispositivo. No hay cuentas ni
servidor. Como eso significa que se pierde si se borran los datos del
navegador, en Ajustes hay **Exportar** e **Importar**: un fichero JSON con el
rating, los récords, las estadísticas y el repertorio de aperturas. Al final de
Ajustes aparece la versión instalada y el commit del que sale.

## Cómo usarla

**En el Mac.** Doble clic en `Táctica.command`. Arranca un servidor local y abre
el navegador. Para cerrarla, cierra la ventana de Terminal.

**En el iPhone.** Abre https://gonzabur.github.io/tactica-ajedrez/ en Safari y
dale a Compartir → «Añadir a pantalla de inicio». A partir de ahí se abre como
una app, a pantalla completa y sin barra del navegador, y funciona sin conexión.

**Publicar cambios.** `./tools/publicar.sh "descripción del cambio"`. Rehace
`dist/`, sube el número de versión, sincroniza la versión de caché del service
worker, el `?v=` del CSS y el commit que se muestra en Ajustes, hace los commits
y sube; GitHub tarda un minuto en servir la versión nueva.

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
  openings.js            aperturas: repertorio, aprender guiado y repaso espaciado
  play.js                pantalla de juego
  app.js                 navegación y pantallas de inicio, temas y progreso
  themes.js              nombres y explicaciones de los temas, en castellano
  storage.js             progreso guardado en el dispositivo
  rating.js              cálculo del rating estilo Elo
  sound.js               efectos de sonido sintetizados (sin ficheros de audio)
  version.js             versión y commit que se muestran en Ajustes
  pieces.js              generado — las piezas en SVG
data/puzzles.js          generado — el banco de puzzles
data/openings.js         el repertorio de aperturas, escrito a mano
vendor/chess.js          reglas del ajedrez (chess.js 0.12.1, BSD)
sw.js                    caché para funcionar sin conexión
tests.html               comprobaciones de la lógica (Elo, escalada, ranking…); se abre en el navegador
tools/                   scripts para regenerar los datos, comprobarlos y publicar
dist/                    generado — la app en un solo fichero
```

## Regenerar los datos

Los ficheros generados ya están en el repositorio; solo hace falta rehacerlos
para cambiar el banco de puzzles.

```bash
python3 tools/build_puzzles.py --download   # descarga Lichess y reconstruye el banco
python3 tools/build_pieces.py               # reempaqueta las piezas (genera "Relieve" si hace falta)
python3 tools/build_icons.py                # regenera los iconos
python3 tools/build_single.py               # rehace dist/
node    tools/check_puzzles.js              # comprueba que todos son jugables
node    tools/check_openings.js             # comprueba las aperturas (legalidad, nombres y motor)
```

`build_puzzles.py` acepta `--per-band` y `--theme-min` para hacer el banco más
grande o más pequeño. Con los valores por omisión salen unos 68.800 puzzles y
6,8 MB (2,9 MB comprimidos, que es lo que de verdad baja el móvil la primera
vez). `--download` se trae ahora el fichero completo de Lichess (~305 MB): con
un prefijo parcial, las franjas de rating más altas —nivel de gran maestro—
se quedaban cortas.

**Importante:** al cambiar cualquier fichero de la app hay que subir
`CACHE_VERSION` en `sw.js`, o los dispositivos que ya la tengan guardada
seguirán usando la versión antigua. `tools/publicar.sh` lo hace solo; solo hay
que acordarse si se sube a mano.

## Créditos y licencias

- Puzzles: [base de datos abierta de Lichess](https://database.lichess.org/#puzzles) (CC0).
- Reglas del ajedrez: [chess.js](https://github.com/jhlywa/chess.js) 0.12.1 (BSD).
- Aperturas: líneas y explicaciones propias; los nombres de las variantes se
  contrastan con la [base de aperturas de Lichess](https://github.com/lichess-org/chess-openings) (CC0).
- Juegos de piezas, todos tomados del
  [repositorio de Lichess](https://github.com/lichess-org/lila/tree/master/public/piece):

  | Juego | Autor | Licencia |
  |---|---|---|
  | Clásicas (cburnett) | Colin M. L. Burnett | GPLv2+ |
  | Mérida | Armando Hernández Marroquín | GPLv2+ |
  | Nítidas (chessnut) | Alexis Luengas | Apache 2.0 |
  | Celtas | Maurizio Monge | MIT |
  | Espaciales (spatial) | Maurizio Monge | MIT |
  | Trazo (totoy) | Kosal Sen | CC BY 4.0 |
  | Relieve | Colin M. L. Burnett (variante con sombreado, generada por `tools/build_pieces_3d.py`) | GPLv2+ |

  Las licencias están tomadas de
  [COPYING.md de lila](https://github.com/lichess-org/lila/blob/master/COPYING.md).
  Al añadir un juego nuevo hay que comprobarlas ahí: varios de los juegos
  disponibles son CC BY-NC-SA, que prohíbe el uso comercial.
