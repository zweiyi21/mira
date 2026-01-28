import { useState } from 'react'
import { List, Input, Button, Progress, Tag, Space, message, Checkbox, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { Issue, IssueType } from '../types'
import { issueService } from '../services/issueService'
import { useProjectStore } from '../stores/projectStore'

interface SubtaskListProps {
  parentIssue: Issue
  projectKey: string
  onSubtaskCreated: (issue: Issue) => void
  onSubtaskClick: (issue: Issue) => void
  onSubtaskDeleted?: (issueKey: string) => void
}

const TYPE_COLORS: Record<IssueType, string> = {
  EPIC: '#6554c0',
  STORY: '#36b37e',
  TASK: '#1890ff',
  BUG: '#ff5630',
}

export default function SubtaskList({
  parentIssue,
  projectKey,
  onSubtaskCreated,
  onSubtaskClick,
  onSubtaskDeleted,
}: SubtaskListProps) {
  const { issues, updateIssue: updateStoreIssue, removeIssue } = useProjectStore()
  const [showInput, setShowInput] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)

  const subtasks = issues.filter((i) => i.parentKey === parentIssue.key)
  const completedCount = subtasks.filter((s) => s.status === 'DONE').length
  const progress = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0

  const handleCreate = async () => {
    if (!newTitle.trim()) return

    setCreating(true)
    try {
      const newIssue = await issueService.createIssue(projectKey, {
        type: 'TASK',
        title: newTitle,
        parentKey: parentIssue.key,
        sprintId: parentIssue.sprintId,
      })
      onSubtaskCreated(newIssue)
      setNewTitle('')
      setShowInput(false)
      message.success('Subtask created')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create subtask')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleStatus = async (subtask: Issue) => {
    const newStatus = subtask.status === 'DONE' ? 'TODO' : 'DONE'
    try {
      const updated = await issueService.updateIssue(projectKey, subtask.key, {
        status: newStatus,
      })
      updateStoreIssue(updated)
    } catch (error) {
      message.error('Failed to update status')
    }
  }

  const handleDeleteSubtask = async (subtaskKey: string) => {
    try {
      await issueService.deleteIssue(projectKey, subtaskKey)
      removeIssue(subtaskKey)
      onSubtaskDeleted?.(subtaskKey)
      message.success('Subtask deleted')
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete subtask')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 500, marginRight: 8 }}>
          Subtasks ({completedCount}/{subtasks.length})
        </span>
        {subtasks.length > 0 && (
          <Progress percent={progress} size="small" style={{ flex: 1, maxWidth: 120 }} />
        )}
      </div>

      {subtasks.length > 0 && (
        <List
          size="small"
          dataSource={subtasks}
          renderItem={(subtask) => (
            <List.Item
              style={{ padding: '8px 0' }}
              actions={[
                <Tag key="status" color={subtask.status === 'DONE' ? 'success' : 'default'}>
                  {subtask.status.replace('_', ' ')}
                </Tag>,
                <Popconfirm
                  key="delete"
                  title="Delete this subtask?"
                  onConfirm={() => handleDeleteSubtask(subtask.key)}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                >
                  <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>,
              ]}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <Checkbox
                  checked={subtask.status === 'DONE'}
                  onChange={() => handleToggleStatus(subtask)}
                />
                <span
                  style={{
                    cursor: 'pointer',
                    color: TYPE_COLORS[subtask.type],
                    fontSize: 12,
                  }}
                >
                  {subtask.key}
                </span>
                <span
                  style={{
                    cursor: 'pointer',
                    textDecoration: subtask.status === 'DONE' ? 'line-through' : 'none',
                    color: subtask.status === 'DONE' ? '#999' : 'inherit',
                  }}
                  onClick={() => onSubtaskClick(subtask)}
                >
                  {subtask.title}
                </span>
              </div>
            </List.Item>
          )}
        />
      )}

      {showInput ? (
        <Space.Compact style={{ width: '100%', marginTop: 8 }}>
          <Input
            placeholder="What needs to be done?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onPressEnter={handleCreate}
            autoFocus
          />
          <Button type="primary" onClick={handleCreate} loading={creating}>
            Add
          </Button>
          <Button onClick={() => { setShowInput(false); setNewTitle('') }}>
            Cancel
          </Button>
        </Space.Compact>
      ) : (
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => setShowInput(true)}
          style={{ width: '100%', marginTop: 8 }}
        >
          Add Subtask
        </Button>
      )}
    </div>
  )
}
