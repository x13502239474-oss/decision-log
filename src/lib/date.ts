/** 日期工具：统一以本地日历日为准，避免时区造成「到期」误判。 */

const pad = (n: number) => String(n).padStart(2, '0')

/** 返回本地日期 YYYY-MM-DD */
export function toDateKey(input: string | Date = new Date()): string {
  const d = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return toDateKey(new Date())
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayKey(): string {
  return toDateKey(new Date())
}

/** 把 YYYY-MM-DD 解析成本地 00:00，避免字符串被当成 UTC */
function localDay(dateKey: string): Date {
  const [y, m, d] = dateKey.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return new Date(NaN)
  return new Date(y, m - 1, d)
}

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return !Number.isNaN(localDay(value).getTime())
}

/** 相差天数：正数表示 target 在 base 之后 */
export function daysBetween(baseKey: string, targetKey: string): number {
  const a = localDay(baseKey).getTime()
  const b = localDay(targetKey).getTime()
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  return Math.round((b - a) / 86_400_000)
}

export function daysUntil(reviewAt: string): number {
  return daysBetween(todayKey(), reviewAt.slice(0, 10))
}

export function daysOverdue(reviewAt: string): number {
  return Math.max(0, -daysUntil(reviewAt))
}

/** 在日期 key 上加月 / 年，自动处理月末（如 1 月 31 日 + 1 月） */
export function addMonths(dateKey: string, months: number): string {
  const base = localDay(dateKey)
  const day = base.getDate()
  const target = new Date(base.getFullYear(), base.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(day, lastDay))
  return toDateKey(target)
}

export function formatDate(value?: string, style: 'dot' | 'cn' | 'slash' = 'dot'): string {
  if (!value) return '—'
  const d = new Date(value)
  if (!Number.isNaN(d.getTime()) && value.includes('T')) {
    const key = toDateKey(d)
    return formatDate(key, style)
  }
  const key = value.slice(0, 10)
  const [y, m, day] = key.split('-')
  if (!y || !m || !day) return '—'
  if (style === 'cn') return `${y} 年 ${Number(m)} 月 ${Number(day)} 日`
  if (style === 'slash') return `${y}/${m}/${day}`
  return `${y}.${m}.${day}`
}

export function formatStamp(value?: string): string {
  return formatDate(value, 'dot')
}

/** 档案编号：由 ID 生成的稳定短码 */
export function fileNo(id: string): string {
  const hex = id.replace(/-/g, '')
  let n = 0
  for (let i = 0; i < hex.length; i += 1) n = (n * 31 + hex.charCodeAt(i)) % 100000
  return `DC-${String(n).padStart(5, '0')}`
}
