self.addEventListener('install', event => {
  console.log('installing service worker');
  event.waitUntil(
    caches.open('image-cache').then(cache => {
      return cache.addAll([]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image') {
    console.log('service worker fielding request');
    event.respondWith(
      caches.match(event.request).then((cacheResponse) => {
        if (cacheResponse) {
          console.log('found cached');
          return cacheResponse;
        }
        console.log('not cached');
        return fetch(event.request).then((networkResponse) => {
          // Cache the fetched image
          caches.open('image-cache').then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        });
      })
    );
  }
});