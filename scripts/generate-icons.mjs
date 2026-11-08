/**
 * 零依赖生成 PWA 图标（纯 Node：手写 PNG 编码 + zlib）。
 * 运行：npm run icons
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

const CRC_TABLE = new Uint32Array(256)
for (let n = 0; n < 256; n += 1) {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  CRC_TABLE[n] = c >>> 0
}
function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}
function encodePNG(size, pixels) {
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0 // filter: none
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const C = {
  bgA: [33, 29, 24],
  bgB: [23, 21, 18],
  gold: [182, 154, 103],
  paper: [215, 197, 165],
  paperLight: [232, 220, 196],
  paperLine: [139, 114, 71],
  fold: [169, 144, 106],
  wax: [166, 92, 75],
  waxDark: [123, 61, 49],
  waxLight: [233, 214, 184],
}

function render(size) {
  const px = Buffer.alloc(size * size * 4)
  const S = size / 100

  function put(x, y, color, alpha = 255) {
    x = Math.round(x)
    y = Math.round(y)
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    const a = alpha / 255
    const da = px[i + 3] / 255
    const out = a + da * (1 - a)
    if (out <= 0) return
    for (let k = 0; k < 3; k += 1) {
      px[i + k] = Math.round((color[k] * a + px[i + k] * da * (1 - a)) / out)
    }
    px[i + 3] = Math.round(out * 255)
  }
  function rect(x0, y0, x1, y1, color, alpha = 255) {
    for (let y = Math.round(y0); y < Math.round(y1); y += 1) {
      for (let x = Math.round(x0); x < Math.round(x1); x += 1) put(x, y, color, alpha)
    }
  }
  function frame(x0, y0, x1, y1, w, color, alpha = 255) {
    rect(x0, y0, x1, y0 + w, color, alpha)
    rect(x0, y1 - w, x1, y1, color, alpha)
    rect(x0, y0, x0 + w, y1, color, alpha)
    rect(x1 - w, y0, x1, y1, color, alpha)
  }
  function line(x0, y0, x1, y1, color, width = 1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps
      const x = x0 + (x1 - x0) * t
      const y = y0 + (y1 - y0) * t
      for (let dy = -width / 2; dy <= width / 2; dy += 0.5) {
        for (let dx = -width / 2; dx <= width / 2; dx += 0.5) put(x + dx, y + dy, color)
      }
    }
  }
  function triangle(p1, p2, p3, color) {
    const minY = Math.floor(Math.min(p1[1], p2[1], p3[1]))
    const maxY = Math.ceil(Math.max(p1[1], p2[1], p3[1]))
    const edges = [[p1, p2], [p2, p3], [p3, p1]]
    for (let y = minY; y <= maxY; y += 1) {
      const xs = []
      for (const [a, b] of edges) {
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
          xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]))
        }
      }
      if (xs.length >= 2) {
        const lo = Math.ceil(Math.min(...xs))
        const hi = Math.floor(Math.max(...xs))
        for (let x = lo; x <= hi; x += 1) put(x, y, color)
      }
    }
  }
  function disc(cx, cy, r, color) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y += 1) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x += 1) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) put(x, y, color)
      }
    }
  }
  function ring(cx, cy, r, w, color, alpha = 255) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y += 1) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x += 1) {
        const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
        if (d <= r && d >= r - w) put(x, y, color, alpha)
      }
    }
  }

  // 背景：深咖啡渐层
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const t = (x / size + y / size) / 2
      const color = C.bgA.map((v, k) => Math.round(v + (C.bgB[k] - v) * t))
      put(x, y, color)
    }
  }

  const W = Math.max(1, Math.round(size * 0.0035))

  // 档案外框与打字机装饰线
  frame(8 * S, 8 * S, 92 * S, 92 * S, W, C.gold, 110)
  line(34 * S, 16 * S, 66 * S, 16 * S, C.gold, W * 1.2)
  line(40 * S, 19 * S, 60 * S, 19 * S, C.gold, W)
  line(30 * S, 85 * S, 70 * S, 85 * S, C.gold, W)

  // 信封主体
  rect(17 * S, 29 * S, 83 * S, 72 * S, C.paper)
  frame(17 * S, 29 * S, 83 * S, 72 * S, W * 1.5, C.paperLine, 210)

  // 封口三角与折线
  triangle([17 * S, 29 * S], [83 * S, 29 * S], [50 * S, 56 * S], C.paperLight)
  line(17 * S, 29 * S, 50 * S, 56 * S, C.paperLine, W * 1.2)
  line(83 * S, 29 * S, 50 * S, 56 * S, C.paperLine, W * 1.2)
  line(17 * S, 72 * S, 43 * S, 50 * S, C.fold, W)
  line(83 * S, 72 * S, 57 * S, 50 * S, C.fold, W)

  // 蜡封
  const cx = 50 * S
  const cy = 56 * S
  disc(cx, cy, 9 * S, C.waxDark)
  disc(cx, cy, 8.2 * S, C.wax)
  ring(cx, cy, 6.3 * S, W * 1.1, C.waxLight, 190)
  line(cx - 2.4 * S, cy, cx + 2.4 * S, cy, C.waxLight, W * 1.4)
  line(cx, cy - 2.4 * S, cx, cy + 2.4 * S, C.waxLight, W * 1.4)

  return encodePNG(size, px)
}

mkdirSync(OUT_DIR, { recursive: true })
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  const buf = render(size)
  writeFileSync(join(OUT_DIR, name), buf)
  console.log(`${name}: ${size}x${size}, ${(buf.length / 1024).toFixed(1)} KB`)
}
