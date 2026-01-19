import api from './api'
import type { Project, ProjectMember } from '../types'

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
}
