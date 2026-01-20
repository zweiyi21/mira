import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Card, message, Spin, Modal, Form, Input, Select, Space, Avatar, Tag, Empty, Collapse, Badge, Segmented, Tooltip } from 'antd'
import { PlusOutlined, AppstoreOutlined, UnorderedListOutlined, PlayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { projectService } from '../services/projectService'
import { sprintService } from '../services/sprintService'
import { issueService, type IssueFilters } from '../services/issueService'
import { userService } from '../services/userService'
import { useProjectStore } from '../stores/projectStore'
import type { Issue, IssueType, IssuePriority, Sprint, SprintSummary, IncompleteIssueAction } from '../types'
import IssueCard from '../components/IssueCard'
import IssueDetailModal from '../components/IssueDetailModal'
import FilterBar, { type FilterValues } from '../components/FilterBar'
import CompleteSprintModal from '../components/CompleteSprintModal'
import BurndownChart from '../components/BurndownChart'

const PRIORITY_OPTIONS: { value: IssuePriority; label: string }[] = [
  { value: 'HIGHEST', label: 'Highest' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
  { value: 'LOWEST', label: 'Lowest' },
]

const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21]

function BacklogPage() {
  const { projectKey } = useParams<{ projectKey: string }>()
  const navigate = useNavigate()
  const {
    currentProject,
    setCurrentProject,
    sprints,
    setSprints,
    members,
    setMembers,
  } = useProjectStore()

  const [loading, setLoading] = useState(true)
  const [backlogIssues, setBacklogIssues] = useState<Issue[]>([])
  const [sprintIssues, setSprintIssues] = useState<Record<number, Issue[]>>({})
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({})
  const [form] = Form.useForm()

  // Sprint management state
  const [completeSprintModalVisible, setCompleteSprintModalVisible] = useState(false)
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null)
  const [sprintSummary, setSprintSummary] = useState<SprintSummary | null>(null)
  const [sprintActionLoading, setSprintActionLoading] = useState(false)
  const [burndownRefreshKey, setBurndownRefreshKey] = useState(0)

  useEffect(() => {
    if (projectKey) {
      loadData()
    }
  }, [projectKey, filters])

  const loadData = async () => {
    if (!projectKey) return
    setLoading(true)
    try {
      const [project, sprintList, memberList, backlog] = await Promise.all([
        projectService.getProject(projectKey),
        sprintService.getSprints(projectKey),
        projectService.getMembers(projectKey),
        issueService.getBacklog(projectKey, filters.sortBy, filters.sortOrder),
      ])
      setCurrentProject(project)
      setSprints(sprintList)
      setMembers(memberList)
      // When sorting is applied, preserve backend order; otherwise sort by orderIndex
      setBacklogIssues(filters.sortBy ? backlog : backlog.sort((a, b) => a.orderIndex - b.orderIndex))

      // Load issues for planning/active sprints
      const planningOrActiveSprints = sprintList.filter(
        (s) => s.status === 'PLANNING' || s.status === 'ACTIVE'
      )
      const issuesBySprintId: Record<number, Issue[]> = {}
      const issueFilters: IssueFilters = {
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }
      await Promise.all(
        planningOrActiveSprints.map(async (sprint) => {
          const issues = await issueService.getIssues(projectKey, { ...issueFilters, sprintId: sprint.id })
          // When sorting is applied, preserve backend order; otherwise sort by orderIndex
          issuesBySprintId[sprint.id] = filters.sortBy ? issues : issues.sort((a, b) => a.orderIndex - b.orderIndex)
        })
      )
      setSprintIssues(issuesBySprintId)
    } catch (error) {
      message.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !projectKey) return

    const { draggableId, source, destination } = result
    const sourceId = source.droppableId
    const destId = destination.droppableId

    // Find the issue being dragged
    let issue: Issue | undefined
    if (sourceId === 'backlog') {
      issue = backlogIssues.find((i) => i.key === draggableId)
    } else {
      const sprintId = parseInt(sourceId.replace('sprint-', ''))
      issue = sprintIssues[sprintId]?.find((i) => i.key === draggableId)
    }

    if (!issue) return

    // Determine new sprint ID
    let newSprintId: number | undefined
    if (destId !== 'backlog') {
      newSprintId = parseInt(destId.replace('sprint-', ''))
    }

    // Optimistic update
    if (sourceId === destId) {
      // Reorder within same container
      if (sourceId === 'backlog') {
        const newBacklog = Array.from(backlogIssues)
        const [removed] = newBacklog.splice(source.index, 1)
        newBacklog.splice(destination.index, 0, removed)
        setBacklogIssues(newBacklog)
      } else {
        const sprintId = parseInt(sourceId.replace('sprint-', ''))
        const newSprintIssueList = Array.from(sprintIssues[sprintId] || [])
        const [removed] = newSprintIssueList.splice(source.index, 1)
        newSprintIssueList.splice(destination.index, 0, removed)
        setSprintIssues({ ...sprintIssues, [sprintId]: newSprintIssueList })
      }
    } else {
      // Move between containers
      // Remove from source
      if (sourceId === 'backlog') {
        setBacklogIssues(backlogIssues.filter((i) => i.key !== draggableId))
      } else {
        const sprintId = parseInt(sourceId.replace('sprint-', ''))
        setSprintIssues({
          ...sprintIssues,
          [sprintId]: (sprintIssues[sprintId] || []).filter((i) => i.key !== draggableId),
        })
      }

      // Add to destination
      const updatedIssue = { ...issue, sprintId: newSprintId, orderIndex: destination.index }
      if (destId === 'backlog') {
        const newBacklog = Array.from(backlogIssues)
        newBacklog.splice(destination.index, 0, updatedIssue)
        setBacklogIssues(newBacklog)
      } else {
        const sprintId = parseInt(destId.replace('sprint-', ''))
        const newSprintIssueList = Array.from(sprintIssues[sprintId] || [])
        newSprintIssueList.splice(destination.index, 0, updatedIssue)
        setSprintIssues({ ...sprintIssues, [sprintId]: newSprintIssueList })
      }
    }

    // API call
    try {
      await issueService.updateIssue(projectKey, draggableId, {
        sprintId: newSprintId || 0, // 0 means remove from sprint (backlog)
        orderIndex: destination.index,
      })
      // Refresh burndown chart if active sprint is involved
      const activeSprint = sprints.find((s) => s.status === 'ACTIVE')
      if (activeSprint && (sourceId === `sprint-${activeSprint.id}` || destId === `sprint-${activeSprint.id}`)) {
        setBurndownRefreshKey((prev) => prev + 1)
      }
    } catch (error) {
      message.error('Failed to move issue')
      loadData() // Reload to reset state
    }
  }

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue)
    setDetailModalVisible(true)
  }

  const handleIssueUpdate = (updatedIssue: Issue) => {
    // Update in backlog
    setBacklogIssues((prev) =>
      prev.map((i) => (i.key === updatedIssue.key ? updatedIssue : i))
    )
    // Update in sprint issues
    setSprintIssues((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((sprintId) => {
        updated[parseInt(sprintId)] = updated[parseInt(sprintId)].map((i) =>
          i.key === updatedIssue.key ? updatedIssue : i
        )
      })
      return updated
    })
    setSelectedIssue(updatedIssue)

    // Refresh burndown chart if issue is in active sprint
    const activeSprint = sprints.find((s) => s.status === 'ACTIVE')
    if (activeSprint && updatedIssue.sprintId === activeSprint.id) {
      setBurndownRefreshKey((prev) => prev + 1)
    }
  }

  const handleCreateIssue = async (values: {
    type: IssueType
    title: string
    description?: string
    priority?: IssuePriority
    storyPoints?: number
    assigneeId?: number
  }) => {
    if (!projectKey) return
    try {
      const newIssue = await issueService.createIssue(projectKey, values)
      setBacklogIssues([...backlogIssues, newIssue])
      setCreateModalVisible(false)
      form.resetFields()
      message.success('Issue created in backlog!')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create issue')
    }
  }

  // Sprint management handlers
  const handleStartSprint = async (sprint: Sprint, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!projectKey) return

    // Check if there's already an active sprint
    const activeSprint = sprints.find((s) => s.status === 'ACTIVE')
    if (activeSprint) {
      message.warning(`Sprint "${activeSprint.name}" is already active. Complete it first.`)
      return
    }

    setSprintActionLoading(true)
    try {
      await sprintService.startSprint(projectKey, sprint.id)
      message.success(`Sprint "${sprint.name}" started!`)
      loadData()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to start sprint')
    } finally {
      setSprintActionLoading(false)
    }
  }

  const handleOpenCompleteModal = async (sprint: Sprint, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!projectKey) return

    setSelectedSprint(sprint)
    setSprintActionLoading(true)
    try {
      const summary = await sprintService.getSprintSummary(projectKey, sprint.id)
      setSprintSummary(summary)
      setCompleteSprintModalVisible(true)
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to load sprint summary')
    } finally {
      setSprintActionLoading(false)
    }
  }

  const handleCompleteSprint = async (action: IncompleteIssueAction, targetSprintId?: number) => {
    if (!projectKey || !selectedSprint) return

    setSprintActionLoading(true)
    try {
      await sprintService.completeSprint(projectKey, selectedSprint.id, {
        incompleteIssueAction: action,
        targetSprintId,
      })
      message.success(`Sprint "${selectedSprint.name}" completed!`)
      setCompleteSprintModalVisible(false)
      setSelectedSprint(null)
      setSprintSummary(null)
      loadData()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to complete sprint')
    } finally {
      setSprintActionLoading(false)
    }
  }

  const handleCreateNextSprint = async () => {
    if (!projectKey) return

    setSprintActionLoading(true)
    try {
      const newSprint = await sprintService.createNextSprint(projectKey)
      message.success(`Sprint "${newSprint.name}" created!`)
      loadData()
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create sprint')
    } finally {
      setSprintActionLoading(false)
    }
  }

  const planningOrActiveSprints = sprints.filter(
    (s) => s.status === 'PLANNING' || s.status === 'ACTIVE'
  )

  const getSprintStoryPoints = (sprintId: number) => {
    const issues = sprintIssues[sprintId] || []
    return issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ margin: 0 }}>{currentProject?.name}</h1>
          <Segmented
            value="backlog"
            options={[
              { label: 'Board', value: 'board', icon: <AppstoreOutlined /> },
              { label: 'Backlog', value: 'backlog', icon: <UnorderedListOutlined /> },
            ]}
            onChange={(value) => {
              if (value === 'board') {
                navigate(`/projects/${projectKey}/board`)
              }
            }}
          />
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
          Create Issue
        </Button>
      </div>

      <FilterBar
        filters={filters}
        members={members}
        onFilterChange={setFilters}
        onClear={() => setFilters({})}
      />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', gap: 24 }}>
          {/* Backlog Column */}
          <div style={{ flex: 1, minWidth: 350 }}>
            <Card
              title={
                <Space>
                  <span>Backlog</span>
                  <Badge count={backlogIssues.length} style={{ backgroundColor: '#999' }} />
                </Space>
              }
              bodyStyle={{ padding: 8 }}
            >
              <Droppable droppableId="backlog">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      minHeight: 400,
                      background: snapshot.isDraggingOver ? '#e6f7ff' : 'transparent',
                      borderRadius: 4,
                      padding: 4,
                    }}
                  >
                    {backlogIssues.length === 0 ? (
                      <Empty description="No issues in backlog" />
                    ) : (
                      backlogIssues.map((issue, index) => (
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
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </Card>
          </div>

          {/* Sprint Columns */}
          <div style={{ flex: 1, minWidth: 350 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                icon={<PlusOutlined />}
                onClick={handleCreateNextSprint}
                loading={sprintActionLoading}
              >
                Create Next Sprint
              </Button>
            </div>

            {/* Burndown Chart for Active Sprint */}
            {sprints.find((s) => s.status === 'ACTIVE') && projectKey && (
              <div style={{ marginBottom: 16 }}>
                <BurndownChart
                  projectKey={projectKey}
                  sprintId={sprints.find((s) => s.status === 'ACTIVE')!.id}
                  sprintName={sprints.find((s) => s.status === 'ACTIVE')!.name}
                  refreshKey={burndownRefreshKey}
                />
              </div>
            )}

            {planningOrActiveSprints.length === 0 ? (
              <Card>
                <Empty description="No planning or active sprints" />
              </Card>
            ) : (
              <Collapse
                defaultActiveKey={planningOrActiveSprints.map((s) => s.id.toString())}
                items={planningOrActiveSprints.map((sprint) => ({
                  key: sprint.id.toString(),
                  label: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <Space>
                        <span>{sprint.name}</span>
                        <Tag color={sprint.status === 'ACTIVE' ? 'green' : 'blue'}>
                          {sprint.status}
                        </Tag>
                        <Badge
                          count={sprintIssues[sprint.id]?.length || 0}
                          style={{ backgroundColor: '#1890ff' }}
                        />
                        <span style={{ color: '#666', fontSize: 12 }}>
                          {getSprintStoryPoints(sprint.id)} pts
                        </span>
                      </Space>
                      <Space onClick={(e) => e.stopPropagation()}>
                        {sprint.status === 'PLANNING' && (
                          <Tooltip title="Start Sprint">
                            <Button
                              type="primary"
                              size="small"
                              icon={<PlayCircleOutlined />}
                              onClick={(e) => handleStartSprint(sprint, e)}
                              loading={sprintActionLoading}
                            >
                              Start
                            </Button>
                          </Tooltip>
                        )}
                        {sprint.status === 'ACTIVE' && (
                          <Tooltip title="Complete Sprint">
                            <Button
                              size="small"
                              icon={<CheckCircleOutlined />}
                              onClick={(e) => handleOpenCompleteModal(sprint, e)}
                              loading={sprintActionLoading}
                            >
                              Complete
                            </Button>
                          </Tooltip>
                        )}
                      </Space>
                    </div>
                  ),
                  children: (
                    <Droppable droppableId={`sprint-${sprint.id}`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            minHeight: 200,
                            background: snapshot.isDraggingOver ? '#e6f7ff' : 'transparent',
                            borderRadius: 4,
                            padding: 4,
                          }}
                        >
                          {(sprintIssues[sprint.id] || []).length === 0 ? (
                            <Empty description="Drag issues here" />
                          ) : (
                            (sprintIssues[sprint.id] || []).map((issue, index) => (
                              <Draggable key={issue.key} draggableId={issue.key} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <IssueCard
                                      issue={issue}
                                      onClick={() => handleIssueClick(issue)}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  ),
                }))}
              />
            )}
          </div>
        </div>
      </DragDropContext>

      {/* Create Issue Modal */}
      <Modal
        title="Create Issue"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateIssue}>
          <Form.Item name="type" label="Type" rules={[{ required: true }]} initialValue="TASK">
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
              Create in Backlog
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

      {/* Complete Sprint Modal */}
      <CompleteSprintModal
        open={completeSprintModalVisible}
        sprint={selectedSprint}
        summary={sprintSummary}
        availableSprints={sprints}
        onConfirm={handleCompleteSprint}
        onCancel={() => {
          setCompleteSprintModalVisible(false)
          setSelectedSprint(null)
          setSprintSummary(null)
        }}
        loading={sprintActionLoading}
      />
    </div>
  )
}

export default BacklogPage
