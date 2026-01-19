package com.mira.repository

import com.mira.model.IssueLabel
import com.mira.model.IssueLabelAssignment
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface IssueLabelRepository : JpaRepository<IssueLabel, Long> {
    fun findAllByProjectId(projectId: Long): List<IssueLabel>
    fun findByProjectIdAndName(projectId: Long, name: String): IssueLabel?
}

@Repository
interface IssueLabelAssignmentRepository : JpaRepository<IssueLabelAssignment, Long> {
    fun findAllByIssueId(issueId: Long): List<IssueLabelAssignment>
    fun deleteByIssueIdAndLabelId(issueId: Long, labelId: Long)

    @Query("SELECT la.label FROM IssueLabelAssignment la WHERE la.issue.id = :issueId")
    fun findLabelsByIssueId(issueId: Long): List<IssueLabel>
}
