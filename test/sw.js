/* ZoltanStudios Test & Tag Records — service worker
 *
 * Strategy:
 *   - App shell (html/js/css/icons): stale-while-revalidate. Loads instantly
 *     from cache, updates in the background, so a new upload is picked up on
 *     the next launch.
 *   - Anything under /api/: NEVER cached, always network. Caching auth or job
 *     data would serve stale records and break the session check.
 *
 * Bump CACHE_VERSION whenever you upload new app files.
 */

const CACHE_VERSION = "zs-testtag-v2.7.0";
const SHELL_CACHE = CACHE_VERSION + "-shell";

const SHELL_ASSETS = [
  "testtag-app.html",
  "testtag-app.js",
  "testtag-app.css",
  "testtag-react.min.js",
  "testtag-react-dom.min.js",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-192.png",
  "icon-maskable-512.png",
  "apple-touch-icon.png",
  "qrcode.js",
  "capture.html",
];

// ---------------------------------------------------------------- install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // addAll fails the whole install if any single file 404s, so add
      // them individually and tolerate misses.
      Promise.all(
        SHELL_ASSETS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {})
        )
      )
    ).then(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------------- activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("zs-testtag-") && k !== SHELL_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------- fetch
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GETs from our own origin
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Never touch the API — session state and job data must always be live
  if (url.pathname.includes("/api/")) return;

  // Navigation requests: serve the app shell, fall back to cache offline
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches
            .match(req)
            .then((hit) => hit || caches.match("testtag-app.html"))
        )
    );
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// Allow the page to trigger an immediate update
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
