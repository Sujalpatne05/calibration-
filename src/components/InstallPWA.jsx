import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

/**
 * InstallPWA - Component that shows an install prompt for PWA
 */
export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Save the event so it can be triggered later
      setDeferredPrompt(e)
      // Show our custom install prompt
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    // Clear the deferred prompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Store dismissal in localStorage
    localStorage.setItem('pwa-prompt-dismissed', Date.now())
  }

  // Don't show if already dismissed recently (within 7 days)
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24)
      if (daysSince < 7) {
        setShowPrompt(false)
      }
    }
  }, [])

  if (!showPrompt || !deferredPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-up md:left-auto md:right-4 md:w-96">
      <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/60">
        <div className="relative bg-gradient-to-br from-brand-500 to-purple-600 p-4">
          <button
            onClick={handleDismiss}
            className="absolute right-2 top-2 rounded-lg p-1.5 text-white/80 transition hover:bg-white/20"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Download size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Install App</h3>
              <p className="text-sm text-white/90">Add to your home screen</p>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <p className="mb-4 text-sm text-ink-soft">
            Install SANC Calibration for quick access and offline functionality. Works on all devices!
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg active:scale-95"
            >
              Install Now
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-slate-50"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
