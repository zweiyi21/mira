package com.mira.service

import com.mira.dto.*
import com.mira.model.*
import com.mira.repository.ProjectInvitationRepository
import com.mira.repository.ProjectMemberRepository
import com.mira.repository.ProjectRepository
import com.mira.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class ProjectService(
    private val projectRepository: ProjectRepository,
    private val projectMemberRepository: ProjectMemberRepository,
    private val projectInvitationRepository: ProjectInvitationRepository,
    private val userRepository: UserRepository,
    private val notificationService: NotificationService
) {

    fun getProjectsForUser(userId: Long): List<ProjectDto> {
        return projectRepository.findAllByMemberId(userId).map { it.toDto() }
    }

    fun getProjectByKey(key: String, userId: Long): ProjectDto {
        val project = projectRepository.findByKey(key.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        checkMembership(project.id, userId)
        return project.toDto()
    }

    @Transactional
    fun createProject(request: CreateProjectRequest, userId: Long): ProjectDto {
        val key = request.key.uppercase()

        if (projectRepository.existsByKey(key)) {
            throw IllegalArgumentException("Project key already exists")
        }

        val owner = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        val project = Project(
            name = request.name,
            key = key,
            description = request.description,
            owner = owner,
            defaultSprintWeeks = request.defaultSprintWeeks
        )

        val savedProject = projectRepository.save(project)

        // Add owner as project member
        val membership = ProjectMember(
            project = savedProject,
            user = owner,
            role = ProjectRole.OWNER
        )
        projectMemberRepository.save(membership)

        return savedProject.toDto()
    }

    @Transactional
    fun updateProject(key: String, request: UpdateProjectRequest, userId: Long): ProjectDto {
        val project = projectRepository.findByKey(key.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        checkAdminAccess(project.id, userId)

        request.name?.let { project.name = it }
        request.description?.let { project.description = it }
        request.defaultSprintWeeks?.let { project.defaultSprintWeeks = it }
        project.updatedAt = Instant.now()

        return projectRepository.save(project).toDto()
    }

    @Transactional
    fun deleteProject(key: String, userId: Long) {
        val project = projectRepository.findByKey(key.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        // Only owner can delete the project
        if (project.owner.id != userId) {
            throw IllegalArgumentException("Only project owner can delete the project")
        }

        // Delete all project members first
        projectMemberRepository.deleteAllByProjectId(project.id)

        // Delete the project
        projectRepository.delete(project)
    }

    fun getProjectMembers(key: String, userId: Long): List<ProjectMemberDto> {
        val project = projectRepository.findByKey(key.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        checkMembership(project.id, userId)

        return projectMemberRepository.findAllByProjectId(project.id).map { member ->
            ProjectMemberDto(
                user = member.user.toDto(),
                role = member.role,
                joinedAt = member.joinedAt
            )
        }
    }

    @Transactional
    fun addMember(key: String, request: AddMemberRequest, userId: Long): ProjectMemberDto {
        val project = projectRepository.findByKey(key.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        checkAdminAccess(project.id, userId)

        val user = userRepository.findByEmail(request.email.lowercase())
            .orElseThrow { IllegalArgumentException("User not found with email: ${request.email}") }

        if (projectMemberRepository.existsByProjectIdAndUserId(project.id, user.id)) {
            throw IllegalArgumentException("User is already a member of this project")
        }

        val membership = ProjectMember(
            project = project,
            user = user,
            role = request.role
        )

        val saved = projectMemberRepository.save(membership)
        return ProjectMemberDto(
            user = saved.user.toDto(),
            role = saved.role,
            joinedAt = saved.joinedAt
        )
    }

    @Transactional
    fun removeMember(key: String, memberId: Long, userId: Long) {
        val project = projectRepository.findByKey(key.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        checkAdminAccess(project.id, userId)

        if (project.owner.id == memberId) {
            throw IllegalArgumentException("Cannot remove project owner")
        }

        projectMemberRepository.deleteByProjectIdAndUserId(project.id, memberId)
    }

    @Transactional
    fun updateMemberRole(key: String, memberId: Long, request: UpdateMemberRoleRequest, userId: Long): ProjectMemberDto {
        val project = projectRepository.findByKey(key.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        // Only owner can change roles
        val currentMember = projectMemberRepository.findByProjectIdAndUserId(project.id, userId)
            .orElseThrow { IllegalArgumentException("Not a member of this project") }

        if (currentMember.role != ProjectRole.OWNER) {
            throw IllegalArgumentException("Only project owner can change roles")
        }

        if (project.owner.id == memberId) {
            throw IllegalArgumentException("Cannot change owner's role")
        }

        val member = projectMemberRepository.findByProjectIdAndUserId(project.id, memberId)
            .orElseThrow { IllegalArgumentException("Member not found") }

        member.role = request.role
        val saved = projectMemberRepository.save(member)

        return ProjectMemberDto(
            user = saved.user.toDto(),
            role = saved.role,
            joinedAt = saved.joinedAt
        )
    }

    fun checkMembership(projectId: Long, userId: Long) {
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw IllegalArgumentException("Not a member of this project")
        }
    }

    fun checkAdminAccess(projectId: Long, userId: Long) {
        projectMemberRepository.findByProjectIdAndUserIdAndRoleIn(
            projectId, userId, listOf(ProjectRole.OWNER, ProjectRole.ADMIN)
        ).orElseThrow { IllegalArgumentException("Admin access required") }
    }

    // Project invitation methods

    @Transactional
    fun inviteMember(key: String, request: InviteMemberRequest, userId: Long): ProjectInvitationDto {
        val project = projectRepository.findByKey(key.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        checkAdminAccess(project.id, userId)

        val inviter = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        val invitee = userRepository.findByEmail(request.email.lowercase())
            .orElseThrow { IllegalArgumentException("User not found with email: ${request.email}") }

        // Check if user is already a member
        if (projectMemberRepository.existsByProjectIdAndUserId(project.id, invitee.id)) {
            throw IllegalArgumentException("User is already a member of this project")
        }

        // Check if there's already a pending invitation
        if (projectInvitationRepository.existsByProjectIdAndInviteeIdAndStatus(
                project.id, invitee.id, InvitationStatus.PENDING
            )) {
            throw IllegalArgumentException("User already has a pending invitation")
        }

        val invitation = ProjectInvitation(
            project = project,
            inviter = inviter,
            invitee = invitee
        )

        val saved = projectInvitationRepository.save(invitation)

        // Send notification to invitee
        notificationService.createNotification(
            userId = invitee.id,
            type = NotificationType.PROJECT_INVITATION,
            title = "Project Invitation",
            message = "${inviter.name} invited you to join project \"${project.name}\"",
            data = """{"projectId": ${project.id}, "projectKey": "${project.key}", "invitationId": ${saved.id}}"""
        )

        return saved.toDto()
    }

    fun getPendingInvitations(userId: Long): List<ProjectInvitationDto> {
        return projectInvitationRepository.findAllByInviteeIdAndStatus(userId, InvitationStatus.PENDING)
            .map { it.toDto() }
    }

    @Transactional
    fun acceptInvitation(invitationId: Long, userId: Long): ProjectMemberDto {
        val invitation = projectInvitationRepository.findById(invitationId)
            .orElseThrow { IllegalArgumentException("Invitation not found") }

        if (invitation.invitee.id != userId) {
            throw IllegalArgumentException("Not authorized to accept this invitation")
        }

        if (invitation.status != InvitationStatus.PENDING) {
            throw IllegalArgumentException("Invitation is no longer pending")
        }

        // Update invitation status
        invitation.status = InvitationStatus.ACCEPTED
        invitation.respondedAt = Instant.now()
        projectInvitationRepository.save(invitation)

        // Add user as project member
        val membership = ProjectMember(
            project = invitation.project,
            user = invitation.invitee,
            role = ProjectRole.MEMBER
        )
        val saved = projectMemberRepository.save(membership)

        return ProjectMemberDto(
            user = saved.user.toDto(),
            role = saved.role,
            joinedAt = saved.joinedAt
        )
    }

    @Transactional
    fun declineInvitation(invitationId: Long, userId: Long) {
        val invitation = projectInvitationRepository.findById(invitationId)
            .orElseThrow { IllegalArgumentException("Invitation not found") }

        if (invitation.invitee.id != userId) {
            throw IllegalArgumentException("Not authorized to decline this invitation")
        }

        if (invitation.status != InvitationStatus.PENDING) {
            throw IllegalArgumentException("Invitation is no longer pending")
        }

        invitation.status = InvitationStatus.DECLINED
        invitation.respondedAt = Instant.now()
        projectInvitationRepository.save(invitation)
    }
}

fun Project.toDto() = ProjectDto(
    id = id,
    name = name,
    key = key,
    description = description,
    owner = owner.toDto(),
    defaultSprintWeeks = defaultSprintWeeks,
    archived = archived,
    createdAt = createdAt,
    updatedAt = updatedAt
)

fun Project.toSummaryDto() = ProjectSummaryDto(
    id = id,
    name = name,
    key = key
)

fun ProjectInvitation.toDto() = ProjectInvitationDto(
    id = id,
    project = project.toSummaryDto(),
    inviter = inviter.toDto(),
    invitee = invitee.toDto(),
    status = status.name,
    createdAt = createdAt
)
