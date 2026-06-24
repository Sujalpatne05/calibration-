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
  'in-progress': {
    label: 'In Progress',
    icon: Clock,
    cls: 'bg-blue-50 text-blue-700 ring-blue-200',
  },
  error: {
    label: 'Error',
    icon: XCircle,
    cls: 'bg-red-50 text-red-700 ring-red-200',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    cls: 'bg-red-50 text-red-700 ring-red-200',
  },
  'failed-no-info': {
    label: 'Failed: No Info',
    icon: AlertTriangle,
    cls: 'bg-red-50 text-red-700 ring-red-200',
  },
  'failed-out-of-scope': {
    label: 'Out of Scope',
    icon: AlertTriangle,
    cls: 'bg-red-50 text-red-700 ring-red-200',
  },
  'old-data': {
    label: 'Old Data',
    icon: AlertTriangle,
    cls: 'bg-orange-50 text-orange-700 ring-orange-200',
  },
  'internal-testing': {
    label: 'Internal Testing',
    icon: Clock,
    cls: 'bg-violet-50 text-violet-700 ring-violet-200',
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
