import api from './api'
import type { Attachment } from '../types'

export const attachmentService = {
  async getAttachments(projectKey: string, issueKey: string): Promise<Attachment[]> {
    const response = await api.get<Attachment[]>(`/projects/${projectKey}/issues/${issueKey}/attachments`)
    return response.data
  },

  async uploadAttachment(projectKey: string, issueKey: string, file: File): Promise<Attachment> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<Attachment>(
      `/projects/${projectKey}/issues/${issueKey}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  async deleteAttachment(projectKey: string, issueKey: string, attachmentId: number): Promise<void> {
    await api.delete(`/projects/${projectKey}/issues/${issueKey}/attachments/${attachmentId}`)
  },

  getDownloadUrl(projectKey: string, issueKey: string, attachmentId: number): string {
    return `/api/projects/${projectKey}/issues/${issueKey}/attachments/${attachmentId}/download`
  },
}
