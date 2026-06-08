/**
 * FormInput — labelled input field used in modals and forms.
 * Supports an optional trailing icon (e.g. password show/hide toggle)
 * and a left-side icon.
 */
export default function FormInput({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  trailing,
  className = '',
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-soft">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
          />
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 text-sm text-ink placeholder:text-ink-faint outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 ${
            Icon ? 'pl-11' : 'pl-4'
          } ${trailing ? 'pr-11' : 'pr-4'}`}
          {...props}
        />
        {trailing && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>
        )}
      </div>
    </div>
  )
}
