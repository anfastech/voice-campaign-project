'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface CostData {
  label: string
  amount: number
  callCount: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-xl p-3 text-sm shadow-2xl"
      style={{ background: 'var(--popover)', border: '1px solid var(--border)', minWidth: 160 }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>{label}</p>
      <div className="flex justify-between gap-4">
        <span style={{ color: 'var(--muted-foreground)' }}>Cost</span>
        <span className="font-bold" style={{ color: 'var(--foreground)' }}>${d.amount.toFixed(2)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span style={{ color: 'var(--muted-foreground)' }}>Calls</span>
        <span className="font-bold" style={{ color: 'var(--foreground)' }}>{d.callCount}</span>
      </div>
    </div>
  )
}

export function CostChart({ data }: { data: CostData[] }) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted ? theme === 'dark' : true

  const gridColor = isDark ? 'oklch(1 0 0 / 6%)' : 'oklch(0 0 0 / 6%)'
  const axisColor = isDark ? 'oklch(0.62 0.015 285)' : 'oklch(0.52 0.02 285)'

  const formatted = data.map((d) => ({
    ...d,
    label: d.label.length > 10
      ? new Date(d.label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : d.label,
  }))

  if (formatted.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] rounded-xl"
        style={{ background: 'oklch(0.49 0.263 281 / 4%)', border: '1px dashed oklch(0.49 0.263 281 / 20%)' }}>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No cost data</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={formatted} margin={{ top: 4, right: 0, bottom: 0, left: -10 }} barCategoryGap="30%">
        <defs>
          <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.18 68)" stopOpacity={1} />
            <stop offset="100%" stopColor="oklch(0.82 0.17 82)" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `$${v}`} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'oklch(1 0 0 / 4%)' : 'oklch(0 0 0 / 3%)' }} />
        <Bar dataKey="amount" name="Cost" fill="url(#gradCost)" radius={6} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
