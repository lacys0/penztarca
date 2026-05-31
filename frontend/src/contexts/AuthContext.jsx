import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI, meAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)  // kezdeti profil betöltés

  // Alkalmazás indításkor: ha van token, betöltjük a profilt
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }

    meAPI.getProfile()
      .then(res => setUser(res.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const res = await authAPI.login({ email, password })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
  }, [])

  const register = useCallback(async ({ email, password, name }) => {
    const res = await authAPI.register({ email, password, name })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  const updateUser = useCallback((partial) => {
    setUser(prev => ({ ...prev, ...partial }))
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth csak AuthProvider-en belül használható')
  return ctx
}
