import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Select, message, Spin, Modal, Form, Input, DatePicker, Space, Avatar, Segmented, Tag, Empty } from 'antd'
import { PlusOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { projectService } from '../services/projectService'
import { sprintService } from '../services/sprintService'
import { issueService, type IssueFilters } from '../services/issueService'
import { userService } from '../services/userService'
import { useProjectStore } from '../stores/projectStore'
import type { Issue, IssueStatus, IssueType, IssuePriority } from '../types'
import IssueCard from '../components/IssueCard'
import IssueDetailModal from '../components/IssueDetailModal'
import FilterBar, { type FilterValues } from '../components/FilterBar'

const PRIORITY_OPTIONS: { value: IssuePriority; label: string }[] = [
  { value: 'HIGHEST', label: 'Highest' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
  { value: 'LOWEST', label: 'Lowest' },
]

const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21]

const STATUS_COLUMNS: { key: IssueStatus; title: string }[] = [
  { key: 'TODO', title: 'To Do' },
  { key: 'IN_PROGRESS', title: 'In Progress' },
  { key: 'IN_REVIEW', title: 'In Review' },
  { key: 'DONE', title: 'Done' },
]

function BoardPage() {
  const { projectKey } = useParams<{ projectKey: string }>()
  const navigate = useNavigate()
  const {
    currentProject,
    setCurrentProject,
    setSprints,
    currentSprint,
    setCurrentSprint,
    issues,
    setIssues,
    updateIssue,
    addIssue,
    members,
    setMembers,
  } = useProjectStore()
  const [loading, setLoading] = useState(true)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({})
  const [form] = Form.useForm()

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue)
    setDetailModalVisible(true)
  }

  const handleIssueUpdate = (updatedIssue: Issue) => {
    updateIssue(updatedIssue)
    setSelectedIssue(updatedIssue)
  }

  useEffect(() => {
    if (projectKey) {
      loadProjectData()
    }
  }, [projectKey])

  useEffect(() => {
    if (projectKey) {
      loadIssues()
    }
  }, [projectKey, currentSprint, filters])

  const loadProjectData = async () => {
    if (!projectKey) return
    setLoading(true)
    try {
      const [project, sprintList, memberList] = await Promise.all([
        projectService.getProject(projectKey),
        sprintService.getSprints(projectKey),
        projectService.getMembers(projectKey),
      ])
      setCurrentProject(project)
      setSprints(sprintList)
      setMembers(memberList)

      // Board only shows active sprint
      const activeSprint = sprintList.find((s) => s.status === 'ACTIVE')
      setCurrentSprint(activeSprint || null)
    } catch (error) {
      message.error('Failed to load project data')
    } finally {
      setLoading(false)
    }
  }

  const loadIssues = useCallback(async () => {
    if (!projectKey) return
    try {
      const issueFilters: IssueFilters = {
        ...filters,
        sprintId: currentSprint?.id,
      }
      const issueList = await issueService.getIssues(projectKey, issueFilters)
      setIssues(issueList)
    } catch (error) {
      message.error('Failed to load issues')
    }
  }, [projectKey, currentSprint, filters, setIssues])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !projectKey) return

    const { draggableId, destination } = result
    const newStatus = destination.droppableId as IssueStatus
    const issue = issues.find((i) => i.key === draggableId)

    if (!issue) return

    // Optimistic update
    const updatedIssue = { ...issue, status: newStatus, orderIndex: destination.index }
    updateIssue(updatedIssue)

    try {
      await issueService.moveIssue(projectKey, draggableId, {
        status: newStatus,
        orderIndex: destination.index,
      })
    } catch (error) {
      // Revert on error
      updateIssue(issue)
      message.error('Failed to move issue')
    }
  }

  const handleCreateIssue = async (values: {
    type: IssueType
    title: string
    description?: string
    priority?: IssuePriority
    storyPoints?: number
    assigneeId?: number
    dueDate?: any
  }) => {
    if (!projectKey) return
    try {
      const newIssue = await issueService.createIssue(projectKey, {
        ...values,
        sprintId: currentSprint?.id,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined,
      })
      addIssue(newIssue)
      setCreateModalVisible(false)
      form.resetFields()
      message.success('Issue created!')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create issue')
    }
  }

  const getIssuesByStatus = (status: IssueStatus): Issue[] => {
    const filtered = issues.filter((i) => i.status === status)
    // When sorting is applied from backend, preserve that order
    if (filters.sortBy) {
      return filtered
    }
    // Default: sort by orderIndex for drag-and-drop ordering
    return filtered.sort((a, b) => a.orderIndex - b.orderIndex)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <h1 style={{ margin: 0 }}>{currentProject?.name}</h1>
            <Segmented
              value="board"
              options={[
                { label: 'Board', value: 'board', icon: <AppstoreOutlined /> },
                { label: 'Backlog', value: 'backlog', icon: <UnorderedListOutlined /> },
              ]}
              onChange={(value) => {
                if (value === 'backlog') {
                  navigate(`/projects/${projectKey}/backlog`)
                }
              }}
            />
          </div>
          {currentSprint ? (
            <Space>
              <Tag color="green">{currentSprint.name}</Tag>
              <span style={{ color: '#666', fontSize: 12 }}>
                {currentSprint.startDate} - {currentSprint.endDate}
              </span>
            </Space>
          ) : (
            <Tag color="orange">No Active Sprint</Tag>
          )}
        </div>
        {currentSprint && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            Create Issue
          </Button>
        )}
      </div>

      {!currentSprint ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Empty
            description="No active sprint. Go to Backlog to start a sprint."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate(`/projects/${projectKey}/backlog`)}>
              Go to Backlog
            </Button>
          </Empty>
        </div>
      ) : (
        <>
          <FilterBar
            filters={filters}
            members={members}
            onFilterChange={setFilters}
            onClear={() => setFilters({})}
          />

          <DragDropContext onDragEnd={handleDragEnd}>
        <div style={{
          display: 'flex',
          gap: 16,
          flex: 1,
          minHeight: 0,
        }}>
          {STATUS_COLUMNS.map((column) => (
            <div
              key={column.key}
              style={{
                flex: 1,
                minWidth: 200,
                background: '#f4f5f7',
                borderRadius: 8,
                padding: 8,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: 8,
                  padding: '8px 4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{column.title}</span>
                <span style={{ color: '#666' }}>{getIssuesByStatus(column.key).length}</span>
              </div>
              <Droppable droppableId={column.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      background: snapshot.isDraggingOver ? '#e6f7ff' : 'transparent',
                      borderRadius: 4,
                      transition: 'background 0.2s',
                      paddingBottom: 8,
                    }}
                  >
                    {getIssuesByStatus(column.key).map((issue, index) => (
                      <Draggable key={issue.key} draggableId={issue.key} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <IssueCard issue={issue} onClick={() => handleIssueClick(issue)} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
        </>
      )}

      <Modal
        title="Create Issue"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateIssue}>
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true }]}
            initialValue="TASK"
          >
            <Select>
              <Select.Option value="EPIC">Epic</Select.Option>
              <Select.Option value="STORY">Story</Select.Option>
              <Select.Option value="TASK">Task</Select.Option>
              <Select.Option value="BUG">Bug</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input placeholder="Issue title" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Description (optional)" />
          </Form.Item>

          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="priority" label="Priority" style={{ width: 180 }}>
              <Select placeholder="Select priority" allowClear>
                {PRIORITY_OPTIONS.map((p) => (
                  <Select.Option key={p.value} value={p.value}>
                    {p.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="storyPoints" label="Story Points" style={{ width: 120 }}>
              <Select placeholder="Points" allowClear>
                {STORY_POINTS.map((sp) => (
                  <Select.Option key={sp} value={sp}>
                    {sp}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="dueDate" label="Due Date" style={{ width: 150 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item name="assigneeId" label="Assignee">
            <Select placeholder="Select assignee" allowClear>
              {members.map((m) => (
                <Select.Option key={m.user.id} value={m.user.id}>
                  <Space>
                    <Avatar size="small" src={m.user.avatarUrl ? userService.getAvatarUrl(m.user.id) : undefined}>
                      {m.user.name[0]}
                    </Avatar>
                    {m.user.name}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Issue Detail Modal */}
      <IssueDetailModal
        issue={selectedIssue}
        projectKey={projectKey || ''}
        open={detailModalVisible}
        onClose={() => {
          setDetailModalVisible(false)
          setSelectedIssue(null)
        }}
        onUpdate={handleIssueUpdate}
      />
    </div>
  )
}

export default BoardPage
