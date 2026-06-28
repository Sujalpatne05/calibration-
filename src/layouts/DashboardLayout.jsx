import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNavbar from './TopNavbar'
import { useAuth } from '../hooks/useAuth'

/**
 * DashboardLayout — authenticated shell. Renders the sidebar + top navbar
 * and the routed page via <Outlet/>. Redirects to /login when signed out.
 */
export default function DashboardLayout() {
  const { isAuthenticated } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <TopNavbar
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          onOpenMobile={() => setMobileOpen(true)}
        />

        <main className="flex-1 px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 overflow-x-hidden">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
