'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const STATUSES = ['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'] as const
type LeadStatus = (typeof STATUSES)[number]

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-blue-500/10 text-blue-600',
  CONTACTED: 'bg-yellow-500/10 text-yellow-600',
  QUALIFIED: 'bg-purple-500/10 text-purple-600',
  PROPOSAL: 'bg-orange-500/10 text-orange-600',
  WON: 'bg-emerald-500/10 text-emerald-600',
  LOST: 'bg-red-500/10 text-red-600',
}

function formatLeadCurrency(value: number | null | undefined) {
  if (value == null) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export default function ClientLeadsPage() {
  const [statusFilter, setStatusFilter] = useState<LeadStatus>('ALL')

  const { data: leads = [], isLoading } = useQuery<any[]>({
    queryKey: ['client-leads', statusFilter],
    queryFn: () => fetch('/api/client/leads').then((r) => r.json()),
  })

  const leadsArr = Array.isArray(leads) ? leads : []
  const filtered = statusFilter === 'ALL' ? leadsArr : leadsArr.filter((l: any) => l.status === statusFilter)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Leads</h2>
        <p className="text-sm text-muted-foreground mt-1">Leads generated from your voice campaigns</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-muted border border-border overflow-x-auto">
        {STATUSES.map((s) => (
          <Button
            key={s}
            onClick={() => setStatusFilter(s)}
            variant={statusFilter === s ? 'default' : 'ghost'}
            size="sm"
            className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      {/* Leads list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse bg-muted border border-border" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="shadow-none border-dashed">
          <CardContent className="py-14 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No leads yet</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter !== 'ALL'
                ? `No ${statusFilter.toLowerCase()} leads found.`
                : 'Leads will appear here as your campaigns convert contacts.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead: any) => (
            <Card key={lead.id} className="shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground">
                        {lead.contact?.name || lead.contact?.phoneNumber || '—'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {lead.contact?.phoneNumber}
                      </span>
                      <Badge className={`text-[10px] font-semibold border-0 ${STATUS_STYLES[lead.status] ?? ''}`}>
                        {lead.status}
                      </Badge>
                      {lead.score != null && (
                        <Badge variant="outline" className="text-[10px] font-medium">
                          {lead.score}/100
                        </Badge>
                      )}
                      {lead.value != null && (
                        <span className="text-xs font-semibold text-emerald-600">
                          {formatLeadCurrency(lead.value)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {lead.agent?.name && <span>{lead.agent.name}</span>}
                      <span>{formatDate(lead.convertedAt)}</span>
                    </div>
                    {lead.notes && (
                      <p className="mt-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                        {lead.notes}
                      </p>
                    )}
                    {lead.tags && lead.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        {lead.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
          {statusFilter !== 'ALL' && ` · filtered by ${statusFilter.toLowerCase()}`}
        </p>
      )}
    </div>
  )
}
