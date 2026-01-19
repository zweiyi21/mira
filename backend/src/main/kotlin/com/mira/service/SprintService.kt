package com.mira.service

import com.mira.dto.*
import com.mira.model.Sprint
import com.mira.model.SprintStatus
import com.mira.model.IssueStatus
import com.mira.repository.ProjectRepository
import com.mira.repository.SprintRepository
import com.mira.repository.IssueRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate

@Service
class SprintService(
    private val sprintRepository: SprintRepository,
    private val projectRepository: ProjectRepository,
    private val issueRepository: IssueRepository,
    private val projectService: ProjectService,
    private val notificationService: NotificationService
) {

    fun getSprints(projectKey: String, userId: Long): List<SprintDto> {
        val project = projectRepository.findByKey(projectKey.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        projectService.checkMembership(project.id, userId)

        return sprintRepository.findAllByProjectIdOrderByStartDateDesc(project.id)
            .map { it.toDto() }
    }

    fun getSprintById(projectKey: String, sprintId: Long, userId: Long): SprintDto {
        val project = projectRepository.findByKey(projectKey.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        projectService.checkMembership(project.id, userId)

        val sprint = sprintRepository.findById(sprintId)
            .orElseThrow { IllegalArgumentException("Sprint not found") }

        if (sprint.project.id != project.id) {
            throw IllegalArgumentException("Sprint does not belong to this project")
        }

        return sprint.toDto()
    }

    @Transactional
    fun createSprint(projectKey: String, request: CreateSprintRequest, userId: Long): SprintDto {
        val project = projectRepository.findByKey(projectKey.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        projectService.checkAdminAccess(project.id, userId)

        if (request.endDate.isBefore(request.startDate)) {
            throw IllegalArgumentException("End date must be after start date")
        }

        val sprint = Sprint(
            project = project,
            name = request.name,
            goal = request.goal,
            startDate = request.startDate,
            endDate = request.endDate
        )

        return sprintRepository.save(sprint).toDto()
    }

    @Transactional
    fun updateSprint(projectKey: String, sprintId: Long, request: UpdateSprintRequest, userId: Long): SprintDto {
        val project = projectRepository.findByKey(projectKey.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        projectService.checkAdminAccess(project.id, userId)

        val sprint = sprintRepository.findById(sprintId)
            .orElseThrow { IllegalArgumentException("Sprint not found") }

        if (sprint.project.id != project.id) {
            throw IllegalArgumentException("Sprint does not belong to this project")
        }

        request.name?.let { sprint.name = it }
        request.goal?.let { sprint.goal = it }
        request.startDate?.let { sprint.startDate = it }
        request.endDate?.let { sprint.endDate = it }
        sprint.updatedAt = Instant.now()

        return sprintRepository.save(sprint).toDto()
    }

    @Transactional
    fun startSprint(projectKey: String, sprintId: Long, userId: Long): SprintDto {
        val project = projectRepository.findByKey(projectKey.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        projectService.checkAdminAccess(project.id, userId)

        // Check if there's already an active sprint
        val activeSprint = sprintRepository.findByProjectIdAndStatus(project.id, SprintStatus.ACTIVE)
        if (activeSprint.isPresent) {
            throw IllegalArgumentException("There is already an active sprint. Complete it first.")
        }

        val sprint = sprintRepository.findById(sprintId)
            .orElseThrow { IllegalArgumentException("Sprint not found") }

        if (sprint.project.id != project.id) {
            throw IllegalArgumentException("Sprint does not belong to this project")
        }

        if (sprint.status != SprintStatus.PLANNING) {
            throw IllegalArgumentException("Sprint is not in planning status")
        }

        sprint.status = SprintStatus.ACTIVE
        sprint.updatedAt = Instant.now()

        return sprintRepository.save(sprint).toDto()
    }

    @Transactional
    fun completeSprint(projectKey: String, sprintId: Long, request: CompleteSprintRequest, userId: Long): SprintSummaryDto {
        val project = projectRepository.findByKey(projectKey.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        projectService.checkAdminAccess(project.id, userId)

        val sprint = sprintRepository.findById(sprintId)
            .orElseThrow { IllegalArgumentException("Sprint not found") }

        if (sprint.project.id != project.id) {
            throw IllegalArgumentException("Sprint does not belong to this project")
        }

        if (sprint.status != SprintStatus.ACTIVE) {
            throw IllegalArgumentException("Sprint is not active")
        }

        // Get sprint issues for summary
        val allIssues = issueRepository.findAllByProjectIdAndSprintId(project.id, sprintId)
        val completedIssues = allIssues.filter { it.status == IssueStatus.DONE }
        val incompleteIssues = allIssues.filter { it.status != IssueStatus.DONE }

        // Handle incomplete issues
        when (request.incompleteIssueAction) {
            IncompleteIssueAction.MOVE_TO_BACKLOG -> {
                issueRepository.moveIncompleteIssuesToBacklog(sprintId, IssueStatus.DONE)
            }
            IncompleteIssueAction.MOVE_TO_SPRINT -> {
                val targetSprintId = request.targetSprintId
                    ?: throw IllegalArgumentException("Target sprint ID is required")
                val targetSprint = sprintRepository.findById(targetSprintId)
                    .orElseThrow { IllegalArgumentException("Target sprint not found") }
                if (targetSprint.project.id != project.id) {
                    throw IllegalArgumentException("Target sprint does not belong to this project")
                }
                incompleteIssues.forEach { issue ->
                    issue.sprint = targetSprint
                    issueRepository.save(issue)
                }
            }
        }

        sprint.status = SprintStatus.COMPLETED
        sprint.updatedAt = Instant.now()
        val savedSprint = sprintRepository.save(sprint)

        // Send notification about sprint completion
        val members = projectService.getProjectMembers(projectKey, userId)
        members.forEach { member: ProjectMemberDto ->
            notificationService.createNotification(
                userId = member.user.id,
                type = com.mira.model.NotificationType.SPRINT_COMPLETED,
                title = "Sprint Completed",
                message = "Sprint '${sprint.name}' has been completed. ${completedIssues.size}/${allIssues.size} issues done.",
                data = """{"projectKey": "$projectKey", "sprintId": $sprintId}"""
            )
        }

        return SprintSummaryDto(
            sprint = savedSprint.toDto(),
            totalIssues = allIssues.size,
            completedIssues = completedIssues.size,
            incompleteIssues = incompleteIssues.size
        )
    }

    fun getSprintSummary(projectKey: String, sprintId: Long, userId: Long): SprintSummaryDto {
        val project = projectRepository.findByKey(projectKey.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        projectService.checkMembership(project.id, userId)

        val sprint = sprintRepository.findById(sprintId)
            .orElseThrow { IllegalArgumentException("Sprint not found") }

        if (sprint.project.id != project.id) {
            throw IllegalArgumentException("Sprint does not belong to this project")
        }

        val allIssues = issueRepository.findAllByProjectIdAndSprintId(project.id, sprintId)
        val completedIssues = allIssues.filter { it.status == IssueStatus.DONE }
        val incompleteIssues = allIssues.filter { it.status != IssueStatus.DONE }

        return SprintSummaryDto(
            sprint = sprint.toDto(),
            totalIssues = allIssues.size,
            completedIssues = completedIssues.size,
            incompleteIssues = incompleteIssues.size
        )
    }

    // Create next sprint with default 2-week duration
    @Transactional
    fun createNextSprint(projectKey: String, userId: Long): SprintDto {
        val project = projectRepository.findByKey(projectKey.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        projectService.checkAdminAccess(project.id, userId)

        val sprints = sprintRepository.findAllByProjectIdOrderByStartDateDesc(project.id)
        val lastSprint = sprints.firstOrNull()

        val sprintNumber = sprints.size + 1
        val startDate = lastSprint?.endDate?.plusDays(1) ?: LocalDate.now()
        val endDate = startDate.plusWeeks(project.defaultSprintWeeks.toLong())

        val sprint = Sprint(
            project = project,
            name = "Sprint $sprintNumber",
            startDate = startDate,
            endDate = endDate
        )

        return sprintRepository.save(sprint).toDto()
    }
}

fun Sprint.toDto() = SprintDto(
    id = id,
    name = name,
    goal = goal,
    startDate = startDate,
    endDate = endDate,
    status = status,
    createdAt = createdAt,
    updatedAt = updatedAt
)
