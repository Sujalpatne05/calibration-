import { Search } from 'lucide-react'

/**
 * SearchBar — rounded search field with a trailing search glyph,
 * mirroring the reference screens.
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100 ${className}`}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none"
      />
      <Search size={18} className="shrink-0 text-ink-faint" />
    </div>
  )
}
