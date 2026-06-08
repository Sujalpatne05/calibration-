import { Calendar } from 'lucide-react'

/**
 * DateRangeFilter — "From" and "To" date pickers used on the Invoices /
 * Calibration Reports page.
 */
function DateField({ label, value, onChange }) {
  return (
    <div className="relative flex-1">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
        {!value && label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-10 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
      />
      <Calendar
        size={18}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
      />
    </div>
  )
}

export default function DateRangeFilter({ from, to, onFromChange, onToChange, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <DateField label="From" value={from} onChange={onFromChange} />
      <DateField label="To" value={to} onChange={onToChange} />
    </div>
  )
}
