import { formatDate } from '../lib/date'

interface PostalStampProps {
  date?: string
  label?: string
  tone?: 'default' | 'due' | 'reviewed'
  size?: 'sm' | 'lg'
  className?: string
}

/** 圆形双环邮戳，参考旧式邮政盖戳；刻意保留轻微倾斜与褪色感。 */
export function PostalStamp({
  date,
  label = 'SEALED',
  tone = 'default',
  size = 'sm',
  className = '',
}: PostalStampProps) {
  const toneClass =
    tone === 'due' ? 'postmark--due' : tone === 'reviewed' ? 'postmark--reviewed' : ''
  return (
    <div className={`postmark ${toneClass} ${size === 'lg' ? 'postmark-lg' : 'postmark-sm'} ${className}`}>
      <span style={{ fontSize: size === 'lg' ? '0.66rem' : '0.5rem', letterSpacing: '0.12em' }}>
        {label}
      </span>
      <span className="my-0.5" style={{ width: size === 'lg' ? 52 : 36, height: 1, background: 'currentColor', opacity: 0.7 }} />
      <span>{date ? formatDate(date) : '—'}</span>
    </div>
  )
}

interface WaxSealProps {
  char?: string
  tone?: 'red' | 'gold'
  className?: string
}

/** 蜡封 */
export function WaxSeal({ char = '封', tone = 'red', className = '' }: WaxSealProps) {
  return (
    <span className={`wax-seal ${tone === 'gold' ? 'wax-seal--gold' : ''} ${className}`} aria-hidden="true">
      {char}
    </span>
  )
}

/** 已回访方形印章 */
export function ReviewedStamp({ date }: { date?: string }) {
  return (
    <div
      className="inline-flex flex-col items-center justify-center px-3 py-1.5 text-center"
      style={{
        color: '#4e6b57',
        border: '2px solid currentColor',
        boxShadow: 'inset 0 0 0 1px currentColor',
        opacity: 0.78,
        transform: 'rotate(-9deg)',
        borderRadius: 2,
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight: 1.35,
      }}
    >
      <span className="text-[0.72rem] font-semibold tracking-[0.18em]">已 回 访</span>
      <span className="text-[0.55rem] tracking-wide opacity-80">{date ? formatDate(date) : ''}</span>
    </div>
  )
}
