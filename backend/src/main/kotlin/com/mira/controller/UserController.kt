package com.mira.controller

import com.mira.dto.UserDto
import com.mira.repository.UserRepository
import com.mira.security.UserPrincipal
import com.mira.service.StorageService
import com.mira.service.toDto
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.time.Instant

@RestController
@RequestMapping("/api/users")
class UserController(
    private val userRepository: UserRepository,
    private val storageService: StorageService
) {

    @GetMapping("/me")
    fun getCurrentUser(@AuthenticationPrincipal principal: UserPrincipal): ResponseEntity<UserDto> {
        val user = userRepository.findById(principal.id)
            .orElseThrow { IllegalArgumentException("User not found") }
        return ResponseEntity.ok(user.toDto())
    }

    @PostMapping("/me/avatar", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun uploadAvatar(
        @RequestParam("file") file: MultipartFile,
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<UserDto> {
        // Validate file type
        val contentType = file.contentType ?: throw IllegalArgumentException("File type is required")
        if (!contentType.startsWith("image/")) {
            throw IllegalArgumentException("Only image files are allowed")
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw IllegalArgumentException("File size must not exceed 5MB")
        }

        val user = userRepository.findById(principal.id)
            .orElseThrow { IllegalArgumentException("User not found") }

        // Delete old avatar if exists
        user.avatarUrl?.let { oldKey ->
            try {
                storageService.delete(oldKey)
            } catch (e: Exception) {
                // Ignore deletion errors
            }
        }

        // Store new avatar
        val storageKey = storageService.storeAvatar(file, principal.id)
        user.avatarUrl = storageKey
        user.updatedAt = Instant.now()
        val savedUser = userRepository.save(user)

        return ResponseEntity.ok(savedUser.toDto())
    }

    @DeleteMapping("/me/avatar")
    fun deleteAvatar(@AuthenticationPrincipal principal: UserPrincipal): ResponseEntity<UserDto> {
        val user = userRepository.findById(principal.id)
            .orElseThrow { IllegalArgumentException("User not found") }

        user.avatarUrl?.let { key ->
            try {
                storageService.delete(key)
            } catch (e: Exception) {
                // Ignore deletion errors
            }
        }

        user.avatarUrl = null
        user.updatedAt = Instant.now()
        val savedUser = userRepository.save(user)

        return ResponseEntity.ok(savedUser.toDto())
    }

    @GetMapping("/avatar/{userId}")
    fun getAvatar(@PathVariable userId: Long): ResponseEntity<ByteArray> {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        val avatarKey = user.avatarUrl
            ?: return ResponseEntity.notFound().build()

        val bytes = storageService.getFileBytes(avatarKey)
        val extension = avatarKey.substringAfterLast('.', "jpg")
        val mediaType = when (extension.lowercase()) {
            "png" -> MediaType.IMAGE_PNG
            "gif" -> MediaType.IMAGE_GIF
            "webp" -> MediaType.parseMediaType("image/webp")
            else -> MediaType.IMAGE_JPEG
        }

        return ResponseEntity.ok()
            .contentType(mediaType)
            .body(bytes)
    }
}
