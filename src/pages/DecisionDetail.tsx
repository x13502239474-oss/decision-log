import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Clock, RotateCcw, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ArchiveCard from '../components/ArchiveCard'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import { PostalStamp, ReviewedStamp } from '../components/PostalStamp'
import { useDecisions } from '../hooks/useDecisions'
import { daysUntil, fileNo, formatDate } from '../lib/date'
import {
  COMPARISON_LABEL,
  CONFIDENCE_HINT,
  REVERSIBILITY_LABEL,
  STAKES_LABEL,
  STATUS_LABEL,
} from '../lib/labels'
import type { Decision } from '../types/decision'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="typewriter mb-1.5" style={{ color: 'var(--paper-ink-soft)' }}>{label}</p>
      <div className="text-[0.88rem] leading-[1.9] break-any whitespace-pre-wrap" style={{ color: 'var(--paper-ink)' }}>
        {children}
      </div>
    </div>
  )
}

function FrontFace({ d }: { d: Decision }) {
  return (
    <ArchiveCard tone="old" binding className="p-5 pl-10 sm:p-8 sm:pl-14" fileNo={fileNo(d.id)}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="eyebrow" style={{ color: 'var(--stamp)' }}>RECTO / 当时视角</p>
          <h2 className="mt-2 text-[1.4rem] font-semibold leading-snug break-any sm:text-[1.65rem]" style={{ color: 'var(--paper-ink)' }}>
            {d.title}
          </h2>
          <p className="mono mt-3 text-[0.72rem]" style={{ color: 'var(--paper-ink-soft)' }}>
            封存于 {formatDate(d.decidedAt, 'cn')}
          </p>
        </div>
        <PostalStamp date={d.decidedAt} label="SEALED" />
      </div>

      <div className="hairline mb-6" style={{ background: 'rgba(57,47,36,.2)' }} />

      <div className="space-y-6">
        <Field label="背景情境">{d.context}</Field>

        <Field label="备选方案">
          {d.options.length ? (
            <ul className="space-y-3">
              {d.options.map((o, i) => (
                <li key={o.id} className="border-l-2 pl-3" style={{ borderColor: 'rgba(57,47,36,.3)' }}>
                  <p className="font-semibold">{String.fromCharCode(65 + i)} · {o.label}</p>
                  {!!o.pros.length && <p className="text-[0.82rem]">优势：{o.pros.join('、')}</p>}
                  {!!o.cons.length && <p className="text-[0.82rem]">劣势：{o.cons.join('、')}</p>}
                  <p className="text-[0.82rem]">预期结果：{o.expectedOutcome || '（未填写）'}</p>
                </li>
              ))}
            </ul>
          ) : (
            '（未记录）'
          )}
        </Field>

        <Field label="最终选择"><span className="font-semibold">{d.chosen}</span></Field>

        <div>
          <p className="typewriter mb-1.5" style={{ color: 'var(--paper-ink-soft)' }}>当时的理由 / 封存原文</p>
          <div
            className="mt-2 border-l-2 py-2 pl-4"
            style={{ borderColor: 'var(--stamp)', background: 'rgba(166,92,75,.06)' }}
          >
            <p className="text-[0.92rem] leading-[1.95] break-any whitespace-pre-wrap" style={{ color: 'var(--paper-ink)' }}>
              {d.reasoning}
            </p>
          </div>
          <p className="handnote mt-2 !text-[0.86rem]">此刻的判断，已无法修改</p>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-4 border-t pt-5" style={{ borderColor: 'rgba(57,47,36,.2)' }}>
          <Field label="信心程度">
            <span className="mono">{d.confidence} / 5</span>
            <span className="ml-2 text-[0.78rem]">{CONFIDENCE_HINT[d.confidence]}</span>
          </Field>
          <Field label="重要程度">{STAKES_LABEL[d.stakes]}</Field>
          <Field label="不可逆程度">{REVERSIBILITY_LABEL[d.reversibility]}</Field>
          <Field label="预定回访">{formatDate(d.reviewAt, 'cn')}</Field>
        </div>
      </div>
    </ArchiveCard>
  )
}

function BackFace({ d }: { d: Decision }) {
  const remaining = daysUntil(d.reviewAt)
  return (
    <ArchiveCard tone="fresh" className="p-5 sm:p-8" fileNo={fileNo(d.id)}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow" style={{ color: 'var(--paper-ink-soft)' }}>VERSO / 回访视角</p>
          <h2 className="mt-2 text-[1.4rem] font-semibold leading-snug break-any sm:text-[1.65rem]" style={{ color: 'var(--paper-ink)' }}>
            {d.title}
          </h2>
        </div>
        {d.status === 'reviewed' && <ReviewedStamp date={d.reviewedAt} />}
      </div>

      <div className="hairline mb-6" style={{ background: 'rgba(57,47,36,.18)' }} />

      {d.status === 'reviewed' ? (
        <div className="space-y-6">
          <Field label="实际结果">{d.actualOutcome || '（未填写）'}</Field>
          <Field label="结果对比">
            {d.outcomeVsExpectation ? COMPARISON_LABEL[d.outcomeVsExpectation] : '（未填写）'}
          </Field>
          <Field label="经验教训">{d.lesson || '（未填写）'}</Field>
          <Field label="实际回访日期">{d.reviewedAt ? formatDate(d.reviewedAt, 'cn') : '—'}</Field>
        </div>
      ) : d.status === 'abandoned' ? (
        <div className="py-6 text-center">
          <p className="text-[1rem] font-semibold" style={{ color: 'var(--paper-ink)' }}>这份决策已标记为放弃</p>
          <p className="mt-3 text-[0.85rem] leading-relaxed" style={{ color: 'var(--paper-ink-soft)' }}>
            当时的判断仍然保留在正面，作为一份没有结果的档案。
          </p>
        </div>
      ) : (
        <div className="py-5 text-center">
          <Clock size={30} strokeWidth={1.2} className="mx-auto mb-4" style={{ color: 'var(--paper-ink-soft)' }} />
          <p className="text-[1.05rem] font-semibold" style={{ color: 'var(--paper-ink)' }}>
            仍在等待回访
          </p>
          <p className="mono mt-3 text-[0.82rem]" style={{ color: 'var(--paper-ink-soft)' }}>
            {remaining > 0 ? `距离 ${formatDate(d.reviewAt)} 还有 ${remaining} 天` : '回访日期已到'}
          </p>
          <p className="mx-auto mt-5 max-w-sm text-[0.83rem] leading-relaxed" style={{ color: 'var(--paper-ink-soft)' }}>
            到时候，你需要先独立写下实际结果并保存，才能拆开正面封存的理由。这是这封信最重要的规则。
          </p>
        </div>
      )}
    </ArchiveCard>
  )
}

export default function DecisionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { decisions, updateDecision, removeDecision } = useDecisions()
  const d = decisions.find((item) => item.id === id)
  const [flipped, setFlipped] = useState(false)
  const [confirm, setConfirm] = useState<null | 'abandon' | 'restore' | 'delete'>(null)

  if (!d) {
    return (
      <div className="fade-up">
        <PageHeader eyebrow="ARCHIVE" title="找不到这份档案" onBack={() => navigate('/list')} />
        <EmptyState
          title="档案不存在或已被删除。"
          actionLabel="返回全部记录"
          onAction={() => navigate('/list')}
        />
      </div>
    )
  }

  const isDue = d.status === 'open' && daysUntil(d.reviewAt) <= 0

  const dialogConfig = {
    abandon: {
      title: '标记为已放弃？',
      message: '这份决策将不再出现在待回访信封墙中。当时的判断会完整保留，之后可以恢复。',
      confirmLabel: '确认放弃',
      danger: true,
    },
    restore: {
      title: '恢复为待回访？',
      message: '这份档案会重新回到待回访列表。',
      confirmLabel: '恢复',
      danger: false,
    },
    delete: {
      title: '删除这份档案？',
      message: '此操作不可撤销，这份决策的当时视角与回访内容都会被永久删除。建议先到「设置」导出一份备份。',
      confirmLabel: '永久删除',
      danger: true,
    },
  } as const

  const runConfirm = () => {
    if (confirm === 'abandon') updateDecision(d.id, { status: 'abandoned' })
    if (confirm === 'restore') updateDecision(d.id, { status: 'open' })
    if (confirm === 'delete') {
      removeDecision(d.id)
      setConfirm(null)
      navigate('/list')
      return
    }
    setConfirm(null)
  }

  return (
    <div className="fade-up">
      <PageHeader
        eyebrow={`ARCHIVE / ${fileNo(d.id)}`}
        title="双面档案卡"
        subtitle="正面是当时的判断，背面是后来发生的事。两者不会互相覆盖。"
        onBack={() => navigate('/list')}
        backLabel="返回全部记录"
        right={
          <span className={`badge ${d.status === 'reviewed' ? 'badge--gold' : d.status === 'open' ? 'badge--due' : ''}`}>
            {STATUS_LABEL[d.status]}
          </span>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setFlipped((v) => !v)}
          aria-pressed={flipped}
        >
          <RotateCcw size={16} /> {flipped ? '翻回当时视角' : '翻到回访视角'}
        </button>
        <span className="mono text-[0.68rem]" style={{ color: 'var(--text-faint)' }}>
          {flipped ? 'VERSO / 回访视角' : 'RECTO / 当时视角'}
        </span>
      </div>

      {/* grid 叠放：容器高度取两面最大值，手机端也永远不会裁切内容 */}
      <div className="flip-scene">
        <div className={`flip-stack ${flipped ? 'is-flipped' : ''}`}>
          <div className={`flip-face flip-face--front ${flipped ? 'is-hidden' : 'is-shown'}`}>
            <FrontFace d={d} />
          </div>
          <div className={`flip-face flip-face--back ${flipped ? 'is-shown' : 'is-hidden'}`}>
            <BackFace d={d} />
          </div>
        </div>
      </div>

      <div className="archive-panel grain mt-6 p-4 sm:p-6">
        {isDue ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.86rem] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              回访日期已到。拆封时请先独立写下实际结果。
            </p>
            <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={() => navigate(`/review/${d.id}`)}>
              开始回访 <ArrowRight size={16} />
            </button>
          </div>
        ) : d.status === 'open' ? (
          <p className="text-[0.86rem] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            距离回访还有 {Math.max(0, daysUntil(d.reviewAt))} 天。时间未到，信封保持封存。
          </p>
        ) : (
          <p className="text-[0.86rem] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            这份档案已归档。你可以反复查看，但当时的理由不会被修改。
          </p>
        )}

        <div className="hairline my-5" />
        <div className="flex flex-wrap gap-2">
          {d.status === 'open' && (
            <button type="button" className="btn btn-quiet" onClick={() => setConfirm('abandon')}>
              标记为已放弃
            </button>
          )}
          {d.status === 'abandoned' && (
            <button type="button" className="btn btn-quiet" onClick={() => setConfirm('restore')}>
              恢复为待回访
            </button>
          )}
          <button type="button" className="btn btn-quiet" style={{ color: 'var(--due)' }} onClick={() => setConfirm('delete')}>
            <Trash2 size={15} /> 删除这份档案
          </button>
        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          open
          title={dialogConfig[confirm].title}
          message={dialogConfig[confirm].message}
          confirmLabel={dialogConfig[confirm].confirmLabel}
          danger={dialogConfig[confirm].danger}
          requireText={confirm === 'delete' ? '删除' : undefined}
          onConfirm={runConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
