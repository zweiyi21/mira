package com.mira.model

import jakarta.persistence.*

@Entity
@Table(
    name = "issue_labels",
    uniqueConstraints = [UniqueConstraint(columnNames = ["project_id", "name"])]
)
data class IssueLabel(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    val project: Project,

    @Column(nullable = false)
    var name: String,

    @Column(nullable = false)
    var color: String = "#1890ff"  // Default Ant Design primary color
)

@Entity
@Table(
    name = "issue_label_assignments",
    uniqueConstraints = [UniqueConstraint(columnNames = ["issue_id", "label_id"])]
)
data class IssueLabelAssignment(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id", nullable = false)
    val issue: Issue,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "label_id", nullable = false)
    val label: IssueLabel
)
