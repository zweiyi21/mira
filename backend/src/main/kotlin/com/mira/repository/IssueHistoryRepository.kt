package com.mira.repository

import com.mira.model.IssueHistory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.Instant

@Repository
interface IssueHistoryRepository : JpaRepository<IssueHistory, Long> {
    fun findAllByIssueIdOrderByCreatedAtDesc(issueId: Long): List<IssueHistory>

    @Query("""
        SELECT h FROM IssueHistory h
        WHERE h.issue.id IN :issueIds
        AND h.fieldName = 'status'
        AND h.newValue = 'DONE'
        ORDER BY h.createdAt
    """)
    fun findStatusCompletedByIssueIds(issueIds: List<Long>): List<IssueHistory>
}
