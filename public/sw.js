/**
 * Spellhand service worker — scoped narrowly to the MediaPipe assets.
 *
 * The HandLandmarker model (~6-8MB) and the tasks-vision WASM fileset live on
 * third-party CDNs. The browser's HTTP cache holds them only briefly and gets
 * evicted under memory pressure (common on mobile), so a returning visitor
 * re-downloads several MB on every cold /play visit. This SW persists those
 * exact requests in Cache Storage so they survive across sessions.
 *
 * Deliberately limited: only the two MediaPipe origins below are intercepted.
 * Every other request (app HTML, JS, CSS, API, Supabase) passes straight to
 * the network, so a deploy is never served stale.
 */

const CACHE = "spellhand-mediapipe-v1";

// Cache-first only for these prefixes. Bump CACHE when the pinned MediaPipe
// version changes so the activate handler purges the old assets.
const CACHEABLE = [
  "https://cdn.jsdelivr.net/npm/@mediapipe/",
  "https://storage.googleapis.com/mediapipe-models/",
];

self.addEventListener("install", () => {
  // Take over as soon as installed — no need to wait for all tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const cacheable = CACHEABLE.some((prefix) => request.url.startsWith(prefix));
  if (!cacheable) return; // let the network handle everything else

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(request);
      if (hit) return hit;

      try {
        const response = await fetch(request);
        // Cache complete (200) or opaque cross-origin responses. Skip partial
        // (206) responses — they're not safe to replay from cache.
        if (response && (response.status === 200 || response.type === "opaque")) {
          cache.put(request, response.clone());
        }
        return response;
      } catch (err) {
        // Offline and not cached yet — nothing we can do but surface the error.
        throw err;
      }
    }),
  );
});
