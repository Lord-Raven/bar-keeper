self.addEventListener('install', event => {
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
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('found cached');
            return cachedResponse;
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