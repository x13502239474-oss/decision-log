import type { ReactNode } from 'react'

interface ArchiveCardProps {
  children: ReactNode
  tone?: 'old' | 'kraft' | 'yellow' | 'fresh'
  className?: string
  /** 左侧装订孔 */
  binding?: boolean
  /** 右上角档案编号 */
  fileNo?: string
}

/** 通用纸张卡片：真实纸感层次 + 极弱纹理。 */
export default function ArchiveCard({
  children,
  tone = 'old',
  className = '',
  binding = false,
  fileNo,
}: ArchiveCardProps) {
  const toneClass =
    tone === 'kraft'
      ? 'paper-card--kraft'
      : tone === 'yellow'
        ? 'paper-card--yellow'
        : tone === 'fresh'
          ? 'paper-card--fresh'
          : ''
  return (
    <section className={`paper-card grain ${toneClass} ${binding ? 'binding-holes' : ''} ${className}`}>
      {fileNo && (
        <span
          className="mono absolute right-4 top-3 z-10"
          style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: 'rgba(57,47,36,.55)' }}
        >
          {fileNo}
        </span>
      )}
      {children}
    </section>
  )
}
