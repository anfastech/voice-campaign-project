'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { CampaignStatusBadge } from '@/components/campaigns/CampaignStatusBadge'
import { Plus, Play, Pause, Trash2, ChevronRight, Megaphone, Sparkles } from 'lucide-react'
import { formatCurrency, calculateSuccessRate } from '@/lib/utils'

const statuses = ['all', 'DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'SCHEDULED']

export default function CampaignsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const queryClient = useQueryClient()

  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ['campaigns', statusFilter],
    queryFn: () =>
      fetch(`/api/campaigns${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`).then((r) => r.json()),
    refetchInterval: 15000,
  })
  const campaigns = Array.isArray(campaignsData?.campaigns) ? campaignsData.campaigns : (Array.isArray(campaignsData) ? campaignsData : [])

  const startMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/campaigns/${id}/start`, { method: 'POST' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  })
  const pauseMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/campaigns/${id}/pause`, { method: 'POST' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/campaigns/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
          {statuses.map((s) => {
            const isActive = statusFilter === s
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200"
                style={
                  isActive
                    ? {
                        background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
                        color: 'white',
                        boxShadow: '0 2px 8px oklch(0.49 0.263 281 / 30%)',
                      }
                    : { color: 'var(--muted-foreground)' }
                }
              >
                {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            )
          })}
        </div>

        <Link href="/campaigns/new">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
              boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
            }}
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl relative overflow-hidden"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="absolute inset-0 shimmer" />
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
          style={{ background: 'var(--card)', border: '1px dashed var(--border)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, oklch(0.49 0.263 281 / 15%), oklch(0.65 0.22 310 / 15%))',
              border: '1px solid oklch(0.49 0.263 281 / 20%)',
            }}>
            <Megaphone className="w-7 h-7" style={{ color: 'oklch(0.49 0.263 281)' }} />
          </div>
          <h3 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>No campaigns found</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
            {statusFilter !== 'all' ? `No ${statusFilter.toLowerCase()} campaigns.` : 'Launch your first AI voice campaign.'}
          </p>
          <Link href="/campaigns/new">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
                boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
              }}>
              <Sparkles className="w-4 h-4" />
              Create your first campaign
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign: any) => {
            const total = campaign.totalContacts || campaign._count?.contacts || 0
            const completed = campaign.completedCalls || 0
            const progress = total > 0 ? (completed / total) * 100 : 0
            const isRunning = campaign.status === 'RUNNING'

            return (
              <div key={campaign.id}
                className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: 'var(--card)',
                  border: isRunning ? '1px solid oklch(0.55 0.215 163 / 30%)' : '1px solid var(--border)',
                  boxShadow: isRunning ? '0 0 0 1px oklch(0.55 0.215 163 / 10%)' : 'none',
                }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <Link href={`/campaigns/${campaign.id}`}>
                        <h3 className="font-semibold hover:underline underline-offset-2 transition-all text-sm"
                          style={{ color: 'var(--foreground)' }}>
                          {campaign.name}
                        </h3>
                      </Link>
                      <CampaignStatusBadge status={campaign.status} />
                    </div>

                    {campaign.description && (
                      <p className="text-xs truncate mb-2" style={{ color: 'var(--muted-foreground)' }}>
                        {campaign.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      <span>{total} contacts</span>
                      <span className="text-emerald-500 font-medium">{campaign.successfulCalls ?? 0} successful</span>
                      <span>{formatCurrency(campaign.totalCost ?? 0)}</span>
                      <span className="hidden sm:inline">
                        {calculateSuccessRate(campaign.successfulCalls ?? 0, completed)}% success
                      </span>
                    </div>

                    {isRunning && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>Progress</span>
                          <span className="text-[10px] font-medium" style={{ color: 'oklch(0.55 0.215 163)' }}>
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: 'var(--muted)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${progress}%`,
                              background: 'linear-gradient(90deg, oklch(0.55 0.215 163), oklch(0.65 0.19 150))',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {campaign.status === 'RUNNING' ? (
                      <button
                        onClick={() => pauseMutation.mutate(campaign.id)}
                        disabled={pauseMutation.isPending}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 border"
                        style={{
                          border: '1px solid var(--border)',
                          background: 'var(--muted)',
                          color: 'var(--foreground)',
                        }}
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                    ) : campaign.status !== 'COMPLETED' && campaign.status !== 'CANCELLED' ? (
                      <button
                        onClick={() => startMutation.mutate(campaign.id)}
                        disabled={startMutation.isPending}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 text-white"
                        style={{
                          background: 'linear-gradient(135deg, oklch(0.55 0.215 163), oklch(0.65 0.19 150))',
                          boxShadow: '0 2px 8px oklch(0.55 0.215 163 / 30%)',
                        }}
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    ) : null}

                    <button
                      onClick={() => { if (confirm('Delete this campaign?')) deleteMutation.mutate(campaign.id) }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                      style={{ color: 'oklch(0.59 0.245 15)', border: '1px solid var(--border)', background: 'var(--muted)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <Link href={`/campaigns/${campaign.id}`}>
                      <button
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                        style={{ border: '1px solid var(--border)', background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
