package com.mira.service

import com.mira.dto.CommentDto
import com.mira.dto.IssueDto
import com.mira.dto.NotificationDto
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service

@Service
class WebSocketService(
    private val messagingTemplate: SimpMessagingTemplate
) {

    fun sendNotification(userId: Long, notification: NotificationDto) {
        messagingTemplate.convertAndSend(
            "/topic/user/$userId/notifications",
            WebSocketMessage("NOTIFICATION", notification)
        )
    }

    fun notifyIssueCreated(projectKey: String, issue: IssueDto) {
        messagingTemplate.convertAndSend(
            "/topic/project/${projectKey.uppercase()}",
            WebSocketMessage("ISSUE_CREATED", issue)
        )
    }

    fun notifyIssueUpdated(projectKey: String, issue: IssueDto) {
        messagingTemplate.convertAndSend(
            "/topic/project/${projectKey.uppercase()}",
            WebSocketMessage("ISSUE_UPDATED", issue)
        )
    }

    fun notifyIssueDeleted(projectKey: String, issueKey: String) {
        messagingTemplate.convertAndSend(
            "/topic/project/${projectKey.uppercase()}",
            WebSocketMessage("ISSUE_DELETED", mapOf("key" to issueKey))
        )
    }

    fun notifyCommentAdded(projectKey: String, issueKey: String, comment: CommentDto) {
        messagingTemplate.convertAndSend(
            "/topic/project/${projectKey.uppercase()}",
            WebSocketMessage("COMMENT_ADDED", mapOf("issueKey" to issueKey, "comment" to comment))
        )
    }
}

data class WebSocketMessage(
    val type: String,
    val payload: Any
)
