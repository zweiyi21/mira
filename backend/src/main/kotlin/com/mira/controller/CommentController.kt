package com.mira.controller

import com.mira.dto.CommentDto
import com.mira.dto.CreateCommentRequest
import com.mira.dto.UpdateCommentRequest
import com.mira.security.UserPrincipal
import com.mira.service.CommentService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/projects/{projectKey}/issues/{issueKey}/comments")
class CommentController(
    private val commentService: CommentService
) {

    @GetMapping
    fun getComments(
        @PathVariable projectKey: String,
        @PathVariable issueKey: String,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<List<CommentDto>> {
        return ResponseEntity.ok(commentService.getComments(projectKey, issueKey, principal.id))
    }

    @PostMapping
    fun createComment(
        @PathVariable projectKey: String,
        @PathVariable issueKey: String,
        @Valid @RequestBody request: CreateCommentRequest,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<CommentDto> {
        return ResponseEntity.ok(commentService.createComment(projectKey, issueKey, request, principal.id))
    }

    @PutMapping("/{commentId}")
    fun updateComment(
        @PathVariable projectKey: String,
        @PathVariable issueKey: String,
        @PathVariable commentId: Long,
        @Valid @RequestBody request: UpdateCommentRequest,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<CommentDto> {
        return ResponseEntity.ok(commentService.updateComment(projectKey, issueKey, commentId, request, principal.id))
    }

    @DeleteMapping("/{commentId}")
    fun deleteComment(
        @PathVariable projectKey: String,
        @PathVariable issueKey: String,
        @PathVariable commentId: Long,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<Void> {
        commentService.deleteComment(projectKey, issueKey, commentId, principal.id)
        return ResponseEntity.noContent().build()
    }
}
