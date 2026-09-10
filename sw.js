/**
 * Service worker: guarda la app entera en el dispositivo la primera vez, para
 * que después funcione sin conexión (en el metro, en el avión, donde sea).
 *
 * Al cambiar cualquier fichero hay que subir CACHE_VERSION para que el móvil
 * se descargue la versión nueva.
 */
const CACHE_VERSION = "tactica-d1110047";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./vendor/chess.js",
  "./data/puzzles.js",
  "./js/pieces.js",
  "./js/themes.js",
  "./js/storage.js",
  "./js/rating.js",
  "./js/sound.js",
  "./js/data.js",
  "./js/board.js",
  "./js/puzzle.js",
  "./js/modes.js",
  "./js/play.js",
  "./js/app.js",
  "./assets/icon-180.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(ASSETS))
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

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  // Navegación: servir siempre la app aunque no haya red.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((response) => {
      // guardar lo que se vaya pidiendo, por si falta algo del precacheado
      if (response.ok && response.type === "basic") {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
      }
      return response;
    }))
  );
});
