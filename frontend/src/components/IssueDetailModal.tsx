import { useState, useEffect } from 'react'
import {
  Modal,
  Typography,
  Input,
  Select,
  DatePicker,
  Avatar,
  Tag,
  Tabs,
  Divider,
  Space,
  message,
  Spin,
  Button,
  Popconfirm,
} from 'antd'
import {
  UserOutlined,
  CalendarOutlined,
  TagOutlined,
  ThunderboltOutlined,
  BookOutlined,
  CheckSquareOutlined,
  BugOutlined,
  CloseOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Issue, IssueType, IssuePriority, IssueStatus } from '../types'
import { issueService } from '../services/issueService'
import { userService } from '../services/userService'
import { useProjectStore } from '../stores/projectStore'
import CommentList from './CommentList'
import AttachmentList from './AttachmentList'
import SubtaskList from './SubtaskList'

const { TextArea } = Input
const { Text, Title } = Typography

const TYPE_CONFIG: Record<IssueType, { icon: React.ReactNode; color: string; label: string }> = {
  EPIC: { icon: <ThunderboltOutlined />, color: '#6554c0', label: 'Epic' },
  STORY: { icon: <BookOutlined />, color: '#36b37e', label: 'Story' },
  TASK: { icon: <CheckSquareOutlined />, color: '#1890ff', label: 'Task' },
  BUG: { icon: <BugOutlined />, color: '#ff5630', label: 'Bug' },
}

const PRIORITY_OPTIONS: { value: IssuePriority; label: string; color: string }[] = [
  { value: 'HIGHEST', label: 'Highest', color: '#ff5630' },
  { value: 'HIGH', label: 'High', color: '#ff7452' },
  { value: 'MEDIUM', label: 'Medium', color: '#ffab00' },
  { value: 'LOW', label: 'Low', color: '#0065ff' },
  { value: 'LOWEST', label: 'Lowest', color: '#2684ff' },
]

const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' },
]

const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21]

interface IssueDetailModalProps {
  issue: Issue | null
  projectKey: string
  open: boolean
  onClose: () => void
  onUpdate: (issue: Issue) => void
  onSubtaskCreated?: (issue: Issue) => void
  onDelete?: (issueKey: string) => void
}

export default function IssueDetailModal({
  issue,
  projectKey,
  open,
  onClose,
  onUpdate,
  onSubtaskCreated,
  onDelete,
}: IssueDetailModalProps) {
  const { members, addIssue, issues } = useProjectStore()
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(issue)
  const [navigationStack, setNavigationStack] = useState<Issue[]>([])
  const [loading, setLoading] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (issue) {
      setCurrentIssue(issue)
      setNavigationStack([])
      setTitle(issue.title)
      setDescription(issue.description || '')
      setEditingTitle(false)
      setEditingDescription(false)
    }
  }, [issue])

  useEffect(() => {
    if (currentIssue) {
      setTitle(currentIssue.title)
      setDescription(currentIssue.description || '')
      setEditingTitle(false)
      setEditingDescription(false)
    }
  }, [currentIssue?.key])

  if (!issue || !currentIssue) return null

  const handleUpdateField = async (field: string, value: any) => {
    setLoading(true)
    try {
      const updated = await issueService.updateIssue(projectKey, currentIssue.key, {
        [field]: value,
      })
      setCurrentIssue(updated)
      onUpdate(updated)
      message.success('Updated successfully')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTitle = async () => {
    if (title !== currentIssue.title) {
      await handleUpdateField('title', title)
    }
    setEditingTitle(false)
  }

  const handleSaveDescription = async () => {
    if (description !== (currentIssue.description || '')) {
      await handleUpdateField('description', description)
    }
    setEditingDescription(false)
  }

  const typeConfig = TYPE_CONFIG[currentIssue.type]

  const handleSubtaskCreated = (newIssue: Issue) => {
    addIssue(newIssue)
    onSubtaskCreated?.(newIssue)
  }

  const handleSubtaskClick = (subtask: Issue) => {
    setNavigationStack([...navigationStack, currentIssue])
    setCurrentIssue(subtask)
  }

  const handleBack = () => {
    if (navigationStack.length > 0) {
      const newStack = [...navigationStack]
      const parent = newStack.pop()!
      setNavigationStack(newStack)
      // Get the latest version of parent from store if available
      const latestParent = issues.find(i => i.key === parent.key) || parent
      setCurrentIssue(latestParent)
    }
  }

  const handleDeleteCurrentIssue = () => {
    if (onDelete) {
      onDelete(currentIssue.key)
      // If we're viewing a subtask, go back to parent after delete
      if (navigationStack.length > 0) {
        handleBack()
      }
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 32 }}>
          <Space>
            {navigationStack.length > 0 && (
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                size="small"
                style={{ marginRight: 4 }}
              />
            )}
            <span style={{ color: typeConfig.color }}>{typeConfig.icon}</span>
            <Text type="secondary">{currentIssue.key}</Text>
            {navigationStack.length > 0 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                (from {navigationStack[navigationStack.length - 1].key})
              </Text>
            )}
          </Space>
          {onDelete && (
            <Popconfirm
              title="Delete this issue?"
              description="This action cannot be undone."
              onConfirm={handleDeleteCurrentIssue}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          )}
        </div>
      }
      closeIcon={<CloseOutlined />}
    >
      <Spin spinning={loading}>
        <div style={{ display: 'flex', gap: 24 }}>
          {/* Left side - Main content */}
          <div style={{ flex: 1 }}>
            {/* Title */}
            {editingTitle ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onPressEnter={handleSaveTitle}
                autoFocus
                style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}
              />
            ) : (
              <Title
                level={4}
                style={{ marginBottom: 16, cursor: 'pointer' }}
                onClick={() => setEditingTitle(true)}
              >
                {currentIssue.title}
              </Title>
            )}

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Description
              </Text>
              {editingDescription ? (
                <TextArea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleSaveDescription}
                  autoSize={{ minRows: 3, maxRows: 10 }}
                  autoFocus
                />
              ) : (
                <div
                  style={{
                    padding: 12,
                    background: '#f5f5f5',
                    borderRadius: 4,
                    minHeight: 60,
                    cursor: 'pointer',
                  }}
                  onClick={() => setEditingDescription(true)}
                >
                  {currentIssue.description || (
                    <Text type="secondary">Click to add description...</Text>
                  )}
                </div>
              )}
            </div>

            {/* Subtasks */}
            <div style={{ marginBottom: 24 }}>
              <SubtaskList
                parentIssue={currentIssue}
                projectKey={projectKey}
                onSubtaskCreated={handleSubtaskCreated}
                onSubtaskClick={handleSubtaskClick}
              />
            </div>

            {/* Tabs for Comments, Attachments, History */}
            <Tabs
              items={[
                {
                  key: 'comments',
                  label: 'Comments',
                  children: (
                    <div style={{ padding: '16px 0' }}>
                      <CommentList projectKey={projectKey} issueKey={currentIssue.key} />
                    </div>
                  ),
                },
                {
                  key: 'attachments',
                  label: 'Attachments',
                  children: (
                    <div style={{ padding: '16px 0' }}>
                      <AttachmentList projectKey={projectKey} issueKey={currentIssue.key} />
                    </div>
                  ),
                },
                {
                  key: 'history',
                  label: 'Activity',
                  children: (
                    <div style={{ padding: '16px 0' }}>
                      <Text type="secondary">Activity history coming soon...</Text>
                    </div>
                  ),
                },
              ]}
            />
          </div>

          {/* Right side - Details */}
          <div style={{ width: 250, borderLeft: '1px solid #f0f0f0', paddingLeft: 24 }}>
            {/* Status */}
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                Status
              </Text>
              <Select
                value={currentIssue.status}
                onChange={(value) => handleUpdateField('status', value)}
                style={{ width: '100%' }}
                options={STATUS_OPTIONS}
              />
            </div>

            {/* Assignee */}
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                <UserOutlined /> Assignee
              </Text>
              <Select
                value={currentIssue.assignee?.id}
                onChange={(value) => handleUpdateField('assigneeId', value || 0)}
                style={{ width: '100%' }}
                allowClear
                placeholder="Unassigned"
              >
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
            </div>

            {/* Priority */}
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                Priority
              </Text>
              <Select
                value={currentIssue.priority}
                onChange={(value) => handleUpdateField('priority', value)}
                style={{ width: '100%' }}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <Select.Option key={p.value} value={p.value}>
                    <Space>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: p.color,
                        }}
                      />
                      {p.label}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </div>

            {/* Story Points */}
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                Story Points
              </Text>
              <Select
                value={currentIssue.storyPoints}
                onChange={(value) => handleUpdateField('storyPoints', value)}
                style={{ width: '100%' }}
                allowClear
                placeholder="None"
              >
                {STORY_POINTS.map((sp) => (
                  <Select.Option key={sp} value={sp}>
                    {sp}
                  </Select.Option>
                ))}
              </Select>
            </div>

            {/* Due Date */}
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                <CalendarOutlined /> Due Date
              </Text>
              <DatePicker
                value={currentIssue.dueDate ? dayjs(currentIssue.dueDate) : null}
                onChange={(date) =>
                  handleUpdateField('dueDate', date ? date.format('YYYY-MM-DD') : null)
                }
                style={{ width: '100%' }}
              />
            </div>

            {/* Labels */}
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                <TagOutlined /> Labels
              </Text>
              <div>
                {currentIssue.labels.length > 0 ? (
                  currentIssue.labels.map((label) => (
                    <Tag key={label.id} color={label.color}>
                      {label.name}
                    </Tag>
                  ))
                ) : (
                  <Text type="secondary">None</Text>
                )}
              </div>
            </div>

            <Divider />

            {/* Meta info */}
            <div style={{ fontSize: 12, color: '#999' }}>
              <div style={{ marginBottom: 4 }}>
                Created by {currentIssue.creator.name}
              </div>
              <div style={{ marginBottom: 4 }}>
                Created: {dayjs(currentIssue.createdAt).format('MMM D, YYYY')}
              </div>
              <div>
                Updated: {dayjs(currentIssue.updatedAt).format('MMM D, YYYY HH:mm')}
              </div>
            </div>
          </div>
        </div>
      </Spin>
    </Modal>
  )
}
