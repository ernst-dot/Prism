import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:  null,
      token: null,

      login: async (login, password) => {
        const res = await authAPI.login({ login, password })
        const { token, user } = res.data
        localStorage.setItem('prism_token', token)
        set({ user, token })
        return user
      },

      register: async (username, email, password) => {
        const res = await authAPI.register({ username, email, password })
        const { token, user } = res.data
        localStorage.setItem('prism_token', token)
        set({ user, token })
        return user
      },

      logout: () => {
        localStorage.removeItem('prism_token')
        set({ user: null, token: null })
      },

      refreshUser: async () => {
        try {
          const res = await authAPI.me()
          set({ user: res.data })
        } catch {
          get().logout()
        }
      },

      isLoggedIn: () => !!get().token,
    }),
    {
      name:    'prism-auth',
      partialize: state => ({ user: state.user, token: state.token }),
    }
  )
)
