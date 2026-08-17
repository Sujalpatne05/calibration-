import { createContext, useCallback, useContext, useState } from 'react'
import { useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)
const STORAGE_KEY = 'sanc_auth'
const LOGOUT_KEY = 'sanc_logout_at'

function readStored() {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
    return session
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStored)
  const [isRestoring, setIsRestoring] = useState(() => !readStored())

  useEffect(() => {
    let active = true

    authAPI
      .validateSession()
      .then((response) => {
        if (!active || localStorage.getItem(LOGOUT_KEY) || !response?.user) return

        const session = { ...response.user, loggedAt: Date.now() }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
          localStorage.setItem('user', JSON.stringify(response.user))
        } catch {
          // Keep the authenticated session in memory when storage is unavailable.
        }
        setUser(session)
      })
      .catch(() => {
        // A missing or expired cookie simply leaves the user signed out.
      })
      .finally(() => {
        if (active) setIsRestoring(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === LOGOUT_KEY && event.newValue) {
        setUser(null)
        setIsRestoring(false)
        return
      }

      if (event.key !== STORAGE_KEY) return

      if (!event.newValue) {
        setUser(null)
        setIsRestoring(false)
        return
      }

      try {
        setUser(JSON.parse(event.newValue))
        setIsRestoring(false)
      } catch {
        setUser(null)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = useCallback((profile) => {
    const session =
      typeof profile === 'object' && profile
        ? { ...profile, loggedAt: Date.now() }
        : { username: profile || 'sanc', loggedAt: Date.now() }

    try {
      localStorage.removeItem(LOGOUT_KEY)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      // New sessions use the HttpOnly cookie set by the backend.
      localStorage.removeItem('token')
      if (typeof profile === 'object' && profile) {
        localStorage.setItem('user', JSON.stringify(profile))
      }
    } catch {
      // Fall back to in-memory auth if storage is unavailable.
    }

    setUser(session)
    return true
  }, [])

  const logout = useCallback(() => {
    authAPI.logout().catch(() => {
      // Clear local auth even if the server is unavailable.
    })

    try {
      localStorage.setItem(LOGOUT_KEY, String(Date.now()))
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } catch {
      // Ignore storage failures during logout.
    }
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isRestoring, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>')
  return ctx
}
