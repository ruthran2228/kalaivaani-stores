/* =============================================================
   KALAIVANI STORES — service worker (PWA)

   · Same-origin GET requests only — Supabase, Google Fonts and
     WhatsApp links always go straight to the network.
   · HTML pages: network-first (always fresh when online) with a
     cache fallback so browsing still works offline.
   · Assets (CSS/JS/images): cache-first — cache busting comes
     from the ?v= query on every asset link, so a new release
     simply fetches and caches the new URL.
   · CACHE version is bumped with each release (same value as the
     ?v= stamp); old caches are deleted on activate.
   ============================================================= */
const CACHE = "ks-cache-20261014a";

const CORE = [
  "/",
  "/index.html",
  "/style.css?v=20261014a",
  "/orders.css?v=20261014a",
  "/adminstyle.css?v=20261014a",
  "/theme.js?v=20261014a",
  "/config.js",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
  "/favicon-32.png",
  "/favicon-16.png",
  "/logo.svg",
  "/upi-qr.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }
  /* cross-origin (Supabase API, fonts, CDN) — never intercept */
  if (url.origin !== self.location.origin) return;

  /* HTML navigations: network first, cache as fallback */
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match("/index.html"))
        )
    );
    return;
  }

  /* everything else same-origin: cache first, refresh in background */
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) {
        fetch(req)
          .then((res) => {
            if (res && res.ok) {
              caches.open(CACHE).then((c) => c.put(req, res.clone())).catch(() => {});
            }
          })
          .catch(() => {});
        return hit;
      }
      return fetch(req).then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
