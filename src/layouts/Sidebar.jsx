import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Gauge,
  ClipboardCheck,
  FileText,
  ChevronRight,
  X,
} from 'lucide-react'
import SancLogo from '../components/SancLogo'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/instruments', label: 'Instruments', icon: Gauge },
  { to: '/standards', label: 'Standards', icon: ClipboardCheck },
  { to: '/report', label: 'Report', icon: FileText },
  { to: '/invoices', label: 'Invoices', icon: FileText },
]

export default function Sidebar({ collapsed, mobileOpen, onMobileClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-[2px] lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-100 bg-white transition-all duration-300
          ${collapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-ink-faint hover:bg-slate-100 lg:hidden"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        {/* Brand */}
        <div className="flex flex-col items-center gap-2 px-4 pb-6 pt-8">
          <SancLogo size={collapsed ? 40 : 64} className="transition-all duration-300" />
          {!collapsed && (
            <span className="font-display text-lg font-bold italic tracking-wide text-ink">
              SANC
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all
                ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-soft hover:bg-slate-50 hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active accent bar */}
                  <span
                    className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-600 transition-all ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <Icon size={20} className="shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                  {!collapsed && isActive && (
                    <ChevronRight size={16} className="ml-auto text-brand-500" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {!collapsed && (
          <div className="px-5 py-5 text-[11px] leading-relaxed text-ink-faint">
            <p className="font-semibold text-ink-soft">ISO 9001:2015 Certified</p>
            <p>Calibration &amp; Validation Services</p>
          </div>
        )}
      </aside>
    </>
  )
}
