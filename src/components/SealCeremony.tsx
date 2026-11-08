import { useEffect, useRef } from 'react'
import { formatDate, fileNo } from '../lib/date'
import type { Decision } from '../types/decision'
import { PostalStamp, WaxSeal } from './PostalStamp'

interface SealCeremonyProps {
  decision: Decision
  onDone: () => void
}

/** 封存仪式：档案卡收进信封 → 封口 → 邮戳 → 提示，总时长约 2.3 秒。 */
export default function SealCeremony({ decision, onDone }: SealCeremonyProps) {
  const fired = useRef(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (fired.current) return
      fired.current = true
      onDone()
    }, 2350)
    return () => window.clearTimeout(timer)
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center px-5"
      style={{ background: 'rgba(12,10,8,.94)', backdropFilter: 'blur(6px)' }}
      role="status"
      aria-live="polite"
    >
      <div className="relative w-full max-w-[330px] text-center">
        <p className="typewriter mb-6">sealing / 封存中</p>

        <div className="relative" style={{ height: 236 }}>
          {/* 档案卡滑入信封 */}
          <div
            className="seal-card paper-card grain absolute left-1/2 top-0 z-20 w-[86%] -translate-x-1/2 px-5 py-5 text-left"
            style={{ color: 'var(--paper-ink)' }}
          >
            <p className="mono" style={{ fontSize: '0.6rem', color: 'var(--paper-ink-soft)' }}>
              {fileNo(decision.id)}
            </p>
            <p className="mt-3 text-[1rem] font-semibold leading-snug break-any">{decision.title}</p>
            <div className="my-3 h-px" style={{ background: 'rgba(57,47,36,.22)' }} />
            <p className="mono" style={{ fontSize: '0.62rem', color: 'var(--paper-ink-soft)' }}>
              回访 / {formatDate(decision.reviewAt)}
            </p>
          </div>

          {/* 信封 */}
          <div
            className="envelope grain absolute bottom-0 left-0 z-10"
            style={{ minHeight: 186, height: 186 }}
          >
            <span className="env-fold" />
            <span className="env-edge" />
            <span className="seal-flap env-flap" style={{ height: '56%' }} />
            <span className="env-seal" style={{ top: 'calc(56% - 23px)' }}>
              <WaxSeal char="封" />
            </span>
            <span
              className="seal-stamp absolute right-5 top-5 z-30"
              style={{ animationFillMode: 'both' }}
            >
              <PostalStamp date={decision.decidedAt} label="SEALED" size="lg" />
            </span>
          </div>
        </div>

        <p
          className="seal-message mt-7 text-[0.94rem] leading-relaxed"
          style={{ color: 'var(--text)' }}
        >
          已封存。未来的你会收到这封信。
        </p>
        <p className="seal-message mono mt-2" style={{ color: 'var(--text-faint)', fontSize: '0.66rem' }}>
          回访日期 {formatDate(decision.reviewAt)}
        </p>
      </div>
    </div>
  )
}
