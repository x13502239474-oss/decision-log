import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Mail, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ArchiveCard from '../components/ArchiveCard'
import SealCeremony from '../components/SealCeremony'
import { useDecisions } from '../hooks/useDecisions'
import {
  CONFIDENCE_HINT,
  CONFIDENCE_KEYS,
  REVERSIBILITY_HINT,
  REVERSIBILITY_KEYS,
  REVERSIBILITY_LABEL,
  STAKES_KEYS,
  STAKES_LABEL,
} from '../lib/labels'
import { addMonths, formatDate, isValidDateKey, todayKey } from '../lib/date'
import { createId } from '../lib/id'
import type { Decision, DecisionDraft, DecisionOption, Reversibility, Stakes } from '../types/decision'

interface OptionDraft {
  id: string
  label: string
  pros: string
  cons: string
  expectedOutcome: string
}

const emptyOption = (): OptionDraft => ({
  id: createId(),
  label: '',
  pros: '',
  cons: '',
  expectedOutcome: '',
})

const splitLines = (value: string): string[] =>
  value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

const STEPS = ['记录情境', '选择与理由', '信心与回访日期'] as const

export default function NewDecision() {
  const navigate = useNavigate()
  const { addDecision } = useDecisions()
  const goHome = useCallback(() => navigate('/'), [navigate])

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [title, setTitle] = useState('')
  const [context, setContext] = useState('')
  const [options, setOptions] = useState<OptionDraft[]>([emptyOption(), emptyOption()])
  const [chosen, setChosen] = useState('')
  const [customMode, setCustomMode] = useState(false)
  const [customChosen, setCustomChosen] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [reversibility, setReversibility] = useState<Reversibility>('hard')
  const [stakes, setStakes] = useState<Stakes>('medium')
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [reviewAt, setReviewAt] = useState<string>(() => addMonths(todayKey(), 3))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sealed, setSealed] = useState<Decision | null>(null)

  const validOptions = options.filter((o) => o.label.trim().length > 0)
  const effectiveChosen = customMode ? customChosen.trim() : chosen.trim()

  const patchOption = (id: string, key: keyof OptionDraft, value: string) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, [key]: value } : o)))
    setErrors((prev) => ({ ...prev, options: '' }))
  }

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = '请给这个决定起个名字'
    if (!context.trim()) e.context = '请写下当时的背景情境，未来的你需要它'
    if (!validOptions.length) e.options = '至少填写一个备选方案的名称'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e: Record<string, string> = {}
    if (!effectiveChosen) e.chosen = '请选择或填写最终选择'
    if (!reasoning.trim()) e.reasoning = '请写下当时的理由，这是这封信最重要的部分'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const goNext = () => {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  const seal = () => {
    const e: Record<string, string> = {}
    if (!isValidDateKey(reviewAt)) e.reviewAt = '请选择有效的回访日期'
    setErrors(e)
    if (Object.keys(e).length) return
    // 回到对应步骤再确认一次，避免跳过校验直接提交
    if (!title.trim() || !context.trim() || !validOptions.length) {
      validateStep1()
      setStep(1)
      return
    }
    if (!effectiveChosen || !reasoning.trim()) {
      validateStep2()
      setStep(2)
      return
    }

    const builtOptions: DecisionOption[] = validOptions.map((o) => ({
      id: o.id,
      label: o.label.trim(),
      pros: splitLines(o.pros),
      cons: splitLines(o.cons),
      expectedOutcome: o.expectedOutcome.trim(),
    }))

    const draft: DecisionDraft = {
      title: title.trim(),
      context: context.trim(),
      options: builtOptions,
      chosen: effectiveChosen,
      reasoning: reasoning.trim(),
      confidence,
      reversibility,
      stakes,
      reviewAt,
    }

    // 先同步写入 localStorage，再播放封存动画；动画期间刷新也不会丢数据
    const saved = addDecision(draft)
    setSealed(saved)
  }

  return (
    <div className="fade-up">
      <PageHeader
        eyebrow="NEW RECORD / 新建档案"
        title="给未来寄一封信"
        subtitle="分三步封存此刻的判断。写入后，原始理由将不可修改。"
        onBack={goHome}
        backLabel="返回待回访"
      />

      {/* 步骤指示 */}
      <div className="mb-7 flex items-center gap-2 sm:gap-4">
        {STEPS.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3
          const active = step === n
          const done = step > n
          return (
            <div key={label} className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className="mono flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[0.66rem]"
                style={{
                  borderColor: active || done ? 'var(--gold)' : 'var(--line)',
                  color: active || done ? 'var(--gold)' : 'var(--text-faint)',
                  background: active ? 'var(--gold-soft)' : 'transparent',
                }}
              >
                {done ? '✓' : n}
              </span>
              <span
                className="truncate text-[0.72rem] sm:text-[0.8rem]"
                style={{ color: active ? 'var(--text)' : 'var(--text-faint)' }}
              >
                {label}
              </span>
              {i < 2 && <span className="hidden h-px flex-1 sm:block" style={{ background: 'var(--line-soft)' }} />}
            </div>
          )
        })}
      </div>

      {step === 1 && (
        <div className="archive-panel grain p-4 sm:p-7">
          <p className="eyebrow mb-1">STEP 01</p>
          <h2 className="mb-6 text-[1.28rem] font-semibold" style={{ color: 'var(--text)' }}>
            当时发生了什么？
          </h2>

          <div className="mb-6">
            <label className="field-label" htmlFor="d-title">
              决策标题<span className="required">*</span>
            </label>
            <input
              id="d-title"
              className="ink-input"
              value={title}
              maxLength={120}
              placeholder="例如：是否接受那份异地的工作邀请"
              onChange={(e) => {
                setTitle(e.target.value)
                setErrors((p) => ({ ...p, title: '' }))
              }}
            />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>

          <div className="mb-8">
            <label className="field-label" htmlFor="d-context">
              背景情境<span className="required">*</span>
            </label>
            <textarea
              id="d-context"
              className="ink-textarea"
              style={{ minHeight: 118 }}
              value={context}
              placeholder="当时你面对的是什么局面？有哪些已知信息、限制和时间压力？"
              onChange={(e) => {
                setContext(e.target.value)
                setErrors((p) => ({ ...p, context: '' }))
              }}
            />
            <p className="field-hint">只写当时真正知道的事，不要写入后来才发生的结果。</p>
            {errors.context && <p className="field-error">{errors.context}</p>}
          </div>

          <div className="hairline mb-6" />
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="field-label mb-0">备选方案<span className="required">*</span></p>
              <p className="field-hint">至少填写一个方案；优势 / 劣势每行一条。</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setOptions((p) => [...p, emptyOption()])}
            >
              <Plus size={16} /> 添加方案
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {options.map((o, index) => (
              <ArchiveCard key={o.id} tone="kraft" className="p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="mono text-[0.68rem]" style={{ color: 'var(--paper-ink-soft)' }}>
                    方案 {String.fromCharCode(65 + index)} / OPTION
                  </span>
                  <button
                    type="button"
                    aria-label={`删除方案 ${String.fromCharCode(65 + index)}`}
                    className="flex h-11 w-11 items-center justify-center rounded disabled:opacity-30"
                    style={{ color: 'var(--stamp)' }}
                    disabled={options.length <= 1}
                    onClick={() => setOptions((p) => p.filter((x) => x.id !== o.id))}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="field-label !text-[0.74rem]" style={{ color: 'var(--paper-ink)' }}>
                      方案名称
                    </label>
                    <input
                      className="paper-input"
                      value={o.label}
                      placeholder="这个方案叫什么？"
                      onChange={(e) => patchOption(o.id, 'label', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="field-label !text-[0.74rem]" style={{ color: 'var(--paper-ink)' }}>
                      优势（每行一条）
                    </label>
                    <textarea
                      className="paper-textarea"
                      style={{ minHeight: 84 }}
                      value={o.pros}
                      placeholder={'收入更高\n能接触新领域'}
                      onChange={(e) => patchOption(o.id, 'pros', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="field-label !text-[0.74rem]" style={{ color: 'var(--paper-ink)' }}>
                      劣势（每行一条）
                    </label>
                    <textarea
                      className="paper-textarea"
                      style={{ minHeight: 84 }}
                      value={o.cons}
                      placeholder={'要离开熟悉的城市\n不确定能否适应'}
                      onChange={(e) => patchOption(o.id, 'cons', e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label !text-[0.74rem]" style={{ color: 'var(--paper-ink)' }}>
                      预期结果
                    </label>
                    <textarea
                      className="paper-textarea"
                      style={{ minHeight: 70 }}
                      value={o.expectedOutcome}
                      placeholder="如果选它，你预计会发生什么？"
                      onChange={(e) => patchOption(o.id, 'expectedOutcome', e.target.value)}
                    />
                  </div>
                </div>
              </ArchiveCard>
            ))}
          </div>
          {errors.options && <p className="field-error mt-3">{errors.options}</p>}
        </div>
      )}

      {step === 2 && (
        <div className="archive-panel grain p-4 sm:p-7">
          <p className="eyebrow mb-1">STEP 02</p>
          <h2 className="mb-6 text-[1.28rem] font-semibold" style={{ color: 'var(--text)' }}>
            你为什么这样选择？
          </h2>

          <div className="mb-8">
            <p className="field-label">最终选择<span className="required">*</span></p>
            <div className="segment">
              {validOptions.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`segment-item ${!customMode && chosen === o.label ? 'is-active' : ''}`}
                  onClick={() => {
                    setCustomMode(false)
                    setChosen(o.label)
                    setErrors((p) => ({ ...p, chosen: '' }))
                  }}
                >
                  {o.label}
                </button>
              ))}
              <button
                type="button"
                className={`segment-item ${customMode ? 'is-active' : ''}`}
                onClick={() => setCustomMode(true)}
              >
                手动填写
              </button>
            </div>
            {customMode && (
              <input
                className="ink-input mt-3"
                value={customChosen}
                placeholder="写下你的最终选择"
                onChange={(e) => {
                  setCustomChosen(e.target.value)
                  setErrors((p) => ({ ...p, chosen: '' }))
                }}
              />
            )}
            {errors.chosen && <p className="field-error">{errors.chosen}</p>}
          </div>

          {/* 决策理由：整个表单的视觉重点 */}
          <ArchiveCard tone="old" binding className="mb-8 p-5 pl-9 sm:p-7 sm:pl-12">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow" style={{ color: 'var(--stamp)' }}>THE REASON / 封存的核心</p>
                <h3 className="mt-1.5 text-[1.1rem] font-semibold" style={{ color: 'var(--paper-ink)' }}>
                  当时的理由
                </h3>
              </div>
              <span className="handnote text-[0.95rem]">写给未来的我</span>
            </div>
            <textarea
              className="paper-textarea"
              style={{ minHeight: 230, fontSize: 16 }}
              value={reasoning}
              placeholder="如果三个月后的你来看，需要知道什么才能理解这个决定？"
              onChange={(e) => {
                setReasoning(e.target.value)
                setErrors((p) => ({ ...p, reasoning: '' }))
              }}
            />
            <p className="mt-3 text-[0.76rem] leading-relaxed" style={{ color: 'var(--paper-ink-soft)' }}>
              写清楚你依据什么做判断、哪些信息被你忽略、以及你愿意承担的代价。封存后不可修改。
            </p>
            {errors.reasoning && <p className="field-error">{errors.reasoning}</p>}
          </ArchiveCard>

          <div className="grid gap-7 sm:grid-cols-2">
            <div>
              <p className="field-label">决策不可逆程度</p>
              <div className="segment">
                {REVERSIBILITY_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`segment-item ${reversibility === k ? 'is-active' : ''}`}
                    onClick={() => setReversibility(k)}
                  >
                    {REVERSIBILITY_LABEL[k]}
                  </button>
                ))}
              </div>
              <p className="field-hint">{REVERSIBILITY_HINT[reversibility]}</p>
            </div>
            <div>
              <p className="field-label">决策重要程度</p>
              <div className="segment">
                {STAKES_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`segment-item ${stakes === k ? 'is-active' : ''}`}
                    onClick={() => setStakes(k)}
                  >
                    {STAKES_LABEL[k]}
                  </button>
                ))}
              </div>
              <p className="field-hint">这个决定会影响你生活的多大范围？</p>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="archive-panel grain p-4 sm:p-7">
          <p className="eyebrow mb-1">STEP 03</p>
          <h2 className="mb-6 text-[1.28rem] font-semibold" style={{ color: 'var(--text)' }}>
            你有多确定？
          </h2>

          <div className="mb-8">
            <p className="field-label">信心程度 · 1—5 分</p>
            <div className="grid grid-cols-5 gap-2">
              {CONFIDENCE_KEYS.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`信心 ${n} 分`}
                  className={`segment-item !min-h-[68px] flex-col !gap-1 !px-1 ${confidence === n ? 'is-active' : ''}`}
                  onClick={() => setConfidence(n)}
                >
                  <span className="mono text-[0.95rem] font-semibold">{n}</span>
                  <span className="text-[0.62rem] leading-none" style={{ color: 'var(--gold)' }}>
                    {'●'.repeat(n)}
                    <span style={{ opacity: 0.22 }}>{'○'.repeat(5 - n)}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="field-hint">
              当前：<span style={{ color: 'var(--gold)' }}>{confidence} 分 · {CONFIDENCE_HINT[confidence]}</span>
            </p>
          </div>

          <div className="mb-6">
            <p className="field-label">回访日期<span className="required">*</span></p>
            <div className="segment mb-3">
              {[
                { label: '1 个月后', months: 1 },
                { label: '3 个月后', months: 3 },
                { label: '1 年后', months: 12 },
              ].map((s) => {
                const value = addMonths(todayKey(), s.months)
                return (
                  <button
                    key={s.label}
                    type="button"
                    className={`segment-item ${reviewAt === value ? 'is-active' : ''}`}
                    onClick={() => {
                      setReviewAt(value)
                      setErrors((p) => ({ ...p, reviewAt: '' }))
                    }}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
            <label className="field-hint mb-2 block" htmlFor="review-date">或自定义日期</label>
            <input
              id="review-date"
              type="date"
              className="ink-input max-w-[280px]"
              value={reviewAt}
              onChange={(e) => {
                setReviewAt(e.target.value)
                setErrors((p) => ({ ...p, reviewAt: '' }))
              }}
            />
            {errors.reviewAt && <p className="field-error">{errors.reviewAt}</p>}
          </div>

          <ArchiveCard tone="yellow" className="mb-2 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow" style={{ color: 'var(--paper-ink-soft)' }}>SEALED ON / 封存日期</p>
                <p className="mono mt-1.5 text-[0.9rem]" style={{ color: 'var(--paper-ink)' }}>
                  {formatDate(new Date().toISOString(), 'cn')}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="eyebrow" style={{ color: 'var(--paper-ink-soft)' }}>REVIEW ON / 回访日期</p>
                <p className="mono mt-1.5 text-[0.9rem]" style={{ color: 'var(--paper-ink)' }}>
                  {formatDate(reviewAt, 'cn')}
                </p>
              </div>
            </div>
            <div className="mt-4 border-t pt-3" style={{ borderColor: 'rgba(57,47,36,.22)' }}>
              <p className="text-[0.78rem] leading-relaxed" style={{ color: 'var(--paper-ink-soft)' }}>
                封存后，到达回访日期才能拆开。回访时你须先独立写下实际结果，才能看到此刻写下的理由。
              </p>
            </div>
          </ArchiveCard>
        </div>
      )}

      {/* 底部操作 */}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {step > 1 && (
            <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={() => setStep((step - 1) as 1 | 2)}>
              <ArrowLeft size={16} /> 上一步
            </button>
          )}
        </div>
        {step < 3 ? (
          <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={goNext}>
            下一步 <ArrowRight size={16} />
          </button>
        ) : (
          <button type="button" className="btn btn-stamp w-full sm:w-auto" onClick={seal}>
            <Mail size={17} /> 封存这项决策
          </button>
        )}
      </div>

      {sealed && <SealCeremony decision={sealed} onDone={goHome} />}
    </div>
  )
}
