// 調酒酒吧 POS 系統 Service Worker
// 版本控制
const CACHE_NAME = 'cocktail-pos-v1.0.0';
const STATIC_CACHE_NAME = 'cocktail-pos-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'cocktail-pos-dynamic-v1.0.0';

// 需要緩存的靜態資源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  // CSS 和 JS 文件會在 build 時動態添加
];

// 需要緩存的 API 路徑模式
const CACHE_API_PATTERNS = [
  /^https:\/\/.*\.supabase\.co\/rest\/v1\//,
  
];

// 離線時的備用頁面
const OFFLINE_PAGE = '/index.html';

// === Service Worker 事件處理 ===

// 安裝事件 - 緩存靜態資源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting(); // 立即激活新的 SW
      })
      .catch((error) => {
        console.error('[SW] Error caching static assets:', error);
      })
  );
});

// 激活事件 - 清理舊緩存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 刪除舊版本的緩存
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('cocktail-pos-')) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated successfully');
        return self.clients.claim(); // 立即控制所有頁面
      })
  );
});

// 請求攔截 - 實現緩存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 只處理 GET 請求
  if (request.method !== 'GET') {
    return;
  }
  
  // 處理靜態資源
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAssets(request));
    return;
  }
  
  // 處理 API 請求
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequests(request));
    return;
  }
  
  // 處理導航請求（頁面）
  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequests(request));
    return;
  }
  
  // 其他請求使用網路優先策略
  event.respondWith(
    fetch(request).catch(() => {
      console.log('[SW] Network failed for:', request.url);
      return new Response('Offline', { status: 503 });
    })
  );
});

// === 緩存策略實現 ===

// 靜態資源 - 緩存優先策略
async function handleStaticAssets(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    return new Response('Asset not available offline', { status: 503 });
  }
}

// API 請求 - 網路優先，緩存備用策略
async function handleApiRequests(request) {
  try {
    // 嘗試網路請求
    const networkResponse = await fetch(request);
    
    // 只緩存成功的 GET 請求
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', request.url);
    
    // 網路失敗時嘗試使用緩存
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 如果是關鍵 API 請求，返回離線指示
    return new Response(
      JSON.stringify({
        error: 'OFFLINE_MODE',
        message: '目前處於離線模式，無法完成此操作'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 導航請求 - 緩存優先，網路備用
async function handleNavigationRequests(request) {
  try {
    // 嘗試網路請求
    const networkResponse = await fetch(request);
    
    // 緩存新的頁面
    const cache = await caches.open(STATIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation request failed, serving cached page');
    
    // 網路失敗時返回緩存的離線頁面
    const cachedResponse = await caches.match(OFFLINE_PAGE);
    return cachedResponse || new Response('Offline page not available', { 
      status: 503 
    });
  }
}

// === 工具函數 ===

function isStaticAsset(url) {
  return url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.jpeg') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.ico') ||
         url.pathname.endsWith('.woff') ||
         url.pathname.endsWith('.woff2');
}

function isApiRequest(url) {
  return CACHE_API_PATTERNS.some(pattern => pattern.test(url.href));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && 
          request.headers.get('accept').includes('text/html'));
}

// 監聽來自主線程的消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_CLEAR') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('cocktail-pos-')) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  }
});

// 定期清理過期緩存
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cleanup-cache') {
    event.waitUntil(cleanupExpiredCache());
  }
});

async function cleanupExpiredCache() {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const requests = await cache.keys();
  
  // 清理超過 24 小時的動態緩存
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 小時
  
  for (const request of requests) {
    const response = await cache.match(request);
    const dateHeader = response.headers.get('date');
    
    if (dateHeader) {
      const responseDate = new Date(dateHeader).getTime();
      if (now - responseDate > maxAge) {
        await cache.delete(request);
        console.log('[SW] Cleaned expired cache for:', request.url);
      }
    }
  }
}

console.log('[SW] Service Worker script loaded');