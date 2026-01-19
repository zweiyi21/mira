import { useState, useEffect } from 'react'
import { List, Upload, Button, message, Popconfirm, Space, Typography } from 'antd'
import {
  UploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileZipOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Attachment } from '../types'
import { attachmentService } from '../services/attachmentService'
import { useAuthStore } from '../stores/authStore'

const { Text } = Typography

const getFileIcon = (contentType: string) => {
  if (contentType.startsWith('image/')) return <FileImageOutlined style={{ color: '#52c41a' }} />
  if (contentType === 'application/pdf') return <FilePdfOutlined style={{ color: '#ff4d4f' }} />
  if (contentType.includes('word')) return <FileWordOutlined style={{ color: '#1890ff' }} />
  if (contentType.includes('excel') || contentType.includes('spreadsheet'))
    return <FileExcelOutlined style={{ color: '#52c41a' }} />
  if (contentType.includes('zip') || contentType.includes('rar'))
    return <FileZipOutlined style={{ color: '#faad14' }} />
  return <FileOutlined />
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface AttachmentListProps {
  projectKey: string
  issueKey: string
}

export default function AttachmentList({ projectKey, issueKey }: AttachmentListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const currentUser = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.accessToken)

  useEffect(() => {
    loadAttachments()
  }, [projectKey, issueKey])

  const loadAttachments = async () => {
    setLoading(true)
    try {
      const data = await attachmentService.getAttachments(projectKey, issueKey)
      setAttachments(data)
    } catch (error) {
      message.error('Failed to load attachments')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const attachment = await attachmentService.uploadAttachment(projectKey, issueKey, file)
      setAttachments([...attachments, attachment])
      message.success('File uploaded')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
    return false // Prevent default upload behavior
  }

  const handleDelete = async (attachmentId: number) => {
    try {
      await attachmentService.deleteAttachment(projectKey, issueKey, attachmentId)
      setAttachments(attachments.filter((a) => a.id !== attachmentId))
      message.success('Attachment deleted')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete attachment')
    }
  }

  const handleDownload = (attachment: Attachment) => {
    const url = attachmentService.getDownloadUrl(projectKey, issueKey, attachment.id)
    const link = document.createElement('a')
    link.href = url
    link.download = attachment.filename
    // Add authorization header via fetch and blob
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob)
        link.href = blobUrl
        link.click()
        window.URL.revokeObjectURL(blobUrl)
      })
      .catch(() => message.error('Failed to download file'))
  }

  return (
    <div>
      <Upload
        beforeUpload={handleUpload}
        showUploadList={false}
        disabled={uploading}
      >
        <Button icon={<UploadOutlined />} loading={uploading} style={{ marginBottom: 16 }}>
          Upload File
        </Button>
      </Upload>

      <List
        loading={loading}
        dataSource={attachments}
        locale={{ emptyText: 'No attachments' }}
        renderItem={(attachment) => (
          <List.Item
            actions={[
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(attachment)}
              />,
              currentUser?.id === attachment.uploader.id && (
                <Popconfirm
                  title="Delete this attachment?"
                  onConfirm={() => handleDelete(attachment.id)}
                >
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              ),
            ].filter(Boolean)}
          >
            <List.Item.Meta
              avatar={getFileIcon(attachment.contentType)}
              title={
                <span
                  style={{ cursor: 'pointer', color: '#1890ff' }}
                  onClick={() => handleDownload(attachment)}
                >
                  {attachment.filename}
                </span>
              }
              description={
                <Space>
                  <Text type="secondary">{formatFileSize(attachment.fileSize)}</Text>
                  <Text type="secondary">·</Text>
                  <Text type="secondary">{attachment.uploader.name}</Text>
                  <Text type="secondary">·</Text>
                  <Text type="secondary">{dayjs(attachment.createdAt).format('MMM D, YYYY')}</Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </div>
  )
}
