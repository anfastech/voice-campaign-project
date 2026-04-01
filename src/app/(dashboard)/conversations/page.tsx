'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CallDetailDrawer } from '@/components/calls/CallDetailDrawer'
import {
  Phone, Download, Clock, DollarSign, Search,
  Smile, Meh, Frown, SlidersHorizontal,
} from 'lucide-react'
import { formatDate, formatDuration, formatCurrency } from '@/lib/utils'

const STATUS_OPTIONS = ['ALL', 'COMPLETED', 'FAILED', 'NO_ANSWER', 'IN_PROGRESS', 'INITIATED', 'BUSY', 'CANCELLED']

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  COMPLETED: { label: 'Completed', bg: 'oklch(0.55 0.215 163 / 12%)', text: 'oklch(0.45 0.215 163)', dot: 'oklch(0.55 0.215 163)' },
  FAILED: { label: 'Failed', bg: 'oklch(0.59 0.245 15 / 12%)', text: 'oklch(0.52 0.245 15)', dot: 'oklch(0.59 0.245 15)' },
  IN_PROGRESS: { label: 'In Progress', bg: 'oklch(0.49 0.263 281 / 12%)', text: 'oklch(0.49 0.263 281)', dot: 'oklch(0.49 0.263 281)' },
  NO_ANSWER: { label: 'No Answer', bg: 'oklch(0.72 0.18 68 / 12%)', text: 'oklch(0.55 0.18 68)', dot: 'oklch(0.72 0.18 68)' },
  INITIATED: { label: 'Initiated', bg: 'oklch(0.6 0.015 285 / 8%)', text: 'oklch(0.52 0.015 285)', dot: 'oklch(0.6 0.015 285)' },
  BUSY: { label: 'Busy', bg: 'oklch(0.6 0.19 220 / 12%)', text: 'oklch(0.5 0.19 220)', dot: 'oklch(0.6 0.19 220)' },
  CANCELLED: { label: 'Cancelled', bg: 'oklch(0.5 0.015 285 / 8%)', text: 'oklch(0.45 0.015 285)', dot: 'oklch(0.5 0.015 285)' },
}

const sentimentIcons = {
  positive: { icon: Smile, color: 'oklch(0.55 0.215 163)', bg: 'oklch(0.55 0.215 163 / 12%)' },
  neutral: { icon: Meh, color: 'oklch(0.6 0.19 220)', bg: 'oklch(0.6 0.19 220 / 12%)' },
  negative: { icon: Frown, color: 'oklch(0.59 0.245 15)', bg: 'oklch(0.59 0.245 15 / 12%)' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || { label: status, bg: 'oklch(0.5 0.015 285 / 8%)', text: 'oklch(0.45 0.015 285)', dot: 'oklch(0.5 0.015 285)' }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.text }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

function SentimentBadge({ sentiment }: { sentiment?: string }) {
  if (!sentiment) return null
  const cfg = sentimentIcons[sentiment as keyof typeof sentimentIcons]
  if (!cfg) return null
  const Icon = cfg.icon
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full"
      style={{ background: cfg.bg }}>
      <Icon className="w-3 h-3" style={{ color: cfg.color }} />
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
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md px-3 py-2 rounded-xl"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search transcripts, contacts, numbers..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--foreground)' }} />
            {search && (
              <button onClick={handleSearch}
                className="text-xs font-medium px-2 py-0.5 rounded-lg"
                style={{ background: 'oklch(0.49 0.263 281 / 10%)', color: 'oklch(0.49 0.263 281)' }}>
                Search
              </button>
            )}
          </div>

          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all hover:scale-105"
            style={{
              background: showFilters ? 'oklch(0.49 0.263 281 / 10%)' : 'var(--card)',
              border: `1px solid ${showFilters ? 'oklch(0.49 0.263 281 / 30%)' : 'var(--border)'}`,
              color: showFilters ? 'oklch(0.49 0.263 281)' : 'var(--foreground)',
            }}>
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>

          <span className="text-sm ml-1" style={{ color: 'var(--muted-foreground)' }}>
            {total.toLocaleString()} conversation{total !== 1 ? 's' : ''}
          </span>

          <button onClick={exportCsv} disabled={calls.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="flex items-center gap-3 flex-wrap p-3 rounded-xl"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>From</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className="text-xs px-2 py-1.5 rounded-lg bg-transparent outline-none"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>To</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className="text-xs px-2 py-1.5 rounded-lg bg-transparent outline-none"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Agent</label>
              <select value={agentFilter} onChange={(e) => { setAgentFilter(e.target.value); setPage(1) }}
                className="text-xs px-2 py-1.5 rounded-lg bg-transparent outline-none"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}>
                <option value="">All Agents</option>
                {(Array.isArray(agents) ? agents : []).map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            {(dateFrom || dateTo || agentFilter) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); setAgentFilter(''); setPage(1) }}
                className="text-xs font-medium px-2 py-1 rounded-lg self-end"
                style={{ color: 'oklch(0.59 0.245 15)' }}>
                Clear
              </button>
            )}
          </div>
        )}

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
          {STATUS_OPTIONS.map((s) => {
            const isActive = statusFilter === s
            return (
              <button key={s}
                onClick={() => { setStatusFilter(s); setPage(1) }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200"
                style={isActive ? {
                  background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
                  color: 'white', boxShadow: '0 2px 8px oklch(0.49 0.263 281 / 30%)',
                } : { color: 'var(--muted-foreground)' }}>
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
            <div key={i} className="h-14 rounded-xl relative overflow-hidden"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="absolute inset-0 shimmer" />
            </div>
          ))}
        </div>
      ) : calls.length === 0 ? (
        <div className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
          style={{ background: 'var(--card)', border: '1px dashed var(--border)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, oklch(0.49 0.263 281 / 15%), oklch(0.65 0.22 310 / 15%))',
              border: '1px solid oklch(0.49 0.263 281 / 20%)',
            }}>
            <Phone className="w-7 h-7" style={{ color: 'oklch(0.49 0.263 281)' }} />
          </div>
          <h3 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>No calls found</h3>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {statusFilter !== 'ALL' || searchQuery ? 'Try adjusting your filters.' : 'Start a campaign to generate conversations.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {['Contact', 'Status', 'Duration', 'Cost', 'Agent', 'Campaign', 'Started'].map((h, i) => (
                    <th key={i}
                      className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest ${i >= 2 && i <= 3 ? 'hidden sm:table-cell' : ''} ${i >= 4 && i <= 5 ? 'hidden lg:table-cell' : ''} ${i === 6 ? 'hidden xl:table-cell' : ''}`}
                      style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calls.map((call: any, idx: number) => (
                  <tr key={call.id} className="group transition-colors duration-150 cursor-pointer"
                    style={{ borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}
                    onClick={() => setSelectedCall(call)}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--muted)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium text-sm truncate max-w-[160px]" style={{ color: 'var(--foreground)' }}>
                            {call.contact?.name || call.phoneNumber}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{call.phoneNumber}</p>
                        </div>
                        <SentimentBadge sentiment={call.metadata?.sentiment} />
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={call.status} /></td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        {call.duration ? formatDuration(call.duration) : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        <DollarSign className="w-3 h-3 flex-shrink-0" />
                        {call.cost ? formatCurrency(call.cost) : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{call.agent?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{call.campaign?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                        {formatDate(call.startedAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3"
              style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--muted)' }}>
                &larr; Previous
              </button>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Page {page} of {pages}
              </span>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                className="px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--muted)' }}>
                Next &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      <CallDetailDrawer call={selectedCall} onClose={() => setSelectedCall(null)} />
    </div>
  )
}
