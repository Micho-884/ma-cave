/* Ma Cave — module hors ligne.
   Garde l'application en mémoire sur l'iPad pour qu'elle s'ouvre sans internet.
   Quand une nouvelle version est mise en ligne, elle est téléchargée en arrière-plan
   et utilisée au lancement suivant. Les données de la cave ne passent jamais par ici. */
const VERSION = "ma-cave-1.1.1";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  const key = req.mode === "navigate" ? "./index.html" : req;
  const cacheP = caches.open(VERSION);
  const update = cacheP
    .then(cache => fetch(req).then(res => { if (res && res.ok) cache.put(key, res.clone()); return res; }))
    .catch(() => null);
  event.waitUntil(update.then(() => undefined));
  event.respondWith(
    cacheP.then(cache => cache.match(key, { ignoreSearch: true }))
      .then(cached => cached || update.then(res => res ||
        new Response("Ma Cave n'est pas encore installée sur cet appareil. Ouvrez-la une première fois avec internet.",
          { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })))
  );
});
