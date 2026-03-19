'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TranscriptModal } from '@/components/calls/TranscriptModal'
import { Phone, Download, FileText, Clock, DollarSign } from 'lucide-react'
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

export default function CallsPage() {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [selectedCall, setSelectedCall] = useState<any | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['calls', statusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      return fetch(`/api/calls?${params}`).then((r) => r.json())
    },
    refetchInterval: 15000,
  })

  const calls = data?.calls ?? []
  const total = data?.total ?? 0
  const pages = data?.pages ?? 1

  const exportCsv = () => {
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
    a.download = `calls-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Filters bar */}
      <div className="flex items-center gap-3 flex-wrap">
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

        <span className="text-sm ml-1" style={{ color: 'var(--muted-foreground)' }}>
          {total.toLocaleString()} call{total !== 1 ? 's' : ''}
        </span>

        <button
          onClick={exportCsv}
          disabled={calls.length === 0}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
          <Download className="w-4 h-4" />
          Export CSV
        </button>
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
            {statusFilter !== 'ALL' ? `No ${statusFilter.replace('_', ' ').toLowerCase()} calls.` : 'Start a campaign to generate call logs.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {['Contact', 'Status', 'Duration', 'Cost', 'Agent', 'Campaign', 'Started', ''].map((h, i) => (
                    <th key={i}
                      className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest ${i >= 2 && i <= 3 ? 'hidden sm:table-cell' : ''} ${i >= 4 && i <= 5 ? 'hidden lg:table-cell' : ''} ${i === 6 ? 'hidden xl:table-cell' : ''}`}
                      style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calls.map((call: any, idx: number) => (
                  <tr key={call.id} className="group transition-colors duration-150"
                    style={{ borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--muted)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm truncate max-w-[160px]" style={{ color: 'var(--foreground)' }}>
                        {call.contact?.name || call.phoneNumber}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{call.phoneNumber}</p>
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
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedCall(call)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 border opacity-0 group-hover:opacity-100"
                        style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--muted)' }}>
                        <FileText className="w-3 h-3" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3"
              style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--muted)' }}>
                ← Previous
              </button>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--muted)' }}>
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      <TranscriptModal call={selectedCall} onClose={() => setSelectedCall(null)} />
    </div>
  )
}
