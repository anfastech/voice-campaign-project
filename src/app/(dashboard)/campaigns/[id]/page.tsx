'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { CampaignStatusBadge } from '@/components/campaigns/CampaignStatusBadge'
import {
  ArrowLeft, Play, Pause, Phone, CheckCircle, XCircle, DollarSign
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

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => fetch(`/api/campaigns/${id}`).then((r) => r.json()),
    refetchInterval: 5000,
  })

  const startMutation = useMutation({
    mutationFn: () => fetch(`/api/campaigns/${id}/start`, { method: 'POST' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign', id] }),
  })

  const pauseMutation = useMutation({
    mutationFn: () => fetch(`/api/campaigns/${id}/pause`, { method: 'POST' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign', id] }),
  })

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
              {startMutation.isPending ? 'Starting...' : 'Start'}
            </button>
          ) : null}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                      className="transition-colors duration-150"
                      style={{
                        borderBottom: idx < campaign.calls.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'oklch(0.5 0 0 / 3%)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                          {call.contact?.name || call.phoneNumber}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{call.phoneNumber}</p>
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
    </div>
  )
}
