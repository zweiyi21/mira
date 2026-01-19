package com.mira.model

import jakarta.persistence.*
import java.time.Instant
import java.time.LocalDate

enum class SprintStatus {
    PLANNING,
    ACTIVE,
    COMPLETED
}

@Entity
@Table(name = "sprints")
data class Sprint(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    val project: Project,

    @Column(nullable = false)
    var name: String,

    var goal: String? = null,

    @Column(nullable = false)
    var startDate: LocalDate,

    @Column(nullable = false)
    var endDate: LocalDate,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: SprintStatus = SprintStatus.PLANNING,

    @Column(nullable = false)
    val createdAt: Instant = Instant.now(),

    @Column(nullable = false)
    var updatedAt: Instant = Instant.now()
)
