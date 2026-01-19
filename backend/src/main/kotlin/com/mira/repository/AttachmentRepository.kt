package com.mira.repository

import com.mira.model.Attachment
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AttachmentRepository : JpaRepository<Attachment, Long> {
    fun findAllByIssueId(issueId: Long): List<Attachment>
}
