import { useEffect } from 'react'
import { createPortal } from 'react-dom'
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

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-0 bg-ink/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />

      {/* Centering wrapper */}
      <div className="relative z-10 flex w-full items-center justify-center">
        {/* Panel */}
        <div
          className={`relative w-full ${maxWidth} animate-scale-in rounded-2xl bg-white shadow-soft flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden`}
        >
          <div className="flex items-start justify-between p-6 pb-4 flex-shrink-0">
            <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-ink-faint transition hover:bg-slate-100 hover:text-red-500"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div className="min-h-0 overflow-y-auto px-6 pb-6">
            <div className="space-y-4">{children}</div>
          </div>

          {footer && <div className="p-6 pt-0 flex-shrink-0">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body
  )
}
