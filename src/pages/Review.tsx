import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowRight, Check, Lock, MailOpen } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ArchiveCard from '../components/ArchiveCard'
import EmptyState from '../components/EmptyState'
import { PostalStamp, WaxSeal } from '../components/PostalStamp'
import { useDecisions } from '../hooks/useDecisions'
import { daysBetween, fileNo, formatDate, todayKey } from '../lib/date'
import { COMPARISON_KEYS, COMPARISON_LABEL, CONFIDENCE_HINT } from '../lib/labels'
import type { Decision, OutcomeComparison } from '../types/decision'

type Stage = 'blind' | 'opening' | 'reveal' | 'reflect' | 'done' | 'missing'

/* ------------------------------------------------------------------
   第一阶段：盲写。
   这个组件只接收标题与日期，类型上就拿不到 reasoning / chosen /
   options / confidence，从结构上杜绝「提前看到原始理由」。
   ------------------------------------------------------------------ */
interface BlindWriteProps {
  title: string
  decidedAt: string
  reviewAt: string
  fileNumber: string
  value: string
  error: string
  onChange: (value: string) => void
  onSubmit: () => void
}

function BlindWrite({
  title,
  decidedAt,
  reviewAt,
  fileNumber,
  value,
  error,
  onChange,
  onSubmit,
}: BlindWriteProps) {
  return (
    <div className="fade-up">
      <PageHeader
        eyebrow="REVIEW / 第一阶段 · 盲写结果"
        title="现在，告诉过去的自己发生了什么。"
        subtitle="先不要回头看当初的判断。请独立描述事情最终的结果。"
      />

      <ArchiveCard tone="fresh" className="mb-5 p-5 sm:p-7" fileNo={fileNumber}>
        <p className="eyebrow" style={{ color: 'var(--paper-ink-soft)' }}>CASE FILE / 待回访档案</p>
        <h2 className="mt-3 text-[1.24rem] font-semibold leading-snug break-any" style={{ color: 'var(--paper-ink)' }}>
          {title}
        </h2>
        <div className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-3" style={{ borderColor: 'rgba(57,47,36,.18)' }}>
          <div>
            <p className="typewriter" style={{ color: 'var(--paper-ink-soft)' }}>决策日期</p>
            <p className="mono mt-1.5 text-[0.84rem]" style={{ color: 'var(--paper-ink)' }}>{formatDate(decidedAt)}</p>
          </div>
          <div>
            <p className="typewriter" style={{ color: 'var(--paper-ink-soft)' }}>回访日期</p>
            <p className="mono mt-1.5 text-[0.84rem]" style={{ color: 'var(--paper-ink)' }}>{formatDate(reviewAt)}</p>
          </div>
          <div>
            <p className="typewriter" style={{ color: 'var(--paper-ink-soft)' }}>今日</p>
            <p className="mono mt-1.5 text-[0.84rem]" style={{ color: 'var(--paper-ink)' }}>{formatDate(todayKey())}</p>
          </div>
        </div>
      </ArchiveCard>

      <div
        className="mb-5 flex items-center gap-3 rounded-sm border px-4 py-3"
        style={{ borderColor: 'var(--line)', background: 'var(--gold-soft)' }}
      >
        <Lock size={17} style={{ color: 'var(--gold)' }} className="shrink-0" />
        <p className="text-[0.82rem] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
          此刻，当时的理由、选择与信心评分仍被封存。写下结果并保存后，才会为你打开。
        </p>
      </div>

      <div className="archive-panel grain p-4 sm:p-6">
        <label className="field-label" htmlFor="actual-outcome">
          实际结果<span className="required">*</span>
        </label>
        <textarea
          id="actual-outcome"
          className="ink-textarea"
          style={{ minHeight: 210 }}
          value={value}
          placeholder="事情最终是如何发展的？尽可能客观地记录事实。"
          onChange={(e) => onChange(e.target.value)}
        />
        <p className="field-hint">只写发生了什么，不写「我早就知道」。这一步的记录同样会被保存。</p>
        {error && <p className="field-error flex items-center gap-1.5"><AlertCircle size={14} /> {error}</p>}

        <div className="mt-6 flex justify-end">
          <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={onSubmit}>
            记录结果，拆开过去的信 <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

/** 拆封动画：信封封口掀起，信纸升起 */
function OpeningAnimation({ date }: { date: string }) {
  return (
    <div
      className="fixed inset-0 z-[95] flex flex-col items-center justify-center px-6"
      style={{ background: 'rgba(12,10,8,.95)' }}
      role="status"
      aria-live="polite"
    >
      <p className="typewriter mb-8">opening / 拆封中</p>
      <div className="relative w-full max-w-[320px]" style={{ height: 220 }}>
        <div className="letter-rise paper-card grain absolute left-1/2 top-0 z-10 w-[82%] -translate-x-1/2 px-5 py-6">
          <p className="text-center text-[0.92rem]" style={{ color: 'var(--paper-ink)' }}>
            档案已启封
          </p>
          <p className="mono mt-3 text-center" style={{ fontSize: '0.66rem', color: 'var(--paper-ink-soft)' }}>
            {formatDate(date)}
          </p>
        </div>
        <div className="envelope grain absolute bottom-0 left-0" style={{ height: 170, minHeight: 170 }}>
          <span className="env-fold" />
          <span className="env-edge" />
          <span className="open-flap env-flap" style={{ height: '56%' }} />
          <span className="env-seal" style={{ top: 'calc(56% - 23px)' }}>
            <WaxSeal char="启" tone="gold" />
          </span>
        </div>
      </div>
      <p className="letter-rise mt-7 text-center text-[0.88rem]" style={{ color: 'var(--text-dim)' }}>
        正在取出当初封存的判断……
      </p>
    </div>
  )
}

/** 时间线书脊：桌面竖向、手机横向 */
function Spine({ decision }: { decision: Decision }) {
  const span = Math.max(0, daysBetween(decision.decidedAt.slice(0, 10), todayKey()))
  return (
    <>
      <div className="hidden flex-col items-center justify-center lg:flex" aria-hidden="true">
        <div className="mono text-[0.58rem] tracking-widest" style={{ color: 'var(--text-faint)', writingMode: 'vertical-rl' }}>
          {formatDate(decision.decidedAt)}
        </div>
        <div className="my-3 w-px flex-1" style={{ background: 'var(--line)', minHeight: 60 }} />
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full border"
          style={{ borderColor: 'var(--gold)', color: 'var(--gold)', background: 'var(--bg-2)' }}
        >
          <span className="mono text-[0.6rem]">{span}d</span>
        </div>
        <div className="my-3 w-px flex-1" style={{ background: 'var(--line)', minHeight: 60 }} />
        <div className="mono text-[0.58rem] tracking-widest" style={{ color: 'var(--text-faint)', writingMode: 'vertical-rl' }}>
          {formatDate(todayKey())}
        </div>
      </div>
      <div className="flex items-center gap-3 py-4 lg:hidden" aria-hidden="true">
        <span className="mono text-[0.6rem]" style={{ color: 'var(--text-faint)' }}>{formatDate(decision.decidedAt)}</span>
        <span className="h-px flex-1" style={{ background: 'var(--line)' }} />
        <span className="mono text-[0.6rem]" style={{ color: 'var(--gold)' }}>相隔 {span} 天</span>
        <span className="h-px flex-1" style={{ background: 'var(--line)' }} />
        <span className="mono text-[0.6rem]" style={{ color: 'var(--text-faint)' }}>{formatDate(todayKey())}</span>
      </div>
    </>
  )
}

/** 第二阶段：左右（手机上下）对照 */
function Reveal({ decision, actualOutcome, onNext }: { decision: Decision; actualOutcome: string; onNext: () => void }) {
  return (
    <div className="fade-up">
      <PageHeader
        eyebrow="REVIEW / 第二阶段 · 揭开过去的判断"
        title="当时的判断，与真实发生的事"
        subtitle="左边是封存时的想法，右边是你刚刚写下的事实。它们从此并存，互不覆盖。"
      />

      <div className="grid grid-cols-1 items-stretch gap-0 lg:grid-cols-[1fr_64px_1fr]">
        <ArchiveCard tone="yellow" binding className="p-5 pl-10 sm:p-7 sm:pl-12" fileNo={fileNo(decision.id)}>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow" style={{ color: 'var(--paper-ink-soft)' }}>THEN / 当时的判断</p>
              <h2 className="mt-1 text-[1.08rem] font-semibold" style={{ color: 'var(--paper-ink)' }}>
                {formatDate(decision.decidedAt)} 封存
              </h2>
            </div>
            <PostalStamp date={decision.decidedAt} label="SEALED" />
          </div>

          <div className="space-y-5 text-[0.86rem] leading-[1.9]" style={{ color: 'var(--paper-ink)' }}>
            <div>
              <p className="typewriter mb-1.5" style={{ color: 'var(--paper-ink-soft)' }}>背景情境</p>
              <p className="break-any whitespace-pre-wrap">{decision.context}</p>
            </div>
            <div>
              <p className="typewriter mb-1.5" style={{ color: 'var(--paper-ink-soft)' }}>备选方案与当时预期</p>
              {decision.options.length ? (
                <ul className="space-y-3">
                  {decision.options.map((o, i) => (
                    <li key={o.id} className="border-l-2 pl-3" style={{ borderColor: 'rgba(57,47,36,.28)' }}>
                      <p className="font-semibold">{String.fromCharCode(65 + i)} · {o.label}</p>
                      <p className="mt-1 text-[0.82rem]">预期：{o.expectedOutcome || '（未填写）'}</p>
                      {!!o.pros.length && <p className="mt-1 text-[0.78rem]" style={{ color: 'var(--paper-ink-soft)' }}>优势：{o.pros.join('、')}</p>}
                      {!!o.cons.length && <p className="text-[0.78rem]" style={{ color: 'var(--paper-ink-soft)' }}>劣势：{o.cons.join('、')}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>（未记录备选方案）</p>
              )}
            </div>
            <div>
              <p className="typewriter mb-1.5" style={{ color: 'var(--paper-ink-soft)' }}>最终选择</p>
              <p className="font-semibold break-any">{decision.chosen}</p>
            </div>
            <div>
              <p className="typewriter mb-1.5" style={{ color: 'var(--paper-ink-soft)' }}>当时的理由</p>
              <p className="handnote !text-[0.95rem] !italic" style={{ color: 'var(--paper-ink)' }}>
                封存原文
              </p>
              <p className="mt-1 break-any whitespace-pre-wrap">{decision.reasoning}</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 border-t pt-4" style={{ borderColor: 'rgba(57,47,36,.2)' }}>
              <span className="mono text-[0.76rem]">信心 {decision.confidence}/5 · {CONFIDENCE_HINT[decision.confidence]}</span>
            </div>
          </div>
        </ArchiveCard>

        <Spine decision={decision} />

        <ArchiveCard tone="fresh" className="p-5 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow" style={{ color: 'var(--paper-ink-soft)' }}>NOW / 实际发生的事</p>
              <h2 className="mt-1 text-[1.08rem] font-semibold" style={{ color: 'var(--paper-ink)' }}>
                {formatDate(todayKey())} 记录
              </h2>
            </div>
            <MailOpen size={22} strokeWidth={1.4} style={{ color: 'var(--paper-ink-soft)' }} />
          </div>
          <p className="text-[0.88rem] leading-[1.95] break-any whitespace-pre-wrap" style={{ color: 'var(--paper-ink)' }}>
            {actualOutcome}
          </p>
          <div className="mt-8 border-t pt-4" style={{ borderColor: 'rgba(57,47,36,.16)' }}>
            <p className="text-[0.78rem] leading-relaxed" style={{ color: 'var(--paper-ink-soft)' }}>
              这段文字已在拆封前保存。即使现在看到过去的理由，它也不会被改写。
            </p>
          </div>
        </ArchiveCard>
      </div>

      <div className="mt-7 flex justify-end">
        <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={onNext}>
          继续，写下反思 <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default function Review() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { decisions, updateDecision } = useDecisions()
  const decision = decisions.find((d) => d.id === id)

  const [stage, setStage] = useState<Stage>(() => {
    if (!decision) return 'missing'
    if (decision.status !== 'open') return 'done'
    // 结果已保存但回访未完成时，允许直接进入对照阶段，不必重走盲写
    if (decision.actualOutcome?.trim()) return 'reveal'
    return 'blind'
  })
  const [outcome, setOutcome] = useState(decision?.actualOutcome ?? '')
  const [comparison, setComparison] = useState<OutcomeComparison | ''>(decision?.outcomeVsExpectation ?? '')
  const [lesson, setLesson] = useState(decision?.lesson ?? '')
  const [error, setError] = useState('')

  useEffect(() => {
    if (stage !== 'opening') return
    const timer = window.setTimeout(() => setStage('reveal'), 1650)
    return () => window.clearTimeout(timer)
  }, [stage])

  if (!decision || stage === 'missing') {
    return (
      <div className="fade-up">
        <PageHeader eyebrow="REVIEW" title="找不到这份档案" onBack={() => navigate('/')} />
        <EmptyState
          title="这份档案不存在或已被删除。"
          description="可以回到待回访首页，或到全部记录里查找。"
          actionLabel="返回待回访"
          onAction={() => navigate('/')}
        />
      </div>
    )
  }

  if (stage === 'done') {
    return (
      <div className="fade-up">
        <PageHeader eyebrow="REVIEW" title="这份档案已完成回访" onBack={() => navigate('/')} />
        <EmptyState
          title={decision.status === 'abandoned' ? '这份决策已标记为放弃。' : '你已经拆开过这封信。'}
          description="原始判断与回访内容都已归档，随时可以重新查看，但当时的理由不会被修改。"
          actionLabel="查看双面档案卡"
          onAction={() => navigate(`/decision/${decision.id}`)}
        />
      </div>
    )
  }

  /** 关键：先校验 → 先保存实际结果 → 再进入拆封动画 → 才展示原始理由 */
  const submitOutcome = () => {
    if (!outcome.trim()) {
      setError('请先写下实际结果，才能拆开过去的信。')
      return
    }
    setError('')
    updateDecision(decision.id, { actualOutcome: outcome.trim() })
    setStage('opening')
  }

  const finishReview = () => {
    if (!comparison) {
      setError('请选择一个结果对比，再完成回访。')
      return
    }
    setError('')
    updateDecision(decision.id, {
      status: 'reviewed',
      reviewedAt: new Date().toISOString(),
      actualOutcome: outcome.trim(),
      outcomeVsExpectation: comparison,
      lesson: lesson.trim(),
    })
    navigate('/')
  }

  if (stage === 'blind') {
    return (
      <BlindWrite
        title={decision.title}
        decidedAt={decision.decidedAt}
        reviewAt={decision.reviewAt}
        fileNumber={fileNo(decision.id)}
        value={outcome}
        error={error}
        onChange={(v) => {
          setOutcome(v)
          if (error) setError('')
        }}
        onSubmit={submitOutcome}
      />
    )
  }

  if (stage === 'opening') return <OpeningAnimation date={decision.decidedAt} />

  if (stage === 'reveal') {
    return <Reveal decision={decision} actualOutcome={outcome} onNext={() => setStage('reflect')} />
  }

  return (
    <div className="fade-up">
      <PageHeader
        eyebrow="REVIEW / 第三阶段 · 反思与归档"
        title="现在，你怎么看当时的判断？"
        subtitle="把这次对照留下来，它会成为下一次做决定时的参照。"
      />

      <div className="archive-panel grain p-4 sm:p-7">
        <div className="mb-8">
          <p className="field-label">结果对比<span className="required">*</span></p>
          <div className="grid gap-2 sm:grid-cols-3">
            {COMPARISON_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                className={`segment-item w-full ${comparison === k ? 'is-active' : ''}`}
                onClick={() => {
                  setComparison(k)
                  setError('')
                }}
              >
                {comparison === k && <Check size={15} />}
                {COMPARISON_LABEL[k]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className="field-label" htmlFor="lesson">经验教训</label>
          <textarea
            id="lesson"
            className="ink-textarea"
            style={{ minHeight: 180 }}
            value={lesson}
            placeholder="如果重新做一次决定，你会改变什么？这次经历告诉了你什么？"
            onChange={(e) => setLesson(e.target.value)}
          />
          <p className="field-hint">这一栏可以留空，但写下来会让下一次回访更有价值。</p>
        </div>

        {error && <p className="field-error flex items-center gap-1.5"><AlertCircle size={14} /> {error}</p>}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-ghost" onClick={() => setStage('reveal')}>
            回看对照
          </button>
          <button type="button" className="btn btn-primary" onClick={finishReview}>
            <Check size={17} /> 完成回访
          </button>
        </div>
      </div>
    </div>
  )
}
