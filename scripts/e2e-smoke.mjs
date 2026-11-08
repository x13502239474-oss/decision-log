/**
 * 端到端冒烟测试：用本机 Chrome 的 CDP（无需安装 Playwright / Puppeteer）驱动真实浏览器，
 * 覆盖 创建 → 刷新持久化 → 严格盲写回访 → 归档 → 详情 / 统计 / 搜索 / 导出。
 *
 * 前置：
 *   npm run build
 *   npm run preview -- --port 4173 --host 127.0.0.1
 *   chrome --headless=new --remote-debugging-port=9222 --user-data-dir=<临时目录> about:blank
 * 运行：
 *   node scripts/e2e-smoke.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const BASE_URL = process.env.TEST_URL || 'http://127.0.0.1:4173/decision-log/'
const CDP_URL = process.env.CDP_URL || 'http://127.0.0.1:9222'

const HELPERS = `
const checks = []
window.__DC_CHECKS__ = checks
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const T = () => document.body.innerText
const byText = (sel, txt) => Array.from(document.querySelectorAll(sel)).find((e) => (e.innerText || '').includes(txt))
const clickText = (txt, sel) => {
  const el = byText(sel || 'button', txt)
  if (!el) throw new Error('找不到可点击元素: ' + txt)
  el.click()
}
const setVal = (el, v) => {
  if (!el) throw new Error('找不到输入框')
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}
const waitFor = async (fn, ms) => {
  const limit = ms || 6000
  const t0 = Date.now()
  while (Date.now() - t0 < limit) {
    if (fn()) return true
    await sleep(80)
  }
  return false
}
const store = () => JSON.parse(localStorage.getItem('decision-capsule:v1') || '{}')
const ok = (name, cond, extra) => checks.push({ name, pass: !!cond, extra: String(extra === undefined ? '' : extra).slice(0, 220) })
`

const raw = readFileSync(join(HERE, 'browser-checks.js'), 'utf8')
const p1 = raw.indexOf('/* PHASE_1 */')
const p2 = raw.indexOf('/* PHASE_2 */')
const p3 = raw.indexOf('/* PHASE_3 */')
if (p1 < 0 || p2 < 0) throw new Error('测试片段标记缺失')
const phase1 = raw.slice(p1 + '/* PHASE_1 */'.length, p2)
const phase2 = raw.slice(p2 + '/* PHASE_2 */'.length, p3 < 0 ? undefined : p3)
const phase3 = p3 < 0 ? '' : raw.slice(p3 + '/* PHASE_3 */'.length)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const targets = await (await fetch(`${CDP_URL}/json/list`)).json()
  const page = targets.find((t) => t.type === 'page')
  if (!page) throw new Error('CDP 中没有可用的页面 target')

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = reject
  })

  let seq = 0
  const pending = new Map()
  const consoleErrors = []
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) reject(new Error(JSON.stringify(msg.error)))
      else resolve(msg.result)
      return
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails
      consoleErrors.push('exception: ' + (d.exception?.description || d.text))
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(
        'console.error: ' + msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '),
      )
    } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      const e = msg.params.entry
      if (e.source !== 'network' && !String(e.url || '').includes('fonts.g')) {
        consoleErrors.push('log: ' + e.text)
      }
    }
  }
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq
      pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params }))
    })

  const runExpression = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    })
    if (result.exceptionDetails) {
      const d = result.exceptionDetails
      throw new Error(d.exception?.description || d.text || '页面脚本异常')
    }
    return result.result.value
  }

  const evaluate = async (phase) => {
    try {
      return (await runExpression(`(async () => {\n${HELPERS}\n${phase}\n})()`)) || []
    } catch (err) {
      let saved = []
      try {
        saved = (await runExpression('window.__DC_CHECKS__ || []')) || []
      } catch {
        /* 页面上下文不可用 */
      }
      return [...saved, { name: '页面内测试执行异常', pass: false, extra: String(err.message || err) }]
    }
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Log.enable')
  try {
    await send('Browser.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: join(HERE, '..', '.test-downloads'),
    })
  } catch {
    /* 部分 CDP target 不支持 Browser domain，忽略 */
  }

  await send('Page.navigate', { url: BASE_URL })
  await sleep(1800)
  // 全新开始：注销旧的 Service Worker、清空缓存与本地数据（测试专用浏览器 profile）
  await runExpression(`(async () => {
    try { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map((r) => r.unregister())) } catch (e) {}
    try { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))) } catch (e) {}
    try { localStorage.clear() } catch (e) {}
    return 'cleaned'
  })()`)
  await send('Page.reload', { ignoreCache: true })
  await sleep(2200)
  const results1 = await evaluate(phase1)

  await send('Page.reload', { ignoreCache: true })
  await sleep(2200)
  const results2 = await evaluate(phase2)

  const results3 = []
  if (phase3) {
    for (const width of [320, 390]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height: 760,
        deviceScaleFactor: 2,
        mobile: true,
      })
      await sleep(500)
      const rows = await evaluate(phase3)
      results3.push(...rows.map((r) => ({ ...r, name: `[${width}px] ${r.name}` })))
    }
    await send('Emulation.clearDeviceMetricsOverride')
  }

  const all = [...results1, ...results2, ...results3]
  console.log('\n=== 端到端冒烟测试结果 ===')
  for (const r of all) {
    console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.extra && !r.pass ? '  → ' + r.extra : ''}`)
  }
  const failed = all.filter((r) => !r.pass)
  console.log(`\n合计 ${all.length} 项，通过 ${all.length - failed.length} 项，失败 ${failed.length} 项`)

  // 过滤宿主环境注入脚本与外部字体产生的噪声，只保留应用自身的错误
  const noise =
    /ServiceProxy|worktreeTask|127\.0\.0\.1:47832|api\/(usage|current|sleep-mode|auto-continue|session-module|sessions|automations|no-disturb)|CORS policy|fonts\.googleapis|fonts\.gstatic|ERR_(NAME_NOT_RESOLVED|INTERNET_DISCONNECTED|CONNECTION)/i
  const realErrors = consoleErrors.filter((e) => !noise.test(e))
  console.log(`控制台错误：${realErrors.length} 条`)
  realErrors.slice(0, 12).forEach((e) => console.log('  ' + e.slice(0, 300)))

  ws.close()
  process.exit(failed.length || realErrors.length ? 1 : 0)
}

main().catch((err) => {
  console.error('测试运行失败：', err)
  process.exit(1)
})
