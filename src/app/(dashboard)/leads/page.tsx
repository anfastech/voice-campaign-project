'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Target, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

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

export default function AdminLeadsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<LeadStatus>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, any>>({})

  const { data: leads = [], isLoading } = useQuery<any[]>({
    queryKey: ['leads', statusFilter],
    queryFn: () =>
      fetch(`/api/leads${statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''}`).then((r) => r.json()),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/leads/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setExpandedId(null)
    },
  })

  const leadsArr = Array.isArray(leads) ? leads : []

  const totalValue = leadsArr.reduce((sum: number, l: any) => sum + (l.value ?? 0), 0)
  const wonCount = leadsArr.filter((l: any) => l.status === 'WON').length

  const getEdit = (id: string, lead: any, field: string) =>
    edits[id]?.[field] !== undefined ? edits[id][field] : (lead[field] ?? '')

  const setEdit = (id: string, field: string, value: any) =>
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))

  const saveEdits = (id: string, lead: any) => {
    const patch: Record<string, any> = {}
    const e = edits[id] ?? {}
    if (e.status !== undefined && e.status !== lead.status) patch.status = e.status
    if (e.notes !== undefined && e.notes !== lead.notes) patch.notes = e.notes
    if (e.value !== undefined) {
      const v = parseFloat(e.value)
      if (!isNaN(v) && v !== lead.value) patch.value = v
    }
    if (e.tags !== undefined) {
      const tags = e.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      patch.tags = tags
    }
    if (Object.keys(patch).length > 0) {
      updateMutation.mutate({ id, data: patch })
    }
  }

  return (
    <div className="space-y-5">
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

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Leads', value: leadsArr.length },
          { label: 'Won', value: wonCount },
          { label: 'Total Value', value: formatLeadCurrency(totalValue) ?? '$0' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Leads list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse bg-muted border border-border" />
          ))}
        </div>
      ) : leadsArr.length === 0 ? (
        <Card className="shadow-none border-dashed">
          <CardContent className="py-14 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No leads found</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter !== 'ALL' ? `No ${statusFilter.toLowerCase()} leads.` : 'Leads will appear here when contacts are converted.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {leadsArr.map((lead: any) => {
            const isExpanded = expandedId === lead.id
            const tagsValue = getEdit(lead.id, lead, 'tags') !== ''
              ? getEdit(lead.id, lead, 'tags')
              : (lead.tags ?? []).join(', ')

            return (
              <Card key={lead.id} className="shadow-none">
                <CardContent className="p-4">
                  {/* Header row */}
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                  >
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
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Status
                          </Label>
                          <Select
                            value={getEdit(lead.id, lead, 'status') || lead.status}
                            onValueChange={(v) => setEdit(lead.id, 'status', v)}
                          >
                            <SelectTrigger className="mt-1.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'] as const).map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s.charAt(0) + s.slice(1).toLowerCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Value ($)
                          </Label>
                          <Input
                            type="number"
                            className="mt-1.5"
                            placeholder="0"
                            value={getEdit(lead.id, lead, 'value') ?? lead.value ?? ''}
                            onChange={(e) => setEdit(lead.id, 'value', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Tags (comma-separated)
                        </Label>
                        <Input
                          className="mt-1.5"
                          placeholder="hot-lead, enterprise, follow-up"
                          value={tagsValue}
                          onChange={(e) => setEdit(lead.id, 'tags', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Notes
                        </Label>
                        <textarea
                          className="mt-1.5 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                          placeholder="Add notes..."
                          value={getEdit(lead.id, lead, 'notes') ?? lead.notes ?? ''}
                          onChange={(e) => setEdit(lead.id, 'notes', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-1.5"
                          onClick={() => {
                            if (confirm('Delete this lead?')) deleteMutation.mutate(lead.id)
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveEdits(lead.id, lead)}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!isLoading && leadsArr.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {leadsArr.length} lead{leadsArr.length !== 1 ? 's' : ''}
          {statusFilter !== 'ALL' && ` · filtered by ${statusFilter.toLowerCase()}`}
        </p>
      )}
    </div>
  )
}
