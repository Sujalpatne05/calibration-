import { createContext, useContext, useState, useCallback } from 'react'

/**
 * Mock authentication context.
 * No real backend — any non-empty credentials sign the user in.
 * The session flag is kept in localStorage so a refresh stays logged in.
 */
const AuthContext = createContext(null)

const STORAGE_KEY = 'sanc_auth'

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStored)

  const login = useCallback((username) => {
    const session = { username: username || 'sanc', loggedAt: Date.now() }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch {
      /* storage unavailable — fall back to in-memory only */
    }
    setUser(session)
    return true
  }, [])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
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
