'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/utils'
import { Download } from 'lucide-react'

// ---------- Dynamic chart imports ----------
function ChartSkeleton() {
  return <div className="h-[280px] rounded-xl bg-muted border border-border animate-pulse" />
}

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

// ---------- Date range helpers ----------
const DATE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: 'All Time', value: 'all' },
] as const

function getDateRange(preset: string): { from?: string; to?: string } {
  const now = new Date()
  const to = now.toISOString()
  switch (preset) {
    case 'today': {
      const s = new Date()
      s.setHours(0, 0, 0, 0)
      return { from: s.toISOString(), to }
    }
    case '7d': {
      const s = new Date()
      s.setDate(s.getDate() - 7)
      return { from: s.toISOString(), to }
    }
    case '30d': {
      const s = new Date()
      s.setDate(s.getDate() - 30)
      return { from: s.toISOString(), to }
    }
    case '90d': {
      const s = new Date()
      s.setDate(s.getDate() - 90)
      return { from: s.toISOString(), to }
    }
    default:
      return {}
  }
}

function qs(params: Record<string, string | undefined>) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries as [string, string][]).toString()
}

// ---------- Lead pipeline accent colors ----------
const LEAD_COLORS: Record<string, string> = {
  NEW: 'border-l-blue-500',
  CONTACTED: 'border-l-yellow-500',
  QUALIFIED: 'border-l-purple-500',
  PROPOSAL: 'border-l-orange-500',
  WON: 'border-l-emerald-500',
  LOST: 'border-l-red-500',
}

// ---------- Page component ----------
export default function ClientDashboard() {
  const [datePreset, setDatePreset] = useState('30d')

  const dateRange = useMemo(() => getDateRange(datePreset), [datePreset])
  const dateParams = useMemo(() => qs({ from: dateRange.from, to: dateRange.to }), [dateRange])

  // --- Data queries ---
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['client-analytics', datePreset],
    queryFn: () => fetch(`/api/client/analytics${dateParams}`).then((r) => r.json()),
    refetchInterval: 30000,
  })

  const { data: outcomes } = useQuery({
    queryKey: ['client-outcomes', datePreset],
    queryFn: () => fetch(`/api/client/analytics/call-outcomes${dateParams}`).then((r) => r.json()),
    refetchInterval: 30000,
  })

  const { data: volumeRaw } = useQuery({
    queryKey: ['client-volume', datePreset],
    queryFn: () => fetch(`/api/client/analytics/call-volume${dateParams}`).then((r) => r.json()),
    refetchInterval: 30000,
  })

  const { data: heatmapRaw } = useQuery({
    queryKey: ['client-heatmap'],
    queryFn: () => fetch('/api/client/analytics/call-volume?mode=heatmap').then((r) => r.json()),
    refetchInterval: 30000,
  })

  const { data: agentComparison } = useQuery({
    queryKey: ['client-agents-compare', datePreset],
    queryFn: () => fetch(`/api/client/analytics/agent-comparison${dateParams}`).then((r) => r.json()),
    refetchInterval: 30000,
  })

  const { data: leadStats } = useQuery({
    queryKey: ['client-lead-stats'],
    queryFn: () => fetch('/api/client/analytics/lead-stats').then((r) => r.json()),
    refetchInterval: 30000,
  })

  const volume = volumeRaw?.data ?? []
  const heatmap = heatmapRaw?.data ?? []

  // --- CSV export ---
  function exportAgentCSV() {
    if (!agentComparison?.length) return
    const header = 'Agent,Calls,Successful,Success Rate,Avg Duration'
    const rows = agentComparison.map((a: any) =>
      [a.name, a.totalCalls, a.successfulCalls, `${a.successRate}%`, `${a.avgDuration}s`].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'agent-comparison.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* ---- 1. Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold text-foreground">Analytics</h2>
        <div className="flex flex-wrap gap-1.5">
          {DATE_PRESETS.map((p) => (
            <Button
              key={p.value}
              size="sm"
              variant={datePreset === p.value ? 'default' : 'outline'}
              onClick={() => setDatePreset(p.value)}
              className="text-xs"
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ---- 2. KPI Row ---- */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg animate-pulse bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Calls" value={stats?.totalCalls ?? 0} />
          <StatCard label="Successful" value={stats?.successfulCalls ?? 0} />
          <StatCard label="Success Rate" value={`${stats?.successRate ?? 0}%`} />
          <StatCard label="Avg Duration" value={formatDuration(stats?.avgDuration)} />
        </div>
      )}

      {/* ---- 3. Lead Pipeline Row ---- */}
      {leadStats && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Lead Pipeline</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <Card className="shadow-none border-l-4 border-l-foreground/20">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground mb-1">Total Leads</p>
                <p className="text-xl font-bold">{leadStats.total ?? 0}</p>
              </CardContent>
            </Card>
            {(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'] as const).map((status) => (
              <Card key={status} className={`shadow-none border-l-4 ${LEAD_COLORS[status]}`}>
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1 capitalize">{status.toLowerCase()}</p>
                  <p className="text-xl font-bold">{leadStats.byStatus?.[status] ?? 0}</p>
                </CardContent>
              </Card>
            ))}
            <Card className="shadow-none border-l-4 border-l-emerald-400">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground mb-1">Conversion</p>
                <p className="text-xl font-bold">{leadStats.conversionRate ?? 0}%</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ---- 4. Charts Row 1 ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {outcomes ? <OutcomeChart data={outcomes} /> : <ChartSkeleton />}
        {volume.length > 0 ? <VolumeBarChart data={volume} /> : <ChartSkeleton />}
      </div>

      {/* ---- 5. Charts Row 2 ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {volume.length > 0 ? <SuccessRateTrend data={volume} /> : <ChartSkeleton />}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Call Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            {heatmap.length > 0 ? <HeatmapChart data={heatmap} /> : <ChartSkeleton />}
          </CardContent>
        </Card>
      </div>

      {/* ---- 6. Agent Comparison Table ---- */}
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base">Agent Comparison</CardTitle>
          <Button size="sm" variant="outline" onClick={exportAgentCSV} disabled={!agentComparison?.length}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Agent</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Calls</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Successful</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right min-w-[140px]">Success Rate</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                {(agentComparison ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No agent data available
                    </td>
                  </tr>
                ) : (
                  (agentComparison ?? []).map((agent: any) => (
                    <tr key={agent.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 font-medium">{agent.name}</td>
                      <td className="py-3 text-right tabular-nums">{agent.totalCalls}</td>
                      <td className="py-3 text-right tabular-nums">{agent.successfulCalls}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${Math.min(agent.successRate ?? 0, 100)}%` }}
                            />
                          </div>
                          <span className="tabular-nums text-xs w-10 text-right">{agent.successRate ?? 0}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-right tabular-nums">{formatDuration(agent.avgDuration)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
