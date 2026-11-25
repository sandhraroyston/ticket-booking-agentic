import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import * as mockAuth from './mockAuth.ts'

const STORAGE_KEY = 'tb.session'

interface AuthState {
  isAuthenticated: boolean
  signup: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

function readToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readToken)

  const store = useCallback((session: mockAuth.AuthSession) => {
    sessionStorage.setItem(STORAGE_KEY, session.token)
    setToken(session.token)
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      isAuthenticated: token !== null,
      signup: async (email, password) => store(await mockAuth.signup(email, password)),
      login: async (email, password) => store(await mockAuth.login(email, password)),
      logout: () => {
        sessionStorage.removeItem(STORAGE_KEY)
        setToken(null)
      },
    }),
    [token, store],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
