package com.mira.controller

import com.mira.dto.*
import com.mira.security.UserPrincipal
import com.mira.service.ProjectService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/projects")
class ProjectController(
    private val projectService: ProjectService
) {

    @GetMapping
    fun getProjects(@AuthenticationPrincipal principal: UserPrincipal): ResponseEntity<List<ProjectDto>> {
        return ResponseEntity.ok(projectService.getProjectsForUser(principal.id))
    }

    @PostMapping
    fun createProject(
        @Valid @RequestBody request: CreateProjectRequest,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ProjectDto> {
        return ResponseEntity.ok(projectService.createProject(request, principal.id))
    }

    @GetMapping("/{key}")
    fun getProject(
        @PathVariable key: String,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ProjectDto> {
        return ResponseEntity.ok(projectService.getProjectByKey(key, principal.id))
    }

    @PutMapping("/{key}")
    fun updateProject(
        @PathVariable key: String,
        @Valid @RequestBody request: UpdateProjectRequest,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ProjectDto> {
        return ResponseEntity.ok(projectService.updateProject(key, request, principal.id))
    }

    @DeleteMapping("/{key}")
    fun deleteProject(
        @PathVariable key: String,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<Void> {
        projectService.deleteProject(key, principal.id)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/{key}/members")
    fun getMembers(
        @PathVariable key: String,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<List<ProjectMemberDto>> {
        return ResponseEntity.ok(projectService.getProjectMembers(key, principal.id))
    }

    @PostMapping("/{key}/members")
    fun addMember(
        @PathVariable key: String,
        @Valid @RequestBody request: AddMemberRequest,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ProjectMemberDto> {
        return ResponseEntity.ok(projectService.addMember(key, request, principal.id))
    }

    @DeleteMapping("/{key}/members/{memberId}")
    fun removeMember(
        @PathVariable key: String,
        @PathVariable memberId: Long,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<Void> {
        projectService.removeMember(key, memberId, principal.id)
        return ResponseEntity.noContent().build()
    }

    @PutMapping("/{key}/members/{memberId}")
    fun updateMemberRole(
        @PathVariable key: String,
        @PathVariable memberId: Long,
        @Valid @RequestBody request: UpdateMemberRoleRequest,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ProjectMemberDto> {
        return ResponseEntity.ok(projectService.updateMemberRole(key, memberId, request, principal.id))
    }
}
