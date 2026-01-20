import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, List, Modal, Form, Input, message, Empty } from 'antd'
import { PlusOutlined, ProjectOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons'
import { projectService } from '../services/projectService'
import { useProjectStore } from '../stores/projectStore'
import InviteMemberModal from '../components/InviteMemberModal'
import type { Project } from '../types'

function ProjectsPage() {
  const navigate = useNavigate()
  const { projects, setProjects } = useProjectStore()
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [inviteModalVisible, setInviteModalVisible] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const data = await projectService.getProjects()
      setProjects(data)
    } catch (error: any) {
      message.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (values: { name: string; key: string; description?: string }) => {
    try {
      const project = await projectService.createProject(values)
      setProjects([...projects, project])
      setModalVisible(false)
      form.resetFields()
      message.success('Project created!')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create project')
    }
  }

  const goToBoard = (project: Project) => {
    navigate(`/projects/${project.key}/board`)
  }

  const handleDeleteProject = (project: Project) => {
    Modal.confirm({
      title: 'Delete Project',
      content: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await projectService.deleteProject(project.key)
          setProjects(projects.filter(p => p.id !== project.id))
          message.success('Project deleted')
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Failed to delete project')
        }
      },
    })
  }

  const handleInviteMember = (project: Project) => {
    setSelectedProject(project)
    setInviteModalVisible(true)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1>Projects</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          Create Project
        </Button>
      </div>

      {projects.length === 0 && !loading ? (
        <Empty description="No projects yet. Create one to get started!" />
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4 }}
          loading={loading}
          dataSource={projects}
          renderItem={(project) => (
            <List.Item>
              <Card
                hoverable
                onClick={() => goToBoard(project)}
                actions={[
                  <Button type="link" onClick={(e) => { e.stopPropagation(); goToBoard(project) }}>
                    Open Board
                  </Button>,
                  <Button
                    type="link"
                    icon={<UserAddOutlined />}
                    onClick={(e) => { e.stopPropagation(); handleInviteMember(project) }}
                  >
                    Invite
                  </Button>,
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => { e.stopPropagation(); handleDeleteProject(project) }}
                  >
                    Delete
                  </Button>,
                ]}
              >
                <Card.Meta
                  avatar={<ProjectOutlined style={{ fontSize: 32, color: '#1890ff' }} />}
                  title={project.name}
                  description={
                    <>
                      <div style={{ color: '#666', marginBottom: 4 }}>{project.key}</div>
                      <div style={{ color: '#999', fontSize: 12 }}>
                        {project.description || 'No description'}
                      </div>
                    </>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      )}

      <Modal
        title="Create Project"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateProject}>
          <Form.Item
            name="name"
            label="Project Name"
            rules={[{ required: true, message: 'Please enter project name' }]}
          >
            <Input placeholder="My Project" />
          </Form.Item>

          <Form.Item
            name="key"
            label="Project Key"
            rules={[
              { required: true, message: 'Please enter project key' },
              { pattern: /^[A-Z][A-Z0-9]*$/, message: 'Must be uppercase letters/numbers, start with letter' },
              { min: 2, max: 10, message: 'Must be 2-10 characters' },
            ]}
            extra="Used in issue IDs (e.g., PROJ-123)"
          >
            <Input placeholder="PROJ" style={{ textTransform: 'uppercase' }} />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Project description (optional)" rows={3} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {selectedProject && (
        <InviteMemberModal
          project={selectedProject}
          open={inviteModalVisible}
          onClose={() => {
            setInviteModalVisible(false)
            setSelectedProject(null)
          }}
        />
      )}
    </div>
  )
}

export default ProjectsPage
