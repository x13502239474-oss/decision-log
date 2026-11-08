import { Archive, BarChart3, Inbox, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  shortLabel: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '待回访', shortLabel: '待回访', icon: Inbox },
  { to: '/new', label: '新建决策', shortLabel: '新建', icon: Plus },
  { to: '/list', label: '全部记录', shortLabel: '记录', icon: Archive },
  { to: '/overview', label: '统计概览', shortLabel: '统计', icon: BarChart3 },
]
