const CACHE_NAME = 'djsports-v1';
const urlsToCache = [
  '/',
  '/playlists',
  '/match'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});