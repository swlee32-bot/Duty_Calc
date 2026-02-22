const CACHE_NAME = 'duty-calc-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// 1. 앱 설치 시 파일들을 기기에 저장(캐시)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// 2. 가짜 와이파이 무시 로직 (Cache First)
// 인터넷을 찾기 전에 무조건 기기에 저장된 캐시(HTML)를 먼저 보여줌
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 캐시에 파일이 있으면 즉시 반환 (인터넷 안 씀)
        if (response) {
          return response;
        }
        // 없으면 네트워크 시도
        return fetch(event.request);
      })
  );
});

// 3. 앱 업데이트 시 구버전 찌꺼기 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});