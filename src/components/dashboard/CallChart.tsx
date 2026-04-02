'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface ChartData {
  date: string
  total: number
  successful: number
  failed: number
  previousTotal?: number
  previousSuccessful?: number
}

interface CallChartProps {
  data: ChartData[]
  title?: string
  description?: string
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-popover p-3 text-sm shadow-md">
      <p className="font-medium text-xs text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
          </div>
          <span className="font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function CallChart({ data, title = 'Conversations', description = 'Call volume over time' }: CallChartProps) {
  const safeData = Array.isArray(data) ? data : []

  if (safeData.length === 0) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[240px] text-muted-foreground">
            <p className="text-sm">No data yet</p>
            <p className="text-xs mt-1">Start a campaign to see activity here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={safeData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', paddingBottom: '16px' }}
            />
            <Line
              type="monotone"
              dataKey="successful"
              name="Latest"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="previousSuccessful"
              name="Previous"
              stroke="var(--chart-3)"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 4"
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
