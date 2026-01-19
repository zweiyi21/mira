package com.mira.dto

import com.mira.model.TeamRole
import com.mira.model.InvitationStatus
import java.time.Instant

data class TeamDto(
    val id: Long,
    val name: String,
    val description: String?,
    val owner: UserDto,
    val memberCount: Int,
    val createdAt: Instant,
    val updatedAt: Instant
)

data class TeamMemberDto(
    val user: UserDto,
    val role: TeamRole,
    val joinedAt: Instant
)

data class TeamInvitationDto(
    val id: Long,
    val team: TeamSummaryDto,
    val inviter: UserDto,
    val invitee: UserDto,
    val status: InvitationStatus,
    val createdAt: Instant
)

data class TeamSummaryDto(
    val id: Long,
    val name: String
)

data class CreateTeamRequest(
    val name: String,
    val description: String? = null
)

data class UpdateTeamRequest(
    val name: String? = null,
    val description: String? = null
)

data class InviteToTeamRequest(
    val email: String
)

data class UpdateTeamMemberRoleRequest(
    val role: TeamRole
)
