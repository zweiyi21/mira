package com.mira.dto

import com.mira.model.NotificationType
import java.time.Instant

data class NotificationDto(
    val id: Long,
    val type: NotificationType,
    val title: String,
    val message: String,
    val data: String?,
    val isRead: Boolean,
    val createdAt: Instant
)

data class NotificationCountDto(
    val unreadCount: Long
)

data class NotificationListDto(
    val notifications: List<NotificationDto>,
    val unreadCount: Long
)
