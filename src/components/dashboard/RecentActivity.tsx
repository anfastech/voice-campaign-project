import { memo } from 'react'
import { formatDate, formatDuration } from '@/lib/utils'
import { Phone, Clock, Zap } from 'lucide-react'

interface Call {
  id: string
  phoneNumber: string
  status: string
  duration?: number | null
  startedAt: string
  contact?: { name?: string | null; phoneNumber: string } | null
  agent?: { name: string } | null
  campaign?: { name: string } | null
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  COMPLETED: {
    label: 'Completed',
    bg: 'oklch(0.55 0.215 163 / 12%)',
    text: 'oklch(0.45 0.215 163)',
    dot: 'oklch(0.55 0.215 163)',
  },
  FAILED: {
    label: 'Failed',
    bg: 'oklch(0.59 0.245 15 / 12%)',
    text: 'oklch(0.52 0.245 15)',
    dot: 'oklch(0.59 0.245 15)',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'oklch(0.49 0.263 281 / 12%)',
    text: 'oklch(0.49 0.263 281)',
    dot: 'oklch(0.49 0.263 281)',
  },
  NO_ANSWER: {
    label: 'No Answer',
    bg: 'oklch(0.72 0.18 68 / 12%)',
    text: 'oklch(0.55 0.18 68)',
    dot: 'oklch(0.72 0.18 68)',
  },
  INITIATED: {
    label: 'Initiated',
    bg: 'oklch(0.6 0.015 285 / 8%)',
    text: 'oklch(0.52 0.015 285)',
    dot: 'oklch(0.6 0.015 285)',
  },
  BUSY: {
    label: 'Busy',
    bg: 'oklch(0.6 0.19 220 / 12%)',
    text: 'oklch(0.5 0.19 220)',
    dot: 'oklch(0.6 0.19 220)',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'oklch(0.5 0.015 285 / 8%)',
    text: 'oklch(0.45 0.015 285)',
    dot: 'oklch(0.5 0.015 285)',
  },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || {
    label: status,
    bg: 'oklch(0.5 0.015 285 / 8%)',
    text: 'oklch(0.45 0.015 285)',
    dot: 'oklch(0.5 0.015 285)',
  }
  const isLive = status === 'IN_PROGRESS'

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span
        className={isLive ? 'live-dot w-1.5 h-1.5 rounded-full flex-shrink-0' : 'w-1.5 h-1.5 rounded-full flex-shrink-0'}
        style={{ background: cfg.dot }}
      />
      {cfg.label}
    </span>
  )
}

function getInitials(name?: string | null, phone?: string) {
  if (name) return name.slice(0, 2).toUpperCase()
  return (phone || '??').slice(-2)
}

export const RecentActivity = memo(function RecentActivity({ calls }: { calls: Call[] }) {
  if (calls.length === 0) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Recent Activity</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Latest call events</p>
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-center py-12 rounded-xl"
          style={{ background: 'var(--muted)', border: '1px dashed var(--border)' }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'oklch(0.49 0.263 281 / 10%)' }}
          >
            <Phone className="w-5 h-5" style={{ color: 'oklch(0.49 0.263 281)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>No recent activity</p>
          <p className="text-xs mt-1" style={{ color: 'oklch(0.52 0.02 285)' }}>
            Start a campaign to see call events here
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Recent Activity</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {calls.length} latest call{calls.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
          style={{ background: 'oklch(0.49 0.263 281 / 8%)', color: 'oklch(0.49 0.263 281)' }}>
          <Zap className="w-3 h-3" />
          Live
        </div>
      </div>

      {/* Table header */}
      <div
        className="hidden sm:grid grid-cols-12 gap-4 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-widest"
        style={{
          color: 'var(--muted-foreground)',
          background: 'var(--muted)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span className="col-span-4">Contact</span>
        <span className="col-span-3">Agent · Campaign</span>
        <span className="col-span-2 text-center">Duration</span>
        <span className="col-span-2 text-center">Status</span>
        <span className="col-span-1 text-right">Time</span>
      </div>

      {/* Rows */}
      <div>
        {calls.map((call, idx) => (
          <div
            key={call.id}
            className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center transition-colors duration-150"
            style={{
              borderBottom: idx < calls.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: 'default',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
            }}
          >
            {/* Contact */}
            <div className="col-span-12 sm:col-span-4 flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
                }}
              >
                {getInitials(call.contact?.name, call.contact?.phoneNumber || call.phoneNumber)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                  {call.contact?.name || 'Unknown Contact'}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                  {call.contact?.phoneNumber || call.phoneNumber}
                </p>
              </div>
            </div>

            {/* Agent / Campaign */}
            <div className="hidden sm:block col-span-3 min-w-0">
              {call.agent && (
                <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>
                  {call.agent.name}
                </p>
              )}
              {call.campaign && (
                <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                  {call.campaign.name}
                </p>
              )}
              {!call.agent && !call.campaign && (
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>—</span>
              )}
            </div>

            {/* Duration */}
            <div className="hidden sm:flex col-span-2 items-center justify-center gap-1.5">
              <Clock className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--foreground)' }}>
                {call.duration ? formatDuration(call.duration) : '—'}
              </span>
            </div>

            {/* Status */}
            <div className="hidden sm:flex col-span-2 justify-center">
              <StatusBadge status={call.status} />
            </div>

            {/* Time */}
            <div className="hidden md:block col-span-1 text-right">
              <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                {formatDate(call.startedAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})
