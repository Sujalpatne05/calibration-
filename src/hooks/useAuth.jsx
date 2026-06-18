import { createContext, useCallback, useContext, useState } from 'react'

const AuthContext = createContext(null)
const STORAGE_KEY = 'sanc_auth'

function readStored() {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
    const token = localStorage.getItem('token')
    return session && token ? session : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStored)

  const login = useCallback((profile, token) => {
    const session =
      typeof profile === 'object' && profile
        ? { ...profile, loggedAt: Date.now() }
        : { username: profile || 'sanc', loggedAt: Date.now() }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      if (token) localStorage.setItem('token', token)
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
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } catch {
      // Ignore storage failures during logout.
    }
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>')
  return ctx
}
