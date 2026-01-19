package com.mira.controller

import com.mira.dto.*
import com.mira.security.UserPrincipal
import com.mira.service.IssueService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/projects/{projectKey}/issues")
class IssueController(
    private val issueService: IssueService
) {

    @GetMapping
    fun getIssues(
        @PathVariable projectKey: String,
        @RequestParam(required = false) sprintId: Long?,
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) priority: String?,
        @RequestParam(required = false) assigneeId: Long?,
        @RequestParam(required = false) type: String?,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<List<IssueDto>> {
        return ResponseEntity.ok(issueService.getIssues(
            projectKey = projectKey,
            userId = principal.id,
            sprintId = sprintId,
            search = search,
            status = status,
            priority = priority,
            assigneeId = assigneeId,
            type = type
        ))
    }

    @GetMapping("/backlog")
    fun getBacklog(
        @PathVariable projectKey: String,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<List<IssueDto>> {
        return ResponseEntity.ok(issueService.getBacklog(projectKey, principal.id))
    }

    @PostMapping
    fun createIssue(
        @PathVariable projectKey: String,
        @Valid @RequestBody request: CreateIssueRequest,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<IssueDto> {
        return ResponseEntity.ok(issueService.createIssue(projectKey, request, principal.id))
    }

    @GetMapping("/{issueKey}")
    fun getIssue(
        @PathVariable projectKey: String,
        @PathVariable issueKey: String,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<IssueDto> {
        return ResponseEntity.ok(issueService.getIssueByKey(projectKey, issueKey, principal.id))
    }

    @PutMapping("/{issueKey}")
    fun updateIssue(
        @PathVariable projectKey: String,
        @PathVariable issueKey: String,
        @Valid @RequestBody request: UpdateIssueRequest,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<IssueDto> {
        return ResponseEntity.ok(issueService.updateIssue(projectKey, issueKey, request, principal.id))
    }

    @PostMapping("/{issueKey}/move")
    fun moveIssue(
        @PathVariable projectKey: String,
        @PathVariable issueKey: String,
        @Valid @RequestBody request: MoveIssueRequest,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<IssueDto> {
        return ResponseEntity.ok(issueService.moveIssue(projectKey, issueKey, request, principal.id))
    }

    @DeleteMapping("/{issueKey}")
    fun deleteIssue(
        @PathVariable projectKey: String,
        @PathVariable issueKey: String,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<Void> {
        issueService.deleteIssue(projectKey, issueKey, principal.id)
        return ResponseEntity.noContent().build()
    }
}
