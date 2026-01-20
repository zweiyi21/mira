import { useState } from 'react'
import { Modal, Form, Input, Button, message } from 'antd'
import { UserAddOutlined } from '@ant-design/icons'
import { projectService } from '../services/projectService'
import type { Project } from '../types'

interface InviteMemberModalProps {
  project: Project
  open: boolean
  onClose: () => void
}

export default function InviteMemberModal({ project, open, onClose }: InviteMemberModalProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleInvite = async (values: { email: string }) => {
    setLoading(true)
    try {
      await projectService.inviteMember(project.key, values.email)
      message.success(`Invitation sent to ${values.email}`)
      form.resetFields()
      onClose()
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send invitation'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={
        <span>
          <UserAddOutlined style={{ marginRight: 8 }} />
          Invite Member to {project.name}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleInvite}>
        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            { required: true, message: 'Please enter email address' },
            { type: 'email', message: 'Please enter a valid email address' },
          ]}
        >
          <Input placeholder="colleague@example.com" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Send Invitation
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}
