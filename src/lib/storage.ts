import type {
  Decision,
  DecisionOption,
  DecisionStatus,
  OutcomeComparison,
  Reversibility,
  Stakes,
} from '../types/decision'
import { createId } from './id'
import { isValidDateKey, toDateKey } from './date'

/** 全站唯一的 localStorage Key；数据读写只在本模块发生。 */
export const STORAGE_KEY = 'decision-capsule:v1'
export const THEME_KEY = 'decision-capsule:theme'
const SCHEMA_VERSION = 1

export interface LoadResult {
  decisions: Decision[]
  /** 解析失败 / 版本异常等提示，交给 UI 显示，不抛异常 */
  error?: string
}

interface StoredEnvelope {
  version: number
  decisions: unknown
}

const STATUSES: DecisionStatus[] = ['open', 'reviewed', 'abandoned']
const REVERSIBILITIES: Reversibility[] = ['easy', 'hard', 'irreversible']
const STAKES: Stakes[] = ['low', 'medium', 'high']
const COMPARISONS: OutcomeComparison[] = ['better', 'as-expected', 'worse']

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : fallback

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
  if (typeof v === 'string') return v.split(/[\n,，；;]/).map((s) => s.trim()).filter(Boolean)
  return []
}

/**
 * 把任意来源的对象规范化为合法的 Decision。
 * 用于 localStorage 读取、JSON 导入与未来版本迁移，绝不把脏数据写回。
 */
export function coerceDecision(raw: unknown): Decision | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const title = str(r.title).trim()
  const context = str(r.context).trim()
  const chosen = str(r.chosen).trim()
  const reasoning = str(r.reasoning).trim()
  if (!title || !context || !chosen || !reasoning) return null

  const reviewAtRaw = str(r.reviewAt).slice(0, 10)
  const decidedAtRaw = str(r.decidedAt)
  if (!isValidDateKey(reviewAtRaw)) return null
  const decidedAt = !Number.isNaN(new Date(decidedAtRaw).getTime())
    ? decidedAtRaw
    : `${reviewAtRaw}T00:00:00.000Z`

  const rawOptions = Array.isArray(r.options) ? r.options : []
  const options: DecisionOption[] = rawOptions
    .filter((o): o is Record<string, unknown> => !!o && typeof o === 'object')
    .map((o) => ({
      id: str(o.id) || createId(),
      label: str(o.label).trim(),
      pros: toStringArray(o.pros),
      cons: toStringArray(o.cons),
      expectedOutcome: str(o.expectedOutcome).trim(),
    }))
    .filter((o) => o.label.length > 0)

  const conf = Number(r.confidence)
  const confidence = (Number.isInteger(conf) && conf >= 1 && conf <= 5 ? conf : 3) as Decision['confidence']

  const decision: Decision = {
    id: str(r.id).trim() || createId(),
    title,
    context,
    options,
    chosen,
    reasoning,
    confidence,
    reversibility: REVERSIBILITIES.includes(r.reversibility as Reversibility)
      ? (r.reversibility as Reversibility)
      : 'hard',
    stakes: STAKES.includes(r.stakes as Stakes) ? (r.stakes as Stakes) : 'medium',
    decidedAt,
    reviewAt: reviewAtRaw,
    status: STATUSES.includes(r.status as DecisionStatus) ? (r.status as DecisionStatus) : 'open',
  }

  if (typeof r.actualOutcome === 'string' && r.actualOutcome.trim()) {
    decision.actualOutcome = r.actualOutcome
  }
  if (COMPARISONS.includes(r.outcomeVsExpectation as OutcomeComparison)) {
    decision.outcomeVsExpectation = r.outcomeVsExpectation as OutcomeComparison
  }
  if (typeof r.lesson === 'string' && r.lesson.trim()) decision.lesson = r.lesson
  if (typeof r.reviewedAt === 'string' && !Number.isNaN(new Date(r.reviewedAt).getTime())) {
    decision.reviewedAt = r.reviewedAt
  }
  return decision
}

function normalizeList(raw: unknown): { decisions: Decision[]; skipped: number } {
  if (!Array.isArray(raw)) return { decisions: [], skipped: 0 }
  const decisions: Decision[] = []
  let skipped = 0
  for (const item of raw) {
    const d = coerceDecision(item)
    if (d) decisions.push(d)
    else skipped += 1
  }
  return { decisions, skipped }
}

/** 结构版本迁移入口：未来新增版本时在此逐版本升级即可。 */
function migrate(envelope: StoredEnvelope): { list: unknown; note?: string } {
  if (envelope.version === SCHEMA_VERSION) return { list: envelope.decisions }
  if (envelope.version > SCHEMA_VERSION) {
    // 由更新版本写入的数据：尽力按当前结构解析，不做破坏性丢弃
    return { list: envelope.decisions, note: '检测到较新版本的数据，已按当前结构尽力读取。' }
  }
  // version < 1 的旧数据也按相同字段读取，缺失字段由 coerceDecision 补默认值
  return { list: envelope.decisions, note: '已兼容旧版本数据格式。' }
}

export function loadDecisions(): LoadResult {
  let text: string | null = null
  try {
    text = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return { decisions: [], error: '浏览器禁止访问本地存储，数据将无法保存。请检查隐私模式或站点设置。' }
  }
  if (!text) return { decisions: [] }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { decisions: [], error: '本地数据损坏（JSON 解析失败）。为避免覆盖原始数据，暂未读取；可在「设置」中导入备份恢复。' }
  }

  // 兼容早期直接存数组的格式
  const envelope: StoredEnvelope = Array.isArray(parsed)
    ? { version: 0, decisions: parsed }
    : (parsed as StoredEnvelope)

  if (!envelope || typeof envelope !== 'object' || !Array.isArray(envelope.decisions)) {
    return { decisions: [], error: '本地数据格式无法识别，已安全跳过。' }
  }

  const { list, note } = migrate(envelope)
  const { decisions, skipped } = normalizeList(list)
  const skippedNote = skipped > 0 ? `已跳过 ${skipped} 条不完整记录。` : ''
  const notes = [note, skippedNote].filter(Boolean).join(' ')
  return { decisions, error: notes || undefined }
}

/** 同步写入：封存动画开始前调用，保证动画期间刷新也不会丢数据。 */
export function saveDecisions(decisions: Decision[]): boolean {
  try {
    const payload: StoredEnvelope = { version: SCHEMA_VERSION, decisions }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

export function clearDecisions(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* 忽略：UI 层会提示 */
  }
}

export function readTheme(): 'dark' | 'light' {
  try {
    return window.localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function saveTheme(theme: 'dark' | 'light'): void {
  try {
    window.localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* 忽略 */
  }
}

/** 供导出时生成文件时间戳 */
export function backupStamp(): string {
  return toDateKey(new Date())
}
