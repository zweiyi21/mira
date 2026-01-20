import { useState, useEffect } from 'react'
import { Badge, Dropdown, List, Typography, Button, Empty, Spin, Space, Tag, message } from 'antd'
import { BellOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { notificationService } from '../services/notificationService'
import { projectService } from '../services/projectService'
import type { Notification, NotificationType } from '../types'

dayjs.extend(relativeTime)

const { Text, Title } = Typography

const TYPE_CONFIG: Record<NotificationType, { color: string; label: string }> = {
  TEAM_INVITATION: { color: 'blue', label: 'Team' },
  PROJECT_INVITATION: { color: 'geekblue', label: 'Project' },
  ISSUE_ASSIGNED: { color: 'green', label: 'Assigned' },
  ISSUE_DUE_TODAY: { color: 'orange', label: 'Due Today' },
  ISSUE_DUE_TOMORROW: { color: 'gold', label: 'Due Tomorrow' },
  ISSUE_OVERDUE: { color: 'red', label: 'Overdue' },
  ISSUE_COMMENTED: { color: 'purple', label: 'Comment' },
  SPRINT_STARTED: { color: 'cyan', label: 'Sprint' },
  SPRINT_ENDING_SOON: { color: 'volcano', label: 'Sprint' },
  SPRINT_COMPLETED: { color: 'lime', label: 'Sprint' },
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({})
  const [respondedInvitations, setRespondedInvitations] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadUnreadCount()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadUnreadCount = async () => {
    try {
      const { unreadCount } = await notificationService.getUnreadCount()
      setUnreadCount(unreadCount)
    } catch (error) {
      console.error('Failed to load unread count:', error)
    }
  }

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const result = await notificationService.getNotifications(50)
      setNotifications(result.notifications)
      setUnreadCount(result.unreadCount)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (visible: boolean) => {
    setOpen(visible)
    if (visible) {
      loadNotifications()
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications(
        notifications.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const getInvitationIdFromNotification = (notification: Notification): number | null => {
    if (!notification.data) return null
    try {
      const data = JSON.parse(notification.data)
      return data.invitationId || null
    } catch {
      return null
    }
  }

  const handleAcceptInvitation = async (notification: Notification) => {
    const invitationId = getInvitationIdFromNotification(notification)
    if (!invitationId) return

    setActionLoading((prev) => ({ ...prev, [notification.id]: true }))
    try {
      await projectService.acceptInvitation(invitationId)
      setRespondedInvitations((prev) => new Set(prev).add(notification.id))
      await handleMarkAsRead(notification.id)
      message.success('Invitation accepted! You are now a member of the project.')
    } catch (error) {
      console.error('Failed to accept invitation:', error)
      message.error('Failed to accept invitation')
    } finally {
      setActionLoading((prev) => ({ ...prev, [notification.id]: false }))
    }
  }

  const handleDeclineInvitation = async (notification: Notification) => {
    const invitationId = getInvitationIdFromNotification(notification)
    if (!invitationId) return

    setActionLoading((prev) => ({ ...prev, [notification.id]: true }))
    try {
      await projectService.declineInvitation(invitationId)
      setRespondedInvitations((prev) => new Set(prev).add(notification.id))
      await handleMarkAsRead(notification.id)
      message.info('Invitation declined')
    } catch (error) {
      console.error('Failed to decline invitation:', error)
      message.error('Failed to decline invitation')
    } finally {
      setActionLoading((prev) => ({ ...prev, [notification.id]: false }))
    }
  }

  const dropdownContent = (
    <div
      style={{
        width: 380,
        maxHeight: 500,
        overflow: 'auto',
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          Notifications
        </Title>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : notifications.length === 0 ? (
        <Empty description="No notifications" style={{ padding: 40 }} />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(notification) => {
            const config = TYPE_CONFIG[notification.type]
            const isProjectInvitation = notification.type === 'PROJECT_INVITATION'
            const hasResponded = respondedInvitations.has(notification.id)
            const isLoading = actionLoading[notification.id]

            return (
              <List.Item
                style={{
                  padding: '12px 16px',
                  background: notification.isRead ? 'transparent' : '#f6ffed',
                  cursor: isProjectInvitation ? 'default' : 'pointer',
                  borderBottom: '1px solid #f0f0f0',
                }}
                onClick={() => !isProjectInvitation && !notification.isRead && handleMarkAsRead(notification.id)}
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Space>
                      <Tag color={config.color} style={{ marginRight: 0 }}>
                        {config.label}
                      </Tag>
                      {!notification.isRead && (
                        <Badge status="processing" />
                      )}
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(notification.createdAt).fromNow()}
                    </Text>
                  </div>
                  <Text strong style={{ display: 'block', marginBottom: 2 }}>
                    {notification.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {notification.message}
                  </Text>
                  {isProjectInvitation && !hasResponded && !notification.isRead && (
                    <Space style={{ marginTop: 8 }}>
                      <Button
                        type="primary"
                        size="small"
                        icon={<CheckOutlined />}
                        loading={isLoading}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAcceptInvitation(notification)
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        size="small"
                        icon={<CloseOutlined />}
                        loading={isLoading}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeclineInvitation(notification)
                        }}
                      >
                        Decline
                      </Button>
                    </Space>
                  )}
                  {isProjectInvitation && hasResponded && (
                    <Text type="secondary" style={{ display: 'block', marginTop: 8, fontStyle: 'italic' }}>
                      Responded
                    </Text>
                  )}
                </div>
              </List.Item>
            )
          }}
        />
      )}
    </div>
  )

  return (
    <Dropdown
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      open={open}
      onOpenChange={handleOpenChange}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 20 }} />}
          style={{ padding: '4px 8px' }}
        />
      </Badge>
    </Dropdown>
  )
}
