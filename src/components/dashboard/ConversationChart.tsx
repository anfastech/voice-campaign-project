'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface ConversationChartProps {
  data: Array<Record<string, unknown>>
  title: string
  description: string
  dataKey: string
  previousKey: string
  trend: number
  color?: 'violet' | 'emerald' | 'sky' | 'amber'
}

const colorMap = {
  violet: {
    current: 'oklch(0.49 0.263 281)',
    currentLight: 'oklch(0.68 0.22 281)',
    previous: 'oklch(0.55 0.215 163)',
    previousLight: 'oklch(0.65 0.19 150)',
    gradStart: 'oklch(0.49 0.263 281 / 20%)',
    gradEnd: 'oklch(0.49 0.263 281 / 2%)',
    prevGradStart: 'oklch(0.55 0.215 163 / 15%)',
    prevGradEnd: 'oklch(0.55 0.215 163 / 2%)',
  },
  emerald: {
    current: 'oklch(0.55 0.215 163)',
    currentLight: 'oklch(0.65 0.19 150)',
    previous: 'oklch(0.72 0.18 68)',
    previousLight: 'oklch(0.82 0.17 82)',
    gradStart: 'oklch(0.55 0.215 163 / 20%)',
    gradEnd: 'oklch(0.55 0.215 163 / 2%)',
    prevGradStart: 'oklch(0.72 0.18 68 / 15%)',
    prevGradEnd: 'oklch(0.72 0.18 68 / 2%)',
  },
  sky: {
    current: 'oklch(0.6 0.19 220)',
    currentLight: 'oklch(0.7 0.17 235)',
    previous: 'oklch(0.49 0.263 281)',
    previousLight: 'oklch(0.68 0.22 281)',
    gradStart: 'oklch(0.6 0.19 220 / 20%)',
    gradEnd: 'oklch(0.6 0.19 220 / 2%)',
    prevGradStart: 'oklch(0.49 0.263 281 / 15%)',
    prevGradEnd: 'oklch(0.49 0.263 281 / 2%)',
  },
  amber: {
    current: 'oklch(0.72 0.18 68)',
    currentLight: 'oklch(0.82 0.17 82)',
    previous: 'oklch(0.59 0.245 15)',
    previousLight: 'oklch(0.7 0.22 25)',
    gradStart: 'oklch(0.72 0.18 68 / 20%)',
    gradEnd: 'oklch(0.72 0.18 68 / 2%)',
    prevGradStart: 'oklch(0.59 0.245 15 / 15%)',
    prevGradEnd: 'oklch(0.59 0.245 15 / 2%)',
  },
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div
      className="rounded-xl p-3 text-sm shadow-2xl"
      style={{
        background: 'var(--popover)',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        minWidth: 140,
      }}
    >
      <p className="font-semibold mb-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: entry.stroke || entry.color }}
            />
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{entry.name}</span>
          </div>
          <span className="font-bold text-xs" style={{ color: 'var(--foreground)' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function ConversationChart({
  data,
  title,
  description,
  dataKey,
  previousKey,
  trend,
  color = 'violet',
}: ConversationChartProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted ? theme === 'dark' : true
  const gridColor = isDark ? 'oklch(1 0 0 / 6%)' : 'oklch(0 0 0 / 6%)'
  const axisColor = isDark ? 'oklch(0.62 0.015 285)' : 'oklch(0.52 0.02 285)'
  const colors = colorMap[color]

  const isPositive = trend > 0
  const isZero = trend === 0
  const trendColor = isZero ? 'var(--muted-foreground)' : isPositive ? 'oklch(0.45 0.215 163)' : 'oklch(0.52 0.245 15)'
  const trendBg = isZero ? 'oklch(0.5 0 0 / 8%)' : isPositive ? 'oklch(0.55 0.215 163 / 12%)' : 'oklch(0.59 0.245 15 / 12%)'
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight

  const gradientId = `grad-${color}-${dataKey}`
  const prevGradientId = `grad-prev-${color}-${dataKey}`

  if (data.length === 0) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{title}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{description}</p>
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-center h-[220px] rounded-xl"
          style={{ background: 'var(--muted)', border: '1px dashed var(--border)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>No data yet</p>
          <p className="text-xs mt-1" style={{ color: 'oklch(0.52 0.02 285)' }}>
            Start a campaign to see trends here
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
      {/* Header with title, description, and trend badge */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
              {title}
            </h3>
            <span
              className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: trendBg, color: trendColor }}
            >
              {!isZero && <TrendIcon className="w-3 h-3" />}
              {isZero ? '~0%' : `${Math.abs(trend)}%`}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {description}
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors.current }} />
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Latest</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors.previous }} />
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Previous</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.current} stopOpacity={0.2} />
              <stop offset="100%" stopColor={colors.current} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id={prevGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.previous} stopOpacity={0.12} />
              <stop offset="100%" stopColor={colors.previous} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
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
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={previousKey}
            name="Previous"
            stroke={colors.previous}
            strokeWidth={2}
            strokeDasharray="5 5"
            fill={`url(#${prevGradientId})`}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            name="Latest"
            stroke={colors.current}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, stroke: colors.current, strokeWidth: 2, fill: 'var(--card)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
