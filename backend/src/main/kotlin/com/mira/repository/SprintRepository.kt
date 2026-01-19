package com.mira.repository

import com.mira.model.Sprint
import com.mira.model.SprintStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface SprintRepository : JpaRepository<Sprint, Long> {
    fun findAllByProjectIdOrderByStartDateDesc(projectId: Long): List<Sprint>
    fun findByProjectIdAndStatus(projectId: Long, status: SprintStatus): Optional<Sprint>
    fun findAllByProjectIdAndStatus(projectId: Long, status: SprintStatus): List<Sprint>
}
