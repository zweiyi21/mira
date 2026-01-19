package com.mira.controller

import com.mira.dto.AttachmentDto
import com.mira.security.UserPrincipal
import com.mira.service.AttachmentService
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/projects/{projectKey}/issues/{issueKey}/attachments")
class AttachmentController(
    private val attachmentService: AttachmentService
) {

    @GetMapping
    fun getAttachments(
        @PathVariable projectKey: String,
        @PathVariable issueKey: String,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<List<AttachmentDto>> {
        return ResponseEntity.ok(attachmentService.getAttachments(projectKey, issueKey, principal.id))
    }

    @PostMapping
    fun uploadAttachment(
        @PathVariable projectKey: String,
        @PathVariable issueKey: String,
        @RequestParam("file") file: MultipartFile,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<AttachmentDto> {
        return ResponseEntity.ok(attachmentService.uploadAttachment(projectKey, issueKey, file, principal.id))
    }

    @GetMapping("/{attachmentId}/download")
    fun downloadAttachment(
        @PathVariable projectKey: String,
        @PathVariable issueKey: String,
        @PathVariable attachmentId: Long,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ByteArray> {
        val (attachment, bytes) = attachmentService.downloadAttachment(projectKey, issueKey, attachmentId, principal.id)

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(attachment.contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"${attachment.filename}\"")
            .body(bytes)
    }

    @DeleteMapping("/{attachmentId}")
    fun deleteAttachment(
        @PathVariable projectKey: String,
        @PathVariable issueKey: String,
        @PathVariable attachmentId: Long,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<Void> {
        attachmentService.deleteAttachment(projectKey, issueKey, attachmentId, principal.id)
        return ResponseEntity.noContent().build()
    }
}
