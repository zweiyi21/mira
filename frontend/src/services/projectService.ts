import api from './api'
import type { Project, ProjectMember, ProjectInvitation } from '../types'

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const response = await api.get<Project[]>('/projects')
    return response.data
  },

  async getProject(key: string): Promise<Project> {
    const response = await api.get<Project>(`/projects/${key}`)
    return response.data
  },

  async createProject(data: {
    name: string
    key: string
    description?: string
    defaultSprintWeeks?: number
  }): Promise<Project> {
    const response = await api.post<Project>('/projects', data)
    return response.data
  },

  async updateProject(key: string, data: {
    name?: string
    description?: string
    defaultSprintWeeks?: number
  }): Promise<Project> {
    const response = await api.put<Project>(`/projects/${key}`, data)
    return response.data
  },

  async getMembers(key: string): Promise<ProjectMember[]> {
    const response = await api.get<ProjectMember[]>(`/projects/${key}/members`)
    return response.data
  },

  async addMember(key: string, email: string, role: string = 'MEMBER'): Promise<ProjectMember> {
    const response = await api.post<ProjectMember>(`/projects/${key}/members`, { email, role })
    return response.data
  },

  async removeMember(key: string, memberId: number): Promise<void> {
    await api.delete(`/projects/${key}/members/${memberId}`)
  },

  async deleteProject(key: string): Promise<void> {
    await api.delete(`/projects/${key}`)
  },

  // Project invitation methods
  async inviteMember(key: string, email: string): Promise<ProjectInvitation> {
    const response = await api.post<ProjectInvitation>(`/projects/${key}/invitations`, { email })
    return response.data
  },

  async getMyInvitations(): Promise<ProjectInvitation[]> {
    const response = await api.get<ProjectInvitation[]>('/projects/invitations')
    return response.data
  },

  async acceptInvitation(invitationId: number): Promise<ProjectMember> {
    const response = await api.post<ProjectMember>(`/projects/invitations/${invitationId}/accept`)
    return response.data
  },

  async declineInvitation(invitationId: number): Promise<void> {
    await api.post(`/projects/invitations/${invitationId}/decline`)
  },
}
