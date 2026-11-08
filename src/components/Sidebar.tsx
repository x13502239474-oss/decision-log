import { Link, NavLink } from 'react-router-dom'
import { Moon, Settings, Sun } from 'lucide-react'
import { NAV_ITEMS } from '../lib/nav'
import { useTheme } from '../hooks/useTheme'
import { useDecisions } from '../hooks/useDecisions'
import { WaxSeal } from './PostalStamp'

export function Sidebar() {
  const { theme, toggle } = useTheme()
  const { decisions } = useDecisions()

  return (
    <aside
      className="fixed bottom-0 left-0 top-0 z-40 hidden w-[244px] flex-col border-r px-5 py-7 lg:flex"
      style={{ borderColor: 'var(--line-soft)', background: 'rgba(23,21,18,.55)' }}
    >
      <Link to="/" className="mb-10 block px-1">
        <div className="flex items-center gap-3">
          <WaxSeal char="决" />
          <div>
            <p className="text-[0.98rem] font-semibold tracking-wide" style={{ color: 'var(--text)' }}>
              个人决策日志
            </p>
            <p className="mono mt-1" style={{ fontSize: '0.58rem', letterSpacing: '0.16em', color: 'var(--text-faint)' }}>
              DECISION CAPSULE
            </p>
          </div>
        </div>
      </Link>

      <p className="typewriter mb-3 px-2">档案室 / ARCHIVE</p>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `side-nav-item relative ${isActive ? 'is-active' : ''}`}
          >
            <item.icon size={17} strokeWidth={1.6} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="hairline my-5" />

      <NavLink
        to="/settings"
        className={({ isActive }) => `side-nav-item relative ${isActive ? 'is-active' : ''}`}
      >
        <Settings size={17} strokeWidth={1.6} />
        <span>设置与备份</span>
      </NavLink>
      <button type="button" className="side-nav-item" onClick={toggle}>
        {theme === 'dark' ? <Sun size={17} strokeWidth={1.6} /> : <Moon size={17} strokeWidth={1.6} />}
        <span>{theme === 'dark' ? '切换浅色档案室' : '切换深色档案室'}</span>
      </button>

      <div className="mt-auto px-2">
        <p className="handnote text-[0.9rem]">Veritas ex tempore.</p>
        <p className="mt-2 text-[0.7rem] leading-relaxed" style={{ color: 'var(--text-faint)' }}>
          时间会给出答案 · 本机保存
        </p>
        <p className="mono mt-3" style={{ fontSize: '0.62rem', color: 'var(--text-faint)' }}>
          RECORDS / {String(decisions.length).padStart(3, '0')}
        </p>
      </div>
    </aside>
  )
}

/** 手机端顶部条：品牌 + 设置 / 主题入口；不遮挡内容（非浮层）。 */
export function MobileTopBar() {
  const { theme, toggle } = useTheme()
  return (
    <div
      className="relative z-30 flex items-center justify-between border-b px-4 py-2.5 lg:hidden"
      style={{ borderColor: 'var(--line-soft)', background: 'rgba(23,21,18,.45)' }}
    >
      <Link to="/" className="flex min-w-0 items-center gap-2">
        <span className="mono text-[0.62rem] tracking-[0.14em]" style={{ color: 'var(--gold)' }}>
          DECISION CAPSULE
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={toggle}
          aria-label={theme === 'dark' ? '切换浅色模式' : '切换深色模式'}
          className="flex h-11 w-11 items-center justify-center rounded"
          style={{ color: 'var(--text-dim)' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <Link
          to="/settings"
          aria-label="设置与备份"
          className="flex h-11 w-11 items-center justify-center rounded"
          style={{ color: 'var(--text-dim)' }}
        >
          <Settings size={18} />
        </Link>
      </div>
    </div>
  )
}
