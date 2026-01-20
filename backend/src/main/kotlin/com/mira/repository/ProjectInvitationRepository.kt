package com.mira.repository

import com.mira.model.InvitationStatus
import com.mira.model.ProjectInvitation
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface ProjectInvitationRepository : JpaRepository<ProjectInvitation, Long> {
    fun findAllByInviteeIdAndStatus(inviteeId: Long, status: InvitationStatus): List<ProjectInvitation>

    fun findByProjectIdAndInviteeIdAndStatus(
        projectId: Long,
        inviteeId: Long,
        status: InvitationStatus
    ): Optional<ProjectInvitation>

    fun existsByProjectIdAndInviteeIdAndStatus(
        projectId: Long,
        inviteeId: Long,
        status: InvitationStatus
    ): Boolean
}
