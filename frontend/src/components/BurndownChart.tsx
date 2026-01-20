import { useEffect, useState } from 'react'
import { Card, Empty, Spin, Typography } from 'antd'
import { Line } from '@ant-design/charts'
import { sprintService } from '../services/sprintService'
import type { BurndownChartData } from '../types'
import dayjs from 'dayjs'

const { Text } = Typography

interface BurndownChartProps {
  projectKey: string
  sprintId: number
  sprintName: string
  refreshKey?: number // Change this to trigger refresh
}

interface ChartDataPoint {
  date: string
  value: number
  type: string
}

export default function BurndownChart({ projectKey, sprintId, sprintName, refreshKey }: BurndownChartProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<BurndownChartData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBurndownData()
  }, [projectKey, sprintId, refreshKey])

  const loadBurndownData = async () => {
    setLoading(true)
    setError(null)
    try {
      const burndownData = await sprintService.getBurndownData(projectKey, sprintId)
      setData(burndownData)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load burndown data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card title={`Burndown Chart - ${sprintName}`}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spin />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card title={`Burndown Chart - ${sprintName}`}>
        <Empty description={error} />
      </Card>
    )
  }

  if (!data || data.dataPoints.length === 0) {
    return (
      <Card title={`Burndown Chart - ${sprintName}`}>
        <Empty description="No data available" />
      </Card>
    )
  }

  // Transform data for the chart
  const chartData: ChartDataPoint[] = []
  data.dataPoints.forEach((point) => {
    const formattedDate = dayjs(point.date).format('MM/DD')
    chartData.push({
      date: formattedDate,
      value: point.remainingPoints,
      type: 'Actual',
    })
    chartData.push({
      date: formattedDate,
      value: Math.round(point.idealPoints * 10) / 10,
      type: 'Ideal',
    })
  })

  const config = {
    data: chartData,
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    color: ['#1890ff', '#d9d9d9'],
    lineStyle: (datum: ChartDataPoint) => {
      if (datum.type === 'Ideal') {
        return { lineDash: [4, 4] }
      }
      return {}
    },
    point: {
      size: 4,
      shape: 'circle',
    },
    yAxis: {
      title: {
        text: 'Story Points',
      },
      min: 0,
    },
    xAxis: {
      title: {
        text: 'Date',
      },
    },
    legend: {
      position: 'top' as const,
    },
    smooth: false,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  }

  return (
    <Card
      title={`Burndown Chart - ${sprintName}`}
      extra={<Text type="secondary">Total: {data.totalPoints} pts</Text>}
    >
      <Line {...config} height={300} />
    </Card>
  )
}
