'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
        <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto bg-muted border border-border">
          {statuses.map((s) => {
            const isActive = statusFilter === s
            return (
              <Button
                key={s}
                onClick={() => setStatusFilter(s)}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
              >
                {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </Button>
            )
          })}
        </div>

        <Link href="/campaigns/new">
          <Button className="flex items-center gap-2 flex-shrink-0">
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-28 animate-pulse bg-muted" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20">
              <Megaphone className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-semibold mb-1 text-foreground">No campaigns found</h3>
            <p className="text-sm mb-6 text-muted-foreground">
              {statusFilter !== 'all' ? `No ${statusFilter.toLowerCase()} campaigns.` : 'Launch your first AI voice campaign.'}
            </p>
            <Link href="/campaigns/new">
              <Button className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Create your first campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign: any) => {
            const total = campaign.totalContacts || campaign._count?.contacts || 0
            const completed = campaign.completedCalls || 0
            const progress = total > 0 ? (completed / total) * 100 : 0
            const isRunning = campaign.status === 'RUNNING'

            return (
              <Card key={campaign.id}
                className={`p-5 transition-all duration-300 hover:-translate-y-0.5 ${isRunning ? 'border-emerald-500/30 shadow-[0_0_0_1px] shadow-emerald-500/10' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <Link href={`/campaigns/${campaign.id}`}>
                        <h3 className="font-semibold hover:underline underline-offset-2 transition-all text-sm text-foreground">
                          {campaign.name}
                        </h3>
                      </Link>
                      <CampaignStatusBadge status={campaign.status} />
                    </div>

                    {campaign.description && (
                      <p className="text-xs truncate mb-2 text-muted-foreground">
                        {campaign.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                          <span className="text-[10px] text-muted-foreground">Progress</span>
                          <span className="text-[10px] font-medium text-emerald-500">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-muted">
                          <div
                            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-emerald-400"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {campaign.status === 'RUNNING' ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => pauseMutation.mutate(campaign.id)}
                        disabled={pauseMutation.isPending}
                        className="w-8 h-8 border border-border"
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </Button>
                    ) : campaign.status !== 'COMPLETED' && campaign.status !== 'CANCELLED' ? (
                      <Button
                        variant="default"
                        size="icon"
                        onClick={() => startMutation.mutate(campaign.id)}
                        disabled={startMutation.isPending}
                        className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </Button>
                    ) : null}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { if (confirm('Delete this campaign?')) deleteMutation.mutate(campaign.id) }}
                      className="w-8 h-8 text-red-500 border border-border"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>

                    <Link href={`/campaigns/${campaign.id}`}>
                      <Button variant="ghost" size="icon"
                        className="w-8 h-8 border border-border">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
