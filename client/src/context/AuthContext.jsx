import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Rehydrate on mount
  useEffect(() => {
    const token = localStorage.getItem('prism_token')
    if (!token) { setLoading(false); return }
    authAPI.me()
      .then(res => setUser(res.data))
      .catch(()  => localStorage.removeItem('prism_token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    localStorage.setItem('prism_token', data.token)
    setUser(data.user)
    return data.user
  }

  const register = async (username, email, password) => {
    const { data } = await authAPI.register({ username, email, password })
    localStorage.setItem('prism_token', data.token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('prism_token')
    setUser(null)
  }

  // Update local XP/streak without a full refetch
  const updateXP = (delta) => setUser(u => u ? { ...u, xp: u.xp + delta } : u)

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateXP }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
