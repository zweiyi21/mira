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
}

export default function IssueDetailModal({
  issue,
  projectKey,
  open,
  onClose,
  onUpdate,
  onSubtaskCreated,
}: IssueDetailModalProps) {
  const { members, addIssue } = useProjectStore()
  const [, setSelectedSubtask] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (issue) {
      setTitle(issue.title)
      setDescription(issue.description || '')
    }
  }, [issue])

  if (!issue) return null

  const handleUpdateField = async (field: string, value: any) => {
    setLoading(true)
    try {
      const updated = await issueService.updateIssue(projectKey, issue.key, {
        [field]: value,
      })
      onUpdate(updated)
      message.success('Updated successfully')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTitle = async () => {
    if (title !== issue.title) {
      await handleUpdateField('title', title)
    }
    setEditingTitle(false)
  }

  const handleSaveDescription = async () => {
    if (description !== (issue.description || '')) {
      await handleUpdateField('description', description)
    }
    setEditingDescription(false)
  }

  const typeConfig = TYPE_CONFIG[issue.type]

  const handleSubtaskCreated = (newIssue: Issue) => {
    addIssue(newIssue)
    onSubtaskCreated?.(newIssue)
  }

  const handleSubtaskClick = (subtask: Issue) => {
    setSelectedSubtask(subtask)
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      title={
        <Space>
          <span style={{ color: typeConfig.color }}>{typeConfig.icon}</span>
          <Text type="secondary">{issue.key}</Text>
        </Space>
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
                {issue.title}
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
                  {issue.description || (
                    <Text type="secondary">Click to add description...</Text>
                  )}
                </div>
              )}
            </div>

            {/* Subtasks */}
            <div style={{ marginBottom: 24 }}>
              <SubtaskList
                parentIssue={issue}
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
                      <CommentList projectKey={projectKey} issueKey={issue.key} />
                    </div>
                  ),
                },
                {
                  key: 'attachments',
                  label: 'Attachments',
                  children: (
                    <div style={{ padding: '16px 0' }}>
                      <AttachmentList projectKey={projectKey} issueKey={issue.key} />
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
                value={issue.status}
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
                value={issue.assignee?.id}
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
                value={issue.priority}
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
                value={issue.storyPoints}
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
                value={issue.dueDate ? dayjs(issue.dueDate) : null}
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
                {issue.labels.length > 0 ? (
                  issue.labels.map((label) => (
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
                Created by {issue.creator.name}
              </div>
              <div style={{ marginBottom: 4 }}>
                Created: {dayjs(issue.createdAt).format('MMM D, YYYY')}
              </div>
              <div>
                Updated: {dayjs(issue.updatedAt).format('MMM D, YYYY HH:mm')}
              </div>
            </div>
          </div>
        </div>
      </Spin>
    </Modal>
  )
}
