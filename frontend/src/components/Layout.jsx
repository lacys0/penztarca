// src/components/Layout.jsx
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const NAV = [
  { to: '/',             label: 'Dashboard',    icon: '▦'  },
  { to: '/transactions', label: 'Tranzakciók',  icon: '≡'  },
  { to: '/recurring',    label: 'Ismétlődők',   icon: '↺'  },
  { to: '/categories',   label: 'Kategóriák',   icon: '⊞'  },
  { to: '/settings',     label: 'Beállítások',  icon: '⚙'  },
]

export function Layout() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const sidebar = (
    <aside className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 rounded-xl bg-brand-400 flex items-center justify-center text-white font-bold text-sm">
          💰
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pénztárca</div>
          <div className="text-[10px] text-gray-400">Költségkövető</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition
              ${isActive
                ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-medium border-l-2 border-brand-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`
            }
          >
            <span className="text-base">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      {/* Felhasználó / dark mode */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
        <button
          onClick={toggle}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm
                     text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <span>{dark ? '☀ Világos mód' : '☾ Sötét mód'}</span>
        </button>

        <div className="flex items-center gap-2 px-2">
          <div className="w-7 h-7 rounded-full bg-brand-50 dark:bg-brand-900 flex items-center justify-center
                          text-xs font-semibold text-brand-600 dark:text-brand-400">
            {user?.name?.[0] ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate text-gray-800 dark:text-gray-200">
              {user?.name}
            </div>
            <div className="text-[10px] text-gray-400 truncate">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Kijelentkezés"
            className="text-gray-400 hover:text-red-500 transition text-sm"
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block w-52 flex-shrink-0 bg-white dark:bg-gray-900
                      border-r border-gray-200 dark:border-gray-800">
        {sidebar}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-52 bg-white dark:bg-gray-900
                       border-r border-gray-200 dark:border-gray-800 transition-transform md:hidden
                       ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebar}
      </div>

      {/* Main tartalom */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="flex md:hidden items-center gap-3 px-4 py-3
                        bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-gray-600 dark:text-gray-300 text-xl"
          >
            ☰
          </button>
          <span className="text-sm font-semibold">Pénztárca</span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
