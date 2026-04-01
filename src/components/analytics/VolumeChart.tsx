'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl p-3 text-sm shadow-2xl"
      style={{ background: 'var(--popover)', border: '1px solid var(--border)', minWidth: 160 }}>
      <p className="font-semibold mb-2 text-xs uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
            <span style={{ color: 'var(--muted-foreground)' }}>{entry.name}</span>
          </div>
          <span className="font-bold" style={{ color: 'var(--foreground)' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

interface DailyData {
  date: string
  successful: number
  failed: number
  noAnswer: number
  total: number
}

export function VolumeBarChart({ data }: { data: DailyData[] }) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted ? theme === 'dark' : true

  const gridColor = isDark ? 'oklch(1 0 0 / 6%)' : 'oklch(0 0 0 / 6%)'
  const axisColor = isDark ? 'oklch(0.62 0.015 285)' : 'oklch(0.52 0.02 285)'

  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  if (formatted.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] rounded-xl"
        style={{ background: 'oklch(0.49 0.263 281 / 4%)', border: '1px dashed oklch(0.49 0.263 281 / 20%)' }}>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No volume data</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={formatted} margin={{ top: 4, right: 0, bottom: 0, left: -20 }} barCategoryGap="30%">
        <defs>
          <linearGradient id="gradS" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.215 163)" stopOpacity={1} />
            <stop offset="100%" stopColor="oklch(0.65 0.19 150)" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="gradF" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.59 0.245 15)" stopOpacity={1} />
            <stop offset="100%" stopColor="oklch(0.7 0.22 25)" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="gradNA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.18 68)" stopOpacity={1} />
            <stop offset="100%" stopColor="oklch(0.82 0.17 82)" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'oklch(1 0 0 / 4%)' : 'oklch(0 0 0 / 3%)' }} />
        <Bar dataKey="successful" name="Successful" fill="url(#gradS)" radius={4} maxBarSize={32} stackId="a" />
        <Bar dataKey="failed" name="Failed" fill="url(#gradF)" radius={0} maxBarSize={32} stackId="a" />
        <Bar dataKey="noAnswer" name="No Answer" fill="url(#gradNA)" radius={[4, 4, 0, 0]} maxBarSize={32} stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface TrendData {
  date: string
  successRate: number
}

export function SuccessRateTrend({ data }: { data: TrendData[] }) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted ? theme === 'dark' : true

  const gridColor = isDark ? 'oklch(1 0 0 / 6%)' : 'oklch(0 0 0 / 6%)'
  const axisColor = isDark ? 'oklch(0.62 0.015 285)' : 'oklch(0.52 0.02 285)'

  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  if (formatted.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] rounded-xl"
        style={{ background: 'oklch(0.49 0.263 281 / 4%)', border: '1px dashed oklch(0.49 0.263 281 / 20%)' }}>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No trend data</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={formatted} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="gradLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.49 0.263 281)" />
            <stop offset="100%" stopColor="oklch(0.55 0.215 163)" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} domain={[0, 100]}
          tickFormatter={(v) => `${v}%`} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'oklch(0.49 0.263 281 / 30%)', strokeWidth: 1 }} />
        <Line type="monotone" dataKey="successRate" name="Success Rate"
          stroke="url(#gradLine)" strokeWidth={2.5} dot={{ r: 4, fill: 'oklch(0.49 0.263 281)', strokeWidth: 0 }}
          activeDot={{ r: 6, fill: 'oklch(0.49 0.263 281)', strokeWidth: 2, stroke: 'white' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
