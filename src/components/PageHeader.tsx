import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  right?: ReactNode
  onBack?: () => void
  backLabel?: string
  /** 首页大标题样式 */
  hero?: boolean
}

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
  onBack,
  backLabel = '返回',
  hero = false,
}: PageHeaderProps) {
  return (
    <header className="mb-7">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="btn btn-quiet -ml-3 mb-2 px-3"
          style={{ minHeight: 44 }}
        >
          <ChevronLeft size={17} /> {backLabel}
        </button>
      )}
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1
            className={`display-title font-semibold leading-tight ${hero ? 'text-[2.05rem] sm:text-[2.7rem]' : 'text-[1.55rem] sm:text-[1.9rem]'}`}
            style={{ color: 'var(--text)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2.5 text-[0.86rem] leading-relaxed sm:text-[0.92rem]" style={{ color: 'var(--text-dim)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
      </div>
    </header>
  )
}
