/* Stellaroid Earn service worker.
 *
 * Strategy (deliberately conservative for a dApp whose data is on-chain):
 *  - navigations:      network-first -> cached copy of that page -> /offline.html
 *  - /_next/static:    cache-first (content-hashed, immutable)
 *  - same-origin images/fonts/icons: stale-while-revalidate
 *  - /api/* and cross-origin (RPC, fonts CDN): untouched — always network
 *  - verification-critical pages (/proof, /talent, /opportunity) are never
 *    served from cache: a stale on-chain verdict is worse than no page.
 *
 * VERSION comes from the registration URL (/sw.js?v=<build id>, stamped per
 * deploy in next.config.ts), so every deploy re-installs the worker,
 * refreshes the precache, and purges the previous deploy's caches.
 */
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const STATIC_CACHE = `stellaroid-static-${VERSION}`;
const PAGE_CACHE = `stellaroid-pages-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const PAGE_CACHE_LIMIT = 30;

const PRECACHE = [
  OFFLINE_URL,
  "/logo.svg",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isCacheableAsset(url) {
  if (url.pathname.startsWith("/_next/static/")) return true;
  return /\.(?:png|svg|ico|webp|jpg|jpeg|gif|woff2?)$/.test(url.pathname);
}

/* On-chain verdicts must never be replayed from cache — a revoked credential
 * shown as "verified" inverts the product's guarantee. */
function isVerificationPage(url) {
  return /^\/(?:proof|talent|opportunity)(?:\/|$)/.test(url.pathname);
}

async function trimCache(cache, limit) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - limit; i += 1) {
    await cache.delete(keys[i]);
  }
}

async function networkFirstPage(request, cacheable) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (cacheable && response.status === 200) {
      await cache.put(request, response.clone());
      trimCache(cache, PAGE_CACHE_LIMIT);
    }
    return response;
  } catch {
    if (cacheable) {
      const cached = await cache.match(request);
      if (cached) return cached;
    }
    const offline = await caches.match(OFFLINE_URL);
    return offline ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.status === 200) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);
  return cached ?? (await refresh) ?? Response.error();
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Live data stays live: RPC proxies, event streams, health checks.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    // Framed navigations (/proof/[hash]/embed) carry frame-ancestors headers a
    // cached fallback can't reproduce — let the browser handle those natively.
    if (request.destination === "iframe" || request.destination === "frame") return;
    event.respondWith(networkFirstPage(request, !isVerificationPage(url)));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isCacheableAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
