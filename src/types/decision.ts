export type DecisionStatus = 'open' | 'reviewed' | 'abandoned'

export type Reversibility = 'easy' | 'hard' | 'irreversible'

export type Stakes = 'low' | 'medium' | 'high'

export type OutcomeComparison = 'better' | 'as-expected' | 'worse'

export interface DecisionOption {
  id: string
  label: string
  pros: string[]
  cons: string[]
  expectedOutcome: string
}

export interface Decision {
  id: string
  title: string
  context: string
  options: DecisionOption[]

  chosen: string
  reasoning: string

  confidence: 1 | 2 | 3 | 4 | 5
  reversibility: Reversibility
  stakes: Stakes

  /** 完整 ISO 8601 时间戳 */
  decidedAt: string
  /** ISO 8601 日期 YYYY-MM-DD，按本地日历日比较，避免时区跨天 */
  reviewAt: string

  status: DecisionStatus

  /** 以下字段只在回访流程中写入 */
  actualOutcome?: string
  outcomeVsExpectation?: OutcomeComparison
  lesson?: string
  reviewedAt?: string
}

/** 新建决策时由表单提供的字段（不含自动生成字段） */
export type DecisionDraft = Omit<
  Decision,
  'id' | 'decidedAt' | 'status' | 'actualOutcome' | 'outcomeVsExpectation' | 'lesson' | 'reviewedAt'
>

/** 备份文件结构；version 用于未来数据结构升级 */
export interface BackupPayload {
  app: 'decision-capsule'
  version: 1
  exportedAt: string
  decisions: Decision[]
}

/** 统计聚合结果。字段刻意拆开，方便后续扩展「判断力校准面板」 */
export interface OverviewStats {
  total: number
  open: number
  reviewed: number
  abandoned: number
  stakes: Record<Stakes, number>
  confidence: Record<1 | 2 | 3 | 4 | 5, number>
  comparison: Record<OutcomeComparison, number>
  reviewedWithComparison: number
}
