package com.mira.repository

import com.mira.model.Team
import com.mira.model.TeamMember
import com.mira.model.TeamInvitation
import com.mira.model.InvitationStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.Optional

interface TeamRepository : JpaRepository<Team, Long> {
    fun findByName(name: String): Optional<Team>

    @Query("SELECT t FROM Team t JOIN TeamMember tm ON t.id = tm.team.id WHERE tm.user.id = :userId")
    fun findAllByUserId(userId: Long): List<Team>
}

interface TeamMemberRepository : JpaRepository<TeamMember, Long> {
    fun findAllByTeamId(teamId: Long): List<TeamMember>
    fun findByTeamIdAndUserId(teamId: Long, userId: Long): Optional<TeamMember>
    fun existsByTeamIdAndUserId(teamId: Long, userId: Long): Boolean
    fun deleteByTeamIdAndUserId(teamId: Long, userId: Long)
}

interface TeamInvitationRepository : JpaRepository<TeamInvitation, Long> {
    fun findAllByInviteeIdAndStatus(inviteeId: Long, status: InvitationStatus): List<TeamInvitation>
    fun findByTeamIdAndInviteeIdAndStatus(teamId: Long, inviteeId: Long, status: InvitationStatus): Optional<TeamInvitation>
    fun existsByTeamIdAndInviteeIdAndStatus(teamId: Long, inviteeId: Long, status: InvitationStatus): Boolean
}
