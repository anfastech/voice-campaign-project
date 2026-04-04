'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Radio, Phone, PhoneCall, PhoneOff, PhoneMissed, Clock,
  Users, Megaphone, Activity, Bot, CheckCircle2, XCircle, Wifi,
} from 'lucide-react'
import { formatDuration, formatPhoneNumber } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const statusStyles: Record<string, { label: string; className: string }> = {
  IN_PROGRESS: { label: 'In Progress', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  RINGING: { label: 'Ringing', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  INITIATED: { label: 'Initiated', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  FAILED: { label: 'Failed', className: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  NO_ANSWER: { label: 'No Answer', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  BUSY: { label: 'Busy', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
}

const statusIcons: Record<string, React.ElementType> = {
  IN_PROGRESS: PhoneCall, RINGING: Phone, INITIATED: Phone,
  COMPLETED: CheckCircle2, FAILED: XCircle, NO_ANSWER: PhoneMissed, BUSY: PhoneOff,
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
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">Live Monitor</h2>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Auto-refreshing every 3s · Last update: {lastUpdate}
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-200 dark:border-emerald-800">
          <Wifi className="w-3 h-3" /> Connected
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Calls', value: activeCalls.length, icon: PhoneCall },
          { label: 'Running Campaigns', value: runningCampaigns.length, icon: Megaphone },
          { label: 'Queued Contacts', value: queuedContacts, icon: Users },
          { label: 'Recent (5min)', value: recentCalls.length, icon: Activity },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="shadow-none">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <Icon className="w-4 h-4 text-muted-foreground/60" />
                </div>
                <p className="text-2xl font-bold tabular-nums text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Active Calls */}
      <Card className="shadow-none">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Active Calls</CardTitle>
            <p className="text-xs text-muted-foreground">
              {activeCalls.length} call{activeCalls.length !== 1 ? 's' : ''} in progress
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg animate-pulse bg-muted" />
              ))}
            </div>
          ) : activeCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Phone className="w-8 h-8 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No active calls</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Active calls will appear here in real-time</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Contact</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Status</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Agent</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Campaign</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Elapsed</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCalls.map((call: any) => {
                    const elapsed = call.startedAt ? Math.floor((Date.now() - new Date(call.startedAt).getTime()) / 1000) : 0
                    const cfg = statusStyles[call.status] || statusStyles.INITIATED
                    return (
                      <tr key={call.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{call.contact?.name || formatPhoneNumber(call.phoneNumber)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${cfg.className}`}>
                            {['IN_PROGRESS', 'RINGING'].includes(call.status) && (
                              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                            )}
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {call.agent ? (
                            <span className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" />{call.agent.name}</span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {call.campaign ? (
                            <span className="flex items-center gap-1.5"><Megaphone className="w-3.5 h-3.5" />{call.campaign.name}</span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold tabular-nums text-foreground">{formatDuration(elapsed)}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Running Campaigns + Recent Calls */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Running Campaigns */}
        <Card className="shadow-none">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Running Campaigns</CardTitle>
              <Badge variant="secondary" className="text-xs tabular-nums">{runningCampaigns.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {runningCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Megaphone className="w-8 h-8 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">No campaigns running</p>
              </div>
            ) : (
              <div className="space-y-4">
                {runningCampaigns.map((campaign: any) => {
                  const progress = campaign._count.contacts > 0
                    ? Math.round((campaign.completedCalls / campaign._count.contacts) * 100)
                    : 0
                  return (
                    <div key={campaign.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-foreground truncate">{campaign.name}</p>
                        <span className="text-xs font-medium tabular-nums text-muted-foreground">{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-2">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{campaign._count.calls} calls</span>
                        <span>{campaign._count.contacts} contacts</span>
                        {campaign.agent && <span>{campaign.agent.name}</span>}
                      </div>
                      <Separator className="mt-4 last:hidden" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Calls */}
        <Card className="shadow-none">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Calls</CardTitle>
              <span className="text-xs text-muted-foreground">Last 5 min</span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {recentCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Clock className="w-8 h-8 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">No recent calls</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-1">
                {recentCalls.map((call: any) => {
                  const cfg = statusStyles[call.status] || statusStyles.INITIATED
                  return (
                    <div key={call.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">
                          {call.contact?.name || call.contact?.phoneNumber || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {call.agent?.name}{call.duration ? ` · ${formatDuration(call.duration)}` : ''}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium shrink-0 ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
