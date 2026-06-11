import { Calendar } from 'lucide-react'

/**
 * DateRangeFilter — "From" and "To" date pickers used on the Invoices /
 * Calibration Reports page.
 */
function DateField({ label, value, onChange }) {
  return (
    <label className="block flex-1">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-faint">
        {label}
      </span>
      <span className="relative block">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-10 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
        />
        <Calendar
          size={18}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
        />
      </span>
    </label>
  )
}

export default function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  onChangeFrom,
  onChangeTo,
  className = '',
}) {
  const handleFromChange = onFromChange ?? onChangeFrom
  const handleToChange = onToChange ?? onChangeTo

  return (
    <div className={`flex items-end gap-3 ${className}`}>
      <DateField label="From" value={from} onChange={handleFromChange} />
      <DateField label="To" value={to} onChange={handleToChange} />
    </div>
  )
}
