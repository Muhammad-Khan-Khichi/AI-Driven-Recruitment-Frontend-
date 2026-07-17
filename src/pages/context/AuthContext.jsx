import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/auth'
import { useStore } from '../../store/useStore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount — ask the backend who we are. The httpOnly cookie (if any)
  // is sent automatically; nothing about the user is cached in localStorage.
  useEffect(() => {
    authApi.me()
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (username, password) => {
    await authApi.login(username, password)   // backend sets the cookie
    const me = await authApi.me()
    setUser(me)
    return me
  }

  const signup = async (payload) => {
    await authApi.signup(payload)              // backend sets the cookie
    const me = await authApi.me()
    setUser(me)
    return me
  }

  const logout = async () => {
    await authApi.logout().catch(() => {})      // backend clears the cookie
    setUser(null)
    useStore.getState().resetAll()
  }

  const refreshProfile = async () => {
    const me = await authApi.me()
    setUser(me)
    return me
  }

  // profile locally (used after PUT /api/profile/) — kept in memory only
  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }

  const isAdmin = () => Boolean(user?.is_admin)

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, signup, logout,
      refreshProfile, updateUser,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}