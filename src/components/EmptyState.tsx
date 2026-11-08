import { Mail } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: LucideIcon
  compact?: boolean
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Mail,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`archive-panel grain flex flex-col items-center justify-center text-center ${compact ? 'px-5 py-8' : 'px-6 py-14'}`}
    >
      <div
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border"
        style={{ borderColor: 'var(--line)', color: 'var(--gold)', background: 'var(--gold-soft)' }}
      >
        <Icon size={24} strokeWidth={1.3} />
      </div>
      <p className="text-[1rem] font-semibold leading-relaxed" style={{ color: 'var(--text)' }}>
        {title}
      </p>
      {description && (
        <p className="mt-2 max-w-xs text-[0.84rem] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button type="button" className="btn btn-ghost mt-6" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
