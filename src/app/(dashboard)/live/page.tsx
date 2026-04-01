'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Radio,
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneMissed,
  Clock,
  Users,
  Megaphone,
  Activity,
  Zap,
  Bot,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wifi,
} from 'lucide-react'
import { formatDuration, formatPhoneNumber } from '@/lib/utils'

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string; icon: React.ElementType }> = {
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'oklch(0.55 0.215 163 / 12%)',
    text: 'oklch(0.45 0.215 163)',
    dot: 'oklch(0.55 0.215 163)',
    icon: PhoneCall,
  },
  RINGING: {
    label: 'Ringing',
    bg: 'oklch(0.49 0.263 281 / 12%)',
    text: 'oklch(0.49 0.263 281)',
    dot: 'oklch(0.68 0.22 281)',
    icon: Phone,
  },
  INITIATED: {
    label: 'Initiated',
    bg: 'oklch(0.6 0.19 220 / 12%)',
    text: 'oklch(0.5 0.19 220)',
    dot: 'oklch(0.6 0.19 220)',
    icon: Phone,
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'oklch(0.55 0.215 163 / 12%)',
    text: 'oklch(0.45 0.215 163)',
    dot: 'oklch(0.55 0.215 163)',
    icon: CheckCircle2,
  },
  FAILED: {
    label: 'Failed',
    bg: 'oklch(0.59 0.245 15 / 12%)',
    text: 'oklch(0.52 0.245 15)',
    dot: 'oklch(0.59 0.245 15)',
    icon: XCircle,
  },
  NO_ANSWER: {
    label: 'No Answer',
    bg: 'oklch(0.72 0.18 68 / 12%)',
    text: 'oklch(0.55 0.18 68)',
    dot: 'oklch(0.72 0.18 68)',
    icon: PhoneMissed,
  },
  BUSY: {
    label: 'Busy',
    bg: 'oklch(0.6 0.19 220 / 12%)',
    text: 'oklch(0.5 0.19 220)',
    dot: 'oklch(0.6 0.19 220)',
    icon: PhoneOff,
  },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || {
    label: status,
    bg: 'oklch(0.5 0.015 285 / 8%)',
    text: 'oklch(0.45 0.015 285)',
    dot: 'oklch(0.5 0.015 285)',
    icon: Phone,
  }
  const isLive = ['IN_PROGRESS', 'RINGING'].includes(status)

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span
        className={isLive ? 'live-dot w-1.5 h-1.5 rounded-full flex-shrink-0' : 'w-1.5 h-1.5 rounded-full flex-shrink-0'}
        style={{ background: cfg.dot }}
      />
      {cfg.label}
    </span>
  )
}

function LiveStatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType
  label: string
  value: number | string
  color: string
}) {
  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color.replace(')', ' / 12%)')}` }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-bold tabular-nums leading-tight" style={{ color: 'var(--foreground)' }}>
          {value}
        </p>
        <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="px-5 py-4 flex items-center gap-4">
      <div className="w-9 h-9 rounded-xl shimmer" style={{ background: 'var(--muted)' }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-32 rounded shimmer" style={{ background: 'var(--muted)' }} />
        <div className="h-2 w-48 rounded shimmer" style={{ background: 'var(--muted)' }} />
      </div>
    </div>
  )
}

export default function LiveMonitorPage() {
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['live-monitor'],
    queryFn: async () => {
      const res = await fetch('/api/live')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    refetchInterval: 3000, // Poll every 3 seconds
    retry: 2,
  })

  const activeCalls = data?.activeCalls ?? []
  const recentCalls = data?.recentCalls ?? []
  const runningCampaigns = data?.runningCampaigns ?? []
  const queuedContacts = data?.queuedContacts ?? 0

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    : '—'

  return (
    <div className="space-y-6">
      {/* Live indicator header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, oklch(0.55 0.215 163), oklch(0.65 0.19 150))',
              boxShadow: '0 4px 16px oklch(0.55 0.215 163 / 30%)',
            }}
          >
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Live Monitor</h2>
              <span className="live-dot w-2 h-2 rounded-full inline-block" style={{ background: '#34d399' }} />
            </div>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Auto-refreshing every 3s · Last update: {lastUpdate}
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: 'oklch(0.55 0.215 163 / 10%)', color: 'oklch(0.45 0.215 163)' }}
        >
          <Wifi className="w-3 h-3" />
          Connected
        </div>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <LiveStatCard
          icon={PhoneCall}
          label="Active Calls"
          value={activeCalls.length}
          color="oklch(0.55 0.215 163)"
        />
        <LiveStatCard
          icon={Megaphone}
          label="Running Campaigns"
          value={runningCampaigns.length}
          color="oklch(0.49 0.263 281)"
        />
        <LiveStatCard
          icon={Users}
          label="Queued Contacts"
          value={queuedContacts}
          color="oklch(0.6 0.19 220)"
        />
        <LiveStatCard
          icon={Activity}
          label="Recent (5min)"
          value={recentCalls.length}
          color="oklch(0.72 0.18 68)"
        />
      </div>

      {/* Active Calls */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'oklch(0.55 0.215 163 / 12%)' }}
            >
              <PhoneCall className="w-3.5 h-3.5" style={{ color: 'oklch(0.55 0.215 163)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Active Calls</p>
              <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                {activeCalls.length} call{activeCalls.length !== 1 ? 's' : ''} in progress
              </p>
            </div>
          </div>
          <span className="live-dot w-2 h-2 rounded-full" style={{ background: activeCalls.length > 0 ? '#34d399' : 'var(--muted-foreground)' }} />
        </div>

        {isLoading ? (
          <div>{[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : activeCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'oklch(0.55 0.215 163 / 8%)' }}
            >
              <Phone className="w-5 h-5" style={{ color: 'oklch(0.55 0.215 163)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>No active calls</p>
            <p className="text-xs mt-1" style={{ color: 'oklch(0.52 0.02 285)' }}>
              Active calls will appear here in real-time
            </p>
          </div>
        ) : (
          <div>
            {activeCalls.map((call: any, idx: number) => {
              const elapsed = call.startedAt ? Math.floor((Date.now() - new Date(call.startedAt).getTime()) / 1000) : 0
              return (
                <div
                  key={call.id}
                  className="flex items-center gap-4 px-5 py-3.5"
                  style={{ borderBottom: idx < activeCalls.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, oklch(0.55 0.215 163), oklch(0.65 0.19 150))',
                    }}
                  >
                    <PhoneCall className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                        {call.contact?.name || formatPhoneNumber(call.phoneNumber)}
                      </p>
                      <StatusBadge status={call.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {call.agent && (
                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                          <Bot className="w-3 h-3" /> {call.agent.name}
                        </span>
                      )}
                      {call.campaign && (
                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                          <Megaphone className="w-3 h-3" /> {call.campaign.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold tabular-nums" style={{ color: 'oklch(0.55 0.215 163)' }}>
                      {formatDuration(elapsed)}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>elapsed</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Running campaigns + Recent calls side by side */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Running Campaigns */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'oklch(0.49 0.263 281 / 12%)' }}
              >
                <Megaphone className="w-3.5 h-3.5" style={{ color: 'oklch(0.49 0.263 281)' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Running Campaigns</p>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'oklch(0.49 0.263 281 / 10%)', color: 'oklch(0.49 0.263 281)' }}>
              {runningCampaigns.length}
            </span>
          </div>

          {runningCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Megaphone className="w-6 h-6 mb-2" style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No campaigns running</p>
            </div>
          ) : (
            <div>
              {runningCampaigns.map((campaign: any, idx: number) => {
                const progress = campaign._count.contacts > 0
                  ? Math.round((campaign.completedCalls / campaign._count.contacts) * 100)
                  : 0
                return (
                  <div
                    key={campaign.id}
                    className="px-5 py-3.5"
                    style={{ borderBottom: idx < runningCampaigns.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                        {campaign.name}
                      </p>
                      <span className="text-xs font-semibold tabular-nums" style={{ color: 'oklch(0.49 0.263 281)' }}>
                        {progress}%
                      </span>
                    </div>
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden mb-1.5"
                      style={{ background: 'var(--border)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          background: 'linear-gradient(to right, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                      <span>{campaign._count.calls} calls</span>
                      <span>{campaign._count.contacts} contacts</span>
                      {campaign.agent && <span>Agent: {campaign.agent.name}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Calls Feed */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'oklch(0.72 0.18 68 / 12%)' }}
              >
                <Clock className="w-3.5 h-3.5" style={{ color: 'oklch(0.72 0.18 68)' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Recent Calls</p>
            </div>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Last 5 min</span>
          </div>

          {recentCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Phone className="w-6 h-6 mb-2" style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No recent calls</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {recentCalls.map((call: any, idx: number) => (
                <div
                  key={call.id}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ borderBottom: idx < recentCalls.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: statusConfig[call.status]?.bg || 'var(--muted)',
                    }}
                  >
                    {(() => {
                      const Icon = statusConfig[call.status]?.icon || Phone
                      return <Icon className="w-3.5 h-3.5" style={{ color: statusConfig[call.status]?.text || 'var(--muted-foreground)' }} />
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>
                      {call.contact?.name || call.contact?.phoneNumber || 'Unknown'}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                      {call.agent?.name} · {call.duration ? formatDuration(call.duration) : '—'}
                    </p>
                  </div>
                  <StatusBadge status={call.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
