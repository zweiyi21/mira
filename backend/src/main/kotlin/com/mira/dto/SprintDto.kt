package com.mira.dto

import com.mira.model.SprintStatus
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.time.LocalDate

data class CreateSprintRequest(
    @field:NotBlank(message = "Name is required")
    val name: String,

    val goal: String? = null,

    @field:NotNull(message = "Start date is required")
    val startDate: LocalDate,

    @field:NotNull(message = "End date is required")
    val endDate: LocalDate
)

data class UpdateSprintRequest(
    val name: String? = null,
    val goal: String? = null,
    val startDate: LocalDate? = null,
    val endDate: LocalDate? = null
)

data class SprintDto(
    val id: Long,
    val name: String,
    val goal: String?,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val status: SprintStatus,
    val createdAt: Instant,
    val updatedAt: Instant
)

enum class IncompleteIssueAction {
    MOVE_TO_BACKLOG,
    MOVE_TO_SPRINT
}

data class CompleteSprintRequest(
    val incompleteIssueAction: IncompleteIssueAction = IncompleteIssueAction.MOVE_TO_BACKLOG,
    val targetSprintId: Long? = null  // Required if action is MOVE_TO_SPRINT
)

data class SprintSummaryDto(
    val sprint: SprintDto,
    val totalIssues: Int,
    val completedIssues: Int,
    val incompleteIssues: Int
)

data class BurndownDataPoint(
    val date: LocalDate,
    val remainingPoints: Int,
    val idealPoints: Double
)

data class BurndownChartData(
    val sprint: SprintDto,
    val totalPoints: Int,
    val dataPoints: List<BurndownDataPoint>
)
