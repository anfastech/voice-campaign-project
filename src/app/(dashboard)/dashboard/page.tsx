'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo, useCallback } from 'react'
import { Phone, Megaphone, Users, TrendingUp, Zap, Plus, Bot, Upload, ArrowRight, Activity, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { formatCurrency } from '@/lib/utils'

const CallChart = dynamic(
  () => import('@/components/dashboard/CallChart').then((m) => m.CallChart),
  { ssr: false, loading: () => (
    <div className="rounded-2xl h-[380px] relative overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="absolute inset-0 shimmer" />
    </div>
  )}
)

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-5 h-28 relative overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="absolute inset-0 shimmer" />
    </div>
  )
}

const quickActions = [
  {
    href: '/campaigns/new',
    label: 'New Campaign',
    icon: Plus,
    gradient: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.58 0.24 300))',
    glow: 'oklch(0.49 0.263 281 / 30%)',
  },
  {
    href: '/agents/new',
    label: 'New AI Agent',
    icon: Bot,
    gradient: 'linear-gradient(135deg, oklch(0.6 0.19 220), oklch(0.7 0.17 235))',
    glow: 'oklch(0.6 0.19 220 / 25%)',
  },
  {
    href: '/contacts',
    label: 'Import Contacts',
    icon: Upload,
    gradient: 'linear-gradient(135deg, oklch(0.55 0.215 163), oklch(0.65 0.19 150))',
    glow: 'oklch(0.55 0.215 163 / 25%)',
  },
]

interface ProviderHealth {
  name: string
  configured: boolean
  latency: string
  pct: number
}

function useProviderHealth(): ProviderHealth[] {
  const { data } = useQuery({
    queryKey: ['provider-health'],
    queryFn: async () => {
      const res = await fetch('/api/providers/health')
      if (!res.ok) return null
      return res.json()
    },
    refetchInterval: 60000,
    retry: 1,
  })
  if (Array.isArray(data)) return data
  return [
    { name: 'Ultravox', configured: false, latency: '—', pct: 0 },
    { name: 'ElevenLabs', configured: false, latency: '—', pct: 0 },
    { name: 'VAPI', configured: false, latency: '—', pct: 0 },
  ]
}

function HeroBanner({ stats }: { stats: any }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at top right, oklch(0.49 0.263 281 / 12%) 0%, transparent 60%), radial-gradient(ellipse at bottom left, oklch(0.6 0.19 220 / 8%) 0%, transparent 55%)',
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310), oklch(0.6 0.19 220))',
        }}
      />

      <div className="relative p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="live-dot w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: '#34d399' }}
            />
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'oklch(0.55 0.215 163)' }}
            >
              Platform Active
            </span>
          </div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            {greeting} 👋
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {stats
              ? `${stats.activeCampaigns ?? 0} active campaign${stats.activeCampaigns !== 1 ? 's' : ''} · ${stats.todayCalls ?? 0} calls today`
              : "Here's an overview of your voice campaigns."}
          </p>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden md:flex items-center gap-5">
            {[
              { label: 'Campaigns', value: stats?.activeCampaigns ?? '—', color: 'oklch(0.49 0.263 281)' },
              { label: 'Success Rate', value: stats ? `${stats.successRate ?? 0}%` : '—', color: 'oklch(0.55 0.215 163)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
              </div>
            ))}
          </div>

          <Link
            href="/campaigns/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.58 0.24 300))',
              boxShadow: '0 4px 16px oklch(0.49 0.263 281 / 35%)',
            }}
          >
            <Zap className="w-3.5 h-3.5" />
            Launch Campaign
          </Link>
        </div>
      </div>
    </div>
  )
}

function ProviderStatusPanel() {
  const providers = useProviderHealth()
  const allOnline = providers.every((p) => p.configured)
  const onlineCount = providers.filter((p) => p.configured).length

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'oklch(0.55 0.215 163 / 12%)' }}
          >
            <Activity className="w-3.5 h-3.5" style={{ color: 'oklch(0.55 0.215 163)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>AI Provider Status</p>
            <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              {allOnline ? 'All systems operational' : `${onlineCount}/${providers.length} providers configured`}
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: allOnline ? 'oklch(0.55 0.215 163 / 10%)' : 'oklch(0.72 0.18 68 / 10%)',
            color: allOnline ? 'oklch(0.45 0.215 163)' : 'oklch(0.55 0.18 68)',
          }}
        >
          <CheckCircle2 className="w-3 h-3" />
          {allOnline ? 'All Online' : `${onlineCount} Online`}
        </div>
      </div>

      <div className="p-4 grid grid-cols-3 gap-3">
        {providers.map(({ name, latency, pct, configured }) => (
          <div
            key={name}
            className="rounded-xl p-3 text-center"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-center gap-1 mb-2">
              <span
                className={configured ? 'live-dot w-1.5 h-1.5 rounded-full inline-block' : 'w-1.5 h-1.5 rounded-full inline-block'}
                style={{ background: configured ? '#34d399' : 'var(--muted-foreground)' }}
              />
              <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                {name}
              </span>
            </div>
            <div
              className="w-full h-1 rounded-full mb-1.5 overflow-hidden"
              style={{ background: 'var(--border)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: configured
                    ? 'linear-gradient(to right, oklch(0.49 0.263 281), oklch(0.65 0.22 310))'
                    : 'var(--muted-foreground)',
                }}
              />
            </div>
            <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
              {configured ? `${latency} avg` : 'Not configured'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickActionsPanel() {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <p className="text-sm font-semibold mb-3 px-1" style={{ color: 'var(--foreground)' }}>
        Quick Actions
      </p>
      <div className="space-y-2">
        {quickActions.map(({ href, label, icon: Icon, gradient, glow }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group"
            style={{ background: 'var(--muted)' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'oklch(0.49 0.263 281 / 6%)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'var(--muted)'
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
              style={{ background: gradient, boxShadow: `0 4px 12px ${glow}` }}
            >
              <Icon className="w-3.5 h-3.5 text-white" />
            </div>
            <span
              className="text-sm font-medium flex-1"
              style={{ color: 'var(--foreground)' }}
            >
              {label}
            </span>
            <ArrowRight
              className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--muted-foreground)' }}
            />
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: rawStats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
    refetchInterval: 15000,
    retry: 2,
  })
  const stats = useMemo(() => (rawStats && !rawStats.error ? rawStats : null), [rawStats])

  const { data: rawChartData } = useQuery({
    queryKey: ['dashboard-chart'],
    queryFn: () => fetch('/api/dashboard/chart').then((r) => r.json()),
    refetchInterval: 60000,
  })
  const chartData = useMemo(() => (Array.isArray(rawChartData) ? rawChartData : []), [rawChartData])

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div
          className="rounded-2xl h-36 relative overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="absolute inset-0 shimmer" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div
          className="h-80 rounded-2xl relative overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="absolute inset-0 shimmer" />
        </div>
      </div>
    )
  }

  if (statsError) {
    return (
      <div className="space-y-5">
        <HeroBanner stats={null} />
        <div
          className="rounded-2xl p-5 text-sm flex items-start gap-3"
          style={{
            background: 'oklch(0.59 0.245 15 / 6%)',
            border: '1px solid oklch(0.59 0.245 15 / 25%)',
          }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'oklch(0.59 0.245 15)' }} />
          <div>
            <p className="font-semibold" style={{ color: 'oklch(0.52 0.245 15)' }}>Database not connected</p>
            <p className="mt-1" style={{ color: 'oklch(0.52 0.245 15)' }}>
              Set <code className="font-mono bg-black/10 px-1 rounded">DATABASE_URL</code> in{' '}
              <code className="font-mono bg-black/10 px-1 rounded">.env.local</code> and run{' '}
              <code className="font-mono bg-black/10 px-1 rounded">npx prisma db push</code>.
            </p>
          </div>
        </div>
        <ProviderStatusPanel />
        <QuickActionsPanel />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <HeroBanner stats={stats} />

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Calls Today"
          value={stats?.todayCalls ?? 0}
          subtitle={`${stats?.totalCalls ?? 0} all-time calls`}
          icon={Phone}
          color="violet"
          trend={12}
        />
        <StatsCard
          title="Active Campaigns"
          value={stats?.activeCampaigns ?? 0}
          subtitle="Currently running"
          icon={Megaphone}
          color="sky"
        />
        <StatsCard
          title="Success Rate"
          value={`${stats?.successRate ?? 0}%`}
          subtitle={`${stats?.todaySuccessful ?? 0} successful today`}
          icon={TrendingUp}
          color="emerald"
          trend={3}
        />
        <StatsCard
          title="Cost Today"
          value={formatCurrency(stats?.todayCost ?? 0)}
          subtitle={`${stats?.totalContacts ?? 0} total contacts`}
          icon={Users}
          color="amber"
        />
      </div>

      {/* Chart + right column */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <CallChart data={chartData} />
        </div>
        <div className="space-y-5">
          <ProviderStatusPanel />
          <QuickActionsPanel />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity calls={stats?.recentCalls ?? []} />
    </div>
  )
}
