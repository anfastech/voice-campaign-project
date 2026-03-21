'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDate, formatDuration, formatCurrency } from '@/lib/utils'
import { Download, Volume2 } from 'lucide-react'

interface Call {
  id: string
  phoneNumber: string
  status: string
  duration?: number | null
  cost?: number | null
  transcript?: string | null
  summary?: string | null
  startedAt: string
  recordingAvailable?: boolean
  elevenLabsCallId?: string | null
  contact?: { name?: string | null } | null
  agent?: { name: string } | null
  campaign?: { name: string } | null
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  COMPLETED:   { label: 'Completed',   bg: 'oklch(0.55 0.215 163 / 12%)', text: 'oklch(0.45 0.215 163)' },
  FAILED:      { label: 'Failed',      bg: 'oklch(0.59 0.245 15 / 12%)',  text: 'oklch(0.52 0.245 15)' },
  IN_PROGRESS: { label: 'In Progress', bg: 'oklch(0.49 0.263 281 / 12%)', text: 'oklch(0.49 0.263 281)' },
  NO_ANSWER:   { label: 'No Answer',   bg: 'oklch(0.72 0.18 68 / 12%)',   text: 'oklch(0.55 0.18 68)' },
  INITIATED:   { label: 'Initiated',   bg: 'oklch(0.6 0.015 285 / 8%)',   text: 'oklch(0.52 0.015 285)' },
}

interface TranscriptModalProps {
  call: Call | null
  onClose: () => void
}

export function TranscriptModal({ call, onClose }: TranscriptModalProps) {
  if (!call) return null

  const statusCfg = statusConfig[call.status] || statusConfig.INITIATED
  const hasRecording = call.recordingAvailable && call.elevenLabsCallId

  return (
    <Dialog open={!!call} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            <span>Call with {call.contact?.name || call.phoneNumber}</span>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: statusCfg.bg, color: statusCfg.text }}
            >
              {statusCfg.label}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Agent', value: call.agent?.name || '—' },
              { label: 'Campaign', value: call.campaign?.name || '—' },
              { label: 'Duration', value: call.duration ? formatDuration(call.duration) : '—' },
              { label: 'Cost', value: call.cost ? formatCurrency(call.cost) : '—' },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl p-3"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
                <p className="font-medium" style={{ color: 'var(--foreground)' }}>{value}</p>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl p-3 text-sm"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Started</p>
            <p className="font-medium" style={{ color: 'var(--foreground)' }}>{formatDate(call.startedAt)}</p>
          </div>

          {/* Recording player */}
          {hasRecording && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-3.5 h-3.5" style={{ color: 'oklch(0.55 0.215 163)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Recording</p>
              </div>
              <div
                className="rounded-xl p-3 space-y-2"
                style={{ background: 'oklch(0.55 0.215 163 / 6%)', border: '1px solid oklch(0.55 0.215 163 / 20%)' }}
              >
                <audio
                  controls
                  className="w-full"
                  src={`/api/calls/${call.id}/recording`}
                  style={{ height: '36px' }}
                />
                <a
                  href={`/api/calls/${call.id}/recording`}
                  download={`recording-${call.id}.mp3`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium transition-all duration-200 hover:opacity-80"
                  style={{ color: 'oklch(0.45 0.215 163)' }}
                >
                  <Download className="w-3 h-3" />
                  Download recording
                </a>
              </div>
            </div>
          )}

          {call.summary && (
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Summary</p>
              <div
                className="rounded-xl p-3 text-sm"
                style={{
                  background: 'oklch(0.6 0.19 220 / 8%)',
                  border: '1px solid oklch(0.6 0.19 220 / 20%)',
                  color: 'var(--foreground)',
                }}
              >
                {call.summary}
              </div>
            </div>
          )}

          {call.transcript ? (
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Transcript</p>
              <div
                className="rounded-xl p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto"
                style={{
                  background: 'var(--muted)',
                  border: '1px solid var(--border)',
                  color: 'var(--muted-foreground)',
                }}
              >
                {call.transcript}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              No transcript available for this call.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
