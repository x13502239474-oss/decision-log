import type { Decision } from '../types/decision'
import { coerceDecision } from './storage'

export interface ImportResult {
  ok: boolean
  decisions: Decision[]
  /** 无法解析而被跳过的条目数 */
  skipped: number
  error?: string
  warning?: string
}

/**
 * 严格校验 JSON 备份结构。绝不因为解析失败而静默覆盖现有数据。
 * 接受：标准 BackupPayload 对象 / 裸 Decision 数组（旧版备份）。
 */
export function parseBackup(text: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, decisions: [], skipped: 0, error: '文件不是合法的 JSON，请确认选择的是本应用导出的备份文件。' }
  }

  let list: unknown
  let warning: string | undefined

  if (Array.isArray(parsed)) {
    list = parsed
    warning = '这是旧版数组格式备份，已按兼容方式读取。'
  } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).decisions)) {
    const obj = parsed as Record<string, unknown>
    if (obj.app !== undefined && obj.app !== 'decision-capsule') {
      return { ok: false, decisions: [], skipped: 0, error: '该文件不是「个人决策日志」的备份（app 字段不匹配）。' }
    }
    const version = typeof obj.version === 'number' ? obj.version : 1
    if (version > 1) warning = `备份文件版本为 v${version}，高于当前支持版本，已尽力读取，请核对导入结果。`
    list = obj.decisions
  } else {
    return { ok: false, decisions: [], skipped: 0, error: '备份结构不正确：缺少 decisions 数组。' }
  }

  if (!Array.isArray(list)) {
    return { ok: false, decisions: [], skipped: 0, error: '备份结构不正确。' }
  }
  if (list.length === 0) {
    return { ok: true, decisions: [], skipped: 0, warning: '备份文件里没有任何记录。' }
  }

  const decisions: Decision[] = []
  let skipped = 0
  for (const item of list) {
    const d = coerceDecision(item)
    if (d) decisions.push(d)
    else skipped += 1
  }
  if (!decisions.length) {
    return { ok: false, decisions: [], skipped, error: '没有找到任何有效的决策记录，导入已取消。' }
  }
  if (skipped > 0) warning = [warning, `已跳过 ${skipped} 条字段不完整、无法识别的记录。`].filter(Boolean).join(' ')
  return { ok: true, decisions, skipped, warning }
}

/** 按 id 合并：同一条记录以本机现有版本为准（保护已完成的回访内容）。 */
export function mergeById(existing: Decision[], incoming: Decision[]): { result: Decision[]; added: number } {
  const map = new Map(existing.map((d) => [d.id, d]))
  let added = 0
  for (const d of incoming) {
    if (!map.has(d.id)) {
      map.set(d.id, d)
      added += 1
    }
  }
  return { result: Array.from(map.values()), added }
}
