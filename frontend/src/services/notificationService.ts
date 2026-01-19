import api from './api'
import type { NotificationList } from '../types'

export const notificationService = {
  async getNotifications(limit: number = 50): Promise<NotificationList> {
    const response = await api.get<NotificationList>('/notifications', {
      params: { limit },
    })
    return response.data
  },

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await api.get<{ unreadCount: number }>('/notifications/unread-count')
    return response.data
  },

  async markAsRead(notificationId: number): Promise<void> {
    await api.post(`/notifications/${notificationId}/read`)
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/read-all')
  },
}
