import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Gauge,
  ClipboardCheck,
  BarChart3,
  ReceiptText,
  Server,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react'
import SancLogo from '../components/SancLogo'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/instruments', label: 'Instruments', icon: Gauge },
  { to: '/standards', label: 'Standards', icon: ClipboardCheck },
  { to: '/report', label: 'Report', icon: BarChart3 },
  { to: '/invoices', label: 'Invoices', icon: ReceiptText },
  { to: '/api-status', label: 'API Status', icon: Server },
]

export default function Sidebar({ collapsed, mobileOpen, onMobileClose }) {
  return (
    <>
      {/* Modern mobile backdrop with blur */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/20 backdrop-blur-md lg:hidden animate-fade-in"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200/60 bg-white/80 backdrop-blur-xl transition-all duration-300
          ${collapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          shadow-xl lg:shadow-soft
          pt-16 lg:pt-0`}
      >
        {/* Gradient accent line */}
        <div className="absolute right-0 top-0 h-full w-0.5 bg-gradient-to-b from-brand-400 via-purple-400 to-transparent opacity-50" />

        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="absolute right-3 top-3 rounded-xl p-2 text-ink-faint transition hover:bg-slate-100 hover:text-ink lg:hidden"
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

        {/* Enhanced Nav */}
        <nav className="flex-1 space-y-1.5 px-3 py-2">
          {NAV.map(({ to, label, icon: Icon }, index) => (
            <NavLink
              key={to}
              to={to}
              onClick={onMobileClose}
              style={{ animationDelay: `${index * 0.05}s` }}
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 animate-fade-up
                ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-50 to-purple-50 text-brand-700 shadow-sm'
                    : 'text-ink-soft hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Modern active indicator */}
                  <span
                    className={`absolute -left-1 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-ocean transition-all duration-300 ${
                      isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                    }`}
                  />
                  
                  {/* Icon with background */}
                  <div className={`relative flex items-center justify-center transition-all duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`}>
                    <Icon size={20} className="relative z-10 shrink-0" />
                    {isActive && (
                      <div className="absolute inset-0 -z-0 scale-150 rounded-lg bg-gradient-ocean opacity-10 blur-md" />
                    )}
                  </div>

                  {!collapsed && (
                    <>
                      <span className="truncate">{label}</span>
                      {isActive && (
                        <ChevronRight size={16} className="ml-auto animate-slide-in-right text-brand-500" />
                      )}
                    </>
                  )}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="pointer-events-none absolute left-full ml-3 w-max rounded-lg bg-ink px-3 py-1.5 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      {label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-ink" />
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Enhanced footer with gradient background */}
        {!collapsed && (
          <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-brand-50 to-purple-50 px-5 py-5 mx-2 mb-2 animate-fade-up">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-ocean opacity-10 blur-2xl" />
            <div className="relative z-10 space-y-1 text-[11px] leading-relaxed">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-brand-500" />
                <p className="font-bold text-ink">ISO 9001:2015 Certified</p>
              </div>
              <p className="text-ink-soft">Calibration &amp; Validation Services</p>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
