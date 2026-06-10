import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Users, Boxes, ArrowRight } from 'lucide-react'
import DashboardCard from '../components/DashboardCard'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { dashboardAPI } from '../services/api'

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
    label: 'Add Standard',
    to: '/standards',
    icon: Boxes,
    color: 'text-rose-500 bg-rose-50',
    arrow: 'text-rose-500',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [kpis, setKpis] = useState([])
  const [tasks, setTasks] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Ensure token is available
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No authentication token found. Please login again.')
        return
      }

      setLoading(true)
      setError(null)
      const [kpiData, taskData, activityData] = await Promise.all([
        dashboardAPI.getKPIs(),
        dashboardAPI.getQuickTasks(),
        dashboardAPI.getRecentActivities(),
      ])
      setKpis(kpiData)
      setTasks(taskData)
      setActivities(activityData)
    } catch (err) {
      setError('Failed to fetch dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-8">
      {error && <div className="rounded bg-red-100 p-3 text-red-700">{error}</div>}

      {/* KPI cards */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center text-ink-faint">Loading KPIs...</div>
        ) : (
          <>
            <DashboardCard
              value={kpis.pending_instruments || 0}
              label="Pending Instruments"
              delay={0}
            />
            <DashboardCard
              value={kpis.standards_due || 0}
              label="Standards Due"
              delay={120}
            />
            <DashboardCard
              value={kpis.pending_customers || 0}
              label="Pending Customers"
              delay={240}
            />
          </>
        )}
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              onClick={() => navigate(action.to)}
              className="group rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100 transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <div className="flex items-start justify-between">
                <div className={`rounded-xl p-3 ${action.color}`}>
                  <Icon size={24} />
                </div>
                <ArrowRight size={20} className={`transition group-hover:translate-x-1 ${action.arrow}`} />
              </div>
              <p className="mt-4 font-semibold text-ink">{action.label}</p>
            </button>
          )
        })}
      </section>

      {/* Tasks and Activities */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Tasks */}
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Quick Tasks</h2>
          {loading ? (
            <div className="text-center text-ink-faint">Loading tasks...</div>
          ) : !Array.isArray(tasks) || tasks.length === 0 ? (
            <p className="text-center text-ink-faint">No pending tasks</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                  <div>
                    <p className="font-medium text-ink">{task.title || task.name}</p>
                    <p className="text-sm text-ink-faint">{task.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Recent Activities</h2>
          {loading ? (
            <div className="text-center text-ink-faint">Loading activities...</div>
          ) : !Array.isArray(activities) || activities.length === 0 ? (
            <p className="text-center text-ink-faint">No recent activities</p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0">
                  <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  <div>
                    <p className="font-medium text-ink">{activity.action}</p>
                    <p className="text-xs text-ink-faint">{activity.detail}</p>
                    <p className="text-xs text-ink-faint">
                      {activity.createdAt ? fmtDate(activity.createdAt) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
