import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertCircle, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  /** 需要用户输入该文本才能确认，用于清空数据等不可逆操作 */
  requireText?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  danger = false,
  requireText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (open) setTyped('')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null
  const blocked = !!requireText && typed.trim() !== requireText

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(9,8,6,.78)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="archive-panel grain w-full max-w-md overflow-y-auto p-5 sm:p-6"
        style={{ maxHeight: '86vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} style={{ color: danger ? 'var(--due)' : 'var(--gold)' }} />
            <h2 className="text-[1.02rem] font-semibold" style={{ color: 'var(--text)' }}>
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="关闭"
            className="flex h-11 w-11 items-center justify-center rounded"
            style={{ color: 'var(--text-dim)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 text-[0.88rem] leading-[1.85]" style={{ color: 'var(--text-dim)' }}>
          {message}
        </div>

        {requireText && (
          <div className="mt-4">
            <label className="field-label" htmlFor="confirm-text">
              请输入「{requireText}」以确认
            </label>
            <input
              id="confirm-text"
              className="ink-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={requireText}
              autoComplete="off"
            />
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            disabled={blocked}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
