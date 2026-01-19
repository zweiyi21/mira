package com.mira.model

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "attachments")
data class Attachment(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id", nullable = false)
    val issue: Issue,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = false)
    val uploader: User,

    @Column(nullable = false)
    val filename: String,

    @Column(nullable = false)
    val storageKey: String,  // S3 key or local path

    @Column(nullable = false)
    val fileSize: Long,

    @Column(nullable = false)
    val contentType: String,

    @Column(nullable = false)
    val createdAt: Instant = Instant.now()
)
