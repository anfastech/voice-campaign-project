'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import {
  Phone, TrendingUp, DollarSign, Clock, Users, Target,
  Download, BarChart3, Grid3X3, PieChart as PieChartIcon,
} from 'lucide-react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ConversationChart } from '@/components/dashboard/ConversationChart'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { formatCurrency, formatDuration } from '@/lib/utils'

const OutcomeChart = dynamic(
  () => import('@/components/analytics/OutcomeChart').then((m) => m.OutcomeChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)
const VolumeBarChart = dynamic(
  () => import('@/components/analytics/VolumeChart').then((m) => m.VolumeBarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)
const SuccessRateTrend = dynamic(
  () => import('@/components/analytics/VolumeChart').then((m) => m.SuccessRateTrend),
  { ssr: false, loading: () => <ChartSkeleton /> }
)
const HeatmapChart = dynamic(
  () => import('@/components/analytics/HeatmapChart').then((m) => m.HeatmapChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)
const CostChart = dynamic(
  () => import('@/components/analytics/CostChart').then((m) => m.CostChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

function ChartSkeleton() {
  return (
    <div className="h-[280px] rounded-xl relative overflow-hidden"
      style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
      <div className="absolute inset-0 shimmer" />
    </div>
  )
}

const DATE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: 'All Time', value: 'all' },
]

function getDateRange(preset: string): { from?: string; to?: string } {
  const now = new Date()
  const to = now.toISOString()

  switch (preset) {
    case 'today': {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      return { from: start.toISOString(), to }
    }
    case '7d': {
      const start = new Date()
      start.setDate(start.getDate() - 7)
      return { from: start.toISOString(), to }
    }
    case '30d': {
      const start = new Date()
      start.setDate(start.getDate() - 30)
      return { from: start.toISOString(), to }
    }
    case '90d': {
      const start = new Date()
      start.setDate(start.getDate() - 90)
      return { from: start.toISOString(), to }
    }
    default:
      return {}
  }
}

function ChartCard({ title, subtitle, icon: Icon, children }: {
  title: string
  subtitle?: string
  icon: any
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl p-6"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 1px 3px oklch(0 0 0 / 4%)' }}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{title}</h3>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{subtitle}</p>}
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'oklch(0.49 0.263 281 / 10%)' }}>
          <Icon className="w-4 h-4" style={{ color: 'oklch(0.49 0.263 281)' }} />
        </div>
      </div>
      {children}
    </div>
  )
}

export default function AnalyticsPage() {
  const [datePreset, setDatePreset] = useState('30d')
  const dateRange = useMemo(() => getDateRange(datePreset), [datePreset])
  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (dateRange.from) p.set('from', dateRange.from)
    if (dateRange.to) p.set('to', dateRange.to)
    return p.toString()
  }, [dateRange])

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics-overview', params],
    queryFn: () => fetch(`/api/analytics/overview?${params}`).then((r) => r.json()),
    refetchInterval: 30000,
  })

  const { data: outcomes } = useQuery({
    queryKey: ['analytics-outcomes', params],
    queryFn: () => fetch(`/api/analytics/call-outcomes?${params}`).then((r) => r.json()),
    refetchInterval: 30000,
  })

  const { data: volumeData } = useQuery({
    queryKey: ['analytics-volume', params],
    queryFn: () => fetch(`/api/analytics/call-volume?${params}`).then((r) => r.json()),
    refetchInterval: 30000,
  })

  const { data: heatmapData } = useQuery({
    queryKey: ['analytics-heatmap', params],
    queryFn: () => fetch(`/api/analytics/call-volume?${params}&mode=heatmap`).then((r) => r.json()),
    refetchInterval: 60000,
  })

  const { data: costData } = useQuery({
    queryKey: ['analytics-cost', params],
    queryFn: () => fetch(`/api/analytics/cost-breakdown?${params}&groupBy=day`).then((r) => r.json()),
    refetchInterval: 30000,
  })

  const { data: agentData } = useQuery({
    queryKey: ['analytics-agents', params],
    queryFn: () => fetch(`/api/analytics/agent-comparison?${params}`).then((r) => r.json()),
    refetchInterval: 30000,
  })

  const { data: campaignCostData } = useQuery({
    queryKey: ['analytics-campaign-cost', params],
    queryFn: () => fetch(`/api/analytics/cost-breakdown?${params}&groupBy=campaign`).then((r) => r.json()),
    refetchInterval: 30000,
  })

  const { data: dashStats, isLoading: dashStatsLoading } = useQuery({
    queryKey: ['dashboard-stats', datePreset],
    queryFn: () => fetch(`/api/dashboard/stats?period=${datePreset}`).then((r) => r.json()),
    refetchInterval: 30000,
  })

  const { data: dashChart } = useQuery({
    queryKey: ['dashboard-chart', datePreset],
    queryFn: () => fetch(`/api/dashboard/chart?period=${datePreset}`).then((r) => r.json()),
    refetchInterval: 30000,
  })

  // Compute success rate trend from volume data
  const successTrend = useMemo(() => {
    if (!volumeData?.data) return []
    return volumeData.data.map((d: any) => ({
      date: d.date,
      successRate: d.total > 0 ? Math.round((d.successful / d.total) * 100) : 0,
    }))
  }, [volumeData])

  // Compute chart trend from dashboard chart data
  const chartCallsTrend = useMemo(() => {
    if (!dashStats?.period?.trends?.calls) return 0
    return dashStats.period.trends.calls
  }, [dashStats])

  const exportTableCsv = useCallback((headers: string[], rows: string[][], filename: string) => {
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const exportAgents = useCallback(() => {
    if (!agentData?.length) return
    const headers = ['Agent', 'Calls', 'Successful', 'Success Rate', 'Avg Duration', 'Cost']
    const rows = agentData.map((a: any) => [
      a.name, a.totalCalls, a.successfulCalls,
      `${a.successRate}%`, formatDuration(a.avgDuration), `$${a.totalCost.toFixed(2)}`,
    ])
    exportTableCsv(headers, rows, 'agent-comparison')
  }, [agentData, exportTableCsv])

  const exportCampaigns = useCallback(() => {
    if (!campaignCostData?.length) return
    const headers = ['Campaign', 'Cost', 'Calls']
    const rows = campaignCostData.map((c: any) => [c.label, `$${c.amount.toFixed(2)}`, c.callCount])
    exportTableCsv(headers, rows, 'campaign-cost')
  }, [campaignCostData, exportTableCsv])

  return (
    <div className="space-y-6">
      {/* Header with date picker */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Analytics</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Deep insights into your voice campaign performance
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
          {DATE_PRESETS.map((p) => (
            <button key={p.value}
              onClick={() => setDatePreset(p.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200"
              style={datePreset === p.value ? {
                background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
                color: 'white',
                boxShadow: '0 2px 8px oklch(0.49 0.263 281 / 30%)',
              } : { color: 'var(--muted-foreground)' }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard KPI Row */}
      {dashStatsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 h-28 relative overflow-hidden"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="absolute inset-0 shimmer" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Calls"
            value={dashStats?.period?.current?.calls ?? 0}
            subtitle="This period"
            icon={Phone}
            color="violet"
            trend={dashStats?.period?.trends?.calls}
          />
          <StatsCard
            title="Successful Calls"
            value={dashStats?.period?.current?.successful ?? 0}
            subtitle={`${dashStats?.period?.current?.successRate ?? 0}% success rate`}
            icon={TrendingUp}
            color="emerald"
            trend={dashStats?.period?.trends?.successful}
          />
          <StatsCard
            title="Avg Duration"
            value={formatDuration(dashStats?.period?.current?.avgDuration)}
            subtitle="Per completed call"
            icon={Clock}
            color="sky"
            trend={dashStats?.period?.trends?.avgDuration}
          />
          <StatsCard
            title="Total Cost"
            value={formatCurrency(dashStats?.period?.current?.cost)}
            subtitle="This period"
            icon={DollarSign}
            color="amber"
            trend={dashStats?.period?.trends?.cost}
          />
        </div>
      )}

      {/* KPI Cards */}
      {overviewLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 h-28 relative overflow-hidden"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="absolute inset-0 shimmer" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatsCard title="Total Calls" value={overview?.totalCalls ?? 0}
            subtitle={`${overview?.completedCalls ?? 0} completed`} icon={Phone} color="violet" />
          <StatsCard title="Avg Duration" value={formatDuration(overview?.avgDuration)}
            subtitle="Per completed call" icon={Clock} color="sky" />
          <StatsCard title="Success Rate" value={`${overview?.successRate ?? 0}%`}
            subtitle={`${overview?.completedCalls ?? 0} successful`} icon={TrendingUp} color="emerald" />
          <StatsCard title="Total Cost" value={formatCurrency(overview?.totalCost)}
            subtitle={`${formatCurrency(overview?.costPerSuccess)}/success`} icon={DollarSign} color="amber" />
          <StatsCard title="Cost / Success" value={formatCurrency(overview?.costPerSuccess)}
            subtitle="Per successful call" icon={Target} color="rose" />
          <StatsCard title="Contacts Reached" value={overview?.contactsReached ?? 0}
            subtitle="Unique contacts" icon={Users} color="violet" />
        </div>
      )}

      {/* Conversation Chart: Latest vs Previous Period */}
      <ConversationChart
        data={Array.isArray(dashChart) ? dashChart : []}
        title="Call Volume Comparison"
        description="Latest period vs previous period"
        dataKey="total"
        previousKey="previousTotal"
        trend={chartCallsTrend}
        color="violet"
      />

      {/* Charts Row 1: Outcomes + Volume */}
      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard title="Call Outcomes" subtitle="Status breakdown" icon={PieChartIcon}>
          <OutcomeChart data={Array.isArray(outcomes) ? outcomes : []} />
        </ChartCard>
        <ChartCard title="Call Volume" subtitle="Daily breakdown by status" icon={BarChart3}>
          <VolumeBarChart data={volumeData?.data ?? []} />
        </ChartCard>
      </div>

      {/* Charts Row 2: Success Trend + Heatmap */}
      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard title="Success Rate Trend" subtitle="Daily success rate over period" icon={TrendingUp}>
          <SuccessRateTrend data={successTrend} />
        </ChartCard>
        <ChartCard title="Call Volume Heatmap" subtitle="Best calling times (hour × day)" icon={Grid3X3}>
          <HeatmapChart data={heatmapData?.data ?? []} />
        </ChartCard>
      </div>

      {/* Cost Breakdown */}
      <ChartCard title="Cost Breakdown" subtitle="Daily cost trend" icon={DollarSign}>
        <CostChart data={Array.isArray(costData) ? costData : []} />
      </ChartCard>

      {/* Agent Comparison Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Agent Comparison</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Performance metrics per agent</p>
          </div>
          <button onClick={exportAgents} disabled={!agentData?.length}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all hover:scale-105 disabled:opacity-40"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--muted)' }}>
                {['Agent', 'Calls', 'Successful', 'Success Rate', 'Avg Duration', 'Total Cost'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(agentData ?? []).length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>No agent data</td></tr>
              ) : (
                (agentData ?? []).map((agent: any) => (
                  <tr key={agent.id} className="transition-colors"
                    style={{ borderTop: '1px solid var(--border)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--muted)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)' }}>{agent.name}</td>
                    <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--foreground)' }}>{agent.totalCalls}</td>
                    <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--foreground)' }}>{agent.successfulCalls}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full" style={{
                            width: `${agent.successRate}%`,
                            background: agent.successRate >= 50
                              ? 'oklch(0.55 0.215 163)' : 'oklch(0.59 0.245 15)',
                          }} />
                        </div>
                        <span className="text-xs tabular-nums font-medium" style={{ color: 'var(--foreground)' }}>
                          {agent.successRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {formatDuration(agent.avgDuration)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {formatCurrency(agent.totalCost)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Comparison Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Campaign Cost Comparison</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Cost and call volume per campaign</p>
          </div>
          <button onClick={exportCampaigns} disabled={!campaignCostData?.length}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all hover:scale-105 disabled:opacity-40"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--muted)' }}>
                {['Campaign', 'Total Cost', 'Calls', 'Avg Cost/Call'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(campaignCostData ?? []).length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>No campaign data</td></tr>
              ) : (
                (campaignCostData ?? []).map((c: any, i: number) => (
                  <tr key={i} className="transition-colors"
                    style={{ borderTop: '1px solid var(--border)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--muted)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)' }}>{c.label}</td>
                    <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--foreground)' }}>{formatCurrency(c.amount)}</td>
                    <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--foreground)' }}>{c.callCount}</td>
                    <td className="px-4 py-3 tabular-nums text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {c.callCount > 0 ? formatCurrency(c.amount / c.callCount) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity calls={dashStats?.recentCalls ?? []} />
    </div>
  )
}
