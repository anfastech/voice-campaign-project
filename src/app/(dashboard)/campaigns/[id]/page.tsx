'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { CampaignStatusBadge } from '@/components/campaigns/CampaignStatusBadge'
import { TranscriptModal } from '@/components/calls/TranscriptModal'
import {
  ArrowLeft, Play, Pause, Phone, CheckCircle, XCircle, DollarSign, PhoneOff, Ban, Users, FileText, Sparkles, RefreshCw
} from 'lucide-react'
import { formatCurrency, formatDuration, formatDate } from '@/lib/utils'

const callStatusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  COMPLETED:   { bg: 'oklch(0.55 0.215 163 / 12%)', text: 'oklch(0.45 0.215 163)', dot: 'oklch(0.55 0.215 163)', label: 'Completed' },
  FAILED:      { bg: 'oklch(0.59 0.245 15 / 10%)',  text: 'oklch(0.52 0.245 15)',  dot: 'oklch(0.59 0.245 15)',  label: 'Failed' },
  IN_PROGRESS: { bg: 'oklch(0.49 0.263 281 / 8%)',  text: 'oklch(0.49 0.263 281)', dot: 'oklch(0.49 0.263 281)', label: 'In Progress' },
  NO_ANSWER:   { bg: 'oklch(0.72 0.18 68 / 10%)',   text: 'oklch(0.55 0.18 68)',   dot: 'oklch(0.72 0.18 68)',   label: 'No Answer' },
  INITIATED:   { bg: 'oklch(0.6 0.015 285 / 8%)',   text: 'oklch(0.52 0.015 285)', dot: 'oklch(0.6 0.015 285)', label: 'Initiated' },
  BUSY:        { bg: 'oklch(0.6 0.19 220 / 10%)',   text: 'oklch(0.5 0.19 220)',   dot: 'oklch(0.6 0.19 220)',  label: 'Busy' },
  CANCELLED:   { bg: 'oklch(0.59 0.245 15 / 8%)',   text: 'oklch(0.52 0.245 15)',  dot: 'oklch(0.59 0.245 15)', label: 'Cancelled' },
}

const contactStatusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PENDING:     { bg: 'oklch(0.6 0.015 285 / 8%)',   text: 'oklch(0.52 0.015 285)', dot: 'oklch(0.6 0.015 285)', label: 'Pending' },
  CALLING:     { bg: 'oklch(0.49 0.263 281 / 8%)',  text: 'oklch(0.49 0.263 281)', dot: 'oklch(0.49 0.263 281)', label: 'Calling' },
  COMPLETED:   { bg: 'oklch(0.55 0.215 163 / 12%)', text: 'oklch(0.45 0.215 163)', dot: 'oklch(0.55 0.215 163)', label: 'Completed' },
  FAILED:      { bg: 'oklch(0.59 0.245 15 / 10%)',  text: 'oklch(0.52 0.245 15)',  dot: 'oklch(0.59 0.245 15)',  label: 'Failed' },
  SKIPPED:     { bg: 'oklch(0.6 0.015 285 / 8%)',   text: 'oklch(0.52 0.015 285)', dot: 'oklch(0.6 0.015 285)', label: 'Skipped' },
  NO_ANSWER:   { bg: 'oklch(0.72 0.18 68 / 10%)',   text: 'oklch(0.55 0.18 68)',   dot: 'oklch(0.72 0.18 68)',   label: 'No Answer' },
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const initialSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => fetch(`/api/campaigns/${id}`).then((r) => r.json()),
    refetchInterval: 5000,
  })

  const startMutation = useMutation({
    mutationFn: () => fetch(`/api/campaigns/${id}/start`, { method: 'POST' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
      // Fire first sync 5s after starting
      if (initialSyncRef.current) clearTimeout(initialSyncRef.current)
      initialSyncRef.current = setTimeout(() => {
        syncMutation.mutate()
      }, 5000)
    },
  })

  const pauseMutation = useMutation({
    mutationFn: () => fetch(`/api/campaigns/${id}/pause`, { method: 'POST' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign', id] }),
  })

  const cancelMutation = useMutation({
    mutationFn: () => fetch(`/api/campaigns/${id}/cancel`, { method: 'POST' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign', id] }),
  })

  const syncMutation = useMutation({
    mutationFn: () => fetch(`/api/campaigns/${id}/sync`, { method: 'POST' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign', id] }),
  })

  const [selectedCall, setSelectedCall] = useState<any>(null)

  const completedCalls = campaign?.completedCalls ?? 0
  const { data: insightsData, isLoading: insightsLoading, refetch: refetchInsights } = useQuery({
    queryKey: ['campaign-insights', id],
    queryFn: () => fetch(`/api/campaigns/${id}/summary`).then((r) => r.json()),
    enabled: completedCalls >= 2,
    staleTime: 60_000,
  })

  // Auto-sync polling when campaign is RUNNING
  useEffect(() => {
    if (campaign?.status === 'RUNNING') {
      syncTimerRef.current = setInterval(() => {
        syncMutation.mutate()
      }, 10_000)
    }

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current)
        syncTimerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.status, id])

  // Cleanup initial sync timer
  useEffect(() => {
    return () => {
      if (initialSyncRef.current) clearTimeout(initialSyncRef.current)
    }
  }, [])

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this campaign? This will skip all remaining contacts.')) {
      cancelMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl relative overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="absolute inset-0 shimmer" />
          </div>
          <div className="h-7 w-48 rounded-lg relative overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="absolute inset-0 shimmer" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl relative overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="absolute inset-0 shimmer" />
            </div>
          ))}
        </div>
        <div className="h-32 rounded-2xl relative overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="absolute inset-0 shimmer" />
        </div>
        <div className="h-64 rounded-2xl relative overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="absolute inset-0 shimmer" />
        </div>
      </div>
    )
  }

  if (!campaign || campaign.error) {
    return (
      <div className="text-center py-20">
        <p style={{ color: 'var(--muted-foreground)' }}>Campaign not found.</p>
        <button
          className="mt-4 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          onClick={() => router.back()}
        >
          Go Back
        </button>
      </div>
    )
  }

  const progress = campaign.totalContacts > 0
    ? (campaign.completedCalls / campaign.totalContacts) * 100
    : 0

  const noAnswerCount = campaign.contacts?.filter((cc: any) => cc.status === 'NO_ANSWER').length ?? 0

  const statCards = [
    {
      label: 'Total Contacts',
      value: campaign.totalContacts,
      icon: Phone,
      iconBg: 'oklch(0.49 0.263 281 / 12%)',
      iconColor: 'oklch(0.49 0.263 281)',
      valueColor: 'oklch(0.49 0.263 281)',
    },
    {
      label: 'Successful',
      value: campaign.successfulCalls,
      icon: CheckCircle,
      iconBg: 'oklch(0.55 0.215 163 / 12%)',
      iconColor: 'oklch(0.55 0.215 163)',
      valueColor: 'oklch(0.55 0.215 163)',
    },
    {
      label: 'Failed',
      value: campaign.failedCalls,
      icon: XCircle,
      iconBg: 'oklch(0.59 0.245 15 / 10%)',
      iconColor: 'oklch(0.59 0.245 15)',
      valueColor: 'oklch(0.59 0.245 15)',
    },
    {
      label: 'No Answer',
      value: noAnswerCount,
      icon: PhoneOff,
      iconBg: 'oklch(0.72 0.18 68 / 10%)',
      iconColor: 'oklch(0.55 0.18 68)',
      valueColor: 'oklch(0.55 0.18 68)',
    },
    {
      label: 'Total Cost',
      value: formatCurrency(campaign.totalCost),
      icon: DollarSign,
      iconBg: 'oklch(0.65 0.22 310 / 10%)',
      iconColor: 'oklch(0.65 0.22 310)',
      valueColor: 'oklch(0.65 0.22 310)',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 flex-shrink-0"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{campaign.name}</h1>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            {campaign.description && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{campaign.description}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {/* Cancel button */}
          {(campaign.status === 'RUNNING' || campaign.status === 'PAUSED' || campaign.status === 'DRAFT') && (
            <button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-60"
              style={{
                background: 'oklch(0.59 0.245 15 / 8%)',
                border: '1px solid oklch(0.59 0.245 15 / 20%)',
                color: 'oklch(0.52 0.245 15)',
              }}
            >
              <Ban className="w-3.5 h-3.5" />
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
            </button>
          )}

          {campaign.status === 'RUNNING' ? (
            <button
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-60"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              <Pause className="w-3.5 h-3.5" /> Pause
            </button>
          ) : campaign.status !== 'COMPLETED' && campaign.status !== 'CANCELLED' ? (
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, oklch(0.55 0.215 163), oklch(0.65 0.19 150))',
                boxShadow: '0 4px 14px oklch(0.55 0.215 163 / 30%)',
              }}
            >
              <Play className="w-3.5 h-3.5" />
              {startMutation.isPending ? 'Starting...' : campaign.status === 'PAUSED' ? 'Retry' : 'Start'}
            </button>
          ) : null}
        </div>
      </div>

      {/* Retry Banner */}
      {campaign.status === 'PAUSED' && noAnswerCount > 0 && (
        <div
          className="rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{
            background: 'oklch(0.72 0.18 68 / 8%)',
            border: '1px solid oklch(0.72 0.18 68 / 20%)',
          }}
        >
          <PhoneOff className="w-4 h-4 flex-shrink-0" style={{ color: 'oklch(0.55 0.18 68)' }} />
          <p className="text-sm" style={{ color: 'oklch(0.45 0.18 68)' }}>
            <span className="font-semibold">{noAnswerCount} contact{noAnswerCount !== 1 ? 's' : ''}</span> did not respond — Click <strong>Retry</strong> to re-call.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map(({ label, value, icon: Icon, iconBg, iconColor, valueColor }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: iconBg }}>
                <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
              </div>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: valueColor }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Progress</p>
          <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
            {campaign.completedCalls} / {campaign.totalContacts} calls
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, oklch(0.55 0.215 163), oklch(0.65 0.19 150))',
            }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
          {Math.round(progress)}% complete
        </p>
      </div>

      {/* Campaign Insights */}
      {completedCalls >= 2 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: 'oklch(0.65 0.22 310)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Campaign Insights</p>
            </div>
            <button
              onClick={() => refetchInsights()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
          {insightsLoading ? (
            <div className="h-16 rounded-xl relative overflow-hidden" style={{ background: 'var(--muted)' }}>
              <div className="absolute inset-0 shimmer" />
            </div>
          ) : insightsData?.summary ? (
            <div
              className="rounded-xl p-4 text-sm leading-relaxed"
              style={{
                background: 'oklch(0.65 0.22 310 / 6%)',
                border: '1px solid oklch(0.65 0.22 310 / 15%)',
                color: 'var(--foreground)',
              }}
            >
              {insightsData.summary}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Not enough calls with summaries to generate insights yet.
            </p>
          )}
        </div>
      )}

      {/* Contact Status Table */}
      {campaign.contacts?.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <Users className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Contact Status</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--muted)' }}>
                  {['Name', 'Phone', 'Status', 'Attempts'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaign.contacts.map((cc: any, idx: number) => {
                  const cfg = contactStatusConfig[cc.status] || contactStatusConfig.PENDING
                  return (
                    <tr
                      key={cc.id}
                      className="transition-colors duration-150"
                      style={{
                        borderBottom: idx < campaign.contacts.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'oklch(0.5 0 0 / 3%)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                          {cc.contact?.name || 'Unknown'}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        {cc.contact?.phoneNumber || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                          style={{ background: cfg.bg, color: cfg.text }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        {cc.attempts}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Call History Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Call History</p>
        </div>

        {campaign.calls?.length === 0 ? (
          <div className="text-center py-12">
            <Phone className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No calls yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--muted)' }}>
                  {['Contact', 'Status', 'Duration', 'Cost', 'Started'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaign.calls?.map((call: any, idx: number) => {
                  const cfg = callStatusConfig[call.status] || callStatusConfig.INITIATED
                  return (
                    <tr
                      key={call.id}
                      className="transition-colors duration-150 cursor-pointer"
                      style={{
                        borderBottom: idx < campaign.calls.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                      onClick={() => setSelectedCall({
                        ...call,
                        agent: { name: campaign.agent?.name || 'AI Agent' },
                        campaign: { name: campaign.name },
                      })}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'oklch(0.5 0 0 / 3%)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                              {call.contact?.name || call.phoneNumber}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{call.phoneNumber}</p>
                          </div>
                          {call.transcript && (
                            <FileText className="w-3.5 h-3.5 flex-shrink-0 opacity-40" style={{ color: 'var(--muted-foreground)' }} />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                          style={{ background: cfg.bg, color: cfg.text }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        {formatDuration(call.duration)}
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        {call.cost ? formatCurrency(call.cost) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {formatDate(call.startedAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TranscriptModal call={selectedCall} onClose={() => setSelectedCall(null)} />
    </div>
  )
}
