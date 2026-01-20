import api from './api'
import type { User } from '../types'

export const userService = {
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/users/me')
    return response.data
  },

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post<User>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async deleteAvatar(): Promise<User> {
    const response = await api.delete<User>('/users/me/avatar')
    return response.data
  },

  getAvatarUrl(userId: number): string {
    return `${api.defaults.baseURL}/users/avatar/${userId}`
  },
}
