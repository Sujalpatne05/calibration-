import { useNavigate } from 'react-router-dom'
import { Box, Users, Boxes, ArrowRight, User, Pencil, Eye } from 'lucide-react'
import DashboardCard from '../components/DashboardCard'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { kpis, quickTasks, recentActivities } from '../data/dashboard'

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

  return (
    <div className="space-y-8">
      {/* KPI cards */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k, i) => (
          <DashboardCard
            key={k.id}
            value={k.value}
            label={k.label}
            max={k.max}
            delay={i * 120}
          />
        ))}
      </section>

      {/* Quick tasklist + Quick actions */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick tasklist */}
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Quick tasklist</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-ink-soft">
              Items: {quickTasks.length}
            </span>
          </div>

          <DataTable
            rowKey={(r) => r.id}
            data={quickTasks}
            columns={[
              {
                key: 'type',
                header: 'Type',
                render: () => (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-ink-soft">
                    <User size={16} />
                  </span>
                ),
              },
              { key: 'name', header: 'Name', className: 'font-medium' },
              {
                key: 'action',
                header: 'Action',
                align: 'right',
                render: () => (
                  <div className="flex items-center justify-end gap-1">
                    <button className="rounded-lg p-2 text-brand-500 transition hover:bg-brand-50">
                      <Pencil size={16} />
                    </button>
                    <button className="rounded-lg p-2 text-ink-faint transition hover:bg-slate-100">
                      <Eye size={16} />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon
            return (
              <button
                key={a.id}
                onClick={() => navigate(a.to)}
                className="group flex w-full items-center gap-4 rounded-2xl bg-white p-5 text-left shadow-card ring-1 ring-slate-100 transition-all hover:-translate-y-0.5 hover:shadow-soft"
              >
                <span className={`grid h-12 w-12 place-items-center rounded-xl ${a.color}`}>
                  <Icon size={22} />
                </span>
                <span className="flex-1 font-semibold text-ink">{a.label}</span>
                <ArrowRight
                  size={20}
                  className={`${a.arrow} transition-transform group-hover:translate-x-1`}
                />
              </button>
            )
          })}
        </div>
      </section>

      {/* Recent activities */}
      <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">Recent activities</h2>
        <DataTable
          rowKey={(r) => r.id}
          data={recentActivities}
          columns={[
            { key: 'action', header: 'Activity', className: 'font-medium' },
            { key: 'detail', header: 'Details', className: 'text-ink-soft' },
            {
              key: 'date',
              header: 'Date',
              render: (r) =>
                new Date(r.date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }),
            },
            {
              key: 'status',
              header: 'Status',
              align: 'right',
              render: (r) => <StatusBadge status={r.status} />,
            },
          ]}
        />
      </section>
    </div>
  )
}
