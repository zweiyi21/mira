package com.mira.repository

import com.mira.model.Issue
import com.mira.model.IssueStatus
import com.mira.model.IssueType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.Optional

@Repository
interface IssueRepository : JpaRepository<Issue, Long> {
    fun findByKey(key: String): Optional<Issue>
    fun findAllByProjectId(projectId: Long): List<Issue>
    fun findAllByProjectIdAndSprintId(projectId: Long, sprintId: Long): List<Issue>
    fun findAllByProjectIdAndSprintIdIsNull(projectId: Long): List<Issue>  // Backlog
    fun findAllByProjectIdAndStatus(projectId: Long, status: IssueStatus): List<Issue>
    fun findAllByAssigneeId(assigneeId: Long): List<Issue>
    fun findAllByParentId(parentId: Long): List<Issue>

    @Query("SELECT MAX(i.orderIndex) FROM Issue i WHERE i.project.id = :projectId AND i.status = :status")
    fun findMaxOrderIndexByProjectIdAndStatus(projectId: Long, status: IssueStatus): Int?

    @Modifying
    @Query("UPDATE Issue i SET i.orderIndex = i.orderIndex + 1 WHERE i.project.id = :projectId AND i.status = :status AND i.orderIndex >= :fromIndex")
    fun incrementOrderIndexes(projectId: Long, status: IssueStatus, fromIndex: Int)

    // Due date queries for notifications
    fun findAllByDueDateAndStatusNot(dueDate: LocalDate, status: IssueStatus): List<Issue>
    fun findAllByDueDateBeforeAndStatusNot(dueDate: LocalDate, status: IssueStatus): List<Issue>

    // Find incomplete issues in a sprint (for sprint completion)
    fun findAllBySprintIdAndStatusNot(sprintId: Long, status: IssueStatus): List<Issue>

    @Modifying
    @Query("UPDATE Issue i SET i.sprint = null WHERE i.sprint.id = :sprintId AND i.status != :doneStatus")
    fun moveIncompleteIssuesToBacklog(sprintId: Long, doneStatus: IssueStatus)
}
