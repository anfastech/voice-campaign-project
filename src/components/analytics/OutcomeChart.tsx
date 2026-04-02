'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface OutcomeData {
  status: string
  count: number
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'var(--chart-3)',
  FAILED: 'var(--destructive)',
  NO_ANSWER: 'var(--chart-4)',
  BUSY: 'var(--chart-5)',
  CANCELLED: 'var(--muted-foreground)',
  IN_PROGRESS: 'var(--chart-2)',
  INITIATED: 'var(--chart-1)',
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <span className="text-muted-foreground">{name}: </span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

export function OutcomeChart({ data }: { data: OutcomeData[] }) {
  const safeData = Array.isArray(data) ? data.filter((d) => d.count > 0) : []
  const total = safeData.reduce((s, d) => s + d.count, 0)

  if (safeData.length === 0) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Call Outcomes</CardTitle>
          <CardDescription>Distribution by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = safeData.map((d) => ({
    name: d.status.replace(/_/g, ' '),
    value: d.count,
    pct: total > 0 ? Math.round((d.count / total) * 100) : 0,
    fill: STATUS_COLORS[d.status] ?? 'var(--muted-foreground)',
  }))

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Call Outcomes</CardTitle>
        <CardDescription>Distribution by status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} strokeWidth={2} stroke="var(--background)">
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
