package com.mira.service

import com.mira.dto.AttachmentDto
import com.mira.dto.UserDto
import com.mira.model.Attachment
import com.mira.repository.AttachmentRepository
import com.mira.repository.IssueRepository
import com.mira.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile

@Service
class AttachmentService(
    private val attachmentRepository: AttachmentRepository,
    private val issueRepository: IssueRepository,
    private val userRepository: UserRepository,
    private val storageService: StorageService,
    private val projectService: ProjectService
) {

    fun getAttachments(projectKey: String, issueKey: String, userId: Long): List<AttachmentDto> {
        val issue = issueRepository.findByKey(issueKey.uppercase())
            .orElseThrow { IllegalArgumentException("Issue not found") }

        projectService.checkMembership(issue.project.id, userId)

        return attachmentRepository.findAllByIssueId(issue.id)
            .map { it.toDto(projectKey, issueKey) }
    }

    @Transactional
    fun uploadAttachment(
        projectKey: String,
        issueKey: String,
        file: MultipartFile,
        userId: Long
    ): AttachmentDto {
        val issue = issueRepository.findByKey(issueKey.uppercase())
            .orElseThrow { IllegalArgumentException("Issue not found") }

        projectService.checkMembership(issue.project.id, userId)

        val uploader = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        val storageKey = storageService.store(file, projectKey.uppercase(), issueKey.uppercase())

        val attachment = Attachment(
            issue = issue,
            uploader = uploader,
            filename = file.originalFilename ?: "unknown",
            storageKey = storageKey,
            fileSize = file.size,
            contentType = file.contentType ?: "application/octet-stream"
        )

        return attachmentRepository.save(attachment).toDto(projectKey, issueKey)
    }

    fun downloadAttachment(projectKey: String, issueKey: String, attachmentId: Long, userId: Long): Pair<Attachment, ByteArray> {
        val issue = issueRepository.findByKey(issueKey.uppercase())
            .orElseThrow { IllegalArgumentException("Issue not found") }

        projectService.checkMembership(issue.project.id, userId)

        val attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow { IllegalArgumentException("Attachment not found") }

        if (attachment.issue.id != issue.id) {
            throw IllegalArgumentException("Attachment does not belong to this issue")
        }

        val bytes = storageService.getFileBytes(attachment.storageKey)
        return Pair(attachment, bytes)
    }

    @Transactional
    fun deleteAttachment(projectKey: String, issueKey: String, attachmentId: Long, userId: Long) {
        val issue = issueRepository.findByKey(issueKey.uppercase())
            .orElseThrow { IllegalArgumentException("Issue not found") }

        projectService.checkMembership(issue.project.id, userId)

        val attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow { IllegalArgumentException("Attachment not found") }

        if (attachment.issue.id != issue.id) {
            throw IllegalArgumentException("Attachment does not belong to this issue")
        }

        // Only uploader or admin can delete
        if (attachment.uploader.id != userId) {
            projectService.checkAdminAccess(issue.project.id, userId)
        }

        storageService.delete(attachment.storageKey)
        attachmentRepository.delete(attachment)
    }

    private fun Attachment.toDto(projectKey: String, issueKey: String) = AttachmentDto(
        id = id,
        filename = filename,
        fileSize = fileSize,
        contentType = contentType,
        uploader = UserDto(
            id = uploader.id,
            email = uploader.email,
            name = uploader.name,
            avatarUrl = uploader.avatarUrl
        ),
        downloadUrl = "/api/projects/${projectKey.uppercase()}/issues/${issueKey.uppercase()}/attachments/$id/download",
        createdAt = createdAt
    )
}
