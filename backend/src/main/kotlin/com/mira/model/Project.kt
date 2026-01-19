package com.mira.model

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "projects")
data class Project(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    var name: String,

    @Column(unique = true, nullable = false)
    val key: String,  // e.g., "MIRA"

    var description: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    val owner: User,

    @Column(nullable = false)
    var defaultSprintWeeks: Int = 2,

    @Column(nullable = false)
    var archived: Boolean = false,

    @Column(nullable = false)
    var issueCounter: Long = 0,  // For generating issue keys like MIRA-1, MIRA-2

    @Column(nullable = false)
    val createdAt: Instant = Instant.now(),

    @Column(nullable = false)
    var updatedAt: Instant = Instant.now()
)
