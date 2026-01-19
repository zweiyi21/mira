package com.mira.dto

import java.time.Instant

data class AttachmentDto(
    val id: Long,
    val filename: String,
    val fileSize: Long,
    val contentType: String,
    val uploader: UserDto,
    val downloadUrl: String,
    val createdAt: Instant
)
