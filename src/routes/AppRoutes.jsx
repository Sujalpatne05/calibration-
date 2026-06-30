import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Customers from '../pages/Customers'
import Instruments from '../pages/Instruments'
import Standards from '../pages/Standards'
import Invoices from '../pages/Invoices'
import Report from '../pages/Report'
import ApiStatus from '../pages/ApiStatus'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected shell */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/instruments" element={<Instruments />} />
        <Route path="/standards" element={<Standards />} />
        <Route path="/report" element={<Report />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/api-status" element={<ApiStatus />} />
      </Route>

      {/* Defaults */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
