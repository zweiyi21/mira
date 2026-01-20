import api from './api'
import type { Sprint, SprintSummary, CompleteSprintRequest, BurndownChartData } from '../types'

export const sprintService = {
  async getSprints(projectKey: string): Promise<Sprint[]> {
    const response = await api.get<Sprint[]>(`/projects/${projectKey}/sprints`)
    return response.data
  },

  async createSprint(projectKey: string, data: {
    name: string
    goal?: string
    startDate: string
    endDate: string
  }): Promise<Sprint> {
    const response = await api.post<Sprint>(`/projects/${projectKey}/sprints`, data)
    return response.data
  },

  async updateSprint(projectKey: string, sprintId: number, data: {
    name?: string
    goal?: string
    startDate?: string
    endDate?: string
  }): Promise<Sprint> {
    const response = await api.put<Sprint>(`/projects/${projectKey}/sprints/${sprintId}`, data)
    return response.data
  },

  async startSprint(projectKey: string, sprintId: number): Promise<Sprint> {
    const response = await api.post<Sprint>(`/projects/${projectKey}/sprints/${sprintId}/start`)
    return response.data
  },

  async completeSprint(projectKey: string, sprintId: number, request?: CompleteSprintRequest): Promise<SprintSummary> {
    const response = await api.post<SprintSummary>(`/projects/${projectKey}/sprints/${sprintId}/complete`, request)
    return response.data
  },

  async getSprintSummary(projectKey: string, sprintId: number): Promise<SprintSummary> {
    const response = await api.get<SprintSummary>(`/projects/${projectKey}/sprints/${sprintId}/summary`)
    return response.data
  },

  async createNextSprint(projectKey: string): Promise<Sprint> {
    const response = await api.post<Sprint>(`/projects/${projectKey}/sprints/next`)
    return response.data
  },

  async getBurndownData(projectKey: string, sprintId: number): Promise<BurndownChartData> {
    const response = await api.get<BurndownChartData>(`/projects/${projectKey}/sprints/${sprintId}/burndown`)
    return response.data
  },
}
