package com.mira.dto

import com.mira.model.ProjectRole
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.Instant

data class CreateProjectRequest(
    @field:NotBlank(message = "Name is required")
    val name: String,

    @field:NotBlank(message = "Key is required")
    @field:Size(min = 2, max = 10, message = "Key must be 2-10 characters")
    @field:Pattern(regexp = "^[A-Z][A-Z0-9]*$", message = "Key must start with a letter and contain only uppercase letters and numbers")
    val key: String,

    val description: String? = null,

    val defaultSprintWeeks: Int = 2
)

data class UpdateProjectRequest(
    val name: String? = null,
    val description: String? = null,
    val defaultSprintWeeks: Int? = null
)

data class ProjectDto(
    val id: Long,
    val name: String,
    val key: String,
    val description: String?,
    val owner: UserDto,
    val defaultSprintWeeks: Int,
    val archived: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
)

data class ProjectMemberDto(
    val user: UserDto,
    val role: ProjectRole,
    val joinedAt: Instant
)

data class AddMemberRequest(
    @field:NotBlank(message = "Email is required")
    val email: String,

    val role: ProjectRole = ProjectRole.MEMBER
)

data class UpdateMemberRoleRequest(
    val role: ProjectRole
)
