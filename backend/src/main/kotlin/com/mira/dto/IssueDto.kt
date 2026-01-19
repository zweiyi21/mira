package com.mira.dto

import com.mira.model.IssuePriority
import com.mira.model.IssueStatus
import com.mira.model.IssueType
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.time.LocalDate

data class CreateIssueRequest(
    @field:NotNull(message = "Type is required")
    val type: IssueType,

    @field:NotBlank(message = "Title is required")
    val title: String,

    val description: String? = null,
    val priority: IssuePriority = IssuePriority.MEDIUM,
    val storyPoints: Int? = null,
    val assigneeId: Long? = null,
    val parentKey: String? = null,
    val sprintId: Long? = null,
    val dueDate: LocalDate? = null,
    val labelIds: List<Long>? = null
)

data class UpdateIssueRequest(
    val title: String? = null,
    val description: String? = null,
    val status: IssueStatus? = null,
    val priority: IssuePriority? = null,
    val storyPoints: Int? = null,
    val assigneeId: Long? = null,
    val sprintId: Long? = null,
    val dueDate: LocalDate? = null,
    val orderIndex: Int? = null,
    val labelIds: List<Long>? = null
)

data class MoveIssueRequest(
    val status: IssueStatus,
    val orderIndex: Int
)

data class IssueDto(
    val id: Long,
    val key: String,
    val type: IssueType,
    val title: String,
    val description: String?,
    val status: IssueStatus,
    val priority: IssuePriority,
    val storyPoints: Int?,
    val creator: UserDto,
    val assignee: UserDto?,
    val parentKey: String?,
    val sprintId: Long?,
    val dueDate: LocalDate?,
    val orderIndex: Int,
    val labels: List<LabelDto>,
    val createdAt: Instant,
    val updatedAt: Instant
)

data class IssueSummaryDto(
    val key: String,
    val type: IssueType,
    val title: String,
    val status: IssueStatus,
    val priority: IssuePriority,
    val assignee: UserDto?,
    val storyPoints: Int?,
    val orderIndex: Int
)

data class LabelDto(
    val id: Long,
    val name: String,
    val color: String
)

data class CreateLabelRequest(
    @field:NotBlank(message = "Name is required")
    val name: String,

    val color: String = "#1890ff"
)
