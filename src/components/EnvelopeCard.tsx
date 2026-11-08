import type { Decision } from '../types/decision'
import { daysOverdue, daysUntil, fileNo, formatDate } from '../lib/date'
import { PostalStamp, ReviewedStamp, WaxSeal } from './PostalStamp'

export type EnvelopeVariant = 'due' | 'upcoming' | 'future' | 'reviewed'

interface EnvelopeCardProps {
  decision: Decision
  variant: EnvelopeVariant
  onOpen: () => void
}

export default function EnvelopeCard({ decision, variant, onOpen }: EnvelopeCardProps) {
  const isDue = variant === 'due'
  const isReviewed = variant === 'reviewed'
  const overdue = daysOverdue(decision.reviewAt)
  const remaining = Math.max(0, daysUntil(decision.reviewAt))

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`envelope grain ${isDue ? 'envelope--due' : ''} ${isReviewed ? 'envelope--reviewed' : ''}`}
      aria-label={`${decision.title}，${isDue ? `已到期 ${overdue} 天，点击开始回访` : '查看档案'}`}
    >
      <span className="env-flap" />
      <span className="env-fold" />
      <span className="env-edge" />
      <span className="env-seal">
        <WaxSeal tone={isDue ? 'gold' : 'red'} char={isDue ? '启' : '封'} />
      </span>

      <span className="env-content">
        <span className="env-top">
          <span className="flex flex-col gap-1">
            <span className="env-no">{fileNo(decision.id)}</span>
            <span className="env-no">ARCHIVE · {decision.decidedAt.slice(0, 4)}</span>
          </span>
          {isReviewed ? (
            <ReviewedStamp date={decision.reviewedAt} />
          ) : (
            <PostalStamp
              date={decision.decidedAt}
              label={isDue ? 'TO OPEN' : 'SEALED'}
              tone={isDue ? 'due' : 'default'}
            />
          )}
        </span>

        <span className="env-title">{decision.title}</span>

        <span className="env-meta">
          <span>封存 {formatDate(decision.decidedAt)}</span>
          <span>回访 {formatDate(decision.reviewAt)}</span>
          {isDue && (
            <span className="env-overdue">{overdue === 0 ? '今日到期' : `逾期 ${overdue} 天`}</span>
          )}
          {variant === 'upcoming' && <span>还有 {remaining} 天</span>}
          {isReviewed && <span>已归档</span>}
        </span>
      </span>
    </button>
  )
}
