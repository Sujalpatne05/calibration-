import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Modal — centred dialog with a dimmed backdrop. Closes on backdrop click
 * or Escape. Used for Add/Edit forms across the app.
 */
export default function Modal({ open, onClose, title, children, footer, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative w-full ${maxWidth} animate-scale-in rounded-2xl bg-white p-6 shadow-soft`}
      >
        <div className="mb-5 flex items-start justify-between">
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-faint transition hover:bg-slate-100 hover:text-red-500"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">{children}</div>

        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>
  )
}
