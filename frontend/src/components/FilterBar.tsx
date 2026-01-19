import { Input, Select, Space, Button } from 'antd'
import { SearchOutlined, ClearOutlined } from '@ant-design/icons'
import type { IssueStatus, IssuePriority, IssueType, ProjectMember } from '../types'

const { Search } = Input

export interface FilterValues {
  search?: string
  status?: IssueStatus
  priority?: IssuePriority
  assigneeId?: number
  type?: IssueType
}

interface FilterBarProps {
  filters: FilterValues
  members: ProjectMember[]
  onFilterChange: (filters: FilterValues) => void
  onClear: () => void
}

const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' },
]

const PRIORITY_OPTIONS: { value: IssuePriority; label: string }[] = [
  { value: 'HIGHEST', label: 'Highest' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
  { value: 'LOWEST', label: 'Lowest' },
]

const TYPE_OPTIONS: { value: IssueType; label: string }[] = [
  { value: 'EPIC', label: 'Epic' },
  { value: 'STORY', label: 'Story' },
  { value: 'TASK', label: 'Task' },
  { value: 'BUG', label: 'Bug' },
]

export default function FilterBar({
  filters,
  members,
  onFilterChange,
  onClear,
}: FilterBarProps) {
  const hasFilters =
    filters.search ||
    filters.status ||
    filters.priority ||
    filters.assigneeId ||
    filters.type

  return (
    <Space wrap style={{ marginBottom: 16 }}>
      <Search
        placeholder="Search issues..."
        allowClear
        value={filters.search}
        onChange={(e) => onFilterChange({ ...filters, search: e.target.value || undefined })}
        onSearch={(value) => onFilterChange({ ...filters, search: value || undefined })}
        style={{ width: 200 }}
        prefix={<SearchOutlined />}
      />

      <Select
        placeholder="Type"
        allowClear
        value={filters.type}
        onChange={(value) => onFilterChange({ ...filters, type: value })}
        style={{ width: 120 }}
        options={TYPE_OPTIONS}
      />

      <Select
        placeholder="Status"
        allowClear
        value={filters.status}
        onChange={(value) => onFilterChange({ ...filters, status: value })}
        style={{ width: 130 }}
        options={STATUS_OPTIONS}
      />

      <Select
        placeholder="Priority"
        allowClear
        value={filters.priority}
        onChange={(value) => onFilterChange({ ...filters, priority: value })}
        style={{ width: 120 }}
        options={PRIORITY_OPTIONS}
      />

      <Select
        placeholder="Assignee"
        allowClear
        value={filters.assigneeId}
        onChange={(value) => onFilterChange({ ...filters, assigneeId: value })}
        style={{ width: 150 }}
      >
        {members.map((m) => (
          <Select.Option key={m.user.id} value={m.user.id}>
            {m.user.name}
          </Select.Option>
        ))}
      </Select>

      {hasFilters && (
        <Button icon={<ClearOutlined />} onClick={onClear}>
          Clear
        </Button>
      )}
    </Space>
  )
}
