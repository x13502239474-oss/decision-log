import { useNavigate } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { useDecisions } from '../hooks/useDecisions'
import { computeOverview } from '../lib/export'
import { COMPARISON_KEYS, COMPARISON_LABEL, CONFIDENCE_KEYS, STAKES_KEYS, STAKES_LABEL } from '../lib/labels'

function StatCard({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="archive-panel grain p-4 sm:p-5">
      <p className="typewriter">{label}</p>
      <p className="display-title mt-2 text-[2.5rem] font-semibold leading-none" style={{ color: 'var(--text)' }}>
        {String(value).padStart(2, '0')}
      </p>
      <p className="mt-2 text-[0.74rem]" style={{ color: 'var(--text-faint)' }}>{note}</p>
    </div>
  )
}

function BarRow({
  label,
  value,
  total,
  tone,
  suffix,
}: {
  label: string
  value: number
  total: number
  tone?: 'worse' | 'better'
  suffix?: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[0.82rem]" style={{ color: 'var(--text)' }}>{label}</span>
        <span className="mono text-[0.72rem]" style={{ color: 'var(--text-dim)' }}>
          {value} 项 · {pct}%{suffix ?? ''}
        </span>
      </div>
      <div className="bar-track">
        <div
          className={`bar-fill ${tone === 'worse' ? 'bar-fill--worse' : tone === 'better' ? 'bar-fill--better' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function Overview() {
  const { decisions } = useDecisions()
  const navigate = useNavigate()
  const stats = computeOverview(decisions)

  if (!stats.total) {
    return (
      <div className="fade-up">
        <PageHeader
          eyebrow="OVERVIEW / 统计概览"
          title="还没有可以统计的记录"
          subtitle="所有数字都来自你本机保存的真实决策。"
        />
        <EmptyState
          icon={BarChart3}
          title="档案室里还没有数据。"
          description="写下第一项决策后，这里会自动出现数量、分布与结果对比。不会显示任何示例数字。"
          actionLabel="新建一项决策"
          onAction={() => navigate('/new')}
        />
      </div>
    )
  }

  return (
    <div className="fade-up">
      <PageHeader
        eyebrow="OVERVIEW / 统计概览"
        title="这段时间，你记下了什么"
        subtitle="全部数字由本机保存的决策实时计算，不含任何示例数据。"
      />

      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="TOTAL / 总决策" value={stats.total} note="所有封存的档案" />
        <StatCard label="OPEN / 待回访" value={stats.open} note="仍在等待拆封" />
        <StatCard label="REVIEWED / 已回访" value={stats.reviewed} note="已完成对照与反思" />
        <StatCard label="ABANDONED / 已放弃" value={stats.abandoned} note="标记放弃的档案" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="archive-panel grain p-4 sm:p-6">
          <p className="eyebrow mb-1">DISTRIBUTION 01</p>
          <h2 className="mb-5 text-[1.02rem] font-semibold" style={{ color: 'var(--text)' }}>重要程度分布</h2>
          {STAKES_KEYS.map((k) => (
            <BarRow key={k} label={`${STAKES_LABEL[k]}重要程度`} value={stats.stakes[k]} total={stats.total} />
          ))}
        </section>

        <section className="archive-panel grain p-4 sm:p-6">
          <p className="eyebrow mb-1">DISTRIBUTION 02</p>
          <h2 className="mb-5 text-[1.02rem] font-semibold" style={{ color: 'var(--text)' }}>信心评分分布</h2>
          {CONFIDENCE_KEYS.map((n) => (
            <BarRow key={n} label={`${n} 分`} value={stats.confidence[n]} total={stats.total} />
          ))}
        </section>

        <section className="archive-panel grain p-4 sm:p-6 lg:col-span-2">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="eyebrow mb-1">DISTRIBUTION 03</p>
              <h2 className="text-[1.02rem] font-semibold" style={{ color: 'var(--text)' }}>实际结果 vs 当初预期</h2>
            </div>
            <span className="mono text-[0.7rem]" style={{ color: 'var(--text-faint)' }}>
              基于 {stats.reviewedWithComparison} 份已完成对比的回访
            </span>
          </div>
          {stats.reviewedWithComparison === 0 ? (
            <p className="py-4 text-[0.84rem] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              还没有完成回访的记录。等第一封信被拆开并填写结果对比后，这里才会显示比例。
            </p>
          ) : (
            COMPARISON_KEYS.map((k) => (
              <BarRow
                key={k}
                label={COMPARISON_LABEL[k]}
                value={stats.comparison[k]}
                total={stats.reviewedWithComparison}
                tone={k === 'worse' ? 'worse' : k === 'better' ? 'better' : undefined}
              />
            ))
          )}
        </section>
      </div>

      <p className="mt-6 text-[0.76rem] leading-relaxed" style={{ color: 'var(--text-faint)' }}>
        本期只做基础统计。统计结果由纯函数按决策状态、重要程度、信心与结果对比聚合而成，已为后续的「判断力校准面板」预留数据结构。
      </p>
    </div>
  )
}
