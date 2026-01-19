package com.mira.controller

import com.mira.dto.*
import com.mira.security.UserPrincipal
import com.mira.service.NotificationService
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/notifications")
class NotificationController(
    private val notificationService: NotificationService
) {

    @GetMapping
    fun getNotifications(
        @RequestParam(defaultValue = "50") limit: Int,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<NotificationListDto> {
        return ResponseEntity.ok(notificationService.getNotifications(principal.id, limit))
    }

    @GetMapping("/unread-count")
    fun getUnreadCount(
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<NotificationCountDto> {
        return ResponseEntity.ok(notificationService.getUnreadCount(principal.id))
    }

    @PostMapping("/{notificationId}/read")
    fun markAsRead(
        @PathVariable notificationId: Long,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<Void> {
        notificationService.markAsRead(notificationId, principal.id)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/read-all")
    fun markAllAsRead(
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<Void> {
        notificationService.markAllAsRead(principal.id)
        return ResponseEntity.noContent().build()
    }
}
