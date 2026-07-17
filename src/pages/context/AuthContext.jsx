import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/auth'
import { useStore } from '../../store/useStore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount — ask the backend who we are. The httpOnly cookie (if any)
  // is sent automatically; there's no token to read from localStorage anymore.
  useEffect(() => {
    authApi.me()
      .then(data => {
        setUser(data)
        localStorage.setItem('hire_ai_user', JSON.stringify(data))
      })
      .catch(() => {
        setUser(null)
        localStorage.removeItem('hire_ai_user')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (username, password) => {
    await authApi.login(username, password)   // backend sets the cookie
    const me = await authApi.me()
    setUser(me)
    localStorage.setItem('hire_ai_user', JSON.stringify(me))
    return me
  }

  const signup = async (payload) => {
    await authApi.signup(payload)              // backend sets the cookie
    const me = await authApi.me()
    setUser(me)
    localStorage.setItem('hire_ai_user', JSON.stringify(me))
    return me
  }

  const logout = async () => {
    await authApi.logout().catch(() => {})      // backend clears the cookie
    localStorage.removeItem('hire_ai_user')
    setUser(null)
    useStore.getState().resetAll()
  }

  const refreshProfile = async () => {
    const me = await authApi.me()
    setUser(me)
    localStorage.setItem('hire_ai_user', JSON.stringify(me))
    return me
  }

  // profile locally (used after PUT /api/profile/)
  const updateUser = (updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates }
      localStorage.setItem('hire_ai_user', JSON.stringify(updated))
      return updated
    })
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