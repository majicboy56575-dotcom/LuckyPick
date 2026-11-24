// ============================================
// LuckyPick - Service Worker (PWA install support)
// Intentionally does NOT cache app code: the site relies on
// versioned imports + no-cache headers, so stale files must never be served.
// Only page navigations get an offline fallback screen.
// ============================================
const SW_VERSION = 'lp-sw-v1';

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>럭키픽 - 오프라인</title></head>
<body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f9ff;color:#0b1c30;text-align:center;">
  <div style="padding:24px;">
    <div style="font-size:48px;margin-bottom:12px;">📡</div>
    <h2 style="margin:0 0 8px;font-size:18px;">인터넷 연결을 확인해주세요</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#424754;">네트워크에 연결되면 럭키픽을 다시 불러옵니다.</p>
    <button onclick="location.reload()" style="padding:12px 28px;border:0;border-radius:999px;background:#0058be;color:#fff;font-weight:700;font-size:14px;">다시 시도</button>
  </div>
</body></html>`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Leave every non-navigation / non-GET request (APIs, Danal POST returns, assets) untouched.
  if (req.method !== 'GET' || req.mode !== 'navigate') return;

  event.respondWith(
    fetch(req).catch(() =>
      new Response(OFFLINE_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    )
  );
});
