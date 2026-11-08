/* Decision Capsule · Service Worker
   目标：安装到主屏幕后完全离线可用（应用数据本身在 localStorage）。
   策略：导航请求 network-first，静态资源 cache-first + 后台更新；跨域请求直接放行。
   注意：路径基于 registration.scope，兼容 GitHub Pages 的 /decision-log/ 子路径。 */
const CACHE_NAME = 'decision-capsule-shell-v1'

self.addEventListener('install', (event) => {
  const scope = self.registration.scope
  const shell = [
    new URL('./', scope).href,
    new URL('./index.html', scope).href,
    new URL('./manifest.webmanifest', scope).href,
    new URL('./favicon.svg', scope).href,
    new URL('./icons/icon-192.png', scope).href,
    new URL('./icons/icon-512.png', scope).href,
  ]
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(shell))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  const indexUrl = new URL('./index.html', self.registration.scope).href

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(indexUrl, copy))
          }
          return response
        })
        .catch(async () => (await caches.match(indexUrl)) || (await caches.match(request)) || Response.error()),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === 'basic') {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
