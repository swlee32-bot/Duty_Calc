const CACHE_NAME = 'duty-calc-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'  // 👈 아이콘 추가 (오프라인에서도 앱 아이콘 유지)
];
const TIMEOUT_DURATION = 3000; // 3초 타임아웃 방패

// ⏱️ 타임아웃이 적용된 커스텀 fetch (가짜 와이파이 무한 로딩 차단)
const fetchWithTimeout = async (request, timeout) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error; // 3초가 넘으면 강제로 에러를 발생시켜 브라우저 멈춤 방지
  }
};

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

// 2. 앱 업데이트 시 구버전 찌꺼기 완벽 삭제
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

// 3. 가짜 와이파이 무시 & Cache First 전략
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // 캐시에 파일이 있으면 즉시 반환 (0.1초 로딩)
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // 캐시에 없으면 타임아웃을 걸어서 네트워크 시도 (가짜 와이파이 방어)
        return fetchWithTimeout(event.request, TIMEOUT_DURATION).catch(() => {
          // 통신 실패/지연 시 앱이 멈추지 않고 메인 화면으로 되돌아감
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('오프라인 상태입니다.', { status: 503 });
        });
      })
  );
});
