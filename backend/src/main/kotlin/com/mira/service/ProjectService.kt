package com.mira.service

import com.mira.dto.*
import com.mira.model.Project
import com.mira.model.ProjectMember
import com.mira.model.ProjectRole
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
    private val userRepository: UserRepository
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
