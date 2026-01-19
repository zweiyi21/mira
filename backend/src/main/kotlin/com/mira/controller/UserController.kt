package com.mira.controller

import com.mira.dto.UserDto
import com.mira.repository.UserRepository
import com.mira.security.UserPrincipal
import com.mira.service.toDto
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/users")
class UserController(
    private val userRepository: UserRepository
) {

    @GetMapping("/me")
    fun getCurrentUser(@AuthenticationPrincipal principal: UserPrincipal): ResponseEntity<UserDto> {
        val user = userRepository.findById(principal.id)
            .orElseThrow { IllegalArgumentException("User not found") }
        return ResponseEntity.ok(user.toDto())
    }
}
