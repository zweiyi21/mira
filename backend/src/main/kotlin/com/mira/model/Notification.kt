package com.mira.model

import jakarta.persistence.*
import java.time.Instant

enum class NotificationType {
    TEAM_INVITATION,
    PROJECT_INVITATION,
    ISSUE_ASSIGNED,
    ISSUE_DUE_TODAY,
    ISSUE_DUE_TOMORROW,
    ISSUE_OVERDUE,
    ISSUE_COMMENTED,
    SPRINT_STARTED,
    SPRINT_ENDING_SOON,
    SPRINT_COMPLETED
}

@Entity
@Table(name = "notifications")
data class Notification(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val type: NotificationType,

    @Column(nullable = false)
    val title: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    val message: String,

    // JSON data for additional context (e.g., teamId, issueKey, projectKey)
    @Column(columnDefinition = "TEXT")
    val data: String? = null,

    @Column(nullable = false)
    var isRead: Boolean = false,

    @Column(nullable = false)
    val createdAt: Instant = Instant.now()
)
