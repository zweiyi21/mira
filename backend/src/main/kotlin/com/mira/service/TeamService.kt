package com.mira.service

import com.mira.dto.*
import com.mira.model.*
import com.mira.repository.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class TeamService(
    private val teamRepository: TeamRepository,
    private val teamMemberRepository: TeamMemberRepository,
    private val teamInvitationRepository: TeamInvitationRepository,
    private val userRepository: UserRepository,
    private val notificationService: NotificationService
) {

    fun getTeams(userId: Long): List<TeamDto> {
        return teamRepository.findAllByUserId(userId).map { it.toDto() }
    }

    fun getTeam(teamId: Long, userId: Long): TeamDto {
        checkMembership(teamId, userId)
        val team = teamRepository.findById(teamId)
            .orElseThrow { IllegalArgumentException("Team not found") }
        return team.toDto()
    }

    fun getMembers(teamId: Long, userId: Long): List<TeamMemberDto> {
        checkMembership(teamId, userId)
        return teamMemberRepository.findAllByTeamId(teamId).map { it.toDto() }
    }

    @Transactional
    fun createTeam(request: CreateTeamRequest, userId: Long): TeamDto {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        if (teamRepository.findByName(request.name).isPresent) {
            throw IllegalArgumentException("Team name already exists")
        }

        val team = Team(
            name = request.name,
            description = request.description,
            owner = user
        )
        val savedTeam = teamRepository.save(team)

        // Add owner as a member
        val membership = TeamMember(
            team = savedTeam,
            user = user,
            role = TeamRole.OWNER
        )
        teamMemberRepository.save(membership)

        return savedTeam.toDto()
    }

    @Transactional
    fun updateTeam(teamId: Long, request: UpdateTeamRequest, userId: Long): TeamDto {
        checkAdminAccess(teamId, userId)

        val team = teamRepository.findById(teamId)
            .orElseThrow { IllegalArgumentException("Team not found") }

        request.name?.let {
            if (it != team.name && teamRepository.findByName(it).isPresent) {
                throw IllegalArgumentException("Team name already exists")
            }
            team.name = it
        }
        request.description?.let { team.description = it }
        team.updatedAt = Instant.now()

        return teamRepository.save(team).toDto()
    }

    @Transactional
    fun inviteToTeam(teamId: Long, request: InviteToTeamRequest, userId: Long): TeamInvitationDto {
        checkAdminAccess(teamId, userId)

        val team = teamRepository.findById(teamId)
            .orElseThrow { IllegalArgumentException("Team not found") }

        val inviter = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        val invitee = userRepository.findByEmail(request.email)
            .orElseThrow { IllegalArgumentException("User with this email not found") }

        if (invitee.id == userId) {
            throw IllegalArgumentException("Cannot invite yourself")
        }

        if (teamMemberRepository.existsByTeamIdAndUserId(teamId, invitee.id)) {
            throw IllegalArgumentException("User is already a member of this team")
        }

        if (teamInvitationRepository.existsByTeamIdAndInviteeIdAndStatus(teamId, invitee.id, InvitationStatus.PENDING)) {
            throw IllegalArgumentException("User already has a pending invitation")
        }

        val invitation = TeamInvitation(
            team = team,
            inviter = inviter,
            invitee = invitee
        )
        val savedInvitation = teamInvitationRepository.save(invitation)

        // Send notification
        notificationService.createNotification(
            userId = invitee.id,
            type = NotificationType.TEAM_INVITATION,
            title = "Team Invitation",
            message = "${inviter.name} invited you to join team '${team.name}'",
            data = """{"teamId": ${team.id}, "invitationId": ${savedInvitation.id}}"""
        )

        return savedInvitation.toDto()
    }

    @Transactional
    fun acceptInvitation(invitationId: Long, userId: Long): TeamMemberDto {
        val invitation = teamInvitationRepository.findById(invitationId)
            .orElseThrow { IllegalArgumentException("Invitation not found") }

        if (invitation.invitee.id != userId) {
            throw IllegalArgumentException("This invitation is not for you")
        }

        if (invitation.status != InvitationStatus.PENDING) {
            throw IllegalArgumentException("Invitation is no longer pending")
        }

        invitation.status = InvitationStatus.ACCEPTED
        invitation.respondedAt = Instant.now()
        teamInvitationRepository.save(invitation)

        val membership = TeamMember(
            team = invitation.team,
            user = invitation.invitee,
            role = TeamRole.MEMBER
        )
        return teamMemberRepository.save(membership).toDto()
    }

    @Transactional
    fun declineInvitation(invitationId: Long, userId: Long) {
        val invitation = teamInvitationRepository.findById(invitationId)
            .orElseThrow { IllegalArgumentException("Invitation not found") }

        if (invitation.invitee.id != userId) {
            throw IllegalArgumentException("This invitation is not for you")
        }

        if (invitation.status != InvitationStatus.PENDING) {
            throw IllegalArgumentException("Invitation is no longer pending")
        }

        invitation.status = InvitationStatus.DECLINED
        invitation.respondedAt = Instant.now()
        teamInvitationRepository.save(invitation)
    }

    fun getPendingInvitations(userId: Long): List<TeamInvitationDto> {
        return teamInvitationRepository.findAllByInviteeIdAndStatus(userId, InvitationStatus.PENDING)
            .map { it.toDto() }
    }

    @Transactional
    fun updateMemberRole(teamId: Long, memberId: Long, request: UpdateTeamMemberRoleRequest, userId: Long): TeamMemberDto {
        checkOwnerAccess(teamId, userId)

        val member = teamMemberRepository.findByTeamIdAndUserId(teamId, memberId)
            .orElseThrow { IllegalArgumentException("Member not found") }

        if (member.role == TeamRole.OWNER) {
            throw IllegalArgumentException("Cannot change the owner's role")
        }

        if (request.role == TeamRole.OWNER) {
            throw IllegalArgumentException("Cannot promote to owner")
        }

        member.role = request.role
        return teamMemberRepository.save(member).toDto()
    }

    @Transactional
    fun removeMember(teamId: Long, memberId: Long, userId: Long) {
        checkAdminAccess(teamId, userId)

        val member = teamMemberRepository.findByTeamIdAndUserId(teamId, memberId)
            .orElseThrow { IllegalArgumentException("Member not found") }

        if (member.role == TeamRole.OWNER) {
            throw IllegalArgumentException("Cannot remove the owner")
        }

        teamMemberRepository.delete(member)
    }

    @Transactional
    fun leaveTeam(teamId: Long, userId: Long) {
        val member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
            .orElseThrow { IllegalArgumentException("You are not a member of this team") }

        if (member.role == TeamRole.OWNER) {
            throw IllegalArgumentException("Owner cannot leave the team. Transfer ownership first or delete the team.")
        }

        teamMemberRepository.delete(member)
    }

    @Transactional
    fun deleteTeam(teamId: Long, userId: Long) {
        checkOwnerAccess(teamId, userId)
        teamRepository.deleteById(teamId)
    }

    fun checkMembership(teamId: Long, userId: Long) {
        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw IllegalArgumentException("You are not a member of this team")
        }
    }

    fun checkAdminAccess(teamId: Long, userId: Long) {
        val member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
            .orElseThrow { IllegalArgumentException("You are not a member of this team") }

        if (member.role == TeamRole.MEMBER) {
            throw IllegalArgumentException("Admin access required")
        }
    }

    fun checkOwnerAccess(teamId: Long, userId: Long) {
        val member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
            .orElseThrow { IllegalArgumentException("You are not a member of this team") }

        if (member.role != TeamRole.OWNER) {
            throw IllegalArgumentException("Owner access required")
        }
    }

    private fun Team.toDto(): TeamDto {
        val memberCount = teamMemberRepository.findAllByTeamId(id).size
        return TeamDto(
            id = id,
            name = name,
            description = description,
            owner = owner.toDto(),
            memberCount = memberCount,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }

    private fun TeamMember.toDto() = TeamMemberDto(
        user = user.toDto(),
        role = role,
        joinedAt = joinedAt
    )

    private fun TeamInvitation.toDto() = TeamInvitationDto(
        id = id,
        team = TeamSummaryDto(team.id, team.name),
        inviter = inviter.toDto(),
        invitee = invitee.toDto(),
        status = status,
        createdAt = createdAt
    )
}
