'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Radio, Phone, PhoneCall, PhoneOff, PhoneMissed, Clock,
  Users, Megaphone, Activity, Bot, CheckCircle2, XCircle, Wifi,
} from 'lucide-react'
import { formatDuration, formatPhoneNumber } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  IN_PROGRESS: { label: 'In Progress', variant: 'default', icon: PhoneCall },
  RINGING: { label: 'Ringing', variant: 'secondary', icon: Phone },
  INITIATED: { label: 'Initiated', variant: 'secondary', icon: Phone },
  COMPLETED: { label: 'Completed', variant: 'default', icon: CheckCircle2 },
  FAILED: { label: 'Failed', variant: 'destructive', icon: XCircle },
  NO_ANSWER: { label: 'No Answer', variant: 'outline', icon: PhoneMissed },
  BUSY: { label: 'Busy', variant: 'outline', icon: PhoneOff },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || { label: status, variant: 'secondary' as const, icon: Phone }
  const isLive = ['IN_PROGRESS', 'RINGING'].includes(status)

  return (
    <Badge variant={cfg.variant} className="gap-1.5 text-xs">
      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {cfg.label}
    </Badge>
  )
}

function StatCard({ icon: Icon, label, value, colorClass }: {
  icon: React.ElementType
  label: string
  value: number | string
  colorClass: string
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div>
          <p className="text-xl font-bold tabular-nums leading-tight text-foreground">{value}</p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
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
    refetchInterval: 3000,
    retry: 2,
  })

  const activeCalls = data?.activeCalls ?? []
  const recentCalls = data?.recentCalls ?? []
  const runningCampaigns = data?.runningCampaigns ?? []
  const queuedContacts = data?.queuedContacts ?? 0

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
      })
    : '—'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Radio className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">Live Monitor</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-refreshing every 3s · Last update: {lastUpdate}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-200">
          <Wifi className="w-3 h-3" /> Connected
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={PhoneCall} label="Active Calls" value={activeCalls.length} colorClass="bg-emerald-500/10 text-emerald-600" />
        <StatCard icon={Megaphone} label="Running Campaigns" value={runningCampaigns.length} colorClass="bg-purple-500/10 text-purple-600" />
        <StatCard icon={Users} label="Queued Contacts" value={queuedContacts} colorClass="bg-blue-500/10 text-blue-600" />
        <StatCard icon={Activity} label="Recent (5min)" value={recentCalls.length} colorClass="bg-amber-500/10 text-amber-600" />
      </div>

      {/* Active Calls */}
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-sm">Active Calls</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                {activeCalls.length} call{activeCalls.length !== 1 ? 's' : ''} in progress
              </p>
            </div>
          </div>
          <span className={`w-2 h-2 rounded-full ${activeCalls.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg animate-pulse bg-muted" />
              ))}
            </div>
          ) : activeCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No active calls</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Active calls will appear here in real-time</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activeCalls.map((call: any) => {
                const elapsed = call.startedAt ? Math.floor((Date.now() - new Date(call.startedAt).getTime()) / 1000) : 0
                return (
                  <div key={call.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                      <PhoneCall className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate text-foreground">
                          {call.contact?.name || formatPhoneNumber(call.phoneNumber)}
                        </p>
                        <StatusBadge status={call.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {call.agent && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Bot className="w-3 h-3" /> {call.agent.name}
                          </span>
                        )}
                        {call.campaign && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Megaphone className="w-3 h-3" /> {call.campaign.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums text-emerald-600">{formatDuration(elapsed)}</p>
                      <p className="text-[10px] text-muted-foreground">elapsed</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Running Campaigns + Recent Calls */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Running Campaigns */}
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Megaphone className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <CardTitle className="text-sm">Running Campaigns</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">{runningCampaigns.length}</Badge>
          </CardHeader>
          <CardContent className="pt-0">
            {runningCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Megaphone className="w-6 h-6 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">No campaigns running</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {runningCampaigns.map((campaign: any) => {
                  const progress = campaign._count.contacts > 0
                    ? Math.round((campaign.completedCalls / campaign._count.contacts) * 100)
                    : 0
                  return (
                    <div key={campaign.id} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium truncate text-foreground">{campaign.name}</p>
                        <span className="text-xs font-semibold tabular-nums text-purple-600">{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-1.5">
                        <div
                          className="h-full rounded-full bg-purple-500 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>{campaign._count.calls} calls</span>
                        <span>{campaign._count.contacts} contacts</span>
                        {campaign.agent && <span>Agent: {campaign.agent.name}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Calls */}
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <CardTitle className="text-sm">Recent Calls</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">Last 5 min</span>
          </CardHeader>
          <CardContent className="pt-0">
            {recentCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Phone className="w-6 h-6 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">No recent calls</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {recentCalls.map((call: any) => (
                  <div key={call.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      call.status === 'COMPLETED' ? 'bg-emerald-500/10' :
                      call.status === 'FAILED' ? 'bg-red-500/10' :
                      call.status === 'NO_ANSWER' ? 'bg-amber-500/10' : 'bg-muted'
                    }`}>
                      {(() => {
                        const Icon = statusConfig[call.status]?.icon || Phone
                        return <Icon className={`w-3.5 h-3.5 ${
                          call.status === 'COMPLETED' ? 'text-emerald-600' :
                          call.status === 'FAILED' ? 'text-red-600' :
                          call.status === 'NO_ANSWER' ? 'text-amber-600' : 'text-muted-foreground'
                        }`} />
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate text-foreground">
                        {call.contact?.name || call.contact?.phoneNumber || 'Unknown'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {call.agent?.name} · {call.duration ? formatDuration(call.duration) : '—'}
                      </p>
                    </div>
                    <StatusBadge status={call.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
