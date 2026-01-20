import { useState, useEffect } from 'react'
import { Modal, Radio, Select, Space, Typography, Statistic, Row, Col } from 'antd'
import type { Sprint, SprintSummary, IncompleteIssueAction } from '../types'

const { Text } = Typography

interface CompleteSprintModalProps {
  open: boolean
  sprint: Sprint | null
  summary: SprintSummary | null
  availableSprints: Sprint[]
  onConfirm: (action: IncompleteIssueAction, targetSprintId?: number) => void
  onCancel: () => void
  loading?: boolean
}

export default function CompleteSprintModal({
  open,
  sprint,
  summary,
  availableSprints,
  onConfirm,
  onCancel,
  loading,
}: CompleteSprintModalProps) {
  const [action, setAction] = useState<IncompleteIssueAction>('MOVE_TO_BACKLOG')
  const [targetSprintId, setTargetSprintId] = useState<number | undefined>()

  useEffect(() => {
    if (open) {
      setAction('MOVE_TO_BACKLOG')
      setTargetSprintId(undefined)
    }
  }, [open])

  const handleOk = () => {
    onConfirm(action, action === 'MOVE_TO_SPRINT' ? targetSprintId : undefined)
  }

  const hasIncompleteIssues = (summary?.incompleteIssues || 0) > 0

  return (
    <Modal
      title={`Complete Sprint: ${sprint?.name}`}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Complete Sprint"
      okButtonProps={{
        loading,
        disabled: hasIncompleteIssues && action === 'MOVE_TO_SPRINT' && !targetSprintId,
      }}
      width={500}
    >
      {summary && (
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Statistic title="Total Issues" value={summary.totalIssues} />
            </Col>
            <Col span={8}>
              <Statistic
                title="Completed"
                value={summary.completedIssues}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Incomplete"
                value={summary.incompleteIssues}
                valueStyle={{ color: summary.incompleteIssues > 0 ? '#faad14' : undefined }}
              />
            </Col>
          </Row>

          {hasIncompleteIssues ? (
            <>
              <Text style={{ display: 'block', marginBottom: 16 }}>
                There are <Text strong>{summary.incompleteIssues}</Text> incomplete issues.
                What would you like to do with them?
              </Text>

              <Radio.Group
                value={action}
                onChange={(e) => setAction(e.target.value)}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Radio value="MOVE_TO_BACKLOG">Move to Backlog</Radio>
                  <Radio value="MOVE_TO_SPRINT">
                    Move to another Sprint
                    {action === 'MOVE_TO_SPRINT' && (
                      <Select
                        placeholder="Select Sprint"
                        value={targetSprintId}
                        onChange={setTargetSprintId}
                        style={{ width: 200, marginLeft: 16 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {availableSprints
                          .filter((s) => s.id !== sprint?.id && s.status !== 'COMPLETED')
                          .map((s) => (
                            <Select.Option key={s.id} value={s.id}>
                              {s.name}
                            </Select.Option>
                          ))}
                      </Select>
                    )}
                  </Radio>
                </Space>
              </Radio.Group>
            </>
          ) : (
            <Text type="success">
              All issues have been completed! Ready to close this sprint.
            </Text>
          )}
        </>
      )}
    </Modal>
  )
}
