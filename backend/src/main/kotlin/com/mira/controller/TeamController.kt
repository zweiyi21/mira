package com.mira.controller

import com.mira.dto.*
import com.mira.security.UserPrincipal
import com.mira.service.TeamService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/teams")
class TeamController(
    private val teamService: TeamService
) {

    @GetMapping
    fun getTeams(
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<List<TeamDto>> {
        return ResponseEntity.ok(teamService.getTeams(principal.id))
    }

    @GetMapping("/{teamId}")
    fun getTeam(
        @PathVariable teamId: Long,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<TeamDto> {
        return ResponseEntity.ok(teamService.getTeam(teamId, principal.id))
    }

    @PostMapping
    fun createTeam(
        @Valid @RequestBody request: CreateTeamRequest,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<TeamDto> {
        return ResponseEntity.ok(teamService.createTeam(request, principal.id))
    }

    @PutMapping("/{teamId}")
    fun updateTeam(
        @PathVariable teamId: Long,
        @Valid @RequestBody request: UpdateTeamRequest,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<TeamDto> {
        return ResponseEntity.ok(teamService.updateTeam(teamId, request, principal.id))
    }

    @DeleteMapping("/{teamId}")
    fun deleteTeam(
        @PathVariable teamId: Long,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<Void> {
        teamService.deleteTeam(teamId, principal.id)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/{teamId}/members")
    fun getMembers(
        @PathVariable teamId: Long,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<List<TeamMemberDto>> {
        return ResponseEntity.ok(teamService.getMembers(teamId, principal.id))
    }

    @PostMapping("/{teamId}/invitations")
    fun inviteToTeam(
        @PathVariable teamId: Long,
        @Valid @RequestBody request: InviteToTeamRequest,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<TeamInvitationDto> {
        return ResponseEntity.ok(teamService.inviteToTeam(teamId, request, principal.id))
    }

    @PutMapping("/{teamId}/members/{memberId}/role")
    fun updateMemberRole(
        @PathVariable teamId: Long,
        @PathVariable memberId: Long,
        @Valid @RequestBody request: UpdateTeamMemberRoleRequest,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<TeamMemberDto> {
        return ResponseEntity.ok(teamService.updateMemberRole(teamId, memberId, request, principal.id))
    }

    @DeleteMapping("/{teamId}/members/{memberId}")
    fun removeMember(
        @PathVariable teamId: Long,
        @PathVariable memberId: Long,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<Void> {
        teamService.removeMember(teamId, memberId, principal.id)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/{teamId}/leave")
    fun leaveTeam(
        @PathVariable teamId: Long,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<Void> {
        teamService.leaveTeam(teamId, principal.id)
        return ResponseEntity.noContent().build()
    }

    // Invitation endpoints for invitees
    @GetMapping("/invitations")
    fun getPendingInvitations(
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<List<TeamInvitationDto>> {
        return ResponseEntity.ok(teamService.getPendingInvitations(principal.id))
    }

    @PostMapping("/invitations/{invitationId}/accept")
    fun acceptInvitation(
        @PathVariable invitationId: Long,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<TeamMemberDto> {
        return ResponseEntity.ok(teamService.acceptInvitation(invitationId, principal.id))
    }

    @PostMapping("/invitations/{invitationId}/decline")
    fun declineInvitation(
        @PathVariable invitationId: Long,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<Void> {
        teamService.declineInvitation(invitationId, principal.id)
        return ResponseEntity.noContent().build()
    }
}
