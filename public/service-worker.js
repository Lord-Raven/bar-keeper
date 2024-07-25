self.addEventListener('install', event => {
    event.waitUntil(
      caches.open('image-cache').then(cache => {
        return cache.addAll([]);
      })
    );
  });
  
  self.addEventListener('fetch', event => {
    if (event.request.url.includes('your-image-api-endpoint')) {
      event.respondWith(
        caches.match(event.request).then(response => {
          return response || fetch(event.request).then(fetchResponse => {
            return caches.open('image-cache').then(cache => {
              cache.put(event.request, fetchResponse.clone());
              return fetchResponse;
            });
          });
        })
      );
    }
  });