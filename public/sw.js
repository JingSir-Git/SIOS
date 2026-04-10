// SIOS Service Worker — Network-first with offline shell fallback
const CACHE_NAME = "sios-v1";
const SHELL_ASSETS = ["/", "/icon-192.svg", "/icon-512.svg"];

// Install: pre-cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
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

// Fetch: network-first for navigation & API; cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, chrome-extension, etc.
  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // API routes — always network, never cache
  if (url.pathname.startsWith("/api/")) return;

  // Navigation requests — network-first, fallback to cached shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Cache the latest version of the page
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match("/") || new Response("Offline", { status: 503 }))
    );
    return;
  }

  // Static assets — stale-while-revalidate
  if (
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|woff2?|ico)$/) ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const fetching = fetch(request).then((res) => {
            cache.put(request, res.clone());
            return res;
          });
          return cached || fetching;
        })
      )
    );
    return;
  }
});
