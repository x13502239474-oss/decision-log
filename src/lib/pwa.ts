/** 注册 Service Worker。仅在构建产物中启用，避免开发环境缓存干扰。 */
export function registerServiceWorker(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  if (import.meta.env.DEV) return

  const base = import.meta.env.BASE_URL
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .catch(() => {
        // 注册失败不影响主功能（例如 iOS 隐私模式或不支持的环境）
      })
  })
}
