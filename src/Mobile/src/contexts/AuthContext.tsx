import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { AuthSession } from '../types'

interface AuthContextType {
  session: AuthSession | null
  setSession: (s: AuthSession | null) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem('ec_session')
      .then(raw => {
        if (raw) {
          try { setSessionState(JSON.parse(raw)) } catch { /* ignorar */ }
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const setSession = async (s: AuthSession | null) => {
    setSessionState(s)
    if (s) {
      await AsyncStorage.setItem('ec_token', s.token)
      await AsyncStorage.setItem('ec_session', JSON.stringify(s))
    } else {
      await AsyncStorage.removeItem('ec_token')
      await AsyncStorage.removeItem('ec_session')
    }
  }

  return (
    <AuthContext.Provider value={{ session, setSession, logout: () => setSession(null), loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
