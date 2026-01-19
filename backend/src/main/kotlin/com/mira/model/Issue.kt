package com.mira.model

import jakarta.persistence.*
import java.time.Instant
import java.time.LocalDate

enum class IssueType {
    EPIC,
    STORY,
    TASK,
    BUG
}

enum class IssueStatus {
    TODO,
    IN_PROGRESS,
    IN_REVIEW,
    DONE
}

enum class IssuePriority {
    HIGHEST,
    HIGH,
    MEDIUM,
    LOW,
    LOWEST
}

@Entity
@Table(name = "issues")
data class Issue(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    val project: Project,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sprint_id")
    var sprint: Sprint? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val type: IssueType,

    @Column(unique = true, nullable = false)
    val key: String,  // e.g., "MIRA-123"

    @Column(nullable = false)
    var title: String,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: IssueStatus = IssueStatus.TODO,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var priority: IssuePriority = IssuePriority.MEDIUM,

    var storyPoints: Int? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    val creator: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    var assignee: User? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    var parent: Issue? = null,

    var dueDate: LocalDate? = null,

    @Column(nullable = false)
    var orderIndex: Int = 0,  // For ordering within a status column

    @Column(nullable = false)
    val createdAt: Instant = Instant.now(),

    @Column(nullable = false)
    var updatedAt: Instant = Instant.now()
)
