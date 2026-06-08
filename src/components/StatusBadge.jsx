import { CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react'

/**
 * StatusBadge — coloured pill describing a record's state.
 * Recognised statuses: completed, pending, due, overdue, draft.
 */
const STYLES = {
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    cls: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  due: {
    label: 'Due',
    icon: AlertTriangle,
    cls: 'bg-orange-50 text-orange-700 ring-orange-200',
  },
  overdue: {
    label: 'Overdue',
    icon: XCircle,
    cls: 'bg-red-50 text-red-700 ring-red-200',
  },
  draft: {
    label: 'Draft',
    icon: Clock,
    cls: 'bg-slate-100 text-slate-600 ring-slate-200',
  },
}

export default function StatusBadge({ status = 'pending', label }) {
  const conf = STYLES[status] || STYLES.pending
  const Icon = conf.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${conf.cls}`}
    >
      <Icon size={13} />
      {label || conf.label}
    </span>
  )
}
