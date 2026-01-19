package com.mira.service

import com.mira.dto.CommentDto
import com.mira.dto.CreateCommentRequest
import com.mira.dto.UpdateCommentRequest
import com.mira.dto.UserDto
import com.mira.model.Comment
import com.mira.repository.CommentRepository
import com.mira.repository.IssueRepository
import com.mira.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class CommentService(
    private val commentRepository: CommentRepository,
    private val issueRepository: IssueRepository,
    private val userRepository: UserRepository,
    private val projectService: ProjectService,
    private val webSocketService: WebSocketService
) {

    fun getComments(projectKey: String, issueKey: String, userId: Long): List<CommentDto> {
        val issue = issueRepository.findByKey(issueKey.uppercase())
            .orElseThrow { IllegalArgumentException("Issue not found") }

        projectService.checkMembership(issue.project.id, userId)

        return commentRepository.findAllByIssueIdOrderByCreatedAtAsc(issue.id)
            .map { it.toDto() }
    }

    @Transactional
    fun createComment(projectKey: String, issueKey: String, request: CreateCommentRequest, userId: Long): CommentDto {
        val issue = issueRepository.findByKey(issueKey.uppercase())
            .orElseThrow { IllegalArgumentException("Issue not found") }

        projectService.checkMembership(issue.project.id, userId)

        val author = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        val comment = Comment(
            issue = issue,
            author = author,
            content = request.content
        )

        val savedComment = commentRepository.save(comment)
        val commentDto = savedComment.toDto()

        webSocketService.notifyCommentAdded(projectKey.uppercase(), issueKey.uppercase(), commentDto)

        return commentDto
    }

    @Transactional
    fun updateComment(projectKey: String, issueKey: String, commentId: Long, request: UpdateCommentRequest, userId: Long): CommentDto {
        val comment = commentRepository.findById(commentId)
            .orElseThrow { IllegalArgumentException("Comment not found") }

        if (comment.author.id != userId) {
            throw IllegalArgumentException("You can only edit your own comments")
        }

        comment.content = request.content
        comment.updatedAt = Instant.now()

        return commentRepository.save(comment).toDto()
    }

    @Transactional
    fun deleteComment(projectKey: String, issueKey: String, commentId: Long, userId: Long) {
        val comment = commentRepository.findById(commentId)
            .orElseThrow { IllegalArgumentException("Comment not found") }

        if (comment.author.id != userId) {
            throw IllegalArgumentException("You can only delete your own comments")
        }

        commentRepository.delete(comment)
    }

    private fun Comment.toDto() = CommentDto(
        id = id,
        author = UserDto(
            id = author.id,
            email = author.email,
            name = author.name,
            avatarUrl = author.avatarUrl
        ),
        content = content,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}
