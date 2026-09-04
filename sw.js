const CACHE_NAME = "cofre-cache-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Estratégia: cache-first (abre instantâneo, sem esperar a rede) com
// atualização em segundo plano — a próxima abertura já reflete o que mudou.
// Cobre também recursos de outra origem (ex: Google Fonts) para não
// depender da rede nas aberturas seguintes.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then((cached) => {
        const networkFetch = fetch(req).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", clone));
          return res;
        }).catch(() => cached);
        // Se já temos algo em cache, responde na hora; senão espera a rede.
        return cached || networkFetch;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return res;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
