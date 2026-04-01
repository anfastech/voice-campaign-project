'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDate, formatDuration, formatCurrency } from '@/lib/utils'
import {
  X, Phone, Clock, DollarSign, Bot, Megaphone, Volume2,
  Download, Tag, Plus, Smile, Meh, Frown,
} from 'lucide-react'

interface Call {
  id: string
  phoneNumber: string
  status: string
  duration?: number | null
  cost?: number | null
  transcript?: string | null
  summary?: string | null
  startedAt: string
  endedAt?: string | null
  answeredAt?: string | null
  recordingAvailable?: boolean
  elevenLabsCallId?: string | null
  errorMessage?: string | null
  metadata?: any
  contact?: { id?: string; name?: string | null; phoneNumber?: string; email?: string | null; tags?: string[] } | null
  agent?: { id?: string; name: string; provider?: string } | null
  campaign?: { id?: string; name: string } | null
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  COMPLETED: { label: 'Completed', bg: 'oklch(0.55 0.215 163 / 12%)', text: 'oklch(0.45 0.215 163)', dot: 'oklch(0.55 0.215 163)' },
  FAILED: { label: 'Failed', bg: 'oklch(0.59 0.245 15 / 12%)', text: 'oklch(0.52 0.245 15)', dot: 'oklch(0.59 0.245 15)' },
  IN_PROGRESS: { label: 'In Progress', bg: 'oklch(0.49 0.263 281 / 12%)', text: 'oklch(0.49 0.263 281)', dot: 'oklch(0.49 0.263 281)' },
  NO_ANSWER: { label: 'No Answer', bg: 'oklch(0.72 0.18 68 / 12%)', text: 'oklch(0.55 0.18 68)', dot: 'oklch(0.72 0.18 68)' },
  INITIATED: { label: 'Initiated', bg: 'oklch(0.6 0.015 285 / 8%)', text: 'oklch(0.52 0.015 285)', dot: 'oklch(0.6 0.015 285)' },
  BUSY: { label: 'Busy', bg: 'oklch(0.6 0.19 220 / 12%)', text: 'oklch(0.5 0.19 220)', dot: 'oklch(0.6 0.19 220)' },
  CANCELLED: { label: 'Cancelled', bg: 'oklch(0.5 0.015 285 / 8%)', text: 'oklch(0.45 0.015 285)', dot: 'oklch(0.5 0.015 285)' },
}

const sentimentConfig = {
  positive: { icon: Smile, color: 'oklch(0.55 0.215 163)', bg: 'oklch(0.55 0.215 163 / 12%)', label: 'Positive' },
  neutral: { icon: Meh, color: 'oklch(0.6 0.19 220)', bg: 'oklch(0.6 0.19 220 / 12%)', label: 'Neutral' },
  negative: { icon: Frown, color: 'oklch(0.59 0.245 15)', bg: 'oklch(0.59 0.245 15 / 12%)', label: 'Negative' },
}

export function CallDetailDrawer({ call, onClose }: { call: Call | null; onClose: () => void }) {
  const [newTag, setNewTag] = useState('')
  const queryClient = useQueryClient()

  const tagMutation = useMutation({
    mutationFn: async (tags: string[]) => {
      const res = await fetch(`/api/calls/${call?.id}/tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      })
      if (!res.ok) throw new Error('Failed to update tags')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calls'] }),
  })

  if (!call) return null

  const cfg = statusConfig[call.status] || statusConfig.INITIATED
  const hasRecording = call.recordingAvailable && call.elevenLabsCallId
  const tags: string[] = call.metadata?.tags || []
  const sentiment = call.metadata?.sentiment as string | undefined
  const sentimentCfg = sentiment ? sentimentConfig[sentiment as keyof typeof sentimentConfig] : null

  const addTag = () => {
    const tag = newTag.trim()
    if (!tag || tags.includes(tag)) return
    tagMutation.mutate([...tags, tag])
    setNewTag('')
  }

  const removeTag = (tag: string) => {
    tagMutation.mutate(tags.filter((t) => t !== tag))
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg overflow-y-auto"
        style={{ background: 'var(--background)', borderLeft: '1px solid var(--border)', boxShadow: '-8px 0 30px oklch(0 0 0 / 15%)' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))' }}>
              <Phone className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>
                {call.contact?.name || call.phoneNumber}
              </h3>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{call.phoneNumber}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
            style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status + Sentiment */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: cfg.bg, color: cfg.text }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
              {cfg.label}
            </span>
            {sentimentCfg && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: sentimentCfg.bg, color: sentimentCfg.color }}>
                <sentimentCfg.icon className="w-3 h-3" />
                {sentimentCfg.label}
              </span>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Bot, label: 'Agent', value: call.agent?.name || '—' },
              { icon: Megaphone, label: 'Campaign', value: call.campaign?.name || '—' },
              { icon: Clock, label: 'Duration', value: call.duration ? formatDuration(call.duration) : '—' },
              { icon: DollarSign, label: 'Cost', value: call.cost ? formatCurrency(call.cost) : '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl p-3"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
                  <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
                </div>
                <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Timestamps */}
          <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
            {[
              { label: 'Started', value: formatDate(call.startedAt) },
              ...(call.answeredAt ? [{ label: 'Answered', value: formatDate(call.answeredAt) }] : []),
              ...(call.endedAt ? [{ label: 'Ended', value: formatDate(call.endedAt) }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
                <span className="font-medium tabular-nums" style={{ color: 'var(--foreground)' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="w-3.5 h-3.5" style={{ color: 'oklch(0.49 0.263 281)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Tags</p>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: 'oklch(0.49 0.263 281 / 10%)', color: 'oklch(0.49 0.263 281)' }}>
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:opacity-60">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input value={newTag} onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add tag..." className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-transparent outline-none"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }} />
              <button onClick={addTag} disabled={!newTag.trim()}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40"
                style={{ background: 'oklch(0.49 0.263 281 / 10%)', color: 'oklch(0.49 0.263 281)' }}>
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Error */}
          {call.errorMessage && (
            <div className="rounded-xl p-3 text-sm"
              style={{ background: 'oklch(0.59 0.245 15 / 8%)', border: '1px solid oklch(0.59 0.245 15 / 20%)', color: 'oklch(0.52 0.245 15)' }}>
              <p className="font-semibold text-xs mb-1">Error</p>
              {call.errorMessage}
            </div>
          )}

          {/* Recording */}
          {hasRecording && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-3.5 h-3.5" style={{ color: 'oklch(0.55 0.215 163)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Recording</p>
              </div>
              <div className="rounded-xl p-3 space-y-2"
                style={{ background: 'oklch(0.55 0.215 163 / 6%)', border: '1px solid oklch(0.55 0.215 163 / 20%)' }}>
                <audio controls className="w-full" src={`/api/calls/${call.id}/recording`} style={{ height: '36px' }} />
                <a href={`/api/calls/${call.id}/recording`} download={`recording-${call.id}.mp3`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium hover:opacity-80"
                  style={{ color: 'oklch(0.45 0.215 163)' }}>
                  <Download className="w-3 h-3" /> Download recording
                </a>
              </div>
            </div>
          )}

          {/* Summary */}
          {call.summary && (
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Summary</p>
              <div className="rounded-xl p-3 text-sm"
                style={{ background: 'oklch(0.6 0.19 220 / 8%)', border: '1px solid oklch(0.6 0.19 220 / 20%)', color: 'var(--foreground)' }}>
                {call.summary}
              </div>
            </div>
          )}

          {/* Transcript */}
          {call.transcript ? (
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Transcript</p>
              <div className="rounded-xl p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                {call.transcript}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              No transcript available for this call.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
