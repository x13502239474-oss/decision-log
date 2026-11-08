import JSZip from 'jszip'
import type { BackupPayload, Decision } from '../types/decision'
import { COMPARISON_LABEL, CONFIDENCE_HINT, REVERSIBILITY_LABEL, STAKES_LABEL, STATUS_LABEL } from './labels'
import { fileNo, formatDate } from './date'
import { backupStamp } from './storage'

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.position = 'fixed'
  a.style.opacity = '0'
  document.body.appendChild(a)
  a.click()
  window.setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 1500)
}

function safeFilename(title: string): string {
  const cleaned = title
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  return cleaned || '未命名决策'
}

function linesToBullets(items: string[]): string {
  if (!items.length) return '- （未填写）'
  return items.map((item) => `- ${item.replace(/\n/g, ' ')}`).join('\n')
}

export function decisionToMarkdown(d: Decision): string {
  const parts: string[] = []
  parts.push(`# ${d.title}`)
  parts.push('')
  parts.push(`> 档案编号 ${fileNo(d.id)} · 状态：${STATUS_LABEL[d.status]}`)
  parts.push('')
  parts.push(`- **决策时间**：${formatDate(d.decidedAt, 'cn')}`)
  parts.push(`- **回访时间**：${formatDate(d.reviewAt, 'cn')}`)
  parts.push(`- **信心程度**：${d.confidence} / 5（${CONFIDENCE_HINT[d.confidence]}）`)
  parts.push(`- **重要程度**：${STAKES_LABEL[d.stakes]}`)
  parts.push(`- **不可逆程度**：${REVERSIBILITY_LABEL[d.reversibility]}`)
  parts.push('')
  parts.push('## 一、背景情境')
  parts.push('')
  parts.push(d.context || '（未填写）')
  parts.push('')
  parts.push('## 二、备选方案')
  parts.push('')
  if (!d.options.length) {
    parts.push('（未记录备选方案）')
  } else {
    d.options.forEach((o, i) => {
      parts.push(`### ${String.fromCharCode(65 + i)} · ${o.label}`)
      parts.push('')
      parts.push('**优势**')
      parts.push(linesToBullets(o.pros))
      parts.push('')
      parts.push('**劣势**')
      parts.push(linesToBullets(o.cons))
      parts.push('')
      parts.push(`**预期结果**：${o.expectedOutcome || '（未填写）'}`)
      parts.push('')
    })
  }
  parts.push('## 三、最终选择')
  parts.push('')
  parts.push(d.chosen)
  parts.push('')
  parts.push('## 四、当时的理由')
  parts.push('')
  parts.push(d.reasoning)
  parts.push('')
  if (d.status === 'reviewed' || d.actualOutcome) {
    parts.push('## 五、实际发生的事情（回访）')
    parts.push('')
    parts.push(`- **实际回访时间**：${d.reviewedAt ? formatDate(d.reviewedAt, 'cn') : '—'}`)
    parts.push(`- **结果对比**：${d.outcomeVsExpectation ? COMPARISON_LABEL[d.outcomeVsExpectation] : '—'}`)
    parts.push('')
    parts.push('**实际结果**')
    parts.push('')
    parts.push(d.actualOutcome || '（未填写）')
    parts.push('')
    parts.push('**经验教训**')
    parts.push('')
    parts.push(d.lesson || '（未填写）')
    parts.push('')
  }
  parts.push('---')
  parts.push('')
  parts.push('_由「个人决策日志 · Decision Capsule」导出 · 数据仅保存在你的设备上_')
  parts.push('')
  return parts.join('\n')
}

export async function exportMarkdownZip(decisions: Decision[]): Promise<number> {
  const zip = new JSZip()
  const used = new Map<string, number>()
  const sorted = [...decisions].sort((a, b) => a.decidedAt.localeCompare(b.decidedAt))

  for (const d of sorted) {
    const date = d.decidedAt.slice(0, 10) || backupStamp()
    const base = `${date}_${safeFilename(d.title)}`
    const count = (used.get(base) ?? 0) + 1
    used.set(base, count)
    const name = count === 1 ? `${base}.md` : `${base}-${count}.md`
    zip.file(name, decisionToMarkdown(d))
  }

  if (!sorted.length) {
    zip.file(
      '说明.md',
      '# 决策日志备份\n\n当前没有任何决策记录，因此没有可导出的档案。\n',
    )
  }
  zip.file(
    'README.txt',
    [
      '个人决策日志 · Decision Capsule',
      `导出时间：${backupStamp()}`,
      `共 ${sorted.length} 条决策，每条记录一个 Markdown 文件。`,
      '如需完整恢复数据，请使用「导出 JSON 备份」生成的文件。',
      '',
    ].join('\n'),
  )

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
  downloadBlob(blob, `decision-capsule-backup-${backupStamp()}.zip`)
  return sorted.length
}

export function buildBackupPayload(decisions: Decision[]): BackupPayload {
  return {
    app: 'decision-capsule',
    version: 1,
    exportedAt: new Date().toISOString(),
    decisions,
  }
}

export function exportJsonBackup(decisions: Decision[]): number {
  const payload = buildBackupPayload(decisions)
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  downloadBlob(blob, `decision-capsule-json-${backupStamp()}.json`)
  return decisions.length
}

/** 概览统计：纯函数，输入真实数据，输出可复用的聚合结构。 */
export function computeOverview(decisions: Decision[]) {
  const stats = {
    total: decisions.length,
    open: 0,
    reviewed: 0,
    abandoned: 0,
    stakes: { low: 0, medium: 0, high: 0 },
    confidence: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    comparison: { better: 0, 'as-expected': 0, worse: 0 },
    reviewedWithComparison: 0,
  }
  for (const d of decisions) {
    stats[d.status] += 1
    stats.stakes[d.stakes] += 1
    stats.confidence[d.confidence] += 1
    if (d.status === 'reviewed' && d.outcomeVsExpectation) {
      stats.comparison[d.outcomeVsExpectation] += 1
      stats.reviewedWithComparison += 1
    }
  }
  return stats
}
