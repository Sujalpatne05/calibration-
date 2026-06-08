/**
 * Button — primary action button used across the app.
 *
 * variants: primary (blue) | danger (red) | secondary (white/outline) | ghost
 * sizes:    sm | md | lg
 */
const VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-ring hover:bg-brand-700 focus-visible:ring-brand-300',
  danger:
    'bg-red-500 text-white shadow-[0_10px_30px_rgba(239,68,68,0.25)] hover:bg-red-600 focus-visible:ring-red-300',
  secondary:
    'bg-white text-ink border border-slate-200 hover:bg-slate-50 focus-visible:ring-brand-200',
  ghost: 'bg-transparent text-ink-soft hover:bg-slate-100 focus-visible:ring-brand-200',
}

const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 outline-none focus-visible:ring-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
