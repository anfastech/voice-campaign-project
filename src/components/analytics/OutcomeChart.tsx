'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'oklch(0.55 0.215 163)',
  FAILED: 'oklch(0.59 0.245 15)',
  NO_ANSWER: 'oklch(0.72 0.18 68)',
  BUSY: 'oklch(0.6 0.19 220)',
  CANCELLED: 'oklch(0.5 0.015 285)',
  INITIATED: 'oklch(0.49 0.263 281)',
  IN_PROGRESS: 'oklch(0.65 0.22 310)',
  RINGING: 'oklch(0.62 0.015 285)',
}

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  NO_ANSWER: 'No Answer',
  BUSY: 'Busy',
  CANCELLED: 'Cancelled',
  INITIATED: 'Initiated',
  IN_PROGRESS: 'In Progress',
  RINGING: 'Ringing',
}

interface OutcomeData {
  status: string
  count: number
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-xl p-3 text-sm shadow-2xl"
      style={{ background: 'var(--popover)', border: '1px solid var(--border)', minWidth: 140 }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[d.status] || '#888' }} />
        <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
          {STATUS_LABELS[d.status] || d.status}
        </span>
      </div>
      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {d.count} call{d.count !== 1 ? 's' : ''} ({d.percentage}%)
      </p>
    </div>
  )
}

export function OutcomeChart({ data }: { data: OutcomeData[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({ ...d, percentage: total > 0 ? Math.round((d.count / total) * 100) : 0 }))

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[260px] rounded-xl"
        style={{ background: 'oklch(0.49 0.263 281 / 4%)', border: '1px dashed oklch(0.49 0.263 281 / 20%)' }}>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No call data</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-6">
      <div className="w-[200px] h-[200px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="count" nameKey="status" cx="50%" cy="50%"
              innerRadius={55} outerRadius={90} paddingAngle={2} strokeWidth={0}>
              {chartData.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#888'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2">
        {chartData.map((d) => (
          <div key={d.status} className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: STATUS_COLORS[d.status] || '#888' }} />
            <span className="text-sm flex-1" style={{ color: 'var(--foreground)' }}>
              {STATUS_LABELS[d.status] || d.status}
            </span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>
              {d.count}
            </span>
            <span className="text-xs tabular-nums w-10 text-right" style={{ color: 'var(--muted-foreground)' }}>
              {d.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
