import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Lock, LogOut, Menu, PanelLeftClose, PanelLeft } from 'lucide-react'
import Modal from '../components/Modal'
import FormInput from '../components/FormInput'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'

/**
 * TopNavbar — page heading + account actions.
 * Holds the gradient "Calibration Report" wordmark, sidebar toggles,
 * notifications dropdown, change-password modal and logout.
 */
export default function TopNavbar({ onToggleSidebar, onOpenMobile, collapsed }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [showNotif, setShowNotif] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })

  const notifications = [
    { id: 1, text: '41 instruments are pending calibration.', time: '2h ago' },
    { id: 2, text: 'Certificate 26-27/0508 generated.', time: '5h ago' },
    { id: 3, text: 'New customer “Clean Flow Technology” added.', time: 'Yesterday' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-100 bg-canvas/80 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* Left: toggles + title */}
        <div className="flex items-center gap-3">
          {/* Mobile menu */}
          <button
            onClick={onOpenMobile}
            className="rounded-lg p-2 text-ink-soft hover:bg-white lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          {/* Desktop collapse */}
          <button
            onClick={onToggleSidebar}
            className="hidden rounded-lg p-2 text-ink-soft transition hover:bg-white lg:inline-flex"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>

          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold leading-tight text-gradient-brand sm:text-3xl">
              Calibration Report
            </h1>
            <p className="truncate text-xs text-ink-faint sm:text-sm">
              SANC Calibration and Validation Services
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotif((s) => !s)}
              className="relative flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-ink-soft transition hover:bg-white sm:px-3"
            >
              <span className="relative">
                <Bell size={20} />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-canvas" />
              </span>
              <span className="hidden lg:inline">Notification</span>
            </button>

            {showNotif && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)} />
                <div className="absolute right-0 z-20 mt-2 w-80 origin-top-right animate-scale-in rounded-2xl border border-slate-100 bg-white p-2 shadow-soft">
                  <p className="px-3 py-2 text-sm font-semibold text-ink">Notifications</p>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-xl px-3 py-2.5 transition hover:bg-slate-50"
                    >
                      <p className="text-sm text-ink">{n.text}</p>
                      <p className="mt-0.5 text-xs text-ink-faint">{n.time}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Change password */}
          <button
            onClick={() => setShowPwd(true)}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-ink-soft transition hover:bg-white sm:px-3"
          >
            <Lock size={18} />
            <span className="hidden lg:inline">Change password</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-ink-soft transition hover:bg-white hover:text-red-500 sm:px-3"
          >
            <LogOut size={18} />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Change password modal */}
      <Modal
        open={showPwd}
        onClose={() => setShowPwd(false)}
        title="Change password"
        footer={
          <Button
            className="w-full"
            onClick={() => {
              setShowPwd(false)
              setPwd({ current: '', next: '', confirm: '' })
            }}
          >
            Update password
          </Button>
        }
      >
        <FormInput
          label="Current password"
          type="password"
          value={pwd.current}
          onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
          placeholder="••••••••"
        />
        <FormInput
          label="New password"
          type="password"
          value={pwd.next}
          onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
          placeholder="••••••••"
        />
        <FormInput
          label="Confirm new password"
          type="password"
          value={pwd.confirm}
          onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
          placeholder="••••••••"
        />
      </Modal>
    </header>
  )
}
