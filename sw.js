/**
 * Service worker: guarda la app entera en el dispositivo la primera vez, para
 * que después funcione sin conexión (en el metro, en el avión, donde sea).
 *
 * Al cambiar cualquier fichero hay que subir CACHE_VERSION para que el móvil
 * se descargue la versión nueva.
 */
const CACHE_VERSION = "tactica-2949d3a9";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css?v=2f61163d",
  "./vendor/chess.js",
  "./data/puzzles.js",
  "./data/openings.js",
  "./js/pieces.js",
  "./js/themes.js",
  "./js/storage.js",
  "./js/rating.js",
  "./js/sound.js",
  "./js/data.js",
  "./js/board.js",
  "./js/puzzle.js",
  "./js/modes.js",
  "./js/openings.js",
  "./js/play.js",
  "./js/app.js",
  "./js/version.js",
  "./assets/icon-180.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => Promise.all(ASSETS.map((url) =>
        fetch(url, { cache: "no-store" }).then((r) => cache.put(url, r))
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Red primero, pero sin esperar indefinidamente: con cobertura muy mala la
// petición no falla, se queda colgada, y la app se abría en blanco hasta
// recuperar señal. Pasado este tiempo se sirve lo guardado; si la red acaba
// respondiendo, actualiza la caché para la próxima vez.
const NETWORK_TIMEOUT = 3000;

function networkFirst(event, cacheKey, save) {
  const request = event.request;
  // no-store: si no, el propio navegador puede servir el CSS/JS desde SU
  // caché HTTP (la de GitHub Pages) aunque aquí pidamos red primero.
  const network = fetch(request, { cache: "no-store" }).then((response) => {
    if (save && response.ok && response.type === "basic") {
      const copy = response.clone();
      caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
    }
    return response;
  });
  event.waitUntil(network.catch(() => {}));
  // sin copia guardada no queda otra que seguir esperando a la red
  const fromCache = () => caches.match(cacheKey).then((hit) => hit || network);
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT)).then(fromCache);
  return Promise.race([network.catch(fromCache), timeout]);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  // Navegación: servir siempre la app aunque no haya red.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(event, "./index.html", false));
    return;
  }

  // El banco de puzzles (7 MB) casi nunca cambia: se sirve de la caché sin
  // volver a descargarlo en cada arranque. Cuando cambia, cambia también
  // CACHE_VERSION y el service worker nuevo lo descarga al instalarse.
  if (new URL(request.url).pathname.endsWith("/data/puzzles.js")) {
    event.respondWith(caches.match(request).then((hit) => hit || networkFirst(event, request, true)));
    return;
  }

  // Lo demás, red primero: así un cambio se ve al momento con conexión, sin
  // depender de que el usuario cierre y reabra la app para que entre la
  // versión nueva del service worker.
  event.respondWith(networkFirst(event, request, true));
});
