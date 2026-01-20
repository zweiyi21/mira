import { useState } from 'react'
import { Modal, Upload, Avatar, Button, message, Space } from 'antd'
import { UserOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import { userService } from '../services/userService'
import { useAuthStore } from '../stores/authStore'

interface AvatarUploadModalProps {
  open: boolean
  onClose: () => void
}

export default function AvatarUploadModal({ open, onClose }: AvatarUploadModalProps) {
  const { user, updateUser } = useAuthStore()
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleUpload = async () => {
    if (fileList.length === 0) return

    const file = fileList[0].originFileObj
    if (!file) return

    setUploading(true)
    try {
      const updatedUser = await userService.uploadAvatar(file)
      updateUser(updatedUser)
      message.success('Avatar uploaded successfully')
      setFileList([])
      setPreviewUrl(null)
      onClose()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const updatedUser = await userService.deleteAvatar()
      updateUser(updatedUser)
      message.success('Avatar removed')
      onClose()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to remove avatar')
    } finally {
      setDeleting(false)
    }
  }

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error('Only image files are allowed')
        return false
      }
      const isLt5M = file.size / 1024 / 1024 < 5
      if (!isLt5M) {
        message.error('Image must be smaller than 5MB')
        return false
      }

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      setFileList([{ uid: '-1', name: file.name, originFileObj: file } as UploadFile])
      return false
    },
    fileList,
    maxCount: 1,
    showUploadList: false,
    accept: 'image/*',
  }

  const currentAvatarUrl = user?.avatarUrl
    ? userService.getAvatarUrl(user.id)
    : null

  return (
    <Modal
      title="Profile Picture"
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Avatar
          size={120}
          icon={<UserOutlined />}
          src={previewUrl || currentAvatarUrl}
          style={{ marginBottom: 24 }}
        />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />} style={{ width: '100%' }}>
              Select Image
            </Button>
          </Upload>

          {(previewUrl || fileList.length > 0) && (
            <Button
              type="primary"
              loading={uploading}
              onClick={handleUpload}
              style={{ width: '100%' }}
            >
              Upload
            </Button>
          )}

          {currentAvatarUrl && !previewUrl && (
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={deleting}
              onClick={handleDelete}
              style={{ width: '100%' }}
            >
              Remove Avatar
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  )
}
