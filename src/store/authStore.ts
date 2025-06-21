import { create } from 'zustand'
import { authApi, getCurrentUser, clearSessionCredentials } from '@/lib/api'

interface User {
  username: string
  role: string
  fullName: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await authApi.login(username, password)
      
      if (response.success) {
        set({ 
          user: response.user,
          isLoading: false,
          error: null 
        })
        return true
      } else {
        set({ 
          isLoading: false, 
          error: response.error || 'Login gagal' 
        })
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat login'
      set({ 
        isLoading: false, 
        error: errorMessage 
      })
      return false
    }
  },

  logout: () => {
    clearSessionCredentials()
    set({ 
      user: null, 
      error: null 
    })
  },

  clearError: () => {
    set({ error: null })
  },

  initialize: () => {
    const user = getCurrentUser()
    if (user) {
      set({ user })
    }
  }
})) 