import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, Menu, PanelLeftClose, PanelLeft, Sparkles } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

/**
 * TopNavbar - modern glassmorphic header with gradient title
 */
export default function TopNavbar({ onToggleSidebar, onOpenMobile, collapsed }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [showNotif, setShowNotif] = useState(false)

  const notifications = [
    { id: 1, text: '41 instruments are pending calibration.', time: '2h ago', unread: true },
    { id: 2, text: 'Certificate 26-27/0508 generated.', time: '5h ago', unread: true },
    { id: 3, text: 'New customer "Clean Flow Technology" added.', time: 'Yesterday', unread: false },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-[60] border-b border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-sm">
      <div className="flex items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 lg:px-8">
        {/* Left: toggles + title */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {/* Mobile menu */}
          <button
            onClick={onOpenMobile}
            className="flex-shrink-0 rounded-xl p-2 text-ink-soft transition hover:bg-white hover:shadow-sm lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          {/* Desktop collapse */}
          <button
            onClick={onToggleSidebar}
            className="hidden flex-shrink-0 rounded-xl p-2.5 text-ink-soft transition hover:bg-white hover:shadow-sm lg:inline-flex"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-display text-lg font-bold leading-tight bg-gradient-ocean bg-clip-text text-transparent sm:text-2xl lg:text-3xl truncate">
                Calibration Report
              </h1>
              <Sparkles size={16} className="flex-shrink-0 text-brand-400 animate-pulse sm:w-5 sm:h-5" />
            </div>
            <p className="hidden sm:block mt-0.5 truncate text-xs text-ink-faint sm:text-sm">
              SANC Calibration and Validation Services
            </p>
          </div>
        </div>

        {/* Right: modern action buttons */}
        <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Notifications with badge */}
          <div className="relative">
            <button
              onClick={() => setShowNotif((s) => !s)}
              className="group relative flex items-center gap-2 rounded-xl bg-gradient-to-br from-white to-slate-50 px-2 py-2 text-sm font-medium text-ink-soft shadow-sm ring-1 ring-slate-200/60 transition hover:shadow-md hover:ring-brand-200 sm:px-3 sm:py-2.5 lg:px-4"
            >
              <span className="relative">
                <Bell size={16} className="group-hover:text-brand-600 transition sm:w-[18px] sm:h-[18px]" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                  {notifications.filter(n => n.unread).length}
                </span>
              </span>
              <span className="hidden lg:inline group-hover:text-brand-600 transition">Notifications</span>
            </button>

            {showNotif && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)} />
                <div className="absolute right-0 z-20 mt-2 w-80 sm:w-96 origin-top-right animate-scale-in rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-bold text-ink">Notifications</p>
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                      {notifications.filter(n => n.unread).length} new
                    </span>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`group relative rounded-xl px-4 py-3 transition hover:bg-gradient-to-r hover:from-brand-50 hover:to-purple-50 ${
                          n.unread ? 'bg-slate-50' : ''
                        }`}
                      >
                        {n.unread && (
                          <div className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-brand-500" />
                        )}
                        <p className="text-sm text-ink">{n.text}</p>
                        <p className="mt-1 text-xs text-ink-faint">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Logout with gradient */}
          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 rounded-xl bg-gradient-to-br from-red-50 to-red-100 px-2 py-2 text-sm font-medium text-red-600 shadow-sm ring-1 ring-red-200/60 transition hover:bg-gradient-to-br hover:from-red-100 hover:to-red-200 hover:shadow-md sm:px-3 sm:py-2.5 lg:px-4"
          >
            <LogOut size={15} className="group-hover:scale-110 transition sm:w-[17px] sm:h-[17px]" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
