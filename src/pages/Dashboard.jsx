import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Users, Boxes, ArrowRight, Edit, Trash2, TrendingUp, Clock, CheckCircle2, FileText } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import FormInput from '../components/FormInput'
import Button from '../components/Button'
import { dashboardAPI, customersAPI } from '../services/api'

const QUICK_ACTIONS = [
  {
    id: 'instrument',
    label: 'Add Instrument',
    to: '/instruments',
    icon: Box,
    gradient: 'from-amber-400 to-orange-500',
    iconBg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    iconColor: 'text-amber-600',
  },
  {
    id: 'customer',
    label: 'Add Customer',
    to: '/customers',
    icon: Users,
    gradient: 'from-violet-400 to-purple-500',
    iconBg: 'bg-gradient-to-br from-violet-50 to-purple-50',
    iconColor: 'text-violet-600',
  },
  {
    id: 'standard',
    label: 'Add Standard',
    to: '/standards',
    icon: Boxes,
    gradient: 'from-rose-400 to-pink-500',
    iconBg: 'bg-gradient-to-br from-rose-50 to-pink-50',
    iconColor: 'text-rose-600',
  },
]

const EMPTY_CUSTOMER = { name: '', address: '', email: '', phone: '' }

// Modern KPI Card with gradient progress
const KPICard = ({ value, label, sublabel, gradient, icon: Icon }) => {
  const percentage = Math.min((value / 1000) * 100, 100)
  
  return (
    <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-white p-3 sm:p-4 shadow-card ring-1 ring-slate-200/60 transition hover:shadow-card-hover animate-scale-in">
      {/* Background gradient decoration */}
      <div className={`absolute right-0 top-0 h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 rounded-full bg-gradient-to-br ${gradient} opacity-5 blur-3xl transition group-hover:opacity-10`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className={`rounded-lg sm:rounded-xl bg-gradient-to-br ${gradient} p-1.5 sm:p-2 shadow-sm`}>
            <Icon size={16} className="text-white sm:w-[18px] sm:h-[18px] lg:w-5 lg:h-5" />
          </div>
          <TrendingUp size={10} className="text-ink-faint sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
        </div>

        <div className="space-y-1 sm:space-y-1.5">
          <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-ink">{value || 0}</div>
          <div>
            <p className="font-semibold text-ink-soft text-[11px] sm:text-xs lg:text-sm">{label}</p>
            {sublabel && <p className="text-[9px] sm:text-[10px] lg:text-xs text-ink-faint">{sublabel}</p>}
          </div>

          {/* Progress bar */}
          <div className="pt-1 sm:pt-1.5">
            <div className="h-1 sm:h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full bg-gradient-to-r ${gradient} transition-all duration-1000 ease-out`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>
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
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [customerForm, setCustomerForm] = useState(EMPTY_CUSTOMER)
  const [savingCustomer, setSavingCustomer] = useState(false)

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
      setCustomers(customerData.slice(0, 10))
    } catch (err) {
      setError('Failed to fetch dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer)
    setCustomerForm({
      name: customer.name || '',
      address: customer.address || '',
      email: customer.email || '',
      phone: customer.phone || '',
    })
  }

  const closeEditCustomer = () => {
    setEditingCustomer(null)
    setCustomerForm(EMPTY_CUSTOMER)
  }

  const handleSaveCustomer = async () => {
    if (!editingCustomer || !customerForm.name.trim()) return

    try {
      setSavingCustomer(true)
      const updated = await customersAPI.update(editingCustomer.id, customerForm)
      setCustomers((prev) => prev.map((customer) => (
        customer.id === editingCustomer.id ? updated : customer
      )))
      closeEditCustomer()
    } catch (err) {
      alert('Failed to save customer')
      console.error(err)
    } finally {
      setSavingCustomer(false)
    }
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
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-up">
      {error && (
        <div className="rounded-xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200 p-3 sm:p-4 text-red-700 shadow-sm text-sm">
          {error}
        </div>
      )}

      {/* Modern KPI Section */}
      <section>
        <div className="mb-3 sm:mb-4 lg:mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-ink">Overview</h2>
            <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs lg:text-sm text-ink-faint">Track your pending items and workload</p>
          </div>
          <Clock size={16} className="text-ink-faint sm:w-[18px] sm:h-[18px] lg:w-5 lg:h-5" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <div className="col-span-full text-center text-ink-faint py-8 sm:py-12">
              <div className="inline-flex items-center gap-2">
                <div className="h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                <span className="text-sm sm:text-base">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <KPICard
                value={kpis.pending_invoices || 2}
                label="Pending Invoices"
                gradient="from-blue-400 to-cyan-500"
                icon={FileText}
              />
              <KPICard
                value={kpis.pending_instruments || 98}
                label="Pending Instruments"
                gradient="from-purple-400 to-pink-500"
                icon={Box}
              />
              <KPICard
                value={kpis.standards_due || 0}
                label="Standards Due"
                sublabel="for Calibration"
                gradient="from-amber-400 to-orange-500"
                icon={CheckCircle2}
              />
              <KPICard
                value={kpis.pending_customers || 999}
                label="Pending Customers"
                gradient="from-emerald-400 to-teal-500"
                icon={Users}
              />
            </>
          )}
        </div>
      </section>

      {/* Enhanced Quick Actions & Tasklist */}
      <section className="w-full max-w-full grid gap-3 sm:gap-4 lg:gap-6 lg:grid-cols-2 overflow-x-hidden">
        {/* Customer Tasklist */}
        <div className="w-full max-w-full rounded-xl sm:rounded-2xl bg-white p-3 sm:p-4 lg:p-6 shadow-card ring-1 ring-slate-200/60 animate-scale-in overflow-hidden">
          <div className="mb-3 sm:mb-4 lg:mb-6 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-ink">Quick Tasklist</h2>
              <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs lg:text-sm text-ink-faint">{customers.length} items</p>
            </div>
            <div className="flex-shrink-0 rounded-lg sm:rounded-xl bg-gradient-to-br from-brand-50 to-purple-50 px-2 py-0.5 sm:px-2 sm:py-1 lg:px-3 lg:py-1.5">
              <span className="text-[10px] sm:text-xs lg:text-sm font-semibold bg-gradient-ocean bg-clip-text text-transparent">
                Active
              </span>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center text-ink-faint py-6 sm:py-8">
              <div className="inline-flex items-center gap-2">
                <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                <span className="text-sm">Loading...</span>
              </div>
            </div>
          ) : customers.length === 0 ? (
            <p className="text-center text-ink-faint py-6 sm:py-8 text-sm">No customers found</p>
          ) : (
            <div className="space-y-2">
              {customers.map((customer, index) => (
                <div
                  key={customer.id}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  className="group flex items-center justify-between rounded-lg sm:rounded-xl border border-slate-100 bg-gradient-to-r from-white to-slate-50/50 p-2.5 sm:p-3 lg:p-4 transition hover:border-brand-200 hover:shadow-sm animate-fade-up"
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 min-w-0 flex-1">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-brand-50 to-purple-50">
                      <Users size={14} className="text-brand-600 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink truncate text-xs sm:text-sm lg:text-base">{customer.name}</p>
                      <p className="text-[10px] sm:text-xs text-ink-faint">Customer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        handleEditCustomer(customer)
                      }}
                      className="rounded-lg p-1.5 sm:p-2 text-brand-500 transition hover:bg-brand-50"
                      title="Edit"
                    >
                      <Edit size={13} className="sm:w-[14px] sm:h-[14px] lg:w-4 lg:h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        handleDeleteCustomer(customer)
                      }}
                      className="rounded-lg p-1.5 sm:p-2 text-slate-400 transition hover:bg-slate-50 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 size={13} className="sm:w-[14px] sm:h-[14px] lg:w-4 lg:h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="w-full max-w-full space-y-2 sm:space-y-3 lg:space-y-4 overflow-hidden">
          <div className="mb-1 sm:mb-2">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-ink">Quick Actions</h2>
            <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs lg:text-sm text-ink-faint">Frequently used operations</p>
          </div>
          
          {QUICK_ACTIONS.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => navigate(action.to)}
                style={{ animationDelay: `${index * 0.1}s` }}
                className="group relative flex w-full items-center justify-between overflow-hidden rounded-xl sm:rounded-2xl bg-white p-3 sm:p-4 lg:p-6 shadow-card ring-1 ring-slate-200/60 transition hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-brand-400 animate-scale-in"
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 transition group-hover:opacity-5`} />
                
                <div className="relative flex items-center gap-2.5 sm:gap-3 lg:gap-4">
                  <div className={`rounded-lg sm:rounded-xl ${action.iconBg} p-2 sm:p-3 lg:p-4 shadow-sm transition group-hover:scale-110 group-hover:shadow-md`}>
                    <Icon size={18} className={`${action.iconColor} sm:w-5 sm:h-5 lg:w-6 lg:h-6`} />
                  </div>
                  <p className="font-semibold text-ink text-xs sm:text-sm lg:text-base">{action.label}</p>
                </div>
                <ArrowRight 
                  size={16} 
                  className={`relative ${action.iconColor} transition group-hover:translate-x-1 sm:w-[18px] sm:h-[18px] lg:w-5 lg:h-5`} 
                />
              </button>
            )
          })}
        </div>
      </section>

      <Modal
        open={!!editingCustomer}
        onClose={closeEditCustomer}
        title="Update Customer"
        footer={
          <Button className="w-full" onClick={handleSaveCustomer} disabled={savingCustomer}>
            {savingCustomer ? 'Saving...' : 'Update'}
          </Button>
        }
      >
        <FormInput
          label="Customer Name"
          value={customerForm.name}
          onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
          placeholder="Name"
        />
        <FormInput
          label="Address"
          value={customerForm.address}
          onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
          placeholder="Address"
        />
        <FormInput
          label="Email"
          type="email"
          value={customerForm.email}
          onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
          placeholder="Email"
        />
        <FormInput
          label="Phone Number"
          value={customerForm.phone}
          onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
          placeholder="Phone Number"
        />
      </Modal>
    </div>
  )
}
