package com.mira.repository

import com.mira.model.Project
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface ProjectRepository : JpaRepository<Project, Long> {
    fun findByKey(key: String): Optional<Project>
    fun existsByKey(key: String): Boolean

    @Query("""
        SELECT p FROM Project p
        JOIN ProjectMember pm ON pm.project = p
        WHERE pm.user.id = :userId AND p.archived = false
    """)
    fun findAllByMemberId(userId: Long): List<Project>
}
