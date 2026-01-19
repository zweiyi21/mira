package com.mira.repository

import com.mira.model.ProjectMember
import com.mira.model.ProjectRole
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface ProjectMemberRepository : JpaRepository<ProjectMember, Long> {
    fun findByProjectIdAndUserId(projectId: Long, userId: Long): Optional<ProjectMember>
    fun findAllByProjectId(projectId: Long): List<ProjectMember>
    fun findAllByUserId(userId: Long): List<ProjectMember>
    fun existsByProjectIdAndUserId(projectId: Long, userId: Long): Boolean
    fun deleteByProjectIdAndUserId(projectId: Long, userId: Long)

    fun findByProjectIdAndUserIdAndRoleIn(
        projectId: Long,
        userId: Long,
        roles: List<ProjectRole>
    ): Optional<ProjectMember>
}
