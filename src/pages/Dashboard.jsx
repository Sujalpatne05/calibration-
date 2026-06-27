import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Users, Boxes, ArrowRight, Edit, Trash2 } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import { dashboardAPI, customersAPI } from '../services/api'

const QUICK_ACTIONS = [
  {
    id: 'instrument',
    label: 'Add Instrument',
    to: '/instruments',
    icon: Box,
    color: 'text-amber-500 bg-amber-50',
    arrow: 'text-amber-500',
  },
  {
    id: 'customer',
    label: 'Add Customer',
    to: '/customers',
    icon: Users,
    color: 'text-violet-500 bg-violet-50',
    arrow: 'text-violet-500',
  },
  {
    id: 'standard',
    label: 'Add standard',
    to: '/standards',
    icon: Boxes,
    color: 'text-rose-500 bg-rose-50',
    arrow: 'text-rose-500',
  },
]

// Circular progress component
const CircularProgress = ({ value, label, sublabel }) => {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const progress = ((value || 0) / 1000) * circumference // Assuming max 1000
  const offset = circumference - progress

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90 transform">
          {/* Background circle */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="#FCD34D"
            strokeWidth="8"
            fill="none"
            opacity="0.2"
          />
          {/* Progress circle */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="#FCD34D"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-ink">{value || 0}</span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="font-semibold text-ink">{label}</p>
        {sublabel && <p className="text-sm text-ink-faint">{sublabel}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [kpis, setKpis] = useState({})
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No authentication token found. Please login again.')
        return
      }

      setLoading(true)
      setError(null)
      const [kpiData, customerData] = await Promise.all([
        dashboardAPI.getKPIs(),
        customersAPI.getAll(),
      ])
      setKpis(kpiData)
      setCustomers(customerData.slice(0, 10)) // Get first 10 customers for quick tasklist
    } catch (err) {
      setError('Failed to fetch dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditCustomer = (customer) => {
    navigate('/customers')
  }

  const handleDeleteCustomer = async (customer) => {
    if (window.confirm(`Delete customer "${customer.name}"?`)) {
      try {
        await customersAPI.delete(customer.id)
        setCustomers((prev) => prev.filter((c) => c.id !== customer.id))
      } catch (err) {
        alert('Failed to delete customer')
        console.error(err)
      }
    }
  }

  return (
    <div className="space-y-8">
      {error && <div className="rounded bg-red-100 p-3 text-red-700">{error}</div>}

      {/* Pending Items Section */}
      <section>
        <h2 className="mb-6 text-xl font-semibold text-ink">Pending Items</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <div className="col-span-full text-center text-ink-faint">Loading...</div>
          ) : (
            <>
              <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
                <CircularProgress
                  value={kpis.pending_invoices || 2}
                  label="Pending Invoices"
                />
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
                <CircularProgress
                  value={kpis.pending_instruments || 98}
                  label="Pending Instruments"
                />
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
                <CircularProgress
                  value={kpis.standards_due || 0}
                  label="Standards Due for"
                  sublabel="Calibration"
                />
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
                <CircularProgress
                  value={kpis.pending_customers || 999}
                  label="Pending Customer"
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* Quick Tasklist Section */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Left: Customer List */}
        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-ink">Quick tasklist</h2>
          </div>
          <p className="mb-4 text-sm text-ink-faint">Items: {customers.length}</p>
          
          {loading ? (
            <div className="text-center text-ink-faint">Loading...</div>
          ) : customers.length === 0 ? (
            <p className="text-center text-ink-faint">No customers found</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                <div>TYPE</div>
                <div>Name</div>
                <div className="text-right">Action</div>
              </div>
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="grid grid-cols-3 gap-4 items-center border-b border-slate-50 pb-3 last:border-0"
                >
                  <div className="flex items-center">
                    <Users size={18} className="text-ink-faint" />
                  </div>
                  <div className="font-medium text-ink">{customer.name}</div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      className="rounded-lg p-2 text-brand-500 transition hover:bg-brand-50"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-50"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick Actions */}
        <div className="space-y-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => navigate(action.to)}
                className="group flex w-full items-center justify-between rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100 transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <div className="flex items-center gap-4">
                  <div className={`rounded-xl p-3 ${action.color}`}>
                    <Icon size={24} />
                  </div>
                  <p className="font-semibold text-ink">{action.label}</p>
                </div>
                <ArrowRight size={20} className={`transition group-hover:translate-x-1 ${action.arrow}`} />
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
