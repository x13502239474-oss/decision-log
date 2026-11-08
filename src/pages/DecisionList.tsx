import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Search, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { useDecisions } from '../hooks/useDecisions'
import { fileNo, formatDate } from '../lib/date'
import { CONFIDENCE_KEYS, STAKES_LABEL, STATUS_LABEL } from '../lib/labels'
import type { Decision, DecisionStatus, Stakes } from '../types/decision'

type SortKey = 'decided-desc' | 'decided-asc' | 'review-asc' | 'review-desc'

const SORT_LABEL: Record<SortKey, string> = {
  'decided-desc': '封存日期 · 新到旧',
  'decided-asc': '封存日期 · 旧到新',
  'review-asc': '回访日期 · 近到远',
  'review-desc': '回访日期 · 远到近',
}

function haystack(d: Decision): string {
  return [
    d.title,
    d.context,
    d.chosen,
    d.reasoning,
    d.actualOutcome,
    d.lesson,
    ...d.options.flatMap((o) => [o.label, o.expectedOutcome, ...o.pros, ...o.cons]),
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase()
}

export default function DecisionList() {
  const { decisions } = useDecisions()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | DecisionStatus>('all')
  const [stakes, setStakes] = useState<'all' | Stakes>('all')
  const [confidence, setConfidence] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all')
  const [sort, setSort] = useState<SortKey>('decided-desc')

  const filtered = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    const result = decisions.filter((d) => {
      if (status !== 'all' && d.status !== status) return false
      if (stakes !== 'all' && d.stakes !== stakes) return false
      if (confidence !== 'all' && d.confidence !== Number(confidence)) return false
      if (words.length) {
        const text = haystack(d)
        if (!words.every((w) => text.includes(w))) return false
      }
      return true
    })
    return result.sort((a, b) => {
      switch (sort) {
        case 'decided-asc': return a.decidedAt.localeCompare(b.decidedAt)
        case 'review-asc': return a.reviewAt.localeCompare(b.reviewAt)
        case 'review-desc': return b.reviewAt.localeCompare(a.reviewAt)
        default: return b.decidedAt.localeCompare(a.decidedAt)
      }
    })
  }, [decisions, query, status, stakes, confidence, sort])

  const hasFilter = !!query || status !== 'all' || stakes !== 'all' || confidence !== 'all'
  const reset = () => {
    setQuery('')
    setStatus('all')
    setStakes('all')
    setConfidence('all')
    setSort('decided-desc')
  }

  return (
    <div className="fade-up">
      <PageHeader
        eyebrow="ALL RECORDS / 全部记录"
        title="所有寄出的信"
        subtitle={`共 ${decisions.length} 份档案 · 搜索、筛选并重新打开任意一份。`}
      />

      <div className="archive-panel grain mb-6 p-4 sm:p-5">
        <label className="field-label" htmlFor="search">全文搜索</label>
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
          <input
            id="search"
            className="ink-input !pl-10"
            value={query}
            placeholder="标题、情境、理由、方案、实际结果……"
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              aria-label="清空搜索"
              onClick={() => setQuery('')}
              className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center"
              style={{ color: 'var(--text-dim)' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="field-label !text-[0.74rem]" htmlFor="f-status">状态</label>
            <select id="f-status" className="ink-input" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="all">全部状态</option>
              <option value="open">待回访</option>
              <option value="reviewed">已回访</option>
              <option value="abandoned">已放弃</option>
            </select>
          </div>
          <div>
            <label className="field-label !text-[0.74rem]" htmlFor="f-stakes">重要程度</label>
            <select id="f-stakes" className="ink-input" value={stakes} onChange={(e) => setStakes(e.target.value as typeof stakes)}>
              <option value="all">全部</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
          <div>
            <label className="field-label !text-[0.74rem]" htmlFor="f-confidence">信心评分</label>
            <select id="f-confidence" className="ink-input" value={confidence} onChange={(e) => setConfidence(e.target.value as typeof confidence)}>
              <option value="all">全部</option>
              {CONFIDENCE_KEYS.map((n) => <option key={n} value={String(n)}>{n} 分</option>)}
            </select>
          </div>
          <div>
            <label className="field-label !text-[0.74rem]" htmlFor="f-sort">排序</label>
            <select id="f-sort" className="ink-input" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <option key={k} value={k}>{SORT_LABEL[k]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="mono text-[0.72rem]" style={{ color: 'var(--text-faint)' }}>
          显示 {filtered.length} / {decisions.length} 份
        </p>
        {hasFilter && (
          <button type="button" className="btn btn-quiet !min-h-11" onClick={reset}>
            <X size={14} /> 清除筛选
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={decisions.length ? '没有符合条件的档案。' : '档案室还是空的。'}
          description={decisions.length ? '换个关键词，或清除筛选条件试试。' : '写下第一个决定，寄给未来的自己。'}
          actionLabel={decisions.length ? '清除筛选' : '新建一项决策'}
          onAction={decisions.length ? reset : () => navigate('/new')}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => navigate(`/decision/${d.id}`)}
              className="archive-panel grain group flex w-full flex-col gap-3 p-4 text-left transition-colors sm:p-5"
              style={{ minHeight: 44 }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="mono text-[0.62rem]" style={{ color: 'var(--text-faint)' }}>{fileNo(d.id)}</p>
                  <h3 className="mt-1.5 text-[1rem] font-semibold leading-snug break-any sm:text-[1.08rem]" style={{ color: 'var(--text)' }}>
                    {d.title}
                  </h3>
                </div>
                <span
                  className={`badge ${d.status === 'reviewed' ? 'badge--gold' : d.status === 'open' ? 'badge--due' : ''}`}
                >
                  {STATUS_LABEL[d.status]}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                <span className="mono text-[0.7rem]" style={{ color: 'var(--text-dim)' }}>
                  封存 {formatDate(d.decidedAt)}
                </span>
                <span className="mono text-[0.7rem]" style={{ color: 'var(--text-dim)' }}>
                  回访 {formatDate(d.reviewAt)}
                </span>
                <span className="text-[0.74rem]" style={{ color: 'var(--text-dim)' }}>
                  重要程度 {STAKES_LABEL[d.stakes]}
                </span>
                <span className="text-[0.74rem]" style={{ color: 'var(--text-dim)' }}>
                  信心 {d.confidence}/5
                </span>
              </div>

              <div className="mt-1 flex items-center justify-end gap-1.5" style={{ color: 'var(--gold)' }}>
                <span className="text-[0.78rem]">查看双面档案卡</span>
                <ArrowRight size={14} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
