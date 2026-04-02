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

interface VolumeData {
  date: string
  successful: number
  failed: number
  noAnswer: number
  total: number
}

interface VolumeChartProps {
  data: VolumeData[]
}

function ChartTooltip({ active, payload, label }: any) {
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

export function VolumeBarChart({ data }: VolumeChartProps) {
  const safeData = Array.isArray(data) ? data : []

  if (safeData.length === 0) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Call Volume</CardTitle>
          <CardDescription>Daily call breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Call Volume</CardTitle>
        <CardDescription>Daily call breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={safeData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingBottom: '16px' }} />
            <Line type="monotone" dataKey="successful" name="Successful" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="failed" name="Failed" stroke="var(--destructive)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="noAnswer" name="No Answer" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function SuccessRateTrend({ data }: VolumeChartProps) {
  const safeData = (Array.isArray(data) ? data : []).map((d) => ({
    ...d,
    successRate: d.total > 0 ? Math.round((d.successful / d.total) * 100) : 0,
  }))

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Success Rate</CardTitle>
        <CardDescription>Daily success rate trend</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={safeData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="successRate" name="Success Rate" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
