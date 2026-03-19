'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'

interface ChartData {
  date: string
  total: number
  successful: number
  failed: number
}

interface CallChartProps {
  data: ChartData[]
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div
      className="rounded-xl p-3 text-sm shadow-2xl"
      style={{
        background: 'var(--popover)',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        minWidth: 160,
      }}
    >
      <p className="font-semibold mb-2 text-xs uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: entry.fill || entry.color }}
            />
            <span style={{ color: 'var(--muted-foreground)' }}>{entry.name}</span>
          </div>
          <span className="font-bold" style={{ color: 'var(--foreground)' }}>{entry.value}</span>
        </div>
      ))}
      <div className="mt-2 pt-2 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Total</span>
        <span className="font-bold text-xs" style={{ color: 'var(--foreground)' }}>
          {payload.reduce((s: number, e: any) => s + (e.value || 0), 0)}
        </span>
      </div>
    </div>
  )
}

export function CallChart({ data }: CallChartProps) {
  const safeData = Array.isArray(data) ? data : []
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted ? theme === 'dark' : true

  const gridColor = isDark ? 'oklch(1 0 0 / 6%)' : 'oklch(0 0 0 / 6%)'
  const axisColor = isDark ? 'oklch(0.62 0.015 285)' : 'oklch(0.52 0.02 285)'

  if (safeData.length === 0) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
              Call Volume
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Last 7 days breakdown
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'oklch(0.49 0.263 281 / 10%)' }}>
            <TrendingUp className="w-4 h-4" style={{ color: 'oklch(0.49 0.263 281)' }} />
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-center h-[240px] rounded-xl mt-4"
          style={{ background: 'oklch(0.49 0.263 281 / 4%)', border: '1px dashed oklch(0.49 0.263 281 / 20%)' }}
        >
          <TrendingUp className="w-8 h-8 mb-3 opacity-30" style={{ color: 'oklch(0.49 0.263 281)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>No call data yet</p>
          <p className="text-xs mt-1" style={{ color: 'oklch(0.52 0.02 285)' }}>
            Start a campaign to see activity here
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px oklch(0 0 0 / 4%)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
            Call Volume
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Last 7 days · Successful vs Failed
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'oklch(0.55 0.215 163)' }} />
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Successful</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'oklch(0.59 0.245 15)' }} />
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Failed</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={safeData} margin={{ top: 4, right: 0, bottom: 0, left: -20 }} barCategoryGap="30%">
          <defs>
            <linearGradient id="gradSuccessful" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.55 0.215 163)" stopOpacity={1} />
              <stop offset="100%" stopColor="oklch(0.65 0.19 150)" stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.59 0.245 15)" stopOpacity={1} />
              <stop offset="100%" stopColor="oklch(0.7 0.22 25)" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: axisColor }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: axisColor }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'oklch(1 0 0 / 4%)' : 'oklch(0 0 0 / 3%)' }} />
          <Bar
            dataKey="successful"
            name="Successful"
            fill="url(#gradSuccessful)"
            radius={6}
            maxBarSize={40}
          />
          <Bar
            dataKey="failed"
            name="Failed"
            fill="url(#gradFailed)"
            radius={6}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
