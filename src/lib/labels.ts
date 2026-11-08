import type {
  DecisionStatus,
  OutcomeComparison,
  Reversibility,
  Stakes,
} from '../types/decision'

export const STATUS_LABEL: Record<DecisionStatus, string> = {
  open: '待回访',
  reviewed: '已回访',
  abandoned: '已放弃',
}

export const STAKES_LABEL: Record<Stakes, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

export const REVERSIBILITY_LABEL: Record<Reversibility, string> = {
  easy: '容易改变',
  hard: '难以改变',
  irreversible: '不可逆',
}

export const REVERSIBILITY_HINT: Record<Reversibility, string> = {
  easy: '随时可以改主意，试错成本低',
  hard: '改主意要付出代价',
  irreversible: '一旦做出，无法回头',
}

export const COMPARISON_LABEL: Record<OutcomeComparison, string> = {
  better: '比预期好',
  'as-expected': '符合预期',
  worse: '比预期差',
}

export const CONFIDENCE_HINT: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '几乎没有把握',
  2: '有些犹豫',
  3: '一半一半',
  4: '比较确定',
  5: '几乎确信',
}

export const STAKES_KEYS: Stakes[] = ['low', 'medium', 'high']
export const REVERSIBILITY_KEYS: Reversibility[] = ['easy', 'hard', 'irreversible']
export const COMPARISON_KEYS: OutcomeComparison[] = ['better', 'as-expected', 'worse']
export const CONFIDENCE_KEYS: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5]
export const STATUS_KEYS: DecisionStatus[] = ['open', 'reviewed', 'abandoned']
