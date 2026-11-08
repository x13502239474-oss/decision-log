import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../lib/nav'

export default function BottomNav() {
  return (
    <nav
      className="bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t lg:hidden"
      style={{ borderColor: 'var(--line-soft)' }}
      aria-label="主导航"
    >
      <div className="mx-auto flex max-w-md items-stretch">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
          >
            <item.icon size={20} strokeWidth={1.6} />
            <span className="nav-label">{item.shortLabel}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
