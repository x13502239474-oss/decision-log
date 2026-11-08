import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import EnvelopeCard from '../components/EnvelopeCard'
import type { EnvelopeVariant } from '../components/EnvelopeCard'
import { useDecisions } from '../hooks/useDecisions'
import { daysUntil, formatDate } from '../lib/date'
import type { Decision } from '../types/decision'

interface SectionProps {
  index: string
  title: string
  note: string
  accent?: 'due' | 'normal'
  items: Decision[]
  variant: EnvelopeVariant
  onOpen: (d: Decision) => void
}

function Section({ index, title, note, accent = 'normal', items, variant, onOpen }: SectionProps) {
  return (
    <section className="mb-9">
      <div className="section-rule mb-4">
        <span className="mono text-[0.66rem]" style={{ color: accent === 'due' ? 'var(--due)' : 'var(--gold)' }}>
          {index}
        </span>
        <h2 className="text-[1.02rem] font-semibold" style={{ color: 'var(--text)' }}>
          {title}
        </h2>
        <span className="mono text-[0.68rem]" style={{ color: 'var(--text-faint)' }}>
          {String(items.length).padStart(2, '0')}
        </span>
      </div>
      <p className="mb-4 -mt-2 text-[0.78rem]" style={{ color: 'var(--text-dim)' }}>
        {note}
      </p>
      {items.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d) => (
            <EnvelopeCard key={d.id} decision={d} variant={variant} onOpen={() => onOpen(d)} />
          ))}
        </div>
      ) : (
        <p
          className="archive-panel px-4 py-4 text-[0.8rem] leading-relaxed"
          style={{ color: 'var(--text-faint)' }}
        >
          这一格暂时是空的。
        </p>
      )}
    </section>
  )
}

export default function Inbox() {
  const { decisions } = useDecisions()
  const navigate = useNavigate()

  const open = decisions
    .filter((d) => d.status === 'open')
    .sort((a, b) => a.reviewAt.localeCompare(b.reviewAt))
  const due = open.filter((d) => daysUntil(d.reviewAt) <= 0)
  const upcoming = open.filter((d) => {
    const n = daysUntil(d.reviewAt)
    return n > 0 && n <= 7
  })
  const future = open.filter((d) => daysUntil(d.reviewAt) > 7)
  const reviewed = decisions
    .filter((d) => d.status === 'reviewed')
    .sort((a, b) => (b.reviewedAt ?? '').localeCompare(a.reviewedAt ?? ''))

  const openArchive = (d: Decision) => {
    const isDue = d.status === 'open' && daysUntil(d.reviewAt) <= 0
    navigate(isDue ? `/review/${d.id}` : `/decision/${d.id}`)
  }

  const isEmpty = !due.length && !upcoming.length && !future.length && !reviewed.length

  return (
    <div className="fade-up">
      <PageHeader
        hero
        eyebrow="INBOX / 待回访"
        title="致未来的自己"
        subtitle="有些答案，需要时间来拆封。"
        right={
          <button type="button" className="btn btn-primary" onClick={() => navigate('/new')}>
            <Plus size={17} /> 写一封信
          </button>
        }
      />

      {isEmpty ? (
        <EmptyState
          title="这里暂时没有等待拆封的信件。"
          description="做一个决定，寄给未来的自己。"
          actionLabel="新建一项决策"
          onAction={() => navigate('/new')}
        />
      ) : (
        <>
          <Section
            index="A / 01"
            title="已到期"
            note="时间已经到了。先独立写下实际结果，再拆开过去的判断。"
            accent="due"
            items={due}
            variant="due"
            onOpen={openArchive}
          />
          <Section
            index="B / 02"
            title="即将到期"
            note="未来七天内可以拆封的信件。"
            items={upcoming}
            variant="upcoming"
            onOpen={openArchive}
          />
          <Section
            index="C / 03"
            title="未来的信"
            note="按回访日期排列，它们还在时间里慢慢沉淀。"
            items={future}
            variant="future"
            onOpen={openArchive}
          />
          {reviewed.length > 0 && (
            <Section
              index="D / 04"
              title="已拆封的档案"
              note={`共 ${reviewed.length} 份已完成回访 · 最近一次 ${formatDate(reviewed[0]?.reviewedAt)}`}
              items={reviewed.slice(0, 6)}
              variant="reviewed"
              onOpen={openArchive}
            />
          )}
        </>
      )}
    </div>
  )
}
