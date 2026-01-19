package com.mira.service

import com.mira.dto.*
import com.mira.model.*
import com.mira.repository.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class IssueService(
    private val issueRepository: IssueRepository,
    private val projectRepository: ProjectRepository,
    private val userRepository: UserRepository,
    private val sprintRepository: SprintRepository,
    private val issueLabelRepository: IssueLabelRepository,
    private val issueLabelAssignmentRepository: IssueLabelAssignmentRepository,
    private val issueHistoryRepository: IssueHistoryRepository,
    private val projectService: ProjectService,
    private val webSocketService: WebSocketService
) {

    fun getIssues(
        projectKey: String,
        userId: Long,
        sprintId: Long? = null,
        search: String? = null,
        status: String? = null,
        priority: String? = null,
        assigneeId: Long? = null,
        type: String? = null
    ): List<IssueDto> {
        val project = projectRepository.findByKey(projectKey.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        projectService.checkMembership(project.id, userId)

        var issues = if (sprintId != null) {
            issueRepository.findAllByProjectIdAndSprintId(project.id, sprintId)
        } else {
            issueRepository.findAllByProjectId(project.id)
        }

        // Apply filters
        if (!search.isNullOrBlank()) {
            val searchLower = search.lowercase()
            issues = issues.filter {
                it.title.lowercase().contains(searchLower) ||
                it.key.lowercase().contains(searchLower) ||
                it.description?.lowercase()?.contains(searchLower) == true
            }
        }

        if (!status.isNullOrBlank()) {
            val statusEnum = IssueStatus.valueOf(status.uppercase())
            issues = issues.filter { it.status == statusEnum }
        }

        if (!priority.isNullOrBlank()) {
            val priorityEnum = IssuePriority.valueOf(priority.uppercase())
            issues = issues.filter { it.priority == priorityEnum }
        }

        if (assigneeId != null) {
            issues = issues.filter { it.assignee?.id == assigneeId }
        }

        if (!type.isNullOrBlank()) {
            val typeEnum = IssueType.valueOf(type.uppercase())
            issues = issues.filter { it.type == typeEnum }
        }

        return issues.map { it.toDto() }
    }

    fun getBacklog(projectKey: String, userId: Long): List<IssueDto> {
        val project = projectRepository.findByKey(projectKey.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        projectService.checkMembership(project.id, userId)

        return issueRepository.findAllByProjectIdAndSprintIdIsNull(project.id)
            .map { it.toDto() }
    }

    fun getIssueByKey(projectKey: String, issueKey: String, userId: Long): IssueDto {
        val project = projectRepository.findByKey(projectKey.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        projectService.checkMembership(project.id, userId)

        val issue = issueRepository.findByKey(issueKey.uppercase())
            .orElseThrow { IllegalArgumentException("Issue not found") }

        if (issue.project.id != project.id) {
            throw IllegalArgumentException("Issue does not belong to this project")
        }

        return issue.toDto()
    }

    @Transactional
    fun createIssue(projectKey: String, request: CreateIssueRequest, userId: Long): IssueDto {
        val project = projectRepository.findByKey(projectKey.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        projectService.checkMembership(project.id, userId)

        val creator = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        // Generate issue key
        project.issueCounter++
        val issueKey = "${project.key}-${project.issueCounter}"
        projectRepository.save(project)

        val assignee = request.assigneeId?.let {
            userRepository.findById(it).orElse(null)
        }

        val sprint = request.sprintId?.let {
            sprintRepository.findById(it).orElse(null)
        }

        val parent = request.parentKey?.let {
            issueRepository.findByKey(it.uppercase()).orElse(null)
        }

        val maxOrder = issueRepository.findMaxOrderIndexByProjectIdAndStatus(project.id, IssueStatus.TODO) ?: -1

        val issue = Issue(
            project = project,
            sprint = sprint,
            type = request.type,
            key = issueKey,
            title = request.title,
            description = request.description,
            priority = request.priority,
            storyPoints = request.storyPoints,
            creator = creator,
            assignee = assignee,
            parent = parent,
            dueDate = request.dueDate,
            orderIndex = maxOrder + 1
        )

        val savedIssue = issueRepository.save(issue)

        // Assign labels
        request.labelIds?.forEach { labelId ->
            issueLabelRepository.findById(labelId).ifPresent { label ->
                issueLabelAssignmentRepository.save(
                    IssueLabelAssignment(issue = savedIssue, label = label)
                )
            }
        }

        val issueDto = savedIssue.toDto()
        webSocketService.notifyIssueCreated(projectKey, issueDto)

        return issueDto
    }

    @Transactional
    fun updateIssue(projectKey: String, issueKey: String, request: UpdateIssueRequest, userId: Long): IssueDto {
        val project = projectRepository.findByKey(projectKey.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        projectService.checkMembership(project.id, userId)

        val issue = issueRepository.findByKey(issueKey.uppercase())
            .orElseThrow { IllegalArgumentException("Issue not found") }

        if (issue.project.id != project.id) {
            throw IllegalArgumentException("Issue does not belong to this project")
        }

        val user = userRepository.findById(userId).get()

        // Track changes for history
        request.title?.let {
            if (it != issue.title) {
                recordHistory(issue, user, "title", issue.title, it)
                issue.title = it
            }
        }

        request.description?.let {
            if (it != issue.description) {
                recordHistory(issue, user, "description", issue.description, it)
                issue.description = it
            }
        }

        request.status?.let {
            if (it != issue.status) {
                recordHistory(issue, user, "status", issue.status.name, it.name)
                issue.status = it
            }
        }

        request.priority?.let {
            if (it != issue.priority) {
                recordHistory(issue, user, "priority", issue.priority.name, it.name)
                issue.priority = it
            }
        }

        request.storyPoints?.let {
            if (it != issue.storyPoints) {
                recordHistory(issue, user, "storyPoints", issue.storyPoints?.toString(), it.toString())
                issue.storyPoints = it
            }
        }

        request.assigneeId?.let { assigneeId ->
            val newAssignee = if (assigneeId > 0) userRepository.findById(assigneeId).orElse(null) else null
            if (newAssignee?.id != issue.assignee?.id) {
                recordHistory(issue, user, "assignee", issue.assignee?.name, newAssignee?.name)
                issue.assignee = newAssignee
            }
        }

        request.sprintId?.let { sprintId ->
            val newSprint = if (sprintId > 0) sprintRepository.findById(sprintId).orElse(null) else null
            if (newSprint?.id != issue.sprint?.id) {
                recordHistory(issue, user, "sprint", issue.sprint?.name, newSprint?.name)
                issue.sprint = newSprint
            }
        }

        request.dueDate?.let { issue.dueDate = it }
        request.orderIndex?.let { issue.orderIndex = it }

        issue.updatedAt = Instant.now()

        val savedIssue = issueRepository.save(issue)
        val issueDto = savedIssue.toDto()

        webSocketService.notifyIssueUpdated(projectKey, issueDto)

        return issueDto
    }

    @Transactional
    fun moveIssue(projectKey: String, issueKey: String, request: MoveIssueRequest, userId: Long): IssueDto {
        val project = projectRepository.findByKey(projectKey.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        projectService.checkMembership(project.id, userId)

        val issue = issueRepository.findByKey(issueKey.uppercase())
            .orElseThrow { IllegalArgumentException("Issue not found") }

        if (issue.project.id != project.id) {
            throw IllegalArgumentException("Issue does not belong to this project")
        }

        val user = userRepository.findById(userId).get()

        if (issue.status != request.status) {
            recordHistory(issue, user, "status", issue.status.name, request.status.name)
        }

        issue.status = request.status
        issue.orderIndex = request.orderIndex
        issue.updatedAt = Instant.now()

        val savedIssue = issueRepository.save(issue)
        val issueDto = savedIssue.toDto()

        webSocketService.notifyIssueUpdated(projectKey, issueDto)

        return issueDto
    }

    @Transactional
    fun deleteIssue(projectKey: String, issueKey: String, userId: Long) {
        val project = projectRepository.findByKey(projectKey.uppercase())
            .orElseThrow { IllegalArgumentException("Project not found") }

        projectService.checkMembership(project.id, userId)

        val issue = issueRepository.findByKey(issueKey.uppercase())
            .orElseThrow { IllegalArgumentException("Issue not found") }

        if (issue.project.id != project.id) {
            throw IllegalArgumentException("Issue does not belong to this project")
        }

        issueRepository.delete(issue)
        webSocketService.notifyIssueDeleted(projectKey, issueKey)
    }

    private fun recordHistory(issue: Issue, user: User, field: String, oldValue: String?, newValue: String?) {
        issueHistoryRepository.save(
            IssueHistory(
                issue = issue,
                user = user,
                fieldName = field,
                oldValue = oldValue,
                newValue = newValue
            )
        )
    }

    private fun Issue.toDto(): IssueDto {
        val labels = issueLabelAssignmentRepository.findLabelsByIssueId(id)
            .map { LabelDto(it.id, it.name, it.color) }

        return IssueDto(
            id = id,
            key = key,
            type = type,
            title = title,
            description = description,
            status = status,
            priority = priority,
            storyPoints = storyPoints,
            creator = creator.toDto(),
            assignee = assignee?.toDto(),
            parentKey = parent?.key,
            sprintId = sprint?.id,
            dueDate = dueDate,
            orderIndex = orderIndex,
            labels = labels,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
}
