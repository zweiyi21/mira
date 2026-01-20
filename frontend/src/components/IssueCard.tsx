import { Card, Tag, Avatar, Tooltip } from 'antd'
import {
  ThunderboltOutlined,
  BookOutlined,
  CheckSquareOutlined,
  BugOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { Issue, IssueType, IssuePriority } from '../types'
import { userService } from '../services/userService'

const TYPE_ICONS: Record<IssueType, React.ReactNode> = {
  EPIC: <ThunderboltOutlined style={{ color: '#6554c0' }} />,
  STORY: <BookOutlined style={{ color: '#36b37e' }} />,
  TASK: <CheckSquareOutlined style={{ color: '#1890ff' }} />,
  BUG: <BugOutlined style={{ color: '#ff5630' }} />,
}

const PRIORITY_COLORS: Record<IssuePriority, string> = {
  HIGHEST: '#ff5630',
  HIGH: '#ff7452',
  MEDIUM: '#ffab00',
  LOW: '#0065ff',
  LOWEST: '#2684ff',
}

interface IssueCardProps {
  issue: Issue
  onClick?: () => void
}

function IssueCard({ issue, onClick }: IssueCardProps) {
  return (
    <Card
      size="small"
      style={{ marginBottom: 8, cursor: 'pointer' }}
      onClick={onClick}
      bodyStyle={{ padding: 12 }}
    >
      <div style={{ marginBottom: 8 }}>{issue.title}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tooltip title={issue.type}>{TYPE_ICONS[issue.type]}</Tooltip>
          <span style={{ color: '#666', fontSize: 12 }}>{issue.key}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {issue.storyPoints && (
            <Tag style={{ margin: 0 }}>{issue.storyPoints}</Tag>
          )}
          <Tooltip title={issue.priority}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: PRIORITY_COLORS[issue.priority],
              }}
            />
          </Tooltip>
          {issue.assignee ? (
            <Tooltip title={issue.assignee.name}>
              <Avatar
                size="small"
                src={issue.assignee.avatarUrl ? userService.getAvatarUrl(issue.assignee.id) : undefined}
              >
                {issue.assignee.name[0]}
              </Avatar>
            </Tooltip>
          ) : (
            <Avatar size="small" icon={<UserOutlined />} />
          )}
        </div>
      </div>
    </Card>
  )
}

export default IssueCard
