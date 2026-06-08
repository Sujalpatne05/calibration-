/**
 * DashboardCard — KPI card with a circular gold progress ring around a
 * large number, matching the reference dashboard.
 *
 * props: value, label, max (for ring fill %), accent ('gold' default)
 */
export default function DashboardCard({ value, label, max = 100, delay = 0 }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(1, Math.max(0, max ? value / max : 0))
  const offset = circumference * (1 - pct)

  return (
    <div
      className="flex animate-fade-up flex-col items-center justify-center rounded-2xl bg-white/70 px-6 py-7 shadow-card ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative grid place-items-center">
        <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
          <circle
            cx="66"
            cy="66"
            r={radius}
            fill="none"
            stroke="#f0f1f6"
            strokeWidth="10"
          />
          <circle
            cx="66"
            cy="66"
            r={radius}
            fill="none"
            stroke="url(#goldring)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
          <defs>
            <linearGradient id="goldring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f3d98a" />
              <stop offset="100%" stopColor="#e0b020" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute font-display text-3xl font-bold text-ink">{value}</span>
      </div>
      <p className="mt-4 text-center text-sm font-medium text-ink-soft">{label}</p>
    </div>
  )
}
