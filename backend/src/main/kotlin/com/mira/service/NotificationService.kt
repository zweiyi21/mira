package com.mira.service

import com.mira.dto.*
import com.mira.model.*
import com.mira.repository.*
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class NotificationService(
    private val notificationRepository: NotificationRepository,
    private val userRepository: UserRepository,
    private val webSocketService: WebSocketService
) {

    fun getNotifications(userId: Long, limit: Int = 50): NotificationListDto {
        val notifications = notificationRepository.findAllByUserIdOrderByCreatedAtDesc(
            userId,
            PageRequest.of(0, limit)
        ).map { it.toDto() }

        val unreadCount = notificationRepository.countByUserIdAndIsRead(userId, false)

        return NotificationListDto(
            notifications = notifications,
            unreadCount = unreadCount
        )
    }

    fun getUnreadCount(userId: Long): NotificationCountDto {
        val count = notificationRepository.countByUserIdAndIsRead(userId, false)
        return NotificationCountDto(unreadCount = count)
    }

    @Transactional
    fun createNotification(
        userId: Long,
        type: NotificationType,
        title: String,
        message: String,
        data: String? = null
    ): NotificationDto {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        val notification = Notification(
            user = user,
            type = type,
            title = title,
            message = message,
            data = data
        )

        val saved = notificationRepository.save(notification)
        val dto = saved.toDto()

        // Send real-time notification via WebSocket
        webSocketService.sendNotification(userId, dto)

        return dto
    }

    @Transactional
    fun markAsRead(notificationId: Long, userId: Long) {
        notificationRepository.markAsRead(notificationId, userId)
    }

    @Transactional
    fun markAllAsRead(userId: Long) {
        notificationRepository.markAllAsRead(userId)
    }

    private fun Notification.toDto() = NotificationDto(
        id = id,
        type = type,
        title = title,
        message = message,
        data = data,
        isRead = isRead,
        createdAt = createdAt
    )
}
