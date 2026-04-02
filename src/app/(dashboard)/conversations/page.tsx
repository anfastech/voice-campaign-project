'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CallDetailDrawer } from '@/components/calls/CallDetailDrawer'
import {
  Phone, Download, Clock, DollarSign, Search,
  Smile, Meh, Frown, SlidersHorizontal,
} from 'lucide-react'
import { formatDate, formatDuration, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const STATUS_OPTIONS = ['ALL', 'COMPLETED', 'FAILED', 'NO_ANSWER', 'IN_PROGRESS', 'INITIATED', 'BUSY', 'CANCELLED']

const statusConfig: Record<string, { label: string; className: string; dotClassName: string }> = {
  COMPLETED: { label: 'Completed', className: 'bg-emerald-500/10 text-emerald-600', dotClassName: 'bg-emerald-500' },
  FAILED: { label: 'Failed', className: 'bg-red-500/10 text-red-600', dotClassName: 'bg-red-500' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-500/10 text-blue-600', dotClassName: 'bg-blue-500' },
  NO_ANSWER: { label: 'No Answer', className: 'bg-amber-500/10 text-amber-600', dotClassName: 'bg-amber-500' },
  INITIATED: { label: 'Initiated', className: 'bg-gray-500/10 text-gray-600', dotClassName: 'bg-gray-500' },
  BUSY: { label: 'Busy', className: 'bg-sky-500/10 text-sky-600', dotClassName: 'bg-sky-500' },
  CANCELLED: { label: 'Cancelled', className: 'bg-gray-500/10 text-gray-600', dotClassName: 'bg-gray-500' },
}

const sentimentConfig = {
  positive: { icon: Smile, className: 'bg-emerald-500/10 text-emerald-600' },
  neutral: { icon: Meh, className: 'bg-sky-500/10 text-sky-600' },
  negative: { icon: Frown, className: 'bg-red-500/10 text-red-600' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || { label: status, className: 'bg-gray-500/10 text-gray-600', dotClassName: 'bg-gray-500' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dotClassName}`} />
      {cfg.label}
    </span>
  )
}

function SentimentBadge({ sentiment }: { sentiment?: string }) {
  if (!sentiment) return null
  const cfg = sentimentConfig[sentiment as keyof typeof sentimentConfig]
  if (!cfg) return null
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full ${cfg.className}`}>
      <Icon className="w-3 h-3" />
    </span>
  )
}

export default function ConversationsPage() {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [selectedCall, setSelectedCall] = useState<any | null>(null)
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [agentFilter, setAgentFilter] = useState('')

  const params = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), limit: '50' })
    if (statusFilter !== 'ALL') p.set('status', statusFilter)
    if (searchQuery) p.set('search', searchQuery)
    if (dateFrom) p.set('from', new Date(dateFrom).toISOString())
    if (dateTo) p.set('to', new Date(dateTo).toISOString())
    if (agentFilter) p.set('agentId', agentFilter)
    return p.toString()
  }, [statusFilter, page, searchQuery, dateFrom, dateTo, agentFilter])

  const { data, isLoading } = useQuery({
    queryKey: ['calls', params],
    queryFn: () => fetch(`/api/calls?${params}`).then((r) => r.json()),
    refetchInterval: 15000,
  })

  const { data: agents } = useQuery({
    queryKey: ['agents-list'],
    queryFn: () => fetch('/api/agents').then((r) => r.json()),
    staleTime: 60000,
  })

  const calls = data?.calls ?? []
  const total = data?.total ?? 0
  const pages = data?.pages ?? 1

  const handleSearch = useCallback(() => {
    setSearchQuery(search)
    setPage(1)
  }, [search])

  const exportCsv = useCallback(() => {
    const headers = ['ID', 'Contact', 'Phone', 'Status', 'Duration', 'Cost', 'Agent', 'Campaign', 'Started']
    const rows = calls.map((c: any) => [
      c.id, c.contact?.name || '', c.phoneNumber, c.status,
      c.duration ? formatDuration(c.duration) : '',
      c.cost ? c.cost.toFixed(4) : '',
      c.agent?.name || '', c.campaign?.name || '', formatDate(c.startedAt),
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversations-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [calls])

  return (
    <div className="space-y-6">
      {/* Search + Filters bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search transcripts, contacts, numbers..."
                className="pl-9 rounded-xl"
              />
            </div>
            {search && (
              <Button variant="secondary" size="sm" onClick={handleSearch} className="rounded-lg text-xs">
                Search
              </Button>
            )}
          </div>

          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-xl gap-1.5 ${showFilters ? 'bg-primary/10 text-primary border-primary/30' : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </Button>

          <span className="text-sm ml-1 text-muted-foreground">
            {total.toLocaleString()} conversation{total !== 1 ? 's' : ''}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={calls.length === 0}
            className="rounded-xl gap-2 ml-auto"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <Card className="flex items-center gap-3 flex-wrap p-3 rounded-xl bg-muted">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className="text-xs px-2 py-1.5 rounded-lg h-auto" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">To</label>
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className="text-xs px-2 py-1.5 rounded-lg h-auto" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Agent</label>
              <Select value={agentFilter || '_all'} onValueChange={(v) => { setAgentFilter(v === '_all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="text-xs h-auto py-1.5 rounded-lg min-w-[120px]">
                  <SelectValue placeholder="All Agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Agents</SelectItem>
                  {(Array.isArray(agents) ? agents : []).map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(dateFrom || dateTo || agentFilter) && (
              <Button variant="ghost" size="sm"
                onClick={() => { setDateFrom(''); setDateTo(''); setAgentFilter(''); setPage(1) }}
                className="text-xs text-red-600 self-end">
                Clear
              </Button>
            )}
          </Card>
        )}

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto bg-muted border border-border">
          {STATUS_OPTIONS.map((s) => {
            const isActive = statusFilter === s
            return (
              <button key={s}
                onClick={() => { setStatusFilter(s); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}>
                {s === 'ALL' ? 'All' : s.replace('_', ' ')}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse bg-muted border border-border" />
          ))}
        </div>
      ) : calls.length === 0 ? (
        <Card className="rounded-2xl p-12 flex flex-col items-center justify-center text-center border-dashed">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20">
            <Phone className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-semibold mb-1 text-foreground">No calls found</h3>
          <p className="text-sm text-muted-foreground">
            {statusFilter !== 'ALL' || searchQuery ? 'Try adjusting your filters.' : 'Start a campaign to generate conversations.'}
          </p>
        </Card>
      ) : (
        <Card className="rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {['Contact', 'Status', 'Duration', 'Cost', 'Agent', 'Campaign', 'Started'].map((h, i) => (
                    <th key={i}
                      className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground ${i >= 2 && i <= 3 ? 'hidden sm:table-cell' : ''} ${i >= 4 && i <= 5 ? 'hidden lg:table-cell' : ''} ${i === 6 ? 'hidden xl:table-cell' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calls.map((call: any, idx: number) => (
                  <tr key={call.id}
                    className={`group transition-colors duration-150 cursor-pointer hover:bg-muted ${idx > 0 ? 'border-t border-border' : ''}`}
                    onClick={() => setSelectedCall(call)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium text-sm truncate max-w-[160px] text-foreground">
                            {call.contact?.name || call.phoneNumber}
                          </p>
                          <p className="text-xs truncate text-muted-foreground">{call.phoneNumber}</p>
                        </div>
                        <SentimentBadge sentiment={call.metadata?.sentiment} />
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={call.status} /></td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        {call.duration ? formatDuration(call.duration) : '\u2014'}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <DollarSign className="w-3 h-3 flex-shrink-0" />
                        {call.cost ? formatCurrency(call.cost) : '\u2014'}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{call.agent?.name || '\u2014'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{call.campaign?.name || '\u2014'}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatDate(call.startedAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <Button variant="outline" size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-xl">
                &larr; Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {pages}
              </span>
              <Button variant="outline" size="sm"
                onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                className="rounded-xl">
                Next &rarr;
              </Button>
            </div>
          )}
        </Card>
      )}

      <CallDetailDrawer call={selectedCall} onClose={() => setSelectedCall(null)} />
    </div>
  )
}
