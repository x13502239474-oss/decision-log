import { useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { AlertCircle, Check, Database, Download, FileText, Info, Moon, Sun, Trash2, Upload } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import { useDecisions } from '../hooks/useDecisions'
import { useTheme } from '../hooks/useTheme'
import { exportJsonBackup, exportMarkdownZip } from '../lib/export'
import { parseBackup } from '../lib/import'
import { STORAGE_KEY } from '../lib/storage'
import type { Decision } from '../types/decision'

interface PendingImport {
  fileName: string
  decisions: Decision[]
  skipped: number
  warning?: string
}

type Toast = { kind: 'ok' | 'error'; text: string } | null

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="archive-panel grain mb-5 p-4 sm:p-6">
      <p className="eyebrow mb-1">{eyebrow}</p>
      <h2 className="mb-1.5 text-[1.04rem] font-semibold" style={{ color: 'var(--text)' }}>{title}</h2>
      {description && (
        <p className="mb-5 text-[0.8rem] leading-relaxed" style={{ color: 'var(--text-dim)' }}>{description}</p>
      )}
      {children}
    </section>
  )
}

function ActionRow({
  icon: Icon,
  title,
  note,
  buttonLabel,
  onClick,
  disabled,
  danger,
}: {
  icon: typeof Download
  title: string
  note: string
  buttonLabel: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <div className="flex flex-col gap-3 border-t py-4 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--line-soft)' }}>
      <div className="flex min-w-0 items-start gap-3">
        <Icon size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" style={{ color: danger ? 'var(--due)' : 'var(--gold)' }} />
        <div className="min-w-0">
          <p className="text-[0.88rem] font-medium" style={{ color: 'var(--text)' }}>{title}</p>
          <p className="mt-1 text-[0.76rem] leading-relaxed" style={{ color: 'var(--text-faint)' }}>{note}</p>
        </div>
      </div>
      <button
        type="button"
        className={`btn w-full shrink-0 sm:w-auto ${danger ? 'btn-danger' : 'btn-ghost'}`}
        onClick={onClick}
        disabled={disabled}
      >
        {buttonLabel}
      </button>
    </div>
  )
}

export default function Settings() {
  const { decisions, replaceAll, mergeAll, clearAll } = useDecisions()
  const { theme, setTheme } = useTheme()
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<Toast>(null)
  const [pending, setPending] = useState<PendingImport | null>(null)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmReplace, setConfirmReplace] = useState(false)

  const notify = (kind: 'ok' | 'error', text: string) => setToast({ kind, text })

  const doZip = async () => {
    setBusy(true)
    try {
      const count = await exportMarkdownZip(decisions)
      notify('ok', `已生成 ZIP 备份，包含 ${count} 个 Markdown 文件。`)
    } catch {
      notify('error', '生成 ZIP 失败，请稍后重试或更换浏览器。')
    } finally {
      setBusy(false)
    }
  }

  const doJson = () => {
    try {
      const count = exportJsonBackup(decisions)
      notify('ok', `已导出 JSON 完整备份，共 ${count} 条原始记录。`)
    } catch {
      notify('error', '导出 JSON 失败，请稍后重试。')
    }
  }

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fileName = file.name
    e.target.value = ''
    const reader = new FileReader()
    reader.onerror = () => notify('error', '文件读取失败，请重试。')
    reader.onload = () => {
      const result = parseBackup(String(reader.result ?? ''))
      if (!result.ok) {
        notify('error', result.error ?? '备份结构校验失败。')
        return
      }
      setPending({
        fileName,
        decisions: result.decisions,
        skipped: result.skipped,
        warning: result.warning,
      })
      setImportMode('merge')
      setToast(null)
    }
    reader.readAsText(file, 'utf-8')
  }

  const applyImport = () => {
    if (!pending) return
    if (importMode === 'merge') {
      const added = mergeAll(pending.decisions)
      notify('ok', `导入完成：新增 ${added} 条，重复 ID 已保留本机版本。`)
      setPending(null)
    } else {
      setConfirmReplace(true)
    }
  }

  return (
    <div className="fade-up">
      <PageHeader
        eyebrow="SETTINGS / 设置"
        title="档案室设置与备份"
        subtitle="所有数据只保存在这台设备的浏览器里。定期导出，是对抗数据丢失的唯一办法。"
      />

      {toast && (
        <div
          className="mb-5 flex items-start gap-3 rounded-sm border px-4 py-3"
          style={{
            borderColor: toast.kind === 'ok' ? 'rgba(182,154,103,.5)' : 'rgba(196,122,84,.5)',
            background: toast.kind === 'ok' ? 'var(--gold-soft)' : 'rgba(196,122,84,.1)',
          }}
          role="status"
        >
          {toast.kind === 'ok' ? (
            <Check size={17} className="mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} />
          ) : (
            <AlertCircle size={17} className="mt-0.5 shrink-0" style={{ color: 'var(--due)' }} />
          )}
          <p className="flex-1 text-[0.82rem] leading-relaxed" style={{ color: 'var(--text)' }}>{toast.text}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="flex h-11 w-8 shrink-0 items-center justify-center text-[0.75rem]"
            style={{ color: 'var(--text-dim)' }}
            aria-label="关闭提示"
          >
            关闭
          </button>
        </div>
      )}

      <Section
        eyebrow="BACKUP / 数据导出"
        title="把档案带走"
        description={`当前共 ${decisions.length} 条记录。Markdown 便于阅读，JSON 用于完整恢复原始数据。`}
      >
        <ActionRow
          icon={FileText}
          title="导出全部 Markdown 记录"
          note="每条决策单独一个 .md 文件，打包为 decision-capsule-backup-日期.zip。"
          buttonLabel={busy ? '生成中…' : '导出 ZIP'}
          onClick={doZip}
          disabled={busy}
        />
        <ActionRow
          icon={Database}
          title="导出 JSON 完整备份"
          note="包含全部字段与状态，可用于在本应用内完整恢复。"
          buttonLabel="导出 JSON"
          onClick={doJson}
        />
      </Section>

      <Section
        eyebrow="RESTORE / 数据导入"
        title="从备份恢复"
        description="导入前会先校验结构并显示识别结果，不会静默覆盖现有数据。"
      >
        <label
          className="btn btn-ghost mb-4 w-full cursor-pointer sm:w-auto"
          style={{ minHeight: 46 }}
        >
          <Upload size={16} /> 选择 JSON 备份文件
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFile}
          />
        </label>

        {pending && (
          <div className="rounded-sm border p-4" style={{ borderColor: 'var(--line)', background: 'rgba(0,0,0,.16)' }}>
            <p className="mono text-[0.7rem] break-any" style={{ color: 'var(--gold)' }}>{pending.fileName}</p>
            <p className="mt-2 text-[0.84rem] leading-relaxed" style={{ color: 'var(--text)' }}>
              识别到 <strong>{pending.decisions.length}</strong> 条有效决策
              {pending.skipped > 0 && `，跳过 ${pending.skipped} 条无效记录`}。
              本机当前有 {decisions.length} 条。
            </p>
            {pending.warning && (
              <p className="mt-2 text-[0.78rem] leading-relaxed" style={{ color: 'var(--due)' }}>{pending.warning}</p>
            )}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className={`segment-item w-full ${importMode === 'merge' ? 'is-active' : ''}`}
                onClick={() => setImportMode('merge')}
              >
                合并（保留现有数据）
              </button>
              <button
                type="button"
                className={`segment-item w-full ${importMode === 'replace' ? 'is-active' : ''}`}
                onClick={() => setImportMode('replace')}
              >
                覆盖（替换全部数据）
              </button>
            </div>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="btn btn-quiet" onClick={() => setPending(null)}>取消</button>
              <button type="button" className={`btn ${importMode === 'replace' ? 'btn-danger' : 'btn-primary'}`} onClick={applyImport}>
                确认导入
              </button>
            </div>
          </div>
        )}
      </Section>

      <Section eyebrow="APPEARANCE / 外观" title="档案室光线" description="深色是默认氛围；浅色适合在明亮环境下阅读。">
        <div className="segment">
          <button
            type="button"
            className={`segment-item ${theme === 'dark' ? 'is-active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={15} /> 深色
          </button>
          <button
            type="button"
            className={`segment-item ${theme === 'light' ? 'is-active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={15} /> 浅色
          </button>
        </div>
      </Section>

      <Section eyebrow="DANGER ZONE / 危险操作" title="清空全部数据" description="删除本机所有决策与回访内容，不可撤销。">
        <ActionRow
          icon={Trash2}
          title="清空全部数据"
          note="会移除全部档案。建议先导出一份 JSON 备份。"
          buttonLabel="清空数据"
          onClick={() => setConfirmClear(true)}
          danger
        />
      </Section>

      <Section eyebrow="ABOUT / 关于" title="数据放在哪里" description="本应用不需要登录、没有后端、不调用任何 API。">
        <div className="space-y-3 text-[0.82rem] leading-[1.85]" style={{ color: 'var(--text-dim)' }}>
          <p className="flex items-start gap-2">
            <Database size={15} className="mt-1 shrink-0" style={{ color: 'var(--gold)' }} />
            <span>数据保存在浏览器 localStorage（键名 <span className="mono">{STORAGE_KEY}</span>），刷新页面不会丢失；清除站点数据、更换设备或使用无痕模式会丢失，请定期导出备份。</span>
          </p>
          <p className="flex items-start gap-2">
            <Info size={15} className="mt-1 shrink-0" style={{ color: 'var(--gold)' }} />
            <span>手机使用：iPhone Safari 用「分享 → 添加到主屏幕」；Android Chrome 用菜单里的「安装应用」。安装后可全屏离线打开。</span>
          </p>
          <p className="flex items-start gap-2">
            <AlertCircle size={15} className="mt-1 shrink-0" style={{ color: 'var(--gold)' }} />
            <span>iOS Safari 的 PWA 能力受系统限制，不提供后台自动同步或推送提醒；回访日期是否到期，由你打开应用时按本机日期判断。这些能力 Android 与 iOS 并不完全一致。</span>
          </p>
          <p className="flex items-start gap-2">
            <Download size={15} className="mt-1 shrink-0" style={{ color: 'var(--gold)' }} />
            <span>iOS Safari 下载文件时可能弹出预览而非直接保存，请在「文件」App 中查找下载的 ZIP / JSON。</span>
          </p>
        </div>
      </Section>

      <ConfirmDialog
        open={confirmClear}
        title="确认清空全部数据？"
        message={
          <>
            <p>这将永久删除本机 <strong>{decisions.length}</strong> 条决策及其全部回访内容，无法撤销。</p>
            <p className="mt-2">强烈建议先「导出 JSON 完整备份」。</p>
          </>
        }
        confirmLabel="我已了解，清空数据"
        danger
        requireText="清空"
        onConfirm={() => {
          clearAll()
          setConfirmClear(false)
          notify('ok', '全部数据已清空。')
        }}
        onCancel={() => setConfirmClear(false)}
      />

      <ConfirmDialog
        open={confirmReplace}
        title="确认覆盖现有数据？"
        message={
          <>
            <p>本机当前的 <strong>{decisions.length}</strong> 条记录会被备份文件中的 <strong>{pending?.decisions.length ?? 0}</strong> 条完全替换，此操作不可撤销。</p>
            <p className="mt-2">如果只是想补充记录，请返回选择「合并」。</p>
          </>
        }
        confirmLabel="覆盖并导入"
        danger
        requireText="覆盖"
        onConfirm={() => {
          if (pending) {
            replaceAll(pending.decisions)
            notify('ok', `已用备份覆盖，当前共 ${pending.decisions.length} 条记录。`)
            setPending(null)
          }
          setConfirmReplace(false)
        }}
        onCancel={() => setConfirmReplace(false)}
      />
    </div>
  )
}
