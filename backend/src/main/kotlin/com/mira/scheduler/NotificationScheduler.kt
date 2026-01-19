package com.mira.scheduler

import com.mira.model.IssueStatus
import com.mira.model.NotificationType
import com.mira.repository.IssueRepository
import com.mira.service.NotificationService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.LocalDate

@Component
class NotificationScheduler(
    private val issueRepository: IssueRepository,
    private val notificationService: NotificationService
) {
    private val logger = LoggerFactory.getLogger(NotificationScheduler::class.java)

    // Run every day at 9:00 AM
    @Scheduled(cron = "0 0 9 * * *")
    fun sendDueDateReminders() {
        logger.info("Running due date reminder job")

        val today = LocalDate.now()
        val tomorrow = today.plusDays(1)

        // Find issues due today
        val issuesToday = issueRepository.findAllByDueDateAndStatusNot(today, IssueStatus.DONE)
        for (issue in issuesToday) {
            issue.assignee?.let { assignee ->
                notificationService.createNotification(
                    userId = assignee.id,
                    type = NotificationType.ISSUE_DUE_TODAY,
                    title = "Issue Due Today",
                    message = "${issue.key}: ${issue.title} is due today",
                    data = """{"projectKey": "${issue.project.key}", "issueKey": "${issue.key}"}"""
                )
            }
        }
        logger.info("Sent ${issuesToday.size} due today reminders")

        // Find issues due tomorrow
        val issuesTomorrow = issueRepository.findAllByDueDateAndStatusNot(tomorrow, IssueStatus.DONE)
        for (issue in issuesTomorrow) {
            issue.assignee?.let { assignee ->
                notificationService.createNotification(
                    userId = assignee.id,
                    type = NotificationType.ISSUE_DUE_TOMORROW,
                    title = "Issue Due Tomorrow",
                    message = "${issue.key}: ${issue.title} is due tomorrow",
                    data = """{"projectKey": "${issue.project.key}", "issueKey": "${issue.key}"}"""
                )
            }
        }
        logger.info("Sent ${issuesTomorrow.size} due tomorrow reminders")

        // Find overdue issues
        val overdueIssues = issueRepository.findAllByDueDateBeforeAndStatusNot(today, IssueStatus.DONE)
        for (issue in overdueIssues) {
            issue.assignee?.let { assignee ->
                notificationService.createNotification(
                    userId = assignee.id,
                    type = NotificationType.ISSUE_OVERDUE,
                    title = "Issue Overdue",
                    message = "${issue.key}: ${issue.title} is overdue (was due ${issue.dueDate})",
                    data = """{"projectKey": "${issue.project.key}", "issueKey": "${issue.key}"}"""
                )
            }
        }
        logger.info("Sent ${overdueIssues.size} overdue reminders")
    }
}
