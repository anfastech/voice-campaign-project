'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Download } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
    <div className="h-[280px] rounded-xl bg-muted border border-border relative overflow-hidden">
      <div className="absolute inset-0 animate-pulse bg-muted" />
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
          <h2 className="text-xl font-bold text-foreground">Analytics</h2>
          <p className="text-sm mt-0.5 text-muted-foreground">
            Deep insights into your voice campaign performance
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted border border-border">
          {DATE_PRESETS.map((p) => (
            <Button
              key={p.value}
              variant={datePreset === p.value ? 'default' : 'ghost'}
              size="sm"
              className="text-xs"
              onClick={() => setDatePreset(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Dashboard KPI Row */}
      {dashStatsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 h-28 bg-card border border-border relative overflow-hidden">
              <div className="absolute inset-0 animate-pulse bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Calls"
            value={dashStats?.period?.current?.calls ?? 0}
            trend={dashStats?.period?.trends?.calls}
          />
          <StatCard
            label="Successful Calls"
            value={dashStats?.period?.current?.successful ?? 0}
            trend={dashStats?.period?.trends?.successful}
          />
          <StatCard
            label="Avg Duration"
            value={formatDuration(dashStats?.period?.current?.avgDuration)}
            trend={dashStats?.period?.trends?.avgDuration}
          />
          <StatCard
            label="Total Cost"
            value={formatCurrency(dashStats?.period?.current?.cost)}
            trend={dashStats?.period?.trends?.cost}
          />
        </div>
      )}

      {/* KPI Cards */}
      {overviewLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 h-28 bg-card border border-border relative overflow-hidden">
              <div className="absolute inset-0 animate-pulse bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard label="Total Calls" value={overview?.totalCalls ?? 0} />
          <StatCard label="Avg Duration" value={formatDuration(overview?.avgDuration)} />
          <StatCard label="Success Rate" value={`${overview?.successRate ?? 0}%`} />
          <StatCard label="Total Cost" value={formatCurrency(overview?.totalCost)} />
          <StatCard label="Cost / Success" value={formatCurrency(overview?.costPerSuccess)} />
          <StatCard label="Contacts Reached" value={overview?.contactsReached ?? 0} />
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
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Call Outcomes</CardTitle>
            <CardDescription>Status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <OutcomeChart data={Array.isArray(outcomes) ? outcomes : []} />
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Call Volume</CardTitle>
            <CardDescription>Daily breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            <VolumeBarChart data={volumeData?.data ?? []} />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Success Trend + Heatmap */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Success Rate Trend</CardTitle>
            <CardDescription>Daily success rate over period</CardDescription>
          </CardHeader>
          <CardContent>
            <SuccessRateTrend data={successTrend} />
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Call Volume Heatmap</CardTitle>
            <CardDescription>Best calling times (hour x day)</CardDescription>
          </CardHeader>
          <CardContent>
            <HeatmapChart data={heatmapData?.data ?? []} />
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <Card className="shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cost Breakdown</CardTitle>
          <CardDescription>Daily cost trend</CardDescription>
        </CardHeader>
        <CardContent>
          <CostChart data={Array.isArray(costData) ? costData : []} />
        </CardContent>
      </Card>

      {/* Agent Comparison Table */}
      <Card className="shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="font-semibold text-sm text-foreground">Agent Comparison</h3>
            <p className="text-xs mt-0.5 text-muted-foreground">Performance metrics per agent</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportAgents} disabled={!agentData?.length}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                {['Agent', 'Calls', 'Successful', 'Success Rate', 'Avg Duration', 'Total Cost'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(agentData ?? []).length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No agent data</td></tr>
              ) : (
                (agentData ?? []).map((agent: any) => (
                  <tr key={agent.id} className="border-t hover:bg-muted transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{agent.name}</td>
                    <td className="px-4 py-3 tabular-nums text-foreground">{agent.totalCalls}</td>
                    <td className="px-4 py-3 tabular-nums text-foreground">{agent.successfulCalls}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden bg-border">
                          <div
                            className={`h-full rounded-full ${agent.successRate >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                            style={{ width: `${agent.successRate}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums font-medium text-foreground">
                          {agent.successRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-xs text-muted-foreground">
                      {formatDuration(agent.avgDuration)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-xs text-muted-foreground">
                      {formatCurrency(agent.totalCost)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Campaign Comparison Table */}
      <Card className="shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="font-semibold text-sm text-foreground">Campaign Cost Comparison</h3>
            <p className="text-xs mt-0.5 text-muted-foreground">Cost and call volume per campaign</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCampaigns} disabled={!campaignCostData?.length}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                {['Campaign', 'Total Cost', 'Calls', 'Avg Cost/Call'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(campaignCostData ?? []).length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No campaign data</td></tr>
              ) : (
                (campaignCostData ?? []).map((c: any, i: number) => (
                  <tr key={i} className="border-t hover:bg-muted transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{c.label}</td>
                    <td className="px-4 py-3 tabular-nums text-foreground">{formatCurrency(c.amount)}</td>
                    <td className="px-4 py-3 tabular-nums text-foreground">{c.callCount}</td>
                    <td className="px-4 py-3 tabular-nums text-xs text-muted-foreground">
                      {c.callCount > 0 ? formatCurrency(c.amount / c.callCount) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Activity */}
      <RecentActivity calls={dashStats?.recentCalls ?? []} />
    </div>
  )
}
