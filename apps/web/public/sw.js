const VERSION = 'v1';
const STATIC_CACHE = `inventory-static-${VERSION}`;
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png'];
const CACHE_FIRST = [
  /^\/_next\/static\//,
  /^\/products\/[\w.-]+\.svg$/,
  /^\/icons\//,
  /^\/uploads\//,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function offlinePage() {
  return (await caches.match(OFFLINE_URL)) ?? Response.error();
}

async function networkOrOffline(request) {
  try {
    const response = await fetch(request);
    return response.status >= 502 && response.status <= 504 ? offlinePage() : response;
  } catch {
    return offlinePage();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkOrOffline(request));
    return;
  }

  if (CACHE_FIRST.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(cacheFirst(request));
  }
});
