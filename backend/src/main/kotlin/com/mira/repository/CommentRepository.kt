package com.mira.repository

import com.mira.model.Comment
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface CommentRepository : JpaRepository<Comment, Long> {
    fun findAllByIssueIdOrderByCreatedAtAsc(issueId: Long): List<Comment>
}
