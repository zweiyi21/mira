export interface User {
  id: number
  email: string
  name: string
  avatarUrl?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface Project {
  id: number
  name: string
  key: string
  description?: string
  owner: User
  defaultSprintWeeks: number
  archived: boolean
  createdAt: string
  updatedAt: string
}

export interface ProjectMember {
  user: User
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  joinedAt: string
}

export interface Sprint {
  id: number
  name: string
  goal?: string
  startDate: string
  endDate: string
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED'
  createdAt: string
  updatedAt: string
}

export type IssueType = 'EPIC' | 'STORY' | 'TASK' | 'BUG'
export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
export type IssuePriority = 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW' | 'LOWEST'

export interface Label {
  id: number
  name: string
  color: string
}

export interface Issue {
  id: number
  key: string
  type: IssueType
  title: string
  description?: string
  status: IssueStatus
  priority: IssuePriority
  storyPoints?: number
  creator: User
  assignee?: User
  parentKey?: string
  sprintId?: number
  dueDate?: string
  orderIndex: number
  labels: Label[]
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: number
  author: User
  content: string
  createdAt: string
  updatedAt: string
}

export interface Attachment {
  id: number
  filename: string
  fileSize: number
  contentType: string
  uploader: User
  downloadUrl: string
  createdAt: string
}

export interface CreateIssueRequest {
  type: IssueType
  title: string
  description?: string
  priority?: IssuePriority
  storyPoints?: number
  assigneeId?: number
  parentKey?: string
  sprintId?: number
  dueDate?: string
  labelIds?: number[]
}

export interface UpdateIssueRequest {
  title?: string
  description?: string
  status?: IssueStatus
  priority?: IssuePriority
  storyPoints?: number
  assigneeId?: number
  sprintId?: number
  dueDate?: string
  orderIndex?: number
  labelIds?: number[]
}

export interface MoveIssueRequest {
  status: IssueStatus
  orderIndex: number
}

// Team types
export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export interface Team {
  id: number
  name: string
  description?: string
  owner: User
  memberCount: number
  createdAt: string
  updatedAt: string
}

export interface TeamMember {
  user: User
  role: TeamRole
  joinedAt: string
}

export interface TeamInvitation {
  id: number
  team: { id: number; name: string }
  inviter: User
  invitee: User
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
  createdAt: string
}

// Notification types
export type NotificationType =
  | 'TEAM_INVITATION'
  | 'ISSUE_ASSIGNED'
  | 'ISSUE_DUE_TODAY'
  | 'ISSUE_DUE_TOMORROW'
  | 'ISSUE_OVERDUE'
  | 'ISSUE_COMMENTED'
  | 'SPRINT_STARTED'
  | 'SPRINT_ENDING_SOON'
  | 'SPRINT_COMPLETED'

export interface Notification {
  id: number
  type: NotificationType
  title: string
  message: string
  data?: string
  isRead: boolean
  createdAt: string
}

export interface NotificationList {
  notifications: Notification[]
  unreadCount: number
}

// Sprint summary for completion
export interface SprintSummary {
  sprint: Sprint
  totalIssues: number
  completedIssues: number
  incompleteIssues: number
}

export type IncompleteIssueAction = 'MOVE_TO_BACKLOG' | 'MOVE_TO_SPRINT'

export interface CompleteSprintRequest {
  incompleteIssueAction: IncompleteIssueAction
  targetSprintId?: number
}
