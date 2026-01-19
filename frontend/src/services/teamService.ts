import api from './api'
import type { Team, TeamMember, TeamInvitation, TeamRole } from '../types'

export const teamService = {
  async getTeams(): Promise<Team[]> {
    const response = await api.get<Team[]>('/teams')
    return response.data
  },

  async getTeam(teamId: number): Promise<Team> {
    const response = await api.get<Team>(`/teams/${teamId}`)
    return response.data
  },

  async createTeam(data: { name: string; description?: string }): Promise<Team> {
    const response = await api.post<Team>('/teams', data)
    return response.data
  },

  async updateTeam(teamId: number, data: { name?: string; description?: string }): Promise<Team> {
    const response = await api.put<Team>(`/teams/${teamId}`, data)
    return response.data
  },

  async deleteTeam(teamId: number): Promise<void> {
    await api.delete(`/teams/${teamId}`)
  },

  async getMembers(teamId: number): Promise<TeamMember[]> {
    const response = await api.get<TeamMember[]>(`/teams/${teamId}/members`)
    return response.data
  },

  async inviteToTeam(teamId: number, email: string): Promise<TeamInvitation> {
    const response = await api.post<TeamInvitation>(`/teams/${teamId}/invitations`, { email })
    return response.data
  },

  async updateMemberRole(teamId: number, memberId: number, role: TeamRole): Promise<TeamMember> {
    const response = await api.put<TeamMember>(`/teams/${teamId}/members/${memberId}/role`, { role })
    return response.data
  },

  async removeMember(teamId: number, memberId: number): Promise<void> {
    await api.delete(`/teams/${teamId}/members/${memberId}`)
  },

  async leaveTeam(teamId: number): Promise<void> {
    await api.post(`/teams/${teamId}/leave`)
  },

  async getPendingInvitations(): Promise<TeamInvitation[]> {
    const response = await api.get<TeamInvitation[]>('/teams/invitations')
    return response.data
  },

  async acceptInvitation(invitationId: number): Promise<TeamMember> {
    const response = await api.post<TeamMember>(`/teams/invitations/${invitationId}/accept`)
    return response.data
  },

  async declineInvitation(invitationId: number): Promise<void> {
    await api.post(`/teams/invitations/${invitationId}/decline`)
  },
}
