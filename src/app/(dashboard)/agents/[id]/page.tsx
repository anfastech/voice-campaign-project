'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowLeft, Bot, Mic2, Phone, Thermometer, Clock, Globe,
  Radio, Trash2, Sparkles, MessageSquare, Link2, Link2Off, RefreshCw,
  BookOpen, Wrench, Plus, Loader2, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react'
import { PROVIDER_META } from '@/lib/providers/types'

type AgentTool = {
  id: string
  name: string
  description: string
  parameters: Record<string, unknown>
  webhookUrl: string
  isActive: boolean
  createdAt: string
}

const CALL_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  COMPLETED:   { label: 'Completed',   color: 'oklch(0.45 0.215 163)', bg: 'oklch(0.55 0.215 163 / 10%)' },
  IN_PROGRESS: { label: 'In Progress', color: 'oklch(0.6 0.19 220)',   bg: 'oklch(0.6 0.19 220 / 10%)' },
  INITIATED:   { label: 'Initiated',   color: 'oklch(0.6 0.19 220)',   bg: 'oklch(0.6 0.19 220 / 10%)' },
  RINGING:     { label: 'Ringing',     color: 'oklch(0.72 0.18 68)',   bg: 'oklch(0.72 0.18 68 / 10%)' },
  FAILED:      { label: 'Failed',      color: 'oklch(0.52 0.245 15)',  bg: 'oklch(0.59 0.245 15 / 10%)' },
  NO_ANSWER:   { label: 'No Answer',   color: 'oklch(0.52 0.245 15)',  bg: 'oklch(0.59 0.245 15 / 10%)' },
  BUSY:        { label: 'Busy',        color: 'oklch(0.64 0.24 35)',   bg: 'oklch(0.64 0.24 35 / 10%)' },
  CANCELLED:   { label: 'Cancelled',   color: 'var(--muted-foreground)', bg: 'var(--muted)' },
}

function formatDuration(s?: number | null) {
  if (!s) return '—'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function formatDate(d?: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const DEFAULT_PARAMS = JSON.stringify({ type: 'object', properties: {} }, null, 2)

export default function AgentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const queryClient = useQueryClient()

  const [toolFormOpen, setToolFormOpen] = useState(false)
  const [toolForm, setToolForm] = useState({
    name: '',
    description: '',
    webhookUrl: '',
    parameters: DEFAULT_PARAMS,
  })
  const [toolError, setToolError] = useState<string | null>(null)

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => fetch(`/api/agents/${id}`).then((r) => r.json()),
    enabled: !!id,
  })

  const syncMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/agents/${id}/sync`, { method: 'POST' }).then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}))
          throw new Error(body.error || 'Sync failed')
        }
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', id] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch(`/api/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', id] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => fetch(`/api/agents/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      router.push('/agents')
    },
  })

  const createToolMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch(`/api/agents/${id}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || 'Failed to create tool')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', id] })
      setToolForm({ name: '', description: '', webhookUrl: '', parameters: DEFAULT_PARAMS })
      setToolFormOpen(false)
      setToolError(null)
    },
    onError: (err: Error) => setToolError(err.message),
  })

  const deleteToolMutation = useMutation({
    mutationFn: (toolId: string) =>
      fetch(`/api/agents/${id}/tools/${toolId}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent', id] }),
  })

  const toggleToolMutation = useMutation({
    mutationFn: ({ toolId, isActive }: { toolId: string; isActive: boolean }) =>
      fetch(`/api/agents/${id}/tools/${toolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent', id] }),
  })

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="h-10 w-32 rounded-xl relative overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="absolute inset-0 shimmer" />
        </div>
        <div className="h-48 rounded-2xl relative overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="absolute inset-0 shimmer" />
        </div>
        <div className="h-64 rounded-2xl relative overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="absolute inset-0 shimmer" />
        </div>
      </div>
    )
  }

  if (!agent || agent.error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p style={{ color: 'var(--muted-foreground)' }}>Agent not found.</p>
        <Link href="/agents">
          <button className="mt-4 px-4 py-2 rounded-xl text-sm" style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}>
            Back to Agents
          </button>
        </Link>
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = agent as any
  const provider = a.provider || 'ELEVENLABS'
  const meta = PROVIDER_META[provider] || PROVIDER_META.ELEVENLABS
  const tools: AgentTool[] = a.tools || []

  const handleAddTool = () => {
    setToolError(null)
    let parsedParams: Record<string, unknown>
    try {
      parsedParams = JSON.parse(toolForm.parameters)
    } catch {
      setToolError('Parameters must be valid JSON')
      return
    }
    createToolMutation.mutate({
      name: toolForm.name,
      description: toolForm.description,
      webhookUrl: toolForm.webhookUrl,
      parameters: parsedParams,
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--muted-foreground)' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{a.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: meta.bg, color: meta.color }}
              >
                {meta.label}
              </span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Created {formatDate(a.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
          >
            <Radio className="w-3.5 h-3.5" />
            Test via campaign call
          </div>
          <button
            onClick={() => { if (confirm('Delete this agent?')) deleteMutation.mutate() }}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{ border: '1px solid oklch(0.59 0.245 15 / 30%)', background: 'oklch(0.59 0.245 15 / 8%)', color: 'oklch(0.59 0.245 15)' }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Calls', value: a._count?.calls ?? 0, icon: Phone, color: meta.color },
          { label: 'Campaigns', value: a._count?.campaigns ?? 0, icon: Sparkles, color: 'oklch(0.65 0.22 310)' },
          { label: 'Temperature', value: a.temperature, icon: Thermometer, color: 'oklch(0.72 0.18 68)' },
          { label: 'Max Duration', value: formatDuration(a.maxDuration), icon: Clock, color: 'oklch(0.55 0.215 163)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl p-4 flex flex-col items-center justify-center text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <Icon className="w-4 h-4 mb-2" style={{ color }} />
            <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Config Card */}
      <div className="rounded-2xl p-5 space-y-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div
          className="flex items-center gap-2.5"
          style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.875rem' }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: meta.bg }}>
            <Bot className="w-3.5 h-3.5" style={{ color: meta.color }} />
          </div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Configuration</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InfoRow icon={Globe} label="Language" value={a.language?.toUpperCase() || 'EN'} />
          <InfoRow icon={Mic2} label="Voice" value={a.voice || 'rachel'} />
        </div>

        {/* ElevenLabs Sync Status */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: a.elevenLabsAgentId ? 'oklch(0.55 0.215 163 / 8%)' : 'oklch(0.72 0.18 68 / 8%)',
            border: `1px solid ${a.elevenLabsAgentId ? 'oklch(0.55 0.215 163 / 20%)' : 'oklch(0.72 0.18 68 / 20%)'}`,
          }}
        >
          {a.elevenLabsAgentId ? (
            <Link2 className="w-4 h-4 flex-shrink-0" style={{ color: 'oklch(0.45 0.215 163)' }} />
          ) : (
            <Link2Off className="w-4 h-4 flex-shrink-0" style={{ color: 'oklch(0.62 0.18 68)' }} />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold" style={{ color: a.elevenLabsAgentId ? 'oklch(0.45 0.215 163)' : 'oklch(0.62 0.18 68)' }}>
              {a.elevenLabsAgentId ? 'Synced with ElevenLabs' : 'Not synced with ElevenLabs'}
            </p>
            {a.elevenLabsAgentId && (
              <p className="text-[10px] font-mono truncate" style={{ color: 'oklch(0.45 0.215 163 / 70%)' }}>
                {a.elevenLabsAgentId}
              </p>
            )}
            {syncMutation.isError && (
              <p className="text-[10px] mt-1" style={{ color: 'oklch(0.52 0.245 15)' }}>
                {syncMutation.error?.message || 'Sync failed'}
              </p>
            )}
          </div>
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
            style={
              a.elevenLabsAgentId
                ? {
                    background: 'oklch(0.45 0.215 163 / 10%)',
                    border: '1px solid oklch(0.45 0.215 163 / 25%)',
                    color: 'oklch(0.45 0.215 163)',
                  }
                : {
                    background: 'oklch(0.62 0.18 68 / 15%)',
                    border: '1px solid oklch(0.62 0.18 68 / 30%)',
                    color: 'oklch(0.52 0.18 68)',
                  }
            }
          >
            <RefreshCw className={`w-3 h-3 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Syncing…' : a.elevenLabsAgentId ? 'Re-sync' : 'Sync to ElevenLabs'}
          </button>
        </div>

        {a.description && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
              Description
            </p>
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>{a.description}</p>
          </div>
        )}

        {/* First Message */}
        {a.firstMessage && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <MessageSquare className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                First Message
              </p>
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: 'oklch(0.55 0.215 163 / 8%)', border: '1px solid oklch(0.55 0.215 163 / 20%)' }}
            >
              <p className="text-sm italic" style={{ color: 'var(--foreground)' }}>&ldquo;{a.firstMessage}&rdquo;</p>
            </div>
          </div>
        )}

        {/* System Prompt */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Mic2 className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
              System Prompt
            </p>
          </div>
          <div
            className="rounded-xl p-3 max-h-48 overflow-y-auto"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <p className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--muted-foreground)' }}>
              {a.systemPrompt}
            </p>
          </div>
        </div>
      </div>

      {/* Knowledge Base Toggle */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'oklch(0.6 0.19 220 / 12%)', border: '1px solid oklch(0.6 0.19 220 / 20%)' }}
            >
              <BookOpen className="w-3.5 h-3.5" style={{ color: 'oklch(0.6 0.19 220)' }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Knowledge Base</h3>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Include your KB documents in this agent&apos;s ElevenLabs config
              </p>
            </div>
          </div>
          <button
            onClick={() => updateMutation.mutate({ useKnowledgeBase: !a.useKnowledgeBase })}
            disabled={updateMutation.isPending}
            className="relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none"
            style={{
              background: a.useKnowledgeBase ? 'oklch(0.55 0.215 163)' : 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-200"
              style={{
                background: 'white',
                transform: a.useKnowledgeBase ? 'translateX(20px)' : 'translateX(0)',
                boxShadow: '0 1px 3px oklch(0 0 0 / 20%)',
              }}
            />
          </button>
        </div>
        {a.useKnowledgeBase && (
          <p className="text-xs mt-3" style={{ color: 'oklch(0.45 0.215 163)' }}>
            Enabled — sync this agent to push KB doc IDs to ElevenLabs.{' '}
            <Link href="/knowledge-base" className="underline hover:opacity-80">
              Manage documents →
            </Link>
          </p>
        )}
      </div>

      {/* Agent Tools */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Custom Tools</h3>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
            >
              {tools.length}
            </span>
          </div>
          <button
            onClick={() => { setToolFormOpen((v) => !v); setToolError(null) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          >
            {toolFormOpen ? <ChevronUp className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {toolFormOpen ? 'Close' : 'Add Tool'}
          </button>
        </div>

        {/* Add tool form */}
        {toolFormOpen && (
          <div
            className="px-5 py-4 space-y-3"
            style={{ background: 'oklch(0.49 0.263 281 / 3%)', borderBottom: '1px solid var(--border)' }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Name (snake_case)
                </label>
                <input
                  type="text"
                  placeholder="get_pricing"
                  value={toolForm.name}
                  onChange={(e) => setToolForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Webhook URL (https://)
                </label>
                <input
                  type="url"
                  placeholder="https://yoursite.com/webhook"
                  value={toolForm.webhookUrl}
                  onChange={(e) => setToolForm((p) => ({ ...p, webhookUrl: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                Description
              </label>
              <input
                type="text"
                placeholder="What does this tool do?"
                value={toolForm.description}
                onChange={(e) => setToolForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                Parameters (JSON Schema)
              </label>
              <textarea
                rows={4}
                value={toolForm.parameters}
                onChange={(e) => setToolForm((p) => ({ ...p, parameters: e.target.value }))}
                className="w-full rounded-xl px-3 py-2 text-xs font-mono outline-none resize-none"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>
            {toolError && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'oklch(0.52 0.245 15)' }}>
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {toolError}
              </div>
            )}
            <button
              onClick={handleAddTool}
              disabled={createToolMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
                boxShadow: '0 4px 12px oklch(0.49 0.263 281 / 25%)',
              }}
            >
              {createToolMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {createToolMutation.isPending ? 'Adding…' : 'Add Tool'}
            </button>
          </div>
        )}

        {/* Tool list */}
        <div style={{ background: 'var(--card)' }}>
          {tools.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Wrench className="w-7 h-7 mx-auto mb-2 opacity-20" style={{ color: 'var(--foreground)' }} />
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No custom tools yet.</p>
            </div>
          ) : (
            tools.map((tool, idx) => (
              <div
                key={tool.id}
                className="flex items-start gap-3 px-5 py-3.5"
                style={{ borderBottom: idx < tools.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                >
                  <Wrench className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium font-mono" style={{ color: 'var(--foreground)' }}>
                      {tool.name}
                    </p>
                    {!tool.isActive && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-md"
                        style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                      >
                        disabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {tool.description}
                  </p>
                  <p className="text-[10px] mt-0.5 font-mono truncate" style={{ color: 'var(--muted-foreground)' }}>
                    {tool.webhookUrl}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleToolMutation.mutate({ toolId: tool.id, isActive: !tool.isActive })}
                    className="text-[10px] px-2 py-1 rounded-lg font-medium transition-all duration-150 hover:scale-105"
                    style={
                      tool.isActive
                        ? { background: 'oklch(0.55 0.215 163 / 10%)', color: 'oklch(0.45 0.215 163)', border: '1px solid oklch(0.55 0.215 163 / 20%)' }
                        : { background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }
                    }
                  >
                    {tool.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => deleteToolMutation.mutate(tool.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105"
                    style={{
                      background: 'oklch(0.59 0.245 15 / 8%)',
                      border: '1px solid oklch(0.59 0.245 15 / 20%)',
                      color: 'oklch(0.59 0.245 15)',
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Calls */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div
          className="px-5 py-3.5 flex items-center justify-between"
          style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Recent Calls</h3>
          </div>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {(a.calls || []).length} shown
          </span>
        </div>

        {!a.calls?.length ? (
          <div
            className="px-5 py-10 text-center"
            style={{ background: 'var(--card)' }}
          >
            <Phone className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: 'var(--foreground)' }} />
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No calls yet</p>
          </div>
        ) : (
          <div style={{ background: 'var(--card)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {['Contact', 'Status', 'Duration', 'Date'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(a.calls || []).map((call: Record<string, unknown>) => {
                  const sc = CALL_STATUS_CONFIG[call.status as string] || CALL_STATUS_CONFIG.CANCELLED
                  return (
                    <tr key={call.id as string} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-5 py-3">
                        <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                          {(call.contact as Record<string, unknown>)?.name as string || call.phoneNumber as string}
                        </p>
                        {!!(call.contact as Record<string, unknown>)?.name && (
                          <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                            {call.phoneNumber as string}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="text-[10px] font-bold px-2 py-1 rounded-lg"
                          style={{ background: sc.bg, color: sc.color }}
                        >
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {formatDuration(call.duration as number)}
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {formatDate(call.startedAt as string)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
          {label}
        </p>
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{value}</p>
      </div>
    </div>
  )
}
