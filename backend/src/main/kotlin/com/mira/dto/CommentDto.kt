package com.mira.dto

import jakarta.validation.constraints.NotBlank
import java.time.Instant

data class CreateCommentRequest(
    @field:NotBlank(message = "Content is required")
    val content: String
)

data class UpdateCommentRequest(
    @field:NotBlank(message = "Content is required")
    val content: String
)

data class CommentDto(
    val id: Long,
    val author: UserDto,
    val content: String,
    val createdAt: Instant,
    val updatedAt: Instant
)
