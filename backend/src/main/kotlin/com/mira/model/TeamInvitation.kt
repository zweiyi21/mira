package com.mira.model

import jakarta.persistence.*
import java.time.Instant

enum class InvitationStatus {
    PENDING,
    ACCEPTED,
    DECLINED,
    EXPIRED
}

@Entity
@Table(name = "team_invitations", uniqueConstraints = [
    UniqueConstraint(columnNames = ["team_id", "invitee_id", "status"])
])
data class TeamInvitation(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    val team: Team,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inviter_id", nullable = false)
    val inviter: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invitee_id", nullable = false)
    val invitee: User,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: InvitationStatus = InvitationStatus.PENDING,

    @Column(nullable = false)
    val createdAt: Instant = Instant.now(),

    var respondedAt: Instant? = null
)
