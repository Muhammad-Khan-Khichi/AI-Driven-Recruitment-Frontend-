import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(() => localStorage.getItem('hire_ai_token'))
  const [loading, setLoading] = useState(true)

  // On mount — if token exists, fetch /auth/me
  useEffect(() => {
    if (token) {
      authApi.me()
        .then(data => setUser(data))
        .catch(() => { logout() })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const res = await authApi.login(username, password)
    localStorage.setItem('hire_ai_token', res.access_token)
    setToken(res.access_token)
    const me = await authApi.me()
    setUser(me)
    return me
  }

  const signup = async (payload) => {
    const res = await authApi.signup(payload)
    localStorage.setItem('hire_ai_token', res.access_token)
    setToken(res.access_token)
    const me = await authApi.me()
    setUser(me)
    return me
  }

  const logout = () => {
    authApi.logout().catch(() => {})
    localStorage.removeItem('hire_ai_token')
    setToken(null)
    setUser(null)
  }

  const refreshProfile = async () => {
    const me = await authApi.me()
    setUser(me)
    return me
  }

  const isAdmin = () => Boolean(user?.is_admin)

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, refreshProfile, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
