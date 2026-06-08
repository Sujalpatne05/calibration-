import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, User, Lock } from 'lucide-react'
import SancLogo from '../components/SancLogo'
import FormInput from '../components/FormInput'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('sanc')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.')
      return
    }
    login(username.trim())
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4">
      {/* Top accent line, echoing the reference login */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-fuchsia-500 to-pink-500" />

      {/* Soft background glows */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-up rounded-3xl border border-white/60 bg-white p-8 shadow-soft sm:p-10">
        <div className="flex flex-col items-center">
          <SancLogo size={84} />
          <h1 className="mt-4 font-display text-2xl font-bold text-gradient-brand">
            Calibration Report
          </h1>
          <p className="mt-1 text-sm text-ink-faint">SANC Calibration &amp; Validation Services</p>
        </div>

        <div className="mt-8 space-y-4">
          <FormInput
            label="Username"
            icon={User}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setError('')
            }}
            placeholder="Enter username"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />

          <FormInput
            label="Password"
            icon={Lock}
            type={showPwd ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            placeholder="Enter password"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            trailing={
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="rounded-lg p-2 text-ink-faint transition hover:text-ink"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}

          <Button size="lg" className="w-full" onClick={handleSubmit}>
            Login
          </Button>

          <p className="pt-2 text-center text-xs text-ink-faint">
            Demo build — any username &amp; password will sign you in.
          </p>
        </div>
      </div>
    </div>
  )
}
