import api from './api'
import type { Comment } from '../types'

export const commentService = {
  async getComments(projectKey: string, issueKey: string): Promise<Comment[]> {
    const response = await api.get<Comment[]>(`/projects/${projectKey}/issues/${issueKey}/comments`)
    return response.data
  },

  async createComment(projectKey: string, issueKey: string, content: string): Promise<Comment> {
    const response = await api.post<Comment>(`/projects/${projectKey}/issues/${issueKey}/comments`, { content })
    return response.data
  },

  async updateComment(projectKey: string, issueKey: string, commentId: number, content: string): Promise<Comment> {
    const response = await api.put<Comment>(`/projects/${projectKey}/issues/${issueKey}/comments/${commentId}`, { content })
    return response.data
  },

  async deleteComment(projectKey: string, issueKey: string, commentId: number): Promise<void> {
    await api.delete(`/projects/${projectKey}/issues/${issueKey}/comments/${commentId}`)
  },
}
