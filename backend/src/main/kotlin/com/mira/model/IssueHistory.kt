package com.mira.model

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "issue_history")
data class IssueHistory(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id", nullable = false)
    val issue: Issue,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(nullable = false)
    val fieldName: String,

    @Column(columnDefinition = "TEXT")
    val oldValue: String? = null,

    @Column(columnDefinition = "TEXT")
    val newValue: String? = null,

    @Column(nullable = false)
    val createdAt: Instant = Instant.now()
)
