package com.mira.repository

import com.mira.model.Notification
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query

interface NotificationRepository : JpaRepository<Notification, Long> {
    fun findAllByUserIdOrderByCreatedAtDesc(userId: Long, pageable: Pageable): List<Notification>

    fun findAllByUserIdAndIsReadOrderByCreatedAtDesc(userId: Long, isRead: Boolean): List<Notification>

    fun countByUserIdAndIsRead(userId: Long, isRead: Boolean): Long

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false")
    fun markAllAsRead(userId: Long): Int

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.id = :notificationId AND n.user.id = :userId")
    fun markAsRead(notificationId: Long, userId: Long): Int
}
