// 앱 셸(HTML·아이콘)만 캐시한다.
// 카카오 SDK/API 응답은 약관상 저장하면 안 되고 항상 최신이어야 하므로 절대 캐시하지 않는다.
// 배포 때마다 VERSION을 올리면 이전 캐시가 정리된다.
const VERSION = 'foodmap-v2';
const SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // 같은 출처의 GET만 처리. 카카오·폰트 CDN 등 외부 요청은 건드리지 않는다.
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // 네트워크 우선 → 실패(오프라인) 시 캐시. 업데이트가 바로 반영된다.
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
