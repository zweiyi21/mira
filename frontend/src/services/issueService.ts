import api from './api'
import type { Issue, CreateIssueRequest, UpdateIssueRequest, MoveIssueRequest, IssueStatus, IssuePriority, IssueType } from '../types'

export type SortField = 'createdAt' | 'dueDate' | 'priority' | 'storyPoints'
export type SortOrder = 'asc' | 'desc'

export interface IssueFilters {
  sprintId?: number
  search?: string
  status?: IssueStatus
  priority?: IssuePriority
  assigneeId?: number
  type?: IssueType
  sortBy?: SortField
  sortOrder?: SortOrder
}

export const issueService = {
  async getIssues(projectKey: string, filters?: IssueFilters): Promise<Issue[]> {
    const params: Record<string, any> = {}
    if (filters?.sprintId) params.sprintId = filters.sprintId
    if (filters?.search) params.search = filters.search
    if (filters?.status) params.status = filters.status
    if (filters?.priority) params.priority = filters.priority
    if (filters?.assigneeId) params.assigneeId = filters.assigneeId
    if (filters?.type) params.type = filters.type
    if (filters?.sortBy) params.sortBy = filters.sortBy
    if (filters?.sortOrder) params.sortOrder = filters.sortOrder

    const response = await api.get<Issue[]>(`/projects/${projectKey}/issues`, { params })
    return response.data
  },

  async getBacklog(projectKey: string, sortBy?: SortField, sortOrder?: SortOrder): Promise<Issue[]> {
    const params: Record<string, any> = {}
    if (sortBy) params.sortBy = sortBy
    if (sortOrder) params.sortOrder = sortOrder
    const response = await api.get<Issue[]>(`/projects/${projectKey}/issues/backlog`, { params })
    return response.data
  },

  async getIssue(projectKey: string, issueKey: string): Promise<Issue> {
    const response = await api.get<Issue>(`/projects/${projectKey}/issues/${issueKey}`)
    return response.data
  },

  async createIssue(projectKey: string, data: CreateIssueRequest): Promise<Issue> {
    const response = await api.post<Issue>(`/projects/${projectKey}/issues`, data)
    return response.data
  },

  async updateIssue(projectKey: string, issueKey: string, data: UpdateIssueRequest): Promise<Issue> {
    const response = await api.put<Issue>(`/projects/${projectKey}/issues/${issueKey}`, data)
    return response.data
  },

  async moveIssue(projectKey: string, issueKey: string, data: MoveIssueRequest): Promise<Issue> {
    const response = await api.post<Issue>(`/projects/${projectKey}/issues/${issueKey}/move`, data)
    return response.data
  },

  async deleteIssue(projectKey: string, issueKey: string): Promise<void> {
    await api.delete(`/projects/${projectKey}/issues/${issueKey}`)
  },
}
