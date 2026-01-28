import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import { userService } from '../services/userService'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  updateUser: (user: User) => void
  logout: () => void
  validateSession: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),
      updateUser: (user) => set({ user }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
      validateSession: async () => {
        const token = get().accessToken
        if (!token) {
          get().logout()
          return false
        }
        try {
          const user = await userService.getCurrentUser()
          set({ user, isAuthenticated: true })
          return true
        } catch (error: any) {
          if (error.response?.status === 401) {
            get().logout()
            return false
          }
          return true
        }
      },
    }),
    {
      name: 'mira-auth',
    }
  )
)
