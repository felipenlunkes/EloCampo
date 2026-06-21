import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AuthSession } from '../types'

interface AuthContextType {
  session: AuthSession | null
  setSession: (s: AuthSession | null) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem('ec_session')
    if (raw) { try { setSessionState(JSON.parse(raw)) } catch { /* ignore */ } }
    setLoading(false)
  }, [])

  const setSession = (s: AuthSession | null) => {
    setSessionState(s)
    if (s) {
      localStorage.setItem('ec_token', s.token)
      localStorage.setItem('ec_session', JSON.stringify(s))
    } else {
      localStorage.removeItem('ec_token')
      localStorage.removeItem('ec_session')
    }
  }

  return (
    <AuthContext.Provider value={{ session, setSession, logout: () => setSession(null), loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
