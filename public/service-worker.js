self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('image-cache').then(cache => {
      return cache.addAll([]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then((cacheResponse) => {
        if (cacheResponse) {
          return cacheResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          const clonedResponse = networkResponse.clone();
          caches.open('image-cache').then((cache) => {
            cache.put(event.request, networkResponse);
          });
          return clonedResponse;
        });
      })
    );
  }
});