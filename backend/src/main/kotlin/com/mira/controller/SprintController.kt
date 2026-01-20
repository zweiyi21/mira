package com.mira.controller

import com.mira.dto.*
import com.mira.security.UserPrincipal
import com.mira.service.SprintService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/projects/{projectKey}/sprints")
class SprintController(
    private val sprintService: SprintService
) {

    @GetMapping
    fun getSprints(
        @PathVariable projectKey: String,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<List<SprintDto>> {
        return ResponseEntity.ok(sprintService.getSprints(projectKey, principal.id))
    }

    @PostMapping
    fun createSprint(
        @PathVariable projectKey: String,
        @Valid @RequestBody request: CreateSprintRequest,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<SprintDto> {
        return ResponseEntity.ok(sprintService.createSprint(projectKey, request, principal.id))
    }

    @GetMapping("/{sprintId}")
    fun getSprint(
        @PathVariable projectKey: String,
        @PathVariable sprintId: Long,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<SprintDto> {
        return ResponseEntity.ok(sprintService.getSprintById(projectKey, sprintId, principal.id))
    }

    @PutMapping("/{sprintId}")
    fun updateSprint(
        @PathVariable projectKey: String,
        @PathVariable sprintId: Long,
        @Valid @RequestBody request: UpdateSprintRequest,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<SprintDto> {
        return ResponseEntity.ok(sprintService.updateSprint(projectKey, sprintId, request, principal.id))
    }

    @PostMapping("/{sprintId}/start")
    fun startSprint(
        @PathVariable projectKey: String,
        @PathVariable sprintId: Long,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<SprintDto> {
        return ResponseEntity.ok(sprintService.startSprint(projectKey, sprintId, principal.id))
    }

    @PostMapping("/{sprintId}/complete")
    fun completeSprint(
        @PathVariable projectKey: String,
        @PathVariable sprintId: Long,
        @RequestBody(required = false) request: CompleteSprintRequest?,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<SprintSummaryDto> {
        val completeRequest = request ?: CompleteSprintRequest()
        return ResponseEntity.ok(sprintService.completeSprint(projectKey, sprintId, completeRequest, principal.id))
    }

    @GetMapping("/{sprintId}/summary")
    fun getSprintSummary(
        @PathVariable projectKey: String,
        @PathVariable sprintId: Long,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<SprintSummaryDto> {
        return ResponseEntity.ok(sprintService.getSprintSummary(projectKey, sprintId, principal.id))
    }

    @PostMapping("/next")
    fun createNextSprint(
        @PathVariable projectKey: String,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<SprintDto> {
        return ResponseEntity.ok(sprintService.createNextSprint(projectKey, principal.id))
    }

    @GetMapping("/{sprintId}/burndown")
    fun getBurndownData(
        @PathVariable projectKey: String,
        @PathVariable sprintId: Long,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<BurndownChartData> {
        return ResponseEntity.ok(sprintService.getBurndownData(projectKey, sprintId, principal.id))
    }
}
