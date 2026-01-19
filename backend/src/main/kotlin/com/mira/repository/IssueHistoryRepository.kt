package com.mira.repository

import com.mira.model.IssueHistory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface IssueHistoryRepository : JpaRepository<IssueHistory, Long> {
    fun findAllByIssueIdOrderByCreatedAtDesc(issueId: Long): List<IssueHistory>
}
